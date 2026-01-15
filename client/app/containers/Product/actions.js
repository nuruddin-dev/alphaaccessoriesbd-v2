/*
 *
 * Product actions
 *
 */

import { goBack } from 'connected-react-router';
import { success } from 'react-notification-system-redux';
import axios from 'axios';

import {
  FETCH_PRODUCTS,
  FETCH_STOREFRONT_PRODUCTS,
  FETCH_STORE_PRODUCTS,
  FETCH_PRODUCT,
  FETCH_STORE_PRODUCT,
  PRODUCT_CHANGE,
  PRODUCT_EDIT_CHANGE,
  PRODUCT_SHOP_CHANGE,
  SET_PRODUCT_FORM_ERRORS,
  SET_PRODUCT_FORM_EDIT_ERRORS,
  RESET_PRODUCT,
  RESET_PRODUCT_SHOP,
  ADD_PRODUCT,
  REMOVE_PRODUCT,
  FETCH_PRODUCTS_SELECT,
  SET_PRODUCTS_LOADING,
  SET_ADVANCED_FILTERS,
  RESET_ADVANCED_FILTERS,
  UPDATE_PRODUCT_SUCCESS
} from './constants';

import { API_URL, ROLES } from '../../constants';
import handleError from '../../utils/error';
import { formatSelectOptions, unformatSelectOptions } from '../../utils/select';
import { allFieldsValidation } from '../../utils/validation';
import { stringify } from 'querystring';

export const productChange = (name, value) => {
  let formData = {};
  formData[name] = value;
  return {
    type: PRODUCT_CHANGE,
    payload: formData
  };
};

export const productEditChange = (name, value) => {
  let formData = {};
  formData[name] = value;

  return {
    type: PRODUCT_EDIT_CHANGE,
    payload: formData
  };
};

export const productShopChange = (name, value) => {
  let formData = {};
  formData[name] = value;

  return {
    type: PRODUCT_SHOP_CHANGE,
    payload: formData
  };
};

export const resetProduct = () => {
  return async (dispatch, getState) => {
    dispatch({ type: RESET_PRODUCT });
  };
};

export const resetProductShop = () => {
  return async (dispatch, getState) => {
    dispatch({ type: RESET_PRODUCT_SHOP });
  };
};

export const setProductLoading = value => {
  return {
    type: SET_PRODUCTS_LOADING,
    payload: value
  };
};

// fetch store products by filterProducts api
export const filterProducts = (n, v) => {
  return async (dispatch, getState) => {
    try {
      n ?? dispatch({ type: RESET_ADVANCED_FILTERS });
      dispatch(setProductLoading(true));
      const advancedFilters = getState().product.advancedFilters;
      let payload = productsFilterOrganizer(n, v, advancedFilters);
      dispatch({ type: SET_ADVANCED_FILTERS, payload });
      const sortOrder = getSortOrder(payload.order);
      payload = { ...payload, sortOrder };

      const response = await axios.get(`${API_URL}/product/list`, {
        params: {
          ...payload
        }
      });

      const { products, totalPages, currentPage, count } = response.data;

      dispatch({
        type: FETCH_STORE_PRODUCTS,
        payload: products
      });

      const newPayload = {
        ...payload,
        totalPages,
        currentPage,
        count
      };
      dispatch({
        type: SET_ADVANCED_FILTERS,
        payload: newPayload
      });
    } catch (error) {
      handleError(error, dispatch);
    } finally {
      dispatch(setProductLoading(false));
    }
  };
};

// fetch store product api
export const fetchStoreProduct = slug => {
  return async (dispatch, getState) => {
    dispatch(setProductLoading(true));

    try {
      const response = await axios.get(`${API_URL}/product/item/${slug}`);

      const inventory = response.data.product.quantity;
      const product = { ...response.data.product, inventory };

      dispatch({
        type: FETCH_STORE_PRODUCT,
        payload: product
      });
    } catch (error) {
      handleError(error, dispatch);
    } finally {
      dispatch(setProductLoading(false));
    }
  };
};

