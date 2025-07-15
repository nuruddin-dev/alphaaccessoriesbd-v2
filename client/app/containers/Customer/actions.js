import {
  FETCH_CUSTOMERS,
  ADD_CUSTOMER,
  UPDATE_CUSTOMER,
  SET_CUSTOMER_LOADING
} from './constants';

import { API_URL } from '../../constants';
import handleError from '../../utils/error';
import axios from 'axios';

export const fetchCustomers = () => {
  return async dispatch => {
    dispatch(setCustomerLoading(true));
    try {
      const response = await axios.get(`${API_URL}/customer`);

      console.log('Fetched customers:', response.data); // Debugging line
      dispatch({
        type: FETCH_CUSTOMERS,
        payload: response.data
      });
    } catch (error) {
      console.error('Error fetching customers:', error);
    } finally {
      dispatch(setCustomerLoading(false));
    }
  };
};

export const addCustomer = customerData => {
  return async dispatch => {
    try {
      const response = await fetch('/api/customers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(customerData)
      });
      const data = await response.json();
      dispatch({
        type: ADD_CUSTOMER,
        payload: data
      });
    } catch (error) {
      console.error('Error adding customer:', error);
    }
  };
};

export const updateCustomer = (customerId, customerData) => {
  return async dispatch => {
    try {
      const response = await fetch(`/api/customers/${customerId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(customerData)
      });
      const data = await response.json();
      dispatch({
        type: UPDATE_CUSTOMER,
        payload: data
      });
    } catch (error) {
      console.error('Error updating customer:', error);
    }
  };
};

export const setCustomerLoading = isLoading => ({
  type: SET_CUSTOMER_LOADING,
  payload: isLoading
});
