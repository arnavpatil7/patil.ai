import { useEffect, useState } from 'react';

interface WaveformVisualizerProps {
  isActive: boolean;
  isProcessing: boolean;
}

export const WaveformVisualizer = ({ isActive, isProcessing }: WaveformVisualizerProps) => {
  const [bars, setBars] = useState<number[]>([]);

  useEffect(() => {
    // Generate random heights for waveform bars
    const generateBars = () => {
      const newBars = Array.from({ length: 12 }, () => 
        isActive ? Math.random() * 100 + 20 : 20
      );
      setBars(newBars);
    };

    if (isActive) {
      const interval = setInterval(generateBars, 150);
      return () => clearInterval(interval);
    } else {
      setBars(Array(12).fill(20));
    }
  }, [isActive]);

  return (
    <div className="flex items-center justify-center space-x-1 h-24">
      {bars.map((height, index) => (
        <div
          key={index}
          className={`waveform-bar w-2 rounded-full transition-all duration-150 ${
            isProcessing ? 'opacity-50' : 'opacity-100'
          }`}
          style={{
            height: `${height}%`,
            animationDelay: `${index * 0.1}s`,
            animationDuration: isActive ? '0.8s' : '1s'
          }}
        />
      ))}
    </div>
  );
};