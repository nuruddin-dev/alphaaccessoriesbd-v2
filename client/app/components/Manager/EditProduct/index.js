/**
 *
 * EditProduct
 *
 */

import React, { useState, useRef, useEffect } from 'react';

import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css'; // Import the Quill CSS

import { Link } from 'react-router-dom';
import { Row, Col, Modal, ModalBody, ModalHeader } from 'reactstrap';

import { ROLES } from '../../../constants';
import Input from '../../Common/Input';
import Switch from '../../Common/Switch';
import Button from '../../Common/Button';
import SelectOption from '../../Common/SelectOption';
import axios from 'axios';
import { API_URL } from '../../../constants';

const popularSelect = [
  { value: 1, label: 'Yes' },
  { value: 0, label: 'No' }
];

const premiumSelect = [
  { value: 1, label: 'Yes' },
  { value: 0, label: 'No' }
];

const colors = [
  { value: 1, label: 'Black' },
  { value: 2, label: 'White' },
  { value: 3, label: 'Red' },
  { value: 4, label: 'Green' },
  { value: 5, label: 'Blue' },
  { value: 6, label: 'Gold' },
  { value: 7, label: 'Pink' },
  { value: 8, label: 'Yellow' },
  { value: 9, label: 'Lime' }
];

const EditProduct = props => {
  const {
    user,
    product,
    productChange,
    formErrors,
    brands,
    tags,
    categories,
    updateProduct,
    deleteProduct,
    activateProduct
  } = props;

  const [localTags, setLocalTags] = useState([]);

  const [descriptionContent, setDescriptionContent] = useState(
    product.description || ''
  );
  const [fullDescriptionContent, setFullDescriptionContent] = useState(
    product.fullDescription || ''
  );
  const [specificationContent, setSpecificationContent] = useState(
    product.specification || ''
  );

  const quillRefDescription = useRef(null);
  const quillRefFullDescription = useRef(null);
  const quillRefSpecification = useRef(null);

  const handleDescriptionContentChange = value => {
    setDescriptionContent(value);
    productChange('description', value);
  };

  const handleFullDescriptionContentChange = value => {
    setFullDescriptionContent(value);
    productChange('fullDescription', value);
  };

  const handleSpecificationContentChange = value => {
    setSpecificationContent(value);
    productChange('specification', value);
  };

  const handleInsertImage = quillInstance => {
    const url = prompt('Enter Image URL:');
    if (url) {
      const range = quillInstance.getSelection(); // Get cursor position
      quillInstance.insertEmbed(range.index, 'image', url); // Insert image at cursor
      quillInstance.setSelection(range.index + 1); // Move cursor after the image
    }
  };

  const modules = {
    clipboard: {
      matchVisual: true
    },
    toolbar: [
      [{ size: ['small', false, 'large', 'huge'] }], // custom dropdown
      [{ header: [1, 2, 3, 4, 5, 6, false] }],

      ['bold', 'italic', 'underline', 'strike', 'blockquote', 'code-block'], // toggled buttons

      [{ list: 'ordered' }, { list: 'bullet' }],
      [{ script: 'sub' }, { script: 'super' }], // superscript/subscript
      [{ indent: '-1' }, { indent: '+1' }], // outdent/indent

      [{ color: [] }, { background: [] }], // dropdown with defaults from theme
      [{ align: [] }, 'clean', 'link']
    ]
  };

  const addCustomImageUrl = quillRef => {
    if (quillRef.current) {
      const toolbar = quillRef.current.getEditor().getModule('toolbar');
      const toolbarContainer = toolbar.container;

      // Prevent duplicate buttons
      const buttonExists = toolbarContainer.querySelector('.ql-imageUrl');
      if (!buttonExists) {
        const span = document.createElement('span');
        span.classList.add('ql-formats');

        const button = document.createElement('button');
        button.innerHTML = '<i class="fa fa-image"></i>';
        button.classList.add('ql-imageUrl');
        button.addEventListener('click', () =>
          handleInsertImage(quillRef.current.getEditor())
        );

        span.appendChild(button);
        toolbarContainer.appendChild(span);
      }
    }
  };

  useEffect(() => {
    setLocalTags(tags);
    addCustomImageUrl(quillRefDescription);
    addCustomImageUrl(quillRefFullDescription);
    addCustomImageUrl(quillRefSpecification);
  }, [
    tags,
    quillRefDescription,
    quillRefFullDescription,
    quillRefSpecification
  ]);

  const handleSubmit = event => {
    event.preventDefault();
    updateProduct();
  };

  const productColors = product.colors.map(color =>
    colors.find(c => c.label === color)
  );
  const productTags = product.tags.map(tag => tags.find(t => t.value === tag));

  const handleAddNewTag = async () => {
    const newTag = prompt('Enter a new tag:');
    if (newTag) {
      try {
        // Post the new tag to the server
        const response = await axios.post(`${API_URL}/tag/add`, {
          name: newTag,
          description: newTag,
          isActive: true
        });

        if (response.data && response.data.success) {
          const newTagData = {
            label: response.data.tag.name,
            value: response.data.tag._id
          };
          setLocalTags(prevTags => [...prevTags, newTagData]);
        } else {
          alert('Failed to add the new tag. Please try again.');
        }
      } catch (error) {
        console.error('Error adding new tag:', error);
        alert('An error occurred while adding the tag.');
      }
    }
  };

  const [modalOpen, setModalOpen] = useState(false);
  const toggleModal = () => setModalOpen(!modalOpen);

  return (
    <div className='edit-product'>
      <div className='d-flex flex-row mx-0 mb-3'>
        <label className='mr-1'>Product link </label>
        <Link to={`/${product.slug}`} className='default-link'>
          {product.slug}
        </Link>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        <Row>
          <Col lg='12' md='12' sm='12' xs='12'>
            <Input
              name={'slug'}
              type={'text'}
              error={formErrors['slug']}
              label={'Slug'}
              placeholder={'Product Slug'}
              value={product.slug}
              onInputChange={(name, value) => {
                productChange(name, value);
              }}
            />
          </Col>
          <Col lg='12' md='12' sm='12' xs='12'>
            <Input
              name={'name'}
              type={'text'}
              error={formErrors['name']}
              label={'Name'}
              placeholder={'Product Name'}
              value={product.name}
              onInputChange={(name, value) => {
                productChange(name, value);
              }}
            />
          </Col>

          <Col lg='12' md='12' sm='12' xs='12'>
            <Input
              name={'shortName'}
              type={'text'}
              error={formErrors['shortName']}
              label={'Short Name'}
              placeholder={'Product Short Name'}
              value={product.shortName}
              onInputChange={(name, value) => {
                productChange(name, value);
              }}
            />
          </Col>

          <Col lg='12' md='12' sm='12' xs='12'>
            <div>
              <label className='mb-1'>Description</label>
              <ReactQuill
                ref={quillRefDescription}
                value={descriptionContent}
                name={'Description'}
                onChange={handleDescriptionContentChange}
                theme='snow'
                modules={modules}
                placeholder='Write description here...'
                error={formErrors['description']}
              />
            </div>
          </Col>
        </Row>
        <Row>
          <Col lg='6' md='6' sm='12' xs='12'>
            <Input
              name={'sku'}
              type={'text'}
              error={formErrors['sku']}
              label={'Sku'}
              placeholder={'Product Sku'}
              value={product.sku}
              onInputChange={(name, value) => {
                productChange(name, value);
              }}
            />
          </Col>
          <Col lg='6' md='6' sm='12' xs='12'>
            <Input
              name={'quantity'}
              type={'number'}
              error={formErrors['quantity']}
              label={'Quantity'}
              decimals={false}
              min={0}
              placeholder={'Product Quantity'}
              value={product.quantity}
              onInputChange={(name, value) => {
                productChange(name, value);
              }}
            />
          </Col>
          <Col lg='6' md='6' sm='12' xs='12'>
            <Input
              name={'buyingPrice'}
              type={'number'}
              error={formErrors['buyingPrice']}
              label={'Buying Price'}
              min={0}
              placeholder={'Buying Price'}
              value={product.buyingPrice}
              onInputChange={(name, value) => {
                productChange(name, value);
              }}
            />
          </Col>
          <Col lg='6' md='6' sm='12' xs='12'>
            <Input
              name={'wholeSellPrice'}
              type={'number'}
              error={formErrors['wholeSellPrice']}
              label={'Whole Sell Price'}
              min={0}
              placeholder={'Whole Sell Price'}
              value={product.wholeSellPrice}
              onInputChange={(name, value) => {
                productChange(name, value);
              }}
            />
          </Col>
          <Col lg='6' md='6' sm='12' xs='12'>
            <Input
              name={'previousPrice'}
              type={'number'}
              error={formErrors['previousPrice']}
              label={'Previous Price'}
              min={0}
              placeholder={'Previous Price'}
              value={product.previousPrice}
              onInputChange={(name, value) => {
                productChange(name, value);
              }}
            />
          </Col>
          <Col lg='6' md='6' sm='12' xs='12'>
            <Input
              name={'price'}
              type={'number'}
              error={formErrors['price']}
              label={'Current Price'}
              min={0}
              placeholder={'Current Price'}
              value={product.price}
              onInputChange={(name, value) => {
                productChange(name, value);
              }}
            />
          </Col>
        </Row>

        <Row>
          <Col lg='6' md='6' sm='12' xs='12'>
            <SelectOption
              name={'popular'}
              error={formErrors['popular']}
              label={'Popular'}
              options={popularSelect}
              value={[product.popular ? popularSelect[0] : popularSelect[1]]}
              handleSelectChange={value => {
                productChange('popular', value);
              }}
            />
          </Col>
          <Col lg='6' md='6' sm='12' xs='12'>
            <SelectOption
              name={'premium'}
              error={formErrors['premium']}
              label={'Premium'}
              options={premiumSelect}
              value={[product.premium ? premiumSelect[0] : premiumSelect[1]]}
              handleSelectChange={value => {
                productChange('premium', value);
              }}
            />
          </Col>
        </Row>
        <Row>
          <Col lg='6' md='6' sm='12' xs='12'>
            <SelectOption
              name={'brand'}
              disabled={user.role === ROLES.Merchant}
              error={formErrors['brand']}
              label={'Brand'}
              value={user.role === ROLES.Merchant ? brands[1] : product.brand}
              options={brands}
              handleSelectChange={value => {
                productChange('brand', value);
              }}
            />
          </Col>

          <Col lg='6' md='6' sm='12' xs='12'>
            <SelectOption
              name={'category'}
              error={formErrors['category']}
              label={'Category'}
              options={categories}
              value={product.category}
              handleSelectChange={value => {
                productChange('category', value);
              }}
            />
          </Col>
        </Row>
        <Row>
          <Col lg='12' md='12' sm='12' xs='12'>
            <SelectOption
              name={'colors'}
              error={formErrors['colors']}
              label={'Colors'}
              multi={true}
              defaultValue={productColors}
              options={colors}
              handleSelectChange={value => {
                productChange('colors', value);
              }}
            />
          </Col>
          <Col lg='8' md='12' sm='12' xs='12'>
            <Input
              name={'imageUrl'}
              type={'text'}
              error={formErrors['imageUrl']}
              label={'Image URL'}
              placeholder={'Link of the image'}
              value={product.imageUrl}
              onInputChange={(name, value) => {
                productChange(name, value);
              }}
            />
          </Col>
          <Col lg='4' md='12' sm='12' xs='12'>
            <Input
              name={'imageAlt'}
              type={'text'}
              error={formErrors['imageAlt']}
              label={'Image Alt'}
              placeholder={'Alternative Text for the Image'}
              value={product.imageAlt}
              onInputChange={(name, value) => {
                productChange(name, value);
              }}
            />
          </Col>
          {/* <Col xs='12' md='12'>
            <Input
              type={'file'}
              error={formErrors['file']}
              name={'image'}
              label={'file'}
              placeholder={'Please Upload Image'}
              value={image}
              onInputChange={(name, value) => {
                productChange(name, value);
              }}
            />
          </Col> */}
        </Row>
        <Row>
          <Col lg='12' md='12' sm='12' xs='12'>
            <Input
              name={'metaTitle'}
              type={'text'}
              label={'Meta Title'}
              error={formErrors['metaTitle']}
              placeholder={'Enter Meta Title Here'}
              value={product.metaTitle}
              onInputChange={(name, value) => {
                productChange(name, value);
              }}
            />
          </Col>
          <Col lg='12' md='12' sm='12' xs='12'>
            <Input
              name={'metaDescription'}
              type={'textarea'}
              error={formErrors['metaDescription']}
              label={'Meta Description'}
              placeholder={'Enter Meta Description Here'}
              value={product.metaDescription}
              onInputChange={(name, value) => {
                productChange(name, value);
              }}
            />
          </Col>
          <Col lg='12' md='12' sm='12' xs='12'>
            <div>
              <label className='mb-1'>Full Description</label>
              <ReactQuill
                ref={quillRefFullDescription}
                value={fullDescriptionContent}
                name={'fullDescription'}
                onChange={handleFullDescriptionContentChange}
                theme='snow'
                modules={modules}
                placeholder='Write full description here...'
                error={formErrors['fullDescription']}
              />
            </div>
            <Button onClick={toggleModal} text='Preview' />
            <Modal isOpen={modalOpen} toggle={toggleModal}>
              <ModalHeader
                toggle={toggleModal}
                style={{
                  maxWidth: '200%',
                  width: '200%',
                  backgroundColor: 'white',
                  transform: 'translateX(-25%)'
                }}
              >
                <p>Full Description</p>
              </ModalHeader>
              <ModalBody
                style={{
                  maxWidth: '200%',
                  width: '200%',
                  backgroundColor: 'white',
                  transform: 'translateX(-25%)'
                }}
              >
                <div
                  dangerouslySetInnerHTML={{ __html: fullDescriptionContent }}
                ></div>
              </ModalBody>
            </Modal>
          </Col>
          <Col lg='12' md='12' sm='12' xs='12'>
            <div>
              <label className='mb-1'>Specification</label>
              <ReactQuill
                ref={quillRefSpecification}
                value={specificationContent}
                name={'Specification'}
                onChange={handleSpecificationContentChange}
                theme='snow'
                modules={modules}
                placeholder='Write specification here...'
                error={formErrors['specification']}
              />
            </div>
          </Col>
          <Col lg='11' md='11' sm='11' xs='11'>
            <SelectOption
              name={'tags'}
              error={formErrors.tags}
              label='Tags'
              multi={true}
              defaultValue={productTags}
              options={localTags.sort((a, b) => a.label.localeCompare(b.label))}
              handleSelectChange={value => {
                productChange('tags', value);
              }}
            />
          </Col>
          <Col
            lg='1'
            md='1'
            sm='1'
            xs='1'
            style={{
              display: 'flex',
              justifyContent: 'center', // Centers horizontally
              alignItems: 'flex-end',
              marginBottom: '15px'
            }}
          >
            <i
              className='fa fa-plus-square'
              style={{
                cursor: 'pointer',
                fontSize: '1.5rem',
                color: '#007bff',
                padding: '5px',
                borderRadius: '4px'
              }}
              onClick={handleAddNewTag}
            />
          </Col>
        </Row>
        <Row>
          <Col lg='12' md='12' sm='12' xs='12'>
            <Input
              name={'note'}
              type={'text'}
              error={formErrors['note']}
              label={'Note'}
              placeholder={'Enter any additional notes'}
              value={product.note}
              onInputChange={(name, value) => {
                productChange(name, value);
              }}
            />
          </Col>
        </Row>
        <Row>
          <Col lg='12' md='12' sm='12' xs='12' className='my-2'>
            <Switch
              name={'isActive'}
              id={'active-product'}
              label={'Active?'}
              checked={product.isActive}
              toggleCheckboxChange={value => productChange('isActive', value)}
            />
          </Col>
        </Row>
        <hr />
        <div className='d-flex flex-column flex-md-row'>
          <Button
            type='submit'
            text='Update'
            className='mb-3 mb-md-0 mr-0 mr-md-3'
          />
          <Button
            variant='danger'
            text='Delete'
            onClick={() =>
              window.confirm('Are you sure you want to delete this product?') &&
              deleteProduct(product._id)
            }
          />
        </div>
      </form>
    </div>
  );
};

export default EditProduct;
