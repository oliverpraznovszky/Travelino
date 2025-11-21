// API Base URL
const API_URL = window.location.origin + '/api';

// Global state
let currentUser = null;
let currentTrip = null;
let map = null;
let markers = [];
let poiMarkers = [];
let routingControl = null;
let addingWaypoint = false;

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    initMap();
    checkAuth();
    setupEventListeners();
});

// Initialize Leaflet Map
function initMap() {
    map = L.map('map').setView([47.4979, 19.0402], 7); // Budapest center

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19
    }).addTo(map);

    // Add click event for adding waypoints
    map.on('click', function(e) {
        if (addingWaypoint && currentTrip) {
            showAddWaypointModal(e.latlng.lat, e.latlng.lng);
            addingWaypoint = false;
        }
    });
}

// Check if user is logged in
function checkAuth() {
    const token = localStorage.getItem('token');
    const userName = localStorage.getItem('userName');

    if (token && userName) {
        currentUser = {
            token: token,
            name: userName
        };
        showUserInfo();
        loadTrips();
        checkInvitations(); // Check for pending invitations
    } else {
        showAuthButtons();
    }
}

function showUserInfo() {
    document.getElementById('authButtons').classList.add('d-none');
    document.getElementById('userInfo').classList.remove('d-none');
    document.getElementById('userName').textContent = currentUser.name;
}

function showAuthButtons() {
    document.getElementById('authButtons').classList.remove('d-none');
    document.getElementById('userInfo').classList.add('d-none');
}

// Setup Event Listeners
function setupEventListeners() {
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    document.getElementById('registerForm').addEventListener('submit', handleRegister);
    document.getElementById('createTripForm').addEventListener('submit', handleCreateTrip);
    document.getElementById('addWaypointForm').addEventListener('submit', handleAddWaypoint);
    document.getElementById('inviteForm').addEventListener('submit', handleInvite);
}

// ========== Authentication handlers ==========

async function handleLogin(e) {
    e.preventDefault();

    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    try {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        if (response.ok) {
            const data = await response.json();
            localStorage.setItem('token', data.token);
            localStorage.setItem('userName', `${data.firstName} ${data.lastName}`);

            currentUser = {
                token: data.token,
                name: `${data.firstName} ${data.lastName}`
            };

            bootstrap.Modal.getInstance(document.getElementById('loginModal')).hide();
            showUserInfo();
            loadTrips();
            checkInvitations();
            showSuccess('Sikeres bejelentkezés!');
        } else {
            const error = await response.json();
            showError(error.message || 'Bejelentkezési hiba');
        }
    } catch (error) {
        showError('Hálózati hiba történt');
        console.error(error);
    }
}

async function handleRegister(e) {
    e.preventDefault();

    const firstName = document.getElementById('registerFirstName').value;
    const lastName = document.getElementById('registerLastName').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;

    try {
        const response = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ firstName, lastName, email, password })
        });

        if (response.ok) {
            const data = await response.json();
            localStorage.setItem('token', data.token);
            localStorage.setItem('userName', `${data.firstName} ${data.lastName}`);

            currentUser = {
                token: data.token,
                name: `${data.firstName} ${data.lastName}`
            };

            bootstrap.Modal.getInstance(document.getElementById('registerModal')).hide();
            showUserInfo();
            loadTrips();
            checkInvitations();
            showSuccess('Sikeres regisztráció!');
        } else {
            const error = await response.json();
            showError(error.message || 'Regisztrációs hiba');
        }
    } catch (error) {
        showError('Hálózati hiba történt');
        console.error(error);
    }
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('userName');
    currentUser = null;
    currentTrip = null;
    showAuthButtons();
    clearMap();
    clearPOIs();
    document.getElementById('tripsList').innerHTML = '<p class="text-muted">Nincs megjeleníthető utazás</p>';
    document.getElementById('tripDetailsCard').style.display = 'none';
    document.getElementById('waypointsCard').style.display = 'none';
    document.getElementById('poiSearchPanel').style.display = 'none';
}

// ========== Trip handlers ==========

