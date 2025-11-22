using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Travelino.Data;
using Travelino.Models;

namespace Travelino.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin")]
public class AdminController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly UserManager<ApplicationUser> _userManager;

    public AdminController(
        ApplicationDbContext context,
        UserManager<ApplicationUser> userManager)
    {
        _context = context;
        _userManager = userManager;
    }

    // Get all users
    [HttpGet("users")]
    public async Task<ActionResult> GetAllUsers()
    {
        var users = await _userManager.Users.ToListAsync();

        var userDtos = new List<object>();
        foreach (var user in users)
        {
            var roles = await _userManager.GetRolesAsync(user);
            userDtos.Add(new
            {
                id = user.Id,
                email = user.Email,
                firstName = user.FirstName,
                lastName = user.LastName,
                roles = roles
            });
        }

        return Ok(userDtos);
    }

    // Delete user
    [HttpDelete("users/{userId}")]
    public async Task<IActionResult> DeleteUser(string userId)
    {
        var user = await _userManager.FindByIdAsync(userId);
        if (user == null)
        {
            return NotFound(new { message = "Felhasználó nem található." });
        }

        // Prevent deleting yourself
        var currentUserId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (currentUserId == userId)
        {
            return BadRequest(new { message = "Nem törölheted saját magad!" });
        }

        var result = await _userManager.DeleteAsync(user);
        if (result.Succeeded)
        {
            return Ok(new { message = "Felhasználó sikeresen törölve." });
        }

        return BadRequest(new { message = "Nem sikerült törölni a felhasználót." });
    }

    // Update user role
    [HttpPut("users/{userId}/role")]
    public async Task<IActionResult> UpdateUserRole(string userId, [FromBody] UpdateRoleDto dto)
    {
        var user = await _userManager.FindByIdAsync(userId);
        if (user == null)
        {
            return NotFound(new { message = "Felhasználó nem található." });
        }

        var currentRoles = await _userManager.GetRolesAsync(user);

        // Remove from all roles
        if (currentRoles.Any())
        {
            await _userManager.RemoveFromRolesAsync(user, currentRoles);
        }

        // Add to new role
        if (!string.IsNullOrEmpty(dto.Role))
        {
            await _userManager.AddToRoleAsync(user, dto.Role);
        }

        return Ok(new { message = "Szerepkör sikeresen frissítve." });
    }

    // Get all trips (admin)
    [HttpGet("trips")]
    public async Task<ActionResult> GetAllTrips()
    {
        var trips = await _context.Trips
            .Include(t => t.CreatedBy)
            .Include(t => t.Participants)
            .Include(t => t.Waypoints)
            .OrderByDescending(t => t.CreatedAt)
            .ToListAsync();

        var tripDtos = trips.Select(t => new
        {
            id = t.Id,
            title = t.Title,
            description = t.Description,
            startDate = t.StartDate,
            endDate = t.EndDate,
            status = t.Status,
            isPublic = t.IsPublic,
            createdBy = $"{t.CreatedBy.FirstName} {t.CreatedBy.LastName}",
            createdByEmail = t.CreatedBy.Email,
            participantsCount = t.Participants.Count,
            waypointsCount = t.Waypoints.Count,
            createdAt = t.CreatedAt
        });

        return Ok(tripDtos);
    }

    // Delete trip (admin)
    [HttpDelete("trips/{tripId}")]
    public async Task<IActionResult> DeleteTripAdmin(int tripId)
    {
        var trip = await _context.Trips.FirstOrDefaultAsync(t => t.Id == tripId);

        if (trip == null)
        {
            return NotFound(new { message = "Utazás nem található." });
        }

        _context.Trips.Remove(trip);
        await _context.SaveChangesAsync();

        return Ok(new { message = "Utazás sikeresen törölve." });
    }
}

public class UpdateRoleDto
{
    public string Role { get; set; } = string.Empty;
}
