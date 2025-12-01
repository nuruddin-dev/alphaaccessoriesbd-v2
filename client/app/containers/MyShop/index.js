import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { API_URL } from '../../constants';
import { Row, Col, Card, CardBody, CardTitle, Table, Alert, Button, Input, Label, FormGroup } from 'reactstrap';
import moment from 'moment';

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
        const today = moment();

        switch (dateRange) {
            case 'today':
                start = today.clone().startOf('day');
                end = today.clone().endOf('day');
                break;
            case 'weekly':
                start = today.clone().startOf('week');
                end = today.clone().endOf('week');
                break;
            case 'monthly':
                start = today.clone().startOf('month');
                end = today.clone().endOf('month');
                break;
            case 'yearly':
                start = today.clone().startOf('year');
                end = today.clone().endOf('year');
                break;
            case 'custom':
                if (customStartDate && customEndDate) {
                    start = moment(customStartDate).startOf('day');
                    end = moment(customEndDate).endOf('day');
                } else {
                    setLoading(false);
                    return; // Don't fetch if dates are missing
                }
                break;
            default:
                start = today.clone().startOf('day');
                end = today.clone().endOf('day');
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
            <Row className="mb-3">
                <Col md="12">
                    <div className="d-flex gap-2">
                        <Link to="/dashboard/invoice">
                            <Button color="info" className="mr-2">
                                <i className="fa fa-file-text mr-1"></i> Invoice
                            </Button>
                        </Link>
                        <Link to="/dashboard/customer">
                            <Button color="info">
                                <i className="fa fa-users mr-1"></i> Customer
                            </Button>
                        </Link>
                    </div>
                </Col>
            </Row>

            <Row className="mb-4">
                <Col md="12">
                    <Card>
                        <CardBody>
                            <CardTitle tag="h5">Dashboard Insights</CardTitle>
                            <div className="d-flex align-items-center flex-wrap">
                                <Button
                                    color={dateRange === 'today' ? 'primary' : 'secondary'}
                                    onClick={() => setDateRange('today')}
                                    className="mr-2 mb-2"
                                    style={{
                                        borderBottom: dateRange === 'today' ? '3px solid #007bff' : 'none',
                                        backgroundColor: dateRange === 'today' ? '#007bff' : '#6c757d',
                                        fontWeight: dateRange === 'today' ? 'bold' : 'normal'
                                    }}
                                >
                                    Today
                                </Button>
                                <Button
                                    color={dateRange === 'weekly' ? 'primary' : 'secondary'}
                                    onClick={() => setDateRange('weekly')}
                                    className="mr-2 mb-2"
                                    style={{
                                        borderBottom: dateRange === 'weekly' ? '3px solid #007bff' : 'none',
                                        backgroundColor: dateRange === 'weekly' ? '#007bff' : '#6c757d',
                                        fontWeight: dateRange === 'weekly' ? 'bold' : 'normal'
                                    }}
                                >
                                    This Week
                                </Button>
                                <Button
                                    color={dateRange === 'monthly' ? 'primary' : 'secondary'}
                                    onClick={() => setDateRange('monthly')}
                                    className="mr-2 mb-2"
                                    style={{
                                        borderBottom: dateRange === 'monthly' ? '3px solid #007bff' : 'none',
                                        backgroundColor: dateRange === 'monthly' ? '#007bff' : '#6c757d',
                                        fontWeight: dateRange === 'monthly' ? 'bold' : 'normal'
                                    }}
                                >
                                    This Month
                                </Button>
                                <Button
                                    color={dateRange === 'yearly' ? 'primary' : 'secondary'}
                                    onClick={() => setDateRange('yearly')}
                                    className="mr-2 mb-2"
                                    style={{
                                        borderBottom: dateRange === 'yearly' ? '3px solid #007bff' : 'none',
                                        backgroundColor: dateRange === 'yearly' ? '#007bff' : '#6c757d',
                                        fontWeight: dateRange === 'yearly' ? 'bold' : 'normal'
                                    }}
                                >
                                    This Year
                                </Button>
                                <Button
                                    color={dateRange === 'custom' ? 'primary' : 'secondary'}
                                    onClick={() => setDateRange('custom')}
                                    className="mr-2 mb-2"
                                    style={{
                                        borderBottom: dateRange === 'custom' ? '3px solid #007bff' : 'none',
                                        backgroundColor: dateRange === 'custom' ? '#007bff' : '#6c757d',
                                        fontWeight: dateRange === 'custom' ? 'bold' : 'normal'
                                    }}
                                >
                                    Custom Range
                                </Button>
                            </div>

                            {dateRange === 'custom' && (
                                <div className="mt-3 d-flex align-items-end">
                                    <FormGroup className="mr-2 mb-0">
                                        <Label for="startDate">Start Date</Label>
                                        <Input
                                            type="date"
                                            id="startDate"
                                            value={customStartDate}
                                            onChange={(e) => setCustomStartDate(e.target.value)}
                                        />
                                    </FormGroup>
                                    <FormGroup className="mr-2 mb-0">
                                        <Label for="endDate">End Date</Label>
                                        <Input
                                            type="date"
                                            id="endDate"
                                            value={customEndDate}
                                            onChange={(e) => setCustomEndDate(e.target.value)}
                                        />
                                    </FormGroup>
                                    <Button color="info" onClick={handleCustomSearch}>Search</Button>
                                </div>
                            )}
                        </CardBody>
                    </Card>
                </Col>
            </Row>

            {loading && <div className="text-center my-4">Loading...</div>}
            {error && <Alert color="danger">{error}</Alert>}

            {!loading && !error && (
                <>
                    <Row className="mb-4">
                        <Col md="4">
                            <Card className="shadow-sm border-0" style={{ borderLeft: '4px solid #28a745' }}>
                                <CardBody>
                                    <div className="d-flex justify-content-between align-items-center">
                                        <div>
                                            <p className="text-muted mb-1" style={{ fontSize: '0.85rem', fontWeight: '500' }}>TOTAL SELL</p>
                                            <h3 className="mb-0" style={{ color: '#28a745', fontWeight: 'bold' }}>৳{data.totalSell.toLocaleString()}</h3>
                                        </div>
                                        <div style={{ fontSize: '2rem', color: '#28a745', opacity: 0.3 }}>
                                            <i className="fa fa-shopping-cart"></i>
                                        </div>
                                    </div>
                                </CardBody>
                            </Card>
                        </Col>
                        <Col md="4">
                            <Card className="shadow-sm border-0" style={{ borderLeft: `4px solid ${data.totalProfit >= 0 ? '#17a2b8' : '#dc3545'}` }}>
                                <CardBody>
                                    <div className="d-flex justify-content-between align-items-center">
                                        <div>
                                            <p className="text-muted mb-1" style={{ fontSize: '0.85rem', fontWeight: '500' }}>TOTAL PROFIT</p>
                                            <h3 className="mb-0" style={{ color: data.totalProfit >= 0 ? '#17a2b8' : '#dc3545', fontWeight: 'bold' }}>
                                                ৳{data.totalProfit.toLocaleString()}
                                            </h3>
                                        </div>
                                        <div style={{ fontSize: '2rem', color: data.totalProfit >= 0 ? '#17a2b8' : '#dc3545', opacity: 0.3 }}>
                                            <i className={`fa fa-${data.totalProfit >= 0 ? 'arrow-up' : 'arrow-down'}`}></i>
                                        </div>
                                    </div>
                                </CardBody>
                            </Card>
                        </Col>
                        <Col md="4">
                            <Card className="shadow-sm border-0" style={{ borderLeft: '4px solid #ffc107' }}>
                                <CardBody>
                                    <div className="d-flex justify-content-between align-items-center">
                                        <div>
                                            <p className="text-muted mb-1" style={{ fontSize: '0.85rem', fontWeight: '500' }}>TOTAL DISCOUNT</p>
                                            <h3 className="mb-0" style={{ color: '#ffc107', fontWeight: 'bold' }}>৳{data.totalDiscount.toLocaleString()}</h3>
                                        </div>
                                        <div style={{ fontSize: '2rem', color: '#ffc107', opacity: 0.3 }}>
                                            <i className="fa fa-tag"></i>
                                        </div>
                                    </div>
                                </CardBody>
                            </Card>
                        </Col>
                    </Row>

                    {data.warnings.length > 0 && (
                        <Row className="mb-4">
                            <Col md="12">
                                <Card border="danger">
                                    <CardBody>
                                        <CardTitle tag="h5" className="text-danger">Warnings</CardTitle>
                                        <ul>
                                            {data.warnings.map((warning, index) => (
                                                <li key={index} className="text-danger">
                                                    <strong>{warning.type}:</strong> {warning.message}
                                                </li>
                                            ))}
                                        </ul>
                                    </CardBody>
                                </Card>
                            </Col>
                        </Row>
                    )}

                    <Row>
                        <Col md="12">
                            <Card>
                                <CardBody>
                                    <CardTitle tag="h5">Invoice Insights</CardTitle>
                                    <Table responsive striped hover>
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
                                                                style={{
                                                                    color: '#007bff',
                                                                    textDecoration: 'underline',
                                                                    fontWeight: '500'
                                                                }}
                                                            >
                                                                {invoice.invoiceNumber}
                                                            </Link>
                                                        </td>
                                                        <td>{moment(invoice.date).format('MMM D, YYYY h:mm A')}</td>
                                                        <td>{invoice.customerName}</td>
                                                        <td className="text-right">৳{invoice.totalSell.toLocaleString()}</td>
                                                        <td className={`text-right ${invoice.totalProfit < 0 ? 'text-danger' : 'text-success'}`}>
                                                            ৳{invoice.totalProfit.toLocaleString()}
                                                        </td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan="5" className="text-center">No invoices found for this period.</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </Table>
                                </CardBody>
                            </Card>
                        </Col>
                    </Row>
                </>
            )}
        </div>
    );
};

export default MyShop;
