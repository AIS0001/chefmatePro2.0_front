/* eslint-disable no-undef */

import React, { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { getHeaders } from "../../../utility/getHeader";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ExportDataTable from "../../../components/Buttons/ExportdataTable";
import CardComponent from "../../../components/cards/CardComponent";

import Header from '../../../components/Header';
import Layout from '../../../layout/Layout'
import { format } from "date-fns";
import { ComboBox, ComboBoxwithlabel } from '../../../components/Buttons/ComboBox';
import { AdvanceInput } from '../../../components/Buttons/advanceinput';
import { SubmitButton } from "../../../components/Buttons/Textfield";
import DataTable from "../../../components/data-tables/dataTable";
import fetchData from "../../../functions/fetchData";

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
    const columns = [
        { label: 'Name', field: 'name' },
        { label: 'Username', field: 'uname' },
        { label: 'Contact', field: 'contact' },
        { label: 'Email', field: 'email' },
        { label: 'Type', field: 'type' },
        { label: 'Last Logged in', field: 'last_loggedin' },
    ];
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        // alert(e.target);
        setFormData((prevData) => ({
            ...prevData,
            [name]: value,
        }));

    };
    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            await axios.post(
                "/register",
                {
                    name: formdata.name,
                    pass: formdata.pass,
                    contact: formdata.contact,
                    email: formdata.email,
                    type: formdata.usertype,
                    lastloggedin: currentDate,
                },
                getHeaders()
            );

            // Fetch the updated data after successful submission
            await fetchData('users', setData, 'id', {});

            toast.success('User added successfully!');
            setFormData({});
        } catch (err) {
            toast.error('Error in adding user');
            console.error(err.message);
        }

        // Clear form data and errors
        setFormData({
            name: "",
            pass: "",
            contact: "",
            email: "",
            type: "",
            lastloggedin: currentDate,
        });
        setErrors({});
    };

    //Fetch data query 
    const handleFilter = (field) => {
        // Show a filter UI or perform a filtering action based on the clicked field
        console.log(`Filter clicked for: ${field}`);
    };

    useEffect(() => {

        const fetchAndSetData = async () => {
            try {
                await fetchData('users', setData, 'id', {});
            } catch (error) {
                console.error('Error in useEffect:', error);
            }
        };

        fetchAndSetData();

    }, []);
    return (
        <>
            <Layout>
                <Header title="Add New User" />
                <ToastContainer />
                <div className='row'>
                    <div class="col-lg-4 col-md-4 col-sm-12 col-xs-12">

                        <CardComponent title="Fill User's Information" headerColor="primary" pull="left" bodyClass="panel-body">
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
                                                onChange={(e) => handleInputChange(e)}
                                                name="usertype"
                                                value={formdata.usertype}
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
                        </CardComponent>

                    </div>

                    <div class="col-lg-8 col-md-8 col-sm-12 col-xs-12">
                        <CardComponent 
                            title=""
                            headerContent={
                                    <ExportDataTable
                                        tableId="datatable1"
                                        tableData={data} // Pass complete dataset to export function
                                    />
                                }
                            headerColor="primary"
                            pull="right"
                            bodyClass="panel-body">

                            {data.length === 0 ? (
                                <p>No data available</p>
                            ) : (

                                <DataTable columns={columns} data={data} onFilter={handleFilter} />
                            )}

                        </CardComponent>

                    </div>


                </div>
            </Layout>
        </>
    )
}
