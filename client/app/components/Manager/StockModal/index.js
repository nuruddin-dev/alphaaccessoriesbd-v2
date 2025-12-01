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
    const [searchTerm, setSearchTerm] = useState('');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    // Update Stock State
    const [selectedProduct, setSelectedProduct] = useState('');
    const [updateData, setUpdateData] = useState({
        quantity: '',
        buyingPrice: '',
        wholeSellPrice: '',
        price: ''
    });

    // Add Stock State
    const [addData, setAddData] = useState({
        shortName: '',
        quantity: '',
        buyingPrice: '',
        wholeSellPrice: '',
        price: ''
    });

    // Reset state when modal opens/closes
    useEffect(() => {
        if (isOpen) {
            setActiveTab('update');
            setSelectedProduct('');
            setSearchTerm('');
            setIsDropdownOpen(false);
            setUpdateData({ quantity: '', buyingPrice: '', wholeSellPrice: '', price: '' });
            setAddData({ shortName: '', quantity: '', buyingPrice: '', wholeSellPrice: '', price: '' });
        }
    }, [isOpen]);

    // Handle product selection in Update tab
    const handleProductSelect = (product) => {
        const productId = product._id;
        setSelectedProduct(productId);
        setSearchTerm(product.shortName || product.name);
        setIsDropdownOpen(false);

        setUpdateData(prev => ({
            ...prev,
            buyingPrice: product.buyingPrice || '',
            wholeSellPrice: product.wholeSellPrice || '',
            price: product.price || ''
        }));
    };

    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
        setIsDropdownOpen(true);
        setSelectedProduct(''); // Clear selection when searching
    };

    const handleInputFocus = () => {
        setIsDropdownOpen(true);
    };

    const handleInputBlur = () => {
        // Delay hiding dropdown to allow click event to register
        setTimeout(() => {
            setIsDropdownOpen(false);
        }, 200);
    };

    const handleUpdateChange = (e) => {
        const { name, value } = e.target;
        setUpdateData(prev => ({
            ...prev,
            [name]: value === '' ? '' : (parseFloat(value) || 0)
        }));
    };

    const handleAddChange = (e) => {
        const { name, value } = e.target;
        setAddData(prev => ({
            ...prev,
            [name]: name === 'shortName' ? value : (value === '' ? '' : (parseFloat(value) || 0))
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

    const dropdownStyle = {
        position: 'relative'
    };

    const resultsContainerStyle = {
        position: 'absolute',
        zIndex: 100,
        width: '100%',
        maxHeight: '200px',
        overflowY: 'auto',
        border: '1px solid #ddd',
        backgroundColor: 'white',
        boxShadow: '0px 4px 8px rgba(0,0,0,0.1)',
        marginTop: '-10px'
    };

    const resultItemStyle = {
        padding: '8px',
        cursor: 'pointer',
        borderBottom: '1px solid #eee'
    };

    const highlightedResultStyle = {
        ...resultItemStyle,
        backgroundColor: '#f0f0f0'
    };

    // Filter products based on search term
    const filteredProducts = products.filter(product =>
        (product.shortName || product.name).toLowerCase().includes(searchTerm.toLowerCase())
    );

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
                            <div style={dropdownStyle}>
                                <input
                                    type="text"
                                    style={inputStyle}
                                    value={searchTerm}
                                    onChange={handleSearchChange}
                                    onFocus={handleInputFocus}
                                    onBlur={handleInputBlur}
                                    placeholder="Search product by name..."
                                    required={!selectedProduct} // Required if no product selected
                                />
                                {isDropdownOpen && searchTerm && (
                                    <div style={resultsContainerStyle}>
                                        {filteredProducts.length > 0 ? (
                                            filteredProducts.map(product => (
                                                <div
                                                    key={product._id}
                                                    style={resultItemStyle}
                                                    onMouseDown={() => handleProductSelect(product)} // Use onMouseDown to trigger before onBlur
                                                >
                                                    {product.shortName || product.name}
                                                </div>
                                            ))
                                        ) : (
                                            <div style={{ ...resultItemStyle, cursor: 'default', color: '#999' }}>
                                                No products found
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
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
