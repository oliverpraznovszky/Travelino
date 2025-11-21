using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using Travelino.Data;
using Travelino.DTOs;
using Travelino.Models;

namespace Travelino.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class InvitationsController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly UserManager<ApplicationUser> _userManager;

    public InvitationsController(
        ApplicationDbContext context,
        UserManager<ApplicationUser> userManager)
    {
        _context = context;
        _userManager = userManager;
    }

    // Get all invitations for current user
    [HttpGet("my")]
    public async Task<ActionResult<IEnumerable<InvitationDto>>> GetMyInvitations()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var userEmail = User.FindFirstValue(ClaimTypes.Email);

        if (string.IsNullOrEmpty(userEmail))
        {
            return BadRequest(new { message = "Email cím nem található." });
        }

        var invitations = await _context.TripInvitations
            .Include(i => i.Trip)
            .Include(i => i.InvitedBy)
            .Where(i => i.InvitedEmail == userEmail && i.Status == InvitationStatus.Pending)
            .OrderByDescending(i => i.CreatedAt)
            .ToListAsync();

        return Ok(invitations.Select(MapToDto));
    }

    // Get invitations for a specific trip
    [HttpGet("trip/{tripId}")]
    public async Task<ActionResult<IEnumerable<InvitationDto>>> GetTripInvitations(int tripId)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

        var trip = await _context.Trips
            .Include(t => t.Participants)
            .FirstOrDefaultAsync(t => t.Id == tripId);

        if (trip == null)
        {
            return NotFound();
        }

        // Only trip creator or organizers can see invitations
        var participant = trip.Participants.FirstOrDefault(p => p.UserId == userId);
        if (trip.CreatedByUserId != userId &&
            (participant == null || participant.Role == ParticipantRole.Member))
        {
            return Forbid();
        }

        var invitations = await _context.TripInvitations
            .Include(i => i.Trip)
            .Include(i => i.InvitedBy)
            .Where(i => i.TripId == tripId)
            .OrderByDescending(i => i.CreatedAt)
            .ToListAsync();

        return Ok(invitations.Select(MapToDto));
    }

    // Create invitation
    [HttpPost("trip/{tripId}")]
    public async Task<ActionResult<InvitationDto>> CreateInvitation(int tripId, [FromBody] CreateInvitationDto dto)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

        var trip = await _context.Trips
            .Include(t => t.Participants)
            .FirstOrDefaultAsync(t => t.Id == tripId);

        if (trip == null)
        {
            return NotFound();
        }

        // Only trip creator or organizers can invite
        var participant = trip.Participants.FirstOrDefault(p => p.UserId == userId);
        if (trip.CreatedByUserId != userId &&
            (participant == null || participant.Role == ParticipantRole.Member))
        {
            return Forbid();
        }

        // Check if user is already a participant
        var isAlreadyParticipant = trip.Participants.Any(p => p.User.Email == dto.InvitedEmail);
        if (isAlreadyParticipant)
        {
            return BadRequest(new { message = "Ez a felhasználó már résztvevője az útnak." });
        }

        // Check if there's already a pending invitation
        var existingInvitation = await _context.TripInvitations
            .FirstOrDefaultAsync(i => i.TripId == tripId &&
                                     i.InvitedEmail == dto.InvitedEmail &&
                                     i.Status == InvitationStatus.Pending);

        if (existingInvitation != null)
        {
            return BadRequest(new { message = "Már van függőben lévő meghívó ehhez az email címhez." });
        }

        var invitation = new TripInvitation
        {
            TripId = tripId,
            InvitedEmail = dto.InvitedEmail,
            InvitedByUserId = userId!,
            Role = dto.Role,
            CanEdit = dto.CanEdit,
            Message = dto.Message,
            Status = InvitationStatus.Pending,
            CreatedAt = DateTime.UtcNow
        };

        _context.TripInvitations.Add(invitation);
        await _context.SaveChangesAsync();

        // Reload with includes
        invitation = await _context.TripInvitations
            .Include(i => i.Trip)
            .Include(i => i.InvitedBy)
            .FirstOrDefaultAsync(i => i.Id == invitation.Id);

        return Ok(MapToDto(invitation!));
    }

    // Respond to invitation (Accept/Decline)
    [HttpPost("{invitationId}/respond")]
    public async Task<ActionResult> RespondToInvitation(int invitationId, [FromBody] RespondToInvitationDto dto)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var userEmail = User.FindFirstValue(ClaimTypes.Email);

        var invitation = await _context.TripInvitations
            .Include(i => i.Trip)
            .ThenInclude(t => t.Participants)
            .FirstOrDefaultAsync(i => i.Id == invitationId);

        if (invitation == null)
        {
            return NotFound();
        }

        // Check if invitation is for current user
        if (invitation.InvitedEmail != userEmail)
        {
            return Forbid();
        }

        // Check if invitation is still pending
        if (invitation.Status != InvitationStatus.Pending)
        {
            return BadRequest(new { message = "Ez a meghívó már nem függőben van." });
        }

        // Validate response
        if (dto.Status != InvitationStatus.Accepted && dto.Status != InvitationStatus.Declined)
        {
            return BadRequest(new { message = "Érvénytelen válasz. Csak elfogadás vagy elutasítás lehetséges." });
        }

        invitation.Status = dto.Status;
        invitation.RespondedAt = DateTime.UtcNow;
        invitation.InvitedUserId = userId;

        // If accepted, add user as participant
        if (dto.Status == InvitationStatus.Accepted)
        {
            // Check if user is already a participant
            var existingParticipant = invitation.Trip.Participants
                .FirstOrDefault(p => p.UserId == userId);

            if (existingParticipant == null)
            {
                var participant = new TripParticipant
                {
                    TripId = invitation.TripId,
                    UserId = userId!,
                    Role = invitation.Role,
                    CanEdit = invitation.CanEdit,
                    JoinedAt = DateTime.UtcNow
                };

                _context.TripParticipants.Add(participant);
            }
        }

        await _context.SaveChangesAsync();

        return Ok(new
        {
            message = dto.Status == InvitationStatus.Accepted
                ? "Meghívó elfogadva! Mostantól résztvevője vagy az útnak."
                : "Meghívó elutasítva."
        });
    }

    // Cancel invitation
    [HttpDelete("{invitationId}")]
    public async Task<ActionResult> CancelInvitation(int invitationId)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

        var invitation = await _context.TripInvitations
            .Include(i => i.Trip)
            .ThenInclude(t => t.Participants)
            .FirstOrDefaultAsync(i => i.Id == invitationId);

        if (invitation == null)
        {
            return NotFound();
        }

        // Only the person who sent the invitation or trip creator can cancel
        var trip = invitation.Trip;
        if (invitation.InvitedByUserId != userId && trip.CreatedByUserId != userId)
        {
            return Forbid();
        }

        if (invitation.Status != InvitationStatus.Pending)
        {
            return BadRequest(new { message = "Csak függőben lévő meghívót lehet törölni." });
        }

        invitation.Status = InvitationStatus.Cancelled;
        await _context.SaveChangesAsync();

        return Ok(new { message = "Meghívó törölve." });
    }

    private InvitationDto MapToDto(TripInvitation invitation)
    {
        return new InvitationDto
        {
            Id = invitation.Id,
            TripId = invitation.TripId,
            TripTitle = invitation.Trip.Title,
            InvitedEmail = invitation.InvitedEmail,
            InvitedByName = $"{invitation.InvitedBy.FirstName} {invitation.InvitedBy.LastName}",
            Status = invitation.Status,
            Role = invitation.Role,
            CanEdit = invitation.CanEdit,
            CreatedAt = invitation.CreatedAt,
            RespondedAt = invitation.RespondedAt,
            Message = invitation.Message
        };
    }
}
