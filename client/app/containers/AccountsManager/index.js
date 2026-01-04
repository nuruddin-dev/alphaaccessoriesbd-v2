import React from 'react';
import axios from 'axios';
import { Row, Col, Card, CardBody, Button, Table, Modal, ModalHeader, ModalBody, ModalFooter, Input, Label, FormGroup } from 'reactstrap';
import { API_URL } from '../../constants';
// import LoadingIndicator from '../../components/Common/LoadingIndicator';

class AccountsManager extends React.PureComponent {
    state = {
        accounts: [],
        transactions: [],
        isLoading: false,
        isAddAccountModalOpen: false,
        isAddTransactionModalOpen: false,
        isViewAllModalOpen: false,
        selectedAccount: null,
        isAccountDetailsModalOpen: false,
        activityDate: (() => {
            const d = new Date();
            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        })(),


        // Add Account Form
        newAccount: {
            name: '',
            type: 'bank',
            details: '',
            openingBalance: 0
        },

        // Add Transaction Form
        newTransaction: {
            account: '',
            amount: '',
            type: 'credit', // 'credit' (add) or 'debit' (withdraw)
            description: '',
            category: '',
            toAccount: '',
            transferFee: ''
        },
        spendingCategories: ['Snacks', 'Printer Color', 'Paper', 'Others']
    };

    handleRefresh = () => {
        this.setState({ isLoading: true });
        Promise.all([
            this.fetchAccounts(),
            this.fetchTransactions(),
            this.fetchExpenseCategories()
        ]).finally(() => {
            this.setState({ isLoading: false });
        });
    }

    componentDidMount() {
        this.fetchAccounts();
        this.fetchTransactions();
        this.fetchExpenseCategories();
    }

    fetchExpenseCategories = async () => {
        try {
            const response = await axios.get(`${API_URL}/account/expense-category`);
            if (response.data.categories && response.data.categories.length > 0) {
                const names = response.data.categories.map(c => c.name);
                this.setState({ spendingCategories: names });
                localStorage.setItem('spendingCategories', JSON.stringify(names));
            } else {
                // If database is empty, seed it with defaults from local storage or static list
                const savedCategories = localStorage.getItem('spendingCategories');
                const defaultList = savedCategories ? JSON.parse(savedCategories) : ['Snacks', 'Printer Color', 'Paper', 'Others'];
                this.setState({ spendingCategories: defaultList });
            }
        } catch (error) {
            console.error('Error fetching categories:', error);
            const savedCategories = localStorage.getItem('spendingCategories');
            if (savedCategories) {
                this.setState({ spendingCategories: JSON.parse(savedCategories) });
            }
        }
    };

    fetchAccounts = async () => {
        try {
            const response = await axios.get(`${API_URL}/account`);
            this.setState({ accounts: response.data.accounts });
            // Set default account for transaction
            if (response.data.accounts.length > 0 && !this.state.newTransaction.account) {
                this.setState(prevState => ({
                    newTransaction: { ...prevState.newTransaction, account: response.data.accounts[0]._id }
                }));
            }
        } catch (error) {
            console.error('Error fetching accounts:', error);
        }
    };

    fetchTransactions = async () => {
        try {
            const response = await axios.get(`${API_URL}/account/transactions`);
            this.setState({ transactions: response.data.transactions });
        } catch (error) {
            console.error('Error fetching transactions:', error);
        }
    };

    toggleAddAccountModal = () => {
        this.setState(prevState => ({ isAddAccountModalOpen: !prevState.isAddAccountModalOpen }));
    };

    toggleAddTransactionModal = () => {
        this.setState(prevState => ({ isAddTransactionModalOpen: !prevState.isAddTransactionModalOpen }));
    };

    toggleViewAllModal = () => {
        const d = new Date();
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const todayCommon = `${year}-${month}-${day}`;

        this.setState(prevState => ({
            isViewAllModalOpen: !prevState.isViewAllModalOpen,
            activityDate: todayCommon // Reset to today
        }));
    };

    openAccountDetails = (account) => {
        const d = new Date();
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const todayCommon = `${year}-${month}-${day}`;

        this.setState({
            selectedAccount: account,
            isAccountDetailsModalOpen: true,
            activityDate: todayCommon // Reset to today
        });
    };

    closeAccountDetails = () => {
        this.setState({ selectedAccount: null, isAccountDetailsModalOpen: false });
    };

    handleDateChange = (e) => {
        this.setState({ activityDate: e.target.value });
    };

    handleAddAccountChange = (e) => {
        const { name, value } = e.target;
        this.setState(prevState => ({
            newAccount: { ...prevState.newAccount, [name]: value }
        }));
    };

    handleAddTransactionChange = (e) => {
        const { name, value } = e.target;
        this.setState(prevState => ({
            newTransaction: { ...prevState.newTransaction, [name]: value }
        }));
    };

    handleAddCategory = async () => {
        const newCategory = window.prompt("Enter new category name:");
        if (newCategory) {
            try {
                const response = await axios.post(`${API_URL}/account/expense-category/add`, { name: newCategory });
                if (response.data.success) {
                    this.setState(prevState => {
                        const updatedCategories = [...prevState.spendingCategories, newCategory];
                        localStorage.setItem('spendingCategories', JSON.stringify(updatedCategories));
                        return {
                            spendingCategories: updatedCategories,
                            newTransaction: { ...prevState.newTransaction, category: newCategory } // Auto select
                        };
                    });
                }
            } catch (error) {
                alert('Error adding category: ' + (error.response?.data?.error || error.message));
            }
        }
    };

    submitAddAccount = async () => {
        try {
            await axios.post(`${API_URL}/account/add`, this.state.newAccount);
            this.fetchAccounts();
            this.toggleAddAccountModal();
            this.setState({ newAccount: { name: '', type: 'bank', details: '', openingBalance: 0 } });
        } catch (error) {
            //   alert('Error adding account: ' + (error.response?.data?.error || error.message));
            console.error(error);
        }
    };

