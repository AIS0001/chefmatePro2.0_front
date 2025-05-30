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

const NewItemPriceModal = ({ isOpen, customer, onClose, onItemAdded }) => {
  const [formdata, setFormData] = useState({
    unit: "",
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
    //console.log(formdata);
    try {
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
          isstockable: formdata.isstockable,  // <-- new field added
          min_stock: formdata.min_stock, // <-- added
        },
        getHeaders()
      );
      const formdata1 = e.target;
      const formData = new FormData();
      Array.from(formdata1.images.files).forEach((file) => {
        formData.append("images", file);
      });
      console.log(post1.data.id);
      formData.append("product_id", post1.data.id); // Assuming post1 returns item ID

      const post2 = await axios.post("/addnewproduct/item_images", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${localStorage.getItem("token")}`,  // Again, make sure the token is correct
        },
      });
      // Immediately fetch updated data after adding an item
      // await fetchData("items", setData, "id", {});
      onItemAdded(); // Call this to trigger the reload function in NewItem
      toast.success("Item added successfully!");
      setImages([]);
      // Optionally add a delay before closing the modal to ensure the toast is visible
      setTimeout(() => {
        onClose(); // Close modal
      }, 1000); // Adjust the delay as needed
      //console.log("Fetched data after add:", data);
    } catch (err) {
      toast.error("Error in adding Item");
      console.error(err.message);
    }

    // Clear form data and errors
    // setFormData({});
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
