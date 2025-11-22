# React Migration Guide - Travelino

## Elkészült komponensek:

### ✅ Core Setup
- `package.json` - React dependencies (React 18, React Router, Leaflet, Bootstrap)
- `vite.config.js` - Vite configuration, build to wwwroot
- `index.html` - Root HTML template
- `src/main.jsx` - Application entry point
- `src/index.css` - Global styles with new layout

### ✅ Context & Services
- `src/contexts/AuthContext.jsx` - Global authentication state
- `src/services/api.js` - API service layer for all backend calls

### ✅ Main Components
- `src/App.jsx` - Main app with routing and protected routes
- `src/components/Navbar.jsx` - Navigation bar with admin button
- `src/components/Login.jsx` - Login form component
- `src/components/Register.jsx` - Registration form component

### ✅ Pages
- `src/pages/MainPage.jsx` - Main page with map (left) and content (right)
- `src/pages/AdminPage.jsx` - Separate admin panel page

## 📋 Hiányzó komponensek (még létrehozandók):

### Map Components
```
src/components/MapPanel.jsx - React-Leaflet térkép komponens
  - useMap hook for map instance
  - Waypoint markers
  - Routing control integration
  - POI search panel overlay
```

### Trip Components
```
src/components/TripsList.jsx - Utazások listája
src/components/TripDetails.jsx - Kiválasztott utazás részletei
src/components/CreateTripModal.jsx - Új utazás létrehozása modal
src/components/EditTripModal.jsx - Utazás szerkesztése modal
src/components/WaypointsList.jsx - Waypoint-ok listája
```

### Other Components
```
src/components/InvitationsModal.jsx - Meghívások kezelése
src/components/POISearch.jsx - POI keresés overlay a térképen
```

## 🏗️ Layout Változások

### Új elrendezés:
```
┌─────────────────────────────────────────────────┐
│ Navbar (全幅)                                   │
├────────────────────────┬────────────────────────┤
│                        │                        │
│                        │  - Új utazás gomb      │
│   TÉRKÉP (60%)        │  - Utazások lista      │
│                        │  - Kiválasztott utazás │
│   + POI panel overlay  │    részletei           │
│                        │  - Waypoint-ok         │
│                        │                        │
└────────────────────────┴────────────────────────┘
```

### Admin felület:
Külön route: `/admin`
- Teljes képernyős admin interface
- Tab-ok: Felhasználók / Utazások
- Vissza gomb a főoldalra

## 🚀 Telepítés és futtatás:

```bash
# Dependencies telepítése
npm install

# Development mode (Vite dev server)
npm run dev

# Production build (wwwroot-ba)
npm run build
```

## 📝 Következő lépések:

1. **Hiányzó komponensek létrehozása:**
   - MapPanel.jsx (react-leaflet)
   - TripsList.jsx
   - TripDetails.jsx
   - Modalok (Create, Edit, Invitations)
   - POISearch.jsx

2. **React-Leaflet integráció:**
   ```jsx
   import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
   import 'leaflet/dist/leaflet.css'
   ```

3. **Routing Machine integráció:**
   - Leaflet Routing Machine wrapper komponens
   - Custom routing control hook

4. **Build optimalizálás:**
   - Code splitting
   - Lazy loading for admin route
   - Asset optimization

5. **Backend konfiguráció módosítás:**
   - `Program.cs` - Ensure SPA fallback still works
   - Static files serving from wwwroot

## 🔧 Vite konfiguráció részletei:

A `vite.config.js` úgy van beállítva, hogy:
- A build output a `wwwroot` mappába megy
- CSS és JS fájlok külön mappákba
- API proxy development módban
- Production build minifikálva

## ⚠️ Fontos megjegyzések:

1. **Leaflet CSS:** Már importálva az index.html-ben
2. **Bootstrap:** npm package-ből jön, ne CDN
3. **Icons:** Bootstrap Icons CDN-ről
4. **API URL:** Auto-detect based on hostname
5. **Token storage:** localStorage (AuthContext)

## 🎨 CSS Változások:

Az új layout-hoz használt CSS osztályok (`src/index.css`):
- `.main-layout` - Flex container
- `.map-panel` - 60% szélesség, bal oldal
- `.content-panel` - 40% szélesség, jobb oldal
- `.poi-panel` - Overlay a térképen
- Responsive breakpoints mobilra

## 🔐 Auth flow:

1. User bejelentkezik → Token localStorage-ba
2. AuthContext frissül
3. Protected routes ellenőrzik user state-et
4. Admin route csak Admin role-lal elérhető
5. API service automatikusan csatolja a tokent

## 📦 Build Process:

```bash
npm run build
```

Ez létrehozza:
- `wwwroot/index.html` - Entry point
- `wwwroot/js/*.js` - Application bundles
- `wwwroot/css/*.css` - Styles
- `wwwroot/assets/*` - Images, fonts

A .NET backend automatikusan kiszolgálja ezeket a fájlokat.
