/* eslint-disable no-undef */

import React, { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { getHeaders } from "../../utility/getHeader";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { CSVLink } from "react-csv";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { parseISO, format } from "date-fns";
import jsPDF from "jspdf";
import "jspdf-autotable";
import logo from "../../assets/logo.png"

import CardComponent from "../../components/cards/CardComponent";

import Header from "../../components/Header";
import Layout from "../../layout/Layout";


import { TextfieldwithLabel } from "../../components/Buttons/Textfield";
import { SubmitButton } from "../../components/Buttons/Textfield";
import DataTable from "../../components/data-tables/dataTableGst";
import SimpleDataTable from "../../components/data-tables/SimpledataTable";
import  fetchData from '../../functions/fetchData';
import  fetchdatanotequal from '../../functions/viewAllData';



export default function BillHistoryGst() {
    let currentDate = format(new Date(), "yyyy-MM-dd");
    //  const headers = { Authorization: authheader().access_token };
    const [data, setData] = useState([]);
    const [errors, setErrors] = useState({});
    const [formdata, setFormData] = useState({
        name: "",

    });
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [paymentMode, setPaymentMode] = useState("");
    const [filteredData, setFilteredData] = useState([]);
    const [paymentOptions, setpaymentOptions] = useState([]);
    const columns = [
        { label: "Inv. No.", field: "id" },
        { label: "Date", field: "inv_date" },
        { label: "Time", field: "inv_time" },
        { label: "Table", field: "table_number" },
        { label: "Subtotal", field: "subtotal" },
        { label: "Grand Total", field: "grand_total" },
        { label: "Action", field: "actions" }
    ];
    const exportPDF = () => {
        const doc = new jsPDF();

        doc.addImage(logo, "PNG", 150, 10, 40, 15);
        doc.setFontSize(16);
        doc.text("Bill History", 14, 20);

        const tableColumn = ["Invoice No", "Date", "Time", "Table", "Subtotal",  "Grand Total", "Payment Mode"];
        const tableRows = [];

        const exportData = filteredData.length > 0 ? filteredData : data;

        exportData.forEach((item) => {
            const rowData = [
                item.id,
                item.inv_date,
                item.inv_time,
                item.table_number,
                item.subtotal,
                item.grand_total,
                item.payment_mode,
            ];
            tableRows.push(rowData);
        });

        // Calculate total
        const totalAmount = exportData.reduce(
            (acc, item) => acc + parseFloat(item.grand_total || 0),
            0
        ).toFixed(2);

        // Add total row (empty cells except last column)
        const totalRow = ["", "",  "", "", "Total:", `INR ${totalAmount}`,""];
        tableRows.push(totalRow);

        doc.autoTable({
            startY: 30,
            head: [tableColumn],
            body: tableRows,
        });

        doc.save("salereport.pdf");
    };


    const generateMonthlySummary = (dataArray) => {
        const summary = {};

        (dataArray.length > 0 ? dataArray : data).forEach((item) => {
            const date = parseISO(item.inv_date);
            const month = format(date, "MMM yyyy");
            const total = parseFloat(item.grand_total || 0);

            summary[month] = (summary[month] || 0) + total;
        });

        return Object.entries(summary).map(([month, total]) => ({ month, total }));
    };

    const monthlyData = generateMonthlySummary(filteredData);


    //Fetch data query
    const handleFilter = (field) => {
        // Show a filter UI or perform a filtering action based on the clicked field
        console.log(`Filter clicked for: ${field}`);
    };

    useEffect(() => {
        const fetchAndSetData = async () => {
            try {
                await fetchdatanotequal("final_bill", setData, "id", {"status":2});
                setpaymentOptions(await fetchComboData("paymentoptions", "name"));
                //console.log("Fetched data:", data); // Add this line for debugging
            } catch (error) {
                console.error("Error in useEffect:", error);
            }
        };

        fetchAndSetData();
    }, []);
    const applyFilter = () => {
        const filtered = data.filter((item) => {
            const itemDate = new Date(item.inv_date);
            const isWithinDateRange =
                (!startDate || new Date(startDate) <= itemDate) &&
                (!endDate || itemDate <= new Date(endDate));
            const matchesPaymentMode = !paymentMode || item.payment_mode === paymentMode;

            return isWithinDateRange && matchesPaymentMode;
        });

        setFilteredData(filtered);
    };
    const totalAmount = () =>
        (filteredData.length > 0 ? filteredData : data)
            .reduce((acc, item) => acc + parseFloat(item.grand_total || 0), 0)
            .toFixed(2);

    useEffect(() => {
        applyFilter();
    }, [data, startDate, endDate, formdata.name, paymentMode]);
    const clearFilters = () => {
        setStartDate("");
        setEndDate("");
        setPaymentMode("");
        localStorage.removeItem("billFilters");
        setFilteredData(data); // Show all data again
    };

    return (
        <>
            <Layout>
                <Header title="Sale Report-GST Version" />
                <ToastContainer />
                <CardComponent>
                    <div className="row mb-3">
                        <div className="col-md-3">
                            <label>Start Date</label>
                            <input type="date" className="form-control" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                        </div>
                        <div className="col-md-3">
                            <label>End Date</label>
                            <input type="date" className="form-control" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                        </div>
                        <div className="col-md-3">
                            <label>Payment Mode</label>
                            <select className="form-control" value={paymentMode} onChange={(e) => setPaymentMode(e.target.value)}>
                                <option value="">All</option>
                                <option value="Cash">Cash</option>
                                <option value="Credit">Credit</option>
                                <option value="Entertainment">Entertainment</option>
                            </select>
                        </div>
                    </div>
                    <div className="row mb-3">
                        <div className="col-md-3 d-flex align-items-end">
                            <button className="btn btn-primary w-100" onClick={applyFilter}>Apply Filter</button>
                        </div>
                        {(filteredData.length > 0 || data.length > 0) && (
                            <div className="col-md-3 d-flex align-items-end">
                                <CSVLink
  data={[
    ...(filteredData.length > 0 ? filteredData : data).map((item) => ({
      id: item.id,
      inv_date: item.inv_date,
      inv_time: item.inv_time,
      subtotal: item.subtotal,
      discount_value: item.discount_value,
      discount_amount: item.discount_amount,
      subtotal_afterdiscount: item.subtotal_afterdiscount,
      roundoff: item.roundoff,
      grand_total: item.grand_total,
    })),
    {
      id: "",
      inv_date: "",
      inv_time: "",
      subtotal: "",
      discount_value: "",
      discount_amount: "",
      subtotal_afterdiscount: "",
      roundoff: "Total",
      grand_total: totalAmount(), // helper function below
    },
  ]}
  filename="salereport.csv"
  className="btn btn-success w-100"
>
  Export CSV
</CSVLink>

                               

                            </div>




                        )}
                        <div className="col-md-3 d-flex align-items-end">
                            <button className="btn btn-danger w-100" onClick={exportPDF}>
                                Export PDF
                            </button>
                        </div>

                        <div className="col-md-3 d-flex align-items-end">
                            <button className="btn btn-info w-100" onClick={() => clearFilters()}>
                                Clear Filters
                            </button>
                        </div>
                    </div>

                </CardComponent>




                <div className="row">

                    {/* <ExportDataTable
                                tableId="tableid"
                                tableData={data} /> */}
                    <div class="col-lg-12 col-md-12 col-sm-12 col-xs-12" id="tableid">
                        {data.length === 0 ? (
                            <p>No data available</p>
                        ) : (
                            //  <DataTable columns={columns} data={data} onFilter={handleFilter} />
                            // <DataTable columns={columns} data={data} tablename="final_bill" />
                            <DataTable columns={columns} data={filteredData.length > 0 ? filteredData : data} tablename="final_bill" />

                        )}
                        <div className="mt-3">
                            <h5>
                                Total Sale: ฿{(filteredData.length > 0 ? filteredData : data)
                                    .reduce((acc, item) => acc + parseFloat(item.grand_total || 0), 0)
                                    .toFixed(2)}
                            </h5>
                        </div>


                    </div>
                </div>




                <div className="row">
                    <CardComponent>

                        <div className="mt-4">
                            <h5>Monthly Sales Summary</h5>
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={monthlyData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="month" />
                                    <YAxis />
                                    <Tooltip />
                                    <Bar dataKey="total" fill="#8884d8" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>

                    </CardComponent>
                </div>
            </Layout>
        </>
    );
}
