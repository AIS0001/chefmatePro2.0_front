import React, { useState, useEffect, useRef } from 'react';
import AddCustomerModal from '../../components/Modals/addCustomer';
import Select from 'react-select';
import axios from 'axios';
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import CardComponent from '../../components/cards/CardComponent';
import { Textfield, TextfieldwithLabel } from '../../components/Buttons/Textfield';
import getAmountInWords from '../../components/numbertoWords';
import fetchData from '../../functions/fetchData';
import { getHeaders } from '../../utility/getHeader';
import { GSTInvoicePrintPreview } from '../../components/Templates/gstTemplates';
import { VATInvoicePrintPreview } from '../../components/Templates/vatemplate';
import { VAT2InvoicePrintPreview } from '../../components/Templates/vattemplate2';
import customerDisplayManager from '../../services/CustomerDisplayManager';
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

export default function Sale() {
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
    if (userType === 'Admin') {
      navigate('/dashboard'); // Analytics dashboard for admin
    } else if (userType === 'Cashier') {
      navigate('/CashierDashboard'); // Cashier dashboard
    } else {
      navigate('/dashboard'); // Default dashboard
    }
  };

  // Logout function
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('usertype');
    localStorage.removeItem('username');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('usertype');
    sessionStorage.removeItem('username');
    navigate('/login');
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
  const [showCustomerDetails, setShowCustomerDetails] = useState(true) // New state for Customer Details visibility
  const [showScanCode, setShowScanCode] = useState(true) // New state for Scan Code section visibility
  const [gstInvoiceProps, setGstInvoiceProps] = useState(null);
  const [vatInvoiceProps, setVatInvoiceProps] = useState(null);

  
  const [customerDetails, setCustomerDetails] = useState({
    name: '',
    phone: ''
  })
  const [showModal, setShowModal] = useState(false)
  const [modalInvoiceData, setModalInvoiceData] = useState({
    companyDetails: {},
    customerDetails: {},
    data: [],
    bill_id: ''
  })
  const [itemRows, setItemRows] = useState([])
  const [isCustomerDisplayOpen, setIsCustomerDisplayOpen] = useState(false)
  const companyDetails = {
    name: 'Veloura Pvt. Ltd.',
    address: '123 Beach Road, Pattaya, Thailand',
    phone: '+66 987 654 321',
    email: 'info@veloura.com'
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
  const [invoiceSummary, setInvoiceSummary] = useState({
    itemTotal: 0,
    discount: 0,
    subTotal: 0,
    tax: 0,
    roundOff: 0,
    grandTotal: 0
  })
  // Update invoice summary calculation
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
    // For tax-included items, itemTotal should be the base amount (before tax)
    // For tax-excluded items, itemTotal should be the amount (before tax is added)
    itemTotal = itemRows.reduce((sum, r) => sum + r.amount, 0);
    discount = itemRows.reduce((sum, r) => sum + r.discountValue, 0);
    subTotal = itemTotal - discount;
    // Calculate tax percent and value
    if (taxType === 'vat') {
      // VAT: use first nonzero VAT% as display
      const vatRows = itemRows.filter(r => r.vat > 0);
      taxPercent = vatRows.length > 0 ? vatRows[0].vat : 0;
      // If any item is taxIncluded, extract tax from netAmount, else add tax on top
      const hasIncludedTax = vatRows.some(r => r.taxIncluded);
      if (hasIncludedTax) {
        // Tax included: extract tax from netAmount (which is amount - discount)
        taxValue = itemRows.reduce((sum, r) => {
          if (r.taxIncluded && r.vat > 0) {
            // Extract VAT from net amount: VAT = netAmount - (netAmount / (1 + vat%))
            return sum + (r.netAmount - (r.netAmount / (1 + (r.vat / 100))));
          }
          return sum;
        }, 0);
      } else {
        // Tax excluded: add tax on top
        taxValue = itemRows.reduce((sum, r) => {
          if (!r.taxIncluded && r.vat > 0) {
            return sum + ((r.amount - r.discountValue) * (r.vat / 100));
          }
          return sum;
        }, 0);
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
  setInvoiceSummary({
    itemTotal,
    discount,
    subTotal,
    tax: taxValue,
    taxPercent: taxPercentDisplay,
    roundOff,
    grandTotal
  });
  
  // Update customer display when cart changes
  if (itemRows.length > 0) {
    customerDisplayManager.updateCart(itemRows, grandTotal);
  }
}, [itemRows, taxType])
  const [allItems, setAllItems] = useState([]) // from DB
  const [suggestions, setSuggestions] = useState({}) // {rowIndex: [items]}
  const [taxes, setTaxes] = useState([]); // All taxes from DB
  const [lastSavedInvoice, setLastSavedInvoice] = useState(null); // For printing

  // const baseURL = 'http://localhost:4402';

  //const baseURL = 'https://www.sharmachefapi.cloudnetsoftwares.com'
   // const baseURL = 'https://www.chefmateapi.cloudnetsoftwares.com';
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

    // Tax-included/excluded logic (strict: amount is always base price, netAmount is final price paid)
    // Ensure taxIncluded is set if missing
    if (row.taxIncluded === undefined) {
      row.taxIncluded = taxes.length > 0 && taxes[0] && (taxes[0].included === true || taxes[0].included === 'true');
    }
    const included = row.taxIncluded;
    
    console.log('handleRowChange called:', {
      index,
      field,
      value,
      included,
      rate: row.rate,
      vat: row.vat,
      taxes: taxes.map(t => ({ id: t.id, name: t.taxname, value: t.taxvalue, included: t.included }))
    });
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
      // Tax is included in price: amount = rate * quantity, net = amount - discount (NO TAX ADDED)
      amount = rate * quantity; // Full tax-inclusive amount
      discountValue = amount * (discountPercent / 100); // Discount on full amount  
      netAmount = amount - discountValue; // Net amount after discount (NO TAX ADDED!)
      console.log('handleRowChange - Tax Included:', { rate, quantity, amount, discountValue, netAmount });
    } else {
      // Tax is excluded: add tax after discount
      amount = rate * quantity;
      discountValue = amount * (discountPercent / 100);
      netAmount = (amount - discountValue) * (1 + (totalTaxPercent / 100));
    }

    row.amount = amount;
    row.discountValue = discountValue;
    row.netAmount = netAmount;

    console.log('handleRowChange result:', {
      index,
      included,
      amount,
      netAmount,
      discountValue,
      calculation: included ? 'Tax Included: net = amount - discount' : 'Tax Excluded: net = (amount - discount) * (1 + tax%)'
    });

    setItemRows(updatedRows)
  }
  // Add global shortcut for adding new row (Ctrl+Enter for Windows/Linux, Cmd+Enter for Mac)
  // and removing last row added by shortcut (Ctrl+Del)
  useEffect(() => {
    const handleShortcut = e => {
      // For Windows/Linux: Ctrl+Enter, for Mac: Meta+Enter
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
              amount: 0,
              discountValue: 0,
              netAmount: 0,
              taxIncluded: taxes.length > 0 && taxes[0] && (taxes[0].included === true || taxes[0].included === 'true')
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
      // Try to focus react-select input
      const select = itemNameRefs.current[editableRowIndex]
      if (select && select.focus) {
        select.focus()
      } else if (select && select.select && select.select.inputRef) {
        select.select.inputRef.focus()
      } else {
        // Fallback: try to find the input inside react-select
        const input = document.querySelector(
          `#itemName-${editableRowIndex} input`
        )
        if (input) input.focus()
      }
    }
  }, [editableRowIndex, itemRows.length])

  const addNewRow = (focus = false) => {
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
          amount: 0,
          discountValue: 0,
          netAmount: 0,
          taxIncluded: taxes.length > 0 && taxes[0] && (taxes[0].included === true || taxes[0].included === 'true')
        }
      ]
      if (focus) {
        setTimeout(() => {
          const nextIndex = newRows.length - 1
          setEditableRowIndex(nextIndex)
          if (itemNameRefs.current[nextIndex]) {
            itemNameRefs.current[nextIndex].focus()
          }
        }, 100)
      }
      return newRows
    })
  }

  const deleteRow = index => {
    const updated = [...itemRows]
    updated.splice(index, 1)
    setItemRows(updated)
  }
  const handleBillHistory = async () => {
    navigate(`/reports/billhistorygst`);
  };
  const handlenewCustomer = async () => {
    navigate(`/master/newcustomer`);
  };
  const handleScan = async e => {
  e.preventDefault();
  if (!barcode) return;
  try {
    // Use fetchData to get item by barcode
    const itemsArr = await fetchData('items', () => {}, 'id', { id: barcode });
    const item = itemsArr && itemsArr[0];
    if (!item || item.stock <= 0) {
      toast.error('Item not found or out of stock.');
      return;
    }
    // Check if item already exists in itemRows
    const existingIndex = itemRows.findIndex(r => r.itemName === item.iname);
    if (existingIndex !== -1) {
      // If exists, increment quantity
      const updatedRows = [...itemRows];
      updatedRows[existingIndex].quantity += 1;
      
      // Check if tax is included from database configuration
      const taxIncluded = taxes.length > 0 && taxes[0] && (taxes[0].included === true || taxes[0].included === 'true');
      
      // Recalculate based on tax inclusion setting
      const rate = updatedRows[existingIndex].rate;
      const quantity = updatedRows[existingIndex].quantity;
      const discountPercent = updatedRows[existingIndex].discountPercent || 0;
      
      if (taxIncluded) {
        // Tax included: net amount = amount - discount (no tax added)
        updatedRows[existingIndex].amount = rate * quantity;
        updatedRows[existingIndex].discountValue = updatedRows[existingIndex].amount * (discountPercent / 100);
        updatedRows[existingIndex].netAmount = updatedRows[existingIndex].amount - updatedRows[existingIndex].discountValue;
        updatedRows[existingIndex].taxIncluded = true;
      } else {
        // Tax excluded: add tax on top
        updatedRows[existingIndex].amount = rate * quantity;
        updatedRows[existingIndex].discountValue = updatedRows[existingIndex].amount * (discountPercent / 100);
        
        const taxedAmount = updatedRows[existingIndex].amount - updatedRows[existingIndex].discountValue;
        const totalTaxPercent = (updatedRows[existingIndex].cgst || 0) + (updatedRows[existingIndex].sgst || 0) + (updatedRows[existingIndex].igst || 0) + (updatedRows[existingIndex].vat || 7);
        const totalTax = taxedAmount * (totalTaxPercent / 100);
        updatedRows[existingIndex].netAmount = taxedAmount + totalTax;
        updatedRows[existingIndex].taxIncluded = false;
      }
      
      console.log('Barcode scan - existing item updated:', {
        itemName: updatedRows[existingIndex].itemName,
        taxIncluded,
        amount: updatedRows[existingIndex].amount,
        netAmount: updatedRows[existingIndex].netAmount
      });

      setItemRows(updatedRows);
    } else {
      // Add new row to itemRows
      const basePrice = item.offerprice || 0;
      const discountPercent = 0;
      const discountValue = 0;
      
      // Check if tax is included from database configuration
      const taxIncluded = taxes.length > 0 && taxes[0] && (taxes[0].included === true || taxes[0].included === 'true');
      
      let netAmount;
      if (taxIncluded) {
        // Tax included: net amount = base price (no tax added)
        netAmount = basePrice - discountValue;
      } else {
        // Tax excluded: add tax on top
        const taxedAmount = basePrice - discountValue;
        const totalTaxPercent = (item.cgst || 0) + (item.sgst || 0) + (item.igst || 0) + (item.vat || 7);
        const totalTax = taxedAmount * (totalTaxPercent / 100);
        netAmount = taxedAmount + totalTax;
      }
      
      console.log('Barcode scan - new item added:', {
        itemName: item.iname,
        taxIncluded,
        basePrice,
        netAmount
      });

      setItemRows(prev => [
        ...prev,
        {
          id: Date.now(),
          itemName: item.iname,
          description: item.description || '',
          rate: basePrice,
          quantity: 1,
          amount: basePrice,
          discountPercent,
          discountValue,
          cgst: item.cgst || 0,
          sgst: item.sgst || 0,
          igst: item.igst || 0,
          vat: item.vat || 7,
          netAmount,
          taxIncluded: taxIncluded,
          taxIncluded: taxes.length > 0 && taxes[0] && (taxes[0].included === true || taxes[0].included === 'true')
        }
      ]);
    }
    setBarcode('');
  } catch (error) {
    toast.error('Error fetching item.');
  }
};

