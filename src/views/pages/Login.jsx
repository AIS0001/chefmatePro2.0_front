import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axios from "axios";
import { getAuthToken,isTokenExpired,getUserType } from "../../utility/auth";


export default function Login() {
    const [toaster, setToaster] = useState({ isOpen: false, message: "" });
    const [uname, unamechange] = useState("");
    const [pass, passchange] = useState("");
    const [keepLoggedIn, setKeepLoggedIn] = useState(false); // State for "Keep Me Logged In"
    const navigate = useNavigate();

    const showToast = (message) => {
        setToaster({ isOpen: true, message });
        setTimeout(() => {
            setToaster({ isOpen: false, message: "" });
        }, 3000); // Close the toaster after 3 seconds
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const empdata = { uname, pass };

        axios
            .post("/login", empdata)
            .then((res) => {
                if (res.status === 200) {
                    const data = res.data;
                    if (data.token) {
                        const modifytoken = `Bearer ` + data.token;
                        const usertype = data.data.type;

                        // Calculate token expiration time
                        const expirationTime = keepLoggedIn 
                            ? new Date().getTime() + 7 * 24 * 60 * 60 * 1000 // 7 days
                            : new Date().getTime() + 60 * 60 * 1000; // 1 hour

                        // Store token and expiration time
                        if (keepLoggedIn) {
                            localStorage.setItem("token", JSON.stringify(modifytoken));
                            localStorage.setItem("expirationTime", expirationTime);
                            localStorage.setItem("uname", data.data.uname);
                            localStorage.setItem("usertype", data.data.type);
                        } else {
                          
                            sessionStorage.setItem("token", JSON.stringify(modifytoken));
                            sessionStorage.setItem("expirationTime", expirationTime);
                            sessionStorage.setItem("uname", data.data.uname);
                            sessionStorage.setItem("usertype", data.data.type);
                        }
                        
                        

                        toast.success("Logged in Successfully");

                        if (usertype === "admin") {
                            navigate("/pages/newpage");
                        } else if (usertype === "account") {
                            navigate("/dashboard/account");
                        } else if (usertype === "cashier") {
                            navigate("/sale/makeinvoice");
                        } else if (usertype === "manager") {
                            navigate("/dashboard/manager");
                        }
                    } else {
                        toast.error("Wrong username/Password");
                    }
                } else if (res.status === 401) {
                    toast.error("Wrong username/Password");
                }
            })
            .catch((err) => {
                toast.error("Wrong username/Password");
                console.log(err.message);
            });
    };

    useEffect(() => {
        // Check if user is already authenticated
        const token = getAuthToken();
        const userType = getUserType();
        if (token && !isTokenExpired()) {
            // Redirect based on user type
            switch (userType) {
                case "admin":
                    navigate("/users/editprofile");
                    break;
                case "account":
                    navigate("/dashboard/account");
                    break;
                case "cashier":
                    navigate("/sale/makeinvoice");
                    break;
                case "manager":
                    navigate("/dashboard/manager");
                    break;
                default:
                    navigate("/");
                    break;
            }
        }
    }, [navigate]);

    return (
        <>
            <ToastContainer />
            <div className="login-page">
                {/* Left Column - Login Form */}
                <div className="login-form-container">
                    <div className="table-struct ">
                        <div className="table-cell vertical-align-middle auth-form-wrap">
                            <div className="auth-form ml-auto mr-auto no-float">
                                <div className="row">
                                    <div className="col-sm-12 col-xs-12">
                                        <div className="form-wrap">
                                            <form className="login-form" onSubmit={handleSubmit}>
                                                <h3 className="text-center txt-dark mb-10">Sign in to CloudNet</h3>
                                                <div className="form-group">
                                                    <label className="control-label mb-10" htmlFor="uname">UserID</label>
                                                    <input 
                                                        type="text" 
                                                        className="form-control" 
                                                        required 
                                                        id="uname"
                                                        value={uname}
                                                        onChange={(e) => unamechange(e.target.value)} 
                                                        placeholder="Enter Username" 
                                                    />
                                                </div>
                                                <div className="form-group">
                                                    <label className="pull-left control-label mb-10" htmlFor="pass">Password</label>
                                                    <Link className="capitalize-font txt-primary block mb-10 pull-right font-12" to="/forgot-password">Forgot password?</Link>
                                                    <div className="clearfix"></div>
                                                    <input 
                                                        type="password" 
                                                        className="form-control" 
                                                        required 
                                                        id="pass"
                                                        value={pass}
                                                        onChange={(e) => passchange(e.target.value)} 
                                                        placeholder="Enter Password" 
                                                    />
                                                </div>
                                                <div className="form-group">
                                                    <div className="checkbox checkbox-primary pr-10 pull-left">
                                                        <input 
                                                            id="checkbox_2" 
                                                            type="checkbox" 
                                                            checked={keepLoggedIn}
                                                            onChange={() => setKeepLoggedIn(!keepLoggedIn)} 
                                                        />
                                                        <label htmlFor="checkbox_2"> Keep me logged in</label>
                                                    </div>
                                                    <div className="clearfix"></div>
                                                </div>
                                                <div className="form-group text-center">
                                                    <button type="submit" className="btn btn-info btn-rounded">Sign in</button>
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
                    {/* Add your images or content here */}
                </div>
            </div>
        </>
    );
}
