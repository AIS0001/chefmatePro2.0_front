// components/Modals/BillItemModal.jsx
import React, { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Modal, Table, Tag, Divider, Row, Col, Statistic, Button, Space, Spin, InputNumber, Popconfirm, Select } from "antd";
import { PrinterOutlined, DeleteOutlined, SaveOutlined } from "@ant-design/icons";
import axios from "axios";
import { VATInvoicePrintPreview } from "../Templates/vatemplate";
import fetchData from "../../functions/fetchData";
import { getHeaders } from "../../utility/getHeader";
import { getUserType } from "../../utility/auth";
import { getUserName } from "../../functions/storageUtils";

export default function BillItemModal({ isOpen, onClose, bill, isEditMode = false, onBillUpdated }) {
  const LOCAL_PRINT_AGENT_URL = process.env.REACT_APP_LOCAL_PRINT_AGENT_URL || "http://127.0.0.1:7001";
  const isCancelled = bill?.status === 2 || bill?.status === "2" || bill?.status === "cancelled";
  const userType = getUserType();
  const canEditInModal = ["admin", "account"].includes((userType || "").toLowerCase());
  const effectiveEditMode = isEditMode && canEditInModal && !isCancelled;
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [companyInfo, setCompanyInfo] = useState([]);
  const [editableItems, setEditableItems] = useState([]);
  const [deletedItemIds, setDeletedItemIds] = useState([]);
  const [savingEdits, setSavingEdits] = useState(false);
  const [editDiscountType, setEditDiscountType] = useState("amount");
  const [editDiscountValue, setEditDiscountValue] = useState(0);

  const resolveCompanyName = () => {
    const company = companyInfo?.[0] || {};
    return (
      company?.name ||
      company?.company_name ||
      company?.companyName ||
      company?.shop_name ||
      localStorage.getItem("shop_name") ||
      sessionStorage.getItem("shop_name") ||
      "Restaurant"
    ).trim();
  };

  const escapeHtml = (value = "") =>
    String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");

  const resolveCompanyProfile = () => {
    const company = companyInfo?.[0] || {};
    return {
      name: resolveCompanyName(),
      address: company?.address || "",
      city: company?.city || "",
      state: company?.state || "",
      zipCode: company?.zip_code || company?.zipCode || "",
      country: company?.country || "",
      phone: company?.phone_number || company?.phone || "",
      email: company?.email || "",
      website: company?.website || company?.company_website || "",
      taxId: company?.tax_id || company?.taxId || ""
    };
  };

  const buildCompanyHeaderHtml = (titleText = "") => {
    const profile = resolveCompanyProfile();
    const locationLine = [profile.city, profile.state, profile.zipCode, profile.country]
      .filter(Boolean)
      .join(", ");
    const headerLines = [
      profile.address,
      locationLine,
      profile.phone ? `Phone: ${profile.phone}` : "",
      profile.email ? `Email: ${profile.email}` : "",
      profile.website ? `Web: ${profile.website}` : "",
      profile.taxId ? `Tax: ${profile.taxId}` : ""
    ].filter(Boolean);

    return `
      <div class="bill-header">
        <h2>${escapeHtml(profile.name)}</h2>
        <div class="company-info">
          ${headerLines.map((line) => `<p>${escapeHtml(line)}</p>`).join("")}
          ${titleText ? `<p><strong>${escapeHtml(titleText)}</strong></p>` : ""}
        </div>
      </div>
    `;
  };

  useEffect(() => {
    if (bill?.id && isOpen) {
      fetchItems();
    }
  }, [bill, isOpen]);

  useEffect(() => {
    if (isOpen) {
      (async () => {
        const companyProfileData = await fetchData("company_profile", null, "id", {});
        if (Array.isArray(companyProfileData) && companyProfileData.length > 0) {
          setCompanyInfo(companyProfileData);
        } else {
          await fetchData("companyinfo", setCompanyInfo, "id", {});
        }
      })();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!effectiveEditMode) return;
    const seededItems = items.map((item) => {
      const quantity = Number(item.quantity || 0);
      const rawTotal = Number(item.total_price || item.total_amount || 0);
      const fallbackUnit = quantity > 0 ? rawTotal / quantity : 0;
      const unitPrice = Number(item.unit_price || item.price || item.offerprice || fallbackUnit || 0);
      return {
        ...item,
        quantity,
        unit_price: unitPrice,
        total_price: Number(rawTotal || unitPrice * quantity || 0)
      };
    });
    const subtotalValue = seededItems.reduce((sum, item) => sum + Number(item.total_price || 0), 0);
    const rawType = (bill?.discount_type || bill?.discountType || "").toLowerCase();
    const normalizedType = rawType === "percentage" ? "percentage" : "amount";
    const rawValue = bill?.discount_value ?? bill?.discountValue ?? null;
    const rawAmount = bill?.discount_amount ?? bill?.discount ?? 0;
    let nextDiscountValue = Number(rawValue ?? rawAmount ?? 0) || 0;
    if (normalizedType === "percentage" && !rawValue && subtotalValue > 0) {
      nextDiscountValue = (Number(rawAmount || 0) / subtotalValue) * 100;
    }

    setEditableItems(seededItems);
    setDeletedItemIds([]);
    setEditDiscountType(normalizedType);
    setEditDiscountValue(Number(nextDiscountValue.toFixed(2)));
  }, [items, effectiveEditMode, bill]);

  const fetchItems = async () => {
    setLoading(true);
    try {
      // Fetch order items for this bill (invoice number preferred)
      const invoiceId = bill?.inv_number || bill?.invoice_number || String(bill?.id || '');
      if (!invoiceId) {
        setItems([]);
        return;
      }

      const byInvoice = await fetchData("order_items", null, "id", { invoice_number: invoiceId });
      if (byInvoice && byInvoice.length > 0) {
        setItems(byInvoice);
      } else {
        toast.info("No items found for this bill");
        setItems([]);
      }
    } catch (error) {
      console.error("Error fetching bill items:", error);
      toast.error("Failed to fetch bill items");
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const getDiscountAmount = (subtotalValue, discountType, discountValue) => {
    let discountAmount = 0;
    if (discountType === "percentage") {
      discountAmount = (subtotalValue * discountValue) / 100;
    } else {
      discountAmount = discountValue;
    }
    return Math.min(Math.max(discountAmount, 0), subtotalValue);
  };

  const getTaxRate = () => {
    const explicitRate = Number(
      bill?.tax_percentage
      ?? bill?.tax_percent
      ?? bill?.vat_rate
      ?? bill?.gst_rate
      ?? bill?.tax_rate
      ?? 0
    );

    if (explicitRate > 0) return explicitRate;

    // This screen shows tax as 7% by design; use 7 as stable fallback
    return 7;
  };

  const computeTotals = (sourceItems, discountType, discountValue) => {
    const subtotalValue = sourceItems.reduce((sum, item) => sum + Number(item.total_price || 0), 0);
    const discountAmount = getDiscountAmount(subtotalValue, discountType, discountValue);
    const subtotalAfterDiscountValue = subtotalValue - discountAmount;
    const taxRate = getTaxRate();
    // Subtotal after discount already includes tax; extract tax from it instead of adding again
    const taxValue = taxRate > 0
      ? subtotalAfterDiscountValue * (taxRate / (100 + taxRate))
      : 0;
    const totalAmountValue = subtotalAfterDiscountValue;
    const roundedTotal = Math.round(totalAmountValue);
    const roundoffValue = roundedTotal - totalAmountValue;

    return {
      subtotal: subtotalValue,
      discountAmount,
      subtotalAfterDiscount: subtotalAfterDiscountValue,
      taxAmount: taxValue,
      totalAmount: totalAmountValue,
      roundOff: roundoffValue,
      grandTotal: roundedTotal
    };
  };

  const editTotals = useMemo(() => {
    if (!effectiveEditMode) return null;
    return computeTotals(editableItems, editDiscountType, Number(editDiscountValue || 0));
  }, [editableItems, effectiveEditMode, editDiscountType, editDiscountValue]);

  const handleQtyChange = (itemId, value) => {
    const nextValue = Number(value || 0);
    if (nextValue <= 0) {
      handleRemoveItem(itemId);
      return;
    }
    setEditableItems((prev) => prev.map((item) => {
      if (item.id !== itemId) return item;
      const unitPrice = Number(item.unit_price || 0);
      return {
        ...item,
        quantity: nextValue,
        total_price: Number((unitPrice * nextValue).toFixed(2))
      };
    }));
  };

  const handleRemoveItem = (itemId) => {
    setEditableItems((prev) => prev.filter((item) => item.id !== itemId));
    setDeletedItemIds((prev) => (prev.includes(itemId) ? prev : [...prev, itemId]));
  };

  const handleUpdateBill = async () => {
    if (!bill?.id) {
      toast.error("Bill ID is missing");
      return;
    }
    if (editableItems.length === 0) {
      toast.error("Bill must have at least one item.");
      return;
    }

    setSavingEdits(true);
    try {
      const totals = computeTotals(editableItems, editDiscountType, Number(editDiscountValue || 0));
      const userName = getUserName() || "unknown";
      const userTypeValue = (getUserType() || "").toLowerCase();
      const terminalId = localStorage.getItem("terminal_id") || localStorage.getItem("terminalId") || "";
      const ipAddress = window.location.hostname || "";
      const oldItemsById = new Map(items.map((item) => [item.id, item]));
      const oldDiscountType = (bill?.discount_type || bill?.discountType || "amount").toLowerCase();
      const oldDiscountValueRaw = bill?.discount_value ?? bill?.discountValue ?? bill?.discount_amount ?? bill?.discount ?? 0;
      const oldDiscountValue = Number(oldDiscountValueRaw || 0);
      const oldTotals = {
        subtotal: Number(bill?.subtotal || 0),
        subtotalAfterDiscount: Number(bill?.subtotal_afterdiscount || 0),
        tax: Number(bill?.tax || 0),
        totalAmount: Number(bill?.total_amount || 0),
        roundOff: Number(bill?.roundoff ?? bill?.round_off ?? 0),
        grandTotal: Number(bill?.grand_total || 0)
      };
      const newTotals = {
        subtotal: totals.subtotal,
        subtotalAfterDiscount: totals.subtotalAfterDiscount,
        tax: totals.taxAmount,
        totalAmount: totals.totalAmount,
        roundOff: totals.roundOff,
        grandTotal: totals.grandTotal
      };

      const logs = [];

      editableItems.forEach((item) => {
        const oldItem = oldItemsById.get(item.id);
        if (!oldItem) return;
        const oldQty = Number(oldItem.quantity || 0);
        const oldTotal = Number(oldItem.total_price || oldItem.total_amount || 0);
        const newQty = Number(item.quantity || 0);
        const newTotal = Number(item.total_price || 0);

        if (oldQty !== newQty || Math.abs(oldTotal - newTotal) > 0.009) {
          logs.push({
            bill_id: bill.id,
            order_item_id: item.id,
            action: "update",
            old_qty: oldQty,
            new_qty: newQty,
            old_total: oldTotal.toFixed(2),
            new_total: newTotal.toFixed(2),
            old_subtotal: oldTotals.subtotal.toFixed(2),
            new_subtotal: newTotals.subtotal.toFixed(2),
            old_subtotal_afterdiscount: oldTotals.subtotalAfterDiscount.toFixed(2),
            new_subtotal_afterdiscount: newTotals.subtotalAfterDiscount.toFixed(2),
            old_tax: oldTotals.tax.toFixed(2),
            new_tax: newTotals.tax.toFixed(2),
            old_total_amount: oldTotals.totalAmount.toFixed(2),
            new_total_amount: newTotals.totalAmount.toFixed(2),
            old_round_off: oldTotals.roundOff.toFixed(2),
            new_round_off: newTotals.roundOff.toFixed(2),
            old_grand_total: oldTotals.grandTotal.toFixed(2),
            new_grand_total: newTotals.grandTotal.toFixed(2),
            old_discount_type: oldDiscountType,
            new_discount_type: editDiscountType,
            old_discount_value: oldDiscountValue.toFixed(2),
            new_discount_value: Number(editDiscountValue || 0).toFixed(2),
            user_type: userTypeValue,
            user_name: userName,
            terminal_id: terminalId,
            ip_address: ipAddress
          });
        }
      });

      deletedItemIds.forEach((itemId) => {
        const oldItem = oldItemsById.get(itemId);
        if (!oldItem) return;
        const oldQty = Number(oldItem.quantity || 0);
        const oldTotal = Number(oldItem.total_price || oldItem.total_amount || 0);
        logs.push({
          bill_id: bill.id,
          order_item_id: itemId,
          action: "delete",
          old_qty: oldQty,
          new_qty: 0,
          old_total: oldTotal.toFixed(2),
          new_total: "0.00",
          old_subtotal: oldTotals.subtotal.toFixed(2),
          new_subtotal: newTotals.subtotal.toFixed(2),
          old_subtotal_afterdiscount: oldTotals.subtotalAfterDiscount.toFixed(2),
          new_subtotal_afterdiscount: newTotals.subtotalAfterDiscount.toFixed(2),
          old_tax: oldTotals.tax.toFixed(2),
          new_tax: newTotals.tax.toFixed(2),
          old_total_amount: oldTotals.totalAmount.toFixed(2),
          new_total_amount: newTotals.totalAmount.toFixed(2),
          old_round_off: oldTotals.roundOff.toFixed(2),
          new_round_off: newTotals.roundOff.toFixed(2),
          old_grand_total: oldTotals.grandTotal.toFixed(2),
          new_grand_total: newTotals.grandTotal.toFixed(2),
          old_discount_type: oldDiscountType,
          new_discount_type: editDiscountType,
          old_discount_value: oldDiscountValue.toFixed(2),
          new_discount_value: Number(editDiscountValue || 0).toFixed(2),
          user_type: userTypeValue,
          user_name: userName,
          terminal_id: terminalId,
          ip_address: ipAddress
        });
      });

      if (oldDiscountType !== editDiscountType || Math.abs(oldDiscountValue - Number(editDiscountValue || 0)) > 0.009) {
        logs.push({
          bill_id: bill.id,
          order_item_id: null,
          action: "discount_update",
          old_qty: null,
          new_qty: null,
          old_total: null,
          new_total: null,
          old_subtotal: oldTotals.subtotal.toFixed(2),
          new_subtotal: newTotals.subtotal.toFixed(2),
          old_subtotal_afterdiscount: oldTotals.subtotalAfterDiscount.toFixed(2),
          new_subtotal_afterdiscount: newTotals.subtotalAfterDiscount.toFixed(2),
          old_tax: oldTotals.tax.toFixed(2),
          new_tax: newTotals.tax.toFixed(2),
          old_total_amount: oldTotals.totalAmount.toFixed(2),
          new_total_amount: newTotals.totalAmount.toFixed(2),
          old_round_off: oldTotals.roundOff.toFixed(2),
          new_round_off: newTotals.roundOff.toFixed(2),
          old_grand_total: oldTotals.grandTotal.toFixed(2),
          new_grand_total: newTotals.grandTotal.toFixed(2),
          old_discount_type: oldDiscountType,
          new_discount_type: editDiscountType,
          old_discount_value: oldDiscountValue.toFixed(2),
          new_discount_value: Number(editDiscountValue || 0).toFixed(2),
          user_type: userTypeValue,
          user_name: userName,
          terminal_id: terminalId,
          ip_address: ipAddress
        });
      }

      await Promise.all(
        editableItems.map((item) =>
          axios.put(
            `/updatecommondata/order_items/id/${item.id}/`,
            {
              quantity: Number(item.quantity || 0),
              total_price: Number(item.total_price || 0).toFixed(2)
            },
            getHeaders()
          )
        )
      );

      if (deletedItemIds.length > 0) {
        await Promise.all(
          deletedItemIds.map((itemId) =>
            axios.delete(`/deletebyid/order_items/id/${itemId}`, getHeaders())
          )
        );
      }

      await axios.put(
        `/updatecommondata/final_bill/id/${bill.id}/`,
        {
          subtotal: totals.subtotal.toFixed(2),
          discount_type: editDiscountType,
          discount_value: Number(editDiscountValue || 0).toFixed(2),
          discount_amount: totals.discountAmount.toFixed(2),
          subtotal_afterdiscount: totals.subtotalAfterDiscount.toFixed(2),
          tax: totals.taxAmount.toFixed(2),
          roundoff: totals.roundOff.toFixed(2),
          grand_total: totals.grandTotal.toFixed(2)
        },
        getHeaders()
      );

      if (logs.length > 0) {
        try {
          await Promise.all(
            logs.map((log) => axios.post("/insertdata/bill_edit_logs", log, getHeaders()))
          );
        } catch (logError) {
          console.error("Error saving bill edit logs:", logError);
        }
      }

      toast.success("Bill updated successfully!");
      await fetchItems();
      if (typeof onBillUpdated === "function") {
        await onBillUpdated();
      }
    } catch (error) {
      console.error("Error updating bill:", error);
      toast.error("Failed to update bill");
    } finally {
      setSavingEdits(false);
    }
  };

  const showPrinterErrorModal = (message) => {
    Modal.error({
      title: "Printer Configuration Error",
      content: message,
      okText: "OK"
    });
  };

  // Handle thermal print
 const handleThermalPrint = async () => {
  let toastId;
  try {
    if (!bill?.id) {
      toast.error("Bill ID is missing");
      return;
    }

    const machineUuid = localStorage.getItem("user_uuid");
    if (!machineUuid) {
      showPrinterErrorModal("User UUID not found. Please login again.");
      return;
    }

    if (!items.length) {
      toast.error("No items to print");
      return;
    }

    const profile = resolveCompanyProfile();
    const companyName = profile.name;
    const companyAddress = [
      profile.address,
      [profile.city, profile.state, profile.zipCode, profile.country].filter(Boolean).join(", ")
    ].filter(Boolean).join(", ");
    const companyPhone = profile.phone;
    const companyWebsite = profile.website;
    const companyTaxDetails = profile.taxId;

    const printerRes = await axios.get("/printer/config", getHeaders());
    const allPrinters = Array.isArray(printerRes?.data?.data) ? printerRes.data.data : [];

    const cashierPrinters = allPrinters.filter((p) => (
      String(p?.machine_uuid || "") === String(machineUuid) &&
      String(p?.location || "").toLowerCase() === "cashier" &&
      p?.printer_ip
    ));

    const seen = new Set();
    const targetPrinters = cashierPrinters.filter((p) => {
      const key = `${p.printer_ip}:${p.printer_port || 9100}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    if (!targetPrinters.length) {
      showPrinterErrorModal("No cashier printer configured for this device UUID.");
      return;
    }

    const invoiceNo = bill?.inv_number || bill?.invoice_number || String(bill?.id || "-");
    const queueNumber = bill?.table_number || "-";
    const subtotal = Number(bill?.subtotal || 0);
    const discountAmount = Number(bill?.discount_amount || bill?.discount || 0);
    const subtotalAfterDiscount = Number(
      bill?.subtotal_afterdiscount || Math.max(subtotal - discountAmount, 0)
    );
    const taxAmount = Number(bill?.tax || 0);
    const roundOff = Number(bill?.roundoff || bill?.round_off || 0);
    const grandTotal = Number(bill?.grand_total || 0);
    const taxPercent = Number(
      bill?.tax_percentage || bill?.tax_percent || bill?.vat_rate || bill?.gst_rate || bill?.tax_rate || 7
    );

    toastId = toast.loading("Sending invoice to cashier printer...");

    let successCount = 0;

    for (const printer of targetPrinters) {
      const payload = {
        printer_ip: printer.printer_ip,
        printer_port: printer.printer_port || 9100,
        terminal_id: printer.terminal_id || "CASHIER",
        location: "cashier",
        target: "cashier",
        type: "INVOICE",
        heading: "INVOICE",
        table: queueNumber,
        items: items.map((item) => ({
          item_name: item.item_name,
          quantity: Number(item.quantity || 0),
          price: Number((item.total_price || 0) / (item.quantity || 1)),
          total_price: Number(item.total_price || item.total_amount || 0)
        })),
        total: grandTotal,
        timestamp: new Date().toLocaleString(),
        companyName,
        invoiceNo,
        paymentMode: bill?.payment_mode || "Cash",
        payment_mode: bill?.payment_mode || "Cash",
        printType: "invoice",
        date: bill?.setup_date || bill?.inv_date || "",
        time: bill?.inv_time || "",
        companyAddress,
        companyPhone,
        companyWebsite,
        companyTaxDetails,
        subtotal,
        discount_type: bill?.discount_type || "amount",
        discountType: bill?.discount_type || "amount",
        discount_value: Number(bill?.discount_value || discountAmount || 0),
        discountValue: Number(bill?.discount_value || discountAmount || 0),
        discount_amount: discountAmount,
        discountAmount,
        subtotal_afterdiscount: subtotalAfterDiscount,
        subtotalAfterDiscount,
        tax: taxAmount,
        taxAmount,
        roundoff: roundOff,
        roundOff,
        grand_total: grandTotal,
        grandTotal,
        tax_percent: taxPercent,
        taxPercent
      };

      const response = await axios.post(
        `${LOCAL_PRINT_AGENT_URL}/print-kot`,
        payload,
        {
          timeout: 20000,
          headers: { "Content-Type": "application/json" }
        }
      );

      if (response?.data?.success) {
        successCount += 1;
      }
    }

    if (toastId) toast.dismiss(toastId);

    if (successCount === targetPrinters.length) {
      toast.success("Invoice printed successfully!");
    } else if (successCount > 0) {
      toast.warning(`Printed ${successCount}/${targetPrinters.length} invoice job(s).`);
    } else {
      showPrinterErrorModal("Failed to print invoice.");
    }
  } catch (error) {
    if (toastId) toast.dismiss(toastId);
    console.error("❌ Cashier direct print error:", error);
    showPrinterErrorModal(
      error?.response?.data?.message || "Cashier ESC/POS print failed."
    );
  }
};

  const handleThermalHtmlPrint = () => {
    if (!bill?.id) {
      toast.error("Bill ID is missing");
      return;
    }

    if (!items.length) {
      toast.error("No items to print");
      return;
    }

    const currencySign = "฿";
    const subtotal = parseFloat(bill?.subtotal || bill?.subtotal_afterdiscount || 0);
    const discountAmount = parseFloat(bill?.discount_amount || bill?.discount || 0);
    const subtotalAfterDiscount = parseFloat(bill?.subtotal_afterdiscount || Math.max(subtotal - discountAmount, 0));
    const taxAmount = parseFloat(bill?.tax || 0);
    const roundoffAmount = parseFloat(bill?.roundoff || 0);
    const grandAmount = parseFloat(bill?.grand_total || 0);
    const billDate = bill?.setup_date || bill?.inv_date || "";
    const billTime = bill?.inv_time || "";

    const printContent = `
      <html>
        <head>
          <style>
            html, body {
              margin: 0;
              padding: 0;
              font-family: 'Cambria', monospace;
            }
            body {
              font-size: 18px;
              width: 80mm;
              position: relative;
            }
            .cancel-stamp {
              position: absolute;
              top: 90px;
              left: 50%;
              transform: translateX(-50%) rotate(-12deg);
              color: #d32f2f;
              border: 4px solid #d32f2f;
              padding: 8px 18px;
              font-size: 28px;
              font-weight: bold;
              letter-spacing: 1px;
              opacity: 0.85;
              z-index: 5;
            }
            .copy-stamp {
              position: absolute;
              top: 90px;
              left: 50%;
              transform: translateX(-50%) rotate(-12deg);
              color: #616161;
              border: 4px solid #616161;
              padding: 8px 18px;
              font-size: 28px;
              font-weight: bold;
              letter-spacing: 1px;
              opacity: 0.7;
              z-index: 5;
            }
            .bill-header {
              text-align: center;
              text-align: center;
              margin-bottom: 10px;
              padding-bottom: 8px;
              border-bottom: 1px dashed #000;
            }
            .bill-header h2 {
              margin: 0;
              font-size: 20px;
              font-weight: 700;
              line-height: 1.25;
              word-break: break-word;
            }
            .bill-header .company-info {
              margin-top: 4px;
            }
            .bill-header .company-info p {
              margin: 2px 0;
              font-size: 12px;
              line-height: 1.35;
              word-break: break-word;
              white-space: normal;
            }
            .table {
              width: 100%;
              margin-top: 1px;
              border-collapse: collapse;
            }
            .table th, .table td {
              text-align: left;
              padding: 5px 0;
              font-size: 18px;
              line-height: 1.6;
            }
            .table th {
              font-weight: bold;
              border-bottom: 1px solid #000;
            }
            .table td {
              border-bottom: 1px solid #ddd;
            }
            .table td.total {
              font-weight: bold;
              font-size: 18px;
              margin-right: 2px;
              border-bottom: 1px solid #000;
            }
            .total-row {
              margin-top: 5px;
              margin-right: 10px;
              font-weight: bold;
              text-align: right;
              font-size: 18px;
              line-height: 1.6;
            }
            .total-row span {
              margin-left: 0px;
            }
            .footer {
              margin-top: 15px;
              text-align: center;
              font-size: 18px;
            }
          </style>
        </head>
        <body>
          ${isCancelled ? '<div class="cancel-stamp">CANCELLED</div>' : ''}
          ${!isCancelled ? '<div class="copy-stamp">COPY</div>' : ''}
          ${buildCompanyHeaderHtml()}
          <div class="bill-bill-body">
            <table class="table">
              <tr>
                <th class="header">Bill ID: ${bill?.id}</th>
                <th class="header">${bill?.table_number || ""}</th>
              </tr>
              <tr>
                <th>Date: ${billDate}</th>
                <th>Time: ${billTime}</th>
              </tr>
              <tr>
                <th colspan="2">Payment Mode: ${bill?.payment_mode || "Cash"}</th>
              </tr>
              <tbody>
                <tr></tr>
                <tr></tr>
              </tbody>
            </table>
          </div>
          <div class="bill-body">
            <table class="table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Qty</th>
                  <th>Rate</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                ${items
                  .map(
                    (item) => `
                      <tr>
                        <td>${item.item_name}</td>
                        <td>${item.quantity}</td>
                        <td>${currencySign} ${Number(item.total_price / item.quantity).toFixed(2)}</td>
                        <td>${currencySign} ${Number(item.total_price).toFixed(2)}</td>
                      </tr>
                    `
                  )
                  .join("")}
              </tbody>
            </table>
            <div class="total-row">
              <span>Subtotal: ${currencySign} ${subtotal.toFixed(2)}</span><br>
              <span>Discount: ${currencySign} ${discountAmount.toFixed(2)}</span><br>
              <span>Subtotal after Discount: ${currencySign} ${subtotalAfterDiscount.toFixed(2)}</span><br>
              <span>Tax (7%): ${currencySign} ${taxAmount.toFixed(2)}</span><br>
              <span>Round Off: ${currencySign} ${roundoffAmount.toFixed(2)}</span><br>
              <span>Total Amount: ${currencySign} ${grandAmount.toFixed(2)}</span>
            </div>
          </div>
          <div class="footer">
            <p>Operated By: N/A</p>
            <p>Powered by chefmate POS !! </p>
          </div>
        </body>
      </html>
    `;

    const newWindow = window.open("", "_blank");
    if (!newWindow) {
      toast.error("Popup blocked. Please allow popups to print.");
      return;
    }

    newWindow.document.write(printContent);
    newWindow.document.close();

    newWindow.onload = () => {
      newWindow.print();
      newWindow.close();
    };
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
      total_price: parseFloat(item.total_price || 0)
    }));

    const summary = {
      subtotal: parseFloat(bill?.subtotal_afterdiscount || 0).toFixed(2),
      discount: parseFloat(bill?.discount || 0).toFixed(2),
      subtotalAfterDiscount: parseFloat(bill?.subtotal_afterdiscount || 0).toFixed(2),
      payment: parseFloat(bill?.tax || 0).toFixed(2),
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
      watermark: isCancelled ? "CANCELLED" : "COPY"
    };
  };

  const columns = [
    {
      title: "Item Name",
      dataIndex: "item_name",
      key: "item_name",
      render: (text) => <strong>{text}</strong>,
    },
    {
      title: "Quantity",
      dataIndex: "quantity",
      key: "quantity",
      width: 100,
      align: "center",
      render: (text) => <Tag color="blue">{text}</Tag>,
    },
    {
      title: "Price",
      dataIndex: "total_price",
      key: "total_price",
      width: 120,
      align: "right",
      render: (text) => `฿${parseFloat(text || 0).toFixed(2)}`,
    },
  ];

  const editColumns = [
    {
      title: "Item Name",
      dataIndex: "item_name",
      key: "item_name",
      render: (text) => <strong>{text}</strong>,
    },
    {
      title: "Qty",
      dataIndex: "quantity",
      key: "quantity",
      width: 120,
      align: "center",
      render: (_, record) => (
        <InputNumber
          min={1}
          value={record.quantity}
          onChange={(value) => handleQtyChange(record.id, value)}
        />
      ),
    },
    {
      title: "Unit Price",
      dataIndex: "unit_price",
      key: "unit_price",
      width: 120,
      align: "right",
      render: (text) => `฿${parseFloat(text || 0).toFixed(2)}`,
    },
    {
      title: "Total",
      dataIndex: "total_price",
      key: "total_price",
      width: 120,
      align: "right",
      render: (text) => `฿${parseFloat(text || 0).toFixed(2)}`,
    },
    {
      title: "Action",
      key: "action",
      width: 90,
      align: "center",
      render: (_, record) => (
        <Popconfirm
          title="Remove this item?"
          onConfirm={() => handleRemoveItem(record.id)}
        >
          <Button danger size="small" icon={<DeleteOutlined />} />
        </Popconfirm>
      )
    }
  ];

  const totalItemAmount = items.reduce((sum, item) => sum + parseFloat(item.total_price || 0), 0);

  return (
    <>
      <Modal
        title={`Bill Items #${bill?.id}`}
        open={isOpen}
        onCancel={onClose}
        width={800}
        footer={[
          <Button key="close" onClick={onClose}>
            Close
          </Button>,
          !effectiveEditMode && (
            <Button
              key="print-html"
              icon={<PrinterOutlined />}
              onClick={handleThermalHtmlPrint}
            >
              Print Thermal (HTML)
            </Button>
          ),
          !effectiveEditMode && (
            <Button
              key="print"
              type="primary"
              icon={<PrinterOutlined />}
              onClick={handleThermalPrint}
            >
              Print ESC/POS
            </Button>
          ),
          effectiveEditMode && (
            <Button
              key="update"
              type="primary"
              icon={<SaveOutlined />}
              onClick={handleUpdateBill}
              loading={savingEdits}
            >
              Update Bill
            </Button>
          ),
        ]}
      >
        <Spin spinning={loading}>
          {isEditMode && !canEditInModal && (
            <div style={{
              backgroundColor: "#fff7e6",
              border: "1px solid #ffd591",
              padding: "8px 12px",
              borderRadius: 6,
              marginBottom: 12,
              color: "#ad6800",
              fontWeight: 600
            }}>
              Edit mode is restricted to Admin and Account users.
            </div>
          )}
          {/* Bill Header Info */}
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col xs={24} sm={12}>
              <Statistic
                title="Bill Date"
                value={bill?.setup_date || "N/A"}
                valueStyle={{ fontSize: 14 }}
              />
            </Col>
            <Col xs={24} sm={12}>
              <Statistic
                title="Table"
                value={bill?.table_number || "N/A"}
                valueStyle={{ fontSize: 14 }}
              />
            </Col>
            <Col xs={24} sm={12}>
              <Statistic
                title="Payment Mode"
                value={bill?.payment_mode || "N/A"}
                valueStyle={{ fontSize: 14 }}
              />
            </Col>
            <Col xs={24} sm={12}>
              <Statistic
                title="Status"
                value={isCancelled ? "Cancelled" : "Active"}
                valueStyle={{ 
                  fontSize: 14,
                  color: isCancelled ? "#ff4d4f" : "#52c41a"
                }}
              />
            </Col>
          </Row>

          <Divider />

          {/* Items Table */}
          <Table
            columns={effectiveEditMode ? editColumns : columns}
            dataSource={(effectiveEditMode ? editableItems : items).map((item, index) => ({ ...item, key: index }))}
            pagination={false}
            size="small"
            bordered
          />

          <Divider />

          {/* Summary */}
          <Row gutter={[16, 16]} justify="end" style={{ maxWidth: 400, marginLeft: "auto" }}>
            {effectiveEditMode && (
              <Col span={24}>
                <Row justify="space-between" align="middle">
                  <span>Discount Type:</span>
                  <Select
                    value={editDiscountType}
                    style={{ width: 140 }}
                    onChange={(value) => setEditDiscountType(value)}
                    options={[
                      { label: "%", value: "percentage" },
                      { label: "Amount", value: "amount" }
                    ]}
                  />
                </Row>
              </Col>
            )}
            {effectiveEditMode && (
              <Col span={24}>
                <Row justify="space-between" align="middle">
                  <span>Discount Value:</span>
                  <InputNumber
                    min={0}
                    value={editDiscountValue}
                    onChange={(value) => setEditDiscountValue(Number(value || 0))}
                  />
                </Row>
              </Col>
            )}
            <Col span={24}>
              <Row justify="space-between">
                <span>Subtotal:</span>
                <strong>
                  ฿{effectiveEditMode
                    ? Number(editTotals?.subtotal || 0).toFixed(2)
                    : parseFloat(bill?.subtotal_afterdiscount || 0).toFixed(2)}
                </strong>
              </Row>
            </Col>
            {effectiveEditMode && (
              <Col span={24}>
                <Row justify="space-between">
                  <span>Discount:</span>
                  <strong>฿{Number(editTotals?.discountAmount || 0).toFixed(2)}</strong>
                </Row>
              </Col>
            )}
            {effectiveEditMode && (
              <Col span={24}>
                <Row justify="space-between">
                  <span>Subtotal after Discount:</span>
                  <strong>฿{Number(editTotals?.subtotalAfterDiscount || 0).toFixed(2)}</strong>
                </Row>
              </Col>
            )}
            <Col span={24}>
              <Row justify="space-between">
                <span>Tax (7%):</span>
                <strong>
                  ฿{effectiveEditMode
                    ? Number(editTotals?.taxAmount || 0).toFixed(2)
                    : parseFloat(bill?.tax || 0).toFixed(2)}
                </strong>
              </Row>
            </Col>
            {effectiveEditMode && (
              <Col span={24}>
                <Row justify="space-between">
                  <span>Round Off:</span>
                  <strong>฿{Number(editTotals?.roundOff || 0).toFixed(2)}</strong>
                </Row>
              </Col>
            )}
            <Col span={24}>
              <Divider style={{ margin: "8px 0" }} />
            </Col>
            <Col span={24}>
              <Row justify="space-between" style={{ fontSize: 16 }}>
                <strong>Grand Total:</strong>
                <strong style={{ color: "#1890ff" }}>
                  ฿{effectiveEditMode
                    ? Number(editTotals?.grandTotal || 0).toFixed(2)
                    : parseFloat(bill?.grand_total || 0).toFixed(2)}
                </strong>
              </Row>
            </Col>
          </Row>
        </Spin>
      </Modal>

      {/* Print Preview Modal */}
      <VATInvoicePrintPreview
        open={showPrintPreview}
        onClose={() => setShowPrintPreview(false)}
        {...prepareVATData()}
      />
    </>
  );
}
