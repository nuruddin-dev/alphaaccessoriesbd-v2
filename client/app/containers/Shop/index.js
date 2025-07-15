/**
 *
 * Shop
 *
 */

import React from 'react';

import { connect } from 'react-redux';
import { Switch, Route, useLocation } from 'react-router-dom';
import { Row, Col } from 'reactstrap';

import actions from '../../actions';
import { sortOptions } from '../../utils/store';

import ProductsShop from '../ProductsShop';
import BrandsShop from '../BrandsShop';
import TagsShop from '../TagsShop';
import CategoryShop from '../CategoryShop';

import Page404 from '../../components/Common/Page404';
import ProductFilter from '../../components/Store/ProductFilter';
import Pagination from '../../components/Common/Pagination';
import SelectOption from '../../components/Common/SelectOption';

const Shop = ({ products, advancedFilters, filterProducts }) => {
  const { totalPages, currentPage, count, limit, order } = advancedFilters;
  const totalProducts = products.length;
  const left = limit * (currentPage - 1) + 1;
  const right = totalProducts + left - 1;
  const location = useLocation();
  const isShopRoute = location.pathname === '/shop';
  const displayPagination = totalPages > 1 && isShopRoute;

  return (
    <div className='shop'>
      <Row className='mx-0'>
        {/* Top Row: Showing and Sort by */}
        <Col
          xs={12}
          className='bg-white shop-toolbar py-sm-3 py-lg-0 mx-0 my-4'
        >
          {isShopRoute ? (
            <Row className='align-items-center mx-0 mt-0'>
              <Col
                xs='12'
                sm='12'
                md='6'
                lg='6'
                className='text-center text-md-left m-0 '
              >
                {totalProducts > 0
                  ? `Showing: ${left}-${right} products of ${count} products `
                  : null}
              </Col>

              {isShopRoute && (
                <>
                  <Col
                    xs='12'
                    sm='12'
                    md='3'
                    lg='3'
                    className='text-right pr-0 d-none d-md-block'
                  >
                    <span>Sort by</span>
                  </Col>
                  <Col xs='12' sm='12' md='3' lg='3'>
                    <SelectOption
                      name={'sorting'}
                      value={{ value: order, label: sortOptions[order].label }}
                      options={sortOptions}
                      handleSelectChange={(n, v) => {
                        filterProducts('sorting', n.value);
                      }}
                    />
                  </Col>
                </>
              )}
            </Row>
          ) : null}
        </Col>
      </Row>

      {/* Main Content: Product Filter and Product List */}
      <Row>
        {/* Left Column: Product Filter */}
        {isShopRoute && (
          <Col
            xs={12}
            lg={2}
            className='d-none d-lg-block px-0'
            style={{
              position: 'sticky',
              top: 20,
              maxHeight: 'calc(100vh - 16px)'
            }}
          >
            <ProductFilter filterProducts={filterProducts} />
          </Col>
        )}

        {/* Right Column: Products */}
        <Col
          xs='12'
          sm='12'
          md={isShopRoute ? 10 : 12}
          lg={isShopRoute ? 10 : 12}
        >
          <Switch>
            <Route exact path='/shop' component={ProductsShop} />
            <Route path='/category/:slug' component={CategoryShop} />
            <Route path='/brand/:slug' component={BrandsShop} />
            <Route path='/shop/tag/:slug' component={TagsShop} />
            <Route path='*' component={Page404} />
          </Switch>

          {displayPagination && (
            <div className='d-flex justify-content-center text-center mt-4'>
              <Pagination
                totalPages={totalPages}
                onPagination={filterProducts}
              />
            </div>
          )}
        </Col>
      </Row>
    </div>
  );
};

const mapStateToProps = state => {
  return {
    advancedFilters: state.product.advancedFilters,
    products: state.product.storeProducts
  };
};

export default connect(mapStateToProps, actions)(Shop);
