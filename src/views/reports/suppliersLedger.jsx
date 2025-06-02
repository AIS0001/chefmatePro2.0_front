import React, { useEffect, useState } from "react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { format } from "date-fns";
import { FaSearch } from "react-icons/fa";

import Layout from "../../layout/Layout";
import Header from "../../components/Header";
import CardComponent from "../../components/cards/CardComponent";
import DataTable from "../../components/data-tables/dataTable";
import { TextfieldwithLabel } from "../../components/Buttons/Textfield";

import fetchData from "../../functions/fetchData";

export default function SuppliersLedger() {
  const [data, setData] = useState([]);
  const [allData, setAllData] = useState([]);
  const [formData, setFormData] = useState({});
  const [totals, setTotals] = useState({ credit: 0, debit: 0, balance: 0 });

  const columns = [
    { label: "Txn ID", field: "transaction_id" },
    { label: "Date", field: "date" },
    { label: "A/C Type", field: "account_type" },
    { label: "A/C ID", field: "account_id" },
    { label: "Description", field: "description" },
    { label: "Debit", field: "debit_amount" },
    { label: "Credit", field: "credit_amount" }
  ];

  const formatDate = (d) => new Date(d).toISOString().split("T")[0];

  const filterByAccountType = (accountType) => {
    const filtered = allData.filter((r) => r.account_type === accountType);
    calculateTotals(filtered);
  };

  const filterByDate = (from, to) => {
    const f = formatDate(from);
    const t = formatDate(to);
    const filtered = allData.filter((r) => formatDate(r.date) >= f && formatDate(r.date) <= t);
    calculateTotals(filtered);
  };

  const filterByAccountId = (id) => {
    const filtered = allData.filter((r) => r.account_id.toString() === id);
    calculateTotals(filtered);
  };

  const calculateTotals = (records) => {
    const credit = records.reduce((sum, r) => sum + parseFloat(r.credit_amount || 0), 0);
    const debit = records.reduce((sum, r) => sum + parseFloat(r.debit_amount || 0), 0);
    setData(records);
    setTotals({ credit, debit, balance: credit - debit });
  };

  useEffect(() => {
    const loadData = async () => {
      await fetchData("ledger_entries", setAllData, "id", {});
      await fetchData("ledger_entries", setData, "id", {});
    };
    loadData();
  }, []);

  return (
    <Layout>
      <Header title="Supplier Expense Ledger" />
      <ToastContainer />
      <CardComponent title="Filter Supplier Ledger" headerColor="dark" bodyClass="panel-body">
        <div className="row">
          <div className="col-md-3">
            <TextfieldwithLabel
              id="from"
              name="from"
              type="date"
              lable="From Date"
              value={formData.from || ""}
              onChange={(e) => setFormData({ ...formData, from: e.target.value })}
            />
          </div>
          <div className="col-md-3">
            <TextfieldwithLabel
              id="to"
              name="to"
              type="date"
              lable="To Date"
              value={formData.to || ""}
              onChange={(e) => setFormData({ ...formData, to: e.target.value })}
            />
          </div>
          <div className="col-md-3">
            <TextfieldwithLabel
              id="accountid"
              name="accountid"
              type="text"
              lable="Supplier ID"
              value={formData.accountid || ""}
              onChange={(e) => setFormData({ ...formData, accountid: e.target.value })}
            />
          </div>
          <div className="col-md-3">
            <button className="btn btn-primary mt-4" onClick={() => filterByDate(formData.from, formData.to)}>
              <FaSearch /> Filter by Date
            </button>
            <button className="btn btn-success mt-4" onClick={() => filterByAccountType("Purchase")}>
              <FaSearch /> Filter by A/C Type: Purchase
            </button>
            <button className="btn btn-warning mt-4" onClick={() => filterByAccountId(formData.accountid)}>
              <FaSearch /> Filter by Supplier ID
            </button>
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
            <strong>Total Credit:</strong> {totals.credit} |{" "}
            <strong>Total Debit:</strong> {totals.debit} |{" "}
            <strong>Balance:</strong> {totals.balance}
          </div>
        </div>
      </div>
    </Layout>
  );
}
