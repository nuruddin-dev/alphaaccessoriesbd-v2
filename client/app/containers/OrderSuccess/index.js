/*
 *
 * OrderSuccess
 *
 */

import React from 'react';

import { connect } from 'react-redux';
import { Link } from 'react-router-dom';

import actions from '../../actions';

import NotFound from '../../components/Common/NotFound';
import LoadingIndicator from '../../components/Common/LoadingIndicator';

class OrderSuccess extends React.PureComponent {
  componentDidMount() {
    const id = this.props.match.params.id;
    this.props.fetchOrder(id);
  }

  componentDidUpdate(prevProps) {
    if (this.props.match.params.id !== prevProps.match.params.id) {
      const id = this.props.match.params.id;
      this.props.fetchOrder(id);
    }
  }

  render() {
    const { order, isLoading } = this.props;

    return (
      <div className='order-success'>
        {isLoading ? (
          <LoadingIndicator />
        ) : order._id ? (
          <div className='order-message'>
            <p className='font-weight-bolder m-0'>
              অর্ডার করার জন্য আপনাকে ধন্যবাদ
            </p>
            <p>
              <Link
                to={{
                  pathname: `/order/${order._id}?success`,
                  state: { prevPath: location.pathname }
                }}
                // to={`/order/${order._id}?success`}
                className='order-label'
              >
                #{order._id}
              </Link>{' '}
              নম্বর অর্ডারটি সম্পন্ন হয়েছে ।
            </p>
            <p>
              আমাদের একজন প্রতিনিধি সল্প সময়ের মধ্যে মোবাইলে যোগাযোগের মাধ্যমে
              আপনার অর্ডারটি নিশ্চিত করবে ।
            </p>
            <div className='order-success-actions'>
              <Link to='/dashboard/orders' className='btn-link'>
                অর্ডার দেখুন
              </Link>
              <Link to='/shop' className='btn-link shopping-btn'>
                কেনাকাটা চালিয়ে যান
              </Link>
            </div>
          </div>
        ) : (
          <NotFound message='No order found.' />
        )}
      </div>
    );
  }
}

const mapStateToProps = state => {
  return {
    order: state.order.order,
    isLoading: state.order.isLoading
  };
};

export default connect(mapStateToProps, actions)(OrderSuccess);
