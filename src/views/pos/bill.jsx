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

export default function Bill() {
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
      ownername: "",
      idproof: "",
      owneraddress: "",
    });

  return (
   <>
    <Layout>
        <Header title="POS System" />
        {/* <small>
          Enter the details of the new property to add it to your rental
          portfolio.
        </small> */}
        <ToastContainer />
        <div className="row">

        </div>
        </Layout>
   </>
  )
}
