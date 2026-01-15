import React from 'react';
import { connect } from 'react-redux';
import { success, error, warning } from 'react-notification-system-redux';
import axios from 'axios';
import actions from '../../actions';
import { Row, Col, Card, CardBody, Button, FormGroup, Label, Input } from 'reactstrap';
import { API_URL } from '../../constants';

class SupplierAdd extends React.Component {
    state = {
        name: '',
        phoneNumber: '',
        address: '',
        notes: '',
        isEdit: false
    };

    componentDidMount() {
        const { id } = this.props.match.params;
        if (id) {
            this.setState({ isEdit: true });
            this.fetchSupplier(id);
        }
    }

    fetchSupplier = async (id) => {
        try {
            const response = await axios.get(`${API_URL}/supplier/${id}`);
            const { name, phoneNumber, address, notes } = response.data.supplier;
            this.setState({
                name: name || '',
                phoneNumber: phoneNumber || '',
                address: address || '',
                notes: notes || ''
            });
        } catch (error) {
            console.error('Error fetching supplier:', err);
            this.props.error({ title: 'Error loading supplier data', position: 'tr', autoDismiss: 5 });
        }
    };

    handleInputChange = (e) => {
        this.setState({ [e.target.name]: e.target.value });
    };

    handleSubmit = async () => {
        const { id } = this.props.match.params;
        const { name, phoneNumber, address, notes, isEdit } = this.state;
        if (!name) return this.props.warning({ title: 'Name is required', position: 'tr', autoDismiss: 3 });

        try {
            if (isEdit) {
                await axios.put(`${API_URL}/supplier/update/${id}`, { name, phoneNumber, address, notes });
                this.props.success({ title: 'Supplier Updated Successfully!', position: 'tr', autoDismiss: 3 });
            } else {
                await axios.post(`${API_URL}/supplier/add`, { name, phoneNumber, address, notes });
                this.props.success({ title: 'Supplier Added Successfully!', position: 'tr', autoDismiss: 3 });
            }
            this.props.history.push('/dashboard/supplier');
        } catch (error) {
            this.props.error({ title: `Error ${isEdit ? 'updating' : 'adding'} supplier`, position: 'tr', autoDismiss: 5 });
            console.error(err);
        }
    };

    render() {
        const { name, phoneNumber, address, notes, isEdit } = this.state;

        return (
            <div className="supplier-add">
                <div className="d-flex justify-content-between align-items-center" style={{ background: '#fff', padding: '20px 24px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', marginBottom: '20px' }}>
                    <div className="d-flex align-items-center">
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
                            {isEdit ? 'Edit Supplier' : 'Add New Supplier'}
                        </h2>
                    </div>
                    <button
                        className="btn-neon btn-neon--cyan"
                        onClick={() => this.props.history.push('/dashboard/supplier')}
                    >
                        Cancel
                    </button>
                </div>

                <Row>
                    <Col md="8" className="mx-auto">
                        <Card className="shadow-sm border-0">
                            <CardBody>
                                <FormGroup>
                                    <Label>Supplier Name *</Label>
                                    <Input name="name" value={name} onChange={this.handleInputChange} placeholder="e.g. Alibaba Vendor A" />
                                </FormGroup>
                                <FormGroup>
                                    <Label>Phone Number</Label>
                                    <Input name="phoneNumber" value={phoneNumber} onChange={this.handleInputChange} placeholder="Contact Number" />
                                </FormGroup>
                                <FormGroup>
                                    <Label>Address</Label>
                                    <Input type="textarea" name="address" value={address} onChange={this.handleInputChange} placeholder="Supplier Address" />
                                </FormGroup>
                                <FormGroup>
                                    <Label>Notes</Label>
                                    <Input type="textarea" name="notes" value={notes} onChange={this.handleInputChange} placeholder="Additional info..." />
                                </FormGroup>
                                <div className="text-right mt-4">
                                    <Button color="success" onClick={this.handleSubmit}>
                                        {isEdit ? 'Update Supplier' : 'Save Supplier'}
                                    </Button>
                                </div>
                            </CardBody>
                        </Card>
                    </Col>
                </Row>
            </div>
        );
    }
}

const mapStateToProps = state => ({
    user: state.account.user
});

const mapDispatchToProps = dispatch => ({
    ...actions(dispatch),
    success: opts => dispatch(success(opts)),
    error: opts => dispatch(error(opts)),
    warning: opts => dispatch(warning(opts)),
    dispatch
});

export default connect(mapStateToProps, mapDispatchToProps)(SupplierAdd);
