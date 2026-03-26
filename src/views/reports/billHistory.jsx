// Updated BillHistory.jsx with Ant Design
import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { CSVLink } from "react-csv";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { parseISO, format } from "date-fns";
import { useNavigate } from "react-router-dom";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import {
  Table,
  Card,
  Button,
  Dropdown,
  DatePicker,
  Select,
  Input,
  Row,
  Col,
  Tabs,
  Space,
  Statistic,
  Empty,
  Modal,
  Tooltip as AntTooltip,
  Tag,
  InputNumber,
  Checkbox,
} from "antd";
import {
  FilterOutlined,
  ClearOutlined,
  FileExcelOutlined,
  FilePdfOutlined,
  ArrowLeftOutlined,
  HomeOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  CreditCardOutlined,
  SwapOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";

import Layout from "../../layout/Layout";
import Header from "../../components/Header";
import CardComponent from "../../components/cards/CardComponent";
import DataTable from "../../components/data-tables/dataTable";
import fetchData from "../../functions/fetchData";
import updateData from "../../functions/updateData";
import logo from "../../assets/logo.png";
import BillItemModal from "../../components/Modals/BillItemModal";
import { getUserType } from "../../utility/auth";
import { getHeaders } from "../../utility/getHeader";
import { getNextSetupDate } from "../../utils/setupDateUtils";

const PAYMENT_MODES = [
  { label: "Cash", value: "Cash" },
  { label: "Credit", value: "Credit" },
  { label: "Bank Transfer", value: "Bank Transfer" },
  { label: "Entertainment", value: "Entertainment" },
  { label: "UPI", value: "UPI" },
  { label: "QR Scan", value: "QR Scan" },
];

export default function BillHistory() {
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [tablePagination, setTablePagination] = useState({
    current: 1,
    pageSize: 10,
  });
  const [activeSetupDate, setActiveSetupDate] = useState(dayjs());
  const [showModal, setShowModal] = useState(false);
  const [selectedBill, setSelectedBill] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [activeTab, setActiveTab] = useState("active");
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelBillId, setCancelBillId] = useState(null);
  const [cancelReason, setCancelReason] = useState("");
  const [showCreditModal, setShowCreditModal] = useState(false);
  const [selectedCreditBill, setSelectedCreditBill] = useState(null);
  const [selectedCreditCustomer, setSelectedCreditCustomer] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [movingToCredit, setMovingToCredit] = useState(false);
  const [showPaymentModeModal, setShowPaymentModeModal] = useState(false);
  const [selectedPaymentModeBill, setSelectedPaymentModeBill] = useState(null);
  const [targetPaymentMode, setTargetPaymentMode] = useState(null);
  const [updatingPaymentMode, setUpdatingPaymentMode] = useState(false);
  
  // Filter states
  const [filters, setFilters] = useState({
    startDate: localStorage.getItem("startDate") ? dayjs(localStorage.getItem("startDate")) : null,
    endDate: localStorage.getItem("endDate") ? dayjs(localStorage.getItem("endDate")) : null,
    paymentMode: localStorage.getItem("paymentMode") || "",
    invoiceNo: "",
    tableNumber: "",
    minAmount: null,
    maxAmount: null,
    sortBy: "date",
    sortOrder: "descend",
  });

  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  
  const navigate = useNavigate();
  const userType = getUserType();
  const isCashier = userType?.toLowerCase() === 'cashier';
  const canEditBill = ["admin", "account"].includes((userType || "").toLowerCase());

  useEffect(() => {
    let mounted = true;

    const syncActiveSetupDate = async () => {
      const setupDate = await getNextSetupDate();
      const setupDay = dayjs(setupDate);
      if (mounted) {
        setActiveSetupDate(setupDay.isValid() ? setupDay : dayjs());
      }
    };

    syncActiveSetupDate();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const hasSavedStart = Boolean(localStorage.getItem("startDate"));
    const hasSavedEnd = Boolean(localStorage.getItem("endDate"));
    if (hasSavedStart || hasSavedEnd) return;

    const setDefaultSetupDate = async () => {
      const setupDate = await getNextSetupDate();
      const setupDay = dayjs(setupDate);
      setFilters(prev => ({
        ...prev,
        startDate: setupDay,
        endDate: setupDay,
      }));
    };

    setDefaultSetupDate();
  }, []);

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

  useEffect(() => {
    setTablePagination((prev) => ({ ...prev, current: 1 }));
  }, [filteredData.length]);

  // Filter change effect
  useEffect(() => {
    if (filters.startDate) {
      localStorage.setItem("startDate", filters.startDate.format("YYYY-MM-DD"));
    } else {
      localStorage.removeItem("startDate");
    }
    if (filters.endDate) {
      localStorage.setItem("endDate", filters.endDate.format("YYYY-MM-DD"));
    } else {
      localStorage.removeItem("endDate");
    }
    localStorage.setItem("paymentMode", filters.paymentMode);
    
    if (data.length > 0) {
      applyFilters();
    }
  }, [filters, data, activeTab]);

  const normalizePaymentMode = (value) =>
    (value || "").toString().trim().toLowerCase().replace(/\s+/g, "");

  const isCancelledStatus = (status) => status === 2 || status === "2" || status === "cancelled";

  const isBillFromClosedDate = (setupDate) => {
    if (!setupDate) return true;
    const billDate = dayjs(setupDate);
    if (!billDate.isValid()) return true;
    return !billDate.isSame(activeSetupDate, "day");
  };

  const NON_CREDIT_PAYMENT_MODES = PAYMENT_MODES.filter(
    (mode) => normalizePaymentMode(mode.value) !== "credit"
  );

  const SALE_ONLY_FILTER_VALUE = "__sale_only__";

  const applyFilters = () => {
    if (filters.startDate && filters.endDate && filters.startDate.isAfter(filters.endDate)) {
      toast.error("Invalid date range: Start Date is after End Date");
      return;
    }

    let filtered = [...data];
    
    // Filter by status (active/cancelled)
    if (activeTab === "cancelled") {
      filtered = filtered.filter(item => item.status === 2 || item.status === "2");
    } else {
      filtered = filtered.filter(item => item.status !== 2 && item.status !== "2");
    }
    
    // Filter by date range
    if (filters.startDate && filters.endDate) {
      const start = filters.startDate.startOf('day').toDate();
      const end = filters.endDate.endOf('day').toDate();
      
      filtered = filtered.filter(item => {
        if (!item.setup_date) return false;
        const itemDate = new Date(item.setup_date);
        return itemDate >= start && itemDate <= end;
      });
    } else if (filters.startDate) {
      const start = filters.startDate.startOf('day').toDate();
      filtered = filtered.filter(item => {
        if (!item.setup_date) return false;
        const itemDate = new Date(item.setup_date);
        return itemDate >= start;
      });
    } else if (filters.endDate) {
      const end = filters.endDate.endOf('day').toDate();
      filtered = filtered.filter(item => {
        if (!item.setup_date) return false;
        const itemDate = new Date(item.setup_date);
        return itemDate <= end;
      });
    }
    
    // Filter by payment mode
    if (filters.paymentMode) {
      const filterMode = normalizePaymentMode(filters.paymentMode);
      const qrAliases = new Set(["qrcode", "qrscan", "wrscan", "qr"]);

      filtered = filtered.filter(item => {
        const itemMode = normalizePaymentMode(item.payment_mode);
        if (filterMode === SALE_ONLY_FILTER_VALUE) {
          return itemMode !== "entertainment";
        }
        if (qrAliases.has(filterMode)) {
          return qrAliases.has(itemMode);
        }
        return itemMode === filterMode;
      });
    }
    
    // Filter by invoice number
    if (filters.invoiceNo) {
      filtered = filtered.filter(item => 
        item.id.toString().includes(filters.invoiceNo.toLowerCase())
      );
    }
    
    // Filter by table
    if (filters.tableNumber) {
      filtered = filtered.filter(item => 
        item.table_number && item.table_number.toLowerCase().includes(filters.tableNumber.toLowerCase())
      );
    }
    
    // Filter by amount range
    if (filters.minAmount !== null || filters.maxAmount !== null) {
      filtered = filtered.filter(item => {
        const amount = parseFloat(item.grand_total || 0);
        const minAmount = filters.minAmount !== null ? parseFloat(filters.minAmount) : 0;
        const maxAmount = filters.maxAmount !== null ? parseFloat(filters.maxAmount) : Infinity;
        return amount >= minAmount && amount <= maxAmount;
      });
    }
    
    // Sort data
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (filters.sortBy) {
        case "date":
          aValue = new Date(a.setup_date + " " + (a.inv_time || "00:00:00"));
          bValue = new Date(b.setup_date + " " + (b.inv_time || "00:00:00"));
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
      
      if (filters.sortOrder === "ascend") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
    
    setFilteredData(filtered);
  };
  const clearFilters = () => {
    setFilters({
      startDate: null,
      endDate: null,
      paymentMode: "",
      invoiceNo: "",
      tableNumber: "",
      minAmount: null,
      maxAmount: null,
      sortBy: "date",
      sortOrder: "descend",
    });
    localStorage.removeItem("startDate");
    localStorage.removeItem("endDate");
    localStorage.removeItem("paymentMode");
    toast.success("Filters cleared!");
  };

 const exportPDF = () => {
  const doc = new jsPDF();
  doc.addImage(logo, "PNG", 150, 10, 40, 15);
  doc.setFontSize(16);
  doc.text("Bill History Report", 14, 20);

  const tableColumn = ["Invoice No", "Date", "Time", "Table", "Subtotal", "Tax", "Grand Total", "Payment Mode"];
  const tableRows = [];

  filteredData.forEach(item => {
    const subtotal = parseFloat(item.subtotal_afterdiscount) || 0;
    const tax = parseFloat(item.tax) || 0;
    const grandTotal = parseFloat(item.grand_total) || 0;

    tableRows.push([
      item.id,
      format(parseISO(item.setup_date), "dd/MM/yyyy"),
      item.inv_time,
      item.table_number,
      subtotal.toFixed(2),
      tax.toFixed(2),
      grandTotal.toFixed(2),
      item.payment_mode,
    ]);
  });

  // Add total row
  tableRows.push([
    { content: "TOTAL", colSpan: 4, styles: { halign: "right", fontStyle: "bold" } },
    totalSubtotal.toFixed(2),
    totalTax.toFixed(2),
    totalAmount.toFixed(2),
    "" 
  ]);

  doc.autoTable({
    startY: 30,
    head: [tableColumn],
    body: tableRows,
    styles: { fontSize: 10 },
  });

  doc.save(`salereport-${dayjs().format("YYYY-MM-DD")}.pdf`);
};


  const handleViewItems = (row) => {
    setSelectedBill(row);
    setIsEditMode(false);
    setShowModal(true);
  };

  const handleEditBill = (row) => {
    if (isBillFromClosedDate(row?.setup_date)) {
      toast.error("Bills from closed dates cannot be edited.");
      return;
    }

    setSelectedBill(row);
    setIsEditMode(true);
    setShowModal(true);
  };

  const refreshBills = async () => {
    try {
      await fetchData("final_bill", setData, "id", {});
    } catch (error) {
      console.error("Error refreshing bills:", error);
    }
  };

  const handleCancelBill = (billInput) => {
    const billRecord = typeof billInput === "object"
      ? billInput
      : data.find((item) => String(item.id) === String(billInput));
    const billId = typeof billInput === "object" ? billInput?.id : billInput;

    if (!billId) {
      toast.error("Invalid bill selected.");
      return;
    }

    if (isBillFromClosedDate(billRecord?.setup_date)) {
      toast.error("Bills from closed dates cannot be cancelled.");
      return;
    }

    setCancelBillId(billId);
    setCancelReason("");
    setShowCancelModal(true);
  };

  const confirmCancelBill = async () => {
    if (!cancelBillId) return;
    
    try {
      const billToCancel = data.find((item) => String(item.id) === String(cancelBillId));
      const isCreditBill = normalizePaymentMode(billToCancel?.payment_mode) === "credit";

      await Promise.all([
        updateData("final_bill", {
          status: 2,
          remark: cancelReason || "Cancelled"
        }, { id: cancelBillId }),
        updateData("order_items", {
          status: 2
        }, { invoice_number: String(cancelBillId) })
      ]);

      if (isCreditBill) {
        try {
          await axios.delete(`/deletebyid/ledger_entries/transaction_id/${cancelBillId}`, getHeaders());
        } catch (ledgerError) {
          console.error("Error deleting ledger entries for cancelled credit bill:", ledgerError);
          toast.warning("Bill cancelled, but failed to remove ledger entries.");
        }
      }
      
      toast.success("Bill cancelled successfully!");
      const updatedData = await fetchData("final_bill", null, "id", {});
      setData(updatedData || []);
      setShowCancelModal(false);
      setCancelBillId(null);
      setCancelReason("");
    } catch (error) {
      console.error("Error cancelling bill:", error);
      toast.error("Failed to cancel bill");
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const loadCustomers = async () => {
    try {
      const customerRows = await fetchData("customers", null, "id", {});
      setCustomers(Array.isArray(customerRows) ? customerRows : []);
    } catch (error) {
      console.error("Error fetching customers:", error);
      setCustomers([]);
      toast.error("Unable to load customers.");
    }
  };

  const handleMoveBillToCredit = (record) => {
    if (!record?.id) {
      toast.error("Invalid bill selected.");
      return;
    }

    if (isCancelledStatus(record.status)) {
      toast.error("Cancelled bill cannot be moved to credit.");
      return;
    }

    if (isBillFromClosedDate(record.setup_date)) {
      toast.error("Bills from closed dates cannot be moved to credit.");
      return;
    }

    if (normalizePaymentMode(record.payment_mode) === "credit") {
      toast.info("Bill is already in credit mode.");
      return;
    }

    setSelectedCreditBill(record);
    setSelectedCreditCustomer(record.customer_id || null);
    setShowCreditModal(true);

    if (customers.length === 0) {
      loadCustomers();
    }
  };

  const confirmMoveBillToCredit = async () => {
    if (!selectedCreditBill?.id) {
      toast.error("Invalid bill selected.");
      return;
    }

    if (!selectedCreditCustomer) {
      toast.error("Please select customer.");
      return;
    }

    try {
      setMovingToCredit(true);
      const response = await axios.post(
        "/movebilltocredit",
        {
          bill_id: selectedCreditBill.id,
          customer_id: selectedCreditCustomer,
        },
        getHeaders()
      );

      if (response?.data?.success) {
        toast.success(response?.data?.message || "Bill moved to credit successfully.");
        setShowCreditModal(false);
        setSelectedCreditBill(null);
        setSelectedCreditCustomer(null);
        await refreshBills();
      } else {
        toast.error(response?.data?.message || "Unable to move bill to credit.");
      }
    } catch (error) {
      console.error("Error moving bill to credit:", error);
      toast.error(error?.response?.data?.message || "Failed to move bill to credit.");
    } finally {
      setMovingToCredit(false);
    }
  };

  const getAvailableTargetPaymentModes = (currentMode) => {
    const normalizedCurrentMode = normalizePaymentMode(currentMode);
    return NON_CREDIT_PAYMENT_MODES.filter(
      (mode) => normalizePaymentMode(mode.value) !== normalizedCurrentMode
    );
  };

  const handleOpenPaymentModeModal = (record) => {
    if (!record?.id) {
      toast.error("Invalid bill selected.");
      return;
    }

    if (isCancelledStatus(record.status)) {
      toast.error("Cancelled bill payment mode cannot be changed.");
      return;
    }

    if (isBillFromClosedDate(record.setup_date)) {
      toast.error("Bills from closed dates cannot change payment mode.");
      return;
    }

    if (normalizePaymentMode(record.payment_mode) === "credit") {
      toast.info("Credit payment mode is handled separately.");
      return;
    }

    const targetModes = getAvailableTargetPaymentModes(record.payment_mode);
    if (targetModes.length === 0) {
      toast.warning("No alternate payment modes available.");
      return;
    }

    setSelectedPaymentModeBill(record);
    setTargetPaymentMode(targetModes[0].value);
    setShowPaymentModeModal(true);
  };

  const confirmChangePaymentMode = async () => {
    if (!selectedPaymentModeBill?.id) {
      toast.error("Invalid bill selected.");
      return;
    }

    if (!targetPaymentMode) {
      toast.error("Please select payment mode.");
      return;
    }

    const currentMode = normalizePaymentMode(selectedPaymentModeBill.payment_mode);
    const nextMode = normalizePaymentMode(targetPaymentMode);

    if (nextMode === "credit") {
      toast.error("Credit mode change is not allowed here.");
      return;
    }

    if (currentMode === nextMode) {
      toast.info("Bill is already in selected payment mode.");
      return;
    }

    try {
      setUpdatingPaymentMode(true);
      await updateData(
        "final_bill",
        { payment_mode: targetPaymentMode },
        { id: selectedPaymentModeBill.id }
      );

      toast.success(`Payment mode changed to ${targetPaymentMode}.`);
      setShowPaymentModeModal(false);
      setSelectedPaymentModeBill(null);
      setTargetPaymentMode(null);
      await refreshBills();
    } catch (error) {
      console.error("Error changing payment mode:", error);
      toast.error("Failed to change payment mode.");
    } finally {
      setUpdatingPaymentMode(false);
    }
  };

  const monthlyData = (() => {
    const summary = {};
    (filteredData.length > 0 ? filteredData : data).forEach((item) => {
      const month = format(parseISO(item.setup_date), "MMM yyyy");
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
    { label: "Inv Date", field: "inv_date" },
    { label: "Setup Date", field: "setup_date" },
    { label: "Time", field: "inv_time" },
    { label: "Table", field: "table_number" },
    { label: "Subtotal", field: "subtotal_afterdiscount" },
    { label: "Discount", field: "discount_amount" },
    { label: "Tax", field: "tax" },
    { label: "Grand Total", field: "grand_total" },
    { label: "Payment", field: "payment_mode" },
    {
      label: "Action",
      field: "actions",
      render: (row) => (
        <div className="d-flex gap-2">
          <button className="btn btn-sm btn-info" onClick={() => handleViewItems(row)}>
            View Items
          </button>
          {(row.status !== 2 && row.status !== "2") && (
            <button
              className="btn btn-sm btn-danger"
              onClick={() => handleCancelBill(row)}
              disabled={isBillFromClosedDate(row.setup_date)}
            >
              Cancel
            </button>
          )}
        </div>
      ),
    },
  ];

  // Navigation functions for cashiers
  const navigateToDashboard = () => {
    navigate('/dashboard');
  };

  const navigateBack = () => {
    navigate(-1);
  };

  // Calculate totals
  const totalAmount = filteredData.reduce((acc, item) => acc + parseFloat(item.grand_total || 0), 0);
  const totalSubtotal = filteredData.reduce((acc, item) => acc + parseFloat(item.subtotal_afterdiscount || 0), 0);
  const totalTax = filteredData.reduce((acc, item) => acc + parseFloat(item.tax || 0), 0);

  const summarySource = filteredData.filter(item => !isCancelledStatus(item.status));
  const summaryTotalSale = summarySource.reduce((acc, item) => acc + parseFloat(item.grand_total || 0), 0);
  const summaryEntertainmentTotal = summarySource.reduce((acc, item) => {
    const paymentMode = (item.payment_mode || "").toLowerCase();
    if (paymentMode === "entertainment") {
      return acc + parseFloat(item.grand_total || 0);
    }
    return acc;
  }, 0);
  const summaryTotalDiscount = summarySource.reduce((acc, item) => {
    const discount = parseFloat(item.discount_amount ?? item.discount ?? 0);
    return acc + discount;
  }, 0);
  const summaryNetSaleAfterDiscount = summarySource.reduce((acc, item) => acc + parseFloat(item.subtotal_afterdiscount || 0), 0);

  // Check if mobile device
  const isMobile = window.innerWidth <= 768;

  // Render content with Ant Design
  const renderContent = () => {
    const isCancelledTab = activeTab === "cancelled";
    const tableColumns = [
      {
        title: "Inv. No.",
        dataIndex: "id",
        key: "id",
        width: 100,
        render: (text, record) => (
          <Button 
            type="link" 
            onClick={() => handleViewItems(record)}
          >
            #{text}
          </Button>
        ),
        sorter: (a, b) => a.id - b.id,
      },
      {
        title: "Date",
        dataIndex: "setup_date",
        key: "setup_date",
        render: (text) => format(parseISO(text), "dd/MM/yyyy"),
        sorter: (a, b) => new Date(a.setup_date) - new Date(b.setup_date),
      },
      {
        title: "Time",
        dataIndex: "inv_time",
        key: "inv_time",
        width: 80,
      },
      {
        title: "Table",
        dataIndex: "table_number",
        key: "table_number",
        render: (text) => <Tag color="cyan">{text}</Tag>,
      },
      {
        title: "Subtotal",
        dataIndex: "subtotal_afterdiscount",
        key: "subtotal_afterdiscount",
        render: (text) => `฿${parseFloat(text || 0).toFixed(2)}`,
        align: "right",
      },
      {
        title: "Discount",
        dataIndex: "discount_amount",
        key: "discount_amount",
        render: (_, record) => {
          const discount = parseFloat(record.discount_amount ?? record.discount ?? 0);
          return `฿${discount.toFixed(2)}`;
        },
        align: "right",
      },
      {
        title: "Tax",
        dataIndex: "tax",
        key: "tax",
        render: (text) => `฿${parseFloat(text || 0).toFixed(2)}`,
        align: "right",
      },
      {
        title: "Grand Total",
        dataIndex: "grand_total",
        key: "grand_total",
        render: (text) => <strong>฿{parseFloat(text || 0).toFixed(2)}</strong>,
        align: "right",
      },
      {
        title: "Payment",
        dataIndex: "payment_mode",
        key: "payment_mode",
        render: (text) => {
          const normalizedMode = normalizePaymentMode(text);
          const displayMode = ["qrcode", "qrscan", "wrscan", "qr"].includes(normalizedMode)
            ? "QR Scan"
            : text;
          const colorMap = {
            "Cash": "green",
            "Credit": "blue",
            "Bank Transfer": "purple",
            "UPI": "orange",
            "QR Scan": "red",
            "Entertainment": "cyan",
          };
          return <Tag color={colorMap[displayMode] || "default"}>{displayMode}</Tag>;
        },
      },
      ...(isCancelledTab
        ? [
            {
              title: "Cancel Reason",
              dataIndex: "remark",
              key: "remark",
              render: (text) => text || "-",
            },
          ]
        : []),
      {
        title: "Action",
        key: "action",
        width: 120,
        render: (_, record) => {
          const isClosedDate = isBillFromClosedDate(record.setup_date);

          return (
          <Space>
            <AntTooltip title="View Items">
              <Button 
                type="primary" 
                size="small"
                icon={<EyeOutlined />}
                onClick={() => handleViewItems(record)}
              />
            </AntTooltip>
            {canEditBill && (
              <AntTooltip
                title={
                  isCancelledStatus(record.status)
                    ? "Cancelled bills cannot be edited"
                    : isClosedDate
                      ? "Bills from closed dates cannot be edited"
                      : "Edit Bill"
                }
              >
                <Button
                  size="small"
                  icon={<EditOutlined />}
                  onClick={() => handleEditBill(record)}
                  disabled={
                    isCancelledStatus(record.status) ||
                    isClosedDate
                  }
                />
              </AntTooltip>
            )}
            {!isCancelledStatus(record.status) && (
              <AntTooltip title={isClosedDate ? "Bills from closed dates cannot be cancelled" : "Cancel Bill"}>
                <Button 
                  type="primary" 
                  danger
                  size="small"
                  icon={<DeleteOutlined />}
                  onClick={() => handleCancelBill(record)}
                  disabled={isClosedDate}
                />
              </AntTooltip>
            )}
            {!isCancelledStatus(record.status) && (
              <AntTooltip
                title={
                  isClosedDate
                    ? "Bills from closed dates cannot be moved to credit"
                    : normalizePaymentMode(record.payment_mode) === "credit"
                    ? "Already in credit mode"
                    : "Move to Credit"
                }
              >
                <Button
                  type="default"
                  size="small"
                  icon={<CreditCardOutlined />}
                  onClick={() => handleMoveBillToCredit(record)}
                  disabled={
                    isClosedDate ||
                    normalizePaymentMode(record.payment_mode) === "credit"
                  }
                />
              </AntTooltip>
            )}
            {!isCancelledStatus(record.status) && (
              <Dropdown
                trigger={["click"]}
                menu={{
                  items: getAvailableTargetPaymentModes(record.payment_mode).map((mode) => ({
                    key: mode.value,
                    label: `Move to ${mode.label}`,
                  })),
                  onClick: ({ key }) => {
                    if (isClosedDate) {
                      toast.error("Bills from closed dates cannot change payment mode.");
                      return;
                    }
                    setSelectedPaymentModeBill(record);
                    setTargetPaymentMode(key);
                    setShowPaymentModeModal(true);
                  },
                }}
                disabled={
                  isClosedDate ||
                  normalizePaymentMode(record.payment_mode) === "credit" ||
                  getAvailableTargetPaymentModes(record.payment_mode).length === 0
                }
              >
                <Button
                  type="default"
                  size="small"
                  icon={<SwapOutlined />}
                />
              </Dropdown>
            )}
            {isCancelledStatus(record.status) && (
              <Tag color="red">Cancelled</Tag>
            )}
          </Space>
        );
        },
      },
    ];

    return (
    <>
      {/* Cashier Navigation Header */}
      {isCashier && (
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col span={24}>
            <Card style={{ borderRadius: "8px" }}>
              <Space style={{ width: "100%", justifyContent: "space-between", display: "flex" }}>
                <Space>
                  <Button 
                    type="default" 
                    onClick={navigateBack} 
                    icon={<ArrowLeftOutlined />}
                  >
                    Back
                  </Button>
                  <h3 style={{ margin: 0 }}>Sales Reports</h3>
                </Space>
                <Button 
                  type="primary" 
                  onClick={navigateToDashboard} 
                  icon={<HomeOutlined />}
                >
                  Dashboard
                </Button>
              </Space>
            </Card>
          </Col>
        </Row>
      )}

      {/* Tab Section */}
      <Card style={{ marginBottom: 24 }}>
        <Tabs 
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            {
              key: "active",
              label: (
                <span>
                  <Tag color="blue">Active Bills</Tag>
                </span>
              ),
            },
            {
              key: "cancelled",
              label: (
                <span>
                  <Tag color="red">Cancelled Bills</Tag>
                </span>
              ),
            },
          ]}
        />
      </Card>

      {/* Filter Section */}
      <Card style={{ marginBottom: 24 }} title={<><FilterOutlined /> Sale Filters</>}>
        {/* Primary Filters */}
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={6}>
            <div>
              <label style={{ fontWeight: 600, marginBottom: 8, display: "block" }}>Date Range</label>
              <DatePicker.RangePicker
                style={{ width: "100%" }}
                value={filters.startDate && filters.endDate ? [filters.startDate, filters.endDate] : null}
                onChange={(dates) => {
                  if (dates) {
                    handleFilterChange("startDate", dates[0]);
                    handleFilterChange("endDate", dates[1]);
                  } else {
                    handleFilterChange("startDate", null);
                    handleFilterChange("endDate", null);
                  }
                }}
                format="YYYY-MM-DD"
              />
            </div>
          </Col>

          <Col xs={24} sm={12} md={6}>
            <div>
              <label style={{ fontWeight: 600, marginBottom: 8, display: "block" }}>Payment Mode</label>
              <Select
                placeholder="Select payment mode"
                allowClear
                value={filters.paymentMode || undefined}
                onChange={(value) => handleFilterChange("paymentMode", value || "")}
                options={[{ label: "All", value: "" }, ...PAYMENT_MODES]}
                style={{ width: "100%" }}
              />
            </div>
          </Col>

          <Col xs={24} sm={12} md={6}>
            <div>
              <label style={{ fontWeight: 600, marginBottom: 8, display: "block" }}>Invoice No.</label>
              <Input
                placeholder="Search invoice"
                value={filters.invoiceNo}
                onChange={(e) => handleFilterChange("invoiceNo", e.target.value)}
                allowClear
              />
            </div>
          </Col>

          <Col xs={24} sm={12} md={6}>
            <div>
              <label style={{ fontWeight: 600, marginBottom: 8, display: "block" }}>Table Number</label>
              <Input
                placeholder="Search table"
                value={filters.tableNumber}
                onChange={(e) => handleFilterChange("tableNumber", e.target.value)}
                allowClear
              />
            </div>
          </Col>
        </Row>

        {/* Advanced Filters */}
        <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
          <Col xs={24} sm={12} md={6}>
            <div>
              <label style={{ fontWeight: 600, marginBottom: 8, display: "block" }}>Min Amount (฿)</label>
              <InputNumber
                placeholder="Minimum"
                style={{ width: "100%" }}
                value={filters.minAmount}
                onChange={(value) => handleFilterChange("minAmount", value)}
                precision={2}
              />
            </div>
          </Col>

          <Col xs={24} sm={12} md={6}>
            <div>
              <label style={{ fontWeight: 600, marginBottom: 8, display: "block" }}>Max Amount (฿)</label>
              <InputNumber
                placeholder="Maximum"
                style={{ width: "100%" }}
                value={filters.maxAmount}
                onChange={(value) => handleFilterChange("maxAmount", value)}
                precision={2}
              />
            </div>
          </Col>

          <Col xs={24} sm={12} md={6}>
            <div>
              <label style={{ fontWeight: 600, marginBottom: 8, display: "block" }}>Sort By</label>
              <Select
                value={filters.sortBy}
                onChange={(value) => handleFilterChange("sortBy", value)}
                options={[
                  { label: "Date & Time", value: "date" },
                  { label: "Amount", value: "amount" },
                  { label: "Table", value: "table" },
                  { label: "Invoice No.", value: "invoice" },
                ]}
                style={{ width: "100%" }}
              />
            </div>
          </Col>

          <Col xs={24} sm={12} md={6}>
            <div>
              <label style={{ fontWeight: 600, marginBottom: 8, display: "block" }}>Sort Order</label>
              <Select
                value={filters.sortOrder}
                onChange={(value) => handleFilterChange("sortOrder", value)}
                options={[
                  { label: "Descending", value: "descend" },
                  { label: "Ascending", value: "ascend" },
                ]}
                style={{ width: "100%" }}
              />
            </div>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <div>
              <label style={{ fontWeight: 600, marginBottom: 8, display: "block" }}>Quick Filter</label>
              <Space direction="vertical" size={4}>
                <Checkbox
                  checked={normalizePaymentMode(filters.paymentMode) === "entertainment"}
                  onChange={(e) => handleFilterChange("paymentMode", e.target.checked ? "Entertainment" : "")}
                >
                  Entertainment only
                </Checkbox>
                <Checkbox
                  checked={normalizePaymentMode(filters.paymentMode) === SALE_ONLY_FILTER_VALUE}
                  onChange={(e) => handleFilterChange("paymentMode", e.target.checked ? SALE_ONLY_FILTER_VALUE : "")}
                >
                  Sale only
                </Checkbox>
              </Space>
            </div>
          </Col>
        </Row>

        {/* Action Buttons */}
        <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
          <Col xs={24} sm={12} md={4}>
            <Button 
              type="primary" 
              danger 
              onClick={clearFilters}
              icon={<ClearOutlined />}
              block
              size="large"
              style={{ height: "40px", fontSize: "14px" }}
            >
              Clear Filters
            </Button>
          </Col>
          <Col xs={24} sm={12} md={4}>
            <CSVLink
              data={filteredData.length > 0 ? filteredData : data}
              filename={`salereport-${dayjs().format("YYYY-MM-DD")}.csv`}
              style={{ textDecoration: "none", display: "block" }}
            >
              <Button 
                type="primary" 
                icon={<FileExcelOutlined />}
                block
                size="large"
                style={{ height: "40px", fontSize: "14px" }}
              >
                CSV
              </Button>
            </CSVLink>
          </Col>
          <Col xs={24} sm={12} md={4}>
            <Button 
              type="danger" 
              icon={<FilePdfOutlined />}
              onClick={exportPDF}
              block
              size="large"
              style={{ height: "40px", fontSize: "14px" }}
            >
              PDF
            </Button>
          </Col>
        </Row>
      </Card>

      {/* Data Table Section */}
      <Card style={{ marginBottom: 24 }} title="Sales Records">
        {filteredData.length === 0 ? (
          <Empty description="No records found" />
        ) : (
          <div style={{ overflowX: "auto" }}>
            <Table
              columns={tableColumns}
              dataSource={filteredData.map((item, index) => ({ ...item, key: index }))}
              pagination={{
                current: tablePagination.current,
                pageSize: tablePagination.pageSize,
                showSizeChanger: true,
                pageSizeOptions: ["10", "20", "50", "100"],
                showTotal: (total, range) => `${range[0]}-${range[1]} of ${total}`,
                onChange: (page, pageSize) => {
                  setTablePagination({ current: page, pageSize });
                },
                onShowSizeChange: (current, size) => {
                  setTablePagination({ current: 1, pageSize: size });
                },
              }}
              size="small"
              scroll={{ x: 1200 }}
            />
          </div>
        )}
      </Card>

      {/* Summary Cards */}
      <Card style={{ marginBottom: 24 }} title="Summary">
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={8}>
            <Statistic
              title="Total Sale"
              value={summaryTotalSale}
              prefix="฿"
              precision={2}
              valueStyle={{ color: "#52c41a" }}
            />
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Statistic
              title="Total Entertainment"
              value={summaryEntertainmentTotal}
              prefix="฿"
              precision={2}
              valueStyle={{ color: "#722ed1" }}
            />
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Statistic
              title="Total Net Sale After Discount"
              value={summaryNetSaleAfterDiscount}
              prefix="฿"
              precision={2}
              valueStyle={{ color: "#1890ff" }}
            />
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Statistic
              title="Total Discount"
              value={summaryTotalDiscount}
              prefix="฿"
              precision={2}
              valueStyle={{ color: "#fa8c16" }}
            />
          </Col>
        </Row>
      </Card>

      {/* Monthly Chart */}
      <Card title="Monthly Sales Summary">
        {monthlyData.length > 0 ? (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => `฿${value.toFixed(2)}`} />
              <Bar dataKey="total" fill="#1890ff" name="Total Sales" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <Empty description="No data to display" />
        )}
      </Card>

      {/* Modal */}
      {showModal && (
        <BillItemModal
          isOpen={showModal}
          bill={selectedBill}
          onClose={() => setShowModal(false)}
          isEditMode={isEditMode}
          onBillUpdated={refreshBills}
        />
      )}

      {/* Cancel Bill Modal */}
      <Modal
        title="Cancel Bill"
        open={showCancelModal}
        onOk={confirmCancelBill}
        onCancel={() => {
          setShowCancelModal(false);
          setCancelBillId(null);
          setCancelReason("");
        }}
        okText="Cancel Bill"
        okButtonProps={{ danger: true }}
        cancelText="Close"
      >
        <p>Are you sure you want to cancel this bill?</p>
        <Input.TextArea
          placeholder="Enter cancel reason (optional)"
          rows={3}
          value={cancelReason}
          onChange={(e) => setCancelReason(e.target.value)}
          style={{ marginTop: 10 }}
        />
      </Modal>

      {/* Move To Credit Modal */}
      <Modal
        title={`Move Bill #${selectedCreditBill?.id || ""} to Credit`}
        open={showCreditModal}
        onOk={confirmMoveBillToCredit}
        confirmLoading={movingToCredit}
        onCancel={() => {
          setShowCreditModal(false);
          setSelectedCreditBill(null);
          setSelectedCreditCustomer(null);
        }}
        okText="Move to Credit"
        cancelText="Cancel"
      >
        <p style={{ marginBottom: 8 }}>Select customer for this credit bill.</p>
        <Select
          showSearch
          placeholder="Select customer"
          value={selectedCreditCustomer || undefined}
          onChange={(value) => setSelectedCreditCustomer(value || null)}
          filterOption={(input, option) =>
            (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
          }
          options={customers.map((customer) => {
            const customerName = customer.name || customer.customer_name || "Customer";
            const customerPhone = customer.phone ? ` - ${customer.phone}` : "";
            return {
              label: `${customer.id} - ${customerName}${customerPhone}`,
              value: customer.id,
            };
          })}
          style={{ width: "100%" }}
        />
      </Modal>

      <Modal
        title={`Change Payment Mode - Bill #${selectedPaymentModeBill?.id || ""}`}
        open={showPaymentModeModal}
        onOk={confirmChangePaymentMode}
        confirmLoading={updatingPaymentMode}
        onCancel={() => {
          setShowPaymentModeModal(false);
          setSelectedPaymentModeBill(null);
          setTargetPaymentMode(null);
        }}
        okText="Update Payment Mode"
        cancelText="Cancel"
      >
        <p style={{ marginBottom: 8 }}>
          Current Mode: <strong>{selectedPaymentModeBill?.payment_mode || "-"}</strong>
        </p>
        <Select
          placeholder="Select target payment mode"
          value={targetPaymentMode || undefined}
          onChange={(value) => setTargetPaymentMode(value || null)}
          options={getAvailableTargetPaymentModes(selectedPaymentModeBill?.payment_mode).map((mode) => ({
            label: mode.label,
            value: mode.value,
          }))}
          style={{ width: "100%" }}
        />
      </Modal>
    </>
    );
  };

  // Main return statement with conditional rendering
  return isCashier ? (
    <div style={{ 
      padding: "24px",
      backgroundColor: "#f0f2f5",
      minHeight: "100vh",
    }}>
      {renderContent()}
    </div>
  ) : (
    <Layout>
      <Header title="Sale Report" />
      {renderContent()}
    </Layout>
  );
}
