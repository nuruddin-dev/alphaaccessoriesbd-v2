/*
 *
 * List
 *
 */

import React from 'react';

import { connect } from 'react-redux';

import actions from '../../actions';

import ProductList from '../../components/Manager/ProductList';
import SubPage from '../../components/Manager/SubPage';
import LoadingIndicator from '../../components/Common/LoadingIndicator';
import NotFound from '../../components/Common/NotFound';

class List extends React.PureComponent {
  componentDidMount() {
    this.props.fetchProducts();
  }

  render() {
    const { history, products, isLoading } = this.props;

    return (
      <SubPage
        title='Products'
        actionComponent={(
          <button
            className="btn-neon btn-neon--cyan"
            onClick={() => history.push('/dashboard/product/add')}
          >
            <i className="fa fa-plus-circle"></i> Add Product
          </button>
        )}
      >
        <div className="bg-white rounded shadow-sm p-3">
          {isLoading ? (
            <LoadingIndicator inline />
          ) : products.length > 0 ? (
            <ProductList
              products={products}
              updateProductDetails={this.props.updateProductDetails}
            />
          ) : (
            <NotFound message='No products found.' />
          )}
        </div>
      </SubPage>
    );
  }
}

const mapStateToProps = state => {
  return {
    products: state.product.products,
    isLoading: state.product.isLoading,
    user: state.account.user
  };
};

export default connect(mapStateToProps, actions)(List);
