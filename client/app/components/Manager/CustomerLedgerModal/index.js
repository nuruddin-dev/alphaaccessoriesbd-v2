import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import Modal from 'react-modal';
import axios from 'axios';
import { API_URL } from '../../../constants';

const customStyles = {
    content: {
        top: '50%',
        left: '50%',
        right: 'auto',
        bottom: 'auto',
        marginRight: '-50%',
        transform: 'translate(-50%, -50%)',
        width: '900px',
        maxWidth: '95vw',
        maxHeight: '85vh',
        overflow: 'auto',
        borderRadius: '16px',
        border: 'none',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        padding: '24px'
    },
    overlay: {
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        zIndex: 1000
    }
};

class CustomerLedgerModal extends Component {
    constructor(props) {
        super(props);
        this.state = {
            customer: null,
            ledger: [],
            currentBalance: 0,
            isLoading: true,
            error: ''
        };
    }

    componentDidUpdate(prevProps) {
        if (this.props.isOpen && !prevProps.isOpen && this.props.customerId) {
            this.fetchLedger();
        }
    }

    fetchLedger = async () => {
        this.setState({ isLoading: true, error: '' });

        try {
            const response = await axios.get(
                `${API_URL}/payment/ledger/${this.props.customerId}`
            );

            this.setState({
                customer: response.data.customer,
                ledger: response.data.ledger,
                currentBalance: response.data.currentBalance,
                isLoading: false
            });
        } catch (error) {
            console.error('Error fetching ledger:', error);
            this.setState({
                error: 'Failed to load customer ledger.',
                isLoading: false
            });
        }
    };

    formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    render() {
        const { isOpen, onRequestClose } = this.props;
        const { customer, ledger, currentBalance, isLoading, error } = this.state;

        const tableStyle = {
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '13px'
        };

        const thStyle = {
            padding: '12px 10px',
            textAlign: 'left',
            borderBottom: '2px solid #e2e8f0',
            background: '#f8fafc',
            color: '#475569',
            fontWeight: 600,
            fontSize: '11px',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
        };

        const tdStyle = {
            padding: '12px 10px',
            borderBottom: '1px solid #f1f5f9',
            color: '#334155'
        };

        return (
            <Modal
                isOpen={isOpen}
                onRequestClose={onRequestClose}
                style={customStyles}
                contentLabel="Customer Ledger"
                ariaHideApp={false}
            >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h2 style={{ margin: 0, color: '#1e293b', fontSize: '20px' }}>
                        Customer Ledger
                    </h2>
                    <button
                        onClick={onRequestClose}
                        style={{
                            background: 'transparent',
                            border: 'none',
                            fontSize: '24px',
                            color: '#94a3b8',
                            cursor: 'pointer'
                        }}
                    >
                        ×
                    </button>
                </div>

                {isLoading ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                        Loading ledger...
                    </div>
                ) : error ? (
                    <div style={{
                        background: '#fef2f2',
                        color: '#dc2626',
                        padding: '16px',
                        borderRadius: '8px',
                        textAlign: 'center'
                    }}>
                        {error}
                    </div>
                ) : (
                    <>
                        {/* Customer Info Header */}
                        {customer && (
                            <div style={{
                                background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                                padding: '16px 20px',
                                borderRadius: '12px',
                                marginBottom: '20px',
                                color: 'white',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                            }}>
                                <div>
                                    <div style={{ fontWeight: 600, fontSize: '18px' }}>{customer.name}</div>
                                    <div style={{ opacity: 0.9, fontSize: '14px' }}>{customer.phoneNumber}</div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontSize: '12px', opacity: 0.9 }}>Current Balance</div>
                                    <div style={{
                                        fontSize: '24px',
                                        fontWeight: 700,
                                        color: currentBalance > 0 ? '#fecaca' : '#bbf7d0'
                                    }}>
                                        ৳{currentBalance}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Ledger Table */}
                        {ledger.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                                No transactions found for this customer.
                            </div>
                        ) : (
                            <table style={tableStyle}>
                                <thead>
                                    <tr>
                                        <th style={thStyle}>Date</th>
                                        <th style={thStyle}>Description</th>
                                        <th style={{ ...thStyle, textAlign: 'right' }}>Debit (New Due)</th>
                                        <th style={{ ...thStyle, textAlign: 'right' }}>Credit (Paid)</th>
                                        <th style={{ ...thStyle, textAlign: 'right' }}>Balance</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {ledger.map((entry, index) => (
                                        <tr key={index} style={{
                                            background: entry.type === 'payment' ? '#f0fdf4' : 'transparent'
                                        }}>
                                            <td style={tdStyle}>
                                                {this.formatDate(entry.date)}
                                            </td>
                                            <td style={tdStyle}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    {entry.type === 'invoice' ? (
                                                        <span style={{
                                                            background: '#dbeafe',
                                                            color: '#1d4ed8',
                                                            padding: '2px 8px',
                                                            borderRadius: '12px',
                                                            fontSize: '11px',
                                                            fontWeight: 500
                                                        }}>
                                                            Invoice
                                                        </span>
                                                    ) : (
                                                        <span style={{
                                                            background: '#dcfce7',
                                                            color: '#16a34a',
                                                            padding: '2px 8px',
                                                            borderRadius: '12px',
                                                            fontSize: '11px',
                                                            fontWeight: 500
                                                        }}>
                                                            Payment
                                                        </span>
                                                    )}
                                                    {entry.type === 'invoice' ? (
                                                        <Link
                                                            to={`/dashboard/invoice/${entry.invoiceNumber}`}
                                                            style={{
                                                                color: '#2563eb',
                                                                textDecoration: 'none',
                                                                fontWeight: 500
                                                            }}
                                                            title="View Invoice"
                                                        >
                                                            {entry.description}
                                                        </Link>
                                                    ) : (
                                                        <span>{entry.description}</span>
                                                    )}
                                                    {entry.type === 'invoice' && (
                                                        <span style={{ color: '#94a3b8', fontSize: '12px' }}>
                                                            (Total: ৳{(entry.subTotal - (entry.discount || 0)).toLocaleString()}, Paid at Checkout: ৳{(entry.paid || 0).toLocaleString()})
                                                        </span>
                                                    )}
                                                    {entry.notes && (
                                                        <span style={{ color: '#94a3b8', fontSize: '12px', fontStyle: 'italic' }}>
                                                            - {entry.notes}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td style={{ ...tdStyle, textAlign: 'right', color: '#dc2626' }}>
                                                {entry.debit > 0 ? `৳${entry.debit.toLocaleString()}` : '-'}
                                            </td>
                                            <td style={{ ...tdStyle, textAlign: 'right', color: '#16a34a' }}>
                                                {entry.credit > 0 ? `৳${entry.credit.toLocaleString()}` : '-'}
                                            </td>
                                            <td style={{
                                                ...tdStyle,
                                                textAlign: 'right',
                                                fontWeight: 600,
                                                color: entry.runningBalance > 0 ? '#dc2626' : '#16a34a'
                                            }}>
                                                ৳{entry.runningBalance}
                                            </td>
                                        </tr>
                                    ))}

                                    {/* Show opening balance at bottom (oldest entry) */}
                                    {ledger[ledger.length - 1]?.openingBalance > 0 && (
                                        <tr style={{ background: '#fef3c7' }}>
                                            <td style={tdStyle}>-</td>
                                            <td style={tdStyle}>
                                                <span style={{
                                                    background: '#fbbf24',
                                                    color: '#78350f',
                                                    padding: '2px 8px',
                                                    borderRadius: '12px',
                                                    fontSize: '11px',
                                                    fontWeight: 500
                                                }}>
                                                    Opening Balance
                                                </span>
                                            </td>
                                            <td style={{ ...tdStyle, textAlign: 'right', color: '#dc2626' }}>
                                                ৳{ledger[ledger.length - 1].openingBalance.toLocaleString()}
                                            </td>
                                            <td style={{ ...tdStyle, textAlign: 'right' }}>-</td>
                                            <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 600, color: '#dc2626' }}>
                                                ৳{ledger[ledger.length - 1].openingBalance.toLocaleString()}
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        )}

                        {/* Summary */}
                        <div style={{
                            marginTop: '20px',
                            padding: '16px',
                            background: '#f8fafc',
                            borderRadius: '10px',
                            display: 'flex',
                            justifyContent: 'space-between'
                        }}>
                            <div>
                                <span style={{ color: '#64748b', fontSize: '13px' }}>Total Invoices: </span>
                                <strong>{ledger.filter(e => e.type === 'invoice').length}</strong>
                            </div>
                            <div>
                                <span style={{ color: '#64748b', fontSize: '13px' }}>Total Payments: </span>
                                <strong>{ledger.filter(e => e.type === 'payment').length}</strong>
                            </div>
                            <div>
                                <span style={{ color: '#64748b', fontSize: '13px' }}>Outstanding Balance: </span>
                                <strong style={{ color: currentBalance > 0 ? '#dc2626' : '#16a34a' }}>
                                    ৳{currentBalance}
                                </strong>
                            </div>
                        </div>
                    </>
                )}
            </Modal>
        );
    }
}

export default CustomerLedgerModal;
