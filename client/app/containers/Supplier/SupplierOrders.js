import React from 'react';
import { connect } from 'react-redux';
import { success, error, warning } from 'react-notification-system-redux';
import actions from '../../actions';
import axios from 'axios';
import { API_URL } from '../../constants';
import './SupplierOrders.css';
import '../Courier/Steadfast.css';

class SupplierOrders extends React.Component {
    state = {
        supplier: null,
        imports: [],
        products: [],
        isLoading: true,
        activeTab: 'pending', // pending, shipped, received
        isSubmitting: false,

        // Modal states
        isAddItemModalOpen: false,
        isEditItemModalOpen: false,
        selectedShipment: null,
        selectedItem: null,
        selectedImportId: null,

        // Costing settings (from the import order)
        costs: {
            rmbRate: 17.5, // Default RMB to BDT rate
            labourBillPerCtn: 0,
            taxType: 'per_item', // 'per_item', 'per_kg'
            taxValue: 0
        },

        // Form states for adding/editing item
        newItem: {
            product: '',
            modelName: '',
            shortName: '',
            quantityPerCtn: 0,
            ctn: 0,
            quantity: 0, // total quantity = quantityPerCtn * ctn
            priceRMB: 0,
            priceBDT: 0, // Calculated field
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
        selectedMoveParams: null, // { importId, shipmentId, itemId }

        // Received date edit
        editingReceivedDate: null,

        // Shipped date edit
        editingShippedDate: null,

        // Revert button for received shipments (double-click)
        showRevertButton: null, // shipmentId of the shipment showing revert button

        // Cargo selection state
        cargos: [],
        isCargoModalOpen: false,
        isAddCargoModalOpen: false,
        shipmentToComplete: null, // { importId, shipmentId }
        selectedCargoId: '',
        newCargo: {
            name: '',
            contactNumber: '',
            address: '',
            email: '',
            notes: ''
        },

        // Investment state
        investors: [],
        selectedInvestorId: '',
        investedAmount: 0,
        profitSharePercentage: 50
    };

    componentDidMount() {
        const { id } = this.props.match.params;

        // Load lasted saved costs from localStorage
        const savedCosts = localStorage.getItem('lastShipmentCosts');
        if (savedCosts) {
            try {
                this.setState({ costs: JSON.parse(savedCosts) });
            } catch (e) {
                console.error('Error parsing saved costs');
            }
        }

        this.fetchSupplier(id);
        this.fetchImports(id);
        this.fetchProducts();
        this.fetchCargos();
        this.fetchInvestors();
    }

    fetchInvestors = async () => {
        try {
            const response = await axios.get(`${API_URL}/investor`);
            this.setState({ investors: response.data.investors || [] });
        } catch (error) {
            console.error('Error fetching investors:', error);
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

    handleCargoInputChange = (field, value) => {
        this.setState(prevState => ({
            newCargo: {
                ...prevState.newCargo,
                [field]: value
            }
        }));
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
                newCargo: {
                    name: '',
                    contactNumber: '',
                    address: '',
                    email: '',
                    notes: ''
                }
            }));
        } catch (error) {
            this.setState({ isSubmitting: false });
            this.props.error({ title: 'Error creating cargo: ' + (error.response?.data?.error || error.message), position: 'tr', autoDismiss: 5 });
        }
    };

    fetchSupplier = async (supplierId) => {
        try {
            const response = await axios.get(`${API_URL}/supplier`);
            const suppliers = response.data.suppliers || [];
            const supplier = suppliers.find(s => s._id === supplierId);
            this.setState({ supplier });
        } catch (error) {
            console.error('Error fetching supplier:', error);
        }
    };

    fetchImports = async (supplierId) => {
        try {
            this.setState({ isLoading: true });
            const response = await axios.get(`${API_URL}/import/by-supplier/${supplierId}`);
            const imports = response.data.imports || [];

            // If no costs saved in localStorage yet, use one from an existing order
            const savedCosts = localStorage.getItem('lastShipmentCosts');
            if (!savedCosts && imports.length > 0 && imports[0].costs) {
                this.setState({ costs: imports[0].costs });
            }

            this.setState({ imports, isLoading: false });
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

    getShipmentsByStatus = (status) => {
        const { imports } = this.state;
        const shipmentsList = [];

        imports.forEach(imp => {
            if (imp.shipments) {
                imp.shipments.forEach(shipment => {
                    if (shipment.status === status) {
                        shipmentsList.push({
                            ...shipment,
                            importId: imp._id,
                            orderNumber: imp.orderNumber,
                            costs: imp.costs
                        });
                    }
                });
            }
        });

        return shipmentsList.sort((a, b) => {
            const dateA = a.shipmentDate || a.created;
            const dateB = b.shipmentDate || b.created;
            return new Date(dateB) - new Date(dateA);
        });
    };

    // Calculate buying price in BDT based on costing factors
    calculateBDTPrice = (priceRMB, quantityPerCtn = 0, perCtnWeight = 0) => {
        const { costs } = this.state;
        const rmbRate = costs.rmbRate || 0;
        const rawPriceBDT = priceRMB * rmbRate;

        let taxPerItem = 0;
        if (costs.taxType === 'per_item') {
            taxPerItem = costs.taxValue || 0;
        } else if (costs.taxType === 'per_kg' && perCtnWeight > 0 && quantityPerCtn > 0) {
            const weightPerItem = perCtnWeight / quantityPerCtn;
            taxPerItem = weightPerItem * (costs.taxValue || 0);
        }

        let laborPerItem = 0;
        if (costs.labourBillPerCtn > 0 && quantityPerCtn > 0) {
            laborPerItem = costs.labourBillPerCtn / quantityPerCtn;
        }

        return Math.round((rawPriceBDT + taxPerItem + laborPerItem) * 100) / 100;
    };

    // Create new pending shipment
    handleCreatePendingShipment = async (importId) => {
        try {
            await axios.post(`${API_URL}/import/${importId}/shipment/create-pending`);
            this.fetchImports(this.props.match.params.id);
        } catch (error) {
            this.props.error({ title: 'Error creating shipment: ' + (error.response?.data?.error || err.message), position: 'tr', autoDismiss: 5 });
        }
    };

    validateItemFields = (item) => {
        if (!item.product) return 'Please select a product. You can create a new one using the + button if needed.';
        if (!item.quantityPerCtn || Number(item.quantityPerCtn) <= 0) return 'Please enter Quantity per Carton (must be greater than 0)';
        if (!item.ctn || Number(item.ctn) <= 0) return 'Please enter number of Cartons';
        if (!item.perCtnWeight || Number(item.perCtnWeight) <= 0) return 'Please enter Weight per Carton';
        if (!item.priceRMB || Number(item.priceRMB) <= 0) return 'Please enter Price in RMB per piece';
        return null;
    };

    // Add item to shipment
    handleAddItem = async () => {
        const { selectedImportId, selectedShipment, newItem, isSubmitting } = this.state;
        if (isSubmitting) return;

        const err = this.validateItemFields(newItem);
        if (err) {
            this.props.warning({ title: err, position: 'tr', autoDismiss: 5 });
            return;
        }

        try {
            this.setState({ isSubmitting: true });
            const sId = (selectedShipment.shipmentId || selectedShipment._id)?.toString();
            const impId = selectedImportId?.toString();
            await axios.put(`${API_URL}/import/${impId}/shipment/${sId}/item`, {
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
            this.fetchImports(this.props.match.params.id);
        } catch (error) {
            this.props.error({ title: 'Error adding item: ' + (error.response?.data?.error || err.message), position: 'tr', autoDismiss: 5 });
        } finally {
            this.setState({ isSubmitting: false });
        }
    };

    // Edit item in shipment
    handleEditItem = async () => {
        const { selectedImportId, selectedShipment, newItem } = this.state;
        const err = this.validateItemFields(newItem);
        if (err) {
            this.props.warning({ title: err, position: 'tr', autoDismiss: 5 });
            return;
        }

        try {
            const sId = (selectedShipment.shipmentId || selectedShipment._id)?.toString();
            const impId = selectedImportId?.toString();
            await axios.put(`${API_URL}/import/${impId}/shipment/${sId}/item`, {
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
            setTimeout(() => this.fetchImports(this.props.match.params.id), 500);
        } catch (error) {
            this.props.error({ title: 'Error updating item: ' + (error.response?.data?.error || err.message), position: 'tr', autoDismiss: 5 });
        }
    };

    // Delete item from shipment
    handleDeleteItem = async (importId, shipmentId, itemId) => {
        if (!window.confirm('Are you sure you want to delete this item?')) return;

        try {
            const sidStr = shipmentId?.toString() || shipmentId;
            console.log('handleDeleteItem called:', { importId, shipmentId: sidStr, itemId });
            await axios.delete(`${API_URL}/import/${importId}/shipment/${sidStr}/item/${itemId}`);
            setTimeout(() => this.fetchImports(this.props.match.params.id), 500);
        } catch (error) {
            console.error('Delete item error:', err);
            this.props.error({ title: 'Error deleting item: ' + (error.response?.data?.error || err.message), position: 'tr', autoDismiss: 5 });
        }
    };

    // Move single item to shipped list
    handleMoveItemToShipped = (importId, shipmentId, itemId) => {
        const { imports } = this.state;
        const currentOrder = imports.find(i => i._id === importId);

        // Find open (not completed) shipped shipments for this supplier
        const openShipped = currentOrder?.shipments?.filter(s =>
            s.status === 'Shipped' && s.isCompleted !== true
        ) || [];

        // If there are open shipped shipments, show selection modal
        if (openShipped.length > 0) {
            this.setState({
                isSelectShipmentModalOpen: true,
                openShipments: openShipped,
                targetShipmentId: openShipped[0].shipmentId || openShipped[0]._id, // default to first open
                selectedMoveParams: { importId, shipmentId, itemId }
            });
        } else {
            // If no open shipment, proceed with 'new' or default auto-create logic
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
            setTimeout(() => this.fetchImports(this.props.match.params.id), 800);
        } catch (error) {
            console.error('Move item error:', err);
            this.props.error({ title: 'Error: ' + (error.response?.data?.error || err.message), position: 'tr', autoDismiss: 5 });
        }
    };

    submitMoveToShippedModal = () => {
        const { selectedMoveParams, targetShipmentId } = this.state;
        if (!selectedMoveParams) return;

        this.confirmMoveToShipped(
            selectedMoveParams.importId,
            selectedMoveParams.shipmentId,
            selectedMoveParams.itemId,
            targetShipmentId
        );
    };

    // Mark whole shipment as shipped (for batch operation)
    handleMarkShipped = async (importId, shipmentId) => {
        if (!window.confirm('Mark entire shipment as shipped?')) return;

        try {
            const sidStr = shipmentId?.toString() || shipmentId;
            console.log('handleMarkShipped called:', { importId, shipmentId: sidStr });
            await axios.put(`${API_URL}/import/${importId}/shipment/${sidStr}/mark-shipped`);
            setTimeout(() => this.fetchImports(this.props.match.params.id), 800);
        } catch (error) {
            console.error('Ship all error:', err);
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

            // 1. Mark shipment as complete
            await axios.post(`${API_URL}/import/${shipmentToComplete.importId}/shipment/${shipmentToComplete.shipmentId}/complete`, {
                cargo: selectedCargoId || null
            });

            // 2. If investor selected, record investment
            if (selectedInvestorId && imports) {
                const imp = imports.find(i => i._id === shipmentToComplete.importId);
                if (imp && imp.shipments) {
                    const shipment = imp.shipments.find(s =>
                        (s._id || s.shipmentId)?.toString() === shipmentToComplete.shipmentId
                    );
                    if (shipment && shipment.items) {
                        const totals = this.calculateShipmentTotals(shipment.items);

                        await axios.post(`${API_URL}/investment/add`, {
                            investorId: selectedInvestorId,
                            importOrderId: shipmentToComplete.importId,
                            shipmentId: shipment.shipmentId, // Save the user-friendly ID (e.g. S1)
                            capitalAmount: investedAmount,
                            totalShipmentCost: totals.totalBDT,
                            profitSharePercentage: profitSharePercentage
                        });
                    }
                }
            }

            this.setState({
                isCargoModalOpen: false,
                shipmentToComplete: null,
                selectedCargoId: '',
                selectedInvestorId: '',
                investedAmount: 0,
                isSubmitting: false
            });

            setTimeout(() => this.fetchImports(this.props.match.params.id), 500);
        } catch (error) {
            this.setState({ isSubmitting: false });
            this.props.error({ title: 'Error: ' + (error.response?.data?.error || err.message), position: 'tr', autoDismiss: 5 });
        }
    };

    handleUndoCompleteShipment = async (importId, shipmentId) => {
        try {
            const sidStr = shipmentId?.toString() || shipmentId;
            await axios.post(`${API_URL}/import/${importId}/shipment/${sidStr}/undo-complete`);
            setTimeout(() => this.fetchImports(this.props.match.params.id), 500);
        } catch (error) {
            console.error('Error reopening shipment:', err);
            this.props.error({ title: 'Error reopening shipment: ' + (error.response?.data?.error || err.message), position: 'tr', autoDismiss: 5 });
        }
    };

    // Revert received shipment back to shipped (undo stock and average price)
    handleRevertToShipped = async (importId, shipmentId) => {
        if (!window.confirm('Are you sure you want to revert this order to On The Way? Stock and buying prices will be undone.')) return;

        try {
            const sidStr = shipmentId?.toString() || shipmentId;
            await axios.post(`${API_URL}/import/${importId}/shipment/${sidStr}/undo-receive`);
            this.setState({ showRevertButton: null });
            setTimeout(() => this.fetchImports(this.props.match.params.id), 500);
        } catch (error) {
            console.error('Error reverting shipment:', err);
            this.props.error({ title: 'Error reverting shipment: ' + (error.response?.data?.error || err.message), position: 'tr', autoDismiss: 5 });
        }
    };

    // Toggle showing revert button for received shipments (double-click)
    handleCompletedDoubleClick = (shipmentId) => {
        this.setState(prevState => ({
            showRevertButton: prevState.showRevertButton === shipmentId ? null : shipmentId
        }));
    };

    // Undo shipping for an item
    handleUndoShipped = async (importId, shipmentId, itemId) => {
        if (!window.confirm('Move this item back to the order window (pending list)?')) return;

        try {
            await axios.post(`${API_URL}/import/${importId}/shipment/${shipmentId}/item/${itemId}/undo-shipped`);
            setTimeout(() => this.fetchImports(this.props.match.params.id), 800);
        } catch (error) {
            this.props.error({ title: 'Error: ' + (error.response?.data?.error || err.message), position: 'tr', autoDismiss: 5 });
        }
    };

    // Mark shipment as received
    handleMarkReceived = async (importId, shipmentId) => {
        if (!window.confirm('Mark this shipment as received? Stock will be updated.')) return;

        try {
            console.log('Marking as received:', { importId, shipmentId });
            await axios.post(`${API_URL}/import/${importId}/receive`, {
                shipmentId: shipmentId,
                receivedDate: new Date().toISOString()
            });
            setTimeout(() => this.fetchImports(this.props.match.params.id), 1000);
        } catch (error) {
            console.error('Receive error:', err);
            this.props.error({ title: 'Error: ' + (error.response?.data?.error || err.message), position: 'tr', autoDismiss: 5 });
        }
    };

    // Update received date
    handleUpdateReceivedDate = async (importId, shipmentId, receivedDate) => {
        try {
            await axios.put(`${API_URL}/import/${importId}/shipment/${shipmentId}/received-date`, { receivedDate });
            this.setState({ editingReceivedDate: null });
            setTimeout(() => this.fetchImports(this.props.match.params.id), 500);
        } catch (error) {
            this.props.error({ title: 'Error: ' + (error.response?.data?.error || err.message), position: 'tr', autoDismiss: 5 });
        }
    };

    // Update shipped date
    handleUpdateShippedDate = async (importId, shipmentId, shippedDate) => {
        try {
            await axios.put(`${API_URL}/import/${importId}/shipment/${shipmentId}/shipped-date`, { shippedDate });
            this.setState({ editingShippedDate: null });
            setTimeout(() => this.fetchImports(this.props.match.params.id), 500);
        } catch (error) {
            this.props.error({ title: 'Error: ' + (error.response?.data?.error || err.message), position: 'tr', autoDismiss: 5 });
        }
    };

    // Delete shipment
    handleDeleteShipment = async (importId, shipmentId) => {
        if (!window.confirm('Delete this shipment?')) return;

        try {
            console.log('handleDeleteShipment called:', { importId, shipmentId });
            await axios.delete(`${API_URL}/import/${importId}/shipment/${shipmentId}`);
            setTimeout(() => this.fetchImports(this.props.match.params.id), 500);
        } catch (error) {
            this.props.error({ title: 'Error: ' + (error.response?.data?.error || err.message), position: 'tr', autoDismiss: 5 });
        }
    };

    // Modal handlers
    openAddItemModal = (shipment, importId) => {
        this.setState({
            isAddItemModalOpen: true,
            selectedShipment: shipment,
            selectedImportId: importId,
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
            }
        });
    };

    openEditItemModal = (shipment, importId, item) => {
        this.setState({
            isEditItemModalOpen: true,
            selectedShipment: shipment,
            selectedImportId: importId,
            selectedItem: item,
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
            isAddItemModalOpen: false,
            isEditItemModalOpen: false,
            isSelectShipmentModalOpen: false,
            isCargoModalOpen: false,
            isAddCargoModalOpen: false,
            selectedShipment: null,
            selectedImportId: null,
            selectedItem: null,
            openShipments: [],
            selectedMoveParams: null,
            productSearch: '',
            shipmentToComplete: null,
            selectedCargoId: ''
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

    handleProductSearchKeyDown = (e, filteredProducts) => {
        const { selectedProductIndex } = this.state;
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            this.setState({
                selectedProductIndex: (selectedProductIndex + 1) % filteredProducts.length,
                isProductDropdownOpen: true
            });
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            this.setState({
                selectedProductIndex: (selectedProductIndex - 1 + filteredProducts.length) % filteredProducts.length,
                isProductDropdownOpen: true
            });
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (selectedProductIndex >= 0 && filteredProducts[selectedProductIndex]) {
                this.handleProductSelect(filteredProducts[selectedProductIndex]._id);
            }
        } else if (e.key === 'Escape') {
            this.setState({ isProductDropdownOpen: false });
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

    // Clear 0 value on focus for number inputs
    handleInputFocus = (e) => {
        if (e.target.value === '0') {
            e.target.value = '';
        }
    };

    handleCostingChange = (field, value) => {
        this.setState(prevState => ({
            costs: {
                ...prevState.costs,
                [field]: field === 'taxType' ? value : (Number(value) || 0)
            }
        }), () => {
            // Save to localStorage for persistence
            localStorage.setItem('lastShipmentCosts', JSON.stringify(this.state.costs));

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
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }

        const name = window.prompt('Enter New Product Name:');
        if (!name) return;

        try {
            this.setState({ isSubmitting: true });
            const response = await axios.post(`${API_URL}/product/add`, {
                shortName: name,
                name: name,
                buyingPrice: 0,
                quantity: 0,
                price: 0,
                isActive: false
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
            this.props.error({ title: 'Error creating product: ' + (error.response?.data?.error || err.message), position: 'tr', autoDismiss: 5 });
        } finally {
            this.setState({ isSubmitting: false });
        }
    };

    handleCreateInitialOrder = async () => {
        const { supplier } = this.state;
        if (!supplier) return;

        try {
            this.setState({ isSubmitting: true });
            const response = await axios.post(`${API_URL}/import/add`, {
                supplier: supplier._id,
                orderDate: new Date(),
                items: [],
                costs: this.state.costs,
                notes: 'Order for ' + supplier.name
            });

            if (response.data.success) {
                const newImportId = response.data.importOrder._id;
                // Auto create a pending shipment for convenience
                await axios.post(`${API_URL}/import/${newImportId}/shipment/create-pending`);
                this.fetchImports(supplier._id);
            }
        } catch (error) {
            this.props.error({ title: 'Error creating order: ' + (error.response?.data?.error || err.message), position: 'tr', autoDismiss: 5 });
        } finally {
            this.setState({ isSubmitting: false });
        }
    };

    calculateShipmentTotals = (items) => {
        const totalQty = items.reduce((sum, item) => sum + (item.quantity || 0), 0);
        const totalRMB = items.reduce((sum, item) => sum + ((item.quantity || 0) * (item.priceRMB || 0)), 0);
        const totalBDT = items.reduce((sum, item) => sum + ((item.quantity || 0) * (item.priceBDT || 0)), 0);
        return { totalQty, totalRMB, totalBDT };
    };

    formatCurrency = (amount, currency = 'BDT') => {
        if (currency === 'RMB') {
            return `¥${(amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        }
        return `৳${(amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    renderShipmentCard = (shipment, showActions = true) => {
        const totals = this.calculateShipmentTotals(shipment.items || []);
        const isPending = shipment.status === 'Pending';
        const isShipped = shipment.status === 'Shipped';
        const isReceived = shipment.status === 'Received';

        // Use shipmentId or _id for uniqueness and parameters
        const sid = (shipment._id || shipment.shipmentId)?.toString();
        const impId = shipment.importId?.toString();

        return (
            <div className="shipment-card" key={sid || Math.random()}>

                <div className="shipment-card__header">
                    <div className="shipment-card__id">
                        <span className={`status-badge status-badge--${shipment.status.toLowerCase()}`}>
                            {shipment.status}
                        </span>
                        {shipment.isCompleted && isShipped && (
                            <span
                                className="status-badge status-badge--completed"
                                style={{
                                    background: 'rgba(16, 185, 129, 0.1)',
                                    color: '#10b981',
                                    marginLeft: '8px',
                                    cursor: 'pointer'
                                }}
                                onDoubleClick={() => this.handleUndoCompleteShipment(impId, sid)}
                                title="Double-click to undo completed"
                            >
                                <i className="fa fa-lock"></i> COMPLETED
                            </span>
                        )}
                        {isReceived && (
                            <span
                                className="status-badge status-badge--completed"
                                style={{
                                    background: this.state.showRevertButton === sid ? 'rgba(249, 115, 22, 0.15)' : 'rgba(16, 185, 129, 0.1)',
                                    color: this.state.showRevertButton === sid ? '#ea580c' : '#10b981',
                                    marginLeft: '8px',
                                    cursor: 'pointer'
                                }}
                                onDoubleClick={() => this.handleCompletedDoubleClick(sid)}
                                title="Double-click to show revert option"
                            >
                                <i className="fa fa-check-circle"></i> COMPLETED
                            </span>
                        )}
                        <div>
                            <div className="shipment-card__id-text">{shipment.shipmentId || 'No ID'}</div>
                            <div className="shipment-card__date">
                                {isPending && 'Created: '}
                                {isShipped && 'Shipped: '}
                                {isReceived && 'Received: '}
                                {new Date(isReceived ? shipment.receivedDate : (shipment.shipmentDate || shipment.created)).toLocaleDateString()}



                                {/* Shipped date edit */}
                                {isShipped && this.state.editingShippedDate === sid && (
                                    <div className="received-date-input">
                                        <input
                                            type="date"
                                            defaultValue={new Date(shipment.shipmentDate || shipment.created).toISOString().slice(0, 10)}
                                            onChange={(e) => this.handleUpdateShippedDate(impId, sid, e.target.value)}
                                        />
                                    </div>
                                )}
                                {isShipped && this.state.editingShippedDate !== sid && (
                                    <button
                                        className="btn-icon btn-icon--edit"
                                        style={{ marginLeft: '8px', width: '24px', height: '24px', fontSize: '11px' }}
                                        onClick={() => this.setState({ editingShippedDate: sid })}
                                    >
                                        <i className="fa fa-pencil"></i>
                                    </button>
                                )}

                                {/* Received date edit */}
                                {isReceived && this.state.editingReceivedDate === sid && (
                                    <div className="received-date-input">
                                        <input
                                            type="date"
                                            defaultValue={new Date(shipment.receivedDate).toISOString().slice(0, 10)}
                                            onChange={(e) => this.handleUpdateReceivedDate(impId, sid, e.target.value)}
                                        />
                                    </div>
                                )}
                                {isReceived && this.state.editingReceivedDate !== sid && (
                                    <button
                                        className="btn-icon btn-icon--edit"
                                        style={{ marginLeft: '8px', width: '24px', height: '24px', fontSize: '11px' }}
                                        onClick={() => this.setState({ editingReceivedDate: sid })}
                                    >
                                        <i className="fa fa-pencil"></i>
                                    </button>
                                )}

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
                            <th>Product</th>
                            <th>Qty/Ctn</th>
                            <th>Ctn</th>
                            <th>Total Qty</th>
                            <th>RMB/pc</th>
                            <th>BDT/pc</th>
                            <th>Total BDT</th>
                            {(isPending || isShipped) && <th>Actions</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {(shipment.items || []).map((item, idx) => {
                            const itemId = item._id?.toString() || idx;
                            return (
                                <tr key={itemId}>
                                    <td>
                                        <div className="shipment-card__product-name">
                                            {item.shortName || item.modelName}
                                        </div>
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
                                                <button
                                                    className="btn-icon btn-icon--ship"
                                                    title="Move to Shipped"
                                                    onClick={() => this.handleMoveItemToShipped(impId, sid, itemId)}
                                                >
                                                    <i className="fa fa-ship"></i>
                                                </button>
                                                <button
                                                    className="btn-icon btn-icon--edit"
                                                    title="Edit"
                                                    onClick={() => this.openEditItemModal(shipment, impId, item)}
                                                >
                                                    <i className="fa fa-pencil"></i>
                                                </button>
                                                <button
                                                    className="btn-icon btn-icon--delete"
                                                    title="Delete"
                                                    onClick={() => this.handleDeleteItem(impId, sid, itemId)}
                                                >
                                                    <i className="fa fa-trash"></i>
                                                </button>
                                            </div>
                                        </td>
                                    )}
                                    {isShipped && (
                                        <td>
                                            <div className="shipment-card__actions">
                                                {!shipment.isCompleted && (
                                                    <button
                                                        className="btn-icon btn-icon--undo"
                                                        title="Undo - Move back to Pending"
                                                        style={{ color: '#f59e0b', background: 'rgba(245, 158, 11, 0.1)' }}
                                                        onClick={() => this.handleUndoShipped(impId, sid, itemId)}
                                                    >
                                                        <i className="fa fa-reply"></i>
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    )}
                                </tr>
                            );
                        })}

                        {(shipment.items || []).length === 0 && (
                            <tr>
                                <td colSpan={isPending ? 8 : 7} style={{ textAlign: 'center', color: '#64748b', padding: '30px' }}>
                                    No items in this shipment yet
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>

                <div className="shipment-card__footer">
                    <div className="shipment-card__footer-actions">
                        {isPending && (
                            <>
                                <button
                                    className="btn-neon btn-neon--cyan btn-neon--sm"
                                    onClick={() => this.openAddItemModal(shipment, impId)}
                                >
                                    <i className="fa fa-plus"></i> Add Item
                                </button>
                                {shipment.items && shipment.items.length > 0 && (
                                    <button
                                        className="btn-neon btn-neon--orange btn-neon--sm"
                                        onClick={() => this.handleMarkShipped(impId, sid)}
                                    >
                                        <i className="fa fa-ship"></i> Ship All
                                    </button>
                                )}
                                <button
                                    className="btn-neon btn-neon--sm"
                                    style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)' }}
                                    onClick={() => this.handleDeleteShipment(impId, sid)}
                                >
                                    <i className="fa fa-trash"></i> Delete All
                                </button>
                            </>
                        )}
                        {isShipped && (
                            <>
                                {shipment.isCompleted && (
                                    <button
                                        className="btn-neon btn-neon--green btn-neon--sm"
                                        onClick={() => this.handleMarkReceived(impId, sid)}
                                    >
                                        <i className="fa fa-check"></i> Mark as Received
                                    </button>
                                )}
                                {!shipment.isCompleted && (
                                    <button
                                        className="btn-neon btn-neon--purple btn-neon--sm"
                                        onClick={() => this.handleCompleteShipment(impId, sid)}
                                    >
                                        <i className="fa fa-check-square-o"></i> Shipment Complete
                                    </button>
                                )}
                            </>
                        )}
                        {isReceived && this.state.showRevertButton === sid && (
                            <button
                                className="btn-neon btn-neon--sm"
                                style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)' }}
                                onClick={() => this.handleRevertToShipped(impId, sid)}
                            >
                                <i className="fa fa-undo"></i> Revert to On The Way
                            </button>
                        )}
                    </div>

                    <div className="shipment-card__summary">
                        <div className="shipment-card__summary-item">
                            <div className="shipment-card__summary-label">Total Items</div>
                            <div className="shipment-card__summary-value">{totals.totalQty}</div>
                        </div>
                        <div className="shipment-card__summary-item">
                            <div className="shipment-card__summary-label">Total (RMB)</div>
                            <div className="shipment-card__summary-value shipment-card__summary-value--rmb">
                                {this.formatCurrency(totals.totalRMB, 'RMB')}
                            </div>
                        </div>
                        <div className="shipment-card__summary-item">
                            <div className="shipment-card__summary-label">Total (BDT)</div>
                            <div className="shipment-card__summary-value">
                                {this.formatCurrency(totals.totalBDT)}
                            </div>
                        </div>
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
                    <div className="modal-header">
                        <h3 className="modal-title">Select Target Shipment</h3>
                        <button className="modal-close" onClick={this.closeModals}>&times;</button>
                    </div>
                    <div className="modal-body" style={{ padding: '30px' }}>
                        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                            <div style={{ fontSize: '40px', marginBottom: '12px' }}>🚢</div>
                            <p style={{ color: '#64748b', fontSize: '15px' }}>
                                Choose where to move this item
                            </p>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Available Shipped Shipments</label>
                            <select
                                className="form-input"
                                value={targetShipmentId}
                                style={{ height: '50px', fontSize: '15px', fontWeight: '500' }}
                                onChange={(e) => this.setState({ targetShipmentId: e.target.value })}
                            >
                                <option value="new" style={{ fontWeight: '700', color: '#0891b2' }}>+ ✨ Create New Shipment</option>
                                <option disabled>──────────</option>
                                {openShipments.map(s => (
                                    <option key={s._id || s.shipmentId} value={s.shipmentId || s._id}>
                                        📦 {s.shipmentId} ({(s.items || []).length} items)
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div className="modal-footer">
                        <button
                            className="btn-neon"
                            style={{ background: 'rgba(100, 116, 139, 0.1)', color: '#64748b', border: '1px solid rgba(100, 116, 139, 0.2)' }}
                            onClick={this.closeModals}
                        >
                            Cancel
                        </button>
                        <button className="btn-neon btn-neon--cyan" onClick={this.submitMoveToShippedModal} style={{ minWidth: '140px', justifyContent: 'center' }}>
                            Move Now
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    renderAddItemModal = () => {
        const { isAddItemModalOpen, isEditItemModalOpen, products, newItem, costs } = this.state;
        const isOpen = isAddItemModalOpen || isEditItemModalOpen;
        const isEdit = isEditItemModalOpen;

        if (!isOpen) return null;

        return (
            <div className="modal-overlay">
                <div className="modal-content modal-content--lg" onClick={e => e.stopPropagation()}>
                    <div className="modal-header">
                        <h3 className="modal-title">{isEdit ? 'Edit Item' : 'Add Item to Shipment'}</h3>
                        <button className="modal-close" onClick={this.closeModals}>&times;</button>
                    </div>
                    <div className="modal-body">
                        {/* Product Selection */}
                        <div className="form-group" style={{ position: 'relative' }}>
                            <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span>Product</span>
                                <button
                                    className="btn-icon btn-icon--cyan"
                                    title="Add New Product"
                                    type="button"
                                    onClick={this.handleAddNewProduct}
                                    style={{ width: '28px', height: '28px', fontSize: '12px' }}
                                >
                                    <i className="fa fa-plus"></i>
                                </button>
                            </label>

                            <div style={{ position: 'relative' }}>
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="Search and select product..."
                                    value={this.state.isProductDropdownOpen ? this.state.productSearch : (newItem.shortName || '')}
                                    onFocus={() => this.setState({ isProductDropdownOpen: true, productSearch: '' })}
                                    onBlur={() => setTimeout(() => this.setState({ isProductDropdownOpen: false }), 200)}
                                    onChange={(e) => this.setState({ productSearch: e.target.value, isProductDropdownOpen: true, selectedProductIndex: 0 })}
                                    onKeyDown={(e) => {
                                        const filtered = products.filter(p =>
                                            (p.shortName || p.name || '').toLowerCase().includes(this.state.productSearch.toLowerCase())
                                        );
                                        this.handleProductSearchKeyDown(e, filtered);
                                    }}
                                />
                                {this.state.isProductDropdownOpen && (
                                    <div className="search-results-dropdown" style={{
                                        position: 'absolute',
                                        top: '100%',
                                        left: 0,
                                        right: 0,
                                        backgroundColor: '#fff',
                                        border: '1px solid #e2e8f0',
                                        borderRadius: '8px',
                                        marginTop: '4px',
                                        maxHeight: '200px',
                                        overflowY: 'auto',
                                        zIndex: 1000,
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                                    }}>
                                        {products
                                            .filter(p => (p.shortName || p.name || '').toLowerCase().includes(this.state.productSearch.toLowerCase()))
                                            .map((p, i) => (
                                                <div
                                                    key={p._id}
                                                    className={`search-result-item ${this.state.selectedProductIndex === i ? 'active' : ''}`}
                                                    onClick={() => this.handleProductSelect(p._id)}
                                                    style={{
                                                        padding: '10px 16px',
                                                        cursor: 'pointer',
                                                        fontSize: '14px',
                                                        backgroundColor: this.state.selectedProductIndex === i ? '#f1f5f9' : 'transparent',
                                                        color: '#1e293b',
                                                        borderBottom: '1px solid #f1f5f9'
                                                    }}
                                                    onMouseEnter={() => this.setState({ selectedProductIndex: i })}
                                                >
                                                    {p.shortName || p.name}
                                                </div>
                                            ))}
                                        {products.filter(p => (p.shortName || p.name || '').toLowerCase().includes(this.state.productSearch.toLowerCase())).length === 0 && (
                                            <div style={{ padding: '10px 16px', color: '#94a3b8', fontSize: '14px' }}>
                                                No products found
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Quantity Fields */}
                        <div className="form-row form-row--4">
                            <div className="form-group">
                                <label className="form-label">Qty/Ctn</label>
                                <input
                                    type="number"
                                    className="form-input"
                                    value={newItem.quantityPerCtn}
                                    onChange={(e) => this.handleItemInputChange('quantityPerCtn', e.target.value)}
                                    onFocus={this.handleInputFocus}
                                    min="0"
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Cartons</label>
                                <input
                                    type="number"
                                    className="form-input"
                                    value={newItem.ctn}
                                    onChange={(e) => this.handleItemInputChange('ctn', e.target.value)}
                                    onFocus={this.handleInputFocus}
                                    min="0"
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Total Qty</label>
                                <input
                                    type="number"
                                    className="form-input form-input--readonly"
                                    value={newItem.quantity}
                                    readOnly
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Weight/Ctn (kg)</label>
                                <input
                                    type="number"
                                    className="form-input"
                                    value={newItem.perCtnWeight}
                                    onChange={(e) => this.handleItemInputChange('perCtnWeight', e.target.value)}
                                    onFocus={this.handleInputFocus}
                                    min="0"
                                    step="0.1"
                                />
                            </div>
                        </div>

                        {/* Price Fields */}
                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">Price (RMB/pc)</label>
                                <input
                                    type="number"
                                    className="form-input"
                                    value={newItem.priceRMB}
                                    onChange={(e) => this.handleItemInputChange('priceRMB', e.target.value)}
                                    onFocus={this.handleInputFocus}
                                    min="0"
                                    step="0.01"
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Calculated BDT/pc</label>
                                <input
                                    type="number"
                                    className="form-input form-input--highlight"
                                    value={newItem.priceBDT}
                                    readOnly
                                />
                                <div className="form-hint">
                                    = (RMB × Rate) + Tax/pc + Labor/pc
                                </div>
                            </div>
                        </div>

                        {/* Costing Settings - Moved below product info */}
                        <div className="costing-section" style={{ marginTop: '20px' }}>
                            <div className="costing-section__title">
                                <i className="fa fa-calculator"></i> Costing Settings
                            </div>
                            <div className="form-row form-row--4">
                                <div className="form-group">
                                    <label className="form-label">RMB Rate (BDT)</label>
                                    <input
                                        type="number"
                                        className="form-input"
                                        value={costs.rmbRate}
                                        onChange={(e) => this.handleCostingChange('rmbRate', e.target.value)}
                                        onFocus={this.handleInputFocus}
                                        step="0.1"
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Labor Bill/Ctn</label>
                                    <input
                                        type="number"
                                        className="form-input"
                                        value={costs.labourBillPerCtn}
                                        onChange={(e) => this.handleCostingChange('labourBillPerCtn', e.target.value)}
                                        onFocus={this.handleInputFocus}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Tax Type</label>
                                    <select
                                        className="form-select"
                                        value={costs.taxType}
                                        onChange={(e) => this.handleCostingChange('taxType', e.target.value)}
                                    >
                                        <option value="per_item">Per Item</option>
                                        <option value="per_kg">Per KG</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Tax Value {costs.taxType === 'per_kg' ? '(৳/kg)' : '(৳/pc)'}</label>
                                    <input
                                        type="number"
                                        className="form-input"
                                        value={costs.taxValue}
                                        onChange={(e) => this.handleCostingChange('taxValue', e.target.value)}
                                        onFocus={this.handleInputFocus}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Price Breakdown */}
                        {newItem.priceRMB > 0 && (
                            <div className="price-breakdown">
                                <div className="price-breakdown__title">Price Breakdown</div>
                                <div className="price-breakdown__row">
                                    <span>RMB Price:</span>
                                    <span>¥{newItem.priceRMB} × {costs.rmbRate} = ৳{(newItem.priceRMB * costs.rmbRate).toFixed(2)}</span>
                                </div>
                                {costs.taxType === 'per_item' && costs.taxValue > 0 && (
                                    <div className="price-breakdown__row">
                                        <span>Tax (per item):</span>
                                        <span>+ ৳{costs.taxValue}</span>
                                    </div>
                                )}
                                {costs.taxType === 'per_kg' && costs.taxValue > 0 && newItem.perCtnWeight > 0 && newItem.quantityPerCtn > 0 && (
                                    <div className="price-breakdown__row">
                                        <span>Tax (per kg × weight/item):</span>
                                        <span>+ ৳{((newItem.perCtnWeight / newItem.quantityPerCtn) * costs.taxValue).toFixed(2)}</span>
                                    </div>
                                )}
                                {costs.labourBillPerCtn > 0 && newItem.quantityPerCtn > 0 && (
                                    <div className="price-breakdown__row">
                                        <span>Labor (per ctn / qty):</span>
                                        <span>+ ৳{(costs.labourBillPerCtn / newItem.quantityPerCtn).toFixed(2)}</span>
                                    </div>
                                )}
                                <div className="price-breakdown__row price-breakdown__row--total">
                                    <span>Final BDT Price:</span>
                                    <span>৳{newItem.priceBDT}</span>
                                </div>
                                <div className="price-breakdown__row price-breakdown__row--grand">
                                    <span>Total Value ({newItem.quantity} pcs):</span>
                                    <span>৳{(newItem.quantity * newItem.priceBDT).toFixed(2)}</span>
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="modal-footer">
                        <button className="btn-neon" style={{ background: 'rgba(100, 116, 139, 0.2)', color: '#64748b', border: '1px solid rgba(100, 116, 139, 0.3)' }} onClick={this.closeModals}>
                            Cancel
                        </button>
                        <button className="btn-neon btn-neon--cyan" type="button" onClick={isEdit ? this.handleEditItem : this.handleAddItem} disabled={this.state.isSubmitting}>
                            {this.state.isSubmitting ? (
                                <i className="fa fa-spinner fa-spin"></i>
                            ) : (
                                <i className={`fa fa-${isEdit ? 'save' : 'plus'}`}></i>
                            )}
                            {' '}
                            {this.state.isSubmitting ? 'Submitting...' : (isEdit ? 'Save Changes' : 'Add Item')}
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    renderCargoModal = () => {
        const { cargos, selectedCargoId, isSubmitting, investors, selectedInvestorId, investedAmount, profitSharePercentage, shipmentToComplete, imports } = this.state;

        let totalCost = 0;
        if (shipmentToComplete && imports) {
            const imp = imports.find(i => i._id === shipmentToComplete.importId);
            if (imp && imp.shipments) {
                const shipment = imp.shipments.find(s =>
                    (s._id || s.shipmentId)?.toString() === shipmentToComplete.shipmentId
                );
                if (shipment && shipment.items) {
                    const totals = this.calculateShipmentTotals(shipment.items);
                    totalCost = totals.totalBDT;
                }
            }
        }

        return (
            <div className="modal-overlay">
                <div className="modal-content" onClick={e => e.stopPropagation()}>
                    <div className="modal-header">
                        <h3 className="modal-title">Shipment Logistics & Investment</h3>
                        <button className="modal-close" onClick={this.closeModals}>&times;</button>
                    </div>
                    <div className="modal-body">
                        {/* Cargo Section */}
                        <div style={{ marginBottom: '25px', padding: '15px', background: 'rgba(6, 182, 212, 0.03)', borderRadius: '12px', border: '1px solid rgba(6, 182, 212, 0.1)' }}>
                            <label className="form-label" style={{ color: '#06b6d4', fontWeight: '700', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <i className="fa fa-truck"></i> CARGO LOGISTICS
                            </label>
                            <div className="d-flex" style={{ gap: '10px' }}>
                                <select
                                    className="form-select"
                                    value={selectedCargoId}
                                    onChange={(e) => this.setState({ selectedCargoId: e.target.value })}
                                    style={{ flex: 1 }}
                                >
                                    <option value="">None / Hand Carry</option>
                                    {cargos.map(cargo => (
                                        <option key={cargo._id} value={cargo._id}>{cargo.name}</option>
                                    ))}
                                </select>
                                <button
                                    className="btn-icon btn-icon--cyan"
                                    onClick={() => this.setState({ isAddCargoModalOpen: true })}
                                    style={{ width: '40px', height: '40px', borderRadius: '8px' }}
                                    title="Add New Cargo"
                                >
                                    <i className="fa fa-plus"></i>
                                </button>
                            </div>
                        </div>

                        {/* Investment Section */}
                        <div style={{ padding: '15px', background: 'rgba(168, 85, 247, 0.03)', borderRadius: '12px', border: '1px solid rgba(168, 85, 247, 0.1)' }}>
                            <label className="form-label" style={{ color: '#a855f7', fontWeight: '700', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <i className="fa fa-briefcase"></i> INVESTMENT (OPTIONAL)
                            </label>

                            <div className="form-group">
                                <label className="form-label">Investor</label>
                                <select
                                    className="form-select"
                                    value={selectedInvestorId}
                                    onChange={(e) => {
                                        const investor = investors.find(i => i._id === e.target.value);
                                        this.setState({
                                            selectedInvestorId: e.target.value,
                                            investedAmount: totalCost, // Default to full amount
                                            profitSharePercentage: investor ? investor.defaultProfitShare : 50
                                        });
                                    }}
                                >
                                    <option value="">No External Investment</option>
                                    {investors.map(investor => (
                                        <option key={investor._id} value={investor._id}>{investor.name}</option>
                                    ))}
                                </select>
                            </div>

                            {selectedInvestorId && (
                                <div className="form-row form-row--2" style={{ marginTop: '15px' }}>
                                    <div className="form-group">
                                        <label className="form-label">Capital (৳)</label>
                                        <input
                                            type="number"
                                            className="form-input"
                                            value={investedAmount}
                                            onChange={(e) => this.setState({ investedAmount: Number(e.target.value) })}
                                        />
                                        <div style={{ fontSize: '10px', color: '#64748b', marginTop: '4px' }}>
                                            Total Cost: ৳{totalCost.toLocaleString()}
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Profit Share %</label>
                                        <input
                                            type="number"
                                            className="form-input"
                                            value={profitSharePercentage}
                                            onChange={(e) => this.setState({ profitSharePercentage: Number(e.target.value) })}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="modal-footer">
                        <button className="btn-neon" style={{ background: 'rgba(100, 116, 139, 0.2)', color: '#64748b', border: '1px solid rgba(100, 116, 139, 0.3)' }} onClick={this.closeModals}>
                            Cancel
                        </button>
                        <button className="btn-neon btn-neon--green" onClick={this.handleConfirmCompleteShipment} disabled={isSubmitting}>
                            {isSubmitting ? <i className="fa fa-spinner fa-spin"></i> : <i className="fa fa-check"></i>}
                            {' '}
                            {isSubmitting ? 'Confirm & Close Shipment' : 'Confirm & Close Shipment'}
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    renderAddCargoModal = () => {
        const { newCargo, isSubmitting } = this.state;

        return (
            <div className="modal-overlay" style={{ zIndex: 1100 }}>
                <div className="modal-content modal-content--sm" onClick={e => e.stopPropagation()}>
                    <div className="modal-header">
                        <h3 className="modal-title">Add New Cargo</h3>
                        <button className="modal-close" onClick={() => this.setState({ isAddCargoModalOpen: false })}>&times;</button>
                    </div>
                    <div className="modal-body">
                        <div className="form-group">
                            <label className="form-label">Cargo Name *</label>
                            <input
                                type="text"
                                className="form-input"
                                value={newCargo.name}
                                onChange={(e) => this.handleCargoInputChange('name', e.target.value)}
                                placeholder="Enter cargo name"
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Contact Number</label>
                            <input
                                type="text"
                                className="form-input"
                                value={newCargo.contactNumber}
                                onChange={(e) => this.handleCargoInputChange('contactNumber', e.target.value)}
                                placeholder="Phone number"
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Address</label>
                            <input
                                type="text"
                                className="form-input"
                                value={newCargo.address}
                                onChange={(e) => this.handleCargoInputChange('address', e.target.value)}
                                placeholder="Location"
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Notes</label>
                            <textarea
                                className="form-input"
                                value={newCargo.notes}
                                onChange={(e) => this.handleCargoInputChange('notes', e.target.value)}
                                placeholder="Additional info"
                                rows="2"
                            />
                        </div>
                    </div>
                    <div className="modal-footer">
                        <button className="btn-neon" style={{ background: 'rgba(100, 116, 139, 0.2)', color: '#64748b', border: '1px solid rgba(100, 116, 139, 0.3)' }} onClick={() => this.setState({ isAddCargoModalOpen: false })}>
                            Cancel
                        </button>
                        <button className="btn-neon btn-neon--cyan" onClick={this.handleCreateCargo} disabled={isSubmitting}>
                            {isSubmitting ? <i className="fa fa-spinner fa-spin"></i> : <i className="fa fa-save"></i>}
                            {' '}
                            {isSubmitting ? 'Saving...' : 'Save Cargo'}
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    render() {
        const { supplier, isLoading, activeTab } = this.state;

        const pendingShipments = this.getShipmentsByStatus('Pending');
        const shippedShipments = this.getShipmentsByStatus('Shipped');
        const receivedShipments = this.getShipmentsByStatus('Received');

        return (
            <div className="supplier-orders" style={{ padding: '0 24px 24px 24px', backgroundColor: '#f3f4f6', minHeight: 'calc(100vh - 80px)' }}>
                <div className="courier-selection-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', padding: '10px 20px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', marginBottom: '20px' }}>
                    <div className="d-flex align-items-center">
                        <button className="nav-tab mr-3" onClick={() => this.props.history.push('/dashboard/import')}>
                            <i className="fa fa-arrow-left"></i> Back
                        </button>
                        <div style={{
                            width: '4px',
                            height: '24px',
                            background: '#06b6d4',
                            borderRadius: '2px',
                            marginRight: '12px'
                        }}></div>
                        <div>
                            <h2 className="mb-0" style={{
                                fontWeight: '700',
                                color: '#1e293b',
                                fontSize: '18px',
                                letterSpacing: '-0.5px'
                            }}>
                                {supplier ? supplier.name : 'Loading...'}
                            </h2>
                            {supplier && (
                                <small className="text-muted font-weight-bold" style={{ fontSize: '11px', marginTop: '-2px', display: 'block' }}>
                                    {supplier.phoneNumber} {supplier.address && `• ${supplier.address}`}
                                </small>
                            )}
                        </div>
                    </div>

                    <div className="nav-shortcuts d-flex flex-wrap" style={{ gap: '8px' }}>
                        <button
                            className={`nav-tab ${activeTab === 'pending' ? 'active' : ''}`}
                            onClick={() => this.setState({ activeTab: 'pending' })}
                        >
                            <i className="fa fa-clock-o"></i> Current Orders
                            <span style={{
                                marginLeft: '8px',
                                background: activeTab === 'pending' ? 'rgba(0,0,0,0.2)' : 'rgba(6, 182, 212, 0.1)',
                                color: activeTab === 'pending' ? '#fff' : '#06b6d4',
                                padding: '2px 8px',
                                borderRadius: '12px',
                                fontSize: '11px',
                                fontWeight: 'bold'
                            }}>{pendingShipments.length}</span>
                        </button>
                        <button
                            className={`nav-tab ${activeTab === 'shipped' ? 'active' : ''}`}
                            onClick={() => this.setState({ activeTab: 'shipped' })}
                        >
                            <i className="fa fa-ship"></i> On The Way
                            <span style={{
                                marginLeft: '8px',
                                background: activeTab === 'shipped' ? 'rgba(0,0,0,0.2)' : 'rgba(6, 182, 212, 0.1)',
                                color: activeTab === 'shipped' ? '#fff' : '#06b6d4',
                                padding: '2px 8px',
                                borderRadius: '12px',
                                fontSize: '11px',
                                fontWeight: 'bold'
                            }}>{shippedShipments.length}</span>
                        </button>
                        <button
                            className={`nav-tab ${activeTab === 'received' ? 'active' : ''}`}
                            onClick={() => this.setState({ activeTab: 'received' })}
                        >
                            <i className="fa fa-check-circle"></i> Previous Orders
                            <span style={{
                                marginLeft: '8px',
                                background: activeTab === 'received' ? 'rgba(0,0,0,0.2)' : 'rgba(6, 182, 212, 0.1)',
                                color: activeTab === 'received' ? '#fff' : '#06b6d4',
                                padding: '2px 8px',
                                borderRadius: '12px',
                                fontSize: '11px',
                                fontWeight: 'bold'
                            }}>{receivedShipments.length}</span>
                        </button>
                    </div>
                </div>

                <div className="supplier-orders__content">
                    {isLoading ? (
                        <div className="loader">
                            <div className="loader__spinner"></div>
                        </div>
                    ) : (
                        <>
                            {activeTab === 'pending' && (
                                <>
                                    {pendingShipments.length === 0 ? (
                                        <div className="empty-state">
                                            <div className="empty-state__icon">📦</div>
                                            <div className="empty-state__text">No current orders for this supplier.</div>
                                            <button
                                                className="btn-neon btn-neon--purple"
                                                onClick={this.handleCreateInitialOrder}
                                                style={{ marginTop: '20px' }}
                                                disabled={this.state.isSubmitting}
                                            >
                                                {this.state.isSubmitting ? <i className="fa fa-spinner fa-spin"></i> : <i className="fa fa-plus"></i>}
                                                {' '}Create Initial Order & Shipment
                                            </button>
                                        </div>
                                    ) : (
                                        pendingShipments.map(shipment => this.renderShipmentCard(shipment))
                                    )}
                                </>
                            )}

                            {activeTab === 'shipped' && (
                                <>
                                    {shippedShipments.length === 0 ? (
                                        <div className="empty-state">
                                            <div className="empty-state__icon">🚢</div>
                                            <div className="empty-state__text">No shipments on the way yet.</div>
                                        </div>
                                    ) : (
                                        shippedShipments.map(shipment => this.renderShipmentCard(shipment))
                                    )}
                                </>
                            )}

                            {activeTab === 'received' && (
                                <>
                                    {receivedShipments.length === 0 ? (
                                        <div className="empty-state">
                                            <div className="empty-state__icon">✅</div>
                                            <div className="empty-state__text">No previous orders yet.</div>
                                        </div>
                                    ) : (
                                        receivedShipments.map(shipment => this.renderShipmentCard(shipment, false))
                                    )}
                                </>
                            )}
                        </>
                    )}
                </div>

                {this.renderAddItemModal()}
                {this.renderSelectShipmentModal()}
                {this.state.isCargoModalOpen && this.renderCargoModal()}
                {this.state.isAddCargoModalOpen && this.renderAddCargoModal()}
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

export default connect(mapStateToProps, mapDispatchToProps)(SupplierOrders);
