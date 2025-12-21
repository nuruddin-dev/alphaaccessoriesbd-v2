/**
 *
 * Navigation
 *
 */

import React from 'react';

import { connect } from 'react-redux';
import { Link, NavLink as ActiveLink, withRouter } from 'react-router-dom';
import Autosuggest from 'react-autosuggest';
import AutosuggestHighlightMatch from 'autosuggest-highlight/match';
import AutosuggestHighlightParse from 'autosuggest-highlight/parse';
import { ROLES } from '../../constants';
import { getImagePath } from '../../utils';
import {
  Container,
  Row,
  Col,
  Navbar,
  Nav,
  NavItem,
  NavLink,
  UncontrolledDropdown,
  Dropdown,
  DropdownToggle,
  DropdownMenu,
  DropdownItem
} from 'reactstrap';

import actions from '../../actions';

import Button from '../../components/Common/Button';
import CartIcon from '../../components/Common/CartIcon';
import { BarsIcon, ProfileIcon } from '../../components/Common/Icon';
import { AboutIcon } from '../../components/Common/Icon';
import MiniBrand from '../../components/Store//MiniBrand';
import Menu from '../NavigationMenu';
import Cart from '../Cart';
import MiniCategory from '../../components/Store/MiniCategory';

class Navigation extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      isBrandHovered: false,
      isCategoryHovered: false,
      shouldMiniBrandOpen: false,
      shouldMiniCategoryOpen: false
    };

    // Bind methods
    this.handleBrandMouseEnter = this.handleBrandMouseEnter.bind(this);
    this.handleBrandMouseLeave = this.handleBrandMouseLeave.bind(this);
    this.handleCategoryMouseEnter = this.handleCategoryMouseEnter.bind(this);
    this.handleCategoryMouseLeave = this.handleCategoryMouseLeave.bind(this);
  }
  componentDidMount() {
    this.props.fetchStoreBrands();
    this.props.fetchStoreCategories();
  }

  toggleBrand() {
    this.props.fetchStoreBrands();
    this.props.toggleBrand();
  }
  toggleCategory() {
    this.props.fetchStoreCategories();
    this.props.toggleCategory();
  }

  handleBrandMouseEnter() {
    this.setState({ isBrandHovered: true });
    this.props.fetchStoreBrands(); // Fetch brands when hovering
  }

  handleBrandMouseLeave() {
    this.setState({ isBrandHovered: false, shouldMiniBrandOpen: false });
  }
  handleCategoryMouseEnter() {
    this.setState({ isCategoryHovered: true });
    this.props.fetchStoreCategories(); // Fetch categories when hovering
  }

  handleCategoryMouseLeave() {
    this.setState({ isCategoryHovered: false, shouldMiniCategoryOpen: false });
  }

  toggleMenu() {
    this.props.fetchStoreCategories();
    this.props.toggleMenu();
  }

  getSuggestionValue(suggestion) {
    return suggestion.name;
  }

  renderSuggestion(suggestion, { query, isHighlighted }) {
    const BoldName = (suggestion, query) => {
      const matches = AutosuggestHighlightMatch(suggestion.name, query);
      const parts = AutosuggestHighlightParse(suggestion.name, matches);

      return (
        <div>
          {parts.map((part, index) => {
            const className = part.highlight
              ? 'react-autosuggest__suggestion-match'
              : null;
            return (
              <span className={className} key={index}>
                {part.text}
              </span>
            );
          })}
        </div>
      );
    };

    return (
      <Link to={`/${suggestion.slug}`}>
        <div className='d-flex'>
          <img
            loading='lazy'
            className='item-image'
            src={`${suggestion.imageUrl
                ? suggestion.imageUrl
                : '/images/placeholder-image.png'
              }`}
          />
          <div>
            <Container>
              <Row>
                <Col>
                  <span className='name'>{BoldName(suggestion, query)}</span>
                </Col>
              </Row>
              <Row>
                <Col>
                  <span className='price'>৳{suggestion.price}</span>
                </Col>
              </Row>
            </Container>
          </div>
        </div>
      </Link>
    );
  }

  render() {
    const {
      history,
      authenticated,
      user,
      cartItems,
      brands,
      categories,
      signOut,
      isMenuOpen,
      isCartOpen,
      isBrandOpen,
      toggleCart,
      toggleMenu,
      searchValue,
      suggestions,
      onSearch,
      onSuggestionsFetchRequested,
      onSuggestionsClearRequested
    } = this.props;

    const {
      isBrandHovered,
      isCategoryHovered,
      shouldMiniBrandOpen,
      shouldMiniCategoryOpen
    } = this.state;

    const isSmallDevice = window.innerWidth <= 768 ? true : false;

    const inputProps = {
      placeholder: 'Search Products',
      value: searchValue,
      onChange: (_, { newValue }) => {
        onSearch(newValue);
      }
    };

    return (
      <header className='header fixed-mobile-header'>
        {/* ======= Top Div (information) ======= */}
        {(!user || user.role !== ROLES.Admin) && (
          <div className='header-info'>
            {/* <Container> */}
            <Row className='p-0 m-0'>
              <Col
                lg={{ size: 3, order: 1 }}
                className='text-center d-none d-lg-block'
              >
                <i className='fa fa-truck' />
                <span>Cash On Delivery</span>
              </Col>
              <Col
                lg={{ size: 3, order: 2 }}
                md={{ size: 4, order: 2 }}
                className='text-center d-none d-md-block'
              >
                <i className='fa fa-facebook' />
                <a
                  href='https://www.facebook.com/alphaaccessorie'
                  target='_blank'
                  className='header-top-anchor'
                >
                  Facebook
                </a>
              </Col>
              <Col
                lg={{ size: 3, order: 3 }}
                md={{ size: 4, order: 3 }}
                className='text-center d-none d-md-block'
              >
                <i className='fa fa-youtube' />
                <a
                  href='https://www.youtube.com/@alphaaccessory'
                  target='_blank'
                  className='header-top-anchor'
                >
                  YouTube
                </a>{' '}
              </Col>
              <Col
                lg={{ size: 3, order: 4 }}
                md={{ size: 4, order: 4 }}
                className='text-center d-none d-md-block'
              >
                <i className='fa fa-phone' />
                <span>Call us 01602786765</span>
              </Col>
              <Col xs='2' className='text-center d-block d-md-none'>
                <a
                  href='fb://page/alphaaccessorie'
                  onClick={e => {
                    e.preventDefault();
                    window.open(
                      'https://www.facebook.com/alphaaccessorie',
                      '_blank'
                    );
                  }}
                >
                  <i className='fa fa-facebook'></i>
                </a>
              </Col>
              <Col xs='2' className='text-center d-block d-md-none'>
                <a
                  href='youtube://@alphaaccessory'
                  onClick={e => {
                    e.preventDefault();
                    window.open(
                      'https://www.youtube.com/@alphaaccessory',
                      '_blank'
                    );
                  }}
                >
                  <i className='fa fa-youtube'></i>
                </a>
              </Col>
              <Col xs='2' className='text-center d-block d-md-none'>
                <a href='https://wa.me/+8801602786765' target='_blank'>
                  <i className='fa fa-whatsapp'></i>
                </a>
              </Col>
              <Col xs='6' className='text-center d-block d-md-none'>
                <a href='tel:+8801602786765'>
                  <i className='fa fa-phone'></i>
                  <span>01602786765</span>
                </a>
              </Col>
            </Row>
            {/* </Container> */}
          </div>
        )}

        {/* =============================================== */}

        {/* ======= Navigation ======= */}
        {/* <Container> */}
        <Row className='p-0 m-0 align-items-center top-header'>
          {/* Logo */}
          <Col
            xs={{ size: 8, order: 1 }}
            sm={{ size: 8, order: 1 }}
            md={{ size: 8, order: 1 }}
            lg={{ size: 1, order: 1 }}
            className='pr-0'
          >
            <Link to='/' className='d-flex align-items-center'>
              <img
                loading='lazy'
                src={getImagePath('favicon.ico')}
                alt='ALPHA'
                height={40}
                width={40}
                className='d-flex' // Add margin to the right of the image
              />

              <p
                className='ml-2 mb-0 text-white fw-bold'
                style={{ fontSize: '20px' }}
              >
                Alpha
              </p>
            </Link>
          </Col>

          <Col
            xs={{ size: 12, order: 3 }}
            sm={{ size: 12, order: 3 }}
            md={{ size: 12, order: 3 }}
            lg={{ size: 4, order: 2 }}
            className='p-0'
          >
            <Navbar>
              <Nav className='navbar-left'>
                {/* Categories */}
                {/* {categories && categories.length > 0 && (
                    <span
                      className='d-flex nav-link'
                      style={{ cursor: 'pointer' }} // Add cursor pointer to indicate it's clickable
                      onClick={() => this.toggleMenu()} // Same click handler as the button
                    >
                      Categories
                    </span>
                  )} */}

                {categories && categories.length > 0 && (
                  <div
                    className='dropdown-container'
                    onMouseEnter={this.handleCategoryMouseEnter}
                    onMouseLeave={this.handleCategoryMouseLeave}
                  >
                    <Dropdown
                      nav
                      inNavbar
                      isOpen={
                        isSmallDevice
                          ? shouldMiniCategoryOpen
                          : isCategoryHovered
                      }
                      toggle={() =>
                        isSmallDevice
                          ? shouldMiniCategoryOpen
                            ? (this.handleCategoryMouseLeave(),
                              this.setState({
                                shouldMiniCategoryOpen: false
                              }))
                            : (this.handleCategoryMouseEnter(),
                              this.setState({ shouldMiniCategoryOpen: true }))
                          : this.handleCategoryMouseEnter()
                      }
                    >
                      <DropdownToggle
                        nav
                        onClick={() => {
                          if (!isSmallDevice) {
                            history.push('/categories');
                          }
                        }}
                      >
                        Categories
                        <span className='fa fa-chevron-down dropdown-caret'></span>
                      </DropdownToggle>
                      <DropdownMenu className='nav-brand-dropdown m-0 glass-effect'>
                        <div className='mini-brand'>
                          <MiniCategory
                            categories={categories}
                            toggleCategory={this.handleCategoryMouseLeave}
                          />
                        </div>
                      </DropdownMenu>
                    </Dropdown>
                  </div>
                )}

                {/* Shop */}

                <NavItem>
                  <NavLink
                    tag={ActiveLink}
                    to='/shop'
                    activeClassName='active'
                    className={isSmallDevice ? 'px-0' : ''}
                  >
                    Shop
                  </NavLink>
                </NavItem>

                {/* Brands */}
                {brands && brands.length > 0 && (
                  <div
                    className='dropdown-container'
                    onMouseEnter={this.handleBrandMouseEnter}
                    onMouseLeave={this.handleBrandMouseLeave}
                  >
                    <Dropdown
                      nav
                      inNavbar
                      isOpen={
                        isSmallDevice ? shouldMiniBrandOpen : isBrandHovered
                      }
                      toggle={() =>
                        isSmallDevice
                          ? shouldMiniBrandOpen
                            ? (this.handleBrandMouseLeave(),
                              this.setState({ shouldMiniBrandOpen: false }))
                            : (this.handleBrandMouseEnter(),
                              this.setState({ shouldMiniBrandOpen: true }))
                          : this.handleBrandMouseEnter()
                      }
                    >
                      <DropdownToggle
                        nav
                        onClick={() => {
                          if (!isSmallDevice) {
                            history.push('/brands');
                          }
                        }}
                      >
                        Brands
                        <span className='fa fa-chevron-down dropdown-caret'></span>
                      </DropdownToggle>
                      <DropdownMenu
                        right={isSmallDevice}
                        className='nav-brand-dropdown m-0 glass-effect'
                      >
                        <div className='mini-brand'>
                          <MiniBrand
                            brands={brands}
                            toggleBrand={this.handleBrandMouseLeave}
                          />
                        </div>
                      </DropdownMenu>
                    </Dropdown>
                  </div>
                )}

                {/* About Us */}
                <NavItem>
                  {/* Text link visible on large screens */}
                  <NavLink
                    tag={ActiveLink}
                    to='/about-us'
                    activeClassName='active'
                    className={isSmallDevice ? 'px-0' : ''}
                  >
                    About Us
                  </NavLink>
                </NavItem>
              </Nav>
            </Navbar>
          </Col>

          {/* Search */}
          <Col
            xs={{ size: 12, order: 4 }}
            sm={{ size: 12, order: 4 }}
            md={{ size: 12, order: 4 }}
            lg={{ size: 5, order: 3 }}
            className='pt-2 pb-2 '
          >
            <Autosuggest
              suggestions={suggestions}
              onSuggestionsFetchRequested={onSuggestionsFetchRequested}
              onSuggestionsClearRequested={onSuggestionsClearRequested}
              getSuggestionValue={this.getSuggestionValue}
              renderSuggestion={this.renderSuggestion}
              inputProps={inputProps}
              onSuggestionSelected={(_, item) => {
                history.push(`/${item.suggestion.slug}`);
              }}
            />
          </Col>

          <Col
            xs={{ size: 4, order: 2 }}
            sm={{ size: 4, order: 2 }}
            md={{ size: 4, order: 2 }}
            lg={{ size: 2, order: 4 }}
          >
            <Navbar expand='md' className='mt-1 mt-md-0'>
              {/* Cart Icon on pc */}
              <CartIcon cartItems={cartItems} onClick={toggleCart} />

              <Nav navbar>
                {authenticated ? (
                  <UncontrolledDropdown nav inNavbar>
                    <DropdownToggle nav>
                      {window.innerWidth < 568 ? (
                        user.avatar ? (
                          <img
                            loading='lazy'
                            src={user.avatar}
                            alt='user'
                            className='user-avatar'
                          />
                        ) : (
                          <ProfileIcon />
                        )
                      ) : (
                        <>
                          {user.firstName ? user.firstName : 'Welcome'}
                          <span className='fa fa-chevron-down dropdown-caret'></span>
                        </>
                      )}
                    </DropdownToggle>
                    <DropdownMenu right>
                      <DropdownItem onClick={() => history.push('/dashboard')}>
                        Dashboard
                      </DropdownItem>
                      <DropdownItem onClick={signOut}>Sign Out</DropdownItem>
                    </DropdownMenu>
                  </UncontrolledDropdown>
                ) : (
                  <UncontrolledDropdown nav inNavbar>
                    <DropdownToggle nav>
                      {window.innerWidth < 568 ? (
                        <ProfileIcon />
                      ) : (
                        <>
                          {user.firstName ? user.firstName : 'Welcome'}
                          <span className='fa fa-chevron-down dropdown-caret'></span>
                        </>
                      )}
                    </DropdownToggle>
                    <DropdownMenu right>
                      <DropdownItem onClick={() => history.push('/login')}>
                        Login
                      </DropdownItem>
                      <DropdownItem onClick={() => history.push('/register')}>
                        Sign Up
                      </DropdownItem>
                    </DropdownMenu>
                  </UncontrolledDropdown>
                )}
              </Nav>
              {/* Cart Icon on mobile
              <CartIcon
                className='d-sm-none d-block'
                cartItems={cartItems}
                onClick={toggleCart}
              /> */}
            </Navbar>
          </Col>
        </Row>
        {/* </Container> */}
        {/* hidden cart drawer */}
        <div
          className={isCartOpen ? 'mini-cart-open' : 'hidden-mini-cart'}
          aria-hidden={`${isCartOpen ? false : true}`}
        >
          <div className='mini-cart'>
            <Cart />
          </div>
          <div
            className={
              isCartOpen ? 'drawer-backdrop dark-overflow' : 'drawer-backdrop'
            }
            onClick={toggleCart}
          />
        </div>
        {/* hidden menu drawer */}
        <div
          className={isMenuOpen ? 'mini-menu-open' : 'hidden-mini-menu'}
          aria-hidden={`${isMenuOpen ? false : true}`}
        >
          <div className='mini-menu'>
            <Menu />
          </div>
          <div
            className={
              isMenuOpen ? 'drawer-backdrop dark-overflow' : 'drawer-backdrop'
            }
            onClick={toggleMenu}
          />
        </div>
      </header>
    );
  }
}

const mapStateToProps = state => {
  return {
    isMenuOpen: state.navigation.isMenuOpen,
    isCartOpen: state.navigation.isCartOpen,
    isBrandOpen: state.navigation.isBrandOpen,
    cartItems: state.cart.cartItems,
    brands: state.brand.storeBrands,
    categories: state.category.storeCategories,
    authenticated: state.authentication.authenticated,
    user: state.account.user,
    searchValue: state.navigation.searchValue,
    suggestions: state.navigation.searchSuggestions
  };
};

export default connect(mapStateToProps, actions)(withRouter(Navigation));
