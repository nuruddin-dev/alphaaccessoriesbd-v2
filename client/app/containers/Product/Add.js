/*
 *
 * Add
 *
 */

import React from 'react';

import { connect } from 'react-redux';

import actions from '../../actions';

import AddProduct from '../../components/Manager/AddProduct';
import SubPage from '../../components/Manager/SubPage';

class Add extends React.PureComponent {
  componentDidMount() {
    this.props.fetchBrandsSelect();
    this.props.fetchTagsSelect();
    this.props.fetchCategoriesSelect();
    // this.props.fetchStoreCategories();
  }

  render() {
    const {
      history,
      user,
      productFormData,
      formErrors,
      brands,
      tags,
      categories,
      productChange,
      addProduct
    } = this.props;

    return (
      <SubPage
        title='Add Product'
        actionTitle='Cancel'
        handleAction={() => history.goBack()}
      >
        <AddProduct
          user={user}
          productFormData={productFormData}
          formErrors={formErrors}
          brands={brands}
          tags={tags}
          categories={categories}
          productChange={productChange}
          addProduct={addProduct}
        />
      </SubPage>
    );
  }
}

const mapStateToProps = state => {
  return {
    user: state.account.user,
    productFormData: state.product.productFormData,
    formErrors: state.product.formErrors,
    brands: state.brand.brandsSelect,
    tags: state.tag.tagsSelect,
    categories: state.category.categoriesSelect
  };
};

export default connect(mapStateToProps, actions)(Add);
