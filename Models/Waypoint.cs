using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Travelino.Models;

public class Waypoint
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

    [Required]
    public double Latitude { get; set; }

    [Required]
    public double Longitude { get; set; }

    public WaypointType Type { get; set; } = WaypointType.Other;

    [MaxLength(500)]
    public string? Address { get; set; }

    public int OrderIndex { get; set; }

    public DateTime? PlannedArrival { get; set; }
    public DateTime? PlannedDeparture { get; set; }

    public DateTime? ActualArrival { get; set; }
    public DateTime? ActualDeparture { get; set; }

    [MaxLength(500)]
    public string? Notes { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation property
    [ForeignKey("TripId")]
    public virtual Trip Trip { get; set; } = null!;
}

public enum WaypointType
{
    Restaurant,      // Étterem
    Accommodation,   // Szállás
    Attraction,      // Látnivaló
    GasStation,      // Benzinkút
    Parking,         // Parkoló
    Other           // Egyéb
}
