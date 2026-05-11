import React, { useEffect, useState } from "react";
import axios from "axios";
import { 
  Form, 
  Input, 
  Select, 
  Button, 
  DatePicker, 
  InputNumber, 
  Card, 
  Table, 
  message, 
  Space, 
  Row, 
  Col,
  Statistic,
  Tag,
  Typography,
  Divider,
  Popconfirm,
  Steps,
  Alert
} from "antd";
import { 
  PlusOutlined, 
  SaveOutlined, 
  ShoppingCartOutlined,
  InboxOutlined,
  DeleteOutlined,
  CheckCircleOutlined
} from "@ant-design/icons";
import Layout from "../../layout/Layout";
import Header from "../../components/Header";
import { getHeaders } from "../../utility/getHeader";
import fetchData from "../../functions/fetchData";
import dayjs from "dayjs";

const { Option } = Select;
const { Text } = Typography;

export default function NewStockAntDesign() {
  const baseURL = 'http://localhost:4402';
  const [itemForm] = Form.useForm();
  const [invoiceForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
  
  // Data states
  const [stockable, setStockable] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [units, setUnits] = useState([]);
  const [stockData, setStockData] = useState([]);
  
  // Purchase order states
  const [purchaseItems, setPurchaseItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [totals, setTotals] = useState({
    subtotal: 0,
    taxAmount: 0,
    discountAmount: 0,
    totalAmount: 0,
    netAmount: 0
  });
  
  // Invoice/Purchase order details
  const [invoiceDetails, setInvoiceDetails] = useState({
    supplier_id: "",
    invoice_number: "",
    invoice_date: null,
    purchase_date: dayjs(),
    discount_amount: 0,
    notes: ""
  });

  const [currentStep, setCurrentStep] = useState(0);
  const [purchaseNumber, setPurchaseNumber] = useState("");

  const getItemLabel = (item) => {
    return item?.product_name || item?.iname || item?.item_name || item?.name || item?.id;
  };

  const getUnitLabel = (unit) => {
    return unit?.unit_name || unit?.unit || unit?.uom || unit?.name || unit?.id;
  };

  // Stock inventory table columns
  const stockColumns = [
    { title: "Item", dataIndex: "product_name", key: "product_name", width: 200 },
    { title: "Unit", dataIndex: "unit_name", key: "unit_name", render: (text) => <Tag color="blue">{text}</Tag> },
    { title: "ML", dataIndex: "ml_capacity", key: "ml_capacity", render: (ml) => ml ? `${ml}ML` : "-" },
    { title: "Current", dataIndex: "current_quantity", key: "current_quantity", render: (qty) => parseFloat(qty || 0).toFixed(2) },
    { title: "Reserved", dataIndex: "reserved_quantity", key: "reserved_quantity", render: (qty) => <Text type="warning">{parseFloat(qty || 0).toFixed(2)}</Text> },
    { title: "Available", dataIndex: "available_quantity", key: "available_quantity", render: (qty) => <Text type="success">{parseFloat(qty || 0).toFixed(2)}</Text> },
  ];

  // Purchase items table columns
  const purchaseColumns = [
    { title: "#", key: "index", width: 40, render: (_, __, index) => index + 1 },
    { title: "Item", dataIndex: "productName", key: "productName" },
    { title: "Unit", dataIndex: "unitName", key: "unitName", render: (text) => <Tag color="blue">{text}</Tag> },
    { title: "Qty", dataIndex: "quantity", key: "quantity", render: (q) => parseFloat(q).toFixed(2), width: 70 },
    { title: "Price", dataIndex: "unitPrice", key: "unitPrice", render: (p) => `฿${parseFloat(p).toFixed(2)}`, width: 100 },
    { title: "Tax%", dataIndex: "taxRate", key: "taxRate", render: (t) => `${parseFloat(t).toFixed(0)}%`, width: 70 },
    { title: "Tax", dataIndex: "taxAmount", key: "taxAmount", render: (t) => `฿${parseFloat(t).toFixed(2)}`, width: 100 },
    { title: "Total", dataIndex: "totalAmount", key: "totalAmount", render: (tot) => <Text strong>฿{parseFloat(tot).toFixed(2)}</Text>, width: 120 },
    { title: "Batch", dataIndex: "batchNumber", key: "batchNumber", render: (b) => b || "-", width: 100 },
    {
      title: "Action", key: "action", width: 60,
      render: (_, __, index) => (
        <Popconfirm title="Remove?" onConfirm={() => removeItem(index)}>
          <Button type="text" danger size="small" icon={<DeleteOutlined />} />
        </Popconfirm>
      ),
    },
  ];

  // Fetch data on mount
  useEffect(() => {
    fetchStockableItems();
    fetchSuppliers();
    fetchAllStock();
  }, []);

  const fetchStockableItems = async () => {
    try {
      const items = await fetchData("items", null, "id", { isstockable: "1" });
      if (Array.isArray(items)) setStockable(items);
    } catch (error) {
      message.error("Failed to fetch items: " + error.message);
    }
  };

  const fetchSuppliers = async () => {
    try {
      await fetchData("suppliers", setSuppliers, "id", {});
    } catch (error) {
      console.error("Failed to fetch suppliers:", error);
    }
  };

  const fetchAllStock = async () => {
    try {
      const headers = getHeaders();
      const response = await axios.get(`${baseURL}/api/stock/all`, headers);
      if (response.data?.success) setStockData(response.data.data);
    } catch (error) {
      console.error("Error fetching stock:", error);
    }
  };

  // Handle item selection
  const handleItemChange = async (productId) => {
    try {
      const item = stockable.find(i => i.id === productId);
      setSelectedItem(item);
      setSelectedUnit(null);
      itemForm.setFieldsValue({ unit_id: undefined, quantity: undefined, unitPrice: undefined });
      
      // Fetch units
      const headers = getHeaders();
      const response = await axios.get(`${baseURL}/api/stock/units/${productId}`, headers);
      const unitsData = response.data?.data || response.data;
      setUnits(Array.isArray(unitsData) ? unitsData : []);
    } catch (error) {
      message.error("Failed to fetch units: " + error.message);
    }
  };

  // Handle unit selection
  const handleUnitChange = (unitId) => {
    const unit = units.find(u => u.id === unitId);
    setSelectedUnit(unit);
  };

  // Calculate item total
  const calculateItemTotal = () => {
    const quantity = parseFloat(itemForm.getFieldValue("quantity") || 0);
    const unitPrice = parseFloat(itemForm.getFieldValue("unitPrice") || 0);
    const taxRate = parseFloat(itemForm.getFieldValue("taxRate") || 0);

    const itemTotal = quantity * unitPrice;
    const taxAmount = (itemTotal * taxRate) / 100;
    const totalWithTax = itemTotal + taxAmount;

    return { itemTotal, taxAmount, totalWithTax };
  };

  // Add item to purchase list
  const addItemToPurchase = async () => {
    try {
      const values = await itemForm.validateFields();
      const { taxAmount, totalWithTax } = calculateItemTotal();

      const newItem = {
        key: Date.now(),
        productId: values.product_id,
        productName: getItemLabel(selectedItem),
        unitId: values.unit_id,
        unitName: getUnitLabel(selectedUnit),
        quantity: parseFloat(values.quantity),
        unitPrice: parseFloat(values.unitPrice),
        taxRate: parseFloat(values.taxRate || 0),
        taxAmount: taxAmount,
        totalAmount: totalWithTax,
        batchNumber: values.batchNumber || "",
        expiryDate: values.expiryDate ? values.expiryDate.format("YYYY-MM-DD") : null,
        notes: values.notes || ""
      };

      setPurchaseItems([...purchaseItems, newItem]);
      itemForm.resetFields();
      setSelectedItem(null);
      setSelectedUnit(null);
      setUnits([]);
      message.success("Item added to purchase");
      calculateTotals([...purchaseItems, newItem]);
    } catch (error) {
      console.error("Validation error:", error);
    }
  };

  // Remove item from purchase list
  const removeItem = (index) => {
    const updated = purchaseItems.filter((_, i) => i !== index);
    setPurchaseItems(updated);
    calculateTotals(updated);
  };

  // Calculate purchase totals
  const calculateTotals = (items) => {
    let subtotal = 0, taxAmount = 0, totalAmount = 0;

    items.forEach(item => {
      subtotal += item.quantity * item.unitPrice;
      taxAmount += item.taxAmount;
      totalAmount += item.totalAmount;
    });

    const discountAmount = parseFloat(invoiceDetails.discount_amount || 0);
    const netAmount = totalAmount - discountAmount;

    setTotals({
      subtotal: subtotal.toFixed(2),
      taxAmount: taxAmount.toFixed(2),
      discountAmount: discountAmount.toFixed(2),
      totalAmount: totalAmount.toFixed(2),
      netAmount: netAmount.toFixed(2)
    });
  };

  // Handle discount change
  const handleDiscountChange = (value) => {
    setInvoiceDetails({ ...invoiceDetails, discount_amount: value || 0 });
    calculateTotals(purchaseItems);
  };

  // Submit purchase order
  const handleSubmitPurchase = async () => {
    let payload = null;

    try {
      if (!invoiceDetails.supplier_id) {
        message.error("Please select a supplier");
        return;
      }

      if (!invoiceDetails.purchase_date) {
        message.error("Please select purchase date");
        return;
      }

      if (purchaseItems.length === 0) {
        message.error("Please add at least one item");
        return;
      }

      await invoiceForm.validateFields();

      setLoading(true);

      const normalizedItems = purchaseItems.map((item) => ({
        productId: parseInt(item.productId, 10),
        unitId: parseInt(item.unitId, 10),
        quantity: parseFloat(item.quantity),
        unitPrice: parseFloat(item.unitPrice),
        taxRate: parseFloat(item.taxRate || 0),
        taxAmount: parseFloat(item.taxAmount || 0),
        totalAmount: parseFloat(item.totalAmount),
        batchNumber: item.batchNumber || null,
        expiryDate: item.expiryDate || null,
        notes: item.notes || ""
      }));

      const hasInvalidItem = normalizedItems.some((item) =>
        Number.isNaN(item.productId) ||
        Number.isNaN(item.unitId) ||
        Number.isNaN(item.quantity) ||
        Number.isNaN(item.unitPrice) ||
        Number.isNaN(item.totalAmount)
      );

      if (hasInvalidItem) {
        message.error("Invalid item data. Please reselect item/unit and quantity.");
        setLoading(false);
        return;
      }

      // Prepare payload for purchase order creation
      payload = {
        purchaseData: {
          supplierId: parseInt(invoiceDetails.supplier_id, 10),
          purchaseDate: invoiceDetails.purchase_date.format("YYYY-MM-DD"),
          invoiceNumber: invoiceDetails.invoice_number || null,
          invoiceDate: invoiceDetails.invoice_date ? invoiceDetails.invoice_date.format("YYYY-MM-DD") : null,
          totalAmount: parseFloat(totals.totalAmount || 0),
          taxAmount: parseFloat(totals.taxAmount || 0),
          discountAmount: parseFloat(totals.discountAmount || 0),
          netAmount: parseFloat(totals.netAmount || 0),
          paymentStatus: "PENDING",
          notes: invoiceDetails.notes || ""
        },
        items: normalizedItems
      };

      const response = await axios.post("/purchase/create", payload, getHeaders());

      if (response.data?.success) {
        message.success(`Purchase order created: ${response.data.data.purchaseNumber}`);
        setPurchaseNumber(response.data.data.purchaseNumber);
        setCurrentStep(2);

        // Auto-populate stock conversions for all items in the purchase
        const uniqueProductIds = [...new Set(purchaseItems.map(item => item.productId))];
        for (const productId of uniqueProductIds) {
          try {
            console.log("🔄 Populating conversions for product:", productId);
            await axios.post(
              `${baseURL}/api/stock/populate-conversions/${productId}`,
              {},
              getHeaders()
            );
            console.log(`✅ Conversions populated for product ${productId}`);
          } catch (conversionError) {
            console.warn(`⚠️ Failed to populate conversions for product ${productId}:`, conversionError.message);
            // Non-blocking - don't prevent purchase completion
          }
        }

        // Reset form
        setTimeout(() => {
          itemForm.resetFields();
          invoiceForm.resetFields();
          setPurchaseItems([]);
          setInvoiceDetails({ supplier_id: "", invoice_number: "", invoice_date: null, purchase_date: dayjs(), discount_amount: 0, notes: "" });
          setSelectedItem(null);
          setUnits([]);
          fetchAllStock();
          setCurrentStep(0);
        }, 2000);
      }
    } catch (error) {
      const responseData = error.response?.data;
      const validationErrors = Array.isArray(responseData?.errors) ? responseData.errors : [];

      if (validationErrors.length > 0) {
        const firstError = validationErrors[0]?.msg || "Validation failed";
        message.error(`Failed to create purchase: ${firstError}`);
        console.error("Purchase validation errors:", validationErrors);
      } else {
        message.error("Failed to create purchase: " + (responseData?.message || error.message));
      }

      if (payload) {
        console.error("Purchase payload sent:", payload);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <Header title="Create Purchase Order" />

      <Card>
        <Steps
          current={currentStep}
          items={[
            { title: "Invoice Details", icon: <CheckCircleOutlined /> },
            { title: "Add Items", icon: <ShoppingCartOutlined /> },
            { title: "Complete", icon: <CheckCircleOutlined /> }
          ]}
          style={{ marginBottom: 24 }}
        />
      </Card>

      {/* Invoice Details Card */}
      <Card title="📋 Invoice & Purchase Details" style={{ marginBottom: 16 }}>
        <Form layout="vertical" form={invoiceForm} onValuesChange={() => setCurrentStep(0)}>
          <Row gutter={16}>
            <Col xs={24} sm={12} md={6}>
              <Form.Item label="Supplier" required>
                <Select
                  placeholder="Select Supplier"
                  value={invoiceDetails.supplier_id}
                  onChange={(value) => setInvoiceDetails({ ...invoiceDetails, supplier_id: value })}
                  showSearch
                >
                  {suppliers.map(s => (
                    <Option key={s.id} value={s.id}>
                      {s.company_name || s.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>

            <Col xs={24} sm={12} md={6}>
              <Form.Item label="Invoice Number">
                <Input
                  placeholder="INV-2026-001"
                  value={invoiceDetails.invoice_number}
                  onChange={(e) => setInvoiceDetails({ ...invoiceDetails, invoice_number: e.target.value })}
                />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12} md={6}>
              <Form.Item label="Invoice Date">
                <DatePicker
                  style={{ width: "100%" }}
                  value={invoiceDetails.invoice_date}
                  onChange={(date) => setInvoiceDetails({ ...invoiceDetails, invoice_date: date })}
                />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12} md={6}>
              <Form.Item label="Purchase Date" required>
                <DatePicker
                  style={{ width: "100%" }}
                  value={invoiceDetails.purchase_date}
                  onChange={(date) => setInvoiceDetails({ ...invoiceDetails, purchase_date: date })}
                />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12} md={12}>
              <Form.Item label="Notes">
                <Input.TextArea
                  rows={2}
                  placeholder="Additional notes..."
                  value={invoiceDetails.notes}
                  onChange={(e) => setInvoiceDetails({ ...invoiceDetails, notes: e.target.value })}
                />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12} md={12}>
              <Form.Item label="Discount Amount">
                <InputNumber
                  style={{ width: "100%" }}
                  placeholder="0.00"
                  min={0}
                  step={100}
                  prefix="฿"
                  value={invoiceDetails.discount_amount}
                  onChange={handleDiscountChange}
                />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Card>

      {/* Add Items Card */}
      <Card title="🛒 Add Purchase Items" style={{ marginBottom: 16 }}>
        <Form layout="vertical" form={itemForm}>
          <Row gutter={16}>
            <Col xs={24} sm={12} md={6}>
              <Form.Item
                label="Item"
                name="product_id"
                rules={[{ required: true, message: "Required" }]}
              >
                <Select
                  placeholder="Select Item"
                  onChange={handleItemChange}
                  showSearch
                  optionFilterProp="children"
                >
                  {stockable.map(item => (
                    <Option key={item.id} value={item.id}>
                      {getItemLabel(item)}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>

            <Col xs={24} sm={12} md={6}>
              <Form.Item
                label="Unit"
                name="unit_id"
                rules={[{ required: true, message: "Required" }]}
              >
                <Select placeholder="Select Unit" onChange={handleUnitChange} disabled={!selectedItem}>
                  {units.map(unit => (
                    <Option key={unit.id} value={unit.id}>
                      {getUnitLabel(unit)} {unit.ml_capacity && `(${unit.ml_capacity}ML)`}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>

            <Col xs={24} sm={12} md={4}>
              <Form.Item label="Qty" name="quantity" rules={[{ required: true, message: "Required" }]}>
                <InputNumber style={{ width: "100%" }} min={0.01} step={0.01} />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12} md={4}>
              <Form.Item label="Price" name="unitPrice" rules={[{ required: true, message: "Required" }]}>
                <InputNumber style={{ width: "100%" }} min={0} step={100} prefix="฿" />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12} md={4}>
              <Form.Item label="Tax %" name="taxRate" initialValue={0}>
                <InputNumber style={{ width: "100%" }} min={0} max={100} step={1} addonAfter="%" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} sm={12} md={6}>
              <Form.Item label="Batch Number" name="batchNumber">
                <Input placeholder="Optional" />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12} md={6}>
              <Form.Item label="Expiry Date" name="expiryDate">
                <DatePicker style={{ width: "100%" }} />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12} md={12}>
              <Form.Item label="Item Notes" name="notes">
                <Input placeholder="Optional notes" />
              </Form.Item>
            </Col>
          </Row>

          <Button type="primary" icon={<PlusOutlined />} size="large" onClick={addItemToPurchase}>
            Add Item
          </Button>
        </Form>
      </Card>

      {/* Purchase Items List */}
      {purchaseItems.length > 0 && (
        <Card title="📦 Purchase Items" style={{ marginBottom: 16 }}>
          <Table
            columns={purchaseColumns}
            dataSource={purchaseItems}
            rowKey="key"
            pagination={false}
            scroll={{ x: 1200 }}
          />

          {/* Totals Summary */}
          <Divider />
          <Row gutter={16} style={{ marginTop: 16 }}>
            <Col xs={24} sm={12} md={6}>
              <Statistic title="Subtotal" value={totals.subtotal} prefix="฿" precision={2} />
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Statistic title="Tax Amount" value={totals.taxAmount} prefix="฿" precision={2} valueStyle={{ color: "#ff4d4f" }} />
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Statistic title="Discount" value={totals.discountAmount} prefix="฿" precision={2} valueStyle={{ color: "#faad14" }} />
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Statistic title="Net Amount" value={totals.netAmount} prefix="฿" precision={2} valueStyle={{ color: "#1890ff", fontSize: "24px" }} />
            </Col>
          </Row>

          <Divider />

          <Space style={{ width: "100%", justifyContent: "flex-end" }}>
            <Button size="large" onClick={() => setPurchaseItems([])}>
              Clear All
            </Button>
            <Button
              type="primary"
              size="large"
              icon={<SaveOutlined />}
              loading={loading}
              onClick={handleSubmitPurchase}
            >
              Create Purchase Order
            </Button>
          </Space>
        </Card>
      )}

      {purchaseNumber && (
        <Alert
          message={`✅ Purchase Order Created: ${purchaseNumber}`}
          type="success"
          showIcon
          closable
          style={{ marginBottom: 16 }}
        />
      )}

      {/* Stock Inventory Display */}
      <Card
        title={
          <Space>
            <InboxOutlined />
            <span>Current Stock Inventory</span>
          </Space>
        }
      >
        <Table
          columns={stockColumns}
          dataSource={stockData}
          rowKey="id"
          pagination={{ pageSize: 20, showSizeChanger: true }}
          scroll={{ x: 1000 }}
        />
      </Card>
    </Layout>
  );
}
