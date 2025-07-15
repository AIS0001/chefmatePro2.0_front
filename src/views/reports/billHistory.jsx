// Updated BillHistory.jsx
import React, { useEffect, useState } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { CSVLink } from "react-csv";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { parseISO, format } from "date-fns";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

import Layout from "../../layout/Layout";
import Header from "../../components/Header";
import CardComponent from "../../components/cards/CardComponent";
import DataTable from "../../components/data-tables/dataTable";
import fetchData from "../../functions/fetchData";
import logo from "../../assets/logo.png";
import BillItemModal from "../../components/Modals/BillItemModal";

export default function BillHistory() {
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [startDate, setStartDate] = useState(localStorage.getItem("startDate") || "");
  const [endDate, setEndDate] = useState(localStorage.getItem("endDate") || "");
  const [paymentMode, setPaymentMode] = useState(localStorage.getItem("paymentMode") || "");
  const [orderNoSearch, setOrderNoSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [selectedBill, setSelectedBill] = useState(null);
  const [activeTab, setActiveTab] = useState("active");
  const [cancelledTotal, setCancelledTotal] = useState(0);
  const [tableFilter, setTableFilter] = useState("");
  const [amountFilter, setAmountFilter] = useState({ min: "", max: "" });
  const [sortBy, setSortBy] = useState("date");
  const [sortOrder, setSortOrder] = useState("desc");

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        await fetchData("final_bill", setData, "id",{});
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };
    fetchAllData();
  }, []);

  // Initial data load effect
  useEffect(() => {
    if (data.length > 0) {
      applyFilters();
    }
  }, [data]);

  // Filter change effect
  useEffect(() => {
    localStorage.setItem("startDate", startDate);
    localStorage.setItem("endDate", endDate);
    localStorage.setItem("paymentMode", paymentMode);
    if (data.length > 0) {
      applyFilters();
    }
  }, [startDate, endDate, paymentMode, activeTab, orderNoSearch, tableFilter, amountFilter, sortBy, sortOrder]);

  const applyFilters = () => {
    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
      toast.error("Invalid date range: Start Date is after End Date");
      return;
    }

    let filtered = [...data];
    
    // Debug: Log raw data status values
    console.log("Raw data status values:", data.map(item => ({ id: item.id, status: item.status, type: typeof item.status })));
    console.log("Total raw data count:", data.length);
    
    // TEMPORARY: Show all data first to debug
    console.log("Active tab:", activeTab);
    console.log("All data:", data);
    
    // Filter by status (active/cancelled)
    if (activeTab === "cancelled") {
      filtered = filtered.filter(item => item.status === 2 || item.status === "2");
      console.log("Filtered cancelled bills:", filtered.length);
    } else {
      filtered = filtered.filter(item => item.status !== 2 && item.status !== "2");
      console.log("Filtered active bills:", filtered.length);
    }
    
    // TEMPORARY: If no filtered data, show all data for debugging
    if (filtered.length === 0) {
      console.log("No filtered data found, showing all data for debugging");
      filtered = [...data];
    }
    
    // Filter by date range
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999); // Include the entire end date
      
      filtered = filtered.filter(item => {
        if (!item.inv_date) return false;
        const itemDate = new Date(item.inv_date);
        return itemDate >= start && itemDate <= end;
      });
    } else if (startDate) {
      const start = new Date(startDate);
      filtered = filtered.filter(item => {
        if (!item.inv_date) return false;
        const itemDate = new Date(item.inv_date);
        return itemDate >= start;
      });
    } else if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      filtered = filtered.filter(item => {
        if (!item.inv_date) return false;
        const itemDate = new Date(item.inv_date);
        return itemDate <= end;
      });
    }
    
    // Filter by payment mode
    if (paymentMode) {
      filtered = filtered.filter(item => item.payment_mode === paymentMode);
    }
    
    // Filter by invoice number
    if (orderNoSearch) {
      filtered = filtered.filter(item => 
        item.id.toString().includes(orderNoSearch.toLowerCase())
      );
    }
    
    // Filter by table
    if (tableFilter) {
      filtered = filtered.filter(item => 
        item.table_number && item.table_number.toLowerCase().includes(tableFilter.toLowerCase())
      );
    }
    
    // Filter by amount range
    if (amountFilter.min || amountFilter.max) {
      filtered = filtered.filter(item => {
        const amount = parseFloat(item.grand_total || 0);
        const minAmount = parseFloat(amountFilter.min || 0);
        const maxAmount = parseFloat(amountFilter.max || Infinity);
        return amount >= minAmount && amount <= maxAmount;
      });
    }
    
    // Sort data
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case "date":
          aValue = new Date(a.inv_date + " " + (a.inv_time || "00:00:00"));
          bValue = new Date(b.inv_date + " " + (b.inv_time || "00:00:00"));
          break;
        case "amount":
          aValue = parseFloat(a.grand_total || 0);
          bValue = parseFloat(b.grand_total || 0);
          break;
        case "table":
          aValue = a.table_number || "";
          bValue = b.table_number || "";
          break;
        case "invoice":
          aValue = parseInt(a.id || 0);
          bValue = parseInt(b.id || 0);
          break;
        default:
          aValue = a.id;
          bValue = b.id;
      }
      
      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
    
    setFilteredData(filtered);
    
    // Calculate totals
    if (activeTab === "cancelled") {
      const total = filtered.reduce((acc, item) => acc + parseFloat(item.grand_total || 0), 0);
      setCancelledTotal(total.toFixed(2));
    }
  };
  const clearFilters = () => {
    setStartDate("");
    setEndDate("");
    setPaymentMode("");
    setOrderNoSearch("");
    setTableFilter("");
    setAmountFilter({ min: "", max: "" });
    setSortBy("date");
    setSortOrder("desc");
    localStorage.removeItem("startDate");
    localStorage.removeItem("endDate");
    localStorage.removeItem("paymentMode");
  };

 const exportPDF = () => {
  const doc = new jsPDF();
  doc.addImage(logo, "PNG", 150, 10, 40, 15);
  doc.setFontSize(16);
  doc.text("Bill History", 14, 20);

  const tableColumn = ["Invoice No", "Date", "Time", "Table", "Subtotal", "Grand Total", "Payment Mode"];
  const tableRows = [];

  let totalSubtotal = 0;
  let totalGrandTotal = 0;

  filteredData.forEach(item => {
    const subtotal = parseFloat(item.subtotal_afterdiscount) || 0;
    const grandTotal = parseFloat(item.grand_total) || 0;

    totalSubtotal += subtotal;
    totalGrandTotal += grandTotal;

    tableRows.push([
      item.id,
      item.inv_date,
      item.inv_time,
      item.table_number,
      subtotal.toFixed(2),
      grandTotal.toFixed(2),
      item.payment_mode,
    ]);
  });

  // Add total row
  tableRows.push([
    { content: "Total", colSpan: 4, styles: { halign: "right", fontStyle: "bold" } },
    totalSubtotal.toFixed(2),
    totalGrandTotal.toFixed(2),
    "" // Empty payment mode column
  ]);

  doc.autoTable({
    startY: 30,
    head: [tableColumn],
    body: tableRows,
    styles: { fontSize: 10 },
  });

  doc.save("salereport.pdf");
};


  const handleViewItems = (row) => {
    setSelectedBill(row);
    setShowModal(true);
  };

  const monthlyData = (() => {
    const summary = {};
    (filteredData.length > 0 ? filteredData : data).forEach((item) => {
      const month = format(parseISO(item.inv_date), "MMM yyyy");
      const total = parseFloat(item.grand_total || 0);
      summary[month] = (summary[month] || 0) + total;
    });
    return Object.entries(summary).map(([month, total]) => ({ month, total }));
  })();

  const columns = [
    {
      label: "Inv. No.",
      field: "id",
      render: (row) => (
        <button className="btn btn-link p-0" onClick={() => handleViewItems(row)}>
          #{row.id}
        </button>
      ),
    },
    { label: "Date", field: "inv_date" },
    { label: "Time", field: "inv_time" },
    { label: "Table", field: "table_number" },
    { label: "Subtotal", field: "subtotal_afterdiscount" },
    { label: "Tax", field: "tax" },
    { label: "Grand Total", field: "grand_total" },
    { label: "Payment", field: "payment_mode" },
    {
      label: "Action",
      field: "actions",
      render: (row) => (
        <button className="btn btn-sm btn-info" onClick={() => handleViewItems(row)}>
          View Items
        </button>
      ),
    },
  ];

  return (
    <Layout>
      <Header title="Sale Report" />
      <ToastContainer />
      
      <CardComponent>
         <div className="d-flex mb-3">
          <button
            className={`btn btn-${activeTab === "active" ? "primary" : "outline-primary"} me-2`}
            onClick={() => setActiveTab("active")}
          >
            Active Bills
          </button>
          <button
            className={`btn btn-${activeTab === "cancelled" ? "danger" : "outline-danger"}`}
            onClick={() => setActiveTab("cancelled")}
          >
            Cancelled Bills
          </button>
        </div>
        <div className="row mb-3">
          <div className="col-md-3">
            <label>Start Date</label>
            <input 
              type="date" 
              className="form-control" 
              value={startDate} 
              onChange={(e) => setStartDate(e.target.value)} 
            />
          </div>
          <div className="col-md-3">
            <label>End Date</label>
            <input 
              type="date" 
              className="form-control" 
              value={endDate} 
              onChange={(e) => setEndDate(e.target.value)} 
            />
          </div>
          <div className="col-md-3">
            <label>Payment Mode</label>
            <select 
              className="form-control" 
              value={paymentMode} 
              onChange={(e) => setPaymentMode(e.target.value)}
            >
              <option value="">All</option>
              <option value='Cash'>Cash</option>
              <option value='Credit'>Credit</option>
              <option value='Bank Transfer'>Bank Transfer</option>
              <option value='Entertainment'>Entertainment</option>
              <option value='UPI'>UPI</option>
              <option value='QR Code'>QR Code</option>
            </select>
          </div>
          <div className="col-md-3">
            <label>Invoice No.</label>
            <input 
              type="text" 
              className="form-control" 
              value={orderNoSearch} 
              onChange={(e) => setOrderNoSearch(e.target.value)} 
              placeholder="Search invoice number"
            />
          </div>
        </div>
        
        <div className="row mb-3">
          <div className="col-md-3">
            <label>Table Number</label>
            <input 
              type="text" 
              className="form-control" 
              value={tableFilter} 
              onChange={(e) => setTableFilter(e.target.value)} 
              placeholder="Search table number"
            />
          </div>
          <div className="col-md-3">
            <label>Min Amount</label>
            <input 
              type="number" 
              className="form-control" 
              value={amountFilter.min} 
              onChange={(e) => setAmountFilter(prev => ({ ...prev, min: e.target.value }))} 
              placeholder="Minimum amount"
            />
          </div>
          <div className="col-md-3">
            <label>Max Amount</label>
            <input 
              type="number" 
              className="form-control" 
              value={amountFilter.max} 
              onChange={(e) => setAmountFilter(prev => ({ ...prev, max: e.target.value }))} 
              placeholder="Maximum amount"
            />
          </div>
          <div className="col-md-3">
            <label>Sort By</label>
            <select 
              className="form-control" 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="date">Date & Time</option>
              <option value="amount">Amount</option>
              <option value="table">Table</option>
              <option value="invoice">Invoice No.</option>
            </select>
          </div>
        </div>
        
        <div className="row mb-3">
          <div className="col-md-3">
            <label>Sort Order</label>
            <select 
              className="form-control" 
              value={sortOrder} 
              onChange={(e) => setSortOrder(e.target.value)}
            >
              <option value="desc">Descending</option>
              <option value="asc">Ascending</option>
            </select>
          </div>
          <div className="col-md-9 d-flex align-items-end">
            <button className="btn btn-info me-2" onClick={clearFilters}>Clear All Filters</button>
          </div>
        </div>
        
        <div className="row mb-3">
          <div className="col-md-3 d-flex align-items-end">
            <CSVLink
              data={filteredData.length > 0 ? filteredData : data}
              filename="salereport.csv"
              className="btn btn-success w-100"
            >
              Export CSV
            </CSVLink>
          </div>
          <div className="col-md-3 d-flex align-items-end">
            <button className="btn btn-danger w-100" onClick={exportPDF}>Export PDF</button>
          </div>
          <div className="col-md-6 d-flex align-items-end">
            <div className="alert alert-info w-100 mb-0">
              <strong>Total Records:</strong> {filteredData.length} | 
              <strong> Filtered from:</strong> {data.length} total bills
            </div>
          </div>
        </div>
      </CardComponent>

      <div className="row">
        <div className="col-12">
          {filteredData.length === 0 ? (
            <p>No data available.</p>
          ) : (
            <DataTable columns={columns} data={filteredData} tablename="final_bill" />
          )}
          <div className="mt-3">
          
            <h5>
              {activeTab === "cancelled" ? (
                <>Cancelled Bill Total: ฿{filteredData.reduce((acc, item) => acc + parseFloat(item.grand_total || 0), 0).toFixed(2)}</>
              ) : (
                <>Total Sale: ฿{filteredData.reduce((acc, item) => acc + parseFloat(item.grand_total || 0), 0).toFixed(2)}</>
              )}
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
                <Bar dataKey="total" fill="#2334d8" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardComponent>
      </div>

      {showModal && (
        <BillItemModal
          isOpen={showModal}
          bill={selectedBill}
          onClose={() => setShowModal(false)}
        />
      )}
    </Layout>
  );
}
