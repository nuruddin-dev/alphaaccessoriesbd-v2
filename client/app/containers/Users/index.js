/*
 *
 * Users
 *
 */

import React from 'react';

import { connect } from 'react-redux';

import actions from '../../actions';

import UserList from '../../components/Manager/UserList';
import UserSearch from '../../components/Manager/UserSearch';
import SubPage from '../../components/Manager/SubPage';
import SearchResultMeta from '../../components/Manager/SearchResultMeta';
import NotFound from '../../components/Common/NotFound';
import LoadingIndicator from '../../components/Common/LoadingIndicator';
import Pagination from '../../components/Common/Pagination';

class Users extends React.PureComponent {
  constructor(props) {
    super(props);

    this.state = {
      search: ''
    };
  }

  componentDidMount() {
    this.props.fetchUsers();
  }

  handleUserSearch = e => {
    if (e.value.length >= 2) {
      this.props.searchUsers({ name: 'user', value: e.value });
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
    this.props.fetchUsers(v);
  };

  render() {
    const { users, isLoading, searchedUsers, searchUsers, advancedFilters } =
      this.props;

    const { search } = this.state;
    const isSearch = search.length > 0;
    const filteredUsers = search ? searchedUsers : users;
    const displayPagination = advancedFilters.totalPages > 1;
    const displayUsers = filteredUsers && filteredUsers.length > 0;

    return (
      <div className='users-dashboard'>
        <style>{`
          .users-dashboard .pagination-box .pagination {
            margin-bottom: 0;
            gap: 5px;
          }
          .users-dashboard .pagination-box .page-item .page-link {
            border: 1px solid #e2e8f0;
            border-radius: 8px !important;
            padding: 6px 12px;
            color: #64748b;
            font-size: 13px;
            font-weight: 500;
            transition: all 0.2s;
          }
          .users-dashboard .pagination-box .page-item.active .page-link {
            background-color: #06b6d4;
            border-color: #06b6d4;
            color: #fff;
            box-shadow: 0 4px 12px rgba(6, 182, 212, 0.2);
          }
          .users-dashboard .pagination-box .page-item:hover:not(.active) .page-link {
            background-color: #f1f5f9;
            color: #06b6d4;
          }
          .users-dashboard .search-result-meta {
            padding: 0;
            margin: 0;
            font-size: 14px;
            color: #64748b;
          }
          .users-dashboard .search-result-meta strong {
            color: #06b6d4;
            font-weight: 700;
          }
        `}</style>
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
              Users Management
            </h2>
          </div>
          <div style={{ width: '300px' }}>
            <UserSearch
              onSearch={this.handleUserSearch}
              onSearchSubmit={searchUsers}
            />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm overflow-hidden" style={{ border: '1px solid #f1f5f9' }}>
          <div className="p-3 border-bottom d-flex justify-content-between align-items-center bg-light/50">
            <SearchResultMeta
              label='users'
              count={isSearch ? filteredUsers.length : advancedFilters.count}
            />
            {!isSearch && displayPagination && (
              <Pagination
                totalPages={advancedFilters.totalPages}
                onPagination={this.handleOnPagination}
              />
            )}
          </div>

          <div className="p-0">
            {isLoading ? (
              <div className="py-5 text-center">
                <LoadingIndicator inline />
              </div>
            ) : displayUsers ? (
              <UserList
                users={filteredUsers}
                updateUserRole={this.props.updateUserRole}
              />
            ) : (
              <NotFound message='No users found.' />
            )}
          </div>

          {!isSearch && displayPagination && (
            <div className="p-3 border-top d-flex justify-content-end bg-light/50">
              <Pagination
                totalPages={advancedFilters.totalPages}
                onPagination={this.handleOnPagination}
              />
            </div>
          )}
        </div>
      </div>
    );
  }
}

const mapStateToProps = state => {
  return {
    users: state.users.users,
    searchedUsers: state.users.searchedUsers,
    advancedFilters: state.users.advancedFilters,
    isLoading: state.users.isLoading
  };
};

export default connect(mapStateToProps, actions)(Users);
