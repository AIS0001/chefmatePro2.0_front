/* eslint-disable no-undef */

import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { getHeaders } from "../../utility/getHeader";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { format } from "date-fns";
import jsPDF from "jspdf";
import "jspdf-autotable";
import * as XLSX from "xlsx";
import logo from "../../assets/logo.png"
import { fetchComboData } from "../../services/api";
import CardComponent from "../../components/cards/CardComponent";
import Header from "../../components/Header";
import Layout from "../../layout/Layout";
import fetchData from "../../functions/fetchData";
import { getUserName } from "../../functions/storageUtils";
import { Table, Button, DatePicker, Input, Select, Space, Card, Row, Col, Statistic, Divider, Checkbox } from "antd";
import { PrinterOutlined, FilePdfOutlined, FileExcelOutlined, FilterOutlined, ClearOutlined, DownOutlined, UpOutlined } from "@ant-design/icons";
import dayjs from "dayjs";

const { Option } = Select;

export default function ItemWiseSummaryVat() {
    const [data, setData] = useState([]);
    const [originalData, setOriginalData] = useState([]); // Store original ungrouped data
    const [categories, setCategories] = useState([]);
    const [subcategories, setSubcategories] = useState([]);
    const [tableCategories, setTableCategories] = useState([]);
    const [selectedCatId, setSelectedCatId] = useState("");
    const [selectedSubCatId, setSelectedSubCatId] = useState("");
    const [selectedTableCatId, setSelectedTableCatId] = useState("");
    const [billFilter, setBillFilter] = useState("all");
    const [showCancelledItems, setShowCancelledItems] = useState(false);
    const [filteredData, setFilteredData] = useState([]);
    const [finalBillById, setFinalBillById] = useState({});

    const [formdata, setFormData] = useState({
        name: "",
    });
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [quickStartDate, setQuickStartDate] = useState("");
    const [quickEndDate, setQuickEndDate] = useState("");
    const [quickCategoryId, setQuickCategoryId] = useState("");
    const [quickItemGroup, setQuickItemGroup] = useState("");
    const [quickSaleOnly, setQuickSaleOnly] = useState(false);
    const [quickEntertainmentOnly, setQuickEntertainmentOnly] = useState(false);
    const [useOrderItemsOnlyMode, setUseOrderItemsOnlyMode] = useState(false);
    const [oldFilterCollapsed, setOldFilterCollapsed] = useState(false);
    const [tablePageSize, setTablePageSize] = useState(10);
    const [tableCurrentPage, setTableCurrentPage] = useState(1);

    // Summary states
    const [showCategorySummary, setShowCategorySummary] = useState(false);
    const [showSubcategorySummary, setShowSubcategorySummary] = useState(false);
    const [showTableCategorySummary, setShowTableCategorySummary] = useState(false);
    const [categorySummaryData, setCategorySummaryData] = useState([]);
    const [subcategorySummaryData, setSubcategorySummaryData] = useState([]);
    const [tableCategorySummaryData, setTableCategorySummaryData] = useState([]);
    const [companyInfo, setCompanyInfo] = useState({});
    const [currentUser, setCurrentUser] = useState({ id: "-", name: "-", uname: "-" });
    const quickFilterAutoApplyInitializedRef = useRef(false);
    const suppressQuickAutoApplyRef = useRef(false);

    const invoiceColumns = [
        { label: "Inv. No.", field: "invoice_number", fallback: ["invoice_no", "bill_no"] },
        { label: "Date", field: "setup_date", fallback: ["created_at", "date", "order_date"] },
        { label: "Time", field: "created_at", fallback: ["inv_time", "time"] }
    ];

    // Column definitions for VAT-specific display
    const columns = [
        { label: "Category", field: "category_name", fallback: ["cat_name"] },
        { label: "Subcategory", field: "subcategory_name", fallback: ["subcat_name", "sub_category"] },
        { label: "Item Group", field: "item_group", fallback: ["itemGroup", "group_name"] },
        { label: "Item Name", field: "item_name", fallback: ["name", "product_name"] },
        { label: "Quantity", field: "quantity", fallback: ["qty"] },
        { label: "Total", field: "total_price", fallback: ["total", "total_amount"] },
    ];

    const billFilterColumns = [
        ...invoiceColumns,
        ...columns,
        { label: "Remark", field: "remark", fallback: ["remarks"] }
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
    const matchesBillFilter = (item) => {
        if (billFilter === "all") return true;

        const invoiceId = Number(item.invoice_number || item.invoice_no || item.bill_no || item.order_id);
        if (Number.isNaN(invoiceId)) return false;

        const bill = finalBillById[invoiceId];
        if (!bill) return false;

        if (billFilter === "entertainment") return bill.payment_mode === "Entertainment";
        if (billFilter === "cancelled") return Number(bill.status) === 2;
        if (billFilter === "sale") {
            return Number(bill.status) === 0 && bill.payment_mode !== "Entertainment";
        }

        return true;
    };

    const matchesFilters = (item) => {
        if (!matchesBillFilter(item)) return false;

        const searchTerm = (formdata.name || "").toString().trim().toLowerCase();
        if (searchTerm) {
            const itemName = (item.item_name || item.name || item.product_name || "").toString().toLowerCase();
            const invoiceNo = (item.invoice_number || item.invoice_no || item.bill_no || item.order_id || "").toString().toLowerCase();
            if (!itemName.includes(searchTerm) && !invoiceNo.includes(searchTerm)) return false;
        }

        const categoryId = item.catid || item.category_id || item.cat_id;
        if (selectedCatId) {
            const selectedCategory = categories.find(
                (cat) => cat.id?.toString() === selectedCatId.toString()
            );
            const selectedCategoryName = (selectedCategory?.name || "").toString().trim().toLowerCase();
            const itemCategoryName = (item.category_name || item.cat_name || "").toString().trim().toLowerCase();
            const hasCategoryMetadata =
                (categoryId !== undefined && categoryId !== null && String(categoryId).trim() !== "")
                || !!itemCategoryName;

            const matchesById = categoryId?.toString() === selectedCatId.toString();
            const matchesByName = selectedCategoryName && itemCategoryName && selectedCategoryName === itemCategoryName;

            if (hasCategoryMetadata && !matchesById && !matchesByName) return false;
        }

        const subcategoryId = item.subcatid || item.subcategory_id || item.subcat_id;
        if (selectedSubCatId) {
            const selectedSubcategory = subcategories.find(
                (sub) => sub.id?.toString() === selectedSubCatId.toString()
            );
            const selectedSubcategoryName = (selectedSubcategory?.subcat || "").toString().trim().toLowerCase();
            const itemSubcategoryName = (item.subcategory_name || item.subcat_name || item.sub_category || "").toString().trim().toLowerCase();

            const matchesById = subcategoryId?.toString() === selectedSubCatId.toString();
            const matchesByName = selectedSubcategoryName && itemSubcategoryName && selectedSubcategoryName === itemSubcategoryName;

            if (!matchesById && !matchesByName) return false;
        }

        const tableCategoryId = item.table_cat_id || item.table_category_id;
        if (selectedTableCatId) {
            const selectedTableCategory = tableCategories.find(
                (cat) => cat.id?.toString() === selectedTableCatId.toString()
            );
            const selectedTableCategoryName = (selectedTableCategory?.cat_name || "").toString().trim().toLowerCase();
            const itemTableCategoryName = (item.table_category_name || item.table_cat_name || "").toString().trim().toLowerCase();

            const matchesById = tableCategoryId?.toString() === selectedTableCatId.toString();
            const matchesByName = selectedTableCategoryName && itemTableCategoryName && selectedTableCategoryName === itemTableCategoryName;

            if (!matchesById && !matchesByName) return false;
        }

        if (startDate || endDate) {
            const dateField = item.setup_date || item.created_at || item.date || item.order_date;
            if (!dateField) return false;
            const itemDate = new Date(dateField.split('T')[0] + 'T00:00:00');
            const start = startDate ? new Date(startDate + 'T00:00:00') : null;
            const end = endDate ? new Date(endDate + 'T23:59:59') : null;
            if ((start && itemDate < start) || (end && itemDate > end)) return false;
        }

        return true;
    };

    const toNumber = (value) => {
        if (value === null || value === undefined || value === "") return 0;
        if (typeof value === "number") return Number.isFinite(value) ? value : 0;

        const cleaned = String(value).replace(/,/g, "").replace(/[^0-9.-]/g, "");
        const parsed = Number(cleaned);
        return Number.isFinite(parsed) ? parsed : 0;
    };

    const isCancelledOrderItem = (item = {}) => {
        const normalized = String(item?.status ?? "").trim().toLowerCase();
        return Number(item?.status) === 2 || normalized === "2" || normalized === "cancelled";
    };

    const normalizeItemGroup = (value = "") => String(value || "").trim().toLowerCase();

    const isEntertainmentPaymentMode = (paymentMode = "") =>
        String(paymentMode || "").trim().toLowerCase().includes("entertainment");

    const getOrderItemBill = (item = {}) => {
        const invoiceCandidates = [
            item.final_bill_id,
            item.finalbill_id,
            item.bill_id,
            item.invoice_number,
            item.invoice_no,
            item.bill_no,
            item.order_id,
        ];

        for (const candidate of invoiceCandidates) {
            const invoiceId = Number(candidate);
            if (Number.isNaN(invoiceId)) continue;

            const bill = finalBillById[invoiceId];
            if (bill) return bill;
        }

        return null;
    };

    const isCancelledBill = (bill = {}) => {
        const normalized = String(bill?.status ?? "").trim().toLowerCase();
        return Number(bill?.status) === 2 || normalized === "2" || normalized === "cancelled";
    };

    const getRecordDateText = (item = {}, bill = null) => {
        const rawDate =
            item.setup_date ||
            item.created_at ||
            item.date ||
            bill?.setup_date ||
            bill?.created_at ||
            bill?.date;

        if (!rawDate) return "";
        return String(rawDate).split("T")[0];
    };

    const isCancelledRecord = (item = {}) => {
        const bill = getOrderItemBill(item);
        if (bill) {
            return isCancelledBill(bill);
        }

        return isCancelledOrderItem(item);
    };

    const applyCancelledItemsToggle = (items = []) => {
        if (showCancelledItems) {
            return items.filter((item) => isCancelledRecord(item));
        }

        return items.filter((item) => !isCancelledRecord(item));
    };

    const isSummaryViewActive = () => showCategorySummary || showSubcategorySummary || showTableCategorySummary;

    const getVisibleTableData = () => {
        if (showCategorySummary) return categorySummaryData;
        if (showSubcategorySummary) return subcategorySummaryData;
        if (showTableCategorySummary) return tableCategorySummaryData;
        if (useOrderItemsOnlyMode) return filteredData;
        return billFilter !== "all" ? originalData.filter(matchesFilters) : filteredData;
    };

    const getLogoAsJpegDataUrl = (imageSrc) => {
        return new Promise((resolve, reject) => {
            if (!imageSrc) {
                reject(new Error("Logo source is empty"));
                return;
            }

            const img = new Image();
            img.crossOrigin = "anonymous";

            img.onload = () => {
                try {
                    const canvas = document.createElement("canvas");
                    canvas.width = img.naturalWidth || img.width;
                    canvas.height = img.naturalHeight || img.height;

                    const ctx = canvas.getContext("2d");
                    if (!ctx) {
                        reject(new Error("Could not get canvas context"));
                        return;
                    }

                    ctx.fillStyle = "#FFFFFF";
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                    ctx.drawImage(img, 0, 0);

                    const jpegDataUrl = canvas.toDataURL("image/jpeg", 0.95);
                    resolve(jpegDataUrl);
                } catch (err) {
                    reject(err);
                }
            };

            img.onerror = () => reject(new Error("Failed to load logo image"));
            img.src = imageSrc;
        });
    };

    const generateCategorySummary = () => {
        // Use originalData (ungrouped) to get category IDs, apply filters first
        const dataToSummarize = originalData.filter(matchesFilters);
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
            const quantity = toNumber(item.quantity || item.qty || 0);
            const vatAmount = toNumber(item.vat_amount || item.tax_amount || 0);
            const totalAmount = toNumber(item.total_price || item.total || item.total_amount || 0);

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
        const dataToSummarize = originalData.filter(matchesFilters);
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
            const quantity = toNumber(item.quantity || item.qty || 0);
            const vatAmount = toNumber(item.vat_amount || item.tax_amount || 0);
            const totalAmount = toNumber(item.total_price || item.total || item.total_amount || 0);

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
        const dataToSummarize = originalData.filter(matchesFilters);
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
            const quantity = toNumber(item.quantity || item.qty || 0);
            const vatAmount = toNumber(item.vat_amount || item.tax_amount || 0);
            const totalAmount = toNumber(item.total_price || item.total || item.total_amount || 0);

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

    const handleGroupByItemName = () => {
        const dataToGroup = originalData.filter(matchesFilters);
        const groupedData = groupByItemName(dataToGroup);
        setFilteredData(groupedData);
        setShowCategorySummary(false);
        setShowSubcategorySummary(false);
        setShowTableCategorySummary(false);
        toast.success(`Grouped ${groupedData.length} items by name`);
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
            
            grouped[itemName].quantity += toNumber(item.quantity || item.qty || 0);
            grouped[itemName].total_price += toNumber(item.total_price || item.total || item.total_amount || 0);
            grouped[itemName].vat_amount += toNumber(item.vat_amount || item.tax_amount || 0);
        });
        
        return Object.values(grouped);
    };

    const getOrderItemUniqueKey = (item = {}) => {
        const explicitId = item.order_item_id
            || item.order_items_id
            || item.orderitems_id
            || item.oi_id
            || item.id;

        if (explicitId !== undefined && explicitId !== null && String(explicitId).trim() !== "") {
            return `id:${String(explicitId)}`;
        }

        const invoice = item.invoice_number || item.invoice_no || item.bill_no || item.order_id || "";
        const itemId = item.item_id || item.product_id || item.menu_item_id || "";
        const itemName = item.item_name || item.name || item.product_name || "";
        const quantity = item.quantity ?? item.qty ?? "";
        const total = item.total_price ?? item.total ?? item.total_amount ?? "";
        const createdAt = item.created_at || item.setup_date || "";

        return `sig:${invoice}|${itemId}|${itemName}|${quantity}|${total}|${createdAt}`;
    };

    const deduplicateOrderItems = (items = []) => {
        const uniqueMap = new Map();

        items.forEach((item) => {
            const key = getOrderItemUniqueKey(item);
            if (!uniqueMap.has(key)) {
                uniqueMap.set(key, item);
            }
        });

        return Array.from(uniqueMap.values());
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

        setUseOrderItemsOnlyMode(false);
        
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
        
        const filtered = originalData.filter(matchesFilters);

        console.log("=== FILTER RESULTS ===");
        console.log(`Filtered ${filtered.length} items from ${originalData.length} total`);
        
        // Group the filtered data by item name
        const groupedFiltered = groupByItemName(filtered);
        console.log(`Grouped into ${groupedFiltered.length} unique items`);

        // Force detail grouped-by-item mode when category-style filters are active
        if (selectedCatId || selectedSubCatId || selectedTableCatId) {
            setShowCategorySummary(false);
            setShowSubcategorySummary(false);
            setShowTableCategorySummary(false);
        }
        
        setFilteredData(groupedFiltered);
        setTableCurrentPage(1);
        toast.success(`Found ${groupedFiltered.length} items matching your filters`);
    };

    const applyOrderItemsItemWiseFilter = async (showToast = true) => {
        try {
            if (quickStartDate && quickEndDate && new Date(quickStartDate) > new Date(quickEndDate)) {
                if (showToast) {
                    toast.error("Invalid date range: Start date must be before end date");
                }
                return;
            }

            const orderItems = await fetchData("order_items", null, "id", {});
            const rows = Array.isArray(orderItems) ? orderItems : [];
            const sourceRows = applyCancelledItemsToggle(rows);

            const filteredRows = sourceRows.filter((item) => {
                const bill = getOrderItemBill(item);

                if (quickSaleOnly || quickEntertainmentOnly) {
                    if (!bill) {
                        return false;
                    }

                    const billStatus = Number(bill.status);
                    const isEntertainmentBill = isEntertainmentPaymentMode(
                        bill.payment_mode || bill.payment_method || ""
                    );
                    const isSaleBill = billStatus === 0 && !isEntertainmentBill;

                    if (quickSaleOnly && quickEntertainmentOnly) {
                        if (!isSaleBill && !isEntertainmentBill) {
                            return false;
                        }
                    } else if (quickSaleOnly && !isSaleBill) {
                        return false;
                    } else if (quickEntertainmentOnly && !isEntertainmentBill) {
                        return false;
                    }
                }

                const categoryId = item.catid || item.category_id || item.cat_id;

                if (quickCategoryId && String(categoryId) !== String(quickCategoryId)) {
                    return false;
                }

                if (quickItemGroup) {
                    const itemGroup = normalizeItemGroup(item.item_group || item.itemGroup || item.group_name);
                    if (itemGroup !== normalizeItemGroup(quickItemGroup)) {
                        return false;
                    }
                }

                if (quickStartDate || quickEndDate) {
                    const dateText = getRecordDateText(item, bill);
                    if (!dateText) return false;
                    if (quickStartDate && dateText < quickStartDate) return false;
                    if (quickEndDate && dateText > quickEndDate) return false;
                }

                return true;
            });

            const groupedMap = {};

            filteredRows.forEach((item) => {
                const itemName = item.item_name || item.name || item.product_name;
                if (!itemName) return;

                const categoryId = item.catid || item.category_id || item.cat_id || null;
                const subcategoryId = item.subcatid || item.subcategory_id || item.subcat_id || null;
                const itemGroup = item.item_group || item.itemGroup || item.group_name || "";
                const groupKey = `${itemName}__${categoryId || ""}__${subcategoryId || ""}__${normalizeItemGroup(itemGroup)}`;

                if (!groupedMap[groupKey]) {
                    const category = categories.find((cat) => String(cat.id) === String(categoryId));
                    groupedMap[groupKey] = {
                        item_name: itemName,
                        item_group: itemGroup,
                        category_name: category?.name || "",
                        subcategory_name: "",
                        quantity: 0,
                        total_price: 0,
                        vat_amount: 0,
                        catid: categoryId,
                        subcatid: subcategoryId,
                    };
                }

                groupedMap[groupKey].quantity += toNumber(item.quantity || item.qty || 0);
                groupedMap[groupKey].total_price += toNumber(item.total_price || item.total || item.total_amount || 0);
                groupedMap[groupKey].vat_amount += toNumber(item.vat_amount || item.tax_amount || 0);
            });

            const groupedData = Object.values(groupedMap);
            setFilteredData(groupedData);
            setData(groupedData);
            setUseOrderItemsOnlyMode(true);
            setShowCategorySummary(false);
            setShowSubcategorySummary(false);
            setShowTableCategorySummary(false);
            setTableCurrentPage(1);

            if (showToast) {
                toast.success(`Loaded ${groupedData.length} item-wise records from order_items`);
            }
        } catch (error) {
            console.error("Error loading order_items item-wise records:", error);
            if (showToast) {
                toast.error("Failed to load order_items records");
            }
        }
    };

    const clearOrderItemsItemWiseFilter = () => {
        suppressQuickAutoApplyRef.current = true;
        setQuickStartDate("");
        setQuickEndDate("");
        setQuickCategoryId("");
        setQuickItemGroup("");
        setQuickSaleOnly(false);
        setQuickEntertainmentOnly(false);
        setUseOrderItemsOnlyMode(false);

        const groupedData = groupByItemName(originalData);
        setData(groupedData);
        setFilteredData(groupedData);
        setTableCurrentPage(1);
    };

    useEffect(() => {
        if (!quickFilterAutoApplyInitializedRef.current) {
            quickFilterAutoApplyInitializedRef.current = true;
            return;
        }

        if (suppressQuickAutoApplyRef.current) {
            suppressQuickAutoApplyRef.current = false;
            return;
        }

        applyOrderItemsItemWiseFilter(false);
    }, [
        quickStartDate,
        quickEndDate,
        quickCategoryId,
        quickItemGroup,
        quickSaleOnly,
        quickEntertainmentOnly,
        showCancelledItems,
    ]);

    // Clear filters
    const clearFilters = () => {
        setStartDate("");
        setEndDate("");
        setFormData({ name: "" });
        setSelectedCatId("");
        setSelectedSubCatId("");
        setSelectedTableCatId("");
        setBillFilter("all");
        setShowCancelledItems(false);
        setUseOrderItemsOnlyMode(false);
        const groupedData = groupByItemName(originalData);
        setFilteredData(groupedData);
        setShowCategorySummary(false);
        setShowSubcategorySummary(false);
        setShowTableCategorySummary(false);
        setCategorySummaryData([]);
        setSubcategorySummaryData([]);
        setTableCategorySummaryData([]);
        setTableCurrentPage(1);
    };

    const getColumnDisplayValue = (field, record) => {
        if (field === 'invoice_number') {
            return record.invoice_number || record.invoice_no || record.bill_no || record.order_id || '-';
        }

        if (field === 'setup_date') {
            const dateValue = record.setup_date || record.created_at || record.date || record.order_date;
            if (!dateValue) return '-';
            try {
                return String(dateValue).split('T')[0] || dateValue;
            } catch (e) {
                return dateValue || '-';
            }
        }

        if (field === 'created_at') {
            const timeValue = record.created_at || record.inv_time || record.time;
            if (!timeValue) return '-';
            try {
                const dateObj = new Date(timeValue);
                if (!isNaN(dateObj.getTime())) {
                    return format(dateObj, 'HH:mm:ss');
                }
                const timePart = String(timeValue).split('T')[1];
                return timePart ? timePart.split('.')[0] : String(timeValue);
            } catch (e) {
                return timeValue || '-';
            }
        }

        if (field === 'remark') {
            const invoiceId = Number(record.invoice_number || record.invoice_no || record.bill_no || record.order_id);
            if (Number.isNaN(invoiceId)) return '-';
            const bill = finalBillById[invoiceId];
            return bill?.remark || '-';
        }

        return record[field] ?? '-';
    };

    const getCurrentTableColumns = () => {
        if (showCategorySummary) return categorySummaryColumns;
        if (showSubcategorySummary) return subcategorySummaryColumns;
        if (showTableCategorySummary) return tableCategorySummaryColumns;
        if (shouldUseGroupedItemView) return columns;
        if (billFilter !== "all") return billFilterColumns;
        return columns;
    };

    const getCurrentTableData = () => {
        if (showCategorySummary) return categorySummaryData;
        if (showSubcategorySummary) return subcategorySummaryData;
        if (showTableCategorySummary) return tableCategorySummaryData;
        return detailData;
    };

    // Export to PDF
    const exportPDF = async () => {
        const doc = new jsPDF();
        const exportData = getCurrentTableData();
        const activeColumns = getCurrentTableColumns();
        const summaryView = isSummaryViewActive();

        const generatedAt = new Date();
        const generatedDay = format(generatedAt, "EEEE");
        const generatedDate = format(generatedAt, "yyyy-MM-dd");
        const generatedTime = format(generatedAt, "HH:mm:ss");
        const userName = currentUser.name || currentUser.uname || getUserName() || "-";
        const userId = currentUser.id || currentUser.uname || getUserName() || "-";

        // Add logo using canvas->JPEG conversion to avoid PNG parsing issues in jsPDF
        try {
            const logoJpegDataUrl = await getLogoAsJpegDataUrl(logo);
            doc.addImage(logoJpegDataUrl, "JPEG", 150, 5, 40, 15);
        } catch (logoErr) {
            console.warn("Logo conversion failed, trying direct PNG add...", logoErr);
            try {
                doc.addImage(logo, "PNG", 150, 5, 40, 15);
            } catch (pngErr) {
                console.error("Failed to add logo to PDF:", pngErr);
                toast.error("Unable to render logo in PDF");
            }
        }

        const filterLabel = billFilter === "cancelled"
            ? "Cancel Report"
            : billFilter === "entertainment"
            ? "Entertainment Item Report"
            : billFilter === "sale"
            ? "Sale Items Report"
            : "Item Wise VAT Summary";

        doc.setFont("helvetica", "bold");
        doc.setFontSize(18);
        doc.text(filterLabel, 14, 18);

        doc.setLineWidth(0.3);
        doc.line(14, 22, 196, 22);

        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.text("Generated Day:", 14, 28);
        doc.text("Generated Date:", 14, 33);
        doc.text("Generated Time:", 14, 38);
        doc.text("User ID:", 110, 28);
        doc.text("Username:", 110, 33);

        doc.setFont("helvetica", "normal");
        doc.text(generatedDay, 48, 28);
        doc.text(generatedDate, 48, 33);
        doc.text(generatedTime, 48, 38);
        doc.text(String(userId), 130, 28);
        doc.text(String(userName), 130, 33);

        const tableColumn = activeColumns.map((col) => col.label);

        const tableRows = [];
        let grandTotal = 0;

        exportData.forEach((item) => {
            const row = activeColumns.map((col) => getColumnDisplayValue(col.field, item));
            tableRows.push(row);

            if (summaryView) {
                grandTotal += toNumber(item.total_amount || 0);
            } else {
                grandTotal += toNumber(item.total_price || item.total || item.total_amount || 0);
            }
        });

        doc.autoTable({
            startY: 46,
            head: [tableColumn],
            body: tableRows,
        });

        const finalY = doc.autoTable.previous.finalY + 10;

        doc.setFontSize(12);
        doc.text("Summary", 14, finalY);
        doc.text(`Total Amount: ${grandTotal.toFixed(2)}`, 14, finalY + 8);

        doc.save("itemwise_vat_summary.pdf");
    };

    // Export to Excel
    const exportExcel = () => {
        const exportData = getCurrentTableData();
        const activeColumns = getCurrentTableColumns();
        const summaryView = isSummaryViewActive();
        
        const generatedAt = new Date();
        const generatedDay = format(generatedAt, "EEEE");
        const generatedDate = format(generatedAt, "yyyy-MM-dd");
        const generatedTime = format(generatedAt, "HH:mm:ss");
        const userName = currentUser.name || currentUser.uname || getUserName() || "-";
        const userId = currentUser.id || currentUser.uname || getUserName() || "-";

        const headerRow = activeColumns.map((col) => col.label);
        const dataRows = exportData.map((item) => activeColumns.map((col) => getColumnDisplayValue(col.field, item)));

        const worksheetData = [
            ["Logo", "See PDF export for embedded logo"],
            ["Generated Day", generatedDay],
            ["Generated Date", generatedDate],
            ["Generated Time", generatedTime],
            ["User ID", userId],
            ["Username", userName],
            [],
            headerRow,
            ...dataRows,
        ];

        // Add summary row
        const grandTotal = exportData.reduce((acc, item) => {
            const totalPrice = summaryView
                ? item.total_amount
                : (item.total_price || item.total || item.total_amount);
            return acc + toNumber(totalPrice || 0);
        }, 0);
        
        const totalLabelRow = ["TOTALS", grandTotal.toFixed(2)];
        worksheetData.push([]);
        worksheetData.push(totalLabelRow);

        const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
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
                const qty = toNumber(item.total_quantity || 0);
                const amount = toNumber(item.total_amount || 0);
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
                const qty = toNumber(item.quantity || item.qty || 0);
                const amount = toNumber(item.total_price || item.total || item.total_amount || 0);
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

                const storedUname = getUserName();
                const usersData = await fetchData("users", null, "id", {});
                if (Array.isArray(usersData) && usersData.length > 0) {
                    const matchedUser = usersData.find(user => {
                        if (storedUname && user.uname === storedUname) return true;
                        if (storedUname && user.name === storedUname) return true;
                        if (storedUname && String(user.id) === String(storedUname)) return true;
                        return false;
                    });
                    const resolvedUser = matchedUser || {};
                    setCurrentUser({
                        id: resolvedUser.id || "-",
                        name: resolvedUser.name || resolvedUser.uname || storedUname || "-",
                        uname: resolvedUser.uname || storedUname || "-"
                    });
                } else {
                    setCurrentUser({ id: "-", name: storedUname || "-", uname: storedUname || "-" });
                }

                const finalBillData = await fetchData("final_bill", null, "id", {});
                if (Array.isArray(finalBillData)) {
                    const billMap = {};
                    finalBillData.forEach(bill => {
                        const billId = Number(bill.id);
                        if (!Number.isNaN(billId)) {
                            billMap[billId] = bill;
                        }
                    });
                    setFinalBillById(billMap);
                }

                // Try the VAT-specific endpoint first, fallback to GST endpoint
                let resData;
                try {
                    resData = await axios.get("/order_items_vat_joined", getHeaders());
                } catch (error) {
                    console.log("VAT endpoint not available, using GST endpoint");
                    resData = await axios.get("/order_items_gst_joined", getHeaders());
                }
                
                const rawItems = Array.isArray(resData.data) ? resData.data : [];
                const sourceItems = applyCancelledItemsToggle(rawItems);
                const uniqueItems = deduplicateOrderItems(sourceItems);
                console.log("Fetched data sample:", uniqueItems[0]); // Debug log
                console.log(`Order item rows: ${rawItems.length}, rows after cancelled toggle: ${sourceItems.length}, unique rows: ${uniqueItems.length}`);
                setOriginalData(uniqueItems); // Store original ungrouped data
                const groupedData = groupByItemName(uniqueItems);
                setData(groupedData);
                setFilteredData(groupedData);
            } catch (error) {
                console.error("Error fetching order items:", error);
                toast.error("Failed to load order items data");
            }
        };
        fetchDataAndCategories();
    }, [showCancelledItems]);

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
        if (useOrderItemsOnlyMode) {
            return;
        }

        if (data.length > 0) {
            applyFilter();
        }
    }, [data, startDate, endDate, formdata.name, selectedCatId, selectedSubCatId, selectedTableCatId, billFilter, finalBillById, useOrderItemsOnlyMode]);

    // Update summaries when filtered data changes
    useEffect(() => {
        if (selectedCatId || selectedSubCatId || selectedTableCatId) {
            return;
        }

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
    }, [filteredData, showCategorySummary, showSubcategorySummary, showTableCategorySummary, selectedCatId, selectedSubCatId, selectedTableCatId]);

    const shouldUseGroupedItemView = !!(useOrderItemsOnlyMode || selectedCatId || selectedSubCatId || selectedTableCatId);

    const detailData = shouldUseGroupedItemView
        ? filteredData
        : billFilter !== "all"
        ? originalData.filter(matchesFilters)
        : filteredData;

    const activeColumns = getCurrentTableColumns();
    const activeTableData = getCurrentTableData();
    const showLegacyFiltersCard = false;

    return (
        <>
            <Layout>
                <Header title="Item Wise VAT Summary" />
                <ToastContainer />
                <div className="row">
                    <div className="col-12">
                        <Card style={{ marginBottom: 16 }}>
                            <Row gutter={[16, 16]} style={{ marginBottom: 12 }}>
                                <Col xs={24}>
                                    <strong>Order Items Item-wise Filter</strong>
                                </Col>
                            </Row>

                            <Row gutter={[16, 16]} align="bottom">
                                <Col xs={24} sm={12} md={6}>
                                    <label style={{display: 'block', marginBottom: '8px', fontWeight: 500}}>From Date</label>
                                    <DatePicker
                                        style={{width: '100%'}}
                                        value={quickStartDate ? dayjs(quickStartDate) : null}
                                        onChange={(date, dateString) => setQuickStartDate(dateString)}
                                        format="YYYY-MM-DD"
                                    />
                                </Col>
                                <Col xs={24} sm={12} md={6}>
                                    <label style={{display: 'block', marginBottom: '8px', fontWeight: 500}}>To Date</label>
                                    <DatePicker
                                        style={{width: '100%'}}
                                        value={quickEndDate ? dayjs(quickEndDate) : null}
                                        onChange={(date, dateString) => setQuickEndDate(dateString)}
                                        format="YYYY-MM-DD"
                                    />
                                </Col>
                                <Col xs={24} sm={12} md={6}>
                                    <label style={{display: 'block', marginBottom: '8px', fontWeight: 500}}>Category</label>
                                    <Select
                                        style={{width: '100%'}}
                                        placeholder="All Categories"
                                        value={quickCategoryId || undefined}
                                        onChange={(value) => setQuickCategoryId(value || "")}
                                        allowClear
                                    >
                                        {categories.map(cat => (
                                            <Option key={cat.id} value={cat.id}>{`${cat.name} (${cat.id})`}</Option>
                                        ))}
                                    </Select>
                                </Col>
                                <Col xs={24} sm={12} md={6}>
                                    <label style={{display: 'block', marginBottom: '8px', fontWeight: 500}}>Item Group</label>
                                    <Select
                                        style={{width: '100%'}}
                                        placeholder="All Item Groups"
                                        value={quickItemGroup || undefined}
                                        onChange={(value) => setQuickItemGroup(value || "")}
                                        allowClear
                                    >
                                        <Option value="Bar">Bar</Option>
                                        <Option value="Food">Food</Option>
                                        <Option value="Shisha">Shisha</Option>
                                    </Select>
                                </Col>
                                <Col xs={24} sm={12} md={6}>
                                    <label style={{display: 'block', marginBottom: '8px', fontWeight: 500}}>Cancelled Items</label>
                                    <Checkbox
                                        checked={showCancelledItems}
                                        onChange={(e) => setShowCancelledItems(e.target.checked)}
                                    >
                                        Show Cancelled Items 
                                    </Checkbox>
                                </Col>
                                <Col xs={24} sm={12} md={6}>
                                    <label style={{display: 'block', marginBottom: '8px', fontWeight: 500}}>Sale Filter</label>
                                    <Checkbox
                                        checked={quickSaleOnly}
                                        onChange={(e) => setQuickSaleOnly(e.target.checked)}
                                    >
                                        Sale Only
                                    </Checkbox>
                                </Col>
                                <Col xs={24} sm={12} md={6}>
                                    <label style={{display: 'block', marginBottom: '8px', fontWeight: 500}}>Entertainment Filter</label>
                                    <Checkbox
                                        checked={quickEntertainmentOnly}
                                        onChange={(e) => setQuickEntertainmentOnly(e.target.checked)}
                                    >
                                        Entertainment Only
                                    </Checkbox>
                                </Col>
                            </Row>

                            <Row gutter={[16, 16]} style={{ marginTop: 8 }}>
                                <Col xs={24}>
                                    <Space wrap>
                                        <Button type="primary" icon={<FilterOutlined />} onClick={applyOrderItemsItemWiseFilter}>
                                            Apply Item-wise
                                        </Button>
                                        <Button icon={<ClearOutlined />} onClick={clearOrderItemsItemWiseFilter}>
                                            Clear
                                        </Button>
                                        <Button danger icon={<FilePdfOutlined />} onClick={exportPDF}>
                                            Export PDF
                                        </Button>
                                        <Button
                                            type="primary"
                                            style={{ background: '#52c41a', borderColor: '#52c41a' }}
                                            icon={<FileExcelOutlined />}
                                            onClick={exportExcel}
                                        >
                                            Export Excel
                                        </Button>
                                        <Button
                                            type="primary"
                                            icon={<PrinterOutlined />}
                                            onClick={printThermalReport}
                                            style={{ background: '#722ed1', borderColor: '#722ed1' }}
                                        >
                                            Print Thermal
                                        </Button>
                                        <Button
                                            onClick={handleGroupByItemName}
                                            style={{ background: 'linear-gradient(45deg, #34d399 0%, #10b981 100%)', border: 'none', color: 'white' }}
                                        >
                                            🧾 Group by Item Name
                                        </Button>
                                    </Space>
                                </Col>
                            </Row>
                        </Card>

                        {showLegacyFiltersCard && (
                        <CardComponent>
                            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12}}>
                                <strong>Legacy Filters</strong>
                                <Button
                                    type="text"
                                    onClick={() => setOldFilterCollapsed((prev) => !prev)}
                                    icon={oldFilterCollapsed ? <DownOutlined /> : <UpOutlined />}
                                >
                                    {oldFilterCollapsed ? 'Expand' : 'Collapse'}
                                </Button>
                            </div>

                            {!oldFilterCollapsed && (
                                <>
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
                                    <label style={{display: 'block', marginBottom: '8px', fontWeight: 500}}>Search</label>
                                    <Input
                                        placeholder="Search by item name / invoice no"
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
                                        onChange={(value) => {
                                            setSelectedCatId(value || "");
                                            setShowCategorySummary(false);
                                            setShowSubcategorySummary(false);
                                            setShowTableCategorySummary(false);
                                        }}
                                        allowClear
                                    >
                                        {categories.map(cat => (
                                            <Option key={cat.id} value={cat.id}>{`${cat.name} (${cat.id})`}</Option>
                                        ))}
                                    </Select>
                                </Col>
                                <Col xs={24} sm={12} md={6}>
                                    <label style={{display: 'block', marginBottom: '8px', fontWeight: 500}}>Subcategory</label>
                                    <Select
                                        style={{width: '100%'}}
                                        placeholder="All Subcategories"
                                        value={selectedSubCatId || undefined}
                                        onChange={(value) => {
                                            setSelectedSubCatId(value || "");
                                            setShowCategorySummary(false);
                                            setShowSubcategorySummary(false);
                                            setShowTableCategorySummary(false);
                                        }}
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
                                        onChange={(value) => {
                                            setSelectedTableCatId(value || "");
                                            setShowCategorySummary(false);
                                            setShowSubcategorySummary(false);
                                            setShowTableCategorySummary(false);
                                        }}
                                        allowClear
                                    >
                                        {tableCategories.map(cat => (
                                            <Option key={cat.id} value={cat.id}>{cat.cat_name}</Option>
                                        ))}
                                    </Select>
                                </Col>
                                <Col xs={24} sm={12} md={6}>
                                    <label style={{display: 'block', marginBottom: '8px', fontWeight: 500}}>Bill Filter</label>
                                    <Select
                                        style={{width: '100%'}}
                                        value={billFilter}
                                        onChange={(value) => setBillFilter(value)}
                                    >
                                        <Option value="all">All Bills</Option>
                                        <Option value="entertainment">Entertainment Only</Option>
                                        <Option value="sale">Sale Only (Status 0)</Option>
                                        <Option value="cancelled">Cancelled Only (Status 2)</Option>
                                    </Select>
                                </Col>
                                <Col xs={24} sm={12} md={6}>
                                    <label style={{display: 'block', marginBottom: '8px', fontWeight: 500}}>Cancelled Items</label>
                                    <Checkbox
                                        checked={showCancelledItems}
                                        onChange={(e) => setShowCancelledItems(e.target.checked)}
                                    >
                                        Show Cancelled Items (status = 2)
                                    </Checkbox>
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
                                </>
                            )}
                        </CardComponent>
                        )}
                    </div>

                    {/* Data Table Section */}
                    <div className="col-12">
                        <Card>
                            {data.length === 0 ? (
                                <p>No data available</p>
                            ) : (
                                <Table
                                        columns={
                                            activeColumns.map(col => ({
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
                                                    if (col.field === 'invoice_number') {
                                                        return text || record.invoice_no || record.bill_no || record.order_id || '-';
                                                    }

                                                    if (col.field === 'setup_date') {
                                                        const dateValue = text || record.created_at || record.date || record.order_date;
                                                        if (!dateValue) return '-';
                                                        try {
                                                            const dateStr = dateValue.split('T')[0];
                                                            return dateStr || dateValue;
                                                        } catch (e) {
                                                            return dateValue || '-';
                                                        }
                                                    }

                                                    if (col.field === 'created_at') {
                                                        const timeValue = text || record.inv_time || record.time;
                                                        if (!timeValue) return '-';
                                                        try {
                                                            const dateObj = new Date(timeValue);
                                                            if (!isNaN(dateObj.getTime())) {
                                                                return format(dateObj, 'HH:mm:ss');
                                                            }
                                                            const timePart = timeValue.split('T')[1];
                                                            return timePart ? timePart.split('.')[0] : timeValue;
                                                        } catch (e) {
                                                            return timeValue || '-';
                                                        }
                                                    }

                                                    if (col.field === 'remark') {
                                                        if (text) return text;
                                                        const invoiceId = Number(record.invoice_number || record.invoice_no || record.bill_no || record.order_id);
                                                        if (Number.isNaN(invoiceId)) return '-';
                                                        const bill = finalBillById[invoiceId];
                                                        return bill?.remark || '-';
                                                    }

                                                    return text || '-';
                                                }
                                            }))
                                        }
                                    dataSource={activeTableData}
                                    rowKey={(record, index) => index}
                                    pagination={{
                                        current: tableCurrentPage,
                                        pageSize: tablePageSize,
                                        showSizeChanger: true,
                                        onChange: (page, pageSize) => {
                                            setTableCurrentPage(page);
                                            if (pageSize !== tablePageSize) {
                                                setTablePageSize(pageSize);
                                            }
                                        },
                                        onShowSizeChange: (_current, size) => {
                                            setTablePageSize(size);
                                            setTableCurrentPage(1);
                                        },
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
                                        value={detailData.length}
                                        prefix="📦"
                                    />
                                </Col>
                                <Col xs={24} sm={8}>
                                    <Statistic 
                                        title="Total Quantity"
                                        value={
                                            detailData.reduce((acc, item) => {
                                                const qty = item.quantity || item.qty || item.total_quantity || 0;
                                                return acc + toNumber(qty);
                                            }, 0)
                                        }
                                        precision={2}
                                    />
                                </Col>
                                <Col xs={24} sm={8}>
                                    <Statistic 
                                        title="Total VAT"
                                        value={
                                            detailData.reduce((acc, item) => {
                                                const vatAmount = item.vat_amount || item.tax_amount || item.total_vat || 0;
                                                return acc + toNumber(vatAmount);
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
                                            detailData.reduce((acc, item) => {
                                                const totalPrice = item.total_price || item.total || item.total_amount || 0;
                                                return acc + toNumber(totalPrice);
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
