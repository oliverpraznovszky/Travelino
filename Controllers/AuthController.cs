using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Travelino.DTOs;
using Travelino.Models;
using Travelino.Services;

namespace Travelino.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly SignInManager<ApplicationUser> _signInManager;
    private readonly RoleManager<IdentityRole> _roleManager;
    private readonly JwtService _jwtService;

    public AuthController(
        UserManager<ApplicationUser> userManager,
        SignInManager<ApplicationUser> signInManager,
        RoleManager<IdentityRole> roleManager,
        JwtService jwtService)
    {
        _userManager = userManager;
        _signInManager = signInManager;
        _roleManager = roleManager;
        _jwtService = jwtService;
    }

    [HttpPost("register")]
    public async Task<ActionResult<AuthResponseDto>> Register([FromBody] RegisterDto dto)
    {
        var existingUser = await _userManager.FindByEmailAsync(dto.Email);
        if (existingUser != null)
        {
            return BadRequest(new { message = "A felhasználó már létezik ezzel az email címmel." });
        }

        var user = new ApplicationUser
        {
            Email = dto.Email,
            UserName = dto.Email,
            FirstName = dto.FirstName,
            LastName = dto.LastName,
            CreatedAt = DateTime.UtcNow
        };

        var result = await _userManager.CreateAsync(user, dto.Password);

        if (!result.Succeeded)
        {
            return BadRequest(new { errors = result.Errors.Select(e => e.Description) });
        }

        // Assign default "User" role
        await EnsureRoleExists("User");
        await _userManager.AddToRoleAsync(user, "User");

        var roles = await _userManager.GetRolesAsync(user);
        var token = _jwtService.GenerateToken(user, roles);

        return Ok(new AuthResponseDto
        {
            Token = token,
            Email = user.Email!,
            FirstName = user.FirstName!,
            LastName = user.LastName!,
            Roles = roles.ToList()
        });
    }

    [HttpPost("login")]
    public async Task<ActionResult<AuthResponseDto>> Login([FromBody] LoginDto dto)
    {
        var user = await _userManager.FindByEmailAsync(dto.Email);
        if (user == null)
        {
            return Unauthorized(new { message = "Hibás email vagy jelszó." });
        }

        var result = await _signInManager.CheckPasswordSignInAsync(user, dto.Password, false);

        if (!result.Succeeded)
        {
            return Unauthorized(new { message = "Hibás email vagy jelszó." });
        }

        var roles = await _userManager.GetRolesAsync(user);
        var token = _jwtService.GenerateToken(user, roles);

        return Ok(new AuthResponseDto
        {
            Token = token,
            Email = user.Email!,
            FirstName = user.FirstName!,
            LastName = user.LastName!,
            Roles = roles.ToList()
        });
    }

    [HttpPost("seed-admin")]
    public async Task<IActionResult> SeedAdmin()
    {
        // Ensure Admin role exists
        await EnsureRoleExists("Admin");
        await EnsureRoleExists("User");

        // Check if admin already exists
        var existingAdmin = await _userManager.FindByEmailAsync("admin@travelino.com");
        if (existingAdmin != null)
        {
            return Ok(new { message = "Admin felhasználó már létezik." });
        }

        var admin = new ApplicationUser
        {
            Email = "admin@travelino.com",
            UserName = "admin@travelino.com",
            FirstName = "Admin",
            LastName = "User",
            CreatedAt = DateTime.UtcNow
        };

        var result = await _userManager.CreateAsync(admin, "Admin123!");

        if (result.Succeeded)
        {
            await _userManager.AddToRoleAsync(admin, "Admin");
            await _userManager.AddToRoleAsync(admin, "User");
            return Ok(new { message = "Admin felhasználó sikeresen létrehozva. Email: admin@travelino.com, Jelszó: Admin123!" });
        }

        return BadRequest(new { errors = result.Errors.Select(e => e.Description) });
    }

    private async Task EnsureRoleExists(string roleName)
    {
        if (!await _roleManager.RoleExistsAsync(roleName))
        {
            await _roleManager.CreateAsync(new IdentityRole(roleName));
        }
    }
}
