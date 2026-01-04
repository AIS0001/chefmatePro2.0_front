import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Table, Modal, Form, Alert, Spinner } from 'react-bootstrap';
import { Button, CircularProgress } from '@mui/material';
import { Visibility, Lock, Print, Cancel, LockClock } from '@mui/icons-material';
import { ToastContainer, toast } from "react-toastify";
import { FaCalendarAlt, FaMoneyBillWave, FaCreditCard, FaMobile, FaQrcode, FaUniversity, FaGlobe, FaLock, FaUnlock, FaEye } from 'react-icons/fa';
import axios from 'axios';
import { getHeaders } from '../../utility/getHeader';
import { getUserName } from '../../functions/storageUtils';
import { fetchComboData } from '../../services/api';
import fetchData from '../../functions/fetchData';
import Layout from '../../layout/Layout';
import './DayClose.css';

export default function DayClose() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [dayCloseData, setDayCloseData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [cashDrawerData, setCashDrawerData] = useState({
    openingCash: 0,
    closingCash: 0,
    cashIn: 0,
    cashOut: 0,
    notes: ''
  });
  const [isDayClosed, setIsDayClosed] = useState(false);
  const [detailedView, setDetailedView] = useState(false);
  const [salesBreakdown, setSalesBreakdown] = useState([]);
  const [paymentOptions, setPaymentOptions] = useState([]);


  // Enhanced payment method icons mapping with gradients
  const getPaymentIcon = (paymentName) => {
    const name = paymentName.toLowerCase();
    if (name.includes('cash')) return { icon: <FaMoneyBillWave />, color: 'success', gradient: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)' };
    if (name.includes('upi')) return { icon: <FaMobile />, color: 'primary', gradient: 'linear-gradient(135deg, #007bff 0%, #6610f2 100%)' };
    if (name.includes('card') || name.includes('credit') || name.includes('debit')) return { icon: <FaCreditCard />, color: 'info', gradient: 'linear-gradient(135deg, #17a2b8 0%, #6f42c1 100%)' };
    if (name.includes('qr')) return { icon: <FaQrcode />, color: 'warning', gradient: 'linear-gradient(135deg, #ffc107 0%, #fd7e14 100%)' };
    if (name.includes('bank') || name.includes('transfer')) return { icon: <FaUniversity />, color: 'secondary', gradient: 'linear-gradient(135deg, #6c757d 0%, #495057 100%)' };
    if (name.includes('online') || name.includes('net')) return { icon: <FaGlobe />, color: 'danger', gradient: 'linear-gradient(135deg, #dc3545 0%, #e83e8c 100%)' };
    return { icon: <FaMoneyBillWave />, color: 'dark', gradient: 'linear-gradient(135deg, #343a40 0%, #6c757d 100%)' };
  };

  useEffect(() => {
    fetchPaymentOptions();
  }, []);

  useEffect(() => {
    if (paymentOptions.length > 0) {
      fetchDayCloseData();
    }
  }, [selectedDate, paymentOptions]);

  // Debug useEffect to track state changes
  useEffect(() => {
    console.log(`DayClose State - Date: ${selectedDate}, isDayClosed: ${isDayClosed}`);
  }, [selectedDate, isDayClosed]);

  const fetchPaymentOptions = async () => {
    try {
      const options = await fetchComboData("paymentoptions", "name");
      setPaymentOptions(options || []);
    } catch (error) {
      console.error('Error fetching payment options:', error);
      // Fallback to default payment methods if API fails
      setPaymentOptions([
        { name: 'Cash' },
        { name: 'UPI' },
        { name: 'Card' },
        { name: 'QR Code' },
        { name: 'Bank Transfer' },
        { name: 'Online' }
      ]);
    }
  };

  const fetchDayCloseData = async () => {
    setLoading(true);
    try {
      // Check if day is already closed by looking for existing record
      const summaryData = await fetchData("day_close_summary", null, "id", { close_date: selectedDate });

      if (summaryData && summaryData.length > 0) {
        // Day close record exists
        setDayCloseData(summaryData[0]);
        setIsDayClosed(true); // If record exists, day is considered closed
        console.log(`Day ${selectedDate} is already closed with status: ${summaryData[0].status}`);
      } else {
        // No day close record exists, calculate current day data
        setIsDayClosed(false);
        await calculateCurrentDayData();
        console.log(`Day ${selectedDate} is not closed yet`);
      }

      // Fetch detailed breakdown
      await fetchDetailedBreakdown();

    } catch (error) {
      console.error('Error fetching day close data:', error);
      // If no record exists, calculate from live data
      setIsDayClosed(false);
      await calculateCurrentDayData();
    } finally {
      setLoading(false);
    }
  };

  const calculateCurrentDayData = async () => {
    try {
      // When calculating current day data, the day is not closed yet
      setIsDayClosed(false);
      
      // Fetch sales data directly from final_bill table for the selected date
      const salesData = await fetchData("final_bill", null, "id", { setup_date: selectedDate });

      if (salesData && salesData.length > 0) {
        const bills = salesData;
        
        // Initialize payment summary with dynamic payment methods
        const paymentSummary = {
          close_date: selectedDate,
          total_sales: 0,
          total_orders: bills.length,
          total_items_sold: 0,
          status: 'open'
        };

        // Initialize dynamic payment method fields
        paymentOptions.forEach(option => {
          const key = `${option.name.toLowerCase().replace(/\s+/g, '_')}_sales`;
          paymentSummary[key] = 0;
        });

        // Calculate totals by payment method
        bills.forEach(bill => {
          const amount = parseFloat(bill.grand_total || bill.paid_amount || 0);
          paymentSummary.total_sales += amount;
          
          // Get payment method from bill (use payment_mode field)
          const paymentMethod = (bill.payment_mode || bill.payment_method || 'Cash').toLowerCase().trim();
          
          // Debug: Log payment methods found in bills
          console.log('Bill payment method:', paymentMethod, 'Amount:', amount);
          
          // Find matching payment option and add to summary
          const matchingOption = paymentOptions.find(option => 
            option.name.toLowerCase().replace(/\s+/g, '_') === paymentMethod.replace(/\s+/g, '_') ||
            option.name.toLowerCase() === paymentMethod ||
            paymentMethod.includes(option.name.toLowerCase())
          );
          
          if (matchingOption) {
            const key = `${matchingOption.name.toLowerCase().replace(/\s+/g, '_')}_sales`;
            paymentSummary[key] += amount;
            console.log('Matched payment method:', matchingOption.name, 'Key:', key, 'Amount added:', amount);
          } else {
            // Default to cash if no match found
            const cashKey = paymentOptions.find(opt => opt.name.toLowerCase() === 'cash');
            if (cashKey) {
              const key = `${cashKey.name.toLowerCase().replace(/\s+/g, '_')}_sales`;
              paymentSummary[key] += amount;
              console.log('No match found, defaulted to cash. Amount:', amount);
            }
          }
        });

        // Fetch total items sold from order_items if available
        try {
          const itemsData = await fetchData("order_items", null, "id", { setup_date: selectedDate });
          
          if (itemsData && itemsData.length > 0) {
            paymentSummary.total_items_sold = itemsData.reduce((total, item) => {
              return total + parseFloat(item.quantity || 0);
            }, 0);
          }
        } catch (error) {
          console.error('Error fetching order items:', error);
        }

        console.log('Final payment summary:', paymentSummary);
        setDayCloseData(paymentSummary);
      } else {
        // No sales data for selected date - create default structure with dynamic payment methods
        const defaultSummary = {
          close_date: selectedDate,
          total_sales: 0,
          total_orders: 0,
          total_items_sold: 0,
          status: 'open'
        };
        
        // Initialize all payment method fields to 0
        paymentOptions.forEach(option => {
          const key = `${option.name.toLowerCase().replace(/\s+/g, '_')}_sales`;
          defaultSummary[key] = 0;
        });
        
        setDayCloseData(defaultSummary);
      }
      
    } catch (error) {
      console.error('Error calculating day data:', error);
      toast.error('Error fetching sales data for selected date');
      // Create default structure with dynamic payment methods
      const errorSummary = {
        close_date: selectedDate,
        total_sales: 0,
        total_orders: 0,
        total_items_sold: 0,
        status: 'open'
      };
      
      // Initialize all payment method fields to 0
      paymentOptions.forEach(option => {
        const key = `${option.name.toLowerCase().replace(/\s+/g, '_')}_sales`;
        errorSummary[key] = 0;
      });
      
      setDayCloseData(errorSummary);
    }
  };

  const fetchPaymentSummary = async () => {
    try {
      // Get bills for the selected date using setup_date filter
      const bills = await fetchData("final_bill", null, "id", { setup_date: selectedDate }) || [];

      // Calculate summary
      const summary = {
        close_date: selectedDate,
        total_sales: 0,
        cash_sales: 0,
        upi_sales: 0,
        card_sales: 0,
        qr_sales: 0,
        bank_transfer_sales: 0,
        online_sales: 0,
        other_sales: 0,
        total_orders: bills.length,
        total_items_sold: 0,
        status: 'open'
      };

      bills.forEach(bill => {
        const amount = parseFloat(bill.paid_amount || 0);
        summary.total_sales += amount;

        // Group by payment method (if column exists, otherwise assume cash)
        const paymentMethod = bill.payment_method || 'cash';
        switch (paymentMethod) {
          case 'cash':
            summary.cash_sales += amount;
            break;
          case 'upi':
            summary.upi_sales += amount;
            break;
          case 'card':
            summary.card_sales += amount;
            break;
          case 'qr':
            summary.qr_sales += amount;
            break;
          case 'bank_transfer':
            summary.bank_transfer_sales += amount;
            break;
          case 'online':
            summary.online_sales += amount;
            break;
          default:
            summary.other_sales += amount;
        }
      });

      return summary;
    } catch (error) {
      console.error('Error fetching payment summary:', error);
      throw error;
    }
  };

  const fetchDetailedBreakdown = async () => {
    try {
      // Get order items for detailed breakdown using setup_date
      const items = await fetchData("order_items", null, "id", { setup_date: selectedDate }) || [];

      // Group by item name
      const breakdown = {};
      items.forEach(item => {
        const itemName = item.item_name;
        if (!breakdown[itemName]) {
          breakdown[itemName] = {
            item_name: itemName,
            total_quantity: 0,
            total_amount: 0,
            orders: 0
          };
        }
        breakdown[itemName].total_quantity += parseInt(item.quantity || 0);
        breakdown[itemName].total_amount += parseFloat(item.total_price || 0);
        breakdown[itemName].orders += 1;
      });

      setSalesBreakdown(Object.values(breakdown));
    } catch (error) {
      console.error('Error fetching detailed breakdown:', error);
    }
  };

  const handleDayClose = async () => {
    try {
      setLoading(true);

      const closeData = {
        close_date: selectedDate,
        ...dayCloseData,
        closed_by: getUserName(),
        closing_time: new Date().toISOString(),
        status: 'closed',
        opening_cash: parseFloat(cashDrawerData.openingCash || 0),
        closing_cash: parseFloat(cashDrawerData.closingCash || 0),
        cash_in: parseFloat(cashDrawerData.cashIn || 0),
        cash_out: parseFloat(cashDrawerData.cashOut || 0),
        notes: cashDrawerData.notes
      };

      // Save day close summary
      const response = await axios.post(
        `/insertdata/day_close_summary`,
        closeData,
        getHeaders()
      );

      if (response.data.success) {
        toast.success('Day closed successfully!');
        setIsDayClosed(true);
        setShowCloseModal(false);
        fetchDayCloseData();
      } else {
        toast.error('Failed to close day');
      }

    } catch (error) {
      console.error('Error closing day:', error);
      toast.error('Error closing day: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return `฿ ${parseFloat(amount || 0).toFixed(2)}`;
  };

  const exportToPDF = () => {
    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    
    // Generate print-friendly HTML content
    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Day Close Report - ${selectedDate}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 20px;
              color: #333;
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
              border-bottom: 2px solid #333;
              padding-bottom: 20px;
            }
            .company-name {
              font-size: 24px;
              font-weight: bold;
              margin-bottom: 5px;
            }
            .report-title {
              font-size: 18px;
              margin-bottom: 10px;
            }
            .date {
              font-size: 14px;
              color: #666;
            }
            .summary-section {
              margin-bottom: 30px;
            }
            .summary-grid {
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 15px;
              margin-bottom: 20px;
            }
            .summary-item {
              border: 1px solid #ddd;
              padding: 15px;
              border-radius: 5px;
              text-align: center;
            }
            .summary-label {
              font-size: 12px;
              color: #666;
              margin-bottom: 5px;
            }
            .summary-value {
              font-size: 18px;
              font-weight: bold;
              color: #333;
            }
            .payment-section {
              margin-bottom: 30px;
            }
            .section-title {
              font-size: 16px;
              font-weight: bold;
              margin-bottom: 15px;
              border-bottom: 1px solid #ccc;
              padding-bottom: 5px;
            }
            .payment-grid {
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              gap: 10px;
              margin-bottom: 20px;
            }
            .payment-item {
              border: 1px solid #ddd;
              padding: 10px;
              border-radius: 3px;
              text-align: center;
            }
            .payment-label {
              font-size: 12px;
              color: #666;
              margin-bottom: 3px;
            }
            .payment-value {
              font-size: 14px;
              font-weight: bold;
            }
            .items-table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 20px;
            }
            .items-table th,
            .items-table td {
              border: 1px solid #ddd;
              padding: 8px;
              text-align: left;
            }
            .items-table th {
              background-color: #f5f5f5;
              font-weight: bold;
            }
            .items-table tr:nth-child(even) {
              background-color: #f9f9f9;
            }
            .total-row {
              font-weight: bold;
              background-color: #e9ecef !important;
            }
            .footer {
              margin-top: 40px;
              text-align: center;
              font-size: 12px;
              color: #666;
            }
            @media print {
              body { margin: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="company-name">ChefMate Restaurant</div>
            <div class="report-title">Day Close Report</div>
            <div class="date">Date: ${new Date(selectedDate).toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}</div>
          </div>

          <div class="summary-section">
            <div class="section-title">Sales Summary</div>
            <div class="summary-grid">
              <div class="summary-item">
                <div class="summary-label">Total Sales</div>
                <div class="summary-value">${formatCurrency(dayCloseData?.total_sales || 0)}</div>
              </div>
              <div class="summary-item">
                <div class="summary-label">Total Orders</div>
                <div class="summary-value">${dayCloseData?.total_orders || 0}</div>
              </div>
              <div class="summary-item">
                <div class="summary-label">Items Sold</div>
                <div class="summary-value">${dayCloseData?.total_items_sold || 0}</div>
              </div>
              <div class="summary-item">
                <div class="summary-label">Average Order Value</div>
                <div class="summary-value">${formatCurrency(
                  dayCloseData?.total_orders > 0 
                    ? dayCloseData.total_sales / dayCloseData.total_orders 
                    : 0
                )}</div>
              </div>
            </div>
          </div>

          <div class="payment-section">
            <div class="section-title">Payment Methods Breakdown</div>
            <div class="payment-grid">
              ${generatePaymentMethods().map(method => `
                <div class="payment-item">
                  <div class="payment-label">${method.label}</div>
                  <div class="payment-value">${formatCurrency(dayCloseData?.[method.key] || 0)}</div>
                </div>
              `).join('')}
            </div>
          </div>

          <div class="items-section">
            <div class="section-title">Item-wise Sales Details</div>
            ${salesBreakdown.length > 0 ? `
              <table class="items-table">
                <thead>
                  <tr>
                    <th>S.No</th>
                    <th>Item Name</th>
                    <th>Quantity Sold</th>
                    <th>Total Amount</th>
                    <th>No. of Orders</th>
                    <th>Avg Price per Unit</th>
                  </tr>
                </thead>
                <tbody>
                  ${salesBreakdown.map((item, index) => `
                    <tr>
                      <td>${index + 1}</td>
                      <td>${item.item_name}</td>
                      <td>${item.total_quantity}</td>
                      <td>${formatCurrency(item.total_amount)}</td>
                      <td>${item.orders}</td>
                      <td>${formatCurrency(item.total_amount / item.total_quantity)}</td>
                    </tr>
                  `).join('')}
                  <tr class="total-row">
                    <td colspan="2"><strong>TOTAL</strong></td>
                    <td><strong>${salesBreakdown.reduce((sum, item) => sum + item.total_quantity, 0)}</strong></td>
                    <td><strong>${formatCurrency(salesBreakdown.reduce((sum, item) => sum + item.total_amount, 0))}</strong></td>
                    <td><strong>${salesBreakdown.reduce((sum, item) => sum + item.orders, 0)}</strong></td>
                    <td><strong>-</strong></td>
                  </tr>
                </tbody>
              </table>
            ` : `
              <div style="text-align: center; padding: 40px; color: #666;">
                <p>No sales data found for ${selectedDate}</p>
              </div>
            `}
          </div>

          <div class="footer">
            <p>Generated on: ${new Date().toLocaleString()}</p>
            <p>Report generated by ChefMate POS System</p>
          </div>
        </body>
      </html>
    `;

    // Write content to the new window and print
    printWindow.document.write(printContent);
    printWindow.document.close();
    
    // Wait for content to load then print
    printWindow.onload = () => {
      printWindow.print();
      printWindow.close();
    };
  };

  const saveDayClose = async () => {
    if (!dayCloseData) {
      toast.error('No data to save');
      return;
    }

    try {
      setLoading(true);
      
      // Prepare day close summary data
      const dayClosePayload = {
        close_date: selectedDate,
        total_sales: dayCloseData.total_sales || 0,
        cash_sales: dayCloseData.cash_sales || 0,
        upi_sales: dayCloseData.upi_sales || 0,
        card_sales: dayCloseData.card_sales || 0,
        qr_sales: dayCloseData.qr_sales || 0,
        bank_transfer_sales: dayCloseData.bank_transfer_sales || 0,
        online_sales: dayCloseData.online_sales || 0,
        other_sales: dayCloseData.other_sales || 0,
        total_orders: dayCloseData.total_orders || 0,
        total_items_sold: dayCloseData.total_items_sold || 0,
        net_sales: dayCloseData.total_sales || 0,
        closed_by: getUserName(),
        closing_time: new Date().toISOString(),
        status: 'closed',
        notes: cashDrawerData.notes || ''
      };

      // Save to day_close_summary table
      const response = await axios.post(
        '/insertdata/day_close_summary',
        dayClosePayload,
        getHeaders()
      );

      if (response.data.success) {
        setIsDayClosed(true);
        setDayCloseData(prev => ({ ...prev, status: 'closed' }));
        toast.success('Day Close saved successfully!');
        setShowCloseModal(false);
        
        // Save cash drawer data if provided
        if (cashDrawerData.closingCash > 0 || cashDrawerData.openingCash > 0) {
          const cashDrawerPayload = {
            open_date: selectedDate,
            opening_cash: cashDrawerData.openingCash || 0,
            closing_cash: cashDrawerData.closingCash || 0,
            expected_cash: dayCloseData.cash_sales || 0,
            cash_difference: (cashDrawerData.closingCash || 0) - (dayCloseData.cash_sales || 0),
            cash_in: cashDrawerData.cashIn || 0,
            cash_out: cashDrawerData.cashOut || 0,
            closed_by: getUserName(),
            closing_time: new Date().toISOString(),
            status: 'closed',
            notes: cashDrawerData.notes || ''
          };

          await axios.post(
            '/insertdata/cash_drawer',
            cashDrawerPayload,
            getHeaders()
          );
        }
      } else {
        toast.error('Failed to save day close data');
      }
    } catch (error) {
      console.error('Error saving day close:', error);
      toast.error('Error saving day close data');
    } finally {
      setLoading(false);
    }
  };

  // Generate payment methods from fetched options
  const generatePaymentMethods = () => {
    return paymentOptions.map((option) => {
      const paymentConfig = getPaymentIcon(option.name);
      const key = `${option.name.toLowerCase().replace(/\s+/g, '_')}_sales`;
      
      return {
        key: key,
        label: option.name,
        icon: paymentConfig.icon,
        color: paymentConfig.color,
        gradient: paymentConfig.gradient
      };
    });
  };

  return (
    <Layout>
      <div className="day-close-container">
        <ToastContainer />
        
        <div className="page-header d-flex justify-content-between align-items-center mb-4">
          <div>
            <h6 className="page-title">
              <FaCalendarAlt className="me-2" />
              Day Close Summary
            </h6>
            <p className="text-muted">View and manage daily sales summary</p>
          </div>
          
          <div className="header-actions d-flex gap-2">
            <Form.Control
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="date-picker"
            />
            
            <Button 
              variant="outlined" 
              color="primary"
              onClick={() => setDetailedView(!detailedView)}
              size="small"
              startIcon={<Visibility />}
              sx={{ 
                textTransform: 'none',
                borderRadius: 2,
                px: 2
              }}
            >
              {detailedView ? 'Summary' : 'Details'}
            </Button>
            
            <Button 
              variant="contained"
              color="success"
              onClick={() => setShowCloseModal(true)}
              disabled={isDayClosed || loading || !dayCloseData}
              size="small"
              startIcon={<Lock />}
              sx={{ 
                textTransform: 'none',
                borderRadius: 2,
                px: 2
              }}
            >
              {isDayClosed ? 'Day Already Closed' : 'Close Day'}
            </Button>
            
            <Button 
              variant="outlined"
              color="primary"
              onClick={exportToPDF}
              size="small"
              startIcon={<Print />}
              sx={{ 
                textTransform: 'none',
                borderRadius: 2,
                px: 2
              }}
            >
              Print
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-5">
            <Spinner animation="border" variant="primary" />
            <p className="mt-2">Loading day close data...</p>
          </div>
        ) : (
          <>
          

            {/* Summary Cards */}
            <Row className="mb-4">
              <Col lg={3} md={6} className="mb-3">
                <Card className="summary-card total-sales">
                  <Card.Body className="text-center">
                    <div className="summary-icon">
                      <FaMoneyBillWave />
                    </div>
                    <h3 className="summary-amount">{formatCurrency(dayCloseData?.total_sales)}</h3>
                    <p className="summary-label">Total Sales</p>
                  </Card.Body>
                </Card>
              </Col>
              
              <Col lg={3} md={6} className="mb-3">
                <Card className="summary-card total-orders">
                  <Card.Body className="text-center">
                    <div className="summary-icon">
                      <FaCalendarAlt />
                    </div>
                    <h3 className="summary-amount">{dayCloseData?.total_orders || 0}</h3>
                    <p className="summary-label">Total Orders</p>
                  </Card.Body>
                </Card>
              </Col>
              
              <Col lg={3} md={6} className="mb-3">
                <Card className="summary-card total-items">
                  <Card.Body className="text-center">
                    <div className="summary-icon">
                      <FaQrcode />
                    </div>
                    <h3 className="summary-amount">{dayCloseData?.total_items_sold || 0}</h3>
                    <p className="summary-label">Items Sold</p>
                  </Card.Body>
                </Card>
              </Col>
              
              <Col lg={3} md={6} className="mb-3">
                <Card className="summary-card avg-order">
                  <Card.Body className="text-center">
                    <div className="summary-icon">
                      <FaCreditCard />
                    </div>
                    <h3 className="summary-amount">
                      {formatCurrency(
                        dayCloseData?.total_orders > 0 
                          ? dayCloseData.total_sales / dayCloseData.total_orders 
                          : 0
                      )}
                    </h3>
                    <p className="summary-label">Avg Order Value</p>
                  </Card.Body>
                </Card>
              </Col>
            </Row>

            {/* Payment Methods Breakdown */}
            <Card className="mb-4 shadow-lg border-0">
              <Card.Header className="bg-gradient text-white" >
                <h5 className="mb-0 d-flex align-items-center">
                  <FaCreditCard className="me-2" />
                  Payment Methods Breakdown
                </h5>
                <small className="opacity-75">Daily payment collection by method</small>
              </Card.Header>
              <Card.Body className="p-4">
                {paymentOptions.length === 0 ? (
                  <div className="text-center py-5">
                    <Spinner animation="border" variant="primary" className="mb-3" />
                    <p className="text-muted">Loading payment methods...</p>
                  </div>
                ) : (
                  <>
                    <Row>
                      {generatePaymentMethods().map((method) => (
                        <Col lg={4} md={6} sm={12} key={method.key} className="mb-4">
                          <div className="payment-method-card-minimal" style={{
                            background: 'white',
                            borderRadius: '12px',
                            padding: '24px',
                            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
                            border: '1px solid #f0f0f0',
                            transition: 'all 0.3s ease',
                            position: 'relative',
                            overflow: 'hidden'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-4px)';
                            e.currentTarget.style.boxShadow = '0 8px 40px rgba(0, 0, 0, 0.12)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.08)';
                          }}>
                            {/* Minimal gradient accent */}
                            <div style={{
                              position: 'absolute',
                              top: '0',
                              left: '0',
                              right: '0',
                              height: '4px',
                              background: method.gradient,
                              borderRadius: '12px 12px 0 0'
                            }}></div>
                            
                            {/* Content */}
                            <div className="pt-2">
                              <div className="d-flex justify-content-between align-items-start mb-3">
                                <div className="payment-icon-minimal" style={{
                                  fontSize: '2rem',
                                  color: '#6c757d'
                                }}>
                                  {method.icon}
                                </div>
                                <div className="text-end">
                                  <small className="text-muted text-uppercase" style={{ 
                                    fontSize: '0.75rem',
                                    fontWeight: '500',
                                    letterSpacing: '0.5px'
                                  }}>
                                    Payment
                                  </small>
                                </div>
                              </div>
                              
                              <div>
                                <h3 className="mb-1 text-dark" style={{ 
                                  fontWeight: '600',
                                  fontSize: '1.6rem'
                                }}>
                                  {formatCurrency(dayCloseData?.[method.key] || 0)}
                                </h3>
                                <h6 className="mb-3 text-secondary" style={{ 
                                  fontWeight: '500',
                                  fontSize: '1rem'
                                }}>
                                  {method.label}
                                </h6>
                                
                                <div className="d-flex justify-content-between align-items-center">
                                  <small className="text-muted">
                                    Today's Collection
                                  </small>
                                  <div className="status-badge" style={{
                                    padding: '3px 8px',
                                    background: dayCloseData?.[method.key] > 0 ? '#e8f5e8' : '#f8f9fa',
                                    color: dayCloseData?.[method.key] > 0 ? '#28a745' : '#6c757d',
                                    borderRadius: '8px',
                                    fontSize: '0.75rem',
                                    fontWeight: '500'
                                  }}>
                                    {dayCloseData?.[method.key] > 0 ? '● Active' : '○ No transactions'}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </Col>
                      ))}
                    </Row>
                    
                    {/* Summary Footer */}
                    <div className="mt-4 pt-4 border-top" style={{ borderColor: '#e9ecef !important' }}>
                      <Row className="justify-content-center">
                        <Col md={5} lg={4} className="mb-3 mb-md-0">
                          <div className="d-flex align-items-center justify-content-center p-3" style={{
                            background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
                            borderRadius: '12px',
                            border: '1px solid #dee2e6',
                            height: '100%',
                            minHeight: '80px'
                          }}>
                            <div className="summary-icon me-3" style={{
                              width: '48px',
                              height: '48px',
                              background: 'white',
                              borderRadius: '12px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#28a745',
                              fontSize: '1.5rem',
                              boxShadow: '0 2px 8px rgba(40, 167, 69, 0.2)',
                              flexShrink: 0
                            }}>
                              <FaMoneyBillWave />
                            </div>
                            <div className="text-center text-md-start">
                              <h5 className="mb-0 text-success" style={{ fontWeight: '600' }}>
                                {formatCurrency(dayCloseData?.total_sales || 0)}
                              </h5>
                              <small className="text-muted">Total Collections</small>
                            </div>
                          </div>
                        </Col>
                        <Col md={5} lg={4}>
                          <div className="d-flex align-items-center justify-content-center p-3" style={{
                            background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
                            borderRadius: '12px',
                            border: '1px solid #dee2e6',
                            height: '100%',
                            minHeight: '80px'
                          }}>
                            <div className="summary-icon me-3" style={{
                              width: '48px',
                              height: '48px',
                              background: 'white',
                              borderRadius: '12px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#007bff',
                              fontSize: '1.5rem',
                              boxShadow: '0 2px 8px rgba(0, 123, 255, 0.2)',
                              flexShrink: 0
                            }}>
                              📊
                            </div>
                            <div className="text-center text-md-start">
                              <h5 className="mb-0 text-primary" style={{ fontWeight: '600' }}>
                                {dayCloseData?.total_orders || 0}
                              </h5>
                              <small className="text-muted">Total Orders</small>
                            </div>
                          </div>
                        </Col>
                      </Row>
                    </div>
                  </>
                )}
              </Card.Body>
            </Card>

            {/* Detailed View */}
            {detailedView && (
              <Card>
                <Card.Header>
                  <h5 className="mb-0">Sales Breakdown by Items</h5>
                </Card.Header>
                <Card.Body>
                  <Table striped bordered hover responsive>
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Item Name</th>
                        <th>Quantity Sold</th>
                        <th>Total Amount</th>
                        <th>Orders</th>
                        <th>Avg Price</th>
                      </tr>
                    </thead>
                    <tbody>
                      {salesBreakdown.map((item, index) => (
                        <tr key={index}>
                          <td>{index + 1}</td>
                          <td>{item.item_name}</td>
                          <td>{item.total_quantity}</td>
                          <td>{formatCurrency(item.total_amount)}</td>
                          <td>{item.orders}</td>
                          <td>{formatCurrency(item.total_amount / item.total_quantity)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                  
                  {salesBreakdown.length === 0 && (
                    <div className="text-center py-4">
                      <p className="text-muted">No sales data found for {selectedDate}</p>
                    </div>
                  )}
                </Card.Body>
              </Card>
            )}
          </>
        )}

        {/* Day Close Modal */}
        <Modal show={showCloseModal} onHide={() => setShowCloseModal(false)} size="lg" centered>
          <Modal.Header closeButton>
            <Modal.Title>Close Day - {selectedDate}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Alert variant="warning">
              <strong>Warning:</strong> Once you close the day, you cannot modify the sales data for this date.
            </Alert>
            
            <Form>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Opening Cash Amount</Form.Label>
                    <Form.Control
                      type="number"
                      step="0.01"
                      value={cashDrawerData.openingCash}
                      onChange={(e) => setCashDrawerData({
                        ...cashDrawerData,
                        openingCash: e.target.value
                      })}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Closing Cash Amount</Form.Label>
                    <Form.Control
                      type="number"
                      step="0.01"
                      value={cashDrawerData.closingCash}
                      onChange={(e) => setCashDrawerData({
                        ...cashDrawerData,
                        closingCash: e.target.value
                      })}
                    />
                  </Form.Group>
                </Col>
              </Row>
              
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Cash In (Additional)</Form.Label>
                    <Form.Control
                      type="number"
                      step="0.01"
                      value={cashDrawerData.cashIn}
                      onChange={(e) => setCashDrawerData({
                        ...cashDrawerData,
                        cashIn: e.target.value
                      })}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Cash Out (Expenses)</Form.Label>
                    <Form.Control
                      type="number"
                      step="0.01"
                      value={cashDrawerData.cashOut}
                      onChange={(e) => setCashDrawerData({
                        ...cashDrawerData,
                        cashOut: e.target.value
                      })}
                    />
                  </Form.Group>
                </Col>
              </Row>
              
              <Form.Group className="mb-3">
                <Form.Label>Notes</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={cashDrawerData.notes}
                  onChange={(e) => setCashDrawerData({
                    ...cashDrawerData,
                    notes: e.target.value
                  })}
                  placeholder="Add any notes for this day close..."
                />
              </Form.Group>
              
              <div className="cash-summary p-3 bg-light rounded">
                <h6>Cash Summary</h6>
                <div className="d-flex justify-content-between">
                  <span>Expected Cash:</span>
                  <span>{formatCurrency(dayCloseData?.cash_sales || 0)}</span>
                </div>
                <div className="d-flex justify-content-between">
                  <span>Actual Cash:</span>
                  <span>{formatCurrency(cashDrawerData.closingCash)}</span>
                </div>
                <div className="d-flex justify-content-between border-top pt-2">
                  <strong>Difference:</strong>
                  <strong className={
                    (cashDrawerData.closingCash - (dayCloseData?.cash_sales || 0)) >= 0 
                      ? 'text-success' 
                      : 'text-danger'
                  }>
                    {formatCurrency(cashDrawerData.closingCash - (dayCloseData?.cash_sales || 0))}
                  </strong>
                </div>
              </div>
            </Form>
          </Modal.Body>
          <Modal.Footer>
            <Button 
              variant="outlined"
              color="secondary"
              onClick={() => setShowCloseModal(false)}
              startIcon={<Cancel />}
              sx={{ 
                textTransform: 'none',
                borderRadius: 2,
                px: 3
              }}
            >
              Cancel
            </Button>
            <Button 
              variant="contained"
              color="error"
              onClick={saveDayClose}
              disabled={loading}
              startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <LockClock />}
              sx={{ 
                textTransform: 'none',
                borderRadius: 2,
                px: 3,
                ml: 2
              }}
            >
              Close Day
            </Button>
          </Modal.Footer>
        </Modal>
      </div>
    </Layout>
  );
}
