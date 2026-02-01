import React, { useState, useEffect } from 'react';
import { Modal, ModalHeader, ModalBody, ModalFooter, Row, Col } from 'reactstrap';
import axios from 'axios';
import { connect } from 'react-redux';
import { API_URL } from '../../constants';

const OrderCourierModal = ({ isOpen, toggle, order, onSuccess, success, error, user }) => {
    const [isCreating, setIsCreating] = useState(false);
    const [accounts, setAccounts] = useState([]);
    const [allProducts, setAllProducts] = useState([]);
    const [selectedProducts, setSelectedProducts] = useState([{ productId: '', quantity: 1, buyingPrice: 0, name: '' }]);
    const [formData, setFormData] = useState({
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
        item_description: ''
    });

    useEffect(() => {
        if (isOpen) {
            fetchAccounts();
            fetchProducts();
        }
    }, [isOpen]);

    useEffect(() => {
        if (order && allProducts.length > 0) {
            // Find matching product
            const matchedProduct = allProducts.find(p =>
                p.name?.toLowerCase() === order.productName?.toLowerCase() ||
                (p.shortName && p.shortName.toLowerCase() === order.productName?.toLowerCase())
            );

            const initialProducts = matchedProduct ? [
                { productId: matchedProduct._id, name: matchedProduct.shortName || matchedProduct.name, quantity: order.quantity || 1, buyingPrice: matchedProduct.buyingPrice || 0 }
            ] : [{ productId: '', quantity: order.quantity || 1, buyingPrice: 0, name: '' }];

            const totalCost = initialProducts.reduce((sum, p) => sum + (Number(p.buyingPrice) * Number(p.quantity)), 0);

            setFormData(prev => ({
                ...prev,
                recipient_name: order.name || '',
                recipient_phone: order.phoneNumber || '',
                recipient_address: order.address || '',
                cod_amount: order.price || '',
                productCost: totalCost,
                item_description: `${order.productName || ''} * ${order.quantity || 1}`
            }));
            setSelectedProducts(initialProducts);
        }
    }, [order, allProducts]);

    const fetchAccounts = async () => {
        try {
            const res = await axios.get(`${API_URL}/account`);
            let accs = res.data.accounts || [];
            accs.sort((a, b) => a.name.localeCompare(b.name));
            setAccounts(accs);
        } catch (error) {
            console.error('Account fetch failed', error);
        }
    };

    const fetchProducts = async () => {
        try {
            const res = await axios.get(`${API_URL}/product/list/select`);
            setAllProducts(res.data.products || []);
        } catch (error) {
            console.error('Products fetch failed', error);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleProductChange = (index, field, value) => {
        const newSelected = [...selectedProducts];
        if (field === 'productId') {
            const product = allProducts.find(p => p._id === value);
            newSelected[index].name = product ? (product.shortName || product.name) : '';
            newSelected[index].buyingPrice = product ? (product.buyingPrice || 0) : 0;
            newSelected[index].productId = value;
        } else {
            newSelected[index][field] = value;
        }

        const totalCost = newSelected.reduce((sum, p) => sum + (Number(p.buyingPrice) * Number(p.quantity)), 0);
        setSelectedProducts(newSelected);
        setFormData(prev => ({ ...prev, productCost: totalCost }));
    };

    const handleProductAdd = () => {
        setSelectedProducts([...selectedProducts, { productId: '', quantity: 1, buyingPrice: 0, name: '' }]);
    };

    const handleProductRemove = (index) => {
        const newSelected = selectedProducts.filter((_, i) => i !== index);
        const totalCost = newSelected.reduce((sum, p) => sum + (Number(p.buyingPrice) * Number(p.quantity)), 0);
        setSelectedProducts(newSelected);
        setFormData(prev => ({ ...prev, productCost: totalCost }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsCreating(true);

        const productNote = selectedProducts
            .filter(p => p.name && p.quantity)
            .map(p => `${p.name} * ${p.quantity} pcs`)
            .join(', ');

        const fullNote = formData.note ? `${productNote}. ${formData.note}` : productNote;

        const createdByName = user ? `${user.firstName}${user.lastName ? ' ' + user.lastName : ''}` : 'Admin';

        const finalData = {
            ...formData,
            items: selectedProducts.map(p => ({
                product: p.productId,
                quantity: p.quantity,
                buyingPrice: p.buyingPrice,
                name: p.name
            })),
            note: fullNote,
            item_description: fullNote,
            createdBy: createdByName
        };

        try {
            const res = await axios.post(`${API_URL}/steadfast/create`, finalData);
            if (res.data.success) {
                success({ title: 'Success', message: 'Order created successfully in Courier!', position: 'tr', autoDismiss: 3 });
                onSuccess();
                toggle();
            }
        } catch (error) {
            error({ title: error.response?.data?.error || 'Failed to create courier order.', position: 'tr', autoDismiss: 5 });
        } finally {
            setIsCreating(false);
        }
    };

    return (
        <Modal isOpen={isOpen} toggle={toggle} size="lg" className="modal-80-width">
            <style>{`
                .modal-80-width {
                    max-width: 80% !important;
                    width: 80% !important;
                    height: 95vh;
                    margin: 2.5vh auto !important;
                }
                .modal-80-width .modal-content {
                    width: 100% !important;
                    height: 100% !important;
                    display: flex !important;
                    flex-direction: column !important;
                    overflow: hidden !important;
                }
                .modal-80-width form {
                    display: flex !important;
                    flex-direction: column !important;
                    flex: 1 !important;
                    margin: 0 !important;
                    min-height: 0 !important;
                }
                .modal-80-width .modal-header {
                    padding: 8px 20px !important; /* Minimized header */
                    flex-shrink: 0 !important;
                    border-bottom: 1px solid #e2e8f0 !important;
                }
                .modal-80-width .modal-body {
                    flex: 1 !important;
                    overflow-y: auto !important;
                    padding: 15px 20px !important;
                    min-height: 0 !important;
                }
                .modal-80-width .modal-footer {
                    padding: 8px 20px !important; /* Minimized footer */
                    flex-shrink: 0 !important;
                    border-top: 1px solid #e2e8f0 !important;
                    margin-top: auto !important;
                }
                .courier-selector {
                    display: flex;
                    gap: 10px;
                    margin-bottom: 15px;
                }
                .courier-btn {
                    flex: 1;
                    padding: 8px;
                    border: 1px solid #e2e8f0;
                    background: #fff;
                    border-radius: 6px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 5px;
                    font-size: 13px;
                    transition: all 0.2s;
                }
                .courier-btn.active {
                    background: #ecfeff;
                    border-color: #06b6d4;
                    color: #0891b2;
                    font-weight: bold;
                    box-shadow: 0 0 0 2px rgba(6, 182, 212, 0.1);
                }
                .courier-btn img {
                    height: 18px;
                }
                @media (max-width: 768px) {
                    .modal-80-width {
                        max-width: 95% !important;
                        width: 95% !important;
                    }
                }
            `}</style>
            <ModalHeader toggle={toggle}>Send to Courier: {order?.name}</ModalHeader>
            <form onSubmit={handleSubmit}>
                <ModalBody>
                    <Row>
                        <Col md={6}>
                            <div className="form-group">
                                <label className="mb-2" style={{ fontSize: '13px', fontWeight: 'bold' }}>Select Courier</label>
                                <div className="courier-selector">
                                    <button
                                        type="button"
                                        className={`courier-btn ${formData.courier === 'steadfast' ? 'active' : ''}`}
                                        onClick={() => setFormData(p => ({ ...p, courier: 'steadfast' }))}
                                    >
                                        Steadfast
                                    </button>
                                    <button
                                        type="button"
                                        className={`courier-btn ${formData.courier === 'pathao' ? 'active' : ''}`}
                                        onClick={() => setFormData(p => ({ ...p, courier: 'pathao' }))}
                                        disabled
                                    >
                                        Pathao
                                    </button>
                                    <button
                                        type="button"
                                        className={`courier-btn ${formData.courier === 'redx' ? 'active' : ''}`}
                                        onClick={() => setFormData(p => ({ ...p, courier: 'redx' }))}
                                        disabled
                                    >
                                        RedX
                                    </button>
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Invoice Number</label>
                                <input className="form-control" name="invoice" value={formData.invoice} onChange={handleInputChange} required />
                            </div>
                            <div className="form-group">
                                <label>Recipient Name</label>
                                <input className="form-control" name="recipient_name" value={formData.recipient_name} onChange={handleInputChange} required />
                            </div>
                            <div className="form-group">
                                <label>Recipient Phone</label>
                                <input className="form-control" name="recipient_phone" value={formData.recipient_phone} onChange={handleInputChange} required />
                            </div>
                            <div className="form-group">
                                <label>Full Address</label>
                                <textarea className="form-control" name="recipient_address" value={formData.recipient_address} onChange={handleInputChange} required rows="3" />
                            </div>
                        </Col>
                        <Col md={6}>
                            <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '10px' }}>
                                <div className="form-group mb-2">
                                    <label className="mb-1" style={{ fontSize: '12px' }}>Advance Amount</label>
                                    <input className="form-control form-control-sm" type="number" name="advanceAmount" value={formData.advanceAmount} onChange={handleInputChange} />
                                </div>
                                <div className="form-group mb-0">
                                    <label className="mb-1" style={{ fontSize: '12px' }}>Received Account</label>
                                    <select className="form-control form-control-sm" name="advanceAccount" value={formData.advanceAccount} onChange={handleInputChange}>
                                        <option value="">Select Account</option>
                                        {accounts.map(acc => (
                                            <option key={acc._id} value={acc._id}>{acc.name} (৳{acc.balance.toLocaleString()})</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="form-group">
                                <label>COD Amount</label>
                                <input className="form-control" type="number" name="cod_amount" value={formData.cod_amount} onChange={handleInputChange} required />
                            </div>

                            <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '10px' }}>
                                <div className="d-flex justify-content-between align-items-center mb-2">
                                    <label className="mb-0" style={{ fontSize: '12px', fontWeight: 'bold' }}>Product Selection</label>
                                    <button type="button" onClick={handleProductAdd} className="btn btn-sm btn-info" style={{ fontSize: '10px', padding: '2px 8px' }}>
                                        + Add
                                    </button>
                                </div>

                                {selectedProducts.map((sp, idx) => (
                                    <div key={idx} className="d-flex mb-1 align-items-center" style={{ width: '100%' }}>
                                        <select
                                            className="form-control form-control-sm mr-2"
                                            style={{ width: '100%' }}
                                            value={sp.productId}
                                            onChange={(e) => handleProductChange(idx, 'productId', e.target.value)}
                                        >
                                            <option value="">Select Product...</option>
                                            {allProducts.map(p => <option key={p._id} value={p._id}>{p.shortName || p.name}</option>)}
                                        </select>
                                        <input
                                            className="form-control form-control-sm mr-2"
                                            style={{ width: '60px', flexShrink: 0 }}
                                            type="number"
                                            placeholder="Qty"
                                            value={sp.quantity}
                                            onChange={(e) => handleProductChange(idx, 'quantity', e.target.value)}
                                        />
                                        {selectedProducts.length > 1 && (
                                            <button type="button" onClick={() => handleProductRemove(idx)} className="btn btn-sm btn-link text-danger p-0 px-1">
                                                <i className="fa fa-trash"></i>
                                            </button>
                                        )}
                                    </div>
                                ))}

                                <div className="mt-2" style={{ borderTop: '1px dashed #cbd5e1', paddingTop: '8px' }}>
                                    <label style={{ fontSize: '11px', color: '#64748b', display: 'block', marginBottom: '2px' }}>Note Preview (to Steadfast):</label>
                                    <div style={{ background: '#ecfeff', padding: '6px 10px', borderRadius: '4px', border: '1px solid #cffafe', fontSize: '12px', minHeight: '30px', color: '#0891b2', fontWeight: 'bold' }}>
                                        {selectedProducts.filter(p => p.name && p.quantity).map(p => `${p.name} * ${p.quantity} pcs`).join(', ') || 'No products selected'}
                                    </div>
                                </div>
                            </div>

                            <div className="form-group mb-0">
                                <label className="mb-1" style={{ fontSize: '12px' }}>Packaging</label>
                                <input className="form-control form-control-sm" type="number" name="packagingCharge" value={formData.packagingCharge} onChange={handleInputChange} />
                            </div>
                        </Col>
                    </Row>
                </ModalBody>
                <ModalFooter>
                    <button type="submit" className="btn btn-primary" disabled={isCreating}>
                        {isCreating ? 'Creating...' : 'Confirm order'}
                    </button>
                    <button type="button" className="btn btn-secondary" onClick={toggle}>Cancel</button>
                </ModalFooter>
            </form>
        </Modal>
    );
};

const mapStateToProps = state => ({
    user: state.account.user
});

export default connect(mapStateToProps, null)(OrderCourierModal);
