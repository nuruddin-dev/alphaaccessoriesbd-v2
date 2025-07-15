/**
 *
 * Edit Address
 *
 */

import React, { useState } from 'react';

import { Row, Col } from 'reactstrap';

import Checkbox from '../../Common/Checkbox';
import Input from '../../Common/Input';
import Button from '../../Common/Button';
import { districts, subDistrictsInDhakaCity } from '../../../utils/districts';

const EditAddress = props => {
  const {
    address,
    addressChange,
    formErrors,
    updateAddress,
    deleteAddress,
    addresses,
    updateDefaultAddress,
    addressFormData,
    user,
    updateDeliveryAddress
  } = props;

  const [checkboxChanged, setCheckboxChanged] = useState(false);
  const [initialIsDefault, setInitialIsDefault] = useState(address.isDefault);

  const handleSubmit = event => {
    event.preventDefault();

    if (checkboxChanged) {
      //-----Update Default Address-------
      if (addressFormData.isDefault && addresses && addresses.length > 0) {
        var defaultAddress;
        addresses.map(address => {
          address.isDefault === true ? (defaultAddress = address) : null;
        });
        if (defaultAddress) {
          defaultAddress.isDefault = false;
          updateDefaultAddress(defaultAddress);
        }
      }

      //-----Update Delivery Address-------
      const currentIsDefault = address.isDefault;
      if (!initialIsDefault && !currentIsDefault) {
      } else if (initialIsDefault && !currentIsDefault) {
        const deliveryAddress = '';
        const isInDhakaCity = null;
        const profile = { ...user, isInDhakaCity, deliveryAddress };
        updateDeliveryAddress(profile);
      } else {
        const deliveryAddress =
          address.address + ',' + address.subDistrict + ',' + address.district;
        var isInDhakaCity;
        if (address.district === 'ঢাকা শহর') isInDhakaCity = true;
        else isInDhakaCity = false;
        const profile = { ...user, isInDhakaCity, deliveryAddress };
        updateDeliveryAddress(profile);
      }
    }

    //-----Update Address-------
    updateAddress();
  };

  const handleDeleteAddress = id => {
    if (address.isDefault) {
      const deliveryAddress = '';
      const isInDhakaCity = null;
      const profile = { ...user, isInDhakaCity, deliveryAddress };
      updateDeliveryAddress(profile);
    }
    deleteAddress(id);
  };

  return (
    <div className='edit-address'>
      <form onSubmit={handleSubmit} noValidate>
        <Row>
          <Col xs='12' md='12'>
            <Input
              type={'text'}
              error={formErrors['address']}
              label={'Address'}
              name={'address'}
              placeholder={'Address: Street, House No / Apartment No'}
              value={address.address}
              onInputChange={(name, value) => {
                addressChange(name, value);
              }}
            />
          </Col>
          <Col xs='12' lg='6'>
            <label className='form-label mt-3 mb-1' htmlFor='district'>
              District
            </label>
            <select
              id='district'
              className='custom-select mb-2'
              name='district'
              value={address.district}
              onChange={e => addressChange('district', e.target.value)}
            >
              <option value=''>Select District</option>
              {districts.map((district, index) => (
                <option key={index} value={district.name}>
                  {address.district === district.name
                    ? `${district.name}`
                    : district.name}
                </option>
              ))}
            </select>
          </Col>
          <Col xs='12' lg='6'>
            <label className='form-label mt-3 mb-1' htmlFor='sub_district'>
              Thana
            </label>
            <select
              id='sub_district'
              className='custom-select mb-2'
              name='sub_district'
              value={address.subDistrict}
              onChange={e => addressChange('subDistrict', e.target.value)}
            >
              <option value=''>Select Thana</option>
              {address.district &&
                districts
                  .find(district => district.name === address.district)
                  ?.sub_district.map((sub_district, index) => (
                    <option key={index} value={sub_district}>
                      {`${sub_district}`}
                    </option>
                  ))}
            </select>
          </Col>
          <Col xs='12' md='12'>
            <Checkbox
              id={'default'}
              label={'As the Default'}
              name={'isDefault'}
              checked={address.isDefault}
              onChange={(name, value) => {
                setCheckboxChanged(true);
                addressFormData.isDefault = value;
                addressChange(name, value);
              }}
            />
          </Col>
        </Row>
        <hr />
        <div className='d-flex flex-column flex-md-row'>
          <Button
            type='submit'
            text='Save'
            className='mb-3 mb-md-0 mr-0 mr-md-3'
          />
          <Button
            variant='danger'
            text='Delete'
            onClick={() => handleDeleteAddress(address._id)}
          />
        </div>
      </form>
    </div>
  );
};

export default EditAddress;
