/**
 *
 * SearchResultMeta
 *
 */

import React from 'react';

const SearchResultMeta = props => {
  const { count, label } = props;

  return (
    <div className='search-result-meta'>
      Find <strong>{count}</strong> {label}
    </div>
  );
};

export default SearchResultMeta;
