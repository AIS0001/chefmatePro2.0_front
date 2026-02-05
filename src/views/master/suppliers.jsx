/* eslint-disable no-undef */

import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { getHeaders } from "../../utility/getHeader";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import Header from "../../components/Header";
import Layout from "../../layout/Layout";
import { format } from "date-fns";

import { Table, Card, Row, Col, Form, Input, Button, Alert, Progress, Space, Popconfirm } from "antd";
import fetchData from "../../functions/fetchData";
import deleteRecord from "../../functions/delateData";

// Feature Control imports
import { useSubscription } from "../../Context/SubscriptionContext";

export default function Suppliers() {
  let currentDate = format(new Date(), "yyyy-MM-dd");
  //  const headers = { Authorization: authheader().access_token };
  const [data, setData] = useState([]);
  const [errors, setErrors] = useState({});
  const [form] = Form.useForm();
  
  // Feature Control
  const supplierCount = data.length;

  const tableColumns = [
    { title: "ID", dataIndex: "id", key: "id" },
    { title: "Name", dataIndex: "name", key: "name" },
    { title: "Company Name", dataIndex: "company_name", key: "company_name" },
    { title: "Contact", dataIndex: "contact", key: "contact" },
    { title: "Email", dataIndex: "email", key: "email" },
    { title: "Tax ID", dataIndex: "taxid", key: "taxid" },
    { title: "Address", dataIndex: "address", key: "address" },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space>
          <Popconfirm
            title="Delete supplier"
            description="Are you sure you want to delete this supplier?"
            onConfirm={() => handleDeleteSupplier(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button danger size="small">Delete</Button>
          </Popconfirm>
        </Space>
      )
    }
  ];

  const handleSubmit = async (values) => {
    const payload = values || {};

    try {
      await axios.post(
        "/insertdata/suppliers",
        {
          name: payload.name,
          company_name: payload.company_name,
          contact: payload.contact,
          email: payload.email,
          taxid: payload.taxid,
          address: payload.address,
        },
        getHeaders()
      );

      // Fetch the updated data after successful submission
      await fetchData("suppliers", setData, "id", {});

      toast.success("Supplier added successfully!");
      form.resetFields();
    } catch (err) {
      toast.error("Error in adding category");
      console.error(err.message);
    }
    setErrors({});
  };

  const handleDeleteSupplier = async (supplierId) => {
    try {
      await deleteRecord("suppliers", "id", supplierId);
      await fetchData("suppliers", setData, "id", {});
      toast.success("Supplier deleted successfully!");
    } catch (error) {
      toast.error(error.message || "Failed to delete supplier");
    }
  };

  //Fetch data query
  const handleFilter = (field) => {
    // Show a filter UI or perform a filtering action based on the clicked field
    console.log(`Filter clicked for: ${field}`);
  };

  useEffect(() => {
    const fetchAndSetData = async () => {
      try {
        await fetchData("suppliers", setData, "id", {});
        console.log("Fetched data:", data); // Add this line for debugging
      } catch (error) {
        console.error("Error in useEffect:", error);
      }
    };

    fetchAndSetData();
  }, []);
  return (
    <>
      <Layout>
        <Header title="Supplier Management" />
        <ToastContainer />
        
          <Row gutter={[16, 16]}>
            <Col xs={24} md={10} lg={8}>
              <Card title="Add New Supplier" bordered>
                <Form
                  form={form}
                  layout="vertical"
                  onFinish={handleSubmit}
                >
                  <Form.Item label="Supplier Name" name="name" rules={[{ required: true, message: "Enter supplier name" }]}> 
                    <Input placeholder="Supplier Name" />
                  </Form.Item>
                  <Form.Item label="Company Name" name="company_name">
                    <Input placeholder="Company Name" />
                  </Form.Item>
                  <Form.Item label="Contact" name="contact">
                    <Input placeholder="Contact" />
                  </Form.Item>
                  <Form.Item label="Email" name="email">
                    <Input placeholder="Email" />
                  </Form.Item>
                  <Form.Item label="Tax ID (if Any)" name="taxid">
                    <Input placeholder="Tax ID" />
                  </Form.Item>
                  <Form.Item label="Address" name="address">
                    <Input placeholder="Address" />
                  </Form.Item>
                  <Form.Item>
                    <Button type="primary" htmlType="submit">
                      Save Supplier
                    </Button>
                  </Form.Item>
                </Form>
              </Card>
            </Col>
            
            <Col xs={24} md={14} lg={16} id="tableid">
              <Card title="Supplier List" bordered>
                {data.length === 0 ? (
                  <Alert type="info" showIcon message="No suppliers found" description="Add your first supplier to get started." />
                ) : (
                  <Table
                    columns={tableColumns}
                    dataSource={data}
                    rowKey="id"
                    pagination={{ pageSize: 20 }}
                    size="small"
                  />
                )}
              </Card>
            </Col>
          </Row>
      </Layout>
    </>
  );
}
