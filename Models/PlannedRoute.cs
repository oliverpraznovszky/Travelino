using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Travelino.Models;

public class PlannedRoute
{
    [Key]
    public int Id { get; set; }

    [Required]
    public int TripId { get; set; }

    [Required]
    [MaxLength(200)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(1000)]
    public string? Description { get; set; }

    // GeoJSON format route data
    [Required]
    public string RouteData { get; set; } = string.Empty;

    public double EstimatedDistance { get; set; } // km-ben

    public int EstimatedDuration { get; set; } // percben

    public bool IsPrimary { get; set; } = true; // Elsődleges vagy alternatív útvonal

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation property
    [ForeignKey("TripId")]
    public virtual Trip Trip { get; set; } = null!;
}
