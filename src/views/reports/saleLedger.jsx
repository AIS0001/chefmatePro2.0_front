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
import { FaTimes, FaPhone, FaUser, FaEnvelope, FaSearch } from "react-icons/fa";
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
        { label: "Transaction ID", field: "transaction_id" },
        { label: "Date", field: "date" },
        { label: "A/C Type", field: "account_type" },
        { label: "A/C ID", field: "account_id" },
        { label: "Description", field: "description" },
        { label: "Debit", field: "debit_amount" },
        { label: "Credit", field: "credit_amount" },
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
                await fetchData("ledger_entries", setData, "id", {});
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
                <Header title="Sales Ledger" />
                <ToastContainer />
                <div className="row mt-4">
                    <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12">
                        <CardComponent
                            title="Search Record"
                            headerColor="warning"
                            pull="left"
                            bodyClass="panel-body"
                        >
                            <div className="panel panel-default card-view">
                                <div className="item-list-container">
                                    <div className="row">
                                        <div className="col-lg-4 col-md-3 col-sm-6 col-xs-12">
                                            <TextfieldwithLabel
                                                id="from"
                                                value={formdata.from}
                                                onChange={(e) => setFormData({ ...formdata, from: e.target.value })}
                                                required
                                                type="date"
                                                name="from"
                                                lable="From"

                                            />
                                        </div>
                                        <div className="col-lg-4 col-md-3 col-sm-6 col-xs-12">
                                            <TextfieldwithLabel
                                                id="to"
                                                value={formdata.to}
                                                onChange={(e) => setFormData({ ...formdata, to: e.target.value })}
                                                required
                                                type="date"
                                                name="to"
                                                lable="To"

                                            />
                                        </div>
                                        <div className="col-lg-4 col-md-3 col-sm-6 col-xs-12">
                                            <TextfieldwithLabel
                                                id="transactionid"
                                                value={formdata.transactionid}
                                                onChange={(e) => setFormData({ ...formdata, transctionid: e.target.value })}
                                                required
                                                type="text"
                                                name="transactionid"
                                                lable="Transction ID"

                                            />
                                        </div>
                                        <div className="col-lg-4 col-md-3 col-sm-6 col-xs-12">
                                            <div className="form-group">
                                                <label
                                                    className="control-label mb-10"
                                                    style={{ marginLeft: "15px" }}
                                                >
                                                    A/C Type
                                                </label>

                                                <select
                                                    id="accounttype"
                                                    name="accounttype"
                                                    className="form-select custom-select"
                                                    style={{
                                                        borderRadius: "4px",
                                                        border: "2px solid #17a2b8",
                                                        height: "45px", // Increased height
                                                        width: "95%", // Full width of the parent
                                                        marginLeft: "15px", // Ensure no margin that could offset alignment
                                                    }} // Stylish combo box
                                                    // onChange={handleComboChange}
                                                    value={formdata.accounttype}
                                                >
                                                    <option value="">Select A/C</option>
                                                    <option value="Sales">Sales</option>
                                                    <option value="Account Recievable">Credit</option>
                                                    <option value="Discount">Discount</option>
                                                    <option value="Rax">Tax</option>
                                                   
                                                </select>
                                            </div>
                                        </div>
                                        <div className="col-lg-4 col-md-3 col-sm-6 col-xs-12">
                                            <TextfieldwithLabel
                                                id="email"
                                                value={formdata.email}
                                                onChange={(e) => setFormData({ ...formdata, email: e.target.value })}
                                                required
                                                type="text"
                                                name="email"
                                                lable="Email"

                                            />
                                        </div>

                                    </div>
                                </div>
                            </div>
                        </CardComponent>
                    </div>
                </div>
                <div className="row">

                    {/* <ExportDataTable
                                tableId="tableid"
                                tableData={data} /> */}
                    <div class="col-lg-12 col-md-12 col-sm-12 col-xs-12" id="tableid">
                        {data.length === 0 ? (
                            <p>No data available</p>
                        ) : (
                            //  <DataTable columns={columns} data={data} onFilter={handleFilter} />
                            <DataTable columns={columns} data={data} tablename="ledger_entries" />
                        )}


                    </div>
                </div>
            </Layout>
        </>
    );
}
