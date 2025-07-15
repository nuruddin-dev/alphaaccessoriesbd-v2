/*
 *
 * Login
 *
 */

import React from 'react';

import { connect } from 'react-redux';
import { Redirect, Link } from 'react-router-dom';
import { Row, Col } from 'reactstrap';

import actions from '../../actions';

import Input from '../../components/Common/Input';
import Button from '../../components/Common/Button';
import LoadingIndicator from '../../components/Common/LoadingIndicator';
import SignupProvider from '../../components/Common/SignupProvider';

class Login extends React.PureComponent {
  render() {
    const {
      authenticated,
      loginFormData,
      loginChange,
      login,
      formErrors,
      isLoading,
      isSubmitting
    } = this.props;

    if (authenticated) return <Redirect to='/dashboard' />;

    const registerLink = () => {
      this.props.history.push('/register');
    };

    const handleSubmit = event => {
      event.preventDefault();
      login();
    };

    return (
      <div className='login-form'>
        {isLoading && <LoadingIndicator />}
        <p className='font-weight-bolder m-0'>Login</p>
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
                  error={formErrors['email']}
                  label={'মোবাইল নম্বর অথবা মেইল'}
                  name={'email'}
                  placeholder={'আপনার মোবাইল নম্বর অথবা মেইল এড্রেস টি দিন'}
                  value={loginFormData.email}
                  onInputChange={(name, value) => {
                    loginChange(name, value);
                  }}
                />
              </Col>
              <Col xs='12' md='12'>
                <Input
                  type={'password'}
                  error={formErrors['password']}
                  label={'পাসওয়ার্ড'}
                  name={'password'}
                  placeholder={'আপনার পাসওয়ার্ডটি দিন'}
                  value={loginFormData.password}
                  onInputChange={(name, value) => {
                    loginChange(name, value);
                  }}
                />
              </Col>
            </Col>
            <Col
              xs={{ size: 12, order: 1 }}
              md={{ size: '6', order: 2 }}
              className='mb-2 mb-md-0'
            >
              <SignupProvider />
            </Col>
          </Row>
          <hr />
          <div className='d-flex flex-column flex-md-row align-items-md-center justify-content-between'>
            <div className='d-flex justify-content-between align-items-center mb-3 mb-md-0'>
              <Button
                type='submit'
                variant='primary'
                text='লগইন'
                disabled={isSubmitting}
              />
              <Button
                text='একাউন্ট তৈরি করুন'
                variant='link'
                className='ml-md-3'
                onClick={registerLink}
              />
            </div>
            {/* <Link
              className='redirect-link forgot-password-link'
              to={'/forgot-password'}
            >
              Forgot Password?
            </Link> */}
          </div>
        </form>
      </div>
    );
  }
}

const mapStateToProps = state => {
  return {
    authenticated: state.authentication.authenticated,
    loginFormData: state.login.loginFormData,
    formErrors: state.login.formErrors,
    isLoading: state.login.isLoading,
    isSubmitting: state.login.isSubmitting
  };
};

export default connect(mapStateToProps, actions)(Login);
