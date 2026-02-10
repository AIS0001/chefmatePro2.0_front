// components/Modals/BillItemModal.jsx
import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Modal, Table, Tag, Divider, Row, Col, Statistic, Button, Space, Spin } from "antd";
import { PrinterOutlined } from "@ant-design/icons";
import { VATInvoicePrintPreview } from "../Templates/vatemplate";
import fetchData from "../../functions/fetchData";
import { printInvoiceToCashier } from "../../services/thermalPrinter";

export default function BillItemModal({ isOpen, onClose, bill }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showPrintPreview, setShowPrintPreview] = useState(false);

  useEffect(() => {
    if (bill?.id && isOpen) {
      fetchItems();
    }
  }, [bill, isOpen]);

  const fetchItems = async () => {
    setLoading(true);
    try {
      // Fetch order items for this bill using the proper fetchData function
      const items = await fetchData("order_items", null, "id", { order_id: bill.id });
      if (items && items.length > 0) {
        setItems(items);
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

  // Handle thermal print
  const handleThermalPrint = async () => {
    try {
      if (!bill?.id) {
        toast.error("Bill ID is missing");
        return;
      }

      let toastId;
      try {
        toastId = toast.loading("Printing thermal invoice...");
        
        // Prepare invoice data for thermal printer
        const invoiceData = {
          billId: bill.id || "0",
          queueNumber: bill.table_number || "Walk-in",
          companyName: "CHEFMATE",
          companyAddress: "Sol 13, Pattaya-20150",
          companyPhone: "",
          companyTaxId: "",
          timestamp: new Date().toLocaleString(),
          items: items.map(item => ({
            item_name: item.item_name,
            quantity: item.quantity,
            price: (parseFloat(item.total_price) / parseFloat(item.quantity)).toFixed(2),
            total: parseFloat(item.total_price).toFixed(2)
          })),
          subtotal: parseFloat(bill?.subtotal_afterdiscount || 0).toFixed(2),
          discountPercent: 0,
          discountAmount: parseFloat(bill?.discount || 0).toFixed(2),
          subtotalAfterDiscount: parseFloat(bill?.subtotal_afterdiscount || 0).toFixed(2),
          taxPercent: 7,
          taxAmount: parseFloat(bill?.tax || 0).toFixed(2),
          roundOff: "0.00",
          total: parseFloat(bill?.grand_total || 0).toFixed(2),
          paymentMethod: bill?.payment_mode || "CASH",
          operatedBy: "3130",
          watermark: "COPY"
        };

        const success = await printInvoiceToCashier(invoiceData);
        
        if (success) {
          if (toastId) {
            toast.dismiss(toastId);
          }
          toast.success("Invoice printed to Cashier printer successfully!");
        } else {
          if (toastId) {
            toast.dismiss(toastId);
          }
          toast.error("Failed to print invoice. Make sure printer server is running on port 7001.");
        }
      } catch (error) {
        if (toastId) {
          toast.dismiss(toastId);
        }
        console.error("❌ Error printing invoice:", error);
        toast.error("Error printing invoice: " + error.message);
      }
    } catch (error) {
      console.error("❌ Error in handleThermalPrint:", error);
      toast.error("Error preparing invoice: " + error.message);
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
      watermark: bill?.status === "cancelled" ? "CANCELLED" : "PAID"
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
          <Button
            key="print"
            type="primary"
            icon={<PrinterOutlined />}
            onClick={handleThermalPrint}
          >
            Print Thermal
          </Button>,
        ]}
      >
        <Spin spinning={loading}>
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
                value={bill?.status === "cancelled" ? "Cancelled" : "Active"}
                valueStyle={{ 
                  fontSize: 14,
                  color: bill?.status === "cancelled" ? "#ff4d4f" : "#52c41a"
                }}
              />
            </Col>
          </Row>

          <Divider />

          {/* Items Table */}
          <Table
            columns={columns}
            dataSource={items.map((item, index) => ({ ...item, key: index }))}
            pagination={false}
            size="small"
            bordered
          />

          <Divider />

          {/* Summary */}
          <Row gutter={[16, 16]} justify="end" style={{ maxWidth: 400, marginLeft: "auto" }}>
            <Col span={24}>
              <Row justify="space-between">
                <span>Subtotal:</span>
                <strong>฿{parseFloat(bill?.subtotal_afterdiscount || 0).toFixed(2)}</strong>
              </Row>
            </Col>
            <Col span={24}>
              <Row justify="space-between">
                <span>Tax (7%):</span>
                <strong>฿{parseFloat(bill?.tax || 0).toFixed(2)}</strong>
              </Row>
            </Col>
            <Col span={24}>
              <Divider style={{ margin: "8px 0" }} />
            </Col>
            <Col span={24}>
              <Row justify="space-between" style={{ fontSize: 16 }}>
                <strong>Grand Total:</strong>
                <strong style={{ color: "#1890ff" }}>฿{parseFloat(bill?.grand_total || 0).toFixed(2)}</strong>
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
