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
    <div className='order-summary-container' style={{ background: '#fff', borderRadius: '16px', padding: '24px', border: '1px solid #f1f5f9', boxShadow: '0 2px 4px rgba(0,0,0,0.01)' }}>
      <div className="d-flex align-items-center mb-4">
        <div style={{ width: '3px', height: '18px', background: '#06b6d4', marginRight: '10px', borderRadius: '2px' }}></div>
        <h2 className="mb-0" style={{ fontSize: '18px', fontWeight: '700', color: '#334155' }}>Order Summary</h2>
      </div>

      <div className='d-flex justify-content-between align-items-center mb-3'>
        <span style={{ fontSize: '14px', color: '#64748b', fontWeight: '500' }}>Subtotal</span>
        <span style={{ fontSize: '14px', color: '#1e293b', fontWeight: '600' }}>৳{order.total.toLocaleString()}</span>
      </div>

      <div className='d-flex justify-content-between align-items-center mb-3'>
        <span style={{ fontSize: '14px', color: '#64748b', fontWeight: '500' }}>Delivery Charge</span>
        <span style={{ fontSize: '14px', color: '#1e293b', fontWeight: '600' }}>৳{order.deliveryCharge.toLocaleString()}</span>
      </div>

      <div style={{ height: '1px', background: '#f1f5f9', margin: '20px 0' }}></div>

      <div className='d-flex justify-content-between align-items-center mt-3'>
        <span style={{ fontSize: '16px', color: '#1e293b', fontWeight: '700' }}>Total</span>
        <span style={{ fontSize: '20px', color: '#0891b2', fontWeight: '800' }}>
          ৳{(order.total + order.deliveryCharge).toLocaleString()}
        </span>
      </div>

      <div className="mt-4 p-3 rounded-lg" style={{ background: '#f0f9ff', border: '1px dashed #bae6fd' }}>
        <p className="mb-0" style={{ fontSize: '12px', color: '#0369a1', textAlign: 'center', fontWeight: '500' }}>
          <i className="fa fa-info-circle mr-1"></i> Order prices include all taxes
        </p>
      </div>
    </div>
  );
};

export default OrderSummary;
