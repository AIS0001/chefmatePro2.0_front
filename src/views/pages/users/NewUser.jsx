/* eslint-disable no-undef */

import React, { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import Header from '../../../components/Header';
import Layout from '../../../layout/Layout'
import { format } from "date-fns";
import { ComboBox, ComboBoxwithlabel } from '../../../components/Buttons/ComboBox';
import { AdvanceInput } from '../../../components/Buttons/advanceinput';
import { SubmitButtons } from "../../../components/Buttons/SubmitButton";
import { SubmitButton } from "../../../components/Buttons/Textfield";


export default function NewUser() {
    let currentDate = format(new Date(), "yyyy-MM-dd");
    //  const headers = { Authorization: authheader().access_token };
    const [data, setData] = useState([]);
    const [errors, setErrors] = useState({});
    const [formdata, setFormData] = useState({
        name: "",
        pass: "",
        contact: "",
        email: "",
        type: "",
        lastloggedin: currentDate,
    });

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prevData) => ({
            ...prevData,
            [name]: value,
        }));

    };
  const handleSubmit = (e) => {
    e.preventDefault();
    const formdata1 = e.target;
  
    axios
      .post(
        "/register",
        {
          name: formdata1.name.value,
          pass: formdata1.pass.value,
          contact: formdata1.contact.value,
          email: formdata1.email.value,
          type: formdata1.usertype.value,
          lastloggedin: currentDate,
        },
        { headers }
      )
      .then((res) => {
        fetchData("users", setData, "id");
        toast.success('user added successfully!');
       
       setFormData({
        name: "",
    pass: "",
    contact: "",
    email: "",
    type: "",
    lastloggedin: currentDate,
       })
      })
      .catch((err) => {
       // alert(err.message)
       toast.error('Error in adding user');
        console.log(err.message);
      });
    // handleAddRecord(formdata);
    setFormData({});
    setErrors({});
  };

    useEffect(() => {
        console.log(formdata);
        // $('#action').select2(); 

    }, []);
    return (
        <>
            <Layout>
                <Header title="Add New User" />

                <div className='row'>
                    <div class="col-lg-4 col-md-4 col-sm-4 col-xs-4">
                        <div class="panel panel-primary card-view">
                            <div class="panel-heading">
                                <div class="pull-left">
                                    <h6 class="panel-title txt-light">panel danger</h6>
                                </div>
                                <div class="clearfix"></div>
                            </div>
                            <div class="panel-wrapper collapse in">
                                <div class="panel-body">

                                    <div class="row">
                                        <div class="col-md-12">
                                            <form onSubmit={handleSubmit}>
                                                <div class="panel panel-default card-view">

                                                    <AdvanceInput
                                                        id="name"
                                                        onChange={(e) => handleInputChange(e)}
                                                        value={formdata.name}
                                                        type="text"
                                                        name="name"
                                                        label="Name"

                                                    />
                                                    <AdvanceInput
                                                        id="pass"
                                                        onChange={(e) => handleInputChange(e)}
                                                        value={formdata.pass}
                                                        type="password"
                                                        name="pass"
                                                        label="Password"

                                                    />
                                                    <AdvanceInput
                                                        id="contact"
                                                        onChange={(e) => handleInputChange(e)}
                                                        value={formdata.contact}
                                                        type="text"
                                                        name="contact"
                                                        label="Contact"

                                                    />
                                                    <AdvanceInput
                                                        id="email"
                                                        onChange={(e) => handleInputChange(e)}
                                                        value={formdata.email}
                                                        type="text"
                                                        name="email"
                                                        label="Email"

                                                    />
                                                    <ComboBox
                                                        id="usertype"
                                                        tablename="usertypes"
                                                        groupby="name"
                                                    />

                                                    <SubmitButton
                                                        type="submit"
                                                        name="Save"
                                                        cls="btn btn-success btn-anim"
                                                    />


                                                </div>
                                            </form>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="col-lg-8 col-md-8 col-sm-8 col-xs-8">
                        <div class="panel panel-danger card-view">
                            <div class="panel-heading">
                                <div class="pull-left">
                                    <h6 class="panel-title txt-light">Action</h6>
                                </div>
                                <div class="clearfix"></div>
                            </div>
                            <div class="panel-wrapper collapse in">
                                <div class="panel-body">

                                </div>
                            </div>
                        </div>
                    </div>


                </div>
            </Layout>
        </>
    )
}
