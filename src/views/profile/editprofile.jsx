/* eslint-disable no-undef */

import React, { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { getHeaders } from "../../utility/getHeader";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';


import CardComponent from "../../components/cards/CardComponent";


import Header from "../../components/Header";
import Layout from "../../layout/Layout";
import { format } from "date-fns";
import { AdvanceInput } from '../../components/Buttons/advanceinput';
import { SubmitButton } from "../../components/Buttons/Textfield";
import fetchData from "../../functions/fetchData";

export default function EditProfile() {
    let currentDate = format(new Date(), "yyyy-MM-dd");
    const [data, setData] = useState([]);
    const [dataid, setDataid] = useState(0);
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        // alert(e.target);
        setFormData((prevData) => ({
            ...prevData,
            [name]: value,
        }));

    };
    const handlePasswordUpdate = async (e) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            setError("Passwords do not match!");
            return;
        }
        console.log('/updatedata1/users/id/'+dataid);

        try {
            const response = await axios.put(
                '/updatedata1/users/id/'+dataid,
                 {pass:password,  },
                 getHeaders()
             );
            //console.log(response.data);
            // Handle success, e.g. show a success message or redirect
            toast.success('Password Updated Successfully!');
        } catch (error) {
            console.error(error);
            // Handle error, e.g. show an error message
            toast.error('Error while updating passsword!');
        }
    };


    useEffect(() => {

        const fetchAndSetData = async () => {
            try {
                await fetchData('users', setData, 'id', { uname: localStorage.getItem('uname') });
                //console.log('Fetched data:', data); // Add this line for debugging
            } catch (error) {
                console.error('Error in useEffect:', error);
            }
        };

        fetchAndSetData();

    }, []);
    // Effect to extract the id from the data once it has been set
    useEffect(() => {
        if (data && data.length > 0) {
            const fetchedUserId = data[0].id; // Assuming you want the id of the first user
            setDataid(fetchedUserId);
            // console.log('Extracted User ID:', fetchedUserId);
        }
    }, [data]); // Runs every time the data changes
    return (
        <>
    
            <Layout>
                <Header title="Add New User" />
                <ToastContainer />
                <div className='row'>
                    <div class="col-lg-6 col-md-6 col-sm-12 col-xs-12">

                        <CardComponent title="Edit Profile Information" headerColor="lightblue" pull="left" bodyClass="panel-body">
                            <div class="row">
                                <div class="col-md-12">
                                    <form onSubmit={handlePasswordUpdate}>
                                        <div class="panel panel-default card-view">

                                            
                                            <AdvanceInput
                                                id="password"
                                                
                                                value={password} 
                                                onChange={(e) => setPassword(e.target.value)} 
                                              
                                                type="password"
                                                name="password"
                                                label="Enter New Password"

                                            />
                                            <AdvanceInput
                                                id="confirmpass"
                                                value={confirmPassword} 
                                                onChange={(e) => setConfirmPassword(e.target.value)} 
                                                type="password"
                                                name="confirmpass"
                                                label="Confirm Password"

                                            />

                                            {error && <p style={{ color: 'red' }}>{error}</p>}
                                            <SubmitButton
                                                type="submit"
                                                name="Update"
                                                cls="btn btn-darkblue btn-anim"
                                            />


                                        </div>
                                    </form>
                                </div>
                            </div>
                        </CardComponent>

                    </div>

                    <div class="col-lg-6 col-md-6 col-sm-12 col-xs-12">
                        {/* <ProfileCard user={data} /> */}
                        <CardComponent title="My Profile Information" headerColor="lightblue" pull="left" bodyClass="panel-body">
                            <div class="row">
                                <div class="col-md-12">
                                    {data.map((item, index) => (

                                        <>

                                            <div className="info-item"
                                                key={index}
                                            >
                                                <span>Username:</span> {item.uname}
                                            </div>
                                            <div className="info-item">
                                                <span>Email:</span> {item.email}
                                            </div>
                                            <div className="info-item">
                                                <span>Contact:</span> {item.contact}
                                            </div>
                                            <div className="info-item">
                                                <span>Last Login:</span> {item.last_loggedin}
                                            </div>
                                        </>
                                    ))}


                                </div>
                            </div>
                        </CardComponent>

                    </div>


                </div>
            </Layout>
        </>
    )
}
