import React from 'react';
import { connect } from 'react-redux';
import { success, error, warning } from 'react-notification-system-redux';
import actions from '../../actions';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { Button } from 'reactstrap';
import { API_URL } from '../../constants';
import SupplierList from '../Supplier/List';
import '../Supplier/SupplierOrders.css';
import '../Courier/Steadfast.css';

class ImportList extends React.Component {
    state = {
        imports: [],
        products: [],
        isLoading: true,
        activeTab: 'on_the_way', // 'on_the_way', 'order_history', 'suppliers'
        historyYear: new Date().getFullYear(),
        isSubmitting: false,
        shipmentInvestments: [],

        // Modal states
        isAddItemModalOpen: false,
        isEditItemModalOpen: false,
        selectedShipment: null,
        selectedItem: null,
        selectedImportId: null,

        // Costing settings (defaults)
        costs: {
            rmbRate: 17.5,
            labourBillPerCtn: 0,
            taxType: 'per_item',
            taxValue: 0
        },

        // Form states
        newItem: {
            product: '',
            modelName: '',
            shortName: '',
            quantityPerCtn: 0,
            ctn: 0,
            quantity: 0,
            priceRMB: 0,
            priceBDT: 0,
            perCtnWeight: 0
        },

        // Search and Add
        productSearch: '',
        isProductDropdownOpen: false,
        selectedProductIndex: -1,

        // Shipped Move Modal
        isSelectShipmentModalOpen: false,
        openShipments: [],
        targetShipmentId: 'new',
        selectedMoveParams: null,

        // Date Edits
        editingReceivedDate: null,
        editingShippedDate: null,

        // Revert button
        showRevertButton: null,

        // Cargo
        cargos: [],
        isCargoModalOpen: false,
        isAddCargoModalOpen: false,
        shipmentToComplete: null,
        selectedCargoId: '',
        newCargo: {
            name: '',
            contactNumber: '',
            address: '',
            email: '',
            notes: ''
        },

        // Investment
        investors: [],
        selectedInvestorId: '',
        investedAmount: 0,
        profitSharePercentage: 50
    };

    componentDidMount() {
        this.fetchImports();
        this.fetchProducts();
        this.fetchCargos();
        this.fetchInvestors();
        this.fetchShipmentInvestments();
    }

    fetchImports = async () => {
        try {
            this.setState({ isLoading: true });
            const response = await axios.get(`${API_URL}/import`);
            this.setState({ imports: response.data.imports || [], isLoading: false });
        } catch (error) {
            console.error('Error fetching imports:', error);
            this.setState({ isLoading: false });
        }
    };

    fetchProducts = async () => {
        try {
            const response = await axios.get(`${API_URL}/product?limit=0`);
            this.setState({ products: response.data.products || [] });
        } catch (error) {
            console.error('Error fetching products:', error);
        }
    };

    fetchCargos = async () => {
        try {
            const response = await axios.get(`${API_URL}/cargo`);
            this.setState({ cargos: response.data.cargos || [] });
        } catch (error) {
            console.error('Error fetching cargos:', error);
        }
    };

    fetchInvestors = async () => {
        try {
            const response = await axios.get(`${API_URL}/investor`);
            this.setState({ investors: response.data.investors || [] });
        } catch (error) {
            console.error('Error fetching investors:', error);
        }
    };

    fetchShipmentInvestments = async () => {
        try {
            const response = await axios.get(`${API_URL}/investment`);
            this.setState({ shipmentInvestments: response.data.investments || [] });
        } catch (error) {
            console.error('Error fetching investments:', error);
        }
    };

    // --- Helpers ---

    calculateBDTPrice = (priceRMB, quantityPerCtn = 0, perCtnWeight = 0, costs = null) => {
        const useCosts = costs || this.state.costs;
        const rmbRate = useCosts.rmbRate || 0;
        const rawPriceBDT = priceRMB * rmbRate;

        let taxPerItem = 0;
        if (useCosts.taxType === 'per_item') {
            taxPerItem = useCosts.taxValue || 0;
        } else if (useCosts.taxType === 'per_kg' && perCtnWeight > 0 && quantityPerCtn > 0) {
            const weightPerItem = perCtnWeight / quantityPerCtn;
            taxPerItem = weightPerItem * (useCosts.taxValue || 0);
        }

        let laborPerItem = 0;
        if (useCosts.labourBillPerCtn > 0 && quantityPerCtn > 0) {
            laborPerItem = useCosts.labourBillPerCtn / quantityPerCtn;
        }

        return Math.round((rawPriceBDT + taxPerItem + laborPerItem) * 100) / 100;
    };

    calculateShipmentTotals = (items, costs) => {
        const totalQty = items.reduce((sum, item) => sum + (item.quantity || 0), 0);
        const totalCtn = items.reduce((sum, item) => sum + (item.ctn || 0), 0);
        const totalRMB = items.reduce((sum, item) => sum + ((item.quantity || 0) * (item.priceRMB || 0)), 0);
        const totalBDT = items.reduce((sum, item) => sum + ((item.quantity || 0) * (item.priceBDT || 0)), 0);

        const rmbRate = costs ? (costs.rmbRate || 0) : 0;
        const totalProductPrice = totalRMB * rmbRate;
        const totalTax = totalBDT - totalProductPrice;

        return { totalQty, totalCtn, totalRMB, totalBDT, totalProductPrice, totalTax };
    };

