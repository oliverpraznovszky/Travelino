using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Travelino.Models;

public class ActualRoute
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

    // GeoJSON format route data (tényleges megtett útvonal)
    [Required]
    public string RouteData { get; set; } = string.Empty;

    public double ActualDistance { get; set; } // km-ben

    public int ActualDuration { get; set; } // percben

    public DateTime StartTime { get; set; }
    public DateTime EndTime { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation property
    [ForeignKey("TripId")]
    public virtual Trip Trip { get; set; } = null!;
}
