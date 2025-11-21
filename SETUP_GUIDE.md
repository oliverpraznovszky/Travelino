# Travelino - Gyors Telepítési Útmutató

## Előfeltételek ellenőrzése

Mielőtt elkezdenéd, győződj meg róla, hogy telepítve van:

- [x] .NET 8.0 SDK
- [x] SQL Server (localhost\SQLEXPRESS)
- [x] SQL Server Management Studio (SSMS)

## Telepítési lépések

### 1. SQL Server ellenőrzése

1. Nyisd meg az SQL Server Management Studio-t
2. Csatlakozz a `localhost\SQLEXPRESS` szerverhez
3. Ellenőrizd, hogy tud-e csatlakozni

### 2. Projekt előkészítése

Navigálj a projekt mappájába parancssorból:

```bash
cd C:\path\to\Travelino
```

### 3. NuGet csomagok visszaállítása

```bash
dotnet restore
```

### 4. Entity Framework Tools telepítése (ha nincs)

```bash
dotnet tool install --global dotnet-ef
```

vagy frissítés:

```bash
dotnet tool update --global dotnet-ef
```

### 5. Adatbázis migráció létrehozása

```bash
dotnet ef migrations add InitialCreate
```

### 6. Adatbázis frissítése

```bash
dotnet ef database update
```

Ha sikeres, létrejön a `TravelinoDB` adatbázis az SQL Server-en.

### 7. Alkalmazás fordítása

```bash
dotnet build
```

### 8. Alkalmazás futtatása

```bash
dotnet run
```

vagy Visual Studio-ban: F5

### 9. Böngésző megnyitása

Nyisd meg az egyik URL-t:
- HTTP: `http://localhost:5000`
- HTTPS: `https://localhost:5001`

### 10. Admin felhasználó létrehozása

Két lehetőség:

**A) Swagger UI használata:**
1. Nyisd meg: `http://localhost:5000/swagger`
2. Keresd meg az `Auth` > `POST /api/auth/seed-admin` endpointot
3. Kattints a "Try it out" > "Execute" gombra

**B) Postman/curl használata:**
```bash
curl -X POST http://localhost:5000/api/auth/seed-admin
```

**Admin bejelentkezési adatok:**
- Email: `admin@travelino.com`
- Jelszó: `Admin123!`

### 11. Alkalmazás tesztelése

1. A főoldalon kattints a "Bejelentkezés" gombra
2. Jelentkezz be az admin fiókkal
3. Hozz létre egy új utazást
4. Adj hozzá állomásokat a térképre kattintva
5. Próbáld ki a PDF export funkciót

## Gyakori hibák és megoldások

### Hiba: "Unable to connect to SQL Server"

**Megoldás:**
1. Ellenőrizd, hogy fut-e az SQL Server szolgáltatás
2. Windows Services > SQL Server (SQLEXPRESS) > Start
3. Vagy parancssorból:
   ```bash
   net start MSSQL$SQLEXPRESS
   ```

### Hiba: "A connection was successfully established with the server, but then an error occurred during the login process"

**Megoldás:**
1. Ellenőrizd a connection string-et az `appsettings.json` fájlban
2. Ha SQL Authentication-t használsz (nem Windows Auth):
   ```json
   "ConnectionStrings": {
     "DefaultConnection": "Server=localhost\\SQLEXPRESS;Database=TravelinoDB;User Id=sa;Password=YourPassword;TrustServerCertificate=True;"
   }
   ```

### Hiba: "The Entity Framework tools version 'x.x.x' is older than that of the runtime 'x.x.x'"

**Megoldás:**
```bash
dotnet tool update --global dotnet-ef
```

### Hiba: "Build failed" vagy "Could not find a part of the path"

**Megoldás:**
1. Töröld a `bin` és `obj` mappákat
2. Futtasd újra:
   ```bash
   dotnet clean
   dotnet build
   ```

### Port már használatban van

**Megoldás:**
Módosítsd a portokat a `Properties/launchSettings.json` fájlban, vagy állítsd le a portot használó alkalmazást.

## Adatbázis alaphelyzetbe állítása

Ha újra szeretnéd kezdeni az adatbázist:

```bash
dotnet ef database drop
dotnet ef database update
```

Vagy SSMS-ben:
```sql
DROP DATABASE TravelinoDB;
```

Majd futtasd újra a migrációt:
```bash
dotnet ef database update
```

## Visual Studio használata

1. Nyisd meg a `Travelino.sln` fájlt Visual Studio-ban
2. Package Manager Console-ban:
   ```
   Add-Migration InitialCreate
   Update-Database
   ```
3. F5 - alkalmazás futtatása debug módban

## Production telepítés

Production környezetben:

1. Módosítsd az `appsettings.json` fájlban:
   - JWT Secret-et egy erős, véletlenszerű értékre
   - Connection String-et a production adatbázisra
   - CORS beállításokat korlátozd

2. Publikálás:
   ```bash
   dotnet publish -c Release -o ./publish
   ```

3. Az `appsettings.Production.json` fájlban add meg a production beállításokat

## Támogatás

Ha további segítségre van szükséged:
1. Olvasd el a `README.md` fájlt
2. Nézd meg a Swagger dokumentációt: `/swagger`
3. Ellenőrizd a log fájlokat

## Következő lépések

Most, hogy az alkalmazás fut:

1. Hozz létre további felhasználókat a regisztráció funkcióval
2. Tesztelj különböző szerepköröket (Admin vs User)
3. Hozz létre utazásokat és adj hozzá résztvevőket
4. Próbáld ki a collaborative editing funkciót
5. Exportálj PDF-et egy teljes útitervről

Jó utazástervezést!
