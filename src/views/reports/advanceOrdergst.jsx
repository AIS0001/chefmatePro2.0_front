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
import { fetchComboData } from "../../services/api";
import CardComponent from "../../components/cards/CardComponent";

import Header from "../../components/Header";
import Layout from "../../layout/Layout";


import { TextfieldwithLabel } from "../../components/Buttons/Textfield";
import { SubmitButton } from "../../components/Buttons/Textfield";
import DataTable from "../../components/data-tables/dataTableGst";
import SimpleDataTable from "../../components/data-tables/SimpledataTable";
import fetchData from "../../functions/fetchData";

export default function AdvanceOrderGst() {
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
        { label: "Order No.", field: "id" },
        { label: "Date", field: "pickup_date" },
        { label: "Time", field: "pickup_time" },
        { label: "Subtotal", field: "subtotal" },
        { label: "Grand Total", field: "grand_total" },
        // { label: "Action", field: "actions" }
    ];
    const exportPDF = () => {
        const doc = new jsPDF();

        doc.addImage(logo, "PNG", 150, 10, 40, 15);
        doc.setFontSize(16);
        doc.text("Advance Order Records", 14, 20);

        const tableColumn = ["Order No", "Date", "Time", "Subtotal", "Grand Total", "Payment Mode", "Order By", "Type"];
        const tableRows = [];

        const exportData = filteredData.length > 0 ? filteredData : data;

        exportData.forEach((item) => {
            const rowData = [
                item.id,
                item.pickup_date,
                item.inv_time,
                item.table_number,
                item.subtotal,
                item.grand_total,
                item.payment_mode,
                item.bill_generated_by,
                item.order_type,
            ];
            tableRows.push(rowData);
        });

        // Calculate total
        const totalAmount = exportData.reduce(
            (acc, item) => acc + parseFloat(item.grand_total || 0),
            0
        ).toFixed(2);

        // Add total row (empty cells except last column)
        const totalRow = ["", "", "", "Total:", `INR ${totalAmount}`, "", ""];
        tableRows.push(totalRow);

        doc.autoTable({
            startY: 30,
            head: [tableColumn],
            body: tableRows,
        });

        doc.save("advance_order.pdf");
    };


  const generateMonthlySummary = (dataArray) => {
  const summary = {};

  (dataArray.length > 0 ? dataArray : data).forEach((item) => {
    if (!item.pickup_date) return; // skip invalid/null date

    try {
      const date = parseISO(item.pickup_date);
      if (isNaN(date)) return; // skip invalid parsed date

      const month = format(date, "MMM yyyy");
      const total = parseFloat(item.grand_total || 0);

      summary[month] = (summary[month] || 0) + total;
    } catch (err) {
      console.warn("Invalid date format in item:", item);
    }
  });

  return Object.entries(summary).map(([month, total]) => ({ month, total }));
};


    const monthlyData = generateMonthlySummary(filteredData);




    useEffect(() => {
        const fetchAndSetData = async () => {
            try {
                await fetchData("advance_final_bill", setData, "id", {});
                setpaymentOptions(await fetchComboData("paymentoptions", "name"));
                //console.log("Fetched data:", data); // Add this line for debugging
            } catch (error) {
                console.error("Error in useEffect:", error);
            }
        };

        fetchAndSetData();
    }, []);
 const applyFilter = () => {
  // Check for invalid range
  if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
    toast.error("Invalid date range: Start Date is after End Date");
    clearFilters();
    return;
  }

  const filtered = data.filter((item) => {
    if (!item.pickup_date) return false; // skip if no date

    const itemDate = new Date(item.pickup_date);
    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate) : null;

    const isInRange =
      (!start || itemDate >= start) &&
      (!end || itemDate <= end);

    const matchesPaymentMode = !paymentMode || item.payment_mode === paymentMode;
    const matchesName = !formdata.name || item.name === formdata.name;

    return isInRange && matchesPaymentMode && matchesName;
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
                <Header title="Advance Order-GST" />
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
                                            pickup_date: item.pickup_date,
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
                                            pickup_date: "",
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
                            // <DataTable columns={columns} data={data} tablename="advance_final_bill" />
                            <DataTable columns={columns} data={filteredData.length > 0 ? filteredData : data} tablename="advance_final_bill" />

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
