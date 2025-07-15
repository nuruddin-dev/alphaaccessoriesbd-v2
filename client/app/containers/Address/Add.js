/*
 *
 * Add
 *
 */

import React from 'react';

import { connect } from 'react-redux';

import actions from '../../actions';

import AddAddress from '../../components/Manager/AddAddress';
import SubPage from '../../components/Manager/SubPage';

class Add extends React.PureComponent {
  componentDidMount() {
    this.props.fetchAddresses();
  }

  render() {
    const {
      history,
      addressFormData,
      formErrors,
      addressChange,
      addAddress,
      addresses,
      updateDefaultAddress,
      user,
      updateDeliveryAddress
    } = this.props;

    return (
      <SubPage
        title='Add Address'
        actionTitle='Cancel'
        handleAction={() => history.goBack()}
      >
        <AddAddress
          addressFormData={addressFormData}
          formErrors={formErrors}
          addressChange={addressChange}
          addAddress={addAddress}
          addresses={addresses}
          updateDefaultAddress={updateDefaultAddress}
          user={user}
          updateDeliveryAddress={updateDeliveryAddress}
        />
      </SubPage>
    );
  }
}

const mapStateToProps = state => {
  return {
    addressFormData: state.address.addressFormData,
    formErrors: state.address.formErrors,
    addresses: state.address.addresses,
    user: state.account.user
  };
};

export default connect(mapStateToProps, actions)(Add);
