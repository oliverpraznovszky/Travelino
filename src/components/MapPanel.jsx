import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-routing-machine';
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';

// Fix Leaflet default icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

function MapPanel({ trip, onTripUpdate }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const routingControlRef = useRef(null);
  const poiMarkersRef = useRef([]);
  const [showPOI, setShowPOI] = useState(false);
  const [poiType, setPoiType] = useState('restaurant');
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    // Initialize map
    if (!mapInstanceRef.current && mapRef.current) {
      mapInstanceRef.current = L.map(mapRef.current).setView([47.4979, 19.0402], 7);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(mapInstanceRef.current);
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!mapInstanceRef.current || !trip) return;

    // Clear existing markers
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    // Clear existing routing
    if (routingControlRef.current) {
      mapInstanceRef.current.removeControl(routingControlRef.current);
      routingControlRef.current = null;
    }

    // Add waypoint markers
    if (trip.waypoints && trip.waypoints.length > 0) {
      const sortedWaypoints = [...trip.waypoints].sort((a, b) => a.orderIndex - b.orderIndex);

      sortedWaypoints.forEach((waypoint, index) => {
        const marker = L.marker([waypoint.latitude, waypoint.longitude])
          .addTo(mapInstanceRef.current)
          .bindPopup(
            `<strong>${index + 1}. ${waypoint.name}</strong><br/>
             ${waypoint.description || ''}<br/>
             ${waypoint.address || ''}`
          );
        markersRef.current.push(marker);
      });

      // Add routing if 2 or more waypoints
      if (sortedWaypoints.length >= 2) {
        const routeWaypoints = sortedWaypoints
          .slice(0, 25)
          .map((wp) => L.latLng(wp.latitude, wp.longitude));

        routingControlRef.current = L.Routing.control({
          waypoints: routeWaypoints,
          routeWhileDragging: false,
          addWaypoints: false,
          draggableWaypoints: false,
          fitSelectedRoutes: false,
          showAlternatives: false,
          lineOptions: {
            styles: [{ color: '#0d6efd', opacity: 0.8, weight: 5 }],
          },
          createMarker: () => null,
          router: L.Routing.osrmv1({
            serviceUrl: 'https://router.project-osrm.org/route/v1',
            profile: 'car',
          }),
        }).addTo(mapInstanceRef.current);
      }

      // Fit map to bounds
      const bounds = L.latLngBounds(
        sortedWaypoints.map((wp) => [wp.latitude, wp.longitude])
      );
      mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [trip]);

  const searchPOI = async () => {
    if (!mapInstanceRef.current || !trip) return;

    setSearching(true);
    clearPOIMarkers();

    try {
      const bounds = mapInstanceRef.current.getBounds();
      const south = bounds.getSouth();
      const west = bounds.getWest();
      const north = bounds.getNorth();
      const east = bounds.getEast();

      // Overpass API query
      const query = `
        [out:json][timeout:25];
        (
          node["amenity"="${poiType}"](${south},${west},${north},${east});
          way["amenity"="${poiType}"](${south},${west},${north},${east});
          relation["amenity"="${poiType}"](${south},${west},${north},${east});
        );
        out center;
      `;

      const response = await fetch('https://overpass-api.de/api/interpreter', {
        method: 'POST',
        body: query,
      });

      const data = await response.json();

      // Add POI markers
      data.elements.forEach((element) => {
        const lat = element.lat || element.center?.lat;
        const lon = element.lon || element.center?.lon;

        if (lat && lon) {
          const poiIcon = L.icon({
            iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png',
            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowSize: [41, 41],
          });

          const marker = L.marker([lat, lon], { icon: poiIcon })
            .addTo(mapInstanceRef.current)
            .bindPopup(`
              <strong>${element.tags?.name || 'Névtelen POI'}</strong><br/>
              ${element.tags?.cuisine ? `Konyha: ${element.tags.cuisine}<br/>` : ''}
              ${element.tags?.addr?.street ? `Cím: ${element.tags.addr.street}<br/>` : ''}
            `);

          poiMarkersRef.current.push(marker);
        }
      });

      if (data.elements.length === 0) {
        alert('Nem található POI a térképen látható területen');
      }
    } catch (error) {
      console.error('POI search error:', error);
      alert('Hiba történt a POI keresés során');
    } finally {
      setSearching(false);
    }
  };

  const clearPOIMarkers = () => {
    poiMarkersRef.current.forEach((marker) => marker.remove());
    poiMarkersRef.current = [];
  };

  return (
    <div style={{ position: 'relative', height: '100%', width: '100%' }}>
      <div ref={mapRef} style={{ height: '100%', width: '100%' }}></div>

      {/* POI Search Panel */}
      {showPOI && trip && (
        <div className="poi-panel">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <h6 className="mb-0">POI Keresés</h6>
            <button
              type="button"
              className="btn-close"
              aria-label="Close"
              onClick={() => {
                setShowPOI(false);
                clearPOIMarkers();
              }}
            ></button>
          </div>
          <div className="mb-2">
            <select
              className="form-select form-select-sm"
              value={poiType}
              onChange={(e) => setPoiType(e.target.value)}
            >
              <option value="restaurant">Étterem</option>
              <option value="cafe">Kávézó</option>
              <option value="bar">Bár</option>
              <option value="fast_food">Gyorsétterem</option>
            </select>
          </div>
          <button
            className="btn btn-primary btn-sm w-100 mb-2"
            onClick={searchPOI}
            disabled={searching}
          >
            {searching ? 'Keresés...' : 'Keresés'}
          </button>
          <button
            className="btn btn-secondary btn-sm w-100"
            onClick={clearPOIMarkers}
          >
            Törlés
          </button>
        </div>
      )}

      {/* Map Controls */}
      {trip && (
        <div
          style={{
            position: 'absolute',
            top: '10px',
            left: '10px',
            zIndex: 1000,
          }}
        >
          <button
            className="btn btn-warning btn-sm"
            onClick={() => setShowPOI(!showPOI)}
            title="POI Keresés"
          >
            <i className="bi bi-search"></i>
          </button>
        </div>
      )}
    </div>
  );
}

export default MapPanel;
