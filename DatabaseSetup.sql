-- Travelino Database Setup Script
-- Ez a script OPCIONÁLIS - az Entity Framework automatikusan létrehozza az adatbázist
-- Csak akkor használd, ha manuálisan szeretnéd létrehozni az adatbázist

USE master;
GO

-- Adatbázis létrehozása ha nem létezik
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = 'TravelinoDB')
BEGIN
    CREATE DATABASE TravelinoDB;
END
GO

USE TravelinoDB;
GO

-- A tényleges táblák létrehozását az Entity Framework végzi
-- A következő parancsot futtasd a .NET CLI-ből:
-- dotnet ef migrations add InitialCreate
-- dotnet ef database update

-- Admin felhasználó létrehozása
-- Az alkalmazás elindítása után hívd meg:
-- POST http://localhost:5000/api/auth/seed-admin

PRINT 'Adatbázis előkészítve. Futtasd az EF migrációkat:';
PRINT 'dotnet ef migrations add InitialCreate';
PRINT 'dotnet ef database update';
GO
