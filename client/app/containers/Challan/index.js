import React from 'react';
import { connect } from 'react-redux';
import axios from 'axios';
import {
    Row,
    Col,
    Card,
    CardBody,
    Button,
    Table,
    Input,
    FormGroup,
    Label,
    ModalFooter,
    Modal,
    ModalHeader,
    ModalBody,
    Badge
} from 'reactstrap';
import { success, error, warning } from 'react-notification-system-redux';
import dayjs from 'dayjs';

import './styles.css';
import { API_URL } from '../../constants';
import actions from '../../actions';
import SubPage from '../../components/Manager/SubPage';

class Challan extends React.PureComponent {
    constructor(props) {
        super(props);
        this.state = {
            isAddMode: false,
            challans: [],
            isLoading: false,
            error: null,

            // Form State
            challanNumber: `CH-${Date.now()}`,
            selectedCustomer: null,
            customerName: '',
            customerPhone: '',
            customerAddress: '',
            items: [{ productId: '', productName: '', quantity: 1, unitPrice: 0 }],
            notes: '',

            // Search / Dropdown state
            searchResults: [],
            customerSearchResults: [],
            focusedRowIndex: null,
            isCustomerSearching: false,
            searchTerm: '',

            // Settlement State
            isSettleModalOpen: false,
            activeChallan: null,
            settlements: [] // Array of { itemId, type, quantity }
        };
    }

    componentDidMount() {
        this.fetchChallans();
    }

    fetchChallans = async () => {
        this.setState({ isLoading: true });
        try {
            const response = await axios.get(`${API_URL}/challan`);
            this.setState({ challans: response.data.challans, isLoading: false });
        } catch (error) {
            this.setState({ error: 'Failed to fetch challans', isLoading: false });
        }
    };

    toggleAddMode = () => {
        this.setState({
            isAddMode: !this.state.isAddMode,
            challanNumber: `CH-${Date.now()}`,
            items: [{ productId: '', productName: '', quantity: 1, unitPrice: 0, isManual: false }],
            selectedCustomer: null,
            customerName: '',
            customerPhone: '',
            customerAddress: '',
            notes: ''
        });
    };

    handleCustomerSearch = async (term) => {
        this.setState({ customerName: term, selectedCustomer: null });
        if (!term || term.length < 2) {
            this.setState({ customerSearchResults: [] });
            return;
        }
        try {
            const response = await axios.get(`${API_URL}/customer/search/name/${term}`);
            this.setState({ customerSearchResults: response.data.customers || [] });
        } catch (error) {
            console.error('Customer search error', error);
        }
    };

    handleCustomerSelect = (customer) => {
        this.setState({
            selectedCustomer: customer._id,
            customerName: customer.name,
            customerPhone: customer.phoneNumber || '',
            customerAddress: customer.address || '',
            customerSearchResults: []
        });
    };

    handleCustomerChange = (e) => {
        const { name, value } = e.target;
        this.setState({ [name]: value });
    };

    handleItemChange = (index, field, value) => {
        const items = [...this.state.items];
        items[index][field] = value;
        this.setState({ items });
    };

    addItemRow = () => {
        this.setState({
            items: [...this.state.items, { productId: '', productName: '', quantity: 1, unitPrice: 0, isManual: false }]
        });
    };

    removeItemRow = (index) => {
        const items = [...this.state.items];
        items.splice(index, 1);
        this.setState({ items });
    };

    searchProducts = async (term) => {
        if (!term || term.length < 2) {
            this.setState({ searchResults: [] });
            return;
        }
        try {
            const response = await axios.get(`${API_URL}/product/list/search/${term}`);
            this.setState({ searchResults: response.data.products || [] });
        } catch (error) {
            console.error('Search error', error);
        }
    };

    handleProductSelect = (index, product) => {
        const items = [...this.state.items];
        items[index] = {
            ...items[index],
            productId: product._id,
            productName: product.shortName || product.name,
            unitPrice: product.price,
            isManual: false
        };
        this.setState({ items, searchResults: [], focusedRowIndex: null, searchTerm: '' });
    };

