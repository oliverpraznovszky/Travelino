using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Travelino.Models;

public class TripNote
{
    [Key]
    public int Id { get; set; }

    [Required]
    public int TripId { get; set; }

    [Required]
    public string UserId { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    public string Title { get; set; } = string.Empty;

    [Required]
    public string Content { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    public bool IsPublic { get; set; } = true; // Látható-e más résztvevőknek

    // Navigation properties
    [ForeignKey("TripId")]
    public virtual Trip Trip { get; set; } = null!;

    [ForeignKey("UserId")]
    public virtual ApplicationUser User { get; set; } = null!;
}
