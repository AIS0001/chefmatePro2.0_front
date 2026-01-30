import axios from 'axios';
import { message } from 'antd';

/**
 * Generate invoice canvas for thermal printing (80mm thermal bill - portrait mode)
 * @param {Object} invoiceData - Invoice data with full receipt details
 * @returns {HTMLCanvasElement} Canvas element with rendered invoice
 */
export const generateTicketCanvas = (invoiceData) => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  const dotsPerMM = 8;
  const paperWidth = 80 * dotsPerMM; // 80mm width = 640 pixels
  
  // Calculate dynamic height based on content
  const baseHeight = 480; // Base height for fixed sections (headers, footers, spacing)
  const itemHeight = 38; // Height per item (matches lineHeight = 38)
  const totalHeight = baseHeight + (invoiceData.items.length * itemHeight);
  
  canvas.width = paperWidth;
  canvas.height = totalHeight;
  
  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  ctx.fillStyle = 'black';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  
  const centerX = canvas.width / 2;
  const leftMargin = 15;
  const rightMargin = 90;
  let yPos = 15;
  const lineHeight = 38;
  
  // Company Name
  ctx.font = 'bold 38px Arial';
  ctx.fillText(invoiceData.companyName || 'CHEFMATE', centerX, yPos);
  yPos += lineHeight;
  
  // Company Address
  if (invoiceData.companyAddress) {
    ctx.font = '24px Arial';
    ctx.fillText(invoiceData.companyAddress, centerX, yPos);
    yPos += lineHeight - 5;
  }
  
  // Company Phone and Tax ID
  if (invoiceData.companyPhone) {
    ctx.font = '24px Arial';
    ctx.fillText(invoiceData.companyPhone, centerX, yPos);
    yPos += lineHeight - 8;
  }
  
  // Tax ID
  ctx.font = '24px Arial';
  ctx.fillText(`Tax:- ${invoiceData.companyTaxId || ''}`, centerX, yPos);
  yPos += lineHeight - 5;
  
  // Bill ID and Table Number on same line
  ctx.font = 'bold 24px Arial';
  ctx.textAlign = 'left';
  ctx.fillText(`Bill ID: ${invoiceData.billId}`, leftMargin, yPos);
  ctx.textAlign = 'right';
  ctx.fillText(` ${invoiceData.queueNumber}`, canvas.width - rightMargin, yPos);
  yPos += lineHeight;
  
  // Date and Time on same line
  ctx.font = '24px Arial';
  const currentDate = new Date(invoiceData.timestamp);
  const formattedDate = currentDate.toISOString().split('T')[0]; // YYYY-MM-DD
  const formattedTime = currentDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
  ctx.textAlign = 'left';
  ctx.fillText(`Date: ${formattedDate}`, leftMargin, yPos);
  ctx.textAlign = 'right';
  ctx.fillText(`Time: ${formattedTime}`, canvas.width - rightMargin, yPos);
  yPos += lineHeight;
  
  // Payment Mode
  ctx.font = '24px Arial';
  ctx.textAlign = 'left';
  ctx.fillText(` Mode: ${invoiceData.paymentMethod || 'CASH'}`, leftMargin, yPos);
  yPos += lineHeight + 5;
  
  // Separator
  ctx.fillRect(leftMargin, yPos, canvas.width - (leftMargin + rightMargin), 1);
  yPos += 10;
  
  // Items Header
  ctx.font = 'bold 24px Arial';
  ctx.textAlign = 'left';
  ctx.fillText('Item', leftMargin, yPos);
  ctx.textAlign = 'center';
  ctx.fillText('Qty', centerX - 50, yPos);
  ctx.textAlign = 'center';
  ctx.fillText('Rate', centerX + 10, yPos);
  ctx.textAlign = 'right';
  ctx.fillText('Total', canvas.width - rightMargin - 5, yPos);
  yPos += lineHeight;
  
  // Separator
  ctx.fillRect(leftMargin, yPos, canvas.width - (leftMargin + rightMargin), 1);
  yPos += 8;
  
  // Items
  ctx.font = '24px Arial';
  if (invoiceData.items && invoiceData.items.length > 0) {
    invoiceData.items.forEach(item => {
      ctx.textAlign = 'left';
      const itemName = (item.item_name || item.iname || 'Item').substring(0, 16);
      ctx.fillText(itemName, leftMargin, yPos);
      
      ctx.textAlign = 'center';
      ctx.fillText(`${item.quantity}`, centerX - 50, yPos);
      ctx.fillText(`฿${parseFloat(item.price || 0).toFixed(2)}`, centerX + 10, yPos);
      
      ctx.textAlign = 'right';
      const itemTotal = parseFloat(item.total || 0);
      ctx.fillText(`฿${itemTotal.toFixed(2)}`, canvas.width - rightMargin - 5, yPos);
      
      yPos += lineHeight;
    });
  }
  
  yPos += 5;
  // Separator
  ctx.fillRect(leftMargin, yPos, canvas.width - (leftMargin + rightMargin), 1);
  yPos += 12;
  
  // Subtotal
  ctx.font = '28px Arial';
  ctx.textAlign = 'left';
  ctx.fillText(`Subtotal:`, leftMargin, yPos);
  ctx.textAlign = 'right';
  ctx.fillText(`฿${parseFloat(invoiceData.subtotal || invoiceData.total || 0).toFixed(2)}`, canvas.width - rightMargin - 5, yPos);
  yPos += lineHeight;
  
  // Discount - only show if discount > 0
  const discountAmount = parseFloat(invoiceData.discountAmount || 0);
  if (discountAmount > 0) {
    ctx.textAlign = 'left';
    ctx.fillText(`Discount: ${invoiceData.discountPercent || 0}%`, leftMargin, yPos);
    ctx.textAlign = 'right';
    ctx.fillText(`฿${discountAmount.toFixed(2)}`, canvas.width - rightMargin - 5, yPos);
    yPos += lineHeight;
    
    // Subtotal after discount
    ctx.font = 'bold 28px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`Subtotal after Discount:`, leftMargin, yPos);
    ctx.textAlign = 'right';
    ctx.fillText(`฿${parseFloat(invoiceData.subtotalAfterDiscount || invoiceData.subtotal || invoiceData.total || 0).toFixed(2)}`, canvas.width - rightMargin - 5, yPos);
    yPos += lineHeight;
  }
  
  // Tax
  ctx.font = '28px Arial';
  ctx.textAlign = 'left';
  ctx.fillText(`Tax (${invoiceData.taxPercent || 7}%):`, leftMargin, yPos);
  ctx.textAlign = 'right';
  ctx.fillText(`฿${parseFloat(invoiceData.taxAmount || 0).toFixed(2)}`, canvas.width - rightMargin - 5, yPos);
  yPos += lineHeight;
  
  // Round Off
  ctx.textAlign = 'left';
  ctx.fillText(`Round Off:`, leftMargin, yPos);
  ctx.textAlign = 'right';
  ctx.fillText(`฿${parseFloat(invoiceData.roundOff || 0).toFixed(2)}`, canvas.width - rightMargin - 5, yPos);
  yPos += lineHeight;
  
  // Total Amount
  ctx.font = 'bold 28px Arial';
  ctx.textAlign = 'left';
  ctx.fillText('Total Amount:', leftMargin, yPos);
  ctx.textAlign = 'right';
  ctx.fillText(`฿${parseFloat(invoiceData.total || invoiceData.amount || 0).toFixed(2)}`, canvas.width - rightMargin - 5, yPos);
  yPos += lineHeight + 8;
  
  // Separator
  ctx.fillRect(leftMargin, yPos, canvas.width - (leftMargin + rightMargin), 1);
  yPos += 10;
  
  // Operated By
  if (invoiceData.operatedBy) {
    ctx.font = '28px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`Operated By: ${invoiceData.operatedBy}`, centerX, yPos);
    yPos += lineHeight - 5;
  }
  
  // Footer message
  ctx.font = '28px Arial';
  ctx.fillText('Powered by chefmate POS !!', centerX, yPos);
  yPos += lineHeight - 5;
  ctx.fillText('Thank You!', centerX, yPos);
  
  return canvas;
};

