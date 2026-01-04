import React, { useEffect, useState } from "react";
import Modal from "react-modal";
import { FaTimes } from "react-icons/fa"; // Importing the close icon from react-icons
import { TextfieldwithLabel } from "../Buttons/Textfield";
import axios from "axios";
import { fetchComboData, fetchComboDataWithWhere } from "../../services/api";
import { getHeaders } from "../../utility/getHeader";
import { getAuthToken } from "../../utility/getHeader";
import fetchData from "../../functions/fetchData";
import { SubmitButton } from "../Buttons/Textfield";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const customStyles = {
  content: {
    top: "50%",
    left: "50%",
    right: "auto",
    bottom: "auto",
    marginRight: "-50%",
    transform: "translate(-50%, -50%)",
    width: "70%",
    maxWidth: "70%",
    borderRadius: "10px",
    zIndex: 10000, // Higher than sidebar z-index (2000)
  },
  overlay: {
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    zIndex: 9999, // High z-index for overlay, but below content
  },
};

const NewItemPriceModal = ({ isOpen, customer, onClose, onItemAdded }) => {
  const [formdata, setFormData] = useState({
    unit: "",
    quantity_type: "",
    tax: "",
    subcat: "",
    isstockable: false,
    min_stock: "",  // <-- added,
  });

  const [getTax, setTax] = useState([]);
  const [getUnit, setUnits] = useState([]);
  const [getCategory, setCategory] = useState([]);
  const [SelectedCatID, setSelectedCatID] = useState([]);
  const [getSubCategory, setSubCategory] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [reload, setReload] = useState(false);
  const [data, setData] = useState([]);
  const [errors, setErrors] = useState({});
  const [images, setImages] = useState([]);
  const [taxType, setTaxType] = useState(""); // For storing tax type from coresetting
  const [dynamicTaxOptions, setDynamicTaxOptions] = useState([]); // For dynamic tax options
  //   if (!customer) return null;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };
  // Handle file changes and set preview
  const handleFileChange = (event) => {
    const selectedImages = Array.from(event.target.files).map((file) =>
      Object.assign(file, { preview: URL.createObjectURL(file) })
    );
    setImages((prevImages) => [...prevImages, ...selectedImages]);
  };

  const handleDeleteImage = (index) => {
    setImages(images.filter((_, i) => i !== index));
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("[Add Item] formdata:", formdata);
    try {
      // Log request body and headers
      const requestBody = {
        iname: formdata.iname,
        unit: formdata.unit,
        weight: formdata.quantity_type,
        tax: formdata.tax,
        mrp: formdata.mrp,
        offerprice: formdata.offerprice,
        catid: formdata.category,
        subcatid: formdata.subcat,
        description: formdata.desc,
        isstockable: formdata.isstockable,
        min_stock: formdata.min_stock,
      };
      // console.log("[Add Item] Request body:", requestBody);
      // console.log("[Add Item] Request headers:", getHeaders());

      const post1 = await axios.post(
        "/insertdata/items",
        requestBody,
        getHeaders()
      );
     // console.log("[Add Item] post1 response:", post1);

      const formdata1 = e.target;
      const formData = new FormData();
      
      // Check if images exist before processing
      if (formdata1.images && formdata1.images.files && formdata1.images.files.length > 0) {
        Array.from(formdata1.images.files).forEach((file, index) => {
          console.log(`📸 Adding image ${index + 1}:`, file.name, file.size, 'bytes');
          formData.append("images", file);
        });
      } else {
        console.log('⚠️ No images selected');
      }
      
      formData.append("product_id", post1.data.id); // Assuming post1 returns item ID
      console.log('🆔 Product ID added:', post1.data.id);

      try {
        // Check authentication before upload
        const token = getAuthToken();
        if (!token) {
          toast.error('Authentication required. Please log in again.');
          return;
        }

        // Get proper auth headers (but don't include Content-Type)
        const authHeaders = getHeaders();
        
        // console.log('📸 Uploading images for product ID:', post1.data.id);
        // console.log('📸 Number of images:', formdata1.images.files ? formdata1.images.files.length : 0);
        // console.log('🌐 API Base URL:', axios.defaults.baseURL);
        // console.log('📡 Full URL:', `${axios.defaults.baseURL}/addnewproduct/item_images`);
        // console.log('🔑 Token found:', !!token);
        // console.log('📦 FormData entries:');
        for (let pair of formData.entries()) {
          console.log(pair[0], pair[1]);
        }
        
        const post2 = await axios.post("/addnewproduct/item_images", formData, {
          headers: {
            // Only include Authorization - let axios set Content-Type with boundary
            'Authorization': authHeaders.headers.Authorization
          }
        });
        
        console.log('✅ Images uploaded successfully:', post2.data);
      } catch (imgErr) {
        console.error('❌ Error uploading images:', imgErr);
        
        // Enhanced error logging
        if (imgErr.response) {
          console.error('❌ Status:', imgErr.response.status);
          console.error('❌ Data:', imgErr.response.data);
          console.error('❌ Headers:', imgErr.response.headers);
          
          if (imgErr.response.status === 401) {
            toast.error('Authentication failed. Please log in again.');
          } else if (imgErr.response.status === 403) {
            toast.error('Insufficient permissions to upload images.');
          } else if (imgErr.response.status === 500) {
            toast.error('Server error during image upload. Please try again.');
          } else {
            toast.error(`Image upload failed: ${imgErr.response.data?.message || 'Unknown error'}`);
          }
        } else if (imgErr.request) {
          console.error('❌ Network error:', imgErr.request);
          toast.error('Network error during image upload.');
        } else {
          console.error('❌ Error:', imgErr.message);
          toast.error(`Image upload error: ${imgErr.message}`);
        }
      }

      onItemAdded(); // Call this to trigger the reload function in NewItem
      toast.success("Item added successfully!");
      setImages([]);
      setTimeout(() => {
        onClose(); // Close modal
      }, 1000);
    } catch (err) {
      toast.error("Error in adding Item");
     // console.error("[Add Item] Error:", err);
      if (err.response) {
        // console.error("[Add Item] Error response data:", err.response.data);
        // console.error("[Add Item] Error response status:", err.response.status);
        // console.error("[Add Item] Error response headers:", err.response.headers);
      }
    }
    setErrors({});
  };

  // Fetch subcategories based on selected category
  const handleCategoryChange = async (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));

    const selectedCategoryId = e.target.value;
    setSelectedCategory(selectedCategoryId);

    if (selectedCategoryId) {
      try {
        const whereClause = { cat_id: selectedCategoryId };
        const data = await fetchComboDataWithWhere(
          "subcategory",
          "subcat",
          whereClause
        );
        setSubCategories(data);
      } catch (error) {
        console.error("Error fetching subcategories:", error);
      }
    } else {
      setSubCategories([]); // Clear subcategories if no category is selected
    }
  };

  const handleComboChange = async (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  useEffect(() => {
    const fetchComboDataAsync = async () => {
      console.log("🔄 useEffect running - fetching combo data");
      
      try {
        // Fetch basic combo data
      //  console.log("📦 Fetching units...");
        const unitsData = await fetchComboData("units", "name");
      //  console.log("✅ Units fetched:", unitsData);
        setUnits(unitsData);
        
      //  console.log("📦 Fetching categories...");
        const categoriesData = await fetchComboData("categories", "name");
       // console.log("✅ Categories fetched:", categoriesData);
        setCategory(categoriesData);
        
        // Fetch tax type from coresetting table
      //  console.log("📦 Fetching tax type from coresetting...");
        const coreSettings = await fetchData("coresetting", null, "id", {});
      //  console.log("✅ Core settings fetched:", coreSettings);
        
        let currentTaxType = "gst"; // default
        
        if (coreSettings && coreSettings.length > 0) {
          const taxTypeSetting = coreSettings.find(setting => setting.setting_name === "tax_type");
          if (taxTypeSetting) {
            currentTaxType = taxTypeSetting.setting_value.toLowerCase();
          }
        }
        
        setTaxType(currentTaxType);
        
        // Create dynamic tax options based on tax type
        let taxOptions = [];
        if (currentTaxType === "vat") {
          taxOptions = [
            { id: 1, taxname: "VAT 0%", taxvalue: "0" },
            { id: 2, taxname: "VAT 7%", taxvalue: "7" }
          ];
          console.log("✅ VAT options created:", taxOptions);
        } else {
          // For GST or any other tax type, fetch from taxes table
       //   console.log("📦 Fetching tax options from taxes table...");
          taxOptions = await fetchComboData("taxes", "taxname");
        //  console.log("✅ Tax options fetched:", taxOptions);
        }
        
        setDynamicTaxOptions(taxOptions);
        setTax(taxOptions); // Keep backward compatibility

        // console.log("🎯 Tax type loaded:", currentTaxType);
        // console.log("🎯 Tax options loaded:", taxOptions);
        // console.log("✅ All combo data fetched successfully");

      } catch (error) {
        console.error("❌ Error fetching combo data:", error);
        // Fallback to default tax options
        try {
          const fallbackTaxOptions = await fetchComboData("taxes", "taxname");
          setTax(fallbackTaxOptions);
        } catch (fallbackError) {
          console.error("❌ Error fetching fallback tax options:", fallbackError);
        }
      }
    };

    // Only run if modal is open
    if (isOpen) {
      fetchComboDataAsync();
    }
  }, [isOpen]);

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      contentLabel="New Item Entry"
      style={customStyles}
      ariaHideApp={false}

    >
      <ToastContainer />
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          
        }}
      >
        <h4>Add New Item</h4>
        <button
          onClick={onClose}
          style={{
            background: "transparent",
            border: "none",
            cursor: "pointer",
          }}
        >
          <FaTimes size={20} color="red" /> {/* Close icon */}
        </button>
      </div>
      <hr
        style={{ width: "99%", border: "1px solid #ccc", margin: "10px 0" }}
      />{" "}
      {/* Horizontal rule */}
      <div>
        <form onSubmit={handleSubmit}>
          <div className="row">
            <div className="col-lg-4 col-md-4 col-sm-6 col-xs-12">
              <TextfieldwithLabel
                id="iname"
                onChange={(e) => handleInputChange(e)}
                value={formdata.iname}
                type="text"
                name="iname"
                lable="Item Name"
              />
            </div>
            <div className="col-lg-4 col-md-4 col-sm-6 col-xs-12">
              <div className="form-group">
                <label
                  className="control-label mb-10"
                  style={{ marginLeft: "15px" }}
                >
                  Unit
                </label>

                <select
                  id="unit"
                  name="unit"
                  className="form-select custom-select"
                  style={{
                    borderRadius: "4px",
                    border: "2px solid #17a2b8",
                    height: "45px", // Increased height
                    width: "95%", // Full width of the parent
                    marginLeft: "15px", // Ensure no margin that could offset alignment
                  }} // Stylish combo box
                  onChange={handleComboChange}
                  value={formdata.unit}
                >
                  <option value="">Select Unit</option>
                  {getUnit.map((units) => (
                    <option key={units.id} value={units.name}>
                      {units.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="col-lg-4 col-md-4 col-sm-6 col-xs-12">
              <div className="form-group">
                <label
                  className="control-label mb-10"
                  style={{ marginLeft: "15px" }}
                >
                  Item Type
                </label>

                <select
                  id="quantity_type"
                  name="quantity_type"
                  className="form-select custom-select"
                  style={{
                    borderRadius: "4px",
                    border: "2px solid #17a2b8",
                    height: "45px", // Increased height
                    width: "95%", // Full width of the parent
                    marginLeft: "15px", // Ensure no margin that could offset alignment
                  }} // Stylish combo box
                  onChange={handleComboChange}
                  value={formdata.quantity_type}
                >
                  <option value="">Select type</option>
                  <option value="unit">Per Piece</option>
                  <option value="weight">Per KG</option>
                </select>
              </div>
            </div>


            <div className="col-lg-4 col-md-4 col-sm-6 col-xs-12">
              <div className="form-group">
                <label
                  className="control-label mb-10"
                  style={{ marginLeft: "15px" }}
                >
                  Tax {taxType ? `(${taxType.toUpperCase()})` : ''}
                </label>

                <select
                  id="tax"
                  name="tax"
                  className="form-select custom-select"
                  style={{
                    borderRadius: "4px",
                    border: "2px solid #17a2b8",
                    height: "45px", // Increased height
                    width: "95%", // Full width of the parent
                    marginLeft: "15px", // Ensure no margin that could offset alignment
                  }} // Stylish combo box
                  onChange={handleComboChange}
                  value={formdata.tax}
                >
                  <option value="">Select {taxType ? taxType.toUpperCase() : 'Tax'}</option>
                  {getTax.map((taxes) => (
                    <option key={taxes.id} value={taxes.taxvalue}>
                      {taxes.taxname}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="col-lg-4 col-md-4 col-sm-6 col-xs-12">
              <TextfieldwithLabel
                id="mrp"
                onChange={(e) => handleInputChange(e)}
                value={formdata.mrp}
                type="number"
                name="mrp"
                lable="MRP"
              />
            </div>
            <div className="col-lg-4 col-md-4 col-sm-6 col-xs-12">
              <TextfieldwithLabel
                id="offerprice"
                onChange={(e) => handleInputChange(e)}
                value={formdata.offerprice}
                type="number"
                name="offerprice"
                lable="Selling Price"
              />
            </div>
            
            <div className="col-lg-4 col-md-4 col-sm-6 col-xs-12">
              <div className="form-group">
                <label
                  className="control-label mb-10"
                  style={{ marginLeft: "15px" }}
                >
                  Under Category
                </label>

                <select
                  id="category"
                  name="category"
                  className="form-select custom-select"
                  style={{
                    borderRadius: "4px",
                    border: "2px solid #17a2b8",
                    height: "45px", // Increased height
                    width: "95%", // Full width of the parent
                    marginLeft: "15px", // Ensure no margin that could offset alignment
                  }} // Stylish combo box
                  onChange={handleCategoryChange}
                  value={formdata.category}
                >
                  <option value="">Select Category</option>
                  {getCategory.map((options) => (
                    <option key={options.id} value={options.id}>
                      {options.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="col-lg-4 col-md-4 col-sm-6 col-xs-12">
              <div className="form-group">
                <label
                  className="control-label mb-10"
                  style={{ marginLeft: "15px" }}
                >
                  Under SubCategory
                </label>

                <select
                  id="subcat"
                  name="subcat"
                  className="form-select custom-select"
                  style={{
                    borderRadius: "4px",
                    border: "2px solid #17a2b8",
                    height: "45px", // Increased height
                    width: "95%", // Full width of the parent
                    marginLeft: "15px", // Ensure no margin that could offset alignment
                  }} // Stylish combo box
                  value={formdata.subcat}
                  onChange={handleComboChange}
                >
                  <option value="">Select SubCategory</option>
                  {subCategories.map((options) => (
                    <option key={options.id} value={options.id}>
                      {options.subcat}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="col-lg-4 col-md-4 col-sm-6 col-xs-12">
              <TextfieldwithLabel
                id="desc"
                onChange={(e) => handleInputChange(e)}
                value={formdata.desc}
                type="text"
                name="desc"
                lable="Item Description"
              />
            </div>
            <div className="col-lg-4 col-md-4 col-sm-6 col-xs-12">
              <TextfieldwithLabel
                id="min_stock"
                onChange={(e) => handleInputChange(e)}
                value={formdata.min_stock}
                type="number"
                name="min_stock"
                lable="Minimum Stock Level"
              />
            </div>

            <div className="col-lg-4 col-md-4 col-sm-6 col-xs-12">

              <div className='form-group'>
                <label className='control-label mb-10'>Upload Images</label>
                <input
                  type="file"
                  name="images"
                  multiple
                  onChange={handleFileChange}
                />
              </div>


            </div>
            <div className="col-lg-4 col-md-4 col-sm-6 col-xs-12">

              <div className='form-group'>
                <label className='control-label'>Is Stockable

                  <input
                    type="checkbox"
                    id="isstockable"
                    name="isstockable"
                    checked={formdata.isstockable}
                    onChange={(e) =>
                      setFormData((prevData) => ({
                        ...prevData,
                        isstockable: e.target.checked,
                      }))
                    }
                    style={{
                      transform: "scale(1.5)", // Makes the checkbox 1.5x larger
                      marginRight: "10px",
                      cursor: "pointer",
                    }}
                  />

                </label>

              </div>


            </div>




            <div className="col-lg-4 col-md-4 col-sm-6 col-xs-12">
              <label className="control-label mb-12"></label>
              <SubmitButton
                type="submit"
                name="Add Item"
                cls="btn btn-darkblue btn-anim"
              />
            </div>
            <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12">
              <div className="image-preview">
                {images.length > 0 &&
                  images.map((image, index) => (
                    <div key={index} className="preview-item">
                      <img
                        src={image.preview}
                        alt="preview"
                        style={{ width: "100px" }}
                      />
                      <div className="col-lg-4 col-md-3 col-sm-12 col-xs-12">
                        <div className='form-group'>
                          <button
                            type="button"
                            onClick={() => handleDeleteImage(index)}
                            className="delete-icon"
                          >
                            <i className="fas fa-times"></i>
                          </button>
                        </div>
                      </div>
                    </div>

                  ))}
              </div>
            </div>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default NewItemPriceModal;
