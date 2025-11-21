using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using Travelino.Data;
using Travelino.DTOs;
using Travelino.Models;

namespace Travelino.Controllers;

[ApiController]
[Route("api/trips/{tripId}/[controller]")]
[Authorize]
public class WaypointsController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public WaypointsController(ApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<WaypointDto>>> GetWaypoints(int tripId)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

        var trip = await _context.Trips
            .Include(t => t.Participants)
            .Include(t => t.Waypoints)
            .FirstOrDefaultAsync(t => t.Id == tripId);

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

        var waypoints = trip.Waypoints.OrderBy(w => w.OrderIndex).Select(MapToDto);

        return Ok(waypoints);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<WaypointDto>> GetWaypoint(int tripId, int id)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

        var waypoint = await _context.Waypoints
            .Include(w => w.Trip)
            .ThenInclude(t => t.Participants)
            .FirstOrDefaultAsync(w => w.Id == id && w.TripId == tripId);

        if (waypoint == null)
        {
            return NotFound();
        }

        // Check access
        if (waypoint.Trip.CreatedByUserId != userId &&
            !waypoint.Trip.Participants.Any(p => p.UserId == userId) &&
            !waypoint.Trip.IsPublic)
        {
            return Forbid();
        }

        return Ok(MapToDto(waypoint));
    }

    [HttpPost]
    public async Task<ActionResult<WaypointDto>> CreateWaypoint(int tripId, [FromBody] CreateWaypointDto dto)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

        var trip = await _context.Trips
            .Include(t => t.Participants)
            .FirstOrDefaultAsync(t => t.Id == tripId);

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

        var waypoint = new Waypoint
        {
            TripId = tripId,
            Name = dto.Name,
            Description = dto.Description,
            Latitude = dto.Latitude,
            Longitude = dto.Longitude,
            Type = dto.Type,
            Address = dto.Address,
            OrderIndex = dto.OrderIndex,
            PlannedArrival = dto.PlannedArrival,
            PlannedDeparture = dto.PlannedDeparture,
            Notes = dto.Notes,
            CreatedAt = DateTime.UtcNow
        };

        _context.Waypoints.Add(waypoint);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetWaypoint), new { tripId, id = waypoint.Id }, MapToDto(waypoint));
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateWaypoint(int tripId, int id, [FromBody] UpdateWaypointDto dto)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

        var waypoint = await _context.Waypoints
            .Include(w => w.Trip)
            .ThenInclude(t => t.Participants)
            .FirstOrDefaultAsync(w => w.Id == id && w.TripId == tripId);

        if (waypoint == null)
        {
            return NotFound();
        }

        // Check if user can edit
        var participant = waypoint.Trip.Participants.FirstOrDefault(p => p.UserId == userId);
        if (waypoint.Trip.CreatedByUserId != userId && (participant == null || !participant.CanEdit))
        {
            return Forbid();
        }

        if (dto.Name != null) waypoint.Name = dto.Name;
        if (dto.Description != null) waypoint.Description = dto.Description;
        if (dto.Latitude.HasValue) waypoint.Latitude = dto.Latitude.Value;
        if (dto.Longitude.HasValue) waypoint.Longitude = dto.Longitude.Value;
        if (dto.Type.HasValue) waypoint.Type = dto.Type.Value;
        if (dto.Address != null) waypoint.Address = dto.Address;
        if (dto.OrderIndex.HasValue) waypoint.OrderIndex = dto.OrderIndex.Value;
        if (dto.PlannedArrival.HasValue) waypoint.PlannedArrival = dto.PlannedArrival;
        if (dto.PlannedDeparture.HasValue) waypoint.PlannedDeparture = dto.PlannedDeparture;
        if (dto.ActualArrival.HasValue) waypoint.ActualArrival = dto.ActualArrival;
        if (dto.ActualDeparture.HasValue) waypoint.ActualDeparture = dto.ActualDeparture;
        if (dto.Notes != null) waypoint.Notes = dto.Notes;

        await _context.SaveChangesAsync();

        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteWaypoint(int tripId, int id)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

        var waypoint = await _context.Waypoints
            .Include(w => w.Trip)
            .ThenInclude(t => t.Participants)
            .FirstOrDefaultAsync(w => w.Id == id && w.TripId == tripId);

        if (waypoint == null)
        {
            return NotFound();
        }

        // Check if user can edit
        var participant = waypoint.Trip.Participants.FirstOrDefault(p => p.UserId == userId);
        if (waypoint.Trip.CreatedByUserId != userId && (participant == null || !participant.CanEdit))
        {
            return Forbid();
        }

        _context.Waypoints.Remove(waypoint);
        await _context.SaveChangesAsync();

        return NoContent();
    }

    private WaypointDto MapToDto(Waypoint waypoint)
    {
        return new WaypointDto
        {
            Id = waypoint.Id,
            Name = waypoint.Name,
            Description = waypoint.Description,
            Latitude = waypoint.Latitude,
            Longitude = waypoint.Longitude,
            Type = waypoint.Type,
            Address = waypoint.Address,
            OrderIndex = waypoint.OrderIndex,
            PlannedArrival = waypoint.PlannedArrival,
            PlannedDeparture = waypoint.PlannedDeparture,
            ActualArrival = waypoint.ActualArrival,
            ActualDeparture = waypoint.ActualDeparture,
            Notes = waypoint.Notes,
            CreatedAt = waypoint.CreatedAt
        };
    }
}
