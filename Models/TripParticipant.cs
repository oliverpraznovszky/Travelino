using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Travelino.Models;

public class TripParticipant
{
    [Key]
    public int Id { get; set; }

    [Required]
    public int TripId { get; set; }

    [Required]
    public string UserId { get; set; } = string.Empty;

    public ParticipantRole Role { get; set; } = ParticipantRole.Member;

    public DateTime JoinedAt { get; set; } = DateTime.UtcNow;

    public bool CanEdit { get; set; } = false;

    // Navigation properties
    [ForeignKey("TripId")]
    public virtual Trip Trip { get; set; } = null!;

    [ForeignKey("UserId")]
    public virtual ApplicationUser User { get; set; } = null!;
}

public enum ParticipantRole
{
    Owner,      // Tulajdonos
    Organizer,  // Szervező
    Member      // Résztvevő
}
