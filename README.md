# Travelino - Utazástervező Alkalmazás

React + ASP.NET Core utazástervező alkalmazás interaktív térképpel, POI kezeléssel és admin felülettel.

## 🚀 Technológiák

### Backend
- ASP.NET Core 8.0 Web API
- Entity Framework Core  
- SQL Server (localhost\SQLEXPRESS)
- JWT Authentication
- QuestPDF (PDF generálás)

### Frontend
- React 18
- React Router v6
- Leaflet + Leaflet Routing Machine
- Bootstrap 5
- Vite (build tool)

## 📋 Funkciók

✅ Regisztráció és bejelentkezés
✅ Utazások CRUD műveletek
✅ **Interaktív térkép bal oldalon (60%)**
✅ **Tartalom jobb oldalon (40%)**
✅ Waypoint-ok hozzáadása térképen
✅ POI keresés
✅ Útvonaltervezés
✅ Meghívások kezelése
✅ PDF export
✅ **Külön Admin felület (/admin)**

## 🛠️ Telepítés

### Backend
```bash
dotnet ef database update
dotnet run
```

### Frontend
```bash
npm install
npm run dev        # Development
npm run build      # Production (wwwroot-ba)
```

## 🔑 Admin fiók

```bash
curl -X POST https://localhost:7000/api/auth/seed-admin
```

Email: admin@travelino.com
Jelszó: Admin123

## 📱 Layout

```
┌──────────────────────────────────────┐
│ Navbar                               │
├─────────────────┬────────────────────┤
│ TÉRKÉP (60%)   │ TARTALOM (40%)     │
│ - Markers       │ - Utazások lista   │
│ - Routing       │ - Részletek        │
│ - POI overlay   │ - Műveletek        │
└─────────────────┴────────────────────┘
```

Admin: Külön /admin route teljes képernyőn
