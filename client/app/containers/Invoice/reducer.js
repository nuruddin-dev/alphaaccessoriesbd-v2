import {
  FETCH_PRODUCTS,
  SET_INVOICE_LOADING,
  CREATE_INVOICE
} from './constants';

const initialState = {
  products: [],
  invoice: null,
  isLoading: false
};

const invoiceReducer = (state = initialState, action) => {
  switch (action.type) {
    case FETCH_PRODUCTS:
      return {
        ...state,
        products: action.payload
      };
    case SET_INVOICE_LOADING:
      return {
        ...state,
        isLoading: action.payload
      };
    case CREATE_INVOICE:
      return {
        ...state,
        invoice: action.payload.invoice
      };
    default:
      return state;
  }
};

export default invoiceReducer;
