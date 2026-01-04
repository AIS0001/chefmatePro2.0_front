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

import { TextfieldwithLabel } from "../../../components/Buttons/Textfield";
import { SubmitButton } from "../../../components/Buttons/Textfield";
import DataTable from "../../../components/data-tables/dataTable";
import SimpleDataTable from "../../../components/data-tables/SimpledataTable";
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
        usertype: "",
        lastloggedin: currentDate,
    });
    const columns = [
        { label: 'Name', field: 'name' },
        { label: 'Uname', field: 'uname' },
        { label: 'Contact', field: 'contact' },
        { label: 'Email', field: 'email' },
        { label: 'Type', field: 'type' },
        { label: 'Last Loggedin', field: 'last_loggedin' },
        { label: "Actions", field: "actions" }
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
            setFormData({
                name: "",
                pass: "",
                contact: "",
                email: "",
                usertype: "",
                lastloggedin: currentDate,
            });
        } catch (err) {
            toast.error('Error in adding user');
            console.error(err.message);
        }

        // Clear errors
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
                console.log('Fetched data:', data); // Add this line for debugging
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

                        <CardComponent title="Fill User's Information" headerColor="darkblue" pull="left" bodyClass="panel-body">
                            <div class="row">
                                <div class="col-md-12">
                                    <form onSubmit={handleSubmit}>
                                        <div class="panel panel-default card-view">

                                            <TextfieldwithLabel
                                                id="name"
                                                onChange={(e) => handleInputChange(e)}
                                                value={formdata.name}
                                                type="text"
                                                name="name"
                                                lable="Name"

                                            />
                                            <TextfieldwithLabel
                                                id="pass"
                                                onChange={(e) => handleInputChange(e)}
                                                value={formdata.pass}
                                                type="password"
                                                name="pass"
                                                lable="Password"

                                            />
                                            <TextfieldwithLabel
                                                id="contact"
                                                onChange={(e) => handleInputChange(e)}
                                                value={formdata.contact}
                                                type="text"
                                                name="contact"
                                                lable="Contact"

                                            />
                                            <TextfieldwithLabel
                                                id="email"
                                                onChange={(e) => handleInputChange(e)}
                                                value={formdata.email}
                                                type="text"
                                                name="email"
                                                lable="Email"

                                            />
                                            <div className="combo-box-container">
                                            <div className='combo-box'>
                                                <label className='control-label mb-10'>Type</label>
                                                <select
                                                    id="usertype"
                                                    onChange={(e) => handleInputChange(e)}
                                                    name="usertype"
                                                    value={formdata.usertype}
                                                    className='combo-box-select'
                                                    data-style='form-control btn-default btn-outline'
                                                >
                                                    <option value="Admin">Admin </option>
                                                    <option value="Cashier">Cashier </option>
                                                    <option value="Account">Account </option>

                                                </select>
                                                <div className="combo-box-arrow"></div>
                                            </div>
                                            <div className="form-group">
                                            <label className='control-label mb-12'></label>
                                            <SubmitButton
                                                type="submit"
                                                name="Save"
                                                cls="btn btn-success btn-anim"
                                            />
                                            </div>
                                          


                                        </div>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        </CardComponent>

                    </div>
                    {/* <ExportDataTable
                                tableId="tableid"
                                tableData={data} /> */}
                    <div class="col-lg-8 col-md-8 col-sm-12 col-xs-12" id="tableid">
                        {data.length === 0 ? (
                            <p>No data available</p>
                        ) : (
                            //  <DataTable columns={columns} data={data} onFilter={handleFilter} />
                            <DataTable columns={columns} data={data} tablename="users" />
                        )}

                        {/* <CardComponent 
                            title=""
                            headerContent=
                            {
                            <ExportDataTable
                                tableId="datatable1"
                                tableData={data} // Pass complete dataset to export function
                            />
                            }
                            headerColor="lightblue"
                            pull="right"
                            bodyClass="panel-body">

                            {data.length === 0 ? (
                                <p>No data available</p>
                            ) : (
                                 <DataTable columns={columns} data={data} onFilter={handleFilter} />
                                //<SimpleDataTable columns={columns} data={data}/>
                            )}

                        </CardComponent> */}

                    </div>


                </div>
            </Layout>
        </>
    )
}
