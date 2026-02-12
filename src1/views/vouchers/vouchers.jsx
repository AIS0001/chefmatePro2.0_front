/* eslint-disable no-undef */

import React, { useEffect, useState } from "react";
import fetchData from "../../functions/fetchData";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axios from "axios";
import { getHeaders } from "../../utility/getHeader";
import { Button, Card, Col, Form, Input, InputNumber, Row, Select } from "antd";
import Header from "../../components/Header";
import Layout from "../../layout/Layout";
import DataTable from "../../components/data-tables/dataTable";

export default function Vouchers() {
    const [customers, setCustomers] = useState([]);
    const [selectedCustomer, setSelectedCustomer] = useState("");
    const [outstandingAmount, setOutstandingAmount] = useState(0);
    const [paymentAmount, setPaymentAmount] = useState("");
    const [paymentMode, setPaymentMode] = useState("");
    const [referenceNumber, setReferenceNumber] = useState("");
    const [remarks, setRemarks] = useState("");
    const [balanceAfterPayment, setBalanceAfterPayment] = useState(0);
    const [invoices, setInvoices] = useState([]);
    const [selectedInvoice, setSelectedInvoice] = useState("");
    const [data, setData] = useState([]);
    const columns = [
        { label: "Txn ID", field: "transaction_id" },
        { label: "Cust ID", field: "customer_id" },
        { label: "Date", field: "payment_date" },
        { label: "Mode", field: "payment_mode" },
        { label: "Paid Amount", field: "amount_paid" },
        { label: "Ref ID", field: "reference_id" }
      ];
    // Fetch customers when component loads
    useEffect(() => {
        // fetchData("customers", setCustomers);
        fetchData("customers", setCustomers, "id", {});
    }, []);
    const getOutStandingBalance = async (customerId) => {
        setSelectedCustomer(customerId); // Update selected customer state

        if (!customerId) {
            setOutstandingAmount(0);
            return;
        }
//testing update upto 15may 2025
        try {
            const res = await axios.get(`/getoutstandingbalance/Account Recievable/${customerId}`, getHeaders());
            if (res.data.success) {
                setOutstandingAmount(res.data.outstanding_balance);
            } else {
                toast.error("Failed to fetch ledger balance");
            }
        } catch (error) {
            console.error("Error fetching outstanding balance:", error);
            toast.error("Error fetching outstanding balance.");
        }
    };
    useEffect(() => {
        const remaining = outstandingAmount - (parseFloat(paymentAmount) || 0);
        setBalanceAfterPayment(remaining >= 0 ? remaining : 0);
    }, [paymentAmount, outstandingAmount]);

    // Fetch outstanding balance & invoices when a customer is selected
    useEffect(() => {
        // alert(selectedCustomer);
        if (selectedCustomer) {
            // Fetch ledger balance from API
            fetchData("customers", setCustomers, "id", {});
            axios.get(`/getoutstandingbalance/Account Recievable/${selectedCustomer}`, getHeaders(), (res) => {
                if (res.success) {
                    setOutstandingAmount(res.outstanding_balance);
                    alert(res.outstanding_balance);
                    <input type="text" value={`₹ ${outstandingAmount}`} readOnly className="form-control" />
                    console.log(outstandingAmount);
                } else {
                    alert("error");
                    console.log("error");
                    toast.error("Failed to fetch ledger balance");
                }
            });

            // Fetch invoices related to the customer
            //  fetchData(`/getCustomerInvoices/${selectedCustomer}`, setInvoices);
        } else {
            setOutstandingAmount(0);
            setInvoices([]);
        }
    }, [selectedCustomer]);


    // Update remaining balance after payment
    useEffect(() => {
        const remaining = outstandingAmount - paymentAmount;
        setBalanceAfterPayment(remaining >= 0 ? remaining : 0);
    }, [paymentAmount, outstandingAmount]);

    const handleSubmit = async () => {
        const paymentData = {
            customer_id: selectedCustomer,
            amount_paid: paymentAmount,
            reference_number:referenceNumber,
            payment_mode: paymentMode,
        };
            // alert(paymentData.customer_id);
            // alert(paymentData.amount_paid);
            // alert(paymentData.reference_number);
        try {
            await axios.post( "/savepayment", paymentData, getHeaders());
            // Send the data to the backend using POST
            await fetchData("receipt_vouchers", setData, "id", {});

            toast.success("Payment recorded successfully!");
        } catch (error) {
            console.error("Error saving payment:", error);
          toast.error(`Error recording payment: ${error?.response?.data?.message || error.message}`);

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
                                <Input value={`₹ ${outstandingAmount}`} readOnly />
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
                                <Input value={`₹ ${balanceAfterPayment}`} readOnly />
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
                            <DataTable columns={columns} data={data} tablename="receipt_vouchers" />
                        )}
                    </Card>
                </Col>
            </Row>
        </Layout>
    );
}
