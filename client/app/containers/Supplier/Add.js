import React from 'react';
import axios from 'axios';
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
            console.error('Error fetching supplier:', error);
            alert('Error loading supplier data');
        }
    };

    handleInputChange = (e) => {
        this.setState({ [e.target.name]: e.target.value });
    };

    handleSubmit = async () => {
        const { id } = this.props.match.params;
        const { name, phoneNumber, address, notes, isEdit } = this.state;
        if (!name) return alert('Name is required');

        try {
            if (isEdit) {
                await axios.put(`${API_URL}/supplier/update/${id}`, { name, phoneNumber, address, notes });
                alert('Supplier Updated Successfully!');
            } else {
                await axios.post(`${API_URL}/supplier/add`, { name, phoneNumber, address, notes });
                alert('Supplier Added Successfully!');
            }
            this.props.history.push('/dashboard/supplier');
        } catch (error) {
            alert(`Error ${isEdit ? 'updating' : 'adding'} supplier`);
            console.error(error);
        }
    };

    render() {
        const { name, phoneNumber, address, notes, isEdit } = this.state;

        return (
            <div className="supplier-add">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <h3>{isEdit ? 'Edit Supplier' : 'Add New Supplier'}</h3>
                    <Button color="secondary" onClick={() => this.props.history.push('/dashboard/supplier')}>Back</Button>
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

export default SupplierAdd;
