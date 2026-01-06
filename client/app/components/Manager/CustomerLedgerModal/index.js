import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import Modal from 'react-modal';
import axios from 'axios';
import domtoimage from 'dom-to-image-more';
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

const printOptionsStyles = {
    content: {
        top: '50%',
        left: '50%',
        right: 'auto',
        bottom: 'auto',
        marginRight: '-50%',
        transform: 'translate(-50%, -50%)',
        width: '500px',
        maxWidth: '90vw',
        borderRadius: '12px',
        border: 'none',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        padding: '24px'
    },
    overlay: {
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        zIndex: 1050
    }
};

class CustomerLedgerModal extends Component {
    _isMounted = false;

    constructor(props) {
        super(props);
        this.state = {
            customer: null,
            ledger: [],
            currentBalance: 0,
            isLoading: true,
            error: '',
            isPrintModalOpen: false,
            printConfig: {
                rangeType: 'all',
                limitType: '10',
            },
            printableLedger: [],
            printPreviousBalance: 0,
            isShareModalOpen: false,
            sharableImage: null,
            isGeneratingImage: false
        };
    }

    componentDidMount() {
        this._isMounted = true;
    }

    componentDidUpdate(prevProps) {
        if (this.props.isOpen && !prevProps.isOpen && this.props.customerId) {
            this.fetchLedger();
        }
    }

    componentWillUnmount() {
        this._isMounted = false;
    }

    fetchLedger = async () => {
        if (this._isMounted) {
            this.setState({ isLoading: true, error: '' });
        }

        try {
            const response = await axios.get(
                `${API_URL}/payment/ledger/${this.props.customerId}`
            );

            if (this._isMounted) {
                this.setState({
                    customer: response.data.customer,
                    ledger: response.data.ledger,
                    currentBalance: response.data.currentBalance,
                    isLoading: false
                });
            }
        } catch (error) {
            console.error('Error fetching ledger:', error);
            if (this._isMounted) {
                this.setState({
                    error: 'Failed to load customer ledger.',
                    isLoading: false
                });
            }
        }
    };

    formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    formatDateShort = (date) => {
        return new Date(date).toLocaleDateString('en-GB');
    };

    handlePrintClick = () => {
        this.setState({
            isPrintModalOpen: true,
            printConfig: { rangeType: 'all', limitType: '10' }
        });
    };

    handlePrintConfigChange = (key, value) => {
        this.setState(prevState => ({
            printConfig: { ...prevState.printConfig, [key]: value }
        }));
    };

    getFilteredLedger = () => {
        const { ledger } = this.state;
        const { rangeType, limitType } = this.state.printConfig;

        let subset = [...ledger];
        const now = new Date();
        let cutoffDate = null;
        if (rangeType === '1month') {
            cutoffDate = new Date();
            cutoffDate.setMonth(now.getMonth() - 1);
        } else if (rangeType === '3months') {
            cutoffDate = new Date();
            cutoffDate.setMonth(now.getMonth() - 3);
        }

        if (cutoffDate) {
            subset = subset.filter(e => new Date(e.date) >= cutoffDate);
        }

        if (limitType !== 'all') {
            const limit = parseInt(limitType);
            if (subset.length > limit) {
                subset = subset.slice(0, limit);
            }
        }

        let previousBalance = 0;
        if (subset.length > 0) {
            // ledger is typically Newest First.
            // The oldest item in the subset determines the previous balance relative to IT.
            // However, the 'runningBalance' in the DB is usually post-transaction.
            // So Previous Balance = RunningBalance - Debit + Credit
            const oldestItem = subset[subset.length - 1];
            const debit = oldestItem.debit || 0;
            const credit = oldestItem.credit || 0;
            previousBalance = oldestItem.runningBalance - debit + credit;
        }

        return { subset, previousBalance };
    };

