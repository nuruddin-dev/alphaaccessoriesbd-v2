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
  const { user, isMenuOpen, links, toggleMenu, orderNowsCount } = props;

  const getAllowedProvider = link => {
    if (!link.provider) return true;

    const userProvider = user.provider ?? '';
    if (!userProvider) return true;

    return link.provider.includes(userProvider);
  };

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
};

export default AccountMenu;
