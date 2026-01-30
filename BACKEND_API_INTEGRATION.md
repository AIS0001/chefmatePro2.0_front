# Backend API Integration Guide

## Overview

This guide explains how the frontend integrates with the backend stock management API.

## Backend API Endpoints

### Stock Management

#### 1. Add Stock
```javascript
POST /api/stock/add
Headers: Authorization: Bearer <token>
Body: {
  productId: number,
  unitId: number,
  quantity: number,
  referenceType: 'PURCHASE' | 'ADJUSTMENT',
  referenceId: string (optional),
  notes: string (optional)
}

Response: {
  success: true,
  message: "Stock added successfully",
  data: { ... }
}
```

**Frontend Usage:**
```javascript
const stockPayload = {
  productId: values.product_id,
  unitId: values.unit_id,
  quantity: parseFloat(values.quantity),
  referenceType: 'PURCHASE',
  referenceId: currentInvoice.refno,
  notes: `Purchase from supplier ${currentInvoice.supplier_id}`
};

const response = await axios.post("/api/stock/add", stockPayload, getHeaders());
```

#### 2. Remove Stock
```javascript
POST /api/stock/remove
Body: {
  productId: number,
  unitId: number,
  quantity: number,
  referenceType: 'SALE' | 'WASTE' | 'DAMAGE',
  referenceId: string,
  notes: string
}
```

#### 3. Remove Stock with Variant (for liquor sales)
```javascript
POST /api/stock/remove-variant
Body: {
  productId: number,
  variantId: number,  // e.g., 30ML peg variant ID
  quantity: number,    // how many pegs to sell
  referenceId: string, // bill ID
  notes: string
}
```

**Frontend Usage - Selling Pegs:**
```javascript
// When selling 2x 30ML pegs from whiskey
const salePayload = {
  productId: 126,
  variantId: 5,  // 30ML peg variant
  quantity: 2,
  referenceId: 'BILL-12345',
  notes: 'Sold 2 pegs'
};

await axios.post("/api/stock/remove-variant", salePayload, getHeaders());
// This will automatically deduct 60ML from the bottle stock
```

#### 4. Get Stock Level
```javascript
GET /api/stock/level/:productId
Query: ?unitId=optional

Response: {
  success: true,
  data: {
    productId: 126,
    currentStock: 7500.00,
    reservedStock: 0,
    availableStock: 7500.00,
    unitName: 'ML',
    lowStockAlert: false
  }
}
```

**Frontend Usage:**
```javascript
const stockResponse = await axios.get(`/api/stock/level/${productId}`, getHeaders());
form.setFieldsValue({
  opening_stock: stockResponse.data.data.currentStock || 0
});
```

#### 5. Get All Stock
```javascript
GET /api/stock/all
Query: ?categoryId=optional&minStock=true

Response: {
  success: true,
  data: [
    {
      id: 126,
      product_name: 'Black Label Whiskey',
      unit_id: 1,
      unit_name: 'Bottle',
      ml_capacity: 750,
      current_quantity: 10.00,
      reserved_quantity: 0,
      available_quantity: 10.00
    }
  ],
  count: 1
}
```

### Unit Management

#### 6. Get Product Units
```javascript
GET /api/stock/units/:productId

Response: {
  success: true,
  data: [
    {
      id: 1,
      product_id: 126,
      unit_name: 'Bottle',
      unit_type: 'BASE',
      is_base_unit: true,
      ml_capacity: 750,
      selling_price: 3000.00
    },
    {
      id: 2,
      product_id: 126,
      unit_name: '30ML Peg',
      unit_type: 'DERIVED',
      is_base_unit: false,
      ml_capacity: 30,
      selling_price: 150.00
    }
  ]
}
```

**Frontend Usage:**
```javascript
const response = await axios.get(`/api/stock/units/${productId}`, getHeaders());
if (response.data.success) {
  setUnits(response.data.data);
}
```

#### 7. Create Product Unit
```javascript
POST /api/stock/units/create
Body: {
  productId: number,
  unitName: string,
  unitType: 'BASE' | 'DERIVED',
  mlCapacity: number (optional),
  sellingPrice: number,
  purchasePrice: number,
  conversionFactor: number,
  isBaseUnit: boolean
}
```

