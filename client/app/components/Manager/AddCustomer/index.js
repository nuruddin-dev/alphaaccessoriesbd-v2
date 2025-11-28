/*
 * AddCustomer Form
 */

import React from 'react';
import { Row, Col } from 'reactstrap';
import Input from '../../Common/Input';
import Button from '../../Common/Button';

const AddCustomer = props => {
  const { customerFormData, formErrors, customerChange, addCustomer } = props;

  const handleSubmit = event => {
    event.preventDefault();
    addCustomer();
  };

  return (
    <div className='add-customer'>
      <form onSubmit={handleSubmit} noValidate>
        <Row>
          <Col lg='12' md='12' sm='12' xs='12'>
            <Input
              name={'customerName'}
              type={'text'}
              error={formErrors['customerName']}
              label={'Customer Name'}
              placeholder={'Enter Customer Name'}
              value={customerFormData?.customerName}
              onInputChange={(name, value) => customerChange(name, value)}
            />
          </Col>

          <Col lg='12' md='12' sm='12' xs='12'>
            <Input
              name={'phoneNumber'}
              type={'text'}
              error={formErrors['phoneNumber']}
              label={'Phone Number'}
              placeholder={'Enter Phone Number'}
              value={customerFormData?.phoneNumber}
              onInputChange={(name, value) => customerChange(name, value)}
            />
          </Col>

          <Col lg='12' md='12' sm='12' xs='12'>
            <Input
              name={'address'}
              type={'text'}
              error={formErrors['address']}
              label={'Address'}
              placeholder={'Enter Address'}
              value={customerFormData?.address}
              onInputChange={(name, value) => customerChange(name, value)}
            />
          </Col>
        </Row>

        <div className='add-customer-actions mt-3'>
          <Button type='submit' text='Add Customer' />
        </div>
      </form>
    </div>
  );
};

export default AddCustomer;
