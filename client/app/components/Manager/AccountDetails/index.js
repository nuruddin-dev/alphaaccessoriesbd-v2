/**
 *
 * AccountDetails
 *
 */

import React from 'react';

import { Row, Col } from 'reactstrap';

import { EMAIL_PROVIDER } from '../../../constants';
import UserRole from '../UserRole';
import Input from '../../Common/Input';
import Button from '../../Common/Button';
import Checkbox from '../../Common/Checkbox';

const AccountDetails = props => {
  const { user, accountChange, updateProfile } = props;

  const handleSubmit = event => {
    event.preventDefault();
    updateProfile();
  };

  return (
    <div className='account-details'>
      <div className='info'>
        <div className='desc'>
          <p className='one-line-ellipsis mr-3'>
            {user.provider === EMAIL_PROVIDER.Email ? (
              user.email
            ) : (
              <span className='provider-email'>
                Logged in With {user.provider}
              </span>
            )}
          </p>
          <UserRole user={user} />
        </div>
      </div>
      <form onSubmit={handleSubmit}>
        <Row>
          <Col xs='12' md='12'>
            <Input
              type={'text'}
              label={'নাম'}
              name={'firstName'}
              placeholder={'আপনার নাম লিখুন'}
              value={user.firstName}
              onInputChange={(name, value) => {
                accountChange(name, value);
              }}
            />
          </Col>
          <Col xs='12' md='12'>
            <Input
              type={'text'}
              label={'মোবাইল নম্বর'}
              name={'phoneNumber'}
              placeholder={'আপনার মোবাইল নম্বরটি দিন'}
              value={user.phoneNumber ? user.phoneNumber : ''}
              onInputChange={(name, value) => {
                accountChange(name, value);
              }}
            />
          </Col>
          <Col xs='12' md='12'>
            <Input
              type={'text'}
              label={'ডেলিভারি ঠিকানা'}
              name={'deliveryAddress'}
              placeholder={
                user.deliveryAddress
                  ? user.deliveryAddress
                  : 'কোন ডেলিভারি ঠিকানা নেই'
              }
              disabled
            />
          </Col>
        </Row>
        <hr />
        <div className='profile-actions'>
          <Button type='submit' variant='secondary' text='আপডেট করুন' />
        </div>
      </form>
    </div>
  );
};

export default AccountDetails;