**Frontend Usage - Creating Units:**
```javascript
// Create base unit (Bottle)
const baseUnitPayload = {
  productId: 126,
  unitName: 'Bottle',
  unitType: 'BASE',
  isBaseUnit: true,
  mlCapacity: 750,
  sellingPrice: 3000
};

await axios.post("/api/stock/units/create", baseUnitPayload, getHeaders());

// Create derived unit (30ML Peg)
const pegUnitPayload = {
  productId: 126,
  unitName: '30ML Peg',
  unitType: 'DERIVED',
  isBaseUnit: false,
  mlCapacity: 30,
  sellingPrice: 150,
  conversionFactor: 30 / 750  // 0.04
};

await axios.post("/api/stock/units/create", pegUnitPayload, getHeaders());
```

### Variant Management

#### 8. Get Product Variants
```javascript
GET /api/stock/variants/:productId

Response: {
  success: true,
  data: [
    {
      id: 1,
      product_id: 126,
      variant_name: '30ML Peg - Whiskey',
      base_unit_id: 1,
      quantity_in_base_unit: 0.04,
      ml_quantity: 30,
      selling_price: 150.00,
      cost_price: 120.00
    }
  ]
}
```

#### 9. Create Product Variant
```javascript
POST /api/stock/variants/create
Body: {
  productId: number,
  variantName: string,
  baseUnitId: number,
  quantityInBaseUnit: number,
  mlQuantity: number,
  sellingPrice: number,
  costPrice: number
}
```

**Frontend Usage:**
```javascript
const variantPayload = {
  productId: 126,
  variantName: '30ML Peg - Black Label',
  baseUnitId: 1,  // Bottle unit ID
  quantityInBaseUnit: 30 / 750,  // 0.04 bottles
  mlQuantity: 30,
  sellingPrice: 150,
  costPrice: 120
};

await axios.post("/api/stock/variants/create", variantPayload, getHeaders());
```

### Stock Reports

#### 10. Get Stock Report
```javascript
GET /api/stock/report/:productId

Response: {
  success: true,
  data: {
    product: { ... },
    currentStock: { ... },
    units: [ ... ],
    variants: [ ... ],
    recentTransactions: [ ... ]
  }
}
```

#### 11. Get Low Stock Alerts
```javascript
GET /api/stock/alerts/low-stock

Response: {
  success: true,
  data: [
    {
      product_id: 126,
      product_name: 'Black Label Whiskey',
      current_stock: 500,
      min_stock: 1000,
      deficit: -500
    }
  ],
  count: 1
}
```

#### 12. Get Transaction History
```javascript
GET /api/stock/history/:productId
Query: ?limit=20&offset=0&type=ADD|REMOVE|SALE

Response: {
  success: true,
  data: [
    {
      id: 1,
      transaction_type: 'ADD',
      quantity: 10.00,
      quantity_in_ml: 7500.00,
      reference_type: 'PURCHASE',
      reference_id: 'PO-001',
      notes: 'Purchase from supplier',
      unit_name: 'Bottle',
      transaction_date: '2026-01-29T10:00:00'
    }
  ]
}
```

## Frontend Implementation Examples

### Example 1: Adding Stock (Purchasing Bottles)

```javascript
// Component: newStockAntDesign.jsx

const handleSubmit = async (values) => {
  const stockPayload = {
    productId: values.product_id,      // 126 (Whiskey)
    unitId: values.unit_id,            // 1 (Bottle)
    quantity: 10,                      // 10 bottles
    referenceType: 'PURCHASE',
    referenceId: 'PO-2026-001',
    notes: 'Purchase from XYZ Supplier'
  };

  const response = await axios.post("/api/stock/add", stockPayload, getHeaders());
  
  if (response.data.success) {
    message.success("10 bottles (7,500 ML) added to stock!");
    // Stock balance will show: 7500 ML in base unit
  }
};
```

### Example 2: Creating Liquor Item with Units

