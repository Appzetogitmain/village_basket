import React, { useEffect, useState } from 'react';
import Lottie from 'lottie-react';
import { useLoading } from '../../context/LoadingContext';
import { ALLOWED_ANIMATIONS, getAnimationData } from '../../utils/animationCache';

const ContentLoader: React.FC = () => {
  const { isRouteLoading } = useLoading();
  const [animationData, setAnimationData] = useState<any>(null);

  useEffect(() => {
    const index = Math.floor(Math.random() * ALLOWED_ANIMATIONS.length);
    const animationName = ALLOWED_ANIMATIONS[index];

    getAnimationData(animationName).then(data => {
      if (data) setAnimationData(data);
    });
  }, []);

  if (isRouteLoading) return null;

  return (
    <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-80 z-20">
      <div className="w-[200px] h-[200px] flex items-center justify-center">
        {animationData ? (
          <Lottie
            animationData={animationData}
            loop={true}
            className="w-full h-full"
          />
        ) : (
          <div className="w-12 h-12 border-4 border-teal-600 border-t-transparent rounded-full animate-spin" />
        )}
      </div>
    </div>
  );
};

export default ContentLoader;