async function loadTrips() {
    if (!currentUser) return;

    try {
        const response = await fetch(`${API_URL}/trips`, {
            headers: {
                'Authorization': `Bearer ${currentUser.token}`
            }
        });

        if (response.ok) {
            const trips = await response.json();
            displayTrips(trips);
        } else {
            showError('Nem sikerült betölteni az utazásokat');
        }
    } catch (error) {
        showError('Hálózati hiba történt');
        console.error(error);
    }
}

function displayTrips(trips) {
    const tripsList = document.getElementById('tripsList');

    if (trips.length === 0) {
        tripsList.innerHTML = '<p class="text-muted">Nincs megjeleníthető utazás</p>';
        return;
    }

    tripsList.innerHTML = trips.map(trip => `
        <a href="#" class="list-group-item list-group-item-action" onclick="selectTrip(${trip.id}); return false;">
            <div class="d-flex w-100 justify-content-between">
                <h6 class="mb-1">${trip.title}</h6>
                <small>${new Date(trip.startDate).toLocaleDateString('hu-HU')}</small>
            </div>
            <p class="mb-1 text-truncate">${trip.description || ''}</p>
            <small>Státusz: ${getTripStatusText(trip.status)}</small>
        </a>
    `).join('');
}

async function handleCreateTrip(e) {
    e.preventDefault();

    const title = document.getElementById('tripTitle').value;
    const description = document.getElementById('tripDescription').value;
    const startDate = document.getElementById('tripStartDate').value;
    const endDate = document.getElementById('tripEndDate').value;
    const isPublic = document.getElementById('tripIsPublic').checked;

    try {
        const response = await fetch(`${API_URL}/trips`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${currentUser.token}`
            },
            body: JSON.stringify({ title, description, startDate, endDate, isPublic })
        });

        if (response.ok) {
            const trip = await response.json();
            bootstrap.Modal.getInstance(document.getElementById('createTripModal')).hide();
            document.getElementById('createTripForm').reset();
            loadTrips();
            selectTrip(trip.id);
            showSuccess('Utazás sikeresen létrehozva!');
        } else {
            showError('Nem sikerült létrehozni az utazást');
        }
    } catch (error) {
        showError('Hálózati hiba történt');
        console.error(error);
    }
}

async function selectTrip(tripId) {
    if (!currentUser) return;

    try {
        const response = await fetch(`${API_URL}/trips/${tripId}`, {
            headers: {
                'Authorization': `Bearer ${currentUser.token}`
            }
        });

        if (response.ok) {
            currentTrip = await response.json();
            displayTripDetails(currentTrip);
            displayWaypoints(currentTrip.waypoints);
            updateRouting(currentTrip.waypoints);
            document.getElementById('exportPdfBtn').disabled = false;
            document.getElementById('compareTripBtn').disabled = false;
            document.getElementById('inviteBtn').disabled = false;

            // Highlight selected trip
            document.querySelectorAll('#tripsList .list-group-item').forEach(item => {
                item.classList.remove('active');
            });
            event.target.closest('.list-group-item')?.classList.add('active');
        } else {
            showError('Nem sikerült betölteni az utazást');
        }
    } catch (error) {
        showError('Hálózati hiba történt');
        console.error(error);
    }
}

function displayTripDetails(trip) {
    const detailsCard = document.getElementById('tripDetailsCard');
    const details = document.getElementById('tripDetails');

    details.innerHTML = `
        <h5>${trip.title}</h5>
        <p>${trip.description || 'Nincs leírás'}</p>
        <p><strong>Időpont:</strong> ${new Date(trip.startDate).toLocaleDateString('hu-HU')} - ${new Date(trip.endDate).toLocaleDateString('hu-HU')}</p>
        <p><strong>Státusz:</strong> <span class="badge bg-${getTripStatusColor(trip.status)}">${getTripStatusText(trip.status)}</span></p>
        <p><strong>Résztvevők:</strong> ${trip.participants.length}</p>
        ${trip.comparisonNotes ? `
            <div class="alert alert-info">
                <strong>Összehasonlítás:</strong><br>
                <pre style="white-space: pre-wrap;">${trip.comparisonNotes}</pre>
            </div>
        ` : ''}
    `;

    detailsCard.style.display = 'block';
}

// ========== Waypoint handlers ==========

function displayWaypoints(waypoints) {
    clearMap();

    if (waypoints.length === 0) {
        document.getElementById('waypointsCard').style.display = 'none';
        return;
    }

    const waypointsList = document.getElementById('waypointsList');
    waypointsList.innerHTML = waypoints.map((wp, index) => `
        <div class="waypoint-item">
            <div class="waypoint-header">
                <div>
                    <span class="waypoint-title">${index + 1}. ${wp.name}</span>
                    <span class="badge bg-${getWaypointTypeColor(wp.type)}">${getWaypointTypeText(wp.type)}</span>
                </div>
            </div>
            ${wp.description ? `<p class="mb-1">${wp.description}</p>` : ''}
            ${wp.address ? `<p class="text-muted mb-1"><small>Cím: ${wp.address}</small></p>` : ''}
            ${wp.plannedArrival ? `<p class="text-muted mb-0"><small>Tervezett érkezés: ${new Date(wp.plannedArrival).toLocaleString('hu-HU')}</small></p>` : ''}
        </div>
    `).join('');

    document.getElementById('waypointsCard').style.display = 'block';

    // Add markers to map
    waypoints.forEach((wp, index) => {
        const marker = L.marker([wp.latitude, wp.longitude]).addTo(map);

        const popupContent = `
            <div class="popup-title">${index + 1}. ${wp.name}</div>
            <div class="popup-info">
                ${wp.description ? `<p>${wp.description}</p>` : ''}
                <p><strong>Típus:</strong> ${getWaypointTypeText(wp.type)}</p>
                ${wp.address ? `<p><strong>Cím:</strong> ${wp.address}</p>` : ''}
            </div>
        `;

        marker.bindPopup(popupContent);
        markers.push(marker);
    });

    // Fit map to show all markers
    if (markers.length > 0) {
        const group = L.featureGroup(markers);
        map.fitBounds(group.getBounds().pad(0.1));
    }
}

function clearMap() {
    markers.forEach(marker => map.removeLayer(marker));
    markers = [];

    // Clear routing
    if (routingControl) {
        map.removeControl(routingControl);
        routingControl = null;
    }
}

function addWaypointMode() {
    if (!currentTrip) {
        showError('Először válassz ki egy utazást!');
        return;
    }

    addingWaypoint = true;
    showInfo('Kattints a térképre az új állomás pozíciójának megjelöléséhez!');
}

function showAddWaypointModal(lat, lng) {
    document.getElementById('waypointLat').value = lat;
    document.getElementById('waypointLng').value = lng;

    const modal = new bootstrap.Modal(document.getElementById('addWaypointModal'));
    modal.show();
}

async function handleAddWaypoint(e) {
    e.preventDefault();

    if (!currentTrip) return;

    const name = document.getElementById('waypointName').value;
    const description = document.getElementById('waypointDescription').value;
    const type = parseInt(document.getElementById('waypointType').value);
    const address = document.getElementById('waypointAddress').value;
    const latitude = parseFloat(document.getElementById('waypointLat').value);
    const longitude = parseFloat(document.getElementById('waypointLng').value);
    const orderIndex = currentTrip.waypoints.length;

    try {
        const response = await fetch(`${API_URL}/trips/${currentTrip.id}/waypoints`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${currentUser.token}`
            },
            body: JSON.stringify({ name, description, type, address, latitude, longitude, orderIndex })
        });

        if (response.ok) {
            bootstrap.Modal.getInstance(document.getElementById('addWaypointModal')).hide();
            document.getElementById('addWaypointForm').reset();
            selectTrip(currentTrip.id);
            showSuccess('Állomás sikeresen hozzáadva!');
        } else {
            showError('Nem sikerült hozzáadni az állomást');
        }
    } catch (error) {
        showError('Hálózati hiba történt');
        console.error(error);
    }
}

