using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Travelino.Models;

public class TripInvitation
{
    [Key]
    public int Id { get; set; }

    [Required]
    public int TripId { get; set; }

    [Required]
    [EmailAddress]
    public string InvitedEmail { get; set; } = string.Empty;

    [Required]
    public string InvitedByUserId { get; set; } = string.Empty;

    public string? InvitedUserId { get; set; } // Filled when user accepts

    public InvitationStatus Status { get; set; } = InvitationStatus.Pending;

    public ParticipantRole Role { get; set; } = ParticipantRole.Member;
    public bool CanEdit { get; set; } = false;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? RespondedAt { get; set; }

    [MaxLength(500)]
    public string? Message { get; set; }

    // Navigation properties
    [ForeignKey("TripId")]
    public virtual Trip Trip { get; set; } = null!;

    [ForeignKey("InvitedByUserId")]
    public virtual ApplicationUser InvitedBy { get; set; } = null!;

    [ForeignKey("InvitedUserId")]
    public virtual ApplicationUser? InvitedUser { get; set; }
}

public enum InvitationStatus
{
    Pending,
    Accepted,
    Declined,
    Cancelled
}
