import React, { useEffect, useState } from "react";
import { Button, Card, Form, Input, Popconfirm, Space, Table, Typography, message } from "antd";
import axios from "axios";
import { getHeaders } from "../../utility/getHeader";
import Header from "../../components/Header";
import Layout from "../../layout/Layout";
import fetchData from "../../functions/fetchData";

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

export default function PaymentOptions() {
  const [form] = Form.useForm();
  const [options, setOptions] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const loadPaymentOptions = async () => {
    setIsLoading(true);
    try {
      const rows = await fetchData("paymentoptions", null, "id", {});
      setOptions(Array.isArray(rows) ? rows : []);
    } catch (error) {
      message.error("Failed to load payment options");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPaymentOptions();
  }, []);

  const onFinish = async (values) => {
    const name = (values.name || "").trim();
    if (!name) {
      message.warning("Please enter option name");
      return;
    }

    setIsSubmitting(true);
    try {
      await axios.post(
        "/insertdata/paymentoptions",
        { name },
        getHeaders()
      );
      message.success("Payment option added successfully");
      form.resetFields();
      await loadPaymentOptions();
    } catch (error) {
      message.error("Failed to add payment option");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`/deletebyid/paymentoptions/id/${id}`, getHeaders());
      message.success("Payment option deleted");
      await loadPaymentOptions();
    } catch (error) {
      message.error("Failed to delete payment option");
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
      title: "Option",
      dataIndex: "name",
      key: "name",
      sorter: (a, b) => String(a.name || "").localeCompare(String(b.name || "")),
      render: (value) => <Text strong style={{ color: "#144d7a" }}>{value}</Text>,
    },
    {
      title: "Action",
      key: "action",
      width: 130,
      render: (_, record) => (
        <Popconfirm
          title="Delete payment option?"
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
      <Header title="Payment Options" />
      <div style={pageStyles}>
        <Space direction="vertical" size={18} style={{ width: "100%" }}>
          <div style={headerAccentStyle}>
            <Title level={4} style={{ margin: 0, color: "#16324f" }}>
              Payment Option Settings
            </Title>
            <Text style={{ color: "#45607a" }}>
              Manage available payment methods such as cash, credit, and QR in one brighter workspace.
            </Text>
          </div>

          <Card title="Add Payment Option" style={softCardStyle} bodyStyle={{ paddingBottom: 10 }}>
            <Form form={form} layout="vertical" onFinish={onFinish}>
              <Form.Item
                label="Option Name"
                name="name"
                rules={[{ required: true, message: "Option name is required" }]}
              >
                <Input placeholder="Cash, Credit, QR, Bank Transfer" maxLength={100} style={{ borderRadius: 12 }} />
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
                Save Option
              </Button>
            </Form>
          </Card>

          <Card title="Payment Option List" style={softCardStyle}>
            <Table
              rowKey="id"
              columns={columns}
              dataSource={options}
              loading={isLoading}
              pagination={{ pageSize: 10 }}
            />
          </Card>
        </Space>
      </div>
    </Layout>
  );
}