export const fetchBrandProducts = slug => {
  return async (dispatch, getState) => {
    try {
      dispatch(setProductLoading(true));

      const response = await axios.get(`${API_URL}/product/list/brand/${slug}`);

      const s = getState().product.advancedFilters;
      dispatch({
        type: SET_ADVANCED_FILTERS,
        payload: Object.assign(s, {
          pages: response.data.pages,
          pageNumber: response.data.page,
          totalProducts: response.data.totalProducts
        })
      });
      dispatch({
        type: FETCH_STORE_PRODUCTS,
        payload: response.data.products
      });
    } catch (error) {
      handleError(error, dispatch);
    } finally {
      dispatch(setProductLoading(false));
    }
  };
};

export const fetchTagProducts = slug => {
  return async (dispatch, getState) => {
    try {
      dispatch(setProductLoading(true));

      const response = await axios.get(`${API_URL}/product/list/tag/${slug}`);

      const s = getState().product.advancedFilters;
      dispatch({
        type: SET_ADVANCED_FILTERS,
        payload: Object.assign(s, {
          pages: response.data.pages,
          pageNumber: response.data.page,
          totalProducts: response.data.totalProducts
        })
      });
      dispatch({
        type: FETCH_STORE_PRODUCTS,
        payload: response.data.products
      });
    } catch (error) {
      handleError(error, dispatch);
    } finally {
      dispatch(setProductLoading(false));
    }
  };
};

export const fetchCategoryProducts = slug => {
  return async (dispatch, getState) => {
    try {
      dispatch(setProductLoading(true));

      const response = await axios.get(
        `${API_URL}/product/list/category/${slug}`
      );

      const s = getState().product.advancedFilters;
      dispatch({
        type: SET_ADVANCED_FILTERS,
        payload: Object.assign(s, {
          pages: response.data.pages,
          pageNumber: response.data.page,
          totalProducts: response.data.totalProducts
        })
      });
      dispatch({
        type: FETCH_STORE_PRODUCTS,
        payload: response.data.products
      });
    } catch (error) {
      handleError(error, dispatch);
    } finally {
      dispatch(setProductLoading(false));
    }
  };
};

export const fetchProductsSelect = () => {
  return async (dispatch, getState) => {
    try {
      const response = await axios.get(`${API_URL}/product/list/select`);

      const formattedProducts = formatSelectOptions(response.data.products);

      dispatch({
        type: FETCH_PRODUCTS_SELECT,
        payload: formattedProducts
      });
    } catch (error) {
      handleError(error, dispatch);
    }
  };
};

// fetch products api
export const fetchStorefrontProducts = () => {
  return async (dispatch, getState) => {
    try {
      dispatch(setProductLoading(true));

      const response = await axios.get(`${API_URL}/product/storefront`);

      dispatch({
        type: FETCH_STOREFRONT_PRODUCTS,
        payload: response.data
      });
    } catch (error) {
      handleError(error, dispatch);
    } finally {
      dispatch(setProductLoading(false));
    }
  };
};

// fetch products api
export const fetchProducts = (limit = 2000, isActive = '') => {
  return async (dispatch, getState) => {
    try {
      dispatch(setProductLoading(true));

      const response = await axios.get(`${API_URL}/product?limit=${limit}&isActive=${isActive}`);

      dispatch({
        type: FETCH_PRODUCTS,
        payload: response.data.products
      });
    } catch (error) {
      handleError(error, dispatch);
    } finally {
      dispatch(setProductLoading(false));
    }
  };
};

