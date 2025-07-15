/*
 *
 * Tag
 *
 */

import React from 'react';

import { connect } from 'react-redux';
import { Switch, Route } from 'react-router-dom';

import actions from '../../actions';
import { ROLES } from '../../constants';
import List from './List';
import Add from './Add';
import Edit from './Edit';
import Page404 from '../../components/Common/Page404';

class Tag extends React.PureComponent {
  render() {
    const { user } = this.props;

    return (
      <div className='tag-dashboard'>
        <Switch>
          <Route exact path='/dashboard/tag' component={List} />
          <Route exact path='/dashboard/tag/edit/:id' component={Edit} />
          {user.role === ROLES.Admin && (
            <Route exact path='/dashboard/tag/add' component={Add} />
          )}
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

export default connect(mapStateToProps, actions)(Tag);
