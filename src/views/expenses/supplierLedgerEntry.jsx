import React, { useEffect, useState } from "react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { format } from "date-fns";
import fetchData, { fetchShopScopedData } from "../../functions/fetchData";
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

import Layout from "../../layout/Layout";
import Header from "../../components/Header";
import { getHeaders } from "../../utility/getHeader";
import { Card, Input, Button, Select, Table, Space, Row, Col, Divider, Statistic, Popconfirm, Tooltip, Modal } from 'antd';
import { SaveOutlined, FilterOutlined, ClearOutlined, PrinterOutlined, FilePdfOutlined, FileExcelOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import deleteRecord from "../../functions/delateData";
import updateData from "../../functions/updateData";

const { TextArea } = Input;

export default function SupplierLedgerEntry() {
  const [filteredData, setFilteredData] = useState([]);
  const [originalData, setOriginalData] = useState([]);
  const [companyInfo, setCompanyInfo] = useState({});
  const [loading, setLoading] = useState(false);
  const [editingEntryId, setEditingEntryId] = useState(null);
  const [deletingEntryId, setDeletingEntryId] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    transaction_id: "",
    date: format(new Date(), "yyyy-MM-dd"),
    account_type: "Purchase",
    account_id: "",
    description: "",
    debit_amount: "",
    credit_amount: "",
    reference_id: "",
  });

  const [editFormData, setEditFormData] = useState({
    transaction_id: "",
    date: format(new Date(), "yyyy-MM-dd"),
    account_type: "Purchase",
    account_id: "",
    description: "",
    debit_amount: "",
    credit_amount: "",
    reference_id: "",
  });

  // Filter states
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedSupplier, setSelectedSupplier] = useState("");

  const [suppliers, setSuppliers] = useState([]);

  const getShopId = () => sessionStorage.getItem('selected_shop_id') || localStorage.getItem('shop_id') || sessionStorage.getItem('shop_id');

  const userType = (localStorage.getItem("usertype") || sessionStorage.getItem("usertype") || "").toLowerCase();
  const canManageLedger = userType === "admin" || userType === "account";

  const getSupplierLabel = (supplier) => {
    if (!supplier) return "";
    return (
      String(supplier.name || "").trim() ||
      String(supplier.company_name || "").trim() ||
      String(supplier.supplier_name || "").trim() ||
      `Supplier ${supplier.id}`
    );
  };

  // Fetch company info for thermal printing
  useEffect(() => {
    const fetchCompanyInfo = async () => {
      try {
        const res = await fetchData("companyinfo", null, "id", {});
        if (res && res.length > 0) {
          setCompanyInfo(res[0]);
        }
      } catch (error) {
        console.error("Error fetching company info:", error);
      }
    };
    fetchCompanyInfo();
  }, []);

  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        const supplierData = await fetchShopScopedData("suppliers", null, "id");
        setSuppliers(Array.isArray(supplierData) ? supplierData : []);
      } catch (err) {
        console.error("Error fetching suppliers:", err);
        toast.error("Failed to load suppliers.");
      }
    };
    fetchSuppliers();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await axios.post("/insertdata/Supplier_ledger_entries", { ...formData, shop_id: getShopId() }, getHeaders());
      toast.success("Supplier ledger entry saved!");

      setFormData({
        transaction_id: "",
        date: format(new Date(), "yyyy-MM-dd"),
        account_type: "Purchase",
        account_id: "",
        description: "",
        debit_amount: "",
        credit_amount: "",
        reference_id: "",
      });
      
      fetchLedgerData();
    } catch (error) {
      console.error(error);
      toast.error("Failed to save entry.");
    }
  };

  const handleEditEntry = (record) => {
    setEditFormData({
      transaction_id: record.transaction_id || "",
      date: record.date ? format(new Date(record.date), "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd"),
      account_type: record.account_type || "Purchase",
      account_id: record.account_id || "",
      description: record.description || "",
      debit_amount: record.debit_amount || "",
      credit_amount: record.credit_amount || "",
      reference_id: record.reference_id || "",
    });
    setEditingEntryId(record.id);
    setIsEditModalOpen(true);
  };

  const handleEditModalInputChange = (e) => {
    const { name, value } = e.target;
    setEditFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleUpdateEntry = async () => {
    if (!editingEntryId) return;

    try {
      await updateData("Supplier_ledger_entries", editFormData, { id: editingEntryId });
      toast.success("Supplier ledger entry updated!");
      setIsEditModalOpen(false);
      setEditingEntryId(null);
      fetchLedgerData();
    } catch (error) {
      console.error("Update error:", error);
      toast.error("Failed to update entry.");
    }
  };

  const handleDeleteEntry = async (record) => {
    if (!record?.id) {
      toast.error("Invalid entry id");
      return;
    }

    try {
      setDeletingEntryId(record.id);
      await deleteRecord("Supplier_ledger_entries", "id", record.id);
      toast.success("Entry deleted successfully");
      fetchLedgerData();
    } catch (error) {
      console.error("Error deleting entry:", error);
      toast.error(error?.message || "Failed to delete entry");
    } finally {
      setDeletingEntryId(null);
    }
  };

  const handleCancelEdit = () => {
    setIsEditModalOpen(false);
    setEditingEntryId(null);
    setEditFormData({
      transaction_id: "",
      date: format(new Date(), "yyyy-MM-dd"),
      account_type: "Purchase",
      account_id: "",
      description: "",
      debit_amount: "",
      credit_amount: "",
      reference_id: "",
    });
  };

  const fetchLedgerData = async () => {
    try {
      setLoading(true);
      const ledgerData = await fetchShopScopedData("Supplier_ledger_entries", null, "id");
      console.log("Fetched supplier ledger data:", ledgerData);
      setOriginalData(ledgerData || []);
      setFilteredData(ledgerData || []);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching supplier ledger data:", error);
      setLoading(false);
      toast.error("Failed to load supplier ledger entries");
    }
  };

  useEffect(() => {
    fetchLedgerData();
  }, []);

  // Apply filters
  const applyFilter = () => {
    let filtered = originalData;
    const normalizeDateKey = (value) => {
      const parsed = dayjs(value);
      return parsed.isValid() ? parsed.format("YYYY-MM-DD") : "";
    };

    // Date range filter
    if (startDate || endDate) {
      const startKey = startDate ? normalizeDateKey(startDate) : null;
      const endKey = endDate ? normalizeDateKey(endDate) : null;

      filtered = filtered.filter((item) => {
        const itemDateKey = normalizeDateKey(item.date);
        if (!itemDateKey) return false;
        if (startKey && itemDateKey < startKey) return false;
        if (endKey && itemDateKey > endKey) return false;
        return true;
      });
    }

    // Supplier filter
    if (selectedSupplier) {
      filtered = filtered.filter(item => item.account_id?.toString() === selectedSupplier.toString());
    }

    setFilteredData(filtered);
    toast.success(`Filtered ${filtered.length} records`);
  };

  // Clear filters
  const clearFilters = () => {
    setStartDate("");
    setEndDate("");
    setSelectedSupplier("");
    setFilteredData(originalData);
    toast.info("Filters cleared");
  };

  // Get supplier name by ID
  const getSupplierName = (supplierId) => {
    const supplier = suppliers.find(s => s.id?.toString() === supplierId?.toString());
    return supplier ? getSupplierLabel(supplier) : `ID: ${supplierId}`;
  };

  // Export to Excel
  const exportToExcel = () => {
    try {
      const exportData = filteredData.map((item, index) => ({
        'S.No.': index + 1,
        'Transaction ID': item.transaction_id || '',
        'Date': item.date || '',
        'Supplier': getSupplierName(item.account_id),
        'Description': item.description || '',
        'Debit': parseFloat(item.debit_amount || 0).toFixed(2),
        'Credit': parseFloat(item.credit_amount || 0).toFixed(2),
        'Reference': item.reference_id || ''
      }));

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(exportData);
      XLSX.utils.book_append_sheet(wb, ws, "Supplier Ledger");
      XLSX.writeFile(wb, `supplier_ledger_${format(new Date(), "yyyy-MM-dd")}.xlsx`);
      toast.success("Excel exported successfully!");
    } catch (error) {
      console.error("Excel export error:", error);
      toast.error("Failed to export Excel");
    }
  };

  // Export to PDF
  const exportToPDF = () => {
    try {
      const doc = new jsPDF();
      
      doc.setFontSize(18);
      doc.text('Supplier Ledger Report', 14, 20);
      doc.setFontSize(10);
      doc.text(`Generated on: ${format(new Date(), 'dd/MM/yyyy HH:mm:ss')}`, 14, 28);
      
      const tableData = filteredData.map((item, index) => [
        index + 1,
        item.transaction_id || '',
        item.date || '',
        getSupplierName(item.account_id),
        item.description || '',
        `฿${parseFloat(item.debit_amount || 0).toFixed(2)}`,
        `฿${parseFloat(item.credit_amount || 0).toFixed(2)}`
      ]);

      doc.autoTable({
        head: [['S.No.', 'Txn ID', 'Date', 'Supplier', 'Description', 'Debit', 'Credit']],
        body: tableData,
        startY: 35,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [23, 162, 184] }
      });

      doc.save(`supplier_ledger_${format(new Date(), "yyyy-MM-dd")}.pdf`);
      toast.success("PDF exported successfully!");
    } catch (error) {
      console.error("PDF export error:", error);
      toast.error("Failed to export PDF");
    }
  };

  // Print Thermal Report
  const printThermalReport = () => {
    const printWindow = window.open("", "_blank");
    
    let totalDebit = 0;
    let totalCredit = 0;

    const tableRows = filteredData.map((item, index) => {
      const debit = parseFloat(item.debit_amount || 0);
      const credit = parseFloat(item.credit_amount || 0);
      totalDebit += debit;
      totalCredit += credit;

      return `
        <tr>
          <td style="padding: 3px; text-align: left;">${index + 1}</td>
          <td style="padding: 3px; text-align: left;">${item.transaction_id || ''}</td>
          <td style="padding: 3px; text-align: left;">${item.date || ''}</td>
          <td style="padding: 3px; text-align: right;">฿${debit.toFixed(2)}</td>
          <td style="padding: 3px; text-align: right;">฿${credit.toFixed(2)}</td>
        </tr>
      `;
    }).join('');

    printWindow.document.write(`
      <html>
      <head>
        <style>
          body {
            font-family: 'Arial', 'Helvetica', sans-serif;
            font-size: 12pt;
            width: 80mm;
            margin: 0;
            padding: 5px 2px;
          }
          .header {
            text-align: center;
            margin-bottom: 10px;
            border-bottom: 2px solid #000;
            padding-bottom: 8px;
          }
          .header h2 {
            margin: 5px 0;
            font-size: 16pt;
            font-weight: bold;
          }
          .header p {
            margin: 3px 0;
            font-size: 10pt;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin: 8px 0;
          }
          table th {
            border-bottom: 1px solid #000;
            padding: 5px 2px;
            text-align: left;
            font-size: 11pt;
          }
          table td {
            padding: 4px 2px;
            font-size: 11pt;
          }
          .summary {
            border-top: 2px solid #000;
            margin-top: 8px;
            padding-top: 6px;
          }
          .summary div {
            display: flex;
            justify-content: space-between;
            padding: 4px 0;
            font-weight: bold;
            font-size: 11pt;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h2>${companyInfo.name || 'Restaurant Name'}</h2>
          <p>${companyInfo.address || ''}</p>
          <p>Tax ID: ${companyInfo.tax_id || ''}</p>
          <p><strong>Supplier Ledger Report</strong></p>
          <p>Date: ${format(new Date(), 'yyyy-MM-dd HH:mm:ss')}</p>
        </div>

        <table>
          <thead>
            <tr>
              <th>No.</th>
              <th>Txn ID</th>
              <th>Date</th>
              <th style="text-align: right;">Debit</th>
              <th style="text-align: right;">Credit</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>

        <div class="summary">
          <div>
            <span>Total Debit:</span>
            <span>฿${totalDebit.toFixed(2)}</span>
          </div>
          <div>
            <span>Total Credit:</span>
            <span>฿${totalCredit.toFixed(2)}</span>
          </div>
          <div>
            <span>Balance:</span>
            <span>฿${(totalDebit - totalCredit).toFixed(2)}</span>
          </div>
        </div>
      </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.print();
  };

  // Ant Design Table Columns
  const columns = [
    {
      title: 'S.No.',
      key: 'index',
      render: (text, record, index) => index + 1,
      width: 70,
    },
    {
      title: 'Transaction ID',
      dataIndex: 'transaction_id',
      key: 'transaction_id',
      sorter: (a, b) => (a.transaction_id || '').localeCompare(b.transaction_id || ''),
    },
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      sorter: (a, b) => new Date(a.date) - new Date(b.date),
      render: (date) => date || '-',
    },
    {
      title: 'Supplier',
      dataIndex: 'account_id',
      key: 'account_id',
      render: (account_id) => getSupplierName(account_id),
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      render: (text) => text || '-',
    },
    {
      title: 'Debit',
      dataIndex: 'debit_amount',
      key: 'debit_amount',
      align: 'right',
      render: (amount) => `฿${parseFloat(amount || 0).toFixed(2)}`,
      sorter: (a, b) => parseFloat(a.debit_amount || 0) - parseFloat(b.debit_amount || 0),
    },
    {
      title: 'Credit',
      dataIndex: 'credit_amount',
      key: 'credit_amount',
      align: 'right',
      render: (amount) => `฿${parseFloat(amount || 0).toFixed(2)}`,
      sorter: (a, b) => parseFloat(a.credit_amount || 0) - parseFloat(b.credit_amount || 0),
    },
    {
      title: 'Reference',
      dataIndex: 'reference_id',
      key: 'reference_id',
      render: (text) => text || '-',
    },
    {
      title: 'Action',
      key: 'action',
      align: 'center',
      width: 100,
      render: (_, record) => {
        if (canManageLedger) {
          return (
            <Space>
              <Tooltip title="Edit entry">
                <Button
                  type="text"
                  icon={<EditOutlined />}
                  onClick={() => handleEditEntry(record)}
                />
              </Tooltip>
              <Popconfirm
                title="Delete ledger entry"
                description={`Delete entry ${record.transaction_id || record.id}?`}
                onConfirm={() => handleDeleteEntry(record)}
                okText="Delete"
                cancelText="Cancel"
              >
                <Tooltip title="Delete entry">
                  <Button
                    type="text"
                    danger
                    icon={<DeleteOutlined />}
                    loading={deletingEntryId === record.id}
                  />
                </Tooltip>
              </Popconfirm>
            </Space>
          );
        }

        return (
          <Space>
            <Tooltip title="No permission">
              <Button type="text" icon={<EditOutlined />} disabled />
            </Tooltip>
            <Tooltip title="No permission">
              <Button type="text" danger icon={<DeleteOutlined />} disabled />
            </Tooltip>
          </Space>
        );
      },
    },
  ];

  // Calculate totals
  const totalDebit = filteredData.reduce((sum, item) => sum + parseFloat(item.debit_amount || 0), 0);
  const totalCredit = filteredData.reduce((sum, item) => sum + parseFloat(item.credit_amount || 0), 0);
  const balance = totalDebit - totalCredit;
  return (
    <Layout>
      <Header title="Vendor Expense Logging" />
      <ToastContainer />
      
      {/* Entry Form */}
      <Card title="Track and log supplier bills, invoices, and payments" style={{ marginBottom: 24 }}>
        <form onSubmit={handleSubmit}>
          <Row gutter={16}>
            <Col xs={24} sm={12} md={8}>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Transaction ID</label>
              <Input
                name="transaction_id"
                value={formData.transaction_id}
                onChange={handleInputChange}
                placeholder="Transaction ID"
              />
            </Col>
            
            <Col xs={24} sm={12} md={8}>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Date</label>
              <Input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleInputChange}
              />
            </Col>
            
            <Col xs={24} sm={12} md={8}>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Supplier Name</label>
              <Select
                style={{ width: '100%' }}
                placeholder="Select Supplier"
                value={formData.account_id || undefined}
                onChange={(value) => setFormData(prev => ({ ...prev, account_id: value }))}
              >
                {suppliers.map((supplier) => (
                  <Select.Option key={supplier.id} value={supplier.id}>
                    {getSupplierLabel(supplier)}
                  </Select.Option>
                ))}
              </Select>
            </Col>
            
            <Col xs={24} sm={12} md={12}>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Description</label>
              <TextArea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Description"
                rows={2}
              />
            </Col>
            
            <Col xs={24} sm={12} md={6}>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Debit Amount</label>
              <Input
                type="number"
                name="debit_amount"
                value={formData.debit_amount}
                onChange={handleInputChange}
                placeholder="0.00"
                prefix="฿"
              />
            </Col>
            
            <Col xs={24} sm={12} md={6}>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Credit Amount (Optional)</label>
              <Input
                type="number"
                name="credit_amount"
                value={formData.credit_amount}
                onChange={handleInputChange}
                placeholder="0.00"
                prefix="฿"
              />
            </Col>
            
            <Col xs={24} sm={12} md={8}>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Reference ID (Optional)</label>
              <Input
                name="reference_id"
                value={formData.reference_id}
                onChange={handleInputChange}
                placeholder="Reference ID"
              />
            </Col>
            
            <Col xs={24} sm={12} md={4} style={{ display: 'flex', alignItems: 'flex-end' }}>
              <Button type="primary" htmlType="submit" icon={<SaveOutlined />} block>
                Save Entry
              </Button>
            </Col>
          </Row>
        </form>
      </Card>

      {/* Filters */}
      <Card title="Filter Supplier Ledger Entries" style={{ marginBottom: 24 }}>
        <Row gutter={16}>
          <Col xs={24} sm={12} md={8}>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Date Range</label>
            <Space direction="horizontal" style={{ width: '100%' }}>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                placeholder="Start Date"
                style={{ width: '100%' }}
              />
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                placeholder="End Date"
                style={{ width: '100%' }}
              />
            </Space>
          </Col>
          
          <Col xs={24} sm={12} md={8}>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Supplier</label>
            <Select
              style={{ width: '100%' }}
              placeholder="All Suppliers"
              value={selectedSupplier || undefined}
              onChange={(value) => setSelectedSupplier(value || "")}
              allowClear
            >
              {suppliers.map((supplier) => (
                <Select.Option key={supplier.id} value={supplier.id}>
                  {getSupplierLabel(supplier)}
                </Select.Option>
              ))}
            </Select>
          </Col>
          
          <Col xs={24} sm={12} md={8} style={{ display: 'flex', alignItems: 'flex-end' }}>
            <Space>
              <Button type="primary" icon={<FilterOutlined />} onClick={applyFilter}>
                Apply Filter
              </Button>
              <Button icon={<ClearOutlined />} onClick={clearFilters}>
                Clear
              </Button>
            </Space>
          </Col>
        </Row>

        <Divider />

        {/* Export Buttons */}
        <Space wrap>
          <Button type="primary" icon={<PrinterOutlined />} onClick={printThermalReport} style={{ background: '#722ed1', borderColor: '#722ed1' }}>
            Print Thermal
          </Button>
          <Button danger icon={<FilePdfOutlined />} onClick={exportToPDF}>
            Export PDF
          </Button>
          <Button type="primary" icon={<FileExcelOutlined />} onClick={exportToExcel} style={{ background: '#52c41a', borderColor: '#52c41a' }}>
            Export Excel
          </Button>
        </Space>
      </Card>

      {/* Summary Statistics */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Total Debit"
              value={totalDebit}
              precision={2}
              prefix="฿"
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Total Credit"
              value={totalCredit}
              precision={2}
              prefix="฿"
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Balance"
              value={balance}
              precision={2}
              prefix="฿"
              valueStyle={{ color: balance >= 0 ? '#3f8600' : '#cf1322' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Data Table */}
      <Card title={`Supplier Ledger Entries (${filteredData.length} records)`}>
        <Table
          columns={columns}
          dataSource={filteredData}
          rowKey={(record) => record.id || Math.random()}
          loading={loading}
          pagination={{
            pageSize: 20,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} entries`,
            pageSizeOptions: ['10', '20', '50', '100']
          }}
          scroll={{ x: true }}
          size="small"
        />
      </Card>

      <Modal
        title="Edit Supplier Ledger Entry"
        open={isEditModalOpen}
        onCancel={handleCancelEdit}
        onOk={handleUpdateEntry}
        okText="Update"
        cancelText="Cancel"
        width={800}
      >
        <Row gutter={16}>
          <Col xs={24} sm={12}>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Transaction ID</label>
            <Input
              name="transaction_id"
              value={editFormData.transaction_id}
              onChange={handleEditModalInputChange}
              placeholder="Transaction ID"
            />
          </Col>

          <Col xs={24} sm={12}>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Date</label>
            <Input
              type="date"
              name="date"
              value={editFormData.date}
              onChange={handleEditModalInputChange}
            />
          </Col>

          <Col xs={24} sm={12}>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Supplier Name</label>
            <Select
              style={{ width: '100%' }}
              placeholder="Select Supplier"
              value={editFormData.account_id || undefined}
              onChange={(value) => setEditFormData((prev) => ({ ...prev, account_id: value }))}
            >
              {suppliers.map((supplier) => (
                <Select.Option key={supplier.id} value={supplier.id}>
                  {getSupplierLabel(supplier)}
                </Select.Option>
              ))}
            </Select>
          </Col>

          <Col xs={24} sm={12}>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Reference ID</label>
            <Input
              name="reference_id"
              value={editFormData.reference_id}
              onChange={handleEditModalInputChange}
              placeholder="Reference ID"
            />
          </Col>

          <Col span={24}>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Description</label>
            <TextArea
              name="description"
              value={editFormData.description}
              onChange={handleEditModalInputChange}
              placeholder="Description"
              rows={2}
            />
          </Col>

          <Col xs={24} sm={12}>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Debit Amount</label>
            <Input
              type="number"
              name="debit_amount"
              value={editFormData.debit_amount}
              onChange={handleEditModalInputChange}
              placeholder="0.00"
              prefix="฿"
            />
          </Col>

          <Col xs={24} sm={12}>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Credit Amount</label>
            <Input
              type="number"
              name="credit_amount"
              value={editFormData.credit_amount}
              onChange={handleEditModalInputChange}
              placeholder="0.00"
              prefix="฿"
            />
          </Col>
        </Row>
      </Modal>
    </Layout>
  );
}
