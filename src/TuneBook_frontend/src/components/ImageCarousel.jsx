import React, { useState, useEffect } from 'react';
import Slider from 'react-slick';
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import LoadingSpinner from './LoadingSpinner';  

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
    const [loading, setLoading] = useState(false);  // Set loading to true initially
    const [loadedImages, setLoadedImages] = useState(0);

    const settings = {
        dots: true,
        infinite: true,
        speed: 400,
        slidesToShow: 4,
        slidesToScroll: 1,
        autoplay: true,
        autoplaySpeed: 3500,
        pauseOnHover: false,
        responsive: [
          {
            breakpoint: 1024,
            settings: {
              slidesToShow: 2,
            }
          },
          {
            breakpoint: 768,
            settings: {
              slidesToShow: 1,
            }
          }
        ]
    };

    // Check if all images are loaded
    useEffect(() => {
        if (loadedImages === images.length) {
            setLoading(false);
        }
    }, [loadedImages]);

    // Increment the loaded image count when each image is loaded
    const handleImageLoad = () => {
        setLoadedImages(prev => prev + 1);
    };

    return (
      <div className="carousel-container" style={{ position: 'relative' }}>
        {/* Overlay loading spinner */}
        {loading && <div className="loading-overlay"><LoadingSpinner /></div>}
        
        {/* Only render slider when loading is complete */}
        {!loading && (
          <Slider {...settings}>
            {images.map((src, index) => (
              <div key={index} className="carousel-slide">
                <img
                  src={src}
                  alt={`Slide ${index + 1}`}
                  className="carousel-image"
                  onLoad={handleImageLoad}  // Trigger image load handler
                  style={{ visibility: loading ? 'hidden' : 'visible' }}  // Hide image until fully loaded
                />
              </div>
            ))}
          </Slider>
        )}
      </div>
    );
}

export default ImageCarousel;
