import React, { useState } from 'react';
import api from '../services/api';

function InviteModal({ trip, onInviteSent }) {
  const [formData, setFormData] = useState({
    invitedEmail: '',
    role: 'Viewer',
    message: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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
      await api.createInvitation(trip.id, formData);

      // Close modal
      const modal = window.bootstrap.Modal.getInstance(
        document.getElementById('inviteModal')
      );
      modal.hide();

      // Reset form
      setFormData({
        invitedEmail: '',
        role: 'Viewer',
        message: '',
      });

      if (onInviteSent) {
        onInviteSent();
      }

      alert('Meghívó sikeresen elküldve!');
    } catch (err) {
      setError(err.message || 'Nem sikerült elküldeni a meghívót');
    } finally {
      setLoading(false);
    }
  };

  if (!trip) return null;

  return (
    <div className="modal fade" id="inviteModal" tabIndex="-1">
      <div className="modal-dialog">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Meghívás küldése</h5>
            <button type="button" className="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div className="modal-body">
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label">Email cím *</label>
                <input
                  type="email"
                  className="form-control"
                  name="invitedEmail"
                  value={formData.invitedEmail}
                  onChange={handleChange}
                  required
                  placeholder="pelda@email.com"
                />
                <small className="text-muted">
                  Add meg annak a felhasználónak az email címét, akit meg szeretnél hívni
                </small>
              </div>
              <div className="mb-3">
                <label className="form-label">Szerepkör *</label>
                <select
                  className="form-select"
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  required
                >
                  <option value="Viewer">Néző - Csak megtekintés</option>
                  <option value="Editor">Szerkesztő - Szerkesztheti az utazást</option>
                </select>
              </div>
              <div className="mb-3">
                <label className="form-label">Üzenet (opcionális)</label>
                <textarea
                  className="form-control"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  rows="3"
                  placeholder="Adj hozzá egy személyes üzenetet a meghívóhoz..."
                ></textarea>
              </div>
              {error && <div className="alert alert-danger">{error}</div>}
              <button type="submit" className="btn btn-primary w-100" disabled={loading}>
                {loading ? 'Küldés...' : 'Meghívó küldése'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default InviteModal;
