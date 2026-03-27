import React, { useEffect, useState } from "react";
import {
  Button,
  Card,
  Checkbox,
  Col,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Row,
  Space,
  Table,
  Tag,
  Typography,
  message,
} from "antd";
import axios from "axios";
import Header from "../../components/Header";
import Layout from "../../layout/Layout";
import fetchData from "../../functions/fetchData";
import { getHeaders, getResolvedShopId } from "../../utility/getHeader";

const { Text, Title } = Typography;

const pageStyles = {
  background: "linear-gradient(180deg, #fffdf7 0%, #f6fbff 48%, #f9fff7 100%)",
  minHeight: "100%",
  padding: 20,
};

const softCardStyle = {
  borderRadius: 20,
  border: "1px solid #e8f3ff",
  boxShadow: "0 18px 40px rgba(134, 185, 255, 0.12)",
  background: "rgba(255, 255, 255, 0.92)",
};

const headerAccentStyle = {
  background: "linear-gradient(135deg, #fff3bf 0%, #d9f7be 50%, #bae7ff 100%)",
  borderRadius: 16,
  padding: "18px 20px",
  border: "1px solid #e6f4ff",
};

export default function Taxes() {
  const [createForm] = Form.useForm();
  const [editForm] = Form.useForm();
  const [taxes, setTaxes] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [selectedTax, setSelectedTax] = useState(null);

  const getScopedConfig = () => {
    const shopId = getResolvedShopId();
    const baseConfig = getHeaders() || {};

    return {
      ...baseConfig,
      params: {
        ...(baseConfig.params || {}),
        ...(shopId ? { shop_id: shopId } : {}),
      },
    };
  };

  const loadTaxes = async () => {
    setIsLoading(true);
    try {
      const rows = await fetchData("taxes", null, "id", {});
      setTaxes(Array.isArray(rows) ? rows : []);
    } catch (error) {
      message.error("Failed to load taxes");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTaxes();
  }, []);

  const onCreate = async (values) => {
    const shopId = getResolvedShopId();
    const taxname = (values.taxname || "").trim();
    const taxvalue = values.taxvalue;
    const included = !!values.included;

    if (!taxname) {
      message.warning("Please enter tax name");
      return;
    }

    setIsSubmitting(true);
    try {
      await axios.post(
        "/insertdata/taxes",
        {
          taxname,
          taxvalue,
          included,
          ...(shopId ? { shop_id: shopId } : {}),
        },
        getScopedConfig()
      );

      message.success("Tax added successfully");
      createForm.resetFields();
      await loadTaxes();
    } catch (error) {
      message.error("Failed to add tax");
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditModal = (record) => {
    setSelectedTax(record);
    editForm.setFieldsValue({
      taxname: record.taxname,
      taxvalue: Number(record.taxvalue || 0),
      included: record.included === true || record.included === 1 || record.included === "true",
    });
    setIsEditOpen(true);
  };

  const closeEditModal = () => {
    setIsEditOpen(false);
    setSelectedTax(null);
    editForm.resetFields();
  };

  const onUpdate = async () => {
    if (!selectedTax) {
      return;
    }

    try {
      const values = await editForm.validateFields();
      setIsUpdating(true);

      await axios.put(
        `/updatedata1/taxes/id/${selectedTax.id}`,
        {
          taxname: values.taxname.trim(),
          taxvalue: values.taxvalue,
          included: !!values.included,
        },
        getScopedConfig()
      );

      message.success("Tax updated successfully");
      closeEditModal();
      await loadTaxes();
    } catch (error) {
      if (error?.errorFields) {
        return;
      }
      message.error("Failed to update tax");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`/deletebyid/taxes/id/${id}`, getScopedConfig());
      message.success("Tax deleted successfully");
      await loadTaxes();
    } catch (error) {
      message.error("Failed to delete tax");
    }
  };

  const columns = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
      width: 80,
      sorter: (a, b) => Number(a.id || 0) - Number(b.id || 0),
      render: (value) => <Text>{value}</Text>,
    },
    {
      title: "Tax Name",
      dataIndex: "taxname",
      key: "taxname",
      sorter: (a, b) => String(a.taxname || "").localeCompare(String(b.taxname || "")),
      render: (value) => <Text strong style={{ color: "#144d7a" }}>{value}</Text>,
    },
    {
      title: "Tax Value",
      dataIndex: "taxvalue",
      key: "taxvalue",
      width: 120,
      sorter: (a, b) => Number(a.taxvalue || 0) - Number(b.taxvalue || 0),
      render: (value) => <Tag color="gold">{Number(value || 0)}%</Tag>,
    },
    {
      title: "Included",
      dataIndex: "included",
      key: "included",
      width: 120,
      render: (value) => {
        const checked = value === true || value === 1 || value === "true";
        return <Tag color={checked ? "green" : "blue"}>{checked ? "Included" : "Excluded"}</Tag>;
      },
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 120,
      render: (value) => {
        const active = String(value || "").toLowerCase() === "active" || Number(value) === 1;
        return <Tag color={active ? "cyan" : "default"}>{active ? "Active" : value || "-"}</Tag>;
      },
    },
    {
      title: "Action",
      key: "action",
      width: 180,
      render: (_, record) => (
        <Space>
          <Button
            size="small"
            style={{
              background: "#e6f4ff",
              borderColor: "#91d5ff",
              color: "#0958d9",
            }}
            onClick={() => openEditModal(record)}
          >
            Edit
          </Button>
          <Popconfirm
            title="Delete tax?"
            onConfirm={() => handleDelete(record.id)}
            okText="Delete"
            cancelText="Cancel"
          >
            <Button danger size="small">Delete</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Layout>
      <Header title="Taxes" />
      <div style={pageStyles}>
        <Space direction="vertical" size={18} style={{ width: "100%" }}>
          <div style={headerAccentStyle}>
            <Title level={4} style={{ margin: 0, color: "#16324f" }}>
              Tax Settings
            </Title>
            <Text style={{ color: "#45607a" }}>
              Create and manage shop-specific tax rules with a brighter, cleaner workspace.
            </Text>
          </div>

          <Row gutter={[18, 18]}>
            <Col xs={24} lg={9}>
              <Card title="Add New Tax" style={softCardStyle} bodyStyle={{ paddingBottom: 10 }}>
                <Form
                  form={createForm}
                  layout="vertical"
                  onFinish={onCreate}
                  initialValues={{ included: false }}
                >
                  <Form.Item
                    label="Tax Name"
                    name="taxname"
                    rules={[{ required: true, message: "Tax name is required" }]}
                  >
                    <Input
                      placeholder="VAT, GST, Service Charge"
                      maxLength={100}
                      style={{ borderRadius: 12 }}
                    />
                  </Form.Item>

                  <Form.Item
                    label="Tax Value (%)"
                    name="taxvalue"
                    rules={[{ required: true, message: "Tax value is required" }]}
                  >
                    <InputNumber
                      min={0}
                      max={100}
                      precision={2}
                      style={{ width: "100%", borderRadius: 12 }}
                      placeholder="Enter tax percentage"
                    />
                  </Form.Item>

                  <Form.Item name="included" valuePropName="checked">
                    <Checkbox>Included in item prices</Checkbox>
                  </Form.Item>

                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={isSubmitting}
                    style={{
                      borderRadius: 12,
                      background: "linear-gradient(135deg, #69c0ff 0%, #95de64 100%)",
                      border: "none",
                      color: "#12324a",
                      fontWeight: 600,
                    }}
                  >
                    Save Tax
                  </Button>
                </Form>
              </Card>
            </Col>

            <Col xs={24} lg={15}>
              <Card title="Tax List" style={softCardStyle}>
                <Table
                  rowKey="id"
                  columns={columns}
                  dataSource={taxes}
                  loading={isLoading}
                  pagination={{ pageSize: 10 }}
                  scroll={{ x: 760 }}
                />
              </Card>
            </Col>
          </Row>
        </Space>

        <Modal
          title="Edit Tax"
          open={isEditOpen}
          onCancel={closeEditModal}
          onOk={onUpdate}
          confirmLoading={isUpdating}
          okText="Update Tax"
        >
          <Form form={editForm} layout="vertical">
            <Form.Item
              label="Tax Name"
              name="taxname"
              rules={[{ required: true, message: "Tax name is required" }]}
            >
              <Input maxLength={100} />
            </Form.Item>

            <Form.Item
              label="Tax Value (%)"
              name="taxvalue"
              rules={[{ required: true, message: "Tax value is required" }]}
            >
              <InputNumber min={0} max={100} precision={2} style={{ width: "100%" }} />
            </Form.Item>

            <Form.Item name="included" valuePropName="checked">
              <Checkbox>Included in item prices</Checkbox>
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </Layout>
  );
}
