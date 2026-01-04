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

export default function ItemWiseSaleGst() {
    let currentDate = format(new Date(), "yyyy-MM-dd");
    //  const headers = { Authorization: authheader().access_token };
    const [data, setData] = useState([]);
    const [categories, setCategories] = useState([]);
    const [subcategories, setSubcategories] = useState([]);
    const [tableCategories, setTableCategories] = useState([]);
    const [selectedCatId, setSelectedCatId] = useState("");
    const [selectedSubCatId, setSelectedSubCatId] = useState("");
    const [selectedTableCatId, setSelectedTableCatId] = useState("");
    const [categorySummary, setCategorySummary] = useState([]);
    const [showCategorySummary, setShowCategorySummary] = useState(false);
    const [tableCategorySummary, setTableCategorySummary] = useState([]);
    const [showTableCategorySummary, setShowTableCategorySummary] = useState(false);
    const [taxType, setTaxType] = useState("GST"); // Default to GST, will be updated from coresetting


    const [errors, setErrors] = useState({});
    const [formdata, setFormData] = useState({
        name: "",

    });
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [paymentMode, setPaymentMode] = useState("");
    const [filteredData, setFilteredData] = useState([]);

const [categorySummaryData, setCategorySummaryData] = useState([]);
const [showSubcategorySummary, setShowSubcategorySummary] = useState(false);
const [subcategorySummaryData, setSubcategorySummaryData] = useState([]);

    const [paymentOptions, setpaymentOptions] = useState([]);
    const columns = [
        { label: "Inv. No.", field: "invoice_number" },
        { label: "Date", field: "created_at" },
        { label: "Category", field: "category_name" },
        { label: "Subcategory ", field: "subcategory_name" },
        { label: "Table Category", field: "table_category_name" },
        { label: "Item Name", field: "item_name" },
        { label: "Quantity", field: "quantity" },
        { label: "UOM", field: "uom" },
        { label: "Rate", field: "rate" },
        ...(taxType === "VAT" ? [
            { label: "VAT", field: "cgst" }
        ] : [
            { label: "CGST", field: "cgst" },
            { label: "SGST", field: "sgst" },
            { label: "IGST", field: "igst" }
        ]),
        { label: "Tax Amount", field: "tax_amount" },
        { label: "Total", field: "total_price" },
    ];
    const categorySummaryColumns = [
  { label: "Category Name", field: "category_name" },
  { label: "Total Amount", field: "total_amount" },
];
const subcategorySummaryColumns = [
  { label: "Subcategory Name", field: "subcategory_name" },
  { label: "Total Amount", field: "total_amount" },
];
const tableCategorySummaryColumns = [
  { label: "Table Category Name", field: "table_category_name" },
  { label: "Total Amount", field: "total_amount" },
];

   const generateCategorySummary = () => {
  // Filter data by date range first
  const filteredByDate = data.filter(item => {
    if (!item.created_at) return false;
    const itemDate = new Date(item.created_at);
    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate) : null;
    const itemDateMidnight = new Date(itemDate.getFullYear(), itemDate.getMonth(), itemDate.getDate());

    return (!start || start <= itemDateMidnight) && (!end || itemDateMidnight <= end);
  });

  const summaryMap = {};

  filteredByDate.forEach(item => {
    if (!item.catid) return;

    const category = categories.find(cat => cat.id.toString() === item.catid.toString());
    const catName = category ? category.name : "Unknown";

    if (!summaryMap[item.catid]) {
      summaryMap[item.catid] = { category_name: catName, total_amount: 0 };
    }

    summaryMap[item.catid].total_amount += parseFloat(item.total_price || 0);
  });

  const summaryArray = Object.values(summaryMap);
  setCategorySummaryData(summaryArray);
  setShowCategorySummary(true);
};
const generateSubcategorySummary = () => {
  // Filter data by date range first
  const filteredByDate = data.filter(item => {
    if (!item.created_at) return false;
    const itemDate = new Date(item.created_at);
    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate) : null;
    const itemDateMidnight = new Date(itemDate.getFullYear(), itemDate.getMonth(), itemDate.getDate());

    return (!start || start <= itemDateMidnight) && (!end || itemDateMidnight <= end);
  });

  const summaryMap = {};

  filteredByDate.forEach(item => {
    if (!item.subcatid) return;

    const subcategory = subcategories.find(sub => sub.id.toString() === item.subcatid.toString());
    const subcatName = subcategory ? subcategory.subcat : "Unknown";

    if (!summaryMap[item.subcatid]) {
      summaryMap[item.subcatid] = { subcategory_name: subcatName, total_amount: 0 };
    }

    summaryMap[item.subcatid].total_amount += parseFloat(item.total_price || 0);
  });

  const summaryArray = Object.values(summaryMap);
  setSubcategorySummaryData(summaryArray);
  setShowSubcategorySummary(true);
  setShowCategorySummary(false);  // Hide category summary if shown
  setShowTableCategorySummary(false);  // Hide table category summary if shown
};

