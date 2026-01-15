/**
 *
 * AccountMenu
 *
 */

import React from 'react';

import { NavLink } from 'react-router-dom';
import { Collapse, Navbar } from 'reactstrap';

import Button from '../../Common/Button';

const AccountMenu = props => {
  const { user, isMenuOpen, links, toggleMenu, orderNowsCount, isCollapsed, toggleCollapse, isMobile = true } = props;
  const [topBarVisible, setTopBarVisible] = React.useState(false);

  const handleToggleTopBar = () => {
    window.dispatchEvent(new Event('toggle-dashboard-nav'));
    setTopBarVisible(!topBarVisible);
  };

  const getAllowedProvider = link => {
    if (!link.provider) return true;

    const userProvider = user.provider ?? '';
    if (!userProvider) return true;

    return link.provider.includes(userProvider);
  };

  if (isMobile) {
    return (
      <div className='panel-sidebar'>
        <Button
          text='Dashboard Menu'
          className={`${isMenuOpen ? 'menu-panel' : 'menu-panel collapse'}`}
          ariaExpanded={isMenuOpen ? 'true' : 'false'}
          // ariaLabel={isMenuOpen ? 'dashboard menu expanded' : 'dashboard menu collapse'}
          onClick={toggleMenu}
        />
        <h3 className='panel-title'>Account</h3>
        <Navbar color='light' light expand='md'>
          <Collapse isOpen={isMenuOpen} navbar>
            <ul className='panel-links'>
              {links.map((link, index) => {
                const PREFIX = link.prefix ? link.prefix : '';
                const isProviderAllowed = getAllowedProvider(link);
                if (!isProviderAllowed) return;
                return (
                  <li key={index}>
                    <NavLink
                      to={PREFIX + link.to}
                      activeClassName='active-link'
                      exact
                      onClick={isMenuOpen ? toggleMenu : null}
                    >
                      {link.name}
                      {link.name === 'OrderNows' && orderNowsCount > 0 && (
                        <span className='order-badge'>
                          {orderNowsCount >= 99 ? '99+' : orderNowsCount}
                        </span>
                      )}
                    </NavLink>
                  </li>
                );
              })}
            </ul>
          </Collapse>
        </Navbar>
      </div>
    );
  }

  // Desktop Sidebar Layout
  return (
    <div className='h-100 d-flex flex-column bg-white'>
      {/* Title / Header */}
      <div style={{ height: '60px', display: 'flex', alignItems: 'center', justifyContent: isCollapsed ? 'center' : 'flex-start', padding: isCollapsed ? '0' : '0 20px', borderBottom: '1px solid #f0f0f0' }}>
        {isCollapsed ? (
          <span className='font-weight-bold text-primary' style={{ fontSize: '1.5rem' }}>A</span>
        ) : (
          <div className="d-flex align-items-center justify-content-between w-100">
            <h3 className='panel-title mb-0 text-primary' style={{ fontSize: '1.1rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '170px' }}>
              {user.role === 'ROLE ADMIN' ? `Admin (${user.firstName})` : 'Alpha'}
            </h3>
            <button
              className="btn btn-sm btn-light text-primary border-0 shadow-none bg-transparent p-0"
              onClick={handleToggleTopBar}
              title={topBarVisible ? "Hide Top Menu" : "Show Top Menu"}
            >
              <i className={`fa ${topBarVisible ? 'fa-chevron-circle-up' : 'fa-chevron-circle-down'}`} style={{ fontSize: '1.2rem' }}></i>
            </button>
          </div>
        )}
      </div>

      {/* Scrollable Links */}
      <div className='flex-grow-1' style={{ overflowY: 'auto', overflowX: 'hidden' }}>
        <ul className='list-unstyled m-0 p-0'>
          {links.map((link, index) => {
            const isProviderAllowed = getAllowedProvider(link);
            if (!isProviderAllowed) return null;
            const PREFIX = link.prefix ? link.prefix : '';

            return (
              <li key={index}>
                <NavLink
                  to={PREFIX + link.to}
                  activeClassName='bg-light text-primary border-right border-primary border-3 font-weight-bold'
                  exact={link.to === ''}
                  className='d-flex align-items-center text-decoration-none text-secondary'
                  style={{
                    padding: '12px 20px',
                    transition: 'all 0.2s',
                    justifyContent: isCollapsed ? 'center' : 'flex-start',
                    minHeight: '50px'
                  }}
                  title={link.name} // Tooltip on hover
                >
                  <div style={{ width: '24px', textAlign: 'center', marginRight: isCollapsed ? '0' : '15px' }}>
                    <i className={`fa ${link.icon || 'fa-circle-o'}`} style={{ fontSize: '1.1rem' }}></i>
                  </div>
                  {!isCollapsed && (
                    <span style={{ fontSize: '0.95rem', whiteSpace: 'nowrap' }}>
                      {link.name}
                      {link.name === 'OrderNows' && orderNowsCount > 0 && (
                        <span className='badge badge-danger ml-2'>{orderNowsCount}</span>
                      )}
                    </span>
                  )}
                </NavLink>
              </li>
            )
          })}
        </ul>
      </div>

      {/* Collapse Toggle */}
      <div
        className='p-3 border-top text-center hover-bg-light text-muted'
        onClick={toggleCollapse}
        style={{ cursor: 'pointer', transition: 'background 0.2s' }}
      >
        <i className={`fa ${isCollapsed ? 'fa-angle-double-right' : 'fa-angle-double-left'}`} style={{ fontSize: '1.2rem' }}></i>
      </div>
    </div>
  );
};

export default AccountMenu;
