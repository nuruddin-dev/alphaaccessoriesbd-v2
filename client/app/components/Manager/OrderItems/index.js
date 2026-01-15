/**
 *
 * OrderItems
 *
 */

import React from 'react';

import { Link } from 'react-router-dom';
import { Row, Col, DropdownItem } from 'reactstrap';

import { ROLES, CART_ITEM_STATUS } from '../../../constants';
import Button from '../../Common/Button';
import DropdownConfirm from '../../Common/DropdownConfirm';

const OrderItems = props => {
  const { order, user, updateOrderItemStatus } = props;

  const renderPopoverContent = item => {
    const statuses = Object.values(CART_ITEM_STATUS);

    return (
      <div className='d-flex flex-column align-items-center justify-content-center'>
        {statuses.map((s, i) => (
          <DropdownItem
            key={`${s}-${i}`}
            className={s === item?.status ? 'active' : ''}
            onClick={() => updateOrderItemStatus(item._id, s)}
          >
            {s}
          </DropdownItem>
        ))}
      </div>
    );
  };

  const renderItemsAction = item => {
    const isAdmin = user.role === ROLES.Admin;

    if (item.status === CART_ITEM_STATUS.Delivered) {
      return (
        <Link
          to={`/${item.product.slug}`}
          className='btn-link text-center py-2 fs-12'
          style={{ minWidth: 120 }}
        >
          Reivew Product
        </Link>
      );
    } else if (item.status !== 'Cancelled') {
      if (!isAdmin) {
        return (
          <DropdownConfirm label='Cancel'>
            <div className='d-flex flex-column align-items-center justify-content-center p-2'>
              <p className='text-center mb-2'>{`Are you sure you want to cancel ${item.product?.name}.`}</p>
              <Button
                variant='danger'
                id='CancelOrderItemPopover'
                size='sm'
                text='Confirm Cancel'
                role='menuitem'
                className='cancel-order-btn'
                onClick={() => updateOrderItemStatus(item._id, 'Cancelled')}
              />
            </div>
          </DropdownConfirm>
        );
      } else {
        return (
          <DropdownConfirm
            label={item.product && item.status}
            className={isAdmin ? 'admin' : ''}
          >
            {renderPopoverContent(item)}
          </DropdownConfirm>
        );
      }
    }
  };

  return (
    <div className='order-items pt-3'>
      <div className="d-flex align-items-center mb-4">
        <div style={{ width: '3px', height: '18px', background: '#06b6d4', marginRight: '10px', borderRadius: '2px' }}></div>
        <h2 className="mb-0" style={{ fontSize: '18px', fontWeight: '700', color: '#334155' }}>Order Items</h2>
      </div>

      <div className="order-items-container" style={{ display: 'grid', gap: '16px' }}>
        {order.products.map((item, index) => (
          <div key={index} className='order-item-card' style={{
            background: '#fff',
            borderRadius: '16px',
            padding: '20px',
            border: '1px solid #f1f5f9',
            boxShadow: '0 2px 4px rgba(0,0,0,0.01)',
            transition: 'all 0.2s ease'
          }}>
            <Row className="align-items-center">
              <Col xs='12' md='6'>
                <div className='d-flex align-items-center'>
                  <div style={{ width: '80px', height: '80px', borderRadius: '12px', overflow: 'hidden', flexShrink: 0, border: '1px solid #f1f5f9' }}>
                    <img
                      loading='lazy'
                      className='item-image'
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      src={`${item.product && item.product.imageUrl
                          ? item.product.imageUrl
                          : '/images/placeholder-image.png'
                        }`}
                    />
                  </div>
                  <div className='ml-3'>
                    {item.product ? (
                      <>
                        <Link to={`/${item.product?.slug}`} style={{ textDecoration: 'none' }}>
                          <h4 style={{ fontSize: '15px', fontWeight: '700', color: '#1e293b', marginBottom: '4px' }}>
                            {item.product?.name}
                          </h4>
                        </Link>
                        <span style={{ fontSize: '14px', color: '#0891b2', fontWeight: '600' }}>
                          ৳{(item.purchasePrice || item.product.price).toLocaleString()}
                        </span>
                      </>
                    ) : (
                      <h4 style={{ fontSize: '15px', fontWeight: '700', color: '#94a3b8' }}>Product Not Available</h4>
                    )}
                  </div>
                </div>
              </Col>

              <Col xs='12' md='6' className="mt-3 mt-md-0">
                <div className='d-flex justify-content-between align-items-center bg-slate-50 p-3 rounded-lg' style={{ background: '#f8fafc', borderRadius: '12px' }}>
                  <div className='text-center px-1'>
                    <span style={{ fontSize: '10px', color: '#64748b', display: 'block', textTransform: 'uppercase', marginBottom: '2px' }}>Status</span>
                    <span style={{
                      fontSize: '11px',
                      fontWeight: '700',
                      color: item.status === 'Cancelled' ? '#ef4444' : '#0891b2',
                      background: item.status === 'Cancelled' ? '#fee2e2' : '#e0f7fa',
                      padding: '2px 8px',
                      borderRadius: '10px',
                      whiteSpace: 'nowrap'
                    }}>
                      {item.status}
                    </span>
                  </div>

                  <div className='text-center px-1'>
                    <span style={{ fontSize: '10px', color: '#64748b', display: 'block', textTransform: 'uppercase', marginBottom: '2px' }}>Qty</span>
                    <span style={{ fontSize: '13px', fontWeight: '700', color: '#1e293b' }}>{item.quantity}</span>
                  </div>

                  <div className='text-center px-1'>
                    <span style={{ fontSize: '10px', color: '#64748b', display: 'block', textTransform: 'uppercase', marginBottom: '2px' }}>Color</span>
                    <div
                      style={{
                        backgroundColor: item.color.toLowerCase(),
                        width: '18px',
                        height: '18px',
                        margin: '0 auto',
                        borderRadius: '4px',
                        border: '2px solid #fff',
                        boxShadow: '0 0 0 1px #e2e8f0'
                      }}
                    />
                  </div>

                  <div className='text-center px-1'>
                    <span style={{ fontSize: '10px', color: '#64748b', display: 'block', textTransform: 'uppercase', marginBottom: '2px' }}>Total Price</span>
                    <span style={{ fontSize: '13px', fontWeight: '700', color: '#1e293b' }}>৳{item.totalPrice.toLocaleString()}</span>
                  </div>
                </div>

                {item.product && (
                  <div className='text-right mt-3'>
                    {renderItemsAction(item)}
                  </div>
                )}
              </Col>
            </Row>
          </div>
        ))}
      </div>
    </div>
  );
};

export default OrderItems;