/**
 * Generate KIOSK invoice canvas for thermal printing (simple format with Queue number prominent)
 * @param {Object} invoiceData - Invoice data with KIOSK-specific details
 * @returns {HTMLCanvasElement} Canvas element with rendered KIOSK invoice
 */
export const generateKioskInvoiceCanvas = (invoiceData) => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  const dotsPerMM = 8;
  const paperWidth = 80 * dotsPerMM; // 80mm width = 640 pixels
  
  // Calculate dynamic height based on content
  const baseHeight = 400;
  const itemHeight = 26; // Height per item (matches lineHeight = 26)
  const totalHeight = baseHeight + (invoiceData.items.length * itemHeight);
  
  canvas.width = paperWidth;
  canvas.height = totalHeight;
  
  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  ctx.fillStyle = 'black';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  
  const centerX = canvas.width / 2;
  const leftMargin = 15;
  const rightMargin = 95;
  let yPos = 15;
  const lineHeight = 26;
  
  // Company Name
  ctx.font = 'bold 24px Arial';
  ctx.fillText(invoiceData.companyName || 'CHEFMATE', centerX, yPos);
  yPos += lineHeight;
  
  // Company Address
  if (invoiceData.companyAddress) {
    ctx.font = '18px Arial';
    ctx.fillText(invoiceData.companyAddress, centerX, yPos);
    yPos += lineHeight - 2;
  }
  
  // Company Phone
  if (invoiceData.companyPhone) {
    ctx.font = '18px Arial';
    ctx.fillText(invoiceData.companyPhone, centerX, yPos);
    yPos += lineHeight - 2;
  }
  
  // Tax ID
  ctx.font = '18px Arial';
  ctx.fillText(`Tax:- ${invoiceData.companyTaxId || ''}`, centerX, yPos);
  yPos += lineHeight + 2;
  
  // Queue Number - PROMINENT (old style)
  ctx.font = 'bold 24px Arial';
  ctx.fillStyle = '#FF6B00'; // Orange for visibility
  ctx.fillText(`QUEUE #${invoiceData.queueNumber}`, centerX, yPos);
  ctx.fillStyle = 'black';
  yPos += lineHeight + 5;
  
  // Bill ID
  ctx.font = 'bold 18px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(`Bill ID: ${invoiceData.billId}`, centerX, yPos);
  yPos += lineHeight - 5;
  
  // Date and Time
  ctx.font = '18px Arial';
  const currentDate = new Date(invoiceData.timestamp);
  const formattedDate = currentDate.toISOString().split('T')[0];
  const formattedTime = currentDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
  ctx.fillText(`${formattedDate} ${formattedTime}`, centerX, yPos);
  yPos += lineHeight;
  
  // Separator
  ctx.fillRect(leftMargin, yPos, canvas.width - (leftMargin + rightMargin), 1);
  yPos += 8;
  
  // Items Header
  ctx.font = 'bold 20px Arial';
  ctx.textAlign = 'left';
  ctx.fillText('Item', leftMargin, yPos);
  ctx.textAlign = 'center';
  ctx.fillText('Qty', centerX - 40, yPos);
  ctx.textAlign = 'right';
  ctx.fillText('Total', canvas.width - rightMargin - 5, yPos);
  yPos += lineHeight;
  
  // Separator
  ctx.fillRect(leftMargin, yPos, canvas.width - (leftMargin + rightMargin), 1);
  yPos += 6;
  
  // Items
  ctx.font = '20px Arial';
  if (invoiceData.items && invoiceData.items.length > 0) {
    invoiceData.items.forEach(item => {
      ctx.textAlign = 'left';
      const itemName = (item.item_name || item.iname || 'Item').substring(0, 16);
      ctx.fillText(itemName, leftMargin, yPos);
      
      ctx.textAlign = 'center';
      ctx.fillText(`x${item.quantity}`, centerX - 40, yPos);
      
      ctx.textAlign = 'right';
      const itemTotal = parseFloat(item.total || 0);
      ctx.fillText(`฿${itemTotal.toFixed(2)}`, canvas.width - rightMargin - 5, yPos);
      
      yPos += lineHeight;
    });
  }
  
  yPos += 3;
  // Separator
  ctx.fillRect(leftMargin, yPos, canvas.width - (leftMargin + rightMargin), 1);
  yPos += 10;
  
  // Total Amount - PROMINENT
  ctx.font = 'bold 18px Arial';
  ctx.textAlign = 'left';
  ctx.fillText('Total:', leftMargin, yPos);
  ctx.textAlign = 'right';
  ctx.fillText(`฿${invoiceData.total}`, canvas.width - rightMargin - 5, yPos);
  yPos += lineHeight + 5;
  
  // Payment Method
  ctx.font = '14px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(`Payment: ${invoiceData.paymentMethod || 'CASH'}`, centerX, yPos);
  yPos += lineHeight;
  
  // Separator
  ctx.fillRect(leftMargin, yPos, canvas.width - (leftMargin + rightMargin), 1);
  yPos += 8;
  
  // Footer
  ctx.font = '14px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('Thank You!', centerX, yPos);
  yPos += lineHeight - 3;
  ctx.fillText('Please Come Again', centerX, yPos);
  
  return canvas;
};

