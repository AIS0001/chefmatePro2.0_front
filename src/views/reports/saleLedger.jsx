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
    const [Alldata, setAllData] = useState([]);
    const [Totals, setTotals] = useState([]);
    const [errors, setErrors] = useState({});
    const [formdata, setFormData] = useState({
        transactionid: "",

    });
    const columns = [
        { label: "Txn ID", field: "transaction_id" },
        { label: "Date", field: "date" },
        { label: "A/C Type", field: "account_type" },
        { label: "A/C ID", field: "account_id" },
        { label: "Description", field: "description" },
        { label: "Debit", field: "debit_amount" },
        { label: "Credit", field: "credit_amount" },
        // { label: "Action", field: "actions" }
    ];
    const formatDate = (dateStr) => new Date(dateStr).toISOString().split("T")[0];


    const filterrecordbyDate = async (fromDate, toDate) => {
        const formattedFrom = formatDate(fromDate);
        const formattedTo = formatDate(toDate);

        const filteredData = Alldata.filter(record => {
            return formatDate(record.date) >= formattedFrom && formatDate(record.date) <= formattedTo;
        });

        // Calculate sum of debit_amount and credit_amount
        const totalCredit = filteredData.reduce((sum, record) => sum + (record.credit_amount || 0), 0);
        const totalDebit = filteredData.reduce((sum, record) => sum + (record.debit_amount || 0), 0);

        console.log("Total Credit:", totalCredit);
        console.log("Total Debit:", totalDebit);

        // Set filtered data and totals
        setData(filteredData);
        setTotals({ credit: totalCredit, debit: totalDebit }); // Assuming you have a state to store totals
    };


    const filterrecordbyAccountType = (accountType) => {


        if (Alldata.length === 0) {
            console.warn("No data available for filtering.");
            return;
        }

        const filteredData = Alldata.filter(record => record.account_type === accountType);
        //   console.log("Filtered Data:", filteredData);

        // Calculate sum of debit_amount and credit_amount
        const totalCredit = filteredData.reduce((sum, record) => sum + (record.credit_amount || 0), 0);
        const totalDebit = filteredData.reduce((sum, record) => sum + (record.debit_amount || 0), 0);

        console.log("Total Credit:", totalCredit);
        console.log("Total Debit:", totalDebit);

        // Set filtered data and totals
        setData(filteredData);
        setTotals({ credit: totalCredit, debit: totalDebit });
    };

    // const filterrecordbyAccountType = async (accountType) => {
    //     const filteredData = Alldata.filter(record => record.account_type === accountType);
    //    // console.log(data);
    //     setData(filteredData);
    // };

    const filterrecordbyDateAccountType = async (fromDate, toDate, accountType) => {
        const formattedFrom = formatDate(fromDate);
        const formattedTo = formatDate(toDate);

        // console.log("Filtering by Date & A/C Type:");
        // console.log("From Date:", formattedFrom);
        // console.log("To Date:", formattedTo);
        // console.log("Account Type:", accountType);
        console.log("All Data Before Filtering:", Alldata);

        if (!formattedFrom || !formattedTo) {
            alert("Please select both From and To dates!");
            return;
        }

        if (!accountType) {
            alert("Please select an Account Type!");
            return;
        }

        const filteredData = Alldata.filter(record => {
            const recordDate = formatDate(record.date); // Ensure record.date is in same format
            return (
                recordDate >= formattedFrom &&
                recordDate <= formattedTo &&
                record.account_type === accountType
            );
        });

        console.log("Filtered Data:", filteredData);
        // Calculate sum of debit_amount and credit_amount
        const totalCredit = filteredData.reduce((sum, record) => sum + (record.credit_amount || 0), 0);
        const totalDebit = filteredData.reduce((sum, record) => sum + (record.debit_amount || 0), 0);

        
        const balanceAmount = totalCredit-totalDebit;
        // Set filtered data and totals
        setData(filteredData);
        setTotals({ credit: totalCredit, debit: totalDebit,balance:balanceAmount });
    };


    const filterrecordbyTransactionId = async (transactionId) => {
        console.log("Received Transaction ID:", transactionId);
        console.log("All Data Before Filtering:", Alldata);

        if (!transactionId) {
            alert("Please enter a Transaction ID!");
            return;
        }

        const filteredData = Alldata.filter(record => {
            console.log("Checking Record ID:", record.transaction_id); // Debug each record
            return String(record.transaction_id) === String(transactionId); // Ensure comparison works
        });

        console.log("Filtered Data:", filteredData);
        // Calculate sum of debit_amount and credit_amount
        const totalCredit = filteredData.reduce((sum, record) => sum + (record.credit_amount || 0), 0);
        const totalDebit = filteredData.reduce((sum, record) => sum + (record.debit_amount || 0), 0);


        const balanceAmount = totalCredit-totalDebit;
        // Set filtered data and totals
        setData(filteredData);
        setTotals({ credit: totalCredit, debit: totalDebit,balance:balanceAmount });
    };

    const filterrecordbyAccountId = async (accountId) => {

        if (!accountId) {
            alert("Please enter a Account ID!");
            return;
        }

        const filteredData = Alldata.filter(record => {
            console.log("Checking Record ID:", record.account_id); // Debug each record
            return String(record.account_id) === String(accountId); // Ensure comparison works
        });

        console.log("Filtered Data:", filteredData);
        // Calculate sum of debit_amount and credit_amount
        const totalCredit = filteredData.reduce((sum, record) => sum + (record.credit_amount || 0), 0);
        const totalDebit = filteredData.reduce((sum, record) => sum + (record.debit_amount || 0), 0);

        const balanceAmount = totalCredit-totalDebit;
        // Set filtered data and totals
        setData(filteredData);
        setTotals({ credit: totalCredit, debit: totalDebit,balance:balanceAmount });
    };
    //Fetch data query
    const handleFilter = (field) => {
        // Show a filter UI or perform a filtering action based on the clicked field
        console.log(`Filter clicked for: ${field}`);
    };

    useEffect(() => {
        const fetchAndSetData = async () => {
            try {
                const fetchedData = await fetchData("ledger_entries", setData, "id", {});
                await fetchData("ledger_entries", setAllData, "id", {});
                //setAllData(fetchedData); // Ensure Alldata gets a proper value

                console.log("Fetched Data:", fetchedData); // Debugging
            } catch (error) {
                console.error("Error in useEffect:", error);
            }
        };

        fetchAndSetData();
    }, []);
    useEffect(() => {
        console.log("Updated Data in State:", data);
    }, [data]);  // This runs whenever `data` changes

    return (
        <>
            <Layout>
                <Header title="Sales Ledger" />
                <ToastContainer />
                <div className="row mt-4">
                    <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12">
                        <CardComponent
                            title="Search Record by Different Parameter"
                            headerColor="primary"
                            pull="left"
                            bodyClass="panel-body"
                        >
                            <div className="panel panel-default card-view">
                                <div className="item-list-container">
                                    <div className="row">
                                        <div className="col-lg-3 col-md-4 col-sm-6 col-xs-12">
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
                                        <div className="col-lg-3 col-md-4 col-sm-6 col-xs-12">
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
                                        <div className="col-lg-3 col-md-4 col-sm-6 col-xs-12">
                                            <TextfieldwithLabel
                                                id="transactionid"
                                                value={formdata.transactionid}
                                                onChange={(e) => setFormData({ ...formdata, transactionid: e.target.value })}
                                                required
                                                type="text"
                                                name="transactionid"
                                                lable="Txn ID"
                                            />

                                        </div>
                                        <div className="col-lg-3 col-md-4 col-sm-6 col-xs-12">
                                            <TextfieldwithLabel
                                                id="accountid"
                                                value={formdata.accountid}
                                                onChange={(e) => setFormData({ ...formdata, accountid: e.target.value })}
                                                required
                                                type="text"
                                                name="accountid"
                                                lable="A/C ID"
                                            />

                                        </div>
                                        <div className="col-lg-3 col-md-4 col-sm-6 col-xs-12">
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
                                                    onChange={(e) => setFormData({ ...formdata, accounttype: e.target.value })}
                                                >
                                                    <option value="">Select A/C</option>
                                                    <option value="Sales">Sales</option>
                                                    <option value="Cash">Cash</option>
                                                    <option value="Discount">Discount</option>
                                                    <option value="Account Recievable">Account Recievable</option>

                                                </select>
                                            </div>
                                        </div>
                                        </div>
                                        <div className="row">
                                        <div className="col-12">
   {/* Buttons Row */}
   <div className="button-group">
                            <button onClick={() => filterrecordbyDate(formdata.from, formdata.to, formdata.accounttype)} className="btn btn-success">
                            <FaSearch></FaSearch>  Filter by Date
                            </button>
                            <button onClick={() => filterrecordbyDateAccountType(formdata.from, formdata.to, formdata.accounttype)} className="btn btn-primary">
                            <FaSearch></FaSearch>  Filter by Date & A/C Type
                            </button>
                            <button onClick={() => filterrecordbyDateAccountType(formdata.from, formdata.to, formdata.accounttype)} className="btn btn-info">
                            <FaSearch></FaSearch>   Filter by A/C Type
                            </button>
                            <button onClick={() => filterrecordbyDateAccountType(formdata.from, formdata.to, formdata.accounttype)} className="btn btn-success">
                            <FaSearch></FaSearch>   Filter by Txn ID
                            </button>
                            <button onClick={() => filterrecordbyDateAccountType(formdata.from, formdata.to, formdata.accounttype)} className="btn btn-warning">
                               <FaSearch></FaSearch> Filter by A/C ID
                            </button>
                        </div>
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


                        Total Credit :  {Totals.credit} |
                        Total Debit :  {Totals.debit} | 
                        Balance : {Totals.balance}




                    </div>
                </div>
            </Layout>
        </>
    );
}
