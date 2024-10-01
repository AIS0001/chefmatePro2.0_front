/* eslint-disable no-undef */

import React, { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";

import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import Header from "../../components/Header";
import Layout from "../../layout/Layout";
import { format } from "date-fns";

import DataTable from "../../components/data-tables/dataTable";
import fetchData from "../../functions/fetchData";
import NewItemModal from "../../components/Modals/NewItemModal";

export default function NewItem() {
  let currentDate = format(new Date(), "yyyy-MM-dd");
  //  const headers = { Authorization: authheader().access_token };
  const [data, setData] = useState([]);
  const [errors, setErrors] = useState({});
  const [selectedContract, setSelectedContract] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [reload, setReload] = useState(false); // Define reload state

  const [formdata, setFormData] = useState({
    name: "",
  });
  const columns = [
    { label: "ID", field: "id" },
    { label: "Item Name", field: "iname" },
    { label: "unit", field: "unit" },
    { label: "Tax", field: "tax" },
    { label: "MRP", field: "mrp" },
    { label: "Offer Price", field: "offerprice" },
    { label: "Details", field: "description" },
    { label: "Actions", field: "actions" },
  ];
  const AddNewItemButton = (contract) => {
    // setSelectedContract(contract);
    setShowModal(true);
  };

  const triggerReload = () => {
    setReload((prev) => !prev); // Toggle reload state
  };

  useEffect(() => {
    const fetchAndSetData = async () => {
      try {
        const items = await fetchData("items", setData, "id", {});
        console.log("Fetched data:", items);
        setData(items); // Ensure the data state is set with fetched items
      } catch (error) {
        console.error("Error in useEffect:", error);
      }
    };

    fetchAndSetData();
  }, [reload]);
  useEffect(() => {
    console.log("Updated data:", data);
}, [data]);
  return (
    <>
      <Layout>
        <Header title="Item Details" />
        <ToastContainer />
        <div className="row mb-4">
        <div className="col-lg-10 col-md-10 col-sm-10 col-xs-10" >
          
          </div>
        <div className="col-1">
         
        </div>
        <div className="col-1">
          <Link
            type="button"
            name="add"
            onClick={AddNewItemButton}
            className="btn btn-primary btn-anim shadow-lg"
            style={{
              padding: "5px 8px",
              borderRadius: "4px",
              fontSize: "20px",
              backgroundColor: "#e99c0e",
              borderColor: "#c1820d",
            }}
          >
            <i className="fas fa-plus-circle mr-2"></i> {/* Add an icon */}
            Add New Item
          </Link>
        </div>
        </div>

        <div className="row">
          <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12" id="tableid">
            {data.length === 0 ? (
              <p>No data available</p>
            ) : (
              <DataTable columns={columns} data={data} tablename="items" />
            )}
          </div>
        </div>

        <NewItemModal
          isOpen={showModal}
          customer={selectedContract}
          onItemAdded={triggerReload} // Pass the reload function
          onClose={() => setShowModal(false)} // Close the modal
        />
      </Layout>
    </>
  );
}
