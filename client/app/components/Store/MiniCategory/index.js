/**
 *
 * MiniCategory
 *
 */

import React from 'react';

import { Link } from 'react-router-dom';

const MiniCategory = props => {
  const { categories, toggleCategory } = props;

  const handleMenuItemClick = () => {
    toggleCategory();
  };

  return (
    <div className='mini-brand-list'>
      <div className='d-flex align-items-center'>
        <Link
          to={'/categories'}
          className='text-dark fw-bold'
          role='menuitem'
          onClick={handleMenuItemClick}
        >
          All Categories
        </Link>
      </div>
      <div className='mini-brand-block'>
        {categories.map((category, index) => (
          <div key={index} className='brand-item d-flex align-items-center'>
            <div className='brand-image'>
              <img
                loading='lazy'
                src={category.imageUrl} // Ensure your category has a valid image URL
                alt={category.name}
                className='category-image'
              />
            </div>

            <Link
              to={`/${category.slug}`}
              className='brand-link'
              role='menuitem'
              onClick={handleMenuItemClick}
            >
              {category.name}
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MiniCategory;