    submitAddTransaction = async () => {
        try {
            const { account, amount, description, type, category } = this.state.newTransaction;
            if (!account || !amount) {
                alert("Please select an account and enter an amount");
                return;
            }
            if (type === 'transfer' && !this.state.newTransaction.toAccount) {
                alert("Please select a destination account for transfer");
                return;
            }
            if (type === 'transfer' && account === this.state.newTransaction.toAccount) {
                alert("Source and destination accounts cannot be the same");
                return;
            }
            await axios.post(`${API_URL}/account/transaction/add`, {
                account,
                amount,
                description,
                type,
                category,
                toAccount: this.state.newTransaction.toAccount,
                transferFee: this.state.newTransaction.transferFee
            });
            this.fetchAccounts();
            this.fetchTransactions();
            this.toggleAddTransactionModal();
            this.setState(prevState => ({
                newTransaction: { ...prevState.newTransaction, amount: '', description: '', category: '', toAccount: '', transferFee: '' }
            }));
        } catch (error) {
            alert('Error adding transaction: ' + (error.response?.data?.error || error.message));
            console.error(error);
        }
    };

    submitUndoTransaction = async (id) => {
        if (window.confirm("Are you sure you want to REVERT this transaction? This will update your account balance and cannot be undone.")) {
            try {
                const response = await axios.put(`${API_URL}/account/transaction/undo/${id}`);
                if (response.data.success) {
                    this.fetchAccounts();
                    this.fetchTransactions();
                    if (this.state.selectedAccount) {
                        // Refresh selected account data if open
                        const updatedAcc = this.state.accounts.find(a => a._id === this.state.selectedAccount._id);
                        if (updatedAcc) this.setState({ selectedAccount: updatedAcc });
                    }
                }
            } catch (error) {
                alert('Error undoing transaction: ' + (error.response?.data?.error || error.message));
                console.error(error);
            }
        }
    };

