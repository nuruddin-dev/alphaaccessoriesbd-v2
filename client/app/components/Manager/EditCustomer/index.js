/*
 * EditCustomer Form
 */

import React from 'react';
import { Row, Col } from 'reactstrap';
import Input from '../../Common/Input';
import Button from '../../Common/Button';

const EditCustomer = props => {
    const { customer, formErrors, customerChange, updateCustomer, deleteCustomer, user } = props;

    const handleSubmit = event => {
        event.preventDefault();
        updateCustomer();
    };

    const handleDelete = () => {
        if (window.confirm('Are you sure you want to delete this customer?')) {
            deleteCustomer(customer._id);
        }
    };

    return (
        <div className='edit-customer'>
            <form onSubmit={handleSubmit} noValidate>
                <Row>
                    <Col lg='12' md='12' sm='12' xs='12'>
                        <Input
                            name={'name'}
                            type={'text'}
                            error={formErrors['name']}
                            label={'Customer Name'}
                            placeholder={'Enter Customer Name'}
                            value={customer?.name || ''}
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
                            value={customer?.phoneNumber || ''}
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
                            value={customer?.address || ''}
                            onInputChange={(name, value) => customerChange(name, value)}
                        />
                    </Col>
                </Row>

                <div className='edit-customer-actions mt-3'>
                    <Button type='submit' text='Update Customer' />
                    <Button
                        className='ml-2'
                        variant='danger'
                        text='Delete Customer'
                        onClick={handleDelete}
                    />
                </div>
            </form>
        </div>
    );
};

export default EditCustomer;
