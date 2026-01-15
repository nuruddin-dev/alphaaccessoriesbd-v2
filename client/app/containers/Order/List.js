/*
 *
 * List
 *
 */

import React from 'react';

import { connect } from 'react-redux';

import actions from '../../actions';
import { ROLES } from '../../constants';
import SubPage from '../../components/Manager/SubPage';
import OrderList from '../../components/Manager/OrderList';
import OrderSearch from '../../components/Manager/OrderSearch';
import SearchResultMeta from '../../components/Manager/SearchResultMeta';
import NotFound from '../../components/Common/NotFound';
import LoadingIndicator from '../../components/Common/LoadingIndicator';
import Pagination from '../../components/Common/Pagination';

class List extends React.PureComponent {
  constructor(props) {
    super(props);

    this.state = {
      search: ''
    };
  }

  componentDidMount() {
    this.props.fetchAccountOrders();
  }

  handleOrderSearch = e => {
    if (e.value.length >= 2) {
      this.setState({
        search: e.value
      });
    } else {
      this.setState({
        search: ''
      });
    }
  };

  handleOnPagination = (n, v) => {
    this.props.fetchAccountOrders(v);
  };

  render() {
    const { history, user, orders, isLoading, advancedFilters } = this.props;
    const { search } = this.state;
    const isSearch = search.length > 0;
    const filteredOrders = search
      ? orders.filter(o => o._id.includes(search))
      : orders;

    const displayPagination = advancedFilters.totalPages > 1;
    const displayOrders = filteredOrders && filteredOrders.length > 0;

    return (
      <div className='order-dashboard'>
        <div className="d-flex justify-content-between align-items-center" style={{ background: '#fff', padding: '20px 24px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', marginBottom: '20px' }}>
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
              Your Orders
            </h2>
          </div>
          {user.role === ROLES.Admin && (
            <button
              className="btn-neon btn-neon--cyan"
              onClick={() => history.push('/dashboard/orders/')}
            >
              Customer Orders
            </button>
          )}
        </div>

        <div className="bg-white rounded shadow-sm p-3">
          <OrderSearch
            onBlur={this.handleOrderSearch}
            onSearch={this.handleOrderSearch}
            onSearchSubmit={this.handleOrderSearch}
          />

          {isLoading && <LoadingIndicator />}
          {displayOrders && (
            <>
              {!isSearch && displayPagination && (
                <Pagination
                  totalPages={advancedFilters.totalPages}
                  onPagination={this.handleOnPagination}
                />
              )}

              <SearchResultMeta
                label='orders'
                count={isSearch ? filteredOrders.length : advancedFilters.count}
              />
              <OrderList orders={filteredOrders} user={user} />
            </>
          )}
          {!isLoading && !displayOrders && (
            <NotFound message='You have no orders yet.' />
          )}
        </div>
      </div>
    );
  }
}

const mapStateToProps = state => {
  return {
    user: state.account.user,
    orders: state.order.orders,
    isLoading: state.order.isLoading,
    advancedFilters: state.order.advancedFilters,
    isOrderAddOpen: state.order.isOrderAddOpen
  };
};

export default connect(mapStateToProps, actions)(List);
