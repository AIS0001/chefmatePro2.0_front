import React, { useCallback, useEffect, useState } from "react";
import { Button, Card, Col, Form, Input, Popconfirm, Row, Space, Table, Typography, message } from "antd";
import axios from "axios";
import { getHeaders, getResolvedShopId } from "../../utility/getHeader";
import Header from "../../components/Header";
import Layout from "../../layout/Layout";
import { fetchShopScopedData } from "../../functions/fetchData";

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
  background: "linear-gradient(135deg, #fff3bf 0%, #ffd6e7 40%, #bae7ff 100%)",
  borderRadius: 16,
  padding: "18px 20px",
  border: "1px solid #e6f4ff",
};

export default function Suppliers() {
  const [form] = Form.useForm();
  const [suppliers, setSuppliers] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const resolvedShopId = getResolvedShopId();

  const loadSuppliers = useCallback(async () => {
    setIsLoading(true);
    try {
      const rows = await fetchShopScopedData("suppliers", null, "id");
      setSuppliers(Array.isArray(rows) ? rows : []);
    } catch (error) {
      message.error("Failed to load suppliers");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSuppliers();
  }, [loadSuppliers]);

  const onFinish = async (values) => {
    const name = (values.name || "").trim();
    if (!name) {
      message.warning("Please enter supplier name");
      return;
    }

    setIsSubmitting(true);
    try {
      await axios.post(
        "/insertdata/suppliers",
        {
          ...(resolvedShopId ? { shop_id: resolvedShopId } : {}),
          name,
          company_name: values.company_name || "",
          contact: values.contact || "",
          email: values.email || "",
          taxid: values.taxid || "",
          address: values.address || "",
        },
        getHeaders()
      );

      message.success("Supplier added successfully");
      form.resetFields();
      await loadSuppliers();
    } catch (error) {
      message.error("Failed to add supplier");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`/deletebyid/suppliers/id/${id}`, getHeaders());
      message.success("Supplier deleted");
      await loadSuppliers();
    } catch (error) {
      message.error("Failed to delete supplier");
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
      title: "Name",
      dataIndex: "name",
      key: "name",
      sorter: (a, b) => String(a.name || "").localeCompare(String(b.name || "")),
      render: (value) => <Text strong style={{ color: "#144d7a" }}>{value}</Text>,
    },
    {
      title: "Company Name",
      dataIndex: "company_name",
      key: "company_name",
      render: (value) => value || "N/A",
    },
    {
      title: "Contact",
      dataIndex: "contact",
      key: "contact",
      render: (value) => value || "N/A",
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
      render: (value) => value || "N/A",
    },
    {
      title: "Tax ID",
      dataIndex: "taxid",
      key: "taxid",
      render: (value) => value || "N/A",
    },
    {
      title: "Address",
      dataIndex: "address",
      key: "address",
      ellipsis: true,
      render: (value) => value || "N/A",
    },
    {
      title: "Action",
      key: "action",
      fixed: "right",
      width: 130,
      render: (_, record) => (
        <Popconfirm
          title="Delete supplier?"
          onConfirm={() => handleDelete(record.id)}
          okText="Delete"
          cancelText="Cancel"
        >
          <Button danger size="small">Delete</Button>
        </Popconfirm>
      ),
    },
  ];

  return (
    <Layout>
      <Header title="Supplier Management" />
      <div style={pageStyles}>
        <Space direction="vertical" size={18} style={{ width: "100%" }}>
          <div style={headerAccentStyle}>
            <Title level={4} style={{ margin: 0, color: "#16324f" }}>
              Supplier Directory
            </Title>
            <Text style={{ color: "#45607a" }}>
              Maintain supplier records in the same brighter master workspace.
            </Text>
          </div>

          <Card title="Add New Supplier" style={softCardStyle} bodyStyle={{ paddingBottom: 10 }}>
            <Form form={form} layout="vertical" onFinish={onFinish}>
              <Row gutter={[16, 6]}>
                <Col xs={24} md={12} lg={8}>
                  <Form.Item
                    label="Supplier Name"
                    name="name"
                    rules={[{ required: true, message: "Supplier name is required" }]}
                  >
                    <Input placeholder="Enter supplier name" maxLength={100} style={{ borderRadius: 12 }} />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12} lg={8}>
                  <Form.Item label="Company Name" name="company_name">
                    <Input placeholder="Enter company name" maxLength={100} style={{ borderRadius: 12 }} />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12} lg={8}>
                  <Form.Item label="Contact" name="contact">
                    <Input placeholder="Enter contact number" maxLength={20} style={{ borderRadius: 12 }} />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12} lg={8}>
                  <Form.Item label="Email" name="email">
                    <Input type="email" placeholder="Enter email" maxLength={100} style={{ borderRadius: 12 }} />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12} lg={8}>
                  <Form.Item label="Tax ID" name="taxid">
                    <Input placeholder="Enter tax ID" maxLength={50} style={{ borderRadius: 12 }} />
                  </Form.Item>
                </Col>
                <Col xs={24} lg={16}>
                  <Form.Item label="Address" name="address">
                    <Input.TextArea placeholder="Enter address" rows={2} maxLength={200} style={{ borderRadius: 12 }} />
                  </Form.Item>
                </Col>
                <Col xs={24} lg={8}>
                  <Form.Item label=" ">
                    <Button
                      type="primary"
                      htmlType="submit"
                      loading={isSubmitting}
                      style={{
                        width: "100%",
                        borderRadius: 12,
                        background: "linear-gradient(135deg, #69c0ff 0%, #ffd666 100%)",
                        border: "none",
                        color: "#12324a",
                        fontWeight: 600,
                      }}
                    >
                      Save Supplier
                    </Button>
                  </Form.Item>
                </Col>
              </Row>
            </Form>
          </Card>

          <Card title="Supplier List" style={softCardStyle}>
            <Table
              rowKey="id"
              columns={columns}
              dataSource={suppliers}
              loading={isLoading}
              pagination={{ pageSize: 10 }}
              scroll={{ x: 1100 }}
            />
          </Card>
        </Space>
      </div>
    </Layout>
  );
}
