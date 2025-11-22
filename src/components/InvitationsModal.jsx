import React, { useState, useEffect } from 'react';
import api from '../services/api';

function InvitationsModal() {
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadInvitations = async () => {
    setLoading(true);
    try {
      const data = await api.getMyInvitations();
      setInvitations(data);
    } catch (error) {
      console.error('Failed to load invitations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRespond = async (invitationId, status) => {
    try {
      await api.respondToInvitation(invitationId, status);
      alert(status === 1 ? 'Meghívó elfogadva!' : 'Meghívó elutasítva!');
      loadInvitations();
    } catch (error) {
      alert('Hiba történt a válaszadás során');
    }
  };

  return (
    <div className="modal fade" id="invitationsModal" tabIndex="-1">
      <div className="modal-dialog modal-lg">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Meghívások</h5>
            <button type="button" className="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div className="modal-body">
            <button className="btn btn-primary mb-3" onClick={loadInvitations}>
              <i className="bi bi-arrow-clockwise"></i> Frissítés
            </button>

            {loading ? (
              <div className="text-center">Töltés...</div>
            ) : invitations.length === 0 ? (
              <p className="text-muted text-center">Nincs függőben lévő meghívód</p>
            ) : (
              <div className="list-group">
                {invitations.map((invitation) => (
                  <div key={invitation.id} className="list-group-item">
                    <div className="d-flex w-100 justify-content-between align-items-start">
                      <div>
                        <h6 className="mb-1">{invitation.tripTitle}</h6>
                        <p className="mb-1">
                          <small>
                            Meghívó: {invitation.invitedByName} | Szerepkör: {invitation.role}
                          </small>
                        </p>
                        {invitation.message && (
                          <p className="mb-1 small text-muted">{invitation.message}</p>
                        )}
                      </div>
                      <div className="d-flex gap-2">
                        <button
                          className="btn btn-sm btn-success"
                          onClick={() => handleRespond(invitation.id, 1)}
                        >
                          Elfogad
                        </button>
                        <button
                          className="btn btn-sm btn-danger"
                          onClick={() => handleRespond(invitation.id, 2)}
                        >
                          Elutasít
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default InvitationsModal;
