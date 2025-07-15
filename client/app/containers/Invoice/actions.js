import axios from 'axios';
import {
  FETCH_PRODUCTS,
  CREATE_INVOICE,
  SET_INVOICE_LOADING,
  UPDATE_INVOICE
} from './constants';
import { API_URL } from '../../constants';
import handleError from '../../utils/error';

// Create new invoice
export const createInvoice = invoiceData => {
  return async dispatch => {
    try {
      dispatch({ type: SET_INVOICE_LOADING, payload: true });

      const response = await axios.post(
        `${API_URL}/invoice/create`,
        invoiceData
      );

      dispatch({ type: CREATE_INVOICE, payload: response.data });

      dispatch({ type: SET_INVOICE_LOADING, payload: false });

      return response.data;
    } catch (error) {
      dispatch({ type: SET_INVOICE_LOADING, payload: false });
      handleError(error, dispatch);
      throw error;
    }
  };
};

// Update existing invoice
export const updateInvoice = (invoiceId, invoiceData) => {
  return async dispatch => {
    try {
      dispatch({ type: SET_INVOICE_LOADING, payload: true });

      const response = await axios.put(
        `${API_URL}/invoice/${invoiceId}`,
        invoiceData
      );

      dispatch({ type: UPDATE_INVOICE, payload: response.data });

      dispatch({ type: SET_INVOICE_LOADING, payload: false });

      return response.data;
    } catch (error) {
      dispatch({ type: SET_INVOICE_LOADING, payload: false });
      handleError(error, dispatch);
      throw error;
    }
  };
};
