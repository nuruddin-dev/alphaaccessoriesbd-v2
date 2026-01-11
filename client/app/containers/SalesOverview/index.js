import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { API_URL } from '../../constants';
import { Row, Col, Card, CardBody, CardTitle, Table, Alert, Button, Input, Label, FormGroup } from 'reactstrap';
import dayjs from 'dayjs';
import './styles.css';

const SalesOverview = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [data, setData] = useState({
        totalSell: 0,
        totalProfit: 0,
        totalDiscount: 0,
        invoiceInsights: [],
        warnings: []
    });
    const [dateRange, setDateRange] = useState('today'); // today, weekly, monthly, yearly, custom
    const [customStartDate, setCustomStartDate] = useState('');
    const [customEndDate, setCustomEndDate] = useState('');

    useEffect(() => {
        fetchInsights();
    }, [dateRange]);

    const fetchInsights = async () => {
        setLoading(true);
        setError(null);

        let start, end;
        const today = dayjs();

        switch (dateRange) {
            case 'today':
                start = today.startOf('day');
                end = today.endOf('day');
                break;
            case 'weekly':
                start = today.startOf('week');
                end = today.endOf('week');
                break;
            case 'monthly':
                start = today.startOf('month');
                end = today.endOf('month');
                break;
            case 'yearly':
                start = today.startOf('year');
                end = today.endOf('year');
                break;
            case 'custom':
                if (customStartDate && customEndDate) {
                    start = dayjs(customStartDate).startOf('day');
                    end = dayjs(customEndDate).endOf('day');
                } else {
                    setLoading(false);
                    return; // Don't fetch if dates are missing
                }
                break;
            default:
                start = today.startOf('day');
                end = today.endOf('day');
        }

        try {
            const response = await axios.get(`${API_URL}/dashboard/myshop`, {
                params: {
                    startDate: start.format('YYYY-MM-DD'),
                    endDate: end.format('YYYY-MM-DD')
                }
            });
            setData(response.data);
        } catch (err) {
            console.error('Error fetching insights:', err);
            setError('Failed to fetch insights.');
        } finally {
            setLoading(false);
        }
    };

    const handleCustomSearch = () => {
        if (dateRange === 'custom') {
            fetchInsights();
        }
    };

    const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
    const [deleteInvoiceNumber, setDeleteInvoiceNumber] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState('');

    const toggleDeleteModal = () => {
        setDeleteModalOpen(!isDeleteModalOpen);
        setDeleteInvoiceNumber('');
        setDeleteError('');
    };

    const handleDeleteInvoice = async () => {
        if (!deleteInvoiceNumber.trim()) {
            setDeleteError('Please enter an invoice number.');
            return;
        }

        if (!window.confirm('Are you absolutely sure? This action is irreversible.')) {
            return;
        }

        setIsDeleting(true);
        setDeleteError('');

        try {
            // Using logic: send as query param to ensure it passes through
            const response = await axios.delete(`${API_URL}/invoice/delete-by-number`, {
                params: { invoiceNumber: deleteInvoiceNumber }
            });

            if (response.data.success) {
                alert('Invoice deleted successfully!');
                toggleDeleteModal();
                fetchInsights(); // Refresh data
            }
        } catch (error) {
            console.error('Delete error:', error);
            setDeleteError(error.response?.data?.error || 'Failed to delete invoice.');
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className="sales-overview-dashboard">
            {/* Navigation Section */}
            <div className="myshop-nav-buttons">
                <Link to="/dashboard/invoice" style={{ textDecoration: 'none' }}>
                    <Button className="myshop-nav-btn">
                        <i className="fa fa-file-text-o"></i>
                        <span>Invoices</span>
                    </Button>
                </Link>
                <Link to="/dashboard/customer" style={{ textDecoration: 'none' }}>
                    <Button className="myshop-nav-btn">
                        <i className="fa fa-address-book-o"></i>
                        <span>Customers</span>
                    </Button>
                </Link>
                <Button
                    className="myshop-nav-btn"
                    onClick={toggleDeleteModal}
                    style={{
                        background: 'rgba(239, 68, 68, 0.1)',
                        color: '#ef4444',
                        border: '1px solid rgba(239, 68, 68, 0.2)'
                    }}
                >
                    <i className="fa fa-trash-o"></i>
                    <span>Delete Invoice</span>
                </Button>
                <Button
                    className="myshop-nav-btn"
                    onClick={fetchInsights}
                    style={{
                        background: 'rgba(16, 185, 129, 0.1)',
                        color: '#10b981',
                        border: '1px solid rgba(16, 185, 129, 0.2)'
                    }}
                >
                    <i className={`fa fa-refresh ${loading ? 'fa-spin' : ''}`}></i>
                    <span>Refresh</span>
                </Button>
            </div>

            <Card className="myshop-material-card">
                <CardTitle className="myshop-card-title">
                    <i className="fa fa-line-chart" style={{ color: '#6366f1' }}></i>
                    Analytics Overview
                </CardTitle>
                <div className="myshop-filter-pills">
                    <Button
                        onClick={() => setDateRange('today')}
                        className={`myshop-filter-pill ${dateRange === 'today' ? 'active' : ''}`}
                    >
                        Today
                    </Button>
                    <Button
                        onClick={() => setDateRange('weekly')}
                        className={`myshop-filter-pill ${dateRange === 'weekly' ? 'active' : ''}`}
                    >
                        Weekly
                    </Button>
                    <Button
                        onClick={() => setDateRange('monthly')}
                        className={`myshop-filter-pill ${dateRange === 'monthly' ? 'active' : ''}`}
                    >
                        Monthly
                    </Button>
                    <Button
                        onClick={() => setDateRange('yearly')}
                        className={`myshop-filter-pill ${dateRange === 'yearly' ? 'active' : ''}`}
                    >
                        Yearly
                    </Button>
                    <Button
                        onClick={() => setDateRange('custom')}
                        className={`myshop-filter-pill ${dateRange === 'custom' ? 'active' : ''}`}
                    >
                        Custom
                    </Button>
                </div>

                {dateRange === 'custom' && (
                    <div className="myshop-custom-date">
                        <FormGroup>
                            <Label for="startDate">From</Label>
                            <Input
                                type="date"
                                id="startDate"
                                value={customStartDate}
                                onChange={(e) => setCustomStartDate(e.target.value)}
                            />
                        </FormGroup>
                        <FormGroup>
                            <Label for="endDate">To</Label>
                            <Input
                                type="date"
                                id="endDate"
                                value={customEndDate}
                                onChange={(e) => setCustomEndDate(e.target.value)}
                            />
                        </FormGroup>
                        <Button className="myshop-nav-btn" onClick={handleCustomSearch} style={{ height: '42px', background: '#6366f1 !important', color: '#fff !important' }}>
                            <i className="fa fa-search"></i> Apply
                        </Button>
                    </div>
                )}
            </Card>

            {loading && (
                <div className="myshop-loading">
                    <div className="spinner-border text-primary mr-2" role="status"></div>
                    <span>Analyzing shop data...</span>
                </div>
            )}
            {error && <Alert color="danger" className="myshop-alert shadow-sm">{error}</Alert>}

            {!loading && !error && (
                <>
                    <div className="myshop-metrics-row">
                        <Card className="myshop-metric-card green">
                            <div className="myshop-metric-header">
                                <div>
                                    <div className="myshop-metric-label">Sales</div>
                                    <div className="myshop-metric-value">৳{data.totalSell.toLocaleString()}</div>
                                </div>
                                <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '12px', borderRadius: '12px' }}>
                                    <i className="fa fa-shopping-bag" style={{ color: '#10b981', fontSize: '20px' }}></i>
                                </div>
                            </div>
                        </Card>
                        <Card className="myshop-metric-card purple">
                            <div className="myshop-metric-header">
                                <div>
                                    <div className="myshop-metric-label">Profit</div>
                                    <div className="myshop-metric-value">৳{data.totalProfit.toLocaleString()}</div>
                                </div>
                                <div style={{ background: 'rgba(139, 92, 246, 0.1)', padding: '12px', borderRadius: '12px' }}>
                                    <i className={`fa fa-${data.totalProfit >= 0 ? 'trending-up' : 'trending-down'}`} style={{ color: '#8b5cf6', fontSize: '20px' }}></i>
                                </div>
                            </div>
                        </Card>
                        <Card className="myshop-metric-card orange">
                            <div className="myshop-metric-header">
                                <div>
                                    <div className="myshop-metric-label">Discounts</div>
                                    <div className="myshop-metric-value">৳{data.totalDiscount.toLocaleString()}</div>
                                </div>
                                <div style={{ background: 'rgba(245, 158, 11, 0.1)', padding: '12px', borderRadius: '12px' }}>
                                    <i className="fa fa-percent" style={{ color: '#f59e0b', fontSize: '20px' }}></i>
                                </div>
                            </div>
                        </Card>
                    </div>

                    {data.warnings.length > 0 && (
                        <Card className="myshop-warning-card">
                            <CardTitle>
                                <i className="fa fa-exclamation-triangle mr-2"></i>
                                Critical Observations
                            </CardTitle>
                            <ul className="list-unstyled mt-3">
                                {data.warnings.map((warning, index) => (
                                    <li key={index} className="mb-2 d-flex align-items-start">
                                        <i className="fa fa-circle mt-1 mr-2" style={{ fontSize: '8px', opacity: 0.5 }}></i>
                                        <span><strong>{warning.type}:</strong> {warning.message}</span>
                                    </li>
                                ))}
                            </ul>
                        </Card>
                    )}

                    <Card className="myshop-table-container">
                        <CardTitle className="myshop-card-title">
                            <i className="fa fa-list-alt" style={{ color: '#6366f1' }}></i>
                            Transaction History
                        </CardTitle>
                        <div className="table-responsive">
                            <Table className="myshop-table">
                                <thead>
                                    <tr>
                                        <th>INV. NUM</th>
                                        <th>TIMESTAMP</th>
                                        <th>CLIENT</th>
                                        <th className="text-right">SALES</th>
                                        <th className="text-right">PROFIT</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.invoiceInsights.length > 0 ? (
                                        data.invoiceInsights.map((invoice, index) => (
                                            <tr key={index}>
                                                <td>
                                                    <Link
                                                        to={`/dashboard/invoice/${invoice.invoiceNumber}`}
                                                        className="myshop-invoice-link"
                                                    >
                                                        #{invoice.invoiceNumber}
                                                    </Link>
                                                </td>
                                                <td>
                                                    <div style={{ color: '#1e293b', fontWeight: '600' }}>{dayjs(invoice.date).format('MMM D, YYYY')}</div>
                                                    <div style={{ color: '#94a3b8', fontSize: '11px' }}>{dayjs(invoice.date).format('h:mm A')}</div>
                                                </td>
                                                <td style={{ fontWeight: '600' }}>{invoice.customerName || ''}</td>
                                                <td className="text-right font-weight-bold">৳{invoice.totalSell.toLocaleString()}</td>
                                                <td className={`text-right ${invoice.totalProfit < 0 ? 'myshop-text-danger' : 'myshop-text-success'}`}>
                                                    <span style={{
                                                        background: invoice.totalProfit < 0 ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                                                        padding: '4px 10px',
                                                        borderRadius: '8px',
                                                        fontSize: '13px'
                                                    }}>
                                                        {invoice.totalProfit < 0 ? '-' : '+'}৳{Math.abs(invoice.totalProfit).toLocaleString()}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="5" className="myshop-empty-state">
                                                <i className="fa fa-folder-open-o d-block mb-3" style={{ fontSize: '2rem', opacity: 0.2 }}></i>
                                                No transactions found for this period.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </Table>
                        </div>
                    </Card>
                </>
            )}

            {/* Light Neon Delete Modal */}
            {isDeleteModalOpen && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0,0,0,0.5)',
                    backdropFilter: 'blur(5px)',
                    zIndex: 2000,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    animation: 'fadeIn 0.2s ease'
                }} onClick={toggleDeleteModal}>
                    <div style={{
                        background: 'rgba(255, 255, 255, 0.95)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
                        borderRadius: '24px',
                        padding: '32px',
                        width: '90%',
                        maxWidth: '450px',
                        position: 'relative',
                        animation: 'slideUp 0.3s ease'
                    }} onClick={e => e.stopPropagation()}>
                        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                            <div style={{
                                width: '60px',
                                height: '60px',
                                background: 'rgba(239, 68, 68, 0.1)',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                margin: '0 auto 16px',
                                color: '#ef4444',
                                fontSize: '24px'
                            }}>
                                <i className="fa fa-trash"></i>
                            </div>
                            <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '700', color: '#1e293b' }}>
                                Delete Invoice
                            </h3>
                            <p style={{ margin: '8px 0 0', fontSize: '14px', color: '#64748b' }}>
                                This action is permanent and cannot be undone.
                            </p>
                        </div>

                        <div style={{ marginBottom: '24px' }}>
                            <label style={{
                                display: 'block',
                                fontSize: '12px',
                                fontWeight: '600',
                                textTransform: 'uppercase',
                                color: '#64748b',
                                marginBottom: '8px',
                                letterSpacing: '0.5px'
                            }}>
                                Enter Invoice Number to Confirm
                            </label>
                            <input
                                type="text"
                                placeholder="e.g. INV-170123456"
                                value={deleteInvoiceNumber}
                                onChange={e => {
                                    setDeleteInvoiceNumber(e.target.value);
                                    if (deleteError) setDeleteError('');
                                }}
                                style={{
                                    width: '100%',
                                    padding: '12px 16px',
                                    borderRadius: '12px',
                                    border: deleteError ? '1px solid #ef4444' : '1px solid #e2e8f0',
                                    fontSize: '15px',
                                    outline: 'none',
                                    background: '#f8fafc',
                                    color: '#1e293b',
                                    transition: 'all 0.2s',
                                    boxShadow: deleteError ? '0 0 0 3px rgba(239, 68, 68, 0.1)' : 'none'
                                }}
                                onFocus={e => e.target.style.borderColor = '#06b6d4'}
                                onBlur={e => e.target.style.borderColor = deleteError ? '#ef4444' : '#e2e8f0'}
                            />
                            {deleteError && (
                                <div style={{ fontSize: '13px', color: '#ef4444', marginTop: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <i className="fa fa-exclamation-circle"></i> {deleteError}
                                </div>
                            )}
                        </div>

                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button
                                onClick={toggleDeleteModal}
                                style={{
                                    flex: 1,
                                    padding: '12px',
                                    borderRadius: '12px',
                                    border: '1px solid #e2e8f0',
                                    background: '#fff',
                                    color: '#64748b',
                                    fontSize: '14px',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s'
                                }}
                                onMouseOver={e => e.target.style.background = '#f8fafc'}
                                onMouseOut={e => e.target.style.background = '#fff'}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDeleteInvoice}
                                disabled={isDeleting}
                                style={{
                                    flex: 1,
                                    padding: '12px',
                                    borderRadius: '12px',
                                    border: 'none',
                                    background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                                    color: '#fff',
                                    fontSize: '14px',
                                    fontWeight: '600',
                                    cursor: isDeleting ? 'not-allowed' : 'pointer',
                                    opacity: isDeleting ? 0.7 : 1,
                                    boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '8px'
                                }}
                            >
                                {isDeleting ? (
                                    <>
                                        <i className="fa fa-spinner fa-spin"></i> Deleting...
                                    </>
                                ) : (
                                    <>
                                        <i className="fa fa-trash"></i> Confirm Delete
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SalesOverview;
