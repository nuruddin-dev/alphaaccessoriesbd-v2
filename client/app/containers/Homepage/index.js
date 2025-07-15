/**
 *
 * Homepage
 *
 */

import React from 'react';
import { Link } from 'react-router-dom';

import { connect } from 'react-redux';
import actions from '../../actions';
import ProductList from '../../components/Store/ProductList';
import NotFound from '../../components/Common/NotFound';
import LoadingIndicator from '../../components/Common/LoadingIndicator';
import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';

import { getImagePath } from '../../utils';

class Homepage extends React.PureComponent {
  componentDidMount() {
    const slug = this.props.match.params.slug;
    this.props.fetchProducts();
  }

  renderProductSection(title, products) {
    if (products.length === 0) return null;

    // Split products into pairs for two-column layout
    const pairs = [];
    for (let i = 0; i < products.length; i += 2) {
      pairs.push(products.slice(i, i + 2));
    }

    return (
      <div className='container pb-4 pl-1 pr-1'>
        {pairs.map((pair, index) => (
          <div key={`pair-${index}`} className='row m-0'>
            {pair.map((product, productIndex) => (
              <div
                key={`${product.id}-${productIndex}`} // Combining product.id and productIndex to ensure uniqueness
                className='col-6 pl-1 pr-1 d-flex flex-column'
              >
                <ProductList
                  products={[product]}
                  authenticated={this.props.authenticated}
                  updateWishlist={this.props.updateWishlist}
                />
              </div>
            ))}
          </div>
        ))}
      </div>
    );
  }

