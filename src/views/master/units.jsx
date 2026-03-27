import React, { useEffect, useState } from "react";
import { Button, Card, Form, Input, Popconfirm, Space, Table, Typography, message } from "antd";
import axios from "axios";
import Header from "../../components/Header";
import Layout from "../../layout/Layout";
import fetchData from "../../functions/fetchData";
import { getHeaders, getResolvedShopId } from "../../utility/getHeader";

const { Text } = Typography;

export default function Units() {
  const [form] = Form.useForm();
  const [units, setUnits] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

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

  const loadUnits = async () => {
    setIsLoading(true);
    try {
      const rows = await fetchData("units", null, "id", {});
      setUnits(Array.isArray(rows) ? rows : []);
    } catch (error) {
      message.error("Failed to load units");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUnits();
  }, []);

  const onFinish = async (values) => {
    const shopId = getResolvedShopId();
    const name = (values.name || "").trim();
    const description = (values.description || "").trim();

    if (!name) {
      message.warning("Please enter unit name");
      return;
    }

    setIsSubmitting(true);
    try {
      await axios.post(
        "/insertdata/units",
        {
          name,
          description,
          ...(shopId ? { shop_id: shopId } : {}),
        },
        getScopedConfig()
      );

      message.success("Unit added successfully");
      form.resetFields();
      await loadUnits();
    } catch (error) {
      message.error("Failed to add unit");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`/deletebyid/units/id/${id}`, getScopedConfig());
      message.success("Unit deleted successfully");
      await loadUnits();
    } catch (error) {
      message.error("Failed to delete unit");
    }
  };

  const columns = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
      width: 90,
      sorter: (a, b) => Number(a.id || 0) - Number(b.id || 0),
      render: (value) => <Text>{value}</Text>,
    },
    {
      title: "Unit Name",
      dataIndex: "name",
      key: "name",
      sorter: (a, b) => String(a.name || "").localeCompare(String(b.name || "")),
      render: (value) => <Text strong>{value}</Text>,
    },
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
      render: (value) => <Text>{value || "-"}</Text>,
    },
    {
      title: "Action",
      key: "action",
      width: 120,
      render: (_, record) => (
        <Popconfirm
          title="Delete unit?"
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
      <Header title="Units" />
      <div style={{ padding: 16 }}>
        <Space direction="vertical" size={16} style={{ width: "100%" }}>
          <Card title="Add Unit">
            <Form form={form} layout="vertical" onFinish={onFinish}>
              <Form.Item
                label="Unit Name"
                name="name"
                rules={[{ required: true, message: "Unit name is required" }]}
              >
                <Input placeholder="Enter unit name" maxLength={100} />
              </Form.Item>

              <Form.Item label="Description" name="description">
                <Input placeholder="Enter description (optional)" maxLength={255} />
              </Form.Item>

              <Button type="primary" htmlType="submit" loading={isSubmitting}>
                Save Unit
              </Button>
            </Form>
          </Card>

          <Card title="Units List">
            <Table
              rowKey="id"
              columns={columns}
              dataSource={units}
              loading={isLoading}
              pagination={{ pageSize: 10 }}
            />
          </Card>
        </Space>
      </div>
    </Layout>
  );
}
