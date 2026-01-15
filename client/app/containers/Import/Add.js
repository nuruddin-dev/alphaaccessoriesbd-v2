import React from 'react';
import { connect } from 'react-redux';
import { success, error, warning } from 'react-notification-system-redux';
import axios from 'axios';
import actions from '../../actions';
import { Row, Col, Card, CardBody, Button, Form, FormGroup, Label, Input, Table } from 'reactstrap';
import { API_URL } from '../../constants';

class ImportAdd extends React.Component {
    state = {
        isEditing: false,
        isLoading: false,
        suppliers: [],

        // Form Data
        supplier: '',
        orderDate: new Date().toISOString().slice(0, 10),
        notes: '',
        status: 'Draft',

        // Costing
        rmbRate: 0,
        taxType: 'total', // total, per_item, per_ctn
        taxValue: 0,
        labourBillPerCtn: 0,

        // Items
        items: [],
        products: [], // Loaded for selection

        // Shipments
        shipments: [],
        isShipmentModalOpen: false,
        newShipmentDate: new Date().toISOString().slice(0, 10),
        newShipmentItems: [] // { product, quantity, modelName }
    };

    componentDidMount() {
        this.fetchSuppliers();
        this.fetchProducts();
        const { id } = this.props.match.params;
        if (id) {
            this.setState({ isEditing: true });
            this.fetchOrder(id);
        } else {
            // Add initial empty item row
            this.addItemRow();
        }
    }

    fetchSuppliers = async () => {
        try {
            const response = await axios.get(`${API_URL}/supplier`);
            this.setState({ suppliers: response.data.suppliers });
        } catch (error) {
            console.error(err);
        }
    };

    fetchOrder = async (id) => {
        try {
            const response = await axios.get(`${API_URL}/import/${id}`);
            const order = response.data.importOrder;
            this.setState({
                supplier: order.supplier ? order.supplier._id : '',
                orderDate: order.orderDate.slice(0, 10),
                notes: order.notes,
                status: order.status,
                items: order.items,
                rmbRate: order.costs.rmbRate,
                taxType: order.costs.taxType,
                taxValue: order.costs.taxValue,
                labourBillPerCtn: order.costs.labourBillPerCtn,
                shipments: order.shipments || []
            });
        } catch (error) {
            console.error(err);
        }
    };

    handleInputChange = (e) => {
        this.setState({ [e.target.name]: e.target.value });
    };

    addItemRow = () => {
        this.setState(prevState => ({
            items: [...prevState.items, {
                modelName: '',
                quantityPerCtn: 0,
                ctn: 0,
                totalQuantity: 0,
                priceRMB: 0,
                totalAmountRMB: 0,
                perCtnWeight: 0,
                totalCtnWeight: 0
            }]
        }));
    };

    removeItemRow = (index) => {
        const newItems = [...this.state.items];
        newItems.splice(index, 1);
        this.setState({ items: newItems });
    };

    handleItemChange = (index, field, value) => {
        const newItems = [...this.state.items];
        newItems[index][field] = value;

        // Auto Calculations
        const item = newItems[index];
        const qtyPerCtn = Number(item.quantityPerCtn) || 0;
        const ctn = Number(item.ctn) || 0;
        const priceRMB = Number(item.priceRMB) || 0;
        const weight = Number(item.perCtnWeight) || 0;

        if (field === 'quantityPerCtn' || field === 'ctn') {
            item.totalQuantity = qtyPerCtn * ctn;
            item.totalCtnWeight = ctn * weight;
            item.totalAmountRMB = item.totalQuantity * priceRMB;
        }
        if (field === 'priceRMB') {
            item.totalAmountRMB = (item.totalQuantity || 0) * priceRMB;
        }
        if (field === 'perCtnWeight') {
            item.totalCtnWeight = (item.ctn || 0) * weight;
        }

        this.setState({ items: newItems });
    };

    handleSubmit = async () => {
        const payload = {
            supplier: this.state.supplier,
            orderDate: this.state.orderDate,
            notes: this.state.notes,
            items: this.state.items,
            costs: {
                rmbRate: Number(this.state.rmbRate),
                taxType: this.state.taxType,
                taxValue: Number(this.state.taxValue),
                labourBillPerCtn: Number(this.state.labourBillPerCtn)
            }
        };

        try {
            if (this.state.isEditing) {
                await axios.put(`${API_URL}/import/${this.props.match.params.id}`, payload);
                this.props.success({ title: 'Order Updated!', position: 'tr', autoDismiss: 3 });
            } else {
                await axios.post(`${API_URL}/import/add`, payload);
                this.props.success({ title: 'Order Created!', position: 'tr', autoDismiss: 3 });
                this.props.history.push('/dashboard/import');
            }
        } catch (error) {
            this.props.error({ title: 'Error saving order', position: 'tr', autoDismiss: 5 });
            console.error(err);
        }
    };


