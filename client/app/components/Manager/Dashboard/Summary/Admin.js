import React from 'react';
import { Row, Col, Card, Button } from 'reactstrap';
import { Link } from 'react-router-dom';

const AdminDashboardSummary = ({ user }) => {
    return (
        <div className="dashboard-summary">
            <div className="d-flex align-items-center" style={{ background: '#fff', padding: '20px 24px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', marginBottom: '30px' }}>
                <div style={{
                    width: '4px',
                    height: '24px',
                    background: '#06b6d4',
                    borderRadius: '2px',
                    marginRight: '12px'
                }}></div>
                <h2 className="mb-0" style={{
                    fontWeight: '700',
                    color: '#1e293b',
                    fontSize: '20px',
                    letterSpacing: '-0.5px'
                }}>
                    Welcome back, {user.firstName}!
                </h2>
            </div>

            <div className="mb-5">
                <h5 className="mb-3 text-muted">Quick Actions</h5>
                <div className="d-flex flex-wrap gap-2">
                    <Link to="/dashboard/sales-overview" className="btn btn-primary" style={{ marginRight: '10px' }}>
                        <i className="fa fa-line-chart mr-2"></i> Sales Overview
                    </Link>
                    <Link to="/dashboard/accounts" className="btn btn-info text-white" style={{ marginRight: '10px' }}>
                        <i className="fa fa-bank mr-2"></i> Financial Accounts
                    </Link>
                    <Link to="/dashboard/myshop" className="btn btn-success" style={{ marginRight: '10px' }}>
                        <i className="fa fa-shopping-bag mr-2"></i> MyShop
                    </Link>
                    <Link to="/dashboard/orders" className="btn btn-warning text-white">
                        <i className="fa fa-clipboard mr-2"></i> Orders
                    </Link>
                </div>
            </div>

            <Row>
                <Col md={12}>
                    <Card className="p-4 border-0 shadow-sm mb-4">
                        <h4>System Overview</h4>
                        <p className="text-muted">
                            Select an option from the sidebar to manage your store.
                        </p>
                    </Card>
                </Col>
            </Row>
        </div>
    );
};

export default AdminDashboardSummary;
