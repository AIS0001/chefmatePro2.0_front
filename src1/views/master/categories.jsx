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

export default function Categories() {
  let currentDate = format(new Date(), "yyyy-MM-dd");
  //  const headers = { Authorization: authheader().access_token };
  const [data, setData] = useState([]);
  const [errors, setErrors] = useState({});
  const [formdata, setFormData] = useState({
    name: "",
   
  });
  const columns = [
    { label: "ID", field: "id" },
    { label: "Category", field: "name" },
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
        "/insertdata/categories",
        {
          name: formdata.name,
        },
        getHeaders()
      );
     
      // Fetch the updated data after successful submission
      await fetchData("categories", setData, "id", {});

      toast.success("Category added successfully!");
      setFormData({name:""});
    } catch (err) {
      toast.error("Error in adding category");
      console.error(err.message);
    }

    // Clear form data and errors
    setFormData({});
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
        await fetchData("categories", setData, "id", {});
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
        <Header title="Add New Category" />
        <ToastContainer />
        <div className="row">
          <div class="col-lg-4 col-md-4 col-sm-12 col-xs-12">
            <CardComponent
              title="Add main Category for the product List"
              headerColor="darkblue"
              pull="left"
              bodyClass="panel-body"
            >
              <div class="row">
                <div class="col-md-12">
                  <form onSubmit={handleSubmit}>
                    <div class="panel panel-default card-view">
                      <TextfieldwithLabel
                        id="name"
                        onChange={(e) => handleInputChange(e)}
                        value={formdata.name}
                        type="text"
                        name="name"
                        lable="Category Name"
                      />
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
              <DataTable columns={columns} data={data} tablename="categories" />
            )}

            {/* <CardComponent 
                            title=""
                            headerContent=
                            {
                            <ExportDataTable
                                tableId="datatable1"
                                tableData={data} // Pass complete dataset to export function
                            />
                            }
                            headerColor="lightblue"
                            pull="right"
                            bodyClass="panel-body">

                            {data.length === 0 ? (
                                <p>No data available</p>
                            ) : (
                                 <DataTable columns={columns} data={data} onFilter={handleFilter} />
                                //<SimpleDataTable columns={columns} data={data}/>
                            )}

                        </CardComponent> */}
          </div>
        </div>
      </Layout>
    </>
  );
}
