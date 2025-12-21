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
            category: ''
        },
        spendingCategories: ['Snacks', 'Printer Color', 'Paper', 'Others']
    };

    componentDidMount() {
        this.fetchAccounts();
        this.fetchTransactions();

        // Load categories from local storage
        const savedCategories = localStorage.getItem('spendingCategories');
        if (savedCategories) {
            this.setState({ spendingCategories: JSON.parse(savedCategories) });
        }
    }

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

    handleAddCategory = () => {
        const newCategory = window.prompt("Enter new category name:");
        if (newCategory) {
            this.setState(prevState => {
                const updatedCategories = [...prevState.spendingCategories, newCategory];
                localStorage.setItem('spendingCategories', JSON.stringify(updatedCategories));
                return {
                    spendingCategories: updatedCategories,
                    newTransaction: { ...prevState.newTransaction, category: newCategory } // Auto select
                };
            });
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
            await axios.post(`${API_URL}/account/transaction/add`, {
                account,
                amount,
                description,
                type,
                category
            });
            this.fetchAccounts();
            this.fetchTransactions();
            this.toggleAddTransactionModal();
            this.setState(prevState => ({
                newTransaction: { ...prevState.newTransaction, amount: '', description: '', category: '' }
            }));
        } catch (error) {
            alert('Error adding transaction: ' + (error.response?.data?.error || error.message));
            console.error(error);
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

        return (
            <div className="accounts-manager">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <h3>Financial Dashboard</h3>
                    <div>
                        <Button color="primary" className="mr-2" onClick={this.toggleAddAccountModal}>Add Account</Button>
                        <Button color="success" onClick={this.toggleAddTransactionModal}>Add Transaction</Button>
                    </div>
                </div>

                {/* Summary Cards */}
                {/* Summary Cards */}
                <Row className="mb-4">
                    <Col md="12">
                        <Card className="text-white mb-3 border-0 shadow-sm"
                            style={{
                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', // Modern purple-blue gradient
                                borderRadius: '15px'
                            }}
                        >
                            <CardBody className="d-flex justify-content-between align-items-center p-4">
                                <div>
                                    <h6 className="text-uppercase mb-2" style={{ opacity: 0.8, letterSpacing: '1px' }}>Total Balance</h6>
                                    <h2 className="mb-0 font-weight-bold">Tk {totalBalance.toLocaleString()}</h2>
                                </div>
                                <div style={{ fontSize: '3rem', opacity: 0.3 }}>
                                    <i className="fa fa-university"></i>
                                </div>
                            </CardBody>
                        </Card>
                    </Col>
                </Row>

                <Row className="mb-4">
                    {accounts.map(acc => {
                        const stats = accountStats[acc._id] || { todayInput: 0, todayOutput: 0 };

                        return (
                            <Col md="4" key={acc._id} className="mb-4">
                                <Card
                                    className="border-0 shadow-sm h-100 hover-card cursor-pointer"
                                    style={{ borderRadius: '12px', transition: 'all 0.3s ease', cursor: 'pointer' }}
                                    onClick={() => this.openAccountDetails(acc)}
                                >
                                    <CardBody className="p-4">
                                        <div className="d-flex justify-content-between align-items-start mb-3">
                                            <div>
                                                <h6 className="text-muted text-uppercase small mb-1">{acc.type}</h6>
                                                <h5 className="font-weight-bold text-dark mb-0">{acc.name}</h5>
                                            </div>
                                            <div className={`icon-box ${acc.type === 'bank' ? 'bg-soft-primary text-primary' : acc.type === 'mobile' ? 'bg-soft-danger text-danger' : 'bg-soft-success text-success'}`}
                                                style={{ width: '40px', height: '40px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                {acc.type === 'bank' && <i className="fa fa-building"></i>}
                                                {acc.type === 'mobile' && <i className="fa fa-mobile-phone" style={{ fontSize: '1.2rem' }}></i>}
                                                {acc.type === 'cash' && <i className="fa fa-money"></i>}
                                                {acc.type === 'other' && <i className="fa fa-credit-card"></i>}
                                            </div>
                                        </div>

                                        <div className="mb-3">
                                            <span className="text-muted small">Current Balance</span>
                                            <h4 className="mb-0 font-weight-bold text-dark">Tk {acc.balance.toLocaleString()}</h4>
                                        </div>

                                        <div className="d-flex justify-content-between align-items-center pt-3 border-top">
                                            <div className="w-50 border-right pr-2">
                                                <div className="text-success small font-weight-bold mb-1">
                                                    <i className="fa fa-arrow-down mr-1"></i> Today's In
                                                </div>
                                                <span className="text-success font-weight-bold d-block">+ Tk {stats.todayInput.toLocaleString()}</span>
                                            </div>
                                            <div className="w-50 pl-3">
                                                <div className="text-danger small font-weight-bold mb-1">
                                                    <i className="fa fa-arrow-up mr-1"></i> Today's Out
                                                </div>
                                                <span className="text-danger font-weight-bold d-block">- Tk {stats.todayOutput.toLocaleString()}</span>
                                            </div>
                                        </div>
                                        {acc.details && <p className="text-muted small mt-2 mb-0" style={{ fontSize: '11px' }}>{acc.details}</p>}
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
                                </tr>
                            </thead>
                            <tbody>
                                {recentTransactions.map(trans => (
                                    <tr key={trans._id}>
                                        <td className="text-muted small">{new Date(trans.date).toLocaleDateString()} <span style={{ fontSize: '10px' }}>{new Date(trans.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span></td>
                                        <td>
                                            <span className="font-weight-bold text-dark">{trans.account ? trans.account.name : 'Unknown'}</span>
                                        </td>
                                        <td>
                                            {trans.category ? <span className="badge badge-light border text-muted">{trans.category}</span> : '-'}
                                        </td>
                                        <td>
                                            <div className="text-truncate" style={{ maxWidth: '250px' }}>
                                                {trans.reference ? <strong className="mr-1 text-dark">{trans.reference}:</strong> : ''}
                                                <span className="text-muted">{trans.description}</span>
                                            </div>
                                        </td>
                                        <td className="text-center">
                                            <span className={`badge ${trans.type === 'credit' ? 'badge-soft-success text-success' : 'badge-soft-danger text-danger'}`}
                                                style={{ padding: '5px 10px', borderRadius: '20px', backgroundColor: trans.type === 'credit' ? '#dcfce7' : '#fee2e2' }}>
                                                {trans.type === 'credit' ? 'Data In' : 'Expense'}
                                            </span>
                                        </td>
                                        <td className="text-right font-weight-bold">
                                            <span className={trans.type === 'debit' ? 'text-danger' : 'text-success'}>
                                                {trans.type === 'debit' ? '-' : '+'} Tk {trans.amount.toLocaleString()}
                                            </span>
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
                <Modal isOpen={isAddAccountModalOpen} toggle={this.toggleAddAccountModal}>
                    <ModalHeader toggle={this.toggleAddAccountModal}>Add New Account</ModalHeader>
                    <ModalBody>
                        <FormGroup>
                            <Label>Account Name</Label>
                            <Input name="name" value={newAccount.name} onChange={this.handleAddAccountChange} placeholder="e.g. IFIC Bank, Bkash (Personal)" />
                        </FormGroup>
                        <FormGroup>
                            <Label>Type</Label>
                            <Input type="select" name="type" value={newAccount.type} onChange={this.handleAddAccountChange}>
                                <option value="bank">Bank</option>
                                <option value="mobile">Mobile Banking (Bkash/Nagad)</option>
                                <option value="cash">Cash</option>
                                <option value="other">Other</option>
                            </Input>
                        </FormGroup>
                        <FormGroup>
                            <Label>Details (Optional)</Label>
                            <Input name="details" value={newAccount.details} onChange={this.handleAddAccountChange} placeholder="Account Number, Branch, etc." />
                        </FormGroup>
                        <FormGroup>
                            <Label>Opening Balance</Label>
                            <Input type="number" name="openingBalance" value={newAccount.openingBalance} onChange={this.handleAddAccountChange} />
                        </FormGroup>
                    </ModalBody>
                    <ModalFooter>
                        <Button color="secondary" onClick={this.toggleAddAccountModal}>Cancel</Button>
                        <Button color="primary" onClick={this.submitAddAccount}>Save Account</Button>
                    </ModalFooter>
                </Modal>

                {/* Add Transaction Modal */}
                <Modal isOpen={isAddTransactionModalOpen} toggle={this.toggleAddTransactionModal}>
                    <ModalHeader toggle={this.toggleAddTransactionModal}>Add Transaction</ModalHeader>
                    <ModalBody>
                        <FormGroup>
                            <Label>Transaction Type</Label>
                            <Input type="select" name="type" value={newTransaction.type} onChange={this.handleAddTransactionChange}>
                                <option value="credit">Income / Add Funds</option>
                                <option value="debit">Expense / Spending</option>
                            </Input>
                        </FormGroup>

                        {newTransaction.type === 'debit' && (
                            <FormGroup>
                                <Label>Category</Label>
                                <div className="d-flex">
                                    <Input type="select" name="category" value={newTransaction.category} onChange={this.handleAddTransactionChange} className="mr-2">
                                        <option value="">Select Category</option>
                                        {this.state.spendingCategories.map((cat, i) => (
                                            <option key={i} value={cat}>{cat}</option>
                                        ))}
                                    </Input>
                                    <Button color="light" size="sm" onClick={this.handleAddCategory} title="Add New Category">
                                        <i className="fa fa-plus text-primary"></i>
                                    </Button>
                                </div>
                            </FormGroup>
                        )}

                        <FormGroup>
                            <Label>Account</Label>
                            <Input type="select" name="account" value={newTransaction.account} onChange={this.handleAddTransactionChange}>
                                <option value="">Select Account</option>
                                {accounts.map(acc => (
                                    <option key={acc._id} value={acc._id}>{acc.name} (Tk {acc.balance})</option>
                                ))}
                            </Input>
                        </FormGroup>
                        <FormGroup>
                            <Label>Amount</Label>
                            <Input type="number" name="amount" value={newTransaction.amount} onChange={this.handleAddTransactionChange} />
                        </FormGroup>
                        <FormGroup>
                            <Label>Description {newTransaction.category === 'Others' ? '(Required)' : '(Optional)'}</Label>
                            <Input
                                name="description"
                                value={newTransaction.description}
                                onChange={this.handleAddTransactionChange}
                                placeholder={newTransaction.category === 'Others' ? "Please specify..." : "Reason, Source, etc."}
                            />
                        </FormGroup>
                    </ModalBody>
                    <ModalFooter>
                        <Button color="secondary" onClick={this.toggleAddTransactionModal}>Cancel</Button>
                        <Button color="success" onClick={this.submitAddTransaction}>
                            {newTransaction.type === 'credit' ? 'Add Funds' : 'Record Expense'}
                        </Button>
                    </ModalFooter>
                </Modal>

                {/* View All / Today's Summary Modal */}
                <Modal isOpen={isViewAllModalOpen} toggle={this.toggleViewAllModal} size="lg">
                    <ModalHeader toggle={this.toggleViewAllModal}>
                        <div className="d-flex align-items-center justify-content-between w-100">
                            <span>Activity History</span>
                            <Input
                                type="date"
                                value={activityDate}
                                onChange={this.handleDateChange}
                                className="ml-auto"
                                style={{ width: 'auto', fontSize: '0.9rem' }}
                            />
                        </div>
                    </ModalHeader>
                    <ModalBody>
                        {/* Summary Section */}
                        <div className="mb-4 p-3 bg-light rounded">
                            <div className="d-flex justify-content-between align-items-center mb-3 border-bottom pb-2">
                                <h6 className="font-weight-bold mb-0">Overview for {new Date(activityDate).toDateString()}</h6>
                            </div>
                            <Row>
                                <Col md="6">
                                    <div className="d-flex justify-content-between align-items-center mb-2">
                                        <h6 className="text-success small font-weight-bold text-uppercase mb-0">Total Input</h6>
                                        <h6 className="text-success font-weight-bold mb-0">Tk {dailyTotalInput.toLocaleString()}</h6>
                                    </div>
                                    {Object.keys(dailyInputByAccount).length > 0 ? (
                                        <Table size="sm" borderless className="mb-0">
                                            <tbody>
                                                {Object.entries(dailyInputByAccount).map(([accName, amount]) => (
                                                    <tr key={accName}>
                                                        <td className="pl-0 text-muted small">{accName}</td>
                                                        <td className="text-right text-dark small font-weight-bold">{amount.toLocaleString()}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </Table>
                                    ) : <p className="small text-muted mb-0">No Input</p>}
                                </Col>
                                <Col md="6" className="border-left">
                                    <div className="d-flex justify-content-between align-items-center mb-2">
                                        <h6 className="text-danger small font-weight-bold text-uppercase mb-0">Total Expense</h6>
                                        <h6 className="text-danger font-weight-bold mb-0">Tk {dailyTotalExpense.toLocaleString()}</h6>
                                    </div>
                                    {Object.keys(dailyExpenseByCategory).length > 0 ? (
                                        <Table size="sm" borderless className="mb-0">
                                            <tbody>
                                                {Object.entries(dailyExpenseByCategory).map(([cat, amount]) => (
                                                    <tr key={cat}>
                                                        <td className="pl-0 text-muted small">{cat}</td>
                                                        <td className="text-right text-dark small font-weight-bold">{amount.toLocaleString()}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </Table>
                                    ) : <p className="small text-muted mb-0">No Expenses</p>}
                                </Col>
                            </Row>
                        </div>


                        <h6 className="font-weight-bold mb-3">All Activities</h6>
                        <Table responsive hover size="sm">
                            <thead className="thead-light">
                                <tr>
                                    <th>Date</th>
                                    <th>Account</th>
                                    <th>Category</th>
                                    <th>Desc</th>
                                    <th>Type</th>
                                    <th className="text-right">Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                {dailyTransactions.map(trans => (
                                    <tr key={trans._id}>
                                        <td className="small">{new Date(trans.date).toLocaleDateString()}</td>
                                        <td className="small">{trans.account ? trans.account.name : '-'}</td>
                                        <td className="small text-truncate" style={{ maxWidth: '100px' }}>{trans.category || '-'}</td>
                                        <td className="small text-truncate" style={{ maxWidth: '150px' }}>{trans.description}</td>
                                        <td>
                                            <span className={`badge ${trans.type === 'credit' ? 'badge-success' : 'badge-danger'}`}>
                                                {trans.type}
                                            </span>
                                        </td>
                                        <td className={`text-right font-weight-bold small ${trans.type === 'credit' ? 'text-success' : 'text-danger'}`}>
                                            {trans.type === 'debit' ? '-' : '+'} {trans.amount.toLocaleString()}
                                        </td>
                                    </tr>
                                ))}
                                {dailyTransactions.length === 0 && (
                                    <tr><td colSpan="6" className="text-center py-4 text-muted">No transactions for this date</td></tr>
                                )}
                            </tbody>
                        </Table>
                    </ModalBody>
                    <ModalFooter>
                        <Button color="secondary" onClick={this.toggleViewAllModal}>Close</Button>
                    </ModalFooter>
                </Modal>

                {/* Account Details Modal (Banking App Style) */}
                <Modal isOpen={isAccountDetailsModalOpen} toggle={this.closeAccountDetails} size="md" centered className="account-details-modal">
                    {selectedAccount && (
                        <>
                            <div className="modal-header border-0 pb-0" style={{ background: 'linear-gradient(135deg, #fdfbfb 0%, #ebedee 100%)' }}>
                                <div className="w-100">
                                    <div className="d-flex justify-content-between align-items-center mb-2">
                                        <h5 className="modal-title font-weight-bold text-dark">{selectedAccount.name}</h5>
                                        <button type="button" className="close" onClick={this.closeAccountDetails}>&times;</button>
                                    </div>
                                    <p className="text-muted small mb-3">{selectedAccount.type}</p>
                                    <div className="text-center py-3">
                                        <h2 className="font-weight-bold mb-0 text-dark">Tk {selectedAccount.balance.toLocaleString()}</h2>
                                        <span className="small text-muted">Available Balance</span>
                                    </div>
                                </div>
                            </div>
                            <ModalBody className="bg-white px-0">
                                <div className="px-3 d-flex justify-content-between align-items-center mb-3">
                                    <h6 className="font-weight-bold text-muted small text-uppercase mb-0">Transactions</h6>
                                    <Input
                                        type="date"
                                        value={activityDate}
                                        onChange={this.handleDateChange}
                                        style={{ width: '130px', fontSize: '0.8rem', height: '30px', padding: '0 5px' }}
                                    />
                                </div>
                                <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                                    {dailyTransactions.filter(t => t.account && t.account._id === selectedAccount._id).length > 0 ? (
                                        <ul className="list-group list-group-flush">
                                            {dailyTransactions
                                                .filter(t => t.account && t.account._id === selectedAccount._id)
                                                .map(trans => (
                                                    <li key={trans._id} className="list-group-item d-flex justify-content-between align-items-center px-4 py-3">
                                                        <div className="d-flex align-items-center">
                                                            <div className={`mr-3 rounded-circle d-flex align-items-center justify-content-center ${trans.type === 'credit' ? 'bg-soft-success text-success' : 'bg-soft-danger text-danger'}`}
                                                                style={{ width: '40px', height: '40px', minWidth: '40px' }}>
                                                                <i className={`fa ${trans.type === 'credit' ? 'fa-arrow-down' : 'fa-shopping-bag'}`}></i>
                                                            </div>
                                                            <div>
                                                                <div className="font-weight-bold text-dark mb-0">{trans.category || (trans.type === 'credit' ? 'Deposit' : 'Expense')}</div>
                                                                <div className="small text-muted">{new Date(trans.date).toLocaleDateString()} &bull; {trans.description}</div>
                                                            </div>
                                                        </div>
                                                        <div className={`font-weight-bold ${trans.type === 'credit' ? 'text-success' : 'text-dark'}`}>
                                                            {trans.type === 'credit' ? '+' : '-'} Tk {trans.amount.toLocaleString()}
                                                        </div>
                                                    </li>
                                                ))}
                                        </ul>
                                    ) : (
                                        <div className="text-center py-5 text-muted">
                                            <i className="fa fa-list-alt mb-2" style={{ fontSize: '2rem', opacity: 0.5 }}></i>
                                            <p>No transactions found for this account.</p>
                                        </div>
                                    )}
                                </div>
                            </ModalBody>
                        </>
                    )}
                </Modal>
            </div>
        );
    }
}

export default AccountsManager;
