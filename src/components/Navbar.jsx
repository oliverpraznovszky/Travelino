import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

function Navbar() {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [invitationsCount, setInvitationsCount] = useState(0);

  useEffect(() => {
    if (user) {
      checkInvitations();
      const interval = setInterval(checkInvitations, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const checkInvitations = async () => {
    try {
      const invitations = await api.getMyInvitations();
      setInvitationsCount(invitations.length);
    } catch (error) {
      console.error('Failed to load invitations:', error);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-primary">
      <div className="container-fluid">
        <Link className="navbar-brand" to="/">
          Travelino
        </Link>

        {user && (
          <div className="navbar-nav ms-auto d-flex flex-row align-items-center gap-2">
            {isAdmin() && (
              <Link to="/admin" className="btn btn-outline-warning btn-sm">
                <i className="bi bi-shield-fill"></i> Admin felület
              </Link>
            )}

            <button
              className="btn btn-outline-light btn-sm position-relative"
              data-bs-toggle="modal"
              data-bs-target="#invitationsModal"
            >
              Meghívások
              {invitationsCount > 0 && (
                <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                  {invitationsCount}
                </span>
              )}
            </button>

            <span className="navbar-text text-white me-3">{user.name}</span>

            <button onClick={handleLogout} className="btn btn-outline-light btn-sm">
              Kijelentkezés
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
