import React, { useState, useEffect } from "react";
import Modal from "react-modal";
import { FaTimes } from "react-icons/fa";
import axios from "axios";
import { getHeaders } from "../../utility/getHeader";
import { toast } from "react-toastify";
import { TextfieldwithLabel } from "../Buttons/Textfield";
import { SubmitButton } from "../Buttons/Textfield";

const customStyles = {
  content: {
    top: "50%",
    left: "50%",
    right: "auto",
    bottom: "auto",
    marginRight: "-50%",
    transform: "translate(-50%, -50%)",
    width: "500px",
    maxWidth: "90%",
    borderRadius: "10px",
    padding: "20px",
  },
  overlay: {
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
};

const EditTaxModal = ({ isOpen, onClose, taxData, onUpdateSuccess }) => {
  const [formdata, setFormData] = useState({
    taxname: "",
    taxvalue: "",
    included: false,
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  // Update form data when taxData changes
  useEffect(() => {
    if (taxData) {
      setFormData({
        taxname: taxData.taxname || "",
        taxvalue: taxData.taxvalue || "",
        included: taxData.included || false,
      });
    }
  }, [taxData]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    try {
      // Validate form data
      const newErrors = {};
      
      if (!formdata.taxname.trim()) {
        newErrors.taxname = "Tax name is required";
      }

      if (!formdata.taxvalue || formdata.taxvalue <= 0) {
        newErrors.taxvalue = "Tax value must be greater than 0";
      }

      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        setLoading(false);
        return;
      }

      // Update the tax record
      await axios.put(
        `/updatedata1/taxes/id/${taxData.id}`,
        {
          taxname: formdata.taxname,
          taxvalue: formdata.taxvalue,
          included: formdata.included,
        },
        getHeaders()
      );

      toast.success("Tax updated successfully!");
      
      // Call the success callback to refresh parent data
      if (onUpdateSuccess) {
        onUpdateSuccess();
      }
      
      // Close the modal
      onClose();
      
    } catch (err) {
      console.error("Error updating tax:", err);
      toast.error("Error updating tax");
      setErrors({ submit: "Error updating tax. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({ taxname: "", taxvalue: "", included: false });
    setErrors({});
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={handleClose}
      contentLabel="Edit Tax"
      style={customStyles}
      ariaHideApp={false}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
        }}
      >
        <h4 style={{ margin: 0 }}>Edit Tax</h4>
        <button
          onClick={handleClose}
          style={{
            background: "transparent",
            border: "none",
            cursor: "pointer",
          }}
        >
          <FaTimes size={20} color="red" />
        </button>
      </div>

      <hr style={{ margin: "10px 0" }} />

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <TextfieldwithLabel
            id="taxname"
            onChange={handleInputChange}
            value={formdata.taxname}
            type="text"
            name="taxname"
            lable="Tax Name"
            error={errors.taxname}
          />
          {errors.taxname && (
            <div style={{ color: "red", fontSize: "12px", marginTop: "5px" }}>
              {errors.taxname}
            </div>
          )}
        </div>

        <div className="form-group">
          <TextfieldwithLabel
            id="taxvalue"
            onChange={handleInputChange}
            value={formdata.taxvalue}
            type="number"
            name="taxvalue"
            lable="Tax Value"
            error={errors.taxvalue}
          />
          {errors.taxvalue && (
            <div style={{ color: "red", fontSize: "12px", marginTop: "5px" }}>
              {errors.taxvalue}
            </div>
          )}
        </div>

        <div className="form-group">
          <label style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <input
              type="checkbox"
              name="included"
              checked={formdata.included}
              onChange={handleInputChange}
              style={{
                transform: "scale(1.2)",
                cursor: "pointer",
              }}
            />
            Included Tax?
          </label>
        </div>

        {errors.submit && (
          <div style={{ color: "red", fontSize: "14px", marginBottom: "10px" }}>
            {errors.submit}
          </div>
        )}

        <div className="form-group" style={{ marginTop: "20px" }}>
          <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
            <button
              type="button"
              onClick={handleClose}
              className="btn btn-secondary"
              disabled={loading}
            >
              Cancel
            </button>
            <SubmitButton
              type="submit"
              name={loading ? "Updating..." : "Update Tax"}
              cls="btn btn-darkblue btn-anim"
              disabled={loading}
            />
          </div>
        </div>
      </form>
    </Modal>
  );
};

export default EditTaxModal;