    handleConfirmPrint = () => {
        const { subset, previousBalance } = this.getFilteredLedger();

        // Store for use in preparePrintContent
        this.setState({
            printableLedger: subset,
            printPreviousBalance: previousBalance,
            isPrintModalOpen: false
        }, () => {
            // Use new window approach like Invoice
            const printContent = this.preparePrintContent();
            const printWindow = window.open('', '_blank');
            printWindow.document.write(printContent);
            printWindow.document.close();

            printWindow.onload = function () {
                printWindow.focus();
                printWindow.onafterprint = function () {
                    printWindow.close();
                };
                printWindow.print();
            };
        });
    };

    preparePrintContent = () => {
        const { customer, printableLedger, printPreviousBalance } = this.state;
        if (!customer) return '';

        const totalDue = printableLedger.length > 0 ? printableLedger[0].runningBalance : printPreviousBalance;
        const displayLedger = [...printableLedger].reverse();

        const periodDebit = displayLedger.reduce((sum, item) => sum + (item.debit || 0), 0);
        const periodCredit = displayLedger.reduce((sum, item) => sum + (item.credit || 0), 0);

        // Build rows HTML
        let rowsHtml = `
            <tr style="background-color: #fefce8;">
                <td style="color: #854d0e; font-weight: 600;">-</td>
                <td style="color: #854d0e; font-weight: 600;">Previous Balance</td>
                <td style="text-align: right; color: #854d0e; font-weight: 600;">-</td>
                <td style="text-align: right; color: #854d0e; font-weight: 600;">-</td>
                <td style="text-align: right; color: #854d0e; font-weight: 600;">${printPreviousBalance.toLocaleString()}</td>
            </tr>
        `;

        displayLedger.forEach((entry, index) => {
            let invoiceNumber = '-';
            if (entry.type === 'invoice') {
                invoiceNumber = entry.invoiceNumber;
            } else if (entry.type === 'payment') {
                invoiceNumber = entry.notes ? `Payment (${entry.notes})` : 'Payment';
            }

            const bgColor = index % 2 === 1 ? '#f8fafc' : 'white';
            rowsHtml += `
                <tr style="background-color: ${bgColor};">
                    <td>${this.formatDateShort(entry.date)}</td>
                    <td style="font-family: monospace; font-weight: 600;">${invoiceNumber}</td>
                    <td style="text-align: right;">${entry.debit !== 0 ? entry.debit.toLocaleString() : '-'}</td>
                    <td style="text-align: right;">${entry.credit !== 0 ? entry.credit.toLocaleString() : '-'}</td>
                    <td style="text-align: right; font-weight: 700;">${entry.runningBalance.toLocaleString()}</td>
                </tr>
            `;
        });

        // Totals row
        rowsHtml += `
            <tr style="background-color: #f1f5f9;">
                <td colspan="2" style="text-align: right; font-weight: 700;">Total for Period</td>
                <td style="text-align: right; font-weight: 700;">${periodDebit.toLocaleString()}</td>
                <td style="text-align: right; font-weight: 700;">${periodCredit.toLocaleString()}</td>
                <td style="text-align: right; font-weight: 700;">${totalDue.toLocaleString()}</td>
            </tr>
        `;

        const startDate = displayLedger.length > 0 ? this.formatDateShort(displayLedger[0].date) : this.formatDateShort(new Date());
        const endDate = displayLedger.length > 0 ? this.formatDateShort(displayLedger[displayLedger.length - 1].date) : this.formatDateShort(new Date());

        return `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Customer Ledger - ${customer.name}</title>
                <style>
                    body {
                        font-family: 'Segoe UI', Arial, sans-serif;
                        margin: 0;
                        padding: 0;
                        color: #333;
                    }
                    .container {
                        max-width: 100%;
                        margin: 0 auto;
                        padding: 20px;
                    }
                    .header {
                        display: flex;
                        border-bottom: 2px solid #e2e8f0;
                        padding-bottom: 20px;
                        margin-bottom: 20px;
                    }
                    .header-left {
                        width: 60%;
                        text-align: left;
                    }
                    .header-right {
                        width: 40%;
                        text-align: right;
                    }
                    .company-name {
                        font-size: 28px;
                        font-weight: 800;
                        color: #1e293b;
                        margin-bottom: 5px;
                    }
                    .company-details {
                        font-size: 13px;
                        color: #64748b;
                        line-height: 1.4;
                    }
                    .customer-info {
                        text-align: right;
                        font-size: 14px;
                        line-height: 1.6;
                        color: #334155;
                    }
                    table {
                        width: 100%;
                        border-collapse: collapse;
                        table-layout: fixed;
                        margin-top: 10px;
                        font-size: 12px;
                    }
                    th, td {
                        padding: 8px 10px;
                        text-align: left;
                        border: 1px solid #e2e8f0;
                    }
                    th {
                        background-color: #f8fafc;
                        font-weight: 700;
                        color: #475569;
                        text-transform: uppercase;
                        font-size: 11px;
                        letter-spacing: 0.5px;
                    }
                    .col-date { width: 15%; }
                    .col-ref { width: 35%; }
                    .col-amount { width: 16%; text-align: right; }
                    
                    @media print {
                        body { padding: 0; }
                        @page { margin: 10mm; }
                    }
                </style>
            </head>
            <body>
                <div class="container">
                <div class="container">
                    <div class="header" style="flex-direction: column; text-align: center; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px; align-items: center; margin-top: 0; padding-top: 0;">
                        <div style="font-size: 28px; font-weight: 800; color: #DC2626; margin-bottom: 2px; line-height: 1;">Alpha</div>
                        <div style="font-size: 11px; color: #334155; margin-bottom: 2px; line-height: 1.2;">26, 27/2, 40, 2nd Floor, Sundarban Square Super Market, Dhaka 1000</div>
                        <div style="font-size: 11px; color: #334155; margin-bottom: 8px; line-height: 1.2;">Mobile: 01838626121, 01869116691</div>
                        
                        <div style="font-size: 14px; font-weight: 700; color: #1e293b; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px;">
                            Customer Ledger
                        </div>

                        <div style="font-size: 11px; color: #64748b; margin-bottom: 8px;">
                            Period: ${startDate} - ${endDate}
                        </div>

                        <div style="font-size: 13px; color: #0f172a; margin-bottom: 5px;">
                            <span style="font-weight: 700;">${customer.name}</span> | <span style="color: #475569;">${customer.phoneNumber}</span>
                        </div>
                    </div>
                    
                    <table>
                        <thead>
                            <tr>
                                <th class="col-date">Date</th>
                                <th class="col-ref">Description / Invoice No.</th>
                                <th class="col-amount">Debit</th>
                                <th class="col-amount">Credit</th>
                                <th class="col-amount">Balance</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${rowsHtml}
                        </tbody>
                    </table>

                    <div style="margin-top: 40px; border-top: 1px solid #e2e8f0; padding-top: 10px; display: flex; justify-content: space-between; font-size: 11px; color: #94a3b8;">
                         <span>Authorized Signature</span>
                         <span>Run Date: ${new Date().toLocaleString()}</span>
                    </div>

                    <div style="text-align: center; margin-top: 20px; font-size: 11px; color: #475569; font-style: italic; border: 1px dashed #cbd5e1; padding: 8px; border-radius: 4px;">
                        To check the invoice go to : <strong>http://alphaaccessoriesbd.com/dashboard/invoice/view</strong> and input the invoice number
                    </div>
                </div>
            </body>
            </html>
        `;
    };

