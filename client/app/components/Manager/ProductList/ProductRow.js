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
        <tr key={product._id}>
            <td className='text-truncate' style={cellStyle}>
                {product.shortName}
            </td>
            <td style={cellStyle}>
                <input
                    type="number"
                    name="quantity"
                    value={formData.quantity}
                    onChange={handleChange}
                    className="form-control"
                    style={inputStyle}
                />
            </td>
            <td style={cellStyle}>
                <input
                    type="number"
                    name="buyingPrice"
                    value={formData.buyingPrice}
                    onChange={handleChange}
                    className="form-control"
                    style={inputStyle}
                />
            </td>
            <td style={cellStyle}>
                <input
                    type="number"
                    name="wholeSellPrice"
                    value={formData.wholeSellPrice}
                    onChange={handleChange}
                    className="form-control"
                    style={inputStyle}
                />
            </td>
            <td style={cellStyle}>
                <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleChange}
                    className="form-control"
                    style={inputStyle}
                />
            </td>
            <td style={cellStyle}>
                <input
                    type="number"
                    name="previousPrice"
                    value={formData.previousPrice}
                    onChange={handleChange}
                    className="form-control"
                    style={inputStyle}
                />
            </td>
            <td className="text-center" style={cellStyle}>
                <input
                    type="checkbox"
                    name="isActive"
                    checked={formData.isActive}
                    onChange={handleChange}
                    style={{ width: '18px', height: '18px', cursor: 'pointer', marginTop: '5px' }}
                />
            </td>
            <td style={cellStyle}>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <Link
                        to={`/dashboard/product/edit/${product._id}`}
                        className='fa fa-edit'
                        title="Edit Full Details"
                        style={{ fontSize: '18px', color: '#007bff', textDecoration: 'none' }}
                    ></Link>
                    <button
                        className='fa fa-history'
                        onClick={() =>
                            handleOpenHistoryModal(product.history, product.shortName)
                        }
                        title="View History"
                        style={{ fontSize: '18px', color: '#6c757d', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                    ></button>
                    <button
                        className='fa fa-check-circle'
                        onClick={handleUpdate}
                        title="Update Row"
                        style={{ fontSize: '20px', color: '#28a745', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                    ></button>
                </div>
            </td>
        </tr>
    );
};

export default ProductRow;
