import React, { useEffect, useState } from "react";
import { parseISO, isValid, format as fmt } from "date-fns";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { CSVLink } from "react-csv";
import logo from "../../assets/logo.png";

import { Button, Card, Col, DatePicker, Row, Select, Space } from "antd";
import { FilterOutlined, FilePdfOutlined, FileExcelOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import Header from "../../components/Header";
import Layout from "../../layout/Layout";
import DataTable from "../../components/data-tables/dataTable";
import fetchData from "../../functions/fetchData";
import { fetchComboData } from "../../services/api";
export default function BillHistory() {
  const [data, setData] = useState([]);
  const [Alldata, setAllData] = useState([]);
  const [customerdata, setCustomerdata] = useState([]);
  const [companyInfo, setCompanyInfo] = useState({});
  const [Totals, setTotals] = useState({ credit: 0, debit: 0, balance: 0 });
  const [formdata, setFormData] = useState({
    from: "",
    to: "",
    accounttype: "",
    account_id: "",
  });

  const columns = [
    { label: "Txn ID", field: "transaction_id" },
    { label: "Date", field: "date" },
    // { label: "Customer Name", field: "customer_name" },
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

  const loadImageAsDataUrl = (src) => new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0);
      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = reject;
    img.src = src;
  });

  const filterData = () => {
    const { from, to, accounttype, account_id } = formdata;
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

    if (account_id) {
      filtered = filtered.filter((r) => r.account_id == account_id);
    }

 const credit = filtered.reduce((sum, r) => sum + (Number(r.credit_amount) || 0), 0);
const debit = filtered.reduce((sum, r) => sum + (Number(r.debit_amount) || 0), 0);
setTotals({ credit, debit, balance: debit - credit });

    setData(filtered);
  };

  const exportToPDF = async () => {
    const doc = new jsPDF();
    const tableColumn = columns.map((col) => col.label);
    const tableRows = [];

    try {
      const logoDataUrl = await loadImageAsDataUrl(logo);
      doc.addImage(logoDataUrl, "PNG", 8, 10, 18, 18);
    } catch (err) {
      console.warn("Failed to load logo for PDF:", err);
    }

    const headerX = 38;
    doc.setFontSize(12);
    doc.text(companyInfo.name || "Company Name", headerX, 16);
    doc.setFontSize(9);
    if (companyInfo.address) doc.text(companyInfo.address, headerX, 21);
    const contactLine = [companyInfo.phone_number, companyInfo.email].filter(Boolean).join(" | ");
    if (contactLine) doc.text(contactLine, headerX, 26);
    if (companyInfo.tax_id) doc.text(`Tax ID: ${companyInfo.tax_id}`, headerX, 31);
    doc.setFontSize(10);
    doc.text("Sales Ledger Report", headerX, 36);

    data.forEach((row) => {
      tableRows.push([
        row.transaction_id,
        formatDateSafe(row.date),
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
      "Balance: " + Totals.balance,
      (Totals.debit).toFixed(2),
      (Totals.credit).toFixed(2),
    ]);

    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      theme: "grid",
      startY: 42,
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
      debit_amount: (Totals.debit).toFixed(2) || 0,
      credit_amount: (Totals.credit).toFixed(2) || 0,
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
    account_id: "",
  });
  setData(Alldata);
};

  useEffect(() => {
    const loadData = async () => {
      try {
        const fetched = await fetchData("ledger_entries", null, "id", {});
        setAllData(fetched);
        setData(fetched);
        const result = await fetchData("customers", null, "id", {});
        setCustomerdata(result);
        const companyData = await fetchData("companyinfo", null, "id", {});
        setCompanyInfo(companyData?.[0] || {});

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

      <Card style={{ marginBottom: 24 }} title={<><FilterOutlined /> Ledger Filters</>}>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={6}>
            <div>
              <label style={{ fontWeight: 600, marginBottom: 8, display: "block" }}>From Date</label>
              <DatePicker
                style={{ width: "100%" }}
                value={formdata.from ? dayjs(formdata.from) : null}
                onChange={(date) => setFormData({ ...formdata, from: date ? date.format("YYYY-MM-DD") : "" })}
                format="YYYY-MM-DD"
              />
            </div>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <div>
              <label style={{ fontWeight: 600, marginBottom: 8, display: "block" }}>To Date</label>
              <DatePicker
                style={{ width: "100%" }}
                value={formdata.to ? dayjs(formdata.to) : null}
                onChange={(date) => setFormData({ ...formdata, to: date ? date.format("YYYY-MM-DD") : "" })}
                format="YYYY-MM-DD"
              />
            </div>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <div>
              <label style={{ fontWeight: 600, marginBottom: 8, display: "block" }}>A/C Type</label>
              <Select
                placeholder="Select account type"
                allowClear
                value={formdata.accounttype || undefined}
                onChange={(value) => setFormData({ ...formdata, accounttype: value || "" })}
                options={[
                  { label: "Sales", value: "Sales" },
                  { label: "Cash", value: "Cash" },
                  { label: "Discount", value: "Discount" },
                  { label: "Account Recievable", value: "Account Recievable" },
                ]}
                style={{ width: "100%" }}
              />
            </div>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <div>
              <label style={{ fontWeight: 600, marginBottom: 8, display: "block" }}>Customer Name</label>
              <Select
                placeholder="Select customer"
                allowClear
                showSearch
                filterOption={(input, option) =>
                  (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                }
                value={formdata.account_id || undefined}
                onChange={(value) => {
                  setFormData({
                    ...formdata,
                    account_id: value || "",
                  });
                }}
                options={customerdata.map((cust) => ({
                  label: `${cust.id} - ${cust.phone || 'N/A'} - ${cust.name}`,
                  value: cust.id,
                }))}
                style={{ width: "100%" }}
              />
            </div>
          </Col>
        </Row>
      </Card>

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
            <strong>Total Credit:</strong> {(Totals.credit).toFixed(2)} |{" "}
            <strong>Total Debit:</strong> {(Totals.debit).toFixed(2)} |{" "}
            <strong>Balance:</strong> {(Totals.balance).toFixed(2)}
          </div>
        </div>
      </div>
    </Layout>
  );
}
