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
import CardComponent from "../../components/cards/CardComponent";
import FinalBillModal from "./FinalBillModal";
import fetchOrderDetails from "../../functions/fetchOrderDetails";

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

const CheckBillModal = ({ isOpen, customer, onClose, onItemAdded }) => {
  const [formdata, setFormData] = useState({
    unit: "",
    tax: "",
    subcat: "",
  });
   const [TotalTablelist, setTotaltablelist] = useState(0);
const [selectedTable, setSelectedTable] = useState(null); // Table selection
     // Handle table selection
     const handleTableClick = (tableNumber) => {
       setSelectedTable(tableNumber);
   
       toast.success(`Selected Table: ${tableNumber}`);
     };
  const [getTax, setTax] = useState([]);
  const [getUnit, setUnits] = useState([]);
  const [getCategory, setCategory] = useState([]);
  const [FinalData, setFinalData] = useState([]);

  
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
    const fetchAndSetData = async () => {
      try {
       
        await fetchData("tablelist", setTotaltablelist, "id", {})

      } catch (error) {
        console.error("Error in useEffect:", error);
      }
    };

    fetchAndSetData();
  }, []);
  useEffect(() => {
    const fetchAndSetData = async () => {
      try {
       
        await fetchOrderDetails("orders","order_items", selectedTable,setFinalData)
        await fetchData("tablelist", setTotaltablelist, "id", {})
        
      } catch (error) {
        console.error("Error in useEffect:", error);
      }
    };

    fetchAndSetData();
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

         <div className="row mt-4">
                <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12">
                  <CardComponent
                    title="View All Tables List"
                    headerColor="darkblue"
                    pull="left"
                    bodyClass="panel-body"
                  >
                    <div className="panel panel-default card-view">
                      <div className="row">
                        {TotalTablelist.length > 0 ? (
                          TotalTablelist.map((tables, index) => (
                            <div
                              key={index}
                              onClick={() => handleTableClick(tables.name)}
                              className={`col-lg-2 col-md-3 col-sm-3 col-12 mb-3 ${tables.status == "0"
                                ? "bg-success"
                                : "bg-danger"
                                }`}
                            >
                              <div className="table-card p-3 text-center border w-100">
                                <img
                                  src={`../../dist/img/tables/table.png`}
                                  alt={`Table ${index + 1}`}
                                  className="img-fluid mb-2"
                                  style={{ width: "30px", height: "30px" }}
                                />
                                <h6> {tables.name}</h6>
                              </div>
                            </div>
      
                          ))
                        ) : (
                          <p>Loading tables...</p>
                        )}
      
      
                      </div>
                    </div>
                  </CardComponent>
                </div>
              </div>
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
          <table striped bordered hover>
          <thead>
            <tr>
              <th>Item</th>
              <th>Quantity</th>
              <th>Unit Price</th>
              <th>Total Price</th>
            </tr>
          </thead>
          <tbody>
            {FinalData.map((item, index) => (
              <tr key={index}>
                <td>{item.item_name}</td>
                <td>{item.qty}</td>
                <td>฿ {item.rate.toFixed(2)}</td>
                <td>฿ {(item.qty * item.rate).toFixed(2)}</td>
              </tr>
            ))}
            {/* <tr>
              <td colSpan="3" className="text-end"><strong>Subtotal</strong></td>
              <td>฿ {item.subtotal.toFixed(2)}</td>
            </tr>
            <tr>
              <td colSpan="3" className="text-end"><strong>Tax (7%)</strong></td>
              <td>฿ {item.tax.toFixed(2)}</td>
            </tr>
            <tr>
              <td colSpan="3" className="text-end"><strong>Grand Total</strong></td>
              <td>฿ {item.total.toFixed(2)}</td>
            </tr> */}
          </tbody>
        </table>
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
         
          </div>
        </form>
      </div>


    </Modal>
    
  );
};

export default CheckBillModal;
