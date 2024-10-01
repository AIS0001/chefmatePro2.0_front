import React, { useEffect, useState } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axios from "axios";
import { format } from "date-fns";
import CardComponent from "../../components/cards/CardComponent";
import Header from "../../components/Header";
import Layout from "../../layout/Layout";
import { AdvanceInput } from "../../components/Buttons/advanceinput";
import { SubmitButton } from "../../components/Buttons/Textfield";
import fetchData from "../../functions/fetchData";
import { getHeaders } from "../../utility/getHeader";
import ExportDataTable from "../../components/Buttons/ExportdataTable";
import DataTable from "../../components/data-tables/dataTable";

export default function NewProduct1() {
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
    { label: "Product Id", field: "product_id" },
    { label: "Image", field: "filename" },
    { label: "Photo", field: "path" },
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formdata1 = e.target;
    const formData = new FormData();
    formData.append("product_id", formdata1.product_id.value);
    images.forEach((image) => {
      formData.append("images", image);
    });

    try {
      await axios.post("/addnewproduct/images", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          ...getHeaders(),
        },
      });

      await fetchData("images", setData, "id", {});
      toast.success("Product added successfully!");
      setFormData({});
      setImages([]); // Clear images after successful submission
    } catch (err) {
      toast.error("Error in adding Product");
      console.error(err.message);
    }
  };

  useEffect(() => {
    const fetchAndSetData = async () => {
      try {
        await fetchData("images", setData, "id", {});
      } catch (error) {
        console.error("Error in useEffect:", error);
      }
    };

    fetchAndSetData();
  }, []);

  return (
    <>
      <Layout>
        <Header title="Add New Product with Image" />
        <ToastContainer />
        <div className="row">
          <div className="col-lg-4 col-md-4 col-sm-12 col-xs-12">
            <CardComponent
              title="Product's Information"
              headerColor="lightblue"
              pull="left"
              bodyClass="panel-body"
            >
              <div className="row">
                <div className="col-md-12">
                  <form onSubmit={handleSubmit}>
                    <div className="panel panel-default card-view">
                      <AdvanceInput
                        id="name"
                        onChange={(e) => handleInputChange(e)}
                        value={formdata.name}
                        type="text"
                        name="name"
                        label="Name"
                      />
                      <AdvanceInput
                        id="product_id"
                        onChange={(e) => handleInputChange(e)}
                        value={formdata.product_id}
                        type="text"
                        name="product_id"
                        label="Product Code"
                      />

                      <input
                        type="file"
                        name="images"
                        multiple
                        onChange={handleFileChange}
                      />

                      {/* Display image previews */}
                      <div className="image-preview">
                        {images.length > 0 &&
                          images.map((image, index) => (
                            <div key={index} className="preview-item">
                              <img
                                src={image.preview}
                                alt="preview"
                                style={{ width: "100px" }}
                              />
                              <button
                                type="button"
                                onClick={() => handleDeleteImage(index)}
                                className="delete-icon"
                              >
                                <i className="fas fa-times"></i>
                              </button>
                            </div>
                          ))}
                      </div>

                      <SubmitButton
                        type="submit"
                        name="Save"
                        cls="btn btn-success btn-anim"
                      />
                    </div>
                  </form>
                </div>
              </div>
            </CardComponent>
          </div>

          <div className="col-lg-8 col-md-8 col-sm-12 col-xs-12" id="tableid">
          
          {data.length === 0 ? (
                <p>No data available</p>
              ) : (
                <DataTable
                  columns={columns}
                  data={data}
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
