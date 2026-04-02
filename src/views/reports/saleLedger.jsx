import React, { useEffect, useRef, useState } from "react";
import { parseISO, isValid, format as fmt } from "date-fns";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { CSVLink } from "react-csv";
import logo from "../../assets/logo.png";

import { Button, Card, Checkbox, Col, DatePicker, Popconfirm, Row, Select, Space, Table, Tooltip } from "antd";
import { DeleteOutlined, FileExcelOutlined, FilePdfOutlined, FilterOutlined, ReloadOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import Header from "../../components/Header";
import Layout from "../../layout/Layout";
import fetchData from "../../functions/fetchData";
import deleteRecord from "../../functions/delateData";
import { getResolvedShopId } from "../../utility/getHeader";
export default function BillHistory() {
  const csvLinkRef = useRef(null);
  const [data, setData] = useState([]);
  const [Alldata, setAllData] = useState([]);
  const [customerdata, setCustomerdata] = useState([]);
  const [companyInfo, setCompanyInfo] = useState({});
  const [Totals, setTotals] = useState({ credit: 0, debit: 0, discount: 0, balance: 0 });
  const [deletingTxnId, setDeletingTxnId] = useState(null);
  const [formdata, setFormData] = useState({
    from: "",
    to: "",
    accounttype: "Account Recievable",
    account_id: "",
    showAllClosingBalance: false,
    showCustomerFinalBalance: false,
  });
  const [customerFinalBalanceData, setCustomerFinalBalanceData] = useState([]);
  const resolvedShopId = Number(getResolvedShopId()) || null;

  const columns = [
    { label: "Txn ID", field: "transaction_id" },
    { label: "Date", field: "date" },
    // { label: "Customer Name", field: "customer_name" },
    { label: "A/C Type", field: "account_type" },
    { label: "A/C ID", field: "account_id" },
    { label: "Description", field: "description" },
    { label: "Discount", field: "discount_amount" },
    { label: "Debit", field: "debit_amount" },
    { label: "Credit", field: "credit_amount" },
  ];

  const formatDateSafe = (dateStr) => {
    const date = parseISO(dateStr);
    return isValid(date) ? fmt(date, "yyyy-MM-dd") : "";
  };

  const getCustomerNameByAccountId = (accountId) => {
    const customer = customerdata.find((cust) => String(cust.id) === String(accountId));
    return customer?.name || "";
  };

  const getAccountDisplay = (row) => {
    const accountId = row?.account_id ?? "";
    const customerName = getCustomerNameByAccountId(accountId);
    return customerName ? `${accountId} - ${customerName}` : String(accountId);
  };

  const getRowBalance = (row) =>
    (Number(row?.debit_amount) || 0) - (Number(row?.credit_amount) || 0) - (Number(row?.discount_amount) || 0);

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

  const bytesToBase64 = (bytes) => {
    if (!bytes?.length) return "";

    let binary = "";
    const chunkSize = 0x8000;
    for (let index = 0; index < bytes.length; index += chunkSize) {
      const chunk = bytes.slice(index, index + chunkSize);
      binary += String.fromCharCode(...chunk);
    }

    return window.btoa(binary);
  };

  const getCompanyLogoSource = () => {
    const rawLogo = companyInfo?.logo;
    const logoType = companyInfo?.logo_type || "image/png";
    const logoName = String(companyInfo?.logo_name || "").trim();

    if (!rawLogo) {
      if (logoName) {
        return `/assets/img/logo/${logoName}`;
      }
      return logo;
    }

    if (typeof rawLogo === "string") {
      if (rawLogo.startsWith("data:image") || rawLogo.startsWith("http") || rawLogo.startsWith("/")) {
        return rawLogo;
      }

      return `data:${logoType};base64,${rawLogo}`;
    }

    if (Array.isArray(rawLogo)) {
      const base64 = bytesToBase64(rawLogo);
      return base64 ? `data:${logoType};base64,${base64}` : logo;
    }

    if (rawLogo?.type === "Buffer" && Array.isArray(rawLogo?.data)) {
      const base64 = bytesToBase64(rawLogo.data);
      return base64 ? `data:${logoType};base64,${base64}` : logo;
    }

    if (rawLogo?.data && Array.isArray(rawLogo.data)) {
      const base64 = bytesToBase64(rawLogo.data);
      return base64 ? `data:${logoType};base64,${base64}` : logo;
    }

    return logo;
  };

  const pickPreferredCompanyInfo = (rows = []) => {
    if (!Array.isArray(rows) || rows.length === 0) {
      return {};
    }

    const scopedRows = resolvedShopId
      ? rows.filter((row) => Number(row?.shop_id) === resolvedShopId)
      : rows;
    const candidates = scopedRows.length > 0 ? scopedRows : rows;

    return [...candidates]
      .filter((row) => row?.is_active !== 0)
      .sort((left, right) => {
        const leftHasLogo = Boolean(left?.logo || left?.logo_name);
        const rightHasLogo = Boolean(right?.logo || right?.logo_name);
        if (leftHasLogo !== rightHasLogo) {
          return Number(rightHasLogo) - Number(leftHasLogo);
        }

        const leftUpdated = new Date(left?.updated_at || left?.created_at || 0).getTime();
        const rightUpdated = new Date(right?.updated_at || right?.created_at || 0).getTime();
        if (leftUpdated !== rightUpdated) {
          return rightUpdated - leftUpdated;
        }

        return Number(right?.id || 0) - Number(left?.id || 0);
      })[0] || {};
  };

  const filterData = () => {
    const { from, to, accounttype, account_id, showAllClosingBalance } = formdata;
    const customerIdSet = new Set((customerdata || []).map((cust) => String(cust.id)));

    // Keep report scoped to customer ledger only.
    let filtered = [...Alldata]
      .filter((r) => r.account_type === "Account Recievable")
      .filter((r) => {
        if (!customerIdSet.size) return true;
        return customerIdSet.has(String(r.account_id));
      });

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
      filtered = filtered.filter((r) => String(r.account_id) === String(account_id));
    }

    const customerLedgerAll = [...Alldata]
      .filter((r) => r.account_type === "Account Recievable")
      .filter((r) => {
        if (!customerIdSet.size) return true;
        return customerIdSet.has(String(r.account_id));
      });

    const totalsSource = showAllClosingBalance ? customerLedgerAll : filtered;
    const credit = totalsSource.reduce((sum, r) => sum + (Number(r.credit_amount) || 0), 0);
    const debit = totalsSource.reduce((sum, r) => sum + (Number(r.debit_amount) || 0), 0);
    const discount = totalsSource.reduce((sum, r) => sum + (Number(r.discount_amount) || 0), 0);
    setTotals({ credit, debit, discount, balance: debit - credit - discount });

    const finalRows = Object.values(
      filtered.reduce((acc, row) => {
        const accountId = String(row.account_id);
        if (!acc[accountId]) {
          acc[accountId] = {
            id: `final-${accountId}`,
            transaction_id: "",
            date: row.date,
            account_type: "Account Recievable",
            account_id: row.account_id,
            description: "Customer Final Balance",
            discount_amount: 0,
            debit_amount: 0,
            credit_amount: 0,
          };
        }

        acc[accountId].debit_amount += Number(row.debit_amount) || 0;
        acc[accountId].credit_amount += Number(row.credit_amount) || 0;

        if (new Date(row.date || 0) > new Date(acc[accountId].date || 0)) {
          acc[accountId].date = row.date;
        }

        return acc;
      }, {})
    ).map((row) => ({
      ...row,
      balance: (Number(row.debit_amount) || 0) - (Number(row.credit_amount) || 0),
    }));

    setCustomerFinalBalanceData(finalRows);

    setData(filtered);
  };

  const exportToPDF = async () => {
    const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
    const displayRows = formdata.showCustomerFinalBalance ? customerFinalBalanceData : data;
    const tableColumn = formdata.showCustomerFinalBalance
      ? ["Txn ID", "Date", "A/C Type", "A/C ID", "Description", "Discount", "Debit", "Credit", "Balance"]
      : columns.map((col) => col.label);
    const tableRows = [];

    try {
      const logoDataUrl = await loadImageAsDataUrl(getCompanyLogoSource());
      doc.addImage(logoDataUrl, "PNG", 8, 10, 28, 18);
    } catch (err) {
      console.warn("Failed to load logo for PDF:", err);
    }

    const headerX = 38;
    doc.setFontSize(12);
    doc.text(companyInfo.name || companyInfo.company_name || "JANNAAT LAUNGE", headerX, 16);
    doc.setFontSize(9);
    if (companyInfo.address) doc.text(companyInfo.address, headerX, 21);
    const contactLine = [companyInfo.phone_number || companyInfo.phone, companyInfo.email].filter(Boolean).join(" | ");
    if (contactLine) doc.text(contactLine, headerX, 26);
    if (companyInfo.tax_id) doc.text(`Tax ID: ${companyInfo.tax_id}`, headerX, 31);
    doc.setFontSize(10);
    doc.text("Sales Ledger Report", headerX, 36);

    displayRows.forEach((row) => {
      const base = [
        row.transaction_id,
        formatDateSafe(row.date),
        row.account_type,
        getAccountDisplay(row),
        row.description,
        Number(row.discount_amount || 0).toFixed(2),
        Number(row.debit_amount || 0).toFixed(2),
        Number(row.credit_amount || 0).toFixed(2),
      ];

      if (formdata.showCustomerFinalBalance) {
        tableRows.push([
          ...base,
          Number(row.balance ?? getRowBalance(row)).toFixed(2),
        ]);
      } else {
        tableRows.push(base);
      }
    });

    tableRows.push([
      "SUMMARY",
      "",
      "",
      "",
      "Final Balance",
      "",
      (Totals.debit).toFixed(2),
      (Totals.credit).toFixed(2),
      ...(formdata.showCustomerFinalBalance ? [(Totals.balance).toFixed(2)] : []),
    ]);

    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      theme: "grid",
      startY: 42,
    });

    doc.save("ledger_report.pdf");
  };

  const exportRows = formdata.showCustomerFinalBalance ? customerFinalBalanceData : data;

  const exportCSVData = [
    ...exportRows.map((row) => ({
      transaction_id: row.transaction_id,
      date: formatDateSafe(row.date),
      customer_name: getCustomerNameByAccountId(row.account_id),
      account_type: row.account_type,
      account_id: getAccountDisplay(row),
      description: row.description,
      discount_amount: row.discount_amount,
      debit_amount: row.debit_amount,
      credit_amount: row.credit_amount,
      balance: formdata.showCustomerFinalBalance
        ? Number(row.balance ?? getRowBalance(row)).toFixed(2)
        : "",
    })),
    {
      transaction_id: "",
      date: "",
      customer_name: "",
      account_type: "",
      account_id: "",
      description: "Summary",
      discount_amount: "",
      debit_amount: (Totals.debit).toFixed(2) || 0,
      credit_amount: (Totals.credit).toFixed(2) || 0,
      balance: (Totals.balance).toFixed(2),
    },
  ];