    // Share & Image Generation Methods
    handleSharePreview = () => {
        const { subset, previousBalance } = this.getFilteredLedger();

        this.setState({
            printableLedger: subset,
            printPreviousBalance: previousBalance,
            isShareModalOpen: true,
            isGeneratingImage: true,
            sharableImage: null
        });

        // Wait for rendering
        setTimeout(this.generateSharableImage, 1000);
    };

    generateSharableImage = async () => {
        const element = document.getElementById('ledger-capture-node');
        if (element) {
            try {
                const imgData = await domtoimage.toPng(element, {
                    bgcolor: '#ffffff',
                    quality: 1,
                    pixelRatio: 2, // Better quality
                    width: element.offsetWidth,
                    height: element.offsetHeight,
                    style: {
                        transform: 'none',
                        margin: 0,
                        display: 'block',
                        visibility: 'visible',
                        opacity: 1
                    }
                });
                if (this._isMounted) {
                    this.setState({ sharableImage: imgData, isGeneratingImage: false });
                }
            } catch (error) {
                console.error('Image generation failed:', error);
                if (this._isMounted) {
                    this.setState({ isGeneratingImage: false });
                }
            }
        }
    };

    handleDownloadImage = () => {
        const { sharableImage, customer } = this.state;
        if (!sharableImage) return;

        const fileName = `Ledger-${customer.name.replace(/\s+/g, '-')}-${Date.now()}.png`;
        const link = document.createElement('a');
        link.download = fileName;
        link.href = sharableImage;
        link.click();
    };

