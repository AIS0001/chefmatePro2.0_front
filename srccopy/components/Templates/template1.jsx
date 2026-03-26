import React, { useRef } from "react";

export default function InvoiceTableModal({
  show,
  onClose,
  data = [],
  companyDetails = {},
  customerDetails = {},
}) {
  const printRef = useRef();

  if (!show) return null;

  // Calculate totals
  const totalAmount = data.reduce((sum, row) => sum + parseFloat(row.amount || 0), 0);
  const totalDiscount = data.reduce(
    (sum, row) =>
      sum + ((parseFloat(row.amount || 0) * parseFloat(row.discountPercent || 0)) / 100),
    0
  );
  const netPayable = totalAmount - totalDiscount;

  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="modal-backdrop fade show"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          height: "100vh",
          width: "100vw",
          backgroundColor: "rgba(0,0,0,0.5)",
          zIndex: 1040,
        }}
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="modal show d-block"
        tabIndex={-1}
        role="dialog"
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          zIndex: 1050,
          maxWidth: "90vw",
          maxHeight: "90vh",
          overflowY: "auto",
          backgroundColor: "white",
          borderRadius: "0.3rem",
          boxShadow: "0 3px 9px rgba(0,0,0,0.5)",
        }}
      >
        <div className="modal-header">
          <h5 className="modal-title">Invoice Details</h5>
          <button
            type="button"
            className="btn-close"
            aria-label="Close"
            onClick={onClose}
            style={{
              position: "absolute",
              top: "10px",
              right: "15px",
              zIndex: 9999,
              cursor: "pointer",
            }}
          />
        </div>

        <div className="modal-body p-4" ref={printRef}>
          {/* Everything inside here will print */}
          <div className="invoice-table-wrapper">
            {/* Company and customer info */}
            <div className="row mb-4">
              <div className="col-md-6">
                <div className="company-details text-primary">
                  <h4 className="fw-bold">{companyDetails.name}</h4>
                  <p className="mb-1">{companyDetails.address}</p>
                  <p className="mb-1">📞 {companyDetails.phone}</p>
                  <p className="mb-1">📧 {companyDetails.email}</p>
                </div>
              </div>
              <div className="col-md-6 text-end">
                <div className="customer-details text-dark">
                  <h5 className="fw-bold">Bill To</h5>
                  <p className="mb-1">{customerDetails.name}</p>
                  <p className="mb-1">{customerDetails.address}</p>
                  <p className="mb-1">📞 {customerDetails.phone}</p>
                  <p className="mb-1">📧 {customerDetails.email}</p>
                </div>
              </div>
            </div>

            {/* Table */}
            <table className="invoice-table table table-striped table-bordered table-hover">
              <thead className="table-primary text-center">
                <tr>
                  <th>#</th>
                  <th>Item</th>
                  <th>Description</th>
                  <th>Rate</th>
                  <th>Qty</th>
                  <th>Amount</th>
                  <th>Disc%</th>
                  <th>Net</th>
                </tr>
              </thead>
              <tbody>
                {data.map((row, index) => (
                  <tr key={index} className="align-middle text-center">
                    <td>{index + 1}</td>
                    <td className="text-start">{row.itemName}</td>
                    <td className="text-start">{row.description}</td>
                    <td>₹ {parseFloat(row.rate).toFixed(2)}</td>
                    <td>{row.quantity}</td>
                    <td>₹ {parseFloat(row.amount).toFixed(2)}</td>
                    <td>{row.discountPercent}%</td>
                    <td>₹ {parseFloat(row.netAmount).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Summary */}
            <div className="mt-4">
              <h5 className="fw-bold text-end">Summary</h5>
              <table className="table table-bordered w-50 ms-auto">
                <tbody>
                  <tr>
                    <th>Total Amount</th>
                    <td className="text-end">₹ {totalAmount.toFixed(2)}</td>
                  </tr>
                  <tr>
                    <th>Total Discount</th>
                    <td className="text-end">₹ {totalDiscount.toFixed(2)}</td>
                  </tr>
                  <tr className="table-success">
                    <th>Net Payable</th>
                    <td className="text-end fw-bold">₹ {netPayable.toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-primary" onClick={handlePrint}>
            🖨️ Print
          </button>
        </div>
      </div>
    </>
  );
}
