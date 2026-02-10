import React, { useEffect, useState } from "react";
import { Modal, Form, Input, Select, InputNumber, Checkbox, Button, Row, Col, Spin } from "antd";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axios from "axios";
import { getHeaders } from "../../utility/getHeader";
import fetchData from "../../functions/fetchData";
import { fetchComboData, fetchComboDataWithWhere } from "../../services/api";

const { TextArea } = Input;

const EditItemModal = ({ isOpen, item, onClose, onItemUpdated }) => {
  const [form] = Form.useForm();
  const [getTax, setTax] = useState([]);
  const [getUnit, setUnits] = useState([]);
  const [getQuantityTypes, setQuantityTypes] = useState([]);
  const [getCategory, setCategory] = useState([]);
  const [getSubCategory, setSubCategory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(false);

  // Populate form data when item changes
  useEffect(() => {
    if (item && isOpen) {
      form.setFieldsValue({
        iname: item.iname || "",
        unit: item.unit || "",
        quantity_type: item.weight || "",
        tax: item.tax || "",
        mrp: item.mrp || "",
        offerprice: item.offerprice || "",
        category: item.catid || "",
        subcat: item.subcatid || "",
        description: item.description || "",
        isstockable: item.isstockable || false,
        min_stock: item.min_stock || "",
      });
    }
  }, [item, isOpen, form]);

  // Fetch dropdown data when modal opens
  useEffect(() => {
    const fetchDropdownData = async () => {
      if (!isOpen) return;
      
      setFetchingData(true);
      try {
        // Fetch taxes, units, quantity types, and categories
        const [taxes, units, quantityTypes, categories] = await Promise.all([
          fetchData("taxes", null, "id", {}),
          fetchComboData("units", "name"),
          fetchComboData("quantity_type", "name"), // Fetch quantity types
          fetchComboData("categories", "name"),
        ]);
        
        setTax(taxes || []);
        setUnits(units || []);
        setQuantityTypes(quantityTypes || []);
        setCategory(categories || []);
        
        // If there's an item with a category, fetch subcategories immediately
        if (item && item.catid) {
          try {
            const subCats = await fetchComboDataWithWhere("subcategory", "subcat", {
              cat_id: item.catid
            });
            setSubCategory(subCats || []);
          } catch (error) {
            console.error("Error fetching subcategories for item:", error);
            setSubCategory([]);
          }
        }
      } catch (error) {
        console.error("Error fetching dropdown data:", error);
        toast.error("Failed to load form data");
      } finally {
        setFetchingData(false);
      }
    };

    fetchDropdownData();
  }, [isOpen, item]);

  // Fetch subcategories when category changes (but not on initial load with item)
  useEffect(() => {
    const fetchSubCategories = async () => {
      if (formdata.category) {
        try {
         // console.log("Category changed in form, fetching subcategories for category:", formdata.category);
          // Use fetchComboDataWithWhere for subcategories with where condition
          // Use "subcategory" (singular) and "subcat" as field name, "cat_id" as where field
          const subCats = await fetchComboDataWithWhere("subcategory", "subcat", {
            cat_id: formdata.category
          });
          //console.log("Fetched subcategories for form category:", subCats);
          setSubCategory(subCats || []);
        } catch (error) {
          console.error("Error fetching subcategories:", error);
          setSubCategory([]);
        }
      } else {
        setSubCategory([]);
      }
    };

    // Only fetch if modal is open and we have a category, but avoid double-fetching on initial item load
    if (isOpen && formdata.category) {
      fetchSubCategories();
    }
  }, [formdata.category, isOpen]);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setFormData({
        iname: "",
        unit: "",
        quantity_type: "",
        tax: "",
        mrp: "",
        offerprice: "",
        category: "",
        subcat: "",
        description: "",
        isstockable: false,
        min_stock: "",
      });
      setSubCategory([]);
      setErrors({});
    }
  }, [isOpen]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
   // console.log("EditItemModal - Input changed:", { name, value });
    
    // If category changes, reset subcategory
    if (name === "category") {
     // console.log("EditItemModal - Category changed to:", value, "- resetting subcategory");
      setFormData((prevData) => ({
        ...prevData,
        [name]: type === "checkbox" ? checked : value,
        subcat: "", // Reset subcategory when category changes
      }));
    } else {
      setFormData((prevData) => ({
        ...prevData,
        [name]: type === "checkbox" ? checked : value,
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formdata.iname.trim()) newErrors.iname = "Item name is required";
    if (!formdata.unit) newErrors.unit = "Unit is required";
    if (!formdata.tax) newErrors.tax = "Tax is required";
    if (!formdata.mrp || formdata.mrp <= 0) newErrors.mrp = "Valid MRP is required";
    if (!formdata.offerprice || formdata.offerprice <= 0) newErrors.offerprice = "Valid offer price is required";
    if (!formdata.category) newErrors.category = "Category is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error("Please fill all required fields correctly");
      return;
    }

    setLoading(true);
    const requestBody = {
      iname: formdata.iname,
      unit: formdata.unit,
      weight: formdata.quantity_type,
      tax: formdata.tax,
      mrp: formdata.mrp,
      offerprice: formdata.offerprice,
      catid: formdata.category,
      subcatid: formdata.subcat,
      description: formdata.description,
      isstockable: formdata.isstockable,
      min_stock: formdata.min_stock,
    };
    const headers = getHeaders();
    console.log("[EditItemModal] Submitting update:", {
      url: `/updatecommondata/items/id/${item.id}`,
      body: requestBody,
      headers: headers
    });
    try {
      const response = await axios.put(
        `/updatecommondata/items/id/${item.id}`,
        requestBody,
        headers
      );

      console.log("[EditItemModal] Update response:", response);
      if (response.status === 200) {
        toast.success("Item updated successfully!");
        onItemUpdated(); // Trigger data reload
        onClose(); // Close modal
      }
    } catch (error) {
      if (error.response) {
        console.error("[EditItemModal] Error updating item - response:", error.response);
      } else if (error.request) {
        console.error("[EditItemModal] Error updating item - request:", error.request);
      } else {
        console.error("[EditItemModal] Error updating item - message:", error.message);
      }
      toast.error("Failed to update item. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      iname: "",
      unit: "",
      quantity_type: "",
      tax: "",
      mrp: "",
      offerprice: "",
      category: "",
      subcat: "",
      description: "",
      isstockable: false,
      min_stock: "",
    });
    setErrors({});
    onClose();
  };

  if (!item) return null;

  return (
    <>
      <style>{scrollStyles}</style>
      <Modal
        isOpen={isOpen}
        onRequestClose={handleClose}
        style={customStyles}
        ariaHideApp={false}
      >
      {/* Modal Container with Scroll */}
      <div className="modal-container" style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        maxHeight: '90vh'
      }}>
        {/* Fixed Header */}
        <div className="modal-header d-flex justify-content-between align-items-center p-3 border-bottom" style={{
          flexShrink: 0,
          backgroundColor: '#f8f9fa'
        }}>
          <h2 className="modal-title mb-0">Edit Item</h2>
          <button
            type="button"
            className="btn-close"
            onClick={handleClose}
            style={{ background: "none", border: "none" }}
          >
            <FaTimes size={20} />
          </button>
        </div>

        {/* Scrollable Content Area */}
        <div className="modal-body" style={{
          flex: 1,
          overflowY: 'auto',
          padding: '20px',
          maxHeight: 'calc(90vh - 120px)' // Account for header and footer
        }}>
          <form onSubmit={handleSubmit}>
        <div className="row">
          <div className="col-md-6">
            <TextfieldwithLabel
              lable="Item Name"
              name="iname"
              type="text"
              value={formdata.iname}
              onChange={handleInputChange}
            />
            {errors.iname && <small className="text-danger">{errors.iname}</small>}
          </div>
          <div className="col-md-6">
            <div className="form-group">
              <label className="control-label mb-10">Unit</label>
              <select
                name="unit"
                className="form-control"
                value={formdata.unit}
                onChange={handleInputChange}
              >
                <option value="">Select Unit</option>
                {getUnit.map((unit) => (
                  <option key={unit.id} value={unit.name}>
                    {unit.name}
                  </option>
                ))}
              </select>
              {errors.unit && <small className="text-danger">{errors.unit}</small>}
            </div>
          </div>
        </div>

        <div className="row">
          <div className="col-md-6">
            <TextfieldwithLabel
              lable="Quantity Type"
              name="quantity_type"
              type="text"
              value={formdata.quantity_type}
              onChange={handleInputChange}
            />
          </div>
          <div className="col-md-6">
            <div className="form-group">
              <label className="control-label mb-10">Tax</label>
              <select
                name="tax"
                className="form-control"
                value={formdata.tax}
                onChange={handleInputChange}
              >
                <option value="">Select Tax</option>
                {getTax.map((tax) => (
                  <option key={tax.id} value={tax.taxrate}>
                    {tax.taxname} ({tax.taxrate}%)
                  </option>
                ))}
              </select>
              {errors.tax && <small className="text-danger">{errors.tax}</small>}
            </div>
          </div>
        </div>

        <div className="row">
          <div className="col-md-6">
            <TextfieldwithLabel
              lable="MRP"
              name="mrp"
              type="number"
              value={formdata.mrp}
              onChange={handleInputChange}
            />
            {errors.mrp && <small className="text-danger">{errors.mrp}</small>}
          </div>
          <div className="col-md-6">
            <TextfieldwithLabel
              lable="Offer Price"
              name="offerprice"
              type="number"
              value={formdata.offerprice}
              onChange={handleInputChange}
            />
            {errors.offerprice && <small className="text-danger">{errors.offerprice}</small>}
          </div>
        </div>

        <div className="row">
          <div className="col-md-6">
            <div className="form-group">
              <label className="control-label mb-10">Category</label>
              <select
                name="category"
                className="form-control"
                value={formdata.category}
                onChange={handleInputChange}
              >
                <option value="">Select Category</option>
                {getCategory.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
              {errors.category && <small className="text-danger">{errors.category}</small>}
            </div>
          </div>
          <div className="col-md-6">
            <div className="form-group">
              <label className="control-label mb-10">Sub Category</label>
              <select
                name="subcat"
                className="form-control"
                value={formdata.subcat}
                onChange={handleInputChange}
              >
                <option value="">Select Sub Category</option>
                {getSubCategory.map((subcat) => (
                  <option key={subcat.id} value={subcat.id}>
                    {subcat.subcat}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="row">
          <div className="col-md-12">
            <div className="form-group">
              <label className="control-label mb-10">Description</label>
              <textarea
                name="description"
                className="form-control"
                rows="3"
                value={formdata.description}
                onChange={handleInputChange}
                placeholder="Enter description"
              />
            </div>
          </div>
        </div>

        <div className="row">
          <div className="col-md-6">
            <div className="form-group">
              <div className="form-check">
                <input
                  type="checkbox"
                  className="form-check-input"
                  name="isstockable"
                  checked={formdata.isstockable}
                  onChange={handleInputChange}
                />
                <label className="form-check-label">Is Stockable</label>
              </div>
            </div>
          </div>
          <div className="col-md-6">
            <TextfieldwithLabel
              lable="Minimum Stock"
              name="min_stock"
              type="number"
              value={formdata.min_stock}
              onChange={handleInputChange}
            />
          </div>
        </div>

        <div className="d-flex justify-content-end gap-2 mt-4">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleClose}
            disabled={loading}
          >
            Cancel
          </button>
          <SubmitButton
            name={loading ? "Updating..." : "Update Item"}
            type="submit"
            cls="btn btn-primary"
          />
        </div>
        </form>
        </div>

        {/* Fixed Footer */}
        <div className="modal-footer p-3 border-top" style={{
          flexShrink: 0,
          backgroundColor: '#f8f9fa'
        }}>
          <small className="text-muted">
            <i className="fas fa-info-circle me-1"></i>
            Use scroll to navigate through all fields on smaller screens
          </small>
        </div>
      </div>

      <ToastContainer position="top-right" autoClose={3000} />
    </Modal>
    </>
  );
};

export default EditItemModal;
