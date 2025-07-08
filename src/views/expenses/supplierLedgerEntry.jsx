import React, { useEffect, useState } from "react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { format } from "date-fns";
import fetchData from "../../functions/fetchData";

import Layout from "../../layout/Layout";
import Header from "../../components/Header";
import CardComponent from "../../components/cards/CardComponent";
import { TextfieldwithLabel, SubmitButton } from "../../components/Buttons/Textfield";
import { getHeaders } from "../../utility/getHeader";
import DataTable from "../../components/data-tables/dataTable";

export default function SupplierLedgerEntry() {
      const [data, setData] = useState([]);
  const [formData, setFormData] = useState({
    transaction_id: "",
    date: format(new Date(), "yyyy-MM-dd"),
    account_type: "Purchase",
    account_id: "",
    description: "",
    debit_amount: "",
    credit_amount: "",
    reference_id: "",
  });

  const columns = [
        { label: "Txn ID", field: "transaction_id" },
        { label: "Date", field: "date" },
        { label: "A/C Type", field: "account_type" },
        { label: "A/C ID", field: "account_id" },
        { label: "Description", field: "description" },
        { label: "Debit", field: "debit_amount" },
        { label: "Credit", field: "credit_amount" },
        // { label: "Action", field: "actions" }
    ];
  const [suppliers, setSuppliers] = useState([]);

  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
       // const res = await axios.get("/getdata/suppliers", getHeaders());
        fetchData("suppliers", setSuppliers, "id", {});
        
      } catch (err) {
        console.error("Error fetching suppliers:", err);
        toast.error("Failed to load suppliers.");
      }
    };
    fetchSuppliers();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await axios.post("/insertdata/ledger_entries", formData, getHeaders());
      toast.success("Supplier ledger entry saved!");

      setFormData({
        transaction_id: "",
        date: format(new Date(), "yyyy-MM-dd"),
        account_type: "Purchase",
        account_id: "",
        description: "",
        debit_amount: "",
        credit_amount: "",
        reference_id: "",
      });
    } catch (error) {
      console.error(error);
      toast.error("Failed to save entry.");
    }
  };
   useEffect(() => {
        const fetchAndSetData =  () => {
            try {
               fetchData("ledger_entries", setData, "id", {account_type:'Purchase'});
                //await fetchData("ledger_entries", setAllData, "id", {});
                //setAllData(fetchedData); // Ensure Alldata gets a proper value

                //console.log("Fetched Data:", fetchedData); // Debugging
            } catch (error) {
                console.error("Error in useEffect:", error);
            }
        };

        fetchAndSetData();
    }, []);
  return (
    <Layout>
      <Header title="Vendor Expense Logging" />
      <ToastContainer />
      <CardComponent title="Track and log supplier bills, invoices, and payments" headerColor="primary" bodyClass="panel-body">
        <form onSubmit={handleSubmit}>
          <div className="row">
            <div className="col-md-4">
              <TextfieldwithLabel
                id="transaction_id"
                name="transaction_id"
                value={formData.transaction_id}
                onChange={handleInputChange}
                type="text"
                lable="Transaction ID"
              />
            </div>
            <div className="col-md-4">
              <TextfieldwithLabel
                id="date"
                name="date"
                value={formData.date}
                onChange={handleInputChange}
                type="date"
                lable="Date"
              />
            </div>
            <div className="col-md-4">
              <label className="control-label mb-2">Supplier Name</label>
              <select
               className="form-control"
              required
                name="account_id"
                value={formData.account_id}
                onChange={handleInputChange}
                
              >
                <option value="">Select Supplier</option>
                {suppliers.map((supplier) => (
                  <option key={supplier.id} value={supplier.id}>
                    {supplier.company_name}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-6 mt-3">
              <TextfieldwithLabel
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                type="text"
                lable="Description"
              />
            </div>
            <div className="col-md-3 mt-3">
              <TextfieldwithLabel
                id="debit_amount"
                name="debit_amount"
                value={formData.debit_amount}
                onChange={handleInputChange}
                type="number"
                lable="Debit Amount"
              />
            </div>
            <div className="col-md-3 mt-3">
              <TextfieldwithLabel
                id="credit_amount"
                name="credit_amount"
                value={formData.credit_amount}
                onChange={handleInputChange}
                type="number"
                lable="Credit Amount (Optional)"
              />
            </div>
            <div className="col-md-4 mt-3">
              <TextfieldwithLabel
                id="reference_id"
                name="reference_id"
                value={formData.reference_id}
                onChange={handleInputChange}
                type="text"
                lable="Reference ID (Optional)"
              />
            </div>
            <div className="col-md-4 mt-4">
                <label></label>
              <SubmitButton type="submit" name="Save Entry" cls="btn btn-darkblue btn-anim" />
            </div>
          </div>
        </form>
      </CardComponent>

        <div className="col-12 mt-4" id="tableid">
    {data.length === 0 ? (
      <p>No stock entries available.</p>
    ) : (
      <DataTable columns={columns} data={data} tablename="ledger_entries" />
    )}
  </div>
    </Layout>
  );
}
