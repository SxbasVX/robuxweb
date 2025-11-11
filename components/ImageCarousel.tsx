'use client';
import { useState, useEffect } from 'react';

interface ImageCarouselProps {
  images: string[];
  autoPlayInterval?: number;
  alt?: string;
}

export default function ImageCarousel({ 
  images, 
  autoPlayInterval = 5000,
  alt = "Carousel image"
}: ImageCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Auto-play functionality
  useEffect(() => {
    if (!isAutoPlaying || isPaused || images.length <= 1) return;
    
    const interval = setInterval(() => {
      handleTransition((prev) => (prev + 1) % images.length);
    }, autoPlayInterval);

    return () => clearInterval(interval);
  }, [isAutoPlaying, isPaused, images.length, autoPlayInterval]);

  const handleTransition = (getNextIndex: (prev: number) => number) => {
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentIndex(getNextIndex);
      setIsTransitioning(false);
    }, 300);
  };

  const goToPrevious = () => {
    handleTransition((prev) => (prev - 1 + images.length) % images.length);
  };

  const goToNext = () => {
    handleTransition((prev) => (prev + 1) % images.length);
  };

  const goToSlide = (index: number) => {
    if (index !== currentIndex) {
      handleTransition(() => index);
    }
  };

  const toggleAutoPlay = () => {
    setIsPaused(!isPaused);
  };

  if (images.length === 0) {
    return <div className="w-full h-full bg-gray-800 flex items-center justify-center">
      <p className="text-gray-400">No hay imágenes disponibles</p>
    </div>;
  }

  return (
    <div 
      className="relative w-full h-full group"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Main Image */}
      <div className="relative w-full h-full overflow-hidden">
        <img 
          src={images[currentIndex]} 
          alt={`${alt} ${currentIndex + 1}`}
          className={`w-full h-full object-cover transition-all duration-700 ease-in-out ${
            isTransitioning ? 'opacity-0 scale-105' : 'opacity-100 scale-100'
          }`}
          style={{minHeight: '300px', maxHeight: '500px', objectPosition: 'center'}}
        />
      </div>

      {/* Play/Pause Button */}
      {images.length > 1 && (
        <button
          onClick={toggleAutoPlay}
          className="absolute top-2 md:top-4 right-2 md:right-4 bg-black/50 hover:bg-black/75 text-white p-2 rounded-full transition-all opacity-0 group-hover:opacity-100"
          aria-label={isPaused ? "Reanudar auto-play" : "Pausar auto-play"}
          title={isPaused ? "Reanudar" : "Pausar"}
        >
          {isPaused ? (
            <svg className="w-4 h-4 md:w-5 md:h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          ) : (
            <svg className="w-4 h-4 md:w-5 md:h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
            </svg>
          )}
        </button>
      )}

      {/* Navigation Arrows */}
      {images.length > 1 && (
        <>
          <button
            onClick={goToPrevious}
            className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/75 text-white p-2 md:p-3 rounded-full transition-all opacity-100 md:opacity-0 md:group-hover:opacity-100"
            aria-label="Imagen anterior"
          >
            <svg className="w-4 h-4 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={goToNext}
            className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/75 text-white p-2 md:p-3 rounded-full transition-all opacity-100 md:opacity-0 md:group-hover:opacity-100"
            aria-label="Imagen siguiente"
          >
            <svg className="w-4 h-4 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </>
      )}

      {/* Dots Indicator */}
      {images.length > 1 && (
        <div className="absolute bottom-3 md:bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 md:gap-2">
          {images.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-2 h-2 md:w-3 md:h-3 rounded-full transition-all ${
                index === currentIndex 
                  ? 'bg-white scale-125' 
                  : 'bg-white/50 hover:bg-white/75'
              }`}
              aria-label={`Ir a imagen ${index + 1}`}
            />
          ))}
        </div>
      )}

      {/* Image Counter */}
      {images.length > 1 && (
        <div className="absolute top-3 md:top-4 left-3 md:left-4 bg-black/50 text-white px-2 py-1 md:px-3 md:py-1 rounded-full text-xs md:text-sm">
          {currentIndex + 1} / {images.length}
        </div>
      )}
    </div>
  );
}