const generateTableCategorySummary = () => {
  // Filter data by date range first
  const filteredByDate = data.filter(item => {
    if (!item.created_at) return false;
    const itemDate = new Date(item.created_at);
    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate) : null;
    const itemDateMidnight = new Date(itemDate.getFullYear(), itemDate.getMonth(), itemDate.getDate());

    return (!start || start <= itemDateMidnight) && (!end || itemDateMidnight <= end);
  });

  const summaryMap = {};

  filteredByDate.forEach(item => {
    if (!item.table_cat_id) return;

    const tableCategory = tableCategories.find(tcat => tcat.id.toString() === item.table_cat_id.toString());
    const tableCatName = tableCategory ? tableCategory.cat_name : "Unknown";

    if (!summaryMap[item.table_cat_id]) {
      summaryMap[item.table_cat_id] = { table_category_name: tableCatName, total_amount: 0 };
    }

    summaryMap[item.table_cat_id].total_amount += parseFloat(item.total_price || 0);
  });

  const summaryArray = Object.values(summaryMap);
  setTableCategorySummary(summaryArray);
  setShowTableCategorySummary(true);
  setShowCategorySummary(false);  // Hide category summary if shown
  setShowSubcategorySummary(false);  // Hide subcategory summary if shown
};


    const exportPDF = () => {
        const doc = new jsPDF();
        const exportData = filteredData.length > 0 ? filteredData : data;

        // Add logo (x, y, width, height)
        doc.addImage(logo, "PNG", 150, 10, 40, 15); // adjust as needed

        doc.setFontSize(16);
        doc.text("Bill History", 14, 20);

        const tableColumn = [
            "Invoice No", "Date", "Item", "Qty", "UOM", "Rate",
            "CGST", "SGST", "IGST", "Tax Amt", "Total"
        ];

        const tableRows = [];

        let taxTotal = 0;
        let grandTotal = 0;

        exportData.forEach((item) => {
            tableRows.push([
                item.invoice_number,
                format(new Date(item.created_at), "yyyy-MM-dd"),
                item.item_name,
                item.quantity,
                item.uom,
                item.rate,
                item.cgst,
                item.sgst,
                item.igst,
                item.tax_amount,
                item.total_price,
            ]);

            taxTotal += parseFloat(item.tax_amount || 0);
            grandTotal += parseFloat(item.total_price || 0);
        });

        doc.autoTable({
            startY: 30,
            head: [tableColumn],
            body: tableRows,
        });

        const finalY = doc.autoTable.previous.finalY + 10;

        doc.setFontSize(12);
        doc.text("Total Summary", 14, finalY);
        doc.text(`Total Tax: INR ${taxTotal.toFixed(2)}`, 14, finalY + 8);
        doc.text(`Total Amount: INR ${grandTotal.toFixed(2)}`, 14, finalY + 16);

        doc.save("itemWiseSale.pdf");
    };


    const generateMonthlySummary = (dataArray) => {
        const summary = {};

        (dataArray.length > 0 ? dataArray : data).forEach((item) => {
            const date = parseISO(item.created_at);
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


    

    const groupByItem = (dataArray) => {
        const grouped = {};

        dataArray.forEach((item) => {
            if (!grouped[item.item_name]) {
                grouped[item.item_name] = [];
            }
            grouped[item.item_name].push(item);
        });

        return grouped;
    };
    const exportMonthlySummaryPDF = () => {
        const doc = new jsPDF();

        doc.setFontSize(18);
        doc.text("Monthly Sales Summary", 14, 22);

        // Define columns
        const headers = [["Month", "Total Sale (฿)"]];

        // Use your `monthlyData` (already generated from filteredData or data)
        const summaryData = monthlyData.map(item => [
            item.month,
            item.total.toFixed(2)
        ]);

        doc.autoTable({
            startY: 30,
            head: headers,
            body: summaryData,
            styles: { halign: 'left' },
            headStyles: { fillColor: [40, 167, 69] }, // green header
            theme: 'striped',
        });

        doc.save("monthly_summary.pdf");
    };
    // Fetch order_items_gst data and categories on mount
 // In useEffect after data fetch, set filteredData = data to initialize
useEffect(() => {
    const fetchDataAndCategories = async () => {
        const resData = await axios.get("/order_items_gst_joined", getHeaders());
        setData(resData.data);
        setFilteredData(resData.data);  // Initialize filteredData to full dataset
    };
    fetchDataAndCategories();
}, []);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const cats = await fetchComboData("categories", "name");
                setCategories(cats);
            } catch (err) {
                console.error("Error fetching categories:", err);
            }
        };

        fetchCategories();
    }, []);

    useEffect(() => {
        const fetchTableCategories = async () => {
            try {
                const tableCats = await fetchComboData("table_category", "cat_name");
                setTableCategories(tableCats);
            } catch (err) {
                console.error("Error fetching table categories:", err);
            }
        };

        fetchTableCategories();
    }, []);

    // Fetch tax type from coresetting
    useEffect(() => {
        const fetchTaxType = async () => {
            try {
                const result = await fetchData("coresetting");
                if (result && result.length > 0) {
                    setTaxType(result[0].tax_type || "GST");
                }
            } catch (err) {
                console.error("Error fetching tax type:", err);
                setTaxType("GST"); // Default to GST on error
            }
        };

        fetchTaxType();
    }, []);

    useEffect(() => {
        const fetchSubcategories = async () => {
            if (!selectedCatId) {
                setSubcategories([]);
                setSelectedSubCatId("");
                return;
            }
            try {
                const subs = await fetchComboData("subcategory", "subcat", { catid: selectedCatId });
                setSubcategories(subs);
            } catch (err) {
                console.error("Error fetching subcategories:", err);
            }
        };

        fetchSubcategories();
    }, [selectedCatId]);


