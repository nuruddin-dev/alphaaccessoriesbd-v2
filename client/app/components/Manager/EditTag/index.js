/**
 *
 * EditTag
 *
 */

import React from 'react';

import { Link } from 'react-router-dom';
import { Row, Col } from 'reactstrap';

import Input from '../../Common/Input';
import Button from '../../Common/Button';
import Switch from '../../Common/Switch';
import { ROLES } from '../../../constants';

const EditTag = props => {
  const {
    user,
    tag,
    tagChange,
    formErrors,
    updateTga,
    deleteTag,
    activateTag
  } = props;

  const handleSubmit = event => {
    event.preventDefault();
    updateTag();
  };

  return (
    <div className='edit-tag'>
      <div className='d-flex flex-row mx-0 mb-3'>
        <label className='mr-1'>Tag link </label>
        <Link to={`/shop/tag/${tag.slug}`} className='default-link'>
          {tag.slug}
        </Link>
      </div>
      <form onSubmit={handleSubmit} noValidate>
        <Row>
          <Col xs='12'>
            <Input
              type={'text'}
              error={formErrors['tagName']}
              label={'Name'}
              name={'tagName'}
              placeholder={'Tag Name'}
              value={tag.name}
              onInputChange={(name, value) => {
                tagChange(name, value);
              }}
            />
          </Col>
          <Col xs='12'>
            <Input
              type={'text'}
              error={formErrors['slug']}
              label={'Slug'}
              name={'slug'}
              placeholder={'Tag Slug'}
              value={tag.slug}
              onInputChange={(name, value) => {
                tagChange(name, value);
              }}
            />
          </Col>
          <Col xs='12' md='12'>
            <Input
              type={'textarea'}
              error={formErrors['tagDescription']}
              label={'Description'}
              name={'tagDescription'}
              placeholder={'Tag Description'}
              value={tag.description}
              onInputChange={(name, value) => {
                tagChange(name, value);
              }}
            />
          </Col>
          <Col xs='12' md='12' className='mt-3 mb-2'>
            <Switch
              style={{ width: 100 }}
              tooltip={tag.isActive}
              tooltipContent={`Disabling ${tag.name} will also disable all ${tag.name} products.`}
              id={`enable-tag-${tag._id}`}
              name={'isActive'}
              label={'Active?'}
              checked={tag.isActive}
              toggleCheckboxChange={value => activateTag(tag._id, value)}
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
            disabled={user.role === ROLES.Merchant}
            onClick={() => deleteTag(tag._id)}
          />
        </div>
      </form>
    </div>
  );
};

export default EditTag;
