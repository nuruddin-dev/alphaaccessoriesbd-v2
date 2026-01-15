import React from 'react';
import axios from 'axios';
import { connect } from 'react-redux';
import { success } from 'react-notification-system-redux';
import actions from '../../actions';
import handleError from '../../utils/error';
import { API_URL } from '../../constants';
import './Steadfast.css';

class SteadfastCourier extends React.Component {
    state = {
        orders: [],
        payments: [],
        returns: [],
        stations: [],
        balance: 0,
        isLoading: false,
        isCreating: false,
        accounts: [],
        formData: {
            courier: 'steadfast',
            invoice: '',
            recipient_name: '',
            recipient_phone: '',
            recipient_address: '',
            cod_amount: '',
            advanceAmount: 0,
            advanceAccount: '',
            productCost: 0,
            packagingCharge: 20,
            note: '',
            item_description: '',
            createdBy: ''
        },
        lookupId: '',
        lookupResult: null,
        allProducts: [],
        selectedProducts: [{ productId: '', quantity: 1, buyingPrice: 0, name: '' }],
        // Modals
        showTrackingModal: false,
        trackingData: null,
        selectedDate: new Date().toISOString().split('T')[0],
        editFormData: {
            _id: '',
            recipientName: '',
            recipientPhone: '',
            recipientAddress: '',
            codAmount: 0,
            productCost: 0,
            packagingCharge: 20,
            items: [],
            note: '',
            createdBy: ''
        }
    };

    componentDidMount() {
        this.fetchData();
        this.fetchBalance();
        this.fetchAccounts();
        this.fetchProducts();

        // Pre-fill from OrderNow page if data exists in location state
        const locationState = this.props.location?.state;
        if (locationState && locationState.orderData) {
            const { orderData } = locationState;
            this.setState(prevState => ({
                formData: {
                    ...prevState.formData,
                    recipient_name: orderData.recipient_name || '',
                    recipient_phone: orderData.recipient_phone || '',
                    recipient_address: orderData.recipient_address || '',
                    cod_amount: orderData.cod_amount || '',
                    item_description: orderData.item_description || ''
                }
            }));
        }

        // Set default Created By from user
        if (this.props.user && !this.state.formData.createdBy) {
            this.setState(prevState => ({
                formData: {
                    ...prevState.formData,
                    createdBy: this.props.user.firstName + (this.props.user.lastName ? ` ${this.props.user.lastName}` : '')
                }
            }));
        }
    }

    componentDidUpdate(prevProps) {
        if (!prevProps.user && this.props.user && !this.state.formData.createdBy) {
            this.setState(prevState => ({
                formData: {
                    ...prevState.formData,
                    createdBy: this.props.user.firstName + (this.props.user.lastName ? ` ${this.props.user.lastName}` : '')
                }
            }));
        }
    }

    fetchAccounts = async () => {
        try {
            const res = await axios.get(`${API_URL}/account`);
            let accounts = res.data.accounts || [];

            // Sorting logic: Cash > all Bank > all mobile banking. Secondary sort by name.
            const getPriority = (type) => {
                const t = type.toLowerCase();
                if (t === 'cash') return 0;
                if (t === 'bank') return 1;
                if (t === 'mobile' || t === 'bkash' || t === 'nagad' || t === 'rocket') return 2;
                return 3;
            };

            accounts.sort((a, b) => {
                const priorityA = getPriority(a.type);
                const priorityB = getPriority(b.type);
                if (priorityA !== priorityB) {
                    return priorityA - priorityB;
                }
                return a.name.localeCompare(b.name);
            });

            this.setState({ accounts });
        } catch (error) {
            console.error('Account fetch failed', error);
        }
    };

    fetchData = async () => {
        const { selectedDate } = this.state;
        this.setState({ isLoading: true });
        try {
            // Fetch with separate try-catches to ensure one failure doesn't block others
            const fetchOrders = axios.get(`${API_URL}/steadfast/orders?date=${selectedDate}`).catch(err => { console.error('Orders fetch failed', err); return { data: { orders: [] } }; });
            const fetchPayments = axios.get(`${API_URL}/steadfast/payments`).catch(err => { console.error('Payments fetch failed', err); return { data: { payments: [] } }; });
            const fetchReturns = axios.get(`${API_URL}/steadfast/return-requests`).catch(err => { console.error('Returns fetch failed', err); return { data: { returns: [] } }; });

            const [ordersRes, paymentsRes, returnsRes] = await Promise.all([fetchOrders, fetchPayments, fetchReturns]);

            this.setState({
                orders: ordersRes.data.orders || [],
                payments: paymentsRes.data.payments || [],
                returns: returnsRes.data.returns || [],
                isLoading: false
            });
        } catch (error) {
            console.error('Error fetching data:', error);
            this.setState({ isLoading: false });
            // handleError usually takes care of the toast
            // this.props.handleError(error, null, 'Failed to connect to server.');
        }
    };

    handleDateChange = (e) => {
        this.setState({ selectedDate: e.target.value }, () => this.fetchData());
    };

    handlePrevDay = () => {
        const date = new Date(this.state.selectedDate);
        date.setDate(date.getDate() - 1);
        this.setState({ selectedDate: date.toISOString().split('T')[0] }, () => this.fetchData());
    };

    handleNextDay = () => {
        const date = new Date(this.state.selectedDate);
        date.setDate(date.getDate() + 1);
        this.setState({ selectedDate: date.toISOString().split('T')[0] }, () => this.fetchData());
    };

    fetchBalance = async () => {
        try {
            const res = await axios.get(`${API_URL}/steadfast/balance`);
            if (res.data.status === 200) {
                this.setState({ balance: res.data.current_balance });
            }
        } catch (error) {
            console.error('Error fetching balance:', error);
        }
    };

