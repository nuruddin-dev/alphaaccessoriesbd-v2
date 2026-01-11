import React from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { Card, CardBody, Button, Table } from 'reactstrap';
import { API_URL } from '../../constants';

class SupplierList extends React.PureComponent {
    state = {
        suppliers: [],
        isLoading: false,
        error: null
    };

    componentDidMount() {
        this.fetchSuppliers();
    }

    fetchSuppliers = async () => {
        try {
            this.setState({ isLoading: true, error: null });
            const response = await axios.get(`${API_URL}/supplier`);
            this.setState({ suppliers: response.data.suppliers, isLoading: false });
        } catch (error) {
            console.error('Error fetching suppliers:', error);
            this.setState({
                isLoading: false,
                error: 'Could not load suppliers. Please check your connection or login again.'
            });
        }
    };

    render() {
        const { suppliers, isLoading } = this.state;

        return (
            <div className="supplier-list">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <h3>Supplier Management</h3>
                    <Link to="/dashboard/supplier/add">
                        <Button color="primary">Add New Supplier</Button>
                    </Link>
                </div>

                <Card className="border-0 shadow-sm">
                    <CardBody className="p-0">
                        <Table responsive hover className="mb-0">
                            <thead className="bg-light">
                                <tr>
                                    <th className="border-0">Name</th>
                                    <th className="border-0">Phone</th>
                                    <th className="border-0">Address</th>
                                    <th className="border-0">Notes</th>
                                    <th className="border-0 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {suppliers.map(supplier => (
                                    <tr
                                        key={supplier._id}
                                        style={{ cursor: 'pointer' }}
                                        onClick={() => this.props.history.push(`/dashboard/supplier/orders/${supplier._id}`)}
                                    >
                                        <td>
                                            <strong style={{ color: '#4F46E5' }}>{supplier.name}</strong>
                                        </td>
                                        <td>{supplier.phoneNumber || '-'}</td>
                                        <td>{supplier.address || '-'}</td>
                                        <td>{supplier.notes || '-'}</td>
                                        <td className="text-right" onClick={e => e.stopPropagation()}>
                                            <Link to={`/dashboard/supplier/edit/${supplier._id}`}>
                                                <Button size="sm" color="light" className="mr-2">
                                                    <i className="fa fa-edit text-primary"></i>
                                                </Button>
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                                {error && (
                                    <tr>
                                        <td colSpan="5" className="text-center py-5">
                                            <p className="text-danger mb-0">{error}</p>
                                        </td>
                                    </tr>
                                )}
                                {suppliers.length === 0 && !isLoading && !error && (
                                    <tr>
                                        <td colSpan="5" className="text-center py-5">
                                            <p className="text-muted mb-0">No suppliers found.</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </Table>
                    </CardBody>
                </Card>
            </div>
        );
    }
}

export default SupplierList;
