/*
 *
 * EditCustomer
 *
 */

import React from 'react';

import { connect } from 'react-redux';

import actions from '../../actions';

import EditCustomer from '../../components/Manager/EditCustomer';
import SubPage from '../../components/Manager/SubPage';
import NotFound from '../../components/Common/NotFound';

class Edit extends React.PureComponent {
  componentDidMount() {
    const customerId = this.props.match.params.id;
    this.props.fetchCustomer(customerId);
  }

  componentDidUpdate(prevProps) {
    if (this.props.match.params.id !== prevProps.match.params.id) {
      const customerId = this.props.match.params.id;
      this.props.fetchCustomer(customerId);
    }
  }

  render() {
    const {
      history,
      user,
      customer,
      formErrors,
      customerEditChange,
      updateCustomer,
      deleteCustomer
    } = this.props;

    return (
      <SubPage
        title='Edit Customer'
        actionTitle='Cancel'
        handleAction={history.goBack}
      >
        {customer?._id ? (
          <EditCustomer
            user={user}
            customer={customer}
            formErrors={formErrors}
            customerChange={customerEditChange}
            updateCustomer={updateCustomer}
            deleteCustomer={deleteCustomer}
          />
        ) : (
          <NotFound message='No customer found.' />
        )}
      </SubPage>
    );
  }
}

const mapStateToProps = state => {
  return {
    user: state.account.user,
    customer: state.customer.customer,
    formErrors: state.customer.editFormErrors
  };
};

export default connect(mapStateToProps, actions)(Edit);
