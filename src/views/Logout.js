// components/Logout.js

import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { logout } from '../utility/auth';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const Logout = () => {
  const navigate = useNavigate();

  useEffect(() => {
    logout(); // Clear localStorage and sessionStorage
    toast.info("You have been logged out.");
    setTimeout(() => {
      navigate('/', { replace: true }); // Redirect to login page
    }, 1500); // Optional delay to show toast
  }, [navigate]);

  return (
    <>
      <ToastContainer />
      <div className="text-center mt-5">
        <h2>Logging out...</h2>
      </div>
    </>
  );
};

export default Logout;