// Toggle customer display
const toggleCustomerDisplay = () => {
  if (isCustomerDisplayOpen) {
    customerDisplayManager.closeCustomerDisplay();
    setIsCustomerDisplayOpen(false);
  } else {
    customerDisplayManager.openSaleCustomerDisplay();
    setIsCustomerDisplayOpen(true);
    // Send current cart to display
    if (itemRows.length > 0) {
      customerDisplayManager.updateCart(itemRows, invoiceSummary.grandTotal);
    }
  }
};

  // Customer auto-suggestion state
  const [allCustomers, setAllCustomers] = useState([]) // All customers from DB

  // Fetch all customers for auto-suggestion
  useEffect(() => {
    fetchData('customers', setAllCustomers, 'id', {})
  }, [])
  // Print bill in A4 format using DB fetches (final_bill, order_items_gst, customers)
  // Accepts optional billId; if not provided, fetches latest bill

  // sale.js - Updated POS Component with barcode scanning and streamlined checkout features
  useEffect(() => {
    const newTotal = cart.reduce(
      (sum, item) => sum + item.offerprice * item.quantity,
      0
    )
    setTotal(newTotal)
  }, [cart])

  const calculateFinalTotal = () => {
    let discount = 0
    if (discountType === 'percentage') {
      discount = total * (discountValue / 100)
    } else {
      discount = discountValue
    }
    return Math.max(0, total - discount)
  }

  useEffect(() => {
    fetchData('items', setAllItems, 'id', {});
    fetchData('taxes', setTaxes, 'id', {});
  }, [])

  const handleItemSelect = (index, selectedItem) => {
    const updatedRows = [...itemRows];
    // Find tax row for this item (by tax name or value, fallback to first)
    let taxRow = null;
    if (taxType === 'vat') {
      taxRow = taxes.find(t => t.taxname && selectedItem.vat && (parseFloat(t.taxvalue) === parseFloat(selectedItem.vat)));
    } else {
      // For GST, try to match by cgst/sgst/igst or fallback
      taxRow = taxes.find(t => t.taxname && (
        (selectedItem.cgst && parseFloat(t.taxvalue) === parseFloat(selectedItem.cgst)) ||
        (selectedItem.sgst && parseFloat(t.taxvalue) === parseFloat(selectedItem.sgst)) ||
        (selectedItem.igst && parseFloat(t.taxvalue) === parseFloat(selectedItem.igst))
      ));
    }
    if (!taxRow && taxes.length > 0) taxRow = taxes[0];
    const included = taxRow && (taxRow.included === true || taxRow.included === 'true');
    console.log('Tax calculation debug:', {
      selectedItem: selectedItem.iname,
      taxRow: taxRow,
      included: included,
      taxType: taxType,
      rate: selectedItem.offerprice,
      taxesFromDB: taxes.map(t => ({ id: t.id, name: t.taxname, value: t.taxvalue, included: t.included }))
    });

    // Calculate price/tax logic (fix: for tax-included, netAmount = gross - discount on base, amount = base, tax = diff)
    let rate = selectedItem.offerprice || 0;
    let quantity = 1;
    let amount = 0;
    let discountPercent = 0;
    let discountValue = 0;
    let vat = taxType === 'vat' ? (selectedItem.vat || 7) : 0;
    let cgst = taxType === 'gst' ? (selectedItem.cgst || 0) : 0;
    let sgst = taxType === 'gst' ? (selectedItem.sgst || 0) : 0;
    let igst = taxType === 'gst' ? (selectedItem.igst || 0) : 0;
    let netAmount = 0;

    if (included) {
      // Tax included: the rate already includes tax - netAmount should equal amount
      amount = rate * quantity; // Amount is the full price (tax-inclusive) 
      discountValue = amount * (discountPercent / 100); // Discount on full amount
      netAmount = amount - discountValue; // Net amount = amount - discount (NO TAX ADDED!)
      console.log('Tax Included Calculation:', { rate, quantity, amount, discountValue, netAmount });
    } else {
      // Tax excluded: need to add tax on top
      amount = rate * quantity;
      discountValue = amount * (discountPercent / 100);
      if (taxType === 'vat') {
        netAmount = (amount - discountValue) * (1 + (vat / 100));
      } else {
        const totalTaxPercent = cgst + sgst + igst;
        netAmount = (amount - discountValue) * (1 + (totalTaxPercent / 100));
      }
    }

    updatedRows[index] = {
      ...updatedRows[index],
      itemName: selectedItem.iname,
      description: selectedItem.description || '',
      rate,
      quantity,
      amount,
      discountPercent,
      discountValue,
      vat,
      cgst,
      sgst,
      igst,
      netAmount,
      taxIncluded: included,
    };
    
    console.log('Item added to cart:', {
      itemName: selectedItem.iname,
      rate,
      amount, // Tax-inclusive amount
      netAmount, // Amount after discount (still tax-inclusive)
      taxIncluded: included,
      taxPercent: taxType === 'vat' ? vat : (cgst + sgst + igst),
      discountValue,
      calculation: included ? 'Tax Included: net = amount - discount' : 'Tax Excluded: net = (amount - discount) * (1 + tax)',
      taxRowFound: !!taxRow,
      taxRowIncluded: taxRow ? taxRow.included : 'no tax row'
    });
    setItemRows(updatedRows);
    setSuggestions(prev => ({ ...prev, [index]: [] })); // close suggestion
    setTimeout(() => {
      // Focus description field after selection
      const descInput = document.getElementById(`description-${index}`);
      if (descInput) descInput.focus();
    }, 0);
  };

  const printBill = () => {
    // Build invoice data from current state
    const finalTotal = calculateFinalTotal();
    
    const currentInvoiceData = {
      invoice_number: modalInvoiceData.invoice_number || 'DRAFT',
      setup_date: new Date(),
      payment_method: paymentType,
      customer_name: customer.name || customerDetails.name || 'Walk-in Customer',
      customer_phone: customer.phone || customerDetails.phone || 'N/A',
      customer_email: customer.email || customerDetails.email || '',
      customer_address: customer.address || customerDetails.address || '',
      customer_gst: customer.gst || customerDetails.gst || '',
      items: itemRows.map(row => ({
        item_name: row.itemName,
        rate: row.rate,
        quantity: row.quantity,
        discount_percent: row.discountPercent,
        total_amount: row.netAmount
      })),
      subtotal: invoiceSummary.itemTotal,
      discount_value: discountValue,
      tax: invoiceSummary.tax,
      round_off: invoiceSummary.roundOff,
      grand_total: invoiceSummary.grandTotal
    };

    // Use current data or fallback to lastSavedInvoice
    const invoiceData = lastSavedInvoice || currentInvoiceData;
    
    if (!invoiceData) {
      toast.error('No invoice data available for printing. Please add items first.');
      return;
    }

    // Use invoice_number for display, fallback to id if invoice_number is not available
    const invoiceNumber = invoiceData.invoice_number || invoiceData.id || 'DRAFT';

    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invoice - ${invoiceNumber}</title>
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
          .invoice-info {
            display: flex;
            justify-content: space-between;
            margin: 20px 0;
          }
          .invoice-details, .customer-details {
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

        <div class="invoice-info">
          <div class="invoice-details">
            <div class="section-title">Invoice Details</div>
            <div class="info-row"><strong>Invoice No:</strong> ${invoiceNumber}</div>
            <div class="info-row"><strong>Date:</strong> ${new Date(invoiceData.setup_date || Date.now()).toLocaleDateString('en-GB')}</div>
            <div class="info-row"><strong>Payment Method:</strong> ${invoiceData.payment_method || 'Cash'}</div>
          </div>
          <div class="customer-details">
            <div class="section-title">Customer Details</div>
            <div class="info-row"><strong>Name:</strong> ${invoiceData.customer_name || 'Walk-in Customer'}</div>
            <div class="info-row"><strong>Phone:</strong> ${invoiceData.customer_phone || 'N/A'}</div>
            ${invoiceData.customer_email ? `<div class="info-row"><strong>Email:</strong> ${invoiceData.customer_email}</div>` : ''}
            ${invoiceData.customer_address ? `<div class="info-row"><strong>Address:</strong> ${invoiceData.customer_address}</div>` : ''}
            ${invoiceData.customer_gst ? `<div class="info-row"><strong>Tax ID:</strong> ${invoiceData.customer_gst}</div>` : ''}
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
            ${invoiceData.items && invoiceData.items.length > 0 ? invoiceData.items.map((item, index) => `
              <tr>
                <td class="text-center">${index + 1}</td>
                <td>${item.item_name || item.iname || 'N/A'}</td>
                <td class="text-right">฿ ${((item.rate || item.offerprice || 0)).toFixed(2)}</td>
                <td class="text-center">${item.quantity || 0}</td>
                <td class="text-right">฿ ${((item.rate || item.offerprice || 0) * (item.quantity || 1)).toFixed(2)}</td>
                <td class="text-right">${item.discount_percent || 0}%</td>
                <td class="text-right">฿ ${(item.total_amount || item.quantity * item.offerprice || 0).toFixed(2)}</td>
              </tr>
            `).join('') : '<tr><td colspan="7" class="text-center">No items found</td></tr>'}
          </tbody>
        </table>

        <div class="summary-section">
          <table class="summary-table">
            <tr>
              <td>Subtotal:</td>
              <td class="text-right">฿ ${(invoiceData.subtotal || invoiceData.total || 0).toFixed(2)}</td>
            </tr>
            <tr>
              <td>Discount:</td>
              <td class="text-right">฿ ${(invoiceData.discount_value || 0).toFixed(2)}</td>
            </tr>
            <tr>
              <td>Tax(7%):</td>
              <td class="text-right">฿ ${(invoiceData.tax || 0).toFixed(2)}</td>
            </tr>
            <tr>
              <td>Round Off:</td>
              <td class="text-right">฿ ${(invoiceData.round_off || 0).toFixed(2)}</td>
            </tr>
            <tr class="total-row">
              <td><strong>Grand Total:</strong></td>
              <td class="text-right"><strong>฿ ${(invoiceData.grand_total || invoiceData.final_total || 0).toFixed(2)}</strong></td>
            </tr>
          </table>
        </div>

        <div class="signature-section">
          <div class="signature-left">
            <div style="font-size: 10px; color: #666; text-align: left;">
              <p>Thank you for your business!</p>
              <p>This is a computer generated invoice.</p>
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

  const handleCustomerSubmit = () => {
    if (!customerDetails.name || !customerDetails.phone) {
      toast.error('Please fill customer details')
      return
    }
    setShowCustomerModal(false)
    printBill()
  }
  useEffect(() => {
    const handleClickOutside = e => {
      if (!e.target.closest('tr')) {
        setEditableRowIndex(null)
      }
    }
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [])

  const [showInvoicePreview, setShowInvoicePreview] = useState(false)
  const [showVATInvoicePreview, setShowVATInvoicePreview] = useState(false)



  // Helper to build invoice props from current bill, dynamic by taxType
  async function getInvoiceProps(itemId = null) {
    let invId = itemId || window.lastSavedBillId || '';
    let myfinalbilldata = [];
    let myOrderItemsData = [];
    let myCustomerdetails = {};
    // Fetch from DB if invId is present
    if (invId) {
      myfinalbilldata = await fetchData("final_bill", () => { }, "id", { id: invId });
      // Dynamic table based on taxType
      const orderTable = taxType === 'gst' ? 'order_items_gst' : 'order_items';
      myOrderItemsData = await fetchData(orderTable, () => { }, "id", { order_id: invId });
      if (myfinalbilldata && myfinalbilldata[0] && myfinalbilldata[0].customer_id) {
        const custArr = await fetchData("customers", () => { }, "id", { id: myfinalbilldata[0].customer_id });
        myCustomerdetails = custArr && custArr[0] ? custArr[0] : {};
      }
    }
    // Company
    const company = companyDetails;
    // Items
    const items = (myOrderItemsData.length > 0 ? myOrderItemsData : itemRows).map(row => {
      if (taxType === 'gst') {
        return {
          item_name: (row && (row.itemName || row.item_name)) || '',
          description: (row && row.description) || '',
          quantity: row ? Number(row.quantity) : 0,
          rate: row ? Number(row.rate) : 0,
          cgst: row ? Number(row.cgst) : 0,
          sgst: row ? Number(row.sgst) : 0,
          igst: row ? Number(row.igst) : 0,
          amount: row ? Number(row.amount || row.total_price) : 0,
          discountPercent: row ? Number(row.discountPercent) : 0,
          discountValue: row ? Number(row.discountValue) : 0,
          netAmount: row ? Number(row.netAmount) : 0,
          total_price: row ? Number(row.amount || row.total_price) : 0
        };
      } else {
        return {
          item_name: (row && (row.itemName || row.item_name)) || '',
          description: (row && row.description) || '',
          quantity: row ? Number(row.quantity) : 0,
          rate: row ? Number(row.rate) : 0,
          vat: row ? Number(row.vat || 0) : 0,
          amount: row ? Number(row.amount || row.total_price) : 0,
          discountPercent: row ? Number(row.discountPercent) : 0,
          discountValue: row ? Number(row.discountValue) : 0,
          netAmount: row ? Number(row.netAmount) : 0,
          total_price: row ? Number(row.amount || row.total_price) : 0
        };
      }
    });
    // Customer: Only use DB data for print preview, never fall back to UI state
    let customerData = {
      name: '',
      phone: '',
      email: '',
      address: '',
      gst: '',
      vat: '',
      deliveryPlace: ''
    };
    if (myCustomerdetails && typeof myCustomerdetails === 'object' && Object.keys(myCustomerdetails).length > 0) {
      customerData = {
        name: myCustomerdetails.name || '',
        phone: myCustomerdetails.phone || '',
        email: myCustomerdetails.email || '',
        address: myCustomerdetails.address || '',
        gst: myCustomerdetails.gst || '',
        vat: myCustomerdetails.vat || '',
        deliveryPlace: myCustomerdetails.deliveryPlace || ''
      };
    } else if (invId) {
      toast.error('Customer data not found for this bill.');
    }
    // Summary
    const summary = myfinalbilldata && myfinalbilldata[0] ? {
      subtotal: Number(myfinalbilldata[0].subtotal) || 0,
      discount: Number(myfinalbilldata[0].discount_amount) || 0,
      subtotalAfterDiscount: Number(myfinalbilldata[0].subtotal_afterdiscount) || 0,
      tax: Number(myfinalbilldata[0].tax) || 0,
      payment_mode: Number(myfinalbilldata[0].payment_mode) || 0,
      roundoff: Number(myfinalbilldata[0].roundoff) || 0,
      grandTotal: Number(myfinalbilldata[0].grand_total) || 0
    } : {
      subtotal: invoiceSummary.itemTotal,
      discount: invoiceSummary.discount,
      subtotalAfterDiscount: invoiceSummary.subTotal,
      tax: invoiceSummary.tax,
      payment_mode: invoiceSummary.payment_mode,
    
      roundoff: invoiceSummary.roundOff,
      grandTotal: invoiceSummary.grandTotal
    };
    // Taxes
    let taxes = {};
    if (taxType === 'gst') {
      let cgstPercent = 0, sgstPercent = 0, igstPercent = 0;
      let cgstTotal = 0, sgstTotal = 0, igstTotal = 0;
      let cgstCount = 0, sgstCount = 0, igstCount = 0;
      (myOrderItemsData.length > 0 ? myOrderItemsData : itemRows).forEach(item => {
        if (parseFloat(item.cgst || 0) > 0) { cgstPercent += parseFloat(item.cgst || 0); cgstCount++; }
        if (parseFloat(item.sgst || 0) > 0) { sgstPercent += parseFloat(item.sgst || 0); sgstCount++; }
        if (parseFloat(item.igst || 0) > 0) { igstPercent += parseFloat(item.igst || 0); igstCount++; }
        cgstTotal += (Number(item.amount || item.total_price) - Number(item.discountValue || 0)) * (parseFloat(item.cgst || 0) / 100);
        sgstTotal += (Number(item.amount || item.total_price) - Number(item.discountValue || 0)) * (parseFloat(item.sgst || 0) / 100);
        igstTotal += (Number(item.amount || item.total_price) - Number(item.discountValue || 0)) * (parseFloat(item.igst || 0) / 100);
      });
      cgstPercent = cgstCount ? cgstPercent / cgstCount : 0;
      sgstPercent = sgstCount ? sgstPercent / sgstCount : 0;
      igstPercent = igstCount ? igstPercent / igstCount : 0;
      taxes = {
        cgstPercent: cgstPercent.toFixed(2),
        sgstPercent: sgstPercent.toFixed(2),
        igstPercent: igstPercent.toFixed(2),
        cgstTotal: cgstTotal.toFixed(2),
        sgstTotal: sgstTotal.toFixed(2),
        igstTotal: igstTotal.toFixed(2)
      };
    } else {
      let vatPercent = 0, vatTotal = 0, vatCount = 0;
      (myOrderItemsData.length > 0 ? myOrderItemsData : itemRows).forEach(item => {
        if (parseFloat(item.vat || 0) > 0) { vatPercent += parseFloat(item.vat || 0); vatCount++; }
        vatTotal += (Number(item.amount || item.total_price) - Number(item.discountValue || 0)) * (parseFloat(item.vat || 0) / 100);
      });
      vatPercent = vatCount ? vatPercent / vatCount : 0;
      taxes = {
        vatPercent: vatPercent.toFixed(2),
        vatTotal: vatTotal.toFixed(2)
      };
    }
    // Invoice meta
    const invoiceNo = invId;
    const invoiceDate = myfinalbilldata && myfinalbilldata[0] ? myfinalbilldata[0].inv_date : new Date().toLocaleDateString();
    const invoiceTime = myfinalbilldata && myfinalbilldata[0] ? myfinalbilldata[0].inv_time : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return {
      company,
      customer: customerData,
      items,
      summary,
      taxes,
      invoiceNo,
      invoiceDate,
      invoiceTime
    };
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

  const renderContent = () => (
    <>
      <ToastContainer />
      
      {/* Professional Styling */}
      <style jsx>{`
        .professional-card {
          background: white;
          border-radius: 12px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.08);
          border: 1px solid #e2e8f0;
          margin-bottom: 24px;
          overflow: hidden;
          transition: all 0.3s ease;
        }
        
        .professional-card:hover {
          box-shadow: 0 8px 32px rgba(0,0,0,0.12);
          transform: translateY(-2px);
        }
        
        .table-modern {
          background: white;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(0,0,0,0.06);
        }
        
        .table-modern th {
          background: linear-gradient(135deg, #374151 0%, #1f2937 100%);
          color: white;
          font-weight: 600;
          padding: 12px 8px;
          font-size: 11px;
          border: none;
        }
        
        .table-modern tbody tr {
          transition: all 0.2s ease;
        }
        
        .table-modern tbody tr:hover {
          background-color: #f8fafc;
          transform: scale(1.01);
        }
        
        .table-modern tbody td {
          padding: 10px 8px;
          border-bottom: 1px solid #e2e8f0;
          vertical-align: middle;
        }
        
        .form-control-modern {
          border: 2px solid #e2e8f0;
          border-radius: 8px;
          padding: 8px 12px;
          transition: all 0.3s ease;
          background: #fafbfc;
        }
        
        .form-control-modern:focus {
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
          background: white;
        }
        
        .btn-modern {
          border-radius: 8px;
          padding: 8px 16px;
          font-weight: 500;
          transition: all 0.3s ease;
          border: none;
        }
        
        .btn-modern:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        }
      `}</style>
      
      {/* Dashboard Navigation Button - Only for cashiers */}
      {isCashier && (
        <div style={{ position: 'fixed', top: '20px', right: '20px', zIndex: 1000 }}>
          <button
            className="btn btn-primary"
            onClick={navigateToDashboard}
            style={{
              padding: '10px 15px',
              fontSize: '14px',
              borderRadius: '25px',
              boxShadow: '0 4px 8px rgba(0,0,0,0.2)'
            }}
          >
            🏠 Dashboard
          </button>
        </div>
      )}

      <div className='row mb-4'>
        {/* <div className="col-md-6">
          <CardComponent>


          </CardComponent>
        </div> */}
        {/* Customer Details Section */}
        <div 
          style={{ 
            background: 'white',
            borderRadius: '12px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            border: '1px solid #e2e8f0',
            overflow: 'hidden',
            marginBottom: '24px'
          }}
        >
          <div 
            className="card-header" 
            style={{ 
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: 'white',
              padding: '16px 24px',
              borderBottom: 'none',
              minHeight: '64px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'nowrap',
              gap: '12px'
            }}
          >
            <div className="d-flex align-items-center" style={{ flex: '1 1 auto', minWidth: 0 }}>
              <i className="fas fa-users me-3" style={{ fontSize: '1.2rem', flexShrink: 0 }}></i>
              <span style={{ 
                fontSize: '1.1rem', 
                fontWeight: '600', 
                letterSpacing: '0.3px', 
                whiteSpace: 'nowrap', 
                overflow: 'hidden', 
                textOverflow: 'ellipsis'
              }}>Customer Details</span>
            </div>
            <button 
              type="button"
              className="btn btn-sm p-2"
              onClick={() => setShowCustomerDetails(!showCustomerDetails)}
              style={{ 
                background: 'rgba(255,255,255,0.2)',
                border: 'none',
                borderRadius: '8px',
                color: 'white',
                transition: 'all 0.3s ease',
                flexShrink: 0,
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <i className={`fas ${showCustomerDetails ? 'fa-chevron-up' : 'fa-chevron-down'}`} style={{ fontSize: '1rem' }}></i>
            </button>
          </div>
            {showCustomerDetails && (
              <div className="p-4" style={{ background: '#fafbfc', margin: '16px 16px 16px 16px', borderRadius: '8px' }}>
            <div className='row' style={{ margin: '0 -8px' }}>
            {/* Name */}
            <div className='col-md-4 mb-3' style={{ padding: '0 8px' }}>
              <label
                htmlFor='customerName'
                className='form-label fw-semibold'
                style={{ fontSize: '13px' }}
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
                    // Find customer by name from allCustomers
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
                  styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
                  filterOption={(option, inputValue) =>
                    option.label
                      .toLowerCase()
                      .includes(inputValue.toLowerCase())
                  }
                />
              </div>

              {/* Phone */}
              <div className='col-md-4 mb-3' style={{ padding: '0 8px' }}>
                <TextfieldwithLabel
                  id='customerPhone'
                  name='customerPhone'
                  value={customer.phone}
                  onChange={e =>
                    setCustomer({ ...customer, phone: e.target.value })
                  }
                  type='tel'
                  lable='Phone Number'
                />
              </div>

              {/* Email */}
              <div className='col-md-4 mb-3' style={{ padding: '0 8px' }}>
                <TextfieldwithLabel
                  id='customerEmail'
                  name='customerEmail'
                  value={customer.email}
                  onChange={e =>
                    setCustomer({ ...customer, email: e.target.value })
                  }
                  type='email'
                  lable='Email'
                />
              </div>

              {/* Address */}
              <div className='col-md-6 mb-3' style={{ padding: '0 8px' }}>
                <TextfieldwithLabel
                  id='customerAddress'
                  name='customerAddress'
                  value={customer.address}
                  onChange={e =>
                    setCustomer({ ...customer, address: e.target.value })
                  }
                  type='text'
                  lable='Address'
                />
              </div>

              {/* GST No */}
              <div className='col-md-3 mb-3' style={{ padding: '0 8px' }}>
                <TextfieldwithLabel
                  id='customerGST'
                  name='customerGST'
                  value={customer.gst}
                  onChange={e =>
                    setCustomer({ ...customer, gst: e.target.value })
                  }
                  type='text'
                  lable='GST Number (Optional)'
                />
              </div>

              {/* Place of Delivery */}
              <div className='col-md-3 mb-3' style={{ padding: '0 8px' }}>
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
                />
              </div>
              <div className='col-md-12 mb-2' style={{ padding: '0 8px' }}>
                <button className='btn btn-outline-primary' onClick={() => setShowAddCustomerModal(true)}>
                  ➕ Add New Customer
                </button>
              </div>
              </div>
              </div>
            )}
          </div>
        
        {/* Scan / Enter Item Code Section */}
        <div 
          style={{ 
            background: 'white',
            borderRadius: '12px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            border: '1px solid #e2e8f0',
            overflow: 'hidden',
            marginBottom: '24px'
          }}
        >
          <div 
            className="card-header" 
            style={{ 
              background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
              color: 'white',
              padding: '16px 24px',
              borderBottom: 'none',
              minHeight: '64px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'nowrap',
              gap: '12px'
            }}
          >
            <div className="d-flex align-items-center" style={{ flex: '1 1 auto', minWidth: 0 }}>
              <i className="fas fa-barcode me-3" style={{ fontSize: '1.2rem', flexShrink: 0 }}></i>
              <span style={{ 
                fontSize: '1.1rem', 
                fontWeight: '600', 
                letterSpacing: '0.3px', 
                whiteSpace: 'nowrap', 
                overflow: 'hidden', 
                textOverflow: 'ellipsis'
              }}>Scan / Enter Item Code</span>
            </div>
            <button 
              type="button"
              className="btn btn-sm p-2"
              onClick={() => setShowScanCode(!showScanCode)}
              style={{ 
                background: 'rgba(255,255,255,0.2)',
                border: 'none',
                borderRadius: '8px',
                color: 'white',
                transition: 'all 0.3s ease',
                flexShrink: 0,
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <i className={`fas ${showScanCode ? 'fa-chevron-up' : 'fa-chevron-down'}`} style={{ fontSize: '1rem' }}></i>
            </button>
          </div>
          {showScanCode && (
            <div className="p-4" style={{ background: '#fafbfc', margin: '16px 16px 16px 16px', borderRadius: '8px' }}>
              <div className='row mb-4' style={{ margin: '0 -8px' }}>
                <div className='col-md-4' style={{ padding: '0 8px' }}>
                  <form onSubmit={handleScan}>
                    <Textfield
                      className='form-control'
                      id={`itemName`}
                      value={barcode}
                      onChange={e => setBarcode(e.target.value)}
                      type='text'
                      name='itemName'
                      placeholder='Scan or enter Item Code'
                    />
                  </form>
                </div>
                <div className='col-md-4' style={{ padding: '0 8px' }}>
                  <form onSubmit={handleScan}>
                    <Textfield
                      className='form-control'
                      label='Barcode'
                      id={`itemName`}
                      value={barcode}
                      onChange={e => setBarcode(e.target.value)}
                      type='text'
                      name='itemName'
                      placeholder='Scan or enter barcode'
                    />
                  </form>
                </div>
                <div className='col-md-4' style={{ padding: '0 8px' }}>
                  <button className='btn btn-primary' type='submit'>
                    Scan Now !
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        <div 
          style={{ 
            background: 'white',
            borderRadius: '12px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            border: '1px solid #e2e8f0',
            overflow: 'hidden',
            marginBottom: '24px'
          }}
        >
          <div 
            className="card-header" 
            style={{ 
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: 'white',
              padding: '16px 24px',
              borderBottom: 'none'
            }}
          >
            <div className="d-flex align-items-center">
              <i className="fas fa-plus-circle me-3" style={{ fontSize: '1.2rem' }}></i>
              <span style={{ fontSize: '1.1rem', fontWeight: '600', letterSpacing: '0.3px' }}>Add Items</span>
            </div>
          </div>
          <div className="p-3">
            <table className='table table-borderless' style={{ fontSize: '12px' }}>
              <thead className='table-dark'>
                <tr style={{ fontSize: '12px' }}>
                  <th style={{ fontSize: '11px' }}>S.No</th>
                  <th style={{ fontSize: '11px' }}>Item Name</th>
                  <th style={{ fontSize: '11px' }}>Description</th>
                  <th style={{ fontSize: '11px' }}>Rate</th>
                  <th style={{ fontSize: '11px' }}>Qty</th>
                  <th style={{ fontSize: '11px' }}>Amount</th>
                  <th style={{ fontSize: '11px' }}>Disc%</th>
                  <th style={{ fontSize: '11px' }}>Disc Value</th>
                  {taxType === 'vat' ? (
                    <th style={{ fontSize: '11px' }}>VAT%</th>
                  ) : (
                    <>
                      <th style={{ fontSize: '11px' }}>CGST%</th>
                      <th style={{ fontSize: '11px' }}>SGST%</th>
                      <th style={{ fontSize: '11px' }}>IGST%</th>
                    </>
                  )}
                  <th style={{ fontSize: '11px' }}>Net Amount</th>
                  <th style={{ fontSize: '11px' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {itemRows.map((row, index) => (
                  <tr key={row.id} style={{ cursor: 'pointer', fontSize: '12px' }}>
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
                              // Focus description field after selection (arrow+enter or mouse)
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
                              // Only add new row if not selecting from menu
                              if (!row.itemName) return
                              // If menu is open and an option is highlighted, let react-select handle it
                              // Otherwise, add new row and focus
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
                            menuPortal: base => ({ ...base, zIndex: 9999 })
                          }}
                          filterOption={(option, inputValue) =>
                            option.label
                              .toLowerCase()
                              .includes(inputValue.toLowerCase())
                          }
                        />
                      ) : (
                        <span>
                          {row.itemName || (
                            <span className='text-muted'>Click to edit</span>
                          )}
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
                          onChange={e =>
                            handleRowChange(
                              index,
                              'rate',
                              parseFloat(e.target.value) || 0
                            )
                          }
                          type='number'
                          name='rate'
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
                          onChange={e =>
                            handleRowChange(
                              index,
                              'quantity',
                              parseInt(e.target.value) || 1
                            )
                          }
                          type='number'
                          name='quantity'
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
                          onChange={e =>
                            handleRowChange(
                              index,
                              'discountPercent',
                              parseFloat(e.target.value) || 0
                            )
                          }
                          type='number'
                          name='discountPercent'
                        />
                      ) : (
                        row.discountPercent
                      )}
                    </td>

                    {/* Disc Value */}
                    <td>{row.discountValue.toFixed(2)}</td>


                    {/* VAT% or GST fields */}
                    {taxType === 'vat' ? (
                      <td>
                        {editableRowIndex === index ? (
                          <Textfield
                            id={`vat-${index}`}
                            value={row.tax}
                            onChange={e =>
                              handleRowChange(
                                index,
                                'vat',
                                parseFloat(e.target.value) || 0
                              )
                            }
                            type='number'
                            name='vat'
                          />
                        ) : (
                          row.tax
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
                            />
                          ) : (
                            row.cgst
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
                            />
                          ) : (
                            row.sgst
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
                            />
                          ) : (
                            row.igst
                          )}
                        </td>
                      </>
                    )}

                    {/* Net Amount */}
                    <td>
                      {row.netAmount.toFixed(2)}
                      <br />
                      <small className={row.taxIncluded ? 'text-success' : 'text-danger'}>
                        {row.taxIncluded ? 'Tax Included' : 'Tax Excluded'}
                      </small>
                    </td>

                    {/* Delete Button */}
                    <td>
                      <button
                        className='btn btn-danger btn-sm'
                        onClick={e => {
                          e.stopPropagation() // prevent triggering row click
                          deleteRow(index)
                        }}
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button className='btn btn-primary mt-2' onClick={addNewRow}>
              ➕ Add Row
            </button>
          </div>
        </div>
        <div className='row mb-4'>
          <div className='col-md-6'>
            <CardComponent>
              {/* Payment Mode and Grand Total aligned in one row */}
              <div className='d-flex align-items-center justify-content-between flex-wrap gap-2' style={{ minHeight: 60 ,marginTop: '14px' }}>
                <div className='d-flex flex-column' style={{ minWidth: 220 }}>
                  <label className='fw-semibold mb-1'>Payment Mode:</label>
                  <select
                    className='form-control'
                    value={paymentType}
                    onChange={e => setPaymentType(e.target.value)}
                    style={{ maxWidth: 200 }}
                  >
                    <option value='Cash'>Cash</option>
                    <option value='Credit'>Credit</option>
                    <option value='Bank Transfer'>Bank Transfer</option>
                    <option value='Entertainment'>Entertainment</option>
                    <option value='UPI'>UPI</option>
                    <option value='QR Code'>QR Code</option>
                  </select>
                </div>
                <div className='text-right' style={{ minWidth: 200 }}>
                  <h5 className='mb-0'>
                    Grand Total: <strong>฿ {invoiceSummary.grandTotal.toFixed(2)}</strong>
                  </h5>
                  <small className='text-muted'>
                    {getAmountInWords(invoiceSummary.grandTotal)}
                  </small>
                </div>
              </div>
            </CardComponent>
          </div>
          <div className='col-md-6'>
            <CardComponent
              title='Invoice Summary'
              headerColor='success'
              customHeader={
                <div className='d-flex justify-content-between align-items-center'>
                  <h5 className='m-0 font-weight-bold'>Invoice Summary</h5>
                  <i className='fas fa-balance-scale fa-2x text-gray-600'></i>
                </div>
              }
            >
              {/* Invoice Date */}
              {/* Financial Summary */}
              <div className='row gy-3 text-lg'>
                {/* Item Total */}
                {/* <div className='col-md-4'>
                  <label className='fw-semibold font-20'>Invoice Date</label>
                  <div className='font-20'>{invoiceSummary.invoiceDate}</div>
                </div> */}
                <div className='col-md-4'>
                  <label className='fw-semibold font-20'>Item Total</label>
                  <div className='font-20'>
                    ฿ {invoiceSummary.itemTotal.toFixed(2)}
                  </div>
                </div>
                {/* Discount */}
                <div className='col-md-4'>
                  <label className='fw-semibold font-20'>Discount</label>
                  <div className='font-20'>
                    ฿ {invoiceSummary.discount.toFixed(2)}
                  </div>
                </div>
                {/* Sub Total */}
                <div className='col-md-4'>
                  <label className='fw-semibold font-20'>Sub Total</label>
                  <div className='font-20'>
                    ฿ {invoiceSummary.subTotal.toFixed(2)}
                  </div>
                </div>
                 {/* Tax Summary: Moved to separate row for clarity */}
                <div className='col-md-4'>
                  <label className='fw-semibold font-20'>Tax</label>
                  <div className='font-20'>
                    {invoiceSummary.taxPercent}: ฿ {invoiceSummary.tax.toFixed(2)}
                  </div>
                </div>
                {/* Round Off */}
                <div className='col-md-4'>
                  <label className='fw-semibold font-20'>Round Off</label>
                  <div className='font-20'>
                    ฿ {invoiceSummary.roundOff.toFixed(2)}
                  </div>
                </div>
                {/* Grand Total */}
                <div className='col-md-4'>
                  <label className='fw-bold font-20'>Grand Total</label>
                  <div className='text-success fw-bold font-20'>
                    ฿ {invoiceSummary.grandTotal.toFixed(2)}
                  </div>
                </div>
               
                
              </div>
            </CardComponent>
          </div>
        </div>

        {/* Action Buttons Row */}
        <div className='row mb-4'>
          <div className='col-md-12'>
            <CardComponent>
              <div className='d-flex flex-wrap gap-2 justify-content-end'>
                <button
                  className='btn btn-success'
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
                      // Prepare bill data
                      const billData = {
                        customer_id: customer.custid || null,
                        tablenumber: customer.deliveryPlace || '',
                        subtotal: invoiceSummary.itemTotal || 0,
                        discount_type: discountType || 'amount',
                        discount_value: discountValue || 0,
                        subtotal_afterdiscount: invoiceSummary.subTotal || 0,
                        tax: invoiceSummary.tax || 0,
                        round_off: invoiceSummary.roundOff || 0,
                        grand_total: invoiceSummary.grandTotal || 0,
                        payment_mode: paymentType ,
                        status: paymentType === 'Credit' ? 1 : 0,
                         setup_date: setupDate // ✅ Add setup_date column
                      };
                      // Save bill and get bill_id
                      const res = await axios.post(
                        '/savebill',
                        billData,
                        getHeaders()
                      );
                      const bill_id = res.data.bill_id;
                      window.lastSavedBillId = bill_id;
                      // Prepare order items
                     
                      const orderItems = itemRows.map(row => {
                         console.log('Saving bill with ID:', row.amount);
                        if (taxType === 'gst') {
                          return {
                            order_id: bill_id,
                            invoice_number: bill_id,
                            table_number: customer.deliveryPlace || '',
                            item_name: row.itemName,
                            quantity: row.quantity,
                            uom: row.uom || '',
                            rate: row.rate,
                            cgst: row.cgst || 0,
                            sgst: row.sgst || 0,
                            igst: row.igst || 0,
                            tax_amount:
  (row.amount - row.discountValue) *
  ((row.cgst + row.sgst + row.igst) / 100),

                            total_price: row.amount,
                            status: '1',
                            setup_date: setupDate // ✅ Add setup_date column
                          };
                        } else {
                          return {
                            order_number: bill_id,
                            invoice_number: bill_id,
                            table_number: customer.deliveryPlace || '',
                            item_name: row.itemName,
                            quantity: row.quantity,
                            // uom: row.uom || '',
                            // rate: row.rate,
                            // vat: row.vat || 0,
                            //  tax_amount: (row.amount - row.discountValue) * (row.vat / 100), // or compute as needed
                            total_amount: row.netAmount,
                            status: '1',
                            setup_date: setupDate // ✅ Add setup_date column
                          };
                        }
                      });
                      //console.log('Order Items:', orderItems);
                      // Insert into correct table
                      if (taxType === 'gst') {
                        await axios.post(
                          '/insertdatabulkgst/order_items_gst',
                          { items: orderItems },
                          getHeaders()
                        );
                      } else {
                        await axios.post(
                          '/insertdatabulk/order_items',
                          { items: orderItems },
                          getHeaders()
                        );
                      }
                      toast.success(
                        `Invoice generated successfully. Invoice No: ${bill_id}`
                      );
                      // Reset all data for next bill
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
                      setPaymentType('Cash');
                      setDiscountType('percentage');
                      
                      // Clear customer display
                      if (isCustomerDisplayOpen) {
                        customerDisplayManager.clearCustomerDisplay();
                      }
                    } catch (err) {
                      toast.error('Error saving bill.');
                    }
                  }}
                >
                  💾 Save Bill
                </button>

                <button
                  className='btn btn-danger'
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
                    // Clear customer display when cancelling bill
                    if (isCustomerDisplayOpen) {
                      customerDisplayManager.clearCustomerDisplay();
                    }
                  }}
                >
                  ❌ Cancel Bill
                </button>

                <button 
                  className={`btn ${isCustomerDisplayOpen ? 'btn-success' : 'btn-info'}`}
                  onClick={toggleCustomerDisplay}
                  title={isCustomerDisplayOpen ? 'Close Customer Display' : 'Open Customer Display'}
                >
                  {isCustomerDisplayOpen ? '📺 Close Display' : '📺 Customer Display'}
                </button>

                <button className='btn btn-warning text-dark'>
                  🔄 Reset Bill
                </button>

                <button
                  className='btn btn-primary'
                  onClick={async () => {
                    let latestBillId = window.lastSavedBillId;
                    if (!latestBillId) {
                      toast.error('No bill found to print. Please save a bill first.');
                      return;
                    }
                    // Fetch invoice props only when print is requested
                    const props = await getInvoiceProps(latestBillId);
                    if (taxType === 'gst') {
                      setGstInvoiceProps(props);
                      setShowInvoicePreview(true);
                    } else {
                      setVatInvoiceProps(props);
                      setShowVATInvoicePreview(true);
                    }
                  }}
                >
                  🖨️ Print Bill
                </button>
                
                <button
                  onClick={handleBillHistory}
                  className='btn btn-purple text-white'
                  style={{ backgroundColor: '#6f42c1' }}
                >
                  📜 Invoice History
                </button>

                <button className='btn btn-info text-white'>
                  🧾 Templates
                </button>
              </div>
            </CardComponent>
          </div>
        </div>

        {/* Print Preview Modal */}
       <GSTInvoicePrintPreview
  open={showInvoicePreview}
  onClose={() => setShowInvoicePreview(false)}
  {...(gstInvoiceProps || {})}
/>
        <VATInvoicePrintPreview
          open={showVATInvoicePreview}
          onClose={() => setShowVATInvoicePreview(false)}
          {...(vatInvoiceProps || {})}
        />
        {/* <InvoiceTableModal
          show={showModal}
          onClose={() => setShowModal(false)}
          companyDetails={companyDetails}
          customerDetails={customerDetails1}
          data={invoiceData}
        /> */}

        {/* Add New Customer Modal */}
        <AddCustomerModal
          show={showAddCustomerModal}
          onClose={() => setShowAddCustomerModal(false)}
          onSubmit={handleAddCustomer}
          newCustomer={newCustomer}
          handleInput={handleNewCustomerInput}
        />
      </div>
    </>
  );

  // Return without Layout wrapper, with custom top navigation
  return (
    <div className="pos-page" style={{ minHeight: '100vh', backgroundColor: '#f8fafc' }}>
      {/* Enhanced Professional Top Navigation */}
      <nav 
        className="navbar navbar-expand-lg navbar-dark" 
        style={{ 
          background: 'linear-gradient(135deg, #d6720dff 0%, #c55c07ff 100%)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
          marginBottom: '30px',
          borderBottom: '3px solid #df5f0aff'
        }}
      >
        <div className="container-fluid d-flex align-items-center justify-content-between py-2">
          <span className="navbar-brand mb-0 h1 d-flex align-items-center" style={{ fontSize: '1.5rem', fontWeight: '600' }}>
            <i className="fas fa-cash-register me-3" style={{ fontSize: '1.8rem', color: '#f1eeecff' }}></i>
            <span style={{ letterSpacing: '0.5px' }}>ChefMate POS</span>
          </span>
          
          <div className="d-flex align-items-center gap-3">
            <button 
              className="btn btn-outline-light me-2"
              onClick={navigateToDashboard}
              title={`Go to ${userType === 'Admin' ? 'Analytics' : userType === 'Cashier' ? 'Cashier' : ''} Dashboard`}
              style={{ 
                fontWeight: '500',
                borderRadius: '25px',
                padding: '8px 20px',
                border: '2px solid rgba(255,255,255,0.8)',
                background: 'rgba(255,255,255,0.1)',
                transition: 'all 0.3s ease',
                backdropFilter: 'blur(10px)'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = 'rgba(255,255,255,0.2)';
                e.target.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'rgba(255,255,255,0.1)';
                e.target.style.transform = 'translateY(0)';
              }}
            >
              <i className="fas fa-tachometer-alt me-2"></i>
              {userType === 'Admin' ? 'Analytics Dashboard' : userType === 'Cashier' ? 'Cashier Dashboard' : 'Dashboard'}
            </button>
            
            <button 
              className="btn btn-outline-danger"
              onClick={handleLogout}
              title="Logout"
              style={{ 
                fontWeight: '500',
                borderRadius: '25px',
                padding: '8px 20px',
                border: '2px solid #fcf9f9ff',
                background: 'rgba(255,107,107,0.1)',
                color: '#f8f4f4ff',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = '#ff6b6b';
                e.target.style.color = 'white';
                e.target.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'rgba(255,107,107,0.1)';
                e.target.style.color = '#ff6b6b';
                e.target.style.transform = 'translateY(0)';
              }}
            >
              <i className="fas fa-sign-out-alt me-2"></i>
              Logout
            </button>
          </div>
        </div>
      </nav>
      
      {/* Professional Page Content Container */}
      <div className="container-fluid px-4" style={{ maxWidth: '1400px', margin: '0 auto' }}>
        {renderContent()}
      </div>
    </div>
  );
}
