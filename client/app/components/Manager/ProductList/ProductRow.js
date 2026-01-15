import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const ProductRow = ({ product, updateProductDetails, handleOpenHistoryModal }) => {
    const [formData, setFormData] = useState({
        quantity: product.quantity || 0,
        buyingPrice: product.buyingPrice || 0,
        wholeSellPrice: product.wholeSellPrice || 0,
        price: product.price || 0,
        previousPrice: product.previousPrice || 0,
        isActive: product.isActive || false
    });

    useEffect(() => {
        setFormData({
            quantity: product.quantity || 0,
            buyingPrice: product.buyingPrice || 0,
            wholeSellPrice: product.wholeSellPrice || 0,
            price: product.price || 0,
            previousPrice: product.previousPrice || 0,
            isActive: product.isActive || false
        });
    }, [product]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleUpdate = () => {
        // Include sku and slug to satisfy backend uniqueness checks
        const payload = {
            ...formData,
            sku: product.sku,
            slug: product.slug
        };
        updateProductDetails(product._id, payload);
    };

    const inputStyle = {
        width: '80px',
        padding: '2px 5px',
        height: '30px',
        fontSize: '14px'
    };

    const cellStyle = {
        padding: '5px',
        verticalAlign: 'middle'
    };

    return (
        <tr key={product._id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.2s' }} className="table-row-hover">
            <td style={{ padding: '16px 20px', fontSize: '14px', fontWeight: '600', color: '#1e293b' }}>
                <Link to={`/dashboard/product/edit/${product._id}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                    {product.shortName}
                </Link>
            </td>
            <td style={{ padding: '16px 20px' }}>
                <input
                    type="number"
                    name="quantity"
                    value={formData.quantity}
                    onChange={handleChange}
                    className="qty-input"
                />
            </td>
            <td style={{ padding: '16px 20px' }}>
                <input
                    type="number"
                    name="buyingPrice"
                    value={formData.buyingPrice}
                    onChange={handleChange}
                    className="qty-input"
                />
            </td>
            <td style={{ padding: '16px 20px' }}>
                <input
                    type="number"
                    name="wholeSellPrice"
                    value={formData.wholeSellPrice}
                    onChange={handleChange}
                    className="qty-input"
                />
            </td>
            <td style={{ padding: '16px 20px' }}>
                <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleChange}
                    className="qty-input"
                />
            </td>
            <td style={{ padding: '16px 20px' }}>
                <input
                    type="number"
                    name="previousPrice"
                    value={formData.previousPrice}
                    onChange={handleChange}
                    className="qty-input"
                />
            </td>
            <td style={{ padding: '16px 20px' }}>
                <div
                    onClick={() => handleChange({ target: { name: 'isActive', type: 'checkbox', checked: !formData.isActive } })}
                    style={{
                        width: '40px',
                        height: '20px',
                        backgroundColor: formData.isActive ? '#06b6d4' : '#e2e8f0',
                        borderRadius: '20px',
                        position: 'relative',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                    }}>
                    <div style={{
                        width: '16px',
                        height: '16px',
                        backgroundColor: '#fff',
                        borderRadius: '50%',
                        position: 'absolute',
                        top: '2px',
                        left: formData.isActive ? '22px' : '2px',
                        transition: 'all 0.2s'
                    }} />
                </div>
            </td>
            <td style={{ padding: '16px 20px' }}>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <Link
                        to={`/dashboard/product/edit/${product._id}`}
                        className='action-icon icon-edit'
                        title="Edit Full Details"
                    >
                        <i className='fa fa-edit' />
                    </Link>
                    <button
                        className='action-icon icon-history'
                        onClick={() =>
                            handleOpenHistoryModal(product.history, product.shortName)
                        }
                        title="View History"
                        style={{ border: 'none' }}
                    >
                        <i className='fa fa-history' />
                    </button>
                    <button
                        className='action-icon icon-check'
                        onClick={handleUpdate}
                        title="Save Changes"
                        style={{ border: 'none' }}
                    >
                        <i className='fa fa-check' />
                    </button>
                </div>
            </td>
        </tr>
    );
};

export default ProductRow;
