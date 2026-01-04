import React, { useState, useEffect, useRef } from 'react';
import AddCustomerModal from '../../components/Modals/addCustomer';
import Select from 'react-select';
import axios from 'axios';
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import CardComponent from '../../components/cards/CardComponent';
import Header from '../../components/Header';
import Layout from '../../layout/Layout';
import { Textfield, TextfieldwithLabel } from '../../components/Buttons/Textfield';
import getAmountInWords from '../../components/numbertoWords';
import fetchData from '../../functions/fetchData';
import { getHeaders } from '../../utility/getHeader';
import { getUserName } from '../../functions/storageUtils';
import { getNextSetupDate } from '../../utils/setupDateUtils';

// Utility to fetch coresetting tax_type
async function fetchTaxType() {
  try {
    // coresetting table is usually a single row
    const res = await fetchData('coresetting', null, 'id', {});
    if (Array.isArray(res) && res.length > 0) {
      return res[0].tax_type ? res[0].tax_type.toLowerCase() : 'gst';
    }
    return 'gst'; // default fallback
  } catch (e) {
    return 'gst';
  }
}

export default function Quotation() {
  const itemNameRefs = useRef([])
  const [cart] = useState([])
  const [barcode, setBarcode] = useState('')
  const [total, setTotal] = useState(0)
  const [paymentType, setPaymentType] = useState('Cash')
  const navigate = useNavigate();
  
  // Check if user is cashier
  const userType = localStorage.getItem('usertype') || sessionStorage.getItem('usertype');
  const isCashier = userType === 'Cashier';
  
  // Navigate to dashboard function
  const navigateToDashboard = () => {
    if (isCashier) {
      navigate('/CashierDashboard');
    } else {
      navigate('/dashboard');
    }
  };
  // Tax type state
  const [taxType, setTaxType] = useState('gst');
  // On mount, fetch tax type from coresetting
  useEffect(() => {
    (async () => {
      const ttype = await fetchTaxType();
      setTaxType(ttype);
    })();
  }, []);
  const [discountType, setDiscountType] = useState('percentage')
  const [discountValue, setDiscountValue] = useState(0)
  const [showCustomerModal, setShowCustomerModal] = useState(false)
  const [validUntil, setValidUntil] = useState(() => {
    // Default to 30 days from now
    const date = new Date();
    date.setDate(date.getDate() + 30);
    return date.toISOString().split('T')[0];
  })

  const [customerDetails, setCustomerDetails] = useState({
    name: '',
    phone: ''
  })
  const [showModal, setShowModal] = useState(false)
  const [modalInvoiceData, setModalInvoiceData] = useState({
    companyDetails: {},
    customerDetails: {},
    data: [],
    quotation_id: ''
  })
  const [itemRows, setItemRows] = useState([])
  const companyDetails = {
    name: 'Cloudnet Softwares',
    address: '123 Beach Road, Pattaya, Thailand',
    phone: '+66 987 654 321',
    email: 'info@cloudnetsoftwares.com'
  }

  const [editableRowIndex, setEditableRowIndex] = useState(null)
  const [customer, setCustomer] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    gst: '',
    deliveryPlace: ''
  })
  const [quotationSummary, setQuotationSummary] = useState({
    itemTotal: 0,
    discount: 0,
    subTotal: 0,
    tax: 0,
    roundOff: 0,
    grandTotal: 0
  })
  
  // Update quotation summary calculation
  useEffect(() => {
    let itemTotal = 0;
    let discount = 0;
    let taxValue = 0;
    let taxPercent = 0;
    let subTotal = 0;
    let roundOff = 0;
    let grandTotal = 0;
    let taxTypeLabel = taxType === 'vat' ? 'VAT' : 'GST';
    let taxPercentDisplay = '';

    if (itemRows.length > 0) {
      itemTotal = itemRows.reduce((sum, r) => sum + r.amount, 0);
      discount = itemRows.reduce((sum, r) => sum + r.discountValue, 0);
      subTotal = itemTotal - discount;
      
      // Calculate tax percent and value
      if (taxType === 'vat') {
        // VAT: use first nonzero VAT% as display
        const vatRows = itemRows.filter(r => r.vat > 0);
        taxPercent = vatRows.length > 0 ? vatRows[0].vat : 0;
        // If any item is taxIncluded, extract tax from netAmount, else add tax on top
        if (vatRows.length > 0 && vatRows[0].taxIncluded) {
          // Tax included: extract tax from netAmount
          taxValue = itemRows.reduce((sum, r) => sum + (r.taxIncluded ? (r.netAmount - (r.netAmount / (1 + (r.vat / 100)))) : 0), 0);
        } else {
          // Tax excluded: add tax on top
          taxValue = itemRows.reduce((sum, r) => sum + (!r.taxIncluded ? ((r.amount - r.discountValue) * (r.vat / 100)) : 0), 0);
        }
        taxPercentDisplay = `VAT (${taxPercent}%)`;
      } else {
        // GST: sum all GST fields
        let cgst = 0, sgst = 0, igst = 0;
        let cgstVal = 0, sgstVal = 0, igstVal = 0;
        itemRows.forEach(r => {
          if (r.cgst > 0) {
            cgst = r.cgst;
            cgstVal += r.taxIncluded ? (r.netAmount - (r.netAmount / (1 + (r.cgst / 100)))) : ((r.amount - r.discountValue) * (r.cgst / 100));
          }
          if (r.sgst > 0) {
            sgst = r.sgst;
            sgstVal += r.taxIncluded ? (r.netAmount - (r.netAmount / (1 + (r.sgst / 100)))) : ((r.amount - r.discountValue) * (r.sgst / 100));
          }
          if (r.igst > 0) {
            igst = r.igst;
            igstVal += r.taxIncluded ? (r.netAmount - (r.netAmount / (1 + (r.igst / 100)))) : ((r.amount - r.discountValue) * (r.igst / 100));
          }
        });
        taxPercent = cgst + sgst + igst;
        taxValue = cgstVal + sgstVal + igstVal;
        taxPercentDisplay = `GST (${taxPercent}%)`;
      }
      // Grand total: sum all net amounts
      grandTotal = itemRows.reduce((sum, r) => sum + r.netAmount, 0);
      grandTotal = Math.round(grandTotal);
      roundOff = grandTotal - itemRows.reduce((sum, r) => sum + r.netAmount, 0);
    }
    setQuotationSummary({
      itemTotal,
      discount,
      subTotal,
      tax: taxValue,
      taxPercent: taxPercentDisplay,
      roundOff,
      grandTotal
    });
  }, [itemRows, taxType])

  const [allItems, setAllItems] = useState([]) // from DB
  const [allCustomers, setAllCustomers] = useState([]) // from DB
  const [suggestions, setSuggestions] = useState({}) // {rowIndex: [items]}
  const [taxes, setTaxes] = useState([]); // All taxes from DB

  // Fetch data on mount
  useEffect(() => {
    fetchData('items', setAllItems, 'id', {});
    fetchData('customers', setAllCustomers, 'id', {});
    fetchData('taxes', setTaxes, 'id', {});
  }, []);

  const handleRowChange = (index, field, value) => {
    const updatedRows = [...itemRows]
    const row = updatedRows[index]
    row[field] = value

    // If editing itemName, update suggestions
    if (field === 'itemName') {
      if (value && value.trim().length > 0) {
        const filtered = allItems.filter(
          item =>
            item.iname &&
            item.iname.toLowerCase().includes(value.trim().toLowerCase())
        )
        setSuggestions(prev => ({ ...prev, [index]: filtered }))
      } else {
        setSuggestions(prev => ({ ...prev, [index]: [] }))
      }
    }

    // Tax-included/excluded logic
    const included = row.taxIncluded;
    let rate = parseFloat(row.rate) || 0;
    let quantity = parseFloat(row.quantity) || 1;
    let discountPercent = parseFloat(row.discountPercent) || 0;
    let vat = taxType === 'vat' ? (parseFloat(row.vat) || 0) : 0;
    let cgst = taxType === 'gst' ? (parseFloat(row.cgst) || 0) : 0;
    let sgst = taxType === 'gst' ? (parseFloat(row.sgst) || 0) : 0;
    let igst = taxType === 'gst' ? (parseFloat(row.igst) || 0) : 0;
    let totalTaxPercent = taxType === 'vat' ? vat : (cgst + sgst + igst);
    let amount = 0, discountValue = 0, netAmount = 0;

    if (included) {
      // Tax is included in price: gross is the final price, discount is on gross
      let gross = rate * quantity;
      amount = gross; // Show the actual price paid (tax included)
      discountValue = gross * (discountPercent / 100);
      netAmount = gross - discountValue; // Final price after discount (still tax included)
    } else {
      // Tax is excluded: add tax after discount
      amount = rate * quantity;
      discountValue = amount * (discountPercent / 100);
      netAmount = (amount - discountValue) * (1 + (totalTaxPercent / 100));
    }

    row.amount = amount;
    row.discountValue = discountValue;
    row.netAmount = netAmount;

    setItemRows(updatedRows)
  }

  // Add global shortcut for adding new row and removing last row
  useEffect(() => {
    const handleShortcut = e => {
      const isCtrlEnter = e.ctrlKey && e.key === 'Enter'
      const isCmdEnter = e.metaKey && e.key === 'Enter'
      const isCtrlDel = e.ctrlKey && (e.key === 'Delete' || e.key === 'Del')
      if (isCtrlEnter || isCmdEnter) {
        e.preventDefault()
        setItemRows(prev => {
          const newRows = [
            ...prev,
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
              vat: 0,
              amount: 0,
              discountValue: 0,
              netAmount: 0,
              taxIncluded: false
            }
          ]
          setEditableRowIndex(newRows.length - 1)
          return newRows
        })
      } else if (isCtrlDel) {
        e.preventDefault()
        setItemRows(prev => {
          if (prev.length === 0) return prev
          const newRows = prev.slice(0, -1)
          setEditableRowIndex(newRows.length - 1)
          return newRows
        })
      }
    }
    window.addEventListener('keydown', handleShortcut)
    return () => window.removeEventListener('keydown', handleShortcut)
  }, [])

  // Focus the react-select input when editableRowIndex changes to the last row
  useEffect(() => {
    if (
      editableRowIndex === itemRows.length - 1 &&
      itemNameRefs.current[editableRowIndex]
    ) {
      const select = itemNameRefs.current[editableRowIndex]
      if (select && select.focus) {
        select.focus()
      } else if (select && select.select && select.select.inputRef) {
        select.select.inputRef.focus()
      } else {
        const input = document.querySelector(
          `#itemName-${editableRowIndex} input`
        )
        if (input) input.focus()
      }
    }
  }, [editableRowIndex, itemRows.length])

  const handleItemSelect = (index, selectedItem) => {
    const updatedRows = [...itemRows]
    const row = updatedRows[index]
    
    row.itemName = selectedItem.iname || ''
    row.description = selectedItem.description || ''
    row.rate = parseFloat(selectedItem.rate) || 0
    row.quantity = 1
    row.discountPercent = 0
    
    // Set tax rates from item
    if (taxType === 'vat') {
      row.vat = parseFloat(selectedItem.vat) || 0
    } else {
      row.cgst = parseFloat(selectedItem.cgst) || 0
      row.sgst = parseFloat(selectedItem.sgst) || 0
      row.igst = parseFloat(selectedItem.igst) || 0
    }
    
    row.taxIncluded = selectedItem.tax_included === 1 || false
    
    // Calculate amounts
    const rate = row.rate
    const quantity = row.quantity
    const totalTaxPercent = taxType === 'vat' ? row.vat : (row.cgst + row.sgst + row.igst)
    
    if (row.taxIncluded) {
      row.amount = rate * quantity
      row.discountValue = 0
      row.netAmount = rate * quantity
    } else {
      row.amount = rate * quantity
      row.discountValue = 0
      row.netAmount = (rate * quantity) * (1 + (totalTaxPercent / 100))
    }
    
    setItemRows(updatedRows)
    setSuggestions(prev => ({ ...prev, [index]: [] }))
  }

  const addNewRow = (focusAfterAdd = false) => {
    const newRow = {
      id: Date.now(),
      itemName: '',
      description: '',
      rate: 0,
      quantity: 1,
      discountPercent: 0,
      cgst: 0,
      sgst: 0,
      igst: 0,
      vat: 0,
      amount: 0,
      discountValue: 0,
      netAmount: 0,
      taxIncluded: false
    }
    setItemRows(prev => [...prev, newRow])
    
    if (focusAfterAdd) {
      setEditableRowIndex(itemRows.length)
    }
  }

  const deleteRow = index => {
    if (itemRows.length === 1) {
      toast.warning('At least one row is required')
      return
    }
    const updatedRows = itemRows.filter((_, i) => i !== index)
    setItemRows(updatedRows)
    setEditableRowIndex(null)
  }

  const handleScan = e => {
    e.preventDefault()
    if (!barcode.trim()) return
    
    const item = allItems.find(
      item => 
        item.barcode === barcode.trim() || 
        item.item_code === barcode.trim() ||
        item.iname?.toLowerCase().includes(barcode.trim().toLowerCase())
    )
    
    if (item) {
      const existingRowIndex = itemRows.findIndex(row => row.itemName === item.iname)
      
      if (existingRowIndex >= 0) {
        const updatedRows = [...itemRows]
        updatedRows[existingRowIndex].quantity += 1
        handleRowChange(existingRowIndex, 'quantity', updatedRows[existingRowIndex].quantity)
      } else {
        const newRow = {
          id: Date.now(),
          itemName: item.iname || '',
          description: item.description || '',
          rate: parseFloat(item.rate) || 0,
          quantity: 1,
          discountPercent: 0,
          cgst: parseFloat(item.cgst) || 0,
          sgst: parseFloat(item.sgst) || 0,
          igst: parseFloat(item.igst) || 0,
          vat: parseFloat(item.vat) || 0,
          amount: parseFloat(item.rate) || 0,
          discountValue: 0,
          netAmount: parseFloat(item.rate) || 0,
          taxIncluded: item.tax_included === 1 || false
        }
        setItemRows(prev => [...prev, newRow])
      }
      setBarcode('')
      toast.success(`${item.iname} added to quotation`)
    } else {
      toast.error('Item not found')
    }
  }

  // Modal state for Add New Customer
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    contact: '',
    email: '',
    taxid: '',
    address: ''
  });

  const handleNewCustomerInput = e => {
    const { name, value } = e.target;
    setNewCustomer(prev => ({ ...prev, [name]: value }));
  };

  const handleAddCustomer = async e => {
    e.preventDefault();
    try {
      await axios.post(
        '/insertdata/customers',
        {
          name: newCustomer.name,
          contact: newCustomer.contact,
          email: newCustomer.email,
          taxid: newCustomer.taxid,
          address: newCustomer.address
        },
        getHeaders()
      );
      toast.success('Customer added successfully!');
      setShowAddCustomerModal(false);
      setNewCustomer({ name: '', contact: '', email: '', taxid: '', address: '' });
      // Optionally refresh customer list
      fetchData('customers', setAllCustomers, 'id', {});
    } catch (err) {
      toast.error('Error in adding customer');
    }
  };

  // Light color theme styles
  const lightTheme = {
    cardBackground: '#f8f9fa',
    headerBackground: '#e9ecef',
    tableHeader: '#dee2e6',
    primaryButton: '#0d6efd',
    successButton: '#198754',
    warningButton: '#ffc107',
    dangerButton: '#dc3545',
    infoButton: '#0dcaf0',
    textMuted: '#6c757d',
    borderColor: '#dee2e6'
  };

  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [lastSavedQuotation, setLastSavedQuotation] = useState(null);

  // Print Quotation Function
  const printQuotation = () => {
    if (!lastSavedQuotation) {
      toast.error('No quotation data available for printing. Please save the quotation first.');
      return;
    }

    // Use quotation_number for display, fallback to id if quotation_number is not available
    const quotationNumber = lastSavedQuotation.quotation_number || lastSavedQuotation.id || 'DRAFT';

    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Quotation - ${quotationNumber}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            background: white;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 30px;
            border-bottom: 2px solid #000;
            padding-bottom: 20px;
          }
          .header-left {
            display: flex;
            align-items: center;
            gap: 15px;
          }
          .logo {
            width: 190px;
            height: 60px;
            object-fit: contain;
          }
          .company-info-left {
            display: flex;
            flex-direction: column;
          }
          .company-logo {
            color: #FF6B35;
            font-size: 28px;
            font-weight: bold;
            margin-bottom: 2px;
          }
          .company-tagline {
            color: #666;
            font-size: 14px;
            line-height: 1.3;
            font-weight: 700;
          }
          .header-right {
            text-align: right;
            font-size: 20px;
            color: #333;
            line-height: 1.4;
          }
          .quotation-info {
            display: flex;
            justify-content: space-between;
            margin: 20px 0;
          }
          .quotation-details, .customer-details {
            width: 48%;
          }
          .section-title {
            font-weight: bold;
            font-size: 14px;
            margin-bottom: 10px;
            color: #333;
          }
          .info-row {
            font-size: 12px;
            margin: 5px 0;
            color: #555;
          }
          .items-table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
            font-size: 12px;
          }
          .items-table th,
          .items-table td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
          }
          .items-table th {
            background-color: #f8f9fa;
            font-weight: bold;
            color: #333;
          }
          .text-right {
            text-align: right;
          }
          .text-center {
            text-align: center;
          }
          .summary-section {
            margin-top: 20px;
            display: flex;
            justify-content: flex-end;
          }
          .summary-table {
            width: 300px;
            font-size: 12px;
          }
          .summary-table td {
            padding: 5px 10px;
            border: none;
          }
          .summary-table .total-row {
            font-weight: bold;
            border-top: 2px solid #333;
            font-size: 14px;
          }
          .footer {
            margin-top: 40px;
            font-size: 10px;
            color: #666;
            text-align: center;
          }
          .signature-section {
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            margin-top: 40px;
            padding-top: 20px;
          }
          .signature-left {
            flex: 1;
            text-align: left;
          }
          .signature-right {
            flex: 1;
            text-align: right;
            display: flex;
            justify-content: flex-end;
          }
          .authorised-signatory {
            text-align: center;
            min-width: 200px;
          }
          .signature-space {
            height: 60px;
            width: 200px;
            margin-bottom: 5px;
          }
          .signature-line {
            border-bottom: 1px solid #333;
            width: 200px;
            margin: 0 auto 5px auto;
          }
          .signature-text {
            font-size: 12px;
            color: #333;
            font-weight: bold;
          }
          @media print {
            body { margin: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="header-left">
            
            <div class="company-info-left">
              <div class="company-logo"><img src="/logo.png" alt="CloudNet Logo" class="logo" onerror="this.style.display='none'" /></div>

              <div class="company-tagline">
                Your local IT Partner | Pattaya |<br>
                One Stop Solution
              </div>
            </div>
          </div>
          <div class="header-right">
            📞 +66-948712350/+66-952477020<br>
            🌐 www.cloudnetsoftwares.com<br>
            📧 info@cloudnetsoftwares.com
          </div>
        </div>

        <div class="quotation-info">
          <div class="quotation-details">
            <div class="section-title">Quotation Details</div>
            <div class="info-row"><strong>Quotation No:</strong> ${quotationNumber}</div>
            <div class="info-row"><strong>Date:</strong> ${new Date(lastSavedQuotation.setup_date).toLocaleDateString('en-GB')}</div>
            <div class="info-row"><strong>Valid Until:</strong> ${new Date(lastSavedQuotation.valid_until).toLocaleDateString('en-GB')}</div>
          </div>
          <div class="customer-details">
            <div class="section-title">Customer Details</div>
            <div class="info-row"><strong>Name:</strong> ${lastSavedQuotation.customer_name}</div>
            <div class="info-row"><strong>Phone:</strong> ${lastSavedQuotation.customer_phone}</div>
            ${lastSavedQuotation.customer_email ? `<div class="info-row"><strong>Email:</strong> ${lastSavedQuotation.customer_email}</div>` : ''}
            ${lastSavedQuotation.customer_address ? `<div class="info-row"><strong>Address:</strong> ${lastSavedQuotation.customer_address}</div>` : ''}
            ${lastSavedQuotation.customer_gst ? `<div class="info-row"><strong>Tax ID:</strong> ${lastSavedQuotation.customer_gst}</div>` : ''}
            ${lastSavedQuotation.delivery_place ? `<div class="info-row"><strong>Delivery Place:</strong> ${lastSavedQuotation.delivery_place}</div>` : ''}
          </div>
        </div>

        <table class="items-table">
          <thead>
            <tr>
              <th width="5%" class="text-center">S.No</th>
              <th width="35%">Item Name</th>
              <th width="15%" class="text-right">Rate</th>
              <th width="10%" class="text-center">Qty</th>
              <th width="15%" class="text-right">Amount</th>
              <th width="10%" class="text-right">Disc%</th>
              <th width="20%" class="text-right">Net Amount</th>
            </tr>
          </thead>
          <tbody>
            ${lastSavedQuotation.items && lastSavedQuotation.items.length > 0 ? lastSavedQuotation.items.map((item, index) => `
              <tr>
                <td class="text-center">${index + 1}</td>
                <td>${item.item_name || 'N/A'}</td>
                <td class="text-right">฿ ${((item.total_amount || 0) / (item.quantity || 1)).toFixed(2)}</td>
                <td class="text-center">${item.quantity || 0}</td>
                <td class="text-right">฿ ${((item.total_amount || 0) / (item.quantity || 1) * (item.quantity || 1)).toFixed(2)}</td>
                <td class="text-right">0%</td>
                <td class="text-right">฿ ${(item.total_amount || 0).toFixed(2)}</td>
              </tr>
            `).join('') : '<tr><td colspan="7" class="text-center">No items found</td></tr>'}
          </tbody>
        </table>

        <div class="summary-section">
          <table class="summary-table">
            <tr>
              <td>Subtotal:</td>
              <td class="text-right">฿ ${(lastSavedQuotation.subtotal || 0).toFixed(2)}</td>
            </tr>
            <tr>
              <td>Discount:</td>
              <td class="text-right">฿ ${((lastSavedQuotation.subtotal || 0) - (lastSavedQuotation.subtotal_afterdiscount || 0)).toFixed(2)}</td>
            </tr>
            <tr>
              <td>Tax(7%):</td>
              <td class="text-right">฿ ${(lastSavedQuotation.tax || 0).toFixed(2)}</td>
            </tr>
            <tr>
              <td>Round Off:</td>
              <td class="text-right">฿ ${(lastSavedQuotation.round_off || 0).toFixed(2)}</td>
            </tr>
            <tr class="total-row">
              <td><strong>Grand Total:</strong></td>
              <td class="text-right"><strong>฿ ${(lastSavedQuotation.grand_total || 0).toFixed(2)}</strong></td>
            </tr>
          </table>
        </div>

        <div class="signature-section">
          <div class="signature-left">
            <div style="font-size: 10px; color: #666; text-align: left;">
              <p>Thank you for your business!</p>
              <p>This is a computer generated quotation.</p>
            </div>
          </div>
          <div class="signature-right">
            <div class="authorised-signatory">
              <div class="signature-space"></div>
              <div class="signature-line"></div>
              <div class="signature-text">Authorised Signatory</div>
            </div>
          </div>
        </div>
      </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
    
    // Auto print after a short delay
    setTimeout(() => {
      printWindow.print();
    }, 500);
  };

  const renderContent = () => (
    <div style={{ backgroundColor: '#ffffff', minHeight: '100vh' }}>
      <ToastContainer />
      
      {/* Dashboard Navigation Button - Only for cashiers */}
      {isCashier && (
        <div style={{ position: 'fixed', top: '20px', right: '20px', zIndex: 1000 }}>
          <button
            className="btn"
            onClick={navigateToDashboard}
            style={{
              backgroundColor: lightTheme.primaryButton,
              color: 'white',
              padding: '10px 15px',
              fontSize: '14px',
              borderRadius: '25px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              border: 'none'
            }}
          >
            🏠 Dashboard
          </button>
        </div>
      )}

      <div className='row mb-4'>
        <div className='col-md-12'>
          <div style={{ 
            backgroundColor: lightTheme.cardBackground, 
            border: `1px solid ${lightTheme.borderColor}`,
            borderRadius: '8px',
            padding: '20px',
            marginBottom: '20px'
          }}>
            <div style={{ 
              backgroundColor: lightTheme.headerBackground,
              padding: '10px 15px',
              borderRadius: '6px',
              marginBottom: '15px',
              borderLeft: `4px solid ${lightTheme.successButton}`
            }}>
              <h5 className='m-0' style={{ color: '#495057' }}>Customer Details</h5>
            </div>
            <div className='row'>
              {/* Name */}
              <div className='col-md-4 mb-3'>
                <label
                  htmlFor='customerName'
                  className='form-label fw-semibold'
                  style={{ fontSize: '13px', color: '#495057' }}
                >
                  Customer Name
                </label>
                <Select
                  id='customerName'
                  name='customerName'
                  value={
                    customer.name
                      ? { label: customer.name, value: customer.name }
                      : null
                  }
                  onInputChange={(inputValue, { action }) => {
                    if (action === 'input-change') {
                      setCustomer({ ...customer, name: inputValue })
                    }
                  }}
                  onChange={selectedOption => {
                    if (!selectedOption) return
                    const selectedCustomer = allCustomers.find(
                      c => c.name === selectedOption.value
                    )
                    if (selectedCustomer) {
                      setCustomer({
                        name: selectedCustomer.name || '',
                        phone: selectedCustomer.contact || '',
                        email: selectedCustomer.email || '',
                        address: selectedCustomer.address || '',
                        gst: selectedCustomer.taxid || '',
                        deliveryPlace: selectedCustomer.deliveryPlace || '',
                        custid: selectedCustomer.id || ''
                      })
                    } else {
                      setCustomer({ ...customer, name: selectedOption.value })
                    }
                  }}
                  options={allCustomers.map(c => ({
                    label: c.name,
                    value: c.name
                  }))}
                  placeholder='Type or select customer name'
                  isClearable
                  openMenuOnClick={true}
                  menuPlacement='auto'
                  menuPortalTarget={
                    typeof window !== 'undefined' ? document.body : null
                  }
                  styles={{ 
                    menuPortal: base => ({ ...base, zIndex: 9999 }),
                    control: (base) => ({
                      ...base,
                      borderColor: lightTheme.borderColor,
                      '&:hover': { borderColor: lightTheme.primaryButton }
                    })
                  }}
                  filterOption={(option, inputValue) =>
                    option.label
                      .toLowerCase()
                      .includes(inputValue.toLowerCase())
                  }
                />
              </div>

              {/* Phone */}
              <div className='col-md-4 mb-3'>
                <TextfieldwithLabel
                  id='customerPhone'
                  name='customerPhone'
                  value={customer.phone}
                  onChange={e =>
                    setCustomer({ ...customer, phone: e.target.value })
                  }
                  type='tel'
                  lable='Phone Number'
                  style={{
                    borderColor: lightTheme.borderColor,
                    backgroundColor: '#ffffff'
                  }}
                />
              </div>

              {/* Email */}
              <div className='col-md-4 mb-3'>
                <TextfieldwithLabel
                  id='customerEmail'
                  name='customerEmail'
                  value={customer.email}
                  onChange={e =>
                    setCustomer({ ...customer, email: e.target.value })
                  }
                  type='email'
                  lable='Email'
                  style={{
                    borderColor: lightTheme.borderColor,
                    backgroundColor: '#ffffff'
                  }}
                />
              </div>

              {/* Address */}
              <div className='col-md-6 mb-3'>
                <TextfieldwithLabel
                  id='customerAddress'
                  name='customerAddress'
                  value={customer.address}
                  onChange={e =>
                    setCustomer({ ...customer, address: e.target.value })
                  }
                  type='text'
                  lable='Address'
                  style={{
                    borderColor: lightTheme.borderColor,
                    backgroundColor: '#ffffff'
                  }}
                />
              </div>

              {/* GST No */}
              <div className='col-md-3 mb-3'>
                <TextfieldwithLabel
                  id='customerGST'
                  name='customerGST'
                  value={customer.gst}
                  onChange={e =>
                    setCustomer({ ...customer, gst: e.target.value })
                  }
                  type='text'
                  lable='GST Number (Optional)'
                  style={{
                    borderColor: lightTheme.borderColor,
                    backgroundColor: '#ffffff'
                  }}
                />
              </div>

              {/* Place of Delivery */}
              <div className='col-md-3 mb-3'>
                <TextfieldwithLabel
                  id='customerDeliveryPlace'
                  name='customerDeliveryPlace'
                  value={customer.deliveryPlace}
                  onChange={e =>
                    setCustomer({
                      ...customer,
                      deliveryPlace: e.target.value
                    })
                  }
                  type='text'
                  lable='Place of Delivery'
                  style={{
                    borderColor: lightTheme.borderColor,
                    backgroundColor: '#ffffff'
                  }}
                />
              </div>
              <div className='col-md-12 mb-2'>
                <button 
                  className='btn'
                  onClick={() => setShowAddCustomerModal(true)}
                  style={{
                    backgroundColor: lightTheme.primaryButton,
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '8px 16px'
                  }}
                >
                  ➕ Add New Customer
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Barcode Scanner Section */}
      <div style={{ 
        backgroundColor: lightTheme.cardBackground, 
        border: `1px solid ${lightTheme.borderColor}`,
        borderRadius: '8px',
        padding: '20px',
        marginBottom: '20px'
      }}>
        <div className='row mb-4'>
          <div className='col-md-4'>
            <form onSubmit={handleScan}>
              <Textfield
                className='form-control'
                id={`itemCode`}
                value={barcode}
                onChange={e => setBarcode(e.target.value)}
                type='text'
                name='itemCode'
                placeholder='Scan or enter Item Code'
                style={{
                  borderColor: lightTheme.borderColor,
                  backgroundColor: '#ffffff'
                }}
              />
            </form>
          </div>
          <div className='col-md-4'>
            <form onSubmit={handleScan}>
              <Textfield
                className='form-control'
                label='Barcode'
                id={`barcode`}
                value={barcode}
                onChange={e => setBarcode(e.target.value)}
                type='text'
                name='barcode'
                placeholder='Scan or enter barcode'
                style={{
                  borderColor: lightTheme.borderColor,
                  backgroundColor: '#ffffff'
                }}
              />
            </form>
          </div>
          <div className='col-md-4'>
            <button 
              className='btn'
              type='submit'
              onClick={handleScan}
              style={{
                backgroundColor: lightTheme.primaryButton,
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                padding: '8px 16px'
              }}
            >
              Scan Now !
            </button>
          </div>
        </div>
      </div>

      {/* Items Table */}
      <div style={{ 
        backgroundColor: lightTheme.cardBackground, 
        border: `1px solid ${lightTheme.borderColor}`,
        borderRadius: '8px',
        padding: '20px',
        marginBottom: '20px'
      }}>
        <div style={{ 
          backgroundColor: lightTheme.headerBackground,
          padding: '10px 15px',
          borderRadius: '6px',
          marginBottom: '15px',
          borderLeft: `4px solid ${lightTheme.successButton}`
        }}>
          <h5 className='m-0' style={{ color: '#495057' }}>Add Items</h5>
        </div>
        <div className='table-responsive'>
          <table className='table' style={{ fontSize: '12px', backgroundColor: '#ffffff' }}>
            <thead style={{ backgroundColor: lightTheme.tableHeader }}>
              <tr style={{ fontSize: '12px' }}>
                <th style={{ fontSize: '11px', color: '#495057' }}>S.No</th>
                <th style={{ fontSize: '11px', color: '#495057' }}>Item Name</th>
                <th style={{ fontSize: '11px', color: '#495057' }}>Description</th>
                <th style={{ fontSize: '11px', color: '#495057' }}>Rate</th>
                <th style={{ fontSize: '11px', color: '#495057' }}>Qty</th>
                <th style={{ fontSize: '11px', color: '#495057' }}>Amount</th>
                <th style={{ fontSize: '11px', color: '#495057' }}>Disc%</th>
                <th style={{ fontSize: '11px', color: '#495057' }}>Disc Value</th>
                {taxType === 'vat' ? (
                  <th style={{ fontSize: '11px', color: '#495057' }}>VAT%</th>
                ) : (
                  <>
                    <th style={{ fontSize: '11px', color: '#495057' }}>CGST%</th>
                    <th style={{ fontSize: '11px', color: '#495057' }}>SGST%</th>
                    <th style={{ fontSize: '11px', color: '#495057' }}>IGST%</th>
                  </>
                )}
                <th style={{ fontSize: '11px', color: '#495057' }}>Net Amount</th>
                <th style={{ fontSize: '11px', color: '#495057' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {itemRows.map((row, index) => (
                <tr key={row.id} 
                    style={{ cursor: 'pointer', fontSize: '12px' }}
                    onClick={() => setEditableRowIndex(index)}
                >
                  <td>{index + 1}</td>

                  {/* Item Name */}
                  <td style={{ position: 'relative', minWidth: 220 }}>
                    {editableRowIndex === index ? (
                      <Select
                        id={`itemName-${index}`}
                        ref={el => (itemNameRefs.current[index] = el)}
                        value={
                          row.itemName
                            ? { label: row.itemName, value: row.itemName }
                            : null
                        }
                        onInputChange={(inputValue, { action }) => {
                          if (action === 'input-change')
                            handleRowChange(index, 'itemName', inputValue)
                        }}
                        onChange={(selectedOption, { action }) => {
                          if (!selectedOption) return
                          const selectedItem = allItems.find(
                            item => item.iname === selectedOption.value
                          )
                          if (selectedItem) {
                            handleItemSelect(index, selectedItem)
                            setTimeout(() => {
                              const descInput = document.getElementById(
                                `description-${index}`
                              )
                              if (descInput) descInput.focus()
                            }, 0)
                          }
                        }}
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            if (!row.itemName) return
                            setTimeout(() => {
                              if (
                                document.activeElement &&
                                document.activeElement.getAttribute('id') ===
                                `itemName-${index}`
                              ) {
                                addNewRow(true)
                              }
                            }, 0)
                          }
                        }}
                        options={allItems.map(item => ({
                          label: item.iname,
                          value: item.iname
                        }))}
                        placeholder='Type or select item name'
                        isClearable
                        openMenuOnClick={true}
                        menuPlacement='auto'
                        menuPortalTarget={document.body}
                        styles={{
                          menuPortal: base => ({ ...base, zIndex: 9999 }),
                          control: (base) => ({
                            ...base,
                            borderColor: lightTheme.borderColor,
                            '&:hover': { borderColor: lightTheme.primaryButton }
                          })
                        }}
                        filterOption={(option, inputValue) =>
                          option.label
                            .toLowerCase()
                            .includes(inputValue.toLowerCase())
                        }
                      />
                    ) : (
                      <span style={{ color: row.itemName ? '#495057' : lightTheme.textMuted }}>
                        {row.itemName || 'Click to edit'}
                      </span>
                    )}
                  </td>

                  {/* Description */}
                  <td>
                    {editableRowIndex === index ? (
                      <Textfield
                        id={`description-${index}`}
                        value={row.description}
                        onChange={e =>
                          handleRowChange(
                            index,
                            'description',
                            e.target.value
                          )
                        }
                        type='text'
                        name='description'
                        style={{
                          borderColor: lightTheme.borderColor,
                          backgroundColor: '#ffffff'
                        }}
                      />
                    ) : (
                      <span style={{ color: '#495057' }}>{row.description}</span>
                    )}
                  </td>

                  {/* Rate */}
                  <td>
                    {editableRowIndex === index ? (
                      <Textfield
                        id={`rate-${index}`}
                        value={row.rate}
                        onChange={e =>
                          handleRowChange(
                            index,
                            'rate',
                            parseFloat(e.target.value) || 0
                          )
                        }
                        type='number'
                        name='rate'
                        style={{
                          borderColor: lightTheme.borderColor,
                          backgroundColor: '#ffffff'
                        }}
                      />
                    ) : (
                      <span style={{ color: '#495057' }}>{row.rate.toFixed(2)}</span>
                    )}
                  </td>

                  {/* Qty */}
                  <td>
                    {editableRowIndex === index ? (
                      <Textfield
                        id={`qty-${index}`}
                        value={row.quantity}
                        onChange={e =>
                          handleRowChange(
                            index,
                            'quantity',
                            parseInt(e.target.value) || 1
                          )
                        }
                        type='number'
                        name='quantity'
                        style={{
                          borderColor: lightTheme.borderColor,
                          backgroundColor: '#ffffff'
                        }}
                      />
                    ) : (
                      <span style={{ color: '#495057' }}>{row.quantity}</span>
                    )}
                  </td>

                  {/* Amount */}
                  <td style={{ color: '#495057' }}>{row.amount.toFixed(2)}</td>

                  {/* Disc% */}
                  <td>
                    {editableRowIndex === index ? (
                      <Textfield
                        id={`disc-${index}`}
                        value={row.discountPercent}
                        onChange={e =>
                          handleRowChange(
                            index,
                            'discountPercent',
                            parseFloat(e.target.value) || 0
                          )
                        }
                        type='number'
                        name='discountPercent'
                        style={{
                          borderColor: lightTheme.borderColor,
                          backgroundColor: '#ffffff'
                        }}
                      />
                    ) : (
                      <span style={{ color: '#495057' }}>{row.discountPercent}</span>
                    )}
                  </td>

                  {/* Disc Value */}
                  <td style={{ color: '#495057' }}>{row.discountValue.toFixed(2)}</td>

                  {/* VAT% or GST fields */}
                  {taxType === 'vat' ? (
                    <td>
                      {editableRowIndex === index ? (
                        <Textfield
                          id={`vat-${index}`}
                          value={row.vat}
                          onChange={e =>
                            handleRowChange(
                              index,
                              'vat',
                              parseFloat(e.target.value) || 0
                            )
                          }
                          type='number'
                          name='vat'
                          style={{
                            borderColor: lightTheme.borderColor,
                            backgroundColor: '#ffffff'
                          }}
                        />
                      ) : (
                        <span style={{ color: '#495057' }}>{row.vat}</span>
                      )}
                    </td>
                  ) : (
                    <>
                      <td>
                        {editableRowIndex === index ? (
                          <Textfield
                            id={`cgst-${index}`}
                            value={row.cgst}
                            onChange={e =>
                              handleRowChange(
                                index,
                                'cgst',
                                parseFloat(e.target.value) || 0
                              )
                            }
                            type='number'
                            name='cgst'
                            style={{
                              borderColor: lightTheme.borderColor,
                              backgroundColor: '#ffffff'
                            }}
                          />
                        ) : (
                          <span style={{ color: '#495057' }}>{row.cgst}</span>
                        )}
                      </td>
                      <td>
                        {editableRowIndex === index ? (
                          <Textfield
                            id={`sgst-${index}`}
                            value={row.sgst}
                            onChange={e =>
                              handleRowChange(
                                index,
                                'sgst',
                                parseFloat(e.target.value) || 0
                              )
                            }
                            type='number'
                            name='sgst'
                            style={{
                              borderColor: lightTheme.borderColor,
                              backgroundColor: '#ffffff'
                            }}
                          />
                        ) : (
                          <span style={{ color: '#495057' }}>{row.sgst}</span>
                        )}
                      </td>
                      <td>
                        {editableRowIndex === index ? (
                          <Textfield
                            id={`igst-${index}`}
                            value={row.igst}
                            onChange={e =>
                              handleRowChange(
                                index,
                                'igst',
                                parseFloat(e.target.value) || 0
                              )
                            }
                            type='number'
                            name='igst'
                            style={{
                              borderColor: lightTheme.borderColor,
                              backgroundColor: '#ffffff'
                            }}
                          />
                        ) : (
                          <span style={{ color: '#495057' }}>{row.igst}</span>
                        )}
                      </td>
                    </>
                  )}

                  {/* Net Amount */}
                  <td>
                    <span style={{ color: '#495057' }}>{row.netAmount.toFixed(2)}</span>
                    <br />
                    <small className={row.taxIncluded ? 'text-success' : 'text-warning'}>
                      {row.taxIncluded ? 'Tax Included' : 'Tax Excluded'}
                    </small>
                  </td>

                  {/* Delete Button */}
                  <td>
                    <button
                      className='btn btn-sm'
                      onClick={e => {
                        e.stopPropagation()
                        deleteRow(index)
                      }}
                      style={{
                        backgroundColor: lightTheme.dangerButton,
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        padding: '4px 8px'
                      }}
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <button 
            className='btn mt-2'
            onClick={addNewRow}
            style={{
              backgroundColor: lightTheme.primaryButton,
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              padding: '8px 16px'
            }}
          >
            ➕ Add Row
          </button>
        </div>
      </div>

      {/* Summary and Payment Section */}
      <div className='row mb-4'>
        <div className='col-md-6'>
          <div style={{ 
            backgroundColor: lightTheme.cardBackground, 
            border: `1px solid ${lightTheme.borderColor}`,
            borderRadius: '8px',
            padding: '20px'
          }}>
            <div className='d-flex align-items-center justify-content-between flex-wrap gap-2' style={{ minHeight: 60 }}>
              <div className='d-flex flex-column' style={{ minWidth: 220 }}>
                <label className='fw-semibold mb-1' style={{ color: '#495057' }}>Quotation Valid Until:</label>
                <input
                  type="date"
                  className='form-control'
                  value={validUntil}
                  onChange={e => setValidUntil(e.target.value)}
                  style={{
                    maxWidth: 200,
                    borderColor: lightTheme.borderColor,
                    backgroundColor: '#ffffff'
                  }}
                />
              </div>
              <div className='text-right' style={{ minWidth: 200 }}>
                <h5 className='mb-0' style={{ color: '#495057' }}>
                  Grand Total: <strong style={{ color: lightTheme.successButton }}>฿ {quotationSummary.grandTotal.toFixed(2)}</strong>
                </h5>
                <small style={{ color: lightTheme.textMuted }}>
                  {getAmountInWords(quotationSummary.grandTotal)}
                </small>
              </div>
            </div>
          </div>
        </div>
        <div className='col-md-6'>
          <div style={{ 
            backgroundColor: lightTheme.cardBackground, 
            border: `1px solid ${lightTheme.borderColor}`,
            borderRadius: '8px',
            padding: '20px'
          }}>
            <div style={{ 
              backgroundColor: lightTheme.headerBackground,
              padding: '10px 15px',
              borderRadius: '6px',
              marginBottom: '15px',
              borderLeft: `4px solid ${lightTheme.successButton}`
            }}>
              <div className='d-flex justify-content-between align-items-center'>
                <h5 className='m-0' style={{ color: '#495057' }}>Quotation Summary</h5>
                <i className='fas fa-calculator fa-2x' style={{ color: lightTheme.textMuted }}></i>
              </div>
            </div>
            <div className='row gy-3 text-lg'>
              <div className='col-md-4'>
                <label className='fw-semibold' style={{ fontSize: '14px', color: '#495057' }}>Item Total</label>
                <div style={{ fontSize: '14px', color: '#495057' }}>
                  ฿ {quotationSummary.itemTotal.toFixed(2)}
                </div>
              </div>
              <div className='col-md-4'>
                <label className='fw-semibold' style={{ fontSize: '14px', color: '#495057' }}>Discount</label>
                <div style={{ fontSize: '14px', color: '#495057' }}>
                  ฿ {quotationSummary.discount.toFixed(2)}
                </div>
              </div>
              <div className='col-md-4'>
                <label className='fw-semibold' style={{ fontSize: '14px', color: '#495057' }}>Sub Total</label>
                <div style={{ fontSize: '14px', color: '#495057' }}>
                  ฿ {quotationSummary.subTotal.toFixed(2)}
                </div>
              </div>
              <div className='col-md-4'>
                <label className='fw-semibold' style={{ fontSize: '14px', color: '#495057' }}>Tax</label>
                <div style={{ fontSize: '14px', color: '#495057' }}>
                  {quotationSummary.taxPercent}: ฿ {quotationSummary.tax.toFixed(2)}
                </div>
              </div>
              <div className='col-md-4'>
                <label className='fw-semibold' style={{ fontSize: '14px', color: '#495057' }}>Round Off</label>
                <div style={{ fontSize: '14px', color: '#495057' }}>
                  ฿ {quotationSummary.roundOff.toFixed(2)}
                </div>
              </div>
              <div className='col-md-4'>
                <label className='fw-bold' style={{ fontSize: '14px', color: '#495057' }}>Grand Total</label>
                <div className='fw-bold' style={{ fontSize: '14px', color: lightTheme.successButton }}>
                  ฿ {quotationSummary.grandTotal.toFixed(2)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons Row */}
      <div className='row mb-4'>
        <div className='col-md-12'>
          <div style={{ 
            backgroundColor: lightTheme.cardBackground, 
            border: `1px solid ${lightTheme.borderColor}`,
            borderRadius: '8px',
            padding: '20px'
          }}>
            <div className='d-flex flex-wrap gap-2 justify-content-end'>
              <button
                className='btn'
                onClick={async () => {
                  // Validate
                  if (!customer.name || !customer.phone) {
                    toast.error('Please enter customer name and phone.');
                    return;
                  }
                  if (itemRows.length === 0) {
                    toast.error('Please add at least one item.');
                    return;
                  }
                  try {
                    const setupDate = await getNextSetupDate();
                    
                    // Fetch last quotation number and generate next one
                    const currentYear = new Date().getFullYear();
                    let nextQuotationNumber = `QUO-${currentYear}-0001`; // Default fallback for new year
                    
                    try {
                      const lastQuotationResponse = await axios.get('/getlatestrecord/quotations', getHeaders());
                      console.log('Last quotation response:', lastQuotationResponse.data);
                      
                      if (lastQuotationResponse.data && lastQuotationResponse.data.success) {
                        const responseData = lastQuotationResponse.data.data;
                        
                        // Use the next_quotation_number provided by backend
                        if (responseData && responseData.next_quotation_number) {
                          nextQuotationNumber = responseData.next_quotation_number;
                          console.log('Using backend generated quotation number:', nextQuotationNumber);
                        } else {
                          console.log('No next_quotation_number in response, using default');
                        }
                      } else if (lastQuotationResponse.data && lastQuotationResponse.data.message === 'No records found in the table') {
                        // No records found, use default
                        console.log('No quotations found in database, starting with:', nextQuotationNumber);
                      }
                    } catch (error) {
                      console.error('Error fetching last quotation number:', error);
                      // Use default if fetch fails - start with 0001 for current year
                      console.log('Error occurred, using default quotation number:', nextQuotationNumber);
                    }
                    
                    console.log('Next quotation number:', nextQuotationNumber);
                    
                    // Prepare quotation data
                    const quotationData = {
                      quotation_number: nextQuotationNumber,
                      customer_id: customer.custid || null,
                      customer_name: customer.name,
                      customer_phone: customer.phone,
                      customer_email: customer.email,
                      customer_address: customer.address,
                      customer_gst: customer.gst,
                      delivery_place: customer.deliveryPlace || '',
                      subtotal: quotationSummary.itemTotal || 0,
                      discount_type: discountType || 'amount',
                      discount_value: discountValue || 0,
                      subtotal_afterdiscount: quotationSummary.subTotal || 0,
                      tax: quotationSummary.tax || 0,
                      round_off: quotationSummary.roundOff || 0,
                      grand_total: quotationSummary.grandTotal || 0,
                      status: 'pending',
                      valid_until: validUntil,
                      setup_date: setupDate
                    };
                    
                    // Save quotation and get quotation_id
                    const res = await axios.post(
                      '/insertdata/quotations',
                      quotationData,
                      getHeaders()
                    );
                    
                    console.log('Quotation API Response:', res.data);
                    
                    const quotation_id = res.data.id || res.data.insertId;
                    const quotation_no = res.data.quotation_number || nextQuotationNumber;
                    
                    // Prepare quotation items
           const quotationItems = itemRows.map(row => ({
                    order_number: quotation_id,
                    invoice_number: quotation_no,
                    table_number: customer.deliveryPlace || '',
                    item_name: row.itemName,
                    quantity: row.quantity,
                    total_amount: row.netAmount,
                    status: '1',
                    setup_date: setupDate
           }));
                    
                    console.log('quotationItems', quotationItems);

                    // Insert quotation items
                    await axios.post(
                      '/insertdatabulk/quotation_items',
                      { items: quotationItems },
                      getHeaders()
                    );
                    
                    toast.success(
                      `Quotation generated successfully. Quotation No: ${quotation_no || quotation_id}`
                    );
                    
                    // Store quotation data for printing
                    const quotationDataForPrint = {
                      id: quotation_id,
                      quotation_number: quotation_no,
                      setup_date: setupDate,
                      valid_until: validUntil,
                      customer_name: customer.name,
                      customer_phone: customer.phone,
                      customer_email: customer.email,
                      customer_address: customer.address,
                      customer_gst: customer.gst,
                      delivery_place: customer.deliveryPlace,
                      subtotal: quotationSummary.itemTotal,
                      subtotal_afterdiscount: quotationSummary.subTotal,
                      tax: quotationSummary.tax,
                      round_off: quotationSummary.roundOff,
                      grand_total: quotationSummary.grandTotal,
                      items: itemRows.map(row => ({
                        item_name: row.itemName,
                        quantity: row.quantity,
                        total_amount: row.netAmount
                      }))
                    };
                    
                    console.log('Quotation data for printing:', quotationDataForPrint);
                    setLastSavedQuotation(quotationDataForPrint);
                    
                    // Auto print quotation after saving
                    // setTimeout(() => {
                    //   printQuotation();
                    // }, 1000);
                    
                    // Reset all data for next quotation
                    setItemRows([]);
                    setCustomer({
                      name: '',
                      phone: '',
                      email: '',
                      address: '',
                      gst: '',
                      deliveryPlace: ''
                    });
                    setDiscountValue(0);
                    setDiscountType('percentage');
                    // Reset valid until to 30 days from now
                    const newDate = new Date();
                    newDate.setDate(newDate.getDate() + 30);
                    setValidUntil(newDate.toISOString().split('T')[0]);
                    
                  } catch (err) {
                    console.error('Error saving quotation:', err);
                    toast.error('Error saving quotation.');
                  }
                }}
                style={{
                  backgroundColor: lightTheme.successButton,
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '10px 20px'
                }}
              >
                💾 Save Quotation
              </button>

              <button
                className='btn'
                onClick={() => {
                  setItemRows([])
                  setCustomer({
                    name: '',
                    phone: '',
                    email: '',
                    address: '',
                    gst: '',
                    deliveryPlace: ''
                  })
                  // Reset valid until to 30 days from now
                  const newDate = new Date();
                  newDate.setDate(newDate.getDate() + 30);
                  setValidUntil(newDate.toISOString().split('T')[0]);
                }}
                style={{
                  backgroundColor: lightTheme.dangerButton,
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '10px 20px'
                }}
              >
                ❌ Cancel Quotation
              </button>

              <button 
                className='btn'
                style={{
                  backgroundColor: lightTheme.warningButton,
                  color: '#495057',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '10px 20px'
                }}
              >
                🔄 Reset Quotation
              </button>

              <button
                className='btn'
                onClick={printQuotation}
                style={{
                  backgroundColor: lightTheme.primaryButton,
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '10px 20px'
                }}
              >
                🖨️ Print Quotation
              </button>
              
              <button
                className='btn'
                onClick={() => setShowHistoryModal(true)}
                style={{
                  backgroundColor: '#9c88ff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '10px 20px'
                }}
              >
                📜 Quotation History
              </button>

              <button 
                className='btn'
                style={{
                  backgroundColor: lightTheme.infoButton,
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '10px 20px'
                }}
              >
                🧾 Templates
              </button>

              <button
                className='btn'
                onClick={() => {
                  // Convert quotation to sale
                  navigate('/sale/newsale', { 
                    state: { 
                      customer, 
                      itemRows, 
                      fromQuotation: true 
                    } 
                  });
                }}
                style={{
                  backgroundColor: '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '10px 20px'
                }}
              >
                💰 Convert to Sale
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Add New Customer Modal */}
      <AddCustomerModal
        show={showAddCustomerModal}
        onClose={() => setShowAddCustomerModal(false)}
        onSubmit={handleAddCustomer}
        newCustomer={newCustomer}
        handleInput={handleNewCustomerInput}
      />

      {/* Quotation History Modal */}
      {showHistoryModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(0,0,0,0.3)',
          zIndex: 2000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{
            background: '#fff',
            borderRadius: 12,
            minWidth: 400,
            minHeight: 200,
            maxWidth: '90vw',
            maxHeight: '80vh',
            boxShadow: '0 4px 24px rgba(0,0,0,0.18)',
            padding: 32,
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <button
              onClick={() => setShowHistoryModal(false)}
              style={{
                position: 'absolute',
                top: 12,
                right: 16,
                background: 'transparent',
                border: 'none',
                fontSize: 24,
                cursor: 'pointer',
                color: '#888'
              }}
            >
              &times;
            </button>
            <h4 style={{ marginBottom: 24 }}>Quotation History</h4>
            {/* TODO: Add history table/list here */}
            <div style={{ color: '#888' }}>[Quotation history content goes here]</div>
          </div>
        </div>
      )}
    </div>
  );

  // Conditional rendering based on user type
  return isCashier ? (
    renderContent()
  ) : (
    <Layout>
      <Header title='Quotation System' />
      {renderContent()}
    </Layout>
  );
}
