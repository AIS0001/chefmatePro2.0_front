import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  Card,
  Row,
  Col,
  Select,
  Button,
  Table,
  Modal,
  Form,
  InputNumber,
  Input,
  Space,
  Tag,
  Typography,
  message,
  Tabs,
  Switch,
  DatePicker,
  Statistic,
} from "antd";
import {
  GiftOutlined,
  ReloadOutlined,
  EditOutlined,
  BarChartOutlined,
  NotificationOutlined,
  TrophyOutlined,
  SearchOutlined,
  FilePdfOutlined,
  FileExcelOutlined,
} from "@ant-design/icons";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import Layout from "../../layout/Layout";
import { getHeaders } from "../../utility/getHeader";

const { Text, Title } = Typography;

const OFFER_TYPES = [
  { label: "Discount Amount", value: "DISCOUNT_AMOUNT" },
  { label: "Discount Percent", value: "DISCOUNT_PERCENT" },
  { label: "Free Item", value: "FREE_ITEM" },
];

const TEMPLATE_OPTIONS = [
  {
    key: "LOYALTY_NEAR_REWARD",
    label: "Near Reward Reminder",
    defaultMessage: "You are close to your next reward. Keep ordering to unlock your offer.",
  },
  {
    key: "LOYALTY_BIRTHDAY",
    label: "Birthday Coupon",
    defaultMessage: "Happy Birthday! Enjoy your loyalty birthday reward from us.",
  },
  {
    key: "LOYALTY_INACTIVE_REMINDER",
    label: "Inactive Customer Reminder",
    defaultMessage: "We miss you. Come back and redeem your loyalty offers today.",
  },
  {
    key: "LOYALTY_CUSTOM",
    label: "Custom Campaign",
    defaultMessage: "",
  },
];

const PIE_COLORS = ["#1677ff", "#52c41a", "#faad14", "#ff4d4f", "#722ed1", "#13c2c2"];
const pageStyle = {
  minHeight: "100%",
  padding: 16,
  background:
    "radial-gradient(circle at top left, rgba(255, 214, 165, 0.45), transparent 34%), radial-gradient(circle at top right, rgba(186, 230, 255, 0.4), transparent 28%), linear-gradient(180deg, #fffdf8 0%, #f7fbff 100%)",
};

const softCardStyle = {
  borderRadius: 18,
  border: "1px solid rgba(22, 119, 255, 0.08)",
  boxShadow: "0 12px 40px rgba(15, 23, 42, 0.06)",
  background: "rgba(255, 255, 255, 0.88)",
  backdropFilter: "blur(8px)",
};

const headerCardStyle = {
  ...softCardStyle,
  background: "linear-gradient(135deg, rgba(255, 255, 255, 0.92), rgba(235, 247, 255, 0.88))",
};

const normalizeSearchValue = (value) => String(value || "").trim().toLowerCase();

const doesRowMatchCustomerSearch = (row, searchValue) => {
  const query = normalizeSearchValue(searchValue);
  if (!query) return true;

  const nameText = normalizeSearchValue(row?.customer_name || row?.name);
  const contactText = normalizeSearchValue(
    row?.contact || row?.phone || row?.mobile || row?.mobile_number
  );

  return nameText.includes(query) || contactText.includes(query);
};

