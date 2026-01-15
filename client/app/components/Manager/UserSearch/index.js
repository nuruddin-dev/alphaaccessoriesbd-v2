import React from 'react';
import SearchBar from '../../Common/SearchBar';

const UserSearch = props => {
  return (
    <div className='user-search-wrap'>
      <style>{`
        .user-search-wrap .search-box {
          margin-bottom: 0 !important;
        }
        .user-search-wrap .input-text-block {
          position: relative;
          display: flex;
          align-items: center;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          padding: 2px;
          transition: all 0.3s ease;
        }
        .user-search-wrap .input-text-block:focus-within {
          border-color: #06b6d4;
          box-shadow: 0 0 0 3px rgba(6, 182, 212, 0.1);
          background: #fff;
        }
        .user-search-wrap .input-text {
          border: none !important;
          background: transparent !important;
          padding: 8px 16px !important;
          height: 38px !important;
          font-size: 14px !important;
          flex-grow: 1;
        }
        .user-search-wrap .input-text:focus {
          box-shadow: none !important;
        }
        .user-search-wrap button {
          border-radius: 8px !important;
          background: #06b6d4 !important;
          border: none !important;
          padding: 0 16px !important;
          height: 34px !important;
          font-size: 13px !important;
          font-weight: 600 !important;
          margin-right: 2px !important;
          box-shadow: 0 2px 4px rgba(6, 182, 212, 0.2) !important;
        }
        .user-search-wrap button:hover {
          background: #0891b2 !important;
          transform: translateY(-1px);
        }
      `}</style>
      <SearchBar
        name='user'
        placeholder='Search name or email...'
        btnText='Search'
        onSearch={props.onSearch}
        onBlur={props.onBlur}
        onSearchSubmit={props.onSearchSubmit}
      />
    </div>
  );
};

export default UserSearch;
