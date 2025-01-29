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

export default function CompanyInfo() {

    const currentDate = format(new Date(), "yyyy-MM-dd");
    const [data, setData] = useState([]);
    const [errors, setErrors] = useState({});
    const [formdata, setFormData] = useState({
      name: "",
      taxId: "",
      phoneNumber: "",
      email: "",
    });
    
    const columns = [
      { label: "ID", field: "id" },
      { label: "Company Name", field: "name" },
      { label: "Tax ID", field: "tax_id" },
      { label: "Phone Number", field: "phone_number" },
      { label: "Email", field: "email" },
      { label: "Address", field: "address" },
      { label: "Actions", field: "actions" },
    ];
    
    const handleInputChange = (e) => {
      const { name, value } = e.target;
      setFormData((prevData) => ({
        ...prevData,
        [name]: value,
      }));
    };
    
    const validateForm = () => {
      const newErrors = {};
      if (!formdata.name) newErrors.name = "Company name is required.";
      if (!formdata.taxId) newErrors.taxId = "Tax ID is required.";
      if (!formdata.phoneNumber) newErrors.phoneNumber = "Phone number is required.";
      if (!formdata.email) newErrors.email = "Email is required.";
      if (!formdata.address) newErrors.address = "Address is required.";
      if (!/\S+@\S+\.\S+/.test(formdata.email)) newErrors.email = "Email format is invalid.";
    
      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    };
    
    const handleSubmit = async (e) => {
      e.preventDefault();
    
      if (!validateForm()) return;
    
      try {
        await axios.post(
          "/insertdata/companyinfo",
          {
            name:formdata.name,
            tax_id:formdata.taxId,
            phone_number:formdata.phoneNumber,
            email:formdata.email,
            address:formdata.address,
          },
          { headers: { Authorization: "Bearer token" } }
        );
        await fetchData("companyinfo", setData, "id", {});
        toast.success("Table added successfully!");
      } catch (err) {
        toast.error("Error in adding table");
      }
    
      setErrors({});
    };
    
    useEffect(() => {
      const fetchAndSetData = async () => {
        try {
          await fetchData("companyinfo", setData, "id", {});
        } catch (error) {
          console.error("Error in useEffect:", error);
        }
      };
      fetchAndSetData();
    }, []);
    
    
  return (
    <>
      <Layout>
        <Header title="Company Information" />
        <ToastContainer />
        <div className="row">
          <div class="col-lg-4 col-md-4 col-sm-12 col-xs-12">
            <CardComponent
              title="Add your Company Information Details"
              headerColor="darkorange"
              pull="left"
              bodyClass="panel-body"
            >
              <div class="row">
                <div class="col-lg-12 col-md-12 col-sm-12 col-xs-12">
                  <form onSubmit={handleSubmit}>
                    <div class="panel panel-default card-view">
                        
                    <TextfieldwithLabel
                id="company_name"
                lable="Company Name"
                type="text"
                name="name"
                value={formdata.name}
                onChange={handleInputChange}
                required

              />
              {errors.name && <div className="error">{errors.name}</div>}

              <TextfieldwithLabel
                id="tax_id"
                lable="Tax ID"
                type="text"
                name="taxId"
                value={formdata.taxId}
                onChange={handleInputChange}
                required
              />
              {errors.taxId && <div className="error">{errors.taxId}</div>}

              <TextfieldwithLabel
                id="phone_number"
                lable="Phone Number"
                type="text"
                name="phoneNumber"
                value={formdata.phoneNumber}
                onChange={handleInputChange}
                required
              />
              {errors.phoneNumber && <div className="error">{errors.phoneNumber}</div>}

              <TextfieldwithLabel
                id="email"
                lable="Email"
                type="email"
                name="email"
                value={formdata.email}
                onChange={handleInputChange}
                required
              />
              {errors.email && <div className="error">{errors.email}</div>}

              <TextfieldwithLabel
                id="address"
                lable="address"
                type="text"
                name="address"
                value={formdata.address}
                onChange={handleInputChange}
                required
              />
              {errors.address && <div className="error">{errors.address}</div>}
                    </div>

                    <div className="form-group">
                      <label className="control-label mb-12"></label>
                      <SubmitButton
                        type="submit"
                        name="Save"
                        cls="btn btn-darkblue btn-anim"
                      />
                    </div>
                  </form>
                </div>
              </div>
            </CardComponent>
          </div>
          {/* <ExportDataTable
                                tableId="tableid"
                                tableData={data} /> */}
          <div class="col-lg-8 col-md-8 col-sm-12 col-xs-12" id="tableid">
            {data.length === 0 ? (
              <p>No data available</p>
            ) : (
              //  <DataTable columns={columns} data={data} onFilter={handleFilter} />
              <DataTable columns={columns} data={data} tablename="companyinfo" />
            //   <SimpleDataTable columns={columns} data={data}/>
            )}

          
          </div>
        </div>
      </Layout>
    </>
  );
}
