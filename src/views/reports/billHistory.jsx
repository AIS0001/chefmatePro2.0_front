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

export default function BillHistory() {
  let currentDate = format(new Date(), "yyyy-MM-dd");
  //  const headers = { Authorization: authheader().access_token };
  const [data, setData] = useState([]);
  const [errors, setErrors] = useState({});
  const [formdata, setFormData] = useState({
    name: "",
   
  });
  const columns = [
    { label: "Inv. No.", field: "id" },
    { label: "Date", field: "inv_date" },
    { label: "Time", field: "inv_time" },
    { label: "Table", field: "table_number" },
    { label: "Subtotal", field: "subtotal" },
    { label: "Tax", field: "tax" },
    { label: "Grand Total", field: "grand_total" },
    { label: "Action", field: "actions" }
  ];



  //Fetch data query
  const handleFilter = (field) => {
    // Show a filter UI or perform a filtering action based on the clicked field
    console.log(`Filter clicked for: ${field}`);
  };

  useEffect(() => {
    const fetchAndSetData = async () => {
      try {
        await fetchData("final_bill", setData, "id", {});
        //console.log("Fetched data:", data); // Add this line for debugging
      } catch (error) {
        console.error("Error in useEffect:", error);
      }
    };

    fetchAndSetData();
  }, []);
  return (
    <>
      <Layout>
        <Header title="Bill History" />
        <ToastContainer />
        <div className="row">
         
          {/* <ExportDataTable
                                tableId="tableid"
                                tableData={data} /> */}
          <div class="col-lg-12 col-md-12 col-sm-12 col-xs-12" id="tableid">
            {data.length === 0 ? (
              <p>No data available</p>
            ) : (
              //  <DataTable columns={columns} data={data} onFilter={handleFilter} />
              <DataTable columns={columns} data={data} tablename="final_bill" />
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