export default function LoyaltyProgram() {
  const [loading, setLoading] = useState(false);

  const [programs, setPrograms] = useState([]);
  const [offers, setOffers] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [redemptions, setRedemptions] = useState([]);

  const [selectedProgramId, setSelectedProgramId] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState(TEMPLATE_OPTIONS[0].key);
  const [customerSearchText, setCustomerSearchText] = useState("");

  const [programModalOpen, setProgramModalOpen] = useState(false);
  const [offerModalOpen, setOfferModalOpen] = useState(false);

  const [editingProgram, setEditingProgram] = useState(null);
  const [editingOffer, setEditingOffer] = useState(null);

  const [programForm] = Form.useForm();
  const [offerForm] = Form.useForm();
  const [campaignForm] = Form.useForm();
  const [enrollForm] = Form.useForm();

  const enrolledMembers = useMemo(
    () => (customers || []).filter((row) => row.member_id),
    [customers]
  );

  const nonEnrolledCustomers = useMemo(
    () => (customers || []).filter((row) => !row.member_id),
    [customers]
  );

  const topCustomersChartData = useMemo(
    () => (analytics?.top_customers || []).slice(0, 10).map((row) => ({
      name: row.customer_name || `Customer ${row.customer_id}`,
      lifetimePoints: Number(row.lifetime_points || 0),
      currentPoints: Number(row.points_balance || 0),
      redeemed: Number(row.points_redeemed || 0),
    })),
    [analytics]
  );

  const programsPieData = useMemo(
    () => (analytics?.programs || []).map((row) => ({
      name: row.program_name,
      value: Number(row.enrolled_members || 0),
    })),
    [analytics]
  );

  const filteredTopCustomers = useMemo(
    () => (analytics?.top_customers || []).filter((row) => doesRowMatchCustomerSearch(row, customerSearchText)),
    [analytics, customerSearchText]
  );

  const filteredRedemptions = useMemo(
    () => (redemptions || []).filter((row) => doesRowMatchCustomerSearch(row, customerSearchText)),
    [redemptions, customerSearchText]
  );

  const exportTableToExcel = (rows, fileName, sheetName) => {
    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    const excelArrayBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const blob = new Blob([excelArrayBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    saveAs(blob, fileName);
  };

  const exportTopCustomersExcel = () => {
    const exportRows = filteredTopCustomers.map((row) => ({
      Customer: row.customer_name || "-",
      Phone: row.contact || row.phone || row.mobile || row.mobile_number || "-",
      "Lifetime Points": Number(row.lifetime_points || 0),
      "Current Points": Number(row.points_balance || 0),
      Redeemed: Number(row.points_redeemed || 0),
      "Total Redemptions": Number(row.total_redemptions || 0),
    }));

    exportTableToExcel(exportRows, "loyalty-top-customers-report.xlsx", "Top Customers");
    message.success("Top customer report exported to Excel");
  };

  const exportRedemptionsExcel = () => {
    const exportRows = filteredRedemptions.map((row) => ({
      Date: row.created_at || "-",
      Customer: row.customer_name || "-",
      Phone: row.contact || row.phone || row.mobile || row.mobile_number || "-",
      Program: row.program_name || "-",
      Offer: row.offer_name || "-",
      Type: row.offer_type || "-",
      Points: Number(row.points_used || 0),
      Discount: Number(row.discount_value || 0),
      "Free Item": row.free_item_name || "-",
    }));

    exportTableToExcel(exportRows, "loyalty-redeemed-points-records.xlsx", "Redeemed Points");
    message.success("Redeemed points records exported to Excel");
  };

  const exportTopCustomersPdf = () => {
    const doc = new jsPDF({ orientation: "landscape" });
    doc.setFontSize(14);
    doc.text("Loyalty Top Customer Report", 14, 14);

    autoTable(doc, {
      startY: 20,
      head: [["Customer", "Phone", "Lifetime Points", "Current Points", "Redeemed", "Total Redemptions"]],
      body: filteredTopCustomers.map((row) => [
        row.customer_name || "-",
        row.contact || row.phone || row.mobile || row.mobile_number || "-",
        Number(row.lifetime_points || 0),
        Number(row.points_balance || 0),
        Number(row.points_redeemed || 0),
        Number(row.total_redemptions || 0),
      ]),
      styles: { fontSize: 9 },
    });

    doc.save("loyalty-top-customers-report.pdf");
    message.success("Top customer report exported to PDF");
  };

  const exportRedemptionsPdf = () => {
    const doc = new jsPDF({ orientation: "landscape" });
    doc.setFontSize(14);
    doc.text("Loyalty Redeemed Points Records", 14, 14);

    autoTable(doc, {
      startY: 20,
      head: [["Date", "Customer", "Phone", "Program", "Offer", "Type", "Points", "Discount", "Free Item"]],
      body: filteredRedemptions.map((row) => [
        row.created_at || "-",
        row.customer_name || "-",
        row.contact || row.phone || row.mobile || row.mobile_number || "-",
        row.program_name || "-",
        row.offer_name || "-",
        row.offer_type || "-",
        Number(row.points_used || 0),
        Number(row.discount_value || 0),
        row.free_item_name || "-",
      ]),
      styles: { fontSize: 8 },
    });

    doc.save("loyalty-redeemed-points-records.pdf");
    message.success("Redeemed points records exported to PDF");
  };

  const loadPrograms = async () => {
    const response = await axios.get("/loyalty/programs", getHeaders());
    const rows = response?.data?.data || [];
    setPrograms(rows);
    if (!selectedProgramId && rows.length > 0) {
      setSelectedProgramId(rows[0].id);
    }
  };

  const loadOffers = async (programId) => {
    const response = await axios.get("/loyalty/offers", {
      ...getHeaders(),
      params: {
        program_id: programId || undefined,
      },
    });
    setOffers(response?.data?.data || []);
  };

  const loadCustomers = async () => {
    const response = await axios.get("/loyalty/customers", getHeaders());
    setCustomers(response?.data?.data || []);
  };

  const loadAnalytics = async () => {
    const response = await axios.get("/loyalty/analytics/dashboard", getHeaders());
    setAnalytics(response?.data?.data || null);
  };

  const loadRedemptions = async () => {
    const response = await axios.get("/loyalty/redemptions/history", getHeaders());
    setRedemptions(response?.data?.data || []);
  };

  const refreshAll = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadPrograms(),
        loadOffers(selectedProgramId),
        loadCustomers(),
        loadAnalytics(),
        loadRedemptions(),
      ]);
    } catch (error) {
      console.error("Error loading loyalty admin data:", error);
      message.error("Failed to load loyalty admin data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!selectedProgramId) return;
    loadOffers(selectedProgramId).catch((error) => {
      console.error("Error loading program offers:", error);
    });
  }, [selectedProgramId]);

  const openCreateProgramModal = () => {
    setEditingProgram(null);
    programForm.setFieldsValue({
      program_name: "",
      description: "",
      is_active: true,
      earn_spend_amount: 20,
      earn_points: 1,
      redeem_points_required: 100,
      redeem_value: 50,
      minimum_redeem_points: 100,
      expiry_months: 6,
      birthday_reward_type: "FREE_DESSERT",
      birthday_reward_value: "Free dessert",
    });
    setProgramModalOpen(true);
  };

  const openEditProgramModal = (program) => {
    setEditingProgram(program);
    programForm.setFieldsValue({
      ...program,
      is_active: Number(program.is_active) === 1,
    });
    setProgramModalOpen(true);
  };

  const submitProgram = async () => {
    try {
      const values = await programForm.validateFields();
      const payload = {
        ...values,
        is_active: values.is_active ? 1 : 0,
      };

      if (editingProgram?.id) {
        await axios.put(`/loyalty/programs/${editingProgram.id}`, payload, getHeaders());
        message.success("Program updated");
      } else {
        await axios.post("/loyalty/programs", payload, getHeaders());
        message.success("Program created");
      }

      setProgramModalOpen(false);
      await refreshAll();
    } catch (error) {
      if (error?.errorFields) return;
      console.error("Error saving program:", error);
      message.error(error?.response?.data?.message || "Failed to save program");
    }
  };

  const openCreateOfferModal = () => {
    setEditingOffer(null);
    offerForm.setFieldsValue({
      program_id: selectedProgramId,
      offer_name: "",
      offer_type: "DISCOUNT_AMOUNT",
      points_required: 100,
      discount_amount: 50,
      discount_percent: null,
      free_item_name: "",
      min_bill_amount: 0,
      max_discount_amount: null,
      offer_description: "",
      is_active: true,
    });
    setOfferModalOpen(true);
  };

  const openEditOfferModal = (offer) => {
    setEditingOffer(offer);
    offerForm.setFieldsValue({
      ...offer,
      is_active: Number(offer.is_active) === 1,
    });
    setOfferModalOpen(true);
  };

  const submitOffer = async () => {
    try {
      const values = await offerForm.validateFields();
      const payload = {
        ...values,
        is_active: values.is_active ? 1 : 0,
      };

      if (editingOffer?.id) {
        await axios.put(`/loyalty/offers/${editingOffer.id}`, payload, getHeaders());
        message.success("Offer updated");
      } else {
        await axios.post("/loyalty/offers", payload, getHeaders());
        message.success("Offer created");
      }

      setOfferModalOpen(false);
      await refreshAll();
    } catch (error) {
      if (error?.errorFields) return;
      console.error("Error saving offer:", error);
      message.error(error?.response?.data?.message || "Failed to save offer");
    }
  };

  const updateExpiryRule = async (programId, expiryMonths) => {
    try {
      await axios.put(
        `/loyalty/programs/${programId}`,
        { expiry_months: expiryMonths },
        getHeaders()
      );
      message.success("Expiry rule updated");
      await refreshAll();
    } catch (error) {
      console.error("Error updating expiry:", error);
      message.error(error?.response?.data?.message || "Failed to update expiry rule");
    }
  };

  const enrollCustomerToProgram = async () => {
    try {
      const values = await enrollForm.validateFields();
      await axios.post(
        "/loyalty/members/enroll",
        {
          customer_id: values.customer_id,
          program_id: values.program_id,
        },
        getHeaders()
      );
      message.success("Customer enrolled");
      enrollForm.resetFields();
      await refreshAll();
    } catch (error) {
      if (error?.errorFields) return;
      console.error("Error enrolling customer:", error);
      message.error(error?.response?.data?.message || "Failed to enroll customer");
    }
  };

  const applyStarterSetup = async () => {
    try {
      await axios.post("/loyalty/programs/starter-setup", {}, getHeaders());
      message.success("Starter setup applied");
      await refreshAll();
    } catch (error) {
      console.error("Error applying starter setup:", error);
      message.error(error?.response?.data?.message || "Failed to apply starter setup");
    }
  };

  const submitCampaign = async () => {
    try {
      const values = await campaignForm.validateFields();
      const member = enrolledMembers.find((row) => row.member_id === values.member_id);
      if (!member) {
        message.warning("Select valid loyalty member");
        return;
      }

      const template = TEMPLATE_OPTIONS.find((row) => row.key === values.template_key);
      const text = (values.message || template?.defaultMessage || "").trim();

      await axios.post(
        "/loyalty/notifications/line/queue",
        {
          member_id: values.member_id,
          customer_id: member.customer_id,
          template_key: values.template_key,
          message: text,
          payload_json: {
            channel: values.channel,
            scheduled_for: values.scheduled_for ? values.scheduled_for.toISOString() : null,
          },
        },
        getHeaders()
      );

      message.success("Campaign queued");
      campaignForm.resetFields();
      campaignForm.setFieldsValue({
        channel: "LINE",
        template_key: selectedTemplate,
      });
    } catch (error) {
      if (error?.errorFields) return;
      console.error("Error queueing campaign:", error);
      message.error(error?.response?.data?.message || "Failed to queue campaign");
    }
  };

  const programColumns = [
    {
      title: "Program",
      dataIndex: "program_name",
      key: "program_name",
      render: (_, row) => (
        <Space direction="vertical" size={0}>
          <Text strong>{row.program_name}</Text>
          <Text type="secondary">{row.description || "-"}</Text>
        </Space>
      ),
    },
    {
      title: "Rules",
      key: "rules",
      render: (_, row) => (
        <Space direction="vertical" size={0}>
          <Text>Earn: {row.earn_points} point / {row.earn_spend_amount} THB</Text>
          <Text>Redeem: {row.redeem_points_required} points = {row.redeem_value} THB</Text>
          <Text>Min Redeem: {row.minimum_redeem_points} points</Text>
        </Space>
      ),
    },
    {
      title: "Expiry",
      dataIndex: "expiry_months",
      key: "expiry_months",
      render: (value) => `${value} months`,
      width: 110,
    },
    {
      title: "Status",
      key: "is_active",
      width: 100,
      render: (_, row) => (
        <Tag color={Number(row.is_active) === 1 ? "green" : "default"}>
          {Number(row.is_active) === 1 ? "Active" : "Inactive"}
        </Tag>
      ),
    },
    {
      title: "Action",
      key: "action",
      width: 100,
      render: (_, row) => (
        <Button size="small" icon={<EditOutlined />} onClick={() => openEditProgramModal(row)}>
          Edit
        </Button>
      ),
    },
  ];

  const offerColumns = [
    { title: "Offer", dataIndex: "offer_name", key: "offer_name" },
    {
      title: "Type",
      dataIndex: "offer_type",
      key: "offer_type",
      width: 140,
      render: (value) => <Tag color="blue">{value}</Tag>,
    },
    { title: "Points", dataIndex: "points_required", key: "points_required", width: 90 },
    {
      title: "Value",
      key: "value",
      render: (_, row) => {
        if (row.offer_type === "DISCOUNT_AMOUNT") return `${row.discount_amount || 0} THB`;
        if (row.offer_type === "DISCOUNT_PERCENT") return `${row.discount_percent || 0}%`;
        return row.free_item_name || "Free Item";
      },
    },
    { title: "Min Bill", dataIndex: "min_bill_amount", key: "min_bill_amount", width: 100 },
    {
      title: "Status",
      key: "is_active",
      width: 100,
      render: (_, row) => (
        <Tag color={Number(row.is_active) === 1 ? "green" : "default"}>
          {Number(row.is_active) === 1 ? "Active" : "Inactive"}
        </Tag>
      ),
    },
    {
      title: "Action",
      key: "action",
      width: 100,
      render: (_, row) => (
        <Button size="small" icon={<EditOutlined />} onClick={() => openEditOfferModal(row)}>
          Edit
        </Button>
      ),
    },
  ];

  const expiryColumns = [
    {
      title: "Program",
      dataIndex: "program_name",
      key: "program_name",
      render: (value) => <Text strong>{value}</Text>,
    },
    {
      title: "Current Expiry",
      dataIndex: "expiry_months",
      key: "expiry_months",
      width: 140,
      render: (value) => `${value} months`,
    },
    {
      title: "Update Expiry",
      key: "update_expiry",
      render: (_, row) => (
        <Space>
          <InputNumber min={1} defaultValue={Number(row.expiry_months || 6)} onChange={(value) => { row._new_expiry = value || 1; }} />
          <Button
            type="primary"
            size="small"
            onClick={() => updateExpiryRule(row.id, row._new_expiry || Number(row.expiry_months || 6))}
          >
            Save
          </Button>
        </Space>
      ),
    },
  ];

  const rankingColumns = [
    { title: "Customer", dataIndex: "customer_name", key: "customer_name" },
    { title: "Contact", dataIndex: "contact", key: "contact" },
    { title: "Lifetime Points", dataIndex: "lifetime_points", key: "lifetime_points", width: 130 },
    { title: "Current Points", dataIndex: "points_balance", key: "points_balance", width: 120 },
    { title: "Redeemed", dataIndex: "points_redeemed", key: "points_redeemed", width: 100 },
    { title: "Total Redemptions", dataIndex: "total_redemptions", key: "total_redemptions", width: 130 },
  ];

  const redemptionColumns = [
    { title: "Date", dataIndex: "created_at", key: "created_at", width: 170 },
    { title: "Customer", dataIndex: "customer_name", key: "customer_name", width: 160 },
    { title: "Program", dataIndex: "program_name", key: "program_name", width: 160 },
    { title: "Offer", dataIndex: "offer_name", key: "offer_name" },
    { title: "Type", dataIndex: "offer_type", key: "offer_type", width: 120 },
    { title: "Points", dataIndex: "points_used", key: "points_used", width: 90 },
    { title: "Discount", dataIndex: "discount_value", key: "discount_value", width: 90 },
    { title: "Free Item", dataIndex: "free_item_name", key: "free_item_name", width: 140, render: (value) => value || "-" },
  ];

  const overview = analytics?.overview || {};

  return (
    <Layout>
      <div style={pageStyle}>
        <Row gutter={[12, 12]} style={{ marginBottom: 12 }}>
          <Col xs={24} lg={16}>
            <Space wrap>
              <Title level={4} style={{ margin: 0 }}>Loyalty Program Admin Console</Title>
              <Button icon={<ReloadOutlined />} onClick={refreshAll} loading={loading}>Refresh</Button>
              <Button type="primary" icon={<GiftOutlined />} onClick={applyStarterSetup}>Apply Starter Setup</Button>
            </Space>
            <div style={{ marginTop: 8 }}>
              <Text type="secondary">Manage program rules, offers, expiry policies, customer analytics, and LINE/SMS campaigns per shop.</Text>
            </div>
          </Col>
          <Col xs={24} lg={8}>
            <Card size="small" style={headerCardStyle}>
              <Row gutter={[8, 8]}>
                <Col span={12}><Statistic title="Members" value={Number(overview.total_members || 0)} /></Col>
                <Col span={12}><Statistic title="Program Enrollments" value={Number(overview.total_member_programs || 0)} /></Col>
                <Col span={12}><Statistic title="Total Points" value={Number(overview.total_points_balance || 0)} /></Col>
                <Col span={12}><Statistic title="Discount Given" value={Number(overview.total_discount_given || 0)} precision={2} /></Col>
              </Row>
            </Card>
          </Col>
        </Row>

        <Tabs
          items={[
            {
              key: "program-rules",
              label: (
                <span>
                  <GiftOutlined /> Program Rule Builder
                </span>
              ),
              children: (
                <Row gutter={[16, 16]}>
                  <Col xs={24} lg={8}>
                    <Card title="Enroll Customer to Program" style={softCardStyle}>
                      <Form layout="vertical" form={enrollForm}>
                        <Form.Item label="Customer" name="customer_id" rules={[{ required: true, message: "Select customer" }]}>
                          <Select
                            showSearch
                            optionFilterProp="label"
                            placeholder="Select customer"
                            options={nonEnrolledCustomers.map((row) => ({
                              value: row.customer_id,
                              label: `${row.name || "Customer"} (${row.contact || "No contact"})`,
                            }))}
                          />
                        </Form.Item>
                        <Form.Item label="Program" name="program_id" rules={[{ required: true, message: "Select program" }]}>
                          <Select
                            placeholder="Select program"
                            options={(programs || []).filter((row) => Number(row.is_active) === 1).map((row) => ({
                              value: row.id,
                              label: row.program_name,
                            }))}
                          />
                        </Form.Item>
                        <Button type="primary" block onClick={enrollCustomerToProgram}>Enroll</Button>
                      </Form>
                    </Card>
                  </Col>
                  <Col xs={24} lg={16}>
                    <Card
                      title="Program Rules"
                      extra={<Button type="primary" onClick={openCreateProgramModal}>New Program</Button>}
                      style={softCardStyle}
                    >
                      <Table rowKey="id" loading={loading} dataSource={programs} columns={programColumns} pagination={{ pageSize: 8 }} />
                    </Card>
                  </Col>
                </Row>
              ),
            },
            {
              key: "offers",
              label: (
                <span>
                  <GiftOutlined /> Offer Builder
                </span>
              ),
              children: (
                <Card
                  title="Program Offers"
                  extra={
                    <Space wrap>
                      <Select
                        value={selectedProgramId}
                        onChange={setSelectedProgramId}
                        placeholder="Select program"
                        style={{ minWidth: 260 }}
                        options={(programs || []).map((row) => ({
                          value: row.id,
                          label: row.program_name,
                        }))}
                      />
                      <Button type="primary" onClick={openCreateOfferModal} disabled={!selectedProgramId}>New Offer</Button>
                    </Space>
                  }
                  style={softCardStyle}
                >
                  <Table rowKey="id" loading={loading} dataSource={offers} columns={offerColumns} pagination={{ pageSize: 10 }} />
                </Card>
              ),
            },
            {
              key: "expiry-rules",
              label: (
                <span>
                  <EditOutlined /> Expiry Rule Manager
                </span>
              ),
              children: (
                <Card title="Program Expiry Policies" style={softCardStyle}>
                  <Table rowKey="id" loading={loading} dataSource={programs} columns={expiryColumns} pagination={false} />
                </Card>
              ),
            },
            {
              key: "analytics",
              label: (
                <span>
                  <BarChartOutlined /> Customer Ranking & KPI Charts
                </span>
              ),
              children: (
                <Space direction="vertical" size={16} style={{ width: "100%" }}>
                  <Row gutter={[16, 16]}>
                    <Col xs={24} lg={14}>
                      <Card title="Top Customer Ranking (Lifetime Points)" extra={<TrophyOutlined />} style={softCardStyle}>
                        <div style={{ width: "100%", height: 300 }}>
                          <ResponsiveContainer>
                            <BarChart data={topCustomersChartData}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="name" hide />
                              <YAxis />
                              <Tooltip />
                              <Legend />
                              <Bar dataKey="lifetimePoints" fill="#1677ff" name="Lifetime Points" />
                              <Bar dataKey="currentPoints" fill="#52c41a" name="Current Points" />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </Card>
                    </Col>
                    <Col xs={24} lg={10}>
                      <Card title="Program Enrollment Distribution" style={softCardStyle}>
                        <div style={{ width: "100%", height: 300 }}>
                          <ResponsiveContainer>
                            <PieChart>
                              <Pie data={programsPieData} dataKey="value" nameKey="name" outerRadius={100} label>
                                {programsPieData.map((entry, index) => (
                                  <Cell key={`${entry.name}-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                                ))}
                              </Pie>
                              <Tooltip />
                              <Legend />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                      </Card>
                    </Col>
                  </Row>

                  <Card
                    title="Top Customer Table"
                    extra={
                      <Space wrap>
                        <Input
                          allowClear
                          value={customerSearchText}
                          onChange={(event) => setCustomerSearchText(event.target.value)}
                          placeholder="Search customer name or phone"
                          prefix={<SearchOutlined />}
                          style={{ width: 260 }}
                        />
                        <Button icon={<FileExcelOutlined />} onClick={exportTopCustomersExcel}>
                          Export Excel
                        </Button>
                        <Button icon={<FilePdfOutlined />} onClick={exportTopCustomersPdf}>
                          Export PDF
                        </Button>
                      </Space>
                    }
                    style={softCardStyle}
                  >
                    <Table
                      rowKey={(row) => `${row.member_id}`}
                      loading={loading}
                      dataSource={filteredTopCustomers}
                      columns={rankingColumns}
                      pagination={{ pageSize: 8 }}
                      scroll={{ x: 900 }}
                    />
                  </Card>

                  <Card
                    title="Redemption History (KPI Source)"
                    extra={
                      <Space wrap>
                        <Input
                          allowClear
                          value={customerSearchText}
                          onChange={(event) => setCustomerSearchText(event.target.value)}
                          placeholder="Search customer name or phone"
                          prefix={<SearchOutlined />}
                          style={{ width: 260 }}
                        />
                        <Button icon={<FileExcelOutlined />} onClick={exportRedemptionsExcel}>
                          Export Excel
                        </Button>
                        <Button icon={<FilePdfOutlined />} onClick={exportRedemptionsPdf}>
                          Export PDF
                        </Button>
                      </Space>
                    }
                    style={softCardStyle}
                  >
                    <Table
                      rowKey="id"
                      loading={loading}
                      dataSource={filteredRedemptions}
                      columns={redemptionColumns}
                      pagination={{ pageSize: 8 }}
                      scroll={{ x: 1200 }}
                    />
                  </Card>
                </Space>
              ),
            },
            {
              key: "marketing",
              label: (
                <span>
                  <NotificationOutlined /> Marketing Automation Scheduler (LINE/SMS)
                </span>
              ),
              children: (
                <Row gutter={[16, 16]}>
                  <Col xs={24} lg={10}>
                    <Card title="Campaign Templates" style={softCardStyle}>
                      <Space direction="vertical" style={{ width: "100%" }}>
                        {TEMPLATE_OPTIONS.map((template) => (
                          <Card
                            key={template.key}
                            size="small"
                            style={{
                              borderRadius: 14,
                              borderColor: selectedTemplate === template.key ? "#8ec5ff" : "rgba(22, 119, 255, 0.08)",
                              background: selectedTemplate === template.key ? "linear-gradient(135deg, #ffffff, #eef7ff)" : "rgba(255,255,255,0.9)",
                              boxShadow: selectedTemplate === template.key ? "0 10px 24px rgba(22, 119, 255, 0.08)" : undefined,
                            }}
                            onClick={() => {
                              setSelectedTemplate(template.key);
                              campaignForm.setFieldsValue({
                                template_key: template.key,
                                message: template.defaultMessage,
                              });
                            }}
                          >
                            <Text strong>{template.label}</Text>
                            <div>
                              <Text type="secondary">{template.defaultMessage || "Use custom message template"}</Text>
                            </div>
                          </Card>
                        ))}
                      </Space>
                    </Card>
                  </Col>
                  <Col xs={24} lg={14}>
                    <Card title="Schedule Loyalty Campaign" style={softCardStyle}>
                      <Form
                        layout="vertical"
                        form={campaignForm}
                        initialValues={{
                          channel: "LINE",
                          template_key: TEMPLATE_OPTIONS[0].key,
                          message: TEMPLATE_OPTIONS[0].defaultMessage,
                        }}
                      >
                        <Row gutter={12}>
                          <Col xs={24} md={12}>
                            <Form.Item
                              label="Loyalty Member"
                              name="member_id"
                              rules={[{ required: true, message: "Select loyalty member" }]}
                            >
                              <Select
                                showSearch
                                optionFilterProp="label"
                                placeholder="Select member"
                                options={enrolledMembers.map((row) => ({
                                  value: row.member_id,
                                  label: `${row.name || "Customer"} (${row.contact || "No contact"})`,
                                }))}
                              />
                            </Form.Item>
                          </Col>
                          <Col xs={24} md={12}>
                            <Form.Item
                              label="Channel"
                              name="channel"
                              rules={[{ required: true, message: "Select channel" }]}
                            >
                              <Select
                                options={[
                                  { label: "LINE", value: "LINE" },
                                  { label: "SMS", value: "SMS" },
                                ]}
                              />
                            </Form.Item>
                          </Col>
                        </Row>

                        <Row gutter={12}>
                          <Col xs={24} md={12}>
                            <Form.Item
                              label="Template"
                              name="template_key"
                              rules={[{ required: true, message: "Select template" }]}
                            >
                              <Select
                                options={TEMPLATE_OPTIONS.map((row) => ({
                                  value: row.key,
                                  label: row.label,
                                }))}
                                onChange={(value) => {
                                  const selected = TEMPLATE_OPTIONS.find((row) => row.key === value);
                                  setSelectedTemplate(value);
                                  campaignForm.setFieldsValue({ message: selected?.defaultMessage || "" });
                                }}
                              />
                            </Form.Item>
                          </Col>
                          <Col xs={24} md={12}>
                            <Form.Item label="Schedule For" name="scheduled_for">
                              <DatePicker showTime style={{ width: "100%" }} />
                            </Form.Item>
                          </Col>
                        </Row>

                        <Form.Item
                          label="Message"
                          name="message"
                          rules={[{ required: true, message: "Message is required" }]}
                        >
                          <Input.TextArea rows={4} placeholder="Message to send" />
                        </Form.Item>

                        <Button type="primary" onClick={submitCampaign}>Queue Campaign</Button>
                      </Form>
                    </Card>
                  </Col>
                </Row>
              ),
            },
          ]}
        />
      </div>

      <Modal
        title={editingProgram ? "Edit Loyalty Program" : "Create Loyalty Program"}
        open={programModalOpen}
        onCancel={() => setProgramModalOpen(false)}
        onOk={submitProgram}
        width={780}
        okText="Save"
      >
        <Form form={programForm} layout="vertical">
          <Row gutter={12}>
            <Col xs={24} md={12}>
              <Form.Item label="Program Name" name="program_name" rules={[{ required: true, message: "Program name is required" }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label="Active" name="is_active" valuePropName="checked">
                <Switch />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item label="Description" name="description">
            <Input.TextArea rows={2} />
          </Form.Item>

          <Row gutter={12}>
            <Col xs={12} md={6}><Form.Item label="Earn Spend (THB)" name="earn_spend_amount" rules={[{ required: true }]}><InputNumber min={0.01} style={{ width: "100%" }} /></Form.Item></Col>
            <Col xs={12} md={6}><Form.Item label="Earn Points" name="earn_points" rules={[{ required: true }]}><InputNumber min={1} style={{ width: "100%" }} /></Form.Item></Col>
            <Col xs={12} md={6}><Form.Item label="Redeem Points" name="redeem_points_required" rules={[{ required: true }]}><InputNumber min={1} style={{ width: "100%" }} /></Form.Item></Col>
            <Col xs={12} md={6}><Form.Item label="Redeem Value (THB)" name="redeem_value" rules={[{ required: true }]}><InputNumber min={0} style={{ width: "100%" }} /></Form.Item></Col>
          </Row>

          <Row gutter={12}>
            <Col xs={12} md={6}><Form.Item label="Min Redeem Points" name="minimum_redeem_points" rules={[{ required: true }]}><InputNumber min={1} style={{ width: "100%" }} /></Form.Item></Col>
            <Col xs={12} md={6}><Form.Item label="Expiry (months)" name="expiry_months" rules={[{ required: true }]}><InputNumber min={1} style={{ width: "100%" }} /></Form.Item></Col>
            <Col xs={24} md={6}>
              <Form.Item label="Birthday Reward Type" name="birthday_reward_type" rules={[{ required: true }]}>
                <Select options={[
                  { label: "None", value: "NONE" },
                  { label: "Free Dessert", value: "FREE_DESSERT" },
                  { label: "Coupon", value: "COUPON" },
                  { label: "Custom", value: "CUSTOM" },
                ]} />
              </Form.Item>
            </Col>
            <Col xs={24} md={6}><Form.Item label="Birthday Reward Value" name="birthday_reward_value"><Input /></Form.Item></Col>
          </Row>
        </Form>
      </Modal>

      <Modal
        title={editingOffer ? "Edit Loyalty Offer" : "Create Loyalty Offer"}
        open={offerModalOpen}
        onCancel={() => setOfferModalOpen(false)}
        onOk={submitOffer}
        width={780}
        okText="Save"
      >
        <Form form={offerForm} layout="vertical">
          <Row gutter={12}>
            <Col xs={24} md={12}>
              <Form.Item label="Program" name="program_id" rules={[{ required: true, message: "Program is required" }]}>
                <Select options={(programs || []).map((row) => ({ value: row.id, label: row.program_name }))} />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label="Offer Name" name="offer_name" rules={[{ required: true, message: "Offer name is required" }]}>
                <Input />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={12}>
            <Col xs={24} md={8}>
              <Form.Item label="Offer Type" name="offer_type" rules={[{ required: true, message: "Offer type is required" }]}>
                <Select options={OFFER_TYPES} />
              </Form.Item>
            </Col>
            <Col xs={12} md={8}><Form.Item label="Points Required" name="points_required" rules={[{ required: true }]}><InputNumber min={1} style={{ width: "100%" }} /></Form.Item></Col>
            <Col xs={12} md={8}><Form.Item label="Minimum Bill" name="min_bill_amount"><InputNumber min={0} style={{ width: "100%" }} /></Form.Item></Col>
          </Row>

          <Row gutter={12}>
            <Col xs={12} md={6}><Form.Item label="Discount Amount" name="discount_amount"><InputNumber min={0} style={{ width: "100%" }} /></Form.Item></Col>
            <Col xs={12} md={6}><Form.Item label="Discount Percent" name="discount_percent"><InputNumber min={0} max={100} style={{ width: "100%" }} /></Form.Item></Col>
            <Col xs={12} md={6}><Form.Item label="Max Discount" name="max_discount_amount"><InputNumber min={0} style={{ width: "100%" }} /></Form.Item></Col>
            <Col xs={12} md={6}><Form.Item label="Free Item Name" name="free_item_name"><Input /></Form.Item></Col>
          </Row>

          <Row gutter={12}>
            <Col xs={24} md={18}><Form.Item label="Offer Description" name="offer_description"><Input.TextArea rows={2} /></Form.Item></Col>
            <Col xs={24} md={6}><Form.Item label="Active" name="is_active" valuePropName="checked"><Switch /></Form.Item></Col>
          </Row>
        </Form>
      </Modal>
    </Layout>
  );
}
