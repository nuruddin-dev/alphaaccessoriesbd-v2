/*
 *
 * Edit
 *
 */

import React from 'react';

import { connect } from 'react-redux';

import actions from '../../actions';

import EditAddress from '../../components/Manager/EditAddress';
import SubPage from '../../components/Manager/SubPage';
import NotFound from '../../components/Common/NotFound';

class Edit extends React.PureComponent {
  componentDidMount() {
    const addressId = this.props.match.params.id;
    this.props.fetchAddress(addressId);
    this.props.fetchAddresses();
  }

  componentDidUpdate(prevProps) {
    if (this.props.match.params.id !== prevProps.match.params.id) {
      const addressId = this.props.match.params.id;
      this.props.fetchAddress(addressId);
    }
  }

  render() {
    const {
      history,
      address,
      formErrors,
      addressEditChange,
      defaultChange,
      updateAddress,
      deleteAddress,
      updateDefaultAddress,
      addressFormData,
      addresses,
      user,
      updateDeliveryAddress
    } = this.props;

    return (
      <SubPage
        title='Edit Address'
        actionTitle='Cancel'
        handleAction={() => history.goBack()}
      >
        {address?._id ? (
          <EditAddress
            address={address}
            addressChange={addressEditChange}
            formErrors={formErrors}
            updateAddress={updateAddress}
            deleteAddress={deleteAddress}
            defaultChange={defaultChange}
            updateDefaultAddress={updateDefaultAddress}
            addressFormData={addressFormData}
            addresses={addresses}
            user={user}
            updateDeliveryAddress={updateDeliveryAddress}
          />
        ) : (
          <NotFound message='No address found.' />
        )}
      </SubPage>
    );
  }
}

const mapStateToProps = state => {
  return {
    address: state.address.address,
    formErrors: state.address.editFormErrors,
    addressFormData: state.address.addressFormData,
    addresses: state.address.addresses,
    user: state.account.user
  };
};

export default connect(mapStateToProps, actions)(Edit);
