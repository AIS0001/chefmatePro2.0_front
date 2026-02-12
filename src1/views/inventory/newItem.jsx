/* eslint-disable no-undef */

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";

import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import Header from "../../components/Header";
import Layout from "../../layout/Layout";
import { format } from "date-fns";

import DataTable from "../../components/data-tables/dataTable";
import fetchData from "../../functions/fetchData";
import { deleteItem, deleteBulkItems } from "../../functions/delateData";
import { isTokenExpired, logout } from "../../utility/auth";
import NewItemModal from "../../components/Modals/NewItemModal";
import NewItemModalAnt from "../../components/Modals/NewItemModalAnt";
import NewItemPriceModal from "../../components/Modals/NewItemPriceModal";
import BarcodeModal from "../../components/Modals/BarcodeModal";
import EditItemModal from "../../components/Modals/EditItemModal";
import {ComboBox} from "../../components/Buttons/ComboBox";

// Import libraries for export functionality
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export default function NewItem() {
  const navigate = useNavigate();
  let currentDate = format(new Date(), "yyyy-MM-dd");
  //  const headers = { Authorization: authheader().access_token };
  const [data, setData] = useState([]);
  const [errors, setErrors] = useState({});
  const [selectedContract, setSelectedContract] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showModalItem, setShowModalItem] = useState(false);
  const [showModalItemAnt, setShowModalItemAnt] = useState(false);
  const [showBarcodeModal, setShowBarcodeModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [reload, setReload] = useState(false); // Define reload state
  const [selectedItems, setSelectedItems] = useState([]); // For bulk delete
  const [selectAll, setSelectAll] = useState(false); // For select all checkbox
  const [loading, setLoading] = useState(true); // Add loading state

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10); // Number of items per page
  const [totalItems, setTotalItems] = useState(0);

  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredData, setFilteredData] = useState([]);
  const [originalData, setOriginalData] = useState([]);

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

  const [formdata, setFormData] = useState({
    name: "",
  });
  const columns = [
    { label: "ID", field: "id" },
    { label: "Item Name", field: "iname" },
    { label: "unit", field: "unit" },
    { label: "Tax", field: "tax" },
    { label: "MRP", field: "mrp" },
    { label: "Offer Price", field: "offerprice" },
    { label: "Details", field: "description" },
    { label: "Actions", field: "actions" },
  ];
  const AddNewItemButton = (contract) => {
    // setSelectedContract(contract);
    setShowModalItem(true);
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
  const checkTokenExpiration = () => {
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
  };

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
        item.iname || '',
        item.unit || '',
        `${item.tax || '0'}%`,
        `฿${item.mrp || '0'}`,
        `฿${item.offerprice || '0'}`,
        item.description || ''
      ]);

      // Add table
      doc.autoTable({
        head: [['ID', 'Item Name', 'Unit', 'Tax', 'MRP', 'Offer Price', 'Description']],
        body: tableData,
        startY: 40,
        styles: {
          fontSize: 8,
          cellPadding: 2
        },
        headStyles: {
          fillColor: [23, 162, 184],
          textColor: 255
        },
        columnStyles: {
          0: { cellWidth: 15 },
          1: { cellWidth: 35 },
          2: { cellWidth: 20 },
          3: { cellWidth: 15 },
          4: { cellWidth: 25 },
          5: { cellWidth: 25 },
          6: { cellWidth: 50 }
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
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true); // Start loading
        const items = await fetchData("items", setData, "id", {});
        // console.log("Fetched data:", items);
        setData(items); // Ensure the data state is set with fetched items
        setOriginalData(items); // Store original data for filtering
        setFilteredData(items); // Initialize filtered data
        setTotalItems(items.length); // Set total count for pagination
        setLoading(false); // Stop loading
      } catch (error) {
        console.error("Error in useEffect:", error);
        setLoading(false); // Stop loading on error
        
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
  }, [reload]);
  
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

    setFilteredData(filtered);
    setTotalItems(filtered.length);
    setCurrentPage(1); // Reset to first page when filters change
  }, [searchTerm, originalData]);

  // Filter handlers - memoized
  const handleSearchChange = useCallback((e) => {
    setSearchTerm(e.target.value);
  }, []);

  const clearFilters = useCallback(() => {
    setSearchTerm("");
    setFilteredData(originalData);
    setTotalItems(originalData.length);
    setCurrentPage(1);
  }, [originalData]);

  // Apply filters whenever search term changes
  useEffect(() => {
    applyFilters();
  }, [searchTerm, originalData]);
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
        {/* Single Row Layout: Delete Button | Search | Export Buttons | Action Buttons */}
        <div className="row mb-3">
          <div className="col-12">
            <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
              {/* Left Section: Delete Button */}
              <div className="d-flex align-items-center">
                {selectedItems.length > 0 && (
                  <button
                    type="button"
                    onClick={handleBulkDelete}
                    className="btn btn-danger btn-sm"
                    title={`Delete ${selectedItems.length} selected item(s)`}
                  >
                    <i className="fas fa-trash"></i> Delete ({selectedItems.length})
                  </button>
                )}
              </div>

              {/* Center Section: Search */}
              <div className="d-flex align-items-center flex-grow-1 mx-3">
                <label className="form-label me-2 mb-0 text-nowrap">Search:</label>
                <input
                  type="text"
                  className="form-control form-control-sm"
                  placeholder="Search by item name, description, or ID..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                  style={{ maxWidth: '300px' }}
                />
                {searchTerm && (
                  <button
                    type="button"
                    className="btn btn-outline-secondary btn-sm ms-2"
                    onClick={clearFilters}
                    title="Clear search"
                  >
                    <i className="fas fa-times"></i>
                  </button>
                )}
                <small className="text-muted ms-3 text-nowrap">
                  {filteredData.length} of {originalData.length} items
                  {searchTerm && <i className="fas fa-search ms-1"></i>}
                </small>
              </div>

              {/* Right Section: Export and Action Buttons */}
              <div className="d-flex align-items-center gap-2">
                {/* Export Buttons */}
                <div className="btn-group" role="group" aria-label="Export options">
                  <button
                    type="button"
                    className="btn btn-success btn-sm"
                    onClick={exportToExcel}
                    title="Export to Excel"
                    disabled={filteredData.length === 0}
                  >
                    <i className="fas fa-file-excel"></i> Excel
                  </button>
                  <button
                    type="button"
                    className="btn btn-danger btn-sm"
                    onClick={exportToPDF}
                    title="Export to PDF"
                    disabled={filteredData.length === 0}
                  >
                    <i className="fas fa-file-pdf"></i> PDF
                  </button>
                  <button
                    type="button"
                    className="btn btn-info btn-sm"
                    onClick={printTable}
                    title="Print Table"
                    disabled={filteredData.length === 0}
                  >
                    <i className="fas fa-print"></i> Print
                  </button>
                </div>

                {/* Action Buttons */}
                <button
                  type="button"
                  name="add"
                  onClick={AddNewItemPriceButton}
                  className="btn btn-primary btn-sm"
                  title="Add New Item"
                >
                  <i className="fas fa-plus"></i> Add New Item
                </button>
                
                <button
                  type="button"
                  name="addAnt"
                  onClick={AddNewItemAntButton}
                  className="btn btn-success btn-sm"
                  title="Add New Item (Liquor/Multi-Unit)"
                >
                  <i className="fas fa-plus-circle"></i> Add Item (Ant)
                </button>
                
                <button
                  type="button"
                  name="generate"
                  onClick={GenerateBarcodeButton}
                  className="btn btn-secondary btn-sm"
                  title="Generate Barcode"
                >
                  <i className="fas fa-barcode"></i> Generate Barcode
                </button>
              </div>
            </div>
          </div>
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
                <div className="table-responsive">
                <table className="table table-striped table-bordered custom-table">
                  <thead>
                    <tr>
                      <th>
                        <input
                          type="checkbox"
                          checked={selectAll}
                          onChange={(e) => handleSelectAll(e.target.checked)}
                          title="Select All"
                        />
                      </th>
                      <th>ID</th>
                      <th>Item Code</th>
                      <th>Item Name</th>
                      <th>Unit</th>
                      <th>Tax (%)</th>
                      <th>MRP</th>
                      <th>Offer Price</th>
                      <th>Details</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentData.map((item) => (
                      <tr key={item.id} className={selectedItems.includes(item.id) ? 'table-active' : ''}>
                        <td>
                          <input
                            type="checkbox"
                            checked={selectedItems.includes(item.id)}
                            onChange={(e) => handleItemSelect(item.id, e.target.checked)}
                            title={`Select item ${item.id}`}
                          />
                        </td>
                        <td><strong>{item.id}</strong></td>
                        <td>{item.item_code || 'N/A'}</td>
                        <td>{item.iname || 'N/A'}</td>
                        <td>{item.unit || 'N/A'}</td>
                        <td>{item.tax ? `${item.tax}%` : '0%'}</td>
                        <td>฿{item.mrp ? parseFloat(item.mrp).toFixed(2) : '0.00'}</td>
                        <td>฿{item.offerprice ? parseFloat(item.offerprice).toFixed(2) : '0.00'}</td>
                        <td>{item.description || 'No description'}</td>
                        <td>
                          <div className="btn-group" role="group">
                            <button
                              type="button"
                              className="btn btn-sm btn-warning"
                              onClick={() => handleEditClick(item)}
                              title="Edit Item"
                            >
                              <i className="fas fa-edit"></i> Edit
                            </button>
                            <button
                              type="button"
                              className="btn btn-sm btn-danger"
                              onClick={() => handleDeleteItem(item.id)}
                              title="Delete Item"
                            >
                              <i className="fas fa-trash"></i> Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="pagination-container mt-4">
                  <div className="row">
                    <div className="col-md-3">
                      <div className="pagination-info">
                        <span>
                          Showing {startIndex + 1} to {Math.min(endIndex, totalItems)} of {totalItems} entries
                        </span>
                      </div>
                    </div>
                    <div className="col-md-3">
                      <div className="page-size-selector">
                        <label htmlFor="pageSize" className="me-2">Show:</label>
                        <select 
                          id="pageSize"
                          className="form-select form-select-sm d-inline-block w-auto"
                          value={itemsPerPage}
                          onChange={(e) => handleItemsPerPageChange(parseInt(e.target.value))}
                        >
                          <option value={5}>5</option>
                          <option value={10}>10</option>
                          <option value={25}>25</option>
                          <option value={50}>50</option>
                          <option value={100}>100</option>
                        </select>
                        <span className="ms-2">entries</span>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <nav aria-label="Page navigation">
                        <ul className="pagination justify-content-end mb-0">
                          {/* First Page Button */}
                          <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                            <button 
                              className="page-link" 
                              onClick={goToFirstPage}
                              disabled={currentPage === 1}
                              title="First Page"
                            >
                              <i className="fas fa-angle-double-left"></i>
                            </button>
                          </li>
                          
                          {/* Previous Page Button */}
                          <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                            <button 
                              className="page-link" 
                              onClick={goToPreviousPage}
                              disabled={currentPage === 1}
                              title="Previous Page"
                            >
                              <i className="fas fa-angle-left"></i>
                            </button>
                          </li>
                          
                          {/* Page Numbers */}
                          {(() => {
                            const { startPage, endPage } = getPageRange();
                            const pages = [];
                            
                            // Show ellipsis if we're not starting from page 1
                            if (startPage > 1) {
                              pages.push(
                                <li key="1" className="page-item">
                                  <button className="page-link" onClick={() => goToPage(1)}>1</button>
                                </li>
                              );
                              if (startPage > 2) {
                                pages.push(
                                  <li key="ellipsis1" className="page-item disabled">
                                    <span className="page-link">...</span>
                                  </li>
                                );
                              }
                            }
                            
                            // Show page numbers in range
                            for (let i = startPage; i <= endPage; i++) {
                              pages.push(
                                <li key={i} className={`page-item ${currentPage === i ? 'active' : ''}`}>
                                  <button 
                                    className="page-link" 
                                    onClick={() => goToPage(i)}
                                  >
                                    {i}
                                  </button>
                                </li>
                              );
                            }
                            
                            // Show ellipsis if we're not ending at the last page
                            if (endPage < totalPages) {
                              if (endPage < totalPages - 1) {
                                pages.push(
                                  <li key="ellipsis2" className="page-item disabled">
                                    <span className="page-link">...</span>
                                  </li>
                                );
                              }
                              pages.push(
                                <li key={totalPages} className="page-item">
                                  <button className="page-link" onClick={() => goToPage(totalPages)}>
                                    {totalPages}
                                  </button>
                                </li>
                              );
                            }
                            
                            return pages;
                          })()}
                          
                          {/* Next Page Button */}
                          <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                            <button 
                              className="page-link" 
                              onClick={goToNextPage}
                              disabled={currentPage === totalPages}
                              title="Next Page"
                            >
                              <i className="fas fa-angle-right"></i>
                            </button>
                          </li>
                          
                          {/* Last Page Button */}
                          <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                            <button 
                              className="page-link" 
                              onClick={goToLastPage}
                              disabled={currentPage === totalPages}
                              title="Last Page"
                            >
                              <i className="fas fa-angle-double-right"></i>
                            </button>
                          </li>
                        </ul>
                      </nav>
                    </div>
                  </div>
                </div>
              )}
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
              customer={selectedContract}
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
