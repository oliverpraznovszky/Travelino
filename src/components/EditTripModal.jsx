import React, { useState, useEffect } from 'react';
import api from '../services/api';

function EditTripModal({ trip, onTripUpdated }) {
  const [status, setStatus] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (trip) {
      setStatus(trip.status);
    }
  }, [trip]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await api.updateTrip(trip.id, { status: parseInt(status) });
      const modal = bootstrap.Modal.getInstance(document.getElementById('editTripModal'));
      modal.hide();
      onTripUpdated();
      alert('Utazás sikeresen frissítve!');
    } catch (error) {
      alert('Nem sikerült frissíteni az utazást');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Biztosan törölni szeretnéd ezt az utazást?')) {
      return;
    }

    try {
      await api.deleteTrip(trip.id);
      const modal = bootstrap.Modal.getInstance(document.getElementById('editTripModal'));
      modal.hide();
      onTripUpdated();
      alert('Utazás sikeresen törölve!');
    } catch (error) {
      alert('Nem sikerült törölni az utazást');
    }
  };

  if (!trip) return null;

  return (
    <div className="modal fade" id="editTripModal" tabIndex="-1">
      <div className="modal-dialog">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Utazás szerkesztése</h5>
            <button type="button" className="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div className="modal-body">
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label">Utazás címe</label>
                <input type="text" className="form-control" value={trip.title} readOnly />
              </div>
              <div className="mb-3">
                <label className="form-label">Státusz</label>
                <select
                  className="form-select"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  required
                >
                  <option value="0">Tervezés</option>
                  <option value="1">Szervezés</option>
                  <option value="2">Kész</option>
                </select>
              </div>
              <div className="d-flex gap-2">
                <button type="submit" className="btn btn-primary flex-grow-1" disabled={loading}>
                  {loading ? 'Mentés...' : 'Mentés'}
                </button>
                <button type="button" className="btn btn-danger" onClick={handleDelete}>
                  Törlés
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EditTripModal;
