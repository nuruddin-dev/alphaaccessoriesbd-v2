/*
 *
 * Admin
 *
 */

import React from 'react';

import { Switch, Route, useLocation } from 'react-router-dom';
import { Row, Col } from 'reactstrap';

import AccountMenu from '../AccountMenu';
import Page404 from '../../Common/Page404';

import Account from '../../../containers/Account';
import AccountSecurity from '../../../containers/AccountSecurity';
import Address from '../../../containers/Address';
import Order from '../../../containers/Order';
import OrderNow from '../../../containers/OrderNow';
import Users from '../../../containers/Users';
import Category from '../../../containers/Category';
import Product from '../../../containers/Product';
import Brand from '../../../containers/Brand';
import Tag from '../../../containers/Tag';
import Merchant from '../../../containers/Merchant';
import Review from '../../../containers/Review';
import Wishlist from '../../../containers/WishList';
import Invoice from '../../../containers/Invoice';
import Customer from '../../../containers/Customer';
import SalesOverview from '../../../containers/SalesOverview';
import MyShop from '../../../containers/MyShop';
import AccountsManager from '../../../containers/AccountsManager';
import Import from '../../../containers/Import';
import Supplier from '../../../containers/Supplier';
import Challan from '../../../containers/Challan';

const Admin = props => {
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = React.useState(false);

  // Check if the current route is /dashboard/orderNows
  const isOrderNowSelected = location.pathname === '/dashboard/orderNows';
  const isInvoiceSelected = location.pathname.startsWith('/dashboard/invoice') || location.pathname.startsWith('/dashboard/supplier/orders');

  return (
    <div className='admin'>
      <div className='d-flex flex-column flex-md-row' style={{ minHeight: '100vh' }}>
        {!(isOrderNowSelected || isInvoiceSelected) && (
          <>
            {/* Desktop Sidebar */}
            <div
              className={`d-none d-md-block border-right bg-white`}
              style={{
                width: isCollapsed ? '80px' : '260px',
                minWidth: isCollapsed ? '80px' : '260px',
                transition: 'all 0.3s ease',
                position: 'sticky',
                top: '0',
                height: '100vh',
                overflow: 'hidden',
                zIndex: 100
              }}
            >
              <AccountMenu
                {...props}
                isCollapsed={isCollapsed}
                toggleCollapse={() => setIsCollapsed(!isCollapsed)}
                isMobile={false}
              />
            </div>

            {/* Mobile Sidebar (Original behavior) */}
            <div className='d-block d-md-none w-100 mb-3'>
              <AccountMenu {...props} isMobile={true} />
            </div>
          </>
        )}

        <div className={`flex-grow-1 ${isInvoiceSelected ? 'p-0' : 'p-3'}`} style={{ minWidth: 0, backgroundColor: '#f5f7fb' }}>
          <div className='panel-body bg-transparent shadow-none p-0' style={isInvoiceSelected ? { marginTop: 0 } : {}}>
            <Switch>
              <Route exact path='/dashboard' component={Account} />
              <Route path='/dashboard/invoice' component={Invoice} />
              <Route path='/dashboard/accounts' component={AccountsManager} />
              <Route path='/dashboard/myshop' component={MyShop} />
              <Route path='/dashboard/sales-overview' component={SalesOverview} />
              <Route path='/dashboard/customer' component={Customer} />
              <Route path='/dashboard/security' component={AccountSecurity} />
              <Route path='/dashboard/address' component={Address} />
              <Route path='/dashboard/product' component={Product} />
              <Route path='/dashboard/category' component={Category} />
              <Route path='/dashboard/brand' component={Brand} />
              <Route path='/dashboard/tag' component={Tag} />
              <Route path='/dashboard/users' component={Users} />
              <Route path='/dashboard/merchant' component={Merchant} />
              <Route path='/dashboard/orders' component={Order} />
              <Route path='/dashboard/orderNows' component={OrderNow} />
              <Route path='/dashboard/review' component={Review} />
              <Route path='/dashboard/wishlist' component={Wishlist} />
              <Route path='/dashboard/import' component={Import} />
              <Route path='/dashboard/supplier' component={Supplier} />
              <Route path='/dashboard/lendings' component={Challan} />
              <Route path='*' component={Page404} />
            </Switch>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Admin;
