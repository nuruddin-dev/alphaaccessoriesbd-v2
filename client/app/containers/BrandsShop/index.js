/**
 *
 * BrandsShop
 *
 */

import React from 'react';
import { connect } from 'react-redux';

import actions from '../../actions';

import ProductList from '../../components/Store/ProductList';
import NotFound from '../../components/Common/NotFound';
import LoadingIndicator from '../../components/Common/LoadingIndicator';

class BrandsShop extends React.PureComponent {
  componentDidMount() {
    const slug = this.props.match.params.slug;
    this.props.fetchBrandProducts(slug);
  }

  componentDidUpdate(prevProps) {
    if (this.props.match.params.slug !== prevProps.match.params.slug) {
      const slug = this.props.match.params.slug;
      this.props.fetchBrandProducts(slug);
    }
  }

  render() {
    const { products, isLoading, authenticated, updateWishlist } = this.props;

    return (
      <div className='brands-shop'>
        <div>
          <p className='font-weight-bolder m-3'>
            Products in Brand:{' '}
            {convertToTitleCase(this.props.match.params.slug)}
          </p>
          <p>{}</p>
        </div>
        {isLoading ? (
          <LoadingIndicator />
        ) : products.length > 0 ? (
          <ProductList
            products={products}
            authenticated={authenticated}
            updateWishlist={updateWishlist}
          />
        ) : (
          <NotFound message='No products found.' />
        )}
      </div>
    );
  }
}

function convertToTitleCase(str) {
  return str
    .split('-') // Split the string at each hyphen
    .map(word => word.charAt(0).toUpperCase() + word.slice(1)) // Capitalize the first letter of each word
    .join(' '); // Join the words back with a space
}

const mapStateToProps = state => {
  return {
    products: state.product.storeProducts,
    isLoading: state.product.isLoading,
    authenticated: state.authentication.authenticated
  };
};

export default connect(mapStateToProps, actions)(BrandsShop);