    saveChallan = async () => {
        const { challanNumber, selectedCustomer, customerName, customerPhone, customerAddress, items, notes } = this.state;
        const { user } = this.props;

        if (!customerName || items.some(i => !i.productName)) {
            this.props.warning({ title: 'Please provide customer name and item details.', position: 'tr', autoDismiss: 3 });
            return;
        }

        try {
            const payload = {
                challanNumber,
                customer: selectedCustomer,
                customerName,
                customerPhone,
                customerAddress,
                items: items.map(i => ({
                    product: i.isManual ? null : i.productId,
                    productName: i.productName,
                    quantity: i.quantity,
                    unitPrice: i.unitPrice,
                    totalPrice: i.quantity * i.unitPrice
                })),
                notes,
                createdBy: user.firstName + ' ' + user.lastName
            };

            const response = await axios.post(`${API_URL}/challan/create`, payload);
            if (response.data.success) {
                this.props.success({ title: 'Lending saved successfully.', position: 'tr', autoDismiss: 3 });
                this.toggleAddMode();
                this.fetchChallans();
            }
        } catch (error) {
            this.props.error({ title: err.response?.data?.error || 'Failed to save record', position: 'tr', autoDismiss: 5 });
        }
    };

    openSettleModal = (challan) => {
        const settlements = challan.items.map(item => ({
            itemId: item._id,
            productName: item.productName,
            totalQty: item.quantity,
            remainingQty: item.quantity - (item.returnedQuantity || 0) - (item.billedQuantity || 0),
            settleQty: 0,
            type: 'return'
        }));
        this.setState({ isSettleModalOpen: true, activeChallan: challan, settlements });
    };

    handleSettlementChange = (index, field, value) => {
        const settlements = [...this.state.settlements];
        settlements[index][field] = value;
        this.setState({ settlements });
    };

    deleteChallan = async (id) => {
        if (!window.confirm('Are you sure you want to delete this record? Stock will be restored for un-settled items.')) {
            return;
        }
        try {
            await axios.delete(`${API_URL}/challan/${id}`);
            this.props.success({ title: 'Record deleted successfully.', position: 'tr', autoDismiss: 3 });
            this.fetchChallans();
        } catch (error) {
            this.props.error({ title: 'Failed to delete.', position: 'tr', autoDismiss: 5 });
        }
    };

    submitSettlement = async () => {
        const { activeChallan, settlements } = this.state;
        const itemSettlements = settlements
            .filter(s => s.settleQty > 0)
            .map(s => ({
                itemId: s.itemId,
                type: s.type,
                quantity: s.settleQty
            }));

        if (itemSettlements.length === 0) return;

        try {
            await axios.put(`${API_URL}/challan/settle/${activeChallan._id}`, { itemSettlements });

            // If any items are type 'bill' (Make Invoice), open invoice page
            const billItems = settlements.filter(s => s.type === 'bill' && s.settleQty > 0);
            if (billItems.length > 0) {
                const invoiceData = {
                    customerName: activeChallan.customerName,
                    customerPhone: activeChallan.customerPhone,
                    items: billItems.map(s => {
                        const originalItem = activeChallan.items.find(i => i._id === s.itemId);
                        return {
                            product: originalItem.product,
                            productName: originalItem.productName,
                            quantity: s.settleQty,
                            unitPrice: originalItem.unitPrice
                        };
                    })
                };

                const query = encodeURIComponent(JSON.stringify(invoiceData));
                window.open(`/dashboard/invoice?prefill=${query}`, '_blank');
            }

            this.props.success({ title: 'Settlement processed successfully.', position: 'tr', autoDismiss: 3 });
            this.setState({ isSettleModalOpen: false });
            this.fetchChallans();
        } catch (error) {
            this.props.error({ title: 'Failed to settle.', position: 'tr', autoDismiss: 5 });
        }
    };

