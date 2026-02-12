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
import { Table, Button, DatePicker, Input, Select, Space, Card, Row, Col, Statistic, Divider } from "antd";
import { PrinterOutlined, FilePdfOutlined, FileExcelOutlined, FilterOutlined, ClearOutlined } from "@ant-design/icons";
import dayjs from "dayjs";

const { RangePicker } = DatePicker;
const { Option } = Select;

export default function ItemWiseSummaryVat() {
    let currentDate = format(new Date(), "yyyy-MM-dd");
    
    const [data, setData] = useState([]);
    const [originalData, setOriginalData] = useState([]); // Store original ungrouped data
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
    const [companyInfo, setCompanyInfo] = useState({});

    // Column definitions for VAT-specific display
    const columns = [
        // Invoice and Date columns hidden since grouped data aggregates multiple orders
        // { label: "Inv. No.", field: "invoice_number", fallback: ["invoice_no", "bill_no"] },
        // { label: "Date", field: "setup_date", fallback: ["created_at", "date", "order_date"] },
        { label: "Category", field: "category_name", fallback: ["cat_name"] },
        { label: "Subcategory", field: "subcategory_name", fallback: ["subcat_name", "sub_category"] },
        { label: "Item Name", field: "item_name", fallback: ["name", "product_name"] },
        { label: "Quantity", field: "quantity", fallback: ["qty"] },
        { label: "Total", field: "total_price", fallback: ["total", "total_amount"] },
    ];

    const categorySummaryColumns = [
        { label: "Category Name", field: "category_name" },
        { label: "Total Quantity", field: "total_quantity" },
        { label: "Total Amount", field: "total_amount" },
    ];

    const subcategorySummaryColumns = [
        { label: "Subcategory Name", field: "subcategory_name" },
        { label: "Total Quantity", field: "total_quantity" },
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
        // Use originalData (ungrouped) to get category IDs, apply filters first
        const dataToSummarize = filteredData.length > 0 ? originalData.filter(item => {
            // Re-apply current filters to original data for summary
            const itemName = item.item_name || item.name || item.product_name || "";
            if (formdata.name && !itemName.toLowerCase().includes(formdata.name.toLowerCase())) return false;
            
            const categoryId = item.catid || item.category_id || item.cat_id;
            if (selectedCatId && categoryId?.toString() !== selectedCatId.toString()) return false;
            
            const subcategoryId = item.subcatid || item.subcategory_id || item.subcat_id;
            if (selectedSubCatId && subcategoryId?.toString() !== selectedSubCatId.toString()) return false;
            
            const tableCategoryId = item.table_cat_id || item.table_category_id;
            if (selectedTableCatId && tableCategoryId?.toString() !== selectedTableCatId.toString()) return false;
            
            if (startDate || endDate) {
                const dateField = item.setup_date || item.created_at || item.date || item.order_date;
                if (!dateField) return false;
                const itemDate = new Date(dateField.split('T')[0] + 'T00:00:00');
                const start = startDate ? new Date(startDate + 'T00:00:00') : null;
                const end = endDate ? new Date(endDate + 'T23:59:59') : null;
                if ((start && itemDate < start) || (end && itemDate > end)) return false;
            }
            
            return true;
        }) : originalData;
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
        // Use originalData (ungrouped) to get subcategory IDs, apply filters first
        const dataToSummarize = filteredData.length > 0 ? originalData.filter(item => {
            const itemName = item.item_name || item.name || item.product_name || "";
            if (formdata.name && !itemName.toLowerCase().includes(formdata.name.toLowerCase())) return false;
            
            const categoryId = item.catid || item.category_id || item.cat_id;
            if (selectedCatId && categoryId?.toString() !== selectedCatId.toString()) return false;
            
            const subcategoryId = item.subcatid || item.subcategory_id || item.subcat_id;
            if (selectedSubCatId && subcategoryId?.toString() !== selectedSubCatId.toString()) return false;
            
            const tableCategoryId = item.table_cat_id || item.table_category_id;
            if (selectedTableCatId && tableCategoryId?.toString() !== selectedTableCatId.toString()) return false;
            
            if (startDate || endDate) {
                const dateField = item.setup_date || item.created_at || item.date || item.order_date;
                if (!dateField) return false;
                const itemDate = new Date(dateField.split('T')[0] + 'T00:00:00');
                const start = startDate ? new Date(startDate + 'T00:00:00') : null;
                const end = endDate ? new Date(endDate + 'T23:59:59') : null;
                if ((start && itemDate < start) || (end && itemDate > end)) return false;
            }
            
            return true;
        }) : originalData;
        const summaryMap = {};

        console.log("=== SUBCATEGORY SUMMARY DEBUG ===");
        console.log("Data to summarize count:", dataToSummarize.length);
        console.log("Available subcategories:", subcategories);

        dataToSummarize.forEach(item => {
            const subcategoryId = item.subcatid || item.subcategory_id || item.subcat_id;
            if (!subcategoryId) return;

            // Try to find subcategory name from the loaded subcategories OR from the item's data itself
            let subcatName = item.subcategory_name || item.subcat_name || item.sub_category || '';
            
            if (!subcatName && subcategories.length > 0) {
                const subcategory = subcategories.find(sub => sub.id.toString() === subcategoryId.toString());
                subcatName = subcategory ? subcategory.subcat : '';
            }
            
            // If still not found, use fallback
            if (!subcatName) {
                subcatName = `Unknown (ID: ${subcategoryId})`;
            }

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
        // Use originalData (ungrouped) to get table category IDs, apply filters first
        const dataToSummarize = filteredData.length > 0 ? originalData.filter(item => {
            const itemName = item.item_name || item.name || item.product_name || "";
            if (formdata.name && !itemName.toLowerCase().includes(formdata.name.toLowerCase())) return false;
            
            const categoryId = item.catid || item.category_id || item.cat_id;
            if (selectedCatId && categoryId?.toString() !== selectedCatId.toString()) return false;
            
            const subcategoryId = item.subcatid || item.subcategory_id || item.subcat_id;
            if (selectedSubCatId && subcategoryId?.toString() !== selectedSubCatId.toString()) return false;
            
            const tableCategoryId = item.table_cat_id || item.table_category_id;
            if (selectedTableCatId && tableCategoryId?.toString() !== selectedTableCatId.toString()) return false;
            
            if (startDate || endDate) {
                const dateField = item.setup_date || item.created_at || item.date || item.order_date;
                if (!dateField) return false;
                const itemDate = new Date(dateField.split('T')[0] + 'T00:00:00');
                const start = startDate ? new Date(startDate + 'T00:00:00') : null;
                const end = endDate ? new Date(endDate + 'T23:59:59') : null;
                if ((start && itemDate < start) || (end && itemDate > end)) return false;
            }
            
            return true;
        }) : originalData;
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

    // Group data by item name
    const groupByItemName = (dataToGroup) => {
        const grouped = {};
        
        dataToGroup.forEach(item => {
            const itemName = item.item_name || item.name || item.product_name;
            if (!itemName) return;
            
            if (!grouped[itemName]) {
                grouped[itemName] = {
                    item_name: itemName,
                    category_name: item.category_name || item.cat_name || '',
                    subcategory_name: item.subcategory_name || item.subcat_name || '',
                    table_category_name: item.table_category_name || item.table_cat_name || '',
                    quantity: 0,
                    total_price: 0,
                    vat_amount: 0,
                    uom: item.uom || item.unit || '',
                    vat_rate: item.vat_rate || item.cgst || item.tax_rate || 0,
                    // Store IDs for summary generation
                    catid: item.catid || item.category_id || item.cat_id,
                    subcatid: item.subcatid || item.subcategory_id || item.subcat_id,
                    table_cat_id: item.table_cat_id || item.table_category_id
                };
            }
            
            grouped[itemName].quantity += parseFloat(item.quantity || item.qty || 0);
            grouped[itemName].total_price += parseFloat(item.total_price || item.total || item.total_amount || 0);
            grouped[itemName].vat_amount += parseFloat(item.vat_amount || item.tax_amount || 0);
        });
        
        return Object.values(grouped);
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
        if (originalData.length === 0) return;
        
        // Validate date range
        if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
            toast.error("Invalid date range: Start date must be before end date");
            return;
        }
        
        console.log("=== FILTER DEBUG INFO ===");
        console.log("Total original data items:", originalData.length);
        console.log("Data sample:", originalData[0]);
        console.log("Current filters:", {
            startDate,
            endDate,
            itemName: formdata.name,
            selectedCatId,
            selectedSubCatId,
            selectedTableCatId
        });
        
        const filtered = originalData.filter(item => {
            // Date filter
            if (startDate || endDate) {
                const dateField = item.setup_date || item.created_at || item.date || item.order_date;
                if (!dateField) return false;

                let itemDate;
                try {
                    let dateString = dateField;
                    
                    if (dateString.includes('T')) {
                        dateString = dateString.split('T')[0];
                    }
                    
                    if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
                        itemDate = new Date(dateString + 'T00:00:00');
                    } else {
                        itemDate = new Date(dateString);
                    }
                    
                    if (isNaN(itemDate.getTime())) {
                        return false;
                    }
                } catch (e) {
                    return false;
                }
                
                const start = startDate ? new Date(startDate + 'T00:00:00') : null;
                const end = endDate ? new Date(endDate + 'T23:59:59') : null;

                if ((start && itemDate < start) || (end && itemDate > end)) {
                    return false;
                }
            }

            // Item name filter
            const itemName = item.item_name || item.name || item.product_name || "";
            if (formdata.name && !itemName.toLowerCase().includes(formdata.name.toLowerCase())) {
                return false;
            }

            // Category filter
            const categoryId = item.catid || item.category_id || item.cat_id;
            if (selectedCatId && categoryId?.toString() !== selectedCatId.toString()) {
                return false;
            }

            // Subcategory filter
            const subcategoryId = item.subcatid || item.subcategory_id || item.subcat_id;
            if (selectedSubCatId && subcategoryId?.toString() !== selectedSubCatId.toString()) {
                return false;
            }

            // Table category filter
            const tableCategoryId = item.table_cat_id || item.table_category_id;
            if (selectedTableCatId && tableCategoryId?.toString() !== selectedTableCatId.toString()) {
                return false;
            }

            return true;
        });

        console.log("=== FILTER RESULTS ===");
        console.log(`Filtered ${filtered.length} items from ${originalData.length} total`);
        
        // Group the filtered data by item name
        const groupedFiltered = groupByItemName(filtered);
        console.log(`Grouped into ${groupedFiltered.length} unique items`);
        
        setFilteredData(groupedFiltered);
        toast.success(`Found ${groupedFiltered.length} items matching your filters`);
    };

    // Clear filters
    const clearFilters = () => {
        setStartDate("");
        setEndDate("");
        setFormData({ name: "" });
        setSelectedCatId("");
        setSelectedSubCatId("");
        setSelectedTableCatId("");
        const groupedData = groupByItemName(originalData);
        setFilteredData(groupedData);
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

    // Thermal Print Function
    const printThermalReport = () => {
        const printData = showCategorySummary
            ? categorySummaryData
            : showSubcategorySummary
            ? subcategorySummaryData
            : showTableCategorySummary
            ? tableCategorySummaryData
            : (filteredData.length > 0 ? filteredData : data);

        const newWindow = window.open("", "_blank");
        
        let reportTitle = "Item-Wise VAT Summary";
        let tableHeaders = "";
        let tableRows = "";
        let totalQty = 0;
        let totalAmount = 0;

        if (showCategorySummary || showSubcategorySummary || showTableCategorySummary) {
            reportTitle = showCategorySummary ? "Category VAT Summary" 
                        : showSubcategorySummary ? "Subcategory VAT Summary" 
                        : "Table Category VAT Summary";
            
            tableHeaders = `
                <tr>
                    <th style="border-bottom: 1px solid #000; text-align: left; padding: 5px;">S.No.</th>
                    <th style="border-bottom: 1px solid #000; text-align: left; padding: 5px;">Name</th>
                    <th style="border-bottom: 1px solid #000; text-align: right; padding: 5px;">Qty</th>
                    <th style="border-bottom: 1px solid #000; text-align: right; padding: 5px;">Amount</th>
                </tr>
            `;

            printData.forEach((item, index) => {
                const name = item.category_name || item.subcategory_name || item.table_category_name || '';
                const qty = parseFloat(item.total_quantity || 0);
                const amount = parseFloat(item.total_amount || 0);
                totalQty += qty;
                totalAmount += amount;

                tableRows += `
                    <tr>
                        <td style="padding: 3px; text-align: left;">${index + 1}</td>
                        <td style="padding: 3px; text-align: left;">${name}</td>
                        <td style="padding: 3px; text-align: right;">${qty.toFixed(2)}</td>
                        <td style="padding: 3px; text-align: right;">฿${amount.toFixed(2)}</td>
                    </tr>
                `;
            });
        } else {
            tableHeaders = `
                <tr>
                    <th style="border-bottom: 1px solid #000; text-align: left; padding: 5px;">S.No.</th>
                    <th style="border-bottom: 1px solid #000; text-align: left; padding: 5px;">Item Name</th>
                    <th style="border-bottom: 1px solid #000; text-align: right; padding: 5px;">Qty</th>
                    <th style="border-bottom: 1px solid #000; text-align: right; padding: 5px;">Amount</th>
                </tr>
            `;

            printData.forEach((item, index) => {
                const itemName = item.item_name || item.name || item.product_name || '';
                const qty = parseFloat(item.quantity || item.qty || 0);
                const amount = parseFloat(item.total_price || item.total || item.total_amount || 0);
                totalQty += qty;
                totalAmount += amount;

                tableRows += `
                    <tr>
                        <td style="padding: 3px; text-align: left;">${index + 1}</td>
                        <td style="padding: 3px; text-align: left;">${itemName}</td>
                        <td style="padding: 3px; text-align: right;">${qty.toFixed(2)}</td>
                        <td style="padding: 3px; text-align: right;">฿${amount.toFixed(2)}</td>
                    </tr>
                `;
            });
        }

        newWindow.document.write(`
            <html>
            <head>
                <style>
                    body {
                        font-family: 'Arial', 'Helvetica', sans-serif;
                        font-size: 12pt;
                        width: 80mm;
                        margin: 0;
                        padding: 5px 2px;
                    }
                    .header {
                        text-align: center;
                        margin-bottom: 10px;
                        border-bottom: 2px solid #000;
                        padding-bottom: 8px;
                    }
                    .header h2 {
                        margin: 5px 0;
                        font-size: 16pt;
                        font-weight: bold;
                        letter-spacing: 0.5px;
                    }
                    .header p {
                        margin: 3px 0;
                        font-size: 10pt;
                        line-height: 1.4;
                    }
                    table {
                        width: 100%;
                        border-collapse: collapse;
                        margin: 8px 0;
                    }
                    table th {
                        border-bottom: 1px solid #000;
                        padding: 5px 2px;
                        text-align: left;
                        font-size: 11pt;
                        font-weight: bold;
                    }
                    table td {
                        padding: 4px 2px;
                        font-size: 11pt;
                    }
                    .summary {
                        border-top: 2px solid #000;
                        margin-top: 8px;
                        padding-top: 6px;
                    }
                    .summary div {
                        display: flex;
                        justify-content: space-between;
                        padding: 4px 0;
                        font-weight: bold;
                        font-size: 11pt;
                    }
                    .footer {
                        text-align: center;
                        margin-top: 10px;
                        font-size: 10pt;
                        border-top: 1px solid #000;
                        padding-top: 5px;
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <h2>${companyInfo.name || 'Restaurant Name'}</h2>
                    <p>${companyInfo.address || ''}</p>
                    <p>Tax ID: ${companyInfo.tax_id || ''}</p>
                    <p><strong>${reportTitle}</strong></p>
                    <p>Date: ${format(new Date(), 'yyyy-MM-dd HH:mm:ss')}</p>
                    ${startDate && endDate ? `<p>Period: ${startDate} to ${endDate}</p>` : ''}
                </div>

                <table>
                    <thead>
                        ${tableHeaders}
                    </thead>
                    <tbody>
                        ${tableRows}
                    </tbody>
                </table>

                <div class="summary">
                    <div>
                        <span>Total Quantity:</span>
                        <span>${totalQty.toFixed(2)}</span>
                    </div>
                    <div>
                        <span>Total Amount:</span>
                        <span>฿${totalAmount.toFixed(2)}</span>
                    </div>
                </div>

                <div class="footer">
                    <p>Powered by ChefMate POS</p>
                    <p>Thank you!</p>
                </div>
            </body>
            </html>
        `);

        newWindow.document.close();
        setTimeout(() => {
            newWindow.print();
            newWindow.close();
        }, 250);
    };

    // Data fetching useEffects
    useEffect(() => {
        const fetchDataAndCategories = async () => {
            try {
                // Fetch company info for thermal printing
                const companyData = await fetchData("companyinfo", null, "id", {});
                if (companyData && companyData.length > 0) {
                    setCompanyInfo(companyData[0]);
                }

                // Try the VAT-specific endpoint first, fallback to GST endpoint
                let resData;
                try {
                    resData = await axios.get("/order_items_vat_joined", getHeaders());
                } catch (error) {
                    console.log("VAT endpoint not available, using GST endpoint");
                    resData = await axios.get("/order_items_gst_joined", getHeaders());
                }
                
                console.log("Fetched data sample:", resData.data[0]); // Debug log
                setOriginalData(resData.data); // Store original ungrouped data
                const groupedData = groupByItemName(resData.data);
                setData(groupedData);
                setFilteredData(groupedData);
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
                            <Row gutter={[16, 16]} style={{marginBottom: 20}}>
                                <Col xs={24} sm={12} md={6}>
                                    <label style={{display: 'block', marginBottom: '8px', fontWeight: 500}}>Start Date</label>
                                    <DatePicker
                                        style={{width: '100%'}}
                                        value={startDate ? dayjs(startDate) : null}
                                        onChange={(date, dateString) => setStartDate(dateString)}
                                        format="YYYY-MM-DD"
                                    />
                                </Col>
                                <Col xs={24} sm={12} md={6}>
                                    <label style={{display: 'block', marginBottom: '8px', fontWeight: 500}}>End Date</label>
                                    <DatePicker
                                        style={{width: '100%'}}
                                        value={endDate ? dayjs(endDate) : null}
                                        onChange={(date, dateString) => setEndDate(dateString)}
                                        format="YYYY-MM-DD"
                                    />
                                </Col>
                                <Col xs={24} sm={12} md={6}>
                                    <label style={{display: 'block', marginBottom: '8px', fontWeight: 500}}>Item Name</label>
                                    <Input
                                        placeholder="Enter item name"
                                        value={formdata.name}
                                        onChange={(e) => setFormData({ ...formdata, name: e.target.value })}
                                    />
                                </Col>
                                <Col xs={24} sm={12} md={6}>
                                    <label style={{display: 'block', marginBottom: '8px', fontWeight: 500}}>Category</label>
                                    <Select
                                        style={{width: '100%'}}
                                        placeholder="All Categories"
                                        value={selectedCatId || undefined}
                                        onChange={(value) => setSelectedCatId(value || "")}
                                        allowClear
                                    >
                                        {categories.map(cat => (
                                            <Option key={cat.id} value={cat.id}>{cat.name}</Option>
                                        ))}
                                    </Select>
                                </Col>
                                <Col xs={24} sm={12} md={6}>
                                    <label style={{display: 'block', marginBottom: '8px', fontWeight: 500}}>Subcategory</label>
                                    <Select
                                        style={{width: '100%'}}
                                        placeholder="All Subcategories"
                                        value={selectedSubCatId || undefined}
                                        onChange={(value) => setSelectedSubCatId(value || "")}
                                        allowClear
                                    >
                                        {subcategories.map(sub => (
                                            <Option key={sub.id} value={sub.id}>{sub.subcat}</Option>
                                        ))}
                                    </Select>
                                </Col>
                                <Col xs={24} sm={12} md={6}>
                                    <label style={{display: 'block', marginBottom: '8px', fontWeight: 500}}>Table Category</label>
                                    <Select
                                        style={{width: '100%'}}
                                        placeholder="All Table Categories"
                                        value={selectedTableCatId || undefined}
                                        onChange={(value) => setSelectedTableCatId(value || "")}
                                        allowClear
                                    >
                                        {tableCategories.map(cat => (
                                            <Option key={cat.id} value={cat.id}>{cat.cat_name}</Option>
                                        ))}
                                    </Select>
                                </Col>
                            </Row>

                            {/* Action Buttons */}
                            <Divider />
                            <Space wrap style={{marginBottom: 16}}>
                                <Button type="primary" icon={<FilterOutlined />} onClick={applyFilter}>
                                    Apply Filter
                                </Button>
                                <Button icon={<ClearOutlined />} onClick={clearFilters}>
                                    Clear Filters
                                </Button>
                                <Button danger icon={<FilePdfOutlined />} onClick={exportPDF}>
                                    Export PDF
                                </Button>
                                <Button type="primary" style={{background: '#52c41a', borderColor: '#52c41a'}} icon={<FileExcelOutlined />} onClick={exportExcel}>
                                    Export Excel
                                </Button>
                                <Button type="primary" icon={<PrinterOutlined />} onClick={printThermalReport} style={{background: '#722ed1', borderColor: '#722ed1'}}>
                                    Print Thermal
                                </Button>
                            </Space>

                            {/* Summary Buttons */}
                            <Space wrap style={{marginBottom: 16}}>
                                <Button onClick={generateCategorySummary} style={{background: 'linear-gradient(45deg, #667eea 0%, #764ba2 100%)', border: 'none', color: 'white'}}>
                                    📊 Category Summary
                                </Button>
                                <Button onClick={generateSubcategorySummary} style={{background: 'linear-gradient(45deg, #f093fb 0%, #f5576c 100%)', border: 'none', color: 'white'}}>
                                    📈 Subcategory Summary
                                </Button>
                                <Button onClick={generateTableCategorySummary} style={{background: 'linear-gradient(45deg, #4facfe 0%, #00f2fe 100%)', border: 'none', color: 'white'}}>
                                    🏷️ Table Category Summary
                                </Button>
                            </Space>

                            {/* Back to Details Button */}
                            {(showCategorySummary || showSubcategorySummary || showTableCategorySummary) && (
                                <div style={{marginTop: 16}}>
                                    <Button
                                        onClick={() => {
                                            setShowCategorySummary(false);
                                            setShowSubcategorySummary(false);
                                            setShowTableCategorySummary(false);
                                        }}
                                    >
                                        ← Back to Item Details
                                    </Button>
                                </div>
                            )}
                        </CardComponent>
                    </div>

                    {/* Data Table Section */}
                    <div className="col-12">
                        <Card>
                            {data.length === 0 ? (
                                <p>No data available</p>
                            ) : (
                                <Table
                                    columns={
                                        (showCategorySummary
                                            ? categorySummaryColumns
                                            : showSubcategorySummary
                                            ? subcategorySummaryColumns
                                            : showTableCategorySummary
                                            ? tableCategorySummaryColumns
                                            : columns
                                        ).map(col => ({
                                            title: col.label,
                                            dataIndex: col.field,
                                            key: col.field,
                                            sorter: (a, b) => {
                                                const aVal = a[col.field];
                                                const bVal = b[col.field];
                                                if (typeof aVal === 'number') return aVal - bVal;
                                                return String(aVal || '').localeCompare(String(bVal || ''));
                                            },
                                            render: (text, record) => {
                                                // Format date field
                                                if (col.field === 'setup_date' && text) {
                                                    try {
                                                        const dateStr = text.split('T')[0];
                                                        return dateStr || text;
                                                    } catch (e) {
                                                        return text || '-';
                                                    }
                                                }
                                                return text || '-';
                                            }
                                        }))
                                    }
                                    dataSource={(
                                        showCategorySummary
                                            ? categorySummaryData
                                            : showSubcategorySummary
                                            ? subcategorySummaryData
                                            : showTableCategorySummary
                                            ? tableCategorySummaryData
                                            : filteredData
                                    )}
                                    rowKey={(record, index) => index}
                                    pagination={{
                                        pageSize: 50,
                                        showSizeChanger: true,
                                        showTotal: (total) => `Total ${total} items`,
                                        pageSizeOptions: ['10', '20', '50', '100']
                                    }}
                                    scroll={{ x: true }}
                                    size="small"
                                />
                            )}

                            {/* Summary Totals */}
                            <Divider />
                            <Row gutter={16}>
                                <Col xs={24} sm={8}>
                                    <Statistic 
                                        title="Total Items" 
                                        value={filteredData.length}
                                        prefix="📦"
                                    />
                                </Col>
                                <Col xs={24} sm={8}>
                                    <Statistic 
                                        title="Total Quantity"
                                        value={
                                            filteredData.reduce((acc, item) => {
                                                const qty = item.quantity || item.qty || item.total_quantity || 0;
                                                return acc + parseFloat(qty);
                                            }, 0)
                                        }
                                        precision={2}
                                    />
                                </Col>
                                <Col xs={24} sm={8}>
                                    <Statistic 
                                        title="Total VAT"
                                        value={
                                            filteredData.reduce((acc, item) => {
                                                const vatAmount = item.vat_amount || item.tax_amount || item.total_vat || 0;
                                                return acc + parseFloat(vatAmount);
                                            }, 0)
                                        }
                                        precision={2}
                                        prefix="฿"
                                        valueStyle={{color: '#cf1322'}}
                                    />
                                </Col>
                                <Col xs={24} sm={8}>
                                    <Statistic 
                                        title="Grand Total"
                                        value={
                                            filteredData.reduce((acc, item) => {
                                                const totalPrice = item.total_price || item.total || item.total_amount || 0;
                                                return acc + parseFloat(totalPrice);
                                            }, 0)
                                        }
                                        precision={2}
                                        prefix="฿"
                                        valueStyle={{color: '#3f8600', fontWeight: 'bold'}}
                                    />
                                </Col>
                            </Row>
                        </Card>
                    </div>
                </div>
            </Layout>
        </>
    );
}