/**
 * Generate KOT (Kitchen Order Ticket) canvas for thermal printing
 * @param {Object} kotData - KOT data containing table, orderNumber, timestamp, items, total
 * @returns {HTMLCanvasElement} Canvas element with rendered KOT
 */
export const generateKOTCanvas = (kotData) => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  const dotsPerMM = 8;
  const paperWidth = 80 * dotsPerMM; // 80mm width = 640 pixels
  
  // Calculate dynamic height based on content
  const baseHeight = 420; // Optimized for minimal blank space with short tickets
  const itemHeight = 40; // Height per item (matches lineHeight used during rendering)
  const totalHeight = baseHeight + (kotData.items.length * itemHeight);
  
  canvas.width = paperWidth;
  canvas.height = totalHeight;
  
  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  ctx.fillStyle = 'black';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  
  const centerX = canvas.width / 2;
  const leftMargin = 30;   // Reduced to 20
  const rightMargin = 140;  // Reduced to 20 for full width
  let yPos = 15;
  const lineHeight = 30;
  
  // KOT Header
  ctx.font = 'bold 28px Arial';
  ctx.fillText('KITCHEN ORDER TICKET', centerX, yPos);
  yPos += lineHeight;
  
  ctx.font = 'bold 26px Arial';
  ctx.fillText('(KOT)', centerX, yPos);
  yPos += lineHeight + 5;
  
  // Separator (full width)
  ctx.textAlign = 'left';
  ctx.font = '24px Arial';
  // Calculate separator length based on full available width
  const separatorLength = 85; // Approximately 45 dashes for 80mm width with this font
  const separator = '-'.repeat(separatorLength);
  ctx.fillText(separator, leftMargin, yPos);
  yPos += lineHeight;
  
  // Table and Order Number on same line
  ctx.font = 'bold 24px Arial';
  ctx.fillText(` ${kotData.table || 'N/A'}`, leftMargin, yPos);
  ctx.textAlign = 'right';
  ctx.fillText(`Order #: ${kotData.orderNumber || 'N/A'}`, canvas.width - rightMargin, yPos);
  yPos += lineHeight;
  
  // Date and Time on same line
  ctx.textAlign = 'left';
  const currentDate = new Date(kotData.timestamp || new Date());
  const formattedDate = currentDate.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' });
  const formattedTime = currentDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
  ctx.font = '24px Arial';
  ctx.fillText(`Date: ${formattedDate}`, leftMargin, yPos);
  ctx.textAlign = 'right';
  ctx.fillText(`Time: ${formattedTime}`, canvas.width - rightMargin, yPos);
  yPos += lineHeight + 15;
  
  // Separator
  ctx.textAlign = 'left';
  ctx.font = '18px Arial';
  ctx.fillText(separator, leftMargin, yPos);
  yPos += lineHeight;
  
  // Item and Qty header
  ctx.font = 'bold 24px Arial';
  ctx.fillText('Item', leftMargin, yPos);
  ctx.textAlign = 'right';
  ctx.fillText('Qty', canvas.width - rightMargin, yPos);
  yPos += lineHeight + 3;
  
  // Items list
  ctx.font = '24px Arial';
  if (kotData.items && kotData.items.length > 0) {
    kotData.items.forEach(item => {
      const itemName = (item.item_name || item.iname || 'Item');
      const quantity = item.quantity || 1;
      
      ctx.textAlign = 'left';
      ctx.fillText(itemName, leftMargin, yPos);
      ctx.textAlign = 'right';
      ctx.fillText(`${quantity}`, canvas.width - rightMargin, yPos);
      yPos += itemHeight;
    });
  }
  
  // Double separator before total
  ctx.textAlign = 'left';
  ctx.font = '24px Arial';
  ctx.fillText(separator, leftMargin, yPos);
  yPos += 5;
  ctx.fillText(separator, leftMargin, yPos);
  yPos += lineHeight;
  
  // Total (centered)
  if (kotData.total !== undefined && kotData.total !== null) {
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`Powered by chefmate POS`, centerX, yPos);
    // ctx.fillText(`Total: ฿ ${parseFloat(kotData.total).toFixed(2)}`, centerX, yPos);
    yPos += lineHeight;
  }
  
  return canvas;
};

