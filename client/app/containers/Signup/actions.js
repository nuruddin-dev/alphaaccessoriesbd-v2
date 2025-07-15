/*
 *
 * Signup actions
 *
 */

import { success } from 'react-notification-system-redux';
import axios from 'axios';

import {
  SIGNUP_CHANGE,
  SIGNUP_RESET,
  SET_SIGNUP_LOADING,
  SET_SIGNUP_SUBMITTING,
  SUBSCRIBE_CHANGE,
  SET_SIGNUP_FORM_ERRORS
} from './constants';

import { setAuth } from '../Authentication/actions';
import setToken from '../../utils/token';
import handleError from '../../utils/error';
import { allFieldsValidation } from '../../utils/validation';
import { API_URL } from '../../constants';

export const signupChange = (name, value) => {
  let formData = {};
  formData[name] = value;

  return {
    type: SIGNUP_CHANGE,
    payload: formData
  };
};

export const subscribeChange = () => {
  return {
    type: SUBSCRIBE_CHANGE
  };
};

export const signUp = () => {
  return async (dispatch, getState) => {
    try {
      const rules = {
        email: 'required|regex:/^01\\d{9}$/',
        password: 'required|min:6',
        firstName: 'required'
      };

      const newUser = getState().signup.signupFormData;
      const isSubscribed = getState().signup.isSubscribed;

      const { isValid, errors } = allFieldsValidation(newUser, rules, {
        'required.email': 'মোবাইল নম্বর আবশ্যক।',
        'required.password': 'পাসওয়ার্ড অবশ্যক।',
        'required.firstName': 'নামের প্রথম অংশ আবশ্যক।',
        'regex.email': 'সঠিক মোবাইল নম্বর দিন।',
        'min.password': 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।'
      });

      if (!isValid) {
        return dispatch({ type: SET_SIGNUP_FORM_ERRORS, payload: errors });
      }

      dispatch({ type: SET_SIGNUP_SUBMITTING, payload: true });
      dispatch({ type: SET_SIGNUP_LOADING, payload: true });

      const user = {
        isSubscribed,
        ...newUser
      };

      const response = await axios.post(`${API_URL}/auth/register`, user);

      const successfulOptions = {
        title: `সফল হয়েছে।`,
        position: 'tr',
        autoDismiss: 1
      };

      localStorage.setItem('token', response.data.token);

      setToken(response.data.token);

      dispatch(setAuth());
      dispatch(success(successfulOptions));
      dispatch({ type: SIGNUP_RESET });
    } catch (error) {
      const title = `দয়া করে আবার চেষ্টা করুন!`;
      handleError(error, dispatch, title);
    } finally {
      dispatch({ type: SET_SIGNUP_SUBMITTING, payload: false });
      dispatch({ type: SET_SIGNUP_LOADING, payload: false });
    }
  };
};
