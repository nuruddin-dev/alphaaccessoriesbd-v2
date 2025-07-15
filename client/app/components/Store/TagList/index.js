/**
 *
 * TagList
 *
 */

import React from 'react';

import { Row, Col } from 'reactstrap';
import { Link } from 'react-router-dom';

const TagList = props => {
  const { tags } = props;

  return (
    <div className='tag-list'>
      <h3 className='text-uppercase'>Shop By Tag</h3>
      <hr />
      <Row className='flex-sm-row'>
        {tags.map((tag, index) => (
          <Col xs='6' md='4' lg='3' key={index} className='mb-3 px-2'>
            <Link to={`/shop/tag/${tag.slug}`} className='d-block tag-box'>
              <h5>{tag.name}</h5>
              <p className='tag-desc'>{tag.description}</p>
            </Link>
          </Col>
        ))}
      </Row>
    </div>
  );
};

export default TagList;
