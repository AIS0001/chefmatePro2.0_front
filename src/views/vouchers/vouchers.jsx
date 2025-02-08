/* eslint-disable no-undef */

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import fetchData from "../../functions/fetchData";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import CardComponent from "../../components/cards/CardComponent";
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

    // Fetch customers when component loads
    useEffect(() => {
       // fetchData("customers", setCustomers);
        fetchData("customers", setCustomers, "id", {});
    }, []);

    // Fetch outstanding balance & invoices when a customer is selected
    useEffect(() => {
        if (selectedCustomer) {
            fetchData(`/getOutstandingBalance/${selectedCustomer}`, (res) => {
                setOutstandingAmount(res.outstanding_balance);
            });

            fetchData(`getCustomerInvoices/${selectedCustomer}`, setInvoices);
        }
    }, [selectedCustomer]);

    // Update remaining balance after payment
    useEffect(() => {
        const remaining = outstandingAmount - paymentAmount;
        setBalanceAfterPayment(remaining >= 0 ? remaining : 0);
    }, [paymentAmount, outstandingAmount]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        const paymentData = {
            customer_id: selectedCustomer,
            amount_paid: paymentAmount,
            payment_mode: paymentMode,
            reference_id: selectedInvoice,
            reference_number: referenceNumber,
            remarks: remarks,
        };

        try {
            await fetchData("savePayment", null, "POST", paymentData);
            toast.success("Payment recorded successfully!");
        } catch (error) {
            console.error("Error saving payment:", error);
            toast.error("Error recording payment.");
        }
    };

    return (
        <Layout>
            <Header title="Payment Vouchers" />
            <ToastContainer />

            <div className="row">
                {/* Left Panel - Payment Form */}
                <div className="col-lg-4 col-md-4 col-sm-12">
                    <CardComponent title="Create Payment Voucher" headerColor="darkblue">
                        <form onSubmit={handleSubmit}>
                            {/* Customer Selection */}
                            <label>Customer Name:</label>
                            <select value={selectedCustomer} onChange={(e) => setSelectedCustomer(e.target.value)} className="form-control">
                                <option value="">Select Customer</option>
                                {customers.map((customer) => (
                                    <option key={customer.id} value={customer.id}>
                                        {customer.name}
                                    </option>
                                ))}
                            </select>

                            {/* Outstanding Amount */}
                            <label>Outstanding Amount:</label>
                            <input type="text" value={`₹ ${outstandingAmount}`} readOnly className="form-control" />

                            {/* Invoice Selection */}
                            <label>Invoice Number:</label>
                            <select value={selectedInvoice} onChange={(e) => setSelectedInvoice(e.target.value)} className="form-control">
                                <option value="">Select Invoice</option>
                                {invoices.map((invoice) => (
                                    <option key={invoice.id} value={invoice.id}>
                                        {invoice.transaction_id}
                                    </option>
                                ))}
                            </select>

                            {/* Payment Mode */}
                            <label>Payment Mode:</label>
                            <select value={paymentMode} onChange={(e) => setPaymentMode(e.target.value)} className="form-control">
                                <option value="">Select Payment Mode</option>
                                <option value="Cash">Cash</option>
                                <option value="Bank">Bank</option>
                                <option value="Cheque">Cheque</option>
                                <option value="Online">Online</option>
                            </select>

                            {/* Amount Paid */}
                            <label>Amount Paid:</label>
                            <input
                                type="number"
                                value={paymentAmount}
                                onChange={(e) => setPaymentAmount(e.target.value)}
                                className="form-control"
                            />

                            {/* Reference Number */}
                            <label>Reference Number (if applicable):</label>
                            <input
                                type="text"
                                value={referenceNumber}
                                onChange={(e) => setReferenceNumber(e.target.value)}
                                className="form-control"
                            />

                            {/* Remarks */}
                            <label>Remarks:</label>
                            <textarea value={remarks} onChange={(e) => setRemarks(e.target.value)} className="form-control" />

                            {/* Balance After Payment */}
                            <label>Balance After Payment:</label>
                            <input type="text" value={`₹ ${balanceAfterPayment}`} readOnly className="form-control" />

                            {/* Submit Button */}
                            <div className="mt-3">
                                <button type="submit" className="btn btn-darkblue btn-block">
                                    Save Payment
                                </button>
                            </div>
                        </form>
                    </CardComponent>
                </div>

                {/* Right Panel - Payment History Table */}
                <div className="col-lg-8 col-md-8 col-sm-12">
                    {data.length === 0 ? (
                        <p>No data available</p>
                    ) : (
                        <DataTable columns={columns} data={data} tablename="payment_vouchers" />
                    )}
                </div>
            </div>
        </Layout>
    );
}
