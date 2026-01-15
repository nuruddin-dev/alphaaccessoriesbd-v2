/*
 *
 * Order actions
 *
 */

import { push } from 'connected-react-router';
import axios from 'axios';

import { success } from 'react-notification-system-redux';
import {
  FETCH_ORDERS,
  CLEAR_ORDERS,
  SET_ORDERS_LOADING,
  UPDATE_ORDER_STATUS
} from './constants';

import handleError from '../../utils/error';
import { API_URL } from '../../constants';

export const updateOrderNowStatus = value => {
  return {
    type: UPDATE_ORDER_STATUS,
    payload: value
  };
};

export const setOrderLoading = value => {
  return {
    type: SET_ORDERS_LOADING,
    payload: value
  };
};

export const fetchOrderNows = () => {
  return async (dispatch, getState) => {
    try {
      dispatch(setOrderLoading(true));
      const response = await axios.get(`${API_URL}/orderNow/`);

      const { orders } = response.data;

      dispatch({
        type: FETCH_ORDERS,
        payload: orders
      });
    } catch (error) {
      // dispatch(clearOrders());
      handleError(error, dispatch);
    } finally {
      dispatch(setOrderLoading(false));
    }
  };
};

export const deleteOrderNow = orderId => {
  return async (dispatch, getState) => {
    try {
      await axios.delete(`${API_URL}/orderNow/cancel/${orderId}`);
      dispatch(fetchOrderNows()); // Refresh the order list
      dispatch(success({
        title: 'Success',
        message: 'Order deleted successfully!',
        position: 'tr',
        autoDismiss: 3
      }));
    } catch (error) {
      handleError(error, dispatch);
    }
  };
};

export const updateOrderStatus = (orderId, newStatus) => {
  return async (dispatch, getState) => {
    try {
      // Make an API call to update the status
      const response = await axios.put(
        `${API_URL}/orderNow/${orderId}/status`,
        {
          orderId: orderId,
          newStatus: newStatus
        }
      );
      dispatch(updateOrderNowStatus({ orderId, status: newStatus }));
      dispatch(fetchOrderNows()); // Refresh the order list

      const successfulOptions = {
        title: 'Success',
        message: response.data && response.data.message ? response.data.message : `Order status updated to ${newStatus}`,
        position: 'tr',
        autoDismiss: 3
      };

      dispatch(success(successfulOptions));
    } catch (error) {
      handleError(error, dispatch);
    }
  };
};

// Update order note
export const updateOrderNote = (orderId, note) => {
  return async (dispatch, getState) => {
    try {
      // Make an API call to update the note
      const response = await axios.put(`${API_URL}/orderNow/${orderId}/note`, {
        orderId: orderId,
        newNote: note
      });
      // Dispatch the updated note data
      dispatch({
        type: 'UPDATE_ORDER_NOTE',
        payload: { orderId, note: response.data.note }
      });

      dispatch(fetchOrderNows()); // Refresh the order list

      const successfulOptions = {
        title: 'Success',
        message: response.data && response.data.message ? response.data.message : 'Order note updated successfully!',
        position: 'tr',
        autoDismiss: 3
      };

      dispatch(success(successfulOptions)); // Optionally show a success message
    } catch (error) {
      handleError(error, dispatch);
    }
  };
};
