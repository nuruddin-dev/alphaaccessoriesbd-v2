import React from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { Row, Col, Card, CardBody, Button, Table, Badge } from 'reactstrap';
import { API_URL } from '../../constants';

class ImportList extends React.PureComponent {
    state = {
        imports: [],
        isLoading: false,
        error: null
    };

    componentDidMount() {
        this.fetchImports();
    }

    fetchImports = async () => {
        try {
            this.setState({ isLoading: true, error: null });
            const response = await axios.get(`${API_URL}/import`);
            this.setState({ imports: response.data.imports, isLoading: false });
        } catch (error) {
            console.error('Error fetching imports:', error);
            this.setState({
                isLoading: false,
                error: 'Could not load import orders. Please check your connection or login again.'
            });
        }
    };

    render() {
        const { imports, isLoading, error } = this.state;
        const importsList = imports || [];

        return (
            <div className="import-list">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <h3>Import Management</h3>
                    <Link to="/dashboard/import/add">
                        <Button color="primary">Start New Import</Button>
                    </Link>
                </div>

                <Card className="border-0 shadow-sm">
                    <CardBody className="p-0">
                        <Table responsive hover className="mb-0">
                            <thead className="bg-light">
                                <tr>
                                    <th className="border-0">Order #</th>
                                    <th className="border-0">Date</th>
                                    <th className="border-0">Supplier</th>
                                    <th className="border-0">Items</th>
                                    <th className="border-0">Status</th>
                                    <th className="border-0 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {importsList.map(order => (
                                    <tr key={order._id}>
                                        <td>{order.orderNumber}</td>
                                        <td>{new Date(order.orderDate).toLocaleDateString()}</td>
                                        <td>{order.supplier ? order.supplier.name : '-'}</td>
                                        <td>{order.items ? order.items.length : 0}</td>
                                        <td>
                                            <Badge color={order.status === 'Completed' ? 'success' : 'warning'}>
                                                {order.status}
                                            </Badge>
                                        </td>
                                        <td className="text-right">
                                            <Link to={`/dashboard/import/edit/${order._id}`}>
                                                <Button size="sm" color="light" className="mr-2">
                                                    <i className="fa fa-edit text-primary"></i>
                                                </Button>
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                                {error && (
                                    <tr>
                                        <td colSpan="6" className="text-center py-5">
                                            <p className="text-danger mb-0">{error}</p>
                                        </td>
                                    </tr>
                                )}
                                {importsList.length === 0 && !isLoading && !error && (
                                    <tr>
                                        <td colSpan="6" className="text-center py-5">
                                            <p className="text-muted mb-0">No import orders found.</p>
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

export default ImportList;
