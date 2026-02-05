import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axios from "axios";
import { format } from "date-fns";
import CardComponent from "../../components/cards/CardComponent";
import Header from "../../components/Header";
import Layout from "../../layout/Layout";
import { TextfieldwithLabel } from "../../components/Buttons/Textfield";
import { ComboBox } from "../../components/Buttons/ComboBox";
import { SubmitButton } from "../../components/Buttons/Textfield";
import { getAuthToken } from "../../utility/getHeader";
import { getHeaders } from "../../utility/getHeader";
import ExportDataTable from "../../components/Buttons/ExportdataTable";
import DateDiffCalculatorPrompt from "../../components/DateDiffcalculator";

export default function NewLent() {
  let currentDate = format(new Date(), "yyyy-MM-dd");
  const [images, setImages] = useState([]);
  const [data, setData] = useState([]);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [formdata, setFormData] = useState({
    name: "",
    product_id: "",
    lastloggedin: currentDate,
  });
  const { id } = useParams(); // Extract the `id` from the URL
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

    const headers = {
      Authorization: `Bearer ${getAuthToken()}`,  // Check your token
      "Content-Type": "application/json"
    };

    const formdata1 = e.target;

    try {
      const post1 = await axios.post("/insertdata/contract", {
        agent_id: localStorage.getItem("uname"),
        property_id: id,
        created_date: currentDate,
        customer_name: formdata1.customer_name.value,
        startdate: formdata1.datefrom.value,
        enddate: formdata1.datefrom.value,
        totalmonths: formdata1.months.value,
        advance: formdata1.advance_deposite.value,
        rent: formdata1.rent.value,
        description: formdata1.description.value,
      }, { headers });
//console.log(post1);
      const formData = new FormData();
      Array.from(formdata1.images.files).forEach((file) => {
        formData.append("images", file);
      });
      //console.log(post1.data.id);
      formData.append("product_id", post1.data.id); // Assuming post1 returns item ID

      const post2 = await axios.post("/addnewproduct/customer_images", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${getAuthToken()}`, // Again, make sure the token is correct
        },
      });

     
      const response =   await axios.put(
        `/updatedata/listing/${id}/${localStorage.getItem("uname")}`, // Use PUT method to update
        {
            status: 'occupied',
      },{headers});

      toast.success("Contract created successfully!");
      setImages([]);
      setFormData({});
    } catch (err) {
      console.error("Error:", err);
      toast.error("Error in creating contract. Please check again.");
    } finally {
      setLoading(false);
    }
  };


  //   useEffect(() => {
  //     const fetchAndSetData = async () => {
  //       try {
  //         await fetchData("listing", setData, "id", {});
  //       } catch (error) {
  //         console.error("Error in useEffect:", error);
  //       }
  //     };

  //     fetchAndSetData();
  //   }, []);

  return (
    <>
      <Layout>
        <Header title="Rent property to Tenants" />
        {/* <small>
          Enter the details of the new property to add it to your rental
          portfolio.
        </small> */}
        <ToastContainer />
        <div className="row">
          <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12">
            <CardComponent
              title="Customer Details"
              headerColor="darkblue"
              pull="left"
              bodyClass="panel-body"
            >
              <form onSubmit={handleSubmit}>

                <div className="panel panel-default card-view">
                  <div className="row">

                    <div className="col-lg-4 col-md-3 col-sm-12 col-xs-12">
                      <TextfieldwithLabel
                        id="customer_name"
                        onChange={(e) => handleInputChange(e)}
                        value={formdata.customer_name}
                        type="text"
                        name="customer_name"
                        lable=" Customer Name"
                      />
                    </div>
                    <div className="col-lg-4 col-md-3 col-sm-12 col-xs-12">
                      <TextfieldwithLabel
                        id="datefrom"
                        onChange={(e) => handleInputChange(e)}
                        value={formdata.datefrom}
                        type="date"
                        name="datefrom"
                        lable="Start"
                      />
                    </div>
                    <div className="col-lg-4 col-md-3 col-sm-12 col-xs-12">
                      <TextfieldwithLabel
                        id="dateto"
                        onChange={(e) => handleInputChange(e)}
                        value={formdata.dateto}
                        type="date"
                        name="dateto"
                        lable="End"
                      />
                    </div>

                    <div className="col-lg-4 col-md-3 col-sm-12 col-xs-12">
                      <TextfieldwithLabel
                        id="months"
                        onChange={(e) => handleInputChange(e)}
                        value={formdata.months}
                        type="text"
                        name="months"
                        lable="No. of Months"
                      />
                    </div>
                    <div className="col-lg-4 col-md-3 col-sm-12 col-xs-12">
                      <TextfieldwithLabel
                        id="advance_deposite"
                        onChange={(e) => handleInputChange(e)}
                        value={formdata.advance_deposite}
                        type="text"
                        name="advance_deposite"
                        lable="Advance Deposite"
                      />
                    </div>
                    <div className="col-lg-4 col-md-3 col-sm-12 col-xs-12">
                      <TextfieldwithLabel
                        id="rent"
                        onChange={(e) => handleInputChange(e)}
                        value={formdata.rent}
                        type="text"
                        name="rent"
                        lable="Rent per month"
                      />
                    </div>
                   
                    <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12" >
                      <div className='form-group'>
                        <label className='control-label mb-10'>Description</label>
                        <textarea
                          id="description"
                          onChange={(e) => handleInputChange(e)}
                          name="description"
                          className="form-control"
                          value={formdata.description}


                        />
                      </div>
                    </div>
                    <div className="col-lg-4 col-md-4 col-sm-12 col-xs-12">
                      <div className='form-group'>
                        <label className='control-label mb-10'>Upload Document/Images</label>
                        <input
                          type="file"
                          name="images"
                          multiple
                          onChange={handleFileChange}
                        />
                      </div>
                 
                    </div>
                    <div className="col-lg-8 col-md-8 col-sm-12 col-xs-12">
                    <label className='control-label mb-12'> </label>
                      <SubmitButton
                        type="submit"
                        name="Save Data"
                        cls="btn btn-primary btn-anim "
                      />
                    </div>
                    <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12">
                    <div className="image-preview">
                        {images.length > 0 &&
                          images.map((image, index) => (
                            <div key={index} className="preview-item">
                              <img
                                src={image.preview}
                                alt="preview"
                                style={{ width: "100px" }}
                              />
                              <div className="col-lg-4 col-md-3 col-sm-12 col-xs-12">
                                <div className='form-group'>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteImage(index)}
                                    className="delete-icon"
                                  >
                                    <i className="fas fa-times"></i>
                                  </button>
                                </div>
                              </div>
                            </div>

                          ))}
                      </div>
                    </div>
                    </div>
                    
                   

                </div>
              </form>
            </CardComponent>
          </div>
        </div>
      </Layout>
    </>
  );
}
