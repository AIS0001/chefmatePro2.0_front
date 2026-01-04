import React, { useEffect, useState } from "react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import Layout from "../../layout/Layout";
import Header from "../../components/Header";
import CardComponent from "../../components/cards/CardComponent";
import { TextfieldwithLabel, SubmitButton } from "../../components/Buttons/Textfield";
import DataTable from "../../components/data-tables/dataTable";
import fetchData from "../../functions/fetchData";
import { getHeaders } from "../../utility/getHeader";
import "react-toastify/dist/ReactToastify.css";

export default function NewStock() {
  const [formData, setFormData] = useState({
    item_id: "",
    opening_stock: "0",
    stock_in: "0",
    stock_out: "0",
    unit: "",
    purchase_price: "0",
    subtotal: "0",
    vat: "",
    vatAmount: "0",
    netAmount: "0",
    refno: "",
    pdate: "",
    supplier_id: ""
  });

  const [autoVat, setAutoVat] = useState(true);
  const [data, setData] = useState([]);
  const [stockable, setStockable] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [invoiceItems, setinvoiceItems] = useState([]);
  const [existing, setexisting] = useState([]);

  const columns = [
    { label: "ID", field: "id" },
    { label: "Item Name", field: "item_name" },
    { label: "Opening Stock", field: "opening_stock" },
    { label: "Stock In", field: "stock_in" },
    { label: "Stock Out", field: "stock_out" },
    { label: "Closing balance", field: "closing_stock" },
    { label: "Unit", field: "unit" },
    { label: "Purchase Price", field: "purchase_price" },
    { label: "Subtotal", field: "subtotal" },
    { label: "VAT %", field: "vat" },
    { label: "VAT Amount", field: "vatAmount" },
    { label: "Net Amount", field: "netAmount" },
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const updatedForm = { ...formData, [name]: value };
    const stockQty = parseFloat(updatedForm.stock_in || 0);
    const price = parseFloat(updatedForm.purchase_price || 0);
    const vatRate = parseFloat(updatedForm.vat || 0);
    let subtotal = 0, vatAmount = 0, netAmount = 0;

    if (autoVat) {
      const priceExclVat = price / (1 + vatRate / 100);
      vatAmount = price - priceExclVat;
      subtotal = priceExclVat * stockQty;
      vatAmount = vatAmount * stockQty;
      netAmount = price * stockQty;
    } else {
      subtotal = price * stockQty;
      vatAmount = (subtotal * vatRate) / 100;
      netAmount = subtotal + vatAmount;
    }

    updatedForm.subtotal = subtotal.toFixed(2);
    updatedForm.vatAmount = vatAmount.toFixed(2);
    updatedForm.netAmount = netAmount.toFixed(2);

    // If item_id is changed, fetch opening balance (closing stock)
    if (name === "item_id" && value) {
      // Set unit and vat from selected item
      const selectedItem = stockable.find(item => item.id.toString() === value);
      //alert(selectedItem);
      if (selectedItem) {
       // alert("Selected item  found");
        updatedForm.unit = selectedItem.unit || "";
        updatedForm.vat = selectedItem.tax || "0";
      }
      else{
        alert("Selected item not found");
      }
      // Fetch closing stock for the selected item
      axios.get(`getclosingstock/${value}`, getHeaders())
        .then(res => {
          const closing = parseFloat(res.data?.closing_stock) || 0;
          setFormData(prev => ({ ...updatedForm, opening_stock: closing.toFixed(2) }));
        })
        .catch(() => setFormData(prev => ({ ...updatedForm, opening_stock: "0.00" })));
      // Don't call setFormData here, will be called in promise above
      return;
    }
    setFormData(updatedForm);
  };

  const handleCheckboxChange = () => {
    setAutoVat(!autoVat);
    handleInputChange({ target: { name: "vat", value: formData.vat } });
  };
const handleFinalSave = async () => {
  if (!formData.refno || !formData.supplier_id || !formData.pdate) {
    toast.error("Please fill in Ref. No., Supplier, and Purchase Date before final save.");
    return;
  }

  try {
    // Step 1: Get all stock entries for this invoice
    const res = await axios.get(`/getinvoiceitems/${formData.refno}`, getHeaders());
    const items = res.data || [];

    if (items.length === 0) {
      toast.error("No items found for this invoice.");
      return;
    }

    // Step 2: Calculate total net amount
    const totalNet = items.reduce((sum, item) => sum + parseFloat(item.netAmount || 0), 0);

    // Step 3: Check if ledger entry already exists
    const ledgerCheck = await axios.get(`/checkledgerentry/${formData.refno}`, getHeaders());
    if (ledgerCheck.data.exists) {
      toast.info("Ledger entry already exists for this invoice.");
      return;
    }

    // Step 4: Insert into ledger_entries
    await axios.post("/insertdata/ledger_entries", {
      transaction_id: formData.refno,
      date: formData.pdate,
      account_type: "Purchase",
      account_id: formData.supplier_id,
      description: "Final ledger entry from stock items",
      debit_amount: totalNet,
      credit_amount: 0
    }, getHeaders());

    toast.success("Ledger entry created successfully.");
  } catch (err) {
    console.error("Final Save Error:", err);
    toast.error("Failed to create ledger entry.");
  }
};

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post("/insertdata/inventory", formData, getHeaders());
      toast.success("Stock entry added!");

       //fetchData("inventory", setinvoiceItems, "id", { refno: formData.refno });
      const invoiceItems = await axios.get(`/getinvoiceitems/${formData.refno}`, getHeaders());
      const totalNet = invoiceItems.data.reduce((sum, item) => sum + parseFloat(item.netAmount || 0), 0);
    //  alert(totalNet);
  

      setFormData({
        item_id: "",
        opening_stock: "0",
        stock_in: "0",
        stock_out: "0",
        unit: "",
        purchase_price: "0",
        subtotal: "0",
        vat: "",
        vatAmount: "0",
        netAmount: "0",
        refno: formData.refno,
        pdate: formData.pdate,
        supplier_id: formData.supplier_id
      });

      // Use fetchData to get joined inventory after saving
      fetchData("inventory/joined", setData, "id");
      console.log("Inventory data fetched successfully using fetchData");
    } catch (err) {
      console.error("API Error:", err);
      console.error("Error details:", err.response?.data);
      console.error("Error status:", err.response?.status);
      toast.error(`Failed to save stock or ledger entry: ${err.response?.data?.error || err.message}`);
    }
  };

  useEffect(() => {
    fetchData("items", setStockable, "id", { isstockable: '1' });
    fetchData("suppliers", setSuppliers, "id", {});
    
  }, []);

  // Removed duplicate closing stock fetch from useEffect. Now handled only in handleInputChange for item_id.



  return (
    <Layout>
      <Header title="Add Stock Entry" />
      <ToastContainer />
      <div className="row">
        <div className="col-12">
          <CardComponent title="Add New Stock Entry" headerColor="primary">
            <form onSubmit={handleSubmit}>
              <div className="form-row row">
                <div className="form-group col-md-4">
                  <label>Supplier</label>
                  <select className="form-control" name="supplier_id" value={formData.supplier_id} onChange={handleInputChange} required>
                    <option value="">Select Supplier</option>
                    {suppliers.map(s => <option key={s.id} value={s.id}>{s.company_name}</option>)}
                  </select>
                </div>
                <div className="form-group col-md-4">
                  <label htmlFor="item_id">Select Item</label>
                  <select
                    id="item_id"
                    name="item_id"
                    value={formData.item_id}
                    onChange={handleInputChange}
                    className="form-control"
                    required
                  >
                    <option value="">Select Item</option>
                    {stockable.map((item) => (
                      <option key={item.id} value={item.id}>{item.iname}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group col-md-4">
                  <TextfieldwithLabel name="refno" value={formData.refno} onChange={handleInputChange} type="text" lable="Ref. No." />
                </div>
              </div>
              <div className="form-row row">
                <div className="form-group col-md-4">
                  <TextfieldwithLabel name="pdate" value={formData.pdate} onChange={handleInputChange} type="date" lable="Purchase Date" />
                </div>
                <div className="form-group col-md-4">
                  <TextfieldwithLabel name="opening_stock" value={formData.opening_stock} onChange={handleInputChange} type="number" lable="Opening Stock" />
                </div>
                <div className="form-group col-md-4">
                  <TextfieldwithLabel name="stock_in" value={formData.stock_in} onChange={handleInputChange} type="number" lable="Stock In" />
                </div>
              </div>
              <div className="form-row row">
                <div className="form-group col-md-4">
                  <TextfieldwithLabel name="stock_out" value={formData.stock_out} onChange={handleInputChange} type="number" lable="Stock Out" />
                </div>
                <div className="form-group col-md-4">
                  <TextfieldwithLabel name="purchase_price" value={formData.purchase_price} onChange={handleInputChange} type="number" lable="Purchase Price" />
                </div>
                <div className="form-group col-md-1">
                  <label className="d-block">Inc. VAT</label>
                  <div className="form-check">
                    <input type="checkbox" className="form-check-input" id="autoVat" checked={autoVat} onChange={handleCheckboxChange} />
                    <label className="form-check-label" htmlFor="autoVat"></label>
                  </div>
                </div>
              </div>
              <div className="form-row row">
                <div className="form-group col-md-4">
                  <TextfieldwithLabel name="vat" value={formData.vat} onChange={handleInputChange} type="number" lable="VAT (%)" />
                </div>
                <div className="form-group col-md-4">
                  <TextfieldwithLabel name="subtotal" value={formData.subtotal} onChange={handleInputChange} type="number" lable="Subtotal" readOnly />
                </div>
                <div className="form-group col-md-4">
                  <TextfieldwithLabel name="vatAmount" value={formData.vatAmount} onChange={handleInputChange} type="number" lable="VAT Amount" readOnly />
                </div>
                <div className="form-group col-md-4">
                  <TextfieldwithLabel name="netAmount" value={formData.netAmount} onChange={handleInputChange} type="number" lable="Net Amount" readOnly />
                </div>
              </div>
                     <div className="form-row row mt-3">
  <div className="form-group col-md-3 d-flex">
    <SubmitButton type="submit" name="Add Item" cls="btn btn-darkblue btn-anim mr-2" />
   
  </div>
  <div className="form-group col-md-6 d-flex">
   
    <button type="button" className="btn btn-success ml-2" onClick={handleFinalSave}>
      Final Save (Create Ledger Entry)
    </button>
  </div>
</div>
            </form>
          </CardComponent>
        </div>
        <div className="col-12 mt-4" id="tableid">
          {data.length === 0 ? (
            <p>No stock entries available.</p>
          ) : (
            <DataTable columns={columns} data={data} tablename="inventory" />
          )}
        </div>
      </div>
    </Layout>
  );
}
