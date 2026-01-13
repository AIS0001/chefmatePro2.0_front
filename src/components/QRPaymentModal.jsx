import React, { useState, useEffect } from 'react';
import { Modal, Space, Typography, Button, Spin, message } from 'antd';
import axios from 'axios';
import QRCode from 'qrcode';
import { generateQRForCheckBill, generateQRForKiosk } from '../services/qrPaymentService';

const { Title, Text } = Typography;

const QRPaymentModal = ({ 
  visible, 
  onClose, 
  cart, 
  total,
  billAmount,
  companyInfo,
  onPaymentSuccess 
}) => {
  const [qrCodeData, setQrCodeData] = useState(null);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [pollingInterval, setPollingInterval] = useState(null);
  
  // Use billAmount if provided, otherwise use total for backward compatibility
  const paymentAmount = billAmount || total;

  // Cleanup polling interval on unmount or when modal closes
  useEffect(() => {
    return () => {
      if (pollingInterval) {
        console.log('Cleaning up polling interval');
        clearInterval(pollingInterval);
      }
    };
  }, [pollingInterval]);

  useEffect(() => {
    if (visible) {
      // Use appropriate QR generation based on mode
      if (cart && cart.length > 0) {
        handleGenerateQRForKiosk();
      } else {
        handleGenerateQRForCheckBill();
      }
    } else {
      // Clear polling when modal closes
      if (pollingInterval) {
        clearInterval(pollingInterval);
        setPollingInterval(null);
      }
      setQrCodeData(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  // Helper function to generate QR code as base64 data URL
  const generateQRCodeBase64 = (text) => {
    try {
      const canvas = document.createElement('canvas');
      QRCode.toCanvas(canvas, text, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      return canvas.toDataURL('image/png');
    } catch (error) {
      console.error('Error generating QR code:', error);
      return null;
    }
  };

  // Generate QR for KIOSK mode (with cart items)
  const handleGenerateQRForKiosk = async () => {
    try {
      setPaymentLoading(true);
      const qrData = await generateQRForKiosk(paymentAmount, cart);
      setQrCodeData(qrData);
      setPaymentLoading(false);
    } catch (error) {
      console.error('Error in handleGenerateQRForKiosk:', error);
      setPaymentLoading(false);
    }
  };

  // Generate QR for CheckBill mode (simple payment without cart items)
  const handleGenerateQRForCheckBill = async () => {
    try {
      setPaymentLoading(true);
      const qrData = await generateQRForCheckBill(paymentAmount);
      setQrCodeData(qrData);
      setPaymentLoading(false);
    } catch (error) {
      console.error('Error in handleGenerateQRForCheckBill:', error);
      setPaymentLoading(false);
    }
  };

  const handleVerifyPayment = async () => {
    if (!qrCodeData?.ref1) {
      message.error('No payment reference found');
      return;
    }
    
    try {
      setPaymentLoading(true);
      message.info('Checking payment status...');
      
      console.log('Verifying payment for ref1:', qrCodeData.ref1);
      
      // Use public status endpoint (no auth required)
      const response = await axios.get(`/scb/public/status/${qrCodeData.ref1}`);
      const result = response.data.data || response.data;
      
      console.log('Payment status:', result.status);
      
      if (result.status === 'SUCCESS') {
        console.log('Payment successful! Completing order...');
        message.success('Payment verified successfully!');
        setPaymentLoading(false);
        
        // Call parent callback to complete order
        if (onPaymentSuccess) {
          onPaymentSuccess();
        }
        onClose();
      } else if (result.status === 'FAILED') {
        console.log('Payment failed');
        setPaymentLoading(false);
        message.error('Payment failed. Please try again.');
      } else if (result.status === 'PENDING') {
        console.log('Payment still pending');
        setPaymentLoading(false);
        message.warning('Payment is still pending. Please complete the payment and try again.');
      } else {
        console.log('Unknown payment status:', result.status);
        setPaymentLoading(false);
        message.info(`Payment status: ${result.status}`);
      }
    } catch (error) {
      console.error('Payment verification error:', error);
      setPaymentLoading(false);
      
      if (error.response?.status === 404) {
        message.warning('Payment not found. Please complete the payment first.');
      } else if (error.response?.status === 500) {
        message.error('Server error checking payment. Please try again.');
      } else {
        message.error('Error verifying payment: ' + (error.response?.data?.message || error.message));
      }
    }
  };

  const handleSimulatePayment = async () => {
    if (!qrCodeData?.ref1) {
      message.error('No payment reference found');
      return;
    }

    try {
      setPaymentLoading(true);
      message.info('Simulating payment...');

      const response = await axios.post('/scb/simulate-payment', {
        ref1: qrCodeData.ref1,
        amount: qrCodeData.amount
      });

      if (response.data.success) {
        message.success('Payment simulated successfully!');
        setTimeout(() => {
          handleVerifyPayment();
        }, 1000);
      } else {
        throw new Error(response.data.message || 'Simulation failed');
      }
    } catch (error) {
      console.error('Payment simulation error:', error);
      setPaymentLoading(false);
      message.error('Error simulating payment: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleContinueAnyway = async () => {
    console.log('🚀 Continue anyway clicked - saving bill via API');
    if (pollingInterval) {
      clearInterval(pollingInterval);
      setPollingInterval(null);
    }

    // Call parent callback with continue anyway action
    if (onPaymentSuccess) {
      onPaymentSuccess(true); // Pass true to indicate "continue anyway"
    }
  };

  const handleCancel = () => {
    console.log('QR Payment cancelled by user');
    if (pollingInterval) {
      clearInterval(pollingInterval);
      setPollingInterval(null);
    }
    onClose();
  };

  return (
    <Modal
      title={
        <div style={{ textAlign: 'center' }}>
          <Space direction="vertical" size={0}>
            <Title level={3} style={{ margin: 0, color: '#722ED1' }}>
              🏦 SCB QR Payment
            </Title>
            <Text type="secondary" style={{ fontSize: '14px' }}>
              Scan QR code with SCB Easy app to complete payment
            </Text>
          </Space>
        </div>
      }
      open={visible}
      onCancel={handleCancel}
      footer={null}
      width={500}
      centered
      zIndex={1100}
    >
      <Spin spinning={paymentLoading}>
        {qrCodeData && (
          <div style={{ textAlign: 'center', padding: '20px 24px' }}>
            {/* QR Code Container */}
            <div style={{
              border: '3px solid #722ED1',
              backgroundColor: '#fff',
              padding: '24px',
              borderRadius: '12px',
              marginBottom: '20px',
              display: 'inline-block'
            }}>
              {(() => {
                // Try to use qrImage first
                if (qrCodeData.qrImage) {
                  return (
                    <img 
                      src={`data:image/png;base64,${qrCodeData.qrImage}`} 
                      alt="QR Code" 
                      style={{ width: '280px', height: '280px', display: 'block' }}
                      onError={(e) => {
                        console.error('QR Image failed to load');
                      }}
                    />
                  );
                }
                
                // If no qrImage, generate from qrString or qrRawData
                const qrText = qrCodeData.qrString || qrCodeData.qrRawData;
                if (qrText) {
                  const qrBase64 = generateQRCodeBase64(qrText);
                  if (qrBase64) {
                    return (
                      <img 
                        src={qrBase64} 
                        alt="Generated QR Code" 
                        style={{ width: '280px', height: '280px', display: 'block' }}
                      />
                    );
                  }
                }
                
                // Fallback if no QR data available
                return (
                  <div style={{ width: '280px', height: '280px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Text type="warning">QR Code not available</Text>
                  </div>
                );
              })()}
            </div>
            
            {/* Amount and Order ID */}
            <div style={{ marginBottom: '20px' }}>
              <Title level={4} style={{ margin: '0 0 8px 0', color: '#722ED1' }}>
                Amount: ฿{qrCodeData.amount}
              </Title>
              <Text type="secondary" style={{ fontSize: '13px' }}>
                Order ID: {qrCodeData.ref1 || 'ORDER-' + Date.now()}
              </Text>
            </div>
            
            {/* Payment Instructions */}
            <div style={{
              backgroundColor: '#FFFBEA',
              border: '1px solid #FDE68A',
              borderRadius: '8px',
              padding: '16px',
              marginBottom: '20px',
              textAlign: 'left'
            }}>
              <div style={{ marginBottom: '12px' }}>
                <Text strong style={{ color: '#D97706' }}>
                  🌹 Payment Instructions:
                </Text>
              </div>
              <div style={{ paddingLeft: '8px' }}>
                <div style={{ marginBottom: '6px' }}>
                  <Text style={{ fontSize: '13px' }}>1. Open SCB Easy app on your mobile phone</Text>
                </div>
                <div style={{ marginBottom: '6px' }}>
                  <Text style={{ fontSize: '13px' }}>2. Scan the QR code above</Text>
                </div>
                <div style={{ marginBottom: '6px' }}>
                  <Text style={{ fontSize: '13px' }}>3. Confirm the payment amount</Text>
                </div>
                <div>
                  <Text style={{ fontSize: '13px' }}>4. Complete the payment</Text>
                </div>
              </div>
            </div>
            
            {/* Action Buttons */}
            <Space direction="horizontal" size="middle" style={{ width: '100%', justifyContent: 'center', marginBottom: '12px' }}>
              <Button
                type="primary"
                size="large"
                onClick={handleVerifyPayment}
                loading={paymentLoading}
                style={{
                  backgroundColor: '#10B981',
                  borderColor: '#10B981',
                  borderRadius: '8px',
                  fontWeight: 500
                }}
              >
                ✓ Check Payment
              </Button>
              
              <Button
                type="primary" 
                size="large"
                onClick={handleContinueAnyway}
                loading={paymentLoading}
                style={{
                  backgroundColor: '#06B6D4',
                  borderColor: '#06B6D4',
                  borderRadius: '8px',
                  fontWeight: 500
                }}
              >
                🚀 Continue Anyway
              </Button>
            </Space>
            
            <Space direction="horizontal" size="middle" style={{ width: '100%', justifyContent: 'center', marginBottom: '16px' }}>
              <Button
                size="large"
                onClick={handleSimulatePayment}
                style={{
                  backgroundColor: '#F97316',
                  borderColor: '#F97316',
                  color: '#fff',
                  borderRadius: '8px',
                  fontWeight: 500
                }}
              >
                🔧 Simulate Payment
              </Button>
              
              <Button
                size="large"
                onClick={handleCancel}
                style={{
                  backgroundColor: '#6B7280',
                  borderColor: '#6B7280',
                  color: '#fff',
                  borderRadius: '8px',
                  fontWeight: 500
                }}
              >
                Cancel
              </Button>
            </Space>
            
            <Text type="secondary" style={{ fontSize: '12px', display: 'block' }}>
              Payment will timeout in 15 minutes
            </Text>
          </div>
        )}
      </Spin>
    </Modal>
  );
};

export default QRPaymentModal;
