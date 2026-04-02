/* eslint-disable no-undef */

import React, { useCallback, useEffect, useState } from "react";
import fetchData, { fetchShopScopedData } from "../../functions/fetchData";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axios from "axios";
import { getHeaders } from "../../utility/getHeader";
import Header from "../../components/Header";
import Layout from "../../layout/Layout";
import { Button, Card, Col, Input, InputNumber, Row, Select, Table, Typography } from "antd";

export default function PaymentVouchers() {
    const { Text } = Typography;
    const [suppliers, setsuppliers] = useState([]);
    const [selectedSupplier, setSelectedSupplier] = useState("");
    const [outstandingAmount, setOutstandingAmount] = useState(0);
    const [paymentAmount, setPaymentAmount] = useState("");
    const [paymentMode, setPaymentMode] = useState("");
    const [referenceNumber, setReferenceNumber] = useState("");
    const [remarks, setRemarks] = useState("");
    const [balanceAfterPayment, setBalanceAfterPayment] = useState(0);
    const [data, setData] = useState([]);
    const getShopId = () => sessionStorage.getItem('selected_shop_id') || localStorage.getItem('shop_id') || sessionStorage.getItem('shop_id');
    const formatThaiBaht = (value) => new Intl.NumberFormat("th-TH", {
        style: "currency",
        currency: "THB",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(Number(value) || 0);

    const columns = [
        {
            title: "Supplier",
            dataIndex: "supplier_name",
            key: "supplier_name",
            ellipsis: true,
        },
        {
            title: "Date",
            dataIndex: "payment_date",
            key: "payment_date",
            render: (value) => value ? new Date(value).toLocaleDateString() : "-",
        },
        {
            title: "Mode",
            dataIndex: "payment_mode",
            key: "payment_mode",
        },
        {
            title: "Paid Amount",
            dataIndex: "amount_paid",
            key: "amount_paid",
        },
        {
            title: "Ref ID",
            dataIndex: "reference_id",
            key: "reference_id",
            render: (value) => value || "-",
        },
    ];

    const getSupplierLabel = (supplier) => (
        supplier?.name || supplier?.supplier_name || supplier?.company_name || `Supplier ${supplier?.id || ""}`
    );

    const voucherRows = data.map((voucher, index) => {
        const supplier = suppliers.find((item) => item.id?.toString() === voucher.supplier_id?.toString());
        return {
            key: voucher.id || `${voucher.reference_id || "ref"}-${index}`,
            ...voucher,
            supplier_name: getSupplierLabel(supplier),
            amount_paid: formatThaiBaht(voucher.amount_paid),
        };
    });

    // Fetch suppliers when component loads
    useEffect(() => {
        fetchShopScopedData("suppliers", setsuppliers, "id");
    }, []);

    const getOutStandingBalance = async (e) => {
        const supplierId = e.target.value;
        setSelectedSupplier(supplierId);

        if (!supplierId) {
            setOutstandingAmount(0);
            return;
        }

        try {
            const endpoint = `/getsupplieroutstandingbalance/${supplierId}`;
            console.log("[PaymentVouchers] Fetch supplier balance", {
                endpoint,
                supplierId,
                shopId: getShopId(),
            });

            const res = await axios.get(endpoint, getHeaders());
            console.log("[PaymentVouchers] Supplier balance response", {
                supplierId,
                status: res?.status,
                data: res?.data,
            });

            const apiSuccess = Boolean(res?.data?.success);
            const rawOutstandingBalance = res?.data?.outstanding_balance;
            const parsedOutstandingBalance = Number(rawOutstandingBalance || 0);
            console.log("[PaymentVouchers] Supplier balance parsed", {
                supplierId,
                apiSuccess,
                rawOutstandingBalance,
                parsedOutstandingBalance,
                responseJson: JSON.stringify(res?.data || {}),
            });

            if (res.data.success) {
                setOutstandingAmount(parsedOutstandingBalance);
            } else {
                toast.error("Failed to fetch supplier balance");
            }
        } catch (error) {
            console.error("[PaymentVouchers] Error fetching supplier outstanding balance", {
                supplierId,
                message: error?.message,
                status: error?.response?.status,
                data: error?.response?.data,
            });
            toast.error("Error fetching supplier outstanding balance.");
        }
    };

    useEffect(() => {
        const remaining = outstandingAmount - (parseFloat(paymentAmount) || 0);
        setBalanceAfterPayment(remaining >= 0 ? remaining : 0);
    }, [paymentAmount, outstandingAmount]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        const paymentData = {
                        shop_id: getShopId(),
                        supplier_id: selectedSupplier,
            amount_paid: parseFloat(paymentAmount) || 0,
            reference_number: referenceNumber,
            payment_mode: paymentMode,
                        remarks,
        };
if (!selectedSupplier || !paymentAmount || !paymentMode) {
  toast.error("Please fill in all required fields.");
  return;
}
//console.log("Sending payment data:", paymentData);

        try {
            await axios.post(
                "/saveSupplierPayment", paymentData, getHeaders()
            );
            // Send the data to the backend using POST
            //await fetchData("payment_vouchers", null, "POST", paymentData);
 await fetchVoucherData();
            toast.success("Payment recorded successfully!");
            setSelectedSupplier("");
            setOutstandingAmount(0);
            setPaymentAmount("");
            setPaymentMode("");
            setReferenceNumber("");
            setRemarks("");
        } catch (error) {
            console.error("Error saving payment:", error);
            toast.error("Error recording payment."+error);
        }
    };
const fetchVoucherData = useCallback(async () => {
    try {
                const shopId = getShopId();
                await fetchData("payment_vouchers", setData, "id", shopId ? { shop_id: shopId } : {});
    } catch (error) {
        console.error("Error fetching payment vouchers:", error);
    }
}, []);

useEffect(() => {
        fetchVoucherData();
}, [fetchVoucherData]);


    const softPageStyle = {
        background: "linear-gradient(180deg, #f7fafc 0%, #f1f5f9 100%)",
        borderRadius: 12,
        padding: 16,
    };

    const formCardStyle = {
        borderRadius: 12,
        border: "1px solid #e6edf5",
        background: "#f8fbff",
    };

    const tableCardStyle = {
        borderRadius: 12,
        border: "1px solid #e6edf5",
        background: "#fcfdff",
    };

    return (
        <Layout>
            <Header title="Payment Vouchers" />
            <ToastContainer />
            <div style={softPageStyle}>
                <Row gutter={[16, 16]}>
                    <Col xs={24} lg={9}>
                        <Card title="Create Payment Voucher" style={formCardStyle}>
                            <form onSubmit={handleSubmit}>
                                <Text strong>Supplier Name</Text>
                                <Select
                                    value={selectedSupplier || undefined}
                                    onChange={(value) => getOutStandingBalance({ target: { value } })}
                                    placeholder="Select Supplier"
                                    size="large"
                                    style={{ width: "100%", marginTop: 6, marginBottom: 12 }}
                                    options={suppliers.map((supplier) => ({
                                        value: supplier.id,
                                        label: supplier.name || supplier.supplier_name || supplier.company_name,
                                    }))}
                                />

                                <Text strong>Outstanding Amount</Text>
                                <Input
                                    size="large"
                                    value={formatThaiBaht(outstandingAmount)}
                                    readOnly
                                    style={{ marginTop: 6, marginBottom: 12, background: "#f0f5ff" }}
                                />

                                <Text strong>Payment Mode</Text>
                                <Select
                                    value={paymentMode || undefined}
                                    onChange={(value) => setPaymentMode(value)}
                                    placeholder="Select Payment Mode"
                                    size="large"
                                    style={{ width: "100%", marginTop: 6, marginBottom: 12 }}
                                    options={[
                                        { value: "Cash", label: "Cash" },
                                        { value: "Bank", label: "Bank" },
                                        { value: "Cheque", label: "Cheque" },
                                        { value: "Online", label: "Online" },
                                    ]}
                                />

                                <Text strong>Amount Paid</Text>
                                <InputNumber
                                    size="large"
                                    value={paymentAmount === "" ? null : Number(paymentAmount)}
                                    onChange={(value) => setPaymentAmount(value ?? "")}
                                    style={{ width: "100%", marginTop: 6, marginBottom: 12 }}
                                    min={0}
                                />

                                <Text strong>Reference Number</Text>
                                <Input
                                    size="large"
                                    value={referenceNumber}
                                    onChange={(e) => setReferenceNumber(e.target.value)}
                                    style={{ marginTop: 6, marginBottom: 12 }}
                                    placeholder="Optional"
                                />

                                <Text strong>Remarks</Text>
                                <Input.TextArea
                                    value={remarks}
                                    onChange={(e) => setRemarks(e.target.value)}
                                    rows={3}
                                    style={{ marginTop: 6, marginBottom: 12 }}
                                />

                                <Text strong>Balance After Payment</Text>
                                <Input
                                    size="large"
                                    value={formatThaiBaht(balanceAfterPayment)}
                                    readOnly
                                    style={{ marginTop: 6, marginBottom: 14, background: "#f6ffed" }}
                                />

                                <Button type="primary" htmlType="submit" block size="large">
                                    Save Payment
                                </Button>
                            </form>
                        </Card>
                    </Col>

                    <Col xs={24} lg={15}>
                        <Card title="Payment History" style={tableCardStyle}>
                            <Table
                                columns={columns}
                                dataSource={voucherRows}
                                pagination={{ pageSize: 8 }}
                                locale={{ emptyText: "No data available" }}
                                size="middle"
                            />
                        </Card>
                    </Col>
                </Row>
            </div>
        </Layout>
    );
}
