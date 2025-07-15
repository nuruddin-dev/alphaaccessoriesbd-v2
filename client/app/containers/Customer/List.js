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

class List extends React.PureComponent {
  componentDidMount() {
    this.props.fetchCustomers();
    console.log('props.customers in customer list ', this.props.customers);
  }
  componentDidUpdate(prevProps) {
    if (prevProps.customers !== this.props.customers) {
      console.log('Updated props.customers:', this.props.customers); // Debugging line
    }
  }

  render() {
    const { history, customers, isLoading } = this.props;

    console.log('customers in list render: ', customers); // Debugging line

    return (
      <>
        <SubPage
          title='Customers'
          actionTitle='Add'
          handleAction={() => history.push('/dashboard/customer/add')}
        >
          <CustomerList customers={customers} />
          {/* {isLoading ? (
            <LoadingIndicator inline />
          ) : customers.length > 0 ? (
            <CustomerList customers={customers} />
          ) : (
            <NotFound message='No customers found.' />
          )} */}
        </SubPage>
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
