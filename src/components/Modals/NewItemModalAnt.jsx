import React, { useEffect, useState } from "react";
import { 
  Modal, 
  Form, 
  Input, 
  Select, 
  Button, 
  Upload, 
  Row, 
  Col, 
  InputNumber,
  Space,
  Card,
  message,
  Divider,
  Tag
} from "antd";
import { 
  UploadOutlined, 
  PlusOutlined, 
  DeleteOutlined,
  SaveOutlined,
  CloseOutlined
} from "@ant-design/icons";
import axios from "axios";
import { getHeaders, getAuthToken, getResolvedShopId } from "../../utility/getHeader";
import fetchData from "../../functions/fetchData";
import { COMMON_LIQUOR_UNITS, COMMON_BOTTLE_SIZES } from "../../utility/unitConversions";

const { Option } = Select;
const { TextArea } = Input;

const NewItemModalAnt = ({ isOpen, onClose, onItemAdded }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [taxes, setTaxes] = useState([]);
  const [unitsList, setUnitsList] = useState([]);
  
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [showUnitConfig, setShowUnitConfig] = useState(false);
  const [unitType, setUnitType] = useState('simple');
  
  const [productUnits, setProductUnits] = useState([]);
  const [images, setImages] = useState([]);

  useEffect(() => {
    if (isOpen) {
      fetchInitialData();
    }
  }, [isOpen]);

  const fetchInitialData = async () => {
    try {
      const [categoriesData, taxesData, unitsData] = await Promise.all([
        fetchData("categories", null, "id", {}),
        fetchData("taxes", null, "id", {}),
        fetchData("units", null, "id", {})
      ]);
      
      setCategories(categoriesData || []);
      setTaxes(taxesData || []);
      setUnitsList(unitsData || []);
    } catch (error) {
      message.error("Failed to fetch initial data: " + error.message);
    }
  };

  const handleCategoryChange = async (categoryId) => {
    setSelectedCategory(categoryId);
    try {
      const subCategoriesData = await fetchData(
        "subcategory",
        null,
        "id",
        { cat_id: categoryId }
      );
      setSubCategories(subCategoriesData || []);
    } catch (error) {
      message.error("Failed to fetch subcategories: " + error.message);
    }
  };

  const handleUnitTypeChange = (value) => {
    setUnitType(value);
    if (value === 'convertible') {
      // Initialize with common liquor units
      setProductUnits(COMMON_LIQUOR_UNITS.map((u, idx) => ({
        id: idx,
        unitName: u.unit,
        mlCapacity: u.factor,
        sellingPrice: 0
      })));
    } else if (value === 'multiple') {
      // Initialize with one empty unit for multiple units configuration
      setProductUnits([{
        id: Date.now(),
        unitName: '',
        unitType: 'BASE',
        conversionFactor: 1,
        mlCapacity: null,
        purchasePrice: 0,
        sellingPrice: 0,
        isBaseUnit: true
      }]);
    } else {
      setProductUnits([]);
    }
  };

  const addProductUnit = () => {
    if (unitType === 'multiple') {
      setProductUnits([
        ...productUnits,
        {
          id: Date.now(),
          unitName: '',
          unitType: 'DERIVED',
          conversionFactor: 1,
          mlCapacity: null,
          purchasePrice: 0,
          sellingPrice: 0,
          isBaseUnit: false
        }
      ]);
    } else {
      setProductUnits([
        ...productUnits,
        {
          id: Date.now(),
          unitName: '',
          mlCapacity: 0,
          sellingPrice: 0
        }
      ]);
    }
  };

  const removeProductUnit = (id) => {
    setProductUnits(productUnits.filter(u => u.id !== id));
  };

  const updateProductUnit = (id, field, value) => {
    setProductUnits(productUnits.map(u => 
      u.id === id ? { ...u, [field]: value } : u
    ));
  };

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      // Create product/item
      const itemPayload = {
        iname: values.iname,
        unit: values.unit,
        tax: values.tax,
        catid: values.category,
        subcatid: values.subcat,
        description: values.desc,
        isstockable: values.isstockable ? 1 : 0,
        mrp: values.mrp || 0,
        offerprice: values.offerprice || 0
      };

      const itemResponse = await axios.post(
        "/insertdata/items",
        itemPayload,
        getHeaders()
      );

      const productId = itemResponse.data.id;
      console.log("✅ Item created with ID:", productId);

      // Always create a base unit for the item
      if (values.isstockable && unitType === 'convertible' && productUnits.length > 0) {
        console.log("📦 Creating units for convertible item (liquor)");
        
        // Create base unit (Bottle)
        const baseUnitPayload = {
          productId,
          unitName: 'Bottle',
          unitType: 'BASE',
          isBaseUnit: true,
          mlCapacity: values.bottle_capacity_ml,
          sellingPrice: 0,
          purchasePrice: 0
        };

        console.log("📦 Creating BASE unit:", baseUnitPayload);
        const baseUnitResponse = await axios.post(
          "/stock/units/create",
          baseUnitPayload,
          getHeaders()
        );

        const baseUnitId = baseUnitResponse.data.data.id;
        console.log("✅ Base unit created with ID:", baseUnitId);

        // Create derived units (pegs, etc.)
        console.log("📦 Creating", productUnits.length, "derived units...");
        for (const unit of productUnits) {
          if (unit.unitName && unit.mlCapacity > 0) {
            const unitPayload = {
              productId,
              unitName: unit.unitName,
              unitType: 'DERIVED',
              isBaseUnit: false,
              mlCapacity: unit.mlCapacity,
              sellingPrice: unit.sellingPrice || 0,
              purchasePrice: 0,
              conversionFactor: unit.mlCapacity / values.bottle_capacity_ml
            };

            console.log("📦 Creating DERIVED unit:", unitPayload);
            const derivedUnitResponse = await axios.post(
              "/stock/units/create",
              unitPayload,
              getHeaders()
            );
            console.log("✅ Derived unit created:", derivedUnitResponse.data);

            // Create product variant
            const variantPayload = {
              productId,
              variantName: unit.unitName,
              baseUnitId,
              quantityInBaseUnit: unit.mlCapacity / values.bottle_capacity_ml,
              mlQuantity: unit.mlCapacity,
              sellingPrice: unit.sellingPrice || 0,
              costPrice: 0
            };

            console.log("🏷️ Creating variant:", variantPayload);
            const variantResponse = await axios.post(
              "/stock/variants/create",
              variantPayload,
              getHeaders()
            );
            console.log("✅ Variant created:", variantResponse.data);
          }
        }
        console.log("✅ All units and variants created successfully!");
      } else if (values.isstockable && unitType === 'multiple' && productUnits.length > 0) {
        console.log("📦 Creating multiple units for item");
        
        // Create all units
        for (const unit of productUnits) {
          if (unit.unitName) {
            const unitPayload = {
              productId,
              unitName: unit.unitName,
              unitType: unit.unitType || 'DERIVED',
              isBaseUnit: unit.isBaseUnit || false,
              conversionFactor: unit.conversionFactor || 1,
              sellingPrice: unit.sellingPrice || 0,
              purchasePrice: unit.purchasePrice || 0
            };

            // Only include mlCapacity if it has a value > 0
            if (unit.mlCapacity && unit.mlCapacity > 0) {
              unitPayload.mlCapacity = unit.mlCapacity;
            }

            console.log("📦 Creating unit:", unitPayload);
            const unitResponse = await axios.post(
              "/stock/units/create",
              unitPayload,
              getHeaders()
            );
            console.log("✅ Unit created:", unitResponse.data);
          }
        }
        console.log("✅ All multiple units created successfully!");
      } else if (values.isstockable && unitType === 'simple') {
        console.log("📦 Creating simple unit for stockable item");
        
        // Create simple unit
        const simpleUnitPayload = {
          productId,
          unitName: values.unit,
          unitType: 'BASE',
          isBaseUnit: true,
          sellingPrice: values.offerprice || 0,
          purchasePrice: values.mrp || 0
        };

        console.log("📦 Creating simple unit:", simpleUnitPayload);
        const simpleUnitResponse = await axios.post(
          "/stock/units/create",
          simpleUnitPayload,
          getHeaders()
        );
        console.log("✅ Simple unit created:", simpleUnitResponse.data);
      } else {
        // For non-stockable items, still create a basic unit
        console.log("📦 Creating base unit for non-stockable item");
        
        const basicUnitPayload = {
          productId,
          unitName: values.unit,
          unitType: 'BASE',
          isBaseUnit: true,
          sellingPrice: values.offerprice || 0,
          purchasePrice: values.mrp || 0
        };

        console.log("📦 Creating basic unit:", basicUnitPayload);
        try {
          const basicUnitResponse = await axios.post(
            "/stock/units/create",
            basicUnitPayload,
            getHeaders()
          );
          console.log("✅ Basic unit created:", basicUnitResponse.data);
        } catch (unitError) {
          console.warn("⚠️ Unit creation failed (non-critical):", unitError.message);
          // Don't block item creation if unit fails
        }
      }

      // Auto-populate stock conversions for the product
      if (values.isstockable) {
        try {
          console.log("🔄 Populating stock conversions for product:", productId);
          const conversionResponse = await axios.post(
            `/stock/populate-conversions/${productId}`,
            {},
            getHeaders()
          );
          console.log("✅ Stock conversions populated successfully:", conversionResponse.data);
        } catch (conversionError) {
          console.warn("⚠️ Stock conversions auto-population failed (non-critical):", conversionError.message);
          // Don't block item creation if conversion population fails
        }
      }

      // Handle image uploads if any
      if (images.length > 0) {
        console.log("📸 Uploading", images.length, "images");
        const formData = new FormData();
        images.forEach((img, index) => {
          console.log(`📸 Image ${index + 1}:`, img.name, img.size, "bytes");
          // Use img directly since beforeUpload returns the file object
          formData.append("images", img);
        });
        formData.append("product_id", productId);

        // Log FormData contents
        console.log("📦 FormData contents:");
        for (let pair of formData.entries()) {
          console.log(pair[0], pair[1]);
        }

        // For FormData, only set Authorization header and shop_id params. Let axios handle Content-Type with multipart boundary
        const token = getAuthToken();
        const shopId = getResolvedShopId();
        const config = {
          headers: {
            Authorization: token && !token.startsWith('Bearer ') ? `Bearer ${token}` : token
          },
          ...(shopId ? { params: { shop_id: shopId } } : {})
        };
        await axios.post("/addnewproduct/item_images", formData, config);
        console.log("✅ Images uploaded successfully");
      }

      message.success("Item added successfully!");
      
      if (onItemAdded) {
        onItemAdded();
      }
      
      handleClose();
    } catch (error) {
      message.error("Failed to add item: " + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    form.resetFields();
    setImages([]);
    setProductUnits([]);
    setSubCategories([]);
    setSelectedCategory(null);
    setUnitType('simple');
    setShowUnitConfig(false);
    onClose();
  };

  const uploadProps = {
    beforeUpload: (file) => {
      setImages([...images, file]);
      return false;
    },
    onRemove: (file) => {
      setImages(images.filter(f => f.uid !== file.uid));
    },
    fileList: images,
  };

  return (
    <Modal
      title="Add New Item"
      open={isOpen}
      onCancel={handleClose}
      width={900}
      footer={null}
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{
          isstockable: false,
          unit_type: 'simple',
          vat: 7
        }}
      >
        <Row gutter={16}>
          <Col xs={24} sm={12}>
            <Form.Item
              label="Item Name"
              name="iname"
              rules={[{ required: true, message: 'Please enter item name' }]}
            >
              <Input placeholder="Enter item name" />
            </Form.Item>
          </Col>

          <Col xs={24} sm={12}>
            <Form.Item
              label="Unit"
              name="unit"
              rules={[{ required: true, message: 'Please select unit' }]}
            >
              <Select placeholder="Select Unit">
                {unitsList.map(unit => (
                  <Option key={unit.id} value={unit.name}>
                    {unit.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>

          <Col xs={24} sm={12}>
            <Form.Item
              label="Tax"
              name="tax"
              rules={[{ required: true, message: 'Please select tax' }]}
            >
              <Select placeholder="Select Tax">
                {taxes.map(tax => (
                  <Option key={tax.id} value={tax.taxvalue}>
                    {tax.taxname} ({tax.taxvalue}%)
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>

          <Col xs={24} sm={12}>
            <Form.Item
              label="MRP (Maximum Retail Price)"
              name="mrp"
              rules={[{ required: true, message: 'Please enter MRP' }]}
            >
              <InputNumber 
                placeholder="Enter MRP" 
                min={0}
                step={0.01}
                precision={2}
                style={{ width: '100%' }}
              />
            </Form.Item>
          </Col>

          <Col xs={24} sm={12}>
            <Form.Item
              label="Selling Price"
              name="offerprice"
              rules={[{ required: true, message: 'Please enter selling price' }]}
            >
              <InputNumber 
                placeholder="Enter selling price" 
                min={0}
                step={0.01}
                precision={2}
                style={{ width: '100%' }}
              />
            </Form.Item>
          </Col>

          <Col xs={24} sm={12}>
            <Form.Item
              label="Category"
              name="category"
              rules={[{ required: true, message: 'Please select category' }]}
            >
              <Select
                placeholder="Select Category"
                onChange={handleCategoryChange}
              >
                {categories.map(cat => (
                  <Option key={cat.id} value={cat.id}>
                    {cat.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>

          <Col xs={24} sm={12}>
            <Form.Item label="Sub Category" name="subcat">
              <Select placeholder="Select Sub Category" disabled={!selectedCategory}>
                {subCategories.map(sub => (
                  <Option key={sub.id} value={sub.id}>
                    {sub.subcat}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>

          <Col xs={24} sm={12}>
            <Form.Item label="Description" name="desc">
              <TextArea rows={2} placeholder="Item description" />
            </Form.Item>
          </Col>

          <Col xs={24} sm={12}>
            <Form.Item label="Is Stockable?" name="isstockable" valuePropName="checked">
              <Select onChange={(value) => setShowUnitConfig(value)}>
                <Option value={false}>No</Option>
                <Option value={true}>Yes</Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>

        {/* Unit Configuration for Stockable Items */}
        {showUnitConfig && (
          <>
            <Divider>Unit Configuration</Divider>
            
            <Row gutter={16}>
              <Col xs={24} sm={12}>
                <Form.Item label="Unit Type" name="unit_type">
                  <Select onChange={handleUnitTypeChange}>
                    <Option value="simple">Simple (Single Unit)</Option>
                    <Option value="multiple">Multiple Units (Cases/Cans/Bottles)</Option>
                    <Option value="convertible">Convertible (Liquor with ML)</Option>
                  </Select>
                </Form.Item>
              </Col>

              {unitType === 'convertible' && (
                <Col xs={24} sm={12}>
                  <Form.Item
                    label="Bottle Capacity (ML)"
                    name="bottle_capacity_ml"
                    rules={[{ required: true, message: 'Please select bottle capacity' }]}
                  >
                    <Select placeholder="Select Bottle Size">
                      {COMMON_BOTTLE_SIZES.map((size, idx) => (
                        <Option key={idx} value={size.value}>
                          {size.label}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
              )}
            </Row>

            {unitType === 'convertible' && productUnits.length > 0 && (
              <Card title="Sale Units Configuration" size="small">
                {productUnits.map((unit) => (
                  <Row gutter={8} key={unit.id} style={{ marginBottom: 8 }}>
                    <Col span={10}>
                      <Input
                        placeholder="Unit name (e.g., 30ML Peg)"
                        value={unit.unitName}
                        onChange={(e) => updateProductUnit(unit.id, 'unitName', e.target.value)}
                      />
                    </Col>
                    <Col span={6}>
                      <InputNumber
                        placeholder="ML"
                        value={unit.mlCapacity}
                        onChange={(value) => updateProductUnit(unit.id, 'mlCapacity', value)}
                        style={{ width: '100%' }}
                      />
                    </Col>
                    <Col span={6}>
                      <InputNumber
                        placeholder="Price"
                        value={unit.sellingPrice}
                        onChange={(value) => updateProductUnit(unit.id, 'sellingPrice', value)}
                        prefix="฿"
                        style={{ width: '100%' }}
                      />
                    </Col>
                    <Col span={2}>
                      <Button
                        type="text"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => removeProductUnit(unit.id)}
                      />
                    </Col>
                  </Row>
                ))}
                <Button
                  type="dashed"
                  onClick={addProductUnit}
                  icon={<PlusOutlined />}
                  block
                  style={{ marginTop: 8 }}
                >
                  Add Sale Unit
                </Button>
              </Card>
            )}

            {/* Multiple Units Configuration */}
            {unitType === 'multiple' && (
              <Card title="Multiple Units Configuration" size="small" style={{ marginTop: 16 }}>
                <Space direction="vertical" style={{ width: '100%' }}>
                  {productUnits.map((unit, index) => (
                    <Card key={unit.id} type="inner" size="small" 
                      title={`Unit ${index + 1}`}
                      extra={
                        productUnits.length > 1 && (
                          <Button
                            type="text"
                            danger
                            icon={<DeleteOutlined />}
                            onClick={() => removeProductUnit(unit.id)}
                          />
                        )
                      }
                    >
                      <Row gutter={8}>
                        <Col span={8}>
                          <label>Unit Name</label>
                          <Input
                            placeholder="e.g., Crate, Can, Bottle"
                            value={unit.unitName}
                            onChange={(e) => updateProductUnit(unit.id, 'unitName', e.target.value)}
                          />
                        </Col>
                        <Col span={6}>
                          <label>Unit Type</label>
                          <Select
                            value={unit.unitType}
                            onChange={(value) => updateProductUnit(unit.id, 'unitType', value)}
                            style={{ width: '100%' }}
                          >
                            <Option value="BASE">BASE</Option>
                            <Option value="DERIVED">DERIVED</Option>
                          </Select>
                        </Col>
                        <Col span={5}>
                          <label>Conversion</label>
                          <InputNumber
                            placeholder="Factor"
                            value={unit.conversionFactor}
                            onChange={(value) => updateProductUnit(unit.id, 'conversionFactor', value)}
                            min={0}
                            step={0.01}
                            style={{ width: '100%' }}
                            disabled={unit.unitType === 'BASE'}
                          />
                        </Col>
                        <Col span={5}>
                          <label>ML Capacity</label>
                          <InputNumber
                            placeholder="Optional"
                            value={unit.mlCapacity}
                            onChange={(value) => updateProductUnit(unit.id, 'mlCapacity', value)}
                            min={0}
                            style={{ width: '100%' }}
                          />
                        </Col>
                      </Row>
                      <Row gutter={8} style={{ marginTop: 8 }}>
                        <Col span={8}>
                          <label>Purchase Price</label>
                          <InputNumber
                            placeholder="Purchase Price"
                            value={unit.purchasePrice}
                            onChange={(value) => updateProductUnit(unit.id, 'purchasePrice', value)}
                            prefix="฿"
                            min={0}
                            step={0.01}
                            style={{ width: '100%' }}
                          />
                        </Col>
                        <Col span={8}>
                          <label>Selling Price</label>
                          <InputNumber
                            placeholder="Selling Price"
                            value={unit.sellingPrice}
                            onChange={(value) => updateProductUnit(unit.id, 'sellingPrice', value)}
                            prefix="฿"
                            min={0}
                            step={0.01}
                            style={{ width: '100%' }}
                          />
                        </Col>
                        <Col span={8}>
                          <label>Is Base Unit?</label>
                          <Select
                            value={unit.isBaseUnit}
                            onChange={(value) => updateProductUnit(unit.id, 'isBaseUnit', value)}
                            style={{ width: '100%' }}
                          >
                            <Option value={true}>Yes</Option>
                            <Option value={false}>No</Option>
                          </Select>
                        </Col>
                      </Row>
                    </Card>
                  ))}
                  <Button
                    type="dashed"
                    onClick={addProductUnit}
                    icon={<PlusOutlined />}
                    block
                  >
                    Add Another Unit
                  </Button>
                </Space>
              </Card>
            )}
          </>
        )}

        <Divider>Images</Divider>

        <Form.Item label="Upload Images">
          <Upload
            {...uploadProps}
            listType="picture-card"
            multiple
          >
            <div>
              <UploadOutlined />
              <div style={{ marginTop: 8 }}>Upload</div>
            </div>
          </Upload>
        </Form.Item>

        <Form.Item>
          <Space>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              icon={<SaveOutlined />}
            >
              Add Item
            </Button>
            <Button onClick={handleClose} icon={<CloseOutlined />}>
              Cancel
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default NewItemModalAnt;
