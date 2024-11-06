import React from 'react';
import Slider from 'react-slick';
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

const images = [
    "/carouselimages/1.jpg",
    "/carouselimages/w1.jpg",
    "/carouselimages/12.jpeg",
    "/carouselimages/3.jpg",
    "/carouselimages/4.jpg",
    "/carouselimages/w6.jpg",
    "/carouselimages/9.jpeg",
    "/carouselimages/5.jpg",
    "/carouselimages/6.jpg",
    "/carouselimages/13.jpeg"
];

function ImageCarousel() {
    const settings = {
        dots: true,
        infinite: true,
        speed: 500,
        slidesToShow: 3,
        slidesToScroll: 1,
        autoplay: true,
        autoplaySpeed: 3000,  // Speed up for testing
        pauseOnHover: false,  // Optional
        responsive: [
          {
            breakpoint: 1024,
            settings: {
              slidesToShow: 2,
            }
          },
          {
            breakpoint: 768, // Adjust for tablets
            settings: {
              slidesToShow: 1,
            }
          }
        ]
    };

    return (
      <div className="carousel-container">
        <Slider {...settings}>
          {images.map((src, index) => (
            <div key={index} className="carousel-slide">
              <img src={src} alt={`Slide ${index + 1}`} className="carousel-image" />
            </div>
          ))}
        </Slider>
      </div>
    );
}

export default ImageCarousel;
