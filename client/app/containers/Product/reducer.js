/*
 *
 * Product reducer
 *
 */

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
  SET_PRODUCT_SHOP_FORM_ERRORS,
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

const initialState = {
  products: [],
  storefront: {
    popular: [],
    new: [],
    premium: []
  },
  storeProducts: [],
  product: {
    _id: '',
    buyingPrice: 0, // Added Buying Price
    wholeSellPrice: 0, // Added Whole Sell Price
    history: [] // Added History
  },
  storeProduct: {},
  productsSelect: [],
  productFormData: {
    sku: '',
    name: '',
    shortName: '',
    description: '',
    quantity: 1,
    previousPrice: 1,
    price: 1,
    buyingPrice: 0, // Added Buying Price
    wholeSellPrice: 0, // Added Whole Sell Price
    image: {},
    isActive: true,
    popular: { value: 0, label: 'No' },
    premium: { value: 0, label: 'No' },
    brand: {
      value: 0,
      label: 'Select Brand'
    },
    tag: {
      value: 0,
      label: 'Select Tag'
    },
    category: {
      value: 0,
      label: 'Select Category'
    },
    colors: [],
    image_url: '',
    imageAlt: '',
    metaTitle: '',
    metaDescription: '',
    tags: [],
    note: '', // Added Note
    history: [] // Added History
  },
  isLoading: false,
  productShopData: {
    quantity: 1,
    color: ''
  },
  formErrors: {},
  editFormErrors: {},
  shopFormErrors: {},
  advancedFilters: {
    name: 'all',
    shortName: 'all',
    category: 'all',
    brand: 'all',
    tag: 'all',
    min: 1,
    max: 5000,
    rating: 0,
    order: 0,
    totalPages: 1,
    currentPage: 1,
    count: 0,
    limit: 20
  }
};

const productReducer = (state = initialState, action) => {
  switch (action.type) {
    case FETCH_PRODUCTS:
      return {
        ...state,
        products: action.payload
      };
    case FETCH_STOREFRONT_PRODUCTS:
      return {
        ...state,
        storefront: action.payload
      };
    case FETCH_STORE_PRODUCTS:
      return {
        ...state,
        storeProducts: action.payload
      };
    case FETCH_PRODUCT:
      return {
        ...state,
        product: action.payload,
        editFormErrors: {}
      };
    case FETCH_STORE_PRODUCT:
      return {
        ...state,
        storeProduct: action.payload,
        productShopData: {
          quantity: 1,
          color: ''
        },
        shopFormErrors: {}
      };
    case SET_PRODUCTS_LOADING:
      return {
        ...state,
        isLoading: action.payload
      };
    case FETCH_PRODUCTS_SELECT:
      return { ...state, productsSelect: action.payload };
    case ADD_PRODUCT:
      return {
        ...state,
        products: [...state.products, action.payload]
      };
    case REMOVE_PRODUCT:
      const index = state.products.findIndex(b => b._id === action.payload);
      return {
        ...state,
        products: [
          ...state.products.slice(0, index),
          ...state.products.slice(index + 1)
        ]
      };
    case PRODUCT_CHANGE:
      return {
        ...state,
        productFormData: {
          ...state.productFormData,
          ...action.payload
        }
      };
    case PRODUCT_EDIT_CHANGE:
      return {
        ...state,
        product: {
          ...state.product,
          ...action.payload
        }
      };
    case PRODUCT_SHOP_CHANGE:
      return {
        ...state,
        productShopData: {
          ...state.productShopData,
          ...action.payload
        }
      };
    case SET_PRODUCT_FORM_ERRORS:
      return {
        ...state,
        formErrors: action.payload
      };
    case SET_PRODUCT_FORM_EDIT_ERRORS:
      return {
        ...state,
        editFormErrors: action.payload
      };
    case SET_PRODUCT_SHOP_FORM_ERRORS:
      return {
        ...state,
        shopFormErrors: action.payload
      };
    case RESET_PRODUCT:
      return {
        ...state,
        productFormData: {
          sku: '',
          name: '',
          shortName: '',
          description: '',
          quantity: 1,
          previousPrice: 1,
          price: 1,
          buyingPrice: 0, // Reset Buying Price
          wholeSellPrice: 0, // Reset Whole Sell Price
          image: {},
          isActive: true,
          popular: { value: 0, label: 'No' },
          premium: { value: 0, label: 'No' },
          brand: {
            value: 0,
            label: 'Select Brand'
          },
          tag: {
            value: 0,
            label: 'Select Tag'
          },
          category: {
            value: 0,
            label: 'Select Category'
          },
          colors: [],
          image_url: '',
          note: '', // Reset Note
          history: [] // Reset History
        },
        product: {
          _id: '',
          buyingPrice: 0, // Reset Buying Price
          wholeSellPrice: 0, // Reset Whole Sell Price
          history: [] // Reset History
        },
        formErrors: {}
      };
    case RESET_PRODUCT_SHOP:
      return {
        ...state,
        productShopData: {
          quantity: 1,
          color: ''
        },
        shopFormErrors: {}
      };
    case SET_ADVANCED_FILTERS:
      return {
        ...state,
        advancedFilters: {
          ...state.advancedFilters,
          ...action.payload
        }
      };
    case RESET_ADVANCED_FILTERS:
      return {
        ...state,
        advancedFilters: {
          name: 'all',
          shortName: 'all',
          category: 'all',
          brand: 'all',
          tag: 'all',
          min: 1,
          max: 5000,
          rating: 0,
          order: 0,
          totalPages: 1,
          currentPage: 1,
          count: 0,
          limit: 20
        }
      };
    case UPDATE_PRODUCT_SUCCESS:
      return {
        ...state,
        products: state.products.map(product =>
          product._id === action.payload._id ? action.payload : product
        )
      };
    default:
      return state;
  }
};

export default productReducer;