    handleCopyImage = async () => {
        const { sharableImage } = this.state;
        if (!sharableImage) return;

        try {
            const res = await fetch(sharableImage);
            const blob = await res.blob();
            await navigator.clipboard.write([
                new ClipboardItem({ 'image/png': blob })
            ]);
            alert('Image copied to clipboard!');
        } catch (err) {
            console.error('Failed to copy:', err);
            alert('Failed to copy image to clipboard.');
        }
    };

    handleWhatsAppShare = () => {
        const { customer } = this.state;
        const text = `Here is the ledger for ${customer.name}. Please check the attached image (you need to paste/attach it manually).`;
        const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
        window.open(url, '_blank');
    };

    renderCaptureNode = () => {
        const { customer, printableLedger, printPreviousBalance } = this.state;
        if (!customer) return null;

        const displayLedger = [...printableLedger].reverse();
        const periodDebit = displayLedger.reduce((sum, item) => sum + (item.debit || 0), 0);
        const periodCredit = displayLedger.reduce((sum, item) => sum + (item.credit || 0), 0);
        const totalDue = printableLedger.length > 0 ? printableLedger[0].runningBalance : printPreviousBalance;

        const startDate = displayLedger.length > 0 ? this.formatDateShort(displayLedger[0].date) : this.formatDateShort(new Date());
        const endDate = displayLedger.length > 0 ? this.formatDateShort(displayLedger[displayLedger.length - 1].date) : this.formatDateShort(new Date());

        return (
            <div id="ledger-capture-node" style={{
                width: '800px',
                padding: '10px 40px 40px 40px', // Reduced top padding
                background: 'white',
                color: '#333',
                fontFamily: 'Arial, sans-serif'
            }}>
                <div style={{ textAlign: 'center', marginBottom: '20px', borderBottom: '2px solid #e2e8f0', paddingBottom: '15px' }}>
                    <div style={{ fontSize: '28px', fontWeight: '800', color: '#DC2626', marginBottom: '4px', lineHeight: '1', marginTop: '0' }}>Alpha</div>
                    <div style={{ fontSize: '11px', color: '#334155', marginBottom: '2px', lineHeight: '1.2' }}>
                        26, 27/2, 40 (Near Stair 8), 3rd Floor, Sundarban Square Super Market, Dhaka 1000
                    </div>
                    <div style={{ fontSize: '11px', color: '#334155', marginBottom: '10px', lineHeight: '1.2' }}>
                        Mobile: 01838626121, 01869116691
                    </div>

                    <div style={{
                        fontSize: '14px',
                        fontWeight: '700',
                        color: '#1e293b',
                        textTransform: 'uppercase',
                        letterSpacing: '1px',
                        marginBottom: '4px'
                    }}>
                        Customer Ledger
                    </div>

                    <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '10px' }}>
                        Period: {startDate} - {endDate}
                    </div>

