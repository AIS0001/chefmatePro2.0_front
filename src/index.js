import React from 'react';
import ReactDOM from 'react-dom/client';
// Import FontAwesome CSS in your entry point file, usually index.js or App.js
import '@fortawesome/fontawesome-free/css/all.min.css';
import axios from "axios";
import App from './App';
import reportWebVitals from './reportWebVitals';
import { startOfDay } from 'date-fns';
export const baseURL = "http://127.0.0.1:4401";  // Use export
axios.defaults.baseURL = "http://127.0.0.1:4401/api";
//axios.defaults.baseURL = "https://jdapi2.dhruvinnovations.in/api";

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
