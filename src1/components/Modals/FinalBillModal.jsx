import React from 'react';
import { Modal, Table } from 'react-bootstrap';

function FinalBillModal({ show, handleClose, tableDetails }) {
  const { tableName, items, subtotal, tax, total } = tableDetails;

  return (
    <Modal show={show} onHide={handleClose} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Final Bill for Table: {tableName}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Table striped bordered hover>
          <thead>
            <tr>
              <th>Item</th>
              <th>Quantity</th>
              <th>Unit Price</th>
              <th>Total Price</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <tr key={index}>
                <td>{item.name}</td>
                <td>{item.quantity}</td>
                <td>฿ {item.unitPrice.toFixed(2)}</td>
                <td>฿ {(item.quantity * item.unitPrice).toFixed(2)}</td>
              </tr>
            ))}
            <tr>
              <td colSpan="3" className="text-end"><strong>Subtotal</strong></td>
              <td>฿ {subtotal.toFixed(2)}</td>
            </tr>
            <tr>
              <td colSpan="3" className="text-end"><strong>Tax (7%)</strong></td>
              <td>฿ {tax.toFixed(2)}</td>
            </tr>
            <tr>
              <td colSpan="3" className="text-end"><strong>Grand Total</strong></td>
              <td>฿ {total.toFixed(2)}</td>
            </tr>
          </tbody>
        </Table>
      </Modal.Body>
      <Modal.Footer>
        <button className="btn btn-secondary" onClick={handleClose}>Close</button>
        <button className="btn btn-primary">Print Bill</button>
      </Modal.Footer>
    </Modal>
  );
}

export default FinalBillModal;
