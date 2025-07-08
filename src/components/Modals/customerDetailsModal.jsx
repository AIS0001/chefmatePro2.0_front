import React, { useEffect, useState } from "react";
import Modal from "react-modal";
import { FaTimes, FaPhone, FaUser, FaEnvelope, FaSearch } from "react-icons/fa";
import { TextfieldwithLabel } from "../Buttons/Textfield";
import axios from "axios";
import { fetchComboData } from "../../services/api";
import fetchData from "../../functions/fetchData";
import { getHeaders } from "../../utility/getHeader";
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
  const [CustomerDetails,setCustomerDetails] = useState([]);
  const [CustomersData, setCustomersData] = useState([]);

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const customers = await fetchComboData("customers", "name");
        setCustomersData(customers);
      } catch (error) {
        console.error("Error fetching customers:", error);
      }
    };
    fetchCustomers();
  }, []);

  const handlePhoneSearch = async () => {
    if (typeof customer.phone !== "string" || !customer.phone.trim()) {
      toast.error("Please enter a phone number to search");
      return;
    }
    try {
      const response = await fetchData("customers", (data) => {
        if (data.length > 0) {
          setCustomer({
            custid: data[0].id,
            name: data[0].name,
            phone: data[0].contact,
            email: data[0].email,
          });
        } else {
          toast.error("Record not found");
          setCustomer({ name: "", phone: customer.phone, email: "" });
        }
      }, "id", { contact: customer.phone.trim() });
    } catch (error) {
      console.error("Error searching customer:", error);
      toast.error("Error searching customer data");
    }
  };


  return (
    <Modal isOpen={isOpen} onRequestClose={onClose} style={customStyles}>
      <h3>Enter Customer Details</h3>
      <form>
        
        <label className="control-label mb-10" style={{ marginLeft: "15px" }}>
          Customer Phone Number
        </label>
        <div className="search-container" style={{ display: "flex", alignItems: "center", gap: "10px", marginLeft: "15px" }}>
          <FaPhone color="#17a2b8" />
          <input
            type="text"
            value={customer.phone}
            onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
            className="form-control"
            style={{ borderRadius: "4px", border: "2px solid #17a2b8", height: "45px", width: "85%" }}
            placeholder="Enter phone number"
          />
          <button type="button" onClick={handlePhoneSearch} className="btn btn-info">
            <FaSearch />
          </button>
        </div>
        <TextfieldwithLabel
          id="custid"
          value={customer.custid}
          onChange={(e) => setCustomer({ ...customer, custid: e.target.value })}
          required
          type="text"
          name="custid"
          lable="Customer ID"
          icon={<FaUser />}
        />
        <TextfieldwithLabel
          id="name"
          value={customer.name}
          onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
          required
          type="text"
          name="name"
          lable="Customer Name"
          icon={<FaUser />}
        />

        <TextfieldwithLabel
          id="email"
          value={customer.email}
          onChange={(e) => setCustomer({ ...customer, email: e.target.value })}
          required
          type="text"
          name="email"
          lable="Email"
          icon={<FaEnvelope />}
        />

<button
          className="btn btn-success mb-2 custom-btn"
          type="button"
          onClick={() => {
            if (!customer.name.trim() || !String(customer.phone || "").trim() || !customer.email.trim()) {
              toast.error("Please fill all fields!");
            } else {
              onSaveCustomerDetails(customer);
            }
          }}
        >
          Save & Continue
        </button>
      </form>
      <ToastContainer />
    </Modal>
  );
};

export default CustomerDetailsModal;
