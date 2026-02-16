import React, { useMemo, useState } from 'react';
import { Card, Row, Col, DatePicker, Button, Table, Space, Typography } from 'antd';
import { FilePdfOutlined, FileExcelOutlined, ReloadOutlined } from '@ant-design/icons';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import dayjs from 'dayjs';
import Layout from '../../layout/Layout';
import Header from '../../components/Header';
import fetchData from '../../functions/fetchData';

const { Title } = Typography;

const toNumber = (value) => {
  const parsed = parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const normalizeRows = (response) => {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data)) return response.data;
  return [];
};

export default function CashDrawer() {
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState([]);
  const [fromDate, setFromDate] = useState(dayjs().startOf('month').format('YYYY-MM-DD'));
  const [toDate, setToDate] = useState(dayjs().format('YYYY-MM-DD'));

  const filteredRows = useMemo(() => {
    return rows
      .filter((item) => {
        const dateText = String(item.open_date || '').split('T')[0];
        if (!dateText) return false;
        if (fromDate && dateText < fromDate) return false;
        if (toDate && dateText > toDate) return false;
        return true;
      })
      .sort((a, b) => String(b.open_date || '').localeCompare(String(a.open_date || '')));
  }, [rows, fromDate, toDate]);

  const totals = useMemo(() => {
    return filteredRows.reduce(
      (acc, item) => {
        acc.openingCash += toNumber(item.opening_cash);
        acc.closingCash += toNumber(item.closing_cash);
        acc.expectedCash += toNumber(item.expected_cash);
        acc.cashDifference += toNumber(item.cash_difference);
        acc.cashIn += toNumber(item.cash_in);
        acc.cashOut += toNumber(item.cash_out);
        return acc;
      },
      {
        openingCash: 0,
        closingCash: 0,
        expectedCash: 0,
        cashDifference: 0,
        cashIn: 0,
        cashOut: 0,
      }
    );
  }, [filteredRows]);

  const formatCurrency = (value) => `฿ ${toNumber(value).toFixed(2)}`;

  const loadCashDrawerData = async () => {
    if (fromDate && toDate && fromDate > toDate) {
      toast.error('From Date must be less than or equal to To Date');
      return;
    }

    setLoading(true);
    try {
      const response = await fetchData('cash_drawer', null, 'id', {});
      const normalized = normalizeRows(response);
      setRows(normalized);
      toast.success(`Loaded ${normalized.length} cash drawer records`);
    } catch (error) {
      console.error('Error loading cash drawer records:', error);
      toast.error('Failed to load cash drawer records');
    } finally {
      setLoading(false);
    }
  };

  const exportExcel = () => {
    if (!filteredRows.length) {
      toast.warning('No records to export');
      return;
    }

    const excelRows = filteredRows.map((item, index) => ({
      'S.No': index + 1,
      'Open Date': String(item.open_date || '').split('T')[0],
      'Opening Cash': toNumber(item.opening_cash).toFixed(2),
      'Closing Cash': toNumber(item.closing_cash).toFixed(2),
      'Expected Cash': toNumber(item.expected_cash).toFixed(2),
      'Cash Difference': toNumber(item.cash_difference).toFixed(2),
      'Cash In': toNumber(item.cash_in).toFixed(2),
      'Cash Out': toNumber(item.cash_out).toFixed(2),
      Status: item.status || '-',
      'Opened By': item.opened_by || '-',
      'Closed By': item.closed_by || '-',
      Notes: item.notes || '-',
    }));

    excelRows.push({
      'S.No': '',
      'Open Date': 'TOTAL',
      'Opening Cash': totals.openingCash.toFixed(2),
      'Closing Cash': totals.closingCash.toFixed(2),
      'Expected Cash': totals.expectedCash.toFixed(2),
      'Cash Difference': totals.cashDifference.toFixed(2),
      'Cash In': totals.cashIn.toFixed(2),
      'Cash Out': totals.cashOut.toFixed(2),
      Status: '',
      'Opened By': '',
      'Closed By': '',
      Notes: '',
    });

    const worksheet = XLSX.utils.json_to_sheet(excelRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Cash Drawer');
    XLSX.writeFile(workbook, `cash-drawer-${fromDate || 'all'}-to-${toDate || 'all'}.xlsx`);
  };

  const exportPDF = () => {
    if (!filteredRows.length) {
      toast.warning('No records to export');
      return;
    }

    const doc = new jsPDF('landscape');
    doc.setFontSize(14);
    doc.text('Cash Drawer Report', 14, 16);
    doc.setFontSize(10);
    doc.text(`Date Range: ${fromDate || '-'} to ${toDate || '-'}`, 14, 23);

    const body = filteredRows.map((item, index) => [
      index + 1,
      String(item.open_date || '').split('T')[0],
      toNumber(item.opening_cash).toFixed(2),
      toNumber(item.closing_cash).toFixed(2),
      toNumber(item.expected_cash).toFixed(2),
      toNumber(item.cash_difference).toFixed(2),
      toNumber(item.cash_in).toFixed(2),
      toNumber(item.cash_out).toFixed(2),
      item.status || '-',
      item.closed_by || '-',
    ]);

    body.push([
      '',
      'TOTAL',
      totals.openingCash.toFixed(2),
      totals.closingCash.toFixed(2),
      totals.expectedCash.toFixed(2),
      totals.cashDifference.toFixed(2),
      totals.cashIn.toFixed(2),
      totals.cashOut.toFixed(2),
      '',
      '',
    ]);

    doc.autoTable({
      head: [[
        'S.No',
        'Open Date',
        'Opening Cash',
        'Closing Cash',
        'Expected Cash',
        'Cash Difference',
        'Cash In',
        'Cash Out',
        'Status',
        'Closed By',
      ]],
      body,
      startY: 28,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [22, 119, 255] },
    });

    doc.save(`cash-drawer-${fromDate || 'all'}-to-${toDate || 'all'}.pdf`);
  };

  const columns = [
    {
      title: 'S.No',
      key: 'index',
      width: 70,
      render: (_, __, index) => index + 1,
    },
    {
      title: 'Open Date',
      dataIndex: 'open_date',
      key: 'open_date',
      render: (value) => String(value || '').split('T')[0] || '-',
    },
    {
      title: 'Opening Cash',
      dataIndex: 'opening_cash',
      key: 'opening_cash',
      align: 'right',
      render: (value) => formatCurrency(value),
    },
    {
      title: 'Closing Cash',
      dataIndex: 'closing_cash',
      key: 'closing_cash',
      align: 'right',
      render: (value) => formatCurrency(value),
    },
    {
      title: 'Expected Cash',
      dataIndex: 'expected_cash',
      key: 'expected_cash',
      align: 'right',
      render: (value) => formatCurrency(value),
    },
    {
      title: 'Cash Difference',
      dataIndex: 'cash_difference',
      key: 'cash_difference',
      align: 'right',
      render: (value) => formatCurrency(value),
    },
    {
      title: 'Cash In',
      dataIndex: 'cash_in',
      key: 'cash_in',
      align: 'right',
      render: (value) => formatCurrency(value),
    },
    {
      title: 'Cash Out',
      dataIndex: 'cash_out',
      key: 'cash_out',
      align: 'right',
      render: (value) => formatCurrency(value),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (value) => value || '-',
    },
    {
      title: 'Closed By',
      dataIndex: 'closed_by',
      key: 'closed_by',
      render: (value) => value || '-',
    },
  ];

  return (
    <Layout>
      <Header title="Cash Drawer" />
      <ToastContainer />

      <div className="row">
        <div className="col-12">
          <Card>
            <Title level={4} style={{ marginBottom: 16 }}>Cash Drawer Report</Title>

            <Row gutter={[16, 16]} align="bottom" style={{ marginBottom: 16 }}>
              <Col xs={24} sm={12} md={6}>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>From Date</label>
                <DatePicker
                  style={{ width: '100%' }}
                  value={fromDate ? dayjs(fromDate) : null}
                  onChange={(_, dateString) => setFromDate(dateString || '')}
                  format="YYYY-MM-DD"
                />
              </Col>
              <Col xs={24} sm={12} md={6}>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>To Date</label>
                <DatePicker
                  style={{ width: '100%' }}
                  value={toDate ? dayjs(toDate) : null}
                  onChange={(_, dateString) => setToDate(dateString || '')}
                  format="YYYY-MM-DD"
                />
              </Col>
              <Col xs={24}>
                <Space wrap>
                  <Button type="primary" icon={<ReloadOutlined />} onClick={loadCashDrawerData} loading={loading}>
                    Load Data
                  </Button>
                  <Button danger icon={<FilePdfOutlined />} onClick={exportPDF}>
                    Export PDF
                  </Button>
                  <Button type="primary" icon={<FileExcelOutlined />} onClick={exportExcel} style={{ background: '#52c41a', borderColor: '#52c41a' }}>
                    Export Excel
                  </Button>
                </Space>
              </Col>
            </Row>

            <Table
              rowKey={(record) => record.id || `${record.open_date}-${record.closed_by || ''}`}
              columns={columns}
              dataSource={filteredRows}
              loading={loading}
              pagination={{ pageSize: 10, showSizeChanger: true }}
              scroll={{ x: 1200 }}
              summary={() => (
                <Table.Summary.Row>
                  <Table.Summary.Cell index={0} colSpan={2}><strong>Total</strong></Table.Summary.Cell>
                  <Table.Summary.Cell index={2} align="right"><strong>{formatCurrency(totals.openingCash)}</strong></Table.Summary.Cell>
                  <Table.Summary.Cell index={3} align="right"><strong>{formatCurrency(totals.closingCash)}</strong></Table.Summary.Cell>
                  <Table.Summary.Cell index={4} align="right"><strong>{formatCurrency(totals.expectedCash)}</strong></Table.Summary.Cell>
                  <Table.Summary.Cell index={5} align="right"><strong>{formatCurrency(totals.cashDifference)}</strong></Table.Summary.Cell>
                  <Table.Summary.Cell index={6} align="right"><strong>{formatCurrency(totals.cashIn)}</strong></Table.Summary.Cell>
                  <Table.Summary.Cell index={7} align="right"><strong>{formatCurrency(totals.cashOut)}</strong></Table.Summary.Cell>
                  <Table.Summary.Cell index={8} />
                  <Table.Summary.Cell index={9} />
                </Table.Summary.Row>
              )}
            />
          </Card>
        </div>
      </div>
    </Layout>
  );
}
