import React, { useEffect, useState } from "react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import Layout from "../../layout/Layout";
import Header from "../../components/Header";
import CardComponent from "../../components/cards/CardComponent";
import DataTable from "../../components/data-tables/dataTable";
import { getHeaders } from "../../utility/getHeader";
import fetchData from "../../functions/fetchData";
import { fetchComboData } from "../../services/api";
import "react-toastify/dist/ReactToastify.css";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { CSVLink } from "react-csv";
import logo from "../../assets/logo.png"


export default function StockReport() {
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [items, setItems] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [filters, setFilters] = useState({
    item_id: "",
    supplier_id: "",
    fromDate: "",
    toDate: "",
  });
  const [viewingClosingStock, setViewingClosingStock] = useState(false);

  const columns = viewingClosingStock
    ? [
      { label: "S.No.", field: "sno" },
      { label: "Item Name", field: "item_name" },
      { label: "Closing Stock", field: "closing_stock" },
    ]
    : [
      { label: "ID", field: "id" },
      { label: "Item Name", field: "item_name" },
      { label: "Supplier Name", field: "supplier_name" },
      { label: "Opening Stock", field: "opening_stock" },
      { label: "Stock In", field: "stock_in" },
      { label: "Stock Out", field: "stock_out" },
      { label: "Closing Stock", field: "closing_stock" },
      { label: "Unit", field: "unit" },
      { label: "Purchase Price", field: "purchase_price" },
      { label: "Subtotal", field: "subtotal" },
      { label: "Tax %", field: "tax" },
      { label: "Tax Amount", field: "taxAmount" },
      { label: "Net Amount", field: "netAmount" },
    ];

  const fetchInventory = async () => {
    try {
      const headers = getHeaders();
      const res = await axios.get("/inventory/joined", headers);
      setData(res.data);
      setFilteredData(res.data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch joined inventory data");
    }
  };

  useEffect(() => {
    fetchInventory();
    // Use fetchComboData for items dropdown
    fetchComboData("items", "id").then((res) => {
      // If you want to filter by isstockable, do it here:
      setItems(res.filter(item => item.isstockable === '1' || item.isstockable === 1));
    });
    fetchData("suppliers", setSuppliers, "id", {});
   
  }, []);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => {
      const newFilters = { ...prev, [name]: value };
      autoApplyFilters(newFilters);
      return newFilters;
    });
  };

  const autoApplyFilters = (newFilters) => {
    let filtered = data;
    if (newFilters.item_id) {
      filtered = filtered.filter((row) => row.item_id?.toString() === newFilters.item_id);
    }
    if (newFilters.supplier_id) {
      filtered = filtered.filter((row) => row.supplier_id?.toString() === newFilters.supplier_id);
    }
    if (newFilters.fromDate) {
      filtered = filtered.filter((row) => new Date(row.pdate) >= new Date(newFilters.fromDate));
    }
    if (newFilters.toDate) {
      filtered = filtered.filter((row) => new Date(row.pdate) <= new Date(newFilters.toDate));
    }
    setFilteredData(filtered);
    setViewingClosingStock(false);
  };

  const applyFilters = () => autoApplyFilters(filters);

  const resetFilters = () => {
    const reset = { item_id: "", supplier_id: "", fromDate: "", toDate: "" };
    setFilters(reset);
    setFilteredData(data);
    setViewingClosingStock(false);
  };

  const viewClosingStock = () => {
    const closingStockMap = {};
    data.forEach((entry) => {
      // For each item, keep the entry with the highest id (last entry)
      if (!closingStockMap[entry.item_id] || closingStockMap[entry.item_id].id < entry.id) {
        closingStockMap[entry.item_id] = entry;
      }
    });

    let final = Object.values(closingStockMap).map((item, index) => ({
      sno: index + 1,
      item_name: item.item_name,
      closing_stock: item.closing_stock,
    }));

    // Sort alphabetically by item_name
    final = final.sort((a, b) => a.item_name.localeCompare(b.item_name));

    // Reassign serial numbers after sorting
    final = final.map((item, index) => ({ ...item, sno: index + 1 }));

    setFilteredData(final);
    setViewingClosingStock(true);
  };
  const handlePrint = () => {
    const companyName = "Your Company Name"; // Replace with your company name
    const reportTitle = "Stock Report";

    const tableContainer = document.getElementById("tableid");
    if (!tableContainer) {
      toast.error("No data available to print.");
      return;
    }

    // Find the table inside the container
    const table = tableContainer.querySelector("table");
    if (!table) {
      toast.error("No table found to print.");
      return;
    }

    const printWindow = window.open("", "_blank", "width=900,height=700");
    printWindow.document.write(`
    <html>
      <head>
        <title>${reportTitle}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          h1 { text-align: center; margin-bottom: 0; }
          h2 { text-align: center; margin-top: 5px; margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; }
          table, th, td { border: 1px solid black; }
          th, td { padding: 8px; text-align: left; }
        </style>
      </head>
      <body>
        <h1>${companyName}</h1>
        <h2>${reportTitle}</h2>
        ${table.outerHTML}
      </body>
    </html>
  `);

    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  };

