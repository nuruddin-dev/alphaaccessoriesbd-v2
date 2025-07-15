/**
 *
 * CategoryList
 *
 */

import React from 'react';

import { Row, Col } from 'reactstrap';
import { Link } from 'react-router-dom';

const CategoryList = props => {
  const { categories } = props;

  return (
    <div className='category-list'>
      <p className='text-uppercase m-3 font-weight-bolder'>Shop By Category</p>
      <hr />
      <Row className='flex-sm-row'>
        {categories.map((category, index) => (
          <Col xs='6' md='4' lg='3' key={index} className='mb-3 px-2'>
            <Link to={`/${category.slug}`} className='d-block category-box'>
              <h5>{category.name}</h5>
              <p className='category-desc'>{category.description}</p>
            </Link>
          </Col>
        ))}
      </Row>
    </div>
  );
};

export default CategoryList;
