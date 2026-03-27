/* eslint-disable no-undef */

import React, { useEffect, useMemo, useState } from "react";
import { Button, Card, Form, Input, Popconfirm, Select, Space, Table, Tabs, Typography, message } from "antd";
import axios from "axios";
import Header from "../../components/Header";
import Layout from "../../layout/Layout";
import fetchData from "../../functions/fetchData";
import { getHeaders } from "../../utility/getHeader";

const { Text } = Typography;

export default function TableList() {
  const [formTables] = Form.useForm();
  const [formCategories] = Form.useForm();
  const [tables, setTables] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isSubmittingTable, setIsSubmittingTable] = useState(false);
  const [isSubmittingCategory, setIsSubmittingCategory] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const categoryMap = useMemo(() => {
    const map = new Map();
    categories.forEach((cat) => map.set(String(cat.id), cat.cat_name || ""));
    return map;
  }, [categories]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [tableRows, categoryRows] = await Promise.all([
        fetchData("tablelist", null, "id", {}),
        fetchData("table_category", null, "id", {}),
      ]);

      setTables(Array.isArray(tableRows) ? tableRows : []);
      setCategories(Array.isArray(categoryRows) ? categoryRows : []);
    } catch (error) {
      message.error("Failed to load data");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onFinishTable = async (values) => {
    const name = (values.name || "").trim();
    if (!name || !values.category) {
      message.warning("Please enter table name and select category");
      return;
    }

    setIsSubmittingTable(true);
    try {
      await axios.post(
        "/insertdata/tablelist",
        {
          name,
          category: values.category,
        },
        getHeaders()
      );
      message.success("Table added successfully");
      formTables.resetFields();
      await loadData();
    } catch (error) {
      message.error("Failed to add table");
    } finally {
      setIsSubmittingTable(false);
    }
  };

  const onFinishCategory = async (values) => {
    const catName = (values.cat_name || "").trim();
    if (!catName) {
      message.warning("Please enter category name");
      return;
    }

    setIsSubmittingCategory(true);
    try {
      await axios.post(
        "/insertdata/table_category",
        {
          cat_name: catName,
        },
        getHeaders()
      );
      message.success("Table category added successfully");
      formCategories.resetFields();
      await loadData();
    } catch (error) {
      message.error("Failed to add category");
    } finally {
      setIsSubmittingCategory(false);
    }
  };

  const handleDeleteTable = async (id) => {
    try {
      await axios.delete(`/deletebyid/tablelist/id/${id}`, getHeaders());
      message.success("Table deleted");
      await loadData();
    } catch (error) {
      message.error("Failed to delete table");
    }
  };

  const handleDeleteCategory = async (id) => {
    try {
      await axios.delete(`/deletebyid/table_category/id/${id}`, getHeaders());
      message.success("Category deleted");
      await loadData();
    } catch (error) {
      message.error("Failed to delete category");
    }
  };

  const tableColumns = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
      width: 90,
      sorter: (a, b) => Number(a.id || 0) - Number(b.id || 0),
      render: (value) => <Text>{value}</Text>,
    },
    {
      title: "Table Name",
      dataIndex: "name",
      key: "name",
      sorter: (a, b) => String(a.name || "").localeCompare(String(b.name || "")),
      render: (value) => <Text strong>{value}</Text>,
    },
    {
      title: "Category",
      dataIndex: "category",
      key: "category",
      sorter: (a, b) => {
        const nameA = categoryMap.get(String(a.category || "")) || "";
        const nameB = categoryMap.get(String(b.category || "")) || "";
        return nameA.localeCompare(nameB);
      },
      render: (value) => categoryMap.get(String(value)) || `Category #${value}`,
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      sorter: (a, b) => String(a.status || "").localeCompare(String(b.status || "")),
      render: (value) => (value === "active" ? <Text type="success">Active</Text> : <Text type="secondary">Inactive</Text>),
    },
    {
      title: "Action",
      key: "action",
      fixed: "right",
      width: 130,
      render: (_, record) => (
        <Popconfirm
          title="Delete table?"
          onConfirm={() => handleDeleteTable(record.id)}
          okText="Delete"
          cancelText="Cancel"
        >
          <Button danger size="small">Delete</Button>
        </Popconfirm>
      ),
    },
  ];

  const categoryColumns = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
      width: 90,
      sorter: (a, b) => Number(a.id || 0) - Number(b.id || 0),
      render: (value) => <Text>{value}</Text>,
    },
    {
      title: "Category Name",
      dataIndex: "cat_name",
      key: "cat_name",
      sorter: (a, b) => String(a.cat_name || "").localeCompare(String(b.cat_name || "")),
      render: (value) => <Text strong>{value}</Text>,
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      sorter: (a, b) => String(a.status || "").localeCompare(String(b.status || "")),
      render: (value) => (value === "active" ? <Text type="success">Active</Text> : <Text type="secondary">Inactive</Text>),
    },
    {
      title: "Action",
      key: "action",
      fixed: "right",
      width: 130,
      render: (_, record) => (
        <Popconfirm
          title="Delete category?"
          onConfirm={() => handleDeleteCategory(record.id)}
          okText="Delete"
          cancelText="Cancel"
        >
          <Button danger size="small">Delete</Button>
        </Popconfirm>
      ),
    },
  ];

  const tabItems = [
    {
      key: "1",
      label: "Tables",
      children: (
        <Space direction="vertical" size={16} style={{ width: "100%" }}>
          <Card title="Add New Table">
            <Form form={formTables} layout="vertical" onFinish={onFinishTable}>
              <Form.Item
                label="Table Name"
                name="name"
                rules={[{ required: true, message: "Table name is required" }]}
              >
                <Input placeholder="Enter table name (e.g., Table 1, VIP Table)" maxLength={100} />
              </Form.Item>
              <Form.Item
                label="Table Category"
                name="category"
                rules={[{ required: true, message: "Please select a category" }]}
              >
                <Select
                  placeholder="Select table category"
                  options={categories.map((cat) => ({
                    label: cat.cat_name,
                    value: cat.id,
                  }))}
                  showSearch
                  optionFilterProp="label"
                />
              </Form.Item>
              <Button type="primary" htmlType="submit" loading={isSubmittingTable}>
                Save Table
              </Button>
            </Form>
          </Card>

          <Card title="Table List">
            <Table
              rowKey="id"
              columns={tableColumns}
              dataSource={tables}
              loading={isLoading}
              pagination={{ pageSize: 10 }}
              showSorterTooltip={{ target: "sorter-icon" }}
              scroll={{ x: 1000 }}
            />
          </Card>
        </Space>
      ),
    },
    {
      key: "2",
      label: "Table Categories",
      children: (
        <Space direction="vertical" size={16} style={{ width: "100%" }}>
          <Card title="Add New Table Category">
            <Form form={formCategories} layout="vertical" onFinish={onFinishCategory}>
              <Form.Item
                label="Category Name"
                name="cat_name"
                rules={[{ required: true, message: "Category name is required" }]}
              >
                <Input placeholder="Enter category name (e.g., Indoor, Outdoor, VIP)" maxLength={100} />
              </Form.Item>
              <Button type="primary" htmlType="submit" loading={isSubmittingCategory}>
                Save Category
              </Button>
            </Form>
          </Card>

          <Card title="Category List">
            <Table
              rowKey="id"
              columns={categoryColumns}
              dataSource={categories}
              loading={isLoading}
              pagination={{ pageSize: 10 }}
              showSorterTooltip={{ target: "sorter-icon" }}
              scroll={{ x: 800 }}
            />
          </Card>
        </Space>
      ),
    },
  ];

  return (
    <Layout>
      <Header title="Table Management" />
      <div style={{ padding: 16 }}>
        <Tabs items={tabItems} type="card" />
      </div>
    </Layout>
  );
}
