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

export default function Taxes() {
  let currentDate = format(new Date(), "yyyy-MM-dd");
  //  const headers = { Authorization: authheader().access_token };
  const [data, setData] = useState([]);
  const [errors, setErrors] = useState({});
  const [editId, setEditId] = useState(null);

  const [formdata, setFormData] = useState({
    taxname: "",
    taxvalue: "",
    included: false,
  });

  const columns = [
    { label: "ID", field: "id" },
    { label: "Tax Name", field: "taxname" },
    { label: "Tax Value", field: "taxvalue" },
    { label: "Tax Included", field: "included" },
    { label: "Status", field: "status" },
    { label: "Actions", field: "actions" },
  ];
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: type === "checkbox" ? checked : value,
    }));
  };
const handleEditClick = (item) => {
  alert(item);
  const newForm = {
    taxname: item.taxname,
    taxvalue: item.taxvalue,
    included: item.included,
  };
  setFormData(newForm);
  setEditId(item.id);
  console.log("Form data updated:", newForm);
};
useEffect(() => {
  console.log("Formdata changed:", formdata);
}, [formdata]);



  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (editId) {
        // Update logic
        await axios.put(
          `/updatedata/taxes/${editId}`,
          {
            taxname: formdata.taxname,
            taxvalue: formdata.taxvalue,
            included: formdata.included,
          },
          getHeaders()
        );
        toast.success("Tax updated successfully!");
      } else {
        // Add logic
        await axios.post(
          "/insertdata/taxes",
          {
            taxname: formdata.taxname,
            taxvalue: formdata.taxvalue,
            included: formdata.included,
          },
          getHeaders()
        );
        toast.success("Tax added successfully!");
      }

      await fetchData("taxes", setData, "id", {});
      setFormData({ taxname: "", taxvalue: "", included: false });
      setEditId(null); // reset to add mode
      setErrors({});
    } catch (err) {
      toast.error("Error submitting form");
      console.error(err.message);
    }
  };



  useEffect(() => {
    const fetchAndSetData = async () => {
      try {
        await fetchData("taxes", setData, "id", {});
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
        <Header title="Add New Tax" />
        <ToastContainer />
        <div className="row">
          <div class="col-lg-4 col-md-4 col-sm-12 col-xs-12">
            <CardComponent
              title="Add Table Name"
              headerColor="darkorange"
              pull="left"
              bodyClass="panel-body"
            >
              <div class="row">
                <div class="col-md-12">
                  <form onSubmit={handleSubmit}>
                    <div class="panel panel-default card-view">

                      <TextfieldwithLabel
                        id="taxname"
                        onChange={(e) => handleInputChange(e)}
                        value={formdata.taxname || ""}
                        type="text"
                        name="taxname"
                        lable="Tax Name"
                      />
                      <TextfieldwithLabel
                        id="taxvalue"
                        onChange={(e) => handleInputChange(e)}
                        value={formdata.taxvalue || ""}
                        type="number"
                        name="taxvalue"
                        lable="Tax Value"
                      />
                    </div>
                    <div className="form-group">
                      <label>
                        <input
                          type="checkbox"
                          name="included"
                          checked={formdata.included}
                          onChange={handleInputChange}
                        />{" "}
                        Included Tax?
                      </label>
                    </div>

                    <div className="form-group">
                      <label className="control-label mb-12"></label>
                      <SubmitButton
                        type="submit"
                        name={editId ? "Update" : "Save"}
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
              <DataTable
                columns={columns}
                data={data}
                tablename="taxes"
                onEditClick={handleEditClick}
              />
            )}


          </div>
        </div>
      </Layout>
    </>
  );
}
