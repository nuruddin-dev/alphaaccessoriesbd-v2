/**
 *
 * ProductPage
 *
 */

import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';

import { connect } from 'react-redux';
import { compose } from 'redux';

import { Row, Col } from 'reactstrap';
import { Link, withRouter, useHistory } from 'react-router-dom';

import actions from '../../actions';

import Input from '../../components/Common/Input';
import Button from '../../components/Common/Button';
import LoadingIndicator from '../../components/Common/LoadingIndicator';
import NotFound from '../../components/Common/NotFound';
import { BagIcon } from '../../components/Common/Icon';
import ProductReviews from '../../components/Store/ProductReviews';
import SocialShare from '../../components/Store/SocialShare';
import ReactImageMagnify from 'react-image-magnify';

import DOMPurify from 'dompurify';
import Swal from 'sweetalert2';

import axios from 'axios';
import { API_URL, ROLES } from '../../constants';
import {
  convertToBengaliDigits,
  convertToEnglishNumber,
  convertToBengaliColor
} from '../../utils/conversion';

import { districts as districtsBn } from '../../utils/districts-bn'; // Bangla file
import { districts as districtsEn } from '../../utils/districts-en'; // English file

class ProductPage extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      selectedColor: '',
      userCity: 'Loading...' // State to store the user's city
    };
  }

  componentDidMount() {
    const slug = this.props.match.params.slug;
    this.props.fetchStoreProduct(slug);
    this.props.fetchProductReviews(slug);
    document.body.classList.add('product-page');

    // Fetch user's city on mount
    this.fetchCity();
  }

  componentDidUpdate(prevProps) {
    if (this.props.match.params.slug !== prevProps.match.params.slug) {
      const slug = this.props.match.params.slug;
      this.props.fetchStoreProduct(slug);
    }
  }

  componentWillUnmount() {
    document.body.classList.remove('product-page');
    this.props.resetProductShop();
  }

  // Function to fetch user's public IP
  async getIP() {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch (error) {
      console.error('Error fetching IP address:', error);
      return null;
    }
  }

  // Function to fetch city based on IP
  async getCityFromIP(ip) {
    try {
      const response = await fetch(`https://ipinfo.io/${ip}/json`);
      const data = await response.json();
      return data.city || 'City not found';
    } catch (error) {
      console.error('Error fetching city:', error);
      return 'City not found';
    }
  }

  // Combined function to fetch the city
  async fetchCity() {
    const ip = await this.getIP();
    if (ip) {
      const city = await this.getCityFromIP(ip);
      this.setState({ userCity: city });
    }
  }

  render() {
    const {
      user,
      authenticated,
      isLoading,
      product,
      productShopData,
      shopFormErrors,
      itemInCart,
      productShopChange,
      handleAddToCart,
      handleRemoveFromCart,
      addProductReview,
      reviewsSummary,
      reviews,
      reviewFormData,
      reviewChange,
      reviewFormErrors,
      history
    } = this.props;

    const { selectedColor, userCity } = this.state;

    const canonicalUrl = `https://alphaaccessoriesbd.com/${product.slug}`;

    var deliveryCharge;
    var totalPrice;

    const handleAddToBagClick = () => {
      if (!product.premium) {
        // if (!selectedColor) {
        //   this.setState({
        //     selectedColor: product.colors[0]
        //   });
        //   productShopChange('color', product.colors[0]);
        // }
        productShopChange('color', product.colors[0]);

        handleAddToCart(product);
      } else {
        Swal.fire({
          title: 'এটি একটি প্রিমিয়াম প্রোডাক্ট !!',
          text: 'এটি ক্রয় করার জন্য ডেলিভারি চার্জ অগ্রিম দেয়া আবশ্যক ।',
          icon: 'info',
          showCancelButton: true,
          confirmButtonText: 'হ্যাঁ , ব্যাগে যুক্ত করুন !',
          cancelButtonText: 'না !',
          reverseButtons: true,
          background: '#fff',
          confirmButtonColor: '#76ff7a',
          cancelButtonColor: '#ff9999',
          backdrop: true,
          customClass: {
            icon: 'sweet-alert-icon',
            popup: 'sweet-alert-popup',
            actions: 'sweet-alert-actions',
            confirmButton: 'sweet-alert-confirm'
          }
        }).then(result => {
          if (result.isConfirmed) {
            // if (!selectedColor) {
            //   this.setState({
            //     selectedColor: product.colors[0]
            //   });
            //   productShopChange('color', product.colors[0]);
            // }
            productShopChange('color', product.colors[0]);

            handleAddToCart(product);
          }
        });
      }
    };

    const handleRemoveFromBagClick = () => {
      Swal.fire({
        title: 'সতর্ক বার্তা !',
        text: 'আপনি কী প্রোডাক্ট টি ব্যাগ থেকে সরিয়ে ফেলতে চান ?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'হ্যাঁ , সরিয়ে ফেলা হোক !',
        cancelButtonText: 'না !',
        reverseButtons: true,
        background: '#fff',
        confirmButtonColor: '#ff9999',
        cancelButtonColor: '#76ff7a',
        backdrop: true,
        customClass: {
          icon: 'sweet-alert-icon',
          popup: 'sweet-alert-popup',
          actions: 'sweet-alert-actions',
          confirmButton: 'sweet-alert-confirm'
        }
      }).then(result => {
        if (result.isConfirmed) {
          handleRemoveFromCart(product);
        } else result.dismiss === Swal.DismissReason.cancel;
      });
    };

    // Function to map Bangla district and sub-district to English
    function mapBanglaToEnglish(banglaDistrictName, banglaSubDistrictName) {
      // Find the index of the district in the Bangla list
      const districtIndex = districtsBn.findIndex(
        district => district.name === banglaDistrictName
      );

      if (districtIndex !== -1) {
        // Get the Bangla district
        const banglaDistrict = districtsBn[districtIndex];

        // Find the index of the sub-district in the Bangla list
        const subDistrictIndex = banglaDistrict.sub_district.indexOf(
          banglaSubDistrictName
        );

        if (subDistrictIndex !== -1) {
          // Get the corresponding district and sub-district from the English file
          const englishDistrict = districtsEn[districtIndex].name;
          const englishSubDistrict =
            districtsEn[districtIndex].sub_district[subDistrictIndex];

          return {
            district: englishDistrict,
            sub_district: englishSubDistrict
          };
        } else {
          console.error('Sub-district not found in Bangla list');
        }
      } else {
        console.error('District not found in Bangla list');
      }

      // Return null or error if no match found
      return null;
    }

    function isBanglaNumber(input) {
      // Regular expression to check if all characters are Bangla digits
      const banglaDigitsRegex = /^[\u09E6-\u09EF]+$/;

      // Test the input against the regex
      return banglaDigitsRegex.test(input);
    }

    async function hashString(str) {
      // Encode the string as a Uint8Array (binary data)
      const encoder = new TextEncoder();
      const data = encoder.encode(str);

      // Hash the data using SHA-256
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);

      // Convert ArrayBuffer to hex string
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');

      return hashHex;
    }

    function getFirstAndLastName(fullName) {
      const nameParts = fullName.trim().split(' ');

      // First name is everything except the last part
      const firstName = nameParts.slice(0, -1).join(' ');

      // Last name is the last part (if any)
      const lastName =
        nameParts.length > 1 ? nameParts[nameParts.length - 1] : '';

      return { firstName, lastName };
    }

    function getCookie(name) {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return parts.pop().split(';').shift();
    }

    async function SendFacebookEvent(
      phoneNumber,
      name,
      productName,
      price,
      cityAndState,
      clientIpAddress
    ) {
      const firstAndLastName = getFirstAndLastName(name);

      const firstName = firstAndLastName.firstName;
      const lastName = firstAndLastName.lastName;

      const hashedFirstName = await hashString(firstName);
      const hashedLastName = await hashString(lastName);
      const hashedPhoneNumber = await hashString('88' + phoneNumber);
      const hashedCity = await hashString(
        cityAndState.sub_district.split(' ')[0]
      );
      const hashedState = await hashString(cityAndState.district.split(' ')[0]);
      const hashedCountry = await hashString('bd');
      const userAgent = navigator.userAgent;

      const fbc = getCookie('_fbc');
      const fbp = getCookie('_fbp');

      // Prepare Facebook event data
      const fbEventData = {
        data: [
          {
            event_name: 'Purchase',
            event_time: Math.floor(new Date().getTime() / 1000), // Current timestamp in seconds
            user_data: {
              fn: hashedFirstName,
              ln: hashedLastName,
              ph: hashedPhoneNumber,
              ct: hashedCity,
              st: hashedState,
              country: hashedCountry,
              client_ip_address: clientIpAddress,
              client_user_agent: userAgent,
              fbc: fbc, // Facebook Click ID
              fbp: fbp // Facebook Browser ID
            },
            custom_data: {
              product_name: productName,
              value: price,
              currency: 'BDT'
            }
          }
        ]
      };

      const API_VERSION = 'v21.0';
      const PIXEL_ID = '1487571612155923';
      const ACCESS_TOKEN =
        'EAAFX0FF54YQBOybZCd8mM50YkoWY4rdcS3gjj5P5XZCYK0Vzn99CGvKecrQTlUZA8ZBkjORbNFJNTjTKSwpjvDqAgX3Fe6Ss1h4qtgTuGaABNVPZAKk2ZATVZB77ZCTyyJgkLg5XS8Dp8ZCsxHnztvdYdIkOrw6EA5Of62O3FTW5oPZBiTATuRPWtPxl7iFxALi0DE6gZDZD';

      const fbApiUrl = `https://graph.facebook.com/${API_VERSION}/${PIXEL_ID}/events?access_token=${ACCESS_TOKEN}`;

      const fbResponse = await axios.post(fbApiUrl, fbEventData);
    }

    const handleOrderNow = () => {
      Swal.fire({
        title: 'প্রয়োজনীয় তথ্য দিন',
        html: `
              <label class="d-flex">নাম</label>
              <input id="name" class="sweet-alert-input" placeholder="নিজের সম্পূর্ণ নাম লিখুন">
              
              <label class="d-flex">মোবাইল নম্বর</label>
              <input id="phoneNumber" class="sweet-alert-input" placeholder="মোবাইল নম্বর লিখুন">
              
              <label class="d-flex">ঠিকানা</label>
              <input id="address" class="sweet-alert-input" placeholder="বাসা, রোড, এলাকার নাম লিখুন">

              <select id="district" class="swal2-select bg-light">
              <option value="">জেলা নির্বাচন করুন</option>
                ${districtsBn
            .map(
              districtObj =>
                `<option value="${districtObj.name}">${districtObj.name}</option>`
            )
            .join('')}
              </select>
              <select id="subDistrict" class="swal2-select bg-light">
                <option value="">থানা নির্বাচন করুন</option>
              </select>
            
              
              <label class="d-flex; center">**ডেলিভারি চার্জ : ঢাকা শহরের ভিতরে ৫০ টাকা, ঢাকার বাইরে ১০০ টাকা**</label>
              `,
        confirmButtonText: 'অর্ডার করুন',
        reverseButtons: true,
        background: '#fff',
        confirmButtonColor: '#76ff7a',
        backdrop: true,
        customClass: {
          icon: 'sweet-alert-icon',
          popup: 'sweet-alert-popup',
          actions: 'sweet-alert-actions',
          confirmButton: 'sweet-alert-confirm'
        },
        didOpen: () => {
          // Event listener for district dropdown change
          document
            .getElementById('district')
            .addEventListener('change', function () {
              const selectedDistrict = this.value;
              const subDistrictSelect = document.getElementById('subDistrict');

              // Clear previous options
              subDistrictSelect.innerHTML =
                '<option value="">থানা নির্বাচন করুন</option>';

              // Find the selected district in districtsBn array
              const selectedDistrictObj = districtsBn.find(
                district => district.name === selectedDistrict
              );

              // Populate sub-districts if the selected district is found
              if (selectedDistrictObj) {
                selectedDistrictObj.sub_district.forEach(subDistrict => {
                  const option = document.createElement('option');
                  option.value = subDistrict;
                  option.textContent = subDistrict;
                  subDistrictSelect.appendChild(option);
                });
              }
            });
        },
        preConfirm: () => {
          const name = document.getElementById('name').value;
          var phoneNumber = document.getElementById('phoneNumber').value;

          if (isBanglaNumber(phoneNumber)) {
            phoneNumber = convertToEnglishNumber(phoneNumber);
          }

          const area = document.getElementById('address').value;

          const districtBn = document.getElementById('district').value;

          const subDistrictBn = document.getElementById('subDistrict').value;

          const address = `${area}, ${subDistrictBn}, ${districtBn}`;

          deliveryCharge = districtBn === 'ঢাকা শহর' ? 50 : 100;

          totalPrice = product.price + deliveryCharge;

          if (!name || !phoneNumber || !address) {
            Swal.showValidationMessage('সকল তথ্য পূরণ করুন');
            return null;
          }

          if (subDistrictBn === null || subDistrictBn === '') {
            Swal.showValidationMessage('জেলা ও থানা নির্বাচন করুন');
            return null;
          }

          if (isNaN(phoneNumber) || phoneNumber.length != 11) {
            Swal.showValidationMessage('১১ ডিজিটের মোবাইল নম্বর আবশ্যক');
            return null;
          }

          const cityAndState = mapBanglaToEnglish(districtBn, subDistrictBn);

          return {
            name,
            phoneNumber,
            address,
            cityAndState
          };
        }
      }).then(async result => {
        if (result.isConfirmed) {
          const { name, phoneNumber, address, cityAndState } = result.value;
          const productName = product.name;
          const price = product.price;
          const quantity = 1;

          const orderNowData = {
            name,
            phoneNumber,
            address,
            productName,
            price,
            quantity
          }; // Create the orderNow object

          // Get the client's public IP address
          fetch('https://api.ipify.org?format=json')
            .then(response => response.json())
            .then(data => {
              const clientIpAddress = data.ip;
              SendFacebookEvent(
                phoneNumber,
                name,
                productName,
                price,
                cityAndState,
                clientIpAddress
              );
            })
            .catch(error => console.error('Error fetching IP address:', error));

          try {
            const response = await axios.post(
              `${API_URL}/orderNow/add`,
              orderNowData
            );

            Swal.fire({
              icon: 'success',
              title: 'অর্ডার সম্পন্ন হয়েছে',
              html: `
                      <div style="text-align: center; font-size: 18px; color: #333;">
                        <table style="width: 100%; margin: 10px 0; border-collapse: collapse; font-size: 16px;">
                          <tr style="background-color: #f2f2f2;">
                            <th style="padding: 10px; border: 1px solid #ddd; text-align: start; width: 70%;">পণ্য</th>
                            <th style="padding: 10px; border: 1px solid #ddd; text-align: center; width: 30%;">মূল্য</th>
                          </tr>
                            <td style="padding: 10px; border: 1px solid #ddd; text-align: left; width: 70%;">${productName}</td>
                            <td style="padding: 10px; border: 1px solid #ddd; width: 30%;">${convertToBengaliDigits(
                price
              )} ৳</td>
                          </tr>
                          <tr>
                            <td style="padding: 10px; border: 1px solid #ddd; width: 70%; text-align: left;">ডেলিভারি চার্জ</td>
                            <td style="padding: 10px; border: 1px solid #ddd; width: 30%;" id="deliveryCharge">${convertToBengaliDigits(
                deliveryCharge
              )} ৳</td>
                          </tr>
                          <tr>
                            <td style="padding: 10px; border: 1px solid #ddd; width: 70%; text-align: left;">সর্বমোট</td>
                            <td style="padding: 10px; border: 1px solid #ddd; width: 30%;" id="totalAmount">${convertToBengaliDigits(
                totalPrice
              )} ৳</td>
                          </tr>
                        </table>
                        <p style="font-size: 14px; color: #555;">
                          <strong>কিছুক্ষণের মধ্যে আমাদের একজন প্রতিনিধি আপনাকে কল করার মাধ্যমে অর্ডার টি কনফার্ম করবে</strong>
                        </p>
                        <p style="font-size: 14px; color: #555;">
                          <strong>এখনই অর্ডার কনফার্ম করার জন্য কল করুন : 01838626121</strong>
                        </p>
                      </div>
                    `,
              customClass: {
                icon: 'sweet-alert-icon',
                popup: 'sweet-alert-popup',
                actions: 'sweet-alert-actions',
                confirmButton: 'sweet-alert-confirm'
              },
              background: '#fff',
              confirmButtonColor: '#76ff7a',
              backdrop: true
            });
          } catch (error) {
            Swal.fire({
              icon: 'error',
              title: 'অর্ডার সম্পন্ন হয় নি',
              text: 'আবার চেষ্টা করুন',

              customClass: {
                icon: 'sweet-alert-icon',
                popup: 'sweet-alert-popup',
                actions: 'sweet-alert-actions',
                confirmButton: 'sweet-alert-confirm'
              },
              background: '#fff',
              confirmButtonColor: '#76ff7a',
              backdrop: true
            });
          }
        }
      });
    };

    // selectedColor = product.colors[0];

    //JSON-LD Markup for SEO
    const structuredData = {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: product.name,
      image: product.imageUrl,
      description: product.description,
      sku: product.sku,
      brand: {
        '@type': 'Brand',
        name: product.brand || 'Unknown Brand' // Ensure brand name is valid
      },
      offers: {
        '@type': 'Offer',
        image: product.imageUrl,
        priceCurrency: 'BDT',
        price: product.price,
        itemCondition: 'https://schema.org/NewCondition',
        availability:
          product.inventory > 0
            ? 'https://schema.org/InStock'
            : 'https://schema.org/OutOfStock',
        shippingDetails: {
          '@type': 'OfferShippingDetails',
          shippingDestination: {
            '@type': 'Place',
            name: userCity, // Ensure this is a valid string
            address: {
              '@type': 'PostalAddress',
              addressLocality: userCity,
              addressCountry: 'BD' // Country code for Bangladesh
            }
          },
          shippingRate: {
            '@type': 'MonetaryAmount',
            value: deliveryCharge,
            currency: 'BDT' // Added missing currency field
          }
        },
        priceValidUntil: new Date(
          new Date().setFullYear(new Date().getFullYear() + 1)
        ).toISOString(), // Price valid for 1 year
        hasMerchantReturnPolicy: {
          '@type': 'MerchantReturnPolicy',
          returnPolicyCategory: 'https://schema.org/ReturnFeesNotRequired' // Added missing return policy field
        }
      },
      review: reviews
        .filter(review => review.status === 'Approved')
        .map(review => ({
          '@type': 'Review',
          author: {
            '@type': 'Person',
            name: review.user.firstName.trim()
          },
          datePublished: new Date(review.created).toISOString(), // Ensure date is ISO 8601 format
          reviewBody: review.review,
          name: review.title,
          reviewRating: {
            '@type': 'Rating',
            ratingValue: review.rating,
            bestRating: 5, // Ensure bestRating is defined
            worstRating: 1 // Ensure worstRating is defined
          },
          isRecommended: review.isRecommended
        })),
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue:
          reviewsSummary.totalReviews > 0
            ? Math.max(
              1,
              (
                reviewsSummary.totalRatings / reviewsSummary.totalReviews
              ).toFixed(1)
            ) // Ensure ratingValue is not zero, default to 1 if no reviews
            : 1,
        reviewCount: Math.max(1, reviewsSummary.totalReviews), // Ensure reviewCount is positive
        ratingCount: Math.max(1, reviewsSummary.totalRatings), // Ensure ratingCount is positive
        bestRating: 5, // Define the rating scale explicitly
        worstRating: 1 // Define the rating scale explicitly
      }
    };

    return (
      <div className='product-shop'>
        {/* Meta Tags for SEO */}
        <Helmet>
          {/* Ensure canonicalUrl is absolute and points to the preferred version */}
          <link
            rel='canonical'
            href={`https://www.alphaaccessoriesbd.com${canonicalUrl}`}
          />

          <title>
            {product.metaTitle || `${product.name} | alphaaccessoriesbd.com`}
          </title>

          <meta
            name='description'
            content={
              product.metaDescription ||
              `Buy ${product.name} at the best price. ${product.description}`
            }
          />

          {/* Ensure structuredData includes the correct canonical URL */}
          <script type='application/ld+json'>
            {JSON.stringify({
              ...structuredData,
              url: `https://www.alphaaccessoriesbd.com${canonicalUrl}`
            })}
          </script>
        </Helmet>
        {isLoading ? (
          <LoadingIndicator />
        ) : Object.keys(product).length > 0 ? (
          <>
            <div className='container'>
              <div className='product-panel'>
                <Row>
                  <Col xs='12' md='5' lg='5' className='mb-3 p-3 px-md-2'>
                    <div className='image-panel'>
                      <ReactImageMagnify
                        {...{
                          smallImage: {
                            alt: product.imageAlt || 'Product Image',
                            isFluidWidth: true, // The small image dynamically adjusts to container width
                            src: product.imageUrl
                              ? product.imageUrl
                              : '/images/placeholder-image.png'
                          },
                          largeImage: {
                            src: product.imageUrl
                              ? product.imageUrl
                              : '/images/placeholder-image.png',
                            width: 800, // Ensure this matches the actual large image dimensions
                            height: 800 // Ensure this matches the actual large image dimensions
                          },
                          enlargedImagePosition: 'over', // Ensures the enlarged area is displayed beside the small image
                          enlargedImageContainerDimensions: {
                            width: '100%', // Adjust this to set the size of the zoom window
                            height: '100%' // Adjust this to set the size of the zoom window
                          },
                          isHintEnabled: true, // Adds a visual hint for users about zoom functionality
                          lensStyle: { backgroundColor: 'rgba(0,0,0,0.4)' }, // Adds a visual lens on the small image
                          shouldUsePositiveSpaceLens: false // Restricts the zoom to show only the selected area
                        }}
                      />

                      {product.inventory <= 0 && !shopFormErrors['quantity'] ? (
                        <p className='stock out-of-stock'>Out of stock</p>
                      ) : product.premium === true ? (
                        <p className='stock in-stock premium'>Premium</p>
                      ) : product.popular === true ? (
                        <p className='stock in-stock popular'>Popular</p>
                      ) : null}
                    </div>
                  </Col>
                  <Col xs='12' md='7' lg='7' className='mb-3 px-3 px-md-2'>
                    <div className='product-container'>
                      <div className='item-box'>
                        <div className='item-details'>
                          <div className='d-flex'>
                            <h1 className='item-name'>{product.name}</h1>
                            {authenticated && user.role === 'ROLE ADMIN' ? (
                              <i
                                className='fa fa-edit m-2'
                                style={{ cursor: 'pointer' }}
                                onClick={() =>
                                  history.push(
                                    `/dashboard/product/edit/${product._id}`
                                  )
                                }
                              />
                            ) : null}
                          </div>
                          {product.brand && (
                            <p className='by'>
                              <Link
                                to={`/${product.brand.slug}`}
                                className='default-link'
                              >
                                {product.brand.name}
                                {' ব্রান্ডের সকল পণ্য দেখুন'}
                              </Link>
                            </p>
                          )}
                          {/* {product.tags && product.tags.length > 0 && (
                            <div className='mt-3'>
                              <div className='d-flex flex-wrap gap-2'>
                                {product.tags.map(tag => (
                                  <span
                                    key={tag._id || tag.name} // Use a unique identifier like 'id' if available, else fall back to 'name'
                                    className='badge bg-light text-dark border border-secondary p-1 mr-2'
                                  >
                                    {tag.name}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )} */}

                          <hr />
                          <p
                            className='item-desc'
                            style={{ whiteSpace: 'pre-line' }}
                            dangerouslySetInnerHTML={{
                              __html: DOMPurify.sanitize(product.description)
                            }}
                          />
                        </div>
                        <div className='my-4 item-share'>
                          <SocialShare product={product} />
                        </div>
                      </div>
                    </div>
                  </Col>
                </Row>
                {product.fullDescription && (
                  <>
                    <div className='mt-4'>
                      <p className='font-weight-bolder m-0'>About This Item</p>
                      <hr />
                      <p
                        className='item-desc'
                        style={{ whiteSpace: 'pre-line' }}
                        dangerouslySetInnerHTML={{
                          __html: DOMPurify.sanitize(product.fullDescription)
                        }}
                      />
                      <hr />
                      <p
                        className='item-desc'
                        style={{ whiteSpace: 'pre-line' }}
                        dangerouslySetInnerHTML={{
                          __html: DOMPurify.sanitize(product.specification)
                        }}
                      />
                    </div>
                  </>
                )}

                <p className='mt-4 font-weight-bolder'>Product Reviews</p>
                <hr />
                <ProductReviews
                  reviewFormData={reviewFormData}
                  reviewFormErrors={reviewFormErrors}
                  reviews={reviews}
                  reviewsSummary={reviewsSummary}
                  reviewChange={reviewChange}
                  addReview={addProductReview}
                />
              </div>

              {/* Order panel for laptop [Start] */}

              <div className='order-panel d-none d-sm-block'>
                <Row>
                  <Col md='12' lg='12' className='bg-light rounded p-4'>
                    <div className='d-flex mb-4'>
                      <ProductPriceDiv product={product} />
                      {product.previousPrice && (
                        <p className='save-price'>
                          বাঁচলো{' '}
                          {convertToBengaliDigits(
                            product.previousPrice - product.price
                          )}{' '}
                          টাকা
                        </p>
                      )}
                    </div>
                    <div className='delivery-info mb-4'>
                      <p className='d-flex align-items-center m-0'>
                        <i className='fa fa-truck' aria-hidden='true'></i>
                        ক্যাশ অন ডেলিভারি
                      </p>
                      <p className='d-flex align-items-center m-0'>
                        <i
                          className='fa fa-map-marker me-2'
                          aria-hidden='true'
                        ></i>
                        ডেলিভারি লোকেশন : {userCity}
                      </p>
                      <p className='d-flex align-items-center m-0'>
                        <i className='fa fa-money me-2' aria-hidden='true'></i>
                        ডেলিভারি চার্জ: ৳
                        {userCity === 'Dhaka'
                          ? convertToBengaliDigits(50)
                          : convertToBengaliDigits(100)}
                      </p>
                    </div>

                    <div>
                      {product.colors && (
                        <p>
                          প্রোডাক্টের রং :{' '}
                          {selectedColor
                            ? convertToBengaliColor(selectedColor)
                            : 'সিলেক্ট করুন'}
                        </p>
                      )}
                      <div className='d-flex my-2'>
                        {product.colors.map(color => (
                          <div
                            key={color}
                            className={`color-box ${selectedColor === color ? 'selected' : ''
                              }`}
                            style={{
                              backgroundColor: color.toLowerCase()
                            }}
                            onClick={() => {
                              this.setState({ selectedColor: color });
                              productShopChange('color', color);
                            }}
                          />
                        ))}
                      </div>
                    </div>

                    <div>
                      <Col xs='12' md='12' lg='12' className='p-0'>
                        <StockStatusDiv product={product} />
                        <OrderItemCountDiv
                          shopFormErrors={shopFormErrors}
                          product={product}
                          productShopData={productShopData}
                          productShopChange={productShopChange}
                        />
                      </Col>
                      <Col className='p-0'>
                        <div className='d-flex'>
                          <OrderActionButtonDiv
                            itemInCart={itemInCart}
                            product={product}
                            shopFormErrors={shopFormErrors}
                            handleRemoveFromBagClick={handleRemoveFromBagClick}
                            handleAddToBagClick={handleAddToBagClick}
                            handleOrderNow={handleOrderNow}
                          />
                        </div>
                      </Col>
                    </div>
                  </Col>
                </Row>
              </div>

              {/* Order panel for laptop [End] */}
              {/* Order panel for mobile [start] */}

              <div className='order-panel d-sm-none d-block'>
                <div className='price-bar border bg-light'>
                  {/* Top Row: Price and Item Count */}
                  <div className='d-flex justify-content-between align-items-center mb-2'>
                    <ProductPriceDiv product={product} />
                    {product.inventory > 0 ? (
                      <OrderItemCountDiv
                        shopFormErrors={shopFormErrors}
                        product={product}
                        productShopData={productShopData}
                        productShopChange={productShopChange}
                      />
                    ) : (
                      <StockStatusDiv product={product} />
                    )}
                  </div>

                  {/* Bottom Row: Buttons */}
                  <div className='d-flex'>
                    <OrderActionButtonDiv
                      itemInCart={itemInCart}
                      product={product}
                      shopFormErrors={shopFormErrors}
                      handleRemoveFromBagClick={handleRemoveFromBagClick}
                      handleAddToBagClick={handleAddToBagClick}
                      handleOrderNow={handleOrderNow}
                    />
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <NotFound message='No product found.' />
        )}
      </div>
    );
    // End of Return
  }
}