/**
 * Convert canvas to ESC/POS commands for thermal printer
 * @param {HTMLCanvasElement} canvas - Canvas element to convert
 * @returns {Uint8Array} ESC/POS command data
 */
export const canvasToESCPOS = (canvas) => {
  const imageData = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height);
  const pixels = imageData.data;
  
  const monoPixels = [];
  for (let i = 0; i < pixels.length; i += 4) {
    const gray = (pixels[i] + pixels[i + 1] + pixels[i + 2]) / 3;
    monoPixels.push(gray > 128 ? 0 : 1);
  }
  
  const rasterData = [];
  for (let y = 0; y < canvas.height; y++) {
    const rowBytes = [];
    for (let x = 0; x < canvas.width; x += 8) {
      let byte = 0;
      for (let bit = 0; bit < 8; bit++) {
        if (x + bit < canvas.width) {
          const pixelIndex = y * canvas.width + (x + bit);
          if (monoPixels[pixelIndex]) {
            byte |= (0x80 >> bit);
          }
        }
      }
      rowBytes.push(byte);
    }
    rasterData.push(...rowBytes);
  }
  
  const commands = [];
  commands.push(0x1B, 0x40); // Initialize
  
  // No top margin - start printing immediately
  
  // Send raster image
  const widthBytes = Math.ceil(canvas.width / 8);
  const widthL = widthBytes & 0xFF;
  const widthH = (widthBytes >> 8) & 0xFF;
  const heightL = canvas.height & 0xFF;
  const heightH = (canvas.height >> 8) & 0xFF;
  
  commands.push(0x1D, 0x76, 0x30, 0x00);
  commands.push(widthL, widthH);
  commands.push(heightL, heightH);
  commands.push(...rasterData);
  
  // Feed and cut
  commands.push(0x1B, 0x64, 0x03);
  commands.push(0x1D, 0x56, 0x42, 0x00);
  
  return new Uint8Array(commands);
};