// applyFilter should filter based on original data (not filteredData)
const applyFilter = () => {
    console.log("ApplyFilter called with:");
    console.log("- selectedTableCatId:", selectedTableCatId);
    console.log("- selectedCatId:", selectedCatId);
    console.log("- selectedSubCatId:", selectedSubCatId);
    console.log("- formdata.name:", formdata.name);
    console.log("- startDate:", startDate);
    console.log("- endDate:", endDate);
    console.log("- data length:", data.length);
    
    if (data.length === 0) {
        console.log("No data available for filtering");
        return;
    }
    
    // Log sample data structure
    if (data[0]) {
        console.log("Sample data item fields:", Object.keys(data[0]));
        console.log("Sample data item:", data[0]);
    }
    
    const filtered = data.filter(item => {
        if (!item.created_at) return false;

        const itemDate = new Date(item.created_at);
        const start = startDate ? new Date(startDate) : null;
        const end = endDate ? new Date(endDate) : null;
        const itemDateMidnight = new Date(itemDate.getFullYear(), itemDate.getMonth(), itemDate.getDate());

        const isWithinDateRange =
            (!start || start <= itemDateMidnight) &&
            (!end || itemDateMidnight <= end);

        const matchesItemName =
            !formdata.name ||
            (item.item_name && item.item_name.toLowerCase().includes(formdata.name.toLowerCase()));

        const matchesCategory =
            !selectedCatId || item.catid?.toString() === selectedCatId.toString();

        const matchesSubcategory =
            !selectedSubCatId || item.subcatid?.toString() === selectedSubCatId.toString();

        const matchesTableCategory =
            !selectedTableCatId || item.table_cat_id?.toString() === selectedTableCatId.toString();

        const passesFilter = isWithinDateRange && matchesItemName && matchesCategory && matchesSubcategory && matchesTableCategory;
        
        // Log filtering details for debugging
        if (selectedTableCatId || selectedCatId || selectedSubCatId || formdata.name) {
            console.log(`Item ${item.item_name}:`, {
                isWithinDateRange,
                matchesItemName,
                matchesCategory,
                matchesSubcategory,
                matchesTableCategory,
                passesFilter,
                itemData: {
                    catid: item.catid,
                    subcatid: item.subcatid,
                    table_cat_id: item.table_cat_id
                }
            });
        }

        return passesFilter;
    });

    console.log("Filtered results:", filtered.length, "items");
    setFilteredData(filtered);
};

