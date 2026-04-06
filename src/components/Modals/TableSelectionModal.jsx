import React from "react";
import "./TableSelectionModal.css";

const TableSelectionModal = ({ isOpen, onClose, tables, onTableSelect, selectedTable }) => {
  const normalizedTables = Array.isArray(tables) ? tables : [];
  const availableCount = normalizedTables.filter((table) => Number(table?.status) === 0).length;

  const getTableCategoryLabel = (table) => table.category_name || table.category || null;

  const isTableAvailable = (table) => Number(table?.status) === 0;

  const handleTableClick = (table) => {
    const tableCatId = table.table_cat_id || table.cat_id || table.category_id || table.category || null;

    let categoryIdToPass = null;
    if (tableCatId !== '' && tableCatId !== undefined && tableCatId !== null) {
      categoryIdToPass = parseInt(tableCatId, 10);
      if (isNaN(categoryIdToPass)) {
        categoryIdToPass = null;
      }
    }

    onTableSelect(table.name, categoryIdToPass);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div 
      className="table-selection-modal__backdrop"
      onClick={onClose}
    >
      <div 
        className="table-selection-modal__dialog"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="table-selection-modal__header">
          <div>
            <h4 className="table-selection-modal__title">Select Table</h4>
            <p className="table-selection-modal__subtitle">
              {availableCount} available of {normalizedTables.length} tables
            </p>
          </div>
          <div className="table-selection-modal__summary">
            <span className="table-selection-modal__summary-chip table-selection-modal__summary-chip--available">
              Available {availableCount}
            </span>
            <span className="table-selection-modal__summary-chip table-selection-modal__summary-chip--occupied">
              Occupied {Math.max(normalizedTables.length - availableCount, 0)}
            </span>
            <button 
              onClick={onClose}
              className="table-selection-modal__close"
              aria-label="Close table selection"
            >
              ×
            </button>
          </div>
        </div>
        
        <div className="table-selection-modal__body">
          <div className="row justify-content-center" style={{ margin: '0' }}>
            {normalizedTables.length > 0 ? (
              normalizedTables.map((table, index) => {
                const isSelected = selectedTable === table.name;
                const isAvailable = isTableAvailable(table);
                const categoryLabel = getTableCategoryLabel(table);

                return (
                <div
                  key={index}
                  className="col-lg-2 col-md-3 col-sm-4 col-6 mb-3"
                  style={{ padding: '6px' }}
                >
                  <button
                    type="button"
                    onClick={() => handleTableClick(table)}
                    className={[
                      'table-selection-modal__table-card',
                      isAvailable ? 'table-selection-modal__table-card--available' : 'table-selection-modal__table-card--occupied',
                      isSelected ? 'table-selection-modal__table-card--selected' : ''
                    ].join(' ').trim()}
                    aria-pressed={isSelected}
                  >
                    <div className="table-selection-modal__table-top">
                      <span className="table-selection-modal__table-status-pill">
                        {isAvailable ? 'Available' : 'Occupied'}
                      </span>
                      {isSelected ? (
                      <div
                        className="table-selection-modal__table-check"
                      >
                        ✓
                      </div>
                      ) : null}
                    </div>
                    <div className="table-selection-modal__table-image-wrap">
                    <img
                      src={`../../dist/img/tables/table.png`}
                      alt={`Table ${index + 1}`}
                      className="table-selection-modal__table-image"
                    />
                    </div>
                    <h6 className="table-selection-modal__table-name">
                      {table.name}
                    </h6>
                    <span className="table-selection-modal__table-meta">
                      {categoryLabel ? `Category ${categoryLabel}` : 'General table'}
                    </span>
                    <span className="table-selection-modal__table-caption">
                      {isAvailable ? 'Ready for new orders' : 'Currently in use'}
                    </span>
                  </button>
                </div>
              )})
            ) : (
              <p className="table-selection-modal__empty">
                Loading tables...
              </p>
            )}
          </div>
        </div>
        
        <div className="table-selection-modal__footer">
          <button 
            onClick={onClose}
            className="table-selection-modal__footer-button table-selection-modal__footer-button--secondary"
          >
            Close
          </button>
          {selectedTable && (
            <button 
              onClick={onClose}
              className="table-selection-modal__footer-button table-selection-modal__footer-button--primary"
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
