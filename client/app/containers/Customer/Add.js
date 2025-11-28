/*
 *
 * AddCustomer
 *
 */

import React from 'react';
import { connect } from 'react-redux';
import actions from '../../actions';

import AddCustomer from '../../components/Manager/AddCustomer';
import SubPage from '../../components/Manager/SubPage';

class AddCustomerPage extends React.PureComponent {
  componentDidMount() {
    // If you need to fetch anything for customer fields, add here
    // Example:
    // this.props.fetchCustomerGroups();
  }

  render() {
    const {
      history,
      user,
      customerFormData,
      formErrors,
      customerChange,
      addCustomer
    } = this.props;

    return (
      <SubPage
        title='Add Customer'
        actionTitle='Cancel'
        handleAction={() => history.goBack()}
      >
        <AddCustomer
          user={user}
          customerFormData={customerFormData}
          formErrors={formErrors}
          customerChange={customerChange}
          addCustomer={addCustomer}
        />
      </SubPage>
    );
  }
}

const mapStateToProps = state => {
  return {
    user: state.account.user,
    customerFormData: state.customer.customerFormData,
    formErrors: state.customer.formErrors
  };
};

export default connect(mapStateToProps, actions)(AddCustomerPage);
