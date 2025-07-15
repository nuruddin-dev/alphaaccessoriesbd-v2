import { FETCH_CUSTOMERS, ADD_CUSTOMER, UPDATE_CUSTOMER } from './constants';

const initialState = {
  customers: [],
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
    default:
      return state;
  }
};

export default customerReducer;