// ========== Routing ==========

function updateRouting(waypoints) {
    // Clear existing routing
    if (routingControl) {
        map.removeControl(routingControl);
        routingControl = null;
    }

    // Need at least 2 waypoints for routing
    if (waypoints.length < 2) {
        return;
    }

    // Create waypoints for routing (max 25 waypoints for OSRM)
    const routeWaypoints = waypoints
        .slice(0, 25)
        .map(wp => L.latLng(wp.latitude, wp.longitude));

    routingControl = L.Routing.control({
        waypoints: routeWaypoints,
        routeWhileDragging: false,
        addWaypoints: false,
        draggableWaypoints: false,
        fitSelectedRoutes: false,
        showAlternatives: false,
        lineOptions: {
            styles: [{color: '#0d6efd', opacity: 0.8, weight: 5}]
        },
        createMarker: function() { return null; }, // Don't create default markers
        router: L.Routing.osrmv1({
            serviceUrl: 'https://router.project-osrm.org/route/v1'
        })
    }).addTo(map);

    routingControl.on('routesfound', function(e) {
        const routes = e.routes;
        const summary = routes[0].summary;

        console.log('Route found:', {
            distance: (summary.totalDistance / 1000).toFixed(2) + ' km',
            duration: Math.round(summary.totalTime / 60) + ' perc'
        });
    });
}

