import React, { useEffect, useState } from "react";
import Modal from "react-modal";
import { FaTimes } from "react-icons/fa";
import { TextfieldwithLabel } from "../Buttons/Textfield";
import axios from "axios";
import { fetchComboData } from "../../services/api";
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
  const [CustomersData, setCustomersData] = useState([]);

  // ✅ Fetch customer list when modal opens
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

  // ✅ Handle customer selection from dropdown
  const handleCustomerSelect = (e) => {
    const selectedId = e.target.value;

    if (selectedId) {
        // Find the selected customer object
        const selectedCustomer = CustomersData.find(c => c.id === selectedId);

        if (selectedCustomer) {
            setCustomer(prevCustomer => ({
                ...prevCustomer,  // Preserve other customer details
                id: selectedCustomer.id,   
                name: selectedCustomer.name,  // Set correct name
                phone: selectedCustomer.phone || "", // Prevent undefined values
                email: selectedCustomer.email || "",
            }));
        }
    } else {
        // Reset customer fields if no selection
        setCustomer({ id: "", name: "", phone: "", email: "" });
    }
};




  return (
    <Modal isOpen={isOpen} onRequestClose={onClose} style={customStyles}>
      <h3>Enter Customer Details</h3>
      <form>
        {/* ✅ Dropdown for selecting a customer */}
        <label className="control-label mb-10" style={{ marginLeft: "15px" }}>
          Customer Name
        </label>
        <select
    id="customerSelect"
    name="customerSelect"
    className="form-select custom-select"
    style={{
        borderRadius: "4px",
        border: "2px solid #17a2b8",
        height: "45px",
        width: "95%",
        marginLeft: "15px",
    }}
    onChange={handleCustomerSelect}  // ✅ Fix: Now updates the customer state properly
    value={customer.id}  // ✅ Ensures correct selection
>
    <option value="">Select Customer</option>
    {CustomersData.map((cust) => (
        <option key={cust.id} value={cust.id}>
            {cust.name}
        </option>
    ))}
</select>



        {/* ✅ Phone Number Input */}
        <TextfieldwithLabel
          id="phone"
          onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
          required
          value={customer.phone}
          type="text"
          name="phone"
          lable="Phone Number"
        />

        {/* ✅ Email Input */}
        <TextfieldwithLabel
          id="email"
          onChange={(e) => setCustomer({ ...customer, email: e.target.value })}
          required
          value={customer.email}
          type="text"
          name="email"
          lable="Email"
        />

        {/* ✅ Save & Continue Button */}
        <button
    className="btn btn-success mb-2 custom-btn"
    type="button"
    onClick={() => {
        console.log("Customer Data Before Save:", customer); // ✅ Debugging

        if (!customer.name.trim() || !customer.phone.trim() || !customer.email.trim()) {
            alert("Please fill all fields!"); // ❌ Prevent empty submission
        } else {
            onSaveCustomerDetails(customer);  // ✅ Pass correct customer details
        }
    }}
>
    Save & Continue
</button>

      </form>
    </Modal>
  );
};

export default CustomerDetailsModal;
