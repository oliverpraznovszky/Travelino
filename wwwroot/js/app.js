// API Base URL
const API_URL = window.location.origin + '/api';

// Global state
let currentUser = null;
let currentTrip = null;
let map = null;
let markers = [];
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
}

// Authentication handlers
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
    document.getElementById('tripsList').innerHTML = '<p class="text-muted">Nincs megjeleníthető utazás</p>';
    document.getElementById('tripDetailsCard').style.display = 'none';
    document.getElementById('waypointsCard').style.display = 'none';
}

// Trip handlers
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
            document.getElementById('exportPdfBtn').disabled = false;
            document.getElementById('compareTripBtn').disabled = false;

            // Highlight selected trip
            document.querySelectorAll('#tripsList .list-group-item').forEach(item => {
                item.classList.remove('active');
            });
            event.target.closest('.list-group-item').classList.add('active');
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
}

// Waypoint handlers
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

// Export to PDF
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

// Compare trip
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
            const data = await response.json();
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

// Helper functions
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
