import React, { useEffect, useState } from "react";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { format } from "date-fns";
import { CSVLink } from "react-csv";
import jsPDF from "jspdf";
import "jspdf-autotable";

import Layout from "../../layout/Layout";
import Header from "../../components/Header";
import CardComponent from "../../components/cards/CardComponent";
import DataTable from "../../components/data-tables/dataTable";
import { TextfieldwithLabel } from "../../components/Buttons/Textfield";

import fetchData from "../../functions/fetchData";

export default function SuppliersLedger() {
  const [data, setData] = useState([]);
  const [allData, setAllData] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [formData, setFormData] = useState({ from: "", to: "", accountid: "", supplier_id: "" });
  const [totals, setTotals] = useState({ credit: 0, debit: 0, balance: 0 });

  const columns = [
    { label: "Txn ID", field: "transaction_id" },
    { label: "Date", field: "date" },
    { label: "A/C Type", field: "account_type" },
    { label: "A/C ID", field: "account_id" },
    { label: "Description", field: "description" },
    { label: "Debit", field: "debit_amount" },
    { label: "Credit", field: "credit_amount" },
  ];

  const formatDate = (d) => new Date(d).toISOString().split("T")[0];

  const calculateTotals = (records) => {
    const credit = records.reduce((sum, r) => sum + parseFloat(r.credit_amount || 0), 0);
    const debit = records.reduce((sum, r) => sum + parseFloat(r.debit_amount || 0), 0);
    setData(records);
    setTotals({ credit, debit, balance: credit - debit });
  };

  const applyFilters = () => {
    const { from, to, accountid } = formData;
    const f = from ? formatDate(from) : null;
    const t = to ? formatDate(to) : null;

    const filtered = allData.filter((r) => {
      const date = formatDate(r.date);
      const dateInRange = (!f || date >= f) && (!t || date <= t);
      const accountMatch = !accountid || r.account_id?.toString() === accountid?.toString();
      return dateInRange && accountMatch;
    });

    calculateTotals(filtered);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === "supplier_id") {
      const selected = suppliers.find((s) => s.id.toString() === value);
      setFormData((prev) => ({
        ...prev,
        supplier_id: value,
        accountid: selected ? selected.id : "",
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    const tableColumn = columns.map((c) => c.label);
    const tableRows = data.map((r) => [
      r.transaction_id,
      formatDate(r.date),
      r.account_type,
      r.account_id,
      r.description,
      r.debit_amount,
      r.credit_amount,
    ]);
    tableRows.push(["", "", "", "", "Total", totals.debit.toFixed(2), totals.credit.toFixed(2)]);

    doc.text("Supplier Ledger Report", 14, 15);
    doc.autoTable({ head: [tableColumn], body: tableRows, startY: 20 });
    doc.text(`Balance: ${totals.balance.toFixed(2)}`, 14, doc.autoTable.previous.finalY + 10);
    doc.save("SupplierLedger.pdf");
  };

  useEffect(() => {
    fetchData("ledger_entries", (res) => {
      setAllData(res);
      setData(res);
      calculateTotals(res);
    }, "id", {});

    fetchData("suppliers", setSuppliers, "id", {});
  }, []);

  useEffect(() => {
    applyFilters();
  }, [formData.from, formData.to, formData.accountid]);

  return (
    <Layout>
      <Header title="Supplier Expense Ledger" />
      <ToastContainer />
      <CardComponent title="Filter Supplier Ledger" headerColor="dark" bodyClass="panel-body">
        <div className="row">
          <div className="col-md-3">
            <TextfieldwithLabel id="from" name="from" type="date" lable="From Date" value={formData.from || ""} onChange={handleInputChange} />
          </div>
          <div className="col-md-3">
            <TextfieldwithLabel id="to" name="to" type="date" lable="To Date" value={formData.to || ""} onChange={handleInputChange} />
          </div>
          <div className="col-md-3">
            <TextfieldwithLabel id="accountid" name="accountid" type="text" lable="Supplier ID" value={formData.accountid || ""} onChange={handleInputChange} />
          </div>
          <div className="col-md-3">
            <label>Supplier</label>
            <select className="form-control" name="supplier_id" value={formData.supplier_id || ""} onChange={handleInputChange}>
              <option value="">Select Supplier</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>{s.company_name}</option>
              ))}
            </select>
          </div>
         
          <div className="row">
            <div className="col-md-12">
            <CSVLink
              data={[
                ...data,
                {
                  transaction_id: "",
                  date: "",
                  account_type: "",
                  account_id: "",
                  description: "Total",
                  debit_amount: totals.debit.toFixed(2),
                  credit_amount: totals.credit.toFixed(2),
                },
              ]}
              filename="SupplierLedger.csv"
              className="btn btn-success me-2"
            >
              Export CSV
            </CSVLink>
            <button className="btn btn-danger" onClick={exportPDF}>
              Export PDF
            </button>
          </div>
          </div>
        </div>
      </CardComponent>

      <div className="row mt-4">
        <div className="col-12" id="tableid">
          {data.length === 0 ? (
            <p>No records found</p>
          ) : (
            <DataTable columns={columns} data={data} tablename="ledger_entries" />
          )}
           <div className="mt-3">
            <strong>Total Credit:</strong> {totals.credit.toFixed(2)} | {" "}
            <strong>Total Debit:</strong> {totals.debit.toFixed(2)} | {" "}
            <strong>Balance:</strong> {totals.balance.toFixed(2)}
          </div>
        </div>
      </div>
    </Layout>
  );
}