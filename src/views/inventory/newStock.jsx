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
    opening_stock: "",
    stock_in: "",
    stock_out: "",
    unit: "",
  //  min_stock_level: "",
    purchase_price: "",
    subtotal: "",
    vat: "",
    vatAmount: "",
    netAmount: ""
  });

  const [autoVat, setAutoVat] = useState(true);
  const [data, setData] = useState([]);
  const [stockable, setStockable] = useState([]);

  const columns = [
    { label: "ID", field: "id" },
    { label: "Item", field: "item_id" },
    { label: "Opening Stock", field: "opening_stock" },
    { label: "Stock In", field: "stock_in" },
    { label: "Stock Out", field: "stock_out" },
    { label: "Unit", field: "unit" },
    // { label: "Min Stock", field: "min_stock_level" },
    { label: "Purchase Price", field: "purchase_price" },
    { label: "Subtotal", field: "subtotal" },
    { label: "VAT %", field: "vat" },
    { label: "VAT Amount", field: "vatAmount" },
    { label: "Net Amount", field: "netAmount" },
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const updatedForm = {
      ...formData,
      [name]: value,
    };
  
    const stockQty = parseFloat(updatedForm.stock_in || 0);
    const price = parseFloat(updatedForm.purchase_price || 0);
    const vatRate = parseFloat(updatedForm.vat || 0);
  
    let subtotal = 0;
    let vatAmount = 0;
    let netAmount = 0;
  
    if (autoVat) {
      // VAT INCLUDED in purchase price
      const priceExclVat = price / (1 + vatRate / 100);
      vatAmount = price - priceExclVat;
      subtotal = priceExclVat * stockQty;
      vatAmount = vatAmount * stockQty;
      netAmount = price * stockQty;
    } else {
      // VAT EXCLUDED, add VAT
      subtotal = price * stockQty;
      vatAmount = (subtotal * vatRate) / 100;
      netAmount = subtotal + vatAmount;
    }
  
    updatedForm.subtotal = subtotal.toFixed(2);
    updatedForm.vatAmount = vatAmount.toFixed(2);
    updatedForm.netAmount = netAmount.toFixed(2);
  
    setFormData(updatedForm);
  };
  

  const handleCheckboxChange = () => {
    const checked = !autoVat;
    setAutoVat(checked);
  
    const stockQty = parseFloat(formData.stock_in || 0);
    const price = parseFloat(formData.purchase_price || 0);
    const vatRate = parseFloat(formData.vat || 0);
  
    let subtotal = 0;
    let vatAmount = 0;
    let netAmount = 0;
  
    if (checked) {
      // VAT is INCLUDED in price
      const priceExclVat = price / (1 + vatRate / 100);
      const singleVatAmount = price - priceExclVat;
  
      subtotal = priceExclVat * stockQty;
      vatAmount = singleVatAmount * stockQty;
      netAmount = price * stockQty;
    } else {
      // VAT is EXCLUDED from price (add it)
      subtotal = price * stockQty;
      vatAmount = (subtotal * vatRate) / 100;
      netAmount = subtotal + vatAmount;
    }
  
    setFormData((prev) => ({
      ...prev,
      subtotal: subtotal.toFixed(2),
      vatAmount: vatAmount.toFixed(2),
      netAmount: netAmount.toFixed(2),
    }));
  };
  
  

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post("/insertdata/inventory", formData, getHeaders());
      toast.success("Stock entry added!");
      setFormData({
        item_id: "",
        opening_stock: "",
        stock_in: "",
        stock_out: "0",
        unit: "",
        // min_stock_level: "",
        purchase_price: "",
        subtotal: "",
        vat: "7",
        vatAmount: "0",
        netAmount: "0"
      });
      fetchData("inventory", setData, "id", {});
    } catch (error) {
      console.error(error);
      toast.error("Failed to add stock entry.");
    }
  };

  useEffect(() => {
    fetchData("inventory", setData, "id", {});
    fetchData("items", setStockable, "id", { isstockable: 'true' });
  }, []);
  useEffect(() => {
    if (formData.item_id) {
      const selectedItem = stockable.find(
        (item) => item.id.toString() === formData.item_id.toString()
      );
      if (selectedItem) {
        setFormData((prev) => ({
          ...prev,
          unit: selectedItem.unit || "",
          vat: selectedItem.tax || "0", // assuming `vat` is stored as a number or string like "7"
        }));
      }
    }
  }, [formData.item_id, stockable]);
  


  useEffect(() => {
    const fetchLastClosingStock = async (itemId) => {
      try {
        const response = await axios.get(`/getclosingstock/:item_id/${itemId}`, getHeaders());
        const closing = response.data?.closing_stock || 0;
        setFormData((prev) => ({
          ...prev,
          opening_stock: closing.toFixed(2),
        }));
      } catch (err) {
        console.error("Error fetching closing stock:", err);
        setFormData((prev) => ({
          ...prev,
          opening_stock: "0.00",
        }));
      }
    };
  
    if (formData.item_id) {
      const selectedItem = stockable.find(
        (item) => item.id.toString() === formData.item_id.toString()
      );
      if (selectedItem) {
        setFormData((prev) => ({
          ...prev,
          unit: selectedItem.unit || "",
        }));
      }
  
      fetchLastClosingStock(formData.item_id);
    }
  }, [formData.item_id, stockable]);
  
  return (
    <Layout>
      <Header title="Add Stock Entry" />
      <ToastContainer />

      <div className="row">
  <div className="col-12">
    <CardComponent title="Add New Stock Entry" headerColor="primary">
      <form onSubmit={handleSubmit}>
        {/* Row 1 */}
        <div className="form-row row">
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
                <option key={item.iname} value={item.iname}>
                  {item.iname}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group col-md-4">
            <TextfieldwithLabel
              name="unit"
              value={formData.unit}
              onChange={handleInputChange}
              type="text"
              lable="Unit"
            />
          </div>
          <div className="form-group col-md-4">
            <TextfieldwithLabel
              name="refno"
              value={formData.refno}
              onChange={handleInputChange}
              type="text"
              lable="Ref. No."
            />
          </div>
          <div className="form-group col-md-4">
            <TextfieldwithLabel
              name="pdate"
              value={formData.pdate}
              onChange={handleInputChange}
              type="date"
              lable="Purchase date"
            />
          </div>
          
          {/* <div className="form-group col-md-4">
            <TextfieldwithLabel
              name="min_stock_level"
              value={formData.min_stock_level}
              onChange={handleInputChange}
              type="number"
              lable="Minimum Stock Level"
            />
          </div> */}
        </div>

        {/* Row 2 */}
        <div className="form-row row">
          <div className="form-group col-md-4">
            <TextfieldwithLabel
              name="opening_stock"
              value={formData.opening_stock}
              onChange={handleInputChange}
              type="number"
              lable="Opening Stock"
            />
          </div>
          <div className="form-group col-md-4">
            <TextfieldwithLabel
              name="stock_in"
              value={formData.stock_in}
              onChange={handleInputChange}
              type="number"
              lable="Stock In"
            />
          </div>
          <div className="form-group col-md-4">
            <TextfieldwithLabel
              name="stock_out"
              value={formData.stock_out}
              onChange={handleInputChange}
              type="number"
              lable="Stock Out"
            />
          </div>
        </div>

        {/* Row 3 */}
        <div className="form-row row">
          <div className="form-group col-md-4">
            <TextfieldwithLabel
              name="purchase_price"
              value={formData.purchase_price}
              onChange={handleInputChange}
              type="number"
              lable="Purchase Price"
            />
          </div>
          <div className="form-group col-md-4">
            <label className="d-block">Include  VAT </label>
            <div className="form-check">
              <input
                type="checkbox"
                className="form-check-input"
                id="autoVat"
                checked={autoVat}
                onChange={handleCheckboxChange}
              />
              <label className="form-check-label" htmlFor="autoVat">
              
              </label>
            </div>
          </div>
          <div className="form-group col-md-4">
            <TextfieldwithLabel
              name="vat"
              value={formData.vat}
              onChange={handleInputChange}
              type="number"
              lable="VAT (%)"
            />
          </div>
        </div>

        {/* Row 4 */}
        <div className="form-row row">
          <div className="form-group col-md-4">
            <TextfieldwithLabel
              name="subtotal"
              value={formData.subtotal}
              onChange={handleInputChange}
              type="number"
              lable="Subtotal"
              readOnly
            />
          </div>
          <div className="form-group col-md-4">
            <TextfieldwithLabel
              name="vatAmount"
              value={formData.vatAmount}
              onChange={handleInputChange}
              type="number"
              lable="VAT Amount"
              readOnly
            />
          </div>
          <div className="form-group col-md-4">
            <TextfieldwithLabel
              name="netAmount"
              value={formData.netAmount}
              onChange={handleInputChange}
              type="number"
              lable="Net Amount"
              readOnly
            />
          </div>
        </div>

        <div className="form-group mt-3">
          <SubmitButton type="submit" name="Save" cls="btn btn-darkblue btn-anim" />
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