// fetch product api
export const fetchProduct = id => {
  return async (dispatch, getState) => {
    try {
      const response = await axios.get(`${API_URL}/product/${id}`);

      const inventory = response.data.product.quantity;

      const brand = response.data.product.brand;
      const isBrand = brand ? true : false;
      const brandData = formatSelectOptions(
        isBrand && [brand],
        !isBrand,
        'fetchProduct'
      );

      const category = response.data.product.category;
      const isCategory = category ? true : false;
      const categoryData = formatSelectOptions(
        isCategory && [category],
        !isCategory,
        'fetchProduct'
      );

      const tag = response.data.product.tag;
      const isTag = tag ? true : false;
      const tagData = formatSelectOptions(
        isTag && [tag],
        !isTag,
        'fetchProduct'
      );

      response.data.product.brand = brandData[0];
      response.data.product.tag = tagData[0];
      response.data.product.category = categoryData[0];

      const product = { ...response.data.product, inventory };

      dispatch({
        type: FETCH_PRODUCT,
        payload: product
      });
    } catch (error) {
      handleError(error, dispatch);
    }
  };
};

// add product api
export const addProduct = () => {
  return async (dispatch, getState) => {
    try {
      const rules = {
        shortName: 'required'
        // All other fields are optional - will use defaults if not provided
      };

      const product = getState().product.productFormData;
      const user = getState().account.user;
      const brands = getState().brand.brandsSelect;
      const categories = getState().category.categoriesSelect;
      const tags = product.tags || [];
      const brand = product.brand ? unformatSelectOptions([product.brand]) : null;
      const category = product.category ? unformatSelectOptions([product.category]) : null;

      // Generate SKU if not provided
      const generatedSku = product.sku || `${product.shortName.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}`;

      const newProduct = {
        sku: generatedSku,
        name: product.name || product.shortName, // Default to shortName if name not provided
        shortName: product.shortName,
        description: product.description || '', // Default to empty string
        price: product.price || 0, // Default to 0
        buyingPrice: product.buyingPrice || 0, // Default to 0
        wholeSellPrice: product.wholeSellPrice || 0, // Default to 0
        quantity: product.quantity || 0, // Default to 0
        image: product.image,
        isActive: product.isActive !== undefined ? product.isActive : false, // Default to false
        popular: product.popular?.value !== undefined ? product.popular.value : 0, // Default to No
        premium: product.premium?.value !== undefined ? product.premium.value : 0, // Default to No
        brand:
          user.role !== ROLES.Merchant
            ? brand != 0
              ? brand
              : null
            : brands[1]?.value || null,
        tags: tags.length > 0 ? [tags.map(tag => tag.value)] : [[]],
        category:
          user.role !== ROLES.Merchant
            ? category != 0
              ? category
              : null
            : categories[1]?.value || null,
        colors: product.colors?.length > 0 ? [...new Set(product.colors.map(color => color.label))] : [],
        imageUrl: product.imageUrl || '',
        imageAlt: product.imageAlt || '',
        metaTitle: product.metaTitle || '',
        metaDescription: product.metaDescription || '',
        fullDescription: product.fullDescription || '',
        specification: product.specification || '',
        note: product.note || '',
        history: []
      };

      const { isValid, errors } = allFieldsValidation(newProduct, rules, {
        'required.shortName': 'Short name is required.'
      });

      if (!isValid) {
        return dispatch({ type: SET_PRODUCT_FORM_ERRORS, payload: errors });
      }

      const formData = new FormData();

      for (const key in newProduct) {
        if (newProduct.hasOwnProperty(key)) {
          // Skip null brand and category
          if ((key === 'brand' || key === 'category') && newProduct[key] === null) {
            continue;
          } else if (
            typeof newProduct[key] === 'object' &&
            !(newProduct[key] instanceof File)
          ) {
            formData.set(key, JSON.stringify(newProduct[key])); // Convert objects/arrays to JSON strings
          } else {
            formData.set(key, newProduct[key]);
          }
        }
      }

      const response = await axios.post(`${API_URL}/product/add`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      const successfulOptions = {
        title: response.data.message || 'Updated successfully',
        position: 'tr',
        autoDismiss: 1
      };

      if (response.data.success === true) {
        dispatch(success(successfulOptions));
        dispatch({
          type: ADD_PRODUCT,
          payload: response.data.product
        });
        dispatch(resetProduct());
        dispatch(goBack());
      }
    } catch (error) {
      handleError(error, dispatch);
    }
  };
};



export const updateProductDetails = (id, productData) => {
  return async (dispatch, getState) => {
    try {
      const response = await axios.put(`${API_URL}/product/${id}`, {
        product: productData
      });

      const successfulOptions = {
        title: response.data.message || 'Updated successfully',
        position: 'tr',
        autoDismiss: 1
      };

      if (response.data.success === true) {
        dispatch(success(successfulOptions));
        dispatch({
          type: UPDATE_PRODUCT_SUCCESS,
          payload: response.data.product
        });
      }
    } catch (error) {
      handleError(error, dispatch);
    }
  };
};

// update Product api
export const updateProduct = () => {
  return async (dispatch, getState) => {
    try {
      const rules = {
        name: 'required',
        shortName: 'required',
        sku: 'required|alpha_dash',
        slug: 'required|alpha_dash',
        quantity: 'required|numeric',
        price: 'required|numeric',
        buyingPrice: 'required|numeric', // Validation for Buying Price
        wholeSellPrice: 'required|numeric', // Validation for Whole Sell Price
        popular: 'required',
        premium: 'required',
        brand: 'required',
        category: 'required',
        colors: 'required',
        tags: 'required',
        imageUrl: 'required'
      };

      const product = getState().product.product;
      const user = getState().account.user;
      const brand = unformatSelectOptions([product.brand]);
      const category = unformatSelectOptions([product.category]);

      // Prepare the updated product object
      const newProduct = {
        name: product.name,
        shortName: product.shortName,
        sku: product.sku,
        slug: product.slug,
        description: product.description,
        quantity: product.quantity,
        previousPrice: product.previousPrice,
        price: product.price,
        buyingPrice: product.buyingPrice, // Include Buying Price
        wholeSellPrice: product.wholeSellPrice, // Include Whole Sell Price
        popular: product.popular,
        premium: product.premium,
        brand: brand != 0 ? brand : null,
        tags: [
          ...new Set(
            product.tags.map(tag => (typeof tag === 'string' ? tag : tag.value))
          )
        ],
        category: category,
        colors: [
          ...new Set(
            product.colors.map(color =>
              typeof color === 'string' ? color : color.label
            )
          )
        ],
        imageUrl: product.imageUrl,
        imageAlt: product.imageAlt,
        metaTitle: product.metaTitle,
        metaDescription: product.metaDescription,
        fullDescription: product.fullDescription,
        specification: product.specification,
        note: product.note // Include Note
      };

      // Add history entry for changes
      // const changes = {};
      // Object.keys(newProduct).forEach(key => {
      //   if (product[key] !== newProduct[key]) {
      //     changes[key] = {
      //       previous: product[key], // Previous value
      //       new: newProduct[key] // New value
      //     };
      //   }
      // });

      // if (Object.keys(changes).length > 0) {
      //   newProduct.history = [
      //     ...(product.history || []), // Keep existing history
      //     {
      //       updatedAt: new Date(),
      //       updatedBy: user._id, // User who made the update
      //       changes,
      //       note: product.note || '' // Add note to history
      //     }
      //   ];
      // }

      const { isValid, errors } = allFieldsValidation(newProduct, rules, {
        'required.name': 'Name is required.',
        'required.shortName': 'Short name is required.',
        'required.sku': 'Sku is required.',
        'alpha_dash.sku':
          'Sku may have alpha-numeric characters, as well as dashes and underscores only.',
        'required.slug': 'Slug is required.',
        'alpha_dash.slug':
          'Slug may have alpha-numeric characters, as well as dashes and underscores only.',
        'required.description': 'Description is required.',
        'required.quantity': 'Quantity is required.',
        'required.price': 'Price is required.',
        'required.buyingPrice': 'Buying Price is required.', // Error message for Buying Price
        'required.wholeSellPrice': 'Whole Sell Price is required.', // Error message for Whole Sell Price
        'required.popular': 'Popular is required.',
        'required.premium': 'Premium is required.',
        'required.brand': 'Brand is required.',
        'required.category': 'Category is required.',
        'required.colors': 'Colors are required.',
        'required.tags': 'Tags are required.',
        'required.imageUrl': 'Image URL is required.'
      });

      if (!isValid) {
        return dispatch({
          type: SET_PRODUCT_FORM_EDIT_ERRORS,
          payload: errors
        });
      }

      // Send the updated product to the server
      const response = await axios.put(`${API_URL}/product/${product._id}`, {
        product: newProduct
      });

      const successfulOptions = {
        title: response.data.message || 'Updated successfully',
        position: 'tr',
        autoDismiss: 1
      };

      if (response.data.success === true) {
        dispatch(success(successfulOptions));
        // Optionally navigate back or refresh the product list
      }
    } catch (error) {
      handleError(error, dispatch);
    }
  };
};

// activate product api
export const activateProduct = (id, value) => {
  return async (dispatch, getState) => {
    try {
      const response = await axios.put(`${API_URL}/product/${id}/active`, {
        product: {
          isActive: value
        }
      });

      const successfulOptions = {
        title: response.data.message || 'Updated successfully',
        position: 'tr',
        autoDismiss: 1
      };

      if (response.data.success === true) {
        dispatch(success(successfulOptions));
      }
    } catch (error) {
      handleError(error, dispatch);
    }
  };
};

// delete product api
export const deleteProduct = id => {
  return async (dispatch, getState) => {
    try {
      const response = await axios.delete(`${API_URL}/product/delete/${id}`);

      const successfulOptions = {
        title: response.data.message || 'Updated successfully',
        position: 'tr',
        autoDismiss: 1
      };

      if (response.data.success === true) {
        dispatch(success(successfulOptions));
        dispatch({
          type: REMOVE_PRODUCT,
          payload: id
        });
        dispatch(goBack());
      }
    } catch (error) {
      handleError(error, dispatch);
    }
  };
};

const productsFilterOrganizer = (n, v, s) => {
  switch (n) {
    case 'category':
      return {
        name: s.name,
        category: v,
        brand: s.brand,
        min: s.min,
        max: s.max,
        rating: s.rating,
        order: s.order,
        page: s.currentPage,
        limit: s.limit
      };
    case 'brand':
      return {
        name: s.name,
        category: s.category,
        brand: v,
        min: s.min,
        max: s.max,
        rating: s.rating,
        order: s.order,
        page: s.currentPage,
        limit: s.limit
      };
    case 'sorting':
      return {
        name: s.name,
        category: s.category,
        brand: s.brand,
        min: s.min,
        max: s.max,
        rating: s.rating,
        order: v,
        page: s.currentPage,
        limit: s.limit
      };
    case 'price':
      return {
        name: s.name,
        category: s.category,
        brand: s.brand,
        min: v[0],
        max: v[1],
        rating: s.rating,
        order: s.order,
        page: s.currentPage,
        limit: s.limit
      };
    case 'rating':
      return {
        name: s.name,
        category: s.category,
        brand: s.brand,
        min: s.min,
        max: s.max,
        rating: v,
        order: s.order,
        page: s.currentPage,
        limit: s.limit
      };
    case 'pagination':
      return {
        name: s.name,
        category: s.category,
        brand: s.brand,
        min: s.min,
        max: s.max,
        rating: s.rating,
        order: s.order,
        page: v ?? s.currentPage,
        limit: s.limit
      };
    default:
      return {
        name: s.name,
        category: s.category,
        brand: s.brand,
        min: s.min,
        max: s.max,
        rating: s.rating,
        order: s.order,
        page: s.currentPage,
        limit: s.limit
      };
  }
};

const getSortOrder = value => {
  let sortOrder = {};
  switch (value) {
    case 0:
      sortOrder._id = -1;
      break;
    case 1:
      sortOrder.price = -1;
      break;
    case 2:
      sortOrder.price = 1;
      break;

    default:
      break;
  }

  return sortOrder;
};
