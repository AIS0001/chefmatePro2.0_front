/* eslint-disable no-undef */

import React, { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { getHeaders } from "../../utility/getHeader";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { CSVLink } from "react-csv";
import { parseISO, format } from "date-fns";
import jsPDF from "jspdf";
import "jspdf-autotable";
import * as XLSX from "xlsx";
import logo from "../../assets/logo.png"
import { fetchComboData } from "../../services/api";
import CardComponent from "../../components/cards/CardComponent";
import Header from "../../components/Header";
import Layout from "../../layout/Layout";
import DataTable from "../../components/data-tables/dataTableGst";
import fetchData from "../../functions/fetchData";

export default function ItemWiseSummaryVat() {
    let currentDate = format(new Date(), "yyyy-MM-dd");
    
    const [data, setData] = useState([]);
    const [categories, setCategories] = useState([]);
    const [subcategories, setSubcategories] = useState([]);
    const [tableCategories, setTableCategories] = useState([]);
    const [selectedCatId, setSelectedCatId] = useState("");
    const [selectedSubCatId, setSelectedSubCatId] = useState("");
    const [selectedTableCatId, setSelectedTableCatId] = useState("");
    const [filteredData, setFilteredData] = useState([]);
    const [taxType, setTaxType] = useState("VAT");

    const [formdata, setFormData] = useState({
        name: "",
    });
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

    // Summary states
    const [showCategorySummary, setShowCategorySummary] = useState(false);
    const [showSubcategorySummary, setShowSubcategorySummary] = useState(false);
    const [showTableCategorySummary, setShowTableCategorySummary] = useState(false);
    const [categorySummaryData, setCategorySummaryData] = useState([]);
    const [subcategorySummaryData, setSubcategorySummaryData] = useState([]);
    const [tableCategorySummaryData, setTableCategorySummaryData] = useState([]);

    // Column definitions for VAT-specific display
    const columns = [
        { label: "Inv. No.", field: "invoice_number", fallback: ["invoice_no", "bill_no"] },
        { label: "Date", field: "setup_date", fallback: ["created_at", "date", "order_date"] },
        { label: "Category", field: "category_name", fallback: ["cat_name"] },
        { label: "Subcategory", field: "subcategory_name", fallback: ["subcat_name", "sub_category"] },
        { label: "Table Category", field: "table_category_name", fallback: ["table_cat_name"] },
        { label: "Item Name", field: "item_name", fallback: ["name", "product_name"] },
        { label: "Quantity", field: "quantity", fallback: ["qty"] },
        { label: "UOM", field: "uom", fallback: ["unit"] },
        { label: "Rate", field: "rate", fallback: ["price", "unit_price"] },
        { label: "VAT %", field: "vat_rate", fallback: ["cgst", "tax_rate"] },
        { label: "VAT Amount", field: "vat_amount", fallback: ["tax_amount"] },
        { label: "Total", field: "total_price", fallback: ["total", "total_amount"] },
    ];

    const categorySummaryColumns = [
        { label: "Category Name", field: "category_name" },
        { label: "Total Quantity", field: "total_quantity" },
        { label: "Total VAT", field: "total_vat" },
        { label: "Total Amount", field: "total_amount" },
    ];

    const subcategorySummaryColumns = [
        { label: "Subcategory Name", field: "subcategory_name" },
        { label: "Total Quantity", field: "total_quantity" },
        { label: "Total VAT", field: "total_vat" },
        { label: "Total Amount", field: "total_amount" },
    ];

    const tableCategorySummaryColumns = [
        { label: "Table Category Name", field: "table_category_name" },
        { label: "Total Quantity", field: "total_quantity" },
        { label: "Total VAT", field: "total_vat" },
        { label: "Total Amount", field: "total_amount" },
    ];

    // Summary generation functions
    const generateCategorySummary = () => {
        // Use the already filtered data that includes all active filters
        const dataToSummarize = filteredData.length > 0 ? filteredData : data;
        const summaryMap = {};

        console.log("=== CATEGORY SUMMARY DEBUG ===");
        console.log("Data to summarize count:", dataToSummarize.length);

        dataToSummarize.forEach(item => {
            const categoryId = item.catid || item.category_id || item.cat_id;
            if (!categoryId) return;

            const category = categories.find(cat => cat.id.toString() === categoryId.toString());
            const catName = category ? category.name : `Unknown (ID: ${categoryId})`;

            if (!summaryMap[categoryId]) {
                summaryMap[categoryId] = { 
                    category_name: catName, 
                    total_quantity: 0,
                    total_vat: 0,
                    total_amount: 0 
                };
            }

            // Handle different field names for amounts
            const quantity = parseFloat(item.quantity || item.qty || 0);
            const vatAmount = parseFloat(item.vat_amount || item.tax_amount || 0);
            const totalAmount = parseFloat(item.total_price || item.total || item.total_amount || 0);

            summaryMap[categoryId].total_quantity += quantity;
            summaryMap[categoryId].total_vat += vatAmount;
            summaryMap[categoryId].total_amount += totalAmount;
        });

        const summaryArray = Object.values(summaryMap);
        console.log("Generated category summary:", summaryArray);
        setCategorySummaryData(summaryArray);
        setShowCategorySummary(true);
        setShowSubcategorySummary(false);
        setShowTableCategorySummary(false);
    };

    const generateSubcategorySummary = () => {
        // Use the already filtered data that includes all active filters
        const dataToSummarize = filteredData.length > 0 ? filteredData : data;
        const summaryMap = {};

        console.log("=== SUBCATEGORY SUMMARY DEBUG ===");
        console.log("Data to summarize count:", dataToSummarize.length);

        dataToSummarize.forEach(item => {
            const subcategoryId = item.subcatid || item.subcategory_id || item.subcat_id;
            if (!subcategoryId) return;

            const subcategory = subcategories.find(sub => sub.id.toString() === subcategoryId.toString());
            const subcatName = subcategory ? subcategory.subcat : `Unknown (ID: ${subcategoryId})`;

            if (!summaryMap[subcategoryId]) {
                summaryMap[subcategoryId] = { 
                    subcategory_name: subcatName, 
                    total_quantity: 0,
                    total_vat: 0,
                    total_amount: 0 
                };
            }

            // Handle different field names for amounts
            const quantity = parseFloat(item.quantity || item.qty || 0);
            const vatAmount = parseFloat(item.vat_amount || item.tax_amount || 0);
            const totalAmount = parseFloat(item.total_price || item.total || item.total_amount || 0);

            summaryMap[subcategoryId].total_quantity += quantity;
            summaryMap[subcategoryId].total_vat += vatAmount;
            summaryMap[subcategoryId].total_amount += totalAmount;
        });

        const summaryArray = Object.values(summaryMap);
        console.log("Generated subcategory summary:", summaryArray);
        setSubcategorySummaryData(summaryArray);
        setShowSubcategorySummary(true);
        setShowCategorySummary(false);
        setShowTableCategorySummary(false);
    };

    const generateTableCategorySummary = () => {
        // Use the already filtered data that includes all active filters (date, item name, category, etc.)
        const dataToSummarize = filteredData.length > 0 ? filteredData : data;
        const summaryMap = {};

        console.log("=== TABLE CATEGORY SUMMARY DEBUG ===");
        console.log("Data to summarize count:", dataToSummarize.length);
        console.log("Active filters:", { startDate, endDate, selectedTableCatId, selectedCatId, selectedSubCatId, itemName: formdata.name });
        console.log("Sample data:", dataToSummarize[0]);

        dataToSummarize.forEach(item => {
            const tableCategoryId = item.table_cat_id || item.table_category_id;
            if (!tableCategoryId) {
                console.log("Skipping item without table_cat_id:", item.item_name || item.name);
                return;
            }

            const tableCategory = tableCategories.find(tcat => tcat.id.toString() === tableCategoryId.toString());
            const tableCatName = tableCategory ? tableCategory.cat_name : `Unknown (ID: ${tableCategoryId})`;

            if (!summaryMap[tableCategoryId]) {
                summaryMap[tableCategoryId] = { 
                    table_category_name: tableCatName, 
                    total_quantity: 0,
                    total_vat: 0,
                    total_amount: 0 
                };
                console.log("Created new summary entry for table category:", tableCatName, "ID:", tableCategoryId);
            }

            // Handle different field names for amounts
            const quantity = parseFloat(item.quantity || item.qty || 0);
            const vatAmount = parseFloat(item.vat_amount || item.tax_amount || 0);
            const totalAmount = parseFloat(item.total_price || item.total || item.total_amount || 0);

            summaryMap[tableCategoryId].total_quantity += quantity;
            summaryMap[tableCategoryId].total_vat += vatAmount;
            summaryMap[tableCategoryId].total_amount += totalAmount;
        });

        const summaryArray = Object.values(summaryMap);
        console.log("Generated table category summary:", summaryArray);
        setTableCategorySummaryData(summaryArray);
        setShowTableCategorySummary(true);
        setShowCategorySummary(false);
        setShowSubcategorySummary(false);
    };

    // Helper function to get filtered data by date range
    const getFilteredByDateRange = () => {
        return data.filter(item => {
            const dateField = item.setup_date;
            if (!dateField) return false;
            
            // Parse date more carefully to avoid timezone issues
            let itemDate;
            try {
                let dateString = dateField;
                
                // Handle various date formats
                if (dateString.includes('T')) {
                    dateString = dateString.split('T')[0]; // Take only date part (remove time)
                }
                
                // Ensure valid date format
                if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
                    itemDate = new Date(dateString + 'T00:00:00'); // Add time to avoid timezone issues
                } else {
                    itemDate = new Date(dateString);
                }
                
                // Check if date is valid
                if (isNaN(itemDate.getTime())) {
                    return false;
                }
            } catch (e) {
                return false;
            }
            
            const start = startDate ? new Date(startDate + 'T00:00:00') : null;
            const end = endDate ? new Date(endDate + 'T23:59:59') : null;

            return (!start || itemDate >= start) && (!end || itemDate <= end);
        });
    };

    // Filtering function
    const applyFilter = () => {
        if (data.length === 0) return;
        
        // Validate date range
        if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
            console.warn("Invalid date range: Start date is after end date");
            return;
        }
        
        console.log("=== FILTER DEBUG INFO ===");
        console.log("Total data items:", data.length);
        console.log("Data sample:", data[0]);
        console.log("Current filters:", {
            startDate,
            endDate,
            itemName: formdata.name,
            selectedCatId,
            selectedSubCatId,
            selectedTableCatId
        });
        
        const filtered = data.filter(item => {
            const dateField = item.setup_date;
            if (!dateField) return false;

            // Handle different date field names with better parsing
            let itemDate;
            try {
                let dateString = dateField;
                
                // Handle various date formats
                if (dateString.includes('T')) {
                    dateString = dateString.split('T')[0]; // Take only date part (remove time)
                }
                
                // Ensure valid date format
                if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
                    itemDate = new Date(dateString + 'T00:00:00'); // Add time to avoid timezone issues
                } else {
                    itemDate = new Date(dateString);
                }
                
                // Check if date is valid
                if (isNaN(itemDate.getTime())) {
                    console.warn(`Invalid date found: ${dateField} for item: ${item.item_name || 'Unknown'}`);
                    return false;
                }
            } catch (e) {
                console.warn(`Date parsing error for: ${dateField}`, e);
                return false;
            }
            
            const start = startDate ? new Date(startDate + 'T00:00:00') : null;
            const end = endDate ? new Date(endDate + 'T23:59:59') : null;

            const isWithinDateRange = (!start || itemDate >= start) && (!end || itemDate <= end);

            // Handle different item name field variations
            const itemName = item.item_name || item.name || item.product_name || "";
            const matchesItemName =
                !formdata.name ||
                itemName.toLowerCase().includes(formdata.name.toLowerCase());

            // Handle different category field variations
            const categoryId = item.catid || item.category_id || item.cat_id;
            const matchesCategory =
                !selectedCatId || categoryId?.toString() === selectedCatId.toString();

            // Handle different subcategory field variations
            const subcategoryId = item.subcatid || item.subcategory_id || item.subcat_id;
            const matchesSubcategory =
                !selectedSubCatId || subcategoryId?.toString() === selectedSubCatId.toString();

            // Handle table category field
            const tableCategoryId = item.table_cat_id || item.table_category_id;
            const matchesTableCategory =
                !selectedTableCatId || tableCategoryId?.toString() === selectedTableCatId.toString();

            console.log(`Item: ${item.item_name || 'Unknown'}, Date: ${item.setup_date}, Table Cat ID: ${tableCategoryId}, Matches: date=${isWithinDateRange}, name=${matchesItemName}, cat=${matchesCategory}, subcat=${matchesSubcategory}, tablecat=${matchesTableCategory}`);

            return isWithinDateRange && matchesItemName && matchesCategory && matchesSubcategory && matchesTableCategory;
        });

        console.log(`=== FILTER RESULTS ===`);
        console.log(`Filtered ${filtered.length} items from ${data.length} total`);
        console.log("Filtered data sample:", filtered[0]);
        console.log("Table category IDs in filtered data:", filtered.map(item => item.table_cat_id || item.table_category_id).filter(Boolean));
        setFilteredData(filtered);
    };

    // Clear filters
    const clearFilters = () => {
        setStartDate("");
        setEndDate("");
        setFormData({ name: "" });
        setSelectedCatId("");
        setSelectedSubCatId("");
        setSelectedTableCatId("");
        setFilteredData(data);
        setShowCategorySummary(false);
        setShowSubcategorySummary(false);
        setShowTableCategorySummary(false);
        setCategorySummaryData([]);
        setSubcategorySummaryData([]);
        setTableCategorySummaryData([]);
    };

    // Export to PDF
    const exportPDF = () => {
        const doc = new jsPDF();
        const exportData = filteredData.length > 0 ? filteredData : data;

        // Add logo
        doc.addImage(logo, "PNG", 150, 10, 40, 15);

        doc.setFontSize(16);
        doc.text("Item Wise VAT Summary", 14, 20);

        const tableColumn = [
            "Invoice No", "Date", "Item", "Qty", "UOM", "Rate",
            "VAT %", "VAT Amount", "Total"
        ];

        const tableRows = [];
        let vatTotal = 0;
        let grandTotal = 0;

        exportData.forEach((item) => {
            // Handle different field names
            const invoiceNo = item.invoice_number || item.invoice_no || item.bill_no;
            const date = item.setup_date;
            const itemName = item.item_name || item.name || item.product_name;
            const quantity = item.quantity || item.qty;
            const rate = item.rate || item.price || item.unit_price;
            const vatRate = item.vat_rate || item.cgst || item.tax_rate;
            const vatAmount = item.vat_amount || item.tax_amount;
            const totalPrice = item.total_price || item.total || item.total_amount;

            tableRows.push([
                invoiceNo,
                date ? format(new Date(date), "yyyy-MM-dd") : "",
                itemName,
                quantity,
                item.uom || item.unit,
                rate,
                vatRate,
                vatAmount,
                totalPrice,
            ]);

            vatTotal += parseFloat(vatAmount || 0);
            grandTotal += parseFloat(totalPrice || 0);
        });

        doc.autoTable({
            startY: 30,
            head: [tableColumn],
            body: tableRows,
        });

        const finalY = doc.autoTable.previous.finalY + 10;

        doc.setFontSize(12);
        doc.text("Summary", 14, finalY);
        doc.text(`Total VAT: ${vatTotal.toFixed(2)}`, 14, finalY + 8);
        doc.text(`Total Amount: ${grandTotal.toFixed(2)}`, 14, finalY + 16);

        doc.save("itemwise_vat_summary.pdf");
    };

    // Export to Excel
    const exportExcel = () => {
        const exportData = filteredData.length > 0 ? filteredData : data;
        
        const worksheetData = exportData.map(item => {
            // Handle different field names
            const invoiceNo = item.invoice_number || item.invoice_no || item.bill_no;
            const date = item.setup_date;
            const itemName = item.item_name || item.name || item.product_name;
            const categoryName = item.category_name || item.cat_name;
            const subcategoryName = item.subcategory_name || item.subcat_name || item.sub_category;
            const tableCategoryName = item.table_category_name || item.table_cat_name;
            const quantity = item.quantity || item.qty;
            const rate = item.rate || item.price || item.unit_price;
            const vatRate = item.vat_rate || item.cgst || item.tax_rate;
            const vatAmount = item.vat_amount || item.tax_amount;
            const totalPrice = item.total_price || item.total || item.total_amount;

            return {
                "Invoice No": invoiceNo,
                "Date": date ? format(new Date(date), "yyyy-MM-dd") : "",
                "Category": categoryName,
                "Subcategory": subcategoryName,
                "Table Category": tableCategoryName,
                "Item Name": itemName,
                "Quantity": quantity,
                "UOM": item.uom || item.unit,
                "Rate": rate,
                "VAT %": vatRate,
                "VAT Amount": vatAmount,
                "Total": totalPrice
            };
        });

        // Add summary row
        const vatTotal = exportData.reduce((acc, item) => {
            const vatAmount = item.vat_amount || item.tax_amount;
            return acc + parseFloat(vatAmount || 0);
        }, 0);
        
        const grandTotal = exportData.reduce((acc, item) => {
            const totalPrice = item.total_price || item.total || item.total_amount;
            return acc + parseFloat(totalPrice || 0);
        }, 0);
        
        worksheetData.push({});
        worksheetData.push({
            "Invoice No": "TOTALS",
            "VAT Amount": vatTotal.toFixed(2),
            "Total": grandTotal.toFixed(2)
        });

        const worksheet = XLSX.utils.json_to_sheet(worksheetData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "VAT Summary");

        XLSX.writeFile(workbook, "itemwise_vat_summary.xlsx");
    };

    // Data fetching useEffects
    useEffect(() => {
        const fetchDataAndCategories = async () => {
            try {
                // Try the VAT-specific endpoint first, fallback to GST endpoint
                let resData;
                try {
                    resData = await axios.get("/order_items_vat_joined", getHeaders());
                } catch (error) {
                    console.log("VAT endpoint not available, using GST endpoint");
                    resData = await axios.get("/order_items_gst_joined", getHeaders());
                }
                
                console.log("Fetched data sample:", resData.data[0]); // Debug log
                setData(resData.data);
                setFilteredData(resData.data);
            } catch (error) {
                console.error("Error fetching order items:", error);
                toast.error("Failed to load order items data");
            }
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

    // Auto-filter when dependencies change
    useEffect(() => {
        if (data.length > 0) {
            applyFilter();
        }
    }, [data, startDate, endDate, formdata.name, selectedCatId, selectedSubCatId, selectedTableCatId]);

    // Update summaries when filtered data changes
    useEffect(() => {
        if (filteredData.length > 0) {
            // Regenerate current summary if any is active
            if (showCategorySummary) {
                generateCategorySummary();
            } else if (showSubcategorySummary) {
                generateSubcategorySummary();
            } else if (showTableCategorySummary) {
                generateTableCategorySummary();
            }
        }
    }, [filteredData, showCategorySummary, showSubcategorySummary, showTableCategorySummary]);

    return (
        <>
            <Layout>
                <Header title="Item Wise VAT Summary" />
                <ToastContainer />
                <div className="row">
                    <div className="col-12">
                        <CardComponent>
                            {/* Filter Section */}
                            <div className="row mb-3">
                                <div className="col-lg-3 col-md-4 col-sm-6 col-xs-12">
                                    <label>Start Date</label>
                                    <input 
                                        type="date" 
                                        className="form-control" 
                                        value={startDate} 
                                        onChange={(e) => setStartDate(e.target.value)} 
                                    />
                                </div>
                                <div className="col-lg-3 col-md-3 col-sm-6 col-xs-6">
                                    <label>End Date</label>
                                    <input 
                                        type="date" 
                                        className="form-control" 
                                        value={endDate} 
                                        onChange={(e) => setEndDate(e.target.value)} 
                                    />
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

                            {/* Action Buttons */}
                            <div className="row mt-3">
                                <div className="col-12">
                                    <button className="btn btn-primary me-2" onClick={applyFilter}>
                                        Apply Filter
                                    </button>
                                    <button className="btn btn-info me-2" onClick={clearFilters}>
                                        Clear Filters
                                    </button>
                                    <button className="btn btn-danger me-2" onClick={exportPDF}>
                                        Export PDF
                                    </button>
                                    <button className="btn btn-success me-2" onClick={exportExcel}>
                                        Export Excel
                                    </button>
                                </div>
                            </div>

                            {/* Summary Buttons */}
                            <div className="row mt-3">
                                <div className="col-12">
                                    <button className="btn btn-gradient-purple me-2" style={{background: 'linear-gradient(45deg, #667eea 0%, #764ba2 100%)', border: 'none', color: 'white'}} onClick={generateCategorySummary}>
                                        📊 Category Summary
                                    </button>
                                    <button className="btn btn-gradient-orange me-2" style={{background: 'linear-gradient(45deg, #f093fb 0%, #f5576c 100%)', border: 'none', color: 'white'}} onClick={generateSubcategorySummary}>
                                        📈 Subcategory Summary
                                    </button>
                                    <button className="btn btn-gradient-teal me-2" style={{background: 'linear-gradient(45deg, #4facfe 0%, #00f2fe 100%)', border: 'none', color: 'white'}} onClick={generateTableCategorySummary}>
                                        🏷️ Table Category Summary
                                    </button>
                                </div>
                            </div>

                            {/* Back to Details Buttons */}
                            {(showCategorySummary || showSubcategorySummary || showTableCategorySummary) && (
                                <div className="row mt-2">
                                    <div className="col-12">
                                        <button
                                            className="btn btn-secondary"
                                            onClick={() => {
                                                setShowCategorySummary(false);
                                                setShowSubcategorySummary(false);
                                                setShowTableCategorySummary(false);
                                            }}
                                        >
                                            Back to Item Details
                                        </button>
                                    </div>
                                </div>
                            )}
                        </CardComponent>
                    </div>

                    {/* Data Table Section */}
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
                                        ? "category_vat_summary"
                                        : showSubcategorySummary
                                        ? "subcategory_vat_summary"
                                        : showTableCategorySummary
                                        ? "table_category_vat_summary"
                                        : "item_wise_vat_summary"
                                }
                            />
                        )}

                        {/* Summary Totals */}
                        <div className="mt-3 p-3 bg-light rounded">
                            <div className="row">
                                <div className="col-md-4">
                                    <strong>Total Items:</strong> {(filteredData.length > 0 ? filteredData : data).length}
                                </div>
                                <div className="col-md-4">
                                    <strong>Total VAT:</strong> ฿{
                                        (filteredData.length > 0 ? filteredData : data)
                                            .reduce((acc, item) => {
                                                const vatAmount = item.vat_amount || item.tax_amount;
                                                return acc + parseFloat(vatAmount || 0);
                                            }, 0)
                                            .toFixed(2)
                                    }
                                </div>
                                <div className="col-md-4">
                                    <strong>Grand Total:</strong> ฿{
                                        (filteredData.length > 0 ? filteredData : data)
                                            .reduce((acc, item) => {
                                                const totalPrice = item.total_price || item.total || item.total_amount;
                                                return acc + parseFloat(totalPrice || 0);
                                            }, 0)
                                            .toFixed(2)
                                    }
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </Layout>
        </>
    );
}
