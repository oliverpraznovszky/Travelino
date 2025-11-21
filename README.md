# Travelino - Utazástervező és Naplózó Alkalmazás

## Projekt leírása

A Travelino egy komplex utazástervező és naplózó alkalmazás, amely egyesíti az utazások megtervezését és a megtett utak dokumentálását. A rendszer támogatja a közös szerkesztést csoportos utazások során, kezeli az alternatív forgatókönyveket, valamint lehetőséget ad a tervek és naplók személyre szabott megosztására.

## Főbb funkciók

### 1. Autentikáció és Autorizáció
- **Felhasználói regisztráció és bejelentkezés**
- **Role-based hozzáférés** (Admin, User)
- **JWT Token alapú biztonság**

### 2. Utazások kezelése
- Utazások létrehozása, módosítása, törlése
- Nyilvános és privát utazások
- Résztvevők hozzáadása és jogosultságok kezelése
- Státusz kezelés (Tervezés, Jóváhagyott, Folyamatban, Befejezett, Törölt)

### 3. Interaktív térkép
- **Leaflet.js alapú térképes felület**
- Útvonal állomások (waypoints) kijelölése térképen
- Különböző típusú helyszínek:
  - Éttermek
  - Szállások
  - Látnivalók
  - Benzinkutak
  - Parkolók
  - Egyéb helyszínek

### 4. Közös szerkesztés
- Csoportos utazások támogatása
- Résztvevői szerepkörök (Tulajdonos, Szervező, Résztvevő)
- Szerkesztési jogosultságok

### 5. Tervezés és naplózás
- Tervezett útvonalak és időpontok rögzítése
- Tényleges útvonalak és időpontok rögzítése
- Jegyzetek hozzáadása az úthoz

### 6. Összehasonlítás
- **Tervezett vs. Tényleges út összehasonlítása**
- Eltérések kimutatása távolságban és időben
- Állomások közötti időeltérések számítása

### 7. PDF Export
- **Útiterv exportálása PDF formátumban**
- Részletes összefoglaló az útról
- Állomások és jegyzetek tartalmazása

## Technológiai stack

### Backend
- **ASP.NET Core 8.0** Web API
- **Entity Framework Core** ORM
- **SQL Server** (localhost\SQLEXPRESS)
- **ASP.NET Core Identity** - felhasználó kezelés
- **JWT Authentication** - biztonság
- **QuestPDF** - PDF generálás

### Frontend
- **HTML5, CSS3, JavaScript**
- **Bootstrap 5** - UI framework
- **Leaflet.js** - interaktív térkép
- **Vanilla JavaScript** - SPA funkcionalitás

## Projekt struktúra

```
Travelino/
├── Controllers/           # API kontrollerek
│   ├── AuthController.cs
│   ├── TripsController.cs
│   └── WaypointsController.cs
├── Data/                  # Adatbázis context
│   └── ApplicationDbContext.cs
├── DTOs/                  # Data Transfer Objects
│   ├── AuthDTOs.cs
│   ├── TripDTOs.cs
│   └── WaypointDTOs.cs
├── Models/                # Adatbázis modellek
│   ├── ApplicationUser.cs
│   ├── Trip.cs
│   ├── TripParticipant.cs
│   ├── Waypoint.cs
│   ├── PlannedRoute.cs
│   ├── ActualRoute.cs
│   └── TripNote.cs
├── Services/              # Üzleti logika szolgáltatások
│   ├── JwtService.cs
│   └── PdfExportService.cs
├── wwwroot/               # Frontend statikus fájlok
│   ├── index.html
│   ├── css/
│   │   └── style.css
│   └── js/
│       └── app.js
├── appsettings.json
├── Program.cs
└── Travelino.csproj
```

## Adatbázis séma

### Táblák

1. **AspNetUsers** - Felhasználók (Identity)
2. **AspNetRoles** - Szerepkörök (Identity)
3. **Trips** - Utazások
4. **TripParticipants** - Utazás résztvevők
5. **Waypoints** - Útvonal állomások
6. **PlannedRoutes** - Tervezett útvonalak
7. **ActualRoutes** - Tényleges útvonalak
8. **TripNotes** - Jegyzetek

### Entity Relationships

- User 1:N Trip (CreatedBy)
- User N:M Trip (Participants)
- Trip 1:N Waypoint
- Trip 1:N PlannedRoute
- Trip 1:N ActualRoute
- Trip 1:N TripNote

## Telepítés és futtatás

### Előfeltételek

- .NET 8.0 SDK
- SQL Server (localhost\SQLEXPRESS)
- SQL Server Management Studio (SSMS)

### Lépések

1. **Klónozd a repository-t**
   ```bash
   git clone <repository-url>
   cd Travelino
   ```

2. **Adatbázis kapcsolat ellenőrzése**

   Ellenőrizd az `appsettings.json` fájlban a connection string-et:
   ```json
   "ConnectionStrings": {
     "DefaultConnection": "Server=localhost\\SQLEXPRESS;Database=TravelinoDB;Trusted_Connection=True;TrustServerCertificate=True;MultipleActiveResultSets=true"
   }
   ```

