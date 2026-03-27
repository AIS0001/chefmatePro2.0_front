/* eslint-disable no-undef */

import React, { useEffect, useState } from "react";
import { Button, Card, Form, Input, Popconfirm, Space, Table, Typography, message } from "antd";
import axios from "axios";
import { getHeaders } from "../../utility/getHeader";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Header from "../../components/Header";
import Layout from "../../layout/Layout";
import fetchData from "../../functions/fetchData";

const { Text } = Typography;

export default function Customers() {
  const [form] = Form.useForm();
  const [customers, setCustomers] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const loadCustomers = async () => {
    setIsLoading(true);
    try {
      const rows = await fetchData("customers", null, "id", {});
      setCustomers(Array.isArray(rows) ? rows : []);
    } catch (error) {
      message.error("Failed to load customers");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  const onFinish = async (values) => {
    const name = (values.name || "").trim();
    if (!name) {
      message.warning("Please enter customer name");
      return;
    }

    setIsSubmitting(true);
    try {
      await axios.post(
        "/insertdata/customers",
        {
          name: values.name,
          contact: values.contact || "",
          email: values.email || "",
          taxid: values.taxid || "",
          address: values.address || "",
        },
        getHeaders()
      );
      message.success("Customer added successfully");
      form.resetFields();
      await loadCustomers();
    } catch (error) {
      message.error("Failed to add customer");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`/deletebyid/customers/id/${id}`, getHeaders());
      message.success("Customer deleted");
      await loadCustomers();
    } catch (error) {
      message.error("Failed to delete customer");
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
      render: (value) => <Text strong>{value}</Text>,
    },
    {
      title: "Contact",
      dataIndex: "contact",
      key: "contact",
      sorter: (a, b) => String(a.contact || "").localeCompare(String(b.contact || "")),
      render: (value) => value || "N/A",
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
      sorter: (a, b) => String(a.email || "").localeCompare(String(b.email || "")),
      render: (value) => value || "N/A",
    },
    {
      title: "Tax ID",
      dataIndex: "taxid",
      key: "taxid",
      sorter: (a, b) => String(a.taxid || "").localeCompare(String(b.taxid || "")),
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
          title="Delete customer?"
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
      <Header title="Customers" />
      <ToastContainer />
      <div style={{ padding: 16 }}>
        <Space direction="vertical" size={16} style={{ width: "100%" }}>
          <Card title="Add New Customer">
            <Form form={form} layout="vertical" onFinish={onFinish}>
              <Form.Item
                label="Customer Name"
                name="name"
                rules={[{ required: true, message: "Customer name is required" }]}
              >
                <Input placeholder="Enter customer name" maxLength={100} />
              </Form.Item>
              <Form.Item
                label="Contact"
                name="contact"
              >
                <Input placeholder="Enter contact number" maxLength={20} />
              </Form.Item>
              <Form.Item
                label="Email"
                name="email"
              >
                <Input type="email" placeholder="Enter email address" maxLength={100} />
              </Form.Item>
              <Form.Item
                label="Tax ID"
                name="taxid"
              >
                <Input placeholder="Enter tax ID (if any)" maxLength={50} />
              </Form.Item>
              <Form.Item
                label="Address"
                name="address"
              >
                <Input.TextArea placeholder="Enter address" rows={3} maxLength={200} />
              </Form.Item>
              <Button type="primary" htmlType="submit" loading={isSubmitting}>
                Save Customer
              </Button>
            </Form>
          </Card>

          <Card title="Customer List">
            <Table
              rowKey="id"
              columns={columns}
              dataSource={customers}
              loading={isLoading}
              pagination={{ pageSize: 10 }}
              showSorterTooltip={{ target: "sorter-icon" }}
              scroll={{ x: 1000 }}
            />
          </Card>
        </Space>
      </div>
    </Layout>
  );
}
