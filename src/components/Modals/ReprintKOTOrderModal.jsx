import React from "react";

const ReprintKOTOrderModal = ({
  isOpen,
  onClose,
  tableNumber,
  orderNumber,
  items,
  loadingItems,
  onPrintEscPos,
  onPrintHtml
}) => {
  if (!isOpen) return null;

  const total = (items || []).reduce((sum, item) => {
    const totalAmount = parseFloat(item.total_amount || item.total_price || 0);
    const fallback = parseFloat(item.price || 0) * parseFloat(item.quantity || 0);
    return sum + (Number.isFinite(totalAmount) && totalAmount > 0 ? totalAmount : fallback);
  }, 0);

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
        zIndex: 1060
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
            <h4 style={{ margin: 0, fontWeight: "bold" }}>
              Reprint KOT - Table {tableNumber} / Order #{orderNumber}
            </h4>
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
          {loadingItems ? (
            <div style={{ fontSize: "12px", color: "#6c757d" }}>Loading items...</div>
          ) : items && items.length > 0 ? (
            <div>
              <div style={{ border: "1px solid #dee2e6", borderRadius: "6px" }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "8px",
                    borderBottom: "1px solid #dee2e6",
                    backgroundColor: "#f8f9fa",
                    fontWeight: 600,
                    fontSize: "12px"
                  }}
                >
                  <span>Item</span>
                  <span>Qty</span>
                </div>
                {items.map((item, index) => (
                  <div
                    key={index}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      padding: "8px",
                      borderBottom: index === items.length - 1 ? "none" : "1px solid #dee2e6",
                      fontSize: "12px"
                    }}
                  >
                    <span>{item.item_name}</span>
                    <span>{item.quantity}</span>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: "10px", fontSize: "12px", textAlign: "right" }}>
                <strong>Total:</strong> ฿ {total.toFixed(2)}
              </div>
            </div>
          ) : (
            <div style={{ fontSize: "12px", color: "#6c757d" }}>No items found.</div>
          )}
        </div>

        <div style={{ padding: "12px 16px", borderTop: "1px solid #dee2e6", display: "flex", justifyContent: "space-between" }}>
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
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              onClick={onPrintHtml}
              style={{
                padding: "8px 16px",
                backgroundColor: "#17a2b8",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer"
              }}
            >
              Print Thermal (HTML)
            </button>
            <button
              onClick={onPrintEscPos}
              style={{
                padding: "8px 16px",
                backgroundColor: "#007bff",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer"
              }}
            >
              Print ESC/POS
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReprintKOTOrderModal;
