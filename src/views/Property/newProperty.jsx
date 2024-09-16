import React, { useEffect, useState } from "react";
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
import { getHeaders } from "../../utility/getHeader";
import ExportDataTable from "../../components/Buttons/ExportdataTable";


export default function NewProperty() {
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
      Authorization: `Bearer ${localStorage.getItem("token")}`,  // Check your token
      "Content-Type": "application/json"
    };

    const formdata1 = e.target;

    try {
      const post1 = await axios.post("/insertdata/listing", {
        agent_id: localStorage.getItem("uname"),
        created_date: currentDate,
        property_name: formdata1.property_name.value,
        address: formdata1.address.value,
        totalrooms: formdata1.totalrooms.value,
        totaltoilets: formdata1.totaltoilets.value,
        building: formdata1.property_name.value,
        floor: formdata1.floor.value,
        room: formdata1.roomno.value,
        type: formdata1.property_type.value,
        description: formdata1.description.value,
      }, { headers });

      const formData = new FormData();
      Array.from(formdata1.images.files).forEach((file) => {
        formData.append("images", file);
      });
      console.log(post1.data.id);
      formData.append("product_id", post1.data.id); // Assuming post1 returns item ID

      const post2 = await axios.post("/addnewproduct/images", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${localStorage.getItem("token")}`,  // Again, make sure the token is correct
        },
      });

      toast.success("Product and images added successfully!");
      setImages([]);
      setFormData({});
    } catch (err) {
      console.error("Error:", err);
      toast.error("Error in creating new product or uploading images. Please check again.");
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
        <Header title="Add New Property" />
        {/* <small>
          Enter the details of the new property to add it to your rental
          portfolio.
        </small> */}
        <ToastContainer />
        <div className="row">
          <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12">
            <CardComponent
              title="Property  Information"
              headerColor="darkblue"
              pull="left"
              bodyClass="panel-body"
            >
              <form onSubmit={handleSubmit}>

                <div className="panel panel-default card-view">
                  <div className="row">

                    <div className="col-lg-4 col-md-3 col-sm-12 col-xs-12">
                      <TextfieldwithLabel
                        id="property_name"
                        onChange={(e) => handleInputChange(e)}
                        value={formdata.property_name}
                        type="text"
                        name="property_name"
                        lable=" Property Name"
                      />
                    </div>
                    <div className="col-lg-4 col-md-3 col-sm-12 col-xs-12">
                      <TextfieldwithLabel
                        id="totalrooms"
                        onChange={(e) => handleInputChange(e)}
                        value={formdata.totalrooms}
                        type="text"
                        name="totalrooms"
                        lable="No. of Rooms"
                      />
                    </div>
                    <div className="col-lg-4 col-md-3 col-sm-12 col-xs-12">
                      <TextfieldwithLabel
                        id="totaltoilets"
                        onChange={(e) => handleInputChange(e)}
                        value={formdata.totaltoilets}
                        type="text"
                        name="totaltoilets"
                        lable="No. of Toilets"
                      />
                    </div>
                    <div className="col-lg-4 col-md-3 col-sm-12 col-xs-12">
                      <TextfieldwithLabel
                        id="address"
                        onChange={(e) => handleInputChange(e)}
                        value={formdata.address}
                        type="text"
                        name="address"
                        lable="Address"
                      />
                    </div>
                    <div className="col-lg-4 col-md-3 col-sm-12 col-xs-12">
                      <TextfieldwithLabel
                        id="building"
                        onChange={(e) => handleInputChange(e)}
                        value={formdata.building}
                        type="text"
                        name="building"
                        lable="Building"
                      />
                    </div>
                    <div className="col-lg-4 col-md-3 col-sm-12 col-xs-12">
                      <TextfieldwithLabel
                        id="floor"
                        onChange={(e) => handleInputChange(e)}
                        value={formdata.floor}
                        type="text"
                        name="floor"
                        lable="Floor"
                      />
                    </div>
                    <div className="col-lg-4 col-md-3 col-sm-12 col-xs-12">
                      <TextfieldwithLabel
                        id="roomno"
                        onChange={(e) => handleInputChange(e)}
                        value={formdata.roomno}
                        type="text"
                        name="roomno"
                        lable="Room no."
                      />
                    </div>
                    <div className="col-lg-4 col-md-3 col-sm-12 col-xs-12">

                      <ComboBox
                        id="property_type"
                        onChange={(e) => handleInputChange(e)}
                        name="property_type"
                        value={formdata.property_type}
                        tablename="property_type"
                        groupby="type"
                        lable="Type"
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
                        <label className='control-label mb-10'>Upload Images</label>
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
                        name="Add New Property"
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
