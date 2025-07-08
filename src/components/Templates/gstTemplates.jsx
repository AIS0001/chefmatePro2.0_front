import React, { forwardRef } from "react";

// GST Invoice Template 1: Modern A4
export const GSTInvoiceA4 = forwardRef(function GSTInvoiceA4(
  { company, customer, items, summary, taxes, invoiceNo, invoiceDate, invoiceTime },
  ref
) {
  console.log('company:', company);
console.log('customer:', customer);
console.log('items:', items);
   if (!company || !customer || !items || items.length === 0) {
  return <div>Loading...</div>;
}

  return (
    <div ref={ref} style={{
      border: "2px solid #2c3e50",
      borderRadius: 12,
      padding: 24,
      background: "#fff",
      maxWidth: 900,
      margin: "0 auto",
      fontFamily: "Cambria, monospace",
      fontSize: 16
    }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "stretch", marginBottom: 0 }}>
        <div style={{ width: "48%", textAlign: "left" }}>
          <h2 style={{ marginBottom: 6, color: "#2c3e50" }}>{company.name}</h2>
          <p style={{ margin: 0 }}>{company.address}</p>
          <p style={{ margin: 0 }}>Phone: {company.phone}</p>
          <p style={{ margin: 0 }}>Email: {company.email}</p>
          {company.tax_id && <p style={{ margin: 0 }}>Tax: {company.tax_id}</p>}
        </div>
        <div style={{ borderLeft: "2px solid #2c3e50", minHeight: 120, margin: "0 18px" }}></div>
        <div style={{ width: "48%", textAlign: "right" }}>
          <h3 style={{ marginBottom: 6, color: "#2d7a46" }}>Customer Details</h3>
          <p style={{ margin: 0 }}><b>Name:</b> {customer.name}</p>
          <p style={{ margin: 0 }}><b>Phone:</b> {customer.phone}</p>
          <p style={{ margin: 0 }}><b>Email:</b> {customer.email}</p>
          <p style={{ margin: 0 }}><b>Address:</b> {customer.address}</p>
          {customer.gst && <p style={{ margin: 0 }}><b>GST:</b> {customer.gst}</p>}
        </div>
      </div>
      {/* Invoice Info */}
      <div style={{ margin: "18px 0 10px 0" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <tbody>
            <tr>
              <td><b>Inv No.</b> {invoiceNo}</td>
              <td><b>Date:</b> {invoiceDate}</td>
              <td><b>Time:</b> {invoiceTime}</td>
            </tr>
          </tbody>
        </table>
      </div>
      {/* Item Details */}
      <div style={{ border: "2px solid #2c3e50", borderRadius: 10, padding: 12, minHeight: 260, marginBottom: 18, background: "#fff" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", background: "#fff", borderRadius: 8, overflow: "hidden" }}>
          <thead>
            <tr style={{ background: "#e9ecef", color: "#34495e" }}>
              <th style={{ padding: "10px 12px", borderBottom: "2px solid #bfc9d1" }}>Item Name</th>
              <th style={{ padding: "10px 12px", borderBottom: "2px solid #bfc9d1" }}>Qty</th>
              <th style={{ padding: "10px 12px", borderBottom: "2px solid #bfc9d1" }}>Rate</th>
              <th style={{ padding: "10px 12px", borderBottom: "2px solid #bfc9d1" }}>GST%</th>
              <th style={{ padding: "10px 12px", borderBottom: "2px solid #bfc9d1" }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => (
              <tr key={idx} style={{ borderBottom: "1.5px solid #e0e0e0" }}>
                <td style={{ padding: "10px 12px" }}>{item.item_name}</td>
                <td style={{ padding: "10px 12px" }}>{item.quantity}</td>
                <td style={{ padding: "10px 12px" }}>฿ {item.rate}</td>
                <td style={{ padding: "10px 12px" }}>{parseFloat(item.cgst) + parseFloat(item.sgst) + parseFloat(item.igst)}%</td>
                <td style={{ padding: "10px 12px" }}>฿ {item.total_price}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Tax Bifurcation */}
      <div style={{ margin: "18px 0 10px 0" }}>
        <table style={{ maxWidth: 600, marginLeft: "auto", width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={{ textAlign: "center" }}>CGST (%)</th>
              <th style={{ textAlign: "center" }}>SGST (%)</th>
              <th style={{ textAlign: "center" }}>IGST (%)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ textAlign: "center" }}>{taxes.cgstPercent}%</td>
              <td style={{ textAlign: "center" }}>{taxes.sgstPercent}%</td>
              <td style={{ textAlign: "center" }}>{taxes.igstPercent}%</td>
            </tr>
            <tr>
              <td style={{ textAlign: "center" }}>฿ {taxes.cgstTotal}</td>
              <td style={{ textAlign: "center" }}>฿ {taxes.sgstTotal}</td>
              <td style={{ textAlign: "center" }}>฿ {taxes.igstTotal}</td>
            </tr>
          </tbody>
        </table>
      </div>
      {/* Summary */}
      <div style={{ width: "50%", marginLeft: "auto", marginRight: 0, background: "#f6f6f6", border: "2px solid #2c3e50", borderRadius: 8, padding: 0 }}>
        <table style={{ width: "100%", borderCollapse: "collapse", background: "#f6f6f6" }}>
          <tbody>
            <tr>
              <td style={{ fontWeight: "bold", padding: "8px 12px", border: "2px solid #2c3e50" }}>Subtotal</td>
              <td style={{ textAlign: "right", padding: "8px 12px", border: "2px solid #2c3e50" }}>฿ {summary.subtotal}</td>
            </tr>
            <tr>
              <td style={{ fontWeight: "bold", padding: "8px 12px", border: "2px solid #2c3e50" }}>Discount</td>
              <td style={{ textAlign: "right", padding: "8px 12px", border: "2px solid #2c3e50" }}>฿ {summary.discount}</td>
            </tr>
            <tr>
              <td style={{ fontWeight: "bold", padding: "8px 12px", border: "2px solid #2c3e50" }}>After Discount</td>
              <td style={{ textAlign: "right", padding: "8px 12px", border: "2px solid #2c3e50" }}>฿ {summary.subtotalAfterDiscount}</td>
            </tr>
            <tr>
              <td style={{ fontWeight: "bold", padding: "8px 12px", border: "2px solid #2c3e50" }}>Round Off</td>
              <td style={{ textAlign: "right", padding: "8px 12px", border: "2px solid #2c3e50" }}>฿ {summary.roundoff}</td>
            </tr>
            <tr style={{ background: "#e9ecef" }}>
              <td style={{ fontWeight: "bold", padding: "8px 12px", border: "2px solid #2c3e50" }}>Total Amount</td>
              <td style={{ textAlign: "right", padding: "8px 12px", border: "2px solid #2c3e50" }}><b>฿ {summary.grandTotal}</b></td>
            </tr>
          </tbody>
        </table>
      </div>
      {/* Footer */}
      <div style={{ marginTop: 30, textAlign: "center", fontSize: 15, color: "#888" }}>
        <p>Powered by {company.developer || "Chefmate"}</p>
      </div>
    </div>
  );
});

// PrintPreview component for modal/print area usage
export function GSTInvoicePrintPreview({
  open, onClose, ...props
}) {
  const printRef = React.useRef();

  const handlePrint = () => {
    const printContents = printRef.current.innerHTML;
    const win = window.open("", "_blank");
    win.document.write(`<html><head><title>Invoice</title></head><body>${printContents}</body></html>`);
    win.document.close();
    win.focus();
    win.print();
    win.close();
  };

  if (!open) return null;
  return (
    <div style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", background: "rgba(0,0,0,0.15)", zIndex: 9999, overflow: "auto" }}>
      <div style={{ maxWidth: 950, margin: "40px auto", background: "#fff", borderRadius: 12, boxShadow: "0 2px 16px #0002", padding: 24 }}>
        <div ref={printRef}>
          <GSTInvoiceA4 {...props} />
        </div>
        <div style={{ textAlign: "right", marginTop: 24 }}>
          <button onClick={handlePrint} style={{ marginRight: 12 }}>🖨️ Print</button>
          <button onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

export default GSTInvoiceA4;
