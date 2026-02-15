import React, { useEffect, useState } from "react";
import axios from "axios";
import { Modal as AntModal, Form, Input, Button, Tabs, Space, Typography, Select } from "antd";
import {
  UserOutlined,
  PhoneOutlined,
  MailOutlined,
  IdcardOutlined,
  HomeOutlined,
  SaveOutlined,
  PlusOutlined
} from "@ant-design/icons";
import fetchData from "../../functions/fetchData";
import { getHeaders } from "../../utility/getHeader";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const CustomerDetailsModal = ({ isOpen, onClose, onSaveCustomerDetails }) => {
  const [customer, setCustomer] = useState({ custid: "", name: "", phone: "", email: "" });
  const [newCustomer, setNewCustomer] = useState({ name: "", contact: "", email: "", taxid: "", address: "" });
  const [customers, setCustomers] = useState([]);
  const [activeTab, setActiveTab] = useState("existing");
  const [form] = Form.useForm();
  const [newForm] = Form.useForm();

  useEffect(() => {
    if (!isOpen) return;
    setCustomer({ custid: "", name: "", phone: "", email: "" });
    setNewCustomer({ name: "", contact: "", email: "", taxid: "", address: "" });
    form.resetFields();
    newForm.resetFields();
    setActiveTab("existing");

    const loadCustomers = async () => {
      try {
        const fetched = await fetchData("customers", null, "id", {});
        setCustomers(Array.isArray(fetched) ? fetched : []);
      } catch (error) {
        console.error("Error fetching customers:", error);
        toast.error("Failed to load customers");
        setCustomers([]);
      }
    };

    loadCustomers();
  }, [isOpen, form, newForm]);

  const handleCustomerSelect = (selectedId) => {
    const selectedCustomer = customers.find((item) => String(item.id) === String(selectedId));

    if (!selectedCustomer) {
      setCustomer({ custid: "", name: "", phone: "", email: "" });
      return;
    }

    setCustomer({
      custid: selectedCustomer.id || "",
      name: selectedCustomer.name || "",
      phone: selectedCustomer.contact || "",
      email: selectedCustomer.email || "",
    });
  };


  const handleSaveExisting = () => {
    if (!customer.name.trim() || !String(customer.phone || "").trim() || !customer.email.trim()) {
      toast.error("Please fill all fields!");
      return;
    }
    onSaveCustomerDetails(customer);
  };

  const handleAddNewCustomer = async () => {
    const payload = {
      name: newCustomer.name,
      contact: newCustomer.contact,
      email: newCustomer.email,
      taxid: newCustomer.taxid,
      address: newCustomer.address
    };

    if (!payload.name.trim() || !payload.contact.trim() || !payload.email.trim()) {
      toast.error("Please fill name, phone and email.");
      return;
    }

    try {
      const response = await axios.post("/insertdata/customers", payload, getHeaders());
      const newId = response?.data?.id || response?.data?.insertId || response?.data?.data?.id;

      const createdCustomer = {
        custid: newId || "",
        name: payload.name,
        phone: payload.contact,
        email: payload.email
      };

      toast.success("Customer added successfully!");
      setCustomer(createdCustomer);
      form.setFieldsValue({
        phone: createdCustomer.phone,
        name: createdCustomer.name,
        email: createdCustomer.email,
        custid: createdCustomer.custid
      });
      setActiveTab("existing");
      onSaveCustomerDetails(createdCustomer);
    } catch (error) {
      console.error("Error adding customer:", error);
      toast.error("Error in adding customer");
    }
  };

  return (
    <>
      <AntModal
        open={isOpen}
        onCancel={onClose}
        title="Customer Details"
        footer={null}
        width={720}
        centered
        zIndex={1300}
      >
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            {
              key: "existing",
              label: "Existing Customer",
              children: (
                <Form layout="vertical" form={form}>
                  <Space direction="vertical" size="middle" style={{ width: "100%" }}>
                    <Form.Item label="Select Customer" required>
                      <Select
                        showSearch
                        allowClear
                        placeholder="Select customer name"
                        value={customer.custid || undefined}
                        onChange={handleCustomerSelect}
                        optionFilterProp="label"
                        options={customers.map((item) => ({
                          value: item.id,
                          label: `${item.name || "-"}${item.contact ? ` (${item.contact})` : ""}`,
                        }))}
                      />
                    </Form.Item>
                    <Form.Item label="Customer ID">
                      <Input
                        prefix={<IdcardOutlined />}
                        value={customer.custid}
                        onChange={(e) => setCustomer({ ...customer, custid: e.target.value })}
                        placeholder="Customer ID"
                      />
                    </Form.Item>
                    <Form.Item label="Customer Name" required>
                      <Input
                        prefix={<UserOutlined />}
                        value={customer.name}
                        placeholder="Customer name"
                        readOnly
                      />
                    </Form.Item>
                    <Form.Item label="Customer Phone" required>
                      <Input
                        prefix={<PhoneOutlined />}
                        value={customer.phone}
                        placeholder="Phone number"
                        readOnly
                      />
                    </Form.Item>
                    <Form.Item label="Email" required>
                      <Input
                        prefix={<MailOutlined />}
                        value={customer.email}
                        placeholder="Email"
                        readOnly
                      />
                    </Form.Item>
                    <Space style={{ width: "100%", justifyContent: "flex-end" }}>
                      <Button onClick={onClose}>Cancel</Button>
                      <Button type="primary" icon={<SaveOutlined />} onClick={handleSaveExisting}>
                        Save & Continue
                      </Button>
                    </Space>
                  </Space>
                </Form>
              )
            },
            {
              key: "new",
              label: "Add New Customer",
              children: (
                <Form layout="vertical" form={newForm}>
                  <Space direction="vertical" size="middle" style={{ width: "100%" }}>
                    <Form.Item label="Customer Name" required>
                      <Input
                        prefix={<UserOutlined />}
                        value={newCustomer.name}
                        onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                        placeholder="Customer name"
                      />
                    </Form.Item>
                    <Form.Item label="Phone" required>
                      <Input
                        prefix={<PhoneOutlined />}
                        value={newCustomer.contact}
                        onChange={(e) => setNewCustomer({ ...newCustomer, contact: e.target.value })}
                        placeholder="Phone number"
                      />
                    </Form.Item>
                    <Form.Item label="Email" required>
                      <Input
                        prefix={<MailOutlined />}
                        value={newCustomer.email}
                        onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                        placeholder="Email"
                      />
                    </Form.Item>
                    <Form.Item label="Tax ID">
                      <Input
                        prefix={<IdcardOutlined />}
                        value={newCustomer.taxid}
                        onChange={(e) => setNewCustomer({ ...newCustomer, taxid: e.target.value })}
                        placeholder="Tax ID"
                      />
                    </Form.Item>
                    <Form.Item label="Address">
                      <Input
                        prefix={<HomeOutlined />}
                        value={newCustomer.address}
                        onChange={(e) => setNewCustomer({ ...newCustomer, address: e.target.value })}
                        placeholder="Address"
                      />
                    </Form.Item>
                    <Space style={{ width: "100%", justifyContent: "flex-end" }}>
                      <Button onClick={onClose}>Cancel</Button>
                      <Button type="primary" icon={<PlusOutlined />} onClick={handleAddNewCustomer}>
                        Add & Use
                      </Button>
                    </Space>
                  </Space>
                </Form>
              )
            }
          ]}
        />
        <Typography.Text type="secondary">
          Credit payments require customer details.
        </Typography.Text>
      </AntModal>
      <ToastContainer />
    </>
  );
};

export default CustomerDetailsModal;