/**
 * Send ESC/POS data to thermal printer via ThermalAgent server
 * @param {Uint8Array|String} escposData - ESC/POS command data (Uint8Array or base64 string)
 * @param {Object} options - Optional configuration
 * @param {string} options.printerUrl - Printer server URL (default: http://localhost:7001)
 * @param {boolean} options.multiPrinter - Send to multiple printers (default: true)
 * @param {boolean} options.sequential - Print sequentially instead of simultaneously (default: false)
 * @param {boolean} options.showSuccessMessage - Show success message (default: false)
 * @param {boolean} options.showErrorMessage - Show error message (default: true)
 * @returns {Promise<boolean>} Success status
 */
export const sendToThermalPrinter = async (escposData, options = {}) => {
  const {
    printerUrl = 'http://localhost:7001',
    multiPrinter = false,
    sequential = false,
    showSuccessMessage = false,
    showErrorMessage = true
  } = options;

  try {
    // Convert to base64 if not already
    let base64Data;
    if (typeof escposData === 'string') {
      base64Data = escposData;
    } else {
      base64Data = btoa(String.fromCharCode.apply(null, escposData));
    }

    // Determine endpoint based on multiPrinter setting
    const endpoint = multiPrinter ? `${printerUrl}/print-multi` : `${printerUrl}/print`;
    
    // Prepare request payload                           
    const payload = {
      data: base64Data
    };
    
    // Add sequential flag for multi-printer mode
    if (multiPrinter) {
      payload.sequential = sequential;
    }
    
    // Add printer index if specified
    if (options.printerIndex !== undefined) {
      payload.printerIndex = options.printerIndex;
      console.log(`📍 Printer Index in payload: ${options.printerIndex}`);
    }

    console.log(`📤 Sending to thermal printer(s) - Mode: ${multiPrinter ? (sequential ? 'sequential' : 'simultaneous') : 'single'}`);
    console.log(`📋 Payload keys:`, Object.keys(payload));

    const response = await axios.post(endpoint, payload);
    
    if (response.data.success) {
      console.log('✅ Thermal print successful');
      
      // Log multi-printer results
      if (multiPrinter && response.data.results) {
        console.log(`📊 Multi-printer results: ${response.data.successCount}/${response.data.totalPrinters} successful`);
        response.data.results.forEach(result => {
          if (result.success) {
            console.log(`  ✅ ${result.ip}:${result.port} - Success`);
          } else {
            console.log(`  ❌ ${result.ip}:${result.port} - Failed: ${result.error}`);
          }
        });
      }
      
      if (showSuccessMessage) {
        if (multiPrinter && response.data.totalPrinters > 1) {
          message.success(`Print sent to ${response.data.successCount}/${response.data.totalPrinters} printer(s)!`);
        } else {
          message.success('Print successful!');
        }
      }
      return true;
    } else {
      throw new Error(response.data.error || 'Print failed');
    }
  } catch (error) {
    console.error('❌ Failed to send to thermal printer:', error);
    if (showErrorMessage) {
      if (error.response?.data?.message) {
        message.error(`Printer error: ${error.response.data.message}`);
      } else if (error.code === 'ECONNREFUSED' || error.message.includes('Network Error')) {
        message.error('Failed to connect to printer server. Make sure printer server is running on port 7001.');
      } else {
        message.error('Failed to send to thermal printer.');
      }
    }
    return false;
  }
};

