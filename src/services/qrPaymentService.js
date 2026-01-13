import axios from 'axios';
import { message } from 'antd';

/**
 * Generate QR code for CheckBill mode (simple payment without cart items)
 * @param {number} paymentAmount - Amount to pay
 * @returns {Promise<Object>} QR code response data
 */
export const generateQRForCheckBill = async (paymentAmount) => {
  try {
    message.info('Generating SCB QR Code... Please wait');
    
    // Prepare minimal order details for SCB (CheckBill mode - no cart items, just amount)
    const orderDetails = {
      orderId: `BILL-${Date.now()}`,
      customerName: 'Customer Payment',
      items: [],
      source: 'CheckBillModal',
      timestamp: new Date().toISOString()
    };
    
    console.log('CheckBill Mode - Calling SCB API with data:', {
      paymentAmount: parseFloat(paymentAmount),
      orderDetails: orderDetails
    });
    
    // Generate SCB QR payment
    const scbResponse = await axios.post(
      '/scb/generate-qr-payment',
      {
        paymentAmount: parseFloat(paymentAmount),
        orderDetails: orderDetails
      }
    );

    console.log('SCB Response:', scbResponse.data);

    if (scbResponse.data && scbResponse.data.success) {
      // Extract QR data from the response
      const qrResponseData = {
        qrString: scbResponse.data.deeplinkUrl || scbResponse.data.qrData?.qrRawData,
        qrRawData: scbResponse.data.deeplinkUrl || scbResponse.data.qrData?.qrRawData,
        deeplinkUrl: scbResponse.data.deeplinkUrl,
        transactionId: scbResponse.data.qrData?.transactionId || orderDetails.orderId,
        amount: scbResponse.data.amount || paymentAmount,
        ref1: scbResponse.data.qrData?.ref1 || orderDetails.orderId,
        ref2: scbResponse.data.qrData?.ref2,
        ref3: scbResponse.data.qrData?.ref3,
        expiryDateTime: scbResponse.data.qrData?.expiryDateTime,
        qrImage: scbResponse.data.qrImage,
        isLegacy: false,
        mode: 'CHECKBILL'
      };
      
      console.log('CheckBill QR response data:', qrResponseData);
      message.success('QR Code generated successfully');
      return qrResponseData;
    } else {
      throw new Error(scbResponse.data?.error || scbResponse.data?.message || 'No QR code received from SCB API');
    }
  } catch (error) {
    console.error('SCB QR generation error (CheckBill):', error);
    
    // Show error and fallback message
    message.warning('SCB QR service unavailable. Using alternative QR code...');
    
    try {
      // Fallback: Generate simple QR with basic data
      const fallbackRef = `BILL-${Date.now()}`;
      const qrResponseData = {
        qrString: fallbackRef,
        transactionId: fallbackRef,
        amount: paymentAmount,
        ref1: fallbackRef,
        isLegacy: true,
        mode: 'CHECKBILL'
      };
      
      return qrResponseData;
    } catch (fallbackError) {
      console.error('Fallback QR generation also failed (CheckBill):', fallbackError);
      message.error('Failed to generate QR code. Please try another payment method.');
      throw fallbackError;
    }
  }
};

/**
 * Generate QR code for KIOSK mode (with cart items)
 * @param {number} paymentAmount - Amount to pay
 * @param {Array} cart - Cart items array
 * @returns {Promise<Object>} QR code response data
 */
export const generateQRForKiosk = async (paymentAmount, cart) => {
  try {
    message.info('Generating SCB QR Code... Please wait');
    
    // Prepare order details for SCB (KIOSK mode - with full cart)
    const orderDetails = {
      orderId: `ORDER-${Date.now()}`,
      customerName: 'KIOSK Customer',
      items: cart.map(item => ({
        name: item.iname || item.item_name,
        quantity: item.quantity,
        price: item.offerprice || item.price
      })),
      cashierId: 'KIOSK',
      timestamp: new Date().toISOString()
    };
    
    console.log('KIOSK Mode - Calling SCB API with data:', {
      paymentAmount: parseFloat(paymentAmount),
      orderDetails: orderDetails
    });
    
    // Generate SCB QR payment
    const scbResponse = await axios.post(
      '/scb/generate-qr-payment',
      {
        paymentAmount: parseFloat(paymentAmount),
        orderDetails: orderDetails
      }
    );

    console.log('SCB Response:', scbResponse.data);

    if (scbResponse.data && scbResponse.data.success) {
      // Extract QR data from the response
      const qrResponseData = {
        qrString: scbResponse.data.deeplinkUrl || scbResponse.data.qrData?.qrRawData,
        qrRawData: scbResponse.data.deeplinkUrl || scbResponse.data.qrData?.qrRawData,
        deeplinkUrl: scbResponse.data.deeplinkUrl,
        transactionId: scbResponse.data.qrData?.transactionId || orderDetails.orderId,
        amount: scbResponse.data.amount || paymentAmount,
        ref1: scbResponse.data.qrData?.ref1 || orderDetails.orderId,
        ref2: scbResponse.data.qrData?.ref2,
        ref3: scbResponse.data.qrData?.ref3,
        expiryDateTime: scbResponse.data.qrData?.expiryDateTime,
        qrImage: scbResponse.data.qrImage,
        isLegacy: false,
        mode: 'KIOSK'
      };
      
      console.log('KIOSK QR response data:', qrResponseData);
      message.success('QR Code generated successfully');
      return qrResponseData;
    } else {
      throw new Error(scbResponse.data?.error || scbResponse.data?.message || 'No QR code received from SCB API');
    }
  } catch (error) {
    console.error('SCB QR generation error (KIOSK):', error);
    
    // Show error and fallback message
    message.warning('SCB QR service unavailable. Using alternative QR code...');
    
    try {
      // Fallback: Generate simple QR with basic data
      const fallbackRef = `KIOSK-${Date.now()}`;
      const qrResponseData = {
        qrString: fallbackRef,
        transactionId: fallbackRef,
        amount: paymentAmount,
        ref1: fallbackRef,
        isLegacy: true,
        mode: 'KIOSK'
      };
      
      return qrResponseData;
    } catch (fallbackError) {
      console.error('Fallback QR generation also failed (KIOSK):', fallbackError);
      message.error('Failed to generate QR code. Please try another payment method.');
      throw fallbackError;
    }
  }
};