3. **NuGet csomagok telepítése**
   ```bash
   dotnet restore
   ```

4. **Adatbázis migráció létrehozása**
   ```bash
   dotnet ef migrations add InitialCreate
   ```

5. **Adatbázis frissítése**
   ```bash
   dotnet ef database update
   ```

6. **Admin felhasználó létrehozása**

   Az alkalmazás elindítása után hívd meg a következő API endpointot:
   ```
   POST http://localhost:5000/api/auth/seed-admin
   ```

   Ez létrehoz egy admin felhasználót:
   - Email: admin@travelino.com
   - Jelszó: Admin123!

7. **Alkalmazás futtatása**
   ```bash
   dotnet run
   ```

8. **Böngészőben megnyitás**
   ```
   http://localhost:5000
   vagy
   https://localhost:5001
   ```

## API Dokumentáció

Az alkalmazás futtatása után a Swagger UI elérhető:
```
http://localhost:5000/swagger
```

### Főbb API Endpointok

#### Autentikáció
- `POST /api/auth/register` - Regisztráció
- `POST /api/auth/login` - Bejelentkezés
- `POST /api/auth/seed-admin` - Admin felhasználó létrehozása

#### Utazások
- `GET /api/trips` - Összes utazás lekérése
- `GET /api/trips/{id}` - Egy utazás lekérése
- `POST /api/trips` - Új utazás létrehozása
- `PUT /api/trips/{id}` - Utazás módosítása
- `DELETE /api/trips/{id}` - Utazás törlése
- `POST /api/trips/{id}/participants` - Résztvevő hozzáadása
- `GET /api/trips/{id}/export/pdf` - PDF export
- `POST /api/trips/{id}/compare` - Összehasonlítás generálása

#### Állomások (Waypoints)
- `GET /api/trips/{tripId}/waypoints` - Összes állomás
- `GET /api/trips/{tripId}/waypoints/{id}` - Egy állomás
- `POST /api/trips/{tripId}/waypoints` - Új állomás
- `PUT /api/trips/{tripId}/waypoints/{id}` - Állomás módosítása
- `DELETE /api/trips/{tripId}/waypoints/{id}` - Állomás törlése

## Használati útmutató

### 1. Regisztráció/Bejelentkezés
- A főoldalon kattints a "Regisztráció" vagy "Bejelentkezés" gombra
- Töltsd ki a formot és jelentkezz be

### 2. Új utazás létrehozása
- Kattints az "Új utazás létrehozása" gombra
- Add meg az utazás adatait (cím, leírás, dátumok)
- Mentsd el

### 3. Állomások hozzáadása
- Válassz ki egy utazást a listából
- Kattints az "Állomás hozzáadása" gombra
- Kattints a térképre a pozíció megjelöléséhez
- Töltsd ki az állomás adatait (név, típus, cím)

### 4. Résztvevők hozzáadása
- Nyisd meg az utazás részleteit
- Add meg a résztvevő email címét
- Állítsd be a jogosultságokat

### 5. PDF Export
- Válassz ki egy utazást
- Kattints a "PDF Export" gombra
- A PDF automatikusan letöltődik

### 6. Összehasonlítás
- Rögzítsd a tényleges érkezési/indulási időpontokat az állomásoknál
- Kattints az "Összehasonlítás" gombra
- Az eredmény megjelenik az utazás részleteiben

## Biztonsági beállítások

### JWT Token
- Token lejárati idő: 24 óra
- Titkos kulcs: módosítsd az `appsettings.json` fájlban production környezetben

### CORS
- Jelenleg minden forrás engedélyezett (development)
- Production környezetben korlátozd a megengedett forrásokat

### Jelszó követelmények
- Minimum 6 karakter
- Legalább egy szám
- Kis- és nagybetű nem kötelező (könnyített verzió)

## Továbbfejlesztési lehetőségek

1. **Real-time collaborative editing** - SignalR használatával
2. **Routing API integráció** - Google Maps/OpenRouteService
3. **Képek feltöltése** - állomásokhoz és jegyzetekhez
4. **Email értesítések** - résztvevőknek
5. **Mobile alkalmazás** - React Native/Flutter
6. **Offline támogatás** - Progressive Web App
7. **Költségvetés kezelés** - költségek nyomon követése
8. **Időjárás integráció** - előrejelzés az utazáshoz
9. **Közösségi funkciók** - utazások megosztása, kommentek
10. **Statisztikák és jelentések** - utazási szokások elemzése

## Hibaelhárítás

### Adatbázis kapcsolódási hiba
- Ellenőrizd, hogy fut-e az SQL Server
- Ellenőrizd a connection string-et
- Ellenőrizd a Windows Authentication beállításokat

### Migration hiba
- Töröld a Migrations mappát
- Futtasd újra: `dotnet ef migrations add InitialCreate`

### CORS hiba
- Ellenőrizd, hogy a backend API URL helyes-e a frontend kódban
- Ellenőrizd a CORS beállításokat a Program.cs-ben

## Licenc

Ez a projekt oktatási célra készült.

## Szerző

Travelino fejlesztő csapat
