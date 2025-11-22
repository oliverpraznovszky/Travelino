using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using Travelino.Data;
using Travelino.DTOs;
using Travelino.Models;
using Travelino.Services;

namespace Travelino.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class TripsController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly PdfExportService _pdfExportService;

    public TripsController(
        ApplicationDbContext context,
        UserManager<ApplicationUser> userManager,
        PdfExportService pdfExportService)
    {
        _context = context;
        _userManager = userManager;
        _pdfExportService = pdfExportService;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<TripDto>>> GetTrips()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

        var trips = await _context.Trips
            .Include(t => t.CreatedBy)
            .Include(t => t.Participants).ThenInclude(p => p.User)
            .Include(t => t.Waypoints)
            .Where(t => t.CreatedByUserId == userId ||
                        t.Participants.Any(p => p.UserId == userId) ||
                        t.IsPublic)
            .OrderByDescending(t => t.CreatedAt)
            .ToListAsync();

        return Ok(trips.Select(MapToDto));
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<TripDto>> GetTrip(int id)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

        var trip = await _context.Trips
            .Include(t => t.CreatedBy)
            .Include(t => t.Participants).ThenInclude(p => p.User)
            .Include(t => t.Waypoints)
            .FirstOrDefaultAsync(t => t.Id == id);

        if (trip == null)
        {
            return NotFound();
        }

        // Check access
        if (trip.CreatedByUserId != userId &&
            !trip.Participants.Any(p => p.UserId == userId) &&
            !trip.IsPublic)
        {
            return Forbid();
        }

        return Ok(MapToDto(trip));
    }

    [HttpPost]
    public async Task<ActionResult<TripDto>> CreateTrip([FromBody] CreateTripDto dto)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized();
        }

        var trip = new Trip
        {
            Title = dto.Title,
            Description = dto.Description,
            StartDate = dto.StartDate,
            EndDate = dto.EndDate,
            IsPublic = dto.IsPublic,
            CreatedByUserId = userId,
            CreatedAt = DateTime.UtcNow,
            Status = TripStatus.Planning
        };

        _context.Trips.Add(trip);

        // Add creator as owner participant
        var participant = new TripParticipant
        {
            Trip = trip,
            UserId = userId,
            Role = ParticipantRole.Owner,
            CanEdit = true,
            JoinedAt = DateTime.UtcNow
        };

        _context.TripParticipants.Add(participant);

        await _context.SaveChangesAsync();

        // Reload with includes
        trip = await _context.Trips
            .Include(t => t.CreatedBy)
            .Include(t => t.Participants).ThenInclude(p => p.User)
            .Include(t => t.Waypoints)
            .FirstOrDefaultAsync(t => t.Id == trip.Id);

        return CreatedAtAction(nameof(GetTrip), new { id = trip!.Id }, MapToDto(trip));
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateTrip(int id, [FromBody] UpdateTripDto dto)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

        var trip = await _context.Trips
            .Include(t => t.Participants)
            .FirstOrDefaultAsync(t => t.Id == id);

        if (trip == null)
        {
            return NotFound();
        }

        // Check if user can edit
        var participant = trip.Participants.FirstOrDefault(p => p.UserId == userId);
        if (trip.CreatedByUserId != userId && (participant == null || !participant.CanEdit))
        {
            return Forbid();
        }

        if (dto.Title != null) trip.Title = dto.Title;
        if (dto.Description != null) trip.Description = dto.Description;
        if (dto.StartDate.HasValue) trip.StartDate = dto.StartDate.Value;
        if (dto.EndDate.HasValue) trip.EndDate = dto.EndDate.Value;
        if (dto.Status.HasValue) trip.Status = dto.Status.Value;
        if (dto.IsPublic.HasValue) trip.IsPublic = dto.IsPublic.Value;

        trip.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteTrip(int id)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

        var trip = await _context.Trips.FirstOrDefaultAsync(t => t.Id == id);

        if (trip == null)
        {
            return NotFound();
        }

        // Only creator can delete
        if (trip.CreatedByUserId != userId)
        {
            return Forbid();
        }

        _context.Trips.Remove(trip);
        await _context.SaveChangesAsync();

        return NoContent();
    }

    [HttpPost("{id}/participants")]
    public async Task<ActionResult<TripParticipantDto>> AddParticipant(int id, [FromBody] AddParticipantDto dto)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

        var trip = await _context.Trips
            .Include(t => t.Participants)
            .FirstOrDefaultAsync(t => t.Id == id);

        if (trip == null)
        {
            return NotFound();
        }

        // Only creator or organizers can add participants
        var currentParticipant = trip.Participants.FirstOrDefault(p => p.UserId == userId);
        if (trip.CreatedByUserId != userId &&
            (currentParticipant == null || currentParticipant.Role == ParticipantRole.Member))
        {
            return Forbid();
        }

        var userToAdd = await _userManager.FindByEmailAsync(dto.UserEmail);
        if (userToAdd == null)
        {
            return BadRequest(new { message = "Felhasználó nem található ezzel az email címmel." });
        }

        // Check if already participant
        if (trip.Participants.Any(p => p.UserId == userToAdd.Id))
        {
            return BadRequest(new { message = "A felhasználó már résztvevője az útnak." });
        }

        var participant = new TripParticipant
        {
            TripId = id,
            UserId = userToAdd.Id,
            Role = dto.Role,
            CanEdit = dto.CanEdit,
            JoinedAt = DateTime.UtcNow
        };

        _context.TripParticipants.Add(participant);
        await _context.SaveChangesAsync();

        return Ok(new TripParticipantDto
        {
            Id = participant.Id,
            UserEmail = userToAdd.Email!,
            UserName = $"{userToAdd.FirstName} {userToAdd.LastName}",
            Role = participant.Role,
            CanEdit = participant.CanEdit,
            JoinedAt = participant.JoinedAt
        });
    }

    [HttpGet("{id}/export/pdf")]
    public async Task<IActionResult> ExportToPdf(int id)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

        var trip = await _context.Trips
            .Include(t => t.CreatedBy)
            .Include(t => t.Participants).ThenInclude(p => p.User)
            .Include(t => t.Waypoints)
            .FirstOrDefaultAsync(t => t.Id == id);

        if (trip == null)
        {
            return NotFound();
        }

        // Check access
        if (trip.CreatedByUserId != userId &&
            !trip.Participants.Any(p => p.UserId == userId) &&
            !trip.IsPublic)
        {
            return Forbid();
        }

        var pdfBytes = _pdfExportService.GenerateTripPdf(trip);

        return File(pdfBytes, "application/pdf", $"Trip_{trip.Title}_{DateTime.Now:yyyyMMdd}.pdf");
    }

    [HttpPost("{id}/compare")]
    public async Task<ActionResult> CompareTrip(int id)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

        var trip = await _context.Trips
            .Include(t => t.Participants)
            .Include(t => t.Waypoints)
            .FirstOrDefaultAsync(t => t.Id == id);

        if (trip == null)
        {
            return NotFound();
        }

        // Check access
        if (trip.CreatedByUserId != userId && !trip.Participants.Any(p => p.UserId == userId))
        {
            return Forbid();
        }

        // Generate comparison
        var comparison = new System.Text.StringBuilder();
        comparison.AppendLine("Összehasonlítás - Tervezett vs. Tényleges\n");

        // Compare waypoints
        var waypointsWithActual = trip.Waypoints.Where(w => w.ActualArrival.HasValue || w.ActualDeparture.HasValue).ToList();

        if (waypointsWithActual.Any())
        {
            comparison.AppendLine("Állomások időpontjai:");
            foreach (var waypoint in waypointsWithActual)
            {
                comparison.AppendLine($"\n{waypoint.Name}:");

                if (waypoint.PlannedArrival.HasValue && waypoint.ActualArrival.HasValue)
                {
                    var diff = waypoint.ActualArrival.Value - waypoint.PlannedArrival.Value;
                    comparison.AppendLine($"  Érkezés: Tervezett: {waypoint.PlannedArrival:yyyy.MM.dd HH:mm}, Tényleges: {waypoint.ActualArrival:yyyy.MM.dd HH:mm}, Eltérés: {diff.TotalHours:F1} óra");
                }

                if (waypoint.PlannedDeparture.HasValue && waypoint.ActualDeparture.HasValue)
                {
                    var diff = waypoint.ActualDeparture.Value - waypoint.PlannedDeparture.Value;
                    comparison.AppendLine($"  Indulás: Tervezett: {waypoint.PlannedDeparture:yyyy.MM.dd HH:mm}, Tényleges: {waypoint.ActualDeparture:yyyy.MM.dd HH:mm}, Eltérés: {diff.TotalHours:F1} óra");
                }
            }
        }

        trip.ComparisonNotes = comparison.ToString();
        await _context.SaveChangesAsync();

        return Ok(new { comparisonNotes = trip.ComparisonNotes });
    }

    private TripDto MapToDto(Trip trip)
    {
        return new TripDto
        {
            Id = trip.Id,
            Title = trip.Title,
            Description = trip.Description,
            StartDate = trip.StartDate,
            EndDate = trip.EndDate,
            CreatedAt = trip.CreatedAt,
            UpdatedAt = trip.UpdatedAt,
            Status = trip.Status,
            IsPublic = trip.IsPublic,
            CreatedByUserName = $"{trip.CreatedBy.FirstName} {trip.CreatedBy.LastName}",
            ComparisonNotes = trip.ComparisonNotes,
            Participants = trip.Participants.Select(p => new TripParticipantDto
            {
                Id = p.Id,
                UserEmail = p.User.Email!,
                UserName = $"{p.User.FirstName} {p.User.LastName}",
                Role = p.Role,
                CanEdit = p.CanEdit,
                JoinedAt = p.JoinedAt
            }).ToList(),
            Waypoints = trip.Waypoints.OrderBy(w => w.OrderIndex).Select(w => new WaypointDto
            {
                Id = w.Id,
                Name = w.Name,
                Description = w.Description,
                Latitude = w.Latitude,
                Longitude = w.Longitude,
                Type = w.Type,
                Address = w.Address,
                OrderIndex = w.OrderIndex,
                PlannedArrival = w.PlannedArrival,
                PlannedDeparture = w.PlannedDeparture,
                ActualArrival = w.ActualArrival,
                ActualDeparture = w.ActualDeparture,
                Notes = w.Notes,
                CreatedAt = w.CreatedAt
            }).ToList()
        };
    }
}
