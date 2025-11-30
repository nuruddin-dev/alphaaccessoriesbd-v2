import React, { useState, useEffect } from 'react';
import Modal from 'react-modal';

const StockModal = ({
    isOpen,
    onRequestClose,
    products,
    handleUpdateStock,
    handleAddStock
}) => {
    const [activeTab, setActiveTab] = useState('update'); // 'update' or 'add'

    // Update Stock State
    const [selectedProduct, setSelectedProduct] = useState('');
    const [updateData, setUpdateData] = useState({
        quantity: 0,
        buyingPrice: 0,
        wholeSellPrice: 0,
        price: 0
    });

    // Add Stock State
    const [addData, setAddData] = useState({
        shortName: '',
        quantity: 0,
        buyingPrice: 0,
        wholeSellPrice: 0,
        price: 0
    });

    // Reset state when modal opens/closes
    useEffect(() => {
        if (isOpen) {
            setActiveTab('update');
            setSelectedProduct('');
            setUpdateData({ quantity: 0, buyingPrice: 0, wholeSellPrice: 0, price: 0 });
            setAddData({ shortName: '', quantity: 0, buyingPrice: 0, wholeSellPrice: 0, price: 0 });
        }
    }, [isOpen]);

    // Handle product selection in Update tab
    const handleProductSelect = (e) => {
        const productId = e.target.value;
        setSelectedProduct(productId);

        // Pre-fill prices from selected product if available
        const product = products.find(p => p._id === productId);
        if (product) {
            setUpdateData(prev => ({
                ...prev,
                buyingPrice: product.buyingPrice || 0,
                wholeSellPrice: product.wholeSellPrice || 0,
                price: product.price || 0
            }));
        }
    };

    const handleUpdateChange = (e) => {
        const { name, value } = e.target;
        setUpdateData(prev => ({
            ...prev,
            [name]: parseFloat(value) || 0
        }));
    };

    const handleAddChange = (e) => {
        const { name, value } = e.target;
        setAddData(prev => ({
            ...prev,
            [name]: name === 'shortName' ? value : (parseFloat(value) || 0)
        }));
    };

    const onUpdateSubmit = (e) => {
        e.preventDefault();
        if (!selectedProduct) return;
        handleUpdateStock(selectedProduct, updateData);
    };

    const onAddSubmit = (e) => {
        e.preventDefault();
        handleAddStock(addData);
    };

    const customStyles = {
        content: {
            top: '50%',
            left: '50%',
            right: 'auto',
            bottom: 'auto',
            marginRight: '-50%',
            transform: 'translate(-50%, -50%)',
            width: '500px',
            padding: '0',
            border: 'none',
            borderRadius: '8px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
        },
        overlay: {
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 1000
        }
    };

    const tabStyle = (isActive) => ({
        flex: 1,
        padding: '15px',
        border: 'none',
        background: isActive ? '#fff' : '#f8f9fa',
        color: isActive ? '#007bff' : '#6c757d',
        fontWeight: isActive ? '600' : '400',
        borderBottom: isActive ? '2px solid #007bff' : '1px solid #dee2e6',
        cursor: 'pointer',
        outline: 'none'
    });

    const inputStyle = {
        display: 'block',
        width: '100%',
        padding: '8px 12px',
        marginBottom: '10px',
        border: '1px solid #ced4da',
        borderRadius: '4px',
        fontSize: '14px'
    };

    const labelStyle = {
        display: 'block',
        marginBottom: '5px',
        fontWeight: '500',
        fontSize: '14px',
        color: '#495057'
    };

    const buttonStyle = {
        width: '100%',
        padding: '10px',
        background: '#007bff',
        color: '#fff',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        fontWeight: '500',
        marginTop: '10px'
    };

    return (
        <Modal
            isOpen={isOpen}
            onRequestClose={onRequestClose}
            style={customStyles}
            contentLabel="Stock Management"
            ariaHideApp={false}
        >
            <div style={{ display: 'flex', borderBottom: '1px solid #dee2e6' }}>
                <button
                    style={tabStyle(activeTab === 'update')}
                    onClick={() => setActiveTab('update')}
                >
                    Update Stock
                </button>
                <button
                    style={tabStyle(activeTab === 'add')}
                    onClick={() => setActiveTab('add')}
                >
                    Add Stock
                </button>
            </div>

            <div style={{ padding: '20px' }}>
                {activeTab === 'update' ? (
                    <form onSubmit={onUpdateSubmit}>
                        <div style={{ marginBottom: '15px' }}>
                            <label style={labelStyle}>Select Product</label>
                            <select
                                style={inputStyle}
                                value={selectedProduct}
                                onChange={handleProductSelect}
                                required
                            >
                                <option value="">Select a product...</option>
                                {products.map(p => (
                                    <option key={p._id} value={p._id}>
                                        {p.shortName}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div style={{ display: 'flex', gap: '15px' }}>
                            <div style={{ flex: 1 }}>
                                <label style={labelStyle}>Add Quantity</label>
                                <input
                                    type="number"
                                    name="quantity"
                                    value={updateData.quantity}
                                    onChange={handleUpdateChange}
                                    style={inputStyle}
                                    min="1"
                                    required
                                />
                            </div>
                            <div style={{ flex: 1 }}>
                                <label style={labelStyle}>New Buying Price</label>
                                <input
                                    type="number"
                                    name="buyingPrice"
                                    value={updateData.buyingPrice}
                                    onChange={handleUpdateChange}
                                    style={inputStyle}
                                    min="0"
                                    required
                                />
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '15px' }}>
                            <div style={{ flex: 1 }}>
                                <label style={labelStyle}>Wholesale Price</label>
                                <input
                                    type="number"
                                    name="wholeSellPrice"
                                    value={updateData.wholeSellPrice}
                                    onChange={handleUpdateChange}
                                    style={inputStyle}
                                    min="0"
                                />
                            </div>
                            <div style={{ flex: 1 }}>
                                <label style={labelStyle}>Selling Price</label>
                                <input
                                    type="number"
                                    name="price"
                                    value={updateData.price}
                                    onChange={handleUpdateChange}
                                    style={inputStyle}
                                    min="0"
                                />
                            </div>
                        </div>

                        <button type="submit" style={buttonStyle}>
                            Update Stock
                        </button>
                    </form>
                ) : (
                    <form onSubmit={onAddSubmit}>
                        <div style={{ marginBottom: '15px' }}>
                            <label style={labelStyle}>Product Name (Short Name)</label>
                            <input
                                type="text"
                                name="shortName"
                                value={addData.shortName}
                                onChange={handleAddChange}
                                style={inputStyle}
                                required
                                placeholder="Enter product short name"
                            />
                        </div>

                        <div style={{ display: 'flex', gap: '15px' }}>
                            <div style={{ flex: 1 }}>
                                <label style={labelStyle}>Initial Quantity</label>
                                <input
                                    type="number"
                                    name="quantity"
                                    value={addData.quantity}
                                    onChange={handleAddChange}
                                    style={inputStyle}
                                    min="0"
                                />
                            </div>
                            <div style={{ flex: 1 }}>
                                <label style={labelStyle}>Buying Price</label>
                                <input
                                    type="number"
                                    name="buyingPrice"
                                    value={addData.buyingPrice}
                                    onChange={handleAddChange}
                                    style={inputStyle}
                                    min="0"
                                />
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '15px' }}>
                            <div style={{ flex: 1 }}>
                                <label style={labelStyle}>Wholesale Price</label>
                                <input
                                    type="number"
                                    name="wholeSellPrice"
                                    value={addData.wholeSellPrice}
                                    onChange={handleAddChange}
                                    style={inputStyle}
                                    min="0"
                                />
                            </div>
                            <div style={{ flex: 1 }}>
                                <label style={labelStyle}>Selling Price</label>
                                <input
                                    type="number"
                                    name="price"
                                    value={addData.price}
                                    onChange={handleAddChange}
                                    style={inputStyle}
                                    min="0"
                                />
                            </div>
                        </div>

                        <button type="submit" style={buttonStyle}>
                            Add New Product
                        </button>
                    </form>
                )}
            </div>
        </Modal>
    );
};

export default StockModal;
