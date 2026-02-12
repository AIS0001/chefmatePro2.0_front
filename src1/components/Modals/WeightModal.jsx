import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";

const WeightModal = ({ isOpen, onClose, onConfirm, item }) => {
  const [weight, setWeight] = useState("");

  useEffect(() => {
    if (isOpen) setWeight(""); // reset when modal opens
  }, [isOpen]);

  const handleAdd = () => {
    const grams = parseFloat(weight);
    if (isNaN(grams) || grams <= 0) {
      toast.error("Please enter a valid weight in grams.");
      return;
    }

    const quantity = grams / 1000;
    onConfirm(item, quantity);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop show d-flex align-items-center justify-content-center" style={{ zIndex: 1050 }}>
      <div className="modal-dialog modal-sm">
        <div className="modal-content p-3">
          <h5 className="modal-title mb-3 text-center">Enter Weight in Grams</h5>
          <input
            type="number"
            className="form-control mb-3"
            placeholder="e.g. 250, 500"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
          />
          <div className="d-flex justify-content-end">
            <button className="btn btn-secondary me-2" onClick={onClose}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={handleAdd}>
              Add
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WeightModal;
