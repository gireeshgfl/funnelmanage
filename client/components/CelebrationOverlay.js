"use client";

import React, { useEffect, useRef, useState } from "react";
import dynamic from 'next/dynamic';
import Fireworks from "../public/Firework.json";
import Trophy from "../public/Trophy.json";


// Dynamically import the Lottie Player with SSR disabled
const Player = dynamic(() => import('@lottiefiles/react-lottie-player').then((mod) => mod.Player), {
  ssr: false, // Disable server-side rendering
});



const CelebrationOverlay = ({
  isOpen,
  lottieProps = {},
  duration = 5000,
  onComplete,
  className = ""
}) => {
  const [showFireworks, setShowFireworks] = useState(false);
  const [showText, setShowText] = useState(false);

  const [showTrophy, setShowTrophy] = useState(false);
  const timeoutRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      // Reset states
      setShowFireworks(false);
      setShowText(false);
      setShowTrophy(false);

      // Sequence
      const t1 = setTimeout(() => setShowFireworks(true), 0);
      const t2 = setTimeout(() => setShowText(true), 1000);
      const t3 = setTimeout(() => setShowTrophy(true), 2000);

      if (duration) {
        timeoutRef.current = setTimeout(() => {
          if (onComplete) onComplete();
        }, duration);
      }

      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
      };
    }
  }, [isOpen, duration, onComplete]);

  if (!isOpen) return null;

  return (
    <div className={`absolute inset-0 w-full h-full pointer-events-none z-[50] flex items-center justify-center ${className}`}>
      {/* Fireworks Layer - Background */}
      {showFireworks && (
        <div className="absolute inset-0 z-0">
          <Player
            autoplay
            loop={false}
            keepLastFrame={false}
            src={Fireworks}
            className="w-full h-full"
            speed={1.5}
            background="transparent"
            {...lottieProps}
          />
        </div>
      )}

      <div className="relative z-20 flex flex-col items-center justify-center w-full h-full">
        {/* Text Layer */}
        {showText && (
          <h1 className="text-4xl md:text-6xl font-bold text-yellow-500 mb-4 animate-bounce drop-shadow-lg text-center">
            You Won
          </h1>
        )}

        {/* Trophy Layer */}
        {showTrophy && (
          <div className="w-full max-w-[500px] aspect-square p-4">
            <Player
              autoplay
              loop={false}
              keepLastFrame={true}
              src={Trophy}
              className="w-full h-full"
              speed={1.5}
              background="transparent"
              {...lottieProps}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default CelebrationOverlay;