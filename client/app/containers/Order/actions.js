/*
 *
 * Order actions
 *
 */

import { push } from 'connected-react-router';
import axios from 'axios';
import { success } from 'react-notification-system-redux';
import Swal from 'sweetalert2';
import Input from '../../components/Common/Input';

import {
  FETCH_ORDERS,
  FETCH_SEARCHED_ORDERS,
  FETCH_ORDER,
  UPDATE_ORDER_STATUS,
  SET_ORDERS_LOADING,
  SET_ADVANCED_FILTERS,
  CLEAR_ORDERS,
  FETCH_PROFILE_3
} from './constants';

import { clearCart, getCartId } from '../Cart/actions';
import { toggleCart } from '../Navigation/actions';
import handleError from '../../utils/error';
import { API_URL } from '../../constants';

export const updateOrderStatus = value => {
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

export const fetchOrders = (page = 1) => {
  return async (dispatch, getState) => {
    try {
      dispatch(setOrderLoading(true));

      const response = await axios.get(`${API_URL}/order`, {
        params: {
          page: page ?? 1,
          limit: 20
        }
      });

      const { orders, totalPages, currentPage, count } = response.data;

      dispatch({
        type: FETCH_ORDERS,
        payload: orders
      });

      dispatch({
        type: SET_ADVANCED_FILTERS,
        payload: { totalPages, currentPage, count }
      });
    } catch (error) {
      dispatch(clearOrders());
      handleError(error, dispatch);
    } finally {
      dispatch(setOrderLoading(false));
    }
  };
};

export const fetchAccountOrders = (page = 1) => {
  return async (dispatch, getState) => {
    try {
      dispatch(setOrderLoading(true));

      const response = await axios.get(`${API_URL}/order/me`, {
        params: {
          page: page ?? 1,
          limit: 20
        }
      });

      const { orders, totalPages, currentPage, count } = response.data;

      dispatch({
        type: FETCH_ORDERS,
        payload: orders
      });

      dispatch({
        type: SET_ADVANCED_FILTERS,
        payload: { totalPages, currentPage, count }
      });
    } catch (error) {
      dispatch(clearOrders());
      handleError(error, dispatch);
    } finally {
      dispatch(setOrderLoading(false));
    }
  };
};

export const searchOrders = filter => {
  return async (dispatch, getState) => {
    try {
      dispatch(setOrderLoading(true));

      const response = await axios.get(`${API_URL}/order/search`, {
        params: {
          search: filter.value
        }
      });

      dispatch({
        type: FETCH_SEARCHED_ORDERS,
        payload: response.data.orders
      });
    } catch (error) {
      handleError(error, dispatch);
    } finally {
      dispatch(setOrderLoading(false));
    }
  };
};

export const fetchOrder = (id, withLoading = true) => {
  return async (dispatch, getState) => {
    try {
      if (withLoading) {
        dispatch(setOrderLoading(true));
      }

      const response = await axios.get(`${API_URL}/order/${id}`);

      dispatch({
        type: FETCH_ORDER,
        payload: response.data.order
      });
    } catch (error) {
      handleError(error, dispatch);
    } finally {
      if (withLoading) {
        dispatch(setOrderLoading(false));
      }
    }
  };
};

export const cancelOrder = () => {
  return async (dispatch, getState) => {
    try {
      const order = getState().order.order;

      await axios.delete(`${API_URL}/order/cancel/${order._id}`);

      dispatch(push(`/dashboard/orders`));
    } catch (error) {
      handleError(error, dispatch);
    }
  };
};

export const updateOrderItemStatus = (itemId, status) => {
  return async (dispatch, getState) => {
    try {
      const order = getState().order.order;

      const response = await axios.put(
        `${API_URL}/order/status/item/${itemId}`,
        {
          orderId: order._id,
          cartId: order.cartId,
          status
        }
      );

      if (response.data.orderCancelled) {
        dispatch(push(`/dashboard/orders`));
      } else {
        dispatch(updateOrderStatus({ itemId, status }));
        dispatch(fetchOrder(order._id, false));
      }

      const successfulOptions = {
        title: response.data.message || 'Updated successfully',
        position: 'tr',
        autoDismiss: 1
      };

      dispatch(success(successfulOptions));
    } catch (error) {
      handleError(error, dispatch);
    }
  };
};

import { districts } from '../../utils/districts-bn';
export const addOrder = showModal => {
  return async (dispatch, getState) => {
    const user = getState().account.user;
    if (showModal) openModal(user, dispatch);
    else {
      try {
        const cartId = localStorage.getItem('cart_id');
        const total = getState().cart.cartTotal;
        const deliveryCharge = getState().account.user.isInDhakaCity ? 50 : 100;

        if (cartId) {
          const response = await axios.post(`${API_URL}/order/add`, {
            cartId,
            total,
            deliveryCharge
          });

          dispatch(push(`/order/success/${response.data.order._id}`));
          dispatch(clearCart());
        }
      } catch (error) {
        handleError(error, dispatch);
      }
    }
  };
};

function openModal(user, dispatch) {
  var name = user.firstName + ' ' + user.lastName || '';
  var phoneNumber = user.phoneNumber || '';
  var deliveryAddress = user.deliveryAddress || '';
  var components = deliveryAddress.split(', ');
  var [...address] = components.slice(0, -2);
  var [thana, district] = components.slice(-2);
  var subDistrict;

  Swal.fire({
    title: 'প্রয়োজনীয় তথ্য দিন',
    html: `
        <label class="d-flex">নাম</label>
        <input id="name" class="sweet-alert-input" placeholder="নিজের সম্পূর্ণ নাম লিখুন ..." value="${name}">
        <label class="d-flex">মোবাইল নম্বর</label>
        <input id="phoneNumber" class="sweet-alert-input" placeholder="মোবাইল নম্বর লিখুন ..." value="${phoneNumber}">
        <label class="d-flex">ঠিকানা</label>
        <input id="address" class="sweet-alert-input" placeholder="বাসা নং, রোড নম্বর, এলাকার নাম" value="${address}">
        <select id="district" class="swal2-select bg-light">
        <option value="">জেলা নির্বাচন করুন</option>
          ${districts
            .map(
              districtObj =>
                `<option value="${districtObj.name}" ${
                  district === districtObj.name ? 'selected' : ''
                }>${districtObj.name}</option>`
            )
            .join('')}
        </select>
        <select id="subDistrict" class="swal2-select bg-light">
          <option value="">থানা নির্বাচন করুন</option>
          ${
            district
              ? districts
                  .find(districtObj => districtObj.name === district)
                  .sub_district.map(
                    subDistrictName =>
                      `<option value="${subDistrictName}" ${
                        subDistrictName === thana ? 'selected' : ''
                      }>${subDistrictName}</option>`
                  )
                  .join('')
              : ''
          }
        </select>
      `,
    focusConfirm: false,
    preConfirm: () => {
      (name = document.getElementById('name').value),
        (phoneNumber = document.getElementById('phoneNumber').value),
        (address = document.getElementById('address').value),
        (district = document.getElementById('district').value),
        (subDistrict = document.getElementById('subDistrict').value);
      if (!name || !phoneNumber || !address) {
        Swal.showValidationMessage('সকল তথ্য পূরণ করুন');
        return null;
      }

      return { name, phoneNumber, address, district, subDistrict };
    },
    background: '#fff',
    confirmButtonColor: '#76ff7a',
    confirmButtonText: 'অর্ডার করুন',
    customClass: {
      icon: 'sweet-alert-icon',
      popup: 'sweet-alert-popup',
      actions: 'sweet-alert-actions',
      confirmButton: 'sweet-alert-confirm'
    }
  }).then(result => {
    if (result.isConfirmed) {
      const { name, phoneNumber, address, subDistrict, district } =
        result.value;
      const nameComponents = name.split(' ');

      // Assign the first word to the first name
      let firstName = nameComponents.shift();
      // Join the remaining words to form the last name
      const lastName = nameComponents.join(' ');

      const deliveryAddress = address + ', ' + subDistrict + ', ' + district;
      const isInDhakaCity = district === 'ঢাকা শহর';
      (async () => {
        const profile = {
          ...user,
          firstName,
          lastName,
          phoneNumber,
          deliveryAddress,
          isInDhakaCity
        };
        try {
          const response = await axios.put(`${API_URL}/user`, {
            profile
          });

          // Handle successful profile update
          const successfulOptions = {
            title: response.data.message || 'Updated successfully',
            position: 'tr',
            autoDismiss: 1
          };
          dispatch({
            type: FETCH_PROFILE_3,
            payload: response.data.user
          });

          // Attempt to add the order again after updating the profile
          dispatch(addOrder(false, isInDhakaCity));
        } catch (error) {
          // Handle error while updating profile
          handleError(error, dispatch, `Error: ${error.message}`);
        }
      })();
      // }
      // dispatch(addOrder());
    }
  });
  // Add event listener for district dropdown change
  document.getElementById('district').addEventListener('change', () => {
    const selectedDistrict = document.getElementById('district').value;
    const subDistrictDropdown = document.getElementById('subDistrict');

    if (selectedDistrict) {
      const selectedDistrictObj = districts.find(
        districtObj => districtObj.name === selectedDistrict
      );
      const subDistrictOptions = selectedDistrictObj.sub_district
        .map(
          subDistrictName =>
            `<option value="${subDistrictName}">${subDistrictName}</option>`
        )
        .join('');

      // Update the sub-district dropdown with options corresponding to the selected district
      subDistrictDropdown.innerHTML = `<option value="">থানা নির্বাচন করুন</option>${subDistrictOptions}`;
    } else {
      // If no district is selected, reset the sub-district dropdown
      subDistrictDropdown.innerHTML =
        '<option value="">থানা নির্বাচন করুন</option>';
    }
  });
}

export const placeOrder = () => {
  return (dispatch, getState) => {
    const token = localStorage.getItem('token');
    const cartItems = getState().cart.cartItems;

    if (token && cartItems.length > 0) {
      Promise.all([dispatch(getCartId())]).then(() => {
        dispatch(addOrder(true, false));
      });
    }

    dispatch(toggleCart());
  };
};

export const clearOrders = () => {
  return {
    type: CLEAR_ORDERS
  };
};
