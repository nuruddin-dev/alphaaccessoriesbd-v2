import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    Row,
    Col,
    Card,
    CardBody,
    CardTitle,
    Table,
    Button,
    Nav,
    NavItem,
    NavLink,
    TabContent,
    TabPane,
    Modal,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Form,
    FormGroup,
    Label,
    Input,
    Alert
} from 'reactstrap';
import classnames from 'classnames';
import dayjs from 'dayjs';
import { API_URL } from '../../constants';

const MyShop = () => {
    const [activeTab, setActiveTab] = useState('summary');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Data states
    const [staff, setStaff] = useState([]);
    const [owners, setOwners] = useState([]);
    const [properties, setProperties] = useState([]);
    const [transactions, setTransactions] = useState([]);

    // Modal states
    const [modal, setModal] = useState({
        isOpen: false,
        type: '', // staff, owner, property, transaction, history, note
        mode: 'add', // add, edit
        data: null
    });
    const [propertyHistory, setPropertyHistory] = useState([]);
    const [ownerHistory, setOwnerHistory] = useState([]);
    const [staffHistory, setStaffHistory] = useState([]);

    const toggleTab = tab => {
        if (activeTab !== tab) setActiveTab(tab);
    };

    const toggleModal = (type = '', mode = 'add', data = null) => {
        setModal({
            isOpen: !modal.isOpen,
            type,
            mode,
            data
        });
    };

    useEffect(() => {
        fetchData();
    }, [activeTab]);

    const fetchData = async () => {
        setLoading(true);
        try {
            if (activeTab === 'summary' || activeTab === 'transactions') {
                const res = await axios.get(`${API_URL}/myshop-mgmt/transactions`);
                setTransactions(res.data.transactions);
            }
            if (activeTab === 'staff') {
                const res = await axios.get(`${API_URL}/myshop-mgmt/staff`);
                setStaff(res.data.staff);
            }
            if (activeTab === 'owners') {
                const res = await axios.get(`${API_URL}/myshop-mgmt/owner`);
                setOwners(res.data.owners);
            }
            if (activeTab === 'properties') {
                const res = await axios.get(`${API_URL}/myshop-mgmt/property`);
                setProperties(res.data.properties);
            }
        } catch (err) {
            setError('Failed to fetch data');
        } finally {
            setLoading(false);
        }
    };

    const fetchPropertyHistory = async (propertyId) => {
        setLoading(true);
        try {
            // Fetch Transactions (Rent)
            const transRes = await axios.get(`${API_URL}/myshop-mgmt/transactions`, {
                params: { property: propertyId }
            });

            // Fetch Property Details (for noteHistory)
            const propRes = await axios.get(`${API_URL}/myshop-mgmt/property`);
            const currentProp = propRes.data.properties.find(p => p._id === propertyId);

            // Combine and sort by date
            const combinedHistory = [
                ...transRes.data.transactions.map(t => ({ ...t, isNote: false })),
                ...(currentProp?.noteHistory || []).map(n => ({ ...n, isNote: true, type: 'note', description: n.note }))
            ].sort((a, b) => new Date(b.date) - new Date(a.date));

            setPropertyHistory(combinedHistory);
        } catch (err) {
            setError('Failed to fetch property history');
        } finally {
            setLoading(false);
        }
    };

    const handleCreatePropertyNote = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData.entries());
        try {
            await axios.post(`${API_URL}/myshop-mgmt/property/${modal.data._id}/note`, data);
            toggleModal();
            fetchData();
        } catch (err) {
            setError('Failed to save note');
        }
    };

    const fetchOwnerHistory = async (ownerId) => {
        setLoading(true);
        try {
            const res = await axios.get(`${API_URL}/myshop-mgmt/transactions`, {
                params: { owner: ownerId }
            });

            // Sort by date ascending to calculate running balance
            const sortedTransactions = res.data.transactions.sort((a, b) => new Date(a.date) - new Date(b.date));

            let runningBalance = 0;
            const historyWithBalance = sortedTransactions.map(t => {
                const isCredit = ['owner_salary', 'owner_deposit'].includes(t.type);
                const isDebit = ['owner_withdraw', 'owner_landing'].includes(t.type);

                if (isCredit) runningBalance += t.amount;
                if (isDebit) runningBalance -= t.amount;

                return { ...t, isCredit, isDebit, balance: runningBalance };
            });

            // Sort back to descending for display
            setOwnerHistory(historyWithBalance.reverse());
        } catch (err) {
            setError('Failed to fetch owner history');
        } finally {
            setLoading(false);
        }
    };
    const fetchStaffHistory = async (staffId) => {
        setLoading(true);
        try {
            const res = await axios.get(`${API_URL}/myshop-mgmt/transactions`, {
                params: { staff: staffId }
            });

            const sortedTransactions = res.data.transactions.sort((a, b) => new Date(a.date) - new Date(b.date));

            let runningBalance = 0;
            const historyWithBalance = sortedTransactions.map(t => {
                const isCredit = t.type === 'staff_salary';
                const isDebit = t.type === 'staff_landing';

                if (isCredit) runningBalance += t.amount;
                if (isDebit) runningBalance -= t.amount;

                return { ...t, isCredit, isDebit, balance: runningBalance };
            });

            setStaffHistory(historyWithBalance.reverse());
        } catch (err) {
            setError('Failed to fetch staff history');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateStaff = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData.entries());
        try {
            await axios.post(`${API_URL}/myshop-mgmt/staff`, data);
            toggleModal();
            fetchData();
        } catch (err) {
            setError('Failed to create staff');
        }
    };

    const handleCreateOwner = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData.entries());
        try {
            await axios.post(`${API_URL}/myshop-mgmt/owner`, data);
            toggleModal();
            fetchData();
        } catch (err) {
            setError('Failed to create owner');
        }
    };

    const handleCreateProperty = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData.entries());
        try {
            await axios.post(`${API_URL}/myshop-mgmt/property`, data);
            toggleModal();
            fetchData();
        } catch (err) {
            setError('Failed to create property');
        }
    };

    const handleCreateTransaction = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData.entries());
        try {
            await axios.post(`${API_URL}/myshop-mgmt/transactions`, data);
            toggleModal();
            fetchData();
        } catch (err) {
            setError('Failed to create transaction');
        }
    };

    const renderSummary = () => {
        const totalTransactions = transactions.reduce((acc, curr) => acc + curr.amount, 0);
        return (
            <div className="myshop-summary">
                <Row>
                    <Col md="4">
                        <Card className="mb-4 shadow-sm border-0 bg-primary text-white">
                            <CardBody>
                                <CardTitle tag="h5">Total Expenses</CardTitle>
                                <h2 className="mb-0">৳{totalTransactions.toLocaleString()}</h2>
                            </CardBody>
                        </Card>
                    </Col>
                </Row>
                <Card className="shadow-sm border-0">
                    <CardBody>
                        <div className="d-flex justify-content-between align-items-center mb-4">
                            <CardTitle tag="h5">Recent Transactions</CardTitle>
                            <Button color="primary" size="sm" onClick={() => toggleModal('transaction')}>
                                <i className="fa fa-plus mr-2" /> Add Transaction
                            </Button>
                        </div>
                        <Table responsive hover>
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Type</th>
                                    <th>Description</th>
                                    <th>Related To</th>
                                    <th className="text-right">Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                {transactions.map(t => (
                                    <tr key={t._id}>
                                        <td>{dayjs(t.date).format('DD MMM YYYY')}</td>
                                        <td><span className="badge badge-info">{t.type.replace('_', ' ')}</span></td>
                                        <td>{t.description}</td>
                                        <td>{t.staff?.name || t.owner?.name || t.property?.name || '-'}</td>
                                        <td className="text-right font-weight-bold">৳{t.amount.toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    </CardBody>
                </Card>
            </div>
        );
    };

    return (
        <div className="myshop-container p-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h1 className="h3 mb-0 text-gray-800">MyShop Management</h1>
            </div>

            <Nav tabs className="mb-4 border-0">
                <NavItem>
                    <NavLink
                        className={classnames({ active: activeTab === 'summary' }, 'border-0')}
                        onClick={() => toggleTab('summary')}
                        style={{ cursor: 'pointer' }}
                    >
                        Summary
                    </NavLink>
                </NavItem>
                <NavItem>
                    <NavLink
                        className={classnames({ active: activeTab === 'staff' }, 'border-0')}
                        onClick={() => toggleTab('staff')}
                        style={{ cursor: 'pointer' }}
                    >
                        Staff
                    </NavLink>
                </NavItem>
                <NavItem>
                    <NavLink
                        className={classnames({ active: activeTab === 'owners' }, 'border-0')}
                        onClick={() => toggleTab('owners')}
                        style={{ cursor: 'pointer' }}
                    >
                        Owners
                    </NavLink>
                </NavItem>
                <NavItem>
                    <NavLink
                        className={classnames({ active: activeTab === 'properties' }, 'border-0')}
                        onClick={() => toggleTab('properties')}
                        style={{ cursor: 'pointer' }}
                    >
                        Shops & Godowns
                    </NavLink>
                </NavItem>
            </Nav>

            {error && <Alert color="danger">{error}</Alert>}

            <TabContent activeTab={activeTab}>
                <TabPane tabId="summary">
                    {renderSummary()}
                </TabPane>

                <TabPane tabId="staff">
                    <Card className="shadow-sm border-0">
                        <CardBody>
                            <div className="d-flex justify-content-between align-items-center mb-4">
                                <CardTitle tag="h5">Staff List</CardTitle>
                                <Button color="primary" size="sm" onClick={() => toggleModal('staff')}>
                                    <i className="fa fa-plus mr-2" /> Add Staff
                                </Button>
                            </div>
                            <Table responsive hover>
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>Phone</th>
                                        <th>Salary</th>
                                        <th>Joined</th>
                                        <th>Status</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {staff.map(s => (
                                        <tr key={s._id}>
                                            <td>{s.name}</td>
                                            <td>{s.phone}</td>
                                            <td>৳{s.salary.toLocaleString()}</td>
                                            <td>{dayjs(s.joinedDate).format('DD MMM YYYY')}</td>
                                            <td>
                                                <span className={`badge badge-${s.isActive ? 'success' : 'secondary'}`}>
                                                    {s.isActive ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="d-flex gap-2">
                                                    <i
                                                        className="fa fa-money text-primary action-icon-btn"
                                                        title="Pay Salary"
                                                        onClick={() => toggleModal('transaction', 'add', { staff: s._id, type: 'staff_salary' })}
                                                    ></i>
                                                    <i
                                                        className="fa fa-arrow-down text-warning action-icon-btn"
                                                        title="Landing (Advance)"
                                                        onClick={() => toggleModal('transaction', 'add', { staff: s._id, type: 'staff_landing' })}
                                                    ></i>
                                                    <i
                                                        className="fa fa-list-alt text-info action-icon-btn"
                                                        title="View Ledger"
                                                        onClick={() => {
                                                            fetchStaffHistory(s._id);
                                                            toggleModal('staff_ledger', 'view', s);
                                                        }}
                                                    ></i>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                        </CardBody>
                    </Card>
                </TabPane>

                <TabPane tabId="owners">
                    <Card className="shadow-sm border-0">
                        <CardBody>
                            <div className="d-flex justify-content-between align-items-center mb-4">
                                <CardTitle tag="h5">Owner Information</CardTitle>
                                <Button color="primary" size="sm" onClick={() => toggleModal('owner')}>
                                    <i className="fa fa-plus mr-2" /> Add Owner
                                </Button>
                            </div>
                            <Table responsive hover>
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>Phone</th>
                                        <th>Monthly Salary</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {owners.map(o => (
                                        <tr key={o._id}>
                                            <td>{o.name}</td>
                                            <td>{o.phone}</td>
                                            <td>৳{o.salary.toLocaleString()}</td>
                                            <td>
                                                <div className="d-flex gap-2">
                                                    <i
                                                        className="fa fa-money text-primary action-icon-btn"
                                                        title="Monthly Salary"
                                                        onClick={() => toggleModal('transaction', 'add', { owner: o._id, type: 'owner_salary' })}
                                                    ></i>
                                                    <i
                                                        className="fa fa-plus-circle text-success action-icon-btn"
                                                        title="Saving (Deposit)"
                                                        onClick={() => toggleModal('transaction', 'add', { owner: o._id, type: 'owner_deposit' })}
                                                    ></i>
                                                    <i
                                                        className="fa fa-minus-circle text-danger action-icon-btn"
                                                        title="Withdraw"
                                                        onClick={() => toggleModal('transaction', 'add', { owner: o._id, type: 'owner_withdraw' })}
                                                    ></i>
                                                    <i
                                                        className="fa fa-list-alt text-info action-icon-btn"
                                                        title="View Ledger"
                                                        onClick={() => {
                                                            fetchOwnerHistory(o._id);
                                                            toggleModal('owner_ledger', 'view', o);
                                                        }}
                                                    ></i>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                        </CardBody>
                    </Card>
                </TabPane>

                <TabPane tabId="properties">
                    <Card className="shadow-sm border-0">
                        <CardBody>
                            <div className="d-flex justify-content-between align-items-center mb-4">
                                <CardTitle tag="h5">Properties (Shops & Godowns)</CardTitle>
                                <Button color="primary" size="sm" onClick={() => toggleModal('property')}>
                                    <i className="fa fa-plus mr-2" /> Add Property
                                </Button>
                            </div>
                            <Table responsive hover>
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>Type</th>
                                        <th>Rent</th>
                                        <th>Location</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {properties.map(p => (
                                        <tr key={p._id}>
                                            <td>{p.name}</td>
                                            <td><span className="text-capitalize">{p.type}</span></td>
                                            <td>৳{p.rent.toLocaleString()}</td>
                                            <td>{p.location}</td>
                                            <td>
                                                <div className="d-flex gap-2">
                                                    <i
                                                        className="fa fa-money text-primary action-icon-btn"
                                                        title="Pay Rent"
                                                        onClick={() => toggleModal('transaction', 'add', { property: p._id, type: p.type === 'shop' ? 'shop_rent' : 'godown_rent' })}
                                                    ></i>
                                                    <i
                                                        className="fa fa-sticky-note text-warning action-icon-btn"
                                                        title="Add Note"
                                                        onClick={() => toggleModal('note', 'add', p)}
                                                    ></i>
                                                    <i
                                                        className="fa fa-eye text-info action-icon-btn"
                                                        title="View History"
                                                        onClick={() => {
                                                            fetchPropertyHistory(p._id);
                                                            toggleModal('history', 'view', p);
                                                        }}
                                                    ></i>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                        </CardBody>
                    </Card>
                </TabPane>
            </TabContent>

            {/* Modals */}
            <Modal isOpen={modal.isOpen} toggle={() => toggleModal()}>
                <ModalHeader toggle={() => toggleModal()}>
                    {modal.type === 'owner_ledger' || modal.type === 'staff_ledger' ? 'Ledger' :
                        modal.type === 'history' ? 'History' :
                            `${modal.mode === 'add' ? 'Add' : 'Edit'} ${modal.type.charAt(0).toUpperCase() + modal.type.slice(1)}`}
                </ModalHeader>
                <ModalBody>
                    {modal.type === 'staff' && (
                        <Form onSubmit={handleCreateStaff}>
                            <FormGroup>
                                <Label>Name</Label>
                                <Input name="name" required />
                            </FormGroup>
                            <FormGroup>
                                <Label>Phone</Label>
                                <Input name="phone" />
                            </FormGroup>
                            <FormGroup>
                                <Label>Salary</Label>
                                <Input name="salary" type="number" defaultValue="0" />
                            </FormGroup>
                            <FormGroup>
                                <Label>Joined Date</Label>
                                <Input name="joinedDate" type="date" defaultValue={dayjs().format('YYYY-MM-DD')} />
                            </FormGroup>
                            <FormGroup>
                                <Label>Notes</Label>
                                <Input name="notes" type="textarea" />
                            </FormGroup>
                            <Button color="primary" type="submit">Save</Button>
                        </Form>
                    )}

                    {modal.type === 'owner' && (
                        <Form onSubmit={handleCreateOwner}>
                            <FormGroup>
                                <Label>Name</Label>
                                <Input name="name" required />
                            </FormGroup>
                            <FormGroup>
                                <Label>Phone</Label>
                                <Input name="phone" />
                            </FormGroup>
                            <FormGroup>
                                <Label>Monthly Salary/Allowance</Label>
                                <Input name="salary" type="number" defaultValue="0" />
                            </FormGroup>
                            <FormGroup>
                                <Label>Notes</Label>
                                <Input name="notes" type="textarea" />
                            </FormGroup>
                            <Button color="primary" type="submit">Save</Button>
                        </Form>
                    )}

                    {modal.type === 'property' && (
                        <Form onSubmit={handleCreateProperty}>
                            <FormGroup>
                                <Label>Name</Label>
                                <Input name="name" required />
                            </FormGroup>
                            <FormGroup>
                                <Label>Type</Label>
                                <Input type="select" name="type">
                                    <option value="shop">Shop</option>
                                    <option value="godown">Godown</option>
                                </Input>
                            </FormGroup>
                            <FormGroup>
                                <Label>Monthly Rent</Label>
                                <Input name="rent" type="number" defaultValue="0" />
                            </FormGroup>
                            <FormGroup>
                                <Label>Location</Label>
                                <Input name="location" />
                            </FormGroup>
                            <FormGroup>
                                <Label>Notes</Label>
                                <Input name="notes" type="textarea" />
                            </FormGroup>
                            <Button color="primary" type="submit">Save</Button>
                        </Form>
                    )}

                    {modal.type === 'transaction' && (
                        <Form onSubmit={handleCreateTransaction}>
                            <FormGroup>
                                <Label>Type</Label>
                                <Input type="select" name="type" defaultValue={modal.data?.type || 'special_cost'}>
                                    <option value="staff_salary">Staff Salary</option>
                                    <option value="staff_landing">Staff Landing (Advance)</option>
                                    <option value="owner_salary">Owner Salary (Credit)</option>
                                    <option value="owner_deposit">Owner Saving/Deposit (Credit)</option>
                                    <option value="owner_withdraw">Owner Withdrawal (Debit)</option>
                                    <option value="owner_landing">Owner Landing (Debit)</option>
                                    <option value="shop_rent">Shop Rent</option>
                                    <option value="godown_rent">Godown Rent</option>
                                    <option value="special_cost">Special Cost</option>
                                    <option value="property_note">Property Note</option>
                                </Input>
                            </FormGroup>
                            {modal.data?.staff && <Input type="hidden" name="staff" value={modal.data.staff} />}
                            {modal.data?.owner && <Input type="hidden" name="owner" value={modal.data.owner} />}
                            {modal.data?.property && <Input type="hidden" name="property" value={modal.data.property} />}

                            {!modal.data?.staff && !modal.data?.owner && !modal.data?.property && (
                                <>
                                    <FormGroup>
                                        <Label>Staff (Optional)</Label>
                                        <Input type="select" name="staff">
                                            <option value="">None</option>
                                            {staff.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                                        </Input>
                                    </FormGroup>
                                    <FormGroup>
                                        <Label>Owner (Optional)</Label>
                                        <Input type="select" name="owner">
                                            <option value="">None</option>
                                            {owners.map(o => <option key={o._id} value={o._id}>{o.name}</option>)}
                                        </Input>
                                    </FormGroup>
                                    <FormGroup>
                                        <Label>Property (Optional)</Label>
                                        <Input type="select" name="property">
                                            <option value="">None</option>
                                            {properties.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                                        </Input>
                                    </FormGroup>
                                </>
                            )}

                            <FormGroup>
                                <Label>Amount</Label>
                                <Input name="amount" type="number" required={modal.data?.type !== 'property_note'} defaultValue={modal.data?.type === 'property_note' ? "0" : ""} disabled={modal.data?.type === 'property_note'} />
                            </FormGroup>
                            <FormGroup>
                                <Label>Date</Label>
                                <Input name="date" type="date" defaultValue={dayjs().format('YYYY-MM-DD')} />
                            </FormGroup>
                            <FormGroup>
                                <Label>Description / Note</Label>
                                <Input name="description" type="textarea" placeholder={modal.data?.type === 'property_note' ? "Enter your note here..." : "Payment details..."} required={modal.data?.type === 'property_note'} />
                            </FormGroup>
                            <Button color="primary" type="submit">{modal.data?.type === 'property_note' ? 'Save Note' : 'Save Transaction'}</Button>
                        </Form>
                    )}

                    {modal.type === 'history' && (
                        <div className="property-history">
                            <h6 className="mb-3 text-muted">History for {modal.data?.name}</h6>
                            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                                {propertyHistory.length > 0 ? (
                                    <Table borderless size="sm">
                                        <thead>
                                            <tr className="border-bottom">
                                                <th>Date & Time</th>
                                                <th>Type</th>
                                                <th>Amount</th>
                                                <th>Note</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {propertyHistory.map(h => (
                                                <tr key={h._id} className="border-bottom">
                                                    <td style={{ fontSize: '0.85rem' }}>
                                                        <div className="font-weight-bold">{dayjs(h.date).format('DD MMM YYYY')}</div>
                                                        <div className="text-muted small">{dayjs(h.date).format('h:mm A')}</div>
                                                    </td>
                                                    <td>
                                                        <span className={`badge badge-${h.type === 'property_note' ? 'warning' : 'info'} text-capitalize`}>
                                                            {h.type.replace('property_', '').replace('_', ' ')}
                                                        </span>
                                                    </td>
                                                    <td className="font-weight-bold">
                                                        {h.amount > 0 ? `৳${h.amount.toLocaleString()}` : '-'}
                                                    </td>
                                                    <td style={{ maxWidth: '200px', fontSize: '0.9rem' }}>
                                                        {h.description}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </Table>
                                ) : (
                                    <div className="text-center p-4 text-muted">
                                        <i className="fa fa-history fa-2x mb-2 d-block opacity-50"></i>
                                        No history found for this property.
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {modal.type === 'note' && (
                        <Form onSubmit={handleCreatePropertyNote}>
                            <h6 className="mb-3">Add Note for {modal.data?.name}</h6>
                            <FormGroup>
                                <Label>Note</Label>
                                <Input name="note" type="textarea" placeholder="Enter shop/godown details..." required />
                            </FormGroup>
                            <Button color="primary" type="submit">Save Note</Button>
                        </Form>
                    )}

                    {modal.type === 'owner_ledger' && (
                        <div className="owner-ledger">
                            <h6 className="mb-3 text-muted">Ledger for {modal.data?.name}</h6>
                            <div style={{ maxHeight: '450px', overflowY: 'auto' }}>
                                <Table bordered hover size="sm" className="text-center">
                                    <thead className="bg-light sticky-top">
                                        <tr>
                                            <th>Date</th>
                                            <th>Description</th>
                                            <th>Debit (-)</th>
                                            <th>Credit (+)</th>
                                            <th>Balance</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {ownerHistory.map(h => (
                                            <tr key={h._id}>
                                                <td style={{ fontSize: '0.85rem' }}>{dayjs(h.date).format('DD-MM-YYYY')}</td>
                                                <td className="text-left font-italic small" style={{ maxWidth: '150px' }}>
                                                    {h.type.replace('owner_', '').replace('_', ' ')}
                                                    {h.description && ` - ${h.description}`}
                                                </td>
                                                <td className="text-danger">
                                                    {h.isDebit ? `৳${h.amount.toLocaleString()}` : '-'}
                                                </td>
                                                <td className="text-success">
                                                    {h.isCredit ? `৳${h.amount.toLocaleString()}` : '-'}
                                                </td>
                                                <td className="font-weight-bold">
                                                    ৳{h.balance.toLocaleString()}
                                                </td>
                                            </tr>
                                        ))}
                                        {ownerHistory.length === 0 && (
                                            <tr>
                                                <td colSpan="5" className="p-4 text-muted">No transactions found.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </Table>
                            </div>
                        </div>
                    )}

                    {modal.type === 'staff_ledger' && (
                        <div className="staff-ledger">
                            <h6 className="mb-3 text-muted">Ledger for {modal.data?.name}</h6>
                            <div style={{ maxHeight: '450px', overflowY: 'auto' }}>
                                <Table bordered hover size="sm" className="text-center">
                                    <thead className="bg-light sticky-top">
                                        <tr>
                                            <th>Date</th>
                                            <th>Description</th>
                                            <th>Debit (-)</th>
                                            <th>Credit (+)</th>
                                            <th>Balance</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {staffHistory.map(h => (
                                            <tr key={h._id}>
                                                <td style={{ fontSize: '0.85rem' }}>{dayjs(h.date).format('DD-MM-YYYY')}</td>
                                                <td className="text-left font-italic small" style={{ maxWidth: '150px' }}>
                                                    {h.type.replace('staff_', '').replace('_', ' ')}
                                                    {h.description && ` - ${h.description}`}
                                                </td>
                                                <td className="text-danger">
                                                    {h.isDebit ? `৳${h.amount.toLocaleString()}` : '-'}
                                                </td>
                                                <td className="text-success">
                                                    {h.isCredit ? `৳${h.amount.toLocaleString()}` : '-'}
                                                </td>
                                                <td className="font-weight-bold">
                                                    ৳{h.balance.toLocaleString()}
                                                </td>
                                            </tr>
                                        ))}
                                        {staffHistory.length === 0 && (
                                            <tr>
                                                <td colSpan="5" className="p-4 text-muted">No transactions found.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </Table>
                            </div>
                        </div>
                    )}
                </ModalBody>
                {(modal.type === 'history' || modal.type === 'owner_ledger' || modal.type === 'staff_ledger') && <ModalFooter><Button color="secondary" onClick={() => toggleModal()}>Close</Button></ModalFooter>}
            </Modal>

            <style jsx>{`
        .myshop-container {
          background-color: #f8f9fc;
          min-height: 100vh;
        }
        .nav-tabs .nav-link {
          color: #4e73df;
          font-weight: 600;
          padding: 1rem 1.5rem;
        }
        .nav-tabs .nav-link.active {
          color: #2e59d9;
          border-bottom: 2px solid #4e73df !important;
          background: transparent;
        }
        .card {
          border-radius: 0.75rem;
        }
        .badge {
          padding: 0.5em 0.75em;
          border-radius: 0.5rem;
        }
        .action-icon-btn {
          cursor: pointer;
          transition: all 0.2s;
          padding: 4px;
          display: inline-block;
        }
        .action-icon-btn:hover {
          transform: scale(1.2);
          opacity: 0.8;
          text-decoration: none !important;
        }
        .action-icon-btn i {
          font-size: 18px;
          vertical-align: middle;
        }
      `}</style>
        </div>
    );
};

export default MyShop;