                    <div style={{ fontSize: '13px', color: '#0f172a', marginBottom: '5px' }}>
                        <span style={{ fontWeight: '700' }}>{customer.name}</span> <span style={{ color: '#cbd5e1', margin: '0 8px' }}>|</span> <span style={{ color: '#475569' }}>{customer.phoneNumber}</span>
                    </div>
                </div>

                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                    <thead>
                        <tr style={{ background: '#f8fafc' }}>
                            <th style={{ padding: '8px', border: '1px solid #e2e8f0', textAlign: 'left', color: '#475569' }}>Date</th>
                            <th style={{ padding: '8px', border: '1px solid #e2e8f0', textAlign: 'left', color: '#475569' }}>Description</th>
                            <th style={{ padding: '8px', border: '1px solid #e2e8f0', textAlign: 'right', color: '#475569' }}>Debit</th>
                            <th style={{ padding: '8px', border: '1px solid #e2e8f0', textAlign: 'right', color: '#475569' }}>Credit</th>
                            <th style={{ padding: '8px', border: '1px solid #e2e8f0', textAlign: 'right', color: '#475569' }}>Balance</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr style={{ background: '#fefce8' }}>
                            <td style={{ padding: '8px', border: '1px solid #e2e8f0' }}>-</td>
                            <td style={{ padding: '8px', border: '1px solid #e2e8f0', fontWeight: '600', color: '#854d0e' }}>Previous Balance</td>
                            <td style={{ padding: '8px', border: '1px solid #e2e8f0', textAlign: 'right' }}>-</td>
                            <td style={{ padding: '8px', border: '1px solid #e2e8f0', textAlign: 'right' }}>-</td>
                            <td style={{ padding: '8px', border: '1px solid #e2e8f0', textAlign: 'right', fontWeight: '600', color: '#854d0e' }}>{printPreviousBalance.toLocaleString()}</td>
                        </tr>
                        {displayLedger.map((entry, idx) => (
                            <tr key={idx} style={{ background: idx % 2 === 1 ? '#f8fafc' : 'white' }}>
                                <td style={{ padding: '8px', border: '1px solid #e2e8f0' }}>{this.formatDateShort(entry.date)}</td>
                                <td style={{ padding: '8px', border: '1px solid #e2e8f0', fontFamily: 'monospace' }}>
                                    {entry.type === 'invoice' ? entry.invoiceNumber : (entry.notes || 'Payment')}
                                </td>
                                <td style={{ padding: '8px', border: '1px solid #e2e8f0', textAlign: 'right' }}>{entry.debit ? entry.debit.toLocaleString() : '-'}</td>
                                <td style={{ padding: '8px', border: '1px solid #e2e8f0', textAlign: 'right' }}>{entry.credit ? entry.credit.toLocaleString() : '-'}</td>
                                <td style={{ padding: '8px', border: '1px solid #e2e8f0', textAlign: 'right', fontWeight: '700' }}>{entry.runningBalance.toLocaleString()}</td>
                            </tr>
                        ))}
                        <tr style={{ background: '#f1f5f9', fontWeight: 'bold' }}>
                            <td colSpan="2" style={{ padding: '8px', border: '1px solid #e2e8f0', textAlign: 'right' }}>Totals</td>
                            <td style={{ padding: '8px', border: '1px solid #e2e8f0', textAlign: 'right' }}>{periodDebit.toLocaleString()}</td>
                            <td style={{ padding: '8px', border: '1px solid #e2e8f0', textAlign: 'right' }}>{periodCredit.toLocaleString()}</td>
                            <td style={{ padding: '8px', border: '1px solid #e2e8f0', textAlign: 'right' }}>{totalDue.toLocaleString()}</td>
                        </tr>
                    </tbody>
                </table>
                <div style={{ textAlignment: 'center', marginTop: '20px', fontSize: '11px', color: '#475569', fontStyle: 'italic', border: '1px dashed #cbd5e1', padding: '8px', borderRadius: '4px', textAlign: 'center' }}>
                    To check the invoice go to : <strong>http://alphaaccessoriesbd.com/dashboard/invoice/view</strong> and input the invoice number
                </div>
            </div>
        );
    };

    render() {
        const { isOpen, onRequestClose } = this.props;
        const { customer, ledger, currentBalance, isLoading, error, isPrintModalOpen, printConfig, isShareModalOpen, sharableImage, isGeneratingImage } = this.state;

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

        const btnStyle = {
            padding: '8px 16px',
            borderRadius: '6px',
            border: 'none',
            fontSize: '13px',
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'all 0.2s',
            marginRight: '8px'
        };

        return (
            <>
                <Modal
                    isOpen={isOpen}
                    onRequestClose={onRequestClose}
                    style={customStyles}
                    contentLabel="Customer Ledger"
                    ariaHideApp={false}
                >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                            <h2 style={{ margin: 0, color: '#1e293b', fontSize: '20px' }}>
                                Customer Ledger
                            </h2>
                            <button
                                onClick={this.handlePrintClick}
                                style={{
                                    ...btnStyle,
                                    background: '#e0f2fe',
                                    color: '#0284c7',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px'
                                }}
                            >
                                <span role="img" aria-label="print">🖨️</span> Print Ledger
                            </button>
                        </div>
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
                            {customer && (
                                <div style={{
                                    background: '#f8fafc',
                                    border: '1px solid #e2e8f0',
                                    padding: '16px 20px',
                                    borderRadius: '12px',
                                    marginBottom: '20px',
                                    color: '#1e293b',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                }}>
                                    <div>
                                        <div style={{ fontWeight: 600, fontSize: '18px' }}>{customer.name}</div>
                                        <div style={{ opacity: 0.9, fontSize: '14px', color: '#64748b' }}>{customer.phoneNumber}</div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontSize: '12px', color: '#64748b' }}>Current Balance</div>
                                        <div style={{
                                            fontSize: '24px',
                                            fontWeight: 700,
                                            color: currentBalance > 0 ? '#ef4444' : '#16a34a'
                                        }}>
                                            ৳{currentBalance}
                                        </div>
                                    </div>
                                </div>
                            )}

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
                                                    {entry.debit !== 0 ? `৳${entry.debit.toLocaleString()}` : '-'}
                                                </td>
                                                <td style={{ ...tdStyle, textAlign: 'right', color: '#16a34a' }}>
                                                    {entry.credit !== 0 ? `৳${entry.credit.toLocaleString()}` : '-'}
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
                                    </tbody>
                                </table>
                            )}
                        </>
                    )}
                </Modal>

                <Modal
                    isOpen={isPrintModalOpen}
                    onRequestClose={() => this.setState({ isPrintModalOpen: false })}
                    style={printOptionsStyles}
                    contentLabel="Print Options"
                    ariaHideApp={false}
                >
                    <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', color: '#1e293b' }}>
                        Print Ledger Options
                    </h3>

                    <div style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: '#475569', fontSize: '13px' }}>
                            Time Period
                        </label>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            {['all', '1month', '3months'].map(type => (
                                <button
                                    key={type}
                                    onClick={() => this.handlePrintConfigChange('rangeType', type)}
                                    style={{
                                        ...btnStyle,
                                        background: printConfig.rangeType === type ? '#dbeafe' : '#f1f5f9',
                                        color: printConfig.rangeType === type ? '#1d4ed8' : '#475569',
                                    }}
                                >
                                    {type === 'all' ? 'All Time' : type === '1month' ? 'Last 1 Month' : 'Last 3 Months'}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div style={{ marginBottom: '30px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: '#475569', fontSize: '13px' }}>
                            Transaction Limit
                        </label>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            {['all', '10', '20', '50'].map(type => (
                                <button
                                    key={type}
                                    onClick={() => this.handlePrintConfigChange('limitType', type)}
                                    style={{
                                        ...btnStyle,
                                        background: printConfig.limitType === type ? '#dbeafe' : '#f1f5f9',
                                        color: printConfig.limitType === type ? '#1d4ed8' : '#475569',
                                    }}
                                >
                                    {type === 'all' ? 'All' : `Last ${type}`}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', paddingTop: '10px', borderTop: '1px solid #f1f5f9' }}>
                        <button
                            onClick={() => this.setState({ isPrintModalOpen: false })}
                            style={{
                                ...btnStyle,
                                background: '#f1f5f9',
                                color: '#475569'
                            }}
                        >
                            Cancel
                        </button>
                        <button
                            onClick={this.handleSharePreview}
                            style={{
                                ...btnStyle,
                                background: '#f3e8ff',
                                color: '#8b5cf6'
                            }}
                        >
                            Share / Preview
                        </button>
                        <button
                            onClick={this.handleConfirmPrint}
                            style={{
                                ...btnStyle,
                                background: '#dcfce7',
                                color: '#16a34a'
                            }}
                        >
                            Confirm & Print
                        </button>
                    </div>
                </Modal>

                <Modal
                    isOpen={isShareModalOpen}
                    onRequestClose={() => this.setState({ isShareModalOpen: false })}
                    style={{
                        content: {
                            top: '50%',
                            left: '50%',
                            right: 'auto',
                            bottom: 'auto',
                            marginRight: '-50%',
                            transform: 'translate(-50%, -50%)',
                            width: '90%',
                            maxWidth: '700px',
                            maxHeight: '90vh',
                            padding: '0',
                            borderRadius: '16px',
                            border: 'none',
                            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                            display: 'flex',
                            flexDirection: 'column'
                        },
                        overlay: {
                            backgroundColor: 'rgba(0, 0, 0, 0.8)',
                            zIndex: 1100
                        }
                    }}
                    contentLabel="Share Ledger"
                    ariaHideApp={false}
                >
                    <div style={{ padding: '16px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3 style={{ margin: 0, fontSize: '18px', color: '#1e293b' }}>Share Ledger</h3>
                        <button
                            onClick={() => this.setState({ isShareModalOpen: false })}
                            style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#94a3b8' }}
                        >
                            ×
                        </button>
                    </div>

                    <div style={{ padding: '24px', flex: 1, overflow: 'auto', background: '#f8fafc', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}>
                        {isGeneratingImage ? (
                            <div style={{ textAlign: 'center', color: '#64748b' }}>
                                <p>Generating image preview...</p>
                            </div>
                        ) : sharableImage ? (
                            <img src={sharableImage} alt="Ledger Preview" style={{ maxWidth: '100%', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} />
                        ) : (
                            <div style={{ textAlign: 'center', color: '#ef4444' }}>Failed to generate image.</div>
                        )}
                    </div>

                    <div style={{ padding: '20px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'center', gap: '12px', background: 'white' }}>
                        <button
                            onClick={this.handleDownloadImage}
                            disabled={!sharableImage}
                            style={{
                                ...btnStyle,
                                background: '#f1f5f9',
                                color: '#475569',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                            }}
                        >
                            <span>⬇️</span> Download
                        </button>
                        <button
                            onClick={this.handleCopyImage}
                            disabled={!sharableImage}
                            style={{
                                ...btnStyle,
                                background: '#e0f2fe',
                                color: '#0284c7',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                            }}
                        >
                            <span>📋</span> Copy
                        </button>
                        <button
                            onClick={this.handleWhatsAppShare}
                            style={{
                                ...btnStyle,
                                background: '#dcfce7',
                                color: '#16a34a',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                            }}
                        >
                            <span>💬</span> WhatsApp
                        </button>
                    </div>
                </Modal>

                <div style={{ position: 'fixed', top: 0, left: 0, zIndex: -100, opacity: 0, pointerEvents: 'none' }}>
                    {this.renderCaptureNode()}
                </div>
            </>
        );
    }
}

export default CustomerLedgerModal;
