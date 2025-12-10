import React, { Component } from 'react';
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
        width: '500px',
        maxWidth: '90vw',
        maxHeight: '80vh',
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

class PaymentModal extends Component {
    constructor(props) {
        super(props);
        this.state = {
            amount: '',
            paymentMethod: 'cash',
            notes: '',
            relatedInvoice: '',
            invoices: [],
            isLoading: false,
            error: ''
        };
    }

    componentDidUpdate(prevProps) {
        if (this.props.isOpen && !prevProps.isOpen && this.props.customer) {
            this.loadInvoices();
        }
    }

    loadInvoices = () => {
        const { customer } = this.props;
        if (!customer) return;

        // If customer has populated purchase_history with invoice data, use it
        if (customer.purchase_history && customer.purchase_history.length > 0) {
            // Check if purchase_history contains populated invoice objects (not just IDs)
            const firstItem = customer.purchase_history[0];
            if (typeof firstItem === 'object' && firstItem.invoiceNumber) {
                // Already populated - filter for invoices with due > 0
                const invoicesWithDue = customer.purchase_history.filter(inv => inv.due > 0);
                this.setState({ invoices: invoicesWithDue });
                return;
            }
        }

        // Otherwise fetch from API
        this.fetchCustomerInvoices();
    };

    fetchCustomerInvoices = async () => {
        if (!this.props.customer || !this.props.customer._id) return;

        try {
            const response = await axios.get(
                `${API_URL}/invoice/customer/${this.props.customer._id}`
            );
            if (response.data.invoices) {
                // Filter invoices with remaining due
                const invoicesWithDue = response.data.invoices.filter(inv => inv.due > 0);
                this.setState({ invoices: invoicesWithDue });
            }
        } catch (error) {
            console.error('Error fetching invoices:', error);
        }
    };

    handleAmountChange = (e) => {
        this.setState({ amount: e.target.value, error: '' });
    };

    handlePaymentMethodChange = (e) => {
        this.setState({ paymentMethod: e.target.value });
    };

    handleNotesChange = (e) => {
        this.setState({ notes: e.target.value });
    };

    handleInvoiceChange = (e) => {
        this.setState({ relatedInvoice: e.target.value });
    };

    handleSubmit = async () => {
        const { amount, paymentMethod, notes, relatedInvoice } = this.state;
        const { customer, onSuccess, onRequestClose } = this.props;

        if (!amount || parseFloat(amount) <= 0) {
            this.setState({ error: 'Please enter a valid amount.' });
            return;
        }

        this.setState({ isLoading: true, error: '' });

        try {
            const response = await axios.post(`${API_URL}/payment/create`, {
                customer: customer._id,
                amount: parseFloat(amount),
                paymentMethod,
                notes,
                relatedInvoice: relatedInvoice || null
            });

            if (response.data.success) {
                alert('Payment recorded successfully!');
                this.setState({
                    amount: '',
                    paymentMethod: 'cash',
                    notes: '',
                    relatedInvoice: '',
                    isLoading: false
                });
                if (onSuccess) onSuccess();
                onRequestClose();
            }
        } catch (error) {
            console.error('Error recording payment:', error);
            this.setState({
                error: error.response?.data?.error || 'Failed to record payment.',
                isLoading: false
            });
        }
    };

    render() {
        const { isOpen, onRequestClose, customer } = this.props;
        const { amount, paymentMethod, notes, relatedInvoice, invoices, isLoading, error } = this.state;

        const inputStyle = {
            width: '100%',
            padding: '10px 12px',
            boxSizing: 'border-box',
            border: '1.5px solid #e2e8f0',
            borderRadius: '8px',
            fontSize: '14px',
            color: '#1e293b',
            marginBottom: '12px'
        };

        const labelStyle = {
            display: 'block',
            marginBottom: '6px',
            fontSize: '12px',
            fontWeight: 600,
            color: '#475569',
            textTransform: 'uppercase',
            letterSpacing: '0.3px'
        };

        const buttonStyle = {
            padding: '12px 20px',
            borderRadius: '8px',
            border: 'none',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 600,
            transition: 'all 0.2s ease'
        };

        return (
            <Modal
                isOpen={isOpen}
                onRequestClose={onRequestClose}
                style={customStyles}
                contentLabel="Record Payment"
                ariaHideApp={false}
            >
                <h2 style={{ margin: '0 0 20px 0', color: '#1e293b', fontSize: '20px' }}>
                    Record Due Payment
                </h2>

                {customer && (
                    <div style={{
                        background: '#f1f5f9',
                        padding: '12px 16px',
                        borderRadius: '10px',
                        marginBottom: '20px'
                    }}>
                        <div style={{ fontWeight: 600, color: '#334155' }}>{customer.name}</div>
                        <div style={{ fontSize: '13px', color: '#64748b' }}>{customer.phoneNumber}</div>
                        <div style={{ fontSize: '14px', color: '#dc2626', fontWeight: 600, marginTop: '4px' }}>
                            Current Due: ৳{customer.due || 0}
                        </div>
                    </div>
                )}

                {error && (
                    <div style={{
                        background: '#fef2f2',
                        color: '#dc2626',
                        padding: '10px 14px',
                        borderRadius: '8px',
                        marginBottom: '16px',
                        fontSize: '13px'
                    }}>
                        {error}
                    </div>
                )}

                <div>
                    <label style={labelStyle}>Payment Amount (৳)</label>
                    <input
                        type="number"
                        min="0"
                        step="1"
                        style={inputStyle}
                        value={amount}
                        onChange={this.handleAmountChange}
                        placeholder="Enter amount"
                    />
                </div>

                <div>
                    <label style={labelStyle}>Payment Method</label>
                    <select
                        style={inputStyle}
                        value={paymentMethod}
                        onChange={this.handlePaymentMethodChange}
                    >
                        <option value="cash">Cash</option>
                        <option value="bank">Bank Transfer</option>
                        <option value="bkash">Bkash</option>
                        <option value="nagad">Nagad</option>
                    </select>
                </div>

                <div>
                    <label style={labelStyle}>Related Invoice (Optional)</label>
                    <select
                        style={inputStyle}
                        value={relatedInvoice}
                        onChange={this.handleInvoiceChange}
                    >
                        <option value="">-- Select Invoice --</option>
                        {invoices.map(inv => (
                            <option key={inv._id} value={inv._id}>
                                #{inv.invoiceNumber} - Due: ৳{inv.due}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label style={labelStyle}>Notes (Optional)</label>
                    <textarea
                        style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }}
                        value={notes}
                        onChange={this.handleNotesChange}
                        placeholder="Add any notes..."
                    />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                    <button
                        style={{ ...buttonStyle, background: '#f1f5f9', color: '#64748b' }}
                        onClick={onRequestClose}
                        disabled={isLoading}
                    >
                        Cancel
                    </button>
                    <button
                        style={{ ...buttonStyle, background: '#22c55e', color: 'white' }}
                        onClick={this.handleSubmit}
                        disabled={isLoading}
                    >
                        {isLoading ? 'Saving...' : 'Record Payment'}
                    </button>
                </div>
            </Modal>
        );
    }
}

export default PaymentModal;
