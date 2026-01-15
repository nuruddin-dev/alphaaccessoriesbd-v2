/*
 *
 * List
 *
 */

import React from 'react';

import { connect } from 'react-redux';

import actions from '../../actions';

import CategoryList from '../../components/Manager/CategoryList';
import SubPage from '../../components/Manager/SubPage';
import LoadingIndicator from '../../components/Common/LoadingIndicator';
import NotFound from '../../components/Common/NotFound';

class List extends React.PureComponent {
  componentDidMount() {
    this.props.fetchCategories();
  }

  render() {
    const { history, categories, isLoading } = this.props;

    return (
      <SubPage
        title='Categories'
        actionComponent={(
          <button
            className="btn-neon btn-neon--cyan"
            onClick={() => history.push('/dashboard/category/add')}
          >
            <i className="fa fa-plus-circle"></i> Add Category
          </button>
        )}
      >
        <div className="bg-white rounded shadow-sm p-3">
          {isLoading ? (
            <LoadingIndicator inline />
          ) : categories.length > 0 ? (
            <CategoryList categories={categories} />
          ) : (
            <NotFound message='No categories found.' />
          )}
        </div>
      </SubPage>
    );
  }
}

const mapStateToProps = state => {
  return {
    categories: state.category.categories,
    isLoading: state.category.isLoading,
    user: state.account.user
  };
};

export default connect(mapStateToProps, actions)(List);
