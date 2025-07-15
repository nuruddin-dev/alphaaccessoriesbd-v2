/*
 *
 * List
 *
 */

import React from 'react';

import { connect } from 'react-redux';

import actions from '../../actions';

import AddressList from '../../components/Manager/AddressList';
import SubPage from '../../components/Manager/SubPage';
import NotFound from '../../components/Common/NotFound';

class List extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      refreshed: false // Track whether the window has been refreshed
    };
  }
  componentDidMount() {
    this.props.fetchAddresses();
  }

  // Function to handle refreshing the window
  refreshWindow = () => {
    window.location.reload();
  };

  render() {
    const { history, addresses, user } = this.props;

    return (
      <>
        <SubPage
          title='Addresses'
          actionTitle={'Add'}
          handleAction={() => history.push('/dashboard/address/add')}
        >
          {addresses.length > 0 ? (
            <AddressList addresses={addresses} />
          ) : (
            <NotFound message='No addresses found.' />
          )}
        </SubPage>
      </>
    );
  }
}

const mapStateToProps = state => {
  return {
    addresses: state.address.addresses,
    user: state.account.user
  };
};

export default connect(mapStateToProps, actions)(List);
