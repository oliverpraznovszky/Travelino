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
  const [showPOI, setShowPOI] = useState(false);

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
              onClick={() => setShowPOI(false)}
            ></button>
          </div>
          <div className="mb-2">
            <select className="form-select form-select-sm">
              <option value="restaurant">Étterem</option>
              <option value="tourism">Látnivaló</option>
              <option value="hotel">Szállás</option>
            </select>
          </div>
          <button className="btn btn-primary btn-sm w-100">Keresés</button>
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
