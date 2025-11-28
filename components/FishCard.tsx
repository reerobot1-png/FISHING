import React from 'react';
import { Fish, FishRarity } from '../types';
import { PixelButton } from './PixelButton';

interface FishCardProps {
  fish: Fish;
  isNew?: boolean;
  onSell?: (fish: Fish) => void;
}

export const FishCard: React.FC<FishCardProps> = ({ fish, isNew, onSell }) => {
  const rarityConfig = {
    [FishRarity.COMMON]: { bg: 'bg-gray-200', border: 'border-gray-400', text: 'text-gray-800', badge: 'bg-gray-500' },
    [FishRarity.UNCOMMON]: { bg: 'bg-green-100', border: 'border-green-400', text: 'text-green-900', badge: 'bg-green-600' },
    [FishRarity.RARE]: { bg: 'bg-blue-100', border: 'border-blue-400', text: 'text-blue-900', badge: 'bg-blue-600' },
    [FishRarity.LEGENDARY]: { bg: 'bg-purple-100', border: 'border-purple-400', text: 'text-purple-900', badge: 'bg-purple-600' },
    [FishRarity.MYTHICAL]: { bg: 'bg-amber-100', border: 'border-amber-400', text: 'text-amber-900', badge: 'bg-amber-600' },
    [FishRarity.SECRET]: { bg: 'bg-pink-100', border: 'border-pink-400', text: 'text-pink-900', badge: 'bg-pink-600' },
  };

  const config = rarityConfig[fish.rarity] || rarityConfig[FishRarity.COMMON];

  return (
    <div className={`relative ${config.bg} border-4 ${config.border} p-1 shadow-[8px_8px_0_rgba(0,0,0,0.2)] group transition-transform hover:-translate-y-1 hover:shadow-[10px_10px_0_rgba(0,0,0,0.2)] h-full flex flex-col`}>
      {isNew && (
        <div className="absolute -top-3 -right-3 bg-yellow-400 text-black border-4 border-black px-2 py-0.5 text-xl font-bold animate-bounce z-10 shadow-[4px_4px_0_rgba(0,0,0,0.2)] font-vt323">
          NEW!
        </div>
      )}
      
      <div className="border-4 border-double border-black/10 p-2 h-full flex flex-col bg-white/40">
        {/* Header */}
        <div className="flex justify-between items-start mb-2 border-b-2 border-black/10 pb-1">
          <h3 className="text-2xl font-bold leading-none truncate pr-2 font-vt323 tracking-wide">{fish.name}</h3>
        </div>

        {/* Image Area */}
        <div className="relative aspect-video bg-[#2d3748] border-4 border-black/60 mb-2 shadow-inner flex items-center justify-center overflow-hidden group-hover:border-black transition-colors">
           {/* Background Grid */}
           <div className="absolute inset-0 opacity-20" 
                style={{ 
                  backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
                  backgroundSize: '20px 20px'
                }}>
           </div>
           
           {/* Generated Fish Icon */}
           <svg width="60%" height="60%" viewBox="0 0 20 12" className="drop-shadow-[4px_4px_0_rgba(0,0,0,0.5)] filter transition-transform duration-500 group-hover:scale-110 image-rendering-pixelated">
              <path 
                d="M4 6 L2 4 L2 8 L4 6 M5 3 L15 3 L18 6 L15 9 L5 9 L2 6 L5 3 Z" 
                fill={fish.color} 
                stroke="#1a1a1a" 
                strokeWidth="0.5"
                strokeLinejoin="round"
                shapeRendering="crispEdges"
              />
              <path d="M6 4 L14 4" stroke="white" strokeWidth="0.5" strokeOpacity="0.5" shapeRendering="crispEdges" />
              <rect x="13" y="4" width="1" height="1" fill="white" />
              <rect x="13.5" y="4.5" width="0.5" height="0.5" fill="black" />
           </svg>
           
           <div className={`absolute top-2 left-2 text-sm font-bold text-white px-2 py-0 shadow-sm ${config.badge} font-vt323 border border-white/20`}>
             {fish.rarity}
           </div>
        </div>
        
        {/* Stats */}
        <div className="flex justify-between items-end mb-2 font-vt323 text-xl border-b-2 border-black/10 pb-1">
           <span className="text-gray-700">{fish.weight.toFixed(1)} lbs</span>
           <span className="text-green-900 font-bold bg-green-400 px-2 border-2 border-green-700 shadow-sm">${fish.price}</span>
        </div>

        {/* Flavor Text */}
        <div className="bg-white/60 p-2 border-2 border-black/5 text-gray-900 text-lg leading-tight font-vt323 flex-grow italic mb-2">
          "{fish.description}"
        </div>

        {/* Sell Button */}
        {onSell && (
          <button 
            onClick={() => onSell(fish)}
            className="w-full bg-red-500 border-2 border-red-800 text-white font-vt323 text-xl py-1 hover:bg-red-400 active:translate-y-1 shadow-md"
          >
            SELL FOR ${fish.price}
          </button>
        )}
      </div>
    </div>
  );
};