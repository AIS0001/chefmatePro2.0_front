import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axios from "axios";
import { getAuthToken, isTokenExpired, getUserType, logout } from "../../utility/auth";



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

    const handleSubmit1 = (e) => {
        e.preventDefault();
        const empdata = { uname, pass };

        axios
            .post("/login", empdata)
            .then((res) => {
                if (res.status === 200) {
                    const data = res.data;
                    if (data.token) {
                        const token = data.token; // do NOT prepend 'Bearer ' when storing
                        const usertype = data.data.type;
                        const expirationTime = Date.now() + 3 * 60 * 60 * 1000; // 3 hours

                        if (keepLoggedIn) {
                            localStorage.setItem("token", token);
                            localStorage.setItem("expirationTime", expirationTime);
                            localStorage.setItem("uname", data.data.uname);
                            localStorage.setItem("usertype", data.data.type);
                        } else {
                            sessionStorage.setItem("token", token);
                            sessionStorage.setItem("expirationTime", expirationTime);
                            sessionStorage.setItem("uname", data.data.uname);
                            sessionStorage.setItem("usertype", data.data.type);
                        }

                        toast.success("Logged in Successfully");

                        // Redirect based on user type
                        if (usertype === "admin") {
                            navigate("/dashboard/admin");
                        } else if (usertype === "account") {
                            navigate("/dashboard/account");
                        } else if (usertype === "cashier") {
                            navigate("/sale/makeinvoice");
                        } else if (usertype === "manager") {
                            navigate("/dashboard/manager");
                        }
                    }


                    else {
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
const handleSubmit = (e) => {
  e.preventDefault();
  const empdata = { uname, pass };

  axios.post("/login", empdata)
    .then((res) => {
      if (res.status === 200) {
        const data = res.data;
        if (data.token) {
          const token = data.token;
          const usertype = data.data.type;
          const expirationTime = Date.now() + 3 * 60 * 60 * 1000; // 3 hours

          if (keepLoggedIn) {
            localStorage.setItem("token", token);
            localStorage.setItem("expirationTime", expirationTime);
            localStorage.setItem("uname", data.data.uname);
            localStorage.setItem("usertype", data.data.type);
          } else {
            sessionStorage.setItem("token", token);
            sessionStorage.setItem("expirationTime", expirationTime);
            sessionStorage.setItem("uname", data.data.uname);
            sessionStorage.setItem("usertype", data.data.type);
          }

          toast.success("Logged in Successfully");

          // Add delay before redirect
          setTimeout(() => {
            if (usertype === "admin") {
              navigate("/dashboard/admin");
            } else if (usertype === "Account") {
              navigate("/dashboard/account");
            } else if (usertype === "Cashier") {
              navigate("/dashboard/cashier");
            } else if (usertype === "manager") {
              navigate("/dashboard/manager");
            }
          }, 500); // 200ms delay

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
  const token = getAuthToken();
  const userType = getUserType();
  console.log("Token:", token);
  console.log("Is expired:", isTokenExpired());
  console.log("User type:", userType);

  if (token && !isTokenExpired()) {
    switch (userType) {
      case "admin":
        navigate("/dashboard/admin");
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
                                                <h3 className="text-center txt-dark mb-10">chefMate</h3>
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
