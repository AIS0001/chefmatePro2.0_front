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
import fetchDatanotequal from "../../functions/viewAllData";
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

  useEffect(() => {
    const fetchData = async () => {
      try {
        await fetchDatanotequal("final_bill", setData, "id", { status: 2 });
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    localStorage.setItem("startDate", startDate);
    localStorage.setItem("endDate", endDate);
    localStorage.setItem("paymentMode", paymentMode);
    filterData();
  }, [data, startDate, endDate, paymentMode, activeTab]);

  const applyFilter = () => {
    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
      toast.error("Invalid date range: Start Date is after End Date");
      return;
    }

    const filtered = data.filter((item) => {
      if (!item.inv_date) return false;
      const itemDate = new Date(item.inv_date);
      const isInRange = (!startDate || itemDate >= new Date(startDate)) && (!endDate || itemDate <= new Date(endDate));
      const matchesPayment = !paymentMode || item.payment_mode === paymentMode;
      const matchesOrder = !orderNoSearch || item.id.toString().includes(orderNoSearch);
      return isInRange && matchesPayment && matchesOrder;
    });

    setFilteredData(filtered);
  };

 const filterData = () => {
    let source = [...data];
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      source = source.filter(item => {
        const itemDate = new Date(item.inv_date);
        return itemDate >= start && itemDate <= end;
      });
    }
    if (paymentMode) {
      source = source.filter(item => item.payment_mode === paymentMode);
    }
   if (activeTab === "cancelled") {
  const activeBills = source.filter(item => item.status !== 0 && item.status !== "0");
  setFilteredData(activeBills);
} else {
  const cancelled = source.filter(item => item.status === 0 || item.status === "0");
  setFilteredData(cancelled);
  const total = cancelled.reduce((acc, item) => acc + parseFloat(item.grand_total || 0), 0);
  setCancelledTotal(total.toFixed(2));
}

  };
  const clearFilters = () => {
    setStartDate("");
    setEndDate("");
    setPaymentMode("");
    setOrderNoSearch("");
    setFilteredData(data);
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
          <div className="col-md-3">
            <label>Order No.</label>
            <input type="text" className="form-control" value={orderNoSearch} onChange={(e) => setOrderNoSearch(e.target.value)} />
          </div>
        </div>
        <div className="row mb-3">
          <div className="col-md-3 d-flex align-items-end">
            <button className="btn btn-primary w-100" onClick={applyFilter}>Apply Filter</button>
          </div>
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
          <div className="col-md-3 d-flex align-items-end">
            <button className="btn btn-info w-100" onClick={clearFilters}>Clear Filters</button>
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
