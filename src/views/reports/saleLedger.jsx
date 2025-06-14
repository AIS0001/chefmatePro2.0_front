import React, { useEffect, useState } from "react";
import { parseISO, isValid, format as fmt } from "date-fns";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { CSVLink } from "react-csv";

import CardComponent from "../../components/cards/CardComponent";
import Header from "../../components/Header";
import Layout from "../../layout/Layout";
import { TextfieldwithLabel } from "../../components/Buttons/Textfield";
import DataTable from "../../components/data-tables/dataTable";
import fetchData from "../../functions/fetchData";
import { fetchComboData } from "../../services/api";
export default function BillHistory() {
  const [data, setData] = useState([]);
  const [Alldata, setAllData] = useState([]);
  const [customerdata, setCustomerdata] = useState([]);
  const [Totals, setTotals] = useState({ credit: 0, debit: 0, balance: 0 });
  const [formdata, setFormData] = useState({
    from: "",
    to: "",
    accounttype: "",
    customername: "",
  });

  const columns = [
    { label: "Txn ID", field: "transaction_id" },
    { label: "Date", field: "date" },
    { label: "Customer Name", field: "customer_name" },
    { label: "A/C Type", field: "account_type" },
    { label: "A/C ID", field: "account_id" },
    { label: "Description", field: "description" },
    { label: "Debit", field: "debit_amount" },
    { label: "Credit", field: "credit_amount" },
  ];

  const formatDateSafe = (dateStr) => {
    const date = parseISO(dateStr);
    return isValid(date) ? fmt(date, "yyyy-MM-dd") : "";
  };

  const filterData = () => {
    const { from, to, accounttype, customername } = formdata;
    let filtered = [...Alldata];

    const safeFrom = formatDateSafe(from);
    const safeTo = formatDateSafe(to);

    if (safeFrom && safeTo) {
      filtered = filtered.filter((r) => {
        const d = formatDateSafe(r.date);
        return d && d >= safeFrom && d <= safeTo;
      });
    }

    if (accounttype) {
      filtered = filtered.filter((r) => r.account_type === accounttype);
    }

    if (customername) {
      filtered = filtered.filter((r) => r.customer_name === customername);
    }

    const credit = filtered.reduce((sum, r) => sum + (r.credit_amount || 0), 0);
    const debit = filtered.reduce((sum, r) => sum + (r.debit_amount || 0), 0);

    setTotals({ credit, debit, balance:  debit-credit });
    setData(filtered);
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    const tableColumn = columns.map((col) => col.label);
    const tableRows = [];

    data.forEach((row) => {
      tableRows.push([
        row.transaction_id,
        formatDateSafe(row.date),
        row.customer_name,
        row.account_type,
        row.account_id,
        row.description,
        row.debit_amount,
        row.credit_amount,
      ]);
    });

    tableRows.push([
      "TOTALS",
      "",
      "",
      "",
      "",
      "Balance: " + Totals.balance,
      Totals.debit.toFixed(2),
      Totals.credit.toFixed(2),
    ]);

    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      theme: "grid",
    });

    doc.save("ledger_report.pdf");
  };

  const exportCSVData = [
    ...data.map((row) => ({
      transaction_id: row.transaction_id,
      date: formatDateSafe(row.date),
      customer_name: row.customer_name,
      account_type: row.account_type,
      account_id: row.account_id,
      description: row.description,
      debit_amount: row.debit_amount,
      credit_amount: row.credit_amount,
    })),
    {
      transaction_id: "",
      date: "",
      customer_name: "",
      account_type: "",
      account_id: "",
      description: "Total",
      debit_amount: Totals.debit.toFixed(2),
      credit_amount: Totals.credit.toFixed(2),
    },
    {
      transaction_id: "",
      date: "",
      customer_name: "",
      account_type: "",
      account_id: "",
      description: "Balance",
      debit_amount: "",
      credit_amount: Totals.balance.toFixed(2),
    },
  ];
const resetFilters = () => {
  setFormData({
    from: "",
    to: "",
    accounttype: "",
    customername: "",
  });
  setData(Alldata);
};

  useEffect(() => {
    const loadData = async () => {
      try {
        const fetched = await fetchData("ledger_entries", null, "id", {});
        setAllData(fetched);
        setData(fetched);
             const result = await fetchComboData("customers", "name");
    setCustomerdata([...new Set(result.map(i => i.name))]); // Ensures unique names
      } catch (e) {
        console.error("Error fetching data:", e);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    filterData();
  }, [formdata, Alldata]);

  return (
    <Layout>
      <Header title="Sales Ledger" />
      <ToastContainer />

      <div className="row mt-4">
        <div className="col-12">
          <CardComponent title="Filters">
            <div className="row">
              <div className="col-md-3">
                <TextfieldwithLabel
                  id="from"
                  type="date"
                  name="from"
                  lable="From Date"
                  value={formdata.from}
                  onChange={(e) =>
                    setFormData({ ...formdata, from: e.target.value })
                  }
                />
              </div>
              <div className="col-md-3">
                <TextfieldwithLabel
                  id="to"
                  type="date"
                  name="to"
                  lable="To Date"
                  value={formdata.to}
                  onChange={(e) =>
                    setFormData({ ...formdata, to: e.target.value })
                  }
                />
              </div>
              <div className="col-md-3">
                <label className="control-label">A/C Type</label>
                <select
                  className="form-control"
                  value={formdata.accounttype}
                  onChange={(e) =>
                    setFormData({ ...formdata, accounttype: e.target.value })
                  }
                >
                  <option value="">Select</option>
                  <option value="Sales">Sales</option>
                  <option value="Cash">Cash</option>
                  <option value="Discount">Discount</option>
                  <option value="Account Recievable">Account Recievable</option>
                </select>
              </div>
              <div className="col-md-3">
                <label className="control-label">Customer Name</label>
          <select
  className="form-control"
  value={formdata.account_id}
  onChange={async (e) => {
    const selectedId = e.target.value;
    const selectedCustomer = customerdata.find(c => c.id == selectedId);

    setFormData({
      ...formdata,
      customername: selectedCustomer?.name || "",
      account_id: selectedId,
    });

    // Optional: Fetch data using selectedId (account_id)
    const fetched = Alldata.filter(entry => entry.account_id == selectedId);
    setData(fetched);
  }}
>
   <option value="">Select</option>
  {customerdata.map((name, idx) => (
    <option key={idx} value={name}>
      {name}
    </option>
  ))}
</select>


              </div>
            </div>
          </CardComponent>
        </div>
      </div>

      <div className="row mt-3">
        <div className="col-12">
          <button className="btn btn-danger me-2" onClick={exportToPDF}>
            Export to PDF
          </button>

          <CSVLink
            data={exportCSVData}
            filename="ledger_report.csv"
            className="btn btn-success"
          >
            Export to CSV
          </CSVLink>
            <button className="btn btn-info" onClick={resetFilters}>
      Reset Filters
    </button>
        </div>
      </div>

      <div className="row mt-3">
        <div className="col-12">
          {data.length === 0 ? (
            <p>No data available</p>
          ) : (
            <DataTable
              columns={columns}
              data={data}
              tablename="ledger_entries"
            />
          )}
          <div className="mt-3">
            <strong>Total Credit:</strong> {Totals.credit.toFixed(2)} |{" "}
            <strong>Total Debit:</strong> {Totals.debit.toFixed(2)} |{" "}
            <strong>Balance:</strong> {Totals.balance.toFixed(2)}
          </div>
        </div>
      </div>
    </Layout>
  );
}
