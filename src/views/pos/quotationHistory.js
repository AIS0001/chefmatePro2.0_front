import React, { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import axios from 'axios';
import Layout from '../../layout/Layout';
import { getHeaders } from '../../utility/getHeader';
import fetchData from '../../functions/fetchData';

export default function QuotationHistory() {
  const navigate = useNavigate();
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredQuotations, setFilteredQuotations] = useState([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [quotationToDelete, setQuotationToDelete] = useState(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(50); // Number of items per page (same as billhistory)
  
  // Calculate pagination values
  const totalPages = Math.ceil(filteredQuotations.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentQuotations = filteredQuotations.slice(startIndex, endIndex);

  // Check if user is cashier
  const userType = localStorage.getItem('usertype') || sessionStorage.getItem('usertype');
  const isCashier = userType === 'Cashier';
  
  // Navigate to dashboard function
  const navigateToDashboard = () => {
    if (isCashier) {
      navigate('/CashierDashboard');
    } else {
      navigate('/dashboard');
    }
  };

  // Light color theme styles
  const lightTheme = {
    cardBackground: '#f8f9fa',
    headerBackground: '#e9ecef',
    tableHeader: '#dee2e6',
    primaryButton: '#0d6efd',
    successButton: '#198754',
    warningButton: '#ffc107',
    dangerButton: '#dc3545',
    infoButton: '#0dcaf0',
    textMuted: '#6c757d',
    borderColor: '#dee2e6'
  };

  // Fetch quotations on component mount
  useEffect(() => {
    fetchQuotations();
  }, []);

  // Filter quotations based on search term
  useEffect(() => {
    if (!searchTerm) {
      setFilteredQuotations(quotations);
    } else {
      const filtered = quotations.filter(quotation =>
        quotation.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        quotation.quotation_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        quotation.customer_phone?.includes(searchTerm)
      );
      setFilteredQuotations(filtered);
    }
    // Reset to first page when search changes
    setCurrentPage(1);
  }, [searchTerm, quotations]);

  // Pagination functions
  const goToFirstPage = () => setCurrentPage(1);
  const goToLastPage = () => setCurrentPage(totalPages);
  const goToNextPage = () => setCurrentPage(prev => Math.min(prev + 1, totalPages));
  const goToPreviousPage = () => setCurrentPage(prev => Math.max(prev - 1, 1));
  const goToPage = (page) => setCurrentPage(page);

  const handlePageChange = (page) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  const fetchQuotations = async () => {
    try {
      setLoading(true);
      const response = await fetchData('quotations', null, 'id', {});
      if (Array.isArray(response)) {
        // Sort by creation date (newest first)
        const sortedQuotations = response.sort((a, b) => new Date(b.setup_date) - new Date(a.setup_date));
        setQuotations(sortedQuotations);
      }
    } catch (error) {
      console.error('Error fetching quotations:', error);
      toast.error('Error loading quotations');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (quotation) => {
    // Navigate to quotation page with edit data
    navigate('/quotation', { 
      state: { 
        editQuotation: quotation,
        mode: 'edit'
      } 
    });
  };

  const handleDelete = async (quotationId) => {
    try {
      await axios.delete(`/deletedata/quotations/${quotationId}`, getHeaders());
      
      // Also delete related quotation items
      await axios.delete(`/deletedata/quotation_items/quotation/${quotationId}`, getHeaders());
      
      toast.success('Quotation deleted successfully');
      fetchQuotations(); // Refresh the list
      setShowDeleteModal(false);
      setQuotationToDelete(null);
    } catch (error) {
      console.error('Error deleting quotation:', error);
      toast.error('Error deleting quotation');
    }
  };

  const handlePrint = async (quotation) => {
    try {
      // Fetch quotation items for this quotation using fetchData
      const itemsResponse = await fetchData('quotation_items', null, 'id', { order_id: quotation.id });
      const items = Array.isArray(itemsResponse) ? itemsResponse : [];

      // Prepare quotation data for printing
      const quotationData = {
        quotation_number: quotation.quotation_number || `Q${quotation.id}`,
        setup_date: quotation.setup_date,
        valid_until: quotation.valid_until,
        customer_name: quotation.customer_name,
        customer_phone: quotation.customer_phone,
        customer_email: quotation.customer_email,
        customer_address: quotation.customer_address,
        customer_gst: quotation.customer_gst,
        delivery_place: quotation.delivery_place,
        subtotal: quotation.subtotal || 0,
        subtotal_afterdiscount: quotation.subtotal_afterdiscount || 0,
        tax: quotation.tax || 0,
        round_off: quotation.round_off || 0,
        grand_total: quotation.grand_total || 0,
        items: items.map(item => ({
          item_name: item.item_name,
          quantity: item.quantity,
          total_amount: item.total_amount
        }))
      };

      printQuotation(quotationData);
    } catch (error) {
      console.error('Error preparing quotation for print:', error);
      toast.error('Error preparing quotation for printing');
    }
  };

  // Print Quotation Function (same as in quotation.js)
  const printQuotation = (quotationData) => {
    const quotationNumber = quotationData.quotation_number || 'DRAFT';

    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Quotation - ${quotationNumber}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            background: white;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 30px;
            border-bottom: 2px solid #000;
            padding-bottom: 20px;
          }
          .header-left {
            display: flex;
            align-items: center;
            gap: 15px;
          }
          .logo {
            width: 190px;
            height: 60px;
            object-fit: contain;
          }
          .company-info-left {
            display: flex;
            flex-direction: column;
          }
          .company-logo {
            color: #FF6B35;
            font-size: 28px;
            font-weight: bold;
            margin-bottom: 2px;
          }
          .company-tagline {
            color: #666;
            font-size: 14px;
            line-height: 1.3;
            font-weight: 700;
          }
          .header-right {
            text-align: right;
            font-size: 20px;
            color: #333;
            line-height: 1.4;
          }
          .quotation-info {
            display: flex;
            justify-content: space-between;
            margin: 20px 0;
          }
          .quotation-details, .customer-details {
            width: 48%;
          }
          .section-title {
            font-weight: bold;
            font-size: 14px;
            margin-bottom: 10px;
            color: #333;
          }
          .info-row {
            font-size: 12px;
            margin: 5px 0;
            color: #555;
          }
          .items-table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
            font-size: 12px;
          }
          .items-table th,
          .items-table td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
          }
          .items-table th {
            background-color: #f8f9fa;
            font-weight: bold;
            color: #333;
          }
          .text-right {
            text-align: right;
          }
          .text-center {
            text-align: center;
          }
          .summary-section {
            margin-top: 20px;
            display: flex;
            justify-content: flex-end;
          }
          .summary-table {
            width: 300px;
            font-size: 12px;
          }
          .summary-table td {
            padding: 5px 10px;
            border: none;
          }
          .summary-table .total-row {
            font-weight: bold;
            border-top: 2px solid #333;
            font-size: 14px;
          }
          .signature-section {
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            margin-top: 40px;
            padding-top: 20px;
          }
          .signature-left {
            flex: 1;
            text-align: left;
          }
          .signature-right {
            flex: 1;
            text-align: right;
            display: flex;
            justify-content: flex-end;
          }
          .authorised-signatory {
            text-align: center;
            min-width: 200px;
          }
          .signature-space {
            height: 60px;
            width: 200px;
            margin-bottom: 5px;
          }
          .signature-line {
            border-bottom: 1px solid #333;
            width: 200px;
            margin: 0 auto 5px auto;
          }
          .signature-text {
            font-size: 12px;
            color: #333;
            font-weight: bold;
          }
          @media print {
            body { margin: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="header-left">
            <div class="company-info-left">
              <div class="company-logo"><img src="/logo.png" alt="CloudNet Logo" class="logo" onerror="this.style.display='none'" /></div>
              <div class="company-tagline">
                Your local IT Partner | Pattaya |<br>
                One Stop Solution
              </div>
            </div>
          </div>
          <div class="header-right">
            📞 +66-948712350/+66-952477020<br>
            🌐 www.cloudnetsoftwares.com<br>
            📧 info@cloudnetsoftwares.com
          </div>
        </div>

        <div class="quotation-info">
          <div class="quotation-details">
            <div class="section-title">Quotation Details</div>
            <div class="info-row"><strong>Quotation No:</strong> ${quotationNumber}</div>
            <div class="info-row"><strong>Date:</strong> ${new Date(quotationData.setup_date).toLocaleDateString('en-GB')}</div>
            <div class="info-row"><strong>Valid Until:</strong> ${new Date(quotationData.valid_until).toLocaleDateString('en-GB')}</div>
          </div>
          <div class="customer-details">
            <div class="section-title">Customer Details</div>
            <div class="info-row"><strong>Name:</strong> ${quotationData.customer_name || 'N/A'}</div>
            <div class="info-row"><strong>Phone:</strong> ${quotationData.customer_phone || 'N/A'}</div>
            ${quotationData.customer_email ? `<div class="info-row"><strong>Email:</strong> ${quotationData.customer_email}</div>` : ''}
            ${quotationData.customer_address ? `<div class="info-row"><strong>Address:</strong> ${quotationData.customer_address}</div>` : ''}
            ${quotationData.customer_gst ? `<div class="info-row"><strong>GST No:</strong> ${quotationData.customer_gst}</div>` : ''}
            ${quotationData.delivery_place ? `<div class="info-row"><strong>Delivery Place:</strong> ${quotationData.delivery_place}</div>` : ''}
          </div>
        </div>

        <table class="items-table">
          <thead>
            <tr>
              <th width="5%" class="text-center">S.No</th>
              <th width="35%">Item Name</th>
              <th width="15%" class="text-right">Rate</th>
              <th width="10%" class="text-center">Qty</th>
              <th width="15%" class="text-right">Amount</th>
              <th width="10%" class="text-right">Disc%</th>
              <th width="20%" class="text-right">Net Amount</th>
            </tr>
          </thead>
          <tbody>
            ${quotationData.items && quotationData.items.length > 0 ? quotationData.items.map((item, index) => `
              <tr>
                <td class="text-center">${index + 1}</td>
                <td>${item.item_name || 'N/A'}</td>
                <td class="text-right">฿ ${((Number(item.total_amount) || 0) / (Number(item.quantity) || 1)).toFixed(2)}</td>
                <td class="text-center">${item.quantity || 0}</td>
                <td class="text-right">฿ ${((Number(item.total_amount) || 0) / (Number(item.quantity) || 1) * (Number(item.quantity) || 1)).toFixed(2)}</td>
                <td class="text-right">0%</td>
                <td class="text-right">฿ ${(Number(item.total_amount) || 0).toFixed(2)}</td>
              </tr>
            `).join('') : '<tr><td colspan="7" class="text-center">No items found</td></tr>'}
          </tbody>
        </table>

        <div class="summary-section">
          <table class="summary-table">
            <tr>
              <td>Subtotal:</td>
              <td class="text-right">฿ ${(Number(quotationData.subtotal) || 0).toFixed(2)}</td>
            </tr>
            <tr>
              <td>Discount:</td>
              <td class="text-right">฿ ${((Number(quotationData.subtotal) || 0) - (Number(quotationData.subtotal_afterdiscount) || 0)).toFixed(2)}</td>
            </tr>
            <tr>
              <td>Tax:</td>
              <td class="text-right">฿ ${(Number(quotationData.tax) || 0).toFixed(2)}</td>
            </tr>
            <tr>
              <td>Round Off:</td>
              <td class="text-right">฿ ${(Number(quotationData.round_off) || 0).toFixed(2)}</td>
            </tr>
            <tr class="total-row">
              <td><strong>Grand Total:</strong></td>
              <td class="text-right"><strong>฿ ${(Number(quotationData.grand_total) || 0).toFixed(2)}</strong></td>
            </tr>
          </table>
        </div>

        <div class="signature-section">
          <div class="signature-left">
            <div style="font-size: 10px; color: #666; text-align: left;">
              <p>Thank you for your business!</p>
              <p>This is a computer generated quotation.</p>
            </div>
          </div>
          <div class="signature-right">
            <div class="authorised-signatory">
              <div class="signature-space"></div>
              <div class="signature-line"></div>
              <div class="signature-text">Authorised Signatory</div>
            </div>
          </div>
        </div>
      </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
    
    // Auto print after a short delay
    setTimeout(() => {
      printWindow.print();
    }, 500);
  };

  const confirmDelete = (quotation) => {
    setQuotationToDelete(quotation);
    setShowDeleteModal(true);
  };

  const renderContent = () => (
    <div style={{ backgroundColor: '#ffffff', minHeight: '100vh' }}>
      <ToastContainer />
      
      {/* Dashboard Navigation Button - Only for cashiers */}
      {isCashier && (
        <div style={{ position: 'fixed', top: '20px', right: '20px', zIndex: 1000 }}>
          <button
            className="btn"
            onClick={navigateToDashboard}
            style={{
              backgroundColor: lightTheme.primaryButton,
              color: 'white',
              padding: '10px 15px',
              fontSize: '14px',
              borderRadius: '25px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              border: 'none'
            }}
          >
            🏠 Dashboard
          </button>
        </div>
      )}

      {/* Header Section */}
      <div className='row mb-4'>
        <div className='col-md-12'>
          <div style={{ 
            backgroundColor: lightTheme.cardBackground, 
            border: `1px solid ${lightTheme.borderColor}`,
            borderRadius: '8px',
            padding: '20px',
            marginBottom: '20px'
          }}>
            <div style={{ 
              backgroundColor: lightTheme.headerBackground,
              padding: '10px 15px',
              borderRadius: '6px',
              marginBottom: '15px',
              borderLeft: `4px solid ${lightTheme.primaryButton}`
            }}>
              <div className='d-flex justify-content-between align-items-center'>
                <h5 className='m-0' style={{ color: '#495057' }}>Quotation History</h5>
                <button
                  className='btn'
                  onClick={() => navigate('/quotation')}
                  style={{
                    backgroundColor: lightTheme.successButton,
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '8px 16px'
                  }}
                >
                  ➕ New Quotation
                </button>
              </div>
            </div>
            
            {/* Search Bar */}
            <div className='row mb-3'>
              <div className='col-md-8'>
                <div className="input-group">
                  <span className="input-group-text" style={{ backgroundColor: '#f8f9fa', borderColor: lightTheme.borderColor }}>
                    🔍
                  </span>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Search by customer name, quotation number, or phone..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{
                      borderColor: lightTheme.borderColor,
                      backgroundColor: '#ffffff'
                    }}
                  />
                  {searchTerm && (
                    <button
                      className="btn btn-outline-secondary"
                      type="button"
                      onClick={() => setSearchTerm('')}
                      style={{
                        borderColor: lightTheme.borderColor,
                        color: lightTheme.textMuted
                      }}
                      title="Clear search"
                    >
                      ✖️
                    </button>
                  )}
                </div>
              </div>
              <div className='col-md-4 text-end'>
                <small style={{ color: lightTheme.textMuted }}>
                  {filteredQuotations.length} quotation{filteredQuotations.length !== 1 ? 's' : ''} found
                </small>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quotations Table */}
      <div className='row'>
        <div className='col-md-12'>
          <div style={{ 
            backgroundColor: lightTheme.cardBackground, 
            border: `1px solid ${lightTheme.borderColor}`,
            borderRadius: '8px',
            padding: '20px'
          }}>
            {loading ? (
              <div className="text-center py-5">
                <div className="spinner-border" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
                <p className="mt-2">Loading quotations...</p>
              </div>
            ) : (
              <div className='table-responsive'>
                <table className='table table-hover' style={{ fontSize: '12px', backgroundColor: '#ffffff' }}>
                  <thead style={{ backgroundColor: lightTheme.tableHeader }}>
                    <tr>
                      <th style={{ fontSize: '11px', color: '#495057' }}>Quotation No</th>
                      <th style={{ fontSize: '11px', color: '#495057' }}>Date</th>
                      <th style={{ fontSize: '11px', color: '#495057' }}>Customer</th>
                      <th style={{ fontSize: '11px', color: '#495057' }}>Phone</th>
                      <th style={{ fontSize: '11px', color: '#495057' }}>Valid Until</th>
                      <th style={{ fontSize: '11px', color: '#495057' }}>Grand Total</th>
                      <th style={{ fontSize: '11px', color: '#495057' }}>Status</th>
                      <th style={{ fontSize: '11px', color: '#495057' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentQuotations.length > 0 ? (
                      currentQuotations.map((quotation) => (
                        <tr key={quotation.id} style={{ fontSize: '12px' }}>
                          <td style={{ color: '#495057' }}>
                            {quotation.quotation_number || `Q${quotation.id}`}
                          </td>
                          <td style={{ color: '#495057' }}>
                            {new Date(quotation.setup_date).toLocaleDateString('en-GB')}
                          </td>
                          <td style={{ color: '#495057' }}>
                            {quotation.customer_name || 'N/A'}
                          </td>
                          <td style={{ color: '#495057' }}>
                            {quotation.customer_phone || 'N/A'}
                          </td>
                          <td style={{ color: '#495057' }}>
                            {quotation.valid_until ? new Date(quotation.valid_until).toLocaleDateString('en-GB') : 'N/A'}
                          </td>
                          <td style={{ color: '#495057' }}>
                            ฿ {(Number(quotation.grand_total) || 0).toFixed(2)}
                          </td>
                          <td>
                            <span 
                              className={`badge ${quotation.status === 'pending' ? 'bg-warning' : 
                                quotation.status === 'approved' ? 'bg-success' : 'bg-secondary'}`}
                              style={{ fontSize: '10px' }}
                            >
                              {quotation.status || 'pending'}
                            </span>
                          </td>
                          <td>
                            <div className="d-flex gap-1">
                              <button
                                className="btn btn-sm"
                                onClick={() => handleEdit(quotation)}
                                style={{
                                  backgroundColor: lightTheme.primaryButton,
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '4px',
                                  padding: '4px 8px'
                                }}
                                title="Edit Quotation"
                              >
                                ✏️
                              </button>
                              <button
                                className="btn btn-sm"
                                onClick={() => handlePrint(quotation)}
                                style={{
                                  backgroundColor: lightTheme.infoButton,
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '4px',
                                  padding: '4px 8px'
                                }}
                                title="Print Quotation"
                              >
                                🖨️
                              </button>
                              <button
                                className="btn btn-sm"
                                onClick={() => confirmDelete(quotation)}
                                style={{
                                  backgroundColor: lightTheme.dangerButton,
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '4px',
                                  padding: '4px 8px'
                                }}
                                title="Delete Quotation"
                              >
                                🗑️
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="8" className="text-center py-4" style={{ color: lightTheme.textMuted }}>
                          {searchTerm ? 'No quotations found matching your search.' : 'No quotations found.'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
            
            {/* Pagination Controls */}
            {filteredQuotations.length > 0 && (
              <div className="d-flex justify-content-between align-items-center mt-3">
                <div style={{ color: lightTheme.textMuted, fontSize: '14px' }}>
                  Showing {startIndex + 1} to {Math.min(endIndex, filteredQuotations.length)} of {filteredQuotations.length} entries
                </div>
                <div className="pagination">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="btn btn-sm btn-outline-primary me-1"
                    style={{
                      borderColor: lightTheme.borderColor,
                      color: currentPage === 1 ? lightTheme.textMuted : lightTheme.primaryButton
                    }}
                  >
                    &laquo; Previous
                  </button>
                  {[...Array(totalPages).keys()].map((page) => (
                    <button
                      key={page + 1}
                      onClick={() => handlePageChange(page + 1)}
                      className={`btn btn-sm me-1 ${currentPage === page + 1 ? 'btn-primary' : 'btn-outline-primary'}`}
                      style={{
                        borderColor: lightTheme.borderColor,
                        backgroundColor: currentPage === page + 1 ? lightTheme.primaryButton : 'transparent',
                        color: currentPage === page + 1 ? 'white' : lightTheme.primaryButton
                      }}
                    >
                      {page + 1}
                    </button>
                  ))}
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="btn btn-sm btn-outline-primary"
                    style={{
                      borderColor: lightTheme.borderColor,
                      color: currentPage === totalPages ? lightTheme.textMuted : lightTheme.primaryButton
                    }}
                  >
                    Next &raquo;
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(0,0,0,0.5)',
          zIndex: 2000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{
            background: '#fff',
            borderRadius: 12,
            minWidth: 400,
            maxWidth: '90vw',
            boxShadow: '0 4px 24px rgba(0,0,0,0.18)',
            padding: 32,
            position: 'relative'
          }}>
            <h4 style={{ marginBottom: 16, color: '#495057' }}>Confirm Delete</h4>
            <p style={{ marginBottom: 24, color: '#6c757d' }}>
              Are you sure you want to delete quotation "{quotationToDelete?.quotation_number || `Q${quotationToDelete?.id}`}"? 
              This action cannot be undone.
            </p>
            <div className="d-flex gap-2 justify-content-end">
              <button
                className="btn"
                onClick={() => {
                  setShowDeleteModal(false);
                  setQuotationToDelete(null);
                }}
                style={{
                  backgroundColor: lightTheme.borderColor,
                  color: '#495057',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '8px 16px'
                }}
              >
                Cancel
              </button>
              <button
                className="btn"
                onClick={() => handleDelete(quotationToDelete.id)}
                style={{
                  backgroundColor: lightTheme.dangerButton,
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '8px 16px'
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <Layout>
      {renderContent()}
    </Layout>
  );
}
