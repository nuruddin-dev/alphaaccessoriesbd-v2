/**
 *
 * TagList
 *
 */

import React from 'react';

import { Link } from 'react-router-dom';

const TagList = props => {
  const { tags } = props;

  return (
    <div className='c-list'>
      {tags.map((tag, index) => (
        <Link
          to={`/dashboard/tag/edit/${tag._id}`}
          key={index}
          className='d-block mb-3 p-4 tag-box'
        >
          <div className='d-flex align-items-center justify-content-between mb-2'>
            <h4 className='mb-0'>{tag.name}</h4>
          </div>
          <p className='mb-2 category-desc'>{tag.description}</p>
        </Link>
      ))}
    </div>
  );
};

export default TagList;
