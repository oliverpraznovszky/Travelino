import React, { useState, useEffect } from 'react';
import MapPanel from '../components/MapPanel';
import TripsList from '../components/TripsList';
import TripDetails from '../components/TripDetails';
import CreateTripModal from '../components/CreateTripModal';
import EditTripModal from '../components/EditTripModal';
import InvitationsModal from '../components/InvitationsModal';
import InviteModal from '../components/InviteModal';
import AddWaypointModal from '../components/AddWaypointModal';
import api from '../services/api';

function MainPage() {
  const [trips, setTrips] = useState([]);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [waypointModalData, setWaypointModalData] = useState(null);

  useEffect(() => {
    loadTrips();
  }, []);

  const loadTrips = async () => {
    try {
      const data = await api.getTrips();
      setTrips(data);
    } catch (error) {
      console.error('Failed to load trips:', error);
      alert('Nem sikerült betölteni az utazásokat');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectTrip = async (tripId) => {
    try {
      const trip = await api.getTrip(tripId);
      setSelectedTrip(trip);
    } catch (error) {
      console.error('Failed to load trip:', error);
      alert('Nem sikerült betölteni az utazást');
    }
  };

  const handleTripCreated = () => {
    loadTrips();
  };

  const handleTripUpdated = () => {
    loadTrips();
    if (selectedTrip) {
      handleSelectTrip(selectedTrip.id);
    }
  };

  const handleTripDeleted = () => {
    setSelectedTrip(null);
    loadTrips();
  };

  const handleDeleteWaypoint = async (tripId, waypointId) => {
    if (!confirm('Biztosan törölni szeretnéd ezt az állomást?')) {
      return;
    }
    try {
      await api.deleteWaypoint(tripId, waypointId);
      handleTripUpdated();
    } catch (error) {
      console.error('Failed to delete waypoint:', error);
      alert('Nem sikerült törölni az állomást');
    }
  };

  // Make delete function globally available for Leaflet popup buttons
  useEffect(() => {
    window.deleteWaypoint = handleDeleteWaypoint;
    return () => {
      delete window.deleteWaypoint;
    };
  }, [selectedTrip]);

  return (
    <>
      <div className="main-layout">
        {/* Bal oldal - Térkép */}
        <div className="map-panel">
          <MapPanel
            trip={selectedTrip}
            onTripUpdate={handleTripUpdated}
            onWaypointModalOpen={setWaypointModalData}
            onDeleteWaypoint={handleDeleteWaypoint}
          />
        </div>

        {/* Jobb oldal - Tartalom */}
        <div className="content-panel">
          <div className="mb-3">
            <button
              className="btn btn-success w-100"
              data-bs-toggle="modal"
              data-bs-target="#createTripModal"
            >
              <i className="bi bi-plus-circle"></i> Új utazás létrehozása
            </button>
          </div>

          {loading ? (
            <div className="text-center">Töltés...</div>
          ) : (
            <>
              <TripsList
                trips={trips}
                selectedTripId={selectedTrip?.id}
                onSelectTrip={handleSelectTrip}
              />

              {selectedTrip && (
                <TripDetails
                  trip={selectedTrip}
                  onTripUpdate={handleTripUpdated}
                  onTripDelete={handleTripDeleted}
                />
              )}
            </>
          )}
        </div>
      </div>

      {/* Modals */}
      <CreateTripModal onTripCreated={handleTripCreated} />
      {selectedTrip && (
        <>
          <EditTripModal trip={selectedTrip} onTripUpdated={handleTripUpdated} />
          <InviteModal trip={selectedTrip} onInviteSent={handleTripUpdated} />
        </>
      )}
      <InvitationsModal />
      {selectedTrip && waypointModalData && (
        <AddWaypointModal
          trip={selectedTrip}
          onWaypointAdded={() => {
            setWaypointModalData(null);
            handleTripUpdated();
          }}
          prefilledData={waypointModalData}
        />
      )}
    </>
  );
}

export default MainPage;
