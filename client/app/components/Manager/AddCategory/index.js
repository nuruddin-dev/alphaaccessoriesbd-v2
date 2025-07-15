/**
 *
 * AddCategory
 *
 */

import React from 'react';

import { Row, Col } from 'reactstrap';

import Input from '../../Common/Input';
import Switch from '../../Common/Switch';
import Button from '../../Common/Button';
import SelectOption from '../../Common/SelectOption';

const AddCategory = props => {
  const {
    products,
    categoryFormData,
    formErrors,
    categoryChange,
    addCategory
  } = props;

  const handleSubmit = event => {
    event.preventDefault();
    addCategory();
  };

  return (
    <div className='add-category'>
      <form onSubmit={handleSubmit} noValidate>
        <Row>
          <Col xs='12'>
            <Input
              type={'text'}
              error={formErrors['name']}
              label={'Name'}
              name={'name'}
              placeholder={'Category Name'}
              value={categoryFormData.name}
              onInputChange={(name, value) => {
                categoryChange(name, value);
              }}
            />
          </Col>
          <Col xs='12' md='12'>
            <Input
              type={'textarea'}
              error={formErrors['description']}
              label={'Description'}
              name={'description'}
              placeholder={'Category Description'}
              value={categoryFormData.description}
              onInputChange={(name, value) => {
                categoryChange(name, value);
              }}
            />
          </Col>
          <Col lg='12' md='12' sm='12' xs='12'>
            <Input
              name={'imageUrl'}
              type={'text'}
              error={formErrors['imageUrl']}
              label={'Image URL'}
              placeholder={'Link of the image'}
              value={categoryFormData.imageUrl}
              onInputChange={(name, value) => {
                categoryChange(name, value);
              }}
            />
          </Col>
          <Col xs='12' md='12' className='my-2'>
            <Switch
              id={'active-category'}
              name={'isActive'}
              label={'Active?'}
              checked={categoryFormData.isActive}
              toggleCheckboxChange={value => categoryChange('isActive', value)}
            />
          </Col>
          <Col xs='12' md='12' className='my-2'>
            <Switch
              id={'top-category'}
              name={'isTop'}
              label={'Top Category?'}
              checked={false}
              toggleCheckboxChange={value => categoryChange('isTop', value)}
            />
          </Col>
        </Row>
        <hr />
        <div className='add-category-actions'>
          <Button type='submit' text='Add Category' />
        </div>
      </form>
    </div>
  );
};

export default AddCategory;
