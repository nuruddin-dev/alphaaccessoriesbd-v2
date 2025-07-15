/**
 *
 * Footer
 *
 */

import React from 'react';

import { Link } from 'react-router-dom';
import { Container } from 'reactstrap';

import Newsletter from '../../../containers/Newsletter';

const Footer = () => {
  const infoLinks = [{ id: 0, name: 'Contact Us', to: '/contact' }];

  const footerBusinessLinks = (
    <ul className='support-links'>
      <li className='footer-link'>
        <Link to='/dashboard'>Account Details</Link>
      </li>
      <li className='footer-link'>
        <Link to='/dashboard/orders'>Orders</Link>
      </li>
    </ul>
  );

  const footerLinks = infoLinks.map(item => (
    <li key={item.id} className='footer-link'>
      <Link key={item.id} to={item.to}>
        {item.name}
      </Link>
    </li>
  ));

  return (
    <footer className='footer'>
      <Container>
        <div className='footer-content'>
          <div className='footer-block'>
            <div className='block-title'>
              <p className='text-uppercase font-weight-bolder m-0'>
                Customer Service
              </p>
            </div>
            <div className='block-content'>
              <ul>{footerLinks}</ul>
              <p>01602786765 (WhatsApp 24/7)</p>
            </div>
          </div>
          <div className='footer-block'>
            <div className='block-title'>
              <p className='text-uppercase font-weight-bolder m-0'>
                Shop Address
              </p>
            </div>
            <div className='block-content'>
              <p>
                Shop no. 27/2, Gate 08, 2nd floor, Sundarban Square Super
                Market, Gulistan, Dhaka 1000, Bangladesh
              </p>
            </div>
          </div>
          <div className='footer-block'>
            <div className='block-title'>
              <p className='text-uppercase font-weight-bolder m-0'>
                Newsletter
              </p>
              <Newsletter />
            </div>
          </div>
        </div>
        <ul className='footer-social-item'>
          <li>
            <a
              href='https://www.facebook.com/alphaaccessoriesbd'
              rel='noreferrer noopener'
              target='_blank'
            >
              <span className='facebook-icon' />
            </a>
          </li>
          <li>
            <a
              href='https://www.instagram.com/alphaaccessoriesbd'
              rel='noreferrer noopener'
              target='_blank'
            >
              <span className='instagram-icon' />
            </a>
          </li>
          <li>
            <a
              href='https://www.youtube.com/@alphaaccessoriesbd'
              rel='noreferrer noopener'
              target='_blank'
            >
              <span className='youtube-icon' />
            </a>
          </li>
          <li>
            <a
              href='https://www.x.com/alphaaccessoriesbd'
              rel='noreferrer noopener'
              target='_blank'
            >
              <span className='twitter-icon' />
            </a>
          </li>
        </ul>
        <div className='footer-copyright'>
          <span>
            © 2020-{new Date().getFullYear()} Alpha. All Rights Reserved.
          </span>
        </div>
      </Container>
    </footer>
  );
};

export default Footer;
