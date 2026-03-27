import React, { useEffect, useMemo, useState } from "react";
import { Button, Card, Form, Input, Popconfirm, Select, Space, Table, Tabs, Typography, message } from "antd";
import axios from "axios";
import Header from "../../components/Header";
import Layout from "../../layout/Layout";
import fetchData from "../../functions/fetchData";
import { getHeaders } from "../../utility/getHeader";

const { Text } = Typography;

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

export function CategoryMaster({ defaultTab = "categories" }) {
  const [categoryForm] = Form.useForm();
  const [subcategoryForm] = Form.useForm();
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmittingSubcategory, setIsSubmittingSubcategory] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const categoryMap = useMemo(() => {
    const map = new Map();
    categories.forEach((item) => map.set(String(item.id), item.name));
    return map;
  }, [categories]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [categoryRows, subcategoryRows] = await Promise.all([
        fetchData("categories", null, "id", {}),
        fetchData("subcategory", null, "id", {}),
      ]);
      setCategories(Array.isArray(categoryRows) ? categoryRows : []);
      setSubcategories(Array.isArray(subcategoryRows) ? subcategoryRows : []);
    } catch (error) {
      message.error("Failed to load category data");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onFinishCategory = async (values) => {
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
      categoryForm.resetFields();
      await loadData();
    } catch (error) {
      message.error("Failed to add category");
    } finally {
      setIsSubmitting(false);
    }
  };

  const onFinishSubcategory = async (values) => {
    const subcat = (values.subcat || "").trim();
    if (!values.cat_id || !subcat) {
      message.warning("Category and subcategory are required");
      return;
    }

    setIsSubmittingSubcategory(true);
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
      subcategoryForm.resetFields(["subcat"]);
      await loadData();
    } catch (error) {
      message.error("Failed to add subcategory");
    } finally {
      setIsSubmittingSubcategory(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`/deletebyid/categories/id/${id}`, getHeaders());
      message.success("Category deleted");
      await loadData();
    } catch (error) {
      message.error("Failed to delete category");
    }
  };

  const handleDeleteSubcategory = async (id) => {
    try {
      await axios.delete(`/deletebyid/subcategory/id/${id}`, getHeaders());
      message.success("Subcategory deleted");
      await loadData();
    } catch (error) {
      message.error("Failed to delete subcategory");
    }
  };

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
      title: "Category",
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

  const subcategoryColumns = [
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
      render: (value) => <Text strong style={{ color: "#144d7a" }}>{value}</Text>,
    },
    {
      title: "Action",
      key: "action",
      width: 130,
      render: (_, record) => (
        <Popconfirm
          title="Delete subcategory?"
          onConfirm={() => handleDeleteSubcategory(record.id)}
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
      key: "categories",
      label: "Categories",
      children: (
        <Space direction="vertical" size={18} style={{ width: "100%" }}>
          <Card title="Add Category" style={softCardStyle} bodyStyle={{ paddingBottom: 10 }}>
            <Form form={categoryForm} layout="vertical" onFinish={onFinishCategory}>
              <Form.Item
                label="Category Name"
                name="name"
                rules={[{ required: true, message: "Category name is required" }]}
              >
                <Input placeholder="Enter category name" maxLength={100} style={{ borderRadius: 12 }} />
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
                Save Category
              </Button>
            </Form>
          </Card>

          <Card title="Category List" style={softCardStyle}>
            <Table
              rowKey="id"
              columns={categoryColumns}
              dataSource={categories}
              loading={isLoading}
              pagination={{ pageSize: 10 }}
            />
          </Card>
        </Space>
      ),
    },
    {
      key: "subcategories",
      label: "Subcategories",
      children: (
        <Space direction="vertical" size={18} style={{ width: "100%" }}>
          <Card title="Add Subcategory" style={softCardStyle} bodyStyle={{ paddingBottom: 10 }}>
            <Form form={subcategoryForm} layout="vertical" onFinish={onFinishSubcategory}>
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
                <Input placeholder="Enter subcategory name" maxLength={100} style={{ borderRadius: 12 }} />
              </Form.Item>

              <Button
                type="primary"
                htmlType="submit"
                loading={isSubmittingSubcategory}
                style={{
                  borderRadius: 12,
                  background: "linear-gradient(135deg, #69c0ff 0%, #ffd666 100%)",
                  border: "none",
                  color: "#12324a",
                  fontWeight: 600,
                }}
              >
                Save Subcategory
              </Button>
            </Form>
          </Card>

          <Card title="Subcategory List" style={softCardStyle}>
            <Table
              rowKey="id"
              columns={subcategoryColumns}
              dataSource={subcategories}
              loading={isLoading}
              pagination={{ pageSize: 10 }}
            />
          </Card>
        </Space>
      ),
    },
  ];

  return (
    <Layout>
      <Header title="Category Management" />
      <div style={pageStyles}>
        <Space direction="vertical" size={18} style={{ width: "100%" }}>
          <div style={headerAccentStyle}>
            <Typography.Title level={4} style={{ margin: 0, color: "#16324f" }}>
              Categories And Subcategories
            </Typography.Title>
            <Text style={{ color: "#45607a" }}>
              Organize your menu structure from one place with separate tabs for categories and subcategories.
            </Text>
          </div>

          <Tabs defaultActiveKey={defaultTab} items={tabItems} type="card" />
        </Space>
      </div>
    </Layout>
  );
}

export default function Categories() {
  return <CategoryMaster defaultTab="categories" />;
}
