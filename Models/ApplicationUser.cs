using Microsoft.AspNetCore.Identity;

namespace Travelino.Models;

public class ApplicationUser : IdentityUser
{
    public string? FirstName { get; set; }
    public string? LastName { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public virtual ICollection<Trip> CreatedTrips { get; set; } = new List<Trip>();
    public virtual ICollection<TripParticipant> TripParticipations { get; set; } = new List<TripParticipant>();
}
