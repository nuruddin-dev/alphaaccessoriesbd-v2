/**
 *
 * ProductList
 *
 */

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import AddToWishList from '../AddToWishList';
import { convertToBengaliDigits } from '../../../utils/conversion';

const ProductList = props => {
  const { products, updateWishlist, authenticated } = props;
  const location = useLocation();
  const isShopRoute = /^\/shop(\/.*)?$/.test(location.pathname);
  const isBaseUrl = location.pathname === '/';

  return (
    <div
      className={
        window.innerWidth < 576 ? 'product-list row mx-0' : 'product-list'
      }
    >
      {products.map((product, index) => (
        <div
          key={index}
          className={
            window.innerWidth < 576
              ? isBaseUrl
                ? 'col-12 p-2'
                : 'col-6 p-2'
              : 'mb-3 mb-md-0'
          }
        >
          <div className='product-container'>
            <div className='item-box'>
              <div className='add-wishlist-box'>
                <AddToWishList
                  id={product._id}
                  liked={product?.isLiked ?? false}
                  enabled={authenticated}
                  updateWishlist={updateWishlist}
                  authenticated={authenticated}
                />
              </div>

              <div className='item-link'>
                <Link
                  to={`/${product.slug}`}
                  className='d-flex flex-column h-100'
                >
                  <div className='item-image-container'>
                    <div className='item-image-box'>
                      <img
                        loading='lazy'
                        className='item-image'
                        src={`${product.imageUrl
                            ? product.imageUrl
                            : '/images/placeholder-image.png'
                          }`}
                      />
                    </div>
                  </div>
                  <div className='item-body'>
                    <div className='item-details pt-3'>
                      <h3 className='item-name'>{product.name}</h3>
                      {product.brand &&
                        Object.keys(product.brand).length > 0 && (
                          <p className='by'>
                            By <span>{product.brand.name}</span>
                          </p>
                        )}
                      {/* <p className='item-desc mb-0'>{product.description}</p> */}
                    </div>
                  </div>
                  <div className='d-flex justify-content-between align-items-center mb-2 item-footer'>
                    {/* Left side */}
                    <div className='d-flex align-items-center'>
                      <p className='price mb-0'>
                        ৳{convertToBengaliDigits(product.price)}
                      </p>
                      {product.previousPrice > 0 && (
                        <p className='previous-price mb-0 ml-2'>
                          ৳{convertToBengaliDigits(product.previousPrice)}
                        </p>
                      )}
                    </div>

                    {/* Right side */}
                    {product.totalReviews > 0 && (
                      <div className='d-flex align-items-center'>
                        <p className='mb-0'>
                          <span className='fs-16 fw-normal mr-1'>
                            {parseFloat(product?.averageRating).toFixed(1)}
                          </span>
                          <span
                            className={`fa fa-star ${product.totalReviews !== 0 ? 'checked' : ''
                              }`}
                            style={{ color: '#ffb302' }}
                          ></span>
                        </p>
                      </div>
                    )}
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ProductList;
