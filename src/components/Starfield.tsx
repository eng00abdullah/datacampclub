import React, { useMemo } from 'react';

const Starfield: React.FC = () => {
  const stars = useMemo(() => {
    return Array.from({ length: 300 }).map((_, i) => ({
      id: i,
      top: `${Math.random() * 100}%`,
      left: `${Math.random() * 100}%`,
      size: `${Math.random() * 2 + 0.5}px`,
      duration: `${Math.random() * 4 + 3}s`,
      opacity: Math.random() * 0.6 + 0.4,
      delay: `${Math.random() * 10}s`,
    }));
  }, []);

  const shootingStars = useMemo(() => {
    return Array.from({ length: 8 }).map((_, i) => ({
      id: i,
      top: `${Math.random() * 50}%`,
      left: `${Math.random() * 100}%`,
      duration: `${Math.random() * 5 + 10}s`,
      delay: `${Math.random() * 20}s`,
      angle: `${Math.random() * 45 + 135}deg`,
      distance: `${Math.random() * 400 + 400}px`,
    }));
  }, []);

  return (
    <div className="star-field">
      <div className="nebula" />
      {stars.map((star) => (
        <div
          key={star.id}
          className="star"
          style={{
            top: star.top,
            left: star.left,
            width: star.size,
            height: star.size,
            '--duration': star.duration,
            '--opacity': star.opacity,
            animationDelay: star.delay,
          } as any}
        />
      ))}
      {shootingStars.map((star) => (
        <div
          key={`shooting-${star.id}`}
          className="shooting-star"
          style={{
            top: star.top,
            left: star.left,
            '--duration': star.duration,
            '--angle': star.angle,
            '--distance': star.distance,
            animationDelay: star.delay,
          } as any}
        />
      ))}
    </div>
  );
};

export default Starfield;
