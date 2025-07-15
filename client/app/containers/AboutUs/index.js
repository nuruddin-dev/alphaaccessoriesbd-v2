import React from 'react';
import { Container, Row, Col, Button } from 'reactstrap';
import { Link } from 'react-router-dom';
import { getImagePath } from '../../utils';

const AboutUs = () => {
  return (
    <div className='about-us-section'>
      <Container>
        <Row className='justify-content-center text-center'>
          <Col md='8'>
            <p className='title mb-4 font-weight-bolder'>
              About AlphaAccessoriesBD
            </p>
            <p className='lead'>
              Established in <strong>2020</strong>, AlphaAccessoriesBD has been
              at the forefront of mobile accessory innovation, with a special
              focus on videography tools like <strong>ring lights</strong>,{' '}
              <strong>stands</strong>, <strong>microphones</strong>, and more.
              Our passion lies in empowering content creators with the best
              tools to enhance their creativity.
            </p>
          </Col>
        </Row>

        <Row className='mt-5'>
          <Col md='6' className='text-center'>
            <div className='shop-location-box'>
              <h3>Our Location</h3>
              <p>
                <i className='fas fa-map-marker-alt'></i>
                Sundarban Square Super Market
                <br />
                2rd floor ( Gate no. 08 )<br />
                Gulistan, Dhaka
              </p>
              <a
                href='https://maps.app.goo.gl/K8DwgKbrF9j2pH8B9'
                target='_blank'
              >
                <Button color='success' className='location-btn'>
                  View on Map
                </Button>{' '}
              </a>
            </div>
          </Col>
          <Col md='6' className='text-center'>
            <div className='our-mission-box'>
              <h3>Our Mission</h3>
              <p>
                At AlphaAccessoriesBD, we aim to provide the latest and most
                reliable accessories for mobile videography, helping creators
                and professionals to reach their full potential.
              </p>
              <Link to='/shop' style={{ textDecoration: 'none' }}>
                <Button color='success' className='mission-btn'>
                  Explore Products
                </Button>
              </Link>
            </div>
          </Col>
        </Row>

        <Row className='team-section mt-5'>
          <Col md='12' className='text-center'>
            <p className='team-title font-weight-bolder m-0'>Meet the Team</p>
          </Col>
          <Col md='4' className='text-center'>
            <div className='team-member'>
              <img
                loading='lazy'
                src={getImagePath('nur.png')}
                alt='CEO'
                className='team-photo'
              />
              <h5>Nur Uddin</h5>
              <p>Founder & CEO</p>
              <div className='row justify-content-center'>
                <div className='col-auto p-2'>
                  <a
                    href='http://facebook.com/jony6290'
                    className='social-icon'
                  >
                    <i className='fa fa-facebook' />
                  </a>
                </div>
                <div className='col-auto p-2'>
                  <a
                    href='https://wa.me/+8801838626121'
                    className='social-icon'
                  >
                    <i className='fa fa-whatsapp' />
                  </a>
                </div>
                <div className='col-auto p-2'>
                  <a
                    href='http://sites.google.com/view/nuruddin'
                    className='social-icon'
                  >
                    <i className='fa fa-globe' />
                  </a>
                </div>
              </div>
            </div>
          </Col>
          <Col md='4' className='text-center'>
            <div className='team-member'>
              <img
                loading='lazy'
                src={getImagePath('mehedi.png')}
                alt='Team Member'
                className='team-photo'
              />
              <h5>Mehedi Hasan</h5>
              <p>Chief Marketing Officer</p>
              <div className='row justify-content-center'>
                <div className='col-auto p-2'>
                  <a
                    href='http://facebook.com/771mehedi'
                    className='social-icon'
                  >
                    <i className='fa fa-facebook' />
                  </a>
                </div>
                <div className='col-auto p-2'>
                  <a
                    href='https://wa.me/+8801884200747'
                    className='social-icon'
                  >
                    <i className='fa fa-whatsapp' />
                  </a>
                </div>
                <div className='col-auto p-2'>
                  <a href='#' className='social-icon'>
                    <i className='fa fa-globe' />
                  </a>
                </div>
              </div>
            </div>
          </Col>
          <Col md='4' className='text-center'>
            <div className='team-member'>
              <img
                loading='lazy'
                src={getImagePath('masum.png')}
                alt='Team Member'
                className='team-photo'
              />
              <h5>Masum Billah</h5>
              <p>Product Manager</p>
              <div className='row justify-content-center'>
                <div className='col-auto p-2'>
                  <a
                    href='http://facebook.com/Masum.Billah3251'
                    className='social-icon'
                  >
                    <i className='fa fa-facebook' />
                  </a>
                </div>
                <div className='col-auto p-2'>
                  <a
                    href='https://wa.me/+8801869116691'
                    className='social-icon'
                  >
                    <i className='fa fa-whatsapp' />
                  </a>
                </div>
                <div className='col-auto p-2'>
                  <a href='#' className='social-icon'>
                    <i className='fa fa-globe' />
                  </a>
                </div>
              </div>
            </div>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default AboutUs;
