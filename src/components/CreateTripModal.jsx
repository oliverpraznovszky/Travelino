import React, { useState } from 'react';
import api from '../services/api';

function CreateTripModal({ onTripCreated }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    isPublic: false,
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await api.createTrip(formData);
      const modal = bootstrap.Modal.getInstance(document.getElementById('createTripModal'));
      modal.hide();
      setFormData({ title: '', description: '', startDate: '', endDate: '', isPublic: false });
      onTripCreated();
      alert('Utazás sikeresen létrehozva!');
    } catch (err) {
      setError(err.message || 'Nem sikerült létrehozni az utazást');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal fade" id="createTripModal" tabIndex="-1">
      <div className="modal-dialog">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Új utazás létrehozása</h5>
            <button type="button" className="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div className="modal-body">
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label">Cím</label>
                <input
                  type="text"
                  className="form-control"
                  name="title"
                  value={formData.title}
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
                  rows="3"
                ></textarea>
              </div>
              <div className="mb-3">
                <label className="form-label">Kezdés dátuma</label>
                <input
                  type="date"
                  className="form-control"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="mb-3">
                <label className="form-label">Befejezés dátuma</label>
                <input
                  type="date"
                  className="form-control"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="mb-3 form-check">
                <input
                  type="checkbox"
                  className="form-check-input"
                  name="isPublic"
                  id="isPublic"
                  checked={formData.isPublic}
                  onChange={handleChange}
                />
                <label className="form-check-label" htmlFor="isPublic">
                  Nyilvános utazás
                </label>
              </div>
              {error && <div className="alert alert-danger">{error}</div>}
              <button type="submit" className="btn btn-primary w-100" disabled={loading}>
                {loading ? 'Létrehozás...' : 'Létrehozás'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CreateTripModal;
