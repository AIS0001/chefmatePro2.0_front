import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axios from "axios";
import { format } from "date-fns";
import CardComponent from "../../components/cards/CardComponent";
import Header from "../../components/Header";
import Layout from "../../layout/Layout";
import {
  TextfieldwithLabel,
  Textfield,
} from "../../components/Buttons/Textfield";
import { ComboBox } from "../../components/Buttons/ComboBox";
import { SubmitButton } from "../../components/Buttons/Textfield";

const itemPrices = Array.from({ length: 9 }, (_, index) => 100 + index * 50);
export default function NewPOS() {
  let currentDate = format(new Date(), "yyyy-MM-dd");
  const [images, setImages] = useState([]);
  const [data, setData] = useState([]);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [quantities, setQuantities] = useState(Array(9).fill(0));
  const [total, setTotal] = useState(0);
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
    ownername: "",
    idproof: "",
    owneraddress: "",
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
      Authorization: `Bearer ${localStorage.getItem("token")}`, // Check your token
      "Content-Type": "application/json",
    };

    const formdata1 = e.target;

    try {
      const post1 = await axios.post(
        "/insertdata/listing",
        {
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
          ownername: formdata1.ownername.value,
          idproof: formdata1.idproof.value,
          owneraddress: formdata1.owneraddress.value,
        },
        { headers }
      );

      const formData = new FormData();
      Array.from(formdata1.images.files).forEach((file) => {
        formData.append("images", file);
      });
      console.log(post1.data.id);
      formData.append("product_id", post1.data.id); // Assuming post1 returns item ID

      const post2 = await axios.post("/addnewproduct/images", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${localStorage.getItem("token")}`, // Again, make sure the token is correct
        },
      });

      toast.success("Product and images added successfully!");
      setImages([]);
      setFormData({});
    } catch (err) {
      console.error("Error:", err);
      toast.error(
        "Error in creating new product or uploading images. Please check again."
      );
    } finally {
      setLoading(false);
    }
  };
  const addItemToOrder = (index) => {
    const newQuantities = [...quantities];
    newQuantities[index] += 1; // Increment the quantity of the clicked item
    setQuantities(newQuantities);
    updateTotal(newQuantities);
  };
  const handleTableSelect = (tableNumber) => {
    // Perform your action here, e.g., updating state or navigating to another page
    console.log(`Table ${tableNumber} selected`);
    // Add any additional logic needed when a table is selected
  };

  const updateTotal = (newQuantities) => {
    const newTotal = newQuantities.reduce(
      (acc, qty, index) => acc + qty * itemPrices[index],
      0
    );
    setTotal(newTotal);
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
        <Header title="POS System" />
        {/* <small>
          Enter the details of the new property to add it to your rental
          portfolio.
        </small> */}
        <ToastContainer />
        <div className="row mt-4">
          <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12">
            <CardComponent
              title="View All Tables List"
              headerColor="darkblue"
              pull="left"
              bodyClass="panel-body"
            >
              <div
                id="collapseOne"
                className="collapse"
                aria-labelledby="headingOne"
                data-parent="#accordion"
              >
                <div className="panel panel-default card-view">
                  <div className="row">
                    {/* Example of tables - dynamically generate this */}
                    {Array.from({ length: 20 }).map((_, index) => (
                      <div
                        key={index}
                        className="col-lg-2 col-md-4 col-sm-6 col-12 mb-3"
                      >
                        <div
                          className={`table-card p-3 text-center border w-100 table-color-${
                            index % 4
                          }`}
                          onClick={() => handleTableSelect(index + 1)} // Action performed on click
                          style={{ cursor: "pointer" }} // Change cursor to pointer
                        >
                          <img
                            src={`../../dist/img/tables/table.png`} // Replace with the path to your table image
                            alt={`Table ${index + 1}`}
                            className="img-fluid mb-2" // Ensure it scales nicely
                            style={{ width: "50px", height: "50px" }} // Set size as needed
                          />
                          <h6>Table {index + 1}</h6>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardComponent>
          </div>
        </div>

        <div className="row">
          <div className="col-lg-10 col-md-10 col-sm-12 col-xs-12">
            <Textfield
              id="search"
              onChange={(e) => handleInputChange(e)}
              value={formdata.search}
              type="text"
              name="search"
              placeholder="Search Product"
            />
          </div>
          <div className="col-lg-2 col-md-2 col-sm-12 col-xs-12">
            <button
              className="btn btn-info btn-anim"
              data-toggle="collapse"
              data-target="#collapseOne"
              aria-expanded="true"
              aria-controls="collapseOne"
            >
              Table List
            </button>
          </div>
        </div>
        <div className="row">
          <div className="col-lg-2 col-md-3 col-sm-4 col-xs-12">
            <CardComponent
              title="Categories"
              headerColor="danger"
              pull="left"
              bodyClass="panel-body"
            >
              <div className="panel panel-default card-view">
                <div className="item-list-container">
                  <div className="row">
                    {[
                      "Food",
                      "Drinks",
                      "Starter",
                      "Ala-Carte",
                      "Veg",
                      "Non-Veg",
                      "Rice",
                      "Roti",
                      "Sweets",
                    ].map((category, index) => (
                      <div key={index} className="col-12 mb-2">
                        <Link
                          to="/pos/newpos"
                          className="btn btn-danger btn-anim fixed-width-btn"
                        >
                          {category}
                        </Link>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardComponent>
          </div>
          {/* Item list */}
          <div className="col-lg-7 col-md-7 col-sm-8 col-xs-12">
            <CardComponent
              title="Items"
              headerColor="darkblue"
              pull="left"
              bodyClass="panel-body"
            >
              <div className="panel panel-default card-view">
                <div className="item-list-container">
                  <div className="row mt-3">
                    {Array.from({ length: 9 }).map((_, index) => (
                      <div
                        key={index}
                        className="col-lg-3 col-md-4 col-sm-6 col-xs-12 mb-3"
                      >
                        <div className="item-card text-center">
                          <img
                            src={`../../dist/img/food/f${index + 1}.jpg`}
                            alt={`Item ${index + 1}`}
                            onClick={() => addItemToOrder(index)}
                            className="item-image"
                          />
                          <h5 className="item-name">Item Name {index + 1}</h5>
                          <p className="item-price">฿ {itemPrices[index]}.00</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardComponent>
          </div>
          {/* Order Summary */}
          <div className="col-lg-3 col-md-3 col-sm-4 col-xs-12">
            <CardComponent
              title="Order Summary"
              headerColor="info"
              pull="left"
              bodyClass="panel-body"
            >
              <div className="panel panel-default card-view">
                <div className="row">
                  <div className="col-12">
                    {quantities.map(
                      (qty, index) =>
                        qty > 0 && (
                          <div
                            className="order-item d-flex align-items-center justify-content-between mb-2"
                            key={index}
                          >
                            <h5 className="item-name mb-0">
                              Item Name {index + 1} x {qty} = ฿{" "}
                              {qty * itemPrices[index]}
                            </h5>
                            <div className="quantity-controls d-flex align-items-center">
                              <button
                                className="btn btn-dark-custom btn-sm me-2"
                                onClick={() => {
                                  const newQuantities = [...quantities];
                                  if (newQuantities[index] > 0) {
                                    newQuantities[index] -= 1;
                                    setQuantities(newQuantities);
                                    updateTotal(newQuantities);
                                  }
                                }}
                              >
                                -
                              </button>
                              <span className="quantity me-2">{qty}</span>
                              <button
                                className="btn btn-dark-custom btn-sm"
                                onClick={() => {
                                  const newQuantities = [...quantities];
                                  newQuantities[index] += 1;
                                  setQuantities(newQuantities);
                                  updateTotal(newQuantities);
                                }}
                              >
                                +
                              </button>
                            </div>
                          </div>
                        )
                    )}
                    <div className="total-container mt-3 d-flex justify-content-between align-items-center">
                      <h5>
                        Total:{" "}
                        <span className="total-amount">
                          ฿ {total.toFixed(2)}
                        </span>
                      </h5>
                      <button className="btn btn-primary">Checkout</button>
                    </div>
                  </div>
                </div>
              </div>
            </CardComponent>
          </div>
        </div>
        {/* New Row for Action Buttons */}
        <div className="row mt-3">
          <div className="col-12">
            <div className="d-flex justify-content-between flex-wrap mx-3">
              {" "}
              {/* Added mx-3 for equal horizontal spacing */}
              <button className="btn btn-success mb-2">Print Order</button>
              <button className="btn btn-warning mb-2">Check Bill</button>
              <button className="btn btn-info mb-2">Last Order</button>
              <button className="btn btn-primary mb-2">Generate Bill</button>
              <button className="btn btn-darkblue mb-2">Save Bill</button>
              <button className="btn btn-danger mb-2">Next Order</button>
              <button className="btn btn-darkblue mb-2">Previous Order</button>
              <button className="btn btn-warning mb-2">Save Bill</button>
              <button className="btn btn-danger mb-2">Next Order</button>
              <button className="btn btn-primary mb-2">Previous Order</button>
            </div>
          </div>
        </div>
      </Layout>
    </>
  );
}
