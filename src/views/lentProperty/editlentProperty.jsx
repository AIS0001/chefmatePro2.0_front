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
import { getAuthToken } from "../../utility/getHeader";
import { isTokenExpired } from "../../utility/auth";

export default function EditLentProperty() {
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
        `/updatedata/contract/${id}/${agentid}`, // Use PUT method to update
        {
       
            created_date: currentDate,
            customer_name: formdata1.customer_name.value,
            startdate: formdata1.datefrom.value,
            enddate: formdata1.datefrom.value,
            totalmonths: formdata1.months.value,
            advance: formdata1.advance_deposite.value,
            rent: formdata1.rent.value,
            description: formdata1.description.value,
      },{headers});
   
 // Optionally handle images if required
 const formData = new FormData();
 if (images && images.length > 0) {
   images.forEach((file) => {
     formData.append("images", file);
   });
 }
 if (images.length > 0) {
   // For FormData, only set Authorization header. Let axios handle Content-Type with multipart boundary
   const token = getAuthToken();
   const config = {
     headers: {
       Authorization: token && !token.startsWith('Bearer ') ? `Bearer ${token}` : token
     }
   };
   await axios.post("/addnewproduct/customer_images", formData, config);
   toast.success("Contract and images added successfully!");
 }
 if (response.data.success) {
    toast.success("Contract updated successfully!");
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
        const response = await fetchData("contract", setData, "id", where); // Fetch the data
console.log(response);
        // Set the fetched data to form fields if response[0] exists
        if (response) {
          setFormData({
            customer_name: response[0].customer_name || "",
            datefrom: response[0].startdate || "",
            dateto: response[0].enddate || "",
            months: response[0].totalmonths || "",
            advance_deposite: response[0].advance || "",
            rent: response[0].rent || "",
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
        <Header title="Edit Contract" />
        {/* <small>
          Enter the details of the new property to add it to your rental
          portfolio.
        </small> */}
        <ToastContainer />
        <div className="row">
          <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12">
            <CardComponent
              title="Contract  Information"
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
        type="datextte"
        name="datefrom"
        lable="Start"
      />
    </div>
    <div className="col-lg-4 col-md-3 col-sm-12 col-xs-12">
      <TextfieldwithLabel
        id="dateto"
        onChange={(e) => handleInputChange(e)}
        value={formdata.dateto}
        type="text"
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
        name="Update Data"
        cls="btn btn-info btn-anim "
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
