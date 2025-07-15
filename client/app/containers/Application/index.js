/**
 *
 * Application
 *
 */

import React, { Suspense, useEffect, useState, useCallback } from 'react';
import { connect } from 'react-redux';
import { Switch, Route, useParams, Redirect } from 'react-router-dom';
import { Container } from 'reactstrap';
import { API_URL } from '../../constants';
import actions from '../../actions';

// components
import Navigation from '../Navigation';
import Notification from '../Notification';
import Footer from '../../components/Common/Footer';
import { CART_ITEMS } from '../../constants';
import axios from 'axios';

// Cache for storing categories and brands
let categories = null;
let brands = null;

// Lazy-loaded routes
const Login = React.lazy(() => import('../Login'));
const Signup = React.lazy(() => import('../Signup'));
const MerchantSignup = React.lazy(() => import('../MerchantSignup'));
const HomePage = React.lazy(() => import('../Homepage'));
const Dashboard = React.lazy(() => import('../Dashboard'));
const Support = React.lazy(() => import('../Support'));
const ForgotPassword = React.lazy(() => import('../ForgotPassword'));
const ResetPassword = React.lazy(() => import('../ResetPassword'));
const Shop = React.lazy(() => import('../Shop'));
const BrandsPage = React.lazy(() => import('../BrandsPage'));
const TagsPage = React.lazy(() => import('../TagsPage'));
const CategoriesPage = React.lazy(() => import('../CategoriesPage'));
const ProductPage = React.lazy(() => import('../ProductPage'));
const Sell = React.lazy(() => import('../Sell'));
const Contact = React.lazy(() => import('../Contact'));
const OrderSuccess = React.lazy(() => import('../OrderSuccess'));
const OrderPage = React.lazy(() => import('../OrderPage'));
const AuthSuccess = React.lazy(() => import('../AuthSuccess'));
const AboutUs = React.lazy(() => import('../AboutUs'));
const Page404 = React.lazy(() => import('../../components/Common/Page404'));
const BrandsShop = React.lazy(() => import('../BrandsShop'));
const CategoryShop = React.lazy(() => import('../CategoryShop'));

async function fetchCategoriesAndBrands() {
  try {
    if (!categories) {
      const categoriesResponse = await axios.get(`${API_URL}/category/list`);
      categories = Array.isArray(categoriesResponse.data.categories)
        ? categoriesResponse.data.categories.map(cat => cat.slug)
        : [];
    }
    if (!brands) {
      const brandsResponse = await axios.get(`${API_URL}/brand/list`);
      brands = Array.isArray(brandsResponse.data.brands)
        ? brandsResponse.data.brands.map(brand => brand.slug)
        : [];
    }
  } catch (error) {
    console.error('Error fetching categories or brands:', error);
  }
}

async function getCategoryBrandOrProduct(slug) {
  await fetchCategoriesAndBrands();

  if (categories.includes(slug)) {
    return { type: 'category' };
  } else if (brands.includes(slug)) {
    return { type: 'brand' };
  } else {
    return { type: 'product' };
  }
}

const DynamicRouteHandler = () => {
  const { slug } = useParams();
  const [Component, setComponent] = useState(null);

  const determineComponent = useCallback(async () => {
    const result = await getCategoryBrandOrProduct(slug);
    const match = { params: { slug } };

    switch (result.type) {
      case 'category':
        setComponent(<CategoryShop match={match} />);
        break;
      case 'brand':
        setComponent(<BrandsShop match={match} />);
        break;
      case 'product':
        setComponent(<ProductPage match={match} />);
        break;
      default:
        setComponent(<Redirect to='/404' />);
    }
  }, [slug]);

  useEffect(() => {
    determineComponent();
  }, [determineComponent]);

  return Component || <div>Loading...</div>;
};

class Application extends React.PureComponent {
  constructor(props) {
    super(props);
    this.handleStorage = this.handleStorage.bind(this);
  }

  componentDidMount() {
    const token = localStorage.getItem('token');

    if (token) {
      this.props.fetchProfile();
    }

    this.props.handleCart();

    document.addEventListener('keydown', this.handleTabbing);
    document.addEventListener('mousedown', this.handleMouseDown);
    window.addEventListener('storage', this.handleStorage);
  }

  handleStorage(e) {
    if (e.key === CART_ITEMS) {
      this.props.handleCart();
    }
  }

  handleTabbing = e => {
    if (e.keyCode === 9) {
      // 'Tab' key
      document.body.classList.add('user-is-tabbing');
    }
  };

  handleMouseDown = () => {
    document.body.classList.remove('user-is-tabbing');
  };

  render() {
    return (
      <div className='application'>
        <Notification />
        <Navigation />
        <main className='main'>
          <Container>
            <div className='wrapper'>
              <Suspense fallback={<div>Loading...</div>}>
                <Switch>
                  <Route exact path='/' component={HomePage} />
                  <Route path='/shop' component={Shop} />
                  <Route path='/sell' component={Sell} />
                  <Route path='/contact' component={Contact} />
                  <Route path='/about-us' component={AboutUs} />
                  <Route path='/brands' component={BrandsPage} />
                  <Route path='/tags' component={TagsPage} />
                  <Route path='/categories' component={CategoriesPage} />
                  <Route path='/order/success/:id' component={OrderSuccess} />
                  <Route path='/order/:id' component={OrderPage} />
                  <Route path='/login' component={Login} />
                  <Route path='/register' component={Signup} />
                  <Route path='/brand/:slug' component={BrandsShop} />
                  <Route path='/category/:slug' component={CategoryShop} />
                  <Route
                    path='/merchant-signup/:token'
                    component={MerchantSignup}
                  />
                  <Route path='/forgot-password' component={ForgotPassword} />
                  <Route
                    path='/reset-password/:token'
                    component={ResetPassword}
                  />
                  <Route path='/auth/success' component={AuthSuccess} />
                  <Route path='/support' component={Support} />
                  <Route path='/dashboard' component={Dashboard} />
                  <Route path='/404' component={Page404} />
                  <Route path='/:slug' component={DynamicRouteHandler} />
                  <Route path='*' component={Page404} />
                </Switch>
              </Suspense>
            </div>
          </Container>
        </main>
        <Footer />
      </div>
    );
  }
}

const mapStateToProps = state => ({
  authenticated: state.authentication.authenticated,
  products: state.product.storeProducts
});

export default connect(mapStateToProps, actions)(Application);
