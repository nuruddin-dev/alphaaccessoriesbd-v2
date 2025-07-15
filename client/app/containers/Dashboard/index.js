/**
 *
 * Dashboard
 *
 */

import React from 'react';

import { connect } from 'react-redux';

import actions from '../../actions';
import { ROLES } from '../../constants';
import dashboardLinks from './links.json';
import { isDisabledMerchantAccount } from '../../utils/app';
import Admin from '../../components/Manager/Dashboard/Admin';
import Merchant from '../../components/Manager/Dashboard/Merchant';
import Customer from '../../components/Manager/Dashboard/Customer';
import DisabledMerchantAccount from '../../components/Manager/DisabledAccount/Merchant';
import LoadingIndicator from '../../components/Common/LoadingIndicator';
import { ORDER_STATUS } from '../../constants';

class Dashboard extends React.PureComponent {
  componentDidMount() {
    const { user } = this.props;
    this.props.fetchProfile();
    if (user.role === ROLES.Admin) {
      this.props.fetchOrderNows();
    }
  }

  render() {
    const { user, isLoading, isMenuOpen, toggleDashboardMenu, orderNows } =
      this.props;

    var orderNowsCount = 0;

    if (isDisabledMerchantAccount(user))
      return <DisabledMerchantAccount user={user} />;
    {
      orderNowsCount =
        orderNows === undefined
          ? null
          : Object.keys(orderNows).filter(
              key =>
                !isNaN(key) && orderNows[key].status === ORDER_STATUS.Pending
            ).length;
    }
    return (
      <>
        {isLoading ? (
          <LoadingIndicator inline />
        ) : user.role === ROLES.Admin ? (
          <Admin
            user={user}
            isMenuOpen={isMenuOpen}
            links={dashboardLinks[ROLES.Admin]}
            toggleMenu={toggleDashboardMenu}
            // ordersCount={orders.length}
            orderNowsCount={orderNowsCount}
          />
        ) : user.role === ROLES.Merchant && user.merchant ? (
          <Merchant
            user={user}
            isMenuOpen={isMenuOpen}
            links={dashboardLinks[ROLES.Merchant]}
            toggleMenu={toggleDashboardMenu}
          />
        ) : (
          <Customer
            user={user}
            isMenuOpen={isMenuOpen}
            links={dashboardLinks[ROLES.Member]}
            toggleMenu={toggleDashboardMenu}
          />
        )}
      </>
    );
  }
}

const mapStateToProps = state => {
  return {
    user: state.account.user,
    isLoading: state.account.isLoading,
    isMenuOpen: state.dashboard.isMenuOpen,
    orderNows: state.orderNow.orders
  };
};

export default connect(mapStateToProps, actions)(Dashboard);
