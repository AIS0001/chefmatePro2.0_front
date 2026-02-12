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
  const [companyInfo, setCompanyInfo] = useState(null);

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
    setTotals({ credit, debit, balance: debit-credit });
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

  const printThermalReport = () => {
    const printWindow = window.open('', '', 'width=300,height=600');
    const companyName = companyInfo?.company_name || 'Company Name';
    const companyAddress = companyInfo?.address || 'Address';
    const companyPhone = companyInfo?.phone || 'Phone';

    let html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Supplier Ledger Report</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            font-size: 12pt;
            margin: 0;
            padding: 5px 2px;
            width: 80mm;
          }
          .header {
            text-align: center;
            margin-bottom: 10px;
            border-bottom: 2px dashed #000;
            padding-bottom: 8px;
          }
          .company-name {
            font-size: 14pt;
            font-weight: bold;
            margin-bottom: 3px;
          }
          .company-info {
            font-size: 10pt;
            margin: 2px 0;
          }
          .report-title {
            text-align: center;
            font-weight: bold;
            font-size: 13pt;
            margin: 10px 0;
          }
          .date-range {
            text-align: center;
            font-size: 10pt;
            margin-bottom: 10px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
            font-size: 11pt;
          }
          th, td {
            text-align: left;
            padding: 4px 2px;
            border-bottom: 1px solid #ddd;
          }
          th {
            font-weight: bold;
            border-bottom: 2px solid #000;
          }
          .total-row {
            font-weight: bold;
            border-top: 2px solid #000;
            border-bottom: 2px solid #000;
          }
          .summary {
            margin-top: 15px;
            border-top: 2px dashed #000;
            padding-top: 10px;
            font-size: 12pt;
          }
          .summary-item {
            display: flex;
            justify-content: space-between;
            margin: 5px 0;
          }
          .summary-item.total {
            font-weight: bold;
            font-size: 13pt;
            border-top: 2px solid #000;
            padding-top: 5px;
            margin-top: 5px;
          }
          .footer {
            text-align: center;
            margin-top: 15px;
            font-size: 10pt;
            border-top: 2px dashed #000;
            padding-top: 8px;
          }
          @media print {
            body { margin: 0; padding: 5px 2px; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="company-name">${companyName}</div>
          <div class="company-info">${companyAddress}</div>
          <div class="company-info">Phone: ${companyPhone}</div>
        </div>
        
        <div class="report-title">Supplier Ledger Report</div>
        ${formData.from || formData.to ? `
          <div class="date-range">
            ${formData.from ? `From: ${formatDate(formData.from)}` : ''}
            ${formData.to ? ` To: ${formatDate(formData.to)}` : ''}
          </div>
        ` : ''}
        
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Description</th>
              <th>Debit</th>
              <th>Credit</th>
            </tr>
          </thead>
          <tbody>
    `;

    data.forEach((item) => {
      html += `
        <tr>
          <td>${formatDate(item.date)}</td>
          <td>${item.description || '-'}</td>
          <td>${parseFloat(item.debit_amount || 0).toFixed(2)}</td>
          <td>${parseFloat(item.credit_amount || 0).toFixed(2)}</td>
        </tr>
      `;
    });

    html += `
          </tbody>
        </table>
        
        <div class="summary">
          <div class="summary-item">
            <span>Total Debit:</span>
            <span>${totals.debit.toFixed(2)}</span>
          </div>
          <div class="summary-item">
            <span>Total Credit:</span>
            <span>${totals.credit.toFixed(2)}</span>
          </div>
          <div class="summary-item total">
            <span>Balance:</span>
            <span>${totals.balance.toFixed(2)}</span>
          </div>
        </div>
        
        <div class="footer">
          Printed on: ${format(new Date(), 'dd/MM/yyyy HH:mm')}<br/>
          Thank you!
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  useEffect(() => {
    fetchData("ledger_entries", (res) => {
      setAllData(res);
      setData(res);
      calculateTotals(res);
    }, "id", {});

    fetchData("suppliers", setSuppliers, "id", {});
    fetchData("company_info", (res) => setCompanyInfo(res[0]), "id", {});
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
            <button className="btn btn-primary me-2" onClick={printThermalReport}>
              Print Thermal
            </button>
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