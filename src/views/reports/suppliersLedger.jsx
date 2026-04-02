import React, { useEffect, useState } from "react";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { format } from "date-fns";
import { CSVLink } from "react-csv";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { Card, Row, Col, Input, Select, Button, Checkbox, Table, Space, Typography, Empty } from "antd";
import { UpOutlined, DownOutlined } from "@ant-design/icons";

import Layout from "../../layout/Layout";

import { fetchShopScopedData } from "../../functions/fetchData";

export default function SuppliersLedger() {
  const { Title, Text } = Typography;
  const [data, setData] = useState([]);
  const [allData, setAllData] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [formData, setFormData] = useState({
    from: "",
    to: "",
    accountid: "",
    supplier_id: "",
    transaction_id: "",
    account_type: "",
    description: "",
    min_debit: "",
    max_debit: "",
    min_credit: "",
    max_credit: "",
  });
  const [totals, setTotals] = useState({ credit: 0, debit: 0, balance: 0 });
  const [companyInfo, setCompanyInfo] = useState(null);
  const [showAllClosingBalance, setShowAllClosingBalance] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [isLedgerTableCollapsed, setIsLedgerTableCollapsed] = useState(false);
  const [isClosingBalanceCollapsed, setIsClosingBalanceCollapsed] = useState(false);

  const pageStyle = {
    background: "linear-gradient(180deg, #f8fbff 0%, #f3f7fb 100%)",
    borderRadius: 16,
    padding: 12,
  };

  const primaryCardStyle = {
    marginBottom: 16,
    borderRadius: 16,
    border: "1px solid #e6edf5",
    background: "#fcfdff",
    boxShadow: "0 8px 24px rgba(15, 23, 42, 0.05)",
  };

  const nestedCardStyle = {
    marginTop: 16,
    borderRadius: 14,
    border: "1px solid #e8eef6",
    background: "#f7fbff",
    boxShadow: "0 6px 18px rgba(15, 23, 42, 0.04)",
  };

  const getSupplierName = (supplierId) => {
    if (supplierId === undefined || supplierId === null || supplierId === "") {
      return "-";
    }

    const supplier = suppliers.find((row) => row.id?.toString() === supplierId?.toString());

    return (
      supplier?.company_name ||
      supplier?.name ||
      supplier?.supplier_name ||
      `Supplier ${supplierId}`
    );
  };

  const isSupplierLedgerRecord = (record) => {
    const supplierId = record?.account_id?.toString();
    const normalizedAccountType = (record?.account_type || "").trim().toLowerCase();
    const validSupplierTypes = new Set(["purchase", "accounts payable", "supplier", "supplier payment", "supplier_payment"]);

    if (!supplierId) {
      return false;
    }

    const hasKnownSupplier = suppliers.some((row) => row.id?.toString() === supplierId);

    return hasKnownSupplier && validSupplierTypes.has(normalizedAccountType);
  };

  const getSupplierLedgerRecords = () => allData.filter((record) => isSupplierLedgerRecord(record));

  const columns = [
    {
      title: "Txn ID",
      dataIndex: "transaction_id",
      key: "transaction_id",
      width: 100,
    },
    {
      title: "Date",
      dataIndex: "date",
      key: "date",
      render: (value) => formatDate(value),
    },
    {
      title: "A/C Type",
      dataIndex: "account_type",
      key: "account_type",
    },
    {
      title: "Supplier",
      dataIndex: "account_id",
      key: "account_id",
      render: (value) => getSupplierName(value),
    },
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
      render: (value) => value || "-",
    },
    {
      title: "Debit",
      dataIndex: "debit_amount",
      key: "debit_amount",
      align: "right",
      render: (value) => parseFloat(value || 0).toFixed(2),
    },
    {
      title: "Credit",
      dataIndex: "credit_amount",
      key: "credit_amount",
      align: "right",
      render: (value) => parseFloat(value || 0).toFixed(2),
    },
  ];

  const formatDate = (d) => new Date(d).toISOString().split("T")[0];

  const calculateTotals = (records) => {
    const credit = records.reduce((sum, r) => sum + parseFloat(r.credit_amount || 0), 0);
    const debit = records.reduce((sum, r) => sum + parseFloat(r.debit_amount || 0), 0);
    setData(records);
    setTotals({ credit, debit, balance: debit - credit });
  };

  const getDateFilteredRecords = () => {
    const { from, to } = formData;
    const f = from ? formatDate(from) : null;
    const t = to ? formatDate(to) : null;

    return getSupplierLedgerRecords().filter((r) => {
      const date = formatDate(r.date);
      return (!f || date >= f) && (!t || date <= t);
    });
  };

  const handleInputChange = (name, value) => {
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

  const resetAdvancedFilters = () => {
    setFormData((prev) => ({
      ...prev,
      transaction_id: "",
      account_type: "",
      description: "",
      min_debit: "",
      max_debit: "",
      min_credit: "",
      max_credit: "",
    }));
  };

  const allSupplierClosingBalances = () => {
    const dateFilteredRecords = getDateFilteredRecords();
    const grouped = dateFilteredRecords.reduce((acc, row) => {
      const supplierId = row.account_id?.toString();
      if (!supplierId) return acc;

      if (!acc[supplierId]) {
        acc[supplierId] = {
          key: supplierId,
          supplier_id: supplierId,
          supplier_name: getSupplierName(supplierId),
          debit_total: 0,
          credit_total: 0,
          closing_balance: 0,
        };
      }

      acc[supplierId].debit_total += parseFloat(row.debit_amount || 0);
      acc[supplierId].credit_total += parseFloat(row.credit_amount || 0);
      acc[supplierId].closing_balance = acc[supplierId].debit_total - acc[supplierId].credit_total;

      return acc;
    }, {});

    return Object.values(grouped).sort((a, b) => a.supplier_name.localeCompare(b.supplier_name));
  };

  const closingBalanceColumns = [
    {
      title: "Supplier",
      dataIndex: "supplier_name",
      key: "supplier_name",
    },
    {
      title: "Supplier ID",
      dataIndex: "supplier_id",
      key: "supplier_id",
      width: 120,
    },
    {
      title: "Total Debit",
      dataIndex: "debit_total",
      key: "debit_total",
      align: "right",
      render: (value) => parseFloat(value || 0).toFixed(2),
    },
    {
      title: "Total Credit",
      dataIndex: "credit_total",
      key: "credit_total",
      align: "right",
      render: (value) => parseFloat(value || 0).toFixed(2),
    },
    {
      title: "Closing Balance",
      dataIndex: "closing_balance",
      key: "closing_balance",
      align: "right",
      render: (value) => <Text strong>{parseFloat(value || 0).toFixed(2)}</Text>,
    },
  ];

  const exportPDF = () => {
    const doc = new jsPDF();
    const tableColumn = ["Txn ID", "Date", "A/C Type", "Supplier", "Description", "Debit", "Credit"];
    const tableRows = data.map((r) => [
      r.transaction_id,
      formatDate(r.date),
      r.account_type,
      getSupplierName(r.account_id),
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

  const exportClosingBalancePDF = () => {
    const closingData = allSupplierClosingBalances();
    const doc = new jsPDF();
    const tableColumn = ["Supplier", "Supplier ID", "Total Debit", "Total Credit", "Closing Balance"];
    const tableRows = closingData.map((r) => [
      r.supplier_name,
      r.supplier_id,
      parseFloat(r.debit_total || 0).toFixed(2),
      parseFloat(r.credit_total || 0).toFixed(2),
      parseFloat(r.closing_balance || 0).toFixed(2),
    ]);

    const totalDebit = closingData.reduce((sum, row) => sum + parseFloat(row.debit_total || 0), 0);
    const totalCredit = closingData.reduce((sum, row) => sum + parseFloat(row.credit_total || 0), 0);
    const totalClosing = closingData.reduce((sum, row) => sum + parseFloat(row.closing_balance || 0), 0);

    tableRows.push([
      "TOTAL",
      "",
      totalDebit.toFixed(2),
      totalCredit.toFixed(2),
      totalClosing.toFixed(2),
    ]);

    doc.text("Closing Balance of All Suppliers", 14, 15);
    doc.autoTable({ head: [tableColumn], body: tableRows, startY: 20 });
    doc.save("SupplierClosingBalance.pdf");
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
    const loadInitialData = async () => {
      const ledgerRows = await fetchShopScopedData("Supplier_ledger_entries", null, "id");
      const normalizedLedgerRows = Array.isArray(ledgerRows) ? ledgerRows : [];
      setAllData(normalizedLedgerRows);

      const supplierRows = await fetchShopScopedData("suppliers", null, "id");
      setSuppliers(Array.isArray(supplierRows) ? supplierRows : []);

      const companyProfileRows = await fetchShopScopedData("company_profile", null, "id");
      if (Array.isArray(companyProfileRows) && companyProfileRows.length > 0) {
        setCompanyInfo(companyProfileRows[0]);
        return;
      }

      const companyInfoRows = await fetchShopScopedData("companyinfo", null, "id");
      if (Array.isArray(companyInfoRows) && companyInfoRows.length > 0) {
        setCompanyInfo(companyInfoRows[0]);
      } else {
        setCompanyInfo(null);
      }
    };

    loadInitialData();
  }, []);

  useEffect(() => {
    const {
      from,
      to,
      accountid,
      transaction_id,
      account_type,
      description,
      min_debit,
      max_debit,
      min_credit,
      max_credit,
    } = formData;

    const minDebit = min_debit === "" ? null : parseFloat(min_debit);
    const maxDebit = max_debit === "" ? null : parseFloat(max_debit);
    const minCredit = min_credit === "" ? null : parseFloat(min_credit);
    const maxCredit = max_credit === "" ? null : parseFloat(max_credit);
    const formattedFrom = from ? formatDate(from) : null;
    const formattedTo = to ? formatDate(to) : null;
    const validSupplierTypes = new Set(["purchase", "accounts payable", "supplier", "supplier payment", "supplier_payment"]);

    const filtered = allData.filter((r) => {
      const supplierId = r.account_id?.toString();
      const normalizedAccountType = (r.account_type || "").trim().toLowerCase();
      const isSupplierRecord =
        supplierId &&
        suppliers.some((row) => row.id?.toString() === supplierId) &&
        validSupplierTypes.has(normalizedAccountType);
      const date = formatDate(r.date);
      const debit = parseFloat(r.debit_amount || 0);
      const credit = parseFloat(r.credit_amount || 0);
      const dateMatch = (!formattedFrom || date >= formattedFrom) && (!formattedTo || date <= formattedTo);
      const accountMatch = !accountid || r.account_id?.toString() === accountid?.toString();
      const txnMatch = !transaction_id || r.transaction_id?.toString().includes(transaction_id.toString());
      const accountTypeMatch = !account_type || (r.account_type || "").toLowerCase() === account_type.toLowerCase();
      const descriptionMatch = !description || (r.description || "").toLowerCase().includes(description.toLowerCase());
      const minDebitMatch = minDebit === null || debit >= minDebit;
      const maxDebitMatch = maxDebit === null || debit <= maxDebit;
      const minCreditMatch = minCredit === null || credit >= minCredit;
      const maxCreditMatch = maxCredit === null || credit <= maxCredit;

      return (
        isSupplierRecord &&
        dateMatch &&
        accountMatch &&
        txnMatch &&
        accountTypeMatch &&
        descriptionMatch &&
        minDebitMatch &&
        maxDebitMatch &&
        minCreditMatch &&
        maxCreditMatch
      );
    });

    calculateTotals(filtered);
  }, [formData, allData, suppliers]);

  const closingBalanceData = allSupplierClosingBalances();

  return (
    <Layout>
      <ToastContainer />
      <div style={pageStyle}>
      <Card bordered={false} style={primaryCardStyle}>
        <Title level={4} style={{ marginBottom: 16, color: "#1e3a5f" }}>Supplier Expense Ledger</Title>
        <Row gutter={[12, 12]}>
          <Col xs={24} sm={12} md={6}>
            <Text type="secondary">From Date</Text>
            <Input
              type="date"
              value={formData.from || ""}
              onChange={(e) => handleInputChange("from", e.target.value)}
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Text type="secondary">To Date</Text>
            <Input
              type="date"
              value={formData.to || ""}
              onChange={(e) => handleInputChange("to", e.target.value)}
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Text type="secondary">Supplier ID</Text>
            <Input
              value={formData.accountid || ""}
              onChange={(e) => handleInputChange("accountid", e.target.value)}
              placeholder="Enter Supplier ID"
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Text type="secondary">Supplier</Text>
            <Select
              value={formData.supplier_id || undefined}
              onChange={(value) => handleInputChange("supplier_id", value || "")}
              placeholder="Select Supplier"
              allowClear
              style={{ width: "100%" }}
              options={suppliers.map((s) => ({
                value: s.id.toString(),
                label: s.company_name || s.name || s.supplier_name || `Supplier ${s.id}`,
              }))}
            />
          </Col>
        </Row>

        <Row style={{ marginTop: 16 }}>
          <Col span={24}>
            <Space size="large" wrap>
              <Checkbox
                checked={showAdvancedFilters}
                onChange={(e) => setShowAdvancedFilters(e.target.checked)}
              >
                Show Advanced Filters
              </Checkbox>
            <Checkbox
              checked={showAllClosingBalance}
              onChange={(e) => {
                const checked = e.target.checked;
                setShowAllClosingBalance(checked);
                if (checked) {
                  setIsLedgerTableCollapsed(true);
                } else {
                  setIsLedgerTableCollapsed(false);
                }
              }}
            >
              Show Closing Balance of All Suppliers
            </Checkbox>
            </Space>
          </Col>
        </Row>

        {showAdvancedFilters && (
          <Card bordered={false} style={nestedCardStyle}>
            <Row gutter={[12, 12]}>
              <Col xs={24} sm={12} md={8}>
                <Text type="secondary">Transaction ID</Text>
                <Input
                  value={formData.transaction_id}
                  onChange={(e) => handleInputChange("transaction_id", e.target.value)}
                  placeholder="Contains transaction ID"
                />
              </Col>
              <Col xs={24} sm={12} md={8}>
                <Text type="secondary">Account Type</Text>
                <Select
                  value={formData.account_type || undefined}
                  onChange={(value) => handleInputChange("account_type", value || "")}
                  placeholder="Select account type"
                  allowClear
                  style={{ width: "100%" }}
                  options={[
                    { value: "supplier", label: "Supplier" },
                    { value: "supplier_payment", label: "Supplier Payment" },
                    { value: "purchase", label: "Purchase" },
                    { value: "accounts payable", label: "Accounts Payable" },
                  ]}
                />
              </Col>
              <Col xs={24} sm={12} md={8}>
                <Text type="secondary">Description</Text>
                <Input
                  value={formData.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  placeholder="Contains text"
                />
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Text type="secondary">Min Debit</Text>
                <Input
                  type="number"
                  value={formData.min_debit}
                  onChange={(e) => handleInputChange("min_debit", e.target.value)}
                  placeholder="0"
                />
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Text type="secondary">Max Debit</Text>
                <Input
                  type="number"
                  value={formData.max_debit}
                  onChange={(e) => handleInputChange("max_debit", e.target.value)}
                  placeholder="0"
                />
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Text type="secondary">Min Credit</Text>
                <Input
                  type="number"
                  value={formData.min_credit}
                  onChange={(e) => handleInputChange("min_credit", e.target.value)}
                  placeholder="0"
                />
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Text type="secondary">Max Credit</Text>
                <Input
                  type="number"
                  value={formData.max_credit}
                  onChange={(e) => handleInputChange("max_credit", e.target.value)}
                  placeholder="0"
                />
              </Col>
            </Row>
            <Space style={{ marginTop: 12 }}>
              <Button onClick={resetAdvancedFilters}>Reset Advanced Filters</Button>
            </Space>
          </Card>
        )}

        <Space style={{ marginTop: 16 }} wrap>
          <Button type="primary" onClick={printThermalReport}>Print Thermal</Button>
          <CSVLink
            data={[
              ...data.map((row) => ({
                transaction_id: row.transaction_id,
                date: row.date,
                account_type: row.account_type,
                supplier_name: getSupplierName(row.account_id),
                description: row.description,
                debit_amount: row.debit_amount,
                credit_amount: row.credit_amount,
              })),
              {
                transaction_id: "",
                date: "",
                account_type: "",
                supplier_name: "",
                description: "Total",
                debit_amount: totals.debit.toFixed(2),
                credit_amount: totals.credit.toFixed(2),
              },
            ]}
            headers={[
              { label: "Txn ID", key: "transaction_id" },
              { label: "Date", key: "date" },
              { label: "A/C Type", key: "account_type" },
              { label: "Supplier", key: "supplier_name" },
              { label: "Description", key: "description" },
              { label: "Debit", key: "debit_amount" },
              { label: "Credit", key: "credit_amount" },
            ]}
            filename="SupplierLedger.csv"
          >
            <Button type="default">Export CSV</Button>
          </CSVLink>
          <Button danger onClick={exportPDF}>Export PDF</Button>
        </Space>
      </Card>

      {!showAllClosingBalance && (
        <Card
          bordered={false}
          style={primaryCardStyle}
          title="Supplier Ledger Table"
          extra={
            <Button
              type="text"
              onClick={() => setIsLedgerTableCollapsed((prev) => !prev)}
              icon={isLedgerTableCollapsed ? <DownOutlined /> : <UpOutlined />}
            >
              {isLedgerTableCollapsed ? "Expand" : "Collapse"}
            </Button>
          }
        >
          {!isLedgerTableCollapsed && (
            <>
              {data.length === 0 ? (
                <Empty description="No records found" />
              ) : (
                <Table
                  rowKey={(record, index) => `${record.transaction_id || 'txn'}-${index}`}
                  columns={columns}
                  dataSource={data}
                  pagination={{ pageSize: 10 }}
                  scroll={{ x: 900 }}
                />
              )}

              <div style={{ marginTop: 12 }}>
                <Text strong>Total Credit:</Text> {totals.credit.toFixed(2)} |{" "}
                <Text strong>Total Debit:</Text> {totals.debit.toFixed(2)} |{" "}
                <Text strong>Balance:</Text> {totals.balance.toFixed(2)}
              </div>
            </>
          )}
        </Card>
      )}

      {showAllClosingBalance && (
        <Card
          bordered={false}
          style={primaryCardStyle}
          title="Closing Balance of All Suppliers"
          extra={
            <Space>
              <CSVLink
                data={[
                  ...closingBalanceData,
                  {
                    supplier_name: "TOTAL",
                    supplier_id: "",
                    debit_total: closingBalanceData.reduce((sum, row) => sum + parseFloat(row.debit_total || 0), 0).toFixed(2),
                    credit_total: closingBalanceData.reduce((sum, row) => sum + parseFloat(row.credit_total || 0), 0).toFixed(2),
                    closing_balance: closingBalanceData.reduce((sum, row) => sum + parseFloat(row.closing_balance || 0), 0).toFixed(2),
                  },
                ]}
                filename="SupplierClosingBalance.csv"
              >
                <Button>Export Excel</Button>
              </CSVLink>
              <Button danger onClick={exportClosingBalancePDF}>Export PDF</Button>
              <Button
                type="text"
                onClick={() => setIsClosingBalanceCollapsed((prev) => !prev)}
                icon={isClosingBalanceCollapsed ? <DownOutlined /> : <UpOutlined />}
              >
                {isClosingBalanceCollapsed ? "Expand" : "Collapse"}
              </Button>
            </Space>
          }
        >
          {!isClosingBalanceCollapsed && (
            <Table
              rowKey="key"
              columns={closingBalanceColumns}
              dataSource={closingBalanceData}
              pagination={{ pageSize: 10 }}
              locale={{ emptyText: "No supplier balance data found" }}
            />
          )}
        </Card>
      )}
      </div>
    </Layout>
  );
}