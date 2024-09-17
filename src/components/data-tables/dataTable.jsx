import React, { useState } from "react";
import { FaSort, FaSortUp, FaSortDown } from "react-icons/fa";
import { useNavigate } from 'react-router-dom';
import ExportDataTable from "../Buttons/ExportdataTable";
import Pagination from "../Pagination/Pagination";
import Lightbox from "react-image-lightbox";
import "react-image-lightbox/style.css"; // Import lightbox styles
import { baseURL } from "../..";
import { FaEdit, FaTrash } from "react-icons/fa";
import EditModal from "../Modals/EditModals";
import deleteRecord from "../../functions/delateData";

const DataTable = ({ columns, data, tablename }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState({ key: "", direction: "" });
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxImage, setLightboxImage] = useState(null);
  const [loading, setLoading] = useState(false); // Add loading state
  const [editingRecord, setEditingRecord] = useState(null); // State for editing record
  const [showModal, setShowModal] = useState(false); // State for showing modal
  const [tableData, setTableData] = useState(data); // Manage the table data state
  const rowsPerPage = 10;
const agent_id = localStorage.getItem('uname')|| sessionStorage.getItem('uname')
  // Sort data based on sortConfig
  const sortedData = React.useMemo(() => {
    let sortableItems = [...tableData];
    if (sortConfig.key) {
      sortableItems.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === "asc" ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === "asc" ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [tableData, sortConfig]);

  // Pagination logic
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const paginatedData = sortedData.slice(startIndex, endIndex);
  const totalPages = Math.ceil(sortedData.length / rowsPerPage);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };
  const navigate = useNavigate();
  const handleEditClick = (item) => {
    if(tablename=="listing")
    {
      navigate(`/property/editproperty/${item.id}/${agent_id}`);
    }
    else if(tablename=="images")
    {

    }
    else{


    }
   
    // setEditingRecord(item);
    // setShowModal(true);
  };

  const handleDeleteClick = async (itemId) => {
    try {
      // Implement delete logic here
      await deleteRecord(tablename, "id", itemId);
      if (tablename === "listing") {
        await deleteRecord("images", "id", itemId);
      }
      
      //console.log("Delete record with ID:", itemId);
      // Update the table data state after deletion
      setTableData((prevData) => prevData.filter((item) => item.id !== itemId));
    } catch (error) {
      console.error("Error deleting record:", error);
    }
  };
  const onSort = (columnKey) => {
    let direction = "asc";
    if (sortConfig.key === columnKey && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key: columnKey, direction });
  };

  const getSortIcon = (columnKey) => {
    if (sortConfig.key === columnKey) {
      if (sortConfig.direction === "asc") {
        return <FaSortUp />;
      } else if (sortConfig.direction === "desc") {
        return <FaSortDown />;
      }
    }
    return <FaSort />;
  };

  const handleImageClick = (imageSrc) => {
    setLoading(true); // Start loading
    const imageUrl = `${baseURL}/${imageSrc}?t=${new Date().getTime()}`;
    setLightboxImage(imageUrl);
    setLightboxOpen(true);
  };

  return (
    <>
      {lightboxOpen && lightboxImage && (
        <Lightbox
          mainSrc={lightboxImage}
          onCloseRequest={() => setLightboxOpen(false)}
          onImageLoad={() => setLoading(false)} // Stop loading when image is loaded
        />
      )}
      {loading && <div className="loading-icon">Loading...</div>}
      <div className="table-wrap">
        <div className="table-responsive">
          <table className="table table-hover display pb-30" id="datatable1">
            <thead>
              <tr>
                {columns.map((col, index) => (
                  <th
                    key={index}
                    onClick={() => onSort(col.field)}
                    style={{ cursor: "pointer" }}
                  >
                    {col.label} {getSortIcon(col.field)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginatedData.map((item, rowIndex) => (
                <tr key={rowIndex}>
                  {columns.map((col, colIndex) => (
                    <td key={colIndex}>
                      {col.field === "path" && item[col.field] ? (
                        <img
                          src={`${baseURL}/${
                            item[col.field]
                          }?t=${new Date().getTime()}`} // Cache-busting
                          alt="Thumbnail"
                          style={{
                            width: "50px",
                            height: "50px",
                            cursor: "pointer",
                          }}
                          onClick={() => handleImageClick(item[col.field])}
                        />
                      ) : col.field === "actions" ? (
                        <>
                          <FaEdit
                            style={{ cursor: "pointer", marginRight: "10px" }}
                            onClick={() => handleEditClick(item)}
                          />
                          <FaTrash
                            style={{ cursor: "pointer" }}
                            onClick={() => handleDeleteClick(item.id)}
                          />
                        </>
                      ) : (
                        item[col.field]
                      )}
                    </td>
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

export default DataTable;
