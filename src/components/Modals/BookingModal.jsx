import React, { useState } from 'react';
import Modal from 'react-modal';

const customStyles = {
  overlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    zIndex: 1000,
  },
  content: {
    top: '50%',
    left: '50%',
    right: 'auto',
    bottom: 'auto',
    marginRight: '-50%',
    transform: 'translate(-50%, -50%)',
    backgroundColor: '#f8f9fa',
    border: 'none',
    padding: '0',
    width: '400px',
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
    borderRadius: '8px',
    zIndex: 1001,
  },
};

const BookingModal = ({ isOpen, onClose, onSave, initialTitle, initialRoom }) => {
  const [title, setTitle] = useState(initialTitle || '');
  const [roomNumber, setRoomNumber] = useState(initialRoom || '');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(title, roomNumber);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      contentLabel="Booking Modal"
      style={customStyles}
    >
      <div className="card">
        <div className="card-header">
          <h5 className="card-title">
            {initialTitle ? 'Edit Booking' : 'New Booking'}
          </h5>
        </div>
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Booking Details:</label>
              <input
                type="text"
                className="form-control"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
            <div className="form-group mt-3">
              <label>Room Number:</label>
              <input
                type="text"
                className="form-control"
                value={roomNumber}
                onChange={(e) => setRoomNumber(e.target.value)}
                required
              />
            </div>
            <div className="form-group mt-3">
              <button
                type="button"
                className="btn btn-secondary me-2"
                onClick={onClose}
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                Save
              </button>
            </div>
          </form>
        </div>
      </div>
    </Modal>
  );
};

export default BookingModal;
