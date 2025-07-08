import React, { useState, useEffect } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';

const EditModal = ({ show, handleClose, item, tableName, onUpdate }) => {
  const [formData, setFormData] = useState({ ...item });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSave = async () => {
    try {
      // Call your update function (you can POST to backend here)
      const res = await fetch(`/api/update/${tableName}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const result = await res.json();
      if (result.success) {
        onUpdate(formData);
      }
    } catch (error) {
      console.error("Failed to update:", error);
    }
  };

  return (
    <Modal show={show} onHide={handleClose}>
      <Modal.Header closeButton>
        <Modal.Title>Edit Record</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {/* Render dynamic form fields */}
        {Object.keys(formData).map((key, index) => (
          key !== "id" && (
            <Form.Group key={index} className="mb-2">
              <Form.Label>{key}</Form.Label>
              <Form.Control
                type="text"
                name={key}
                value={formData[key]}
                onChange={handleChange}
              />
            </Form.Group>
          )
        ))}
        {/* For image update, you may need separate upload logic */}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={handleClose}>Cancel</Button>
        <Button variant="primary" onClick={handleSave}>Update</Button>
      </Modal.Footer>
    </Modal>
  );
};

export default EditModal;