// ========== POI Search ==========

function togglePOISearch() {
    const panel = document.getElementById('poiSearchPanel');
    if (panel.style.display === 'none') {
        panel.style.display = 'block';
    } else {
        panel.style.display = 'none';
        clearPOIs();
    }
}

async function searchPOIs() {
    if (!map) return;

    const poiType = document.getElementById('poiType').value;
    const bounds = map.getBounds();

    clearPOIs();

    const overpassQuery = buildOverpassQuery(poiType, bounds);

    try {
        const response = await fetch('https://overpass-api.de/api/interpreter', {
            method: 'POST',
            body: overpassQuery
        });

        if (response.ok) {
            const data = await response.json();
            displayPOIResults(data.elements, poiType);
        } else {
            showError('POI keresés sikertelen');
        }
    } catch (error) {
        showError('POI keresés hiba történt');
        console.error(error);
    }
}

function buildOverpassQuery(poiType, bounds) {
    const south = bounds.getSouth();
    const west = bounds.getWest();
    const north = bounds.getNorth();
    const east = bounds.getEast();

    const typeMap = {
        'restaurant': 'amenity=restaurant',
        'theatre': 'amenity=theatre',
        'museum': 'tourism=museum',
        'attraction': 'tourism=attraction',
        'hotel': 'tourism=hotel',
        'cafe': 'amenity=cafe'
    };

    const osmTag = typeMap[poiType] || 'tourism=attraction';

    return `[out:json][timeout:25];
(
  node["${osmTag.split('=')[0]}"="${osmTag.split('=')[1]}"](${south},${west},${north},${east});
  way["${osmTag.split('=')[0]}"="${osmTag.split('=')[1]}"](${south},${west},${north},${east});
);
out center 100;`;
}

function displayPOIResults(pois, poiType) {
    const resultsDiv = document.getElementById('poiResults');

    if (pois.length === 0) {
        resultsDiv.innerHTML = '<p class="text-muted">Nincs találat</p>';
        return;
    }

    resultsDiv.innerHTML = `<p class="text-success">Találatok: ${pois.length}</p>`;

    // Add POI markers to map
    pois.forEach(poi => {
        const lat = poi.lat || (poi.center ? poi.center.lat : null);
        const lon = poi.lon || (poi.center ? poi.center.lon : null);

        if (!lat || !lon) return;

        const name = poi.tags?.name || 'Névtelen';

        // Create custom icon based on type
        const icon = L.divIcon({
            className: 'poi-marker',
            html: `<div style="background-color: #28a745; color: white; border-radius: 50%; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; border: 2px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3);">
                     <span style="font-size: 18px;">📍</span>
                   </div>`,
            iconSize: [30, 30]
        });

        const marker = L.marker([lat, lon], { icon }).addTo(map);

        const popupContent = `
            <div class="popup-title">${name}</div>
            <div class="popup-info">
                <p><strong>Típus:</strong> ${getPoiTypeText(poiType)}</p>
                ${poi.tags?.address ? `<p><strong>Cím:</strong> ${poi.tags.address}</p>` : ''}
                ${currentTrip ? `<button class="btn btn-sm btn-primary mt-2" onclick="addPOIAsWaypoint(${lat}, ${lon}, '${name.replace(/'/g, "\\'")}', '${poiType}')">Hozzáadás állomásként</button>` : ''}
            </div>
        `;

        marker.bindPopup(popupContent);
        poiMarkers.push(marker);
    });

    showSuccess(`${pois.length} POI megjelenítve a térképen`);
}

function clearPOIs() {
    poiMarkers.forEach(marker => map.removeLayer(marker));
    poiMarkers = [];
    document.getElementById('poiResults').innerHTML = '';
}

function getPoiTypeText(type) {
    const types = {
        'restaurant': 'Étterem',
        'theatre': 'Színház',
        'museum': 'Múzeum',
        'attraction': 'Látnivaló',
        'hotel': 'Szálló',
        'cafe': 'Kávézó'
    };
    return types[type] || 'Egyéb';
}

async function addPOIAsWaypoint(lat, lng, name, poiType) {
    if (!currentTrip) {
        showError('Nincs kiválasztott utazás!');
        return;
    }

    // Map POI type to waypoint type
    const typeMap = {
        'restaurant': 0, // Restaurant
        'cafe': 0,       // Restaurant
        'hotel': 1,      // Accommodation
        'attraction': 2, // Attraction
        'theatre': 2,    // Attraction
        'museum': 2      // Attraction
    };

    const waypointType = typeMap[poiType] || 5; // Default to Other
    const orderIndex = currentTrip.waypoints.length;

    try {
        const response = await fetch(`${API_URL}/trips/${currentTrip.id}/waypoints`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${currentUser.token}`
            },
            body: JSON.stringify({
                name,
                latitude: lat,
                longitude: lng,
                type: waypointType,
                orderIndex
            })
        });

        if (response.ok) {
            selectTrip(currentTrip.id);
            showSuccess(`${name} hozzáadva az úthoz!`);
        } else {
            showError('Nem sikerült hozzáadni az állomást');
        }
    } catch (error) {
        showError('Hálózati hiba történt');
        console.error(error);
    }
}

