/* eslint-disable no-undef */

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import fetchData from "../../functions/fetchData";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axios from "axios";
import { getHeaders } from "../../utility/getHeader";
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
    const getOutStandingBalance = async (e) => {
        const customerId = e.target.value;
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

    const handleSubmit = async (e) => {
        e.preventDefault();

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
            //await fetchData("receipt_vouchers", null, "POST", paymentData);

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
            <ToastContainer />

            <div className="row">
                {/* Left Panel - Payment Form */}
                <div className="col-lg-4 col-md-4 col-sm-12">
                    <CardComponent title="Create Reciept Voucher" headerColor="darkblue">
                        <form onSubmit={handleSubmit}>
                            {/* Customer Selection */}
                            <label>Customer Name:</label>
                            <select value={selectedCustomer} onChange={getOutStandingBalance} className="form-control">


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
                            <label></label>
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
                        <DataTable columns={columns} data={data} tablename="receipt_vouchers" />
                    )}
                </div>
            </div>
        </Layout>
    );
}
