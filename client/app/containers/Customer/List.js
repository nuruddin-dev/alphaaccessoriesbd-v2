/*
 *
 * List
 *
 */

import React from 'react';

import { connect } from 'react-redux';
import { success, error, warning } from 'react-notification-system-redux';

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
      const response = await axios.get(`${API_URL}/payment/check-ledger-discrepancies?ts=${Date.now()}`);
      const { discrepancies } = response.data;
      if (discrepancies.length > 0) {
        this.setState({ discrepancies, isDiscrepancyModalOpen: true });
      } else {
        this.props.success({ title: 'No discrepancies found. All customer balances match the ledger.', position: 'tr', autoDismiss: 3 });
      }
    } catch (error) {
      this.props.error({ title: 'Failed to check discrepancies: ' + (error.response ? err.response.data.error : err.message), position: 'tr', autoDismiss: 5 });
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
        <div className="d-flex justify-content-between align-items-center" style={{ background: '#fff', padding: '10px 20px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', marginBottom: '20px' }}>
          <div className="d-flex align-items-center">
            <div style={{
              width: '4px',
              height: '24px',
              background: '#06b6d4',
              borderRadius: '2px',
              marginRight: '12px'
            }}></div>
            <h2 className="mb-0 mr-4" style={{
              fontWeight: '700',
              color: '#1e293b',
              fontSize: '20px',
              letterSpacing: '-0.5px'
            }}>
              Customer Management
            </h2>
            <span className="badge badge-light border" style={{ fontSize: '13px', padding: '8px 15px', color: '#dc3545', borderRadius: '20px' }}>
              Due: ৳{totalDue.toLocaleString()}
            </span>
          </div>
          <div className="d-flex align-items-center">
            <button
              className="btn-neon btn-neon--cyan mr-2"
              onClick={this.handleCheckDiscrepancies}
              disabled={isChecking}
              style={{ color: '#ef4444', backgroundColor: 'rgba(239, 68, 68, 0.1)', borderColor: 'rgba(239, 68, 68, 0.3)' }}
            >
              <i className="fa fa-search mr-1"></i> {isChecking ? 'Checking...' : 'Check Ledger'}
            </button>
            <button
              className="btn-neon btn-neon--cyan"
              onClick={() => history.push('/dashboard/customer/add')}
            >
              <i className="fa fa-plus-circle mr-1"></i> Add Customer
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm overflow-hidden" style={{ border: '1px solid #f1f5f9' }}>
          <CustomerList customers={customers} history={history} />
        </div>

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

const mapStateToProps = state => ({
  customers: state.customer.customers,
  isLoading: state.customer.isLoading,
  user: state.account.user
});

const mapDispatchToProps = dispatch => ({
  ...actions(dispatch),
  success: opts => dispatch(success(opts)),
  error: opts => dispatch(error(opts)),
  warning: opts => dispatch(warning(opts)),
  dispatch
});

export default connect(mapStateToProps, mapDispatchToProps)(List);