const exportToPDF = () => {
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  });

  const logoImg = new Image();
  logoImg.src = "/logo.png"; // ✅ Use root path for public assets

  logoImg.onload = () => {
    doc.addImage(logoImg, "PNG", 240, 10, 40, 15); // x, y, width, height
    doc.setFontSize(16);
    doc.text("Stock Report", 14, 20);

    const tableColumn = columns.map((col) => col.label);
    const tableRows = filteredData.map((row) =>
      columns.map((col) => row[col.field] || "")
    );

doc.autoTable({
  startY: 30,
  head: [tableColumn],
  body: tableRows,
  styles: { fontSize: 8 },
  columnStyles: {
    [tableColumn.length - 1]: {
      cellWidth: 40,      // wider to fit total text
      halign: "center",   // ✅ center align values
    },
  },
  foot: [
    tableColumn.map((col, index) => {
      if (col === "Grand Total" || col === "Net Amount") {
        const total = filteredData.reduce((acc, item) => acc + parseFloat(item.netAmount || 0), 0);
        return `Total: THB ${total.toFixed(2)}`;
      }
      return "";
    }),
  ],
  footStyles: {
    fontStyle: "bold",
    halign: "center", // ✅ center align total value
  },
});




    doc.save("stock_report.pdf");
  };

  logoImg.onerror = () => {
    toast.error("Logo image failed to load. Make sure it is in the /public folder.");
  };
};




  return (
    <Layout>
      <Header title="Stock Report" />
      <ToastContainer />
      <div className="row">
        <div className="col-12">
          <CardComponent title="Filter Stock Report" headerColor="primary">
            <div className="form-row row">
              <div className="form-group col-md-3">
                <label>Item Name</label>
                <select
                  className="form-control"
                  name="item_id"
                  value={filters.item_id}
                  onChange={handleFilterChange}
                >
                  <option value="">All</option>
                  {items.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.iname}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group col-md-3">
                <label>Supplier Name</label>
                <select
                  className="form-control"
                  name="supplier_id"
                  value={filters.supplier_id}
                  onChange={handleFilterChange}
                >
                  <option value="">All</option>
                  {suppliers.map((supplier) => (
                    <option key={supplier.id} value={supplier.id}>
                      {supplier.company_name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group col-md-2">
                <label>From Date</label>
                <input
                  type="date"
                  className="form-control"
                  name="fromDate"
                  value={filters.fromDate}
                  onChange={handleFilterChange}
                />
              </div>
              <div className="form-group col-md-2">
                <label>To Date</label>
                <input
                  type="date"
                  className="form-control"
                  name="toDate"
                  value={filters.toDate}
                  onChange={handleFilterChange}
                />
              </div>
              <div className="form-group col-md-2"></div>
           <button onClick={applyFilters} className="btn btn-primary mr-2">
                  Apply
                </button>
            </div>
            <div className="row">
              <div className="col-12">
    
               
                 <button onClick={viewClosingStock} className="btn btn-info">
                  View Closing Stock
                </button>
                <button onClick={resetFilters} className="btn btn-warning mr-2">
                  Reset
                </button>
                
               
                 
                <button onClick={handlePrint} className="btn btn-success">
                  Print
                </button>
                <button onClick={exportToPDF} className="btn btn-danger mr-2">
  Export PDF
</button>

<CSVLink
  data={filteredData}
  filename="stock_report.csv"
  className="btn btn-success mr-2"
>
  Export Excel
</CSVLink>
              </div>

            
            </div>
          </CardComponent>
        </div>

        <div className="col-12 mt-4" id="tableid">
          {filteredData.length === 0 ? (
            <p>No stock entries available.</p>
          ) : (
            <DataTable columns={columns} data={filteredData} tablename="inventory" />
          )}
        </div>
        {filteredData.length > 0 && (
  <div className="mt-3 text-right pr-4">
    <h5>
      Total Grand Amount: ฿
      {filteredData
        .reduce((acc, item) => acc + parseFloat(item.netAmount || 0), 0)
        .toFixed(2)}
    </h5>
  </div>
)}

      </div>
    </Layout>
  );
}
