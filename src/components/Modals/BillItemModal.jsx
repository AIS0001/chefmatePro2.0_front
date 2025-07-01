// components/Modals/BillItemModal.jsx
import React, { useEffect, useState } from "react";
import Modal from "react-modal";
import axios from "axios";
import { getHeaders } from "../../utility/getHeader";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

Modal.setAppElement("#root");

export default function BillItemModal({ isOpen, onClose, bill }) {
  const [items, setItems] = useState([]);

  useEffect(() => {
    if (bill?.id) {
      fetchItems();
    }
  }, [bill]);

  const fetchItems = async () => {
    try {
      const res = await axios.post(
        "/getdata/order_items_gst",
        { billid: bill.id },
        getHeaders()
      );
      setItems(res.data || []);
    } catch (error) {
      toast.error("Failed to fetch bill items");
      console.error(error);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      contentLabel="Bill Item Details"
      className="modal-dialog modal-lg"
      overlayClassName="ReactModal__Overlay"
    >
      <div className="modal-content">
        <div className="modal-header">
          <h5 className="modal-title">Bill #{bill?.id} - Items</h5>
          <button type="button" className="btn-close" onClick={onClose}></button>
        </div>
        <div className="modal-body">
          {items.length === 0 ? (
            <p>No items found for this bill.</p>
          ) : (
            <table className="table table-bordered">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Qty</th>
                  <th>Rate</th>
                  <th>Amount</th>
                  <th>CGST</th>
                  <th>SGST</th>
                  <th>IGST</th>
                  <th>Total Tax %</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, index) => (
                  <tr key={index}>
                    <td>{item.item_name}</td>
                    <td>{item.quantity}</td>
                    <td>{item.price}</td>
                    <td>{item.total_amount}</td>
                    <td>{item.cgst || 0}%</td>
                    <td>{item.sgst || 0}%</td>
                    <td>{item.igst || 0}%</td>
                    <td>{(parseFloat(item.cgst || 0) + parseFloat(item.sgst || 0) + parseFloat(item.igst || 0)).toFixed(2)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
      <ToastContainer />
    </Modal>
  );
}