    fetchProducts = async () => {
        try {
            const response = await axios.get(`${API_URL}/product/list/select`);
            if (!response.data.products && !Array.isArray(response.data)) {
                const res2 = await axios.get(`${API_URL}/product/list`);
                this.setState({ products: res2.data.products });
            } else {
                this.setState({ products: response.data.products || response.data });
            }
        } catch (error) {
            try {
                const res = await axios.get(`${API_URL}/product/list`);
                this.setState({ products: res.data.products });
            } catch (e) { }
        }
    };

    // Shipment Handlers
    toggleShipmentModal = () => {
        this.setState(prevState => ({
            isShipmentModalOpen: !prevState.isShipmentModalOpen,
            // Reset items for new shipment based on current order items
            newShipmentItems: prevState.isShipmentModalOpen ? [] : this.state.items.map(item => ({
                product: item.product,
                modelName: item.modelName,
                shortName: item.shortName || item.modelName,
                quantity: 0,
                maxQty: item.totalQuantity
            }))
        }));
    };

    handleShipmentItemChange = (index, value) => {
        const items = [...this.state.newShipmentItems];
        items[index].quantity = parseInt(value) || 0;
        this.setState({ newShipmentItems: items });
    };

    handleSubmitShipment = async () => {
        const { newShipmentDate, newShipmentItems } = this.state;
        const itemsToShip = newShipmentItems.filter(i => i.quantity > 0).map(i => ({
            product: i.product,
            modelName: i.modelName,
            shortName: i.shortName || i.modelName,
            quantity: i.quantity
        }));

        if (itemsToShip.length === 0) return this.props.warning({ title: 'Please enter quantity for at least one item.', position: 'tr', autoDismiss: 3 });

        try {
            await axios.post(`${API_URL}/import/${this.props.match.params.id}/shipment/add`, {
                shipmentDate: newShipmentDate,
                items: itemsToShip
            });
            this.props.success({ title: 'Shipment Created!', position: 'tr', autoDismiss: 3 });
            this.toggleShipmentModal();
            this.fetchOrder(this.props.match.params.id); // Refresh
        } catch (error) {
            this.props.error({ title: 'Error creating shipment', position: 'tr', autoDismiss: 5 });
        }
    };

    handleReceiveShipment = async (shipmentId) => {
        if (!window.confirm('Are you sure you want to receive this shipment? This will update product stock and buying prices.')) return;
        try {
            await axios.post(`${API_URL}/import/${this.props.match.params.id}/receive`, { shipmentId });
            this.props.success({ title: 'Shipment Received & Stock Updated!', position: 'tr', autoDismiss: 3 });
            this.fetchOrder(this.props.match.params.id);
        } catch (error) {
            this.props.error({ title: 'Error receiving shipment: ' + (error.response?.data?.error || err.message), position: 'tr', autoDismiss: 5 });
        }
    };

    handleDeleteShipment = async (shipmentId) => {
        if (!window.confirm('Delete this shipment record?')) return;
        try {
            await axios.delete(`${API_URL}/import/${this.props.match.params.id}/shipment/${shipmentId}`);
            this.props.success({ title: 'Shipment Deleted!', position: 'tr', autoDismiss: 3 });
            this.fetchOrder(this.props.match.params.id);
        } catch (error) {
            this.props.error({ title: 'Error deleting shipment', position: 'tr', autoDismiss: 5 });
        }
    };

    renderProductSelect = (index, item) => {
        const { products } = this.state;
        return (
            <Input
                type="select"
                bsSize="sm"
                value={item.product || ''}
                onChange={e => {
                    const prodId = e.target.value;
                    const prod = products.find(p => p._id === prodId);
                    this.handleItemChange(index, 'product', prodId);
                    if (prod) {
                        this.handleItemChange(index, 'modelName', prod.name);
                        this.handleItemChange(index, 'shortName', prod.shortName || prod.name);
                    }
                }}
            >
                <option value="">Select Product</option>
                {products.map(p => (
                    <option key={p._id} value={p._id}>{p.shortName || p.name} ({p.sku})</option>
                ))}
            </Input>
        );
    };

