// In development, use Vite proxy (/api -> https://localhost:7000/api)
// In production, use relative path
const API_URL = import.meta.env.DEV ? '/api' : '/api';


class ApiService {
  constructor() {
    this.token = localStorage.getItem('token');
  }

  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
  }

  getHeaders(includeAuth = true) {
    const headers = {
      'Content-Type': 'application/json',
    };

    if (includeAuth && this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    return headers;
  }

  async request(url, options = {}) {
    const response = await fetch(`${API_URL}${url}`, {
      ...options,
      headers: {
        ...this.getHeaders(options.auth !== false),
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' }));
      throw new Error(error.message || `HTTP error! status: ${response.status}`);
    }

    return response;
  }

  // Auth
  async login(email, password) {
    const response = await this.request('/auth/login', {
      method: 'POST',
      auth: false,
      body: JSON.stringify({ email, password }),
    });
    return response.json();
  }

  async register(firstName, lastName, email, password) {
    const response = await this.request('/auth/register', {
      method: 'POST',
      auth: false,
      body: JSON.stringify({ firstName, lastName, email, password }),
    });
    return response.json();
  }

  // Trips
  async getTrips() {
    const response = await this.request('/trips');
    return response.json();
  }

  async getTrip(id) {
    const response = await this.request(`/trips/${id}`);
    return response.json();
  }

  async createTrip(trip) {
    const response = await this.request('/trips', {
      method: 'POST',
      body: JSON.stringify(trip),
    });
    return response.json();
  }

  async updateTrip(id, trip) {
    const response = await this.request(`/trips/${id}`, {
      method: 'PUT',
      body: JSON.stringify(trip),
    });
    return response;
  }

  async deleteTrip(id) {
    const response = await this.request(`/trips/${id}`, {
      method: 'DELETE',
    });
    return response;
  }

  async exportTripPdf(id) {
    const response = await this.request(`/trips/${id}/export/pdf`);
    return response.blob();
  }

  // Waypoints
  async createWaypoint(tripId, waypoint) {
    const response = await this.request(`/trips/${tripId}/waypoints`, {
      method: 'POST',
      body: JSON.stringify(waypoint),
    });
    return response.json();
  }

  async deleteWaypoint(tripId, waypointId) {
    const response = await this.request(`/trips/${tripId}/waypoints/${waypointId}`, {
      method: 'DELETE',
    });
    return response;
  }

  // Invitations
  async getMyInvitations() {
    const response = await this.request('/invitations/my');
    return response.json();
  }

  async createInvitation(tripId, invitation) {
    const response = await this.request(`/invitations/trip/${tripId}`, {
      method: 'POST',
      body: JSON.stringify(invitation),
    });
    return response.json();
  }

  async respondToInvitation(invitationId, status) {
    const response = await this.request(`/invitations/${invitationId}/respond`, {
      method: 'POST',
      body: JSON.stringify({ status }),
    });
    return response.json();
  }

  // Admin
  async getAllUsers() {
    const response = await this.request('/admin/users');
    return response.json();
  }

  async deleteUser(userId) {
    const response = await this.request(`/admin/users/${userId}`, {
      method: 'DELETE',
    });
    return response.json();
  }

  async updateUserRole(userId, role) {
    const response = await this.request(`/admin/users/${userId}/role`, {
      method: 'PUT',
      body: JSON.stringify({ role }),
    });
    return response.json();
  }

  async getAllTripsAdmin() {
    const response = await this.request('/admin/trips');
    return response.json();
  }

  async deleteTripAdmin(tripId) {
    const response = await this.request(`/admin/trips/${tripId}`, {
      method: 'DELETE',
    });
    return response.json();
  }
}

export default new ApiService();