/**
 * Print invoice to thermal printer
 * @param {Object} invoiceData - Invoice data
 * @param {Object} options - Print options
 * @returns {Promise<boolean>} Success status
 */
export const printInvoice = async (invoiceData, options = {}) => {
  try {
    console.log('🧾 Printing invoice to Kitchen...');
    const canvas = generateTicketCanvas(invoiceData);
    const escposData = canvasToESCPOS(canvas);
    // Send to Kitchen printer (index 0)
    return await sendToThermalPrinter(escposData, {
      ...options,
      printerIndex: 0
    });
  } catch (error) {
    console.error('❌ Error printing invoice:', error);
    if (options.showErrorMessage !== false) {
      message.error('Failed to print invoice');
    }
    return false;
  }
};

/**
 * Print invoice to cashier thermal printer
 * @param {Object} invoiceData - Invoice data with full receipt details
 * @param {Object} options - Print options
 * @returns {Promise<boolean>} Success status
 */
export const printInvoiceToCashier = async (invoiceData, options = {}) => {
  try {
    console.log('🧾 Printing invoice to Cashier (192.168.1.216)...');
    console.log('📍 Options passed:', options);
    const canvas = generateTicketCanvas(invoiceData);
    const escposData = canvasToESCPOS(canvas);
    // Send to Cashier printer (index 1)
    const result = await sendToThermalPrinter(escposData, {
      ...options,
      printerIndex: 1
    });
    console.log('✅ printInvoiceToCashier completed, result:', result);
    return result;
  } catch (error) {
    console.error('❌ Error printing invoice to cashier:', error);
    if (options.showErrorMessage !== false) {
      message.error('Failed to print invoice to cashier');
    }
    return false;
  }
};