  render() {
    const {
      products,
      isLoading,
      authenticated,
      updateWishlist,
      history,
      categories
    } = this.props;
    const displayProducts = products && products.length > 0;

    // Separate products into different categories
    const popularProducts = products
      .filter(obj => obj.popular === true)
      .slice(0, 14);
    const newProducts = products
      .sort((a, b) => new Date(b.addedTime) - new Date(a.addedTime))
      .slice(0, 14);
    const premiumProducts = products
      .filter(obj => obj.premium === true)
      .slice(0, 14);

    // Determine if carousel is needed for each category
    const showPopularSlider = popularProducts.length > 5;
    const showNewSlider = newProducts.length > 5;
    const showPremiumSlider = premiumProducts.length > 5;

    const handleNewArrivalSeeAllClick = () => {
      history.push('/shop');
    };

    const Arrow = ({ className, style, onClick }) => (
      <button
        className={className}
        onClick={onClick}
        style={{ ...style, backgroundColor: '#000000', borderRadius: '50%' }}
      />
    );

    const settings = {
      dots: true,
      infinite: true,
      speed: 500,
      slidesToShow: 1,
      slidesToScroll: 1,
      arrows: window.innerWidth >= 576 ? true : false,
      // prevArrow: <Arrow />,
      // nextArrow: <Arrow />
      prevArrow: <CustomPrevArrowProduct />,
      nextArrow: <CustomNextArrowProduct />
    };

    const settings1 = {
      infinite: true, // Infinite loop
      speed: 1000, // Transition speed
      slidesToShow: 1, // Only one slide visible
      slidesToScroll: 1, // Scroll one slide at a time
      autoplay: true, // Enable autoplay
      autoplaySpeed: 30000000, // Change slide every 3 seconds
      pauseOnHover: true, // Pause on hover
      nextArrow: <CustomNextArrow />, // Use custom next arrow
      prevArrow: <CustomPrevArrow /> // Use custom prev arrow
    };

    const settings2 = {
      dots: true, // Show navigation dots
      infinite: true, // Infinite looping
      speed: 500, // Transition speed
      slidesToShow: 8, // Number of items to show
      slidesToScroll: 2, // Number of items to scroll at once
      arrows: false, // Disable arrows
      draggable: true,
      touchMove: true, // Allow touch interactions
      responsive: [
        {
          breakpoint: 1024, // For devices with a width of 1024px or less
          settings: {
            slidesToShow: 6, // Adjust the number of visible items
            slidesToScroll: 6
          }
        },
        {
          breakpoint: 768, // For devices with a width of 768px or less
          settings: {
            slidesToShow: 4,
            slidesToScroll: 4
          }
        },
        {
          breakpoint: 480, // For devices with a width of 480px or less
          settings: {
            slidesToShow: 3,
            slidesToScroll: 3
          }
        }
      ]
    };

    const images = [
      getImagePath('end-of-year-sale.webp'),
      getImagePath('end-of-year-sale.webp')
    ];

    return (
      <div>
        {window.innerWidth >= 576 ? (
          <>
            {/* Content for screen size greater than or equal to 576px */}
            <div className='homepage'>
              {isLoading && <LoadingIndicator />}
              {
                <div className='offer-container'>
                  <Slider {...settings1}>
                    {images.map((src, index) => (
                      <div key={index}>
                        <img
                          loading='lazy'
                          src={src}
                          alt={`Slide ${index + 1}`}
                          className='d-block w-100 slider-image'
                        />

                        <div className='gradient-overlay'></div>
                      </div>
                    ))}
                  </Slider>
                </div>
              }
              <div className='top-category-container'>
                <ul className='top-category-list'>
                  {categories.map(category =>
                    category.isTop ? (
                      <li
                        key={category._id}
                        className='top-category-item'
                        onClick={() => history.push(`/${category.slug}`)}
                      >
                        <div className='top-category-inner'>
                          <div className='image-container'>
                            <img
                              loading='lazy'
                              src={category.imageUrl}
                              alt={category.slug}
                            />
                          </div>
                          <div className='category-name'>{category.name}</div>
                        </div>
                      </li>
                    ) : null
                  )}
                </ul>
              </div>
              {displayProducts && (
                <>
                  {/*--------- Popular Products ----------*/}

                  <div className='text-left border-bottom mt-4 mb-4'>
                    <h2>Popular Products</h2>
                  </div>
                  <div className='container pb-4'>
                    {!showPopularSlider && (
                      <ProductList
                        products={popularProducts.slice(0, 5)}
                        authenticated={authenticated}
                        updateWishlist={updateWishlist}
                      />
                    )}
                    {showPopularSlider && (
                      <Slider {...settings}>
                        {chunkArrayByBreakpoint(popularProducts).map(
                          (productChunk, index) => (
                            <div key={index}>
                              <ProductList
                                products={productChunk}
                                authenticated={authenticated}
                                updateWishlist={updateWishlist}
                              />
                            </div>
                          )
                        )}
                      </Slider>
                    )}
                  </div>

                  {/*--------- New Products ----------*/}

                  <div className='d-flex justify-content-between align-items-center border-bottom mt-4 mb-4'>
                    <h2>New Arrival Products</h2>
                    <button onClick={handleNewArrivalSeeAllClick}>
                      See All
                    </button>
                  </div>

                  <div className='container pb-4'>
                    {!showNewSlider && (
                      <ProductList
                        products={newProducts.slice(0, 5)}
                        authenticated={authenticated}
                        updateWishlist={updateWishlist}
                      />
                    )}
                    {showNewSlider && (
                      <Slider {...settings}>
                        {chunkArrayByBreakpoint(newProducts).map(
                          (productChunk, index) => (
                            <div key={index}>
                              <ProductList
                                products={productChunk}
                                authenticated={authenticated}
                                updateWishlist={updateWishlist}
                              />
                            </div>
                          )
                        )}
                      </Slider>
                    )}
                  </div>

                  {/*--------- Premium Products ----------*/}

                  <div className='text-left border-bottom mt-4 mb-4'>
                    <h2>Premium Products</h2>
                  </div>

                  <div className='container pb-4'>
                    {!showPremiumSlider && (
                      <ProductList
                        products={premiumProducts.slice(0, 5)}
                        authenticated={authenticated}
                        updateWishlist={updateWishlist}
                      />
                    )}
                    {showPremiumSlider && (
                      <Slider {...settings}>
                        {chunkArrayByBreakpoint(premiumProducts).map(
                          (productChunk, index) => (
                            <div key={index}>
                              <ProductList
                                products={productChunk}
                                authenticated={authenticated}
                                updateWishlist={updateWishlist}
                              />
                            </div>
                          )
                        )}
                      </Slider>
                    )}
                  </div>

                  {/*--------- Other Products ----------*/}
                  <div className='text-left border-bottom mt-4 mb-4'>
                    <h2>Other Products</h2>
                  </div>
                  <div className='container pb-4'>
                    <ProductList
                      products={products}
                      authenticated={authenticated}
                      updateWishlist={updateWishlist}
                    />
                  </div>
                </>
              )}
              {!isLoading && !displayProducts && (
                <NotFound message='No products found.' />
              )}
            </div>
          </>
        ) : (
          <>
            {/* Content for screen size less than 576px */}
            <div className='homepage'>
              {isLoading && <LoadingIndicator />}
              {
                <div
                  className='slider-wrapper'
                  style={{ position: 'relative' }}
                >
                  {/* First Slider */}
                  <div
                    className='offer-container'
                    style={{ position: 'relative', zIndex: 1 }}
                  >
                    <Slider {...settings1}>
                      {images.map((src, index) => (
                        <div key={index}>
                          <img
                            loading='lazy'
                            src={src}
                            alt={`Slide ${index + 1}`}
                            className='d-block w-100 slider-image-mobile'
                          />
                          <div className='gradient-overlay'></div>
                        </div>
                      ))}
                    </Slider>
                  </div>

                  {/* Second Slider */}
                  <div
                    className='category-container'
                    style={{
                      position: 'absolute',
                      bottom: 0, // Align the bottom of the second slider with the first slider
                      zIndex: 2,
                      width: '100%' // Ensure it spans the width
                    }}
                  >
                    <Slider {...settings2}>
                      {categories &&
                        categories.map(
                          category =>
                            category.isTop && (
                              <div
                                key={category._id}
                                className='top-category-item'
                              >
                                <div className='top-category-inner'>
                                  <Link to={`/${category.slug}`}>
                                    <div className='image-container'>
                                      <img
                                        src={category.imageUrl}
                                        alt={category.slug || 'category image'}
                                        loading='lazy' // Lazy load images for performance
                                      />
                                    </div>
                                    <div className='category-name'>
                                      {category.name}
                                    </div>
                                  </Link>
                                </div>
                              </div>
                            )
                        )}
                    </Slider>
                  </div>
                </div>
              }

              {displayProducts && (
                <>
                  {/* Popular Products */}
                  <div className='text-left border-bottom mt-4 mb-4'>
                    <h2>Popular Products</h2>
                  </div>
                  {this.renderProductSection(
                    'Popular Products',
                    popularProducts
                  )}

                  {/* New Arrival Products */}
                  <div className='d-flex justify-content-between align-items-center border-bottom mt-4 mb-4'>
                    <h2>New Arrival Products</h2>
                    <button onClick={handleNewArrivalSeeAllClick}>
                      See All
                    </button>
                  </div>
                  {this.renderProductSection(
                    'New Arrival Products',
                    newProducts
                  )}

                  {/* Premium Products */}
                  <div className='text-left border-bottom mt-4 mb-4'>
                    <h2>Premium Products</h2>
                  </div>
                  {this.renderProductSection(
                    'Premium Products',
                    premiumProducts
                  )}

                  {/* Other Products */}
                  <div className='text-left border-bottom mt-4 mb-4'>
                    <h2>Other Products</h2>
                  </div>
                  {this.renderProductSection('Other Products', products)}
                  {/* <ProductList
                    products={products}
                    authenticated={this.props.authenticated}
                    updateWishlist={this.props.updateWishlist}
                  /> */}
                </>
              )}
              {!isLoading && !displayProducts && (
                <NotFound message='No products found.' />
              )}
            </div>
          </>
        )}
      </div>
    );
  }
}

