import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuthToken, getUserType } from '../utility/auth'; // Import your auth functions

const Logout = () => {
    const navigate = useNavigate();

    useEffect(() => {
        // Clear authentication data
        localStorage.removeItem('token');
        localStorage.removeItem('usertype');
        localStorage.removeItem('uname');
        localStorage.removeItem('expirationTime');

        // Optionally, you can clear sessionStorage as well
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('expirationTime');
        sessionStorage.removeItem('usertype');
        sessionStorage.removeItem('uname');

        // Redirect to login page or home page
        navigate('/');
    }, [navigate]);

    return (
        <div>
            <h2>Logging out...</h2>
        </div>
    );
};

export default Logout;
