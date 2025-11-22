import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

function AdminPage() {
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await api.getAllUsers();
      setUsers(data);
    } catch (error) {
      console.error('Failed to load users:', error);
      alert('Nem sikerült betölteni a felhasználókat');
    } finally {
      setLoading(false);
    }
  };

  const loadTrips = async () => {
    setLoading(true);
    try {
      const data = await api.getAllTripsAdmin();
      setTrips(data);
    } catch (error) {
      console.error('Failed to load trips:', error);
      alert('Nem sikerült betölteni az utazásokat');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'trips' && trips.length === 0) {
      loadTrips();
    }
  };

  const handleDeleteUser = async (userId, email) => {
    if (!window.confirm(`Biztosan törölni szeretnéd a következő felhasználót?\n\n${email}`)) {
      return;
    }

    try {
      await api.deleteUser(userId);
      alert('Felhasználó sikeresen törölve!');
      loadUsers();
    } catch (error) {
      alert(error.message || 'Nem sikerült törölni a felhasználót');
    }
  };

  const handleChangeRole = async (userId, email) => {
    const role = window.prompt(
      `Válassz szerepkört a ${email} felhasználónak:\n\nAdmin - Adminisztrátor\nUser - Sima felhasználó\n\nÍrd be a szerepkört (Admin vagy User):`
    );

    if (!role) return;

    if (role !== 'Admin' && role !== 'User') {
      alert('Érvénytelen szerepkör! Csak "Admin" vagy "User" lehet.');
      return;
    }

    try {
      await api.updateUserRole(userId, role);
      alert('Szerepkör sikeresen frissítve!');
      loadUsers();
    } catch (error) {
      alert(error.message || 'Nem sikerült frissíteni a szerepkört');
    }
  };

  const handleDeleteTrip = async (tripId, title) => {
    if (!window.confirm(`Biztosan törölni szeretnéd a következő utazást?\n\n"${title}"`)) {
      return;
    }

    try {
      await api.deleteTripAdmin(tripId);
      alert('Utazás sikeresen törölve!');
      loadTrips();
    } catch (error) {
      alert(error.message || 'Nem sikerült törölni az utazást');
    }
  };

  const getTripStatusText = (status) => {
    const statuses = { 0: 'Tervezés', 1: 'Szervezés', 2: 'Kész' };
    return statuses[status] || 'Ismeretlen';
  };

  const getTripStatusColor = (status) => {
    const colors = { 0: 'secondary', 1: 'info', 2: 'success' };
    return colors[status] || 'secondary';
  };

  return (
    <div className="container-fluid py-4">
      <div className="row mb-3">
        <div className="col">
          <div className="d-flex justify-content-between align-items-center">
            <h2>
              <i className="bi bi-shield-fill text-warning"></i> Admin Felület
            </h2>
            <button onClick={() => navigate('/')} className="btn btn-outline-primary">
              <i className="bi bi-arrow-left"></i> Vissza a főoldalra
            </button>
          </div>
        </div>
      </div>

      <div className="row">
        <div className="col">
          <div className="card">
            <div className="card-body">
              <ul className="nav nav-tabs mb-3">
                <li className="nav-item">
                  <button
                    className={`nav-link ${activeTab === 'users' ? 'active' : ''}`}
                    onClick={() => handleTabChange('users')}
                  >
                    Felhasználók kezelése
                  </button>
                </li>
                <li className="nav-item">
                  <button
                    className={`nav-link ${activeTab === 'trips' ? 'active' : ''}`}
                    onClick={() => handleTabChange('trips')}
                  >
                    Utazások kezelése
                  </button>
                </li>
              </ul>

              {loading ? (
                <div className="text-center py-5">Töltés...</div>
              ) : (
                <>
                  {activeTab === 'users' && (
                    <div className="table-responsive">
                      <table className="table table-striped">
                        <thead>
                          <tr>
                            <th>Email</th>
                            <th>Név</th>
                            <th>Szerepkörök</th>
                            <th>Műveletek</th>
                          </tr>
                        </thead>
                        <tbody>
                          {users.map((user) => (
                            <tr key={user.id}>
                              <td>{user.email}</td>
                              <td>
                                {user.firstName} {user.lastName}
                              </td>
                              <td>
                                {user.roles.length > 0 ? (
                                  user.roles.map((role) => (
                                    <span key={role} className="badge bg-primary me-1">
                                      {role}
                                    </span>
                                  ))
                                ) : (
                                  <span className="badge bg-secondary">User</span>
                                )}
                              </td>
                              <td>
                                <button
                                  className="btn btn-sm btn-warning me-2"
                                  onClick={() => handleChangeRole(user.id, user.email)}
                                >
                                  <i className="bi bi-pencil"></i> Szerepkör
                                </button>
                                <button
                                  className="btn btn-sm btn-danger"
                                  onClick={() => handleDeleteUser(user.id, user.email)}
                                >
                                  <i className="bi bi-trash"></i> Törlés
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {activeTab === 'trips' && (
                    <div className="table-responsive">
                      <table className="table table-striped">
                        <thead>
                          <tr>
                            <th>Cím</th>
                            <th>Létrehozó</th>
                            <th>Dátum</th>
                            <th>Státusz</th>
                            <th>Műveletek</th>
                          </tr>
                        </thead>
                        <tbody>
                          {trips.map((trip) => (
                            <tr key={trip.id}>
                              <td>{trip.title}</td>
                              <td>
                                {trip.createdBy}
                                <br />
                                <small className="text-muted">{trip.createdByEmail}</small>
                              </td>
                              <td>
                                {new Date(trip.startDate).toLocaleDateString('hu-HU')} -{' '}
                                {new Date(trip.endDate).toLocaleDateString('hu-HU')}
                              </td>
                              <td>
                                <span className={`badge bg-${getTripStatusColor(trip.status)}`}>
                                  {getTripStatusText(trip.status)}
                                </span>
                              </td>
                              <td>
                                <button
                                  className="btn btn-sm btn-danger"
                                  onClick={() => handleDeleteTrip(trip.id, trip.title)}
                                >
                                  <i className="bi bi-trash"></i> Törlés
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminPage;
