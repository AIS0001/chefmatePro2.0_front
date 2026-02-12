import React, { useEffect, useState } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axios from "axios";
import { format } from "date-fns";
import CardComponent from "../../components/cards/CardComponent";
import Header from "../../components/Header";
import Layout from "../../layout/Layout";
import { AdvanceInput } from "../../components/Buttons/advanceinput";
import { TextfieldwithLabel } from "../../components/Buttons/Textfield";
import { Textfield } from "../../components/Buttons/Textfield";
import { ComboBox } from "../../components/Buttons/ComboBox";
import { SubmitButton } from "../../components/Buttons/Textfield";
import fetchData from "../../functions/fetchData";
import { getHeaders } from "../../utility/getHeader";
import ExportDataTable from "../../components/Buttons/ExportdataTable";
import DataTable from "../../components/data-tables/dataTable";

export default function Properties() {
  let currentDate = format(new Date(), "yyyy-MM-dd");
  const [images, setImages] = useState([]);
  const [data, setData] = useState([]);
  const [errors, setErrors] = useState({});
  const [formdata, setFormData] = useState({
    name: "",
    product_id: "",
    lastloggedin: currentDate,
  });

  // Handle file changes and set preview
  const handleFileChange = (event) => {
    const selectedImages = Array.from(event.target.files).map((file) =>
      Object.assign(file, { preview: URL.createObjectURL(file) })
    );
    setImages((prevImages) => [...prevImages, ...selectedImages]);
  };

  // Handle image deletion
  const handleDeleteImage = (index) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const columns = [
    { label: "Product Name", field: "property_name" },
    { label: "Address", field: "address" },
    { label: "Rooms", field: "totalrooms" },
    { label: "Toilets", field: "totaltoilets" },
    { label: "Building", field: "building" },
    { label: "Floor", field: "floor"},
    { label: "Room No.", field: "room" },
    { label: "Type", field: "type" },
    { label: "Status", field: "status" },
    { label: "Action", field: "actions" },
    { label: "", field: "bookingstatus" },
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

 

  useEffect(() => {
    const fetchAndSetData = async () => {
      try {
        await fetchData("listing", setData, "id", {});
      } catch (error) {
        console.error("Error in useEffect:", error);
      }
    };

    fetchAndSetData();
  }, []);

  return (
    <>
      <Layout>
        <Header title="Property Listing" />
        <small>You can see your listingg added by your agent ID</small>
        <ToastContainer />
        <div className="row">
          <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12" id="tableid">
          {data.length === 0 ? (
                <p>No data available</p>
              ) : (
                <DataTable
                  columns={columns}
                  data={data}
                  tablename="listing"
                />
              )}
            {/* <CardComponent
              title=""
              headerContent={
                <ExportDataTable
                  tableId="datatable1"
                  tableData={data} // Pass complete dataset to export function
                />
              }
              headerColor="lightblue"
              pull="right"
              bodyClass="panel-body"
            >
              {data.length === 0 ? (
                <p>No data available</p>
              ) : (
                <DataTable
                  columns={columns}
                  data={data}
                />
              )}
            </CardComponent> */}
          </div>
        </div>
      </Layout>
    </>
  );
}
