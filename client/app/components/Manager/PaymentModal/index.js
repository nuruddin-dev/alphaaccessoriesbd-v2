import React, { Component } from 'react';
import { connect } from 'react-redux';
import { success, error, warning } from 'react-notification-system-redux';
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
            fee: '',
            paymentMethod: 'cash',
            selectedAccount: '',
            selectedAccountType: '',
            accounts: [],
            notes: '',
            relatedInvoice: '',
            invoices: [],
            discount: '', // New state for discount
            isLoading: false,
            error: ''
        };
    }

    componentDidUpdate(prevProps) {
        if (this.props.isOpen && !prevProps.isOpen) {
            this.loadInvoices();
            this.fetchAccounts();
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
                const invoicesWithDue = customer.purchase_history.filter(inv => (inv.due || 0) > 0);
                this.setState({ invoices: invoicesWithDue });

                // Automatically select the most recent invoice with due > 0
                if (invoicesWithDue.length > 0) {
                    const latestInvoice = [...invoicesWithDue].sort((a, b) => new Date(b.created) - new Date(a.created))[0];
                    this.setState({
                        relatedInvoice: latestInvoice._id,
                        discount: latestInvoice.discount || 0
                    });
                }
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
                const invoicesWithDue = response.data.invoices.filter(inv => (inv.due || 0) > 0);
                this.setState({ invoices: invoicesWithDue });

                // Automatically select the most recent invoice with due > 0
                if (invoicesWithDue.length > 0) {
                    const latestInvoice = [...invoicesWithDue].sort((a, b) => new Date(b.created) - new Date(a.created))[0];
                    this.setState({
                        relatedInvoice: latestInvoice._id,
                        discount: latestInvoice.discount || 0
                    });
                }
            }
        } catch (error) {
            console.error('Error fetching invoices:', error);
        }
    };

    fetchAccounts = async () => {
        try {
            const response = await axios.get(`${API_URL}/account`);
            let accounts = response.data.accounts || [];

            // Sorting logic: Cash > all Bank > all mobile banking. Secondary sort by name.
            const getPriority = (type) => {
                const t = type.toLowerCase();
                if (t === 'cash') return 0;
                if (t === 'bank') return 1;
                if (t === 'mobile' || t === 'bkash' || t === 'nagad' || t === 'rocket') return 2;
                return 3;
            };

            accounts.sort((a, b) => {
                const priorityA = getPriority(a.type);
                const priorityB = getPriority(b.type);
                if (priorityA !== priorityB) {
                    return priorityA - priorityB;
                }
                return a.name.localeCompare(b.name);
            });

            // Add 'None' account for returns/adjustments at the top
            const updatedAccounts = [
                { _id: 'none', name: 'None (Product Return/Adjustment)', type: 'none' },
                ...accounts
            ];

            this.setState({
                accounts: updatedAccounts,
                selectedAccount: updatedAccounts[0]._id,
                selectedAccountType: updatedAccounts[0].type
            });
        } catch (error) {
            console.error('Error fetching accounts:', error);
        }
    };

    handleAmountChange = (e) => {
        this.setState({ amount: e.target.value, error: '' });
    };

    handleAccountChange = (e) => {
        const accountId = e.target.value;
        const account = this.state.accounts.find(a => a._id === accountId);
        this.setState({
            selectedAccount: accountId,
            selectedAccountType: account ? account.type : ''
        });
    };

    handleFeeChange = (e) => {
        this.setState({ fee: e.target.value });
    };

    handleNotesChange = (e) => {
        this.setState({ notes: e.target.value });
    };

    handleInvoiceChange = (e) => {
        const invoiceId = e.target.value;
        const invoice = this.state.invoices.find(i => i._id === invoiceId);
        this.setState({
            relatedInvoice: invoiceId,
            discount: invoice ? (invoice.discount || 0) : ''
        });
    };

    handleDiscountChange = (e) => {
        this.setState({ discount: e.target.value });
    };

    handleSubmit = async () => {
        const { amount, selectedAccount, notes, relatedInvoice } = this.state;
        const { customer, onSuccess, onRequestClose } = this.props;

        if (!amount || parseFloat(amount) <= 0) {
            this.setState({ error: 'Please enter a valid amount.' });
            return;
        }

        this.setState({ isLoading: true, error: '' });

        try {
            // If related invoice is selected and discount is modified/provided, update invoice first
            if (relatedInvoice && this.state.discount !== '' && parseFloat(this.state.discount) >= 0) {
                const invoice = this.state.invoices.find(i => i._id === relatedInvoice);
                if (invoice) {
                    const newDiscount = parseFloat(this.state.discount);
                    // Only update if discount has changed
                    if (newDiscount !== (invoice.discount || 0)) {
                        const subTotal = parseFloat(invoice.subTotal) || 0;
                        const previousDue = parseFloat(invoice.previousDue) || 0;
                        const paid = parseFloat(invoice.paid) || 0;

                        // Calculate new values: GrandTotal = SubTotal + PreviousDue - Discount
                        const grandTotal = subTotal + previousDue - newDiscount;
                        // Due = GrandTotal - Paid (This is intermediate due, before this payment is applied)
                        const due = grandTotal - paid;

                        await axios.put(`${API_URL}/invoice/${relatedInvoice}`, {
                            discount: newDiscount,
                            grandTotal,
                            due
                        });
                    }
                }
            }

            const response = await axios.post(`${API_URL}/payment/create`, {
                customer: customer._id,
                amount: parseFloat(amount),
                account: selectedAccount === 'none' ? null : selectedAccount,
                fee: parseFloat(this.state.fee) || 0,
                notes,
                relatedInvoice: relatedInvoice || null,
                createdBy: this.props.user ? `${this.props.user.firstName} ${this.props.user.lastName}` : 'Admin'
            });

            if (response.data.success) {
                this.props.success({ title: 'Payment recorded successfully!', position: 'tr', autoDismiss: 3 });
                this.setState({
                    amount: '',
                    fee: '',
                    selectedAccount: this.state.accounts.length > 0 ? this.state.accounts[0]._id : '',
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
        const { amount, fee, selectedAccount, selectedAccountType, accounts, notes, relatedInvoice, invoices, discount, isLoading, error } = this.state;

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
                    <label style={labelStyle}>Payment Account</label>
                    <select
                        style={inputStyle}
                        value={selectedAccount}
                        onChange={this.handleAccountChange}
                    >
                        {accounts.map(acc => (
                            <option key={acc._id} value={acc._id}>
                                {acc.name} ({acc.type})
                            </option>
                        ))}
                    </select>
                </div>

                {/* Show Fee field if Mobile Banking */}
                {(selectedAccountType === 'mobile' || selectedAccountType === 'bkash' || selectedAccountType === 'nagad') && (
                    <div>
                        <label style={labelStyle}>Transaction Fee (Included in Amount)</label>
                        <input
                            type="number"
                            min="0"
                            step="1"
                            style={inputStyle}
                            value={fee}
                            onChange={this.handleFeeChange}
                            placeholder="Enter fee amount"
                        />
                        <p style={{ fontSize: '11px', color: '#64748b', marginTop: '-8px', marginBottom: '12px' }}>
                            Net Payment = Amount - Fee (<b>৳{Math.max(0, (parseFloat(amount) || 0) - (parseFloat(fee) || 0))}</b> credit to customer)
                        </p>
                    </div>
                )}

                <div>
                    <label style={labelStyle}>Apply Payment To (Auto-selected Last Invoice)</label>
                    <select
                        style={inputStyle}
                        value={relatedInvoice}
                        onChange={this.handleInvoiceChange}
                    >
                        <option value="">-- Manual Selection --</option>
                        {invoices.map(inv => (
                            <option key={inv._id} value={inv._id}>
                                #{inv.invoiceNumber} - Due: ৳{inv.due} {inv._id === relatedInvoice ? '(Selected)' : ''}
                            </option>
                        ))}
                    </select>
                    {!relatedInvoice && invoices.length > 0 && (
                        <p style={{ fontSize: '12px', color: '#dc2626', marginTop: '-8px', marginBottom: '12px' }}>
                            Warning: No invoice selected, will auto-apply to last invoice.
                        </p>
                    )}
                </div>

                {relatedInvoice && (
                    <div>
                        <label style={labelStyle}>Discount Amount (৳)</label>
                        <input
                            type="number"
                            min="0"
                            step="1"
                            style={inputStyle}
                            value={discount}
                            onChange={this.handleDiscountChange}
                            placeholder="Enter discount amount"
                        />
                    </div>
                )}

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

const mapStateToProps = state => ({
    user: state.account.user
});

const mapDispatchToProps = dispatch => ({
    success: opts => dispatch(success(opts)),
    error: opts => dispatch(error(opts)),
    warning: opts => dispatch(warning(opts))
});

export default connect(mapStateToProps, mapDispatchToProps)(PaymentModal);
