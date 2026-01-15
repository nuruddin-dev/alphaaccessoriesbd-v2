/*
 *
 * Review
 *
 */

import React from 'react';
import { connect } from 'react-redux';

import actions from '../../actions';

import SubPage from '../../components/Manager/SubPage';
import ReviewList from '../../components/Manager/ReviewList';
import SearchResultMeta from '../../components/Manager/SearchResultMeta';
import LoadingIndicator from '../../components/Common/LoadingIndicator';
import NotFound from '../../components/Common/NotFound';
import Pagination from '../../components/Common/Pagination';

class Review extends React.PureComponent {
  componentDidMount() {
    this.props.fetchReviews();
  }

  render() {
    const {
      reviews,
      isLoading,
      advancedFilters,
      fetchReviews,
      approveReview,
      rejectReview,
      deleteReview
    } = this.props;

    const displayPagination = advancedFilters.totalPages > 1;
    const displayReviews = reviews && reviews.length > 0;

    return (
      <div className='review-dashboard'>
        <div className="d-flex align-items-center" style={{ background: '#fff', padding: '20px 24px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', marginBottom: '20px' }}>
          <div className="d-flex align-items-center">
            <div style={{
              width: '4px',
              height: '24px',
              background: '#06b6d4',
              borderRadius: '2px',
              marginRight: '12px'
            }}></div>
            <h2 className="mb-0" style={{
              fontWeight: '700',
              color: '#1e293b',
              fontSize: '20px',
              letterSpacing: '-0.5px'
            }}>
              Reviews
            </h2>
          </div>
        </div>

        <div className="bg-white rounded shadow-sm p-3">
          {isLoading && <LoadingIndicator />}

          {displayPagination && (
            <Pagination
              totalPages={advancedFilters.totalPages}
              onPagination={fetchReviews}
            />
          )}
          {displayReviews && (
            <>
              <SearchResultMeta label='reviews' count={advancedFilters.count} />
              <ReviewList
                reviews={reviews}
                approveReview={approveReview}
                rejectReview={rejectReview}
                deleteReview={deleteReview}
              />
            </>
          )}

          {!isLoading && !displayReviews && (
            <NotFound message='No reviews found.' />
          )}
        </div>
      </div>
    );
  }
}

const mapStateToProps = state => {
  return {
    reviews: state.review.reviews,
    isLoading: state.review.isLoading,
    advancedFilters: state.review.advancedFilters
  };
};

export default connect(mapStateToProps, actions)(Review);
