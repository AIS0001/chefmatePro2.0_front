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
import { useParams } from "react-router-dom";
import fetchData from "../../functions/fetchData";
import { isTokenExpired } from "../../utility/auth";

export default function EditProperty() {
    isTokenExpired();
  let currentDate = format(new Date(), "yyyy-MM-dd");
  const [images, setImages] = useState([]);
  const [data, setData] = useState([]);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [formdata, setFormData] = useState({
    name: "",
    product_id: "",
    lastloggedin: currentDate,
    property_name: "",
    address: "",
    totalrooms: "",
    totaltoilets: "",
    floor: "",
    roomno: "",
    property_type: "",
    description: "",
  });
  const { id ,agentid} = useParams(); // Extract the `id` from the URL

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
      const response =   await axios.put(
        `/updatedata/listing/${id}/${agentid}`, // Use PUT method to update
        {
       
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
      },{headers});
   
 // Optionally handle images if required
 const formData = new FormData();
 Array.from(formdata1.images.files).forEach((file) => {
   formData.append("images", file);
 });
 if (images.length > 0) {
   await axios.post("/addnewproduct/images", formData, {
     headers: {
       "Content-Type": "multipart/form-data",
       Authorization: `Bearer ${localStorage.getItem("token")}`,
     },
   });
   toast.success("Listing and images added successfully!");
 }
 if (response.data.success) {
    toast.success("Listing updated successfully!");
  } else {
    toast.error(response.data.message || "Error updating data.");
  }
    
      setImages([]);
      setFormData({});
    } catch (err) {
        console.error("Error:", err);
        toast.error("Error in updating data. Please check again.");
      } finally {
        setLoading(false); // Reset loading state
      }
  };


   // Fetch property data by id and agentid
   useEffect(() => {
    const fetchPropertyData = async () => {
      try {
        const where = { id:id, agent_id: agentid }; // Use id and agentid to fetch the data
        const response = await fetchData("listing", setData, "id", where); // Fetch the data
console.log(response);
        // Set the fetched data to form fields if response[0] exists
        if (response) {
          setFormData({
            property_name: response[0].property_name || "",
            address: response[0].address || "",
            totalrooms: response[0].totalrooms || "",
            building: response[0].building || "",
            totaltoilets: response[0].totaltoilets || "",
            floor: response[0].floor || "",
            roomno: response[0].room || "",
            property_type: response[0].type || "",
            description: response[0].description || "",
          });
        }
      } catch (error) {
        console.error("Error fetching property data:", error);
      }
    };

    fetchPropertyData();
  }, [id, agentid]);

  return (
    <>
      <Layout>
        <Header title="Edit Property" />
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
                        name="Update Record"
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