    fetchProducts = async () => {
        try {
            const res = await axios.get(`${API_URL}/product/list/select`);
            const allProducts = res.data.products || [];
            this.setState({ allProducts }, () => {
                // Secondary check for pre-fill once products are available
                const locationState = this.props.location?.state;
                if (locationState && locationState.orderData && allProducts.length > 0) {
                    const { orderData } = locationState;
                    const matchedProduct = allProducts.find(p =>
                        p.name?.toLowerCase() === orderData.productName?.toLowerCase() ||
                        (p.shortName && p.shortName.toLowerCase() === orderData.productName?.toLowerCase())
                    );

                    const initialProducts = matchedProduct ? [
                        { productId: matchedProduct._id, name: matchedProduct.shortName || matchedProduct.name, quantity: orderData.quantity || 1, buyingPrice: matchedProduct.buyingPrice || 0 }
                    ] : [{ productId: '', quantity: orderData.quantity || 1, buyingPrice: 0, name: '' }];

                    const totalCost = initialProducts.reduce((sum, p) => sum + (Number(p.buyingPrice) * Number(p.quantity)), 0);

                    this.setState(prevState => ({
                        selectedProducts: initialProducts,
                        formData: {
                            ...prevState.formData,
                            recipient_name: orderData.recipient_name || prevState.formData.recipient_name,
                            recipient_phone: orderData.recipient_phone || prevState.formData.recipient_phone,
                            recipient_address: orderData.recipient_address || prevState.formData.recipient_address,
                            cod_amount: orderData.cod_amount || prevState.formData.cod_amount,
                            productCost: totalCost,
                            item_description: orderData.item_description || prevState.formData.item_description
                        }
                    }));
                }
            });
        } catch (error) {
            console.error('Products fetch failed', error);
        }
    };

    handleProductAdd = () => {
        const { selectedProducts } = this.state;
        this.setState({
            selectedProducts: [
                ...selectedProducts,
                { productId: '', quantity: 1, buyingPrice: 0, name: '' }
            ]
        });
    };

    handleProductChange = (index, field, value) => {
        const { selectedProducts, allProducts } = this.state;
        const newSelected = [...selectedProducts];

        if (field === 'productId') {
            const product = allProducts.find(p => p._id === value);
            newSelected[index].name = product ? (product.shortName || product.name) : '';
            newSelected[index].buyingPrice = product ? (product.buyingPrice || 0) : 0;
        }

        newSelected[index][field] = value;

        // Auto-calculate total product cost
        const totalCost = newSelected.reduce((sum, p) => sum + (Number(p.buyingPrice) * Number(p.quantity)), 0);

        this.setState({
            selectedProducts: newSelected,
            formData: {
                ...this.state.formData,
                productCost: totalCost
            }
        });
    };

    handleProductRemove = (index) => {
        const { selectedProducts } = this.state;
        const newSelected = selectedProducts.filter((_, i) => i !== index);
        const totalCost = newSelected.reduce((sum, p) => sum + (Number(p.buyingPrice) * Number(p.quantity)), 0);

        this.setState({
            selectedProducts: newSelected,
            formData: {
                ...this.state.formData,
                productCost: totalCost
            }
        });
    };

    handleInputChange = (e) => {
        const { name, value } = e.target;
        this.setState(prevState => ({
            formData: {
                ...prevState.formData,
                [name]: value
            }
        }));
    };

    openTrackingModal = async (order) => {
        this.setState({ showTrackingModal: true, selectedOrder: order, trackingData: null });
        try {
            const res = await axios.get(`${API_URL}/steadfast/tracking/${order.consignmentId}`);
            this.setState({ trackingData: res.data.tracking });
        } catch (error) {
            console.error('Tracking fetch failed', error);
            this.setState({ trackingData: { error: 'Failed to fetch tracking info' } });
        }
    };

    openEditModal = (order) => {
        this.setState({
            showEditModal: true,
            selectedOrder: order,
            editFormData: {
                _id: order._id,
                recipientName: order.recipientName || '',
                recipientPhone: order.recipientPhone || '',
                recipientAddress: order.recipientAddress || '',
                codAmount: order.codAmount || 0,
                productCost: order.productCost || 0,
                packagingCharge: order.packagingCharge || 20,
                items: order.items || [],
                note: order.note || '',
                createdBy: order.createdBy || ''
            }
        });
    };

    closeModals = () => {
        this.setState({ showTrackingModal: false, showEditModal: false, selectedOrder: null, trackingData: null });
    };

    handleLocalUpdate = async () => {
        const { editFormData } = this.state;
        this.setState({ isLoading: true });
        try {
            const res = await axios.put(`${API_URL}/steadfast/local-update/${editFormData._id}`, editFormData);
            if (res.data.success) {
                this.props.success({ title: 'Order updated locally!', position: 'tr', autoDismiss: 1 });
                this.setState({ showEditModal: false });
                this.fetchData();
            }
        } catch (error) {
            handleError(error, this.props.dispatch, 'Failed to update order locally.');
        } finally {
            this.setState({ isLoading: false });
        }
    };

    handleLocalDelete = async (order) => {
        if (!window.confirm(`Delete parcel #${order.consignmentId} from local database? This won't cancel it in Steadfast.`)) return;
        this.setState({ isLoading: true });
        try {
            const res = await axios.delete(`${API_URL}/steadfast/local-delete/${order._id}`);
            if (res.data.success) {
                this.props.success({ title: 'Order deleted from local database.', position: 'tr', autoDismiss: 1 });
                this.fetchData();
            }
        } catch (error) {
            handleError(error, this.props.dispatch, 'Failed to delete order.');
        } finally {
            this.setState({ isLoading: false });
        }
    };

    handleReceiveReturn = async (order) => {
        if (!window.confirm(`Receive items from parcel #${order.consignmentId} back into stock?`)) return;
        this.setState({ isLoading: true });
        try {
            const res = await axios.post(`${API_URL}/steadfast/receive-return`, { orderId: order._id });
            if (res.data.success) {
                this.props.success({ title: 'Items received and stock updated!', position: 'tr', autoDismiss: 3 });
                this.fetchData();
            }
        } catch (error) {
            handleError(error, this.props.dispatch, 'Failed to receive return.');
        } finally {
            this.setState({ isLoading: false });
        }
    };

    handleEditInputChange = (e) => {
        const { name, value } = e.target;
        this.setState(prevState => ({
            editFormData: {
                ...prevState.editFormData,
                [name]: value
            }
        }));
    };

    handleEditProductChange = (idx, field, value) => {
        const { editFormData, allProducts } = this.state;
        const newItems = [...editFormData.items];

        if (field === 'product') {
            const product = allProducts.find(p => p._id === value);
            newItems[idx] = {
                ...newItems[idx],
                product: value,
                name: product ? (product.shortName || product.name) : '',
                buyingPrice: product ? (product.buyingPrice || 0) : 0
            };
        } else {
            newItems[idx] = {
                ...newItems[idx],
                [field]: value
            };
        }

        // Auto-calculate product cost
        const totalCost = newItems.reduce((sum, p) => sum + (Number(p.buyingPrice) * Number(p.quantity)), 0);

        this.setState({
            editFormData: {
                ...editFormData,
                items: newItems,
                productCost: totalCost
            }
        });
    };

