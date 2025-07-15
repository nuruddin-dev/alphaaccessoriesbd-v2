/*
 *
 * Tag reducer
 *
 */

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
  RESET_TAG,
  SET_TAGS_LOADING
} from './constants';

const initialState = {
  tags: [],
  storeTags: [],
  tag: {
    name: '',
    description: ''
  },
  tagsSelect: [],
  tagFormData: {
    name: '',
    description: '',
    isActive: true
  },
  categoriesSelect: [],
  categoryFormData: {
    name: '',
    description: '',
    isActive: true
  },
  formErrors: {},
  editFormErrors: {},
  isLoading: false
};

const tagReducer = (state = initialState, action) => {
  switch (action.type) {
    case FETCH_TAGS:
      return {
        ...state,
        tags: action.payload
      };
    case FETCH_STORE_TAGS:
      return {
        ...state,
        storeTags: action.payload
      };
    case FETCH_TAG:
      return {
        ...state,
        tag: action.payload,
        editFormErrors: {}
      };
    case FETCH_TAGS_SELECT:
      return {
        ...state,
        tagsSelect: action.payload
      };
    // case FETCH_CATEGORIES_SELECT:
    //   return {
    //     ...state,
    //     categoriesSelect: action.payload
    //   };
    case ADD_TAG:
      return {
        ...state,
        tags: [...state.tags, action.payload]
      };
    case REMOVE_TAG:
      const index = state.tags.findIndex(b => b._id === action.payload);
      return {
        ...state,
        tags: [...state.tags.slice(0, index), ...state.tags.slice(index + 1)]
      };
    case TAG_CHANGE:
      return {
        ...state,
        tagFormData: {
          ...state.tagFormData,
          ...action.payload
        }
      };
    case TAG_EDIT_CHANGE:
      return {
        ...state,
        tag: {
          ...state.tag,
          ...action.payload
        }
      };
    case SET_TAG_FORM_ERRORS:
      return {
        ...state,
        formErrors: action.payload
      };
    case SET_TAG_FORM_EDIT_ERRORS:
      return {
        ...state,
        editFormErrors: action.payload
      };
    case SET_TAGS_LOADING:
      return {
        ...state,
        isLoading: action.payload
      };
    case RESET_TAG:
      return {
        ...state,
        tagFormData: {
          name: '',
          description: '',
          isActive: true
        },
        formErrors: {}
      };
    default:
      return state;
  }
};

export default tagReducer;