    render() {
        const { suppliers, items, isEditing } = this.state;
        const suppliersList = suppliers || [];

        return (
            <div className="import-add">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <h3>{isEditing ? 'Edit Import Order' : 'New Import Order'}</h3>
                    <Button color="secondary" onClick={() => this.props.history.push('/dashboard/import')}>Back</Button>
                </div>

                <Row>
                    <Col md="12">
                        <Card className="mb-4">
                            <CardBody>
                                <h6>Order Information</h6>
                                <Row>
                                    <Col md="4">
                                        <FormGroup>
                                            <Label>Supplier</Label>
                                            <Input type="select" name="supplier" value={this.state.supplier} onChange={this.handleInputChange}>
                                                <option value="">Select Supplier</option>
                                                {suppliersList.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                                            </Input>
                                        </FormGroup>
                                    </Col>
                                    <Col md="4">
                                        <FormGroup>
                                            <Label>Order Date</Label>
                                            <Input type="date" name="orderDate" value={this.state.orderDate} onChange={this.handleInputChange} />
                                        </FormGroup>
                                    </Col>
                                    <Col md="4">
                                        <FormGroup>
                                            <Label>Notes</Label>
                                            <Input name="notes" value={this.state.notes} onChange={this.handleInputChange} placeholder="Any notes..." />
                                        </FormGroup>
                                    </Col>
                                </Row>
                            </CardBody>
                        </Card>
                    </Col>

                    <Col md="12">
                        <Card className="mb-4">
                            <CardBody>
                                <div className="d-flex justify-content-between align-items-center mb-3">
                                    <h6>Items</h6>
                                    <Button size="sm" color="info" onClick={this.addItemRow}>+ Add Item</Button>
                                </div>
                                <Table responsive size="sm" bordered>
                                    <thead className="thead-light">
                                        <tr>
                                            <th style={{ width: '20%' }}>Model Name</th>
                                            <th style={{ width: '10%' }}>Qty/Ctn</th>
                                            <th style={{ width: '10%' }}>Ctn</th>
                                            <th style={{ width: '10%' }}>Total Qty</th>
                                            <th style={{ width: '10%' }}>Price (RMB)</th>
                                            <th style={{ width: '15%' }}>Total (RMB)</th>
                                            <th style={{ width: '10%' }}>Weight/Ctn</th>
                                            <th style={{ width: '5%' }}></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {items.map((item, index) => (
                                            <tr key={index}>
                                                <td>
                                                    {this.renderProductSelect(index, item)}
                                                </td>
                                                <td><Input bsSize="sm" type="number" value={item.quantityPerCtn} onChange={e => this.handleItemChange(index, 'quantityPerCtn', e.target.value)} /></td>
                                                <td><Input bsSize="sm" type="number" value={item.ctn} onChange={e => this.handleItemChange(index, 'ctn', e.target.value)} /></td>
                                                <td><Input bsSize="sm" disabled value={item.totalQuantity} /></td>
                                                <td><Input bsSize="sm" type="number" value={item.priceRMB} onChange={e => this.handleItemChange(index, 'priceRMB', e.target.value)} /></td>
                                                <td><Input bsSize="sm" disabled value={item.totalAmountRMB} /></td>
                                                <td><Input bsSize="sm" type="number" value={item.perCtnWeight} onChange={e => this.handleItemChange(index, 'perCtnWeight', e.target.value)} /></td>
                                                <td className="text-center">
                                                    <i className="fa fa-trash text-danger cursor-pointer" onClick={() => this.removeItemRow(index)}></i>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </Table>
                            </CardBody>
                        </Card>
                    </Col>

                    <Col md="12">
                        <Card className="mb-4">
                            <CardBody>
                                <h6>Costing & Factors</h6>
                                <Row>
                                    <Col md="3">
                                        <FormGroup>
                                            <Label>RMB Rate (BDT)</Label>
                                            <Input type="number" name="rmbRate" value={this.state.rmbRate} onChange={this.handleInputChange} />
                                        </FormGroup>
                                    </Col>
                                    <Col md="3">
                                        <FormGroup>
                                            <Label>Labor Bill (Per Ctn)</Label>
                                            <Input type="number" name="labourBillPerCtn" value={this.state.labourBillPerCtn} onChange={this.handleInputChange} />
                                        </FormGroup>
                                    </Col>
                                    <Col md="3">
                                        <FormGroup>
                                            <Label>Tax Type</Label>
                                            <Input type="select" name="taxType" value={this.state.taxType} onChange={this.handleInputChange}>
                                                <option value="total">Total Tax (Global)</option>
                                                <option value="per_ctn">Tax Per Ctn</option>
                                                <option value="per_item">Tax Per Item</option>
                                            </Input>
                                        </FormGroup>
                                    </Col>
                                    <Col md="3">
                                        <FormGroup>
                                            <Label>Tax Value</Label>
                                            <Input type="number" name="taxValue" value={this.state.taxValue} onChange={this.handleInputChange} />
                                        </FormGroup>
                                    </Col>
                                </Row>
                            </CardBody>
                        </Card>
                    </Col>

                    {/* Shipments Section (Only in Edit Mode) */}
                    {isEditing && (
                        <Col md="12">
                            <Card className="mb-4">
                                <CardBody>
                                    <div className="d-flex justify-content-between align-items-center mb-3">
                                        <h6>Shipments</h6>
                                        <Button size="sm" color="primary" onClick={this.toggleShipmentModal}>+ Create Shipment</Button>
                                    </div>
                                    <Table responsive size="sm" bordered>
                                        <thead className="thead-light">
                                            <tr>
                                                <th>Date Sent</th>
                                                <th>Status</th>
                                                <th>Items</th>
                                                <th>Received Date</th>
                                                <th>Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {this.state.shipments.map((shipment, i) => (
                                                <tr key={i}>
                                                    <td>{new Date(shipment.shipmentDate).toLocaleDateString()}</td>
                                                    <td>
                                                        <span className={`badge badge-${shipment.status === 'Received' ? 'success' : 'warning'}`}>{shipment.status}</span>
                                                    </td>
                                                    <td>
                                                        <ul className="pl-3 mb-0">
                                                            {shipment.items.map((si, k) => (
                                                                <li key={k}>{si.shortName || si.modelName}: {si.quantity}</li>
                                                            ))}
                                                        </ul>
                                                    </td>
                                                    <td>{shipment.receivedDate ? new Date(shipment.receivedDate).toLocaleDateString() : '-'}</td>
                                                    <td>
                                                        {shipment.status === 'Shipped' && (
                                                            <Button size="sm" color="success" onClick={() => this.handleReceiveShipment(shipment._id)}>Receive & Update Stock</Button>
                                                        )}
                                                        {shipment.status === 'Shipped' && (
                                                            <Button size="sm" color="danger" outline className="ml-2" onClick={() => this.handleDeleteShipment(shipment._id)}>X</Button>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                            {this.state.shipments.length === 0 && <tr><td colSpan="5" className="text-center">No shipments created yet.</td></tr>}
                                        </tbody>
                                    </Table>
                                </CardBody>
                            </Card>
                        </Col>
                    )}

                    <Col md="12" className="mb-5">
                        <div className="d-flex justify-content-end">
                            <Button size="lg" color="success" onClick={this.handleSubmit}>{isEditing ? 'Update Order' : 'Create Order'}</Button>
                        </div>
                    </Col>
                </Row>
                {/* Shipment Modal */}
                {isEditing && (
                    <div className={`modal ${this.state.isShipmentModalOpen ? 'd-block' : 'd-none'}`} tabIndex="-1" role="dialog" style={{ background: 'rgba(0,0,0,0.5)' }}>
                        <div className="modal-dialog modal-lg" role="document">
                            <div className="modal-content">
                                <div className="modal-header">
                                    <h5 className="modal-title">Create Shipment</h5>
                                    <button type="button" className="close" onClick={this.toggleShipmentModal}>
                                        <span>&times;</span>
                                    </button>
                                </div>
                                <div className="modal-body">
                                    <FormGroup>
                                        <Label>Shipment Date</Label>
                                        <Input type="date" value={this.state.newShipmentDate} onChange={e => this.setState({ newShipmentDate: e.target.value })} />
                                    </FormGroup>
                                    <h6>Items to Ship</h6>
                                    <Table size="sm">
                                        <thead>
                                            <tr>
                                                <th>Product</th>
                                                <th>Ordered Qty</th>
                                                <th>Ship Qty</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {this.state.newShipmentItems.map((item, idx) => (
                                                <tr key={idx}>
                                                    <td>{item.shortName || item.modelName}</td>
                                                    <td>{item.maxQty}</td>
                                                    <td>
                                                        <Input
                                                            type="number"
                                                            bsSize="sm"
                                                            value={item.quantity}
                                                            min="0"
                                                            max={item.maxQty}
                                                            onChange={e => this.handleShipmentItemChange(idx, e.target.value)}
                                                            placeholder="0"
                                                        />
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </Table>
                                </div>
                                <div className="modal-footer">
                                    <Button color="secondary" onClick={this.toggleShipmentModal}>Cancel</Button>
                                    <Button color="primary" onClick={this.handleSubmitShipment}>Create Shipment</Button>
                                </div>
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
    success: opts => dispatch(success(opts)),
    error: opts => dispatch(error(opts)),
    warning: opts => dispatch(warning(opts)),
    dispatch
});

export default connect(mapStateToProps, mapDispatchToProps)(ImportAdd);
