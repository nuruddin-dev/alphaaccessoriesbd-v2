import {
  FETCH_CUSTOMERS,
  ADD_CUSTOMER,
  UPDATE_CUSTOMER,
  SET_CUSTOMER_LOADING,
  CUSTOMER_CHANGE,
  SET_CUSTOMER_FORM_ERRORS,
  RESET_CUSTOMER,
  FETCH_CUSTOMER,
  CUSTOMER_EDIT_CHANGE,
  SET_CUSTOMER_EDIT_FORM_ERRORS,
  RESET_CUSTOMER_EDIT,
  DELETE_CUSTOMER
} from './constants';

import { goBack } from 'connected-react-router';
import { success } from 'react-notification-system-redux';
import { allFieldsValidation } from '../../utils/validation';

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
        payload: response.data.customers
      });
    } catch (error) {
      console.error('Error fetching customers:', error);
    } finally {
      dispatch(setCustomerLoading(false));
    }
  };
};

export const customerChange = (name, value) => {
  let formData = {};
  formData[name] = value;

  return {
    type: CUSTOMER_CHANGE,
    payload: formData
  };
};

export const addCustomer = () => {
  return async (dispatch, getState) => {
    try {
      const rules = {
        customerName: 'required',
        phoneNumber: 'required',
        address: 'required'
      };

      const customer = getState().customer.customerFormData;

      const { isValid, errors } = allFieldsValidation(customer, rules, {
        'required.customerName': 'Name is required.',
        'required.phoneNumber': 'Phone number is required.',
        'required.address': 'Address is required.'
      });

      if (!isValid) {
        return dispatch({ type: SET_CUSTOMER_FORM_ERRORS, payload: errors });
      }

      const newCustomer = {
        name: customer.customerName,
        phoneNumber: customer.phoneNumber,
        address: customer.address
      };

      const response = await axios.post(`${API_URL}/customer/add`, newCustomer);

      const successfulOptions = {
        title: `${response.data.message}`,
        position: 'tr',
        autoDismiss: 1
      };

      if (response.data.success === true) {
        dispatch(success(successfulOptions));
        dispatch({
          type: ADD_CUSTOMER,
          payload: response.data.customer
        });

        dispatch(goBack());
        dispatch({ type: RESET_CUSTOMER });
      }
    } catch (error) {
      handleError(error, dispatch);
    }
  };
};

export const updateCustomer = () => {
  return async (dispatch, getState) => {
    try {
      const rules = {
        name: 'required',
        phoneNumber: 'required'
      };

      const customer = getState().customer.customer;

      const { isValid, errors } = allFieldsValidation(customer, rules, {
        'required.name': 'Name is required.',
        'required.phoneNumber': 'Phone number is required.'
      });

      if (!isValid) {
        return dispatch({ type: SET_CUSTOMER_EDIT_FORM_ERRORS, payload: errors });
      }

      const response = await axios.put(
        `${API_URL}/customer/${customer._id}`,
        {
          name: customer.name,
          phoneNumber: customer.phoneNumber,
          address: customer.address
        }
      );

      const successfulOptions = {
        title: `${response.data.message}`,
        position: 'tr',
        autoDismiss: 1
      };

      if (response.data.success === true) {
        dispatch(success(successfulOptions));
        dispatch(goBack());
      }
    } catch (error) {
      handleError(error, dispatch);
    }
  };
};

export const setCustomerLoading = isLoading => ({
  type: SET_CUSTOMER_LOADING,
  payload: isLoading
});

export const fetchCustomer = id => {
  return async dispatch => {
    try {
      const response = await axios.get(`${API_URL}/customer/${id}`);

      dispatch({
        type: FETCH_CUSTOMER,
        payload: response.data.customer
      });
    } catch (error) {
      handleError(error, dispatch);
    }
  };
};

export const customerEditChange = (name, value) => {
  let formData = {};
  formData[name] = value;

  return {
    type: CUSTOMER_EDIT_CHANGE,
    payload: formData
  };
};


export const deleteCustomer = id => {
  return async dispatch => {
    try {
      const response = await axios.delete(`${API_URL}/customer/${id}`);

      const successfulOptions = {
        title: `${response.data.message}`,
        position: 'tr',
        autoDismiss: 1
      };

      if (response.data.success === true) {
        dispatch(success(successfulOptions));
        dispatch({
          type: DELETE_CUSTOMER,
          payload: id
        });
        dispatch(goBack());
      }
    } catch (error) {
      handleError(error, dispatch);
    }
  };
};
