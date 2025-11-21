using System.ComponentModel.DataAnnotations;
using Travelino.Models;

namespace Travelino.DTOs;

public class CreateWaypointDto
{
    [Required]
    [MaxLength(200)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(1000)]
    public string? Description { get; set; }

    [Required]
    [Range(-90, 90)]
    public double Latitude { get; set; }

    [Required]
    [Range(-180, 180)]
    public double Longitude { get; set; }

    public WaypointType Type { get; set; } = WaypointType.Other;

    [MaxLength(500)]
    public string? Address { get; set; }

    public int OrderIndex { get; set; }

    public DateTime? PlannedArrival { get; set; }
    public DateTime? PlannedDeparture { get; set; }

    [MaxLength(500)]
    public string? Notes { get; set; }
}

public class UpdateWaypointDto
{
    [MaxLength(200)]
    public string? Name { get; set; }

    [MaxLength(1000)]
    public string? Description { get; set; }

    [Range(-90, 90)]
    public double? Latitude { get; set; }

    [Range(-180, 180)]
    public double? Longitude { get; set; }

    public WaypointType? Type { get; set; }

    [MaxLength(500)]
    public string? Address { get; set; }

    public int? OrderIndex { get; set; }

    public DateTime? PlannedArrival { get; set; }
    public DateTime? PlannedDeparture { get; set; }

    public DateTime? ActualArrival { get; set; }
    public DateTime? ActualDeparture { get; set; }

    [MaxLength(500)]
    public string? Notes { get; set; }
}

public class WaypointDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public double Latitude { get; set; }
    public double Longitude { get; set; }
    public WaypointType Type { get; set; }
    public string? Address { get; set; }
    public int OrderIndex { get; set; }
    public DateTime? PlannedArrival { get; set; }
    public DateTime? PlannedDeparture { get; set; }
    public DateTime? ActualArrival { get; set; }
    public DateTime? ActualDeparture { get; set; }
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; }
}
