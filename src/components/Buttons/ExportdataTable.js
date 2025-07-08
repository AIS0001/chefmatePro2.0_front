import React, { useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import ReactHTMLTableToExcel from 'react-html-table-to-excel';
import { FaPrint, FaFileCsv, FaFileExcel, FaFilePdf } from 'react-icons/fa';

const ExportDataTable = ({ tableId, tableData }) => {
  const printRef = useRef();

  // Function to handle printing
  const handlePrint = useReactToPrint({
    content: () => printRef.current,
    documentTitle: 'DataTable_Print',
  });

  // Function to export CSV data
  const exportCSV = (tableData) => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      tableData.map((e) => Object.values(e).join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'table_data.csv');
    document.body.appendChild(link); // Required for Firefox
    link.click();
    document.body.removeChild(link); // Clean up
  };

  // Function to export PDF data
  const exportPDF = () => {
    const doc = new jsPDF({ orientation: 'landscape' });
    const tableColumn = Object.keys(tableData[0]); // Extract column names from the first data row
    const tableRows = tableData.map(item => Object.values(item)); // Extract values from data rows

    doc.text('Dhruv Innovation Inc.', 20, 10);

    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 20,
    });

    doc.save('table_data.pdf');
  };

  return (
    <div className="export-icons" style={{ float: 'right', display: 'flex', gap: '10px' }}>
      <div
        className="export-icon"
        onClick={handlePrint}
        title="Print"
        style={{ color: '#000000', cursor: 'pointer', margin: '0 0px' }}
      >
        <FaPrint size={16} />
      </div>
      <div
        className="export-icon"
        onClick={() => exportCSV(tableData)}
        title="Export as CSV"
        style={{ color: '#000000', cursor: 'pointer', margin: '0 0px' }}
       
      >
        <FaFileCsv size={16} />
      </div>
      {/* <ReactHTMLTableToExcel
        id="export-excel"
        className="export-icon"
        table={tableId}
        filename="table_data"
        sheet="Sheet1"
        buttonText={<FaFileExcel size={12} style={{ color: '#ffc107' }} title="Export as Excel" />}
      /> */}
      <div
        className="export-icon"
        onClick={exportPDF}
        title="Export as PDF"
        style={{ color: '#000000', cursor: 'pointer', margin: '0 0px' }}
      >
        <FaFilePdf size={16} />
      </div>
    </div>
  );
};

export default ExportDataTable;