/**
 * Print KIOSK invoice to thermal printer (simple format with Queue number)
 * @param {Object} invoiceData - Invoice data for KIOSK mode
 * @param {Object} options - Print options
 * @returns {Promise<boolean>} Success status
 */
export const printKioskInvoice = async (invoiceData, options = {}) => {
  try {
    console.log('🧾 Printing KIOSK invoice...');
    const canvas = generateKioskInvoiceCanvas(invoiceData);
    const escposData = canvasToESCPOS(canvas);
    return await sendToThermalPrinter(escposData, options);
  } catch (error) {
    console.error('❌ Error printing KIOSK invoice:', error);
    if (options.showErrorMessage !== false) {
      message.error('Failed to print KIOSK invoice');
    }
    return false;
  }
};

/**
 * Print multiple tickets/invoices sequentially
 * @param {Array<Object>} ticketsArray - Array of ticket/invoice data
 * @param {Object} options - Print options
 * @param {number} options.delayBetweenPrints - Delay between prints in ms (default: 500)
 * @returns {Promise<boolean>} Success status
 */
export const printMultipleTickets = async (ticketsArray, options = {}) => {
  const { delayBetweenPrints = 500, ...printOptions } = options;

  try {
    console.log(`🎟️ Printing ${ticketsArray.length} ticket(s)...`);
    
    for (const ticketData of ticketsArray) {
      const canvas = generateTicketCanvas(ticketData);
      const escposData = canvasToESCPOS(canvas);
      await sendToThermalPrinter(escposData, { ...printOptions, showSuccessMessage: false });
      
      // Small delay between tickets
      if (delayBetweenPrints > 0) {
        await new Promise(resolve => setTimeout(resolve, delayBetweenPrints));
      }
    }
    
    if (printOptions.showSuccessMessage !== false) {
      message.success(`Successfully sent ${ticketsArray.length} ticket(s) to printer`);
    }
    return true;
  } catch (error) {
    console.error('❌ Error printing tickets:', error);
    if (printOptions.showErrorMessage !== false) {
      message.error('Failed to print tickets. Check printer connection.');
    }
    return false;
  }
};

/**
 * Print KOT (Kitchen Order Ticket) to thermal printer
 * @param {Object} kotData - KOT data containing table, orderNumber, items, total
 * @param {Object} options - Print options
 * @returns {Promise<boolean>} Success status
 */
export const printKOT = async (kotData, options = {}) => {
  try {
    console.log('🍳 Printing KOT...');
    const canvas = generateKOTCanvas(kotData);
    const escposData = canvasToESCPOS(canvas);
    // KOT always prints to multiple printers (kitchen + cashier)
    const result = await sendToThermalPrinter(escposData, { ...options, multiPrinter: true });
    
    if (result && options.showSuccessMessage !== false) {
      message.success('KOT sent to kitchen printer!');
    }
    
    return result;
  } catch (error) {
    console.error('❌ Error printing KOT:', error);
    if (options.showErrorMessage !== false) {
      message.error('Failed to print KOT');
    }
    return false;
  }
};

const thermalPrinterExports = {
  generateTicketCanvas,
  generateKioskInvoiceCanvas,
  generateKOTCanvas,
  canvasToESCPOS,
  sendToThermalPrinter,
  printInvoice,
  printKioskInvoice,
  printMultipleTickets,
  printKOT
};

export default thermalPrinterExports;
