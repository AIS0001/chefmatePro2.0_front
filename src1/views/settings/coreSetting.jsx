import React, { useEffect, useState } from "react";
import axios from "axios";
import { getHeaders } from "../../utility/getHeader";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import CardComponent from "../../components/cards/CardComponent";
import Header from "../../components/Header";
import Layout from "../../layout/Layout";
import { format } from "date-fns";

import { TextfieldwithLabel } from "../../components/Buttons/Textfield";
import { SubmitButton } from "../../components/Buttons/Textfield";
import DataTable from "../../components/data-tables/dataTable";

import fetchData from "../../functions/fetchData";

export default function CoreSettings() {
  const [data, setData] = useState([]); // for display, if needed
  const [formdata, setFormData] = useState({
    id: null, // add id to detect update vs new
    customer_name: "",
    region: "",
    currency: "",
    subscription_type: "",
    valid_till: format(
      new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
      "yyyy-MM-dd"
    ),
    status: "active", // new status field
    tax_type: "GST", // default to GST
  });

  // Fetch the single subscription on mount
  useEffect(() => {
    const fetchSubscription = async () => {
      try {
        const res = await fetchData("coresetting", setData, "id", {});
        if (res && res.length > 0) {
          const record = res[0];
          setFormData({
            id: record.id,
            customer_name: record.customer_name,
            region: record.region,
            currency: record.currency || "",
            subscription_type: record.type,
            valid_till: record.valid_till,
            status: record.status || "active",
            tax_type: record.tax_type || "GST",
          });
        } else {
          // No existing data, keep the form empty for new creation
          console.log("No existing core settings found");
        }
      } catch (error) {
        console.error("Error fetching core settings:", error);
        toast.error("Error loading core settings");
      }
    };
    fetchSubscription();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formdata) return;
    
    try {
      if (formdata.id) {
        // Update existing subscription
        await axios.put(
          `updatesubscription/coresetting/${formdata.id}`,
          {
            customer_name: formdata.customer_name,
            region: formdata.region,
            currency: formdata.currency,
            type: formdata.subscription_type,
            valid_till: formdata.valid_till,
            status: formdata.status,
            tax_type: formdata.tax_type,
          },
          getHeaders()
        );
        toast.success("Core settings updated successfully!");
      } else {
        // Check if any record already exists
        const existingData = await fetchData("coresetting", null, "id", {});
        
        if (existingData && existingData.length > 0) {
          toast.error("Core settings already exist! You can only update the existing settings.");
          return;
        }
        
        // Create new subscription only if no data exists
        const res = await axios.post(
          "/insertdata/coresetting",
          {
            customer_name: formdata.customer_name,
            region: formdata.region,
            currency: formdata.currency,
            type: formdata.subscription_type,
            valid_till: formdata.valid_till,
            status: formdata.status,
            tax_type: formdata.tax_type,
          },
          getHeaders()
        );
        // Assume the response returns the created subscription with id
        setFormData((prev) => ({
          ...prev,
          id: res.data.id,
        }));
        toast.success("Core settings created successfully!");
      }
      
      // Reload data table
      await fetchData("coresetting", setData, "id", {});
    } catch (error) {
      toast.error(
        "Error saving core settings. Please check all fields."
      );
      console.error(error);
    }
  };

  // Handler to change status (cancel or hold)
  const handleStatusChange = async (newStatus) => {
    if (!formdata.id) {
      toast.error("No settings to update status.");
      return;
    }
    try {
      await axios.put(
        `/updatesubscription/coresetting/${formdata.id}`,
        {
          ...formdata,
          status: newStatus,
        },
        getHeaders()
      );
      setFormData((prev) => ({ ...prev, status: newStatus }));
      toast.success(`Settings status updated to ${newStatus}`);
    } catch (error) {
      toast.error("Error updating status");
      console.error(error);
    }
  };

  return (
    <Layout>
      <Header title="Core Settings" />
      <ToastContainer />

      <div className="row" style={{ minHeight: '80vh', background: 'linear-gradient(135deg, #f8fafc 0%, #e0e7ef 100%)', padding: '32px 0' }}>
        {/* Left Card: Subscription Form */}
        <div className="col-lg-4 col-md-5 col-sm-12 col-xs-12">
          <CardComponent
            title={formdata.id ? "Update Core Settings" : "Create Core Settings"}
            headerColor="#2d7a46"
            pull="left"
            bodyClass="panel-body"
            style={{ borderRadius: 18, boxShadow: '0 4px 24px #0001', background: '#fff' }}
          >
            <form onSubmit={handleSubmit} style={{ padding: 8 }}>
              {/* Show info message if data already exists */}
              {formdata.id && (
                <div 
                  className="alert alert-info" 
                  style={{ 
                    borderRadius: 8, 
                    marginBottom: 18,
                    backgroundColor: '#e8f4f8',
                    borderColor: '#2d7a46',
                    color: '#2d7a46'
                  }}
                >
                  <i className="fa fa-info-circle" style={{ marginRight: 8 }}></i>
                  <strong>Update Mode:</strong> Core settings already exist. You can only update the existing configuration.
                </div>
              )}
              
              <div className="panel panel-default card-view" style={{ background: 'transparent', border: 'none' }}>
                <div className="form-group" style={{ marginBottom: 18 }}>
                  <TextfieldwithLabel
                    id="name"
                    onChange={handleInputChange}
                    value={formdata.customer_name}
                    type="text"
                    name="customer_name"
                    lable="Customer Name"
                    required
                    disabled={formdata.status === "cancelled"}
                    style={{ borderRadius: 8, border: '1.5px solid #2d7a46', background: '#f6fff7' }}
                  />
                  <label style={{ marginTop: 10, fontWeight: 500, color: '#2d7a46' }}>Tax Type</label>
                  <select
                    className="form-control mb-2"
                    name="tax_type"
                    value={formdata.tax_type}
                    onChange={handleInputChange}
                    disabled={formdata.status === "cancelled"}
                    required
                    style={{ borderRadius: 8, border: '1.5px solid #2d7a46', background: '#f6fff7' }}
                  >
                    <option value="GST">GST</option>
                    <option value="VAT">VAT</option>
                  </select>
                  <label style={{ marginTop: 10, fontWeight: 500, color: '#2d7a46' }}>Region</label>
                  <select
                    className="form-control mb-2"
                    name="region"
                    value={formdata.region || ""}
                    onChange={handleInputChange}
                    disabled={formdata.status === "cancelled"}
                    required
                    style={{ borderRadius: 8, border: '1.5px solid #2d7a46', background: '#f6fff7' }}
                  >
                    <option value="">Select Region</option>
                    <option value="TH">Thailand</option>
                    <option value="IN">India</option>
                    <option value="UK">UK</option>
                    <option value="USA">USA</option>
                  </select>
                  <label style={{ marginTop: 10, fontWeight: 500, color: '#2d7a46' }}>Currency</label>
                  <select
                    className="form-control"
                    name="currency"
                    value={formdata.currency || ""}
                    onChange={handleInputChange}
                    disabled={formdata.status === "cancelled"}
                    required
                    style={{ borderRadius: 8, border: '1.5px solid #2d7a46', background: '#f6fff7' }}
                  >
                    <option value="">Select Currency</option>
                    <option value="THB">THB (Thai Baht)</option>
                    <option value="INR">INR (Indian Rupee)</option>
                    <option value="GBP">GBP (British Pound)</option>
                    <option value="USD">USD (US Dollar)</option>
                  </select>
                </div>

                <div className="form-group" style={{ marginBottom: 18 }}>
                  <label style={{ fontWeight: 500, color: '#2d7a46' }}>Subscription Type</label>
                  <select
                    className="form-control"
                    name="subscription_type"
                    value={formdata.subscription_type || ""}
                    onChange={handleInputChange}
                    disabled={formdata.status === "cancelled"}
                    required
                    style={{ borderRadius: 8, border: '1.5px solid #2d7a46', background: '#f6fff7' }}
                  >
                    <option value="">Select Type</option>
                    <option value="Basic">Basic</option>
                    <option value="Premium">Premium</option>
                    <option value="Enterprise">Enterprise</option>
                  </select>
                </div>

                <TextfieldwithLabel
                  id="valid_till"
                  onChange={handleInputChange}
                  value={formdata.valid_till}
                  type="date"
                  name="valid_till"
                  lable="Valid Till"
                  disabled={formdata.status === "cancelled"}
                  required
                  style={{ borderRadius: 8, border: '1.5px solid #2d7a46', background: '#f6fff7' }}
                />
              </div>

              <div className="form-group" style={{ marginTop: 18 }}>
                {formdata.id ? (
                  <SubmitButton
                    type="submit"
                    name="Update Settings"
                    cls="btn btn-success btn-anim"
                    disabled={formdata.status === "cancelled"}
                  />
                ) : (
                  <SubmitButton
                    type="submit"
                    name="Create Settings"
                    cls="btn btn-success btn-anim"
                    disabled={formdata.status === "cancelled"}
                  />
                )}
              </div>
            </form>

            {/* Cancel or Hold Buttons */}
            {formdata.id && formdata.status !== "cancelled" && (
              <div className="form-group mt-3" style={{ display: 'flex', gap: 12 }}>
                <button
                  className="btn btn-warning mr-2"
                  style={{ borderRadius: 8, fontWeight: 500, letterSpacing: 1 }}
                  onClick={() => handleStatusChange("hold")}
                >
                  Hold Settings
                </button>
                <button
                  className="btn btn-danger"
                  style={{ borderRadius: 8, fontWeight: 500, letterSpacing: 1 }}
                  onClick={() => handleStatusChange("cancelled")}
                >
                  Disable Settings
                </button>
              </div>
            )}

            {/* Show current status */}
            {formdata.status && (
              <p style={{ marginTop: 18, color: '#2d7a46', fontWeight: 600, fontSize: 16 }}>
                <strong>Status:</strong> {formdata.status.toUpperCase()}
              </p>
            )}
          </CardComponent>
        </div>

        {/* Right Card: Data Table */}
        <div className="col-lg-8 col-md-7 col-sm-12 col-xs-12" id="tableid">
          <div style={{ borderRadius: 18, boxShadow: '0 4px 24px #0001', background: '#fff', padding: 24 }}>
            <h5 style={{ marginBottom: 20, color: '#2d7a46', fontWeight: 600 }}>Core Settings Overview</h5>
            {data.length === 0 ? (
              <div style={{ 
                textAlign: 'center', 
                padding: '40px 20px',
                color: '#666',
                backgroundColor: '#f8f9fa',
                borderRadius: 12,
                border: '2px dashed #ddd'
              }}>
                <i className="fa fa-cog fa-3x" style={{ marginBottom: 15, color: '#ccc' }}></i>
                <p style={{ fontSize: 18, fontWeight: 500, marginBottom: 10 }}>No Core Settings Found</p>
                <p style={{ fontSize: 14, color: '#888' }}>Please create your application's core settings using the form on the left.</p>
              </div>
            ) : (
              <DataTable
                columns={[
                  { label: "ID", field: "id" },
                  { label: "Name", field: "customer_name" },
                  { label: "Tax Type", field: "tax_type" },
                  { label: "Region", field: "region" },
                  { label: "Currency", field: "currency" },
                  { label: "Type", field: "type" },
                  { label: "Valid Till", field: "valid_till" },
                  { label: "Status", field: "status" },
                ]}
                data={data}
                tablename="coresetting"
                style={{ borderRadius: 12, overflow: 'hidden', fontSize: 15 }}
              />
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
