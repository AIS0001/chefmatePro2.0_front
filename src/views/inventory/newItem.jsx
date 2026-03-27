/* eslint-disable no-undef */

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";

import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import Header from "../../components/Header";
import Layout from "../../layout/Layout";
import { format } from "date-fns";
import { Button, Input, Select, Space, Table, Tag, Tooltip } from "antd";
import { DeleteOutlined, EditOutlined, SearchOutlined } from "@ant-design/icons";

import fetchData from "../../functions/fetchData";
import { deleteItem, deleteBulkItems } from "../../functions/delateData";
import { isTokenExpired, logout } from "../../utility/auth";
import NewItemModalAnt from "../../components/Modals/NewItemModalAnt";
import NewItemPriceModal from "../../components/Modals/NewItemPriceModal";
import BarcodeModal from "../../components/Modals/BarcodeModal";
import EditItemModal from "../../components/Modals/EditItemModal";

// Import libraries for export functionality
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { sendToThermalPrinter } from '../../services/thermalPrinter';

export default function NewItem() {
  const navigate = useNavigate();
  //  const headers = { Authorization: authheader().access_token };
  const [data, setData] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showModalItemAnt, setShowModalItemAnt] = useState(false);
  const [showBarcodeModal, setShowBarcodeModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [reload, setReload] = useState(false); // Define reload state
  const [selectedItems, setSelectedItems] = useState([]); // For bulk delete
  const [selectAll, setSelectAll] = useState(false); // For select all checkbox

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10); // Number of items per page
  const [totalItems, setTotalItems] = useState(0);

  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedSubcategory, setSelectedSubcategory] = useState("");
  const [filteredData, setFilteredData] = useState([]);
  const [originalData, setOriginalData] = useState([]);
  const [categoriesMaster, setCategoriesMaster] = useState([]);
  const [subcategoriesMaster, setSubcategoriesMaster] = useState([]);

  const getCategoryId = useCallback((item) => item?.catid || item?.cat_id || item?.category_id || item?.categoryid || "", []);
  const getCategoryName = useCallback((item) => item?.category_name || item?.cat_name || item?.category || "", []);
  const getSubcategoryId = useCallback((item) => item?.subcatid || item?.subcat_id || item?.subcategory_id || item?.subcategoryid || "", []);
  const getSubcategoryName = useCallback((item) => item?.subcategory_name || item?.subcat_name || item?.sub_category || "", []);
    const categoryNameById = useMemo(() => {
      const map = new Map();
      categoriesMaster.forEach((category) => {
        const id = category?.id;
        const name = category?.name || category?.cat_name || "";
        if (id !== undefined && id !== null && name) {
          map.set(String(id), name);
        }
      });
      return map;
    }, [categoriesMaster]);

    const getCategoryDisplayName = useCallback((item) => {
      const inlineName = getCategoryName(item);
      if (inlineName) return inlineName;

      const categoryId = getCategoryId(item);
      if (categoryId !== undefined && categoryId !== null && String(categoryId)) {
        return categoryNameById.get(String(categoryId)) || "";
      }

      return "";
    }, [getCategoryName, getCategoryId, categoryNameById]);

    const subcategoryNameById = useMemo(() => {
      const map = new Map();
      subcategoriesMaster.forEach((sub) => {
        const id = sub?.id;
        const name = sub?.subcat || sub?.subcategory_name || sub?.name || "";
        if (id !== undefined && id !== null && name) {
          map.set(String(id), name);
        }
      });
      return map;
    }, [subcategoriesMaster]);

    const getSubcategoryDisplayName = useCallback((item) => {
      const inlineName = getSubcategoryName(item);
      if (inlineName) return inlineName;

      const subcategoryId = getSubcategoryId(item);
      if (subcategoryId !== undefined && subcategoryId !== null && String(subcategoryId)) {
        return subcategoryNameById.get(String(subcategoryId)) || "";
      }

      return "";
    }, [getSubcategoryName, getSubcategoryId, subcategoryNameById]);

  const categoryOptions = useMemo(() => {
    const optionMap = new Map();

    originalData.forEach((item) => {
      const categoryId = getCategoryId(item);
      const categoryName = getCategoryDisplayName(item);
      if (!categoryId && !categoryName) return;

      const key = String(categoryId || categoryName);
      if (!optionMap.has(key)) {
        optionMap.set(key, {
          value: key,
          label: categoryName || `Category ${key}`,
        });
      }
    });

    return Array.from(optionMap.values()).sort((a, b) => a.label.localeCompare(b.label));
  }, [originalData, getCategoryId, getCategoryDisplayName]);

  const subcategoryOptions = useMemo(() => {
    // Prefer subcategory master (clean names and category linkage)
    if (subcategoriesMaster.length > 0) {
      const options = subcategoriesMaster
        .filter((sub) => {
          if (!selectedCategory) return true;
          const subCatCategoryId = sub?.catid || sub?.cat_id || sub?.category_id;
          return String(subCatCategoryId || "") === String(selectedCategory);
        })
        .map((sub) => ({
          value: String(sub?.id ?? ""),
          label: sub?.subcat || sub?.subcategory_name || sub?.name || `Subcategory ${sub?.id}`,
        }))
        .filter((sub) => sub.value && sub.label);

      const uniqueByValue = new Map();
      options.forEach((opt) => {
        if (!uniqueByValue.has(opt.value)) uniqueByValue.set(opt.value, opt);
      });

      return Array.from(uniqueByValue.values()).sort((a, b) => a.label.localeCompare(b.label));
    }

    // Fallback to deriving from items data
    const optionMap = new Map();

    originalData.forEach((item) => {
      const categoryId = String(getCategoryId(item) || getCategoryName(item));
      if (selectedCategory && categoryId !== String(selectedCategory)) return;

      const subcategoryId = getSubcategoryId(item);
      const subcategoryName = getSubcategoryDisplayName(item);
      if (!subcategoryId && !subcategoryName) return;

      const key = String(subcategoryId || subcategoryName);
      if (!optionMap.has(key)) {
        optionMap.set(key, {
          value: key,
          label: subcategoryName || `Subcategory ${key}`,
        });
      }
    });

    return Array.from(optionMap.values()).sort((a, b) => a.label.localeCompare(b.label));
  }, [originalData, selectedCategory, subcategoriesMaster, getCategoryId, getCategoryName, getSubcategoryId, getSubcategoryDisplayName]);

  // Calculate pagination values
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentData = filteredData.slice(startIndex, endIndex);

  // Calculate page range for pagination buttons (max 5 pages shown)
  const getPageRange = () => {
    const maxPages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxPages / 2));
    let endPage = Math.min(totalPages, startPage + maxPages - 1);
    
    // Adjust start page if we're near the end
    if (endPage - startPage + 1 < maxPages) {
      startPage = Math.max(1, endPage - maxPages + 1);
    }
    
    return { startPage, endPage };
  };

  const AddNewItemAntButton = () => {
    setShowModalItemAnt(true);
  };

  const AddNewItemPriceButton = (contract) => {
    // setSelectedContract(contract);
    setShowModal(true);
  };

  const GenerateBarcodeButton = () => {
    setShowBarcodeModal(true);
  };

  const triggerReload = () => {
    setReload((prev) => !prev); // Toggle reload state
  };

  // Check if token is expired using the auth utility
  const checkTokenExpiration = useCallback(() => {
    if (isTokenExpired()) {
      console.log('🔐 Token expired, redirecting to login');
      toast.error('Your session has expired. Please log in again.', {
        position: "top-center",
        autoClose: 3000,
      });
      setTimeout(() => {
        logout(); // Use the proper logout function
        navigate('/login');
      }, 1000);
      return false;
    }
    
    console.log('✅ Token is valid');
    return true;
  }, [navigate]);

  // Handle individual checkbox selection
  const handleItemSelect = (itemId, isChecked) => {
    if (isChecked) {
      setSelectedItems(prev => [...prev, itemId]);
    } else {
      setSelectedItems(prev => prev.filter(id => id !== itemId));
      setSelectAll(false); // Uncheck select all if any item is unchecked
    }
  };

  // Handle select all checkbox (only for current page)
  const handleSelectAll = (isChecked) => {
    setSelectAll(isChecked);
    if (isChecked) {
      const currentPageIds = currentData.map(item => item.id);
      setSelectedItems(prev => [...new Set([...prev, ...currentPageIds])]);
    } else {
      const currentPageIds = currentData.map(item => item.id);
      setSelectedItems(prev => prev.filter(id => !currentPageIds.includes(id)));
    }
  };

  // Pagination functions
  const goToFirstPage = () => {
    setCurrentPage(1);
    setSelectAll(false);
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
      setSelectAll(false);
    }
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
      setSelectAll(false);
    }
  };

  const goToLastPage = () => {
    setCurrentPage(totalPages);
    setSelectAll(false);
  };

  const goToPage = (pageNumber) => {
    setCurrentPage(pageNumber);
    setSelectAll(false);
  };

  // Handle items per page change
  const handleItemsPerPageChange = (newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Reset to first page
    setSelectAll(false);
  };

  // Update select all checkbox based on current page
  useEffect(() => {
    if (currentData.length > 0) {
      const currentPageIds = currentData.map(item => item.id);
      const allCurrentPageSelected = currentPageIds.every(id => selectedItems.includes(id));
      setSelectAll(allCurrentPageSelected);
    } else {
      setSelectAll(false);
    }
  }, [currentPage, selectedItems, currentData]);

  // Export functions
  const exportToExcel = () => {
    try {
      // Prepare data for export
      const exportData = filteredData.map(item => ({
        'ID': item.id,
        'Item Name': item.iname || '',
        'Unit': item.unit || '',
        'Tax (%)': item.tax || '0',
        'MRP': item.mrp || '0',
        'Offer Price': item.offerprice || '0',
        'Description': item.description || ''
      }));

      // Create workbook and worksheet
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(exportData);

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(wb, ws, "Items");

      // Generate filename with current date
      const filename = `items_${format(new Date(), "yyyy-MM-dd_HH-mm-ss")}.xlsx`;

      // Save file
      XLSX.writeFile(wb, filename);

      toast.success('Excel file exported successfully!', {
        position: "top-right",
        autoClose: 3000,
      });
    } catch (error) {
      console.error('Excel export error:', error);
      toast.error('Failed to export Excel file', {
        position: "top-right",
        autoClose: 3000,
      });
    }
  };

  const exportToPDF = () => {
    try {
      const doc = new jsPDF();
      
      // Add title
      doc.setFontSize(20);
      doc.text('Items Report', 14, 22);
      
      // Add generation date
      doc.setFontSize(10);
      doc.text(`Generated on: ${format(new Date(), "dd/MM/yyyy HH:mm:ss")}`, 14, 32);
      
      // Prepare table data
      const tableData = filteredData.map(item => [
        item.id,
        item.item_code || '',
        item.iname || '',
        item.unit || '',
        `${item.tax || '0'}%`,
        `${item.mrp || '0'}`,
        `${item.offerprice || '0'}`,
        item.description || ''
      ]);

      // Add table
      doc.autoTable({
        head: [['ID', 'Item Code', 'Item Name', 'Unit', 'Tax', 'MRP', 'Offer Price', 'Description']],
        body: tableData,
        startY: 40,
        styles: {
          fontSize: 7,
          cellPadding: 2
        },
        headStyles: {
          fillColor: [23, 162, 184],
          textColor: 255
        },
        columnStyles: {
          0: { cellWidth: 12 },
          1: { cellWidth: 22 },
          2: { cellWidth: 30 },
          3: { cellWidth: 15 },
          4: { cellWidth: 12 },
          5: { cellWidth: 20 },
          6: { cellWidth: 20 },
          7: { cellWidth: 45 }
        }
      });

      // Generate filename with current date
      const filename = `items_${format(new Date(), "yyyy-MM-dd_HH-mm-ss")}.pdf`;

      // Save PDF
      doc.save(filename);

      toast.success('PDF file exported successfully!', {
        position: "top-right",
        autoClose: 3000,
      });
    } catch (error) {
      console.error('PDF export error:', error);
      toast.error('Failed to export PDF file', {
        position: "top-right",
        autoClose: 3000,
      });
    }
  };

  const printThermal = async () => {
    try {
      // Create ESC/POS commands for item list
      const escpos = [];
      
      // Initialize printer
      escpos.push(0x1B, 0x40); // ESC @ - Initialize printer
      
      // Center align
      escpos.push(0x1B, 0x61, 0x01); // ESC a 1 - Center align
      
      // Title - Large and bold
      escpos.push(0x1B, 0x21, 0x30); // ESC ! 48 - Double height and width + bold
      const titleText = 'ITEM LIST';
      for (let i = 0; i < titleText.length; i++) {
        escpos.push(titleText.charCodeAt(i));
      }
      escpos.push(0x0A, 0x0A); // Line feeds
      
      // Reset to normal
      escpos.push(0x1B, 0x21, 0x00); // ESC ! 0 - Normal
      
      // Date and time
      const dateStr = `Date: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`;
      for (let i = 0; i < dateStr.length; i++) {
        escpos.push(dateStr.charCodeAt(i));
      }
      escpos.push(0x0A); // Line feed
      
      // Separator
      const separator = '--------------------------------';
      for (let i = 0; i < separator.length; i++) {
        escpos.push(separator.charCodeAt(i));
      }
      escpos.push(0x0A);
      
      // Left align for items
      escpos.push(0x1B, 0x61, 0x00); // ESC a 0 - Left align
      
      // Print each item
      filteredData.forEach((item, index) => {
        // Item number
        const itemNum = `${index + 1}. `;
        for (let i = 0; i < itemNum.length; i++) {
          escpos.push(itemNum.charCodeAt(i));
        }
        
        // Item Code (bold)
        escpos.push(0x1B, 0x45, 0x01); // ESC E 1 - Bold on
        const code = `Code: ${item.item_code || 'N/A'}`;
        for (let i = 0; i < code.length; i++) {
          escpos.push(code.charCodeAt(i));
        }
        escpos.push(0x1B, 0x45, 0x00); // ESC E 0 - Bold off
        escpos.push(0x0A); // Line feed
        
        // Item Name
        const name = `   ${item.iname || 'N/A'}`;
        for (let i = 0; i < name.length; i++) {
          escpos.push(name.charCodeAt(i));
        }
        escpos.push(0x0A); // Line feed
        
        // MRP
        const mrp = `   MRP: ${item.mrp || '0'}`;
        for (let i = 0; i < mrp.length; i++) {
          escpos.push(mrp.charCodeAt(i));
        }
        escpos.push(0x0A, 0x0A); // Line feeds
      });
      
      // Separator
      escpos.push(0x1B, 0x61, 0x01); // ESC a 1 - Center align
      for (let i = 0; i < separator.length; i++) {
        escpos.push(separator.charCodeAt(i));
      }
      escpos.push(0x0A);
      
      // Total items
      const totalText = `Total Items: ${filteredData.length}`;
      for (let i = 0; i < totalText.length; i++) {
        escpos.push(totalText.charCodeAt(i));
      }
      escpos.push(0x0A, 0x0A, 0x0A); // Line feeds
      
      // Cut paper
      escpos.push(0x1D, 0x56, 0x41, 0x00); // GS V A 0 - Cut paper
      
      // Convert to Uint8Array
      const escposData = new Uint8Array(escpos);
      
      // Send to thermal printer
      const success = await sendToThermalPrinter(escposData, {
        printerIp: '192.168.1.216',
        printerPort: 7001
      });
      
      if (success) {
        toast.success('Item list printed to thermal printer successfully!', {
          position: "top-right",
          autoClose: 3000,
        });
      } else {
        toast.error('Failed to print to thermal printer', {
          position: "top-right",
          autoClose: 3000,
        });
      }
    } catch (error) {
      console.error('Thermal print error:', error);
      toast.error('Failed to print to thermal printer', {
        position: "top-right",
        autoClose: 3000,
      });
    }
  };

  const printThermalHTML = () => {
    try {
      // Create a new window for thermal printing
      const printWindow = window.open('', '_blank');
      
      if (!printWindow) {
        toast.error('Unable to open print window. Please allow popups.', {
          position: "top-right",
          autoClose: 3000,
        });
        return;
      }

      // Generate HTML for thermal print (80mm width)
      const printContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Item List - Thermal Print</title>
          <style>
            @media print {
              @page {
                size: 80mm auto;
                margin: 0;
              }
            }
            body {
              font-family: Arial, Helvetica, sans-serif;
              width: 80mm;
              margin: 0;
              padding: 10px;
              font-size: 16px;
            }
            .header {
              text-align: center;
              margin-bottom: 10px;
            }
            .title {
              font-size: 24px;
              font-weight: bold;
              margin-bottom: 5px;
            }
            .date {
              font-size: 15px;
              margin-bottom: 10px;
            }
            .separator {
              border-top: 1px dashed #000;
              margin: 10px 0;
            }
            .item {
              margin-bottom: 15px;
              page-break-inside: avoid;
            }
            .item-number {
              font-weight: bold;
            }
            .item-code {
              font-weight: bold;
              margin-left: 10px;
            }
            .item-name {
              margin-left: 10px;
            }
            .item-mrp {
              margin-left: 10px;
            }
            .footer {
              text-align: center;
              margin-top: 10px;
              font-weight: bold;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title">ITEM LIST</div>
            <div class="date">Date: ${format(new Date(), 'dd/MM/yyyy HH:mm')}</div>
          </div>
          <div class="separator"></div>
          
          ${filteredData.map((item, index) => `
            <div class="item">
              <div class="item-number">${index + 1}.</div>
              <div class="item-code">Code: ${item.item_code || 'N/A'}</div>
              <div class="item-name">${item.iname || 'N/A'}</div>
              <div class="item-mrp">MRP: ${item.mrp || '0'}</div>
            </div>
          `).join('')}
          
          <div class="separator"></div>
          <div class="footer">Total Items: ${filteredData.length}</div>
        </body>
        </html>
      `;

      printWindow.document.write(printContent);
      printWindow.document.close();
      
      // Wait for content to load then print
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print();
        }, 250);
      };

      toast.success('Opening thermal print preview...', {
        position: "top-right",
        autoClose: 2000,
      });
    } catch (error) {
      console.error('Thermal HTML print error:', error);
      toast.error('Failed to open thermal print window', {
        position: "top-right",
        autoClose: 3000,
      });
    }
  };

  const printTable = () => {
    try {
      // Create a new window for printing
      const printWindow = window.open('', '_blank');
      
      // Prepare HTML content for printing
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Items Report</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 20px;
            }
            h1 {
              color: #17a2b8;
              text-align: center;
              margin-bottom: 10px;
            }
            .header-info {
              text-align: center;
              margin-bottom: 20px;
              color: #666;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 20px;
            }
            th, td {
              border: 1px solid #ddd;
              padding: 8px;
              text-align: left;
            }
            th {
              background-color: #17a2b8;
              color: white;
              font-weight: bold;
            }
            tr:nth-child(even) {
              background-color: #f2f2f2;
            }
            .currency {
              text-align: right;
            }
            @media print {
              body { margin: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <h1>Items Report</h1>
          <div class="header-info">
            <p>Generated on: ${format(new Date(), "dd/MM/yyyy HH:mm:ss")}</p>
            <p>Total Items: ${data.length}</p>
          </div>
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Item Name</th>
                <th>Unit</th>
                <th>Tax (%)</th>
                <th>MRP</th>
                <th>Offer Price</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              ${filteredData.map(item => `
                <tr>
                  <td>${item.id}</td>
                  <td>${item.iname || ''}</td>
                  <td>${item.unit || ''}</td>
                  <td>${item.tax || '0'}%</td>
                  <td class="currency">฿${parseFloat(item.mrp || 0).toFixed(2)}</td>
                  <td class="currency">฿${parseFloat(item.offerprice || 0).toFixed(2)}</td>
                  <td>${item.description || ''}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
        </html>
      `;

      // Write content to print window
      printWindow.document.write(htmlContent);
      printWindow.document.close();

      // Wait for content to load then print
      printWindow.onload = () => {
        printWindow.print();
        printWindow.close();
      };

      toast.success('Print dialog opened successfully!', {
        position: "top-right",
        autoClose: 2000,
      });
    } catch (error) {
      console.error('Print error:', error);
      toast.error('Failed to open print dialog', {
        position: "top-right",
        autoClose: 3000,
      });
    }
  };

  // Handle bulk delete
  const handleBulkDelete = async () => {
    if (selectedItems.length === 0) {
      toast.warning('Please select items to delete', {
        position: "top-right",
        autoClose: 3000,
      });
      return;
    }

    // Show confirmation dialog
    const confirmed = window.confirm(`Are you sure you want to delete ${selectedItems.length} selected item(s)?`);
    if (!confirmed) {
      return;
    }

    try {
      console.log(`🗑️ Bulk deleting ${selectedItems.length} items:`, selectedItems);
      
      // Call the bulk delete API
      const result = await deleteBulkItems(selectedItems);
      
      if (result.success) {
        toast.success(`${result.affectedRows} item(s) deleted successfully!`, {
          position: "top-right",
          autoClose: 3000,
        });
        
        // Clear selected items and trigger reload
        setSelectedItems([]);
        setSelectAll(false);
        triggerReload();
      } else {
        toast.error(`Failed to delete items: ${result.message}`, {
          position: "top-right",
          autoClose: 5000,
        });
      }
    } catch (error) {
      console.error('Bulk delete error:', error);
      
      // Check if it's an authentication error
      if (error.status === 401 || error.status === 403) {
        toast.error('Your session has expired. Please log in again.', {
          position: "top-center",
          autoClose: 3000,
        });
        setTimeout(() => {
          logout();
          navigate('/login');
        }, 1000);
        return;
      }
      
      toast.error(`Error deleting items: ${error.message}`, {
        position: "top-right",
        autoClose: 5000,
      });
    }
  };

  const handleEditClick = (item) => {
    console.log("newItem - handleEditClick called with item:", item);
    setSelectedItem(item);
    setShowEditModal(true);
  };

  const handleEditModalClose = () => {
    setShowEditModal(false);
    setSelectedItem(null);
  };

  const handleDeleteItem = async (itemId) => {
    // Check token expiration before proceeding
    if (!checkTokenExpiration()) {
      return;
    }
    
    try {
      console.log(`🗑️ Deleting item with ID: ${itemId}`);
      
      // Show confirmation dialog
      const confirmed = window.confirm('Are you sure you want to delete this item?');
      if (!confirmed) {
        return;
      }

      // Call the specific delete item API
      const result = await deleteItem(itemId);
      
      if (result.success) {
        toast.success('Item deleted successfully!', {
          position: "top-right",
          autoClose: 3000,
        });
        
        // Trigger reload to refresh the data
        triggerReload();
      } else {
        toast.error(`Failed to delete item: ${result.message}`, {
          position: "top-right",
          autoClose: 5000,
        });
      }
    } catch (error) {
      console.error('Delete item error:', error);
      
      // Check if it's an authentication error
      if (error.status === 401 || error.status === 403) {
        toast.error('Your session has expired. Please log in again.', {
          position: "top-center",
          autoClose: 3000,
        });
        setTimeout(() => {
          logout(); // Use proper logout function
          navigate('/login');
        }, 1000);
        return;
      }
      
      toast.error(`Error deleting item: ${error.message}`, {
        position: "top-right",
        autoClose: 5000,
      });
    }
  };

  useEffect(() => {
    const fetchAndSetData = async () => {
      // Check token expiration before fetching data
      if (!checkTokenExpiration()) {
        return;
      }
      
      try {
        const items = await fetchData("items", setData, "id", {});
        // console.log("Fetched data:", items);
        setData(items); // Ensure the data state is set with fetched items
        setOriginalData(items); // Store original data for filtering
        setFilteredData(items); // Initialize filtered data
        setTotalItems(items.length); // Set total count for pagination
      } catch (error) {
        console.error("Error in useEffect:", error);
        
        // Check if it's an authentication error
        if (error.response && (error.response.status === 401 || error.response.status === 403)) {
          toast.error('Your session has expired. Please log in again.', {
            position: "top-center",
            autoClose: 3000,
          });
          setTimeout(() => {
            logout(); // Use proper logout function
            navigate('/login');
          }, 1000);
        } else {
          toast.error('Failed to fetch items data', {
            position: "top-right",
            autoClose: 3000,
          });
        }
      }
    };

    fetchAndSetData();
  }, [reload, checkTokenExpiration, navigate]);

  useEffect(() => {
    const fetchCategoriesMaster = async () => {
      try {
        const categories = await fetchData("categories", null, "id", {});
        if (Array.isArray(categories)) {
          setCategoriesMaster(categories);
        }
      } catch (error) {
        console.error("Failed to fetch categories master:", error);
      }
    };

    fetchCategoriesMaster();
  }, []);

  useEffect(() => {
    const fetchSubcategoriesMaster = async () => {
      try {
        const subcategories = await fetchData("subcategory", null, "id", {});
        if (Array.isArray(subcategories)) {
          setSubcategoriesMaster(subcategories);
        }
      } catch (error) {
        console.error("Failed to fetch subcategories master:", error);
      }
    };

    fetchSubcategoriesMaster();
  }, []);
  
  // Debug token information on component mount
  useEffect(() => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    const tokenExpiry = localStorage.getItem('expirationTime') || sessionStorage.getItem('expirationTime');
    
    console.log('🔍 DEBUGGING TOKEN INFO:');
    console.log('  - Token exists:', !!token);
    console.log('  - Token length:', token ? token.length : 0);
    console.log('  - Token expiry:', tokenExpiry);
    console.log('  - Token expired:', isTokenExpired());
    console.log('  - All localStorage keys:', Object.keys(localStorage));
    console.log('  - All sessionStorage keys:', Object.keys(sessionStorage));
    
    if (tokenExpiry) {
      const currentTime = Date.now();
      const expiryTime = parseInt(tokenExpiry);
      console.log('  - Current time:', new Date(currentTime).toISOString());
      console.log('  - Expiry time:', new Date(expiryTime).toISOString());
      console.log('  - Time until expiry (minutes):', (expiryTime - currentTime) / (1000 * 60));
    }
  }, []);
  
  useEffect(() => {
    // console.log("Updated data:", data);
  }, [data]);

  // Filter function - memoized
  const applyFilters = useCallback(() => {
    let filtered = originalData;

    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(item =>
        (item.iname && item.iname.toLowerCase().includes(searchLower)) ||
        (item.description && item.description.toLowerCase().includes(searchLower)) ||
        (item.id && item.id.toString().includes(searchLower))
      );
    }

    if (selectedCategory) {
      filtered = filtered.filter((item) => {
        const categoryKey = String(getCategoryId(item) || getCategoryName(item));
        return categoryKey === String(selectedCategory);
      });
    }

    if (selectedSubcategory) {
      filtered = filtered.filter((item) => {
        const subcategoryKey = String(getSubcategoryId(item) || getSubcategoryName(item));
        return subcategoryKey === String(selectedSubcategory);
      });
    }

    setFilteredData(filtered);
    setTotalItems(filtered.length);
    setCurrentPage(1); // Reset to first page when filters change
  }, [searchTerm, selectedCategory, selectedSubcategory, originalData, getCategoryId, getCategoryName, getSubcategoryId, getSubcategoryName]);

  // Filter handlers - memoized
  const handleSearchChange = useCallback((e) => {
    const value = typeof e === "string" ? e : e?.target?.value || "";
    setSearchTerm(value);
  }, []);

  const handleCategoryChange = useCallback((value) => {
    const nextValue = typeof value === "string" ? value : value || "";
    setSelectedCategory(nextValue);
    setSelectedSubcategory("");
  }, []);

  const handleSubcategoryChange = useCallback((value) => {
    const nextValue = typeof value === "string" ? value : value || "";
    setSelectedSubcategory(nextValue);
  }, []);

  const clearFilters = useCallback(() => {
    setSearchTerm("");
    setSelectedCategory("");
    setSelectedSubcategory("");
    setFilteredData(originalData);
    setTotalItems(originalData.length);
    setCurrentPage(1);
  }, [originalData]);

  // Apply filters whenever search term changes
  useEffect(() => {
    applyFilters();
  }, [searchTerm, selectedCategory, selectedSubcategory, originalData, applyFilters]);

  const columns = useMemo(() => [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
      width: 90,
      sorter: (a, b) => Number(a.id || 0) - Number(b.id || 0),
      defaultSortOrder: "descend",
      render: (value) => <strong>{value}</strong>,
    },
    {
      title: "Item Code",
      dataIndex: "item_code",
      key: "item_code",
      sorter: (a, b) => String(a.item_code || "").localeCompare(String(b.item_code || "")),
      render: (value) => value || "N/A",
    },
    {
      title: "Item Name",
      dataIndex: "iname",
      key: "iname",
      sorter: (a, b) => String(a.iname || "").localeCompare(String(b.iname || "")),
      render: (value) => value || "N/A",
    },
    {
      title: "Unit",
      dataIndex: "unit",
      key: "unit",
      sorter: (a, b) => String(a.unit || "").localeCompare(String(b.unit || "")),
      render: (value) => value || "N/A",
      width: 110,
    },
    {
      title: "Tax (%)",
      dataIndex: "tax",
      key: "tax",
      width: 110,
      sorter: (a, b) => Number(a.tax || 0) - Number(b.tax || 0),
      render: (value) => `${value || 0}%`,
    },
    {
      title: "MRP",
      dataIndex: "mrp",
      key: "mrp",
      width: 120,
      sorter: (a, b) => Number(a.mrp || 0) - Number(b.mrp || 0),
      render: (value) => `฿${Number(value || 0).toFixed(2)}`,
    },
    {
      title: "Offer Price",
      dataIndex: "offerprice",
      key: "offerprice",
      width: 130,
      sorter: (a, b) => Number(a.offerprice || 0) - Number(b.offerprice || 0),
      render: (value) => `฿${Number(value || 0).toFixed(2)}`,
    },
    {
      title: "Details",
      dataIndex: "description",
      key: "description",
      ellipsis: true,
      render: (value) => value || "No description",
    },
    {
      title: "Actions",
      key: "actions",
      fixed: "right",
      width: 140,
      render: (_, item) => (
        <Space>
          <Tooltip title="Edit Item">
            <Button type="default" size="small" icon={<EditOutlined />} onClick={() => handleEditClick(item)} />
          </Tooltip>
          <Tooltip title="Delete Item">
            <Button danger size="small" icon={<DeleteOutlined />} onClick={() => handleDeleteItem(item.id)} />
          </Tooltip>
        </Space>
      ),
    },
  ], [handleEditClick]);

  const rowSelection = {
    selectedRowKeys: selectedItems,
    onChange: (selectedRowKeys) => {
      setSelectedItems(selectedRowKeys);
      setSelectAll(false);
    },
    preserveSelectedRowKeys: true,
  };

  return (
    <>
      <style jsx>{`
        .custom-table {
          background-color: #fff;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(78, 53, 53, 0.1);
          overflow: hidden;
        }
        
        .custom-table th {
          background-color: #343a40;
          color: white;
          font-weight: 600;
          text-align: center;
          padding: 12px 8px;
          border: none;
        }
        
        .custom-table td {
          padding: 10px 8px;
          text-align: center;
          vertical-align: middle;
          border: 1px solid #dee2e6;
        }
        
        .custom-table tbody tr:hover {
          background-color: #f8f9fa;
          transition: background-color 0.2s ease;
        }
        
        .custom-table .table-active {
          background-color: #e3f2fd !important;
        }
        
        .custom-table .table-active:hover {
          background-color: #bbdefb !important;
        }
        
        .custom-table th input[type="checkbox"],
        .custom-table td input[type="checkbox"] {
          transform: scale(1.2);
          margin: 0;
        }
        
        .btn-group .btn {
          margin: 0 2px;
          padding: 5px 10px;
          font-size: 12px;
        }
        
        .btn-warning {
          background-color: #ffc107;
          border-color: #ffc107;
          color: #212529;
        }
        
        .btn-warning:hover {
          background-color: #e0a800;
          border-color: #d39e00;
        }
        
        .btn-danger:hover {
          background-color: #c82333;
          border-color: #bd2130;
        }
        
        .table-responsive {
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        /* Pagination Styles */
        .pagination-container {
          padding: 15px 20px; /* Add more horizontal padding */
          border-top: 1px solid #dee2e6;
          background-color: #f8f9fa;
          /* Remove overflow-x: auto to prevent scrolling */
        }

        .pagination-info {
          padding: 8px 0;
          color: #6c757d;
          font-size: 14px;
        }

        .pagination {
          margin: 0;
          margin-right: 15px; /* Add margin-right to ensure Last button is visible */
          flex-wrap: wrap; /* Allow wrapping if needed */
        }

        .page-link {
          color: #17a2b8;
          border: 1px solid #dee2e6;
          padding: 0.375rem 0.65rem; /* Slightly reduce horizontal padding for better fit */
          margin-left: -1px;
          line-height: 1.25;
          background-color: #fff;
          border-radius: 0;
          transition: all 0.15s ease-in-out;
          font-size: 14px;
        }

        .page-link:hover {
          z-index: 2;
          color: #0f6674;
          text-decoration: none;
          background-color: #e9ecef;
          border-color: #dee2e6;
        }

        .page-link:focus {
          z-index: 3;
          outline: 0;
          box-shadow: 0 0 0 0.2rem rgba(23, 162, 184, 0.25);
        }

        .page-item:first-child .page-link {
          margin-left: 0;
          border-top-left-radius: 0.25rem;
          border-bottom-left-radius: 0.25rem;
        }

        .page-item:last-child .page-link {
          border-top-right-radius: 0.25rem;
          border-bottom-right-radius: 0.25rem;
        }

        .page-item.active .page-link {
          z-index: 3;
          color: #fff;
          background-color: #17a2b8;
          border-color: #17a2b8;
        }

        .page-item.disabled .page-link {
          color: #6c757d;
          pointer-events: none;
          cursor: auto;
          background-color: #fff;
          border-color: #dee2e6;
        }

        .page-link i {
          font-size: 12px;
        }

        /* Responsive pagination */
        @media (max-width: 576px) {
          .pagination-container .row {
            flex-direction: column;
          }
          
          .pagination-info {
            text-align: center;
            margin-bottom: 10px;
          }
          
          .page-size-selector {
            text-align: center;
            margin-bottom: 10px;
          }
          
          .pagination {
            justify-content: center !important;
          }
          
          .page-link {
            padding: 0.25rem 0.5rem;
            font-size: 0.875rem;
          }

          /* Mobile responsive for export buttons */
          .export-actions-section {
            justify-content: center;
            margin-top: 10px;
          }

          .export-actions-section .btn {
            font-size: 12px;
            padding: 0.25rem 0.5rem;
          }

          .export-actions-section .btn i {
            margin-right: 3px;
          }
        }

        .page-size-selector {
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          color: #6c757d;
        }

        .page-size-selector .form-select {
          margin: 0 5px;
          width: auto !important;
          min-width: 60px;
        }

        /* Export Actions Styling */
        .export-actions-section {
          display: flex;
          justify-content: flex-start; /* Changed from flex-end to flex-start for left alignment */
          align-items: center;
        }

        .export-actions-section .btn-group {
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .export-actions-section .btn {
          border-radius: 0;
          font-size: 13px;
          padding: 0.375rem 0.75rem;
          transition: all 0.2s;
        }

        .export-actions-section .btn:first-child {
          border-top-left-radius: 0.25rem;
          border-bottom-left-radius: 0.25rem;
        }

        .export-actions-section .btn:last-child {
          border-top-right-radius: 0.25rem;
          border-bottom-right-radius: 0.25rem;
        }

        .export-actions-section .btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
        }

        .export-actions-section .btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        .export-actions-section .btn i {
          margin-right: 5px;
        }

        /* Ensure pagination navigation has enough space */
        .pagination-container nav {
          /* Remove overflow-x and padding-right */
        }

        .pagination-container .justify-content-end {
          /* Remove white-space and min-width constraints */
          display: flex;
          justify-content: flex-end;
          align-items: center;
        }

        /* Make page buttons more compact if needed */
        .page-link i {
          font-size: 12px;
        }
        
        .no-data {
          text-align: center;
          padding: 40px;
          color: #6c757d;
          font-size: 16px;
        }

        /* ComboBox dropdown styling */
        .combo-box {
          position: relative;
          width: 100%;
        }
        
        .combo-box-select {
          width: 100%;
          padding: 8px 12px;
          border: 1px solid #ced4da;
          border-radius: 4px;
          background-color: #fff;
          font-size: 14px;
          line-height: 1.5;
          color: #495057;
          appearance: none;
          -webkit-appearance: none;
          -moz-appearance: none;
          cursor: pointer;
          position: relative;
          z-index: 1;
        }
        
        .combo-box-select:focus {
          border-color: #80bdff;
          outline: 0;
          box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
        }
        
        .combo-box-arrow {
          position: absolute;
          top: 50%;
          right: 12px;
          transform: translateY(-50%);
          width: 0;
          height: 0;
          border-left: 4px solid transparent;
          border-right: 4px solid transparent;
          border-top: 4px solid #6c757d;
          pointer-events: none;
          z-index: 2;
        }
        
        /* Ensure dropdown options are visible */
        .combo-box-select option {
          background-color: #fff;
          color: #495057;
          padding: 8px 12px;
        }
        
        .combo-box-select:hover {
          border-color: #adb5bd;
        }
        
        /* Override any conflicting z-index issues */
        .card {
          position: relative;
          z-index: 1;
        }
        
        .filter-card-body {
          position: relative;
          z-index: 10;
        }

        /* ComboBox dropdown styling */
        .combo-box {
          position: relative;
          width: 100%;
        }
        
        .combo-box-select {
          width: 100%;
          padding: 8px 12px;
          border: 1px solid #ced4da;
          border-radius: 4px;
          background-color: #fff;
          font-size: 14px;
          line-height: 1.5;
          color: #495057;
          appearance: none;
          -webkit-appearance: none;
          -moz-appearance: none;
          cursor: pointer;
          position: relative;
          z-index: 1;
        }
        
        .combo-box-select:focus {
          border-color: #80bdff;
          outline: 0;
          box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
        }
        
        .combo-box-arrow {
          position: absolute;
          top: 50%;
          right: 12px;
          transform: translateY(-50%);
          width: 0;
          height: 0;
          border-left: 4px solid transparent;
          border-right: 4px solid transparent;
          border-top: 4px solid #6c757d;
          pointer-events: none;
          z-index: 2;
        }
        
        /* Ensure dropdown options are visible */
        .combo-box-select option {
          background-color: #fff;
          color: #495057;
          padding: 8px 12px;
        }
        
        .combo-box-select:hover {
          border-color: #adb5bd;
        }
        
        /* Override any conflicting z-index issues */
        .card {
          position: relative;
          z-index: 1;
        }
        
        .filter-card-body {
          position: relative;
          z-index: 10;
        }
      `}</style>
      <Layout>
        <Header title="Item Details" />
        <ToastContainer />
        <div style={{ marginBottom: 16 }}>
          <Space direction="vertical" size={12} style={{ width: "100%" }}>
            <Space wrap style={{ width: "100%", justifyContent: "space-between" }}>
              <Space wrap>
                <Input
                  allowClear
                  prefix={<SearchOutlined />}
                  placeholder="Search by item name, description, or ID"
                  value={searchTerm}
                  onChange={handleSearchChange}
                  style={{ width: 300 }}
                />
                <Select
                  allowClear
                  placeholder="All Categories"
                  value={selectedCategory || undefined}
                  onChange={handleCategoryChange}
                  style={{ width: 220 }}
                  options={categoryOptions}
                />
                <Select
                  allowClear
                  placeholder="All Subcategories"
                  value={selectedSubcategory || undefined}
                  onChange={handleSubcategoryChange}
                  style={{ width: 220 }}
                  disabled={subcategoryOptions.length === 0}
                  options={subcategoryOptions}
                />
                <Tag color={(searchTerm || selectedCategory || selectedSubcategory) ? "blue" : "default"}>
                  {filteredData.length} of {originalData.length} items
                </Tag>
                {(searchTerm || selectedCategory || selectedSubcategory) && (
                  <Button onClick={clearFilters}>Clear Filters</Button>
                )}
              </Space>

              <Space wrap>
                {selectedItems.length > 0 && (
                  <Button danger onClick={handleBulkDelete} icon={<DeleteOutlined />}>
                    Delete ({selectedItems.length})
                  </Button>
                )}
                <Button onClick={exportToExcel} disabled={filteredData.length === 0}>Excel</Button>
                <Button onClick={exportToPDF} disabled={filteredData.length === 0}>PDF</Button>
                <Button onClick={printTable} disabled={filteredData.length === 0}>Print</Button>
                <Button onClick={printThermal} disabled={filteredData.length === 0}>Print Thermal</Button>
                <Button onClick={printThermalHTML} disabled={filteredData.length === 0}>Thermal HTML</Button>
                <Button type="primary" onClick={AddNewItemPriceButton}>Add New Item</Button>
                <Button type="default" onClick={AddNewItemAntButton}>Add Item (Ant)</Button>
                <Button type="dashed" onClick={GenerateBarcodeButton}>Generate Barcode</Button>
              </Space>
            </Space>
          </Space>
        </div>

        <div className="row">
          <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12" id="tableid">
            {filteredData.length === 0 ? (
              <div className="no-data">
                <i className="fas fa-inbox fa-3x mb-3"></i>
                <p>No items available</p>
              </div>
            ) : (
              <>
                <Table
                  rowKey="id"
                  columns={columns}
                  dataSource={filteredData}
                  rowSelection={rowSelection}
                  showSorterTooltip={{ target: "sorter-icon" }}
                  pagination={{
                    current: currentPage,
                    pageSize: itemsPerPage,
                    total: filteredData.length,
                    showSizeChanger: true,
                    pageSizeOptions: ["5", "10", "25", "50", "100"],
                    showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`,
                    onChange: (page, pageSize) => {
                      setCurrentPage(page);
                      setItemsPerPage(pageSize);
                    },
                    onShowSizeChange: (_, size) => {
                      setItemsPerPage(size);
                      setCurrentPage(1);
                    },
                  }}
                  scroll={{ x: 1200 }}
                />
              </>
            )}
          </div>
        </div>

        {/* <NewItemModal
          isOpen={showModalItem}
          customer={selectedContract}
          onItemAdded={triggerReload} // Pass the reload function
          onClose={() => setShowModalItem(false)} // Close the modal
        /> */}
        <div className="row">
          <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12" >
            <NewItemPriceModal
              isOpen={showModal}
              customer={null}
              onItemAdded={triggerReload} // Pass the reload function
              onClose={() => setShowModal(false)} // Close the modal
            />
            <NewItemModalAnt
              isOpen={showModalItemAnt}
              onItemAdded={triggerReload}
              onClose={() => setShowModalItemAnt(false)}
            />
            <BarcodeModal
              isOpen={showBarcodeModal}
              items={data}
              onClose={() => setShowBarcodeModal(false)}
            />
            <EditItemModal
              isOpen={showEditModal}
              item={selectedItem}
              onItemUpdated={triggerReload}
              onClose={handleEditModalClose}
            />
          </div>
        </div>

      </Layout>
    </>
  );
}