function chunkArrayByBreakpoint(array) {
  if (window.innerWidth >= 1200) {
    return chunkArray(array, 5); // For xl screens, chunk size is 4
  } else if (window.innerWidth >= 992) {
    return chunkArray(array, 3); // For lg screens, chunk size is 3
  } else if (window.innerWidth >= 576) {
    return chunkArray(array, 2); // For md screens, chunk size is 2
  } else {
    return chunkArray(array, 1); // For smaller screens, chunk size is 1
  }
}

function chunkArray(array, chunkSize) {
  const chunkedArray = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    chunkedArray.push(array.slice(i, i + chunkSize));
  }
  return chunkedArray;
}

// Custom Next Arrow Component
const CustomNextArrow = ({ onClick }) => {
  return (
    <div className='custom-arrow next-arrow' onClick={onClick}>
      &#9654; {/* Right Arrow Icon */}
    </div>
  );
};

// Custom Previous Arrow Component
const CustomPrevArrow = ({ onClick }) => {
  return (
    <div className='custom-arrow prev-arrow' onClick={onClick}>
      &#9664; {/* Left Arrow Icon */}
    </div>
  );
}; // Custom Next Arrow Component
const CustomNextArrowProduct = ({ onClick }) => {
  return (
    <div
      className='custom-arrow custom-arrow-product next-arrow next-arrow-product'
      onClick={onClick}
    >
      &#9654; {/* Right Arrow Icon */}
    </div>
  );
};

// Custom Previous Arrow Component
const CustomPrevArrowProduct = ({ onClick }) => {
  return (
    <div
      className='custom-arrow custom-arrow-product prev-arrow prev-arrow-product'
      onClick={onClick}
    >
      &#9664; {/* Left Arrow Icon */}
    </div>
  );
};

const mapStateToProps = state => {
  return {
    products: state.product.products,
    isLoading: state.product.isLoading,
    authenticated: state.authentication.authenticated,
    categories: state.category.storeCategories
  };
};

export default connect(mapStateToProps, actions)(Homepage);
