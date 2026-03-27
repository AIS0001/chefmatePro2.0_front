import React, { useEffect, useMemo, useState } from "react";
import { Button, Card, Form, Input, Popconfirm, Select, Space, Table, Typography, message } from "antd";
import axios from "axios";
import Header from "../../components/Header";
import Layout from "../../layout/Layout";
import fetchData from "../../functions/fetchData";
import { getHeaders } from "../../utility/getHeader";

const { Text } = Typography;

export default function SubCategories() {
  const [form] = Form.useForm();
  const [subcategories, setSubcategories] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const categoryMap = useMemo(() => {
    const map = new Map();
    categories.forEach((item) => map.set(String(item.id), item.name));
    return map;
  }, [categories]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [subcategoryRows, categoryRows] = await Promise.all([
        fetchData("subcategory", null, "id", {}),
        fetchData("categories", null, "id", {}),
      ]);

      setSubcategories(Array.isArray(subcategoryRows) ? subcategoryRows : []);
      setCategories(Array.isArray(categoryRows) ? categoryRows : []);
    } catch (error) {
      message.error("Failed to load subcategory data");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onFinish = async (values) => {
    const subcat = (values.subcat || "").trim();
    if (!values.cat_id || !subcat) {
      message.warning("Category and subcategory are required");
      return;
    }

    setIsSubmitting(true);
    try {
      await axios.post(
        "/insertdata/subcategory",
        {
          cat_id: values.cat_id,
          subcat,
        },
        getHeaders()
      );
      message.success("Subcategory added successfully");
      form.setFieldsValue({ subcat: "" });
      await loadData();
    } catch (error) {
      message.error("Failed to add subcategory");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`/deletebyid/subcategory/id/${id}`, getHeaders());
      message.success("Subcategory deleted");
      await loadData();
    } catch (error) {
      message.error("Failed to delete subcategory");
    }
  };

  const columns = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
      width: 90,
      sorter: (a, b) => Number(a.id || 0) - Number(b.id || 0),
    },
    {
      title: "Category",
      dataIndex: "cat_id",
      key: "cat_id",
      sorter: (a, b) => {
        const nameA = categoryMap.get(String(a.cat_id || "")) || "";
        const nameB = categoryMap.get(String(b.cat_id || "")) || "";
        return nameA.localeCompare(nameB);
      },
      render: (value) => categoryMap.get(String(value)) || `Category #${value}`,
    },
    {
      title: "Subcategory",
      dataIndex: "subcat",
      key: "subcat",
      sorter: (a, b) => String(a.subcat || "").localeCompare(String(b.subcat || "")),
      render: (value) => <Text strong>{value}</Text>,
    },
    {
      title: "Action",
      key: "action",
      width: 130,
      render: (_, record) => (
        <Popconfirm
          title="Delete subcategory?"
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
      <Header title="Subcategories" />
      <div style={{ padding: 16 }}>
        <Space direction="vertical" size={16} style={{ width: "100%" }}>
          <Card title="Add Subcategory">
            <Form form={form} layout="vertical" onFinish={onFinish}>
              <Form.Item
                label="Category"
                name="cat_id"
                rules={[{ required: true, message: "Please select category" }]}
              >
                <Select
                  placeholder="Select category"
                  options={categories.map((item) => ({
                    label: item.name,
                    value: item.id,
                  }))}
                  showSearch
                  optionFilterProp="label"
                />
              </Form.Item>
              <Form.Item
                label="Subcategory Name"
                name="subcat"
                rules={[{ required: true, message: "Subcategory name is required" }]}
              >
                <Input placeholder="Enter subcategory name" maxLength={100} />
              </Form.Item>
              <Button type="primary" htmlType="submit" loading={isSubmitting}>
                Save Subcategory
              </Button>
            </Form>
          </Card>

          <Card title="Subcategory List">
            <Table
              rowKey="id"
              columns={columns}
              dataSource={subcategories}
              loading={isLoading}
              pagination={{ pageSize: 10 }}
            />
          </Card>
        </Space>
      </div>
    </Layout>
  );
}
