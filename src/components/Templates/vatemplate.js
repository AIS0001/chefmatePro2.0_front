import React, { forwardRef } from "react";
import moment from "moment";

// VAT Invoice Template: A4 Full Page with Narrow Margin and Enhancements
export const VATInvoiceA4 = forwardRef(function VATInvoiceA4(
  { company, customer, items, summary, taxes, invoiceNo, invoiceDate, invoiceTime, watermark = "PAID" },
  ref
) {
  let currencySymbol = "฿";
  if (company && company.currency) {
    if (company.currency === "INR") currencySymbol = "₹";
    else if (company.currency === "USD") currencySymbol = "$";
    else if (company.currency === "GBP") currencySymbol = "£";
    else if (company.currency === "THB") currencySymbol = "฿";
  }

  const invoiceDueDate = moment(invoiceDate).add(7, "days").format("YYYY-MM-DD");

  return (
    <div
      ref={ref}
      style={{
        width: "210mm",
        minHeight: "297mm",
        padding: "10mm 5mm 10mm 10mm", // top right bottom left
        boxSizing: "border-box",
        background: "#fff",
        fontFamily: "Cambria, monospace",
        fontSize: 15,
        position: "relative",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between"
      }}
    >
      {/* Watermark */}
      <div style={{
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        fontSize: 100,
        color: "#eee",
        zIndex: 0,
        pointerEvents: "none",
        userSelect: "none",
        whiteSpace: "nowrap",
        opacity: 0.3,
      }}>{watermark}</div>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10, position: "relative", zIndex: 1 }}>
        
        <div style={{ width: "48%" }}>
          <img src="../../dist/img/logo2.png" alt="Logo" style={{ maxWidth: "180px", marginBottom: 10 }} />
          <h2 style={{ color: "#2c3e50", marginBottom: 6 }}>{company.name}</h2>
          <p>{company.address}</p>
          <p>Phone: {company.phone}</p>
          <p>Email: {company.email}</p>
          {company.tax_id && <p>Tax ID: {company.tax_id}</p>}
           <div style={{ marginTop: 10 }}>
            <p><b>Invoice No:</b> {invoiceNo}</p>
            <p><b>Date:</b> {invoiceDate}</p>
          </div>
        </div>
         <div style={{ width: "48%",textAlign: "right" }}>
         
          <div>
            <h3 style={{ color: "#2d7a46", marginBottom: 6 }}>Invoice</h3>
            <h5 style={{ color: "#2d7a46", marginBottom: 6 }}>Customer Details</h5>
            <p><b>Name:</b> {customer.name}</p>
            <p><b>Phone:</b> {customer.phone}</p>
            <p><b>Email:</b> {customer.email}</p>
            <p><b>Address:</b> {customer.address}</p>
            {customer.vat && <p><b>VAT:</b> {customer.vat}</p>}
            <div style={{ marginTop: 10 }}>
           
            <p><b>Due Date:</b> {invoiceDueDate}</p>
          </div>
          </div>
        </div>
      </div>

      {/* Item Table with fixed height */}
      <div style={{ flexGrow: 1, marginBottom: 10, position: "relative", zIndex: 1, overflow: "hidden" }}>
        <div style={{ height: "130mm", overflow: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#2ecc71", color: "#fff" }}>
                <th style={{ padding: "10px 12px", textAlign: "left" }}>Item Name</th>
                <th style={{ padding: "10px 12px", textAlign: "right" }}>Qty</th>
                <th style={{ padding: "10px 12px", textAlign: "right" }}>Rate</th>
                <th style={{ padding: "10px 12px", textAlign: "right" }}>VAT%</th>
                <th style={{ padding: "10px 12px", textAlign: "right" }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => {
                const qty = parseFloat(item.quantity) || 1;
                const total = parseFloat(item.total_price) || 0;
                const vatPercent = 7;
                const rate = (total / qty) / (1 + vatPercent / 100);

                return (
                  <tr key={idx} style={{ background: idx % 2 === 0 ? "#f9f9f9" : "#ffffff" }}>
                    <td style={{ padding: "10px 12px" }}>{item.item_name}</td>
                    <td style={{ padding: "10px 12px", textAlign: "right" }}>{item.quantity}</td>
                    <td style={{ padding: "10px 12px", textAlign: "right" }}>{currencySymbol} {rate.toFixed(2)}</td>
                    <td style={{ padding: "10px 12px", textAlign: "right" }}>{vatPercent}%</td>
                    <td style={{ padding: "10px 12px", textAlign: "right" }}>{currencySymbol} {total.toFixed(2)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
<hr style={{ border: "none", borderTop: "1px solid #ccc", margin: "20px 0" }} />

      {/* Summary and Footer Combined */}
      <div style={{ marginTop: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          
          {/* Signature and QR aligned left */}
          <div style={{ width: "58%" }}>
            <p style={{ fontSize: 15, marginTop: 10 }}><b style={{ fontWeight: 800, marginTop: 10 }}>Payment Terms:</b><br/> Please make the payment within 7 days. Late payments may attract additional charges.</p>
            <p style={{ fontSize: 13 }}><b>Terms & Conditions:</b> Goods once sold will not be taken back. Ensure to keep the invoice for any service or claim.</p>
         
            <p style={{ fontWeight: 800, marginTop: 10,fontSize: 18 }}>Authorized Signature</p>
            <div style={{ height: 50, borderBottom: "1px dashed #333", width: "60%" }}></div>
            <div style={{ marginTop: 10 }}>
              <img src={`https://api.qrserver.com/v1/create-qr-code/?data=Invoice%20${invoiceNo}&size=80x80`} alt="QR Code" />
            </div>
            <p style={{ fontSize: 12, color: "#999", marginTop: 5 }}>Scan for payment details</p>
             </div>

          {/* Summary Box */}
         
          <div style={{ width: "40%", fontSize: 15, lineHeight: 1.8 }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Subtotal:</span>
              <span>{currencySymbol} {summary.subtotal}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Discount:</span>
              <span>{currencySymbol} {summary.discount}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>After Discount:</span>
              <span>{currencySymbol} {summary.subtotalAfterDiscount}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>VAT:</span>
              <span>{currencySymbol} {summary.payment}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Round Off:</span>
              <span>{currencySymbol} {summary.roundoff}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "bold", fontSize: 17, borderTop: "1px solid #ccc", borderBottom: "1px solid #ccc", marginTop: 8, paddingTop: 6 }}>
              <span>Total:</span>
              <span>{currencySymbol} {summary.grandTotal}</span>
            </div>
          </div>
        </div>
        <hr style={{ border: "none", borderTop: "1px solid #ccc",  }} />
        <p style={{  textAlign: "center", color: "#999" }}>Powered by {company.developer || "Chefmate POS-+66986643299/+66952477020"}</p>
      </div>
    </div>
  );
});




// PrintPreview component for modal/print area usage
export function VATInvoicePrintPreview({
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
          <VATInvoiceA4 {...props} />
        </div>
        <div style={{ textAlign: "right", marginTop: 24 }}>
          <button onClick={handlePrint} style={{ marginRight: 12 }}>🖨️ Print</button>
          <button onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

export default VATInvoiceA4;
