using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using Travelino.Models;

namespace Travelino.Data;

public class ApplicationDbContext : IdentityDbContext<ApplicationUser>
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
    }

    public DbSet<Trip> Trips { get; set; }
    public DbSet<TripParticipant> TripParticipants { get; set; }
    public DbSet<Waypoint> Waypoints { get; set; }
    public DbSet<TripInvitation> TripInvitations { get; set; }

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        // Rename Identity tables to remove AspNet prefix
        builder.Entity<ApplicationUser>().ToTable("Users");
        builder.Entity<Microsoft.AspNetCore.Identity.IdentityRole>().ToTable("Roles");
        builder.Entity<Microsoft.AspNetCore.Identity.IdentityUserRole<string>>().ToTable("UserRoles");
        builder.Entity<Microsoft.AspNetCore.Identity.IdentityUserClaim<string>>().ToTable("UserClaims");
        builder.Entity<Microsoft.AspNetCore.Identity.IdentityUserLogin<string>>().ToTable("UserLogins");
        builder.Entity<Microsoft.AspNetCore.Identity.IdentityRoleClaim<string>>().ToTable("RoleClaims");
        builder.Entity<Microsoft.AspNetCore.Identity.IdentityUserToken<string>>().ToTable("UserTokens");

        // Trip configuration
        builder.Entity<Trip>()
            .HasOne(t => t.CreatedBy)
            .WithMany(u => u.CreatedTrips)
            .HasForeignKey(t => t.CreatedByUserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Entity<Trip>()
            .HasMany(t => t.Participants)
            .WithOne(p => p.Trip)
            .HasForeignKey(p => p.TripId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Entity<Trip>()
            .HasMany(t => t.Waypoints)
            .WithOne(w => w.Trip)
            .HasForeignKey(w => w.TripId)
            .OnDelete(DeleteBehavior.Cascade);

        // TripParticipant configuration
        builder.Entity<TripParticipant>()
            .HasOne(tp => tp.User)
            .WithMany(u => u.TripParticipations)
            .HasForeignKey(tp => tp.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        // TripInvitation configuration
        builder.Entity<TripInvitation>()
            .HasOne(ti => ti.Trip)
            .WithMany()
            .HasForeignKey(ti => ti.TripId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Entity<TripInvitation>()
            .HasOne(ti => ti.InvitedBy)
            .WithMany()
            .HasForeignKey(ti => ti.InvitedByUserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Entity<TripInvitation>()
            .HasOne(ti => ti.InvitedUser)
            .WithMany()
            .HasForeignKey(ti => ti.InvitedUserId)
            .OnDelete(DeleteBehavior.Restrict);

        // Indexes
        builder.Entity<Trip>()
            .HasIndex(t => t.CreatedByUserId);

        builder.Entity<Trip>()
            .HasIndex(t => t.Status);

        builder.Entity<TripParticipant>()
            .HasIndex(tp => new { tp.TripId, tp.UserId })
            .IsUnique();

        builder.Entity<Waypoint>()
            .HasIndex(w => new { w.TripId, w.OrderIndex });

        builder.Entity<TripInvitation>()
            .HasIndex(ti => new { ti.TripId, ti.InvitedEmail });

        builder.Entity<TripInvitation>()
            .HasIndex(ti => ti.Status);
    }
}
