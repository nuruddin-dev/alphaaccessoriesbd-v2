/**
 *
 * OrderSummary
 *
 */

import React from 'react';

import { Col } from 'reactstrap';

const OrderSummary = props => {
  const { order, user } = props;

  return (
    <Col className='order-summary pt-3'>
      <h2>Order Summary</h2>
      <div className='d-flex align-items-center summary-item'>
        <p className='summary-label'>Subtotal</p>
        <p className='summary-value ml-auto'>৳{order.total}</p>
      </div>

      <div className='d-flex align-items-center summary-item'>
        <p className='summary-label'>Delivery Charge</p>
        <p className='summary-value ml-auto'>৳{order.deliveryCharge}</p>
      </div>

      <hr />
      <div className='d-flex align-items-center summary-item'>
        <p className='summary-label'>Total</p>
        <p className='summary-value ml-auto'>
          ৳{order.total + order.deliveryCharge}
        </p>
      </div>
    </Col>
  );
};

export default OrderSummary;
