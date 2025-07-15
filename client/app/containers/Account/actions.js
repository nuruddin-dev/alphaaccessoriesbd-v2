/*
 *
 * Account actions
 *
 */

import { success } from 'react-notification-system-redux';
import axios from 'axios';

import {
  ACCOUNT_CHANGE,
  FETCH_PROFILE,
  CLEAR_ACCOUNT,
  SET_PROFILE_LOADING
} from './constants';
import handleError from '../../utils/error';
import { API_URL } from '../../constants';

export const accountChange = (name, value) => {
  let formData = {};
  formData[name] = value;

  return {
    type: ACCOUNT_CHANGE,
    payload: formData
  };
};

export const clearAccount = () => {
  return {
    type: CLEAR_ACCOUNT
  };
};

export const setProfileLoading = value => {
  return {
    type: SET_PROFILE_LOADING,
    payload: value
  };
};

export const fetchProfile = () => {
  return async (dispatch, getState) => {
    try {
      dispatch(setProfileLoading(true));
      const response = await axios.get(`${API_URL}/user/me`);

      dispatch({ type: FETCH_PROFILE, payload: response.data.user });
    } catch (error) {
      handleError(error, dispatch);
    } finally {
      dispatch(setProfileLoading(false));
    }
  };
};

export const updateProfile = () => {
  return async (dispatch, getState) => {
    // try {
    //   const phoneNumber = /^01\d{9}$/;
    //   const rules = {
    //     phoneNumber: ['required', `regex:${phoneNumber}`]
    //   };

    //   const { isValid, errors } = allFieldsValidation(merchant, rules, {
    //     'required.name': 'Name is required.',
    //     'required.email': 'Email is required.',
    //     'email.email': 'Email format is invalid.',
    //     'required.phoneNumber': 'Phone number is required.',
    //     'regex.phoneNumber': 'Phone number format is invalid.',
    //     'required.brandName': 'Brand is required.',
    //     'required.business': 'Business is required.',
    //     'min.business': 'Business must be at least 10 characters.'
    //   });

    //   if (!isValid) {
    //     return dispatch({ type: SET_MERCHANT_FORM_ERRORS, payload: errors });
    //   }

    // } catch (error) {}

    const profile = getState().account.user;

    try {
      const response = await axios.put(`${API_URL}/user`, {
        profile
      });

      const successfulOptions = {
        title: `${response.data.message}`,
        position: 'tr',
        autoDismiss: 1
      };

      dispatch({ type: FETCH_PROFILE, payload: response.data.user });

      dispatch(success(successfulOptions));
    } catch (error) {
      handleError(error, dispatch);
    }
  };
};
