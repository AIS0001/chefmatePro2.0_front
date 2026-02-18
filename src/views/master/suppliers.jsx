/* eslint-disable no-undef */

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

export default function Suppliers() {
  let currentDate = format(new Date(), "yyyy-MM-dd");
  //  const headers = { Authorization: authheader().access_token };
  const [data, setData] = useState([]);
  const [errors, setErrors] = useState({});
  const [formdata, setFormData] = useState({
    name: "",
    company_name: "",
    contact: "",
    email: "",
    taxid: "",
    address: "",
  });

  const columns = [
    { label: "ID", field: "id" },
    { label: "Name", field: "name" },
    { label: "Company Name", field: "company_name" },
    { label: "Contact", field: "contact" },
    { label: "Email", field: "email" },
    { label: "Tax ID", field: "taxid" },
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

      await fetchData("suppliers", setData, "id", {});

      toast.success("Supplier added successfully!");
      setFormData({
        name: "",
        company_name: "",
        contact: "",
        email: "",
        taxid: "",
        address: "",
      });
    } catch (err) {
      toast.error("Error in adding supplier");
      console.error(err.message);
    }

    setErrors({});
  };

  useEffect(() => {
    const fetchAndSetData = async () => {
      try {
        await fetchData("suppliers", setData, "id", {});
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
        <div className="row">
          <div className="col-lg-4 col-md-4 col-sm-12 col-xs-12">
            <CardComponent
              title="Add New Supplier"
              headerColor="darkblue"
              pull="left"
              bodyClass="panel-body"
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
                      <SubmitButton
                        type="submit"
                        name="Save Supplier"
                        cls="btn btn-darkblue btn-anim"
                      />
                    </div>
                  </form>
                </div>
              </div>
            </CardComponent>
          </div>

          <div className="col-lg-8 col-md-8 col-sm-12 col-xs-12" id="tableid">
            {data.length === 0 ? (
              <p>No data available</p>
            ) : (
              <DataTable columns={columns} data={data} tablename="suppliers" />
            )}
          </div>
        </div>
      </Layout>
    </>
  );
}