// ========== Invitation handlers ==========

async function checkInvitations() {
    if (!currentUser) return;

    try {
        const response = await fetch(`${API_URL}/invitations/my`, {
            headers: {
                'Authorization': `Bearer ${currentUser.token}`
            }
        });

        if (response.ok) {
            const invitations = await response.json();
            const badge = document.getElementById('invitationsBadge');

            if (invitations.length > 0) {
                badge.textContent = invitations.length;
                badge.style.display = 'inline';
            } else {
                badge.style.display = 'none';
            }
        }
    } catch (error) {
        console.error('Meghívások betöltése sikertelen:', error);
    }
}

async function loadMyInvitations() {
    if (!currentUser) return;

    const invitationsList = document.getElementById('invitationsList');
    invitationsList.innerHTML = '<p class="text-muted">Betöltés...</p>';

    try {
        const response = await fetch(`${API_URL}/invitations/my`, {
            headers: {
                'Authorization': `Bearer ${currentUser.token}`
            }
        });

        if (response.ok) {
            const invitations = await response.json();
            displayInvitations(invitations);
        } else {
            invitationsList.innerHTML = '<p class="text-danger">Hiba történt a betöltés során</p>';
        }
    } catch (error) {
        invitationsList.innerHTML = '<p class="text-danger">Hálózati hiba</p>';
        console.error(error);
    }
}

function displayInvitations(invitations) {
    const invitationsList = document.getElementById('invitationsList');

    if (invitations.length === 0) {
        invitationsList.innerHTML = '<p class="text-muted">Nincs meghívásod</p>';
        return;
    }

    invitationsList.innerHTML = invitations.map(inv => `
        <div class="card mb-3">
            <div class="card-body">
                <h5 class="card-title">${inv.tripTitle}</h5>
                <p class="card-text">
                    <strong>Meghívó:</strong> ${inv.invitedByName}<br>
                    <strong>Szerepkör:</strong> ${getParticipantRoleText(inv.role)}<br>
                    <strong>Dátum:</strong> ${new Date(inv.createdAt).toLocaleDateString('hu-HU')}<br>
                    ${inv.message ? `<strong>Üzenet:</strong> ${inv.message}<br>` : ''}
                </p>
                <div class="btn-group w-100">
                    <button class="btn btn-success" onclick="respondToInvitation(${inv.id}, 1)">Elfogadás</button>
                    <button class="btn btn-danger" onclick="respondToInvitation(${inv.id}, 2)">Elutasítás</button>
                </div>
            </div>
        </div>
    `).join('');
}

