import React from 'react';

function TripsList({ trips, selectedTripId, onSelectTrip }) {
  const getTripStatusText = (status) => {
    const statuses = { 0: 'Tervezés', 1: 'Szervezés', 2: 'Kész' };
    return statuses[status] || 'Ismeretlen';
  };

  if (trips.length === 0) {
    return (
      <div className="card">
        <div className="card-body">
          <p className="text-muted text-center">Nincs még utazásod. Hozz létre egyet!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card mb-3">
      <div className="card-header bg-primary text-white">
        <h5 className="mb-0">Utazásaim</h5>
      </div>
      <div className="list-group list-group-flush">
        {trips.map((trip) => (
          <div
            key={trip.id}
            className={`list-group-item list-group-item-action ${
              selectedTripId === trip.id ? 'active' : ''
            }`}
            style={{ cursor: 'pointer' }}
            onClick={() => onSelectTrip(trip.id)}
          >
            <div className="d-flex w-100 justify-content-between align-items-start">
              <div className="flex-grow-1">
                <h6 className="mb-1">{trip.title}</h6>
                <p className="mb-1 text-truncate small">{trip.description || ''}</p>
                <small>
                  Státusz: {getTripStatusText(trip.status)} |{' '}
                  {new Date(trip.startDate).toLocaleDateString('hu-HU')}
                </small>
              </div>
              <div>
                <button
                  className="btn btn-sm btn-outline-primary"
                  data-bs-toggle="modal"
                  data-bs-target="#editTripModal"
                  onClick={(e) => e.stopPropagation()}
                >
                  <i className="bi bi-pencil"></i>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default TripsList;
