/**
 *
 * AddAddress
 *
 */

import React from 'react';

import { Row, Col } from 'reactstrap';

import Checkbox from '../../Common/Checkbox';
import Input from '../../Common/Input';
import Button from '../../Common/Button';
import { districts, subDistrictsInDhakaCity } from '../../../utils/districts';
// import districts from '../../../utils/districts';

const AddAddress = props => {
  const {
    addressFormData,
    formErrors,
    addressChange,
    addAddress,
    addresses,
    updateDefaultAddress,
    user,
    updateDeliveryAddress
  } = props;

  const handleSubmit = event => {
    event.preventDefault();

    //-----Update Default Address-------
    var defaultAddress;
    if (addressFormData.isDefault && addresses && addresses.length > 0) {
      addresses.map(address => {
        address.isDefault === true ? (defaultAddress = address) : null;
      });
      if (defaultAddress) {
        defaultAddress.isDefault = false;
        updateDefaultAddress(defaultAddress);
      }
    }

    //-----Update Delivery Address-------
    if (addressFormData.isDefault) {
      const deliveryAddress =
        addressFormData.address +
        ',' +
        addressFormData.subDistrict +
        ',' +
        addressFormData.district;
      var isInDhakaCity = false;
      if (addressFormData.district === 'ঢাকা শহর') {
        isInDhakaCity = true;
      }
      const profile = { ...user, isInDhakaCity, deliveryAddress };
      updateDeliveryAddress(profile);
    }

    //-----Add Address-------
    addAddress();
  };

  return (
    <div className='add-address'>
      <form onSubmit={handleSubmit} noValidate>
        <Row>
          <Col xs='12' md='12'>
            <Input
              type={'text'}
              error={formErrors['address']}
              label={'Address'}
              name={'address'}
              placeholder={'Address: Street, House No / Apartment No'}
              value={addressFormData.address}
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
              value={addressFormData.district}
              onChange={e => addressChange('district', e.target.value)}
            >
              <option value=''>Select District</option>
              {districts.map((district, index) => (
                <option key={index} value={district.name}>
                  {district.name}
                </option>
              ))}
            </select>
          </Col>
          <Col xs='12' lg='6'>
            <label className='form-label mt-3 mb-1' htmlFor='sub_district'>
              Sub District
            </label>
            <select
              id='sub_district'
              className='custom-select mb-2'
              name='sub_district'
              disabled={!addressFormData.district}
              value={addressFormData.subDistrict}
              onChange={e => addressChange('subDistrict', e.target.value)}
            >
              <option value=''>Select Sub District</option>
              {addressFormData.district &&
                districts
                  .find(district => district.name === addressFormData.district)
                  ?.sub_district.map((sub_district, index) => (
                    <option key={index} value={sub_district}>
                      {sub_district}
                    </option>
                  ))}
            </select>
          </Col>
          <Col xs='12' md='12'>
            <Checkbox
              className='custom-check mt-3'
              id={'default'}
              label={'As the Default'}
              name={'isDefault'}
              checked={addressFormData.isDefault}
              onChange={(name, value) => {
                addressFormData.isDefault = value;
                addressChange(name, value);
              }}
            />
          </Col>
        </Row>
        <hr />
        <div className='add-address-actions'>
          <Button type='submit' text='Add Address' />
        </div>
      </form>
    </div>
  );
};

export default AddAddress;
