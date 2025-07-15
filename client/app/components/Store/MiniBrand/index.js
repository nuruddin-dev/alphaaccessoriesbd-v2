/**
 *
 * MiniBrand
 *
 */

import React from 'react';

import { Link } from 'react-router-dom';

const MiniBrand = props => {
  const { brands, toggleBrand } = props;

  const handleMenuItemClick = () => {
    toggleBrand();
  };

  return (
    <div className='mini-brand-list'>
      {/* <div className='d-flex align-items-center justify-content-between min-brand-title'> */}
      <div className='d-flex align-items-center'>
        {/* <h4 className='mb-0 text-uppercase'>Shop By Brand</h4> */}
        <Link
          to={'/brands'}
          className='text-dark fw-bold'
          role='menuitem'
          onClick={handleMenuItemClick}
        >
          All Brands
        </Link>
      </div>
      <div className='mini-brand-block'>
        {brands.map((brand, index) => (
          <div key={index} className='brand-item d-flex align-items-center'>
            {/* <div className='brand-image'>
              <img
                src={brand.imageUrl} // Ensure your category has a valid image URL
                alt={brand.name}
                className='category-image'
              />
            </div> */}

            <Link
              to={`/${brand.slug}`}
              className='brand-link'
              role='menuitem'
              onClick={handleMenuItemClick}
            >
              {brand.name}
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MiniBrand;
