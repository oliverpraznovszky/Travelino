import React, { useState } from 'react';
import api from '../services/api';

function AddWaypointModal({ trip, onWaypointAdded, prefilledData }) {
  const [formData, setFormData] = useState({
    name: prefilledData?.name || '',
    description: prefilledData?.description || '',
    latitude: prefilledData?.latitude || '',
    longitude: prefilledData?.longitude || '',
    address: prefilledData?.address || '',
    type: 0,
    plannedArrival: '',
    notes: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    const modalEl = document.getElementById('addWaypointModal');

    if (prefilledData && modalEl) {
      setFormData({
        name: prefilledData.name || '',
        description: prefilledData.description || '',
        latitude: prefilledData.latitude || '',
        longitude: prefilledData.longitude || '',
        address: prefilledData.address || '',
        type: 0,
        plannedArrival: '',
        notes: '',
      });

      // Show the modal when prefilled data is provided
      // Check if modal instance already exists
      let modal = window.bootstrap.Modal.getInstance(modalEl);
      if (!modal) {
        modal = new window.bootstrap.Modal(modalEl);
      }
      modal.show();

      // Clear prefilled data when modal is closed
      const handleHidden = () => {
        setFormData({
          name: '',
          description: '',
          latitude: '',
          longitude: '',
          address: '',
          type: 0,
          plannedArrival: '',
          notes: '',
        });
        setError('');
      };

      modalEl.addEventListener('hidden.bs.modal', handleHidden);
      return () => {
        modalEl.removeEventListener('hidden.bs.modal', handleHidden);
      };
    }
  }, [prefilledData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const waypointData = {
        ...formData,
        latitude: parseFloat(formData.latitude),
        longitude: parseFloat(formData.longitude),
        type: parseInt(formData.type),
      };

      await api.createWaypoint(trip.id, waypointData);
      const modal = window.bootstrap.Modal.getInstance(
        document.getElementById('addWaypointModal')
      );
      modal.hide();
      setFormData({
        name: '',
        description: '',
        latitude: '',
        longitude: '',
        address: '',
        type: 0,
        plannedArrival: '',
        notes: '',
      });
      onWaypointAdded();
      alert('Állomás sikeresen hozzáadva!');
    } catch (err) {
      setError(err.message || 'Nem sikerült hozzáadni az állomást');
    } finally {
      setLoading(false);
    }
  };

  if (!trip) return null;

  return (
    <div className="modal fade" id="addWaypointModal" tabIndex="-1">
      <div className="modal-dialog">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Állomás hozzáadása</h5>
            <button type="button" className="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div className="modal-body">
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label">Név *</label>
                <input
                  type="text"
                  className="form-control"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="mb-3">
                <label className="form-label">Leírás</label>
                <textarea
                  className="form-control"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows="2"
                ></textarea>
              </div>
              <div className="row">
                <div className="col-md-6 mb-3">
                  <label className="form-label">Szélesség (Latitude) *</label>
                  <input
                    type="number"
                    step="any"
                    className="form-control"
                    name="latitude"
                    value={formData.latitude}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="col-md-6 mb-3">
                  <label className="form-label">Hosszúság (Longitude) *</label>
                  <input
                    type="number"
                    step="any"
                    className="form-control"
                    name="longitude"
                    value={formData.longitude}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
              <div className="mb-3">
                <label className="form-label">Cím</label>
                <input
                  type="text"
                  className="form-control"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                />
              </div>
              <div className="mb-3">
                <label className="form-label">Típus</label>
                <select
                  className="form-select"
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                >
                  <option value="0">Étterem</option>
                  <option value="1">Szállás</option>
                  <option value="2">Látnivaló</option>
                  <option value="3">Benzinkút</option>
                  <option value="4">Parkoló</option>
                  <option value="5">Egyéb</option>
                </select>
              </div>
              <div className="mb-3">
                <label className="form-label">Tervezett érkezés</label>
                <input
                  type="datetime-local"
                  className="form-control"
                  name="plannedArrival"
                  value={formData.plannedArrival}
                  onChange={handleChange}
                />
              </div>
              <div className="mb-3">
                <label className="form-label">Megjegyzés</label>
                <textarea
                  className="form-control"
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows="2"
                ></textarea>
              </div>
              {error && <div className="alert alert-danger">{error}</div>}
              <button type="submit" className="btn btn-primary w-100" disabled={loading}>
                {loading ? 'Hozzáadás...' : 'Hozzáadás'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AddWaypointModal;
