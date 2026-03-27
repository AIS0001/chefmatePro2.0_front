import React, { useEffect, useState } from "react";
import { Button, Card, Form, Input, Popconfirm, Space, Table, Typography, message } from "antd";
import axios from "axios";
import Header from "../../components/Header";
import Layout from "../../layout/Layout";
import fetchData from "../../functions/fetchData";
import { getHeaders } from "../../utility/getHeader";

const { Text } = Typography;

export default function Categories() {
  const [form] = Form.useForm();
  const [categories, setCategories] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const loadCategories = async () => {
    setIsLoading(true);
    try {
      const rows = await fetchData("categories", null, "id", {});
      setCategories(Array.isArray(rows) ? rows : []);
    } catch (error) {
      message.error("Failed to load categories");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const onFinish = async (values) => {
    const name = (values.name || "").trim();
    if (!name) {
      message.warning("Please enter category name");
      return;
    }

    setIsSubmitting(true);
    try {
      await axios.post(
        "/insertdata/categories",
        { name },
        getHeaders()
      );
      message.success("Category added successfully");
      form.resetFields();
      await loadCategories();
    } catch (error) {
      message.error("Failed to add category");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`/deletebyid/categories/id/${id}`, getHeaders());
      message.success("Category deleted");
      await loadCategories();
    } catch (error) {
      message.error("Failed to delete category");
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
      title: "Category",
      dataIndex: "name",
      key: "name",
      sorter: (a, b) => String(a.name || "").localeCompare(String(b.name || "")),
      render: (value) => <Text strong>{value}</Text>,
    },
    {
      title: "Action",
      key: "action",
      width: 130,
      render: (_, record) => (
        <Popconfirm
          title="Delete category?"
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
      <Header title="Categories" />
      <div style={{ padding: 16 }}>
        <Space direction="vertical" size={16} style={{ width: "100%" }}>
          <Card title="Add Category">
            <Form form={form} layout="vertical" onFinish={onFinish}>
              <Form.Item
                label="Category Name"
                name="name"
                rules={[{ required: true, message: "Category name is required" }]}
              >
                <Input placeholder="Enter category name" maxLength={100} />
              </Form.Item>
              <Button type="primary" htmlType="submit" loading={isSubmitting}>
                Save Category
              </Button>
            </Form>
          </Card>

          <Card title="Category List">
            <Table
              rowKey="id"
              columns={columns}
              dataSource={categories}
              loading={isLoading}
              pagination={{ pageSize: 10 }}
            />
          </Card>
        </Space>
      </div>
    </Layout>
  );
}
