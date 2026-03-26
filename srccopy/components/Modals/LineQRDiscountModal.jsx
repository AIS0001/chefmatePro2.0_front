import React from "react";
import Modal from "react-modal";
import { FaTimes } from "react-icons/fa";

const customStyles = {
  content: {
    top: "35%",
    left: "50%",
    right: "auto",
    bottom: "auto",
    transform: "translate(-50%, -50%)",
    width: "400px",
    borderRadius: "10px",
    padding: "20px",
    backgroundColor: "#fff",
    textAlign: "center"
  },
  overlay: {
    zIndex: 1050,
    backgroundColor: "rgba(0, 0, 0, 0.5)"
  },
};

const LineQRDiscountModal = ({ isOpen, onClose, onConfirm }) => {
  return (
    <Modal isOpen={isOpen} onRequestClose={onClose} style={customStyles}>
      <div style={{ position: "absolute", right: 10, top: 10 }}>
        <FaTimes
          style={{ cursor: "pointer" }}
          size={18}
          onClick={onClose}
          color="red"
        />
      </div>
      <h5>Scan this QR to Add us on LINE</h5>
      <img
        src="/lineqr.png" // Replace with your actual QR path
        alt="LINE QR"
        style={{ width: "200px", height: "200px", marginTop: "10px" }}
      />
      <button
        className="btn btn-success mt-4"
        onClick={() => {
          onConfirm(); // Apply discount
          onClose();   // Close modal
        }}
      >
        I Added on LINE — Apply Discount
      </button>
    </Modal>
  );
};

export default LineQRDiscountModal;
