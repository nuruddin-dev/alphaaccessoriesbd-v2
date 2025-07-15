/**
 *
 * Checkout
 *
 */

import React from 'react';

import Button from '../../Common/Button';

const Checkout = props => {
  const { authenticated, handleShopping, handleCheckout, placeOrder } = props;

  return (
    <div className='easy-checkout'>
      <div className='checkout-actions'>
        <Button
          variant='primary'
          text='কেনাকাট চালিয়ে যান'
          onClick={() => handleShopping()}
        />
        {authenticated ? (
          <Button
            variant='primary'
            text='অর্ডার করুন'
            onClick={() => placeOrder()}
          />
        ) : (
          <Button
            variant='primary'
            text='অর্ডার করুন'
            onClick={() => handleCheckout()}
          />
        )}
      </div>
    </div>
  );
};

export default Checkout;
