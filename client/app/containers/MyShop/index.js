import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { API_URL } from '../../constants';
import { Row, Col, Card, CardBody, CardTitle, Table, Alert, Button, Input, Label, FormGroup } from 'reactstrap';
import dayjs from 'dayjs';
import './styles.css';

const MyShop = () => {
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

    return (
        <div className="myshop-dashboard">
            {/* Navigation Buttons */}
            <div className="myshop-nav-buttons">
                <Link to="/dashboard/invoice">
                    <Button className="myshop-nav-btn">
                        <i className="fa fa-file-text"></i> Invoice
                    </Button>
                </Link>
                <Link to="/dashboard/customer">
                    <Button className="myshop-nav-btn">
                        <i className="fa fa-users"></i> Customer
                    </Button>
                </Link>
            </div>

            <Card className="myshop-material-card">
                <CardTitle className="myshop-card-title">Dashboard Insights</CardTitle>
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
                        This Week
                    </Button>
                    <Button
                        onClick={() => setDateRange('monthly')}
                        className={`myshop-filter-pill ${dateRange === 'monthly' ? 'active' : ''}`}
                    >
                        This Month
                    </Button>
                    <Button
                        onClick={() => setDateRange('yearly')}
                        className={`myshop-filter-pill ${dateRange === 'yearly' ? 'active' : ''}`}
                    >
                        This Year
                    </Button>
                    <Button
                        onClick={() => setDateRange('custom')}
                        className={`myshop-filter-pill ${dateRange === 'custom' ? 'active' : ''}`}
                    >
                        Custom Range
                    </Button>
                </div>

                {dateRange === 'custom' && (
                    <div className="myshop-custom-date">
                        <FormGroup>
                            <Label for="startDate">Start Date</Label>
                            <Input
                                type="date"
                                id="startDate"
                                value={customStartDate}
                                onChange={(e) => setCustomStartDate(e.target.value)}
                            />
                        </FormGroup>
                        <FormGroup>
                            <Label for="endDate">End Date</Label>
                            <Input
                                type="date"
                                id="endDate"
                                value={customEndDate}
                                onChange={(e) => setCustomEndDate(e.target.value)}
                            />
                        </FormGroup>
                        <Button className="myshop-search-btn" onClick={handleCustomSearch}>Search</Button>
                    </div>
                )}
            </Card>

            {loading && <div className="myshop-loading">Loading...</div>}
            {error && <Alert color="danger" className="myshop-alert">{error}</Alert>}

            {!loading && !error && (
                <>
                    <div className="myshop-metrics-row">
                        <Card className="myshop-metric-card green">
                            <div className="myshop-metric-header">
                                <div>
                                    <div className="myshop-metric-label">Total Sell</div>
                                    <div className="myshop-metric-value">৳{data.totalSell.toLocaleString()}</div>
                                </div>
                                <i className="fa fa-shopping-cart myshop-metric-icon"></i>
                            </div>
                        </Card>
                        <Card className="myshop-metric-card purple">
                            <div className="myshop-metric-header">
                                <div>
                                    <div className="myshop-metric-label">Total Profit</div>
                                    <div className="myshop-metric-value">৳{data.totalProfit.toLocaleString()}</div>
                                </div>
                                <i className={`fa fa-${data.totalProfit >= 0 ? 'arrow-up' : 'arrow-down'} myshop-metric-icon`}></i>
                            </div>
                        </Card>
                        <Card className="myshop-metric-card orange">
                            <div className="myshop-metric-header">
                                <div>
                                    <div className="myshop-metric-label">Total Discount</div>
                                    <div className="myshop-metric-value">৳{data.totalDiscount.toLocaleString()}</div>
                                </div>
                                <i className="fa fa-tag myshop-metric-icon"></i>
                            </div>
                        </Card>
                    </div>

                    {data.warnings.length > 0 && (
                        <Card className="myshop-warning-card">
                            <CardTitle>Warnings</CardTitle>
                            <ul>
                                {data.warnings.map((warning, index) => (
                                    <li key={index}>
                                        <strong>{warning.type}:</strong> {warning.message}
                                    </li>
                                ))}
                            </ul>
                        </Card>
                    )}

                    <Card className="myshop-table-container">
                        <CardTitle className="myshop-card-title">Invoice Insights</CardTitle>
                        <Table className="myshop-table">
                            <thead>
                                <tr>
                                    <th>Invoice #</th>
                                    <th>Date</th>
                                    <th>Customer</th>
                                    <th className="text-right">Total Sell</th>
                                    <th className="text-right">Total Profit</th>
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
                                                    {invoice.invoiceNumber}
                                                </Link>
                                            </td>
                                            <td>{dayjs(invoice.date).format('MMM D, YYYY h:mm A')}</td>
                                            <td>{invoice.customerName}</td>
                                            <td className="text-right">৳{invoice.totalSell.toLocaleString()}</td>
                                            <td className={`text-right ${invoice.totalProfit < 0 ? 'myshop-text-danger' : 'myshop-text-success'}`}>
                                                ৳{invoice.totalProfit.toLocaleString()}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="5" className="myshop-empty-state">No invoices found for this period.</td>
                                    </tr>
                                )}
                            </tbody>
                        </Table>
                    </Card>
                </>
            )}
        </div>
    );
};

export default MyShop;
