import React from 'react';
import ReactDOM from 'react-dom/client';
// Import FontAwesome CSS in your entry point file, usually index.js or App.js
import '@fortawesome/fontawesome-free/css/all.min.css';
import axios from "axios";
import App from './App';
import reportWebVitals from './reportWebVitals';
import { startOfDay } from 'date-fns';

// export const baseURL = "https://sharmachefapi.cloudnetsoftwares.com";  // Use export
// axios.defaults.baseURL = "https://sharmachefapi.cloudnetsoftwares.com/api/";

// export const baseURL = "https://www.chefmateapi.cloudnetsoftwares.com";  // Use export
// axios.defaults.baseURL = "https://www.chefmateapi.cloudnetsoftwares.com/api/";

//  export const baseURL = "https://www.pindapi.livecloudnet.com";  // Use export
//  axios.defaults.baseURL = "https://www.pindapi.livecloudnet.com/api";

//  export const baseURL = "https://www.balibeachcluapi.livecloudnet.com";  // Use export
//  axios.defaults.baseURL = "https://www.balibeachcluapi.livecloudnet.com/api";

export const baseURL = "http://localhost:4402";  // Use export
axios.defaults.baseURL = "http://localhost:4402/api";


const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