    handleEditProductAdd = () => {
        const { editFormData } = this.state;
        this.setState({
            editFormData: {
                ...editFormData,
                items: [
                    ...editFormData.items,
                    { product: '', quantity: 1, buyingPrice: 0, name: '' }
                ]
            }
        });
    };

    handleEditProductRemove = (index) => {
        const { editFormData } = this.state;
        const newItems = editFormData.items.filter((_, i) => i !== index);
        const totalCost = newItems.reduce((sum, p) => sum + (Number(p.buyingPrice) * Number(p.quantity)), 0);

        this.setState({
            editFormData: {
                ...editFormData,
                items: newItems,
                productCost: totalCost
            }
        });
    };

    handleCancelOrder = async (order) => {
        if (!window.confirm(`Are you sure you want to cancel parcel #${order.consignmentId}?`)) return;

        this.setState({ isLoading: true });
        try {
            const res = await axios.post(`${API_URL}/steadfast/cancel`, { consignment_id: order.consignmentId });
            if (res.data.success) {
                this.props.success({ title: 'Order cancelled successfully!', position: 'tr', autoDismiss: 1 });
                this.fetchData();
            }
        } catch (error) {
            handleError(error, this.props.dispatch, 'Failed to cancel order.');
        } finally {
            this.setState({ isLoading: false });
        }
    };

    syncHistory = async () => {
        this.setState({ isLoading: true });
        try {
            const res = await axios.get(`${API_URL}/steadfast/sync-history`);
            if (res.data.success) {
                this.props.success({ title: `History synced! Added ${res.data.syncedCount} previous orders.`, position: 'tr', autoDismiss: 3 });
                this.setState({ isLoading: false });
                this.fetchData();
            }
        } catch (error) {
            handleError(error, this.props.dispatch, 'History sync failed. Please try again.');
            this.setState({ isLoading: false });
        }
    };

    refreshStatuses = async () => {
        const { orders } = this.state;
        this.setState({ isLoading: true });
        try {
            let updatedCount = 0;
            for (const order of orders) {
                if (order.status !== 'delivered' && order.status !== 'cancelled') {
                    await axios.get(`${API_URL}/steadfast/status/${order.invoice}`);
                    updatedCount++;
                }
            }
            this.props.success({ title: `Refreshed ${updatedCount} active orders. Profits updated for delivered items.`, position: 'tr', autoDismiss: 3 });
            this.setState({ isLoading: false });
            this.fetchData();
        } catch (error) {
            handleError(error, this.props.dispatch, 'Status refresh partially failed.');
            this.setState({ isLoading: false });
        }
    };

    handleSubmit = async (e) => {
        e.preventDefault();
        const { formData, selectedProducts } = this.state;
        this.setState({ isCreating: true });

        // Format products into note: Product Name * Quantity
        const productNote = selectedProducts
            .filter(p => p.name && p.quantity)
            .map(p => `${p.name} * ${p.quantity} pcs`)
            .join(', ');

        const fullNote = formData.note ? `${productNote}. ${formData.note}` : productNote;

        const finalData = {
            ...formData,
            items: selectedProducts.map(p => ({
                product: p.productId,
                quantity: p.quantity,
                buyingPrice: p.buyingPrice,
                name: p.name
            })),
            note: fullNote,
            item_description: fullNote
        };

        try {
            const res = await axios.post(`${API_URL}/steadfast/create`, finalData);
            if (res.data.success || res.data.status === 200) {
                const newOrder = res.data.order;
                this.props.success({ title: `Order Created! ID: ${newOrder.consignmentId}`, position: 'tr', autoDismiss: 3 });
                this.setState({
                    isCreating: false,
                    formData: { ...this.state.formData, invoice: '', recipient_name: '', recipient_phone: '', recipient_address: '', cod_amount: '', note: '' },
                    selectedProducts: [{ productId: '', quantity: 1, buyingPrice: 0, name: '' }]
                });
                this.fetchData();
                this.fetchBalance();
                if (this.props.setView) this.props.setView('dashboard');
            }
        } catch (error) {
            handleError(error, this.props.dispatch, 'Error creating order.');
        } finally {
            this.setState({ isCreating: false });
        }
    };

    renderDashboard = () => {
        const { orders, returns, balance, isLoading } = this.state;

        return (
            <div className="portal-dashboard">


                <div className="view-section">
                    <div className="form-title">Recent Consignments (By Date)</div>
                    {this.renderOrderTable()}
                </div>
            </div >
        );
    };

