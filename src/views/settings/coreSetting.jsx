import React, { useEffect, useState } from "react";
import axios from "axios";
import { getHeaders } from "../../utility/getHeader";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import CardComponent from "../../components/cards/CardComponent";
import Header from "../../components/Header";
import Layout from "../../layout/Layout";
import { format } from "date-fns";

import { TextfieldwithLabel } from "../../components/Buttons/Textfield";
import { SubmitButton } from "../../components/Buttons/Textfield";
import DataTable from "../../components/data-tables/dataTable";

import fetchData from "../../functions/fetchData";

export default function CoreSettings() {
  const [data, setData] = useState([]); // for display, if needed
  const [formdata, setFormData] = useState({
    id: null, // add id to detect update vs new
    customer_name: "",
    region: "",
    subscription_type: "",
    valid_till: format(new Date(new Date().setFullYear(new Date().getFullYear() + 1)), "yyyy-MM-dd"),
    status: "active" // new status field
  });

  // Fetch the single subscription on mount
 useEffect(() => {
  const fetchSubscription = async () => {
    try {
      const res = await fetchData("coresetting", setData, "id", {});;

      if (res.data.length > 0) {
        const record = res.data[0]; // use first subscription (assuming only one exists)
        setFormData({
          id: record.id,
          customer_name: record.customer_name,
          region: record.region,
          subscription_type: record.type,
          valid_till: record.valid_till,
          status: record.status || "active"
        });
      }
    } catch (error) {
      console.error("Error fetching subscription:", error);
    }
  };

  fetchSubscription();
}, []);


  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (formdata.id) {
        // Update existing subscription
        await axios.put(
          `/coresetting/${formdata.id}`,
          {
            customer_name: formdata.customer_name,
            region: formdata.region,
            type: formdata.subscription_type,
            valid_till: formdata.valid_till,
            status: formdata.status,
          },
          getHeaders()
        );
        toast.success("Subscription updated successfully!");
      } else {
        // Create new subscription
        const res = await axios.post(
          "/insertdata/coresetting",
          {
            customer_name: formdata.customer_name,
            region: formdata.region,
            type: formdata.subscription_type,
            valid_till: formdata.valid_till,
            status: formdata.status,
          },
          getHeaders()
        );
        // Assume the response returns the created subscription with id
        setFormData((prev) => ({
          ...prev,
          id: res.data.id,
        }));
        toast.success("Subscription started successfully!");
      }
      // Optional: reload or update data table
      await fetchData("coresetting", setData, "id", {});
    } catch (error) {
      toast.error("Error saving subscription details. Please check all fields.");
      console.error(error);
    }
  };

  // Handler to change status (cancel or hold)
  const handleStatusChange = async (newStatus) => {
    if (!formdata.id) {
      toast.error("No subscription to update status.");
      return;
    }
    try {
      await axios.put(
        `/updatesubscription/coresetting/${formdata.id}`,
        {
          ...formdata,
          status: newStatus,
        },
        getHeaders()
      );
      setFormData((prev) => ({ ...prev, status: newStatus }));
      toast.success(`Subscription status updated to ${newStatus}`);
    } catch (error) {
      toast.error("Error updating status");
      console.error(error);
    }
  };

  return (
    <Layout>
      <Header title="Subscription details" />
      <ToastContainer />

      <div className="row">
        <div className="col-lg-4 col-md-4 col-sm-12 col-xs-12">
          <CardComponent title={formdata.id ? "Edit Subscription" : "Add Customer for new Ledger"} headerColor="darkblue" pull="left" bodyClass="panel-body">
            <form onSubmit={handleSubmit}>
              <div className="panel panel-default card-view">
                <div className="form-group">
                  <TextfieldwithLabel
                    id="name"
                    onChange={handleInputChange}
                    value={formdata.name}
                    type="text"
                    name="customer_name"
                    lable="Customer Name"
                    required
                    disabled={formdata.status === "cancelled"} // disable editing if cancelled
                  />
                  <label>Region</label>
                  <select
                    className="form-control"
                    name="region"
                    value={formdata.region || ""}
                    onChange={handleInputChange}
                    disabled={formdata.status === "cancelled"}
                    required
                  >
                    <option value="">Select Region</option>
                    <option value="TH">Thailand</option>
                    <option value="IN">India</option>
                    <option value="UK">UK</option>
                    <option value="USA">USA</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Subscription Type</label>
                  <select
                    className="form-control"
                    name="subscription_type"
                    value={formdata.subscription_type || ""}
                    onChange={handleInputChange}
                    disabled={formdata.status === "cancelled"}
                    required
                  >
                    <option value="">Select Type</option>
                    <option value="Basic">Basic</option>
                    <option value="Premium">Premium</option>
                    <option value="Enterprise">Enterprise</option>
                  </select>
                </div>

                <TextfieldwithLabel
                  id="valid_till"
                  onChange={handleInputChange}
                  value={formdata.valid_till}
                  type="date"
                  name="valid_till"
                  lable="Valid Till"
                  disabled={formdata.status === "cancelled"}
                  required
                />
              </div>

              <div className="form-group">
  <SubmitButton
    type="submit"
    name={formdata.id ? "Update" : "Save"}
    cls="btn btn-darkblue btn-anim"
    disabled={formdata.status === "cancelled"}
  />
</div>

            </form>

            {/* Cancel or Hold Buttons */}
            {formdata.id && formdata.status !== "cancelled" && (
              <div className="form-group mt-3">
                <button
                  className="btn btn-warning mr-2"
                  onClick={() => handleStatusChange("hold")}
                >
                  Hold Subscription
                </button>
                <button
                  className="btn btn-danger"
                  onClick={() => handleStatusChange("cancelled")}
                >
                  Cancel Subscription
                </button>
              </div>
            )}

            {/* Show current status */}
            {formdata.status && (
              <p>
                <strong>Status:</strong> {formdata.status.toUpperCase()}
              </p>
            )}
          </CardComponent>
        </div>

        <div className="col-lg-8 col-md-8 col-sm-12 col-xs-12" id="tableid">
          {data.length === 0 ? <p>No data available</p> : <DataTable columns={[
            { label: "ID", field: "id" },
            { label: "Name", field: "customer_name" },
            { label: "Region", field: "region" },
            { label: "Type", field: "type" },
            { label: "Valid Till", field: "valid_till" },
            { label: "Status", field: "status" }
          ]} data={data} tablename="coresetting" />}
        </div>
      </div>
    </Layout>
  );
}