const OrderActionButtonDiv = ({
  itemInCart,
  product,
  shopFormErrors,
  handleRemoveFromBagClick,
  handleAddToBagClick,
  handleOrderNow
}) => {
  return (
    <div className='d-flex justify-content-sm-center justify-content-between align-items-center flex-sm-column vw-100'>
      {itemInCart ? (
        <Button
          variant='primary'
          disabled={product.inventory <= 0 && !shopFormErrors['quantity']}
          text='ব্যাগ থেকে সরান'
          className='bag-btn m-2 rounded-pill'
          // icon={<BagIcon />}
          onClick={handleRemoveFromBagClick}
        />
      ) : (
        <Button
          variant='primary'
          disabled={product.quantity <= 0 && !shopFormErrors['quantity']}
          text='ব্যাগে যোগ করুন'
          className='bag-btn m-2 rounded-pill'
          // icon={<BagIcon />}
          onClick={handleAddToBagClick}
        />
      )}
      <Button
        variant='primary'
        disabled={product.quantity <= 0 && !shopFormErrors['quantity']}
        text='অর্ডার করুন'
        className='order-btn m-2 rounded-pill'
        onClick={handleOrderNow}
      />
    </div>
  );
};

const StockStatusDiv = ({ product }) => {
  return (
    <div
      className={`stock-status d-flex ${product.inventory > 0 ? 'in-stock' : 'out-of-stock'
        }`}
    >
      {product.inventory > 0 ? 'In Stock' : 'Out of Stock'}
    </div>
  );
};