    render() {
        const { isAddMode, challans, isLoading, items, searchResults, focusedRowIndex, searchTerm } = this.state;

        return (
            <div className="challan-page">
                <div className="challan-container">
                    {!isAddMode ? (
                        <div className="list-view">
                            <div className="d-flex justify-content-between align-items-center" style={{ background: '#fff', padding: '20px 24px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', marginBottom: '20px' }}>
                                <div className="d-flex align-items-center">
                                    <div style={{
                                        width: '4px',
                                        height: '24px',
                                        background: '#06b6d4',
                                        borderRadius: '2px',
                                        marginRight: '12px'
                                    }}></div>
                                    <h2 className="mb-0" style={{
                                        fontWeight: '700',
                                        color: '#1e293b',
                                        fontSize: '20px',
                                        letterSpacing: '-0.5px'
                                    }}>
                                        Lendings
                                    </h2>
                                    <span className="text-muted small ml-3 d-none d-md-block" style={{ borderLeft: '1px solid #e2e8f0', paddingLeft: '15px' }}>
                                        Track products given as samples or debt
                                    </span>
                                </div>
                                <button
                                    className="btn-neon btn-neon--cyan"
                                    onClick={this.toggleAddMode}
                                >
                                    <i className="fa fa-plus-circle"></i> New Lending
                                </button>
                            </div>

                            <Card className="shadow-sm border-0">
                                <Table responsive hover className="mb-0">
                                    <thead className="bg-light">
                                        <tr>
                                            <th>Lending #</th>
                                            <th>Customer</th>
                                            <th>Date</th>
                                            <th>Items</th>
                                            <th>Status</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {challans.map(c => (
                                            <tr key={c._id}>
                                                <td className="font-weight-bold">{c.challanNumber}</td>
                                                <td>
                                                    <div>{c.customerName}</div>
                                                    <small className="text-muted">{c.customerPhone}</small>
                                                </td>
                                                <td>{dayjs(c.created).format('DD MMM YYYY')}</td>
                                                <td>{c.items.length} Products</td>
                                                <td>
                                                    <Badge color={c.status === 'Sent' ? 'warning' : 'success'}>
                                                        {c.status}
                                                    </Badge>
                                                </td>
                                                <td>
                                                    <div className="d-flex gap-2">
                                                        <Button size="sm" color="outline-primary" onClick={() => this.openSettleModal(c)}>
                                                            Settle / Return
                                                        </Button>
                                                        <Button size="sm" color="outline-danger" onClick={() => this.deleteChallan(c._id)}>
                                                            <i className="fa fa-trash"></i>
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                        {challans.length === 0 && (
                                            <tr>
                                                <td colSpan="6" className="text-center py-4 text-muted">No records found.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </Table>
                            </Card>
                        </div>
                    ) : (
                        <div className="add-view">
                            <Card className="shadow-sm border-0">
                                <CardBody>
                                    <Row>
                                        <Col md={4}>
                                            <FormGroup style={{ position: 'relative' }}>
                                                <Label>Customer Name</Label>
                                                <Input
                                                    name="customerName"
                                                    value={this.state.customerName}
                                                    autoComplete="off"
                                                    onChange={(e) => this.handleCustomerSearch(e.target.value)}
                                                    placeholder="Search or Enter Name"
                                                />
                                                {this.state.customerSearchResults.length > 0 && (
                                                    <div className="search-dropdown" style={{ position: 'absolute', zIndex: 200, background: '#fff', border: '1px solid #ddd', width: '100%', maxHeight: '200px', overflowY: 'auto', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                                                        {this.state.customerSearchResults.map(c => (
                                                            <div
                                                                key={c._id}
                                                                className="p-2 border-bottom hover-bg-light"
                                                                style={{ cursor: 'pointer' }}
                                                                onClick={() => this.handleCustomerSelect(c)}
                                                            >
                                                                {c.name} <small className="text-muted ml-2">{c.phoneNumber}</small>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </FormGroup>
                                        </Col>
                                        <Col md={4}>
                                            <FormGroup>
                                                <Label>Phone Number</Label>
                                                <Input name="customerPhone" value={this.state.customerPhone} onChange={this.handleCustomerChange} />
                                            </FormGroup>
                                        </Col>
                                        <Col md={4}>
                                            <FormGroup>
                                                <Label>Lending #</Label>
                                                <Input value={this.state.challanNumber} disabled />
                                            </FormGroup>
                                        </Col>
                                    </Row>

                                    <h5 className="mt-4 mb-3 border-bottom pb-2">Products</h5>
                                    <Table borderless>
                                        <thead>
                                            <tr>
                                                <th style={{ width: '50%' }}>Product</th>
                                                <th>Qty</th>
                                                <th>Price (Ref)</th>
                                                <th>Total</th>
                                                <th></th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {items.map((item, idx) => (
                                                <tr key={idx}>
                                                    <td style={{ position: 'relative' }}>
                                                        <div className="d-flex gap-2 align-items-center">
                                                            <Input
                                                                placeholder={item.isManual ? "Describe item (e.g. Money)" : "Search product..."}
                                                                value={(!item.isManual && focusedRowIndex === idx) ? searchTerm : item.productName}
                                                                onFocus={() => {
                                                                    if (!item.isManual) {
                                                                        this.setState({ focusedRowIndex: idx, searchTerm: '' });
                                                                    }
                                                                }}
                                                                onChange={(e) => {
                                                                    if (item.isManual) {
                                                                        this.handleItemChange(idx, 'productName', e.target.value);
                                                                    } else {
                                                                        this.setState({ searchTerm: e.target.value });
                                                                        this.searchProducts(e.target.value);
                                                                    }
                                                                }}
                                                            />
                                                            <FormGroup check className="mb-0 flex-shrink-0" style={{ minWidth: '85px' }}>
                                                                <Label check style={{ fontSize: '11px' }}>
                                                                    <Input
                                                                        type="checkbox"
                                                                        checked={item.isManual}
                                                                        onChange={(e) => {
                                                                            this.handleItemChange(idx, 'isManual', e.target.checked);
                                                                            if (e.target.checked) {
                                                                                this.handleItemChange(idx, 'productId', null);
                                                                            }
                                                                        }}
                                                                    /> Manual
                                                                </Label>
                                                            </FormGroup>
                                                        </div>
                                                        {!item.isManual && focusedRowIndex === idx && searchResults.length > 0 && (
                                                            <div className="search-dropdown" style={{ position: 'absolute', zIndex: 10, background: '#fff', border: '1px solid #ddd', width: '80%', maxHeight: '200px', overflowY: 'auto' }}>
                                                                {searchResults.map(p => (
                                                                    <div
                                                                        key={p._id}
                                                                        className="p-2 border-bottom hover-bg-light" style={{ cursor: 'pointer' }}
                                                                        onClick={() => this.handleProductSelect(idx, p)}
                                                                    >
                                                                        {p.shortName || p.name} <small className="text-muted ml-2">SKU: {p.sku}</small>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td>
                                                        <Input type="number" value={item.quantity} onChange={(e) => this.handleItemChange(idx, 'quantity', e.target.value)} />
                                                    </td>
                                                    <td>
                                                        <Input type="number" value={item.unitPrice} onChange={(e) => this.handleItemChange(idx, 'unitPrice', e.target.value)} />
                                                    </td>
                                                    <td className="align-middle">
                                                        {(item.quantity * item.unitPrice).toLocaleString()}
                                                    </td>
                                                    <td>
                                                        <Button close onClick={() => this.removeItemRow(idx)} />
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </Table>
                                    <Button color="link" className="p-0 text-primary" onClick={this.addItemRow}>+ Add Row</Button>

                                    <div className="mt-4 d-flex justify-content-end gap-2">
                                        <Button color="light" onClick={this.toggleAddMode}>Cancel</Button>
                                        <Button color="success" onClick={this.saveChallan}>
                                            <i className="fa fa-save mr-2"></i> Save Lending (Deduct Stock)
                                        </Button>
                                    </div>
                                </CardBody>
                            </Card>
                        </div>
                    )}

                    {/* Settlement Modal */}
                    <Modal isOpen={this.state.isSettleModalOpen} toggle={() => this.setState({ isSettleModalOpen: false })} size="lg">
                        <ModalHeader>Settle Lendings for {this.state.activeChallan?.challanNumber}</ModalHeader>
                        <ModalBody>
                            <Table responsive>
                                <thead>
                                    <tr>
                                        <th>Product</th>
                                        <th>Remaining</th>
                                        <th>Action Qty</th>
                                        <th>Type</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {this.state.settlements.map((s, idx) => (
                                        <tr key={idx}>
                                            <td>{s.productName}</td>
                                            <td>{s.remainingQty}</td>
                                            <td>
                                                <Input type="number" max={s.remainingQty} value={s.settleQty} onChange={(e) => this.handleSettlementChange(idx, 'settleQty', e.target.value)} />
                                            </td>
                                            <td>
                                                <Input type="select" value={s.type} onChange={(e) => this.handleSettlementChange(idx, 'type', e.target.value)}>
                                                    <option value="return">Return to Shop (Adds Stock)</option>
                                                    <option value="bill">Make Invoice (Adds stock back first)</option>
                                                </Input>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                            <p className="text-muted small"><strong>Note:</strong> Items marked as 'Make Invoice' will open a new invoice tab. Stock is added back to your system now, because saving the invoice will deduct it again automatically.</p>
                        </ModalBody>
                        <ModalFooter>
                            <Button color="secondary" onClick={() => this.setState({ isSettleModalOpen: false })}>Close</Button>
                            <Button color="primary" onClick={this.submitSettlement}>Confirm Settlement</Button>
                        </ModalFooter>
                    </Modal>
                </div>
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

export default connect(mapStateToProps, mapDispatchToProps)(Challan);
