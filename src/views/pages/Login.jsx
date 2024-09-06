/* eslint-disable no-undef */
import { Link, useNavigate } from "react-router-dom";
import React, { useState, useEffect, useContext } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axios from "axios";

export default function Login() {
    const [toaster, setToaster] = useState({ isOpen: false, message: "" });

    const showToast = (message) => {
        setToaster({ isOpen: true, message });
        setTimeout(() => {
            setToaster({ isOpen: false, message: "" });
        }, 3000); // Close the toaster after 3 seconds
    };
    const [uname, unamechange] = useState("");
    const [pass, passchange] = useState("");
    const navigate = useNavigate();

    const handleSubmit = (e) => {
        e.preventDefault();
        const empdata = { uname, pass };
        //console.log(uname);
        //console.log(pass);
        axios
            .post("/login", empdata)
            .then((res) => {
                if (res.status === 200) {
                    const data = res.data;
                //  console.log(data);
                    const { expiresIn } = data;
                    if (res.data.token) {
                        // alert("Status 200");
                        // setIsLoggedIn(true);
                        const modifytoken = `Bearer ` + res.data.token;
                        const usertype = res.data.data.type;
                        localStorage.setItem("token", JSON.stringify(modifytoken));
                        localStorage.setItem("uname", res.data.data.uname);
                        localStorage.setItem("usertype", res.data.data.type);
                        // Store token and expiration time in localStorage
                        // Calculate token expiration time
                        const expirationTime = new Date().getTime() + 1000 * 1000;
                        localStorage.setItem("expirationTime", expirationTime);
                        toast.success("Logged in Successfully");
                        if (usertype === "admin") {

                            window.location.href = "/pages/newpage";

                            // navigate("/master/groups");
                        } else if (usertype === "account") {
                            window.location.href = "/dashboard/account";
                            //navigate("/account/dashboard");
                        }
                        else if (usertype === "cashier") {
                            window.location.href = "/sale/makeinvoice";
                            // navigate("/sale/makeinvoice");
                        }
                        else if (usertype === "manager") {
                            window.location.href = "/dashboard/manager";
                            // navigate("/sale/makeinvoice");
                        }
                    } else {
                        //console.log("Wrong Username or Password");
                        toast.error("Wrong username/Password");
                    }
                } else if (res.status === 401) {
                    toast.error("Wrong username/Password");
                    // alert("Wrong Username or Password");
                }
            })
            .catch((err) => {
                //navigate("/");
                //alert("Wrong Username or Passwordcccc");
                toast.error("Wrong username/Password");
                console.log(err.message);
            });
    };

    useEffect(() => {

        // $('#action').select2(); 

    }, []);
    return (
        <>
  <ToastContainer />
<div className="login-page">
      {/* Left Column - Login Form */}
      <div className="login-form-container">
       
      <div className="table-struct ">
                            <div className="table-cell vertical-align-middle auth-form-wrap">
                                <div className="auth-form  ml-auto mr-auto no-float">
                                    <div className="row">
                                        <div className="col-sm-12 col-xs-12">
                                            {/* <div className="mb-30">
                                                <h3 className="text-center txt-dark mb-10">Sign in to start your session</h3>
                                                <h6 className="text-center nonecase-font txt-grey">Enter your details below</h6>
                                            </div> */}
                                            
                                            <div className="form-wrap">
                                           
                                                <form className="login-form" onSubmit={handleSubmit}>
                                                <h3 className="text-center txt-dark mb-10">Sign in to CloudNet</h3>
                                                    <div className="form-group">
                                                        <label class="control-label mb-10" htmlFor="exampleInputEmail_2">UserID</label>
                                                        <input type="text" class="form-control" required="" id="uname"
                                                            value={uname}
                                                            onChange={(e) => unamechange(e.target.value)} placeHolder="Enter Username" />
                                                    </div>
                                                    <div className="form-group">
                                                        <label class="pull-left control-label mb-10" htmlFor="exampleInputpwd_2">Password</label>
                                                        <Link class="capitalize-font txt-primary block mb-10 pull-right font-12" to="forgot-password.html">forgot password ?</Link>
                                                        <div className="clearfix"></div>
                                                        <input type="password" class="form-control" required="" id="pass"
                                                            value={pass}
                                                            onChange={(e) => passchange(e.target.value)} placeHolder="Enter Password" />
                                                    </div>

                                                    <div className="form-group">
                                                        <div className="checkbox checkbox-primary pr-10 pull-left">
                                                            <input id="checkbox_2" required="" type="checkbox" />
                                                            <label htmlFor="checkbox_2"> Keep me logged in</label>
                                                        </div>
                                                        <div className="clearfix"></div>
                                                    </div>
                                                    <div className="form-group text-center">
                                                        <button type="submit" className="btn btn-info btn-rounded">sign in</button>
                                                    </div>
                                                </form>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
      </div>
          {/* Right Column - SaaS Product Pictures */}
          <div className="product-images-container">
       
      </div>
    </div>

          
           
        </>
    )
}