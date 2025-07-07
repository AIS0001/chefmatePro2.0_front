// sale.js - Updated POS Component with barcode scanning and streamlined checkout features

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import CardComponent from "../../components/cards/CardComponent";
import Header from "../../components/Header";
import Layout from "../../layout/Layout";
import { useRef } from 'react';
import { Textfield, TextfieldwithLabel } from "../../components/Buttons/Textfield";
import getAmountInWords from '../../components/numbertoWords'; // Assuming this is the correct path for the utility function
import useAutoLogout from '../../hooks/useAutoLogout'; // Custom hook for auto logout
import InvoiceTableModal from '../../components/Templates/template1';
import ReactToPrint from "react-to-print";
import { data } from 'jquery';


export default function Sale() {
  const itemNameRefs = useRef([]);
    const printRef = useRef();
  const [cart, setCart] = useState([]);
  const [barcode, setBarcode] = useState('');
  const [total, setTotal] = useState(0);
  const [paymentType, setPaymentType] = useState('cash');
  const [discountType, setDiscountType] = useState('percentage');
  const [discountValue, setDiscountValue] = useState(0);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [customerDetails, setCustomerDetails] = useState({ name: '', phone: '' });
   const [showModal, setShowModal] = useState(false);
  const [itemRows, setItemRows] = useState([
    {
      id: Date.now(),
      itemName: '',
      description: '',
      rate: 0,
      quantity: 1,
      discountPercent: 0,
      cgst: 0,
      sgst: 0,
      igst: 0,
      amount: 0,
      discountValue: 0,
      netAmount: 0,
    }
  ]);
  const COLORS = {
    primary: "#4e73df",
    secondary: "#858796",
    success: "#1cc88a",
    info: "#36b9cc",
    warning: "#f6c23e",
    danger: "#e74a3b",
    light: "#f8f9fc",
    dark: "#5a5c69",
    purple: "#6f42c1",
    pink: "#e83e8c",
    teal: "#20c9a6"
  };
const companyDetails = {
  name: "Veloura Pvt. Ltd.",
  address: "123 Beach Road, Pattaya, Thailand",
  phone: "+66 987 654 321",
  email: "info@veloura.com",
};

const customerDetails1 = {
  name: "John Doe",
  address: "456 Sunset Avenue, Bangkok",
  phone: "+66 123 456 789",
  email: "john.doe@example.com",
};

const invoiceData = [
  {
    itemName: "Luxury Perfume",
    description: "Floral sweet musky scent",
    rate: 1500,
    quantity: 2,
    amount: 3000,
    discountPercent: 10,
    netAmount: 2700,
  },
  {
    itemName: "Everyday Cologne",
    description: "Crisp citrus base",
    rate: 850,
    quantity: 1,
    amount: 850,
    discountPercent: 5,
    netAmount: 807.5,
  },
];

  const CHART_COLORS = [
    "#4e73df", "#1cc88a", "#36b9cc", "#f6c23e",
    "#e74a3b", "#6f42c1", "#e83e8c", "#20c9a6"
  ];
  const [editableRowIndex, setEditableRowIndex] = useState(null);
  const [customer, setCustomer] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    gst: '',
    deliveryPlace: ''
  });
  const [invoiceSummary, setInvoiceSummary] = useState({
    itemTotal: 0,
    discount: 0,
    subTotal: 0,
    tax: 0,
    roundOff: 0,
    grandTotal: 0,
  });
  useEffect(() => {
    const itemTotal = itemRows.reduce((sum, r) => sum + r.amount, 0);
    const discount = itemRows.reduce((sum, r) => sum + r.discountValue, 0);
    const subTotal = itemTotal - discount;
    const tax = itemRows.reduce((sum, r) => {
      const totalTax = ((r.cgst + r.sgst + r.igst) / 100) * (r.amount - r.discountValue);
      return sum + totalTax;
    }, 0);
    const grandTotal = Math.round(subTotal + tax);
    const roundOff = grandTotal - (subTotal + tax);

    setInvoiceSummary({ itemTotal, discount, subTotal, tax, roundOff, grandTotal });
  }, [itemRows]);
  const [allItems, setAllItems] = useState([]); // from DB
  const [suggestions, setSuggestions] = useState({}); // {rowIndex: [items]}

  const baseURL = 'http://localhost:4402';
  const handleRowChange = (index, field, value) => {
    const updatedRows = [...itemRows];
    const row = updatedRows[index];
    row[field] = value;

    // Auto-calculate amounts
    row.amount = row.rate * row.quantity;
    row.discountValue = row.amount * (row.discountPercent / 100);
    const taxedAmount = row.amount - row.discountValue;
    const totalTax = taxedAmount * ((row.cgst + row.sgst + row.igst) / 100);
    row.netAmount = taxedAmount + totalTax;

    setItemRows(updatedRows);
  };
  const addNewRow = () => {
    setItemRows([
      ...itemRows,
      {
        id: Date.now(),
        itemName: '',
        description: '',
        rate: 0,
        quantity: 1,
        discountPercent: 0,
        cgst: 0,
        sgst: 0,
        igst: 0,
        amount: 0,
        discountValue: 0,
        netAmount: 0,
      }
    ]);
  };

  const deleteRow = (index) => {
    const updated = [...itemRows];
    updated.splice(index, 1);
    setItemRows(updated);
  };

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
  useEffect(() => {
    axios.get('/fetchdata/items/id') // your endpoint
      .then(res => setAllItems(res.data))
      .catch(err => console.error("Error fetching items", err));
  }, []);

  const handleItemSelect = (index, selectedItem) => {
    const updatedRows = [...itemRows];
    updatedRows[index] = {
      ...updatedRows[index],
      itemName: selectedItem.iname,
      description: selectedItem.description || "",
      rate: selectedItem.offerprice || 0,
      quantity: 1,
      amount: selectedItem.offerprice || 0,
      discountPercent: 0,
      discountValue: 0,
      cgst: selectedItem.cgst || 0,
      sgst: selectedItem.sgst || 0,
      igst: selectedItem.igst || 0,
      netAmount: selectedItem.offerprice || 0
    };
    setItemRows(updatedRows);
    setSuggestions(prev => ({ ...prev, [index]: [] })); // close suggestion
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
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('tr')) {
        setEditableRowIndex(null);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  return (
    <>
      <Layout>
        <Header title="POS System " />
        <ToastContainer />

        <div className="row mb-4">
          <div className="col-md-6">
            <CardComponent>


            </CardComponent>
          </div>
          <div className="col-md-6">
            <CardComponent title="Customer Details" headerColor="success">
              <div className="row">
                {/* Name */}
                <div className="col-md-4 mb-3">
                  <TextfieldwithLabel
                    id="customerName"
                    name="customerName"
                    value={customer.name}
                    onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
                    type="text"
                    lable="Customer Name"
                  />
                </div>

                {/* Phone */}
                <div className="col-md-4 mb-3">
                  <TextfieldwithLabel
                    id="customerPhone"
                    name="customerPhone"
                    value={customer.phone}
                    onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
                    type="tel"
                    lable="Phone Number"
                  />
                </div>

                {/* Email */}
                <div className="col-md-4 mb-3">
                  <TextfieldwithLabel
                    id="customerEmail"
                    name="customerEmail"
                    value={customer.email}
                    onChange={(e) => setCustomer({ ...customer, email: e.target.value })}
                    type="email"
                    lable="Email"
                  />
                </div>

                {/* Address */}
                <div className="col-md-6 mb-3">
                  <TextfieldwithLabel
                    id="customerAddress"
                    name="customerAddress"
                    value={customer.address}
                    onChange={(e) => setCustomer({ ...customer, address: e.target.value })}
                    type="text"
                    lable="Address"
                  />
                </div>

                {/* GST No */}
                <div className="col-md-3 mb-3">
                  <TextfieldwithLabel
                    id="customerGST"
                    name="customerGST"
                    value={customer.gst}
                    onChange={(e) => setCustomer({ ...customer, gst: e.target.value })}
                    type="text"
                    lable="GST Number (Optional)"
                  />
                </div>

                {/* Place of Delivery */}
                <div className="col-md-3 mb-3">
                  <TextfieldwithLabel
                    id="customerDeliveryPlace"
                    name="customerDeliveryPlace"
                    value={customer.deliveryPlace}
                    onChange={(e) => setCustomer({ ...customer, deliveryPlace: e.target.value })}
                    type="text"
                    lable="Place of Delivery"
                  />
                </div>
              </div>
            </CardComponent>

          </div>
        </div>
        <CardComponent >
          <div className="row mb-4">
            <div className="col-md-4">
              <form onSubmit={handleScan}>
                <Textfield
                  className="form-control"

                  id={`itemName`}
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                  type="text"
                  name="itemName"
                  placeholder="Scan or enter Item Code"
                />

              </form>
            </div>
            <div className="col-md-4">
              <form onSubmit={handleScan}>
                <Textfield
                  className="form-control"
                  label="Barcode"
                  id={`itemName`}
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                  type="text"
                  name="itemName"
                  placeholder="Scan or enter barcode"
                />

              </form>
            </div>
            <div className="col-md-4">
              <button className="btn btn-primary" type="submit">Scan Now !</button>
            </div>
          </div>
        </CardComponent>


        <CardComponent title="Add Items" headerColor="success">
          <div className="table-responsive">
            <table className="table table-borderless">

              <thead className="table-dark">
                <tr>
                  <th>S.No</th>
                  <th>Item Name</th>
                  <th>Description</th>
                  <th>Rate</th>
                  <th>Qty</th>
                  <th>Amount</th>
                  <th>Disc%</th>
                  <th>Disc Value</th>
                  <th>CGST%</th>
                  <th>SGST%</th>
                  <th>IGST%</th>
                  <th>Net Amount</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {itemRows.map((row, index) => (
                  <tr key={row.id} onClick={() => setEditableRowIndex(index)} style={{ cursor: "pointer" }}>
                    <td>{index + 1}</td>

                    {/* Item Name */}
                    <td style={{ position: 'relative' }}>
                      {editableRowIndex === index ? (
                        <>
                          <Textfield
                            id={`itemName-${index}`}
                            value={row.itemName}
                            onChange={(e) => handleRowChange(index, 'itemName', e.target.value)}
                            type="text"
                            name="itemName"
                            autoComplete="off"
                          />
                          {/* Dropdown suggestions */}
                          {suggestions[index] && suggestions[index].length > 0 && (
                            <ul className="list-group position-absolute w-100 shadow-sm zindex-dropdown">
                              {suggestions[index].slice(0, 6).map((item, idx) => (
                                <li
                                  key={idx}
                                  className="list-group-item list-group-item-action"
                                  onClick={() => handleItemSelect(index, item)}
                                  style={{ cursor: 'pointer' }}
                                >
                                  {item.iname}
                                </li>
                              ))}
                            </ul>
                          )}
                        </>
                      ) : (
                        <span>{row.itemName || <span className="text-muted">Click to edit</span>}</span>
                      )}
                    </td>


                    {/* Description */}
                    <td>
                      {editableRowIndex === index ? (
                        <Textfield
                          id={`description-${index}`}
                          value={row.description}
                          onChange={(e) => handleRowChange(index, 'description', e.target.value)}
                          type="text"
                          name="description"
                        />
                      ) : (
                        row.description
                      )}
                    </td>

                    {/* Rate */}
                    <td>
                      {editableRowIndex === index ? (
                        <Textfield
                          id={`rate-${index}`}
                          value={row.rate}
                          onChange={(e) => handleRowChange(index, 'rate', parseFloat(e.target.value) || 0)}
                          type="number"
                          name="rate"
                        />
                      ) : (
                        row.rate.toFixed(2)
                      )}
                    </td>

                    {/* Qty */}
                    <td>
                      {editableRowIndex === index ? (
                        <Textfield
                          id={`qty-${index}`}
                          value={row.quantity}
                          onChange={(e) => handleRowChange(index, 'quantity', parseInt(e.target.value) || 1)}
                          type="number"
                          name="quantity"
                        />
                      ) : (
                        row.quantity
                      )}
                    </td>

                    {/* Amount */}
                    <td>{row.amount.toFixed(2)}</td>

                    {/* Disc% */}
                    <td>
                      {editableRowIndex === index ? (
                        <Textfield
                          id={`disc-${index}`}
                          value={row.discountPercent}
                          onChange={(e) => handleRowChange(index, 'discountPercent', parseFloat(e.target.value) || 0)}
                          type="number"
                          name="discountPercent"
                        />
                      ) : (
                        row.discountPercent
                      )}
                    </td>

                    {/* Disc Value */}
                    <td>{row.discountValue.toFixed(2)}</td>

                    {/* CGST */}
                    <td>
                      {editableRowIndex === index ? (
                        <Textfield
                          id={`cgst-${index}`}
                          value={row.cgst}
                          onChange={(e) => handleRowChange(index, 'cgst', parseFloat(e.target.value) || 0)}
                          type="number"
                          name="cgst"
                        />
                      ) : (
                        row.cgst
                      )}
                    </td>

                    {/* SGST */}
                    <td>
                      {editableRowIndex === index ? (
                        <Textfield
                          id={`sgst-${index}`}
                          value={row.sgst}
                          onChange={(e) => handleRowChange(index, 'sgst', parseFloat(e.target.value) || 0)}
                          type="number"
                          name="sgst"
                        />
                      ) : (
                        row.sgst
                      )}
                    </td>

                    {/* IGST */}
                    <td>
                      {editableRowIndex === index ? (
                        <Textfield
                          id={`igst-${index}`}
                          value={row.igst}
                          onChange={(e) => handleRowChange(index, 'igst', parseFloat(e.target.value) || 0)}
                          type="number"
                          name="igst"
                        />
                      ) : (
                        row.igst
                      )}
                    </td>

                    {/* Net Amount */}
                    <td>{row.netAmount.toFixed(2)}</td>

                    {/* Delete Button */}
                    <td>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={(e) => {
                          e.stopPropagation(); // prevent triggering row click
                          deleteRow(index);
                        }}
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>

            </table>
            <button className="btn btn-primary mt-2" onClick={addNewRow}>➕ Add Row</button>
          </div>
        </CardComponent>

        <div className="row mb-4">
          <div className="col-md-6">
            <CardComponent>
              <div className="text-right mt-3">
                <h5 className="mb-0">Grand Total: <strong>₹ {invoiceSummary.grandTotal.toFixed(2)}</strong></h5>
                <small className="text-muted">
                  {getAmountInWords(invoiceSummary.grandTotal)}
                </small>
              </div>


            </CardComponent>
          </div>

          <div className="col-md-6">
            <CardComponent
              title="Invoice Summary"
              headerColor="success"
              customHeader={
                <div className="d-flex justify-content-between align-items-center">
                  <h5 className="m-0 font-weight-bold">Invoice Summary</h5>
                  <i className="fas fa-balance-scale fa-2x text-gray-600"></i>
                </div>
              }
            >
              {/* Invoice Date */}

              {/* Financial Summary */}
              <div className="row gy-3 text-lg">
                {/* Item Total */}
                <div className="col-md-4">
                  <label className="fw-semibold font-20">Invoice Date</label>
                  <div className="font-20">{invoiceSummary.invoiceDate}</div>
                </div>
                <div className="col-md-4">
                  <label className="fw-semibold font-20">Item Total</label>
                  <div className="font-20">฿ {invoiceSummary.itemTotal.toFixed(2)}</div>
                </div>
                {/* Discount */}
                <div className="col-md-4">
                  <label className="fw-semibold font-20">Discount</label>
                  <div className="font-20">฿ {invoiceSummary.discount.toFixed(2)}</div>
                </div>

                {/* Sub Total */}
                <div className="col-md-4">
                  <label className="fw-semibold font-20">Sub Total</label>
                  <div className="font-20">฿ {invoiceSummary.subTotal.toFixed(2)}</div>
                </div>

                {/* Round Off */}
                <div className="col-md-4">
                  <label className="fw-semibold font-20">Round Off</label>
                  <div className="font-20">฿ {invoiceSummary.roundOff.toFixed(2)}</div>
                </div>

                {/* Grand Total */}
                <div className="col-md-4">
                  <label className="fw-bold font-20">Grand Total</label>
                  <div className="text-success fw-bold font-20">
                    ฿ {invoiceSummary.grandTotal.toFixed(2)}
                  </div>
                </div>
              </div>
            </CardComponent>




          </div>
        </div>
<div className="row mb-4">
          <div className="col-md-12">
           <CardComponent>
 

  <div className="d-flex flex-wrap gap-2 justify-content-end">
    <button className="btn btn-success">
      💾 Save Bill
    </button>

    <button className="btn btn-danger">
      ❌ Cancel Bill
    </button>

    <button className="btn btn-warning text-dark">
      🔄 Reset Bill
    </button>

    <button className="btn btn-primary" onClick={() => setShowModal(true)} >
      🖨️ Print
    </button>

    <button className="btn btn-purple text-white" style={{ backgroundColor: "#6f42c1" }}>
      📜 Invoice History
    </button>

    <button className="btn btn-info text-white">
      🧾 Templates
    </button>
    
  </div>
</CardComponent>

          </div>
          </div>
<CardComponent>



      <InvoiceTableModal
        show={showModal}
        onClose={() => setShowModal(false)}
        companyDetails={companyDetails}
        customerDetails={customerDetails1}
        data={invoiceData}
      />

  
</CardComponent>
      </Layout>
    </>
  );
}