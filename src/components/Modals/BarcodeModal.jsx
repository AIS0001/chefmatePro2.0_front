import React, { useRef, useState } from "react";
import { Modal, Button, Row, Col, Card } from "react-bootstrap";
import JsBarcode from "jsbarcode";
import "./BarcodeModal.css";

// Custom styles for better modal centering
const modalStyles = {
  modal: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalDialog: {
    margin: '1rem',
    maxWidth: '95vw',
    width: '100%',
  },
  modalContent: {
    borderRadius: '10px',
    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
  }
};

const BarcodeModal = ({ isOpen, onClose, items }) => {
  const printRef = useRef();
  const [barcodeCache, setBarcodeCache] = useState({});

  // Generate barcode for each item with caching
  const generateBarcode = (itemId) => {
    // Check cache first
    if (barcodeCache[itemId]) {
      return barcodeCache[itemId];
    }
    
    const canvas = document.createElement("canvas");
    try {
      // Ensure itemId is valid
      if (!itemId || itemId === null || itemId === undefined) {
        console.error("Invalid item ID:", itemId);
        return null;
      }
      
      // Set canvas size explicitly
      canvas.width = 400;
      canvas.height = 100;
      
      JsBarcode(canvas, itemId.toString(), {
        format: "CODE128",
        width: 3, // Optimized width for both preview and print
        height: 60, // Balanced height for visibility
        displayValue: true,
        fontSize: 12, // Readable font size
        textMargin: 2, // Small margin for text
        background: "#ffffff",
        lineColor: "#000000",
        margin: 2, // Small margin for proper rendering
      });
      
      const dataURL = canvas.toDataURL();
      console.log("Generated barcode for item ID:", itemId, "Data URL length:", dataURL.length);
      
      // Cache the result
      setBarcodeCache(prev => ({ ...prev, [itemId]: dataURL }));
      
      return dataURL;
    } catch (error) {
      console.error("Error generating barcode for item ID:", itemId, error);
      return null;
    }
  };

  const handlePrint = () => {
    const printContent = document.createElement('div');
    
    // Create thermal labels for printing
    items.forEach(item => {
      const thermalLabel = document.createElement('div');
      thermalLabel.className = 'thermal-label';
      
      const itemName = document.createElement('div');
      itemName.className = 'item-name';
      itemName.textContent = item.iname;
      
      const barcodeContainer = document.createElement('div');
      barcodeContainer.className = 'barcode-container';
      
      const barcodeImg = document.createElement('img');
      barcodeImg.src = generateBarcode(item.id);
      barcodeImg.className = 'barcode-image';
      barcodeImg.alt = `Barcode for ${item.iname}`;
      
      const itemDetails = document.createElement('div');
      itemDetails.className = 'item-details';
      
      const itemPrice = document.createElement('div');
      itemPrice.className = 'item-price';
      itemPrice.textContent = `₹${item.offerprice || item.mrp}`;
      
      const itemUnit = document.createElement('div');
      itemUnit.className = 'item-unit';
      itemUnit.textContent = item.unit;
      
      barcodeContainer.appendChild(barcodeImg);
      itemDetails.appendChild(itemPrice);
      itemDetails.appendChild(itemUnit);
      
      thermalLabel.appendChild(itemName);
      thermalLabel.appendChild(barcodeContainer);
      thermalLabel.appendChild(itemDetails);
      
      printContent.appendChild(thermalLabel);
    });
    
    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <html>
        <head>
          <title>Thermal Printer Barcodes - 50mm x 25mm</title>
          <style>
            @page {
              size: 50mm 25mm;
              margin: 0;
            }
            body { 
              font-family: Arial, sans-serif; 
              margin: 0; 
              padding: 0;
              background: white;
            }
            .thermal-label { 
              width: 50mm;
              height: 25mm;
              padding: 0.5mm;
              margin: 0;
              border: 1px solid #000;
              display: block;
              page-break-after: always;
              text-align: center;
              background: white;
              box-sizing: border-box;
              position: relative;
            }
            .thermal-label:last-child {
              page-break-after: avoid;
            }
            .item-name { 
              font-size: 8px; 
              font-weight: bold; 
              margin: 0 0 0.5mm 0;
              height: 6mm;
              overflow: hidden;
              line-height: 1.0;
              display: flex;
              align-items: center;
              justify-content: center;
            }
            .barcode-container { 
              height: 16mm;
              display: flex;
              align-items: center;
              justify-content: center;
              margin: 0.5mm 0;
            }
            .barcode-image { 
              max-width: 49mm;
              max-height: 14mm;
              object-fit: contain;
            }
            .item-details { 
              font-size: 6px; 
              margin: 0;
              height: 2.5mm;
              display: flex;
              flex-direction: row;
              justify-content: space-between;
              align-items: center;
              line-height: 1.0;
              padding: 0 1mm;
            }
            .item-price { 
              font-size: 7px; 
              font-weight: bold; 
              color: #000;
              margin: 0;
            }
            .item-unit { 
              font-size: 6px; 
              margin: 0;
            }
            @media print {
              body { 
                margin: 0; 
                padding: 0;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
              .thermal-label { 
                border: 1px solid #000;
                page-break-inside: avoid;
                display: block;
                width: 50mm;
                height: 25mm;
                margin: 0;
                padding: 0.5mm;
              }
              @page {
                size: 50mm 25mm;
                margin: 0;
              }
            }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  };

  return (
    <Modal 
      show={isOpen} 
      onHide={onClose} 
      size="xl" 
      centered 
      backdrop="static"
      dialogClassName="barcode-modal"
      style={{ ...modalStyles.modal, zIndex: 1060 }}
    >
      <Modal.Header closeButton className="bg-primary text-white">
        <Modal.Title className="w-100 text-center">
          Thermal Printer Barcodes Preview (50mm x 25mm) - Print Ready
        </Modal.Title>
      </Modal.Header>
      <Modal.Body style={{ maxHeight: "75vh", overflowY: "auto", padding: "20px", backgroundColor: "#f8f9fa" }}>
        <div className="thermal-printer-info">
          <div className="paper-size">50mm × 25mm</div>
          <div>Thermal Printer Label Size - Large High-Quality Barcode</div>
          <div style={{ fontSize: '11px', color: '#666', marginTop: '5px' }}>
            Items loaded: {items ? items.length : 0}
          </div>
        </div>
        <div ref={printRef} style={{ display: "flex", flexWrap: "wrap", gap: "10px", justifyContent: "center" }}>
          {items && items.length > 0 ? (
            items.map((item) => {
              console.log("Processing item:", item); // Debug log
              console.log("Item price data:", { offerprice: item.offerprice, mrp: item.mrp, unit: item.unit }); // Debug price data
              return (
              <div key={item.id}>
                {/* Preview version */}
                <div className="thermal-label-preview">
                  <div className="item-name-preview">
                    {item.iname}
                  </div>
                  <div className="barcode-container-preview">
                    {generateBarcode(item.id) ? (
                      <img
                        src={generateBarcode(item.id)}
                        alt={`Barcode for ${item.iname}`}
                        className="barcode-image-preview"
                        onError={(e) => {
                          console.error("Barcode image failed to load:", e);
                          e.target.style.display = 'none';
                        }}
                        onLoad={() => {
                          console.log("Barcode loaded successfully for item:", item.id);
                        }}
                      />
                    ) : (
                      <div style={{ 
                        color: '#666', 
                        fontSize: '12px', 
                        textAlign: 'center',
                        padding: '10px'
                      }}>
                        Unable to generate barcode for ID: {item.id}
                      </div>
                    )}
                  </div>
                  <div className="item-details-preview">
                    <div className="item-price-preview">
                      ₹{item.offerprice || item.mrp || 'N/A'}
                    </div>
                    <div className="item-unit-preview">
                      {item.unit || 'Unit'}
                    </div>
                  </div>
                </div>
                
                {/* Print version (hidden in preview) */}
                <div className="thermal-label" style={{ display: 'none' }}>
                  <div className="item-name">
                    {item.iname}
                  </div>
                  <div className="barcode-container">
                    {generateBarcode(item.id) ? (
                      <img
                        src={generateBarcode(item.id)}
                        alt={`Barcode for ${item.iname}`}
                        className="barcode-image"
                      />
                    ) : (
                      <div style={{ fontSize: '8px', color: '#666' }}>
                        Barcode Error: ID {item.id}
                      </div>
                    )}
                  </div>
                  <div className="item-details">
                    <div className="item-price">₹{item.offerprice || item.mrp}</div>
                    <div className="item-unit">{item.unit}</div>
                  </div>
                </div>
              </div>
            );
            })
          ) : (
            <div className="text-center py-5">
              <i className="fas fa-exclamation-triangle fa-3x text-warning mb-3"></i>
              <p className="text-muted">No items available for barcode generation</p>
            </div>
          )}
        </div>
      </Modal.Body>
      <Modal.Footer className="d-flex justify-content-center bg-light">
        <Button variant="success" onClick={handlePrint} className="me-3">
          <i className="fas fa-print"></i> Print Thermal Labels
        </Button>
        <Button variant="secondary" onClick={onClose}>
          <i className="fas fa-times"></i> Close
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default BarcodeModal;
