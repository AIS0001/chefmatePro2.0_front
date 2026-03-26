/* eslint-disable no-undef */

import React, { useEffect, useState } from "react";
import fetchData from "../../functions/fetchData";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axios from "axios";
import { getAuthToken, getHeaders } from "../../utility/getHeader";
import { EditOutlined, DeleteOutlined } from "@ant-design/icons";
import { Button, Card, Col, Form, Input, InputNumber, Modal, Popconfirm, Row, Select, Space, Table, Tooltip } from "antd";
import Header from "../../components/Header";
import Layout from "../../layout/Layout";
import updateData from "../../functions/updateData";
import deleteRecord from "../../functions/delateData";

export default function Vouchers() {
    const [customers, setCustomers] = useState([]);
    const [selectedCustomer, setSelectedCustomer] = useState("");
    const [outstandingAmount, setOutstandingAmount] = useState(0);
    const [paymentAmount, setPaymentAmount] = useState("");
    const [discount, setDiscount] = useState("");
    const [paymentMode, setPaymentMode] = useState("");
    const [referenceNumber, setReferenceNumber] = useState("");
    const [remarks, setRemarks] = useState("");
    const [balanceAfterPayment, setBalanceAfterPayment] = useState(0);
    const [invoices, setInvoices] = useState([]);
    const [selectedInvoice, setSelectedInvoice] = useState("");
    const [data, setData] = useState([]);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingRecord, setEditingRecord] = useState(null);
    const [editFormData, setEditFormData] = useState({
        payment_date: "",
        payment_mode: "",
        amount_paid: "",
        discount_amount: "",
        reference_id: "",
        remarks: "",
    });
    const formatTHB = (amount) =>
        new Intl.NumberFormat("th-TH", {
            style: "currency",
            currency: "THB",
            minimumFractionDigits: 2,
        }).format(Number(amount) || 0);

    const logApiDebug = (label, endpoint, payload) => {
        const token = getAuthToken();
        const tokenPreview = token ? `${token.slice(0, 12)}...` : "NO_TOKEN";
        console.log(`[VOUCHER DEBUG] ${label}`);
        console.log("[VOUCHER DEBUG] baseURL:", axios.defaults.baseURL);
        console.log("[VOUCHER DEBUG] endpoint:", endpoint);
        console.log("[VOUCHER DEBUG] fullURL:", `${axios.defaults.baseURL}${endpoint}`);
        console.log("[VOUCHER DEBUG] token:", tokenPreview);
        console.log("[VOUCHER DEBUG] payload:", payload);
    };

    const logApiError = (label, error) => {
        console.error(`[VOUCHER DEBUG] ${label} failed`);
        console.error("[VOUCHER DEBUG] code:", error?.code);
        console.error("[VOUCHER DEBUG] message:", error?.message);
        console.error("[VOUCHER DEBUG] status:", error?.response?.status);
        console.error("[VOUCHER DEBUG] response:", error?.response?.data);
        console.error("[VOUCHER DEBUG] request URL:", error?.config?.url);
        console.error("[VOUCHER DEBUG] request method:", error?.config?.method);
    };

    const columns = [
        { title: "Txn ID", dataIndex: "transaction_id", key: "transaction_id" },
        { title: "Cust ID", dataIndex: "customer_id", key: "customer_id" },
        { title: "Date", dataIndex: "payment_date", key: "payment_date" },
        { title: "Mode", dataIndex: "payment_mode", key: "payment_mode" },
        {
            title: "Paid Amount",
            dataIndex: "amount_paid",
            key: "amount_paid",
            render: (value) => formatTHB(value),
        },
        {
            title: "Discount",
            key: "discount_amount",
            render: (_, record) => formatTHB(record.discount_amount || record.discount || 0),
        },
        { title: "Ref ID", dataIndex: "reference_id", key: "reference_id" },
        {
            title: "Action",
            key: "action",
            render: (_, record) => (
                <Space>
                    <Tooltip title="Edit Voucher">
                        <Button
                            type="text"
                            icon={<EditOutlined />}
                            onClick={() => handleEditClick(record)}
                        />
                    </Tooltip>
                    <Popconfirm
                        title="Delete this voucher?"
                        description="This will remove matching ledger entries as well."
                        okText="Delete"
                        cancelText="Cancel"
                        onConfirm={() => handleDeleteVoucher(record)}
                    >
                        <Tooltip title="Delete Voucher">
                            <Button type="text" danger icon={<DeleteOutlined />} />
                        </Tooltip>
                    </Popconfirm>
                </Space>
            ),
        },
    ];
    // Fetch customers when component loads
    useEffect(() => {
        // fetchData("customers", setCustomers);
        fetchData("customers", setCustomers, "id", {});
    }, []);
    const getOutStandingBalance = async (customerId) => {
        setSelectedCustomer(customerId);

        if (!customerId) {
            setOutstandingAmount(0);
            setInvoices([]);
            return;
        }

        try {
            const response = await axios.get(`/getcustomeroutstandingledger/${customerId}`, getHeaders());
            const ledgerOutstanding = Number(response?.data?.outstanding_balance) || 0;
            setOutstandingAmount(ledgerOutstanding);
            setInvoices([]);
        } catch (error) {
            console.error("Error fetching customer outstanding from ledger:", error);
            setOutstandingAmount(0);
            setInvoices([]);
            toast.error("Error fetching customer outstanding balance.");
        }
    };
    useEffect(() => {
        const remaining = outstandingAmount - (parseFloat(paymentAmount) || 0) - (parseFloat(discount) || 0);
        setBalanceAfterPayment(remaining >= 0 ? remaining : 0);
    }, [paymentAmount, discount, outstandingAmount]);

    // Update remaining balance after payment
    const handleEditClick = (record) => {
        setEditingRecord(record);
        setEditFormData({
            payment_date: record.payment_date || "",
            payment_mode: record.payment_mode || "",
            amount_paid: record.amount_paid || 0,
            discount_amount: record.discount_amount || record.discount || 0,
            reference_id: record.reference_id || "",
            remarks: record.remarks || "",
        });
        setIsEditModalOpen(true);
    };

    const handleEditFieldChange = (field, value) => {
        setEditFormData((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    const handleUpdateVoucher = async () => {
        if (!editingRecord?.id) {
            toast.error("Invalid voucher record selected");
            return;
        }

        const amountPaid = parseFloat(editFormData.amount_paid) || 0;
        const discountAmount = parseFloat(editFormData.discount_amount) || 0;

        try {
            const payload = {
                receipt_voucher_id: editingRecord.id,
                ledger_reference_id: editingRecord.reference_id || editingRecord.id,
                customer_id: editingRecord.customer_id,
                amount_paid: amountPaid,
                payment_mode: editFormData.payment_mode,
                discount_amount: discountAmount,
                reference_number: editFormData.reference_id || null,
                remarks: editFormData.remarks || null,
            };

            logApiDebug("UPDATE_PAYMENT_LEDGER_REQUEST", "/updatepaymentledger", payload);

            try {
                await axios.put("/updatepaymentledger", payload, getHeaders());
            } catch (apiError) {
                logApiError("UPDATE_PAYMENT_LEDGER", apiError);
                const isNetworkLike =
                    apiError?.code === "ERR_NETWORK" ||
                    apiError?.message === "Network Error" ||
                    !apiError?.response;

                if (!isNetworkLike) {
                    throw apiError;
                }

                console.warn("[VOUCHER DEBUG] Falling back to /updatedata endpoints");

                await updateData(
                    "receipt_vouchers",
                    {
                        payment_mode: editFormData.payment_mode,
                        amount_paid: amountPaid,
                        discount_amount: discountAmount,
                        reference_id: editFormData.reference_id || null,
                        remarks: editFormData.remarks || null,
                    },
                    { id: editingRecord.id }
                );

                await updateData(
                    "ledger_entries",
                    {
                        account_type: editFormData.payment_mode,
                        account_id: 0,
                        debit_amount: amountPaid,
                        credit_amount: 0,
                        discount_amount: discountAmount,
                    },
                    { reference_id: payload.ledger_reference_id, description: "Customer Payment Received" }
                );

                await updateData(
                    "ledger_entries",
                    {
                        account_type: "Account Recievable",
                        account_id: editingRecord.customer_id,
                        debit_amount: 0,
                        credit_amount: amountPaid,
                        discount_amount: discountAmount,
                    },
                    { reference_id: payload.ledger_reference_id, description: "Credit Paid" }
                );
            }

            await fetchData("receipt_vouchers", setData, "id", {});
            setIsEditModalOpen(false);
            setEditingRecord(null);
            toast.success("Voucher updated successfully");
        } catch (error) {
            logApiError("UPDATE_VOUCHER", error);
            console.error("Error updating voucher:", error);
            toast.error(error?.response?.data?.message || "Failed to update voucher");
        }
    };

    const handleDeleteVoucher = async (record) => {
        if (!record?.id) {
            toast.error("Invalid voucher record selected");
            return;
        }

        try {
            const payload = {
                receipt_voucher_id: record.id,
                ledger_reference_id: record.reference_id || record.id,
            };

            logApiDebug("DELETE_PAYMENT_LEDGER_REQUEST", "/deletepaymentledger", payload);

            try {
                await axios.delete("/deletepaymentledger", {
                    ...getHeaders(),
                    data: payload,
                });
            } catch (apiError) {
                logApiError("DELETE_PAYMENT_LEDGER", apiError);
                const isNetworkLike =
                    apiError?.code === "ERR_NETWORK" ||
                    apiError?.message === "Network Error" ||
                    !apiError?.response;

                if (!isNetworkLike) {
                    throw apiError;
                }

                console.warn("[VOUCHER DEBUG] Falling back to /deletebyid endpoints");

                await deleteRecord("ledger_entries", "reference_id", payload.ledger_reference_id);
                await deleteRecord("receipt_vouchers", "id", payload.receipt_voucher_id);
            }

            await fetchData("receipt_vouchers", setData, "id", {});
            toast.success("Voucher deleted successfully");
        } catch (error) {
            logApiError("DELETE_VOUCHER", error);
            console.error("Error deleting voucher:", error);
            toast.error(error?.response?.data?.message || error?.message || "Failed to delete voucher");
        }
    };

    const handleSubmit = async () => {
        const normalizedCustomerId = Number(selectedCustomer) || 0;
        const discountValue = parseFloat(discount) || 0;
        const amountValue = parseFloat(paymentAmount) || 0;

        if (!normalizedCustomerId) {
            toast.error("Please select a customer");
            return;
        }

        if (!paymentMode) {
            toast.error("Please select payment mode");
            return;
        }

        if (outstandingAmount <= 0) {
            toast.error("No outstanding invoices for selected customer.");
            return;
        }

        if (amountValue <= 0) {
            toast.error("Amount paid must be greater than 0");
            return;
        }

        if (amountValue > outstandingAmount) {
            toast.error("Amount paid cannot exceed outstanding balance");
            return;
        }

        if (discountValue < 0) {
            toast.error("Discount cannot be negative");
            return;
        }

        const paymentData = {
            customer_id: normalizedCustomerId,
            amount_paid: amountValue,
            discount: discountValue,
            discount_amount: discountValue,
            reference_number: referenceNumber || null,
            payment_mode: paymentMode,
        };
            // alert(paymentData.customer_id);
            // alert(paymentData.amount_paid);
            // alert(paymentData.reference_number);
        try {
          //  logApiDebug("SAVE_PAYMENT_REQUEST", "/savepayment", paymentData);
            await axios.post( "/savepayment", paymentData, getHeaders());
            // Send the data to the backend using POST
            await fetchData("receipt_vouchers", setData, "id", {});

                        setSelectedCustomer("");
                        setOutstandingAmount(0);
                        setPaymentAmount("");
                        setDiscount("");
                        setPaymentMode("");
                        setReferenceNumber("");
                        setRemarks("");
                        setBalanceAfterPayment(0);
                        setInvoices([]);
                        setSelectedInvoice("");

            toast.success("Payment recorded successfully!");
        } catch (error) {
            logApiError("SAVE_PAYMENT", error);
            console.error("Error saving payment:", error);
            const backendMessage = error?.response?.data?.message || error.message;
            if (backendMessage === "No outstanding invoices.") {
                toast.error("No outstanding credit invoices found for this customer.");
            } else {
                toast.error(`Error recording payment: ${backendMessage}`);
            }

        }
    };
    useEffect(() => {
        const fetchAndSetData = async () => {
          try {
            await fetchData("receipt_vouchers", setData, "id", {});
            console.log("Fetched data:", data); // Add this line for debugging
          } catch (error) {
            console.error("Error in useEffect:", error);
          }
        };
    
        fetchAndSetData();
      }, []);

    return (
        <Layout>
            <Header title="Reciept Vouchers" />
            <Row gutter={[16, 16]}>
                <Col xs={24} md={10} lg={8}>
                    <Card title="Create Receipt Voucher">
                        <Form layout="vertical" onFinish={handleSubmit}>
                            <Form.Item label="Customer Name">
                                <Select
                                    placeholder="Select customer"
                                    allowClear
                                    showSearch
                                    value={selectedCustomer || undefined}
                                    onChange={(value) => getOutStandingBalance(value || "")}
                                    filterOption={(input, option) =>
                                        (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
                                    }
                                    options={customers.map((customer) => ({
                                        label: `${customer.id} - ${customer.phone || "N/A"} - ${customer.name}`,
                                        value: customer.id,
                                    }))}
                                />
                            </Form.Item>

                            <Form.Item label="Outstanding Amount">
                                <Input value={formatTHB(outstandingAmount)} readOnly />
                            </Form.Item>

                            <Form.Item label="Payment Mode">
                                <Select
                                    placeholder="Select payment mode"
                                    allowClear
                                    value={paymentMode || undefined}
                                    onChange={(value) => setPaymentMode(value || "")}
                                    options={[
                                        { label: "Cash", value: "Cash" },
                                        { label: "Bank", value: "Bank" },
                                        { label: "Cheque", value: "Cheque" },
                                        { label: "Online", value: "Online" },
                                    ]}
                                />
                            </Form.Item>

                            <Form.Item label="Amount Paid">
                                <InputNumber
                                    style={{ width: "100%" }}
                                    min={0}
                                    value={paymentAmount}
                                    onChange={(value) => setPaymentAmount(value || "")}
                                />
                            </Form.Item>

                            <Form.Item label="Discount">
                                <Input
                                    placeholder="Enter discount"
                                    value={discount}
                                    onChange={(e) => setDiscount(e.target.value)}
                                />
                            </Form.Item>

                            <Form.Item label="Reference Number (if applicable)">
                                <Input
                                    value={referenceNumber}
                                    onChange={(e) => setReferenceNumber(e.target.value)}
                                />
                            </Form.Item>

                            <Form.Item label="Remarks">
                                <Input.TextArea
                                    rows={3}
                                    value={remarks}
                                    onChange={(e) => setRemarks(e.target.value)}
                                />
                            </Form.Item>

                            <Form.Item label="Balance After Payment">
                                <Input value={formatTHB(balanceAfterPayment)} readOnly />
                            </Form.Item>

                            <Form.Item>
                                <Button type="primary" htmlType="submit" block>
                                    Save Payment
                                </Button>
                            </Form.Item>
                        </Form>
                    </Card>
                </Col>

                <Col xs={24} md={14} lg={16}>
                    <Card title="Receipt Voucher History">
                        {data.length === 0 ? (
                            <p>No data available</p>
                        ) : (
                            <Table
                                columns={columns}
                                dataSource={data}
                                rowKey={(record) => record.id || record.transaction_id}
                                pagination={{ pageSize: 10 }}
                                scroll={{ x: true }}
                            />
                        )}
                    </Card>
                </Col>
            </Row>

            <Modal
                title="Edit Receipt Voucher"
                open={isEditModalOpen}
                onCancel={() => {
                    setIsEditModalOpen(false);
                    setEditingRecord(null);
                }}
                onOk={handleUpdateVoucher}
                okText="Update"
                destroyOnClose
            >
                <Form layout="vertical">
                    <Form.Item label="Payment Date">
                        <Input
                            type="datetime-local"
                            value={editFormData.payment_date ? String(editFormData.payment_date).replace(" ", "T").slice(0, 16) : ""}
                            onChange={(e) => handleEditFieldChange("payment_date", e.target.value ? e.target.value.replace("T", " ") + ":00" : "")}
                        />
                    </Form.Item>

                    <Form.Item label="Payment Mode">
                        <Select
                            value={editFormData.payment_mode || undefined}
                            onChange={(value) => handleEditFieldChange("payment_mode", value || "")}
                            options={[
                                { label: "Cash", value: "Cash" },
                                { label: "Bank", value: "Bank" },
                                { label: "Cheque", value: "Cheque" },
                                { label: "Online", value: "Online" },
                            ]}
                        />
                    </Form.Item>

                    <Form.Item label="Amount Paid">
                        <InputNumber
                            style={{ width: "100%" }}
                            min={0}
                            value={editFormData.amount_paid}
                            onChange={(value) => handleEditFieldChange("amount_paid", value || 0)}
                        />
                    </Form.Item>

                    <Form.Item label="Discount Amount">
                        <InputNumber
                            style={{ width: "100%" }}
                            min={0}
                            value={editFormData.discount_amount}
                            onChange={(value) => handleEditFieldChange("discount_amount", value || 0)}
                        />
                    </Form.Item>

                    <Form.Item label="Reference ID">
                        <Input
                            value={editFormData.reference_id}
                            onChange={(e) => handleEditFieldChange("reference_id", e.target.value)}
                        />
                    </Form.Item>

                    <Form.Item label="Remarks">
                        <Input.TextArea
                            rows={3}
                            value={editFormData.remarks}
                            onChange={(e) => handleEditFieldChange("remarks", e.target.value)}
                        />
                    </Form.Item>
                </Form>
            </Modal>
        </Layout>
    );
}
