using System.ComponentModel.DataAnnotations;
using Travelino.Models;

namespace Travelino.DTOs;

public class CreateInvitationDto
{
    [Required]
    [EmailAddress]
    public string InvitedEmail { get; set; } = string.Empty;

    public ParticipantRole Role { get; set; } = ParticipantRole.Member;
    public bool CanEdit { get; set; } = false;

    [MaxLength(500)]
    public string? Message { get; set; }
}

public class InvitationDto
{
    public int Id { get; set; }
    public int TripId { get; set; }
    public string TripTitle { get; set; } = string.Empty;
    public string InvitedEmail { get; set; } = string.Empty;
    public string InvitedByName { get; set; } = string.Empty;
    public InvitationStatus Status { get; set; }
    public ParticipantRole Role { get; set; }
    public bool CanEdit { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? RespondedAt { get; set; }
    public string? Message { get; set; }
}

public class RespondToInvitationDto
{
    [Required]
    public InvitationStatus Status { get; set; } // Accepted or Declined
}
