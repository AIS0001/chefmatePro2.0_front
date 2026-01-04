// components/Modals/BillItemModal.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import { getHeaders } from "../../utility/getHeader";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { VATInvoicePrintPreview } from "../Templates/vatemplate";

export default function BillItemModal({ isOpen, onClose, bill }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (bill?.id && isOpen) {
      fetchItems();
    }
  }, [bill, isOpen]);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const res = await axios.post(
        "/getdata/order_items_gst",
        { billid: bill.id },
        getHeaders()
      );
      setItems(res.data || []);
    } catch (error) {
      toast.error("Failed to fetch bill items");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Prepare data for VAT template
  const prepareVATData = () => {
    const company = {
      name: "ChefMate Restaurant",
      address: "Your Restaurant Address, City, State, ZIP",
      phone: "+123-456-7890",
      email: "info@chefmate.com",
      tax_id: "123456789012345",
      currency: "THB",
      developer: "Chefmate POS-+66986643299/+66952477020"
    };

    const customer = {
      name: "Walk-in Customer",
      phone: "N/A",
      email: "N/A",
      address: "N/A",
      vat: "N/A"
    };

    const vatItems = items.map(item => ({
      item_name: item.item_name,
      quantity: item.quantity,
      total_price: parseFloat(item.total_amount || 0)
    }));

    const summary = {
      subtotal: parseFloat(bill?.subtotal_afterdiscount || 0).toFixed(2),
      discount: parseFloat(bill?.discount || 0).toFixed(2),
      subtotalAfterDiscount: parseFloat(bill?.subtotal_afterdiscount || 0).toFixed(2),
      payment: parseFloat(bill?.tax || 0).toFixed(2), // VAT amount
      roundoff: "0.00",
      grandTotal: parseFloat(bill?.grand_total || 0).toFixed(2)
    };

    return {
      company,
      customer,
      items: vatItems,
      summary,
      taxes: [],
      invoiceNo: bill?.id || "N/A",
      invoiceDate: bill?.inv_date || new Date().toISOString().split('T')[0],
      invoiceTime: bill?.inv_time || new Date().toTimeString().split(' ')[0],
      watermark: bill?.status === 0 ? "CANCELLED" : "PAID"
    };
  };

  if (loading) {
    return (
      <div style={{ 
        position: "fixed", 
        top: 0, 
        left: 0, 
        width: "100vw", 
        height: "100vh", 
        background: "rgba(0,0,0,0.5)", 
        display: "flex", 
        justifyContent: "center", 
        alignItems: "center", 
        zIndex: 9999 
      }}>
        <div style={{ 
          background: "#fff", 
          padding: "20px", 
          borderRadius: "8px", 
          textAlign: "center" 
        }}>
          <p>Loading bill details...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <VATInvoicePrintPreview
        open={isOpen}
        onClose={onClose}
        {...prepareVATData()}
      />
      <ToastContainer />
    </>
  );
}
