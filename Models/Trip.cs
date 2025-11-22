using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Travelino.Models;

public class Trip
{
    [Key]
    public int Id { get; set; }

    [Required]
    [MaxLength(200)]
    public string Title { get; set; } = string.Empty;

    [MaxLength(2000)]
    public string? Description { get; set; }

    [Required]
    public DateTime StartDate { get; set; }

    [Required]
    public DateTime EndDate { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    [Required]
    public string CreatedByUserId { get; set; } = string.Empty;

    public TripStatus Status { get; set; } = TripStatus.Planning;

    public bool IsPublic { get; set; } = false;

    // Calculated field for planned vs actual comparison
    public string? ComparisonNotes { get; set; }

    // Navigation properties
    [ForeignKey("CreatedByUserId")]
    public virtual ApplicationUser CreatedBy { get; set; } = null!;

    public virtual ICollection<TripParticipant> Participants { get; set; } = new List<TripParticipant>();
    public virtual ICollection<Waypoint> Waypoints { get; set; } = new List<Waypoint>();
    public virtual ICollection<PlannedRoute> PlannedRoutes { get; set; } = new List<PlannedRoute>();
    public virtual ICollection<ActualRoute> ActualRoutes { get; set; } = new List<ActualRoute>();
    public virtual ICollection<TripNote> Notes { get; set; } = new List<TripNote>();
}

public enum TripStatus
{
    Planning,      // Tervezés - Alapértelmezett
    Organization,  // Szervezés
    Completed      // Kész
}
