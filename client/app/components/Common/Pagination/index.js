/**
 *
 * Pagination
 *
 */

import React from 'react';
import ReactPaginate from 'react-paginate';

const Pagination = props => {
  const { totalPages, onPagination } = props;

  const handlePageClick = event => {
    // Scroll to the top of the page
    window.scrollTo(0, 0);
    // Call the onPagination function to handle the page click
    onPagination('pagination', event.selected + 1);
  };

  return (
    <div className='pagination-box'>
      <ReactPaginate
        nextLabel='next >'
        onPageChange={handlePageClick}
        pageRangeDisplayed={3}
        marginPagesDisplayed={2}
        pageCount={totalPages} // The total number of pages.
        previousLabel='< previous'
        pageClassName='page-item'
        pageLinkClassName='page-link'
        previousClassName='page-item'
        previousLinkClassName='page-link'
        nextClassName='page-item'
        nextLinkClassName='page-link'
        breakLabel='...'
        breakClassName='page-item'
        breakLinkClassName='page-link'
        containerClassName='pagination'
        activeClassName='active'
        renderOnZeroPageCount={null}
      />
    </div>
  );
};

export default Pagination;
