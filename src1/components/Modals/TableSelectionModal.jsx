import React from "react";

const TableSelectionModal = ({ isOpen, onClose, tables, onTableSelect, selectedTable }) => {
  const handleTableClick = (table) => {
    // Get table category ID from various possible field names
    const tableCatId = table.table_cat_id || table.cat_id || table.category_id || table.category || null;
    
    console.log("Selected table data:", {
      name: table.name,
      table_cat_id: tableCatId,
      category: table.category,
      fullTable: table
    });
    
    // If category is empty string, convert to null, otherwise convert to integer
    let categoryIdToPass = null;
    if (tableCatId !== '' && tableCatId !== undefined && tableCatId !== null) {
      categoryIdToPass = parseInt(tableCatId, 10);
      // If parseInt fails, set to null
      if (isNaN(categoryIdToPass)) {
        categoryIdToPass = null;
      }
    }
    
    console.log("Passing to onTableSelect:", { tableNumber: table.name, categoryId: categoryIdToPass });
    
    // Pass table name and category ID to match newPOS.jsx handleTableClick signature
    onTableSelect(table.name, categoryIdToPass);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1050
      }}
      onClick={onClose}
    >
      <div 
        style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
          width: '90%',
          maxWidth: '800px',
          maxHeight: '80vh',
          overflow: 'auto'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ padding: '20px', borderBottom: '1px solid #dee2e6' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h4 style={{ margin: 0, fontWeight: 'bold' }}>Select Table</h4>
            <button 
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '24px',
                cursor: 'pointer',
                padding: '0',
                width: '30px',
                height: '30px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              ×
            </button>
          </div>
        </div>
        
        <div style={{ padding: '20px' }}>
          <div className="row justify-content-center" style={{ margin: '0' }}>
            {tables && tables.length > 0 ? (
              tables.map((table, index) => (
                <div
                  key={index}
                  onClick={() => handleTableClick(table)}
                  className="col-lg-2 col-md-3 col-sm-4 col-6 mb-3"
                  style={{
                    cursor: "pointer",
                    transition: "transform 0.2s, box-shadow 0.2s",
                    padding: '5px'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "scale(1.05)";
                    e.currentTarget.style.boxShadow = "0px 4px 10px rgba(0, 0, 0, 0.15)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "scale(1)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  <div
                    className="table-card p-3 text-center rounded"
                    style={{
                      backgroundColor: table.status === 0 ? "#28a745" : "#dc3545",
                      color: "white",
                      border: selectedTable === table.name ? "3px solid #ffc107" : "1px solid white",
                      minHeight: '90px',
                      position: 'relative'
                    }}
                  >
                    {selectedTable === table.name && (
                      <div
                        style={{
                          position: 'absolute',
                          top: '5px',
                          right: '5px',
                          backgroundColor: '#ffc107',
                          color: '#000',
                          borderRadius: '50%',
                          width: '20px',
                          height: '20px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '12px',
                          fontWeight: 'bold'
                        }}
                      >
                        ✓
                      </div>
                    )}
                    <img
                      src={`../../dist/img/tables/table.png`}
                      alt={`Table ${index + 1}`}
                      className="img-fluid mb-2"
                      style={{ width: "40px", height: "40px" }}
                    />
                    <h6
                      style={{
                        fontWeight: "bold",
                        textTransform: "uppercase",
                        margin: "0",
                        fontSize: "0.8rem",
                      }}
                    >
                      {table.name}
                    </h6>
                    {/* Display category info if available */}
                    {(table.category || table.category_name) && (
                      <div style={{ fontSize: "0.6rem", marginTop: "2px", opacity: 0.9 }}>
                        Cat: {table.category || table.category_name}
                      </div>
                    )}
                    {/* Debug info for table_cat_id */}
                    {(table.table_cat_id || table.cat_id || table.category_id) && (
                      <div style={{ fontSize: "0.5rem", marginTop: "1px", opacity: 0.7 }}>
                        ID: {table.table_cat_id || table.cat_id || table.category_id}
                      </div>
                    )}
                    <span
                      style={{
                        fontSize: "0.7rem",
                        fontWeight: "400",
                        marginTop: "3px",
                        display: "block",
                      }}
                    >
                      {table.status === 0 ? "Available" : "Occupied"}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-muted" style={{ fontSize: "1rem", padding: '20px' }}>
                Loading tables...
              </p>
            )}
          </div>
        </div>
        
        <div style={{ padding: '15px 20px', borderTop: '1px solid #dee2e6', display: 'flex', justifyContent: 'space-between' }}>
          <button 
            onClick={onClose}
            style={{
              padding: '8px 16px',
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Close
          </button>
          {selectedTable && (
            <button 
              onClick={onClose}
              style={{
                padding: '8px 16px',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Continue with {selectedTable}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default TableSelectionModal;
