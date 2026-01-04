/* eslint-disable no-undef */

import React, { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
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
import SimpleDataTable from "../../components/data-tables/SimpledataTable";
import EditTaxModal from "../../components/Modals/EditTaxModal";
import fetchData from "../../functions/fetchData";

export default function Taxes() {
  let currentDate = format(new Date(), "yyyy-MM-dd");
  //  const headers = { Authorization: authheader().access_token };
  const [data, setData] = useState([]);
  const [errors, setErrors] = useState({});
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedTax, setSelectedTax] = useState(null);

  const [formdata, setFormData] = useState({
    taxname: "",
    taxvalue: "",
    included: false,
  });

  const columns = [
    { label: "ID", field: "id" },
    { label: "Tax Name", field: "taxname" },
    { label: "Tax Value", field: "taxvalue" },
    { label: "Tax Included", field: "included" },
    { label: "Status", field: "status" },
    { label: "Actions", field: "actions" },
  ];
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: type === "checkbox" ? checked : value,
    }));
  };
const handleEditClick = (item) => {
  console.log("Editing item:", item);
  setSelectedTax(item);
  setShowEditModal(true);
};

const handleCloseEditModal = () => {
  setShowEditModal(false);
  setSelectedTax(null);
};

const handleUpdateSuccess = async () => {
  // Refresh the data after successful update
  try {
    await fetchData("taxes", setData, "id", {});
  } catch (error) {
    console.error("Error refreshing data after update:", error);
  }
};

useEffect(() => {
  console.log("Formdata changed:", formdata);
}, [formdata]);



  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      // Only add new tax (no edit functionality in main form)
      await axios.post(
        "/insertdata/taxes",
        {
          taxname: formdata.taxname,
          taxvalue: formdata.taxvalue,
          included: formdata.included,
        },
        getHeaders()
      );
      toast.success("Tax added successfully!");

      await fetchData("taxes", setData, "id", {});
      setFormData({ taxname: "", taxvalue: "", included: false });
      setErrors({});
    } catch (err) {
      toast.error("Error adding tax");
      console.error(err.message);
    }
  };



  const handleDeleteSuccess = async () => {
    // Refresh the data after successful deletion
    try {
      await fetchData("taxes", setData, "id", {});
      toast.success("Tax deleted successfully!");
    } catch (error) {
      console.error("Error refreshing data after deletion:", error);
      toast.error("Error refreshing data");
    }
  };

  useEffect(() => {
    const fetchAndSetData = async () => {
      try {
        await fetchData("taxes", setData, "id", {});
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
        <Header title="Add New Tax" />
        <ToastContainer />
        <div className="row">
          <div class="col-lg-4 col-md-4 col-sm-12 col-xs-12">
            <CardComponent
              title="Add New Tax"
              headerColor="darkorange"
              pull="left"
              bodyClass="panel-body"
            >
              <div class="row">
                <div class="col-md-12">
                  <form onSubmit={handleSubmit}>
                    <div class="panel panel-default card-view">

                      <TextfieldwithLabel
                        id="taxname"
                        onChange={(e) => handleInputChange(e)}
                        value={formdata.taxname || ""}
                        type="text"
                        name="taxname"
                        lable="Tax Name"
                      />
                      <TextfieldwithLabel
                        id="taxvalue"
                        onChange={(e) => handleInputChange(e)}
                        value={formdata.taxvalue || ""}
                        type="number"
                        name="taxvalue"
                        lable="Tax Value"
                      />
                    </div>
                    <div className="form-group">
                      <label>
                        <input
                          type="checkbox"
                          name="included"
                          checked={formdata.included}
                          onChange={handleInputChange}
                        />{" "}
                        Included Tax?
                      </label>
                    </div>

                    <div className="form-group">
                      <label className="control-label mb-12"></label>
                      <SubmitButton
                        type="submit"
                        name="Save"
                        cls="btn btn-darkblue btn-anim"
                      />
                    </div>
                  </form>
                </div>
              </div>
            </CardComponent>
          </div>
          {/* <ExportDataTable
                                tableId="tableid"
                                tableData={data} /> */}
          <div class="col-lg-8 col-md-8 col-sm-12 col-xs-12" id="tableid">
            {data.length === 0 ? (
              <p>No data available</p>
            ) : (
              //  <DataTable columns={columns} data={data} onFilter={handleFilter} />
              <DataTable
                columns={columns}
                data={data}
                tablename="taxes"
                onEditClick={handleEditClick}
                onDeleteSuccess={handleDeleteSuccess}
              />
            )}


          </div>
        </div>

        {/* Edit Tax Modal */}
        <EditTaxModal
          isOpen={showEditModal}
          onClose={handleCloseEditModal}
          taxData={selectedTax}
          onUpdateSuccess={handleUpdateSuccess}
        />
      </Layout>
    </>
  );
}
