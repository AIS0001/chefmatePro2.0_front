import React, { useState } from 'react';
import { format } from 'date-fns';
import { QRCodeSVG } from 'qrcode.react';
import Barcode from 'react-barcode';
import './BoardingPass.css';

const BoardingPass = () => {
    const [ticketData, setTicketData] = useState({
        ticketNo: '',
        customerType: 'Regular',
        customerCategory: 'Adult',
        mode: 'Cash'
    });
    
    const [printStyle, setPrintStyle] = useState('vertical'); // vertical or horizontal
    
    const generateTicketNo = () => {
        const timestamp = Date.now();
        const random = Math.floor(Math.random() * 1000);
        return `BP${timestamp}${random}`;
    };

    const getCurrentDateTime = () => {
        return new Date();
    };

    const getValidTill = () => {
        const validTill = new Date();
        validTill.setHours(validTill.getHours() + 1);
        return validTill;
    };

    const handleGenerateTicket = () => {
        const newTicketNo = generateTicketNo();
        setTicketData({
            ...ticketData,
            ticketNo: newTicketNo
        });
    };

    const handlePrintTicket = () => {
        console.log('Print button clicked');
        console.log('Print style:', printStyle);
        console.log('Ticket data:', ticketData);
        
        // Get the ticket content
        const ticketElement = document.getElementById('boarding-pass-ticket');
        
        // Add error checking
        if (!ticketElement) {
            console.error('Ticket element not found');
            alert('Unable to get ticket content. Please generate a ticket first.');
            return;
        }

        console.log('Ticket element found:', ticketElement);

        // Clone the element to avoid modifying the original
        const ticketClone = ticketElement.cloneNode(true);
        
        console.log('Creating print window...');
        
        // Create print window
        const printWindow = window.open('', '_blank', 'width=800,height=600');
        
        if (!printWindow) {
            console.error('Print window blocked');
            alert('Pop-up blocked. Please allow pop-ups for this site.');
            return;
        }
        
        console.log('Print window created successfully');
        
        const selectedStyles = printStyle === 'horizontal' ? getHorizontalStyles() : getVerticalStyles();
        
        const printHTML = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Boarding Pass - ${ticketData.ticketNo}</title>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <style>
                    * {
                        margin: 0;
                        padding: 0;
                        box-sizing: border-box;
                    }
                    ${selectedStyles}
                </style>
            </head>
            <body>
                <div class="print-container">
                    ${ticketClone.outerHTML}
                </div>
                <script>
                    console.log('Print window loaded');
                    
                    function printTicket() {
                        console.log('Attempting to print...');
                        try {
                            window.print();
                            console.log('Print dialog opened');
                        } catch (e) {
                            console.error('Print failed:', e);
                            alert('Print failed: ' + e.message);
                        }
                    }
                    
                    // Print immediately when loaded
                    window.onload = function() {
                        console.log('Window loaded, starting print timer...');
                        setTimeout(function() {
                            printTicket();
                        }, 1000);
                    };
                    
                    // Close window after printing
                    window.onafterprint = function() {
                        console.log('Print completed, closing window...');
                        setTimeout(function() {
                            window.close();
                        }, 1000);
                    };
                    
                  
                </script>
            </body>
            </html>
        `;
        
        try {
            console.log('Writing HTML to print window...');
            printWindow.document.write(printHTML);
            printWindow.document.close();
            printWindow.focus();
            console.log('Print window setup complete');
        } catch (error) {
            console.error('Print error:', error);
            alert('Unable to print. Please try again. Error: ' + error.message);
            printWindow.close();
        }
    };

    // Helper function for vertical styles
    const getVerticalStyles = () => `
        .print-container {
            width: 82mm;
            height: 187.3mm;
            margin: 0;
            font-family: Arial, sans-serif;
        }
        
        .boarding-pass {
            width: 82mm;
            height: 187.3mm;
            background: white;
            border: none;
            border-radius: 8px;
            color: #333;
            overflow: hidden;
            font-size: 10px;
            line-height: 1.1;
            display: flex;
            flex-direction: column;
        }
        
        .company-header {
            background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
            color: white;
            text-align: center;
            padding: 6px;
            font-weight: bold;
            font-size: 14px;
            letter-spacing: 1px;
        }
        
        .ticket-main {
            padding: 8px;
            flex-grow: 1;
            display: flex;
            flex-direction: column;
        }
        
        .ticket-header {
            text-align: center;
            margin-bottom: 8px;
            border-bottom: 1px dashed #ccc;
            padding-bottom: 6px;
        }
        
        .ticket-title {
            font-size: 16px;
            font-weight: bold;
            margin-bottom: 2px;
            color: #1e3c72;
        }
        
        .ticket-subtitle {
            font-size: 10px;
            color: #666;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        
        .ticket-details {
            margin: 0;
            flex-grow: 1;
        }
        
        .detail-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 0;
            border-bottom: 1px dotted #ddd;
            padding-bottom: 2px;
        }
        
        .detail-label {
            font-size: 12px;
            color: #666;
            text-transform: uppercase;
            font-weight: bold;
        }
        
        .detail-value {
            font-size: 12px;
            font-weight: bold;
            color: #333;
        }
        
        .codes-section {
            text-align: center;
            margin: 8px 0;
            border-top: 1px dashed #ccc;
            padding-top: 6px;
        }
        
        .barcode-section, .qr-section {
            margin-bottom: 6px;
        }
        
        .qr-code {
            display: inline-block;
            border: 1px solid #ddd;
            padding: 3px;
            border-radius: 4px;
        }
        
        .code-label {
            font-size: 8px;
            color: #666;
            margin-top: 3px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        .tearoff-section {
            border-top: 2px dashed #333;
            margin-top: 8px;
            padding-top: 6px;
            text-align: center;
            font-size: 8px;
            color: #666;
            background: #f9f9f9;
        }
        
        .tearoff-text {
            margin-bottom: 3px;
            font-weight: bold;
            text-transform: uppercase;
        }
        
        .stub-details {
            display: flex;
            justify-content: space-between;
            margin-bottom: 2px;
        }
        
        .ticket-footer {
            text-align: center;
            font-size: 7px;
            color: #666;
            margin-top: 6px;
            line-height: 1.1;
        }
        
        @media print {
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            body { 
                margin: 0; 
                padding: 0;
            }
            .print-container {
                width: 82mm;
                height: 187.3mm;
                margin: 0;
                padding: 0;
            }
            .boarding-pass { 
                border: none;
                margin: 0;
                padding: 0;
            }
            @page {
                size: 82mm 187.3mm;
                margin: 0;
                padding: 0;
            }
        }
    `;

    // Helper function for horizontal styles
    const getHorizontalStyles = () => `
        .print-container {
            width: 203.2mm;
            height: 58mm;
            margin: 0;
            font-family: Arial, sans-serif;
        }
        
        .boarding-pass {
            width: 203.2mm;
            height: 64mm;
            background: white;
            border: none;
            border-radius: 6px;
            color: #333;
            overflow: hidden;
            display: flex;
            font-size: 10px;
            line-height: 1.1;
            position: relative;
        }
        
        .boarding-pass::before {
            content: '';
            position: absolute;
            width: 14px;
            height: 14px;
            background: white;
            border: none;
            border-radius: 50%;
            top: 25%;
            left: 135mm;
            transform: translateY(-50%);
            z-index: 2;
        }
        
        .boarding-pass::after {
            content: '';
            position: absolute;
            width: 14px;
            height: 14px;
            background: white;
            border: none;
            border-radius: 50%;
            bottom: 25%;
            left: 135mm;
            transform: translateY(50%);
            z-index: 2;
        }
        
        .ticket-left {
            width: 135mm;
            padding: 8px;
            border-right: 2px dashed #333;
            display: flex;
            flex-direction: column;
        }
        
        .ticket-right {
            width: 68.2mm;
            padding: 8px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            text-align: center;
        }
        
        .company-header {
            background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
            color: white;
            text-align: center;
            padding: 6px;
            margin: -8px -8px 6px -8px;
            font-weight: bold;
            font-size: 12px;
            letter-spacing: 1px;
        }
        
        .ticket-header {
            text-align: center;
            margin-bottom: 6px;
            border-bottom: 1px solid #ddd;
            padding-bottom: 4px;
        }
        
        .ticket-title {
            font-size: 14px;
            font-weight: bold;
            margin-bottom: 2px;
            color: #1e3c72;
        }
        
        .ticket-subtitle {
            font-size: 8px;
            color: #666;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        .ticket-details {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 0;
            margin: 0;
            flex-grow: 1;
        }
        
        .detail-row {
            display: flex;
            flex-direction: column;
            border-bottom: 1px dotted #ddd;
            padding-bottom: 3px;
            margin-bottom: 0;
        }
        
        .detail-label {
            font-size: 12px;
            color: #666;
            text-transform: uppercase;
            font-weight: bold;
            letter-spacing: 0.3px;
            margin-bottom: 1px;
        }
        
        .detail-value {
            font-size: 12px;
            font-weight: bold;
            color: #333;
        }
        
        .codes-section {
            text-align: center;
        }
        
        .barcode-section {
            margin-bottom: 6px;
        }
        
        .qr-section {
            margin-bottom: 4px;
        }
        
        .qr-code {
            display: inline-block;
            border: 1px solid #ddd;
            padding: 3px;
            border-radius: 3px;
            background: white;
        }
        
        .code-label {
            font-size: 6px;
            color: #666;
            margin-top: 2px;
            text-transform: uppercase;
            letter-spacing: 0.3px;
            font-weight: bold;
        }
        
        .tearoff-section {
            border-top: 2px dashed #333;
            margin-top: 6px;
            padding-top: 4px;
            text-align: center;
            font-size: 6px;
            color: #666;
            background: #f9f9f9;
            margin-left: -8px;
            margin-right: -8px;
            padding-left: 8px;
            padding-right: 8px;
        }
        
        .tearoff-text {
            margin-bottom: 3px;
            font-weight: bold;
            text-transform: uppercase;
            color: #333;
            letter-spacing: 0.5px;
        }
        
        .stub-details {
            display: flex;
            justify-content: space-between;
            margin-bottom: 2px;
            font-size: 6px;
        }
        
        .ticket-footer {
            text-align: center;
            font-size: 5px;
            color: #666;
            margin-top: 4px;
            line-height: 1.0;
            padding-top: 4px;
            border-top: 1px solid #eee;
        }
        
        @media print {
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            body { 
                margin: 0; 
                padding: 0;
            }
            .print-container {
                width: 203.2mm;
                height: 64mm;
                margin: 0;
                padding: 0;
            }
            .boarding-pass { 
                border: none;
                margin: 0;
                padding: 0;
            }
            @page {
                size: 203.2mm 64mm;
                margin: 0;
                padding: 0;
            }
        }
    `;

    const qrData = JSON.stringify({
        ticketNo: ticketData.ticketNo,
        type: ticketData.customerType,
        category: ticketData.customerCategory,
        mode: ticketData.mode,
        issueTime: getCurrentDateTime().toISOString(),
        validTill: getValidTill().toISOString()
    });

    return (
        <div className="boarding-pass-page">
            <div className="page-header">
                <h1 className="page-title">🎫 Boarding Pass Generator</h1>
                <p className="page-subtitle">Generate and print boarding pass tickets</p>
            </div>

            <div className="controls-section">
                <div className="control-group">
                    <label className="control-label">Customer Type</label>
                    <div className="radio-group">
                        <label className="radio-item">
                            <input
                                type="radio"
                                name="customerType"
                                value="Regular"
                                checked={ticketData.customerType === 'Regular'}
                                onChange={(e) => setTicketData({...ticketData, customerType: e.target.value})}
                            />
                            <span className="radio-text">Regular</span>
                        </label>
                        <label className="radio-item">
                            <input
                                type="radio"
                                name="customerType"
                                value="VIP"
                                checked={ticketData.customerType === 'VIP'}
                                onChange={(e) => setTicketData({...ticketData, customerType: e.target.value})}
                            />
                            <span className="radio-text">VIP</span>
                        </label>
                    </div>
                </div>

                <div className="control-group">
                    <label className="control-label">Customer Category</label>
                    <div className="radio-group">
                        <label className="radio-item">
                            <input
                                type="radio"
                                name="customerCategory"
                                value="Adult"
                                checked={ticketData.customerCategory === 'Adult'}
                                onChange={(e) => setTicketData({...ticketData, customerCategory: e.target.value})}
                            />
                            <span className="radio-text">Adult</span>
                        </label>
                        <label className="radio-item">
                            <input
                                type="radio"
                                name="customerCategory"
                                value="Kid"
                                checked={ticketData.customerCategory === 'Kid'}
                                onChange={(e) => setTicketData({...ticketData, customerCategory: e.target.value})}
                            />
                            <span className="radio-text">Kid</span>
                        </label>
                    </div>
                </div>

                <div className="control-group">
                    <label className="control-label">Payment Mode</label>
                    <div className="radio-group">
                        <label className="radio-item">
                            <input
                                type="radio"
                                name="mode"
                                value="Cash"
                                checked={ticketData.mode === 'Cash'}
                                onChange={(e) => setTicketData({...ticketData, mode: e.target.value})}
                            />
                            <span className="radio-text">Cash</span>
                        </label>
                        <label className="radio-item">
                            <input
                                type="radio"
                                name="mode"
                                value="QR"
                                checked={ticketData.mode === 'QR'}
                                onChange={(e) => setTicketData({...ticketData, mode: e.target.value})}
                            />
                            <span className="radio-text">QR</span>
                        </label>
                        <label className="radio-item">
                            <input
                                type="radio"
                                name="mode"
                                value="Card"
                                checked={ticketData.mode === 'Card'}
                                onChange={(e) => setTicketData({...ticketData, mode: e.target.value})}
                            />
                            <span className="radio-text">Card</span>
                        </label>
                    </div>
                </div>

                <div className="control-group">
                    <label className="control-label">Print Layout Style</label>
                    <div className="radio-group">
                        <label className="radio-item">
                            <input
                                type="radio"
                                name="printStyle"
                                value="vertical"
                                checked={printStyle === 'vertical'}
                                onChange={(e) => setPrintStyle(e.target.value)}
                            />
                            <span className="radio-text">Vertical (82mm x 187.3mm)</span>
                        </label>
                        <label className="radio-item">
                            <input
                                type="radio"
                                name="printStyle"
                                value="horizontal"
                                checked={printStyle === 'horizontal'}
                                onChange={(e) => setPrintStyle(e.target.value)}
                            />
                            <span className="radio-text">Horizontal (203.2mm x 64mm)</span>
                        </label>
                    </div>
                </div>
            </div>

            <div className="action-buttons">
                <button 
                    className="material-btn generate-btn"
                    onClick={handleGenerateTicket}
                >
                    <span className="btn-icon">🎫</span>
                    Generate Ticket
                </button>
                
                {ticketData.ticketNo && (
                    <>
                        <button 
                            className="material-btn print-btn"
                            onClick={handlePrintTicket}
                        >
                            <span className="btn-icon">🖨️</span>
                            Print Ticket
                        </button>
                        
                        <button 
                            className="material-btn manual-print-btn"
                            onClick={() => window.print()}
                        >
                            <span className="btn-icon">📄</span>
                            Manual Print
                        </button>
                    </>
                )}
            </div>

            {ticketData.ticketNo && (
                <div className="ticket-preview">
                    <div id="boarding-pass-ticket" className={`boarding-pass ${printStyle === 'horizontal' ? 'horizontal-layout' : 'vertical-layout'}`}>
                        {printStyle === 'horizontal' ? (
                            <>
                                {/* Horizontal Layout */}
                                <div className="ticket-left">
                                    <div className="company-header">
                                        THE VIEW PATTAYA
                                    </div>
                                    
                                    <div className="ticket-header">
                                        <div className="ticket-title">BOARDING PASS</div>
                                        <div className="ticket-subtitle">Entry Ticket</div>
                                    </div>
                                    
                                    <div className="ticket-details">
                                        <div className="detail-row">
                                            <span className="detail-label">Ticket No.</span>
                                            <span className="detail-value">{ticketData.ticketNo}</span>
                                        </div>
                                        <div className="detail-row">
                                            <span className="detail-label">Date & Time</span>
                                            <span className="detail-value">
                                                {format(getCurrentDateTime(), 'dd/MM/yy HH:mm')}
                                            </span>
                                        </div>
                                        <div className="detail-row">
                                            <span className="detail-label">Valid Till</span>
                                            <span className="detail-value">
                                                {format(getValidTill(), 'dd/MM/yy HH:mm')}
                                            </span>
                                        </div>
                                        <div className="detail-row">
                                            <span className="detail-label">Customer Type</span>
                                            <span className="detail-value">{ticketData.customerType}</span>
                                        </div>
                                        <div className="detail-row">
                                            <span className="detail-label">Category</span>
                                            <span className="detail-value">{ticketData.customerCategory}</span>
                                        </div>
                                        <div className="detail-row">
                                            <span className="detail-label">Payment Mode</span>
                                            <span className="detail-value">{ticketData.mode}</span>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="ticket-right">
                                    <div className="codes-section">
                                        <div className="barcode-section">
                                            <Barcode 
                                                value={ticketData.ticketNo}
                                                format="CODE128"
                                                width={1.5}
                                                height={40}
                                                displayValue={false}
                                                fontSize={10}
                                                margin={0}
                                            />
                                            <div className="code-label">Barcode</div>
                                        </div>
                                        
                                        <div className="qr-section">
                                            <div className="qr-code">
                                                <QRCodeSVG 
                                                    value={qrData}
                                                    size={80}
                                                    level="M"
                                                />
                                            </div>
                                            <div className="code-label">QR Code</div>
                                        </div>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <>
                                {/* Vertical Layout */}
                                <div className="company-header">
                                    THE VIEW PATTAYA
                                </div>
                                
                                <div className="ticket-main">
                                    <div className="ticket-header">
                                        <div className="ticket-title">BOARDING PASS</div>
                                        <div className="ticket-subtitle">Entry Ticket</div>
                                    </div>
                                    
                                    <div className="ticket-details">
                                        <div className="detail-row">
                                            <span className="detail-label">Ticket No.</span>
                                            <span className="detail-value">{ticketData.ticketNo}</span>
                                        </div>
                                        
                                        <div className="detail-row">
                                            <span className="detail-label">Date & Time</span>
                                            <span className="detail-value">
                                                {format(getCurrentDateTime(), 'dd/MM/yy HH:mm')}
                                            </span>
                                        </div>
                                        
                                        <div className="detail-row">
                                            <span className="detail-label">Valid Till</span>
                                            <span className="detail-value">
                                                {format(getValidTill(), 'dd/MM/yy HH:mm')}
                                            </span>
                                        </div>
                                        
                                        <div className="detail-row">
                                            <span className="detail-label">Customer Type</span>
                                            <span className="detail-value">{ticketData.customerType}</span>
                                        </div>
                                        
                                        <div className="detail-row">
                                            <span className="detail-label">Category</span>
                                            <span className="detail-value">{ticketData.customerCategory}</span>
                                        </div>
                                        
                                        <div className="detail-row">
                                            <span className="detail-label">Payment Mode</span>
                                            <span className="detail-value">{ticketData.mode}</span>
                                        </div>
                                    </div>
                                    
                                    <div className="codes-section">
                                        <div className="barcode-section">
                                            <Barcode 
                                                value={ticketData.ticketNo}
                                                format="CODE128"
                                                width={1}
                                                height={30}
                                                displayValue={false}
                                                fontSize={8}
                                                margin={0}
                                            />
                                            <div className="code-label">Barcode</div>
                                        </div>
                                        
                                        <div className="qr-section">
                                            <div className="qr-code">
                                                <QRCodeSVG 
                                                    value={qrData}
                                                    size={40}
                                                    level="M"
                                                />
                                            </div>
                                            <div className="code-label">QR Code</div>
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default BoardingPass;
