import React, { useState } from 'react';

const Carousel = ({ newProducts }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const moveLeft = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const moveRight = () => {
    if (currentIndex < newProducts.length - 4) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  return (
    <div className='container mt-5'>
      <div id='myCarousel' className='carousel slide' data-ride='carousel'>
        <div className='carousel-inner'>
          {newProducts
            .slice(currentIndex, currentIndex + 4)
            .map((item, index) => (
              <div
                key={index}
                className={`carousel-item ${index === 0 ? 'active' : ''}`}
              >
                <div className='row'>
                  <div className='col-sm-3'>{item}</div>
                </div>
              </div>
            ))}
        </div>
        <a
          className='carousel-control-prev'
          href='#myCarousel'
          role='button'
          data-slide='prev'
          onClick={moveLeft}
        >
          <span
            className='carousel-control-prev-icon'
            aria-hidden='true'
          ></span>
          <span className='sr-only'>Previous</span>
        </a>
        <a
          className='carousel-control-next'
          href='#myCarousel'
          role='button'
          data-slide='next'
          onClick={moveRight}
        >
          <span
            className='carousel-control-next-icon'
            aria-hidden='true'
          ></span>
          <span className='sr-only'>Next</span>
        </a>
      </div>
    </div>
  );
};

export default Carousel;
