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

export default function TableList() {
  let currentDate = format(new Date(), "yyyy-MM-dd");
  //  const headers = { Authorization: authheader().access_token };
  const [data, setData] = useState([]);
  const [categories, setCategories] = useState([]);
  const [errors, setErrors] = useState({});
  const [formdata, setFormData] = useState({
    name: "",
  });
  const categoryMap = categories.reduce((acc, cat) => {
    acc[cat.id] = cat.cat_name || "";
    return acc;
  }, {});

  const columns = [
    { label: "ID", field: "id" },
    { label: "Table name", field: "name" },
    { label: "Category", field: "category_display" },
    { label: "Actions", field: "actions" },
  ];

  const dataWithCategory = data.map((row) => ({
    ...row,
    category_display: categoryMap[row.category] || row.category || "",
  }));

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
        "/insertdata/tablelist",
        {
          name: formdata.name,
          category: formdata.category,
        },
        getHeaders()
      );

      // Fetch the updated data after successful submission
      await fetchData("tablelist", setData, "id", {});
      console.log("Fetched data after add:", data);
      toast.success("Table added successfully!");
    } catch (err) {
      toast.error("Error in adding table");
      console.error(err.message);
    }

    // Clear form data and errors
    // setFormData({});
    setErrors({});
  };

  useEffect(() => {
    const fetchAndSetData = async () => {
      try {
        await fetchData("tablelist", setData, "id", {});
        console.log("Fetched data:", data); // Add this line for debugging
      } catch (error) {
        console.error("Error in useEffect:", error);
      }
    };

    fetchAndSetData();
  }, []);

  useEffect(() => {
    // Fetch table categories for combo box
    fetchData(
      "table_category",
      (result) => {
        console.log("Fetched categories:", result);
        setCategories(result);
      },
      "id",
      {}
    );
  }, []);

  return (
    <>
      <Layout>
        <Header title="Add New Table" />
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
                        id="name"
                        onChange={(e) => handleInputChange(e)}
                        value={formdata.name}
                        type="text"
                        name="name"
                        lable="Table Name"
                      />
                      {/* Combo box for table category */}
                      <div className="form-group">
                        <label htmlFor="category">Table Category</label>
                        <select
                          id="category"
                          name="category"
                          className="form-control"
                          value={formdata.category || ""}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              category: e.target.value,
                            }))
                          }
                        >
                          <option value="">Select Category</option>
                          {categories.map((cat) => (
                            <option
                              key={cat.id}
                              value={cat.id}
                            >{cat.cat_name}</option>
                          ))}
                        </select>
                      </div>
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
              <DataTable columns={columns} data={dataWithCategory} tablename="tablelist" />
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
