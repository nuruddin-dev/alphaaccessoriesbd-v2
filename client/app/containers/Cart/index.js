/*
 *
 * Cart
 *
 */

import React from 'react';
import { connect } from 'react-redux';

import actions from '../../actions';

import CartList from '../../components/Store/CartList';
import CartSummary from '../../components/Store/CartSummary';
import Checkout from '../../components/Store/Checkout';
import { BagIcon, CloseIcon } from '../../components/Common/Icon';
import Button from '../../components/Common/Button';

class Cart extends React.PureComponent {
  // componentDidMount() {
  //   this.props.fetchAddresses();
  // }

  render() {
    const {
      isCartOpen,
      cartItems,
      cartTotal,
      toggleCart,
      handleShopping,
      handleCheckout,
      handleRemoveFromCart,
      placeOrder,
      authenticated,
      user
    } = this.props;

    return (
      <div className='cart'>
        <div className='cart-header'>
          <p className='cart-title font-weight-bolder m-0'>Shopping Cart</p>
          {isCartOpen && (
            <Button
              borderless
              variant='empty'
              ariaLabel='close the cart'
              icon={<CloseIcon />}
              onClick={toggleCart}
            />
          )}
        </div>
        {cartItems.length > 0 ? (
          <div className='cart-body'>
            <CartList
              toggleCart={toggleCart}
              cartItems={cartItems}
              handleRemoveFromCart={handleRemoveFromCart}
            />
          </div>
        ) : (
          <div className='empty-cart'>
            <BagIcon />
            <p>Your shopping cart is empty</p>
          </div>
        )}
        {cartItems.length > 0 && (
          <div className='cart-checkout'>
            <CartSummary
              cartTotal={cartTotal}
              authenticated={authenticated}
              deliveryCharge={
                authenticated
                  ? user.deliveryAddress === ''
                    ? 0
                    : user.isInDhakaCity
                    ? 50
                    : 100
                  : 0
              }
            />
            <Checkout
              handleShopping={handleShopping}
              handleCheckout={handleCheckout}
              placeOrder={placeOrder}
              authenticated={authenticated}
            />
          </div>
        )}
      </div>
    );
  }
}

const mapStateToProps = state => {
  return {
    isCartOpen: state.navigation.isCartOpen,
    cartItems: state.cart.cartItems,
    cartTotal: state.cart.cartTotal,
    // deliveryCharge: state.cart.deliveryCharge,
    authenticated: state.authentication.authenticated,
    user: state.account.user
  };
};

export default connect(mapStateToProps, actions)(Cart);
