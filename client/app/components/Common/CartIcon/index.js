/**
 *
 * CartIcon
 *
 */

import React from 'react';

import { BasketIcon } from '../Icon';
import Button from '../Button';

const CartIcon = props => {
  const { className, onClick, cartItems } = props;

  const Icon = (
    <span className='cart-icon'>
      <BasketIcon />
      {cartItems.length > 0 && (
        <span className='cart-badge'>
          {cartItems.length >= 99 ? '99+' : cartItems.length}
        </span>
      )}
    </span>
  );

  const items = cartItems.length;

  return (
    <Button
      borderless
      variant='empty'
      className={className}
      ariaLabel={
        items > 0 ? `your cart have ${items} items` : 'your cart is empty'
      }
      icon={Icon}
      onClick={onClick}
    />
  );
};

export default CartIcon;
