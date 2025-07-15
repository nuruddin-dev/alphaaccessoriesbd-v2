/*
 *
 * Tag actions
 *
 */

import { goBack } from 'connected-react-router';
import { success } from 'react-notification-system-redux';
import axios from 'axios';

import {
  FETCH_TAGS,
  FETCH_STORE_TAGS,
  FETCH_TAG,
  TAG_CHANGE,
  TAG_EDIT_CHANGE,
  SET_TAG_FORM_ERRORS,
  SET_TAG_FORM_EDIT_ERRORS,
  ADD_TAG,
  REMOVE_TAG,
  FETCH_TAGS_SELECT,
  // FETCH_CATEGORIES_SELECT,
  SET_TAGS_LOADING,
  RESET_TAG
} from './constants';

import handleError from '../../utils/error';
import { formatSelectOptions } from '../../utils/select';
import { allFieldsValidation } from '../../utils/validation';
import { API_URL } from '../../constants';

export const tagChange = (name, value) => {
  let formData = {};
  formData[name] = value;

  return {
    type: TAG_CHANGE,
    payload: formData
  };
};

export const tagEditChange = (name, value) => {
  let formData = {};
  formData[name] = value;

  return {
    type: TAG_EDIT_CHANGE,
    payload: formData
  };
};

// fetch store tags api
export const fetchStoreTags = () => {
  return async (dispatch, getState) => {
    try {
      const response = await axios.get(`${API_URL}/tag/list`);

      dispatch({
        type: FETCH_STORE_TAGS,
        payload: response.data.tags
      });
    } catch (error) {
      handleError(error, dispatch);
    }
  };
};

// fetch tags api
export const fetchTags = () => {
  return async (dispatch, getState) => {
    try {
      dispatch({ type: SET_TAGS_LOADING, payload: true });

      const response = await axios.get(`${API_URL}/tag`);

      dispatch({
        type: FETCH_TAGS,
        payload: response.data.tags
      });
    } catch (error) {
      handleError(error, dispatch);
    } finally {
      dispatch({ type: SET_TAGS_LOADING, payload: false });
    }
  };
};

// fetch tag api
export const fetchTag = tagId => {
  return async (dispatch, getState) => {
    try {
      const response = await axios.get(`${API_URL}/tag/${tagId}`);

      dispatch({
        type: FETCH_TAG,
        payload: response.data.tag
      });
    } catch (error) {
      handleError(error, dispatch);
    }
  };
};

// fetch tags select api
export const fetchTagsSelect = () => {
  return async (dispatch, getState) => {
    try {
      const response = await axios.get(`${API_URL}/tag/list/select`);

      const formattedTags = formatSelectOptions(response.data.tags, true);

      dispatch({
        type: FETCH_TAGS_SELECT,
        payload: formattedTags
      });
    } catch (error) {
      handleError(error, dispatch);
    }
  };
};

// add tag api
export const addTag = () => {
  return async (dispatch, getState) => {
    try {
      const rules = {
        name: 'required',
        description: 'required'
      };

      const tag = getState().tag.tagFormData;

      const { isValid, errors } = allFieldsValidation(tag, rules, {
        'required.name': 'Name is required.',
        'required.description': 'Description is required.'
        // 'max.description': 'Description may not be greater than 200 characters.'
      });

      if (!isValid) {
        return dispatch({ type: SET_TAG_FORM_ERRORS, payload: errors });
      }

      const response = await axios.post(`${API_URL}/tag/add`, tag);

      const successfulOptions = {
        title: `${response.data.message}`,
        position: 'tr',
        autoDismiss: 1
      };

      if (response.data.success === true) {
        dispatch(success(successfulOptions));
        dispatch({
          type: ADD_TAG,
          payload: response.data.tag
        });

        dispatch(goBack());
        dispatch({ type: RESET_TAG });
      }
    } catch (error) {
      handleError(error, dispatch);
    }
  };
};

// update tag api
export const updateTag = () => {
  return async (dispatch, getState) => {
    try {
      const rules = {
        name: 'required',
        slug: 'required|alpha_dash',
        description: 'required'
      };

      const tag = getState().tag.tag;

      const newTag = {
        name: tag.name,
        slug: tag.slug,
        description: tag.description
      };

      const { isValid, errors } = allFieldsValidation(newTag, rules, {
        'required.name': 'Name is required.',
        'required.slug': 'Slug is required.',
        'alpha_dash.slug':
          'Slug may have alpha-numeric characters, as well as dashes and underscores only.',
        'required.description': 'Description is required.'
        // 'max.description': 'Description may not be greater than 200 characters.'
      });

      if (!isValid) {
        return dispatch({ type: SET_TAG_FORM_EDIT_ERRORS, payload: errors });
      }

      const response = await axios.put(`${API_URL}/tag/${tag._id}`, {
        tag: newTag
      });

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

// activate tag api
export const activateTag = (id, value) => {
  return async (dispatch, getState) => {
    try {
      const response = await axios.put(`${API_URL}/tag/${id}/active`, {
        tag: {
          isActive: value
        }
      });

      const successfulOptions = {
        title: `${response.data.message}`,
        position: 'tr',
        autoDismiss: 1
      };

      if (response.data.success === true) {
        dispatch(success(successfulOptions));

        const tag = getState().tag.tag;
        dispatch(fetchTag(tag._id));
      }
    } catch (error) {
      handleError(error, dispatch);
    }
  };
};

// delete tag api
export const deleteTag = id => {
  return async (dispatch, getState) => {
    try {
      const response = await axios.delete(`${API_URL}/tag/delete/${id}`);

      const successfulOptions = {
        title: `${response.data.message}`,
        position: 'tr',
        autoDismiss: 1
      };

      if (response.data.success === true) {
        dispatch(success(successfulOptions));
        dispatch({
          type: REMOVE_TAG,
          payload: id
        });
        dispatch(goBack());
      }
    } catch (error) {
      handleError(error, dispatch);
    }
  };
};
