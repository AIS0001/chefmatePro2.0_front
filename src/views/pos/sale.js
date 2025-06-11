// sale.js - Updated POS Component with barcode scanning and streamlined checkout features

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import CardComponent from "../../components/cards/CardComponent";
import Header from "../../components/Header";
import Layout from "../../layout/Layout";



export default function Sale() {
  const [cart, setCart] = useState([]);
  const [barcode, setBarcode] = useState('');
  const [total, setTotal] = useState(0);
  const [paymentType, setPaymentType] = useState('cash');
  const [discountType, setDiscountType] = useState('percentage');
  const [discountValue, setDiscountValue] = useState(0);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [customerDetails, setCustomerDetails] = useState({ name: '', phone: '' });

  const baseURL = 'http://localhost:4402';

  const handleScan = async (e) => {
    e.preventDefault();
    if (!barcode) return;
    try {
      const res = await axios.get(`${baseURL}/getitembybarcode/${barcode}`);
      const item = res.data;
      if (!item || item.stock <= 0) {
        toast.error('Item not found or out of stock.');
        return;
      }
      const existing = cart.find(i => i.id === item.id);
      if (existing) {
        setCart(cart.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i));
      } else {
        setCart([...cart, { ...item, quantity: 1 }]);
      }
      setBarcode('');
    } catch (error) {
      toast.error('Error fetching item.');
    }
  };

  useEffect(() => {
    const newTotal = cart.reduce((sum, item) => sum + item.offerprice * item.quantity, 0);
    setTotal(newTotal);
  }, [cart]);

  const calculateFinalTotal = () => {
    let discount = 0;
    if (discountType === 'percentage') {
      discount = total * (discountValue / 100);
    } else {
      discount = discountValue;
    }
    return Math.max(0, total - discount);
  };

  const handleSaveAndPrint = () => {
    if (paymentType === 'credit') {
      setShowCustomerModal(true);
      return;
    }
    printBill();
  };

  const printBill = () => {
    const finalTotal = calculateFinalTotal();
    const bill = `Bill\n--------------------\n${cart.map(i => `${i.iname} x ${i.quantity} = ฿${i.quantity * i.offerprice}`).join('\n')}\n--------------------\nTotal: ฿${total.toFixed(2)}\nDiscount: ${discountValue}${discountType === 'percentage' ? '%' : '฿'}\nFinal Total: ฿${finalTotal.toFixed(2)}\nPayment: ${paymentType}`;
    const printWindow = window.open('', '', 'width=600,height=400');
    printWindow.document.write(`<pre>${bill}</pre>`);
    printWindow.document.close();
    printWindow.print();
  };

  const handleCustomerSubmit = () => {
    if (!customerDetails.name || !customerDetails.phone) {
      toast.error('Please fill customer details');
      return;
    }
    setShowCustomerModal(false);
    printBill();
  };

  return (
     <>
          <Layout>
            <Header title="POS System " />
            <ToastContainer />
    
    <div className="container mt-4">
      <ToastContainer />
      <h2>POS Sale</h2>
      <form onSubmit={handleScan} className="mb-3">
        <input type="text" value={barcode} onChange={(e) => setBarcode(e.target.value)} placeholder="Scan Barcode" className="form-control" />
      </form>

      <div>
        <h4>Cart</h4>
        {cart.map((item, idx) => (
          <div key={idx} className="d-flex justify-content-between border-bottom py-1">
            <span>{item.iname} x {item.quantity}</span>
            <span>฿{(item.offerprice * item.quantity).toFixed(2)}</span>
          </div>
        ))}
        <div className="mt-2">
          <p>Total: ฿{total.toFixed(2)}</p>
          <div className="form-group">
            <label>Discount Type</label>
            <select className="form-control" value={discountType} onChange={e => setDiscountType(e.target.value)}>
              <option value="percentage">Percentage</option>
              <option value="amount">Amount</option>
            </select>
          </div>
          <div className="form-group">
            <label>Discount Value</label>
            <input type="number" className="form-control" value={discountValue} onChange={e => setDiscountValue(+e.target.value)} />
          </div>
          <div className="form-group">
            <label>Payment Type</label>
            <select className="form-control" value={paymentType} onChange={e => setPaymentType(e.target.value)}>
              <option value="cash">Cash</option>
              <option value="credit">Credit</option>
              <option value="transfer">Transfer</option>
              <option value="entertainment">Entertainment</option>
            </select>
          </div>
          <p>Final Total: ฿{calculateFinalTotal().toFixed(2)}</p>
          <button className="btn btn-success" onClick={handleSaveAndPrint}>Save & Print</button>
        </div>
      </div>

      {showCustomerModal && (
        <div className="modal show d-block" tabIndex="-1">
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Customer Details</h5>
                <button type="button" className="close" onClick={() => setShowCustomerModal(false)}>&times;</button>
              </div>
              <div className="modal-body">
                <input type="text" placeholder="Name" className="form-control mb-2" value={customerDetails.name} onChange={e => setCustomerDetails({ ...customerDetails, name: e.target.value })} />
                <input type="text" placeholder="Phone" className="form-control" value={customerDetails.phone} onChange={e => setCustomerDetails({ ...customerDetails, phone: e.target.value })} />
              </div>
              <div className="modal-footer">
                <button className="btn btn-primary" onClick={handleCustomerSubmit}>Submit</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
</Layout>
    </>
  );
}