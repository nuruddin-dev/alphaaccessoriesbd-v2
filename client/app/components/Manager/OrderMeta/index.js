/**
 *
 * OrderMeta
 *
 */

import React from 'react';

import { Row, Col } from 'reactstrap';

import { CART_ITEM_STATUS, ROLES } from '../../../constants';
import { formatDate } from '../../../utils/date';
import Button from '../../Common/Button';
import { ArrowBackIcon } from '../../Common/Icon';

const OrderMeta = props => {
  const { order, cancelOrder, onBack, user } = props;

  const renderMetaAction = () => {
    const isNotDelivered =
      order.products.filter(i => i.status === CART_ITEM_STATUS.Delivered)
        .length < 1;

    if (isNotDelivered) {
      return <Button size='sm' text='Cancel Order' onClick={cancelOrder} />;
    }
  };

  return (
    <div className='order-meta'>
      <div className="d-flex justify-content-between align-items-center mb-4" style={{ background: '#fff', padding: '20px 24px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <div className="d-flex align-items-center">
          <div style={{
            width: '4px',
            height: '24px',
            background: '#06b6d4',
            borderRadius: '2px',
            marginRight: '12px'
          }}></div>
          <h2 className="mb-0" style={{
            fontWeight: '700',
            color: '#1e293b',
            fontSize: '20px',
            letterSpacing: '-0.5px'
          }}>
            Order Details
          </h2>
        </div>
        <div className='d-flex align-items-center gap-3'>
          <button
            className="btn-neon btn-neon--cyan"
            style={{ padding: '8px 20px', fontSize: '14px' }}
            onClick={onBack}
          >
            <i className="fa fa-arrow-left mr-2"></i> Back to orders
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-4 border border-slate-100 mb-4">
        <Row>
          <Col xs='12' md='8'>
            <div className="d-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
              <div>
                <span style={{ fontSize: '12px', color: '#64748b', display: 'block', textTransform: 'uppercase', fontWeight: 'bold' }}>Order ID</span>
                <span style={{ fontSize: '15px', color: '#1e293b', fontWeight: '700' }}>#{order._id}</span>
              </div>
              <div>
                <span style={{ fontSize: '12px', color: '#64748b', display: 'block', textTransform: 'uppercase', fontWeight: 'bold' }}>Order Date</span>
                <span style={{ fontSize: '15px', color: '#1e293b', fontWeight: '600' }}>{formatDate(order.created)}</span>
              </div>
              {user.role === ROLES.Admin && (
                <>
                  <div>
                    <span style={{ fontSize: '12px', color: '#64748b', display: 'block', textTransform: 'uppercase', fontWeight: 'bold' }}>Customer Contact</span>
                    <span style={{ fontSize: '15px', color: '#1e293b', fontWeight: '600' }}>{order.phoneNumber}</span>
                  </div>
                </>
              )}
            </div>
            {user.role === ROLES.Admin && (
              <div className="mt-4 pt-3" style={{ borderTop: '1px solid #f1f5f9' }}>
                <span style={{ fontSize: '12px', color: '#64748b', display: 'block', textTransform: 'uppercase', fontWeight: 'bold' }}>Shipping Address</span>
                <span style={{ fontSize: '15px', color: '#475569', fontWeight: '500', lineHeight: '1.6' }}>{order.deliveryAddress}</span>
              </div>
            )}
          </Col>
          <Col xs='12' md='4'>
            <div className="d-flex justify-content-md-end align-items-center h-100 mt-3 mt-md-0">
              {renderMetaAction()}
            </div>
          </Col>
        </Row>
      </div>
    </div>
  );
};

export default OrderMeta;