    renderOrderTable = () => {
        const { orders, isLoading, selectedDate } = this.state;

        // Calculate total profit for visible orders
        const totalProfit = (orders || []).reduce((sum, o) => {
            const profit = (o.deliveryCharge > 0) ? ((o.advanceAmount || 0) + (o.codAmount || 0) - (o.productCost || 0) - (o.codCharge || 0) - (o.deliveryCharge || 0) - (o.packagingCharge || 0)) : 0;
            return sum + profit;
        }, 0);

        return (
            <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', background: '#f8fafc', padding: '15px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <button onClick={this.handlePrevDay} className="btn-neon" style={{ padding: '5px 15px' }}><i className="fa fa-chevron-left"></i> Prev</button>
                        <input
                            type="date"
                            className="form-input"
                            style={{ width: 'auto', margin: 0, height: '38px' }}
                            value={selectedDate}
                            onChange={this.handleDateChange}
                        />
                        <button onClick={this.handleNextDay} className="btn-neon" style={{ padding: '5px 15px' }}>Next <i className="fa fa-chevron-right"></i></button>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Daily Profit</div>
                        <div style={{ fontSize: '20px', fontWeight: 'bold', color: totalProfit >= 0 ? '#059669' : '#dc2626' }}>৳{totalProfit.toLocaleString()}</div>
                    </div>
                </div>
                <div className="table-responsive">
                    <table className="courier-table">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Created By</th>
                                <th>Recipient</th>
                                <th style={{ textAlign: 'right' }}>Advance</th>
                                <th style={{ textAlign: 'right' }}>COD</th>
                                <th style={{ textAlign: 'right' }}>Cost</th>
                                <th style={{ textAlign: 'right' }}>Delivery</th>
                                <th style={{ textAlign: 'right' }}>Profit</th>
                                <th>Status</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr>
                                    <td colSpan="11" style={{ textAlign: 'center', padding: '40px' }}>
                                        <i className="fa fa-spinner fa-spin" style={{ fontSize: '24px', color: '#06b6d4', marginBottom: '10px', display: 'block' }}></i>
                                        Loading consignments...
                                    </td>
                                </tr>
                            ) : (orders || []).length === 0 ? (
                                <tr>
                                    <td colSpan="11" style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                                        <i className="fa fa-info-circle" style={{ fontSize: '24px', marginBottom: '10px', display: 'block' }}></i>
                                        No consignments found. Synchronize your first order!
                                    </td>
                                </tr>
                            ) : (
                                (orders || []).map(o => {
                                    const profit = (o.deliveryCharge > 0) ? ((o.advanceAmount || 0) + (o.codAmount || 0) - (o.productCost || 0) - (o.codCharge || 0) - (o.deliveryCharge || 0) - (o.packagingCharge || 0)) : 0;
                                    return (
                                        <tr key={o._id || Math.random()}>
                                            <td>{o.created ? new Date(o.created).toLocaleDateString() : 'N/A'}</td>
                                            <td style={{ fontWeight: '600', color: '#64748b' }}>{o.createdBy || 'Admin'}</td>
                                            <td>{o.recipientName || 'N/A'}</td>
                                            <td style={{ textAlign: 'right', color: '#059669' }}>৳{(o.advanceAmount || 0).toLocaleString()}</td>
                                            <td style={{ textAlign: 'right' }}>৳{(o.codAmount || 0).toLocaleString()}</td>
                                            <td style={{ textAlign: 'right', color: '#dc2626' }}>৳{(o.productCost || 0).toLocaleString()}</td>
                                            <td style={{ textAlign: 'right', color: '#64748b' }}>৳{(o.deliveryCharge || 0).toLocaleString()}</td>
                                            <td style={{ textAlign: 'right', fontWeight: 'bold', color: profit >= 0 ? '#059669' : '#dc2626' }}>
                                                ৳{profit.toLocaleString()}
                                            </td>
                                            <td>
                                                <span className={`status-badge ${this.getStatusClass(o.status)}`}>
                                                    {(o.status || 'unknown').toString().replace(/_/g, ' ')}
                                                </span>
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', gap: '5px' }}>
                                                    <button
                                                        type="button"
                                                        className="btn-neon btn-neon--cyan"
                                                        style={{ fontSize: '11px', padding: '5px 8px' }}
                                                        onClick={() => this.openTrackingModal(o)}
                                                        title="View tracking info"
                                                    >
                                                        <i className="fa fa-eye"></i>
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="btn-neon"
                                                        style={{ fontSize: '11px', padding: '5px 8px', background: '#fef3c7', color: '#92400e' }}
                                                        onClick={() => this.openEditModal(o)}
                                                        title="Edit local record"
                                                    >
                                                        <i className="fa fa-edit"></i>
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="btn-neon"
                                                        style={{ fontSize: '11px', padding: '5px 8px', background: '#fee2e2', color: '#b91c1c' }}
                                                        onClick={() => this.handleLocalDelete(o)}
                                                        title="Delete local record"
                                                    >
                                                        <i className="fa fa-trash"></i>
                                                    </button>
                                                    {o.status?.includes('return') && o.status !== 'returned_received' && (
                                                        <button
                                                            type="button"
                                                            className="btn-neon"
                                                            style={{ fontSize: '11px', padding: '5px 8px', background: '#dcfce7', color: '#15803d' }}
                                                            onClick={() => this.handleReceiveReturn(o)}
                                                            title="Receive into stock"
                                                        >
                                                            <i className="fa fa-arrow-circle-down"></i>
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )
                            }</tbody>
                    </table>
                </div>
            </div>
        );
    };

    renderAddParcel = () => {
        const { isCreating, formData, accounts } = this.state;
        const safeData = formData || {};
        return (
            <div className="view-section">
                <div className="form-title">Online Order Entry</div>
                <form onSubmit={this.handleSubmit}>
                    <div className="row">
                        <div className="col-md-6">
                            <div className="form-group">
                                <label style={{ marginBottom: '10px', display: 'block', fontWeight: '700' }}>Select Courier Service</label>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <button
                                        type="button"
                                        className={`btn-neon ${safeData.courier === 'steadfast' ? 'btn-neon--cyan' : ''}`}
                                        style={{ flex: 1, padding: '10px', fontSize: '13px', border: safeData.courier === 'steadfast' ? '' : '1px solid #e2e8f0', background: safeData.courier === 'steadfast' ? '' : '#fff', color: safeData.courier === 'steadfast' ? '' : '#64748b' }}
                                        onClick={() => this.setState({ formData: { ...safeData, courier: 'steadfast' } })}
                                    >
                                        Steadfast
                                    </button>
                                    <button
                                        type="button"
                                        className="btn-neon"
                                        style={{ flex: 1, padding: '10px', fontSize: '13px', background: '#f8fafc', color: '#cbd5e1', border: '1px solid #f1f5f9', cursor: 'not-allowed' }}
                                        disabled
                                    >
                                        Pathao
                                    </button>
                                    <button
                                        type="button"
                                        className="btn-neon"
                                        style={{ flex: 1, padding: '10px', fontSize: '13px', background: '#f8fafc', color: '#cbd5e1', border: '1px solid #f1f5f9', cursor: 'not-allowed' }}
                                        disabled
                                    >
                                        RedX
                                    </button>
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Invoice Number</label>
                                <input className="form-input" name="invoice" value={safeData.invoice || ''} onChange={this.handleInputChange} required />
                            </div>
                            <div className="form-group">
                                <label>Recipient Name</label>
                                <input className="form-input" name="recipient_name" value={safeData.recipient_name || ''} onChange={this.handleInputChange} required />
                            </div>
                            <div className="form-group">
                                <label>Created By</label>
                                <input className="form-input" name="createdBy" value={safeData.createdBy || ''} onChange={this.handleInputChange} required />
                            </div>
                            <div className="form-group">
                                <label>Recipient Phone</label>
                                <input className="form-input" name="recipient_phone" value={safeData.recipient_phone || ''} onChange={this.handleInputChange} required />
                            </div>
                            <div className="form-group">
                                <label>Full Address</label>
                                <textarea className="form-textarea" name="recipient_address" value={safeData.recipient_address || ''} onChange={this.handleInputChange} required rows="3" />
                            </div>
                        </div>
                        <div className="col-md-6">
                            <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '10px', border: '1px solid #e2e8f0', marginBottom: '15px' }}>
                                <div className="form-group">
                                    <label style={{ color: '#06b6d4', fontWeight: '700' }}>Advance Amount (if any)</label>
                                    <input className="form-input" type="number" name="advanceAmount" value={safeData.advanceAmount || ''} onChange={this.handleInputChange} placeholder="0" />
                                </div>
                                <div className="form-group">
                                    <label>Received Into Account</label>
                                    <select className="form-input" name="advanceAccount" value={safeData.advanceAccount || ''} onChange={this.handleInputChange}>
                                        <option value="">Select Account</option>
                                        {accounts.map(acc => (
                                            <option key={acc._id} value={acc._id}>{acc.name} (৳{acc.balance.toLocaleString()})</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="form-group">
                                <label>COD Amount (To be collected)</label>
                                <input className="form-input" type="number" name="cod_amount" value={safeData.cod_amount || ''} onChange={this.handleInputChange} required />
                            </div>

                            <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '10px', border: '1px solid #e2e8f0', marginBottom: '15px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                    <label style={{ margin: 0, fontWeight: '700' }}>Product Selection</label>
                                    <button type="button" onClick={this.handleProductAdd} style={{ padding: '4px 12px', fontSize: '11px', background: '#06b6d4', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                                        <i className="fa fa-plus"></i> Add Product
                                    </button>
                                </div>

                                {this.state.selectedProducts.map((sp, idx) => (
                                    <div key={idx} style={{ display: 'flex', gap: '8px', marginBottom: '8px', alignItems: 'center' }}>
                                        <div style={{ flex: 3 }}>
                                            <select
                                                className="form-input"
                                                style={{ padding: '8px', fontSize: '13px' }}
                                                value={sp.productId}
                                                onChange={(e) => this.handleProductChange(idx, 'productId', e.target.value)}
                                            >
                                                <option value="">Select Product...</option>
                                                {this.state.allProducts.map(p => (
                                                    <option key={p._id} value={p._id}>
                                                        {p.shortName || p.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div style={{ flex: 1.5 }}>
                                            <input
                                                className="form-input"
                                                style={{ padding: '8px', fontSize: '13px' }}
                                                type="number"
                                                placeholder="Unit Cost"
                                                value={sp.buyingPrice || ''}
                                                onChange={(e) => this.handleProductChange(idx, 'buyingPrice', e.target.value)}
                                            />
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <input
                                                className="form-input"
                                                style={{ padding: '8px', fontSize: '13px' }}
                                                type="number"
                                                placeholder="Qty"
                                                value={sp.quantity}
                                                onChange={(e) => this.handleProductChange(idx, 'quantity', e.target.value)}
                                            />
                                        </div>
                                        {this.state.selectedProducts.length > 1 && (
                                            <button type="button" onClick={() => this.handleProductRemove(idx)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '5px' }}>
                                                <i className="fa fa-trash"></i>
                                            </button>
                                        )}
                                    </div>
                                ))}

                                <div style={{ mt: '10px', borderTop: '1px dashed #cbd5e1', paddingTop: '10px' }}>
                                    <label style={{ fontSize: '12px', color: '#64748b', display: 'block', marginBottom: '5px' }}>Note Preview (Sent to Steadfast):</label>
                                    <div style={{ background: '#ecfeff', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cffafe', fontSize: '13px', color: '#0891b2', fontWeight: 'bold' }}>
                                        {this.state.selectedProducts.filter(p => p.name && p.quantity).map(p => `${p.name} * ${p.quantity} pcs`).join(', ') || 'Waiting for product selection...'}
                                    </div>
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Product Buying Cost (Total)</label>
                                <input className="form-input" type="number" name="productCost" value={safeData.productCost || ''} onChange={this.handleInputChange} required readOnly style={{ background: '#f1f5f9' }} />
                            </div>
                            <div className="form-group">
                                <label>Packaging Charge</label>
                                <input className="form-input" type="number" name="packagingCharge" value={safeData.packagingCharge || 20} onChange={this.handleInputChange} />
                            </div>
                            <div className="form-group" style={{ display: 'none' }}>
                                <label>Item Description / Note</label>
                                <input className="form-input" name="item_description" value={safeData.item_description || ''} onChange={this.handleInputChange} placeholder="Auto-generated from products" />
                            </div>
                        </div>
                    </div>
                    <div style={{ marginTop: '20px', padding: '15px', background: '#ecfeff', borderRadius: '10px', border: '1px solid #cffafe' }}>
                        <p style={{ margin: 0, fontSize: '13px', color: '#0891b2' }}>
                            <i className="fa fa-info-circle"></i> <b>Profit Note:</b> Once delivered, profit will be calculated as: <br />
                            <i>(Advance + COD) - Product Cost - 1% COD Charge - Delivery Charge - Packaging Charge</i>
                        </p>
                    </div>
                    <button className="btn-submit" type="submit" disabled={isCreating} style={{ marginTop: '20px' }}>
                        {isCreating ? 'Creating Order...' : 'Confirm & Send to Courier'}
                    </button>
                </form>
            </div>
        );
    };

    getStatusClass = (status) => {
        if (!status) return '';
        const s = status.toString().toLowerCase();
        if (s.includes('delivered')) return 'status-delivered';
        if (s.includes('cancelled')) return 'status-cancelled';
        if (s === 'pending') return 'status-pending';
        if (s === 'in_review') return 'status-in_review';
        if (s === 'hold') return 'status-hold';
        return '';
    };

    renderConsignments = () => {
        return (
            <div className="view-section">
                <div className="form-title">All Consignments</div>
                {this.renderOrderTable()}
            </div>
        );
    };

    handleLookup = async (e) => {
        if (e) e.preventDefault();
        const { lookupId } = this.state;
        if (!lookupId) return;

        this.setState({ isLoading: true, lookupResult: null });
        try {
            const res = await axios.get(`${API_URL}/steadfast/payment/${lookupId}`);
            console.log('Payment Lookup Response:', res.data);
            this.setState({ lookupResult: res.data, isLoading: false });
        } catch (error) {
            handleError(error, this.props.dispatch, 'Payment lookup failed. ID not found.');
            this.setState({ isLoading: false });
        }
    };

    renderPaymentLookup = () => {
        const { lookupId, lookupResult, isLoading } = this.state;
        return (
            <div className="view-section">
                <div className="form-title">Payment & Consignment Lookup</div>
                <div className="lookup-form" style={{ marginBottom: '30px', background: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                    <form onSubmit={this.handleLookup} style={{ display: 'flex', gap: '10px' }}>
                        <div style={{ flex: 1 }}>
                            <label style={{ fontSize: '13px', color: '#64748b', marginBottom: '5px', display: 'block' }}>Enter Payment ID or Consignment ID</label>
                            <input
                                className="form-input"
                                placeholder="e.g. 52410 or 12345678"
                                value={lookupId}
                                onChange={(e) => this.setState({ lookupId: e.target.value })}
                            />
                        </div>
                        <button className="btn-submit" type="submit" style={{ width: 'auto', padding: '0 30px', height: '42px', marginTop: '23px' }} disabled={isLoading}>
                            {isLoading ? <i className="fa fa-spinner fa-spin"></i> : 'Search Payment'}
                        </button>
                    </form>
                </div>

                {lookupResult && (
                    <div className="lookup-results">
                        <div className="summary-card" style={{ background: '#ecfeff', padding: '20px', borderRadius: '12px', border: '1px solid #cffafe', marginBottom: '25px' }}>
                            <h4 style={{ margin: '0 0 15px 0', color: '#0891b2' }}>
                                <i className="fa fa-info-circle"></i> Payment Summary
                            </h4>
                            <div className="row">
                                <div className="col-md-3">
                                    <div style={{ fontSize: '12px', color: '#64748b' }}>Payment ID</div>
                                    <div style={{ fontWeight: '700' }}>#{lookupResult.payment_summary?.id || lookupResult.id}</div>
                                </div>
                                <div className="col-md-3">
                                    <div style={{ fontSize: '12px', color: '#64748b' }}>Total Paid</div>
                                    <div style={{ fontWeight: '700', color: '#059669' }}>৳{(lookupResult.payment_summary?.amount || lookupResult.amount || 0).toLocaleString()}</div>
                                </div>
                                <div className="col-md-3">
                                    <div style={{ fontSize: '12px', color: '#64748b' }}>Date</div>
                                    <div style={{ fontWeight: '700' }}>{lookupResult.payment_summary?.updated_at || lookupResult.created_at || 'N/A'}</div>
                                </div>
                                <div className="col-md-3">
                                    <div style={{ fontSize: '12px', color: '#64748b' }}>Items</div>
                                    <div style={{ fontWeight: '700' }}>{(lookupResult.consignments || []).length} Parcels</div>
                                </div>
                            </div>
                        </div>

                        <h5>Consignments in this Payment</h5>
                        <div className="table-responsive">
                            <table className="courier-table">
                                <thead>
                                    <tr>
                                        <th>Consignment ID</th>
                                        <th>Invoice</th>
                                        <th>Tracking</th>
                                        <th style={{ textAlign: 'right' }}>COD Amount</th>
                                        <th style={{ textAlign: 'right' }}>Delivery Charge</th>
                                        <th style={{ textAlign: 'right' }}>Paid Amount</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(lookupResult.consignments || []).map((c, i) => (
                                        <tr key={i} style={{ background: (lookupResult.matched_item && lookupResult.matched_item.consignment_id === c.consignment_id) ? '#fffbeb' : '' }}>
                                            <td>{c.consignment_id}</td>
                                            <td>{c.invoice}</td>
                                            <td style={{ fontWeight: '600', color: '#06b6d4' }}>{c.tracking_code}</td>
                                            <td style={{ textAlign: 'right' }}>৳{(c.cod_amount || 0).toLocaleString()}</td>
                                            <td style={{ textAlign: 'right', color: '#dc2626' }}>৳{(c.delivery_charge || 0).toLocaleString()}</td>
                                            <td style={{ textAlign: 'right', fontWeight: '700', color: '#059669' }}>৳{(c.paid_amount || (c.cod_amount - c.delivery_charge) || 0).toLocaleString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    renderPayments = () => {
        const { payments, isLoading } = this.state;
        return (
            <div className="view-section">
                <div className="form-title">Payment History</div>
                <div className="table-responsive">
                    <table className="courier-table">
                        <thead>
                            <tr>
                                <th>Payment ID</th>
                                <th>Date</th>
                                <th style={{ textAlign: 'right' }}>Collected</th>
                                <th style={{ textAlign: 'right' }}>Charges</th>
                                <th style={{ textAlign: 'right' }}>Total Paid</th>
                                <th>Status</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr><td colSpan="7" style={{ textAlign: 'center', padding: '40px' }}><i className="fa fa-spinner fa-spin"></i> Loading...</td></tr>
                            ) : (payments || []).length === 0 ? (
                                <tr><td colSpan="7" style={{ textAlign: 'center', padding: '40px' }}>No payment records found.</td></tr>
                            ) : (
                                (payments || []).map((p, i) => (
                                    <tr key={i}>
                                        <td style={{ fontWeight: '700' }}>#{p.payment_id || p.id}</td>
                                        <td>{p.created_at || 'N/A'}</td>
                                        <td style={{ textAlign: 'right' }}>৳{(p.amount || 0).toLocaleString()}</td>
                                        <td style={{ textAlign: 'right', color: '#dc2626' }}>৳{(p.charges || 0).toLocaleString()}</td>
                                        <td style={{ textAlign: 'right', fontWeight: '700', color: '#059669' }}>৳{(p.total || 0).toLocaleString()}</td>
                                        <td>
                                            <span style={{
                                                padding: '3px 8px',
                                                borderRadius: '20px',
                                                fontSize: '11px',
                                                background: (p.status_label || '').toLowerCase() === 'paid' ? '#dcfce7' : '#fef9c3',
                                                color: (p.status_label || '').toLowerCase() === 'paid' ? '#15803d' : '#854d0e'
                                            }}>
                                                {p.status_label || 'unknown'}
                                            </span>
                                        </td>
                                        <td>
                                            <button
                                                className="btn-refresh"
                                                onClick={() => {
                                                    this.setState({ lookupId: p.payment_id || p.id }, () => {
                                                        if (this.props.setView) this.props.setView('payment_lookup');
                                                        this.handleLookup();
                                                    });
                                                }}
                                            >
                                                <i className="fa fa-eye"></i> View Details
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };

    render() {
        const { balance } = this.state;
        const { view } = this.props;

        return (
            <div className="steadfast-portal">
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '15px', marginBottom: '25px' }}>
                    <button className="btn-neon btn-neon--cyan" style={{ fontSize: '13px' }} onClick={this.refreshStatuses} title="Update all active orders and calculate profits">
                        <i className="fa fa-calculator"></i> Re-Sync Profits
                    </button>
                    <button className="btn-neon" style={{ fontSize: '13px', background: '#f8fafc', color: '#64748b' }} onClick={this.syncHistory} title="Sync orders from previous payments">
                        <i className="fa fa-history"></i> Sync Previous
                    </button>
                    <button className="btn-neon btn-neon--cyan" style={{ fontSize: '13px' }} onClick={this.fetchBalance}>
                        <i className="fa fa-refresh"></i> Check Balance: ৳{(balance || 0).toLocaleString()}
                    </button>
                </div>

                {view === 'dashboard' && this.renderDashboard()}
                {view === 'add_parcel' && this.renderAddParcel()}
                {view === 'consignments' && this.renderConsignments()}
                {view === 'payment_lookup' && this.renderPaymentLookup()}
                {view === 'payments' && this.renderPayments()}
                {view === 'returns' && <div className="view-section"><h3>Returns history feature coming soon!</h3></div>}

                {/* Tracking Modal */}
                {this.state.showTrackingModal && (
                    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <div style={{ background: '#fff', borderRadius: '12px', maxWidth: '600px', width: '90%', maxHeight: '80vh', overflow: 'auto', boxShadow: '0 25px 50px rgba(0,0,0,0.25)' }}>
                            <div style={{ padding: '20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc' }}>
                                <h4 style={{ margin: 0, color: '#0891b2' }}><i className="fa fa-truck"></i> Parcel Details</h4>
                                <button onClick={this.closeModals} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#64748b' }}>&times;</button>
                            </div>
                            <div style={{ padding: '20px' }}>
                                {!this.state.trackingData ? (
                                    <div style={{ textAlign: 'center', padding: '40px' }}><i className="fa fa-spinner fa-spin" style={{ fontSize: '24px', color: '#06b6d4' }}></i></div>
                                ) : this.state.trackingData.error ? (
                                    <div style={{ textAlign: 'center', color: '#dc2626' }}>{this.state.trackingData.error}</div>
                                ) : (
                                    <>
                                        <div style={{ marginBottom: '20px', padding: '15px', background: '#ecfeff', borderRadius: '8px', border: '1px solid #cffafe' }}>
                                            <div style={{ fontSize: '12px', color: '#0891b2', marginBottom: '5px' }}>Current Status</div>
                                            <div style={{ fontSize: '18px', fontWeight: 'bold', textTransform: 'capitalize' }}>
                                                {this.state.trackingData.steadfast_status?.delivery_status || this.state.trackingData.local_order?.status || 'Unknown'}
                                            </div>
                                        </div>

                                        {this.state.trackingData.local_order && (
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                                <div><span style={{ fontSize: '11px', color: '#64748b' }}>Parcel ID</span><div style={{ fontWeight: 'bold' }}>{this.state.trackingData.consignment_id}</div></div>
                                                <div><span style={{ fontSize: '11px', color: '#64748b' }}>Invoice</span><div style={{ fontWeight: 'bold' }}>{this.state.trackingData.local_order.invoice}</div></div>
                                                <div><span style={{ fontSize: '11px', color: '#64748b' }}>Tracking Code</span><div style={{ fontWeight: 'bold', color: '#06b6d4' }}>{this.state.trackingData.local_order.trackingCode}</div></div>
                                                <div><span style={{ fontSize: '11px', color: '#64748b' }}>Created By</span><div style={{ fontWeight: 'bold' }}>{this.state.trackingData.local_order.createdBy || 'Admin'}</div></div>
                                                <div><span style={{ fontSize: '11px', color: '#64748b' }}>Created Date</span><div>{new Date(this.state.trackingData.local_order.created).toLocaleString()}</div></div>
                                                <div style={{ gridColumn: '1 / -1', borderTop: '1px solid #e2e8f0', paddingTop: '15px' }}>
                                                    <span style={{ fontSize: '11px', color: '#64748b' }}>Recipient</span>
                                                    <div style={{ fontWeight: 'bold' }}>{this.state.trackingData.local_order.recipientName}</div>
                                                    <div>{this.state.trackingData.local_order.recipientPhone}</div>
                                                    <div style={{ color: '#64748b', fontSize: '13px' }}>{this.state.trackingData.local_order.recipientAddress}</div>
                                                </div>
                                                <div style={{ gridColumn: '1 / -1', borderTop: '1px solid #e2e8f0', paddingTop: '15px' }}>
                                                    <span style={{ fontSize: '11px', color: '#64748b' }}>Items Breakdown</span>
                                                    <table style={{ width: '100%', fontSize: '13px', marginTop: '5px', borderCollapse: 'collapse' }}>
                                                        <thead style={{ background: '#f8fafc' }}>
                                                            <tr>
                                                                <th style={{ textAlign: 'left', padding: '5px' }}>Product</th>
                                                                <th style={{ textAlign: 'center', padding: '5px' }}>Qty</th>
                                                                <th style={{ textAlign: 'right', padding: '5px' }}>Unit Cost</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {(this.state.trackingData.local_order.items || []).map((item, idx) => (
                                                                <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                                                    <td style={{ padding: '5px' }}>{item.name || 'Unknown Product'}</td>
                                                                    <td style={{ textAlign: 'center', padding: '5px' }}>{item.quantity}</td>
                                                                    <td style={{ textAlign: 'right', padding: '5px' }}>৳{(item.buyingPrice || 0).toLocaleString()}</td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                                <div style={{ gridColumn: '1 / -1', borderTop: '1px solid #e2e8f0', paddingTop: '10px' }}>
                                                    <span style={{ fontSize: '11px', color: '#64748b' }}>Full Note / Description</span>
                                                    <div style={{ fontSize: '13px', fontStyle: 'italic', marginTop: '3px' }}>{this.state.trackingData.local_order.itemDescription || this.state.trackingData.local_order.note || 'N/A'}</div>
                                                </div>
                                                <div><span style={{ fontSize: '11px', color: '#64748b' }}>Advance</span><div style={{ color: '#059669', fontWeight: 'bold' }}>৳{(this.state.trackingData.local_order.advanceAmount || 0).toLocaleString()}</div></div>
                                                <div><span style={{ fontSize: '11px', color: '#64748b' }}>COD Amount</span><div style={{ fontWeight: 'bold' }}>৳{(this.state.trackingData.local_order.codAmount || 0).toLocaleString()}</div></div>
                                                <div><span style={{ fontSize: '11px', color: '#64748b' }}>Product Cost</span><div style={{ color: '#dc2626' }}>৳{(this.state.trackingData.local_order.productCost || 0).toLocaleString()}</div></div>
                                                <div><span style={{ fontSize: '11px', color: '#64748b' }}>Delivery Charge</span><div style={{ color: '#64748b' }}>৳{(this.state.trackingData.local_order.deliveryCharge || 0).toLocaleString()}</div></div>
                                                <div><span style={{ fontSize: '11px', color: '#64748b' }}>Packaging</span><div>৳{(this.state.trackingData.local_order.packagingCharge || 0).toLocaleString()}</div></div>
                                                <div><span style={{ fontSize: '11px', color: '#64748b' }}>Profit</span><div style={{ fontWeight: 'bold', color: (this.state.trackingData.local_order.profit || 0) >= 0 ? '#059669' : '#dc2626' }}>৳{(this.state.trackingData.local_order.profit || 0).toLocaleString()}</div></div>
                                            </div>
                                        )}

                                        {this.state.trackingData.local_order?.trackingCode && (
                                            <div style={{ marginTop: '20px', textAlign: 'center' }}>
                                                <a href={`https://steadfast.com.bd/t/${this.state.trackingData.local_order.trackingCode}`} target="_blank" rel="noopener noreferrer" className="btn-neon btn-neon--cyan" style={{ display: 'inline-block', padding: '10px 20px' }}>
                                                    <i className="fa fa-external-link"></i> View on Steadfast
                                                </a>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Local Edit Modal */}
                {this.state.showEditModal && (
                    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <div style={{ background: '#fff', borderRadius: '12px', maxWidth: '700px', width: '90%', maxHeight: '90vh', overflow: 'auto' }}>
                            <div style={{ padding: '20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h4 style={{ margin: 0 }}><i className="fa fa-edit"></i> Edit Local Record</h4>
                                <button onClick={this.closeModals} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer' }}>&times;</button>
                            </div>
                            <div style={{ padding: '20px' }}>
                                <div className="row">
                                    <div className="col-md-6">
                                        <div className="form-group">
                                            <label>Recipient Name</label>
                                            <input className="form-input" name="recipientName" value={this.state.editFormData.recipientName} onChange={this.handleEditInputChange} />
                                        </div>
                                        <div className="form-group">
                                            <label>Created By</label>
                                            <input className="form-input" name="createdBy" value={this.state.editFormData.createdBy} onChange={this.handleEditInputChange} />
                                        </div>
                                        <div className="form-group">
                                            <label>COD Amount</label>
                                            <input className="form-input" type="number" name="codAmount" value={this.state.editFormData.codAmount} onChange={this.handleEditInputChange} />
                                        </div>
                                    </div>
                                    <div className="col-md-6">
                                        <div className="form-group">
                                            <label>Product Cost</label>
                                            <input className="form-input" type="number" name="productCost" value={this.state.editFormData.productCost} onChange={this.handleEditInputChange} />
                                        </div>
                                        <div className="form-group">
                                            <label>Packaging Charge</label>
                                            <input className="form-input" type="number" name="packagingCharge" value={this.state.editFormData.packagingCharge} onChange={this.handleEditInputChange} />
                                        </div>
                                    </div>
                                </div>

                                <div style={{ marginTop: '20px', padding: '15px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                                        <label style={{ fontWeight: 'bold' }}>Products</label>
                                        <button type="button" onClick={this.handleEditProductAdd} className="btn-neon" style={{ fontSize: '11px', padding: '3px 10px' }}>+ Add</button>
                                    </div>
                                    {this.state.editFormData.items.map((item, idx) => (
                                        <div key={idx} style={{ display: 'flex', gap: '5px', marginBottom: '8px' }}>
                                            <select
                                                className="form-input"
                                                style={{ flex: 3, padding: '5px', fontSize: '12px' }}
                                                value={item.product?._id || item.product}
                                                onChange={(e) => this.handleEditProductChange(idx, 'product', e.target.value)}
                                            >
                                                <option value="">Select...</option>
                                                {this.state.allProducts.map(p => <option key={p._id} value={p._id}>{p.shortName || p.name}</option>)}
                                            </select>
                                            <input
                                                className="form-input"
                                                style={{ flex: 1.5, padding: '5px', fontSize: '12px' }}
                                                type="number"
                                                placeholder="Cost"
                                                value={item.buyingPrice || ''}
                                                onChange={(e) => this.handleEditProductChange(idx, 'buyingPrice', e.target.value)}
                                            />
                                            <input
                                                className="form-input"
                                                style={{ flex: 1, padding: '5px', fontSize: '12px' }}
                                                type="number"
                                                placeholder="Qty"
                                                value={item.quantity}
                                                onChange={(e) => this.handleEditProductChange(idx, 'quantity', e.target.value)}
                                            />
                                            <button onClick={() => this.handleEditProductRemove(idx)} style={{ color: 'red', border: 'none', background: 'none' }}><i className="fa fa-trash"></i></button>
                                        </div>
                                    ))}
                                </div>

                                <button onClick={this.handleLocalUpdate} className="btn-submit" style={{ marginTop: '20px' }} disabled={this.state.isLoading}>
                                    {this.state.isLoading ? 'Updating...' : 'Save Local Changes'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

            </div>
        );
    }
}

const mapStateToProps = state => ({
    user: state.account.user
});

const mapDispatchToProps = dispatch => ({
    ...actions(dispatch),
    success: (opts) => dispatch(success(opts)),
    dispatch
});

export default connect(mapStateToProps, mapDispatchToProps)(SteadfastCourier);
