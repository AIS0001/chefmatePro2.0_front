/* eslint-disable no-undef */

import React, { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { getHeaders } from "../../utility/getHeader";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import CardComponent from "../../components/cards/CardComponent";

import Header from "../../components/Header";
import Layout from "../../layout/Layout";
import { format } from "date-fns";

import { TextfieldwithLabel } from "../../components/Buttons/Textfield";
import { SubmitButton } from "../../components/Buttons/Textfield";
import DataTable from "../../components/data-tables/dataTable";
import SimpleDataTable from "../../components/data-tables/SimpledataTable";
import fetchData from "../../functions/fetchData";

export default function CompanyInfo() {
  const currentDate = format(new Date(), "yyyy-MM-dd");

  // Utility function to convert BLOB to base64
  const blobToBase64 = (blob, mimeType) => {
    if (!blob) return null;
    try {
      // Handle different BLOB formats
      let uint8Array;
      if (blob.data) {
        uint8Array = new Uint8Array(blob.data);
      } else if (Array.isArray(blob)) {
        uint8Array = new Uint8Array(blob);
      } else {
        uint8Array = new Uint8Array(blob);
      }
      
      const base64 = btoa(String.fromCharCode.apply(null, uint8Array));
      return `data:${mimeType};base64,${base64}`;
    } catch (error) {
      console.error('Error converting BLOB to base64:', error);
      return null;
    }
  };
  const [data, setData] = useState([]);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editId, setEditId] = useState(null);
  const [formdata, setFormData] = useState({
    name: "",
    taxId: "",
    phoneNumber: "",
    email: "",
    address: "",
    website: "",
    city: "",
    state: "",
    zipCode: "",
    country: "",
    logo: null,
    qrCode: null,
    bankName: "",
    accountNumber: "",
    accountName: "",
    routingNumber: "",
    swiftCode: "",
    paymentMethods: "",
    termsAndConditions: ""
  });

  // Additional state for file handling and UI
  const [logoPreview, setLogoPreview] = useState(null);
  const [qrPreview, setQrPreview] = useState(null);
  const [activeTab, setActiveTab] = useState('basic');

  // Modern theme colors
  const theme = {
    primary: '#1e40af',
    secondary: '#f8fafc',
    success: '#16a34a',
    warning: '#f59e0b',
    danger: '#dc2626',
    light: '#f1f5f9',
    dark: '#334155',
    border: '#e2e8f0',
    muted: '#64748b'
  };

  const columns = [
    { label: "Company Name", field: "name" },
    { label: "Tax ID", field: "tax_id" },
    { label: "Phone", field: "phone_number" },
    { label: "Email", field: "email" },
    { label: "City", field: "city" },
    { label: "Actions", field: "actions" },
  ];

  const handleInputChange = (e) => {
    const { name, value, files } = e.target;
    
    if (files && files[0]) {
      // Handle file uploads
      const file = files[0];
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please select a valid image file');
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB');
        return;
      }
      
      setFormData(prev => ({ 
        ...prev, 
        [name]: file,
        [`${name}_type`]: file.type,
        [`${name}_name`]: file.name
      }));
      
      // Create preview for images
      const reader = new FileReader();
      reader.onload = (e) => {
        if (name === 'logo') {
          setLogoPreview(e.target.result);
        } else if (name === 'qrCode') {
          setQrPreview(e.target.result);
        }
      };
      reader.readAsDataURL(file);
    } else {
      setFormData((prevData) => ({
        ...prevData,
        [name]: value,
      }));
    }
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      taxId: "",
      phoneNumber: "",
      email: "",
      address: "",
      website: "",
      city: "",
      state: "",
      zipCode: "",
      country: "",
      logo: null,
      qrCode: null,
      bankName: "",
      accountNumber: "",
      accountName: "",
      routingNumber: "",
      swiftCode: "",
      paymentMethods: "",
      termsAndConditions: ""
    });
    setErrors({});
    setEditMode(false);
    setEditId(null);
    setLogoPreview(null);
    setQrPreview(null);
    setActiveTab('basic');
  };
    
  const validateForm = () => {
    const newErrors = {};
    
    // Required field validations
    if (!formdata.name.trim()) newErrors.name = "Company name is required";
    if (!formdata.taxId.trim()) newErrors.taxId = "Tax ID is required";
    if (!formdata.phoneNumber.trim()) newErrors.phoneNumber = "Phone number is required";
    if (!formdata.email.trim()) newErrors.email = "Email is required";
    if (!formdata.address.trim()) newErrors.address = "Address is required";
    
    // Format validations
    if (formdata.email && !/\S+@\S+\.\S+/.test(formdata.email)) {
      newErrors.email = "Please enter a valid email address";
    }
    if (formdata.phoneNumber && !/^[\+]?[0-9\s\-\(\)]{10,}$/.test(formdata.phoneNumber)) {
      newErrors.phoneNumber = "Please enter a valid phone number";
    }
    if (formdata.website && formdata.website.trim() && !/^https?:\/\/.+/.test(formdata.website)) {
      newErrors.website = "Website should start with http:// or https://";
    }

    // Banking validation
    if (formdata.bankName && !formdata.accountNumber) {
      newErrors.accountNumber = "Account number is required when bank name is provided";
    }
    if (formdata.accountNumber && !formdata.bankName) {
      newErrors.bankName = "Bank name is required when account number is provided";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      // Create FormData for file uploads
      const submitData = new FormData();
      
      // Add text fields
      submitData.append('name', formdata.name.trim());
      submitData.append('tax_id', formdata.taxId.trim());
      submitData.append('phone_number', formdata.phoneNumber.trim());
      submitData.append('email', formdata.email.trim());
      submitData.append('address', formdata.address.trim());
      submitData.append('website', formdata.website.trim());
      submitData.append('city', formdata.city.trim());
      submitData.append('state', formdata.state.trim());
      submitData.append('zip_code', formdata.zipCode.trim());
      submitData.append('country', formdata.country.trim());
      submitData.append('bank_name', formdata.bankName.trim());
      submitData.append('account_number', formdata.accountNumber.trim());
      submitData.append('account_name', formdata.accountName.trim());
      submitData.append('routing_number', formdata.routingNumber.trim());
      submitData.append('swift_code', formdata.swiftCode.trim());
      submitData.append('payment_methods', formdata.paymentMethods.trim());
      submitData.append('terms_and_conditions', formdata.termsAndConditions.trim());
      
      // Add file fields if they exist
      if (formdata.logo && formdata.logo instanceof File) {
        submitData.append('logo', formdata.logo);
        submitData.append('logo_type', formdata.logo.type);
        submitData.append('logo_name', formdata.logo.name);
      }
      if (formdata.qrCode && formdata.qrCode instanceof File) {
        submitData.append('qrCode', formdata.qrCode);
        submitData.append('qr_code_type', formdata.qrCode.type);
        submitData.append('qr_code_name', formdata.qrCode.name);
      }

      const headers = {
        ...getHeaders(),
        'Content-Type': 'multipart/form-data'
      };

      let response;
      if (editMode) {
        response = await axios.put(`/updatedata/companyinfo/${editId}`, submitData, { headers });
        toast.success("Company information updated successfully!");
      } else {
        response = await axios.post("/insertdata/companyinfo", submitData, { headers });
        toast.success("Company information saved successfully!");
      }
      
      // After successful save, switch to edit mode with the saved data
      if (!editMode && response.data) {
        setEditMode(true);
        setEditId(response.data.id || response.data.insertId);
      }
      
      await fetchData("companyinfo", setData, "id", {});
    } catch (err) {
      console.error('Error:', err);
      toast.error(editMode ? "Error updating company info" : "Error adding company info");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (item) => {
    setFormData({
      name: item.name || "",
      taxId: item.tax_id || "",
      phoneNumber: item.phone_number || "",
      email: item.email || "",
      address: item.address || "",
      website: item.website || "",
      city: item.city || "",
      state: item.state || "",
      zipCode: item.zip_code || "",
      country: item.country || "",
      logo: null,
      qrCode: null,
      bankName: item.bank_name || "",
      accountNumber: item.account_number || "",
      accountName: item.account_name || "",
      routingNumber: item.routing_number || "",
      swiftCode: item.swift_code || "",
      paymentMethods: item.payment_methods || "",
      termsAndConditions: item.terms_and_conditions || ""
    });
    
    // Set image previews if they exist in BLOB format
    if (item.logo && item.logo_type) {
      const logoPreviewUrl = blobToBase64(item.logo, item.logo_type);
      setLogoPreview(logoPreviewUrl);
    } else {
      setLogoPreview(null);
    }
    
    if (item.qr_code && item.qr_code_type) {
      const qrPreviewUrl = blobToBase64(item.qr_code, item.qr_code_type);
      setQrPreview(qrPreviewUrl);
    } else {
      setQrPreview(null);
    }
    
    setEditMode(true);
    setEditId(item.id);
    setErrors({});
  };
    
  useEffect(() => {
    const fetchAndSetData = async () => {
      try {
        setLoading(true);
        const companyData = await fetchData("companyinfo", setData, "id", {});
        
        // If there's existing company data, load it into the form automatically
        if (companyData && companyData.length > 0) {
          const company = companyData[0]; // Get the first company record
          handleEdit(company);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Error loading company information");
      } finally {
        setLoading(false);
      }
    };
    fetchAndSetData();
  }, []);

  return (
    <Layout>
      <div style={{ backgroundColor: '#f8fafc', minHeight: '100vh', padding: '0' }}>
        <Header title="Company Information Settings" />
        <ToastContainer position="top-right" />
        
        <div className="container-fluid" style={{ padding: '16px' }}>
          {/* Compact Page Header */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '16px',
            marginBottom: '16px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            border: `1px solid ${theme.border}`
          }}>
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <h2 style={{ margin: 0, color: theme.dark, fontSize: '24px', fontWeight: '600' }}>
                  🏢 Company Settings
                </h2>
                <p style={{ margin: '4px 0 0 0', color: theme.muted, fontSize: '14px' }}>
                  Complete business information including banking and payment details
                </p>
              </div>
              <div className="d-flex gap-2">
                {editMode && (
                  <button
                    onClick={resetForm}
                    style={{
                      backgroundColor: theme.success,
                      border: 'none',
                      borderRadius: '6px',
                      padding: '8px 16px',
                      color: 'white',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: '500'
                    }}
                  >
                    ➕ New Company
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="row g-3">
            {/* Form Section - Full Width */}
            <div className="col-12">
              <div style={{
                backgroundColor: 'white',
                borderRadius: '8px',
                padding: '20px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                border: `1px solid ${theme.border}`,
                height: 'fit-content'
              }}>
                {/* Form Header */}
                <div className="d-flex align-items-center mb-3">
                  <div style={{
                    width: '36px',
                    height: '36px',
                    backgroundColor: theme.primary,
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: '12px'
                  }}>
                    <span style={{ fontSize: '18px', color: 'white' }}>
                      {editMode ? '✏️' : '➕'}
                    </span>
                  </div>
                  <div>
                    <h4 style={{ margin: 0, color: theme.dark, fontSize: '18px', fontWeight: '600' }}>
                      {editMode ? 'Update Company Information' : 'Add Company Information'}
                    </h4>
                    <p style={{ margin: 0, color: theme.muted, fontSize: '12px' }}>
                      {editMode ? 'Modify your company details' : 'Enter your company details'}
                    </p>
                  </div>
                </div>

                {/* Tab Navigation */}
                <div style={{ marginBottom: '20px' }}>
                  <div style={{ 
                    display: 'flex', 
                    borderBottom: `2px solid ${theme.light}`,
                    marginBottom: '16px'
                  }}>
                    {[
                      { id: 'basic', label: '📋 Basic Info', icon: '📋' },
                      { id: 'branding', label: '🎨 Branding', icon: '🎨' },
                      { id: 'banking', label: '🏦 Banking', icon: '🏦' },
                      { id: 'terms', label: '📄 Terms', icon: '📄' }
                    ].map(tab => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        style={{
                          flex: 1,
                          padding: '8px 12px',
                          border: 'none',
                          backgroundColor: 'transparent',
                          color: activeTab === tab.id ? theme.primary : theme.muted,
                          fontWeight: activeTab === tab.id ? '600' : '400',
                          fontSize: '12px',
                          cursor: 'pointer',
                          borderBottom: activeTab === tab.id ? `2px solid ${theme.primary}` : '2px solid transparent',
                          transition: 'all 0.2s'
                        }}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>

                <form onSubmit={handleSubmit}>
                  {/* Basic Info Tab */}
                  {activeTab === 'basic' && (
                    <div>
                      <div className="row g-2">
                        {/* Company Name */}
                        <div className="col-12 mb-2">
                          <label style={{ 
                            display: 'block', 
                            marginBottom: '4px', 
                            fontWeight: '500', 
                            color: theme.dark,
                            fontSize: '12px'
                          }}>
                            Company Name *
                          </label>
                          <input
                            type="text"
                            name="name"
                            value={formdata.name}
                            onChange={handleInputChange}
                            placeholder="Enter company name"
                            style={{
                              width: '100%',
                              padding: '8px 12px',
                              border: `1px solid ${errors.name ? theme.danger : theme.border}`,
                              borderRadius: '6px',
                              fontSize: '13px',
                              outline: 'none'
                            }}
                          />
                          {errors.name && (
                            <span style={{ color: theme.danger, fontSize: '11px', marginTop: '2px', display: 'block' }}>
                              {errors.name}
                            </span>
                          )}
                        </div>

                        {/* Tax ID and Phone */}
                        <div className="col-md-6 mb-2">
                          <label style={{ 
                            display: 'block', 
                            marginBottom: '4px', 
                            fontWeight: '500', 
                            color: theme.dark,
                            fontSize: '12px'
                          }}>
                            Tax ID *
                          </label>
                          <input
                            type="text"
                            name="taxId"
                            value={formdata.taxId}
                            onChange={handleInputChange}
                            placeholder="Tax ID"
                            style={{
                              width: '100%',
                              padding: '8px 12px',
                              border: `1px solid ${errors.taxId ? theme.danger : theme.border}`,
                              borderRadius: '6px',
                              fontSize: '13px',
                              outline: 'none'
                            }}
                          />
                          {errors.taxId && (
                            <span style={{ color: theme.danger, fontSize: '11px', marginTop: '2px', display: 'block' }}>
                              {errors.taxId}
                            </span>
                          )}
                        </div>

                        <div className="col-md-6 mb-2">
                          <label style={{ 
                            display: 'block', 
                            marginBottom: '4px', 
                            fontWeight: '500', 
                            color: theme.dark,
                            fontSize: '12px'
                          }}>
                            Phone Number *
                          </label>
                          <input
                            type="tel"
                            name="phoneNumber"
                            value={formdata.phoneNumber}
                            onChange={handleInputChange}
                            placeholder="Phone number"
                            style={{
                              width: '100%',
                              padding: '8px 12px',
                              border: `1px solid ${errors.phoneNumber ? theme.danger : theme.border}`,
                              borderRadius: '6px',
                              fontSize: '13px',
                              outline: 'none'
                            }}
                          />
                          {errors.phoneNumber && (
                            <span style={{ color: theme.danger, fontSize: '11px', marginTop: '2px', display: 'block' }}>
                              {errors.phoneNumber}
                            </span>
                          )}
                        </div>

                        {/* Email and Website */}
                        <div className="col-md-6 mb-2">
                          <label style={{ 
                            display: 'block', 
                            marginBottom: '4px', 
                            fontWeight: '500', 
                            color: theme.dark,
                            fontSize: '12px'
                          }}>
                            Email Address *
                          </label>
                          <input
                            type="email"
                            name="email"
                            value={formdata.email}
                            onChange={handleInputChange}
                            placeholder="Email address"
                            style={{
                              width: '100%',
                              padding: '8px 12px',
                              border: `1px solid ${errors.email ? theme.danger : theme.border}`,
                              borderRadius: '6px',
                              fontSize: '13px',
                              outline: 'none'
                            }}
                          />
                          {errors.email && (
                            <span style={{ color: theme.danger, fontSize: '11px', marginTop: '2px', display: 'block' }}>
                              {errors.email}
                            </span>
                          )}
                        </div>

                        <div className="col-md-6 mb-2">
                          <label style={{ 
                            display: 'block', 
                            marginBottom: '4px', 
                            fontWeight: '500', 
                            color: theme.dark,
                            fontSize: '12px'
                          }}>
                            Website
                          </label>
                          <input
                            type="url"
                            name="website"
                            value={formdata.website}
                            onChange={handleInputChange}
                            placeholder="https://www.example.com"
                            style={{
                              width: '100%',
                              padding: '8px 12px',
                              border: `1px solid ${errors.website ? theme.danger : theme.border}`,
                              borderRadius: '6px',
                              fontSize: '13px',
                              outline: 'none'
                            }}
                          />
                          {errors.website && (
                            <span style={{ color: theme.danger, fontSize: '11px', marginTop: '2px', display: 'block' }}>
                              {errors.website}
                            </span>
                          )}
                        </div>

                        {/* Address */}
                        <div className="col-12 mb-2">
                          <label style={{ 
                            display: 'block', 
                            marginBottom: '4px', 
                            fontWeight: '500', 
                            color: theme.dark,
                            fontSize: '12px'
                          }}>
                            Address *
                          </label>
                          <textarea
                            name="address"
                            value={formdata.address}
                            onChange={handleInputChange}
                            placeholder="Enter full address"
                            rows="2"
                            style={{
                              width: '100%',
                              padding: '8px 12px',
                              border: `1px solid ${errors.address ? theme.danger : theme.border}`,
                              borderRadius: '6px',
                              fontSize: '13px',
                              outline: 'none',
                              resize: 'vertical',
                              minHeight: '60px'
                            }}
                          />
                          {errors.address && (
                            <span style={{ color: theme.danger, fontSize: '11px', marginTop: '2px', display: 'block' }}>
                              {errors.address}
                            </span>
                          )}
                        </div>

                        {/* City, State, Zip, Country */}
                        <div className="col-md-6 mb-2">
                          <label style={{ 
                            display: 'block', 
                            marginBottom: '4px', 
                            fontWeight: '500', 
                            color: theme.dark,
                            fontSize: '12px'
                          }}>
                            City
                          </label>
                          <input
                            type="text"
                            name="city"
                            value={formdata.city}
                            onChange={handleInputChange}
                            placeholder="City"
                            style={{
                              width: '100%',
                              padding: '8px 12px',
                              border: `1px solid ${theme.border}`,
                              borderRadius: '6px',
                              fontSize: '13px',
                              outline: 'none'
                            }}
                          />
                        </div>

                        <div className="col-md-6 mb-2">
                          <label style={{ 
                            display: 'block', 
                            marginBottom: '4px', 
                            fontWeight: '500', 
                            color: theme.dark,
                            fontSize: '12px'
                          }}>
                            State/Province
                          </label>
                          <input
                            type="text"
                            name="state"
                            value={formdata.state}
                            onChange={handleInputChange}
                            placeholder="State"
                            style={{
                              width: '100%',
                              padding: '8px 12px',
                              border: `1px solid ${theme.border}`,
                              borderRadius: '6px',
                              fontSize: '13px',
                              outline: 'none'
                            }}
                          />
                        </div>

                        <div className="col-md-6 mb-2">
                          <label style={{ 
                            display: 'block', 
                            marginBottom: '4px', 
                            fontWeight: '500', 
                            color: theme.dark,
                            fontSize: '12px'
                          }}>
                            Zip Code
                          </label>
                          <input
                            type="text"
                            name="zipCode"
                            value={formdata.zipCode}
                            onChange={handleInputChange}
                            placeholder="Zip code"
                            style={{
                              width: '100%',
                              padding: '8px 12px',
                              border: `1px solid ${theme.border}`,
                              borderRadius: '6px',
                              fontSize: '13px',
                              outline: 'none'
                            }}
                          />
                        </div>

                        <div className="col-md-6 mb-2">
                          <label style={{ 
                            display: 'block', 
                            marginBottom: '4px', 
                            fontWeight: '500', 
                            color: theme.dark,
                            fontSize: '12px'
                          }}>
                            Country
                          </label>
                          <input
                            type="text"
                            name="country"
                            value={formdata.country}
                            onChange={handleInputChange}
                            placeholder="Country"
                            style={{
                              width: '100%',
                              padding: '8px 12px',
                              border: `1px solid ${theme.border}`,
                              borderRadius: '6px',
                              fontSize: '13px',
                              outline: 'none'
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Branding Tab */}
                  {activeTab === 'branding' && (
                    <div>
                      {/* Logo Upload */}
                      <div className="mb-3">
                        <label style={{ 
                          display: 'block', 
                          marginBottom: '8px', 
                          fontWeight: '500', 
                          color: theme.dark,
                          fontSize: '12px'
                        }}>
                          Company Logo
                        </label>
                        <div style={{
                          border: `2px dashed ${theme.border}`,
                          borderRadius: '8px',
                          padding: '20px',
                          textAlign: 'center',
                          backgroundColor: theme.light,
                          position: 'relative',
                          cursor: 'pointer',
                          minHeight: '120px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                        onClick={() => document.getElementById('logo-upload').click()}
                        >
                          {logoPreview ? (
                            <div style={{ position: 'relative' }}>
                              <img 
                                src={logoPreview} 
                                alt="Logo preview" 
                                style={{ 
                                  maxWidth: '150px', 
                                  maxHeight: '100px', 
                                  borderRadius: '4px',
                                  objectFit: 'contain'
                                }} 
                              />
                              <div style={{ marginTop: '10px' }}>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setLogoPreview(null);
                                    setFormData(prev => ({ ...prev, logo: null }));
                                    document.getElementById('logo-upload').value = '';
                                  }}
                                  style={{
                                    padding: '4px 8px',
                                    backgroundColor: theme.danger,
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    fontSize: '11px',
                                    cursor: 'pointer',
                                    marginRight: '8px'
                                  }}
                                >
                                  Remove
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    document.getElementById('logo-upload').click();
                                  }}
                                  style={{
                                    padding: '4px 8px',
                                    backgroundColor: theme.primary,
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    fontSize: '11px',
                                    cursor: 'pointer'
                                  }}
                                >
                                  Change
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div>
                              <div style={{ fontSize: '32px', marginBottom: '8px' }}>🖼️</div>
                              <p style={{ margin: 0, color: theme.muted, fontSize: '12px' }}>
                                Click to upload company logo
                              </p>
                              <small style={{ color: theme.muted, fontSize: '10px', display: 'block', marginTop: '4px' }}>
                                Supports: JPG, PNG, GIF (Max 5MB)
                              </small>
                            </div>
                          )}
                          <input
                            id="logo-upload"
                            type="file"
                            name="logo"
                            accept="image/*"
                            onChange={handleInputChange}
                            style={{ 
                              position: 'absolute',
                              left: '-9999px',
                              opacity: 0,
                              pointerEvents: 'none'
                            }}
                          />
                        </div>
                      </div>

                      {/* QR Code Upload */}
                      <div className="mb-3">
                        <label style={{ 
                          display: 'block', 
                          marginBottom: '8px', 
                          fontWeight: '500', 
                          color: theme.dark,
                          fontSize: '12px'
                        }}>
                          QR Code
                        </label>
                        <div style={{
                          border: `2px dashed ${theme.border}`,
                          borderRadius: '8px',
                          padding: '20px',
                          textAlign: 'center',
                          backgroundColor: theme.light,
                          position: 'relative',
                          cursor: 'pointer',
                          minHeight: '120px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                        onClick={() => document.getElementById('qr-upload').click()}
                        >
                          {qrPreview ? (
                            <div style={{ position: 'relative' }}>
                              <img 
                                src={qrPreview} 
                                alt="QR code preview" 
                                style={{ 
                                  maxWidth: '100px', 
                                  maxHeight: '100px', 
                                  borderRadius: '4px',
                                  objectFit: 'contain'
                                }} 
                              />
                              <div style={{ marginTop: '10px' }}>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setQrPreview(null);
                                    setFormData(prev => ({ ...prev, qrCode: null }));
                                    document.getElementById('qr-upload').value = '';
                                  }}
                                  style={{
                                    padding: '4px 8px',
                                    backgroundColor: theme.danger,
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    fontSize: '11px',
                                    cursor: 'pointer',
                                    marginRight: '8px'
                                  }}
                                >
                                  Remove
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    document.getElementById('qr-upload').click();
                                  }}
                                  style={{
                                    padding: '4px 8px',
                                    backgroundColor: theme.primary,
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    fontSize: '11px',
                                    cursor: 'pointer'
                                  }}
                                >
                                  Change
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div>
                              <div style={{ fontSize: '32px', marginBottom: '8px' }}>📱</div>
                              <p style={{ margin: 0, color: theme.muted, fontSize: '12px' }}>
                                Click to upload QR code
                              </p>
                              <small style={{ color: theme.muted, fontSize: '10px', display: 'block', marginTop: '4px' }}>
                                Supports: JPG, PNG, GIF (Max 5MB)
                              </small>
                            </div>
                          )}
                          <input
                            id="qr-upload"
                            type="file"
                            name="qrCode"
                            accept="image/*"
                            onChange={handleInputChange}
                            style={{ 
                              position: 'absolute',
                              left: '-9999px',
                              opacity: 0,
                              pointerEvents: 'none'
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Banking Tab */}
                  {activeTab === 'banking' && (
                    <div>
                      <div className="row g-2">
                        <div className="col-12 mb-2">
                          <label style={{ 
                            display: 'block', 
                            marginBottom: '4px', 
                            fontWeight: '500', 
                            color: theme.dark,
                            fontSize: '12px'
                          }}>
                            Bank Name
                          </label>
                          <input
                            type="text"
                            name="bankName"
                            value={formdata.bankName}
                            onChange={handleInputChange}
                            placeholder="Enter bank name"
                            style={{
                              width: '100%',
                              padding: '8px 12px',
                              border: `1px solid ${errors.bankName ? theme.danger : theme.border}`,
                              borderRadius: '6px',
                              fontSize: '13px',
                              outline: 'none'
                            }}
                          />
                          {errors.bankName && (
                            <span style={{ color: theme.danger, fontSize: '11px', marginTop: '2px', display: 'block' }}>
                              {errors.bankName}
                            </span>
                          )}
                        </div>

                        <div className="col-md-6 mb-2">
                          <label style={{ 
                            display: 'block', 
                            marginBottom: '4px', 
                            fontWeight: '500', 
                            color: theme.dark,
                            fontSize: '12px'
                          }}>
                            Account Number
                          </label>
                          <input
                            type="text"
                            name="accountNumber"
                            value={formdata.accountNumber}
                            onChange={handleInputChange}
                            placeholder="Account number"
                            style={{
                              width: '100%',
                              padding: '8px 12px',
                              border: `1px solid ${errors.accountNumber ? theme.danger : theme.border}`,
                              borderRadius: '6px',
                              fontSize: '13px',
                              outline: 'none'
                            }}
                          />
                          {errors.accountNumber && (
                            <span style={{ color: theme.danger, fontSize: '11px', marginTop: '2px', display: 'block' }}>
                              {errors.accountNumber}
                            </span>
                          )}
                        </div>

                        <div className="col-md-6 mb-2">
                          <label style={{ 
                            display: 'block', 
                            marginBottom: '4px', 
                            fontWeight: '500', 
                            color: theme.dark,
                            fontSize: '12px'
                          }}>
                            Account Name
                          </label>
                          <input
                            type="text"
                            name="accountName"
                            value={formdata.accountName}
                            onChange={handleInputChange}
                            placeholder="Account holder name"
                            style={{
                              width: '100%',
                              padding: '8px 12px',
                              border: `1px solid ${theme.border}`,
                              borderRadius: '6px',
                              fontSize: '13px',
                              outline: 'none'
                            }}
                          />
                        </div>

                        <div className="col-md-6 mb-2">
                          <label style={{ 
                            display: 'block', 
                            marginBottom: '4px', 
                            fontWeight: '500', 
                            color: theme.dark,
                            fontSize: '12px'
                          }}>
                            Routing Number
                          </label>
                          <input
                            type="text"
                            name="routingNumber"
                            value={formdata.routingNumber}
                            onChange={handleInputChange}
                            placeholder="Routing number"
                            style={{
                              width: '100%',
                              padding: '8px 12px',
                              border: `1px solid ${theme.border}`,
                              borderRadius: '6px',
                              fontSize: '13px',
                              outline: 'none'
                            }}
                          />
                        </div>

                        <div className="col-md-6 mb-2">
                          <label style={{ 
                            display: 'block', 
                            marginBottom: '4px', 
                            fontWeight: '500', 
                            color: theme.dark,
                            fontSize: '12px'
                          }}>
                            SWIFT Code
                          </label>
                          <input
                            type="text"
                            name="swiftCode"
                            value={formdata.swiftCode}
                            onChange={handleInputChange}
                            placeholder="SWIFT/BIC code"
                            style={{
                              width: '100%',
                              padding: '8px 12px',
                              border: `1px solid ${theme.border}`,
                              borderRadius: '6px',
                              fontSize: '13px',
                              outline: 'none'
                            }}
                          />
                        </div>

                        <div className="col-12 mb-2">
                          <label style={{ 
                            display: 'block', 
                            marginBottom: '4px', 
                            fontWeight: '500', 
                            color: theme.dark,
                            fontSize: '12px'
                          }}>
                            Payment Methods
                          </label>
                          <textarea
                            name="paymentMethods"
                            value={formdata.paymentMethods}
                            onChange={handleInputChange}
                            placeholder="e.g. Cash, Credit Card, Bank Transfer, UPI, etc."
                            rows="2"
                            style={{
                              width: '100%',
                              padding: '8px 12px',
                              border: `1px solid ${theme.border}`,
                              borderRadius: '6px',
                              fontSize: '13px',
                              outline: 'none',
                              resize: 'vertical'
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Terms Tab */}
                  {activeTab === 'terms' && (
                    <div>
                      <div className="mb-3">
                        <label style={{ 
                          display: 'block', 
                          marginBottom: '8px', 
                          fontWeight: '500', 
                          color: theme.dark,
                          fontSize: '12px'
                        }}>
                          Terms and Conditions
                        </label>
                        <textarea
                          name="termsAndConditions"
                          value={formdata.termsAndConditions}
                          onChange={handleInputChange}
                          placeholder="Enter your terms and conditions, return policy, warranty information, etc."
                          rows="8"
                          style={{
                            width: '100%',
                            padding: '12px',
                            border: `1px solid ${theme.border}`,
                            borderRadius: '6px',
                            fontSize: '13px',
                            outline: 'none',
                            resize: 'vertical',
                            minHeight: '200px',
                            fontFamily: 'monospace'
                          }}
                        />
                        <small style={{ color: theme.muted, fontSize: '11px' }}>
                          This will appear on invoices and quotations
                        </small>
                      </div>
                    </div>
                  )}

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={loading}
                    style={{
                      width: '100%',
                      padding: '12px',
                      backgroundColor: loading ? theme.muted : theme.primary,
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      transition: 'all 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      marginTop: '16px'
                    }}
                  >
                    {loading ? (
                      <>
                        <div style={{
                          width: '16px',
                          height: '16px',
                          border: '2px solid #ffffff30',
                          borderTop: '2px solid white',
                          borderRadius: '50%',
                          animation: 'spin 1s linear infinite'
                        }}></div>
                        Processing...
                      </>
                    ) : (
                      <>
                        {editMode ? '💾 Update Company' : '✅ Save Company'}
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>

        {/* Add CSS for spinner animation */}
        <style jsx>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </Layout>
  );
}
