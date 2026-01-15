import React from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { Card, CardBody, Button, Table } from 'reactstrap';
import { API_URL } from '../../constants';
import './SupplierOrders.css';

class SupplierList extends React.PureComponent {
    state = {
        suppliers: [],
        isLoading: false,
        error: null
    };

    componentDidMount() {
        this.fetchSuppliers();
    }

    fetchSuppliers = async () => {
        try {
            this.setState({ isLoading: true, error: null });
            const response = await axios.get(`${API_URL}/supplier`);
            this.setState({ suppliers: response.data.suppliers, isLoading: false });
        } catch (error) {
            console.error('Error fetching suppliers:', error);
            this.setState({
                isLoading: false,
                error: 'Could not load suppliers. Please check your connection or login again.'
            });
        }
    };

    render() {
        const { suppliers, isLoading, error } = this.state;
        const suppliersList = suppliers || [];

        return (
            <div className="supplier-list p-4">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <h3 style={{ color: '#1e293b', fontWeight: '700' }}>Supplier Management</h3>
                    <Link to="/dashboard/supplier/add">
                        <button className="btn-neon btn-neon--cyan"><i className="fa fa-plus"></i> Add New Supplier</button>
                    </Link>
                </div>

                <div className="shipment-card" style={{ background: 'rgba(255, 255, 255, 0.9)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255, 255, 255, 0.5)', boxShadow: '0 10px 40px rgba(0, 0, 0, 0.05)' }}>
                    <table className="shipment-card__table">
                        <thead>
                            <tr>
                                <th style={{ paddingLeft: '30px' }}>Supplier Name</th>
                                <th>Contact Info</th>
                                <th>Address</th>
                                <th>Notes</th>
                                <th className="text-right" style={{ paddingRight: '30px' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {suppliersList.map(supplier => (
                                <tr
                                    key={supplier._id}
                                    style={{ cursor: 'pointer', transition: 'all 0.2s ease' }}
                                    onClick={() => this.props.history && this.props.history.push(`/dashboard/supplier/orders/${supplier._id}`)}
                                    className="hover-row"
                                >
                                    <td style={{ paddingLeft: '30px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '18px', fontWeight: 'bold', boxShadow: '0 4px 10px rgba(79, 70, 229, 0.3)' }}>
                                                {supplier.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <div style={{ fontSize: '15px', fontWeight: '600', color: '#1e293b' }}>{supplier.name}</div>
                                                <div style={{ fontSize: '11px', color: '#64748b' }}>ID: {supplier._id.slice(-6).toUpperCase()}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#475569' }}>
                                            <i className="fa fa-phone" style={{ color: '#0ea5e9', background: 'rgba(14, 165, 233, 0.1)', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%' }}></i>
                                            <span style={{ fontWeight: '500' }}>{supplier.phoneNumber || '-'}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <div style={{ maxWidth: '250px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: '#64748b' }}>
                                            <i className="fa fa-map-marker" style={{ color: '#f59e0b', marginRight: '6px' }}></i>
                                            {supplier.address || '-'}
                                        </div>
                                    </td>
                                    <td>
                                        <span style={{ fontSize: '13px', color: '#94a3b8' }}>{supplier.notes || '-'}</span>
                                    </td>
                                    <td className="text-right" style={{ paddingRight: '30px' }} onClick={e => e.stopPropagation()}>
                                        <Link to={`/dashboard/supplier/edit/${supplier._id}`}>
                                            <button className="btn-icon btn-icon--edit" style={{ display: 'inline-flex' }}>
                                                <i className="fa fa-pencil"></i>
                                            </button>
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                            {suppliersList.length === 0 && !isLoading && !error && (
                                <tr>
                                    <td colSpan="5" className="text-center py-5">
                                        <div className="empty-state">
                                            <div className="empty-state__icon"><i className="fa fa-users"></i></div>
                                            <div className="empty-state__text">No suppliers found. Start by adding one!</div>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    }
}

export default SupplierList;
