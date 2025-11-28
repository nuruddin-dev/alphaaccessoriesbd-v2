import {
  FETCH_CUSTOMERS,
  ADD_CUSTOMER,
  UPDATE_CUSTOMER,
  CUSTOMER_CHANGE,
  SET_CUSTOMER_FORM_ERRORS,
  RESET_CUSTOMER,
  FETCH_CUSTOMER,
  CUSTOMER_EDIT_CHANGE,
  SET_CUSTOMER_EDIT_FORM_ERRORS,
  RESET_CUSTOMER_EDIT,
  DELETE_CUSTOMER
} from './constants';

const initialState = {
  customers: [],
  customerFormData: {
    customerName: '',
    phoneNumber: '',
    address: ''
  },
  formErrors: {},
  customer: {
    name: '',
    phoneNumber: '',
    address: ''
  },
  editFormErrors: {},
  isLoading: false
};

const customerReducer = (state = initialState, action) => {
  switch (action.type) {
    case FETCH_CUSTOMERS:
      return {
        ...state,
        customers: action.payload,
        isLoading: false
      };
    case ADD_CUSTOMER:
      return {
        ...state,
        customers: [...state.customers, action.payload]
      };
    case UPDATE_CUSTOMER:
      return {
        ...state,
        customers: state.customers.map(customer =>
          customer.id === action.payload.id ? action.payload : customer
        )
      };
    case CUSTOMER_CHANGE:
      return {
        ...state,
        customerFormData: {
          ...state.customerFormData,
          ...action.payload
        }
      };
    case SET_CUSTOMER_FORM_ERRORS:
      return {
        ...state,
        formErrors: action.payload
      };
    case RESET_CUSTOMER:
      return {
        ...state,
        customerFormData: {
          customerName: '',
          phoneNumber: '',
          address: ''
        },
        formErrors: {}
      };
    case FETCH_CUSTOMER:
      return {
        ...state,
        customer: action.payload,
        editFormErrors: {}
      };
    case CUSTOMER_EDIT_CHANGE:
      return {
        ...state,
        customer: {
          ...state.customer,
          ...action.payload
        }
      };
    case SET_CUSTOMER_EDIT_FORM_ERRORS:
      return {
        ...state,
        editFormErrors: action.payload
      };
    case RESET_CUSTOMER_EDIT:
      return {
        ...state,
        customer: {
          name: '',
          phoneNumber: '',
          address: ''
        },
        editFormErrors: {}
      };
    case DELETE_CUSTOMER:
      const index = state.customers.findIndex(c => c._id === action.payload);
      return {
        ...state,
        customers: [
          ...state.customers.slice(0, index),
          ...state.customers.slice(index + 1)
        ]
      };
    default:
      return state;
  }
};

export default customerReducer;
