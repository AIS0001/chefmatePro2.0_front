import React from "react";

const ReprintKOTModal = ({
  isOpen,
  onClose,
  tables,
  selectedTable,
  onSelectTable,
  orderNumbers,
  onSelectOrder,
  loadingOrders
}) => {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1050
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: "white",
          borderRadius: "8px",
          boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
          width: "90%",
          maxWidth: "700px",
          maxHeight: "80vh",
          overflow: "auto"
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ padding: "16px", borderBottom: "1px solid #dee2e6" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h4 style={{ margin: 0, fontWeight: "bold" }}>Reprint KOT</h4>
            <button
              onClick={onClose}
              style={{
                background: "none",
                border: "none",
                fontSize: "24px",
                cursor: "pointer",
                padding: 0,
                width: "30px",
                height: "30px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
            >
              x
            </button>
          </div>
        </div>

        <div style={{ padding: "16px" }}>
          <div style={{ marginBottom: "12px" }}>
            <label style={{ fontWeight: 600, fontSize: "13px" }}>Select Running Table</label>
            <select
              value={selectedTable || ""}
              onChange={(e) => onSelectTable(e.target.value)}
              style={{ width: "100%", padding: "8px", borderRadius: "6px", marginTop: "6px" }}
            >
              <option value="">Select table...</option>
              {tables && tables.length > 0 ? (
                tables.map((table) => (
                  <option key={table.id || table.name} value={table.name}>
                    {table.name}
                  </option>
                ))
              ) : (
                <option value="" disabled>
                  No running tables
                </option>
              )}
            </select>
          </div>

          <div>
            <div style={{ fontWeight: 600, fontSize: "13px", marginBottom: "8px" }}>
              Order Numbers
            </div>
            {loadingOrders ? (
              <div style={{ fontSize: "12px", color: "#6c757d" }}>Loading orders...</div>
            ) : orderNumbers && orderNumbers.length > 0 ? (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {orderNumbers.map((orderNo) => (
                  <button
                    key={`${orderNo.field}-${orderNo.value}`}
                    onClick={() => onSelectOrder(orderNo)}
                    style={{
                      padding: "6px 10px",
                      border: "1px solid #007bff",
                      backgroundColor: "#f8f9fa",
                      borderRadius: "6px",
                      cursor: "pointer",
                      fontSize: "12px"
                    }}
                  >
                    Order #{orderNo.value}
                  </button>
                ))}
              </div>
            ) : (
              <div style={{ fontSize: "12px", color: "#6c757d" }}>No orders found.</div>
            )}
          </div>
        </div>

        <div style={{ padding: "12px 16px", borderTop: "1px solid #dee2e6", textAlign: "right" }}>
          <button
            onClick={onClose}
            style={{
              padding: "8px 16px",
              backgroundColor: "#6c757d",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer"
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReprintKOTModal;
