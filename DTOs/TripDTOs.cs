using System.ComponentModel.DataAnnotations;
using Travelino.Models;

namespace Travelino.DTOs;

public class CreateTripDto
{
    [Required]
    [MaxLength(200)]
    public string Title { get; set; } = string.Empty;

    [MaxLength(2000)]
    public string? Description { get; set; }

    [Required]
    public DateTime StartDate { get; set; }

    [Required]
    public DateTime EndDate { get; set; }

    public bool IsPublic { get; set; } = false;
}

public class UpdateTripDto
{
    [MaxLength(200)]
    public string? Title { get; set; }

    [MaxLength(2000)]
    public string? Description { get; set; }

    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public TripStatus? Status { get; set; }
    public bool? IsPublic { get; set; }
}

public class TripDto
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public TripStatus Status { get; set; }
    public bool IsPublic { get; set; }
    public string CreatedByUserName { get; set; } = string.Empty;
    public List<TripParticipantDto> Participants { get; set; } = new();
    public List<WaypointDto> Waypoints { get; set; } = new();
    public string? ComparisonNotes { get; set; }
}

public class TripParticipantDto
{
    public int Id { get; set; }
    public string UserEmail { get; set; } = string.Empty;
    public string UserName { get; set; } = string.Empty;
    public ParticipantRole Role { get; set; }
    public bool CanEdit { get; set; }
    public DateTime JoinedAt { get; set; }
}

public class AddParticipantDto
{
    [Required]
    [EmailAddress]
    public string UserEmail { get; set; } = string.Empty;

    public ParticipantRole Role { get; set; } = ParticipantRole.Member;
    public bool CanEdit { get; set; } = false;
}
