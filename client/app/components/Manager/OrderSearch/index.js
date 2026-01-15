/**
 *
 * OrderSearch
 *
 */

import React from 'react';

import SearchBar from '../../Common/SearchBar';

const OrderSearch = props => {
  return (
    <div className='order-search-wrapper mb-4' style={{ maxWidth: '600px' }}>
      <div style={{ position: 'relative' }}>
        <style>{`
          .order-search-wrapper .search-box {
            border: 2px solid #f1f5f9;
            border-radius: 12px;
            overflow: hidden;
            transition: all 0.2s;
            display: flex;
            align-items: center;
            background: #f8fafc;
          }
          .order-search-wrapper .search-box:focus-within {
            border-color: #06b6d4;
            background: #fff;
            box-shadow: 0 0 0 4px rgba(6, 182, 212, 0.1);
          }
          .order-search-wrapper .input-text-block {
            display: flex;
            width: 100%;
          }
          .order-search-wrapper input {
            border: none !important;
            background: transparent !important;
            padding: 12px 20px !important;
            font-size: 15px !important;
            font-weight: 500 !important;
            color: #1e293b !important;
            width: 100% !important;
          }
          .order-search-wrapper input:focus {
            outline: none !important;
            box-shadow: none !important;
          }
          .order-search-wrapper button {
            background: #06b6d4 !important;
            border: none !important;
            border-radius: 8px !important;
            margin: 6px !important;
            padding: 8px 24px !important;
            font-weight: 600 !important;
            font-size: 14px !important;
            transition: all 0.2s !important;
          }
          .order-search-wrapper button:hover {
            background: #0891b2 !important;
            transform: scale(1.02);
          }
        `}</style>
        <SearchBar
          name='order'
          placeholder='Search by Order ID...'
          btnText='Find Order'
          onSearch={props.onSearch}
          onBlur={props.onBlur}
          onSearchSubmit={props.onSearchSubmit}
        />
      </div>
    </div>
  );
};

export default OrderSearch;
