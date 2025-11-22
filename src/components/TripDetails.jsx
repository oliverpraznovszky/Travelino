import React from 'react';
import api from '../services/api';

function TripDetails({ trip, onTripUpdate }) {
  const getTripStatusText = (status) => {
    const statuses = { 0: 'Tervezés', 1: 'Szervezés', 2: 'Kész' };
    return statuses[status] || 'Ismeretlen';
  };

  const getTripStatusColor = (status) => {
    const colors = { 0: 'secondary', 1: 'info', 2: 'success' };
    return colors[status] || 'secondary';
  };

  const handleExportPdf = async () => {
    try {
      const blob = await api.exportTripPdf(trip.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Trip_${trip.title}_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      alert('PDF sikeresen letöltve!');
    } catch (error) {
      alert('Nem sikerült exportálni a PDF-et');
    }
  };

  return (
    <div className="card mt-3">
      <div className="card-header bg-info text-white">
        <h5 className="mb-0">Utazás részletei</h5>
      </div>
      <div className="card-body">
        <h5>{trip.title}</h5>
        <p>{trip.description || 'Nincs leírás'}</p>
        <p>
          <strong>Időpont:</strong>{' '}
          {new Date(trip.startDate).toLocaleDateString('hu-HU')} -{' '}
          {new Date(trip.endDate).toLocaleDateString('hu-HU')}
        </p>
        <p>
          <strong>Státusz:</strong>{' '}
          <span className={`badge bg-${getTripStatusColor(trip.status)}`}>
            {getTripStatusText(trip.status)}
          </span>
        </p>
        <p>
          <strong>Résztvevők:</strong> {trip.participants?.length || 0}
        </p>

        <div className="mt-3">
          <button className="btn btn-primary me-2" onClick={handleExportPdf}>
            <i className="bi bi-file-pdf"></i> PDF Export
          </button>
          <button
            className="btn btn-success me-2"
            data-bs-toggle="modal"
            data-bs-target="#inviteModal"
          >
            <i className="bi bi-person-plus"></i> Meghívás
          </button>
        </div>

        {trip.waypoints && trip.waypoints.length > 0 && (
          <div className="mt-3">
            <h6>Állomások ({trip.waypoints.length})</h6>
            <ul className="list-group">
              {trip.waypoints
                .sort((a, b) => a.orderIndex - b.orderIndex)
                .map((waypoint, index) => (
                  <li key={waypoint.id} className="list-group-item">
                    <strong>
                      {index + 1}. {waypoint.name}
                    </strong>
                    {waypoint.description && (
                      <p className="mb-0 small text-muted">{waypoint.description}</p>
                    )}
                  </li>
                ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

export default TripDetails;
