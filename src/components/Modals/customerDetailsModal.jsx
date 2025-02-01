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
    top: "30%",
    left: "50%",
    right: "auto",
    bottom: "auto",
    marginRight: "-50%",
    transform: "translate(-50%, -50%)",
    width: "50%",
    maxWidth: "90%",
    borderRadius: "10px",
    borderRadius: "10px",
    backgroundColor: "#fff",
    padding: "20px",
  },
  overlay: {
    zIndex: 1050,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
};


 
  const CustomerDetailsModal = ({ isOpen, onClose, onSaveCustomerDetails }) => {
    const [customer, setCustomer] = useState({ name: "", phone: "", email: "" });
  //   if (!customer) return null;
  const [formdata, setFormData] = useState({
    unit: "",
    tax: "",
    subcat: "",
  });


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
     
      toast.success("Item added successfully!");
    
      // Optionally add a delay before closing the modal to ensure the toast is visible
      setTimeout(() => {
        onClose(); // Close modal
      }, 1000); // Adjust the delay as needed
      //console.log("Fetched data after add:", data);
    } catch (err) {
      toast.error("Error in adding Item");
      console.error(err.message);
    }

   
  };
 


  useEffect(() => {
    const fetchData = async () => {
    
      //setCategory(await fetchComboData("categories", "name"));
      //setSubCategory(await fetchComboDataWithWhere("subcategory", "cat_id",where));
    };

    fetchData();
  }, []);

  return (
    <Modal isOpen={isOpen} onRequestClose={onClose} style={customStyles}>
      <h3>Enter Customer Details</h3>
      <form>
          <TextfieldwithLabel
                        id="name"
                        onChange={(e) => setCustomer({ ...customer, name: e.target.value })} required// Call the function on input change
                        value={customer.name}
                        type="text"
                        name="name"
                        lable="Customer Name"
                      />
          <TextfieldwithLabel
                        id="phone"
                        onChange={(e) => setCustomer({ ...customer, name: e.target.value })} required// Call the function on input change
                        value={customer.name}
                        type="text"
                        name="phone"
                        lable="Phone Number"
                      />
                         <TextfieldwithLabel
                        id="email"
                        onChange={(e) => setCustomer({ ...customer, name: e.target.value })} required// Call the function on input change
                        value={customer.name}
                        type="text"
                        name="email"
                        lable="Email"
                      />
        <input type="text" placeholder="Phone" value={customer.phone} 
          onChange={(e) => setCustomer({ ...customer, phone: e.target.value })} required />
        <input type="email" placeholder="Email" value={customer.email} 
          onChange={(e) => setCustomer({ ...customer, email: e.target.value })} required />
        
        <button type="button" onClick={() => {
          if (!customer.name || !customer.phone || !customer.email) {
            alert("Please fill all fields!");
          } else {
            onSaveCustomerDetails(customer);
          }
        }}>
          Save & Continue
        </button>
      </form>
    </Modal>
  );
};


export default CustomerDetailsModal;