const resetFilters = () => {
  setFormData({
    from: "",
    to: "",
    accounttype: "Account Recievable",
    account_id: "",
    showAllClosingBalance: false,
    showCustomerFinalBalance: false,
  });
  setData(Alldata);
};

  const handleExportCSV = () => {
    if (csvLinkRef.current?.link) {
      csvLinkRef.current.link.click();
    }
  };

  const userType = (localStorage.getItem("usertype") || sessionStorage.getItem("usertype") || "").toLowerCase();
  const canDeleteLedger = userType === "admin" || userType === "account";

  const handleDeleteByTransactionId = async (transactionId) => {
    if (!transactionId) {
      toast.error("Transaction ID is required");
      return;
    }

    try {
      setDeletingTxnId(transactionId);
      const response = await deleteRecord("ledger_entries", "transaction_id", transactionId);

      setAllData((prev) =>
        prev.filter((row) => String(row.transaction_id) !== String(transactionId))
      );

      toast.success(response?.message || `Entries for transaction ${transactionId} deleted`);
    } catch (error) {
      console.error("Error deleting transaction entries:", error);
      toast.error(error?.message || "Failed to delete transaction entries");
    } finally {
      setDeletingTxnId(null);
    }
  };

  const antColumns = [
    {
      title: "Txn ID",
      dataIndex: "transaction_id",
      key: "transaction_id",
      sorter: (a, b) => String(a.transaction_id).localeCompare(String(b.transaction_id)),
    },
    {
      title: "Date",
      dataIndex: "date",
      key: "date",
      render: (value) => formatDateSafe(value),
      sorter: (a, b) => new Date(a.date || 0) - new Date(b.date || 0),
    },
    {
      title: "A/C Type",
      dataIndex: "account_type",
      key: "account_type",
    },
    {
      title: "A/C ID",
      dataIndex: "account_id",
      key: "account_id",
      render: (_, record) => getAccountDisplay(record),
    },
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
    },
    {
      title: "Discount",
      dataIndex: "discount_amount",
      key: "discount_amount",
      align: "right",
      render: (value) => Number(value || 0).toFixed(2),
    },
    {
      title: "Debit",
      dataIndex: "debit_amount",
      key: "debit_amount",
      align: "right",
      render: (value) => Number(value || 0).toFixed(2),
    },
    {
      title: "Credit",
      dataIndex: "credit_amount",
      key: "credit_amount",
      align: "right",
      render: (value) => Number(value || 0).toFixed(2),
    },
    ...(formdata.showCustomerFinalBalance
      ? [{
          title: "Balance",
          dataIndex: "balance",
          key: "balance",
          align: "right",
          render: (_, record) => Number(record.balance ?? getRowBalance(record)).toFixed(2),
        }]
      : []),
    ...(!formdata.showCustomerFinalBalance
      ? [{
          title: "Action",
          key: "action",
          align: "center",
          width: 100,
          render: (_, record) => {
            if (canDeleteLedger) {
              return (
                <Popconfirm
                  title="Delete ledger entries"
                  description={`Delete all entries for transaction ${record.transaction_id}?`}
                  onConfirm={() => handleDeleteByTransactionId(record.transaction_id)}
                  okText="Delete"
                  cancelText="Cancel"
                >
                  <Tooltip title="Delete by transaction id">
                    <Button
                      type="text"
                      danger
                      icon={<DeleteOutlined />}
                      loading={deletingTxnId === record.transaction_id}
                    />
                  </Tooltip>
                </Popconfirm>
              );
            }

            return (
              <Tooltip title="No delete permission. Only admin/account can delete.">
                <Button type="text" danger icon={<DeleteOutlined />} disabled />
              </Tooltip>
            );
          },
        }]
      : []),
  ];

  useEffect(() => {
    const loadData = async () => {
      try {
        const fetched = await fetchData("ledger_entries", null, "id", {});
        setAllData(fetched);
        setData(fetched);
        const result = await fetchData("customers", null, "id", {});
        setCustomerdata(result);
        const companyProfileData = await fetchData(
          "company_profile",
          null,
          "id",
          resolvedShopId ? { shop_id: resolvedShopId } : {}
        );
        if (Array.isArray(companyProfileData) && companyProfileData.length > 0) {
          setCompanyInfo(pickPreferredCompanyInfo(companyProfileData));
        } else {
          const companyData = await fetchData(
            "companyinfo",
            null,
            "id",
            resolvedShopId ? { shop_id: resolvedShopId } : {}
          );
          setCompanyInfo(pickPreferredCompanyInfo(companyData));
        }

      } catch (e) {
        console.error("Error fetching data:", e);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    filterData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formdata, Alldata, customerdata]);

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
          <Col xs={24} sm={12} md={6}>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 28 }}>
              <Checkbox
                checked={formdata.showCustomerFinalBalance}
                onChange={(e) => setFormData({ ...formdata, showCustomerFinalBalance: e.target.checked })}
              >
                Show Final Balance Per Customer
              </Checkbox>
              <Checkbox
                checked={formdata.showAllClosingBalance}
                onChange={(e) => setFormData({ ...formdata, showAllClosingBalance: e.target.checked })}
              >
                Closing Balance From All Customer Ledger
              </Checkbox>
            </div>
          </Col>
        </Row>
      </Card>

      <div className="row mt-3">
        <div className="col-12">
          <Space wrap>
            <Button danger icon={<FilePdfOutlined />} onClick={exportToPDF}>
              Export to PDF
            </Button>

            <Button type="primary" icon={<FileExcelOutlined />} onClick={handleExportCSV}>
              Export to CSV
            </Button>

            <Button icon={<ReloadOutlined />} onClick={resetFilters}>
              Reset Filters
            </Button>
          </Space>
          <div style={{ display: "none" }}>
            <CSVLink
              ref={csvLinkRef}
              data={exportCSVData}
              filename="ledger_report.csv"
            >
              Download CSV
            </CSVLink>
          </div>
        </div>
      </div>

      <div className="row mt-3">
        <div className="col-12">
          <Table
            columns={antColumns}
            dataSource={formdata.showCustomerFinalBalance ? customerFinalBalanceData : data}
            rowKey="id"
            pagination={{ pageSize: 50, showSizeChanger: true }}
            scroll={{ x: formdata.showCustomerFinalBalance ? 1250 : 1100 }}
            summary={() => (
              <Table.Summary.Row>
                <Table.Summary.Cell index={0} colSpan={6}>
                  <strong>
                    Final Balance {formdata.showAllClosingBalance ? "(All Customer Ledger)" : "(Filtered)"}: {(Totals.balance).toFixed(2)}
                  </strong>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={6} align="right">
                  <strong>{(Totals.debit).toFixed(2)}</strong>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={7} align="right">
                  <strong>{(Totals.credit).toFixed(2)}</strong>
                </Table.Summary.Cell>
                {formdata.showCustomerFinalBalance && (
                  <Table.Summary.Cell index={8} align="right">
                    <strong>{(Totals.balance).toFixed(2)}</strong>
                  </Table.Summary.Cell>
                )}
                <Table.Summary.Cell index={formdata.showCustomerFinalBalance ? 9 : 8} />
              </Table.Summary.Row>
            )}
          />
          <div className="mt-3">
            <strong>Total Credit:</strong> {(Totals.credit).toFixed(2)} |{" "}
            <strong>Total Debit:</strong> {(Totals.debit).toFixed(2)} |{" "}
            <strong>Final Balance:</strong> {(Totals.balance).toFixed(2)}
          </div>
        </div>
      </div>
    </Layout>
  );
}