    formatCurrency = (amount, currency = 'BDT') => {
        if (currency === 'RMB') {
            return `¥${(amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        }
        return `৳${(amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    // --- Data Flattening ---

    getAllShipments = () => {
        const { imports, shipmentInvestments } = this.state;
        const allShipments = [];

        imports.forEach(imp => {
            if (imp.shipments) {
                imp.shipments.forEach(shipment => {
                    const inv = shipmentInvestments.find(i => i.shipmentId === shipment.shipmentId);
                    allShipments.push({
                        ...shipment,
                        importId: imp._id,
                        orderNumber: imp.orderNumber,
                        supplierName: imp.supplier ? imp.supplier.name : 'Unknown Supplier',
                        supplier: imp.supplier,
                        costs: imp.costs, // Pass down parental costs
                        investorName: inv && inv.investor ? inv.investor.name : null,
                        investorAmount: inv ? inv.capitalAmount : 0
                    });
                });
            }
        });

        return allShipments.sort((a, b) => {
            const dateA = a.shipmentDate || a.created;
            const dateB = b.shipmentDate || b.created;
            return new Date(dateB) - new Date(dateA);
        });
    };

    // --- Actions (Duplicated from SupplierOrders) ---

    validateItemFields = (item) => {
        if (!item.product) return 'Please select a product. You can create a new one using the + button if needed.';
        if (!item.quantityPerCtn || Number(item.quantityPerCtn) <= 0) return 'Please enter Quantity per Carton (must be greater than 0)';
        if (!item.ctn || Number(item.ctn) <= 0) return 'Please enter number of Cartons';
        if (!item.perCtnWeight || Number(item.perCtnWeight) <= 0) return 'Please enter Weight per Carton';
        if (!item.priceRMB || Number(item.priceRMB) <= 0) return 'Please enter Price in RMB per piece';
        return null;
    };

    handleAddItem = async () => {
        const { selectedImportId, selectedShipment, newItem, isSubmitting } = this.state;
        if (isSubmitting) return;

        const err = this.validateItemFields(newItem);
        if (err) { this.props.warning({ title: err, position: 'tr', autoDismiss: 5 }); return; }

        try {
            this.setState({ isSubmitting: true });
            const sId = (selectedShipment.shipmentId || selectedShipment._id)?.toString();
            await axios.put(`${API_URL}/import/${selectedImportId}/shipment/${sId}/item`, {
                product: newItem.product,
                modelName: newItem.modelName,
                shortName: newItem.shortName,
                quantity: newItem.quantity,
                priceRMB: newItem.priceRMB,
                priceBDT: newItem.priceBDT,
                quantityPerCtn: newItem.quantityPerCtn,
                ctn: newItem.ctn,
                perCtnWeight: newItem.perCtnWeight
            });
            this.closeModals();
            this.fetchImports();
        } catch (error) {
            this.props.error({ title: 'Error adding item: ' + (error.response?.data?.error || err.message), position: 'tr', autoDismiss: 5 });
        } finally {
            this.setState({ isSubmitting: false });
        }
    };

    handleEditItem = async () => {
        const { selectedImportId, selectedShipment, newItem } = this.state;
        const err = this.validateItemFields(newItem);
        if (err) { this.props.warning({ title: err, position: 'tr', autoDismiss: 5 }); return; }

        try {
            const sId = (selectedShipment.shipmentId || selectedShipment._id)?.toString();
            await axios.put(`${API_URL}/import/${selectedImportId}/shipment/${sId}/item`, {
                product: newItem.product,
                modelName: newItem.modelName,
                shortName: newItem.shortName,
                quantity: newItem.quantity,
                priceRMB: newItem.priceRMB,
                priceBDT: newItem.priceBDT,
                quantityPerCtn: newItem.quantityPerCtn,
                ctn: newItem.ctn,
                perCtnWeight: newItem.perCtnWeight
            });
            this.closeModals();
            this.fetchImports();
        } catch (error) {
            this.props.error({ title: 'Error updating item: ' + (error.response?.data?.error || err.message), position: 'tr', autoDismiss: 5 });
        }
    };

    handleDeleteItem = async (importId, shipmentId, itemId) => {
        if (!window.confirm('Are you sure you want to delete this item?')) return;
        try {
            const sidStr = shipmentId?.toString() || shipmentId;
            await axios.delete(`${API_URL}/import/${importId}/shipment/${sidStr}/item/${itemId}`);
            this.fetchImports();
        } catch (error) {
            this.props.error({ title: 'Error deleting item: ' + (error.response?.data?.error || err.message), position: 'tr', autoDismiss: 5 });
        }
    };

    handleMoveItemToShipped = (importId, shipmentId, itemId) => {
        const { imports } = this.state;
        const currentOrder = imports.find(i => i._id === importId);

        // Find open (not completed) shipped shipments for THIS supplier/order
        const openShipped = currentOrder?.shipments?.filter(s =>
            s.status === 'Shipped' && s.isCompleted !== true
        ) || [];

        if (openShipped.length > 0) {
            this.setState({
                isSelectShipmentModalOpen: true,
                openShipments: openShipped,
                targetShipmentId: openShipped[0].shipmentId || openShipped[0]._id,
                selectedMoveParams: { importId, shipmentId, itemId }
            });
        } else {
            this.confirmMoveToShipped(importId, shipmentId, itemId, 'new');
        }
    };

    confirmMoveToShipped = async (importId, shipmentId, itemId, targetShipmentId) => {
        try {
            const sidStr = shipmentId?.toString() || shipmentId;
            const itemStr = itemId?.toString() || itemId;
            await axios.post(`${API_URL}/import/${importId}/shipment/${sidStr}/item/${itemStr}/move-to-shipped`, {
                targetShipmentId: targetShipmentId
            });
            this.closeModals();
            this.fetchImports();
        } catch (error) {
            this.props.error({ title: 'Error: ' + (error.response?.data?.error || err.message), position: 'tr', autoDismiss: 5 });
        }
    };

    submitMoveToShippedModal = () => {
        const { selectedMoveParams, targetShipmentId } = this.state;
        if (!selectedMoveParams) return;
        this.confirmMoveToShipped(selectedMoveParams.importId, selectedMoveParams.shipmentId, selectedMoveParams.itemId, targetShipmentId);
    };

    handleMarkShipped = async (importId, shipmentId) => {
        if (!window.confirm('Mark entire shipment as shipped?')) return;
        try {
            const sidStr = shipmentId?.toString() || shipmentId;
            await axios.put(`${API_URL}/import/${importId}/shipment/${sidStr}/mark-shipped`);
            this.fetchImports();
        } catch (error) {
            this.props.error({ title: 'Error: ' + (error.response?.data?.error || err.message), position: 'tr', autoDismiss: 5 });
        }
    };

    handleCompleteShipment = (importId, shipmentId) => {
        this.setState({
            isCargoModalOpen: true,
            shipmentToComplete: { importId, shipmentId },
            selectedCargoId: ''
        });
    };

    handleConfirmCompleteShipment = async () => {
        const { shipmentToComplete, selectedCargoId, selectedInvestorId, investedAmount, profitSharePercentage, imports } = this.state;
        if (!shipmentToComplete) return;

        try {
            this.setState({ isSubmitting: true });
            await axios.post(`${API_URL}/import/${shipmentToComplete.importId}/shipment/${shipmentToComplete.shipmentId}/complete`, {
                cargo: selectedCargoId || null
            });

            if (selectedInvestorId && imports) {
                const imp = imports.find(i => i._id === shipmentToComplete.importId);
                const shipment = imp?.shipments?.find(s => (s._id || s.shipmentId)?.toString() === shipmentToComplete.shipmentId);

                if (shipment && shipment.items) {
                    const totals = this.calculateShipmentTotals(shipment.items);
                    await axios.post(`${API_URL}/investment/add`, {
                        investorId: selectedInvestorId,
                        importOrderId: shipmentToComplete.importId,
                        shipmentId: shipment.shipmentId,
                        capitalAmount: investedAmount,
                        totalShipmentCost: totals.totalBDT,
                        profitSharePercentage: profitSharePercentage
                    });
                }
            }

            this.setState({ isCargoModalOpen: false, shipmentToComplete: null, selectedCargoId: '', selectedInvestorId: '', investedAmount: 0, isSubmitting: false });
            this.fetchImports();
        } catch (error) {
            this.setState({ isSubmitting: false });
            this.props.error({ title: 'Error: ' + (error.response?.data?.error || err.message), position: 'tr', autoDismiss: 5 });
        }
    };

    handleUndoCompleteShipment = async (importId, shipmentId) => {
        try {
            const sidStr = shipmentId?.toString() || shipmentId;
            await axios.post(`${API_URL}/import/${importId}/shipment/${sidStr}/undo-complete`);
            this.fetchImports();
        } catch (error) {
            this.props.error({ title: 'Error reopening shipment: ' + (error.response?.data?.error || err.message), position: 'tr', autoDismiss: 5 });
        }
    };

    handleRevertToShipped = async (importId, shipmentId) => {
        if (!window.confirm('Revert this order to On The Way? Stock and prices will be undone.')) return;
        try {
            const sidStr = shipmentId?.toString() || shipmentId;
            await axios.post(`${API_URL}/import/${importId}/shipment/${sidStr}/undo-receive`);
            this.setState({ showRevertButton: null });
            this.fetchImports();
        } catch (error) {
            this.props.error({ title: 'Error reverting shipment: ' + (error.response?.data?.error || err.message), position: 'tr', autoDismiss: 5 });
        }
    };

    handleUndoShipped = async (importId, shipmentId, itemId) => {
        if (!window.confirm('Move this item back to the order window (pending list)?')) return;
        try {
            await axios.post(`${API_URL}/import/${importId}/shipment/${shipmentId}/item/${itemId}/undo-shipped`);
            this.fetchImports();
        } catch (error) {
            this.props.error({ title: 'Error: ' + (error.response?.data?.error || err.message), position: 'tr', autoDismiss: 5 });
        }
    };

    handleMarkReceived = async (importId, shipmentId) => {
        if (!window.confirm('Mark this shipment as received? Stock will be updated.')) return;
        try {
            await axios.post(`${API_URL}/import/${importId}/receive`, {
                shipmentId: shipmentId,
                receivedDate: new Date().toISOString()
            });
            this.fetchImports();
        } catch (error) {
            this.props.error({ title: 'Error: ' + (error.response?.data?.error || err.message), position: 'tr', autoDismiss: 5 });
        }
    };

    handleUpdateReceivedDate = async (importId, shipmentId, receivedDate) => {
        try {
            await axios.put(`${API_URL}/import/${importId}/shipment/${shipmentId}/received-date`, { receivedDate });
            this.setState({ editingReceivedDate: null });
            this.fetchImports();
        } catch (error) {
            this.props.error({ title: 'Error: ' + (error.response?.data?.error || err.message), position: 'tr', autoDismiss: 5 });
        }
    };

    handleUpdateShippedDate = async (importId, shipmentId, shippedDate) => {
        try {
            await axios.put(`${API_URL}/import/${importId}/shipment/${shipmentId}/shipped-date`, { shippedDate });
            this.setState({ editingShippedDate: null });
            this.fetchImports();
        } catch (error) {
            this.props.error({ title: 'Error: ' + (error.response?.data?.error || err.message), position: 'tr', autoDismiss: 5 });
        }
    };

    handleDeleteShipment = async (importId, shipmentId) => {
        if (!window.confirm('Delete this shipment?')) return;
        try {
            await axios.delete(`${API_URL}/import/${importId}/shipment/${shipmentId}`);
            this.fetchImports();
        } catch (error) {
            this.props.error({ title: 'Error: ' + (error.response?.data?.error || err.message), position: 'tr', autoDismiss: 5 });
        }
    };

    handleCreateCargo = async () => {
        const { newCargo } = this.state;
        if (!newCargo.name) return this.props.warning({ title: 'Cargo name is required', position: 'tr', autoDismiss: 3 });
        try {
            this.setState({ isSubmitting: true });
            const response = await axios.post(`${API_URL}/cargo/add`, newCargo);
            const savedCargo = response.data.cargo;
            this.setState(prevState => ({
                cargos: [...prevState.cargos, savedCargo],
                selectedCargoId: savedCargo._id,
                isAddCargoModalOpen: false,
                isSubmitting: false,
                newCargo: { name: '', contactNumber: '', address: '', email: '', notes: '' }
            }));
        } catch (error) {
            this.setState({ isSubmitting: false });
            this.props.error({ title: 'Error creating cargo: ' + (error.response?.data?.error || err.message), position: 'tr', autoDismiss: 5 });
        }
    };

    // --- Inputs & Modals ---

    openAddItemModal = (shipment, importId) => {
        // Use shipment specific costs if available, else default
        const costs = shipment.costs || this.state.costs;
        this.setState({
            isAddItemModalOpen: true,
            selectedShipment: shipment,
            selectedImportId: importId,
            costs: costs, // Update form costs to match shipment
            newItem: {
                product: '', modelName: '', shortName: '', quantityPerCtn: 0, ctn: 0,
                quantity: 0, priceRMB: 0, priceBDT: 0, perCtnWeight: 0
            }
        });
    };

    openEditItemModal = (shipment, importId, item) => {
        const costs = shipment.costs || this.state.costs;
        this.setState({
            isEditItemModalOpen: true,
            selectedShipment: shipment,
            selectedImportId: importId,
            selectedItem: item,
            costs: costs,
            newItem: {
                product: item.product,
                modelName: item.modelName,
                shortName: item.shortName,
                quantityPerCtn: item.quantityPerCtn || 0,
                ctn: item.ctn || 0,
                quantity: item.quantity,
                priceRMB: item.priceRMB || 0,
                priceBDT: item.priceBDT || 0,
                perCtnWeight: item.perCtnWeight || 0
            }
        });
    };

    closeModals = () => {
        this.setState({
            isAddItemModalOpen: false, isEditItemModalOpen: false, isSelectShipmentModalOpen: false,
            isCargoModalOpen: false, isAddCargoModalOpen: false, selectedShipment: null, selectedImportId: null,
            selectedItem: null, openShipments: [], selectedMoveParams: null, productSearch: '', shipmentToComplete: null
        });
    };

    handleProductSelect = (productId) => {
        const { products } = this.state;
        const product = products.find(p => p._id === productId);
        if (product) {
            const shortName = product.shortName || product.name || '';
            this.setState(prevState => ({
                newItem: {
                    ...prevState.newItem,
                    product: productId,
                    modelName: product.name,
                    shortName: shortName
                },
                productSearch: shortName,
                isProductDropdownOpen: false,
                selectedProductIndex: -1
            }));
        }
    };

    handleItemInputChange = (field, value) => {
        this.setState(prevState => {
            const updatedItem = { ...prevState.newItem };
            const numValue = Number(value) || 0;
            if (field === 'quantityPerCtn' || field === 'ctn') {
                updatedItem[field] = numValue;
                updatedItem.quantity = (updatedItem.quantityPerCtn || 0) * (updatedItem.ctn || 0);
                updatedItem.priceBDT = this.calculateBDTPrice(updatedItem.priceRMB, updatedItem.quantityPerCtn, updatedItem.perCtnWeight);
            } else if (field === 'priceRMB') {
                updatedItem.priceRMB = numValue;
                updatedItem.priceBDT = this.calculateBDTPrice(numValue, updatedItem.quantityPerCtn, updatedItem.perCtnWeight);
            } else if (field === 'perCtnWeight') {
                updatedItem.perCtnWeight = numValue;
                updatedItem.priceBDT = this.calculateBDTPrice(updatedItem.priceRMB, updatedItem.quantityPerCtn, numValue);
            } else if (field === 'quantity') {
                updatedItem.quantity = numValue;
            } else {
                updatedItem[field] = value;
            }
            return { newItem: updatedItem };
        });
    };

    handleCostingChange = (field, value) => {
        this.setState(prevState => ({
            costs: {
                ...prevState.costs,
                [field]: field === 'taxType' ? value : (Number(value) || 0)
            }
        }), () => {
            // Recalculate BDT Price if newItem is being edited
            if (this.state.newItem.priceRMB > 0) {
                this.setState(prevState => ({
                    newItem: {
                        ...prevState.newItem,
                        priceBDT: this.calculateBDTPrice(prevState.newItem.priceRMB, prevState.newItem.quantityPerCtn, prevState.newItem.perCtnWeight)
                    }
                }));
            }
        });
    };

    handleAddNewProduct = async (e) => {
        if (e) { e.preventDefault(); e.stopPropagation(); }
        const name = window.prompt('Enter New Product Name:');
        if (!name) return;
        try {
            this.setState({ isSubmitting: true });

            const formData = new FormData();
            formData.append('shortName', name);
            formData.append('name', name);
            formData.append('buyingPrice', 0);
            formData.append('quantity', 0);
            formData.append('price', 0);
            formData.append('isActive', false);

            const token = localStorage.getItem('token');
            const response = await axios.post(`${API_URL}/product/add`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'Authorization': token
                }
            });

            if (response.data.success) {
                const newProduct = response.data.product;
                this.setState(prevState => ({
                    products: [newProduct, ...prevState.products],
                    newItem: {
                        ...prevState.newItem,
                        product: newProduct._id,
                        modelName: newProduct.name,
                        shortName: newProduct.shortName || newProduct.name
                    },
                    productSearch: newProduct.shortName || newProduct.name,
                    isProductDropdownOpen: false
                }));
                this.props.success({ title: 'Product created and selected!', position: 'tr', autoDismiss: 3 });
            }
        } catch (error) {
            this.props.error({ title: 'Error creating product: ' + (error.response?.data?.error || error.message), position: 'tr', autoDismiss: 5 });
        } finally {
            this.setState({ isSubmitting: false });
        }
    };


    // --- UI Rendering ---

    renderShipmentCard = (shipment) => {
        const { activeTab } = this.state;
        const totals = this.calculateShipmentTotals(shipment.items || [], shipment.costs);
        const isPending = shipment.status === 'Pending';
        const isShipped = shipment.status === 'Shipped';
        const isReceived = shipment.status === 'Received';
        const sid = (shipment._id || shipment.shipmentId)?.toString();
        const impId = shipment.importId?.toString();

        if (activeTab === 'on_the_way') {
            return (
                <div className="shipment-card" key={sid || Math.random()}>
                    <div className="shipment-card__header" style={{ padding: '16px 24px', background: 'rgba(255,255,255,0.6)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '16px', fontSize: '13px', color: '#475569' }}>
                            {/* ID */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ height: '8px', width: '8px', borderRadius: '50%', background: '#3b82f6', boxShadow: '0 0 8px #3b82f6' }}></span>
                                <span style={{ fontFamily: 'monospace', fontWeight: '700', color: '#1e293b', fontSize: '15px' }}>
                                    {shipment.shipmentId}
                                </span>
                            </div>

                            <div style={{ width: '1px', height: '16px', background: '#e2e8f0' }}></div>

                            {/* Date */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#fff', padding: '6px 12px', borderRadius: '8px', border: '1px solid #f1f5f9', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}>
                                <i className="fa fa-calendar" style={{ color: '#94a3b8' }}></i>
                                <span>{new Date(shipment.shipmentDate || shipment.created).toLocaleDateString()}</span>
                            </div>

                            {/* Supplier */}
                            <Link to={`/dashboard/supplier/orders/${shipment.supplier?._id}`} style={{ textDecoration: 'none' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', color: '#6366f1', background: 'rgba(99, 102, 241, 0.08)', padding: '6px 12px', borderRadius: '8px', border: '1px solid rgba(99, 102, 241, 0.1)' }}>
                                    <i className="fa fa-building-o"></i>
                                    <span style={{ fontWeight: '600' }}>{shipment.supplierName}</span>
                                </div>
                            </Link>

                            {/* Cargo */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#0891b2', background: 'rgba(6, 182, 212, 0.1)', padding: '6px 12px', borderRadius: '8px', border: '1px solid rgba(6, 182, 212, 0.15)' }}>
                                <i className="fa fa-truck"></i>
                                <span style={{ fontWeight: '600' }}>{shipment.cargo ? shipment.cargo.name : 'No Cargo'}</span>
                            </div>

                            {/* Investor */}
                            {/* Investor */}
                            {shipment.investorName && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#7c3aed', background: 'rgba(124, 58, 237, 0.1)', padding: '6px 12px', borderRadius: '8px', border: '1px solid rgba(124, 58, 237, 0.15)' }}>
                                    <i className="fa fa-money"></i>
                                    <span style={{ fontWeight: '600' }}>{shipment.investorName} : {this.formatCurrency(shipment.investorAmount)}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    <table className="shipment-card__table">
                        <thead>
                            <tr>
                                <th>Product</th><th>Qty/Ctn</th><th>Ctn</th><th>Total Qty</th><th>RMB/pc</th><th>BDT/pc</th><th>Total BDT</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(shipment.items || []).map((item, idx) => {
                                const itemId = item._id?.toString() || idx;
                                return (
                                    <tr key={itemId}>
                                        <td><div className="shipment-card__product-name">{item.shortName || item.modelName}</div></td>
                                        <td>{item.quantityPerCtn || '-'}</td>
                                        <td>{item.ctn || '-'}</td>
                                        <td>{item.quantity}</td>
                                        <td className="shipment-card__price">{this.formatCurrency(item.priceRMB, 'RMB')}</td>
                                        <td className="shipment-card__price">{this.formatCurrency(item.priceBDT)}</td>
                                        <td className="shipment-card__total">{this.formatCurrency((item.quantity || 0) * (item.priceBDT || 0))}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>

                    <div className="shipment-card__footer">
                        <div className="shipment-card__footer-actions">
                            <button className="btn-neon btn-neon--green btn-neon--sm" onClick={() => this.handleMarkReceived(impId, sid)}><i className="fa fa-check"></i> Mark as Received</button>
                        </div>
                        <div className="shipment-card__summary">
                            <div className="shipment-card__summary-item"><div className="shipment-card__summary-label">Total Ctn</div><div className="shipment-card__summary-value">{totals.totalCtn}</div></div>
                            <div className="shipment-card__summary-item"><div className="shipment-card__summary-label">Product Price</div><div className="shipment-card__summary-value" style={{ color: '#64748b' }}>{this.formatCurrency(totals.totalProductPrice)}</div></div>
                            <div className="shipment-card__summary-item"><div className="shipment-card__summary-label">Total Tax</div><div className="shipment-card__summary-value" style={{ color: '#64748b' }}>{this.formatCurrency(totals.totalTax)}</div></div>
                            <div className="shipment-card__summary-item"><div className="shipment-card__summary-label">Total</div><div className="shipment-card__summary-value">{this.formatCurrency(totals.totalBDT)}</div></div>
                        </div>
                    </div>
                </div>
            );
        }

        return (
            <div className="shipment-card" key={sid || Math.random()}>
                <div className="shipment-card__header">
                    <div className="shipment-card__id">
                        <span className={`status-badge status-badge--${shipment.status.toLowerCase()}`}>
                            {shipment.status}
                        </span>
                        {shipment.isCompleted && isShipped && (
                            <span className="status-badge status-badge--completed" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', marginLeft: '8px', cursor: 'pointer' }}
                                onDoubleClick={() => this.handleUndoCompleteShipment(impId, sid)} title="Double-click to undo completed">
                                <i className="fa fa-lock"></i> COMPLETED
                            </span>
                        )}
                        {isReceived && (
                            <span className="status-badge status-badge--completed" style={{
                                background: this.state.showRevertButton === sid ? 'rgba(249, 115, 22, 0.15)' : 'rgba(16, 185, 129, 0.1)',
                                color: this.state.showRevertButton === sid ? '#ea580c' : '#10b981', marginLeft: '8px', cursor: 'pointer'
                            }}
                                onDoubleClick={() => this.setState({ showRevertButton: this.state.showRevertButton === sid ? null : sid })}
                                title="Double-click to show revert option">
                                <i className="fa fa-check-circle"></i> COMPLETED
                            </span>
                        )}
                        <div>
                            {/* Added Supplier Name here as requested */}
                            <div className="shipment-card__id-text">{shipment.shipmentId || 'No ID'}</div>
                            <Link to={`/dashboard/supplier/orders/${shipment.supplier?._id}`} style={{ textDecoration: 'none' }}>
                                <div style={{ fontSize: '12px', color: '#6366f1', fontWeight: 'bold', marginTop: '2px', cursor: 'pointer' }}>
                                    <i className="fa fa-building-o mr-1"></i> {shipment.supplierName}
                                </div>
                            </Link>
                            <div className="shipment-card__date">
                                {isPending && 'Created: '}
                                {isShipped && 'Shipped: '}
                                {isReceived && 'Received: '}
                                {new Date(isReceived ? shipment.receivedDate : (shipment.shipmentDate || shipment.created)).toLocaleDateString()}
                                {shipment.cargo && (
                                    <span className="shipment-card__cargo" style={{ marginLeft: '12px', padding: '2px 8px', background: 'rgba(6, 182, 212, 0.1)', color: '#06b6d4', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold' }}>
                                        <i className="fa fa-truck"></i> {shipment.cargo.name}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="shipment-card__date">
                        Order: {shipment.orderNumber}
                    </div>
                </div>

                <table className="shipment-card__table">
                    <thead>
                        <tr>
                            <th>Product</th><th>Qty/Ctn</th><th>Ctn</th><th>Total Qty</th><th>RMB/pc</th><th>BDT/pc</th><th>Total BDT</th>
                            {(isPending || isShipped) && <th>Actions</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {(shipment.items || []).map((item, idx) => {
                            const itemId = item._id?.toString() || idx;
                            return (
                                <tr key={itemId}>
                                    <td>
                                        <div className="shipment-card__product-name">{item.shortName || item.modelName}</div>
                                    </td>
                                    <td>{item.quantityPerCtn || '-'}</td>
                                    <td>{item.ctn || '-'}</td>
                                    <td>{item.quantity}</td>
                                    <td className="shipment-card__price">{this.formatCurrency(item.priceRMB, 'RMB')}</td>
                                    <td className="shipment-card__price">{this.formatCurrency(item.priceBDT)}</td>
                                    <td className="shipment-card__total">{this.formatCurrency((item.quantity || 0) * (item.priceBDT || 0))}</td>
                                    {isPending && (
                                        <td>
                                            <div className="shipment-card__actions">
                                                <button className="btn-icon btn-icon--ship" title="Move to Shipped" onClick={() => this.handleMoveItemToShipped(impId, sid, itemId)}><i className="fa fa-ship"></i></button>
                                                <button className="btn-icon btn-icon--edit" title="Edit" onClick={() => this.openEditItemModal(shipment, impId, item)}><i className="fa fa-pencil"></i></button>
                                                <button className="btn-icon btn-icon--delete" title="Delete" onClick={() => this.handleDeleteItem(impId, sid, itemId)}><i className="fa fa-trash"></i></button>
                                            </div>
                                        </td>
                                    )}
                                    {isShipped && (
                                        <td>
                                            <div className="shipment-card__actions">
                                                {!shipment.isCompleted && (
                                                    <button className="btn-icon btn-icon--undo" title="Undo" style={{ color: '#f59e0b', background: 'rgba(245, 158, 11, 0.1)' }} onClick={() => this.handleUndoShipped(impId, sid, itemId)}><i className="fa fa-reply"></i></button>
                                                )}
                                            </div>
                                        </td>
                                    )}
                                </tr>
                            );
                        })}
                        {(shipment.items || []).length === 0 && (
                            <tr><td colSpan={8} style={{ textAlign: 'center', color: '#64748b', padding: '30px' }}>No items in this shipment yet</td></tr>
                        )}
                    </tbody>
                </table>

                <div className="shipment-card__footer">
                    <div className="shipment-card__footer-actions">
                        {isPending && (
                            <>
                                <button className="btn-neon btn-neon--cyan btn-neon--sm" onClick={() => this.openAddItemModal(shipment, impId)}><i className="fa fa-plus"></i> Add Item</button>
                                {shipment.items && shipment.items.length > 0 && <button className="btn-neon btn-neon--orange btn-neon--sm" onClick={() => this.handleMarkShipped(impId, sid)}><i className="fa fa-ship"></i> Ship All</button>}
                                <button className="btn-neon btn-neon--sm" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)' }} onClick={() => this.handleDeleteShipment(impId, sid)}><i className="fa fa-trash"></i> Delete All</button>
                            </>
                        )}
                        {isShipped && (
                            <>
                                {shipment.isCompleted && (
                                    <button className="btn-neon btn-neon--green btn-neon--sm" onClick={() => this.handleMarkReceived(impId, sid)}><i className="fa fa-check"></i> Mark as Received</button>
                                )}
                                {!shipment.isCompleted && (
                                    <button className="btn-neon btn-neon--purple btn-neon--sm" onClick={() => this.handleCompleteShipment(impId, sid)}><i className="fa fa-check-square-o"></i> Shipment Complete</button>
                                )}
                            </>
                        )}
                        {isReceived && this.state.showRevertButton === sid && (
                            <button className="btn-neon btn-neon--sm" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)' }} onClick={() => this.handleRevertToShipped(impId, sid)}><i className="fa fa-undo"></i> Revert to On The Way</button>
                        )}
                    </div>
                    <div className="shipment-card__summary">
                        <div className="shipment-card__summary-item"><div className="shipment-card__summary-label">Total Items</div><div className="shipment-card__summary-value">{totals.totalQty}</div></div>
                        <div className="shipment-card__summary-item"><div className="shipment-card__summary-label">Total (RMB)</div><div className="shipment-card__summary-value shipment-card__summary-value--rmb">{this.formatCurrency(totals.totalRMB, 'RMB')}</div></div>
                        <div className="shipment-card__summary-item"><div className="shipment-card__summary-label">Total (BDT)</div><div className="shipment-card__summary-value">{this.formatCurrency(totals.totalBDT)}</div></div>
                    </div>
                </div>
            </div>
        );
    };

    renderTabs = () => {
        const { activeTab } = this.state;
        const allShipments = this.getAllShipments();
        const onTheWayCount = allShipments.filter(s => s.status === 'Pending' || s.status === 'Shipped').length;

        return (
            <div className="courier-selection-header" style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', background: '#fff', padding: '10px 20px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', marginBottom: '20px' }}>
                <div className="nav-shortcuts d-flex flex-wrap" style={{ gap: '8px' }}>
                    <button
                        className={`nav-tab ${activeTab === 'on_the_way' ? 'active' : ''}`}
                        onClick={() => this.setState({ activeTab: 'on_the_way' })}
                    >
                        <i className="fa fa-truck"></i> On The Way
                        {onTheWayCount > 0 && (
                            <span style={{
                                marginLeft: '8px',
                                background: activeTab === 'on_the_way' ? 'rgba(0,0,0,0.2)' : 'rgba(6, 182, 212, 0.1)',
                                color: activeTab === 'on_the_way' ? '#fff' : '#06b6d4',
                                padding: '2px 8px',
                                borderRadius: '12px',
                                fontSize: '11px',
                                fontWeight: 'bold'
                            }}>{onTheWayCount}</span>
                        )}
                    </button>

                    <button
                        className={`nav-tab ${activeTab === 'order_history' ? 'active' : ''}`}
                        onClick={() => this.setState({ activeTab: 'order_history' })}
                    >
                        <i className="fa fa-history"></i> Order History
                    </button>

                    <button
                        className={`nav-tab ${activeTab === 'suppliers' ? 'active' : ''}`}
                        onClick={() => this.setState({ activeTab: 'suppliers' })}
                    >
                        <i className="fa fa-users"></i> Suppliers
                    </button>
                </div>
            </div>
        );
    };

    renderAddItemModal = () => {
        const { isAddItemModalOpen, isEditItemModalOpen, products, newItem, costs, isProductDropdownOpen, productSearch, selectedProductIndex } = this.state;
        if (!isAddItemModalOpen && !isEditItemModalOpen) return null;
        const isEdit = isEditItemModalOpen;

        return (
            <div className="modal-overlay">
                <div className="modal-content modal-content--lg" onClick={e => e.stopPropagation()}>
                    <div className="modal-header">
                        <h3 className="modal-title">{isEdit ? 'Edit Item' : 'Add Item to Shipment'}</h3>
                        <button className="modal-close" onClick={this.closeModals}>&times;</button>
                    </div>
                    <div className="modal-body">
                        <div className="form-group" style={{ position: 'relative' }}>
                            <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span>Product</span>
                                <button className="btn-icon btn-icon--cyan" style={{ width: '24px', height: '24px' }} onClick={this.handleAddNewProduct} type="button"><i className="fa fa-plus"></i></button>
                            </label>
                            <input type="text" className="form-input" placeholder="Search product..."
                                value={isProductDropdownOpen ? productSearch : (newItem.shortName || '')}
                                onFocus={() => this.setState({ isProductDropdownOpen: true, productSearch: '' })}
                                onChange={(e) => this.setState({ productSearch: e.target.value, isProductDropdownOpen: true, selectedProductIndex: 0 })}
                            />
                            {isProductDropdownOpen && (
                                <div className="search-results-dropdown" style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff', border: '1px solid #ddd', maxHeight: '200px', overflowY: 'auto', zIndex: 100 }}>
                                    {products.filter(p => (p.shortName || p.name || '').toLowerCase().includes(productSearch.toLowerCase())).map(p => (
                                        <div key={p._id} onClick={() => this.handleProductSelect(p._id)} style={{ padding: '10px', borderBottom: '1px solid #eee', cursor: 'pointer' }}>{p.shortName || p.name}</div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className="form-row form-row--4">
                            <div className="form-group"><label className="form-label">Qty/Ctn</label><input type="number" className="form-input" value={newItem.quantityPerCtn} onChange={e => this.handleItemInputChange('quantityPerCtn', e.target.value)} /></div>
                            <div className="form-group"><label className="form-label">Cartons</label><input type="number" className="form-input" value={newItem.ctn} onChange={e => this.handleItemInputChange('ctn', e.target.value)} /></div>
                            <div className="form-group"><label className="form-label">Total Qty</label><input type="number" className="form-input form-input--readonly" value={newItem.quantity} readOnly /></div>
                            <div className="form-group"><label className="form-label">Weight/Ctn</label><input type="number" className="form-input" value={newItem.perCtnWeight} onChange={e => this.handleItemInputChange('perCtnWeight', e.target.value)} /></div>
                        </div>
                        <div className="form-row">
                            <div className="form-group"><label className="form-label">Price (RMB)</label><input type="number" className="form-input" value={newItem.priceRMB} onChange={e => this.handleItemInputChange('priceRMB', e.target.value)} /></div>
                            <div className="form-group"><label className="form-label">BDT Price</label><input type="number" className="form-input" value={newItem.priceBDT} readOnly /></div>
                        </div>
                        <div className="costing-section">
                            <div className="costing-section__title"><i className="fa fa-calculator"></i> Costing Settings</div>
                            <div className="form-row form-row--4">
                                <div className="form-group"><label className="form-label">RMB Rate</label><input type="number" className="form-input" value={costs.rmbRate} onChange={e => this.handleCostingChange('rmbRate', e.target.value)} /></div>
                                <div className="form-group"><label className="form-label">Labor/Ctn</label><input type="number" className="form-input" value={costs.labourBillPerCtn} onChange={e => this.handleCostingChange('labourBillPerCtn', e.target.value)} /></div>
                                <div className="form-group"><label className="form-label">Tax Type</label><select className="form-select" value={costs.taxType} onChange={e => this.handleCostingChange('taxType', e.target.value)}><option value="per_item">Per Item</option><option value="per_kg">Per KG</option></select></div>
                                <div className="form-group"><label className="form-label">Tax Value</label><input type="number" className="form-input" value={costs.taxValue} onChange={e => this.handleCostingChange('taxValue', e.target.value)} /></div>
                            </div>
                        </div>
                    </div>
                    <div className="modal-footer">
                        <button className="btn-neon" onClick={this.closeModals}>Cancel</button>
                        <button className="btn-neon btn-neon--cyan" onClick={isEdit ? this.handleEditItem : this.handleAddItem} disabled={this.state.isSubmitting}>{isEdit ? 'Save Changes' : 'Add Item'}</button>
                    </div>
                </div>
            </div>
        );
    };

    renderSelectShipmentModal = () => {
        const { isSelectShipmentModalOpen, openShipments, targetShipmentId } = this.state;
        if (!isSelectShipmentModalOpen) return null;
        return (
            <div className="modal-overlay">
                <div className="modal-content modal-content--sm" onClick={e => e.stopPropagation()}>
                    <div className="modal-header"><h3 className="modal-title">Select Target Shipment</h3><button className="modal-close" onClick={this.closeModals}>&times;</button></div>
                    <div className="modal-body">
                        <select className="form-input" value={targetShipmentId} onChange={e => this.setState({ targetShipmentId: e.target.value })}>
                            <option value="new">+ Create New Shipment</option>
                            {openShipments.map(s => <option key={s._id || s.shipmentId} value={s.shipmentId || s._id}>{s.shipmentId} ({(s.items || []).length} items)</option>)}
                        </select>
                    </div>
                    <div className="modal-footer"><button className="btn-neon btn-neon--cyan" onClick={this.submitMoveToShippedModal}>Move</button></div>
                </div>
            </div>
        );
    };

    renderCargoModal = () => {
        const { isCargoModalOpen, cargos, selectedCargoId, investors, selectedInvestorId, investedAmount, profitSharePercentage } = this.state;
        if (!isCargoModalOpen) return null;
        return (
            <div className="modal-overlay">
                <div className="modal-content" onClick={e => e.stopPropagation()}>
                    <div className="modal-header"><h3 className="modal-title">Shipment Logistics</h3><button className="modal-close" onClick={this.closeModals}>&times;</button></div>
                    <div className="modal-body">
                        <div className="form-group"><label className="form-label">Cargo</label><select className="form-select" value={selectedCargoId} onChange={e => this.setState({ selectedCargoId: e.target.value })}><option value="">None</option>{cargos.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}</select></div>
                        <div className="form-group"><label className="form-label">Investor</label><select className="form-select" value={selectedInvestorId} onChange={e => this.setState({ selectedInvestorId: e.target.value })}><option value="">None</option>{investors.map(i => <option key={i._id} value={i._id}>{i.name}</option>)}</select></div>
                        {selectedInvestorId && (
                            <div className="form-row"><div className="form-group"><label className="form-label">Amount</label><input type="number" className="form-input" value={investedAmount} onChange={e => this.setState({ investedAmount: Number(e.target.value) })} /></div>
                                <div className="form-group"><label className="form-label">Profit Share %</label><input type="number" className="form-input" value={profitSharePercentage} onChange={e => this.setState({ profitSharePercentage: Number(e.target.value) })} /></div></div>
                        )}
                    </div>
                    <div className="modal-footer"><button className="btn-neon btn-neon--green" onClick={this.handleConfirmCompleteShipment}>Confirm Complete</button></div>
                </div>
            </div>
        );
    }

    renderAddCargoModal = () => {
        if (!this.state.isAddCargoModalOpen) return null;
        return <div className="modal-overlay"><div className="modal-content modal-content--sm"><div className="modal-body"><input className="form-input" placeholder="Cargo Name" value={this.state.newCargo.name} onChange={e => this.handleCargoInputChange('name', e.target.value)} /></div><div className="modal-footer"><button className="btn-neon btn-neon--cyan" onClick={this.handleCreateCargo}>Save Cargo</button></div></div></div>;
    }

    handleCargoInputChange = (f, v) => this.setState(p => ({ newCargo: { ...p.newCargo, [f]: v } }));

    render() {
        const { activeTab, historyYear } = this.state;
        const allShipments = this.getAllShipments();

        let content;
        if (activeTab === 'on_the_way') {
            const onTheWay = allShipments.filter(s => s.status === 'Shipped' && s.isCompleted);
            content = (
                <div className="p-4" style={{ background: '#f8fafc', minHeight: '80vh' }}>

                    {onTheWay.length === 0 ? <div className="empty-state">No shipments on the way.</div> : onTheWay.map(s => this.renderShipmentCard(s))}
                </div>
            );
        } else if (activeTab === 'order_history') {
            const history = allShipments.filter(s => {
                if (s.status !== 'Received' && s.status !== 'Completed') return false; // Basic check
                const date = new Date(s.receivedDate || s.shipmentDate || s.created);
                return date.getFullYear() === historyYear;
            });
            content = (
                <div className="p-4" style={{ background: '#f8fafc', minHeight: '80vh' }}>
                    <div className="d-flex justify-content-between align-items-center mb-4">
                        <h3 style={{ color: '#1e293b' }}>History ({historyYear})</h3>
                        <div className="d-flex align-items-center bg-white p-2 rounded shadow-sm">
                            <button className="btn btn-sm btn-light" onClick={() => this.setState({ historyYear: historyYear - 1 })}><i className="fa fa-chevron-left"></i></button>
                            <span className="mx-3 font-weight-bold">{historyYear}</span>
                            <button className="btn btn-sm btn-light" onClick={() => this.setState({ historyYear: historyYear + 1 })}><i className="fa fa-chevron-right"></i></button>
                        </div>
                    </div>
                    {history.length === 0 ? <div className="empty-state">No history for this year.</div> : history.map(s => this.renderShipmentCard(s))}
                </div>
            );
        } else if (activeTab === 'suppliers') {
            content = <div className="p-3"><SupplierList {...this.props} /></div>;
        }

        return (
            <div className="import-management" style={{ padding: '0 24px 24px 24px', backgroundColor: '#f3f4f6', minHeight: 'calc(100vh - 80px)' }}>
                {this.renderTabs()}
                {content}
                {this.renderAddItemModal()}
                {this.renderSelectShipmentModal()}
                {this.renderCargoModal()}
                {this.renderAddCargoModal()}
            </div>
        );
    }
}

const mapStateToProps = state => ({
    user: state.account.user
});

const mapDispatchToProps = dispatch => ({
    ...actions(dispatch),
    success: opts => dispatch(success(opts)),
    error: opts => dispatch(error(opts)),
    warning: opts => dispatch(warning(opts)),
    dispatch
});

export default connect(mapStateToProps, mapDispatchToProps)(ImportList);