    render() {
        const { accounts, transactions, isAddAccountModalOpen, isAddTransactionModalOpen, isViewAllModalOpen, isAccountDetailsModalOpen, selectedAccount, newAccount, newTransaction, activityDate } = this.state;
        const totalBalance = accounts.reduce((sum, acc) => sum + (acc.balance || 0), 0);

        // Helper to formatting local date to YYYY-MM-DD for comparison
        const formatDate = (dateString) => {
            const d = new Date(dateString);
            // We need to compare simple dates. 
            // Ideally we convert both to comparable strings in same timezone or just use toDateString() if we trust local.
            // Given the activityDate is YYYY-MM-DD from input type='date', let's format transaction date to that.
            // Note: input type='date' value is usually YYYY-MM-DD. 
            // To ensure we match 'Today' correctly in local time:
            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        };

        const todayDateString = new Date().toDateString(); // For homepage cards, always show 'Today' relative to real time

        // 1. Homepage Cards Stats (Always "Today" actual)
        const accountStats = {};
        accounts.forEach(acc => {
            accountStats[acc._id] = { todayInput: 0, todayOutput: 0 };
        });

        transactions.forEach(trans => {
            if (trans.isUndone) return; // Ignore undone transactions in stats
            const transDate = new Date(trans.date).toDateString();
            if (transDate === todayDateString) {
                if (trans.account && accountStats[trans.account._id]) {
                    if (trans.type === 'credit') {
                        accountStats[trans.account._id].todayInput += trans.amount;
                    } else if (trans.type === 'debit') {
                        accountStats[trans.account._id].todayOutput += trans.amount;
                    }
                }
            }
        });

        // 2. Modals Data (Based on activityDate selection)
        const dailyTransactions = transactions.filter(t => formatDate(t.date) === activityDate);

        // Summaries for Modals
        const dailyInputByAccount = {};
        const dailyExpenseByCategory = {};
        let dailyTotalInput = 0;
        let dailyTotalExpense = 0;

        dailyTransactions.forEach(trans => {
            if (trans.isUndone) return; // Ignore undone in summary totals
            if (trans.type === 'credit') {
                if (trans.account) {
                    if (!dailyInputByAccount[trans.account.name]) dailyInputByAccount[trans.account.name] = 0;
                    dailyInputByAccount[trans.account.name] += trans.amount;
                }
                dailyTotalInput += trans.amount;
            } else if (trans.type === 'debit') {
                const cat = trans.category || 'Uncategorized';
                if (!dailyExpenseByCategory[cat]) dailyExpenseByCategory[cat] = 0;
                dailyExpenseByCategory[cat] += trans.amount;
                dailyTotalExpense += trans.amount;
            }
        });


        const recentTransactions = transactions.slice(0, 5);

        // 3. Dynamic Balance Calculation Logic
        const isToday = activityDate === formatDate(new Date());

        const calculateHistBalance = (baseBalance, accId = null) => {
            if (isToday) return baseBalance;

            let histBalance = baseBalance;
            transactions.forEach(t => {
                if (t.isUndone) return;
                const tDateString = formatDate(t.date);

                // If transaction happened AFTER the selected date, we reverse it
                if (tDateString > activityDate) {
                    if (accId) {
                        // Logic for a specific account
                        if (t.account && t.account._id === accId) {
                            if (t.type === 'credit') histBalance -= t.amount;
                            else if (t.type === 'debit') histBalance += t.amount;
                            else if (t.type === 'transfer') histBalance += (t.amount + (t.transferFee || 0));
                        } else if (t.toAccount && (t.toAccount._id === accId || t.toAccount === accId)) {
                            if (t.type === 'transfer') histBalance -= t.amount;
                        }
                    } else {
                        // Logic for total balance (sum of all accounts)
                        if (t.type === 'credit') histBalance -= t.amount;
                        else if (t.type === 'debit') histBalance += t.amount;
                        else if (t.type === 'transfer') histBalance += (t.transferFee || 0); // Only fee left the total system
                    }
                }
            });
            return histBalance;
        };

        const displayTotalBalance = calculateHistBalance(totalBalance);

        return (
            <div className="accounts-manager">
                <style>{`
                    .undo-hover-container:hover .main-icon {
                        display: none !important;
                    }
                    .undo-hover-container:hover .undo-icon {
                        display: flex !important;
                    }
                    .list-group-item:hover {
                        background-color: #f8f9fa !important;
                    }

                    /* Desktop Width: 70% */
                    @media (min-width: 768px) {
                        .custom-modal-width {
                            width: 70vw !important;
                            max-width: 70vw !important;
                            margin: 1.75rem auto !important;
                        }
                        .small-modal-width {
                            width: 70vw !important;
                            max-width: 70vw !important;
                            margin: 1.75rem auto !important;
                        }
                    }

                    /* Mobile: Full screen modals & Table adjustments */
                    @media (max-width: 767px) {
                        .modal-dialog {
                            margin: 0 !important;
                            width: 100vw !important;
                            max-width: 100vw !important;
                            height: 100vh !important;
                        }
                        .modal-content {
                            width: 100vw !important;
                            max-width: 100vw !important;
                            height: 100vh !important;
                            border-radius: 0 !important;
                        }
                        
                        /* Fix description hiding on mobile table */
                        .description-cell {
                            white-space: normal !important;
                            overflow: visible !important;
                            text-overflow: clip !important;
                            word-break: break-word !important;
                            min-width: 150px;
                        }
                        
                        /* Handle table scrolling better on mobile if needed */
                        .table-responsive {
                            overflow-x: auto !important;
                        }
                        table {
                            table-layout: auto !important; /* Allow table to adjust on mobile */
                        }
                    }
                `}</style>
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <h3>Financial Dashboard</h3>
                    <div>
                        <Button color="primary" className="mr-2" onClick={this.toggleAddAccountModal}>Add Account</Button>
                        <Button color="success" className="mr-2" onClick={this.toggleAddTransactionModal}>Add Transaction</Button>
                        <Button
                            color="info"
                            outline
                            onClick={this.handleRefresh}
                            disabled={this.state.isLoading}
                        >
                            <i className={`fa fa-refresh ${this.state.isLoading ? 'fa-spin' : ''}`}></i>
                        </Button>
                    </div>
                </div>

                {/* Summary Cards */}
                <Row className="mb-4">
                    <Col md="12">
                        <Card className="mb-3 border-0 shadow overflow-hidden"
                            style={{
                                background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
                                borderRadius: '16px',
                                cursor: 'pointer',
                                position: 'relative'
                            }}
                            onClick={this.toggleViewAllModal}
                        >
                            {/* Decorative Neon Glows */}
                            <div style={{
                                position: 'absolute',
                                top: '-30px',
                                right: '-30px',
                                width: '120px',
                                height: '120px',
                                background: 'rgba(6, 182, 212, 0.15)',
                                filter: 'blur(50px)',
                                borderRadius: '50%'
                            }}></div>
                            <div style={{
                                position: 'absolute',
                                bottom: '-20px',
                                left: '-20px',
                                width: '100px',
                                height: '100px',
                                background: 'rgba(99, 102, 241, 0.1)',
                                filter: 'blur(40px)',
                                borderRadius: '50%'
                            }}></div>

                            <CardBody className="text-center p-5">
                                <h6 className="text-uppercase mb-2" style={{
                                    letterSpacing: '2.5px',
                                    fontWeight: '800',
                                    color: '#64748b',
                                    fontSize: '11px',
                                    textShadow: '0 0 10px rgba(255, 255, 255, 0.8)'
                                }}>Total Balance</h6>
                                <h1 className="mb-1 font-weight-bold" style={{
                                    color: '#1e293b',
                                    fontSize: '3.5rem',
                                    letterSpacing: '-1px',
                                    textShadow: '0 4px 12px rgba(6, 182, 212, 0.15)'
                                }}>
                                    <span style={{ fontSize: '1.5rem', color: '#0891b2', verticalAlign: 'middle', marginRight: '8px', fontWeight: '500' }}>৳</span>
                                    {totalBalance.toLocaleString()}
                                </h1>
                                <div className="mt-2">
                                    <small className="text-muted" style={{ fontSize: '11px', fontWeight: '600' }}>
                                        <i className="fa fa-hand-pointer-o mr-1"></i> Click to view all activity
                                    </small>
                                </div>
                            </CardBody>
                        </Card>
                    </Col>
                </Row>

                <Row className="mb-4">
                    {accounts.map((acc, index) => {
                        const stats = accountStats[acc._id] || { todayInput: 0, todayOutput: 0 };
                        // Different light colors for each card
                        const cardColors = [
                            { bg: '#e3f2fd', border: '#90caf9', icon: '#1976d2' }, // blue
                            { bg: '#fce4ec', border: '#f48fb1', icon: '#c2185b' }, // pink
                            { bg: '#e8f5e9', border: '#a5d6a7', icon: '#388e3c' }, // green
                            { bg: '#fff3e0', border: '#ffcc80', icon: '#f57c00' }, // orange
                            { bg: '#f3e5f5', border: '#ce93d8', icon: '#7b1fa2' }, // purple
                            { bg: '#e0f7fa', border: '#80deea', icon: '#00838f' }, // cyan
                        ];
                        const colorScheme = cardColors[index % cardColors.length];

                        return (
                            <Col md="4" key={acc._id} className="mb-4">
                                <Card
                                    className="border-0 shadow-sm h-100 hover-card"
                                    style={{
                                        borderRadius: '12px',
                                        transition: 'all 0.3s ease',
                                        cursor: 'pointer',
                                        background: colorScheme.bg,
                                        border: `1px solid ${colorScheme.border}`
                                    }}
                                    onClick={() => this.openAccountDetails(acc)}
                                >
                                    <CardBody className="p-4">
                                        <div className="d-flex justify-content-between align-items-start mb-3">
                                            <div>
                                                <h6 className="text-uppercase small mb-1" style={{ color: colorScheme.icon, fontWeight: '600', fontSize: '10px' }}>{acc.type}</h6>
                                                <h5 className="font-weight-bold mb-0" style={{ color: '#2d3436' }}>{acc.name}</h5>
                                            </div>
                                            <div
                                                style={{
                                                    width: '40px',
                                                    height: '40px',
                                                    borderRadius: '10px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    backgroundColor: 'rgba(255,255,255,0.7)',
                                                    color: colorScheme.icon
                                                }}>
                                                {acc.type === 'bank' && <i className="fa fa-credit-card"></i>}
                                                {acc.type === 'mobile' && <i className="fa fa-mobile-phone" style={{ fontSize: '1.2rem' }}></i>}
                                                {acc.type === 'cash' && <i className="fa fa-money"></i>}
                                                {acc.type === 'other' && <i className="fa fa-credit-card"></i>}
                                            </div>
                                        </div>

                                        <div className="mb-3">
                                            <span className="small" style={{ color: '#636e72' }}>Current Balance</span>
                                            <h4 className="mb-0 font-weight-bold" style={{ color: '#2d3436' }}>{acc.balance.toLocaleString()}</h4>
                                        </div>

                                        <div className="d-flex justify-content-between align-items-center pt-3" style={{ borderTop: `1px solid ${colorScheme.border}` }}>
                                            <div className="w-50 pr-2" style={{ borderRight: `1px solid ${colorScheme.border}` }}>
                                                <div className="text-success small font-weight-bold mb-1" style={{ fontSize: '10px' }}>
                                                    <i className="fa fa-arrow-down mr-1"></i> Today's In
                                                </div>
                                                <span className="text-success font-weight-bold d-block" style={{ fontSize: '13px' }}>+ {stats.todayInput.toLocaleString()}</span>
                                            </div>
                                            <div className="w-50 pl-3">
                                                <div className="text-danger small font-weight-bold mb-1" style={{ fontSize: '10px' }}>
                                                    <i className="fa fa-arrow-up mr-1"></i> Today's Out
                                                </div>
                                                <span className="text-danger font-weight-bold d-block" style={{ fontSize: '13px' }}>- {stats.todayOutput.toLocaleString()}</span>
                                            </div>
                                        </div>
                                        {acc.details && <p className="small mt-2 mb-0" style={{ fontSize: '10px', color: '#636e72' }}>{acc.details}</p>}
                                    </CardBody>
                                </Card>
                            </Col>
                        );
                    })}
                </Row>

                {/* Transactions Table */}
                <Card className="border-0 shadow-sm" style={{ borderRadius: '12px' }}>
                    <CardBody className="p-4">
                        <div className="d-flex justify-content-between align-items-center mb-4">
                            <h5 className="font-weight-bold mb-0">Recent Activity (Last 5)</h5>
                            <Button color="link" className="p-0 text-muted small" onClick={this.toggleViewAllModal}>View All</Button>
                        </div>
                        <Table responsive hover className="align-middle">
                            <thead className="bg-light">
                                <tr>
                                    <th className="border-0 font-weight-bold text-muted small text-uppercase">Date</th>
                                    <th className="border-0 font-weight-bold text-muted small text-uppercase">Account</th>
                                    <th className="border-0 font-weight-bold text-muted small text-uppercase">Category</th>
                                    <th className="border-0 font-weight-bold text-muted small text-uppercase">Description</th>
                                    <th className="border-0 font-weight-bold text-muted small text-uppercase text-center">Type</th>
                                    <th className="border-0 font-weight-bold text-muted small text-uppercase text-right">Amount</th>
                                    <th className="border-0 font-weight-bold text-muted small text-uppercase text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentTransactions.map(trans => (
                                    <tr key={trans._id} style={trans.isUndone ? { opacity: 0.5, textDecoration: 'line-through' } : {}}>
                                        <td className="text-muted small">{new Date(trans.date).toLocaleDateString()} <span style={{ fontSize: '10px' }}>{new Date(trans.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span></td>
                                        <td>
                                            <span className="font-weight-bold text-dark">{trans.account ? trans.account.name : 'Unknown'}</span>
                                        </td>
                                        <td>
                                            {trans.category ? <span className="badge badge-light border text-muted">{trans.category}</span> : '-'}
                                        </td>
                                        <td>
                                            <div className="text-truncate">
                                                {trans.reference ? <strong className="mr-1 text-dark">{trans.reference}:</strong> : ''}
                                                <span className="text-muted">{trans.description}</span>
                                            </div>
                                        </td>
                                        <td className="text-center">
                                            {trans.isUndone ? (
                                                <span className="badge badge-secondary" style={{ padding: '5px 10px', borderRadius: '20px' }}>Undone</span>
                                            ) : (
                                                <span className={`badge ${trans.type === 'credit' ? 'badge-soft-success text-success' : 'badge-soft-danger text-danger'}`}
                                                    style={{ padding: '5px 10px', borderRadius: '20px', backgroundColor: trans.type === 'credit' ? '#dcfce7' : '#fee2e2' }}>
                                                    {trans.type === 'credit' ? 'Data In' : 'Expense'}
                                                </span>
                                            )}
                                        </td>
                                        <td className="text-right font-weight-bold">
                                            <span className={trans.isUndone ? 'text-muted' : (trans.type === 'debit' ? 'text-danger' : 'text-success')}>
                                                {trans.type === 'debit' ? '-' : '+'} {trans.amount.toLocaleString()}
                                            </span>
                                        </td>
                                        <td className="text-right" style={{ width: '30px' }}>
                                            {!trans.isUndone && (
                                                <span
                                                    className="text-danger"
                                                    style={{ cursor: 'pointer', fontSize: '12px' }}
                                                    title="Undo Transaction"
                                                    onClick={() => this.submitUndoTransaction(trans._id)}
                                                >
                                                    <i className="fa fa-undo"></i>
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                {transactions.length === 0 && (
                                    <tr><td colSpan="6" className="text-center py-4 text-muted">No transactions found</td></tr>
                                )}
                            </tbody>
                        </Table>
                    </CardBody>
                </Card>

                {/* Add Account Modal */}
                <Modal
                    isOpen={isAddAccountModalOpen}
                    toggle={this.toggleAddAccountModal}
                    centered
                    className="modal-dialog-scrollable small-modal-width"
                    style={{ height: '90vh', maxHeight: '90vh' }}
                    contentClassName="border-0 h-100 shadow"
                    backdrop={true}
                >
                    <div className="d-flex flex-column">
                        {/* Compact Header */}
                        <div className="d-flex justify-content-between align-items-center px-3 py-2 bg-light border-bottom" style={{ minHeight: '45px' }}>
                            <div className="d-flex align-items-center">
                                <span
                                    className="text-muted mr-3"
                                    style={{ cursor: 'pointer', fontSize: '18px' }}
                                    onClick={this.toggleAddAccountModal}
                                    title="Close"
                                >
                                    <i className="fa fa-times"></i>
                                </span>
                                <span className="font-weight-bold" style={{ fontSize: '14px' }}>Add New Account</span>
                            </div>
                            <Button color="primary" size="sm" onClick={this.submitAddAccount} className="px-3">
                                <i className="fa fa-check mr-1"></i> Save Account
                            </Button>
                        </div>

                        {/* Scrollable Body */}
                        <div className="flex-grow-1 overflow-auto p-4">
                            <FormGroup>
                                <Label style={{ fontSize: '12px' }}>Account Name</Label>
                                <Input name="name" value={newAccount.name} onChange={this.handleAddAccountChange} placeholder="e.g. IFIC Bank, Bkash (Personal)" />
                            </FormGroup>
                            <FormGroup>
                                <Label style={{ fontSize: '12px' }}>Type</Label>
                                <Input type="select" name="type" value={newAccount.type} onChange={this.handleAddAccountChange}>
                                    <option value="bank">Bank Account / Card</option>
                                    <option value="mobile">Mobile Banking (Bkash/Nagad)</option>
                                    <option value="cash">Cash</option>
                                    <option value="other">Other</option>
                                </Input>
                            </FormGroup>
                            <FormGroup>
                                <Label style={{ fontSize: '12px' }}>Details (Optional)</Label>
                                <Input name="details" value={newAccount.details} onChange={this.handleAddAccountChange} placeholder="Account Number, Branch, etc." />
                            </FormGroup>
                            <FormGroup>
                                <Label style={{ fontSize: '12px' }}>Opening Balance</Label>
                                <Input type="number" name="openingBalance" value={newAccount.openingBalance} onChange={this.handleAddAccountChange} />
                            </FormGroup>
                        </div>
                    </div>
                </Modal>

                {/* Add Transaction Modal */}
                <Modal
                    isOpen={isAddTransactionModalOpen}
                    toggle={this.toggleAddTransactionModal}
                    centered
                    className="modal-dialog-scrollable small-modal-width"
                    style={{ height: '90vh', maxHeight: '90vh' }}
                    contentClassName="border-0 h-100 shadow"
                    backdrop={true}
                >
                    <div className="d-flex flex-column">
                        {/* Compact Header */}
                        <div className="d-flex justify-content-between align-items-center px-3 py-2 bg-light border-bottom" style={{ minHeight: '45px' }}>
                            <div className="d-flex align-items-center">
                                <span
                                    className="text-muted mr-3"
                                    style={{ cursor: 'pointer', fontSize: '18px' }}
                                    onClick={this.toggleAddTransactionModal}
                                    title="Close"
                                >
                                    <i className="fa fa-times"></i>
                                </span>
                                <span className="font-weight-bold" style={{ fontSize: '14px' }}>Add Transaction</span>
                            </div>
                            <Button color="success" size="sm" onClick={this.submitAddTransaction} className="px-3">
                                <i className="fa fa-check mr-1"></i> {newTransaction.type === 'credit' ? 'Add Funds' : (newTransaction.type === 'transfer' ? 'Transfer' : 'Record')}
                            </Button>
                        </div>

                        {/* Scrollable Body */}
                        <div className="flex-grow-1 overflow-auto p-4">
                            <FormGroup>
                                <Label style={{ fontSize: '12px' }}>Transaction Type</Label>
                                <Input type="select" name="type" value={newTransaction.type} onChange={this.handleAddTransactionChange}>
                                    <option value="credit">Income / Add Funds</option>
                                    <option value="debit">Expense / Spending</option>
                                    <option value="transfer">Transfer</option>
                                </Input>
                            </FormGroup>

                            <FormGroup>
                                <Label style={{ fontSize: '12px' }}>{newTransaction.type === 'transfer' ? 'Transfer From' : 'Account'}</Label>
                                <Input type="select" name="account" value={newTransaction.account} onChange={this.handleAddTransactionChange}>
                                    <option value="">Select Account</option>
                                    {accounts.map(acc => (
                                        <option key={acc._id} value={acc._id}>{acc.name} ({acc.balance})</option>
                                    ))}
                                </Input>
                            </FormGroup>

                            {newTransaction.type === 'transfer' && (
                                <FormGroup>
                                    <Label style={{ fontSize: '12px' }}>Transfer To</Label>
                                    <Input type="select" name="toAccount" value={newTransaction.toAccount} onChange={this.handleAddTransactionChange}>
                                        <option value="">Select Account</option>
                                        {accounts.filter(a => a._id !== newTransaction.account).map(acc => (
                                            <option key={acc._id} value={acc._id}>{acc.name} ({acc.balance})</option>
                                        ))}
                                    </Input>
                                </FormGroup>
                            )}

                            <FormGroup>
                                <Label style={{ fontSize: '12px' }}>Amount</Label>
                                <Input type="number" name="amount" value={newTransaction.amount} onChange={this.handleAddTransactionChange} />
                            </FormGroup>

                            {newTransaction.type === 'transfer' && (() => {
                                const sourceAcc = accounts.find(a => a._id === newTransaction.account);
                                const destAcc = accounts.find(a => a._id === newTransaction.toAccount);

                                // Fee logic: Mobile to Bank OR Bank to Bank
                                const isFeeApplicable = sourceAcc && destAcc && (
                                    // Mobile to Bank
                                    ((sourceAcc.type === 'mobile' || sourceAcc.type === 'bkash' || sourceAcc.type === 'nagad' || sourceAcc.type === 'rocket') && destAcc.type === 'bank') ||
                                    // Bank to Bank
                                    (sourceAcc.type === 'bank' && destAcc.type === 'bank')
                                );

                                return isFeeApplicable ? (
                                    <FormGroup>
                                        <Label style={{ fontSize: '12px' }}>Transaction Fee</Label>
                                        <Input
                                            type="number"
                                            name="transferFee"
                                            value={newTransaction.transferFee}
                                            onChange={this.handleAddTransactionChange}
                                            placeholder="Fee Amount"
                                        />
                                        <small className="text-muted">
                                            Total Deducted from Source: {((Number(newTransaction.amount) || 0) + (Number(newTransaction.transferFee) || 0)).toLocaleString()}
                                            <br />
                                            Deposited to Destination: {(Number(newTransaction.amount) || 0).toLocaleString()}
                                        </small>
                                    </FormGroup>
                                ) : null;
                            })()}

                            {newTransaction.type === 'debit' && (
                                <FormGroup>
                                    <Label style={{ fontSize: '12px' }}>Category</Label>
                                    <div className="d-flex">
                                        <Input type="select" name="category" value={newTransaction.category} onChange={this.handleAddTransactionChange} className="mr-2">
                                            <option value="">Select Category</option>
                                            {this.state.spendingCategories.map((cat, i) => (
                                                <option key={i} value={cat}>{cat}</option>
                                            ))}
                                        </Input>
                                        <Button color="light" size="sm" onClick={this.handleAddCategory} title="Add New Category" className="border">
                                            <i className="fa fa-plus text-primary"></i>
                                        </Button>
                                    </div>
                                </FormGroup>
                            )}

                            <FormGroup>
                                <Label style={{ fontSize: '12px' }}>Description {newTransaction.category === 'Others' ? '(Required)' : '(Optional)'}</Label>
                                <Input
                                    name="description"
                                    value={newTransaction.description}
                                    onChange={this.handleAddTransactionChange}
                                    placeholder={newTransaction.category === 'Others' ? "Please specify..." : "Reason, Source, etc."}
                                />
                            </FormGroup>
                        </div>
                    </div>
                </Modal>

                {/* View All / Today's Summary Modal */}
                <Modal
                    isOpen={isViewAllModalOpen}
                    toggle={this.toggleViewAllModal}
                    className="modal-dialog-scrollable custom-modal-width"
                    style={{ height: '90vh', maxHeight: '90vh' }}
                    contentClassName="border-0 h-100 shadow"
                    centered
                    backdrop={true}
                >
                    <div className="d-flex flex-column h-100">
                        {/* Compact Header */}
                        <div className="d-flex justify-content-between align-items-center px-3 py-2 bg-light border-bottom" style={{ minHeight: '45px' }}>
                            <div className="d-flex align-items-center">
                                <span
                                    className="text-muted mr-3"
                                    style={{ cursor: 'pointer', fontSize: '18px' }}
                                    onClick={this.toggleViewAllModal}
                                    title="Close"
                                >
                                    <i className="fa fa-times"></i>
                                </span>
                                <span className="font-weight-bold" style={{ fontSize: '14px' }}>Activity History</span>
                            </div>
                            <Input
                                type="date"
                                value={activityDate}
                                onChange={this.handleDateChange}
                                style={{ width: '140px', fontSize: '12px', height: '30px', padding: '2px 8px' }}
                            />
                        </div>

                        <div className="flex-grow-1 overflow-auto p-0">
                            {/* Summary Banner - Aesthetic Neon Style */}
                            <div className="px-4 py-4 d-flex flex-column align-items-center justify-content-center text-center mb-3"
                                style={{
                                    background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
                                    borderBottom: '1px solid rgba(0, 0, 0, 0.05)',
                                    position: 'relative',
                                    overflow: 'hidden'
                                }}>
                                {/* Decorative Neon Glows */}
                                <div style={{
                                    position: 'absolute',
                                    top: '-30px',
                                    right: '-30px',
                                    width: '120px',
                                    height: '120px',
                                    background: 'rgba(6, 182, 212, 0.15)',
                                    filter: 'blur(50px)',
                                    borderRadius: '50%'
                                }}></div>
                                <div style={{
                                    position: 'absolute',
                                    bottom: '-20px',
                                    left: '-20px',
                                    width: '100px',
                                    height: '100px',
                                    background: 'rgba(99, 102, 241, 0.1)',
                                    filter: 'blur(40px)',
                                    borderRadius: '50%'
                                }}></div>

                                <span className="text-uppercase mb-2" style={{
                                    fontSize: '11px',
                                    fontWeight: '800',
                                    letterSpacing: '2.5px',
                                    color: '#64748b',
                                    textShadow: '0 0 10px rgba(255, 255, 255, 0.8)'
                                }}>{isToday ? 'Total Available Balance' : `Balance on ${new Date(activityDate).toLocaleDateString()}`}</span>

                                <div className="d-flex align-items-center justify-content-center">
                                    <h1 className="font-weight-bold mb-0" style={{
                                        fontSize: '2.8rem',
                                        color: '#1e293b',
                                        letterSpacing: '-1px',
                                        textShadow: '0 4px 12px rgba(6, 182, 212, 0.15)'
                                    }}>
                                        <span style={{ fontSize: '1.2rem', color: '#0891b2', verticalAlign: 'middle', marginRight: '8px', fontWeight: '500' }}>৳</span>
                                        {displayTotalBalance.toLocaleString()}
                                    </h1>
                                </div>
                            </div>

                            <div className="px-3">
                                {/* Summary Section */}
                                <div className="mb-3 p-3 bg-light rounded shadow-sm" style={{ fontSize: '12px' }}>
                                    <Row>
                                        <Col md="6">
                                            <div className="d-flex justify-content-between align-items-center mb-1">
                                                <span className="text-success font-weight-bold text-uppercase" style={{ fontSize: '10px' }}>Total Input</span>
                                                <span className="text-success font-weight-bold">{dailyTotalInput.toLocaleString()}</span>
                                            </div>
                                            {Object.keys(dailyInputByAccount).length > 0 ? (
                                                <div>
                                                    {Object.entries(dailyInputByAccount).map(([accName, amount]) => (
                                                        <div key={accName} className="d-flex justify-content-between text-muted" style={{ fontSize: '10px' }}>
                                                            <span>{accName}</span>
                                                            <span className="font-weight-bold">{amount.toLocaleString()}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : <span className="text-muted" style={{ fontSize: '10px' }}>No Input Recorded</span>}
                                        </Col>
                                        <Col md="6" className="border-left">
                                            <div className="d-flex justify-content-between align-items-center mb-1">
                                                <span className="text-danger font-weight-bold text-uppercase" style={{ fontSize: '10px' }}>Total Expense</span>
                                                <span className="text-danger font-weight-bold">{dailyTotalExpense.toLocaleString()}</span>
                                            </div>
                                            {Object.keys(dailyExpenseByCategory).length > 0 ? (
                                                <div>
                                                    {Object.entries(dailyExpenseByCategory).map(([cat, amount]) => (
                                                        <div key={cat} className="d-flex justify-content-between text-muted" style={{ fontSize: '10px' }}>
                                                            <span>{cat}</span>
                                                            <span className="font-weight-bold">{amount.toLocaleString()}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : <span className="text-muted" style={{ fontSize: '10px' }}>No Expenses Recorded</span>}
                                        </Col>
                                    </Row>
                                </div>

                                <h6 className="font-weight-bold mb-2" style={{ fontSize: '12px' }}>All Activities</h6>
                                <Table responsive hover size="sm" style={{ fontSize: '11px' }}>
                                    <thead className="thead-light">
                                        <tr>
                                            <th style={{ fontSize: '10px' }}>Time</th>
                                            <th style={{ fontSize: '10px' }}>Account</th>
                                            <th style={{ fontSize: '10px' }}>Category</th>
                                            <th style={{ fontSize: '10px' }}>Description</th>
                                            <th style={{ fontSize: '10px' }}>Type</th>
                                            <th className="text-right" style={{ fontSize: '10px' }}>Amount</th>
                                            <th style={{ fontSize: '10px' }}></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {dailyTransactions.map(trans => (
                                            <tr key={trans._id} style={trans.isUndone ? { opacity: 0.5, textDecoration: 'line-through' } : {}}>
                                                <td style={{ whiteSpace: 'nowrap' }}>{new Date(trans.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                                                <td>{trans.account ? trans.account.name : '-'}</td>
                                                <td>{trans.category || '-'}</td>
                                                <td className="description-cell">{trans.description}</td>
                                                <td>
                                                    {trans.isUndone ? (
                                                        <span className="badge badge-secondary" style={{ fontSize: '9px' }}>Undone</span>
                                                    ) : (
                                                        <span className={`badge ${trans.type === 'credit' ? 'badge-success' : 'badge-danger'}`} style={{ fontSize: '9px' }}>
                                                            {trans.type}
                                                        </span>
                                                    )}
                                                </td>
                                                <td className={`text-right font-weight-bold ${trans.isUndone ? 'text-muted' : (trans.type === 'credit' ? 'text-success' : 'text-danger')}`}>
                                                    {trans.type === 'debit' ? '-' : '+'} {trans.amount.toLocaleString()}
                                                </td>
                                                <td className="text-right">
                                                    {!trans.isUndone && (
                                                        <span
                                                            className="text-danger"
                                                            style={{ cursor: 'pointer', fontSize: '10px' }}
                                                            title="Undo Transaction"
                                                            onClick={() => this.submitUndoTransaction(trans._id)}
                                                        >
                                                            <i className="fa fa-undo"></i>
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                        {dailyTransactions.length === 0 && (
                                            <tr><td colSpan="7" className="text-center py-3 text-muted">No transactions for this date</td></tr>
                                        )}
                                    </tbody>
                                </Table>
                            </div>
                        </div>
                    </div>
                </Modal>

                {/* Account Details Modal (Banking App Style) */}
                <Modal
                    isOpen={isAccountDetailsModalOpen}
                    toggle={this.closeAccountDetails}
                    className="modal-dialog-scrollable custom-modal-width"
                    style={{ height: '90vh', maxHeight: '90vh' }}
                    contentClassName="border-0 h-100 shadow"
                    centered
                    backdrop={true}
                >
                    {selectedAccount && (
                        <div className="d-flex flex-column h-100">
                            {/* Compact Header */}
                            <div className="d-flex justify-content-between align-items-center px-3 py-2 bg-light border-bottom" style={{ minHeight: '45px' }}>
                                <div className="d-flex align-items-center">
                                    <span
                                        className="text-muted mr-3"
                                        style={{ cursor: 'pointer', fontSize: '18px' }}
                                        onClick={this.closeAccountDetails}
                                        title="Close"
                                    >
                                        <i className="fa fa-times"></i>
                                    </span>
                                    <span className="font-weight-bold" style={{ fontSize: '14px' }}>{selectedAccount.name}</span>
                                    <span className="text-muted ml-2" style={{ fontSize: '11px', textTransform: 'uppercase' }}>({selectedAccount.type})</span>
                                </div>
                                <div className="d-flex align-items-center">
                                    <Input
                                        type="date"
                                        value={activityDate}
                                        onChange={this.handleDateChange}
                                        style={{ width: '140px', fontSize: '12px', height: '30px', padding: '2px 8px' }}
                                    />
                                </div>
                            </div>

                            {/* Balance Banner - Light Neon Style */}
                            <div className="px-4 py-5 d-flex flex-column align-items-center justify-content-center text-center"
                                style={{
                                    background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
                                    borderBottom: '1px solid rgba(0, 0, 0, 0.05)',
                                    position: 'relative',
                                    overflow: 'hidden'
                                }}>
                                {/* Decorative Neon Glows */}
                                <div style={{
                                    position: 'absolute',
                                    top: '-30px',
                                    right: '-30px',
                                    width: '120px',
                                    height: '120px',
                                    background: 'rgba(6, 182, 212, 0.15)',
                                    filter: 'blur(50px)',
                                    borderRadius: '50%'
                                }}></div>
                                <div style={{
                                    position: 'absolute',
                                    bottom: '-20px',
                                    left: '-20px',
                                    width: '100px',
                                    height: '100px',
                                    background: 'rgba(99, 102, 241, 0.1)',
                                    filter: 'blur(40px)',
                                    borderRadius: '50%'
                                }}></div>

                                <div>
                                    <span className="text-uppercase mb-2" style={{
                                        fontSize: '11px',
                                        fontWeight: '800',
                                        letterSpacing: '2.5px',
                                        color: '#64748b',
                                        textShadow: '0 0 10px rgba(255, 255, 255, 0.8)'
                                    }}>{isToday ? 'Available Balance' : `Balance on ${new Date(activityDate).toLocaleDateString()}`}</span>

                                    <div className="d-flex align-items-center justify-content-center">
                                        <h1 className="font-weight-bold mb-0" style={{
                                            fontSize: '3.5rem',
                                            color: '#1e293b',
                                            letterSpacing: '-1px',
                                            textShadow: '0 4px 12px rgba(6, 182, 212, 0.15)'
                                        }}>
                                            <span style={{ fontSize: '1.5rem', color: '#0891b2', verticalAlign: 'middle', marginRight: '8px', fontWeight: '500' }}>৳</span>
                                            {calculateHistBalance(selectedAccount.balance, selectedAccount._id).toLocaleString()}
                                        </h1>
                                    </div>
                                </div>
                            </div>

                            {/* Scrollable Body */}
                            <div className="flex-grow-1 overflow-auto p-3">
                                <h6 className="font-weight-bold text-muted small text-uppercase mb-3" style={{ fontSize: '11px' }}>Transactions</h6>
                                {dailyTransactions.filter(t => t.account && t.account._id === selectedAccount._id).length > 0 ? (
                                    <ul className="list-group list-group-flush">
                                        {dailyTransactions
                                            .filter(t => t.account && t.account._id === selectedAccount._id)
                                            .map(trans => (
                                                <li key={trans._id} className="list-group-item d-flex justify-content-between align-items-center px-3 py-2 border-0 mb-1 rounded" style={{ transition: 'all 0.2s ease' }}>
                                                    <div className="d-flex align-items-center">
                                                        <div className="undo-hover-container mr-3" style={{ width: '32px', height: '32px', position: 'relative' }}>
                                                            {/* Main + or - icon */}
                                                            <div className={`main-icon rounded-circle d-flex align-items-center justify-content-center h-100 w-100`}
                                                                style={{
                                                                    fontSize: '0.9rem',
                                                                    fontWeight: 'bold',
                                                                    backgroundColor: trans.type === 'credit' ? '#e6fcf5' : '#fff5f5',
                                                                    color: trans.type === 'credit' ? '#0ca678' : '#fa5252'
                                                                }}>
                                                                {trans.type === 'credit' ? '+' : '-'}
                                                            </div>
                                                            {/* Undo icon (shown on hover, hidden by default) */}
                                                            {!trans.isUndone && (
                                                                <div
                                                                    className="undo-icon rounded-circle align-items-center justify-content-center h-100 w-100 bg-white text-danger shadow-sm"
                                                                    style={{
                                                                        display: 'none',
                                                                        position: 'absolute',
                                                                        top: 0,
                                                                        left: 0,
                                                                        cursor: 'pointer',
                                                                        border: '1px solid #ffc9c9',
                                                                        fontSize: '11px'
                                                                    }}
                                                                    onClick={() => this.submitUndoTransaction(trans._id)}
                                                                    title="Undo"
                                                                >
                                                                    <i className="fa fa-undo"></i>
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div style={trans.isUndone ? { textDecoration: 'line-through', opacity: 0.6 } : {}}>
                                                            <div className={`font-weight-bold mb-0 ${trans.type === 'credit' ? 'text-success' : 'text-danger'}`} style={{ fontSize: '12px' }}>
                                                                {trans.category || (trans.type === 'credit' ? 'Deposit' : 'Expense')}
                                                                {trans.isUndone && <span className="badge badge-secondary ml-2" style={{ fontSize: '8px' }}>Undone</span>}
                                                            </div>
                                                            <div className="text-muted" style={{ fontSize: '10px' }}>{new Date(trans.date).toLocaleDateString()} &bull; {trans.description}</div>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className={`font-weight-bold ${trans.isUndone ? 'text-muted' : (trans.type === 'credit' ? 'text-success' : 'text-danger')}`} style={trans.isUndone ? { textDecoration: 'line-through', fontSize: '12px' } : { fontSize: '13px' }}>
                                                            {trans.type === 'credit' ? '+' : '-'} {trans.amount.toLocaleString()}
                                                        </div>
                                                    </div>
                                                </li>
                                            ))}
                                    </ul>
                                ) : (
                                    <div className="text-center py-4 text-muted">
                                        <i className="fa fa-list-alt mb-2" style={{ fontSize: '2rem', opacity: 0.2 }}></i>
                                        <p className="font-italic small">No transactions found for this account.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )
                    }
                </Modal>
            </div >
        );
    }
}

export default AccountsManager;

