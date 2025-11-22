# 🗺️ Travelino - Architektúra Dokumentáció

## 📋 Tartalom
1. [Program felépítése](#program-felépítése)
2. [Térkép megjelenítés](#térkép-megjelenítés)
3. [POI (Points of Interest) kezelés](#poi-kezelés)
4. [Útvonal megjelenítés](#útvonal-megjelenítés)
5. [Használt technológiák és eszközök](#használt-technológiák-és-eszközök)
6. [Javasolt plusz funkciók](#javasolt-plusz-funkciók)

---

## 🏗️ Program felépítése

### Backend (ASP.NET Core 8.0)

```
Travelino/
├── Controllers/           # API végpontok
│   ├── AuthController.cs         # Regisztráció, bejelentkezés
│   ├── TripsController.cs        # Utazások CRUD
│   ├── WaypointsController.cs    # Állomások CRUD
│   ├── InvitationsController.cs  # Meghívások kezelése
│   └── AdminController.cs        # Admin funkciók
│
├── Models/               # Adatbázis modellek
│   ├── ApplicationUser.cs        # Felhasználó
│   ├── Trip.cs                   # Utazás
│   ├── TripParticipant.cs       # Résztvevők
│   ├── Waypoint.cs              # Állomások
│   └── TripInvitation.cs        # Meghívások
│
├── DTOs/                 # Data Transfer Objects
│   ├── AuthDTOs.cs              # Login/Register adatok
│   ├── TripDTOs.cs              # Utazás adatok
│   ├── WaypointDTOs.cs          # Állomás adatok
│   └── InvitationDTOs.cs        # Meghívás adatok
│
├── Services/             # Üzleti logika
│   ├── JwtService.cs            # JWT token generálás
│   └── PdfExportService.cs      # PDF generálás (QuestPDF)
│
├── Data/                 # Adatbázis
│   └── ApplicationDbContext.cs   # Entity Framework DbContext
│
└── Migrations/           # Adatbázis migrációk
```

### Frontend (React + Vite)

```
src/
├── components/           # React komponensek
│   ├── Navbar.jsx              # Navigációs sáv
│   ├── MapPanel.jsx            # ⭐ Térkép panel (Leaflet)
│   ├── TripsList.jsx           # Utazások listája
│   ├── TripDetails.jsx         # Utazás részletei
│   ├── CreateTripModal.jsx     # Új utazás modal
│   ├── EditTripModal.jsx       # Utazás szerkesztés
│   ├── AddWaypointModal.jsx    # Állomás hozzáadás
│   ├── InviteModal.jsx         # Meghívás küldés
│   └── InvitationsModal.jsx    # Meghívások listája
│
├── pages/               # Oldalak
│   ├── LoginPage.jsx           # Bejelentkezés
│   ├── RegisterPage.jsx        # Regisztráció
│   ├── MainPage.jsx            # Főoldal (térkép + utazások)
│   └── AdminPage.jsx           # Admin panel
│
├── contexts/            # Global state
│   └── AuthContext.jsx         # Autentikáció kezelés
│
├── services/            # API hívások
│   └── api.js                  # Axios wrapper
│
└── main.jsx             # Alkalmazás belépési pont
```

---

## 🗺️ Térkép megjelenítés

### Használt technológia: **Leaflet.js**

**Fájl**: `src/components/MapPanel.jsx`

### Implementáció:

```javascript
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Térkép inicializálás
useEffect(() => {
  if (!mapInstanceRef.current && mapRef.current) {
    // Leaflet térkép példány létrehozása
    mapInstanceRef.current = L.map(mapRef.current).setView([47.4979, 19.0402], 7);

    // OpenStreetMap tile layer hozzáadása
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(mapInstanceRef.current);
  }
}, []);
```

### Miért Leaflet?
- ✅ **Nyílt forráskódú** - Ingyenes, nincs API kulcs
- ✅ **Könnyű** - Gyors betöltés
- ✅ **Testreszabható** - Teljes kontroll a megjelenés felett
- ✅ **OpenStreetMap** - Ingyenes térképadatok

### Térkép funkciók:

1. **Alapértelmezett nézet**: Magyarország középpontja (47.4979°N, 19.0402°E), zoom: 7
2. **Interaktív**: Zoom, drag, scroll
3. **Markerek**: Állomások megjelenítése
4. **Útvonal rajzolás**: Leaflet Routing Machine

---

## 📍 POI (Points of Interest) kezelés

### Használt API: **Overpass API** (OpenStreetMap)

**Fájl**: `src/components/MapPanel.jsx` → `searchPOI()` függvény

### Implementáció:

```javascript
const searchPOI = async () => {
  // Térkép aktuális nézetének határai
  const bounds = mapInstanceRef.current.getBounds();
  const south = bounds.getSouth();
  const west = bounds.getWest();
  const north = bounds.getNorth();
  const east = bounds.getEast();

  // Overpass Query Language (QL)
  const query = `
    [out:json][timeout:25];
    (
      node["amenity"="${poiType}"](${south},${west},${north},${east});
      way["amenity"="${poiType}"](${south},${west},${north},${east});
      relation["amenity"="${poiType}"](${south},${west},${north},${east});
    );
    out center;
  `;

  // API hívás
  const response = await fetch('https://overpass-api.de/api/interpreter', {
    method: 'POST',
    body: query,
  });

  const data = await response.json();

  // Eredmények megjelenítése narancssárga markerekkel
  data.elements.forEach((element) => {
    const lat = element.lat || element.center?.lat;
    const lon = element.lon || element.center?.lon;

    if (lat && lon) {
      const poiIcon = L.icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41],
      });

      const marker = L.marker([lat, lon], { icon: poiIcon })
        .addTo(mapInstanceRef.current)
        .bindPopup(`
          <div>
            <strong>${element.tags?.name || 'Névtelen POI'}</strong><br/>
            ${element.tags?.cuisine ? `Konyha: ${element.tags.cuisine}<br/>` : ''}
            <button onclick="window.addPOIAsWaypoint(...)">
              Hozzáadás állomásként
            </button>
          </div>
        `);
    }
  });
};
```

### POI típusok:

- **restaurant** - Éttermek
- **cafe** - Kávézók
- **hotel** - Szállodák
- **fuel** - Benzinkutak
- **parking** - Parkolók
- **attraction** - Látnivalók

### POI → Waypoint konverzió:

```javascript
// Global függvény, amit a popup gomb hív meg
window.addPOIAsWaypoint = (lat, lon, name, cuisine, address) => {
  onWaypointModalOpen({
    latitude: lat,
    longitude: lon,
    name: name,
    description: cuisine,
    address: address,
  });
};
```

**Folyamat**:
1. Felhasználó rákeres POI-ra (pl. "restaurant")
2. Overpass API lekéri az OpenStreetMap adatokat
3. Narancssárga markerek jelennek meg
4. "Hozzáadás állomásként" gombra kattintás
5. Modal megnyílik előre kitöltött adatokkal
6. Mentés után állomás lesz belőle

---

## 🛣️ Útvonal megjelenítés

### Használt könyvtár: **Leaflet Routing Machine**

**Fájl**: `src/components/MapPanel.jsx` → waypoints useEffect

### Implementáció:

```javascript
import L from 'leaflet';
import 'leaflet-routing-machine';
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';

useEffect(() => {
  if (!mapInstanceRef.current || !trip) return;

  // Állomások rendezése sorrend szerint
  const sortedWaypoints = [...trip.waypoints].sort((a, b) => a.orderIndex - b.orderIndex);

  // Kék markerek hozzáadása minden állomáshoz
  sortedWaypoints.forEach((waypoint, index) => {
    const marker = L.marker([waypoint.latitude, waypoint.longitude])
      .addTo(mapInstanceRef.current)
      .bindPopup(`
        <div>
          <strong>${index + 1}. ${waypoint.name}</strong><br/>
          ${waypoint.description || ''}<br/>
          <button onclick="window.deleteWaypoint(${trip.id}, ${waypoint.id})">
            Törlés
          </button>
        </div>
      `);
  });

  // Útvonal rajzolása (ha 2+ állomás van)
  if (sortedWaypoints.length >= 2) {
    const routeWaypoints = sortedWaypoints
      .slice(0, 25) // Max 25 állomás (OSRM limit)
      .map((wp) => L.latLng(wp.latitude, wp.longitude));

    routingControlRef.current = L.Routing.control({
      waypoints: routeWaypoints,
      routeWhileDragging: false,
      addWaypoints: false,
      draggableWaypoints: false,
      fitSelectedRoutes: false,
      showAlternatives: false,
      show: false, // Irányítás panel elrejtése
      lineOptions: {
        styles: [{ color: '#0d6efd', opacity: 0.8, weight: 5 }],
      },
      createMarker: () => null, // Saját markerek, routing ne tegyen hozzá újakat
      router: L.Routing.osrmv1({
        serviceUrl: 'https://router.project-osrm.org/route/v1',
        profile: 'car', // Autós navigáció
      }),
    }).addTo(mapInstanceRef.current);

    // Térkép igazítása az útvonalhoz
    const bounds = L.latLngBounds(
      sortedWaypoints.map((wp) => [wp.latitude, wp.longitude])
    );
    mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50] });
  }
}, [trip]);
```

### Routing működése:

1. **OSRM (Open Source Routing Machine)** - Ingyenes routing API
2. **Állomások → GPS koordináták** konverzió
3. **Autós útvonal** számítás
4. **Kék vonal** rajzolása a térképre
5. **Irányítás panel elrejtve** (`show: false`)

### Vizuális elemek:

- **Kék markerek** - Állomások (sorszámmal)
- **Kék vonal** - Útvonal (#0d6efd szín, 5px vastagság, 80% átlátszóság)
- **Popup** - Állomás adatok + törlés gomb

---

## 🛠️ Használt technológiák és eszközök

### Backend Stack:

| Technológia | Verzió | Cél |
|------------|--------|-----|
| **ASP.NET Core** | 8.0 | Web API framework |
| **Entity Framework Core** | 8.0 | ORM (adatbázis kezelés) |
| **SQL Server** | Express | Adatbázis |
| **ASP.NET Identity** | 8.0 | Felhasználó kezelés, szerepkörök |
| **JWT (JSON Web Tokens)** | 8.0 | Autentikáció |
| **QuestPDF** | 2024.7.3 | PDF generálás |
| **Swagger/OpenAPI** | 6.6.2 | API dokumentáció |

### Frontend Stack:

| Technológia | Verzió | Cél |
|------------|--------|-----|
| **React** | 18.2.0 | UI komponens könyvtár |
| **Vite** | 5.x | Build tool, dev server |
| **React Router** | 6.20.0 | Navigáció, routing |
| **Leaflet** | 1.9.4 | Térkép megjelenítés |
| **Leaflet Routing Machine** | 3.2.12 | Útvonal tervezés |
| **React-Leaflet** | 4.2.1 | React wrapper Leaflet-hez |
| **Bootstrap 5** | 5.3.2 | UI framework |
| **Bootstrap Icons** | - | Ikonok |

### External APIs:

| API | Cél |
|-----|-----|
| **OpenStreetMap** | Térképadatok (ingyenes) |
| **Overpass API** | POI keresés (OpenStreetMap query) |
| **OSRM** | Útvonal számítás (Open Source Routing Machine) |

### DevOps/Tools:

- **Git** - Verziókezelés
- **Visual Studio 2022** - Backend fejlesztés
- **VS Code** - Frontend fejlesztés
- **SQL Server Management Studio** - Adatbázis kezelés
- **Postman** - API tesztelés

---

## 🎯 Térkép komponens részletes működése

### MapPanel.jsx felépítése:

```javascript
function MapPanel({ trip, onTripUpdate, onWaypointModalOpen, onDeleteWaypoint }) {
  // State-ek
  const [showPOI, setShowPOI] = useState(false);
  const [poiType, setPoiType] = useState('restaurant');
  const [searching, setSearching] = useState(false);
  const [addingWaypoint, setAddingWaypoint] = useState(false);

  // Ref-ek (Leaflet példányok)
  const mapRef = useRef(null); // DOM elem
  const mapInstanceRef = useRef(null); // L.map példány
  const routingControlRef = useRef(null); // L.Routing.control példány
  const markersRef = useRef([]); // Állomás markerek
  const poiMarkersRef = useRef([]); // POI markerek

  // 1. Térkép inicializálás (csak egyszer)
  useEffect(() => { /* ... */ }, []);

  // 2. POI global function setup
  useEffect(() => { /* window.addPOIAsWaypoint = ... */ }, [onWaypointModalOpen]);

  // 3. Állomások és útvonal megjelenítése (trip változásakor)
  useEffect(() => { /* markerek + routing */ }, [trip]);

  // 4. POI keresés függvény
  const searchPOI = async () => { /* Overpass API */ };

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      {/* Térkép konténer */}
      <div ref={mapRef} style={{ width: '100%', height: '100%' }} />

      {/* POI keresés panel */}
      {showPOI && trip && (
        <div style={{ position: 'absolute', top: '60px', left: '10px', zIndex: 1000 }}>
          <select value={poiType} onChange={...}>
            <option value="restaurant">Étterem</option>
            <option value="cafe">Kávézó</option>
            <option value="hotel">Szálloda</option>
            {/* ... */}
          </select>
          <button onClick={searchPOI}>Keresés</button>
        </div>
      )}

      {/* Kontroll gombok */}
      {trip && (
        <div style={{ position: 'absolute', top: '10px', left: '10px', zIndex: 1000 }}>
          <button onClick={() => setShowPOI(!showPOI)}>🔍 POI</button>
          <button onClick={() => setAddingWaypoint(!addingWaypoint)}>📍 Állomás</button>
        </div>
      )}
    </div>
  );
}
```

---

## 📦 PDF Export működése

**Fájl**: `Services/PdfExportService.cs`

### Használt könyvtár: QuestPDF

```csharp
public byte[] GenerateTripPdf(Trip trip)
{
    QuestPDF.Settings.License = LicenseType.Community;

    var document = Document.Create(container =>
    {
        container.Page(page =>
        {
            page.Size(PageSizes.A4);
            page.Margin(2, Unit.Centimetre);

            // Fejléc
            page.Header()
                .Text($"Útiterv: {trip.Title}")
                .SemiBold().FontSize(20);

            // Tartalom
            page.Content().Column(column =>
            {
                // Utazás adatok
                column.Item().Text($"Kezdés: {trip.StartDate:yyyy.MM.dd}");
                column.Item().Text($"Befejezés: {trip.EndDate:yyyy.MM.dd}");

                // Térkép kép (Mapbox/OpenStreetMap static API)
                var mapImageBytes = GetStaticMapImage(trip.Waypoints);
                if (mapImageBytes != null)
                {
                    column.Item().Image(mapImageBytes).FitWidth();
                }

                // Résztvevők
                foreach (var participant in trip.Participants)
                {
                    column.Item().Text($"• {participant.User.FirstName} {participant.User.LastName}");
                }

                // Állomások
                foreach (var waypoint in trip.Waypoints)
                {
                    column.Item().Text($"{waypoint.OrderIndex + 1}. {waypoint.Name}");
                }
            });
        });
    });

    return document.GeneratePdf();
}
```

### Statikus térkép kép:

```csharp
private byte[]? GetStaticMapImage(List<Waypoint> waypoints)
{
    // Mapbox Static Images API (alternatíva: OpenStreetMap Static Map)
    var mapUrl = $"https://api.mapbox.com/styles/v1/mapbox/streets-v11/static/...";

    using var httpClient = _httpClientFactory.CreateClient();
    var response = await httpClient.GetAsync(mapUrl);
    return await response.Content.ReadAsByteArrayAsync();
}
```

---

## 🔐 Autentikáció folyamata

### 1. Regisztráció:

```
Frontend (RegisterPage.jsx)
    ↓ POST /api/auth/register
Backend (AuthController.cs)
    ↓ UserManager.CreateAsync()
Database (Users tábla)
    ↓ Új user + UserRoles
Response: { token: "eyJ...", user: {...} }
```

### 2. Bejelentkezés:

```
Frontend (LoginPage.jsx)
    ↓ POST /api/auth/login
Backend (AuthController.cs)
    ↓ SignInManager.PasswordSignInAsync()
    ↓ JwtService.GenerateToken()
Response: { token: "eyJ...", user: {...} }
    ↓ localStorage.setItem('token', ...)
Frontend (AuthContext)
```

### 3. Protected API hívások:

```javascript
// api.js
getHeaders() {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${this.token}` // JWT token
  };
}
```

---

## 🎨 Layout struktúra

### MainPage layout (60% térkép, 40% tartalom):

```css
.main-layout {
  display: flex;
  flex: 1;
  overflow: hidden;
  height: calc(100vh - 56px); /* navbar magasság */
}

.map-panel {
  flex: 0 0 60%; /* fix 60% szélesség */
  position: relative;
}

.content-panel {
  flex: 0 0 40%; /* fix 40% szélesség */
  overflow-y: auto; /* scroll, ha sok utazás van */
  background-color: #f8f9fa;
  padding: 20px;
}
```

---

## 📊 Adatbázis táblák (végleges)

### Használt táblák:

1. **Users** - Felhasználók (email, jelszó, név)
2. **Roles** - Szerepkörök (Admin, User)
3. **UserRoles** - Felhasználó-szerepkör kapcsolat
4. **Trips** - Utazások
5. **TripParticipants** - Utazás résztvevők
6. **Waypoints** - Állomások/megállók
7. **TripInvitations** - Meghívások

### Törölt táblák (nem használt funkciók):

- ❌ TripNotes (jegyzetek - nincs implementálva)
- ❌ PlannedRoutes (tervezett útvonal - routing library kezeli)
- ❌ ActualRoutes (tényleges útvonal - nincs GPS tracking)

---

## 🚀 Javasolt plusz funkciók

### 🎯 Alapvető funkciók (könnyen implementálható):

- [ ] **Profilkép feltöltés** - Felhasználói profilképek
- [ ] **Utazás másolása** - Meglévő utazás duplikálása
- [ ] **Keresés az utazások között** - Szűrés cím/dátum alapján
- [ ] **Rendezés** - Utazások rendezése (dátum, név, státusz)
- [ ] **Waypoint sorrend módosítás** - Drag & drop állomás átrendezés
- [ ] **Waypoint típus ikonok** - Különböző ikonok (étterem, hotel, stb.)
- [ ] **Résztvevő megtekintés** - Ki vesz részt az utazáson
- [ ] **Meghívás visszavonás** - Küldött meghívó törlése
- [ ] **Utazás archiválás** - Lezárt utazások archiválása
- [ ] **TérképLayer váltás** - Satellite, Terrain, Street nézetek

### 🌟 Haladó funkciók (közepes nehézség):

- [ ] **Költségvetés követés** - Tervezett/tényleges költségek
- [ ] **Időjárás előrejelzés** - API integráció (OpenWeatherMap)
- [ ] **Fotók feltöltése** - Képek csatolása állomásokhoz
- [ ] **Közös chat** - Utazás résztvevők közötti üzenetküldés
- [ ] **Offline térkép** - Térkép letöltés offline használatra
- [ ] **Távolság és idő számítás** - Összesen hány km, hány óra
- [ ] **Állomás javaslatok** - AI alapú ajánlások útvonal mentén
- [ ] **Export GPX** - GPS készülékekhez exportálás
- [ ] **Import from Google Maps** - URL-ből importálás
- [ ] **Push értesítések** - Meghívás, módosítás értesítés

### 🔥 Prémium funkciók (magas komplexitás):

- [ ] **Valós idejű GPS tracking** - Élő helyzet követés
- [ ] **Social sharing** - Utazás megosztása Facebook/Instagram-on
- [ ] **Többnapos útvonal optimalizáció** - AI alapú útvonaltervezés
- [ ] **Szállásfoglalás integráció** - Booking.com API
- [ ] **Repülőjegy keresés** - Skyscanner API
- [ ] **Kollaboratív szerkesztés** - Real-time együttműködés (WebSocket)
- [ ] **Mobilalkalmazás** - React Native/Flutter app
- [ ] **Voice commands** - Hangalapú navigáció
- [ ] **Augmented Reality** - AR térképnézet mobilon
- [ ] **Travel blog** - Utazás után blog készítés fotókkal

### 📊 Analitika és statisztika:

- [ ] **Utazási statisztika** - Összesen hány km, hány országban jártál
- [ ] **Látogatott helyek térképe** - Világtérkép kiemelve
- [ ] **Éves összefoglaló** - "2024-ben 15 utazás, 12 ország"
- [ ] **Kedvenc helyeid** - Legtöbbször látogatott POI-k
- [ ] **CO2 lábnyom** - Környezeti hatás mérése

### 🔒 Biztonsági fejlesztések:

- [ ] **Kétfaktoros hitelesítés (2FA)** - Email/SMS kód
- [ ] **Elfelejtett jelszó** - Jelszó visszaállítás email-lel
- [ ] **Email verifikáció** - Regisztrációnál email megerősítés
- [ ] **Aktivitás napló** - Ki, mikor, mit módosított
- [ ] **Szerepkör finomhangolás** - Több jogosultsági szint

### 🎨 UX/UI fejlesztések:

- [ ] **Sötét mód (Dark mode)** - Éjszakai téma
- [ ] **Nyelvek** - Többnyelvű felület (EN, HU, DE, stb.)
- [ ] **Responsivitás** - Mobilbarát megjelenés
- [ ] **Tutorial/Onboarding** - Első használatnál segítség
- [ ] **Billentyűparancsok** - Keyboard shortcuts power usereknek
- [ ] **Drag & drop file upload** - Fotók húzással feltöltés

### 🌐 Integráció más szolgáltatásokkal:

- [ ] **Google Calendar sync** - Utazások szinkronizálása naptárral
- [ ] **Email riport** - Heti/havi összefoglaló email
- [ ] **CSV/Excel import/export** - Tömeges adatkezelés
- [ ] **Zapier integráció** - Automatizációk
- [ ] **Slack/Discord bot** - Értesítések csapatoknak

---

## 📝 Összegzés

A Travelino egy **full-stack webalkalmazás**, amely:

✅ **Backend**: ASP.NET Core 8.0 + SQL Server + JWT autentikáció
✅ **Frontend**: React 18 + Vite + Leaflet térkép
✅ **Térképezés**: Leaflet + OpenStreetMap + OSRM routing
✅ **POI keresés**: Overpass API (OpenStreetMap)
✅ **PDF export**: QuestPDF
✅ **Layout**: 60% térkép (bal) + 40% tartalom (jobb)

**Fő funkciók**:
- Utazások tervezése állomásokkal
- Interaktív térképes megjelenítés
- POI keresés és hozzáadás
- Útvonal automatikus rajzolása
- Meghívások küldése/fogadása
- Admin felület
- PDF export

**Következő lépések**:
- Válassz a javasolt funkciók közül
- Implementáld a prioritást
- Teszteld alaposan
- Deploy production környezetbe

---

*Dokumentáció utoljára frissítve: 2024.11.22*
