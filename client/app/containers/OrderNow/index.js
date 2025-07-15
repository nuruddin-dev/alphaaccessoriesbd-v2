/*
 *
 * OrderNow
 *
 */

import React from 'react';

import { connect } from 'react-redux';
import { Switch, Route } from 'react-router-dom';

import { ROLES } from '../../constants';
import actions from '../../actions';
import List from './List';
import Page404 from '../../components/Common/Page404';

class OrderNow extends React.PureComponent {
  render() {
    const { user } = this.props;

    return (
      <div className='product-dashboard'>
        <Switch>
          {/* {user.role === ROLES.Admin && (
            <Route exact path='/dashboard/orderNows/admin' component={List} />
          )} */}
          <Route exact path='/dashboard/orderNows' component={List} />
          <Route path='*' component={Page404} />
        </Switch>
      </div>
    );
  }
}

const mapStateToProps = state => {
  return {
    user: state.account.user
  };
};

export default connect(mapStateToProps, actions)(OrderNow);
