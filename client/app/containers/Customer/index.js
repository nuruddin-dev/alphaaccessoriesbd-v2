/*
 *
 * Customer
 *
 */

import React from 'react';

import { connect } from 'react-redux';
import { Switch, Route } from 'react-router-dom';

import actions from '../../actions';

// import { ROLES } from '../../constants';
import List from './List';
import Add from './Add';
import Edit from './Edit';
import Page404 from '../../components/Common/Page404';

class Customer extends React.PureComponent {
  render() {
    const { user } = this.props;

    console.log('user: ', user);

    return (
      <div className='product-dashboard'>
        <Switch>
          <Route exact path='/dashboard/customer' component={List} />
          <Route exact path='/dashboard/customer/edit/:id' component={Edit} />
          {/* {user.role === ROLES.Admin && ( */}
          <Route exact path='/dashboard/customer/add' component={Add} />
          {/* )} */}
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

export default connect(mapStateToProps, actions)(Customer);
