import React, { useState, useEffect, useRef } from 'react'
import AddCustomerModal from '../../components/Modals/addCustomer';
import Select from 'react-select'
import axios from 'axios'
import { useNavigate, Link } from "react-router-dom";
import { toast, ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import CardComponent from '../../components/cards/CardComponent'
import Header from '../../components/Header'
import Layout from '../../layout/Layout'
import {
  Textfield,
  TextfieldwithLabel
} from '../../components/Buttons/Textfield'
import getAmountInWords from '../../components/numbertoWords'
import InvoiceTableModal from '../../components/Templates/template1'
import fetchData from '../../functions/fetchData'
import { getHeaders } from '../../utility/getHeader'
import { GSTInvoicePrintPreview } from '../../components/Templates/gstTemplates'
import { VATInvoicePrintPreview } from '../../components/Templates/vatemplate';

export default function VatSale() {
  const itemNameRefs = useRef([])
  const [cart, setCart] = useState([])
  const [barcode, setBarcode] = useState('')
  const [total, setTotal] = useState(0)
  const [paymentType, setPaymentType] = useState('cash')
  const [discountType, setDiscountType] = useState('percentage')
  const [discountValue, setDiscountValue] = useState(0)
  const [showCustomerModal, setShowCustomerModal] = useState(false)
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
  const navigate = useNavigate();
  const [itemRows, setItemRows] = useState([])
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
  useEffect(() => {
    const itemTotal = itemRows.reduce((sum, r) => sum + r.amount, 0)
    const discount = itemRows.reduce((sum, r) => sum + r.discountValue, 0)
    const subTotal = itemTotal - discount
    const tax = itemRows.reduce((sum, r) => {
      const totalTax =
        ((r.cgst + r.sgst + r.igst) / 100) * (r.amount - r.discountValue)
      return sum + totalTax
    }, 0)
    const grandTotal = Math.round(subTotal + tax)
    const roundOff = grandTotal - (subTotal + tax)

    setInvoiceSummary({
      itemTotal,
      discount,
      subTotal,
      tax,
      roundOff,
      grandTotal
    })
  }, [itemRows])
  const [allItems, setAllItems] = useState([]) // from DB
  const [suggestions, setSuggestions] = useState({}) // {rowIndex: [items]}

  // const baseURL = 'http://localhost:4402';

  const baseURL = 'https://www.sharmachefapi.cloudnetsoftwares.com'
  //  const baseURL = 'https://www.chefmateapi.cloudnetsoftwares.com';
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

    // Auto-calculate amounts
    row.amount = row.rate * row.quantity
    row.discountValue = row.amount * (row.discountPercent / 100)
    const taxedAmount = row.amount - row.discountValue
    const totalTax = taxedAmount * ((row.cgst + row.sgst + row.igst) / 100)
    row.netAmount = taxedAmount + totalTax

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
              netAmount: 0
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
          netAmount: 0
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
      const itemsArr = await fetchData('items', () => { }, 'id', { id: barcode });
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
        updatedRows[existingIndex].amount = updatedRows[existingIndex].rate * updatedRows[existingIndex].quantity;
        updatedRows[existingIndex].discountValue = updatedRows[existingIndex].amount * (updatedRows[existingIndex].discountPercent / 100);
        const taxedAmount = updatedRows[existingIndex].amount - updatedRows[existingIndex].discountValue;
        const totalTax = taxedAmount * ((updatedRows[existingIndex].cgst + updatedRows[existingIndex].sgst + updatedRows[existingIndex].igst) / 100);
        updatedRows[existingIndex].netAmount = taxedAmount + totalTax;
        setItemRows(updatedRows);
      } else {
        // Add new row to itemRows
        setItemRows(prev => [
          ...prev,
          {
            id: Date.now(),
            itemName: item.iname,
            description: item.description || '',
            rate: item.offerprice || 0,
            quantity: 1,
            amount: item.offerprice || 0,
            discountPercent: 0,
            discountValue: 0,
            cgst: item.cgst || 0,
            sgst: item.sgst || 0,
            igst: item.igst || 0,
            vat: item.vat || 0,
            netAmount: item.offerprice || 0
          }
        ]);
      }
      setBarcode('');
    } catch (error) {
      toast.error('Error fetching item.');
    }
  }
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
    const myItems = fetchData('items', setAllItems, 'id', {})
  }, [])

  const handleItemSelect = (index, selectedItem) => {
    const updatedRows = [...itemRows]
    updatedRows[index] = {
      ...updatedRows[index],
      itemName: selectedItem.iname,
      description: selectedItem.description || '',
      rate: selectedItem.offerprice || 0,
      quantity: 1,
      amount: selectedItem.offerprice || 0,
      discountPercent: 0,
      discountValue: 0,
      cgst: selectedItem.cgst || 0,
      sgst: selectedItem.sgst || 0,
      igst: selectedItem.igst || 0,
      netAmount: selectedItem.offerprice || 0
    }
    setItemRows(updatedRows)
    setSuggestions(prev => ({ ...prev, [index]: [] })) // close suggestion
    setTimeout(() => {
      // Focus description field after selection
      const descInput = document.getElementById(`description-${index}`)
      if (descInput) descInput.focus()
    }, 0)
  }

  const printBill = () => {
    const finalTotal = calculateFinalTotal()
    const bill = `Bill\n--------------------\n${cart
      .map(i => `${i.iname} x ${i.quantity} = ฿${i.quantity * i.offerprice}`)
      .join('\n')}\n--------------------\nTotal: ฿${total.toFixed(
        2
      )}\nDiscount: ${discountValue}${discountType === 'percentage' ? '%' : '฿'
      }\nFinal Total: ฿${finalTotal.toFixed(2)}\nPayment: ${paymentType}`
    const printWindow = window.open('', '', 'width=600,height=400')
    printWindow.document.write(`<pre>${bill}</pre>`)
    printWindow.document.close()
    printWindow.print()
  }

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



  // Helper to build GST invoice props from current bill
  async function getGSTInvoiceProps(itemId = null) {
    let invId = itemId || window.lastSavedBillId || '';
    let myfinalbilldata = [];
    let myOrderItemsData = [];
    let myCustomerdetails = {};
    // Fetch from DB if invId is present
    if (invId) {
      // Fetch the final_bill and order_items details for the given itemId
      myfinalbilldata = await fetchData("final_bill", () => { }, "id", { id: invId });
      myOrderItemsData = await fetchData("order_items_gst", () => { }, "id", { order_id: invId });
      if (myfinalbilldata && myfinalbilldata[0] && myfinalbilldata[0].customer_id) {
        const custArr = await fetchData("customers", () => { }, "id", { id: myfinalbilldata[0].customer_id });
        myCustomerdetails = custArr && custArr[0] ? custArr[0] : {};
      }
    }
    // console.log('myfinalbilldata', myfinalbilldata);
    // console.log('myOrderItemsData', myOrderItemsData);
    // console.log('myCustomerdetails', myCustomerdetails);

    // Company
    const company = companyDetails;
    // console.log('company details', company.name, company.address, company.phone, company.email  );
    // Items
    const items = (myOrderItemsData.length > 0 ? myOrderItemsData : itemRows).map(row => ({
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
    }));
    // Customer: Only use DB data for print preview, never fall back to UI state
    let customerData = {
      name: '',
      phone: '',
      email: '',
      address: '',
      gst: '',
      deliveryPlace: ''
    };
    if (myCustomerdetails && typeof myCustomerdetails === 'object' && Object.keys(myCustomerdetails).length > 0) {
      customerData = {
        name: myCustomerdetails.name || '',
        phone: myCustomerdetails.phone || '',
        email: myCustomerdetails.email || '',
        address: myCustomerdetails.address || '',
        gst: myCustomerdetails.gst || '',
        deliveryPlace: myCustomerdetails.deliveryPlace || ''
      };
    } else if (invId) {
      // Defensive: If DB fetch failed, show error toast and leave empty
      toast.error('Customer data not found for this bill.');
    }
    // Summary
    const summary = myfinalbilldata && myfinalbilldata[0] ? {
      subtotal: Number(myfinalbilldata[0].subtotal) || 0,
      discount: Number(myfinalbilldata[0].discount_amount) || 0,
      subtotalAfterDiscount: Number(myfinalbilldata[0].subtotal_afterdiscount) || 0,
      roundoff: Number(myfinalbilldata[0].roundoff) || 0,
      grandTotal: Number(myfinalbilldata[0].grand_total) || 0
    } : {
      subtotal: invoiceSummary.itemTotal,
      discount: invoiceSummary.discount,
      subtotalAfterDiscount: invoiceSummary.subTotal,
      roundoff: invoiceSummary.roundOff,
      grandTotal: invoiceSummary.grandTotal
    };
    // console.log('invoice summary', summary);
    // console.log('customer data', customerData);
    // Taxes
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
    const taxes = {
      cgstPercent: cgstPercent.toFixed(2),
      sgstPercent: sgstPercent.toFixed(2),
      igstPercent: igstPercent.toFixed(2),
      cgstTotal: cgstTotal.toFixed(2),
      sgstTotal: sgstTotal.toFixed(2),
      igstTotal: igstTotal.toFixed(2)
    };
    // Invoice meta
    const invoiceNo = invId;
    const invoiceDate = myfinalbilldata && myfinalbilldata[0] ? myfinalbilldata[0].inv_date : new Date().toLocaleDateString();
    const invoiceTime = myfinalbilldata && myfinalbilldata[0] ? myfinalbilldata[0].inv_time : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    console.log('company data', customerData)
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

  // Helper to build VAT invoice props from current bill
  async function getVATInvoiceProps(itemId = null) {
    let invId = itemId || window.lastSavedBillId || '';
    let myfinalbilldata = [];
    let myOrderItemsData = [];
    let myCustomerdetails = {};
    // Fetch from DB if invId is present
    if (invId) {
      myfinalbilldata = await fetchData("final_bill", () => { }, "id", { id: invId });
      myOrderItemsData = await fetchData("order_items", () => { }, "id", { order_id: invId });
      if (myfinalbilldata && myfinalbilldata[0] && myfinalbilldata[0].customer_id) {
        const custArr = await fetchData("customers", () => { }, "id", { id: myfinalbilldata[0].customer_id });
        myCustomerdetails = custArr && custArr[0] ? custArr[0] : {};
      }
    }
    // Company
    const company = companyDetails;
    // Items
    const items = (myOrderItemsData.length > 0 ? myOrderItemsData : itemRows).map(row => ({
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
    }));
    // Customer: Only use DB data for print preview, never fall back to UI state
    let customerData = {
      name: '',
      phone: '',
      email: '',
      address: '',
      vat: '',
      deliveryPlace: ''
    };
    if (myCustomerdetails && typeof myCustomerdetails === 'object' && Object.keys(myCustomerdetails).length > 0) {
      customerData = {
        name: myCustomerdetails.name || '',
        phone: myCustomerdetails.phone || '',
        email: myCustomerdetails.email || '',
        address: myCustomerdetails.address || '',
        vat: myCustomerdetails.vat || '',
        deliveryPlace: myCustomerdetails.deliveryPlace || ''
      };
    } else if (invId) {
      // Defensive: If DB fetch failed, show error toast and leave empty
      toast.error('Customer data not found for this bill.');
    }
    // Summary
    const summary = myfinalbilldata && myfinalbilldata[0] ? {
      subtotal: Number(myfinalbilldata[0].subtotal) || 0,
      discount: Number(myfinalbilldata[0].discount_amount) || 0,
      subtotalAfterDiscount: Number(myfinalbilldata[0].subtotal_afterdiscount) || 0,
      roundoff: Number(myfinalbilldata[0].roundoff) || 0,
      grandTotal: Number(myfinalbilldata[0].grand_total) || 0
    } : {
      subtotal: invoiceSummary.itemTotal,
      discount: invoiceSummary.discount,
      subtotalAfterDiscount: invoiceSummary.subTotal,
      roundoff: invoiceSummary.roundOff,
      grandTotal: invoiceSummary.grandTotal
    };
    // VAT
    let vatPercent = 0, vatTotal = 0, vatCount = 0;
    (myOrderItemsData.length > 0 ? myOrderItemsData : itemRows).forEach(item => {
      if (parseFloat(item.vat || 0) > 0) { vatPercent += parseFloat(item.vat || 0); vatCount++; }
      vatTotal += (Number(item.amount || item.total_price) - Number(item.discountValue || 0)) * (parseFloat(item.vat || 0) / 100);
    });
    vatPercent = vatCount ? vatPercent / vatCount : 0;
    const taxes = {
      vatPercent: vatPercent.toFixed(2),
      vatTotal: vatTotal.toFixed(2)
    };
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

  return (
    <>
      <Layout>
        <Header title='POS System ' />
        <ToastContainer />

        <div className='row mb-4'>
          {/* <div className="col-md-6">
            <CardComponent>


            </CardComponent>
          </div> */}
          <div className='col-md-12'>
            <CardComponent title='Customer Details' headerColor='success'>
              <div className='row'>
                {/* Name */}
                <div className='col-md-4 mb-3'>
                  <label
                    htmlFor='customerName'
                    className='form-label fw-semibold'
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
                          phone: selectedCustomer.phone || '',
                          email: selectedCustomer.email || '',
                          address: selectedCustomer.address || '',
                          gst: selectedCustomer.gst || '',
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
                  />
                </div>
                <div className='col-md-12 mb-2'>
                  <button className='btn btn-outline-primary' onClick={() => setShowAddCustomerModal(true)}>
                    ➕ Add New Customer
                  </button>
                </div>
              </div>
            </CardComponent>
          </div>
        </div>
        <CardComponent>
          <div className='row mb-4'>
            <div className='col-md-4'>
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
            <div className='col-md-4'>
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
            <div className='col-md-4'>
              <button className='btn btn-primary' type='submit'>
                Scan Now !
              </button>
            </div>
          </div>
        </CardComponent>

        <CardComponent title='Add Items' headerColor='success'>
          <div className='table-responsive'>
            <table className='table table-borderless'>
              <thead className='table-dark'>
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
                  <tr key={row.id} style={{ cursor: 'pointer' }}>
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

                    {/* CGST */}
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

                    {/* SGST */}
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

                    {/* IGST */}
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

                    {/* Net Amount */}
                    <td>{row.netAmount.toFixed(2)}</td>

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
        </CardComponent>
        <div className='row mb-4'>
          <div className='col-md-6'>
            <CardComponent>
              {/* Payment Mode and Grand Total aligned in one row */}
              <div className='d-flex align-items-center justify-content-between flex-wrap gap-2' style={{ minHeight: 60 }}>
                <div className='d-flex flex-column' style={{ minWidth: 220 }}>
                  <label className='fw-semibold mb-1'>Payment Mode:</label>
                  <select
                    className='form-control'
                    value={paymentType}
                    onChange={e => setPaymentType(e.target.value)}
                    style={{ maxWidth: 200 }}
                  >
                    <option value='cash'>Cash</option>
                    <option value='credit'>Credit</option>
                    <option value='entertainment'>Entertainment</option>
                    <option value='upi'>UPI</option>
                  </select>
                </div>
                <div className='text-right' style={{ minWidth: 200 }}>
                  <h5 className='mb-0'>
                    Grand Total: <strong>₹ {invoiceSummary.grandTotal.toFixed(2)}</strong>
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
                <div className='col-md-4'>
                  <label className='fw-semibold font-20'>Invoice Date</label>
                  <div className='font-20'>{invoiceSummary.invoiceDate}</div>
                </div>
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
                      toast.error('Please enter customer name and phone.')
                      return
                    }
                    if (itemRows.length === 0) {
                      toast.error('Please add at least one item.')
                      return
                    }
                    try {
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
                        payment_mode: paymentType || 'Cash',
                        status: paymentType === 'credit' ? 1 : 0
                      }
                      // Save bill and get bill_id
                      const res = await axios.post(
                        '/savebill',
                        billData,
                        getHeaders()
                      )
                      const bill_id = res.data.bill_id
                      const invoiceNumber = res.data.inv_number || String(bill_id)
                      // Store the latest bill id globally for print button
                      window.lastSavedBillId = bill_id
                      // Prepare order items
                      const orderItems = itemRows.map(row => ({
                        order_id: bill_id,
                        invoice_number: invoiceNumber,
                        table_number: customer.deliveryPlace || '',
                        item_name: row.itemName,
                        quantity: row.quantity,
                        uom: row.uom || '',
                        rate: row.rate,
                        cgst: row.cgst || 0,
                        sgst: row.sgst || 0,
                        igst: row.igst || 0,
                        tax_amount: 0, // You can calculate if needed
                        total_price: row.amount,
                        status: '1'
                      }))
                      await axios.post(
                        '/insertdatabulkgst/order_items_gst',
                        { items: orderItems },
                        getHeaders()
                      )
                      toast.success(
                        `Invoice generated successfully. Invoice No: ${invoiceNumber}`
                      )
                      // Reset all data for next bill
                      setItemRows([])
                      setCustomer({
                        name: '',
                        phone: '',
                        email: '',
                        address: '',
                        gst: '',
                        deliveryPlace: ''
                      })
                      setDiscountValue(0)
                      setPaymentType('cash')
                      setDiscountType('percentage')
                    } catch (err) {
                      toast.error('Error saving bill.')
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
                  }}
                >
                  ❌ Cancel Bill
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
                    const props = await getGSTInvoiceProps(latestBillId);
                    setGstInvoiceProps(props);
                    setShowInvoicePreview(true);
                  }}
                >
                  🖨️ Print GST Bill
                </button>
   <button
                  className='btn btn-purple text-white'
                  onClick={async () => {
                    let latestBillId = window.lastSavedBillId;
                    if (!latestBillId) {
                      toast.error('No bill found to print. Please save a bill first.');
                      return;
                    }
                    // Fetch invoice props only when print is requested
                    const props = await getVATInvoiceProps(latestBillId);
                    setVatInvoiceProps(props);
                    setShowVATInvoicePreview(true);
                  }}
                >
                  🖨️ Print VAT Bill
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
      </Layout>
    </>
  )
}
