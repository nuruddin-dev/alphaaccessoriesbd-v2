/**
 *
 * CartSummary
 *
 */

import React from 'react';

import { Container, Row, Col } from 'reactstrap';

const CartSummary = props => {
  const { cartTotal, deliveryCharge, authenticated } = props;

  return (
    <div className='cart-summary'>
      <Container>
        <Row className='mb-2 summary-item'>
          <Col xs='9'>
            <p className='summary-label'>
              ডেলিভারি চার্জ
              {authenticated
                ? deliveryCharge === 0
                  ? ' (ডেলিভারি ঠিকনা নেই)'
                  : deliveryCharge === 50
                  ? ' (ঢাকা শহরের ভিতরে)'
                  : ' (ঢাকা শহরের বাইরে)'
                : ' (একাউন্ট নেই)'}
            </p>
          </Col>
          <Col xs='3' className='text-right'>
            <p className='summary-value'>৳{deliveryCharge}</p>
          </Col>
        </Row>
        <Row className='mb-2 summary-item'>
          <Col xs='9'>
            <p className='summary-label'>মোট</p>
          </Col>
          <Col xs='3' className='text-right'>
            <p className='summary-value'>৳{cartTotal + deliveryCharge}</p>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default CartSummary;