const OrderItemCountDiv = ({
  shopFormErrors,
  product,
  productShopData,
  productShopChange
}) => {
  return (
    <div className='item-customize d-flex align-items-center justify-content-center'>
      <Button
        text='-'
        className='btn btn-secondary px-3'
        disabled={productShopData.quantity <= 1}
        onClick={() =>
          productShopChange('quantity', productShopData.quantity - 1)
        }
      />
      <div className='item-customize'>
        <Input
          type={'numberShow'}
          error={shopFormErrors['quantity']}
          name={'quantity'}
          decimals={false}
          min={0}
          max={Math.min(99, product.inventory)}
          placeholder={'Product Quantity'}
          disabled={product.inventory <= 0 && !shopFormErrors['quantity']}
          value={productShopData.quantity}
          onInputChange={(name, value) => {
            let parsedValue = parseInt(value, 10);
            // Ensure parsedValue is within the 1-99 range
            if (!isNaN(parsedValue)) {
              // Limit the value to be between 1 and 99
              parsedValue = Math.max(1, Math.min(99, parsedValue));
              productShopChange(name, parsedValue);
            }
          }}
        />
      </div>
      <Button
        text='+'
        className='btn btn-secondary px-3'
        disabled={productShopData.quantity >= Math.min(product.inventory, 99)}
        onClick={() =>
          productShopChange('quantity', productShopData.quantity + 1)
        }
      />
    </div>
  );
};

const ProductPriceDiv = ({ product }) => {
  return (
    <div className='d-inline-flex align-items-center'>
      <p className='price'>৳{convertToBengaliDigits(product.price)}</p>
      {product.previousPrice && (
        <p className='previous-price'>
          ৳{convertToBengaliDigits(product.previousPrice)}
        </p>
      )}
    </div>
  );
};

const mapStateToProps = state => {
  const itemInCart = state.cart.cartItems.find(
    item => item._id === state.product.storeProduct._id
  )
    ? true
    : false;

  return {
    user: state.account.user,
    authenticated: state.authentication.authenticated,
    product: state.product.storeProduct,
    productShopData: state.product.productShopData,
    shopFormErrors: state.product.shopFormErrors,
    isLoading: state.product.isLoading,
    reviews: state.review.productReviews,
    reviewsSummary: state.review.reviewsSummary,
    reviewFormData: state.review.reviewFormData,
    reviewFormErrors: state.review.reviewFormErrors,
    itemInCart
  };
};

// export default connect(mapStateToProps, actions)(ProductPage);
export default compose(
  withRouter,
  connect(mapStateToProps, actions)
)(ProductPage);
