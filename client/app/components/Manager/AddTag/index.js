/**
 *
 * AddTag
 *
 */

import React from 'react';

import { Row, Col } from 'reactstrap';

import Input from '../../Common/Input';
import Switch from '../../Common/Switch';
import Button from '../../Common/Button';

const AddTag = props => {
  const { tagFormData, formErrors, tagChange, addTag } = props;

  const handleSubmit = event => {
    event.preventDefault();
    addTag();
  };

  return (
    <div className='add-tag'>
      <form onSubmit={handleSubmit} noValidate>
        <Row>
          <Col xs='12'>
            <Input
              type={'text'}
              error={formErrors['name']}
              label={'Name'}
              name={'name'}
              placeholder={'Tag Name'}
              value={tagFormData.name}
              onInputChange={(name, value) => {
                tagChange(name, value);
              }}
            />
          </Col>
          <Col xs='12' md='12'>
            <Input
              type={'textarea'}
              error={formErrors['description']}
              label={'Description'}
              name={'description'}
              placeholder={'Tag Description'}
              value={tagFormData.description}
              onInputChange={(name, value) => {
                tagChange(name, value);
              }}
            />
          </Col>
          <Col xs='12' md='12' className='my-2'>
            <Switch
              id={'active-tag'}
              name={'isActive'}
              label={'Active?'}
              checked={tagFormData.isActive}
              toggleCheckboxChange={value => tagChange('isActive', value)}
            />
          </Col>
        </Row>
        <hr />
        <div className='add-tag-actions'>
          <Button type='submit' text='Add Tag' />
        </div>
      </form>
    </div>
  );
};

export default AddTag;
