---
description: Implement Import Management System
---

## Overview
This workflow implements a system to manage product imports, specifically designed for ordering from China, tracking production, partial shipments, and calculating dynamic costs.

## Backend Implementation

### 1. Models
- **Supplier Schema** (`server/models/supplier.js`)
    - Name, Contact Info
    - Address
    - Notes
- **Import Schema** (`server/models/import.js`)
    - `orderNumber` (String, Unique)
    - `supplier` (Ref to Supplier)
    - `orderDate` (Date)
    - `status` (Enum: 'Draft', 'Ongoing', 'Completed', 'Cancelled')
    - `items` (Array)
        - `modelName` (String)
        - `quantityPerCtn` (Number)
        - `ctn` (Number)
        - `totalQuantity` (Number)
        - `priceRMB` (Number)
        - `totalAmountRMB` (Number)
        - `perCtnWeight` (Number)
        - `totalCtnWeight` (Number)
    - `costs` (Object)
        - `rmbRate` (Number)
        - `taxPerItem` (Number)
        - `labourBillPerCtn` (Number)
        - `otherCosts` (Number)
    - `payments` (Array)
        - `amount` (Number)
        - `date` (Date)
        - `note` (String)
    - `shipments` (Array)
        - `status` (Enum: 'Shipped', 'Received')
        - `sentDate` (Date)
        - `receivedDate` (Date)
        - `items` (Array of { modelName, quantity })

### 2. Routes
- **Import Routes** (`server/routes/api/import.js`)
    - GET `/` - List all imports
    - POST `/add` - Create new import order
    - GET `/:id` - Get details
    - PUT `/:id` - Update details (items, costs)
    - POST `/:id/payment` - Add payment
    - POST `/:id/shipment` - Create shipment
    - POST `/:id/receive` - Receive shipment & Update Stock

## Frontend Implementation

### 1. Navigation
- Add "Import Management" to the sidebar/dashboard menu.

### 2. Pages
- **Import List** (`client/app/containers/Import/List.js`)
    - Table showing recent import orders, status, and summary.
- **Import Details/Edit** (`client/app/containers/Import/Edit.js`)
    - Complex form with tabs/sections:
        - **Order Items**: Excel-like grid to add/edit products.
        - **Costing**: Fields for RMB Rate, Tax, Labor.
        - **Financials**: Ledger view (Total Order Value vs Total Paid).
        - **Shipments**: List of shipments with "Receive" action.

### 3. Logic
- **Cost Calculation**:
    - `BuyingPriceBDT = (PriceRMB * RMBRate) + TaxPerItem + (LabourPerCtn / QtyPerCtn)`
- **Stock Update**:
    - When receiving a shipment, find the Product by `modelName`.
    - Update `product.quantity += receivedQty`.
    - Update `product.buyingPrice` = `CalculatedBuyingPrice`.