// Clear filters and reset filteredData to full data
const clearFilters = () => {
    setStartDate("");
    setEndDate("");
    setFormData({ name: "" });
    setSelectedCatId("");
    setSelectedSubCatId("");
    setSelectedTableCatId("");
    setPaymentMode("");
    setFilteredData(data);  // Reset filteredData to original data
    setShowCategorySummary(false);
    setShowSubcategorySummary(false);
    setShowTableCategorySummary(false);
    localStorage.removeItem("billFilters");
};

    const exportData = filteredData.length > 0 ? filteredData : data;

    let taxTotal = 0;
    let grandTotal = 0;

    const csvDataWithTotals = exportData.map(item => {
        taxTotal += parseFloat(item.tax_amount || 0);
        grandTotal += parseFloat(item.total_price || 0);

        return {
            "Invoice No": item.invoice_number,
            "Date": item.created_at ? format(new Date(item.created_at), "yyyy-MM-dd") : "",
            "Item Name": item.item_name,
            "Qty": item.quantity,
            "UOM": item.uom,
            "Rate": item.rate,
            "CGST": item.cgst,
            "SGST": item.sgst,
            "IGST": item.igst,
            "Tax Amount": item.tax_amount,
            "Total": item.total_price
        };
    });

    // Add totals row
    csvDataWithTotals.push({});
    csvDataWithTotals.push({
        "Invoice No": "TOTALS",
        "Tax Amount": taxTotal.toFixed(2),
        "Total": grandTotal.toFixed(2)
    });
 useEffect(() => {
    if (data.length > 0) {
        console.log("useEffect triggered for filtering. Data length:", data.length);
        applyFilter();
    }
}, [data, startDate, endDate, formdata.name, paymentMode, selectedCatId, selectedSubCatId, selectedTableCatId]);



    return (
        <>
            <Layout>
                <Header title="Item Wise-GST Version" />
                <ToastContainer />
                <div className="row">
                    {/* Left Panel - Payment Form */}
                    <div className="col-12">
                        <CardComponent>
                            <div className="row mb-3">
                                <div className="col-lg-3 col-md-4 col-sm-6 col-xs-12">
                                    <label>Start Date</label>
                                    <input type="date" className="form-control" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                                </div>
                                <div className="col-lg-3 col-md-3 col-sm-6 col-xs-6">
                                    <label>End Date</label>
                                    <input type="date" className="form-control" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                                </div>
                                <div className="col-lg-3 col-md-3 col-sm-6 col-xs-6">
                                    <label>Item Name</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={formdata.name}
                                        onChange={(e) => setFormData({ ...formdata, name: e.target.value })}
                                        placeholder="Enter item name"
                                    />
                                </div>
                                <div className="col-lg-3 col-md-3 col-sm-6 col-xs-6">
                                    <label>Category</label>
                                    <select
                                        className="form-control"
                                        value={selectedCatId}
                                        onChange={(e) => setSelectedCatId(e.target.value)}
                                    >
                                        <option value="">All Categories</option>
                                        {categories.map(cat => (
                                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="col-lg-3 col-md-3 col-sm-6 col-xs-6">
                                    <label>Subcategory</label>
                                    <select
                                        className="form-control"
                                        value={selectedSubCatId}
                                        onChange={(e) => setSelectedSubCatId(e.target.value)}
                                    >
                                        <option value="">All Subcategories</option>
                                        {subcategories.map(sub => (
                                            <option key={sub.id} value={sub.id}>{sub.subcat}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="col-lg-3 col-md-3 col-sm-6 col-xs-6">
                                    <label>Table Category</label>
                                    <select
                                        className="form-control"
                                        value={selectedTableCatId}
                                        onChange={(e) => setSelectedTableCatId(e.target.value)}
                                    >
                                        <option value="">All Table Categories</option>
                                        {tableCategories.map(cat => (
                                            <option key={cat.id} value={cat.id}>{cat.cat_name}</option>
                                        ))}
                                    </select>
                                </div>


                            </div>
                            <div className="row mt-3">
                                <div className="col-12">
                                    <button className="btn btn-primary w-100" onClick={applyFilter}>Apply Filter</button>
                                    <button className="btn btn-info w-100" onClick={() => clearFilters()}>
                                        Clear Filters
                                    </button>
                                    <CSVLink
                                        data={csvDataWithTotals}
                                        filename="itemwisesale.csv"
                                        className="btn btn-success w-100"
                                    >
                                        Export CSV
                                    </CSVLink>
                                    <button className="btn btn-danger w-100" onClick={exportPDF}>
                                        Export PDF
                                    </button>
                                    <button className="btn btn-primary w-100" onClick={exportMonthlySummaryPDF}>
                                        Export Monthly Summary PDF
                                    </button>
                                    <button className="btn btn-success" onClick={generateCategorySummary}>
  Category Wise Summary
</button>
<button className="btn btn-warning" onClick={generateSubcategorySummary}>
  Subcategory Wise Summary
</button>
<button className="btn btn-info" onClick={generateTableCategorySummary}>
  Table Category Wise Summary
</button>
{showCategorySummary && (
  <button
    className="btn btn-primary w-100 mt-2"
    onClick={() => setShowCategorySummary(false)}
  >
    Back to Item Details
  </button>
)}
{showSubcategorySummary && (
  <button
    className="btn btn-primary w-100 mt-2"
    onClick={() => setShowSubcategorySummary(false)}
  >
    Back to Item Details
  </button>
)}
{showTableCategorySummary && (
  <button
    className="btn btn-primary w-100 mt-2"
    onClick={() => setShowTableCategorySummary(false)}
  >
    Back to Item Details
  </button>
)}




                                </div>
                                {(filteredData.length > 0 || data.length > 0) && (
                                    <div className="col-lg-3 col-md-3 col-sm-6 col-xs-6">



                                    </div>




                                )}
                                <div className="col-md-3 d-flex align-items-end">



                                </div>
                                <div className="col-md-3 d-flex align-items-end">



                                </div>

                            </div>

                        </CardComponent>
                    </div>
                    <div className="col-12">

                        {data.length === 0 ? (
                            <p>No data available</p>
                        ) : (
         <DataTable
  columns={
    showCategorySummary
      ? categorySummaryColumns
      : showSubcategorySummary
      ? subcategorySummaryColumns
      : showTableCategorySummary
      ? tableCategorySummaryColumns
      : columns
  }
  data={
    showCategorySummary
      ? categorySummaryData
      : showSubcategorySummary
      ? subcategorySummaryData
      : showTableCategorySummary
      ? tableCategorySummaryData
      : (filteredData.length > 0 ? filteredData : data)
  }
  tablename={
    showCategorySummary
      ? "category_summary"
      : showSubcategorySummary
      ? "subcategory_summary"
      : showTableCategorySummary
      ? "table_category_summary"
      : "order_items_gst"
  }
/>

                        )}

                        <div className="mt-2">
                            <strong>Subtotal:</strong> ฿
                            {(
                                (filteredData.length > 0 ? filteredData : data).reduce(
                                    (acc, item) => acc + parseFloat(item.total_price || 0),
                                    0
                                )
                            ).toFixed(2)} &nbsp;&nbsp;
                            <strong>Tax:</strong> ฿
                            {(
                                (filteredData.length > 0 ? filteredData : data).reduce(
                                    (acc, item) => acc + parseFloat(item.tax_amount || 0),
                                    0
                                )
                            ).toFixed(2)}
                        </div>


                    </div>
                </div>






                {/* 
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
                </div> */}
            </Layout>
        </>
    );
}
