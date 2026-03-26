import React, { useEffect, useState } from "react";
import { Modal, Form, Input, Select, InputNumber, Checkbox, Button, Row, Col, Spin } from "antd";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axios from "axios";
import { getHeaders } from "../../utility/getHeader";
import fetchData from "../../functions/fetchData";
import { fetchComboData, fetchComboDataWithWhere } from "../../services/api";

const { TextArea } = Input;

const EditItemModal = ({ isOpen, item, onClose, onItemUpdated }) => {
  const [form] = Form.useForm();
  const [getTax, setTax] = useState([]);
  const [getUnit, setUnits] = useState([]);
  const [getQuantityTypes, setQuantityTypes] = useState([]);
  const [getCategory, setCategory] = useState([]);
  const [getSubCategory, setSubCategory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(false);

  // Populate form data when item changes
  useEffect(() => {
    if (item && isOpen) {
      form.setFieldsValue({
        iname: item.iname || "",
        unit: item.unit || "",
        quantity_type: item.weight || "",
        tax: item.tax || "",
        mrp: item.mrp || "",
        offerprice: item.offerprice || "",
        category: item.catid || "",
        subcat: item.subcatid || "",
        description: item.description || "",
        isstockable: item.isstockable || false,
        min_stock: item.min_stock || "",
      });
    }
  }, [item, isOpen, form]);

  // Fetch dropdown data when modal opens
  useEffect(() => {
    const fetchDropdownData = async () => {
      if (!isOpen) return;
      
      setFetchingData(true);
      try {
        // Fetch taxes, units, quantity types, and categories
        const [taxes, units, quantityTypes, categories] = await Promise.all([
          fetchData("taxes", null, "id", {}),
          fetchComboData("units", "name"),
          fetchComboData("quantity_type", "name"), // Fetch quantity types
          fetchComboData("categories", "name"),
        ]);
        
        setTax(taxes || []);
        setUnits(units || []);
        setQuantityTypes(quantityTypes || []);
        setCategory(categories || []);
        
        // If there's an item with a category, fetch subcategories immediately
        if (item && item.catid) {
          try {
            const subCats = await fetchComboDataWithWhere("subcategory", "subcat", {
              cat_id: item.catid
            });
            setSubCategory(subCats || []);
          } catch (error) {
            console.error("Error fetching subcategories for item:", error);
            setSubCategory([]);
          }
        }
      } catch (error) {
        console.error("Error fetching dropdown data:", error);
        toast.error("Failed to load form data");
      } finally {
        setFetchingData(false);
      }
    };

    fetchDropdownData();
  }, [isOpen, item]);

  // Handle category change to fetch subcategories
  const handleCategoryChange = async (categoryId) => {
    form.setFieldsValue({ subcat: undefined });
    
    if (categoryId) {
      try {
        const subCats = await fetchComboDataWithWhere("subcategory", "subcat", {
          cat_id: categoryId
        });
        setSubCategory(subCats || []);
      } catch (error) {
        console.error("Error fetching subcategories:", error);
        setSubCategory([]);
      }
    } else {
      setSubCategory([]);
    }
  };

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      form.resetFields();
      setSubCategory([]);
    }
  }, [isOpen, form]);

  const handleSubmit = async (values) => {
    setLoading(true);
    
    const requestBody = {
      iname: values.iname,
      unit: values.unit,
      weight: values.quantity_type,
      tax: values.tax,
      mrp: values.mrp,
      offerprice: values.offerprice,
      catid: values.category,
      subcatid: values.subcat,
      description: values.description,
      isstockable: values.isstockable || false,
      min_stock: values.min_stock || "",
    };

    try {
      const response = await axios.put(
        `/updatecommondata/items/id/${item.id}`,
        requestBody,
        getHeaders()
      );

      if (response.status === 200) {
        toast.success("Item updated successfully!");
        onItemUpdated();
        onClose();
      }
    } catch (error) {
      console.error("Error updating item:", error);
      toast.error("Failed to update item. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    form.resetFields();
    onClose();
  };

  if (!item) return null;

  return (
    <Modal
      title="Edit Item"
      open={isOpen}
      onCancel={handleClose}
      width={800}
      footer={null}
      destroyOnClose
    >
      <Spin spinning={fetchingData} tip="Loading form data...">
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          autoComplete="off"
        >
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                label="Item Name"
                name="iname"
                rules={[{ required: true, message: "Please enter item name" }]}
              >
                <Input placeholder="Enter item name" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                label="Unit"
                name="unit"
                rules={[{ required: true, message: "Please select unit" }]}
              >
                <Select placeholder="Select unit" showSearch>
                  {getUnit.map((unit) => (
                    <Select.Option key={unit.id} value={unit.name}>
                      {unit.name}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                label="Quantity Type"
                name="quantity_type"
              >
                <Select placeholder="Select quantity type" allowClear showSearch>
                  {getQuantityTypes.map((qt) => (
                    <Select.Option key={qt.id} value={qt.name}>
                      {qt.name}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                label="Tax"
                name="tax"
                rules={[{ required: true, message: "Please select tax" }]}
              >
                <Select placeholder="Select tax" showSearch>
                  {getTax.map((tax) => (
                    <Select.Option key={tax.id} value={tax.taxrate}>
                      {tax.taxname} ({tax.taxrate}%)
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                label="MRP"
                name="mrp"
                rules={[
                  { required: true, message: "Please enter MRP" },
                  { type: "number", min: 0, message: "MRP must be positive" }
                ]}
              >
                <InputNumber
                  placeholder="Enter MRP"
                  style={{ width: "100%" }}
                  min={0}
                  precision={2}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                label="Offer Price"
                name="offerprice"
                rules={[
                  { required: true, message: "Please enter offer price" },
                  { type: "number", min: 0, message: "Offer price must be positive" }
                ]}
              >
                <InputNumber
                  placeholder="Enter offer price"
                  style={{ width: "100%" }}
                  min={0}
                  precision={2}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                label="Category"
                name="category"
                rules={[{ required: true, message: "Please select category" }]}
              >
                <Select
                  placeholder="Select category"
                  showSearch
                  onChange={handleCategoryChange}
                >
                  {getCategory.map((cat) => (
                    <Select.Option key={cat.id} value={cat.id}>
                      {cat.name}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item label="Sub Category" name="subcat">
                <Select placeholder="Select sub category" showSearch allowClear>
                  {getSubCategory.map((subcat) => (
                    <Select.Option key={subcat.id} value={subcat.id}>
                      {subcat.subcat}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24}>
              <Form.Item label="Description" name="description">
                <TextArea
                  rows={3}
                  placeholder="Enter description"
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item name="isstockable" valuePropName="checked">
                <Checkbox>Is Stockable</Checkbox>
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item label="Minimum Stock" name="min_stock">
                <InputNumber
                  placeholder="Enter minimum stock"
                  style={{ width: "100%" }}
                  min={0}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row justify="end" gutter={8}>
            <Col>
              <Button onClick={handleClose} disabled={loading}>
                Cancel
              </Button>
            </Col>
            <Col>
              <Button type="primary" htmlType="submit" loading={loading}>
                Update Item
              </Button>
            </Col>
          </Row>
        </Form>
      </Spin>
    </Modal>
  );
};

export default EditItemModal;
