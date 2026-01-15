import React from 'react';
import { Row, Col, Card } from 'reactstrap';
import { Link } from 'react-router-dom';
import Account from '../../../../containers/Account';

const UserDashboardSummary = ({ user }) => {
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
                    Welcome, {user.firstName}!
                </h2>
            </div>

            <Row className="mb-4">
                <Col md={12}>
                    <Card className="p-3 border-0 shadow-sm" style={{ background: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)', color: '#fff' }}>
                        <div className="d-flex justify-content-between align-items-center">
                            <div>
                                <h5 className="mb-1">My Account</h5>
                                <p className="mb-0 opacity-75">{user.email}</p>
                            </div>
                            <Link to="/dashboard/my-account" className="btn btn-light btn-sm text-primary font-weight-bold">
                                View Profile
                            </Link>
                        </div>
                    </Card>
                </Col>
            </Row>

            <Row>
                <Col md={6} className="mb-4">
                    <Card className="p-4 border-0 shadow-sm h-100">
                        <h5 className="mb-3"><i className="fa fa-shopping-bag text-primary mr-2"></i> Current Orders</h5>
                        <p className="text-muted">You have no active orders at the moment.</p>
                        <Link to="/dashboard/orders" className="text-primary font-weight-bold" style={{ fontSize: '0.9rem' }}>
                            View All Orders &rarr;
                        </Link>
                    </Card>
                </Col>
                <Col md={6} className="mb-4">
                    <Card className="p-4 border-0 shadow-sm h-100">
                        <h5 className="mb-3"><i className="fa fa-history text-success mr-2"></i> Order History</h5>
                        <p className="text-muted">Check your previous purchases and invoices.</p>
                        <Link to="/dashboard/orders" className="text-primary font-weight-bold" style={{ fontSize: '0.9rem' }}>
                            View History &rarr;
                        </Link>
                    </Card>
                </Col>
            </Row>
        </div>
    );
};

export default UserDashboardSummary;
