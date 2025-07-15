/*
 *
 * OrderNow reducer
 *
 */

import {
  SET_ORDERS_LOADING,
  FETCH_ORDERS,
  UPDATE_ORDER_STATUS,
  CLEAR_ORDERS
} from './constants';

const initialState = {
  orders: [], // Make sure orders is an empty array

  searchedOrders: [],
  order: {
    _id: '',
    quantity: 1,
    name: '',
    phoneNumber: '',
    address: '',
    productName: '',
    price: 0,
    status: ''
  }
};
const orderNowReducer = (state = initialState, action) => {
  switch (action.type) {
    case FETCH_ORDERS:
      return {
        ...state,
        orders: action.payload
      };

    case UPDATE_ORDER_STATUS:
      // Find the index of the order to update
      const orderIndex = state.orders.findIndex(
        order => order._id === action.payload.orderId // Fix the condition to match orderId
      );

      if (orderIndex === -1) {
        return state; // If order not found, return the state as is
      }

      // Create a new order with the updated status
      const updatedOrder = {
        ...state.orders[orderIndex], // Copy the existing order
        status: action.payload.status // Update the status
      };

      // Return the new state with the updated order
      return {
        ...state,
        orders: [
          ...state.orders.slice(0, orderIndex), // All orders before the updated one
          updatedOrder, // The updated order
          ...state.orders.slice(orderIndex + 1) // All orders after the updated one
        ]
      };

    case CLEAR_ORDERS:
      return {
        ...state,
        orders: []
      };
    case SET_ORDERS_LOADING:
      return {
        ...state,
        isLoading: action.payload
      };
    default:
      return state;
  }
};

export default orderNowReducer;
