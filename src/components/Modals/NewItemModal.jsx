import React, { useEffect, useState } from "react";
import Modal from "react-modal";
import { FaTimes } from "react-icons/fa"; // Importing the close icon from react-icons
import { TextfieldwithLabel } from "../Buttons/Textfield";
import axios from "axios";
import { fetchComboData, fetchComboDataWithWhere } from "../../services/api";
import { getHeaders } from "../../utility/getHeader";
import fetchData from "../../functions/fetchData";
import { SubmitButton } from "../Buttons/Textfield";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { COMMON_LIQUOR_UNITS, COMMON_BOTTLE_SIZES } from "../../utility/unitConversions";

const customStyles = {
  content: {
    top: "50%",
    left: "50%",
    right: "auto",
    bottom: "auto",
    marginRight: "-50%",
    transform: "translate(-50%, -50%)",
    width: "100%",
    maxWidth: "90%",
    borderRadius: "10px",
  },
  overlay: {
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
};

const NewItemModal = ({ isOpen, customer, onClose, onItemAdded }) => {
  const [formdata, setFormData] = useState({
    unit: "",
    tax: "",
    subcat: "",
    unit_type: "simple",
    isstockable: "0",
    bottle_capacity_ml: "",
  });
  const [saleUnits, setSaleUnits] = useState([{ unit: "30ML Peg", factor: 30 }]);
 
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
  //   if (!customer) return null;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));

    // Reset unit configuration when switching unit types
    if (name === "unit_type") {
      if (value === "simple") {
        setSaleUnits([]);
        setFormData(prev => ({
          ...prev,
          bottle_capacity_ml: "",
          purchase_unit: prev.unit,
          base_unit: prev.unit
        }));
      } else if (value === "convertible") {
        setSaleUnits(COMMON_LIQUOR_UNITS);
        setFormData(prev => ({
          ...prev,
          purchase_unit: "Bottle",
          base_unit: "ML"
        }));
      }
    }
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
    //console.log(formdata);
    try {
      // Step 1: Create the item
      const post1 = await axios.post(
        "/insertdata/items",
        {
          iname: formdata.iname,
          unit: formdata.unit,
          tax: formdata.tax,
          mrp: formdata.mrp,
          offerprice: formdata.offerprice,
          catid: formdata.category,
          subcatid: formdata.subcat,
          description: formdata.desc,
          unit_type: formdata.unit_type,
          base_unit: formdata.unit_type === 'simple' ? formdata.unit : 'ML',
          purchase_unit: formdata.unit_type === 'simple' ? formdata.unit : 'Bottle',
          bottle_capacity_ml: formdata.unit_type === 'convertible' ? formdata.bottle_capacity_ml : null,
          sale_units: formdata.unit_type === 'convertible' ? JSON.stringify(saleUnits) : null,
          isstockable: formdata.isstockable,
        },
        getHeaders()
      );

      const productId = post1.data.id;
      console.log("Item created with ID:", productId);

      // Step 2: Create product units if stockable
      if (formdata.isstockable === "1") {
        if (formdata.unit_type === "convertible") {
          // Create base unit (Bottle)
          const baseUnitResponse = await axios.post(
            "/stock/units/create",
            {
              productId: productId,
              unitName: "Bottle",
              unitType: "BASE",
              isBaseUnit: true,
              mlCapacity: parseInt(formdata.bottle_capacity_ml),
              sellingPrice: parseFloat(formdata.offerprice || 0),
              purchasePrice: parseFloat(formdata.mrp || 0)
            },
            getHeaders()
          );

          const baseUnitId = baseUnitResponse.data.data.id;
          console.log("Base unit created with ID:", baseUnitId);

          // Create derived units (pegs) and variants
          for (const saleUnit of saleUnits) {
            // Create derived unit
            const derivedUnitResponse = await axios.post(
              "/stock/units/create",
              {
                productId: productId,
                unitName: saleUnit.unit,
                unitType: "DERIVED",
                isBaseUnit: false,
                mlCapacity: parseInt(saleUnit.factor),
                sellingPrice: parseFloat(saleUnit.price || 0),
                conversionFactor: parseInt(saleUnit.factor) / parseInt(formdata.bottle_capacity_ml)
              },
              getHeaders()
            );

            // Create variant for this sale unit
            await axios.post(
              "/stock/variants/create",
              {
                productId: productId,
                variantName: `${saleUnit.unit} - ${formdata.iname}`,
                baseUnitId: baseUnitId,
                quantityInBaseUnit: parseInt(saleUnit.factor) / parseInt(formdata.bottle_capacity_ml),
                mlQuantity: parseInt(saleUnit.factor),
                sellingPrice: parseFloat(saleUnit.price || 0),
                costPrice: parseFloat(saleUnit.price || 0) * 0.8
              },
              getHeaders()
            );
          }

          console.log("All units and variants created successfully");
        } else {
          // Simple unit - create single base unit
          await axios.post(
            "/stock/units/create",
            {
              productId: productId,
              unitName: formdata.unit,
              unitType: "BASE",
              isBaseUnit: true,
              sellingPrice: parseFloat(formdata.offerprice || 0),
              purchasePrice: parseFloat(formdata.mrp || 0)
            },
            getHeaders()
          );

          console.log("Simple unit created successfully");
        }
      }

      // Step 3: Upload images
      const formData = new FormData();
      if (images && images.length > 0) {
        images.forEach((file) => {
          formData.append("images", file);
        });
      }
      formData.append("product_id", productId);

      // For FormData, only set Authorization header and shop_id params. Let axios handle Content-Type with multipart boundary
      const token = getAuthToken();
      const shopId = getResolvedShopId();
      const config = {
        headers: {
          Authorization: token && !token.startsWith('Bearer ') ? `Bearer ${token}` : token
        },
        ...(shopId ? { params: { shop_id: shopId } } : {})
      };
      await axios.post("/addnewproduct/item_images", formData, config);

      onItemAdded();
      toast.success("Item created successfully with units and variants!");
      setImages([]);
      
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err) {
      toast.error("Error in adding Item: " + (err.response?.data?.message || err.message));
      console.error(err);
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
    const fetchData = async () => {
      // const tblname1 = "contract";
      // const tblname2 = "monthly_entries";
      // const col1 = "id";
      // const col2 = "contract_id";
      // const where = { cat_id: SelectedCatID };

      // await fetchDataFromTwoTables(tblname1, tblname2, col1, col2, setData, "t1.customer_name", where);
      setUnits(await fetchComboData("units", "name"));
      setTax(await fetchComboData("taxes", "taxname"));
      setCategory(await fetchComboData("categories", "name"));
      //setSubCategory(await fetchComboDataWithWhere("subcategory", "cat_id",where));
    };

    fetchData();
  }, []);

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
                  Tax
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
                  <option value="">Select Tax</option>
                  {getTax.map((taxes) => (
                    <option key={taxes.id} value={taxes.taxvalue}>
                      {taxes.taxname}
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
                  Is Stockable?
                </label>
                <select
                  id="isstockable"
                  name="isstockable"
                  className="form-select custom-select"
                  style={{
                    borderRadius: "4px",
                    border: "2px solid #17a2b8",
                    height: "45px",
                    width: "95%",
                    marginLeft: "15px",
                  }}
                  onChange={handleInputChange}
                  value={formdata.isstockable}
                >
                  <option value="0">No</option>
                  <option value="1">Yes</option>
                </select>
              </div>
            </div>
            {formdata.isstockable === "1" && (
              <>
                <div className="col-lg-4 col-md-4 col-sm-6 col-xs-12">
                  <div className="form-group">
                    <label
                      className="control-label mb-10"
                      style={{ marginLeft: "15px" }}
                    >
                      Unit Type
                    </label>
                    <select
                      id="unit_type"
                      name="unit_type"
                      className="form-select custom-select"
                      style={{
                        borderRadius: "4px",
                        border: "2px solid #17a2b8",
                        height: "45px",
                        width: "95%",
                        marginLeft: "15px",
                      }}
                      onChange={handleInputChange}
                      value={formdata.unit_type}
                    >
                      <option value="simple">Simple (Pcs/Cans)</option>
                      <option value="convertible">Convertible (Bottles with ML)</option>
                    </select>
                  </div>
                </div>
                {formdata.unit_type === "convertible" && (
                  <>
                    <div className="col-lg-4 col-md-4 col-sm-6 col-xs-12">
                      <div className="form-group">
                        <label
                          className="control-label mb-10"
                          style={{ marginLeft: "15px" }}
                        >
                          Bottle Capacity (ML)
                        </label>
                        <select
                          id="bottle_capacity_ml"
                          name="bottle_capacity_ml"
                          className="form-select custom-select"
                          style={{
                            borderRadius: "4px",
                            border: "2px solid #17a2b8",
                            height: "45px",
                            width: "95%",
                            marginLeft: "15px",
                          }}
                          onChange={handleInputChange}
                          value={formdata.bottle_capacity_ml}
                        >
                          <option value="">Select Bottle Size</option>
                          {COMMON_BOTTLE_SIZES.map((size, idx) => (
                            <option key={idx} value={size.value}>
                              {size.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12">
                      <div className="form-group" style={{ marginLeft: "15px" }}>
                        <label className="control-label mb-10">
                          Sale Units Configuration
                        </label>
                        <div className="row">
                          {saleUnits.map((saleUnit, idx) => (
                            <div key={idx} className="col-lg-4 col-md-6 mb-2">
                              <div className="input-group">
                                <input
                                  type="text"
                                  className="form-control"
                                  value={saleUnit.unit}
                                  onChange={(e) => {
                                    const newUnits = [...saleUnits];
                                    newUnits[idx].unit = e.target.value;
                                    setSaleUnits(newUnits);
                                  }}
                                  placeholder="Unit name"
                                />
                                <input
                                  type="number"
                                  className="form-control"
                                  value={saleUnit.factor}
                                  onChange={(e) => {
                                    const newUnits = [...saleUnits];
                                    newUnits[idx].factor = parseFloat(e.target.value);
                                    setSaleUnits(newUnits);
                                  }}
                                  placeholder="ML"
                                  style={{ maxWidth: "80px" }}
                                />
                                <button
                                  type="button"
                                  className="btn btn-danger btn-sm"
                                  onClick={() => setSaleUnits(saleUnits.filter((_, i) => i !== idx))}
                                >
                                  <i className="fas fa-times"></i>
                                </button>
                              </div>
                            </div>
                          ))}
                          <div className="col-lg-4 col-md-6 mb-2">
                            <button
                              type="button"
                              className="btn btn-info btn-sm"
                              onClick={() => setSaleUnits([...saleUnits, { unit: "", factor: 0 }])}
                            >
                              <i className="fas fa-plus"></i> Add Sale Unit
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </>
            )}
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

export default NewItemModal;
