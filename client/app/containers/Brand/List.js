/*
 *
 * List
 *
 */

import React from 'react';

import { connect } from 'react-redux';

import actions from '../../actions';
import { ROLES } from '../../constants';

import BrandList from '../../components/Manager/BrandList';
import SubPage from '../../components/Manager/SubPage';
import LoadingIndicator from '../../components/Common/LoadingIndicator';
import NotFound from '../../components/Common/NotFound';

class List extends React.PureComponent {
  componentDidMount() {
    this.props.fetchBrands();
  }

  render() {
    const { history, brands, isLoading, user } = this.props;

    return (
      <SubPage
        title={user.role === ROLES.Admin ? 'Brands' : 'Brand'}
        actionComponent={user.role === ROLES.Admin && (
          <button
            className="btn-neon btn-neon--cyan"
            onClick={() => history.push('/dashboard/brand/add')}
          >
            <i className="fa fa-plus-circle"></i> Add Brand
          </button>
        )}
      >
        <div className="bg-white rounded shadow-sm p-3">
          {isLoading ? (
            <LoadingIndicator inline />
          ) : brands.length > 0 ? (
            <BrandList brands={brands} user={user} />
          ) : (
            <NotFound message='No brands found.' />
          )}
        </div>
      </SubPage>
    );
  }
}

const mapStateToProps = state => {
  return {
    brands: state.brand.brands,
    isLoading: state.brand.isLoading,
    user: state.account.user
  };
};

export default connect(mapStateToProps, actions)(List);
