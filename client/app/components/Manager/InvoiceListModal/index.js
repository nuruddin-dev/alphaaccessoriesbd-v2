import React, { useState, useEffect } from 'react';
import Modal from 'react-modal';
import axios from 'axios';
import { API_URL } from '../../../constants';

const InvoiceListModal = ({ isOpen, onRequestClose, onSelectInvoice }) => {
    // Helper to get local date string YYYY-MM-DD
    const getLocalDateString = () => {
        const now = new Date();
        const offset = now.getTimezoneOffset() * 60000;
        const localDate = new Date(now.getTime() - offset);
        return localDate.toISOString().split('T')[0];
    };

    const [invoices, setInvoices] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedDate, setSelectedDate] = useState(getLocalDateString());

    useEffect(() => {
        if (isOpen) {
            fetchInvoices();
        }
    }, [isOpen, selectedDate]);

    const fetchInvoices = async () => {
        setIsLoading(true);
        try {
            const response = await axios.get(`${API_URL}/invoice`, {
                params: {
                    startDate: selectedDate,
                    endDate: selectedDate
                }
            });
            setInvoices(response.data.invoices);
        } catch (error) {
            console.error('Error fetching invoices:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDateChange = (e) => {
        setSelectedDate(e.target.value);
    };

    // Helper to format date as DD-MM-YYYY
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}-${month}-${year}`;
    };

    const modalStyle = {
        content: {
            top: '50%',
            left: '50%',
            right: 'auto',
            bottom: 'auto',
            marginRight: '-50%',
            transform: 'translate(-50%, -50%)',
            width: '80%',
            maxWidth: '800px',
            maxHeight: '80vh',
            padding: '20px',
            boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
            borderRadius: '8px'
        },
        overlay: {
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 1000
        }
    };

    const tableStyle = {
        width: '100%',
        borderCollapse: 'collapse',
        marginTop: '20px'
    };

    const thStyle = {
        borderBottom: '2px solid #ddd',
        padding: '10px',
        textAlign: 'left',
        backgroundColor: '#f8f9fa'
    };

    const tdStyle = {
        borderBottom: '1px solid #ddd',
        padding: '10px',
        textAlign: 'left'
    };

    const linkStyle = {
        color: '#007bff',
        cursor: 'pointer',
        textDecoration: 'underline'
    };

    return (
        <Modal
            isOpen={isOpen}
            onRequestClose={onRequestClose}
            style={modalStyle}
            contentLabel="Invoice List"
            ariaHideApp={false}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ margin: 0 }}>Invoice List</h2>
                <button onClick={onRequestClose} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer' }}>&times;</button>
            </div>

            <div style={{ marginBottom: '20px' }}>
                <label style={{ marginRight: '10px', fontWeight: 'bold' }}>Select Date:</label>
                <input
                    type="date"
                    value={selectedDate}
                    onChange={handleDateChange}
                    style={{ padding: '5px', borderRadius: '4px', border: '1px solid #ccc' }}
                />
            </div>

            {isLoading ? (
                <p>Loading invoices...</p>
            ) : (
                <div style={{ maxHeight: '60vh', overflowY: 'auto' }}>
                    {invoices.length > 0 ? (
                        <table style={tableStyle}>
                            <thead>
                                <tr>
                                    <th style={thStyle}>Invoice #</th>
                                    <th style={thStyle}>Customer</th>
                                    <th style={thStyle}>Total</th>
                                    <th style={thStyle}>Due</th>
                                    <th style={thStyle}>Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {invoices.map((invoice) => (
                                    <tr key={invoice._id}>
                                        <td style={tdStyle}>
                                            <span
                                                style={linkStyle}
                                                onClick={() => onSelectInvoice(invoice.invoiceNumber)}
                                            >
                                                {invoice.invoiceNumber}
                                            </span>
                                        </td>
                                        <td style={tdStyle}>{invoice.customer ? invoice.customer.name : (invoice.customerName || '')}</td>
                                        <td style={tdStyle}>{invoice.grandTotal}</td>
                                        <td style={{ ...tdStyle, color: invoice.due > 0 ? 'red' : 'green' }}>{invoice.due > 0 ? invoice.due : ''}</td>
                                        <td style={tdStyle}>{formatDate(invoice.created)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <p>No invoices found for this date.</p>
                    )}
                </div>
            )}
        </Modal>
    );
};

export default InvoiceListModal;
