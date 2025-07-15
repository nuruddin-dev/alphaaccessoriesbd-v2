/*
 *
 * Signup
 *
 */

import React from 'react';

import { connect } from 'react-redux';
import { Row, Col } from 'reactstrap';
import { Redirect, Link } from 'react-router-dom';

import actions from '../../actions';

import Input from '../../components/Common/Input';
import Button from '../../components/Common/Button';
import LoadingIndicator from '../../components/Common/LoadingIndicator';

class Signup extends React.PureComponent {
  render() {
    const {
      authenticated,
      signupFormData,
      formErrors,
      isLoading,
      isSubmitting,
      signupChange,
      signUp
    } = this.props;

    if (authenticated) return <Redirect to='/dashboard' />;

    const handleSubmit = event => {
      event.preventDefault();
      signUp();
    };

    return (
      <div className='signup-form'>
        {isLoading && <LoadingIndicator />}
        <p className='font-weight-bolder m-0'>Sign Up</p>
        <hr />
        <form onSubmit={handleSubmit} noValidate>
          <Row>
            <Col
              xs={{ size: 12, order: 2 }}
              md={{ size: '6', order: 1 }}
              className='p-0'
            >
              <Col xs='12' md='12'>
                <Input
                  type={'text'}
                  error={formErrors['firstName']}
                  label={'নাম'}
                  name={'firstName'}
                  placeholder={'আপনার সম্পূর্ণ নাম লিখুন'}
                  value={signupFormData.firstName}
                  onInputChange={(name, value) => {
                    signupChange(name, value);
                  }}
                />
              </Col>
              <Col xs='12' md='12'>
                <Input
                  type={'text'}
                  error={formErrors['email']}
                  label={'মোবাইল নম্বর অথবা মেইল'}
                  name={'email'}
                  placeholder={'মোবাইল নম্বর অথবা মেইল এড্রেস টি লিখুন'}
                  value={signupFormData.email}
                  onInputChange={(name, value) => {
                    signupChange(name, value);
                  }}
                />
              </Col>
              <Col xs='12' md='12'>
                <Input
                  type={'password'}
                  label={'পাসওয়ার্ড'}
                  error={formErrors['password']}
                  name={'password'}
                  placeholder={'একটি পাসওয়ার্ড দিন'}
                  value={signupFormData.password}
                  onInputChange={(name, value) => {
                    signupChange(name, value);
                  }}
                />
              </Col>
            </Col>
          </Row>
          <hr />
          <div className='d-flex flex-column flex-md-row align-items-md-center justify-content-between'>
            <Button
              type='submit'
              variant='primary'
              text='একাউন্ট তৈরি'
              disabled={isSubmitting}
            />
            <Link className='mt-3 mt-md-0 redirect-link' to={'/login'}>
              লগইন পেইজে যান
            </Link>
          </div>
        </form>
      </div>
    );
  }
}

const mapStateToProps = state => {
  return {
    authenticated: state.authentication.authenticated,
    signupFormData: state.signup.signupFormData,
    formErrors: state.signup.formErrors,
    isLoading: state.signup.isLoading,
    isSubmitting: state.signup.isSubmitting,
    isSubscribed: state.signup.isSubscribed
  };
};

export default connect(mapStateToProps, actions)(Signup);