```javascript
// Component: NewItemModalAnt.jsx

const handleSubmit = async (values) => {
  // Step 1: Create the product/item
  const itemPayload = {
    iname: 'Black Label Whiskey',
    unit: 'Bottle',
    tax: 7,
    catid: 5,
    isstockable: 1
  };

  const itemResponse = await axios.post("/insertdata/items", itemPayload, getHeaders());
  const productId = itemResponse.data.id;

  // Step 2: Create base unit (Bottle - 750ML)
  const baseUnitPayload = {
    productId,
    unitName: 'Bottle',
    unitType: 'BASE',
    isBaseUnit: true,
    mlCapacity: 750,
    sellingPrice: 3000
  };

  const baseUnitResponse = await axios.post(
    "/api/stock/units/create", 
    baseUnitPayload, 
    getHeaders()
  );

  const baseUnitId = baseUnitResponse.data.data.id;

  // Step 3: Create derived units (30ML Peg, 60ML Peg)
  const pegUnits = [
    { name: '30ML Peg', ml: 30, price: 150 },
    { name: '60ML Peg', ml: 60, price: 280 },
    { name: '90ML Large Peg', ml: 90, price: 400 }
  ];

  for (const peg of pegUnits) {
    // Create unit
    const pegUnitPayload = {
      productId,
      unitName: peg.name,
      unitType: 'DERIVED',
      isBaseUnit: false,
      mlCapacity: peg.ml,
      sellingPrice: peg.price,
      conversionFactor: peg.ml / 750
    };

    await axios.post("/api/stock/units/create", pegUnitPayload, getHeaders());

    // Create variant
    const variantPayload = {
      productId,
      variantName: `${peg.name} - Black Label`,
      baseUnitId,
      quantityInBaseUnit: peg.ml / 750,
      mlQuantity: peg.ml,
      sellingPrice: peg.price,
      costPrice: peg.price * 0.8
    };

    await axios.post("/api/stock/variants/create", variantPayload, getHeaders());
  }

  message.success("Liquor item created with all serving sizes!");
};
```

### Example 3: Selling Pegs (POS Integration)

```javascript
// When customer orders 2x 30ML pegs in POS

const handleSale = async (orderItem) => {
  // Get the variant ID for 30ML peg
  const variantsResponse = await axios.get(
    `/api/stock/variants/${orderItem.productId}`, 
    getHeaders()
  );
  
  const variant30ML = variantsResponse.data.data.find(
    v => v.ml_quantity === 30
  );

  // Remove stock using variant
  const salePayload = {
    productId: orderItem.productId,
    variantId: variant30ML.id,
    quantity: 2,  // 2 pegs
    referenceId: orderItem.billId,
    notes: 'Sold 2x 30ML pegs'
  };

  await axios.post("/api/stock/remove-variant", salePayload, getHeaders());
  
  // Backend automatically:
  // - Deducts 60ML from bottle stock
  // - Updates stock_balance
  // - Creates transaction log
  // - Checks low stock alerts
};
```

### Example 4: Real-time Stock Display

```javascript
const fetchStockLevel = async (productId) => {
  const response = await axios.get(
    `/api/stock/level/${productId}`, 
    getHeaders()
  );
  
  const { currentStock, unitName } = response.data.data;
  
  // Display: "Current Stock: 7,500 ML"
  // or "Current Stock: 500 cans"
  
  return {
    stock: currentStock,
    unit: unitName,
    display: `${currentStock.toFixed(2)} ${unitName}`
  };
};
```

## Database Structure

### Key Tables

1. **product_units** - Stores units for each product
2. **stock_balance** - Current stock levels per product per unit
3. **stock_transactions** - Transaction log (add/remove)
4. **product_variants** - Serving sizes (30ML peg, 60ML, etc.)
5. **stock_conversions** - Conversion rules between units

## Error Handling

```javascript
try {
  const response = await axios.post("/api/stock/add", payload, getHeaders());
  
  if (response.data.success) {
    message.success(response.data.message);
  }
} catch (error) {
  if (error.response) {
    // Backend returned error
    message.error(error.response.data.message);
  } else if (error.request) {
    // Network error
    message.error("Network error. Please check your connection.");
  } else {
    // Other errors
    message.error("An unexpected error occurred");
  }
}
```

## Testing Checklist

- [ ] Add stock (bottles)
- [ ] View stock level
- [ ] Remove stock (sale)
- [ ] Remove stock via variant (sell pegs)
- [ ] Create liquor item with units
- [ ] Create simple item (cans)
- [ ] View stock report
- [ ] Check low stock alerts
- [ ] View transaction history

## Common Issues

1. **401 Unauthorized**: Check authentication token in headers
2. **404 Not Found**: Verify API endpoint URL
3. **400 Bad Request**: Check request payload matches backend schema
4. **Stock not updating**: Ensure using correct productId and unitId

---

**Note**: All API calls require authentication. Use `getHeaders()` utility to include the Bearer token.