async function respondToInvitation(invitationId, status) {
    if (!currentUser) return;

    try {
        const response = await fetch(`${API_URL}/invitations/${invitationId}/respond`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${currentUser.token}`
            },
            body: JSON.stringify({ status })
        });

        if (response.ok) {
            const data = await response.json();
            showSuccess(data.message);
            loadMyInvitations();
            checkInvitations();
            loadTrips();
        } else {
            showError('Hiba történt a meghívó feldolgozása során');
        }
    } catch (error) {
        showError('Hálózati hiba történt');
        console.error(error);
    }
}

function showInviteModal() {
    if (!currentTrip) {
        showError('Nincs kiválasztott utazás!');
        return;
    }

    const modal = new bootstrap.Modal(document.getElementById('inviteModal'));
    modal.show();
}

async function handleInvite(e) {
    e.preventDefault();

    if (!currentTrip) return;

    const email = document.getElementById('inviteEmail').value;
    const role = parseInt(document.getElementById('inviteRole').value);
    const canEdit = document.getElementById('inviteCanEdit').checked;
    const message = document.getElementById('inviteMessage').value;

    try {
        const response = await fetch(`${API_URL}/invitations/trip/${currentTrip.id}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${currentUser.token}`
            },
            body: JSON.stringify({ invitedEmail: email, role, canEdit, message })
        });

        if (response.ok) {
            bootstrap.Modal.getInstance(document.getElementById('inviteModal')).hide();
            document.getElementById('inviteForm').reset();
            showSuccess('Meghívó sikeresen elküldve!');
        } else {
            const error = await response.json();
            showError(error.message || 'Nem sikerült elküldeni a meghívót');
        }
    } catch (error) {
        showError('Hálózati hiba történt');
        console.error(error);
    }
}

function getParticipantRoleText(role) {
    const roles = {
        0: 'Tulajdonos',
        1: 'Szervező',
        2: 'Résztvevő'
    };
    return roles[role] || 'Ismeretlen';
}

// ========== Export & Compare ==========

async function exportToPdf() {
    if (!currentTrip) return;

    try {
        const response = await fetch(`${API_URL}/trips/${currentTrip.id}/export/pdf`, {
            headers: {
                'Authorization': `Bearer ${currentUser.token}`
            }
        });

        if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Trip_${currentTrip.title}_${new Date().toISOString().split('T')[0]}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            showSuccess('PDF sikeresen letöltve!');
        } else {
            showError('Nem sikerült exportálni a PDF-et');
        }
    } catch (error) {
        showError('Hálózati hiba történt');
        console.error(error);
    }
}

async function compareTrip() {
    if (!currentTrip) return;

    try {
        const response = await fetch(`${API_URL}/trips/${currentTrip.id}/compare`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${currentUser.token}`
            }
        });

        if (response.ok) {
            selectTrip(currentTrip.id);
            showSuccess('Összehasonlítás elkészítve!');
        } else {
            showError('Nem sikerült létrehozni az összehasonlítást');
        }
    } catch (error) {
        showError('Hálózati hiba történt');
        console.error(error);
    }
}

// ========== Helper functions ==========

function getTripStatusText(status) {
    const statuses = {
        0: 'Tervezés',
        1: 'Jóváhagyott',
        2: 'Folyamatban',
        3: 'Befejezett',
        4: 'Törölt'
    };
    return statuses[status] || 'Ismeretlen';
}

function getTripStatusColor(status) {
    const colors = {
        0: 'secondary',
        1: 'info',
        2: 'primary',
        3: 'success',
        4: 'danger'
    };
    return colors[status] || 'secondary';
}

function getWaypointTypeText(type) {
    const types = {
        0: 'Étterem',
        1: 'Szállás',
        2: 'Látnivaló',
        3: 'Benzinkút',
        4: 'Parkoló',
        5: 'Egyéb'
    };
    return types[type] || 'Egyéb';
}

function getWaypointTypeColor(type) {
    const colors = {
        0: 'warning',
        1: 'info',
        2: 'primary',
        3: 'danger',
        4: 'secondary',
        5: 'dark'
    };
    return colors[type] || 'secondary';
}

// Notification helpers
function showSuccess(message) {
    alert(message);
}

function showError(message) {
    alert('Hiba: ' + message);
}

function showInfo(message) {
    alert(message);
}

