/*
 *
 * List
 *
 */

import React from 'react';

import { connect } from 'react-redux';

import actions from '../../actions';

import CustomerList from '../../components/Manager/CustomerList';
import SubPage from '../../components/Manager/SubPage';
import LoadingIndicator from '../../components/Common/LoadingIndicator';
import NotFound from '../../components/Common/NotFound';
import axios from 'axios';
import { API_URL } from '../../constants';
import Button from '../../components/Common/Button';
import { Modal, ModalHeader, ModalBody, ModalFooter, Table } from 'reactstrap';

class List extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      discrepancies: [],
      isDiscrepancyModalOpen: false,
      isChecking: false
    };
  }

  componentDidMount() {
    this.props.fetchCustomers();
    console.log('props.customers in customer list ', this.props.customers);
  }
  componentDidUpdate(prevProps) {
    if (prevProps.customers !== this.props.customers) {
      console.log('Updated props.customers:', this.props.customers); // Debugging line
    }
  }

  handleCheckDiscrepancies = async () => {
    this.setState({ isChecking: true });
    try {
      const response = await axios.get(`${API_URL}/payment/check-ledger-discrepancies`);
      const { discrepancies } = response.data;
      if (discrepancies.length > 0) {
        this.setState({ discrepancies, isDiscrepancyModalOpen: true });
      } else {
        alert('No discrepancies found. All customer balances match the ledger.');
      }
    } catch (error) {
      alert('Failed to check discrepancies: ' + (error.response ? error.response.data.error : error.message));
    } finally {
      this.setState({ isChecking: false });
    }
  }

  toggleDiscrepancyModal = () => {
    this.setState(prevState => ({ isDiscrepancyModalOpen: !prevState.isDiscrepancyModalOpen }));
  }

  render() {
    const { history, customers, isLoading } = this.props;

    console.log('customers in list render: ', customers); // Debugging line

    const { isChecking, discrepancies, isDiscrepancyModalOpen } = this.state;

    const checkButton = (
      <Button
        variant='danger'
        size='sm'
        text={isChecking ? 'Checking...' : 'Check Ledger'}
        disabled={isChecking}
        onClick={this.handleCheckDiscrepancies}
        className='mr-2'
      />
    );

    const totalDue = customers.reduce((sum, c) => sum + (c.due || 0), 0);

    return (
      <>
        <SubPage
          title={
            <div className="d-flex align-items-center">
              <span>Customers</span>
              <span className="ml-3 badge badge-danger" style={{ fontSize: '14px', padding: '6px 12px' }}>
                Total Due: ৳{totalDue.toLocaleString()}
              </span>
            </div>
          }
          actionTitle='Add'
          handleAction={() => history.push('/dashboard/customer/add')}
          actionComponent={checkButton}
        >
          <CustomerList customers={customers} history={history} />
          {/* {isLoading ? (
            <LoadingIndicator inline />
          ) : customers.length > 0 ? (
            <CustomerList customers={customers} />
          ) : (
            <NotFound message='No customers found.' />
          )} */}
        </SubPage>

        <Modal isOpen={isDiscrepancyModalOpen} toggle={this.toggleDiscrepancyModal} size="lg">
          <ModalHeader toggle={this.toggleDiscrepancyModal} className="text-danger">Ledger Discrepancies Found</ModalHeader>
          <ModalBody>
            <p className="text-danger">The following customers have a mismatch between their stored 'Due' amount and the calculated Ledger Balance. Please investigate.</p>
            <Table striped responsive size="sm">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Phone</th>
                  <th className="text-right">Stored Due</th>
                  <th className="text-right">Calculated Ledger</th>
                  <th className="text-right">Diff</th>
                </tr>
              </thead>
              <tbody>
                {discrepancies.map(d => (
                  <tr key={d._id}>
                    <td>{d.name}</td>
                    <td>{d.phoneNumber}</td>
                    <td className="text-right">Tk {d.storedDue}</td>
                    <td className="text-right">Tk {d.calculatedDue}</td>
                    <td className="text-right text-danger font-weight-bold">Tk {d.difference}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </ModalBody>
          <ModalFooter>
            <Button text="Close" onClick={this.toggleDiscrepancyModal} />
          </ModalFooter>
        </Modal>
      </>
    );
  }
}

const mapStateToProps = state => {
  console.log('Redux state in mapStateToProps:', state); // Debugging line

  return {
    customers: state.customer.customers,
    isLoading: state.customer.isLoading,
    user: state.account.user
  };
};

export default connect(mapStateToProps, actions)(List);
