/* eslint-disable no-undef */

import React, { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
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
import SimpleDataTable from "../../components/data-tables/SimpledataTable";
import fetchData from "../../functions/fetchData";

// Feature Control imports
import { useSubscription } from "../../Context/SubscriptionContext";
import { FeatureButton, FeatureCard, LimitDisplay, FeatureProgressBar } from "../../components/FeatureControls";
import { RouteGuard, LimitGuard } from "../../utils/featureControl";

export default function Suppliers() {
  let currentDate = format(new Date(), "yyyy-MM-dd");
  //  const headers = { Authorization: authheader().access_token };
  const [data, setData] = useState([]);
  const [errors, setErrors] = useState({});
  const [formdata, setFormData] = useState({
    name: "",
    contact: "",
    email: "",
    nametaxid: "",
    address: "",

  });
  
  // Feature Control
  const { hasFeature, getFeatureValue, checkLimit } = useSubscription();
  const supplierLimit = getFeatureValue('suppliers.limit');
  const supplierCount = data.length;
  const columns = [
    { label: "ID", field: "id" },
    { label: "Name", field: "name" },
    { label: "Company Name", field: "company_name" },
    { label: "Contact", field: "contact" },
    { label: "Email", field: "email" },
    { label: "Tax ID", field: "taxid" },
    { label: "Address", field: "address" },
    { label: "Actions", field: "actions" }
  ];
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    // alert(e.target);
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await axios.post(
        "/insertdata/suppliers",
        {
          name: formdata.name,
          company_name: formdata.company_name,
          contact: formdata.contact,
          email: formdata.email,
          taxid: formdata.taxid,
          address: formdata.address,
        },
        getHeaders()
      );

      // Fetch the updated data after successful submission
      await fetchData("suppliers", setData, "id", {});

      toast.success("Supplier added successfully!");
      setFormData([]);
    } catch (err) {
      toast.error("Error in adding category");
      console.error(err.message);
    }

    // Clear form data and errors
    setFormData({
      name: "",
      company_name: "",
      contact: "",
      email: "",
      taxid: "",
      address: "",
    });

    setErrors({});
  };

  //Fetch data query
  const handleFilter = (field) => {
    // Show a filter UI or perform a filtering action based on the clicked field
    console.log(`Filter clicked for: ${field}`);
  };

  useEffect(() => {
    const fetchAndSetData = async () => {
      try {
        await fetchData("suppliers", setData, "id", {});
        console.log("Fetched data:", data); // Add this line for debugging
      } catch (error) {
        console.error("Error in useEffect:", error);
      }
    };

    fetchAndSetData();
  }, []);
  return (
    <>
      <Layout>
        <Header title="Supplier Management" />
        <ToastContainer />
        
        {/* Feature Control Check */}
        <RouteGuard route="/master/suppliers">
          
          {/* Supplier Limit Information */}
          <div className="row mb-3">
            <div className="col-12">
              <div className="alert alert-info">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <strong>Supplier Limit:</strong>
                    <LimitDisplay feature="suppliers.limit" currentCount={supplierCount} className="ml-2" />
                  </div>
                  <div>
                    <FeatureProgressBar 
                      feature="suppliers.limit" 
                      currentCount={supplierCount} 
                      className="progress" 
                      style={{ width: '200px', height: '20px' }} 
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="row">
            <div className="col-lg-4 col-md-4 col-sm-12 col-xs-12">
              <FeatureCard
                feature="suppliers"
                title="Add New Supplier"
                description="Create a new supplier for your business"
                className="card-view"
              >
                <LimitGuard
                  feature="suppliers.limit"
                  currentCount={supplierCount}
                  fallback={
                    <div className="alert alert-warning">
                      <h6>Supplier Limit Reached</h6>
                      <p>You have reached the maximum number of suppliers ({supplierLimit}) for your current plan.</p>
                      <Link to="/subscription" className="btn btn-primary btn-sm">
                        Upgrade Plan
                      </Link>
                    </div>
                  }
                >
                  <div className="row">
                    <div className="col-md-12">
                      <form onSubmit={handleSubmit}>
                        <div className="panel panel-default card-view">
                          <TextfieldwithLabel
                            id="name"
                            onChange={(e) => handleInputChange(e)}
                            value={formdata.name}
                            type="text"
                            name="name"
                            lable="Supplier Name"
                          />
                          <TextfieldwithLabel
                            id="company_name"
                            onChange={(e) => handleInputChange(e)}
                            value={formdata.company_name}
                            type="text"
                            name="company_name"
                            lable="Company Name"
                          />
                          <TextfieldwithLabel
                            id="contact"
                            onChange={(e) => handleInputChange(e)}
                            value={formdata.contact}
                            type="number"
                            name="contact"
                            lable="Contact"
                          />
                          <TextfieldwithLabel
                            id="email"
                            onChange={(e) => handleInputChange(e)}
                            value={formdata.email}
                            type="text"
                            name="email"
                            lable="Email ID"
                          />
                          <TextfieldwithLabel
                            id="taxid"
                            onChange={(e) => handleInputChange(e)}
                            value={formdata.taxid}
                            type="text"
                            name="taxid"
                            lable="Tax ID (if Any)"
                          />
                          <TextfieldwithLabel
                            id="address"
                            onChange={(e) => handleInputChange(e)}
                            value={formdata.address}
                            type="text"
                            name="address"
                            lable="Address"
                          />
                        </div>

                        <div className="form-group">
                          <label className="control-label mb-12"></label>
                          <FeatureButton
                            feature="suppliers"
                            type="submit"
                            className="btn btn-darkblue btn-anim"
                            disabled={!checkLimit('suppliers.limit', supplierCount)}
                          >
                            Save Supplier
                          </FeatureButton>
                        </div>
                      </form>
                    </div>
                  </div>
                </LimitGuard>
              </FeatureCard>
            </div>
            
            <div className="col-lg-8 col-md-8 col-sm-12 col-xs-12" id="tableid">
              <FeatureCard
                feature="suppliers"
                title="Supplier List"
                description="Manage your existing suppliers"
                className="card-view"
              >
                {data.length === 0 ? (
                  <div className="alert alert-info">
                    <p>No suppliers found. Add your first supplier to get started.</p>
                  </div>
                ) : (
                  <DataTable columns={columns} data={data} tablename="suppliers" />
                )}
              </FeatureCard>
            </div>
          </div>
        </RouteGuard>
      </Layout>
    </>
  );
}
