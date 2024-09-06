import React, { useState } from 'react';
import Pagination from '../Pagination/Pagination';
import ExportDataTable from '../Buttons/ExportdataTable';

const SimpleDataTable = ({ columns, data }) => {
    const [currentPage, setCurrentPage] = useState(1);
    const rowsPerPage = 5;
  
    const handlePageChange = (page) => {
      setCurrentPage(page);
    };
  
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    const paginatedData = data.slice(startIndex, endIndex);
    const totalPages = Math.ceil(data.length / rowsPerPage);

  return (
    <>
   
     <div className="table-wrap">
      <div className="table-responsive">
        <table className="table table-hover display pb-30">
          <thead>
            <tr>
              {columns.map((col, index) => (
                <th key={index}>{col.label}</th>
              ))}
            </tr>
          </thead>
      
          <tbody>
            {paginatedData.map((item, rowIndex) => (
              <tr key={rowIndex}>
                {columns.map((col, colIndex) => (
                  <td key={colIndex}>{item[col.field]}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
    <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
      />
    </>
   
  );
};

export default SimpleDataTable;
