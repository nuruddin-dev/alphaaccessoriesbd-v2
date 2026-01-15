/**
 *
 * OrderList
 *
 */

import React from 'react';

import { Link } from 'react-router-dom';

import { formatDate } from '../../../utils/date';

const OrderList = props => {
  const { orders, user } = props;

  const renderFirstItem = order => {
    if (order.products) {
      const product = order.products[0].product;
      return (
        <img
          loading='lazy'
          className='item-image'
          src={`${product && product?.imageUrl
            ? product?.imageUrl
            : '/images/placeholder-image.png'
            }`}
        />
      );
    } else {
      return (
        <img
          loading='lazy'
          className='item-image'
          src='/images/placeholder-image.png'
        />
      );
    }
  };

  return (
    <div className='order-list'>
      {orders.map((order, index) => (
        <div key={index} className='order-box' style={{
          background: '#fff',
          borderRadius: '16px',
          padding: '20px',
          marginBottom: '20px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
          border: '1px solid #f1f5f9',
          transition: 'all 0.2s ease-in-out',
          cursor: 'pointer'
        }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
        >
          <Link to={`/order/${order._id}`} className='d-block box-link' style={{ textDecoration: 'none' }}>
            <div className='d-flex flex-column flex-lg-row align-items-center'>
              <div className='order-first-item mb-3 mb-lg-0 mr-lg-4' style={{ width: '100px', height: '100px', borderRadius: '12px', overflow: 'hidden', flexShrink: 0 }}>
                {renderFirstItem(order)}
              </div>

              <div className='d-flex flex-column flex-grow-1 w-100'>
                <div className='d-flex justify-content-between align-items-start mb-3'>
                  <div>
                    <span style={{ fontSize: '12px', color: '#64748b', display: 'block', textTransform: 'uppercase', fontWeight: 'bold' }}>Order Number</span>
                    <span style={{ fontSize: '16px', color: '#1e293b', fontWeight: '700' }}>#{order._id}</span>
                  </div>
                  <div>
                    {order?.products ? (
                      <span style={{
                        background: '#e0f7fa',
                        color: '#0891b2',
                        padding: '6px 14px',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: '700',
                        textTransform: 'uppercase'
                      }}>
                        {order?.products[0].status}
                      </span>
                    ) : (
                      <span style={{
                        background: '#f1f5f9',
                        color: '#64748b',
                        padding: '6px 14px',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: '700'
                      }}>
                        Unavailable
                      </span>
                    )}
                  </div>
                </div>

                <div className='d-flex flex-wrap justify-content-between align-items-center' style={{ borderTop: '1px solid #f1f5f9', paddingTop: '15px' }}>
                  <div className='d-flex gap-4'>
                    <div className='mr-4'>
                      <span style={{ fontSize: '11px', color: '#94a3b8', display: 'block' }}>Date Ordered</span>
                      <span style={{ fontSize: '13px', color: '#475569', fontWeight: '500' }}>{formatDate(order.created)}</span>
                    </div>
                    <div>
                      <span style={{ fontSize: '11px', color: '#94a3b8', display: 'block' }}>Total Amount</span>
                      <span style={{ fontSize: '13px', color: '#475569', fontWeight: '700' }}>৳{(order.total + order.deliveryCharge).toLocaleString()}</span>
                    </div>
                  </div>

                  <div style={{ color: '#06b6d4', fontWeight: '600', fontSize: '14px' }}>
                    View Details <i className="fa fa-chevron-right ml-1" style={{ fontSize: '10px' }}></i>
                  </div>
                </div>
              </div>
            </div>
          </Link>
        </div>
      ))}
    </div>
  );
};

export default OrderList;
