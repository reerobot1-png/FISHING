import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GameState, Fish, FishRarity, GenerateFishResponse, Rod } from '../types';
import { generateFishData } from '../services/geminiService';
import { FALLBACK_FISH, AVAILABLE_RODS } from '../constants';
import { FishCard } from './FishCard';
import { PixelButton } from './PixelButton';
import { ShoppingBag, X, Trophy, Store, Check, Lock, DollarSign } from 'lucide-react';

interface FishingGameProps {
  onCatch: (fish: Fish) => void;
  inventory: Fish[];
  balance: number;
  currentRod: Rod;
  ownedRodIds: string[];
  onBuyRod: (rod: Rod) => void;
  onEquipRod: (rodId: string) => void;
  onSellFish: (fish: Fish) => void;
  onSellAll: () => void;
}

// Base Physics Constants
const BASE_GRAVITY = 0.4;       
const BASE_LIFT = 0.6;          
const PROGRESS_LOSS = 0.15; 
const FISH_WIDTH_PERCENT = 10; 

export const FishingGame: React.FC<FishingGameProps> = ({ 
  onCatch, 
  inventory, 
  balance,
  currentRod,
  ownedRodIds,
  onBuyRod,
  onEquipRod,
  onSellFish,
  onSellAll
}) => {
  const [gameState, setGameState] = useState<GameState>(GameState.IDLE);
  const [generatedFish, setGeneratedFish] = useState<GenerateFishResponse | null>(null);
  const [currentFish, setCurrentFish] = useState<Fish | null>(null);
  const [showInventory, setShowInventory] = useState(false);
  const [showShop, setShowShop] = useState(false);
  const [showSellShop, setShowSellShop] = useState(false);
  const [feedback, setFeedback] = useState<string>("HOLD SPACE TO CAST");
  
  // State for UI toggles only (not high frequency)
  const [isOverlapping, setIsOverlapping] = useState(false);
  
  // High Performance Refs (Direct DOM manipulation)
  const minigameFishRef = useRef<HTMLDivElement>(null);
  const minigameBarRef = useRef<HTMLDivElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  
  // Logic Refs
  const isReelingRef = useRef(false);
  const requestRef = useRef<number>(0);
  const gameStateRef = useRef<GameState>(GameState.IDLE);
  const castIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const currentRodRef = useRef<Rod>(currentRod);

  // Keep rod ref updated without triggering re-renders in loop
  useEffect(() => {
    currentRodRef.current = currentRod;
  }, [currentRod]);

  // Physics State Refs (No Re-renders)
  const fishPosRef = useRef(50);
  const fishVelocityRef = useRef(0);
  const fishTargetRef = useRef(50);
  
  const barPosRef = useRef(50);
  const barVelocityRef = useRef(0);
  
  const progressRef = useRef(30);
  
  // Visual Refs
  const [linePath, setLinePath] = useState("");
  const [bobberPos, setBobberPos] = useState({ x: 25, y: 50 });
  const [rodRotation, setRodRotation] = useState(-15);
  const [cameraShake, setCameraShake] = useState(false);

  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (castIntervalRef.current) clearInterval(castIntervalRef.current);
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, []);

  const fetchFishData = useCallback(async () => {
    try {
      const data = await generateFishData();
      setGeneratedFish(data);
    } catch (e) {
      console.error(e);
    }
  }, []);

  // --- Actions Declarations (Hoisted for use in animate) ---
  const handleWin = useCallback(() => {
    if (gameStateRef.current === GameState.CAUGHT) return;
    
    // Immediate ref update to prevent double-firing in loop
    gameStateRef.current = GameState.CAUGHT;
    setGameState(GameState.CAUGHT);

    const caughtFish: Fish = generatedFish ? {
      ...generatedFish,
      rarity: generatedFish.rarity as FishRarity,
      id: Date.now().toString(),
      timestamp: Date.now()
    } : {
      ...FALLBACK_FISH,
      id: Date.now().toString(),
      timestamp: Date.now()
    };
    
    setCurrentFish(caughtFish);
    onCatch(caughtFish);
    setFeedback("CAUGHT!");
  }, [generatedFish, onCatch]);

  const handleLose = useCallback(() => {
    if (gameStateRef.current === GameState.ESCAPED) return;
    
    // Immediate ref update
    gameStateRef.current = GameState.ESCAPED;
    setGameState(GameState.ESCAPED);
    
    setFeedback("IT GOT AWAY...");
    setTimeout(() => resetGame(), 2000);
  }, []);

  const resetGame = () => {
    // Reset refs immediately for safety
    gameStateRef.current = GameState.IDLE;
    progressRef.current = 30;
    
    setGameState(GameState.IDLE);
    setFeedback("HOLD SPACE TO CAST");
    setBobberPos({ x: 32, y: 60 }); // Near rod
    setGeneratedFish(null);
    setCurrentFish(null);
    setRodRotation(-15);
  };

  const sellCurrentAndReset = () => {
    if (currentFish) {
      onSellFish(currentFish);
    }
    resetGame();
  }

  // --- Game Loop ---
  const animate = useCallback((time: number) => {
    if (gameStateRef.current === GameState.REELING) {
      // Use Rod Stats
      const rod = currentRodRef.current;
      const BAR_WIDTH = rod.barWidth;
      const GAIN = rod.catchSpeed;
      const STABILITY = rod.controlStability; // 0.8 to 0.96

      // --- UPDATE FISH (Target) ---
      // Move fish target randomly occasionally
      if (Math.random() < 0.03) {
        fishTargetRef.current = Math.random() * (100 - FISH_WIDTH_PERCENT) + (FISH_WIDTH_PERCENT / 2);
      }
      
      // Move fish towards target with smoothed physics
      const diff = fishTargetRef.current - fishPosRef.current;
      fishVelocityRef.current += diff * 0.005;
      fishVelocityRef.current += (Math.random() - 0.5) * 0.5; // Jitter
      fishVelocityRef.current *= 0.95; // Damping
      
      fishPosRef.current += fishVelocityRef.current;
      
      // Clamp Fish
      if (fishPosRef.current < FISH_WIDTH_PERCENT/2) {
         fishPosRef.current = FISH_WIDTH_PERCENT/2; 
         fishVelocityRef.current *= -0.5; 
      }
      if (fishPosRef.current > 100 - FISH_WIDTH_PERCENT/2) {
         fishPosRef.current = 100 - FISH_WIDTH_PERCENT/2;
         fishVelocityRef.current *= -0.5;
      }

      // --- UPDATE BAR (Player) with Glide ---
      if (isReelingRef.current) {
        barVelocityRef.current += BASE_LIFT;
      } else {
        barVelocityRef.current -= BASE_GRAVITY;
      }
      
      // Apply rod specific friction/drag for better control
      barVelocityRef.current *= STABILITY; 
      
      barPosRef.current += barVelocityRef.current;
      
      // Hard clamp for bar
      if (barPosRef.current < BAR_WIDTH/2) {
        barPosRef.current = BAR_WIDTH/2;
        barVelocityRef.current = 0; 
      }
      if (barPosRef.current > 100 - BAR_WIDTH/2) {
        barPosRef.current = 100 - BAR_WIDTH/2;
        barVelocityRef.current = 0;
      }

      // --- CHECK OVERLAP ---
      const barHalf = BAR_WIDTH / 2;
      const fishHalf = FISH_WIDTH_PERCENT / 2;
      
      const barLeft = barPosRef.current - barHalf;
      const barRight = barPosRef.current + barHalf;
      const fishLeft = fishPosRef.current - fishHalf;
      const fishRight = fishPosRef.current + fishHalf;
      
      const overlapping = (barLeft < fishRight && barRight > fishLeft);
      
      // Only trigger react state update if changed to avoid render thrashing
      setIsOverlapping(prev => {
        if (prev !== overlapping) return overlapping;
        return prev;
      });

      if (overlapping) {
        progressRef.current = Math.min(100, progressRef.current + GAIN);
      } else {
        progressRef.current = Math.max(0, progressRef.current - PROGRESS_LOSS);
      }
      
      // Camera shake based on low progress
      if (progressRef.current < 25 && !overlapping) {
        setCameraShake(true);
      } else {
        setCameraShake(false);
      }

      // --- DIRECT DOM UPDATES (Zero Lag) ---
      if (minigameFishRef.current) {
        minigameFishRef.current.style.bottom = `${fishPosRef.current}%`;
      }
      if (minigameBarRef.current) {
        minigameBarRef.current.style.bottom = `${barPosRef.current}%`;
        minigameBarRef.current.style.height = `${BAR_WIDTH}%`; // Dynamic height based on rod
      }
      if (progressBarRef.current) {
        progressBarRef.current.style.height = `${progressRef.current}%`;
      }

      // Win/Loss Condition
      if (progressRef.current >= 100) {
        handleWin();
      } else if (progressRef.current <= 0) {
        handleLose();
      }
    } 
    else if (gameStateRef.current === GameState.WAITING || gameStateRef.current === GameState.BITING) {
       // Floating bobber logic
       const timeSec = time / 1000;
       setBobberPos(prev => ({
         ...prev,
         y: 70 + Math.sin(timeSec * 2) * 2 // Gentle bob
       }));
    }

    // Update Fishing Line Visual
    updateLineVisual();

    requestRef.current = requestAnimationFrame(animate);
  }, [handleWin, handleLose]);

  const updateLineVisual = () => {
    // Rod Tip Coordinates
    const startX = 35; // %
    const startY = 32; // %
    const endX = bobberPos.x;
    const endY = bobberPos.y;

    const isTight = gameStateRef.current === GameState.REELING || gameStateRef.current === GameState.CASTING;
    const midX = (startX + endX) / 2;
    const midY = (startY + endY) / 2;
    const sag = isTight ? 0 : 20;

    const d = `M ${startX} ${startY} Q ${midX} ${midY + sag} ${endX} ${endY}`;
    setLinePath(d);
  };

  useEffect(() => {
    requestRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(requestRef.current);
  }, [animate]);

  // --- Actions ---

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.code === 'Space') {
      // Prevent scrolling
      if (gameStateRef.current !== GameState.IDLE && gameStateRef.current !== GameState.CAUGHT) {
        e.preventDefault();
      }

      if (gameStateRef.current === GameState.IDLE) {
        startCast();
      } else if (gameStateRef.current === GameState.BITING) {
        startReeling();
      } else if (gameStateRef.current === GameState.REELING) {
        isReelingRef.current = true;
        setRodRotation(-45); // Pull back
      }
    }
  };

  const handleKeyUp = (e: KeyboardEvent) => {
    if (e.code === 'Space') {
      if (gameStateRef.current === GameState.REELING) {
        isReelingRef.current = false;
        setRodRotation(-15); // Relax
      }
    }
  };

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const startCast = () => {
    if (gameStateRef.current !== GameState.IDLE) return;
    if (showInventory || showShop || showSellShop) return; // Prevent casting while menus are open
    
    setGameState(GameState.CASTING);
    setFeedback("CASTING...");
    fetchFishData(); // Pre-fetch

    let progress = 0;
    // Clear any existing interval
    if (castIntervalRef.current) clearInterval(castIntervalRef.current);

    castIntervalRef.current = setInterval(() => {
      progress += 0.04;
      
      // Parabolic arc for bobber
      const x = 32 + (50 * progress); 
      const y = 35 + (35 * progress) - (Math.sin(progress * Math.PI) * 40);
      
      setBobberPos({ x, y });

      if (progress >= 1) {
        if (castIntervalRef.current) clearInterval(castIntervalRef.current);
        setGameState(GameState.WAITING);
        setFeedback("WAIT FOR IT...");
        setBobberPos({ x: 82, y: 70 });
        
        // Random wait time
        setTimeout(() => {
          if (gameStateRef.current === GameState.WAITING) {
            setGameState(GameState.BITING);
            setFeedback("PRESS SPACE!");
          }
        }, 2000 + Math.random() * 3000);
      }
    }, 16);
  };

  const startReeling = () => {
    setGameState(GameState.REELING);
    setFeedback("KEEP THE BAR ON THE FISH!");
    // Init physics props
    progressRef.current = 30;
    barPosRef.current = 50;
    barVelocityRef.current = 0;
    fishPosRef.current = 50;
    fishVelocityRef.current = 0;
    setIsOverlapping(true);
  };

  const calculateTotalValue = () => inventory.reduce((acc, fish) => acc + fish.price, 0);

  // --- Renders ---

  return (
    <div className="relative w-full max-w-4xl aspect-video bg-[#87CEEB] overflow-hidden border-8 border-[#1f2937] shadow-[0_20px_50px_rgba(0,0,0,0.5)] select-none">
      
      {/* Background Elements */}
      <div className="absolute top-10 left-10 w-24 h-8 bg-white opacity-80" style={{ clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%, 10% 80%, 20% 100%, 30% 80%, 40% 100%, 50% 80%, 60% 100%, 70% 80%, 80% 100%, 90% 80%)' }}></div>
      <div className="absolute top-20 right-32 w-32 h-10 bg-white opacity-60" style={{ clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%, 10% 80%, 20% 100%, 30% 80%, 40% 100%, 50% 80%, 60% 100%, 70% 80%, 80% 100%, 90% 80%)' }}></div>
      <div className="absolute w-20 h-20 bg-yellow-300 top-5 right-10 hover:scale-110 transition-transform cursor-pointer"></div>

      {/* Mountains */}
      <div className="absolute bottom-[30%] left-0 w-full h-[40%] pointer-events-none">
         <div className="absolute bottom-0 left-[-10%] w-[50%] h-[80%] bg-[#4a5568] clip-step"></div>
         <div className="absolute bottom-0 right-[-5%] w-[60%] h-[60%] bg-[#2d3748] clip-step"></div>
      </div>
      
      {/* Water Area */}
      <div className="absolute bottom-0 w-full h-[35%] bg-[#3b82f6] border-t-4 border-[#60a5fa] animate-water" 
           style={{ backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.1) 10px, rgba(255,255,255,0.1) 20px)' }}>
      </div>

      {/* Pier */}
      <div className="absolute bottom-[25%] left-[-5%] w-[45%] h-[15%] bg-[#5d4037] border-t-4 border-[#3e2723] shadow-lg flex items-end justify-around px-10">
          <div className="w-4 h-full bg-[#3e2723] mx-2"></div>
          <div className="w-4 h-full bg-[#3e2723] mx-2"></div>
          <div className="w-4 h-full bg-[#3e2723] mx-2"></div>
      </div>

      {/* Character (8-bit Style) */}
      <div className="absolute bottom-[35%] left-[15%] w-16 h-24 transition-transform duration-200"
           style={{ transform: isReelingRef.current ? 'rotate(-5deg) translateY(2px)' : 'rotate(0deg)' }}>
          {/* Legs */}
          <div className="absolute bottom-0 left-2 w-4 h-8 bg-[#1e3a8a]"></div>
          <div className="absolute bottom-0 right-2 w-4 h-8 bg-[#1e3a8a]"></div>
          {/* Body */}
          <div className="absolute bottom-8 left-1 w-14 h-12 bg-[#dc2626]"></div>
          {/* Head */}
          <div className="absolute bottom-20 left-3 w-10 h-10 bg-[#fca5a5]"></div>
          {/* Hat */}
          <div className="absolute bottom-28 left-2 w-12 h-4 bg-[#1d4ed8]"></div>
          <div className="absolute bottom-28 left-12 w-4 h-4 bg-[#1d4ed8]"></div>
          {/* Arms (holding rod) */}
          <div className="absolute bottom-12 right-[-5px] w-8 h-4 bg-[#dc2626] origin-left" 
               style={{ transform: isReelingRef.current ? 'rotate(-20deg)' : 'rotate(0deg)' }}></div>
      </div>

      {/* Tackle Box */}
      <div className="absolute bottom-[36%] left-[25%] w-10 h-8 bg-green-800 border-2 border-green-950 flex items-center justify-center">
         <div className="w-8 h-1 bg-black/30"></div>
         <div className="absolute -top-2 left-3 w-4 h-2 border-t-2 border-l-2 border-r-2 border-gray-400"></div>
      </div>

      {/* Fishing Rod */}
      <div 
        className="absolute bottom-[38%] left-[19%] w-48 h-1 origin-left transition-transform duration-100 border border-black"
        style={{ transform: `rotate(${rodRotation}deg)`, backgroundColor: currentRod.color }}
      >
        {/* Rod Guides */}
        <div className="absolute right-0 -top-1 w-1 h-2 bg-gray-400"></div>
        <div className="absolute right-10 -top-1 w-1 h-2 bg-gray-400"></div>
        <div className="absolute right-24 -top-1 w-1 h-2 bg-gray-400"></div>
      </div>

      {/* Fishing Line */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible">
        <path d={linePath} stroke="white" strokeWidth="1.5" fill="none" className="drop-shadow-sm" />
      </svg>

      {/* Bobber */}
      {gameState !== GameState.CAUGHT && (
        <div 
          className="absolute w-4 h-4 bg-red-600 border-2 border-black transition-transform duration-75 shadow-md"
          style={{ 
            left: `${bobberPos.x}%`, 
            top: `${bobberPos.y}%`,
            transform: 'translate(-50%, -50%)'
          }}
        >
          <div className="absolute bottom-0 w-full h-1/2 bg-white border-t border-black"></div>
        </div>
      )}

      {/* Splash Effect */}
      {(gameState === GameState.BITING || gameState === GameState.REELING) && (
        <div className="absolute w-12 h-4 bg-blue-200 rounded-full opacity-50 animate-pulse"
             style={{ left: `${bobberPos.x}%`, top: `${bobberPos.y + 2}%`, transform: 'translate(-50%, 0)' }}
        ></div>
      )}

      {/* Feedback Text - Moved down to avoid blocking menu buttons */}
      <div className="absolute top-16 left-1/2 -translate-x-1/2 text-white font-vt323 text-3xl font-bold tracking-widest drop-shadow-[2px_2px_0_rgba(0,0,0,1)] z-20 whitespace-nowrap">
        {feedback}
      </div>

      {/* Minigame Overlay - Fisch Style */}
      {gameState === GameState.REELING && (
        <div className={`absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-30 transition-transform ${cameraShake ? 'translate-x-1 translate-y-1' : ''}`}>
          <div className="relative w-16 h-96 bg-[#1a1a1a] border-4 border-gray-500 shadow-2xl flex flex-col items-center py-2">
            
            {/* Progress Bar Side */}
            <div className="absolute -left-8 bottom-0 w-6 bg-gray-800 border-2 border-gray-600 h-full overflow-hidden flex flex-col justify-end">
              <div 
                ref={progressBarRef}
                className={`w-full transition-colors duration-100 ${isOverlapping ? 'bg-gradient-to-t from-green-600 to-green-400' : 'bg-gradient-to-t from-red-600 to-red-400'}`}
                style={{ height: '30%' }}
              ></div>
            </div>

            {/* Main Catch Area */}
            <div className="relative w-full h-full overflow-hidden bg-[#0d1117]">
               {/* Zone Background Grid */}
               <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'linear-gradient(#333 1px, transparent 1px)', backgroundSize: '10px 10px' }}></div>
               
               {/* Target Fish */}
               <div 
                 ref={minigameFishRef}
                 className="absolute left-1/2 -translate-x-1/2 text-2xl filter drop-shadow-[0_2px_0_rgba(0,0,0,0.5)]"
                 style={{ bottom: '50%', transform: 'translate(-50%, 50%)' }}
               >
                 🐠
               </div>

               {/* Player Bar */}
               <div 
                 ref={minigameBarRef}
                 className={`absolute left-0 w-full border-y-4 border-white/50 backdrop-blur-md transition-colors duration-75 flex items-center justify-center
                  ${isOverlapping ? 'bg-green-500/40 shadow-[inset_0_0_10px_rgba(34,197,94,0.5)]' : 'bg-red-500/40 shadow-[inset_0_0_10px_rgba(239,68,68,0.5)]'}`}
                 style={{ bottom: '50%', height: `${currentRod.barWidth}%`, transform: 'translate(0, 50%)' }}
               >
                 <div className="w-full h-[2px] bg-white/30"></div>
               </div>
            </div>

            {/* Icons */}
            <div className="absolute -top-10 text-white animate-bounce">
              {isOverlapping ? '🎣' : '⚠️'}
            </div>
          </div>
        </div>
      )}

      {/* Caught Fish Modal */}
      {currentFish && gameState === GameState.CAUGHT && (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-50 p-8 backdrop-blur-sm">
           <div className="relative w-full max-w-sm h-[80%] flex flex-col gap-4 animate-float">
             
             {/* X Close Button */}
             <button 
               onClick={resetGame}
               className="absolute -top-4 -right-4 z-50 bg-red-600 border-4 border-black text-white p-1 hover:bg-red-500 active:scale-95 transition-transform shadow-lg"
               aria-label="Close"
             >
               <X size={28} strokeWidth={3} />
             </button>

             <div className="text-center text-yellow-400 text-4xl font-vt323 font-bold drop-shadow-md mb-2 animate-pulse">
               EXCELLENT CATCH!
             </div>
             <FishCard fish={currentFish} isNew={true} />
             <div className="flex gap-2 mt-4">
               <PixelButton onClick={sellCurrentAndReset} className="flex-1" variant="danger">SELL (+${currentFish.price})</PixelButton>
               <PixelButton onClick={resetGame} className="flex-1" variant="success">KEEP</PixelButton>
             </div>
           </div>
        </div>
      )}

      {/* Controls: Shop, Market, Bag */}
      <div className="absolute top-4 right-4 z-40 flex gap-2">
         <PixelButton onClick={() => setShowShop(true)} variant="primary" className="flex items-center gap-2 text-sm py-1 px-3">
           <Store size={18} /> ROD SHOP
        </PixelButton>
        <PixelButton onClick={() => setShowSellShop(true)} variant="success" className="flex items-center gap-2 text-sm py-1 px-3">
           <DollarSign size={18} /> FISH MARKET
        </PixelButton>
        <PixelButton onClick={() => setShowInventory(true)} variant="secondary" className="flex items-center gap-2 text-sm py-1 px-3">
          <ShoppingBag size={18} /> BAG
        </PixelButton>
      </div>
      
      {/* Balance Display */}
      <div className="absolute top-4 left-4 z-40">
        <div className="bg-black/50 text-green-400 border-2 border-green-600 px-3 py-1 font-vt323 text-2xl flex items-center gap-2 shadow-lg">
          <span>$</span>
          <span>{balance}</span>
        </div>
      </div>

      {/* Inventory Modal */}
      {showInventory && (
        <div className="absolute inset-0 bg-black/90 z-50 flex flex-col p-6">
          <div className="flex justify-between items-center mb-6 border-b-4 border-gray-700 pb-2">
            <h2 className="text-3xl text-white font-vt323 flex items-center gap-2"><Trophy className="text-yellow-500"/> CATCH LOG</h2>
            <div className="flex gap-2">
              <button onClick={() => setShowInventory(false)} className="text-gray-400 hover:text-white"><X size={32} /></button>
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 overflow-y-auto pr-2 custom-scrollbar">
            {inventory.length === 0 ? (
              <div className="col-span-full text-center text-gray-500 py-20 font-vt323 text-2xl">
                NO FISH CAUGHT YET...
              </div>
            ) : (
              inventory.map((fish, idx) => (
                <div key={`${fish.id}-${idx}`} className="h-64 scale-90 origin-top">
                  <FishCard fish={fish} onSell={onSellFish} />
                </div>
              ))
            )}
          </div>
        </div>
      )}
      
      {/* Sell Shop Modal (Fish Market) */}
      {showSellShop && (
        <div className="absolute inset-0 bg-black/95 z-50 flex flex-col p-6">
          <div className="flex justify-between items-center mb-6 border-b-4 border-gray-700 pb-2">
            <h2 className="text-3xl text-white font-vt323 flex items-center gap-2"><DollarSign className="text-green-400"/> FISH MARKET</h2>
            <div className="flex gap-2">
              {inventory.length > 0 && (
                <PixelButton onClick={onSellAll} variant="danger" className="text-sm py-1 px-2">
                  SELL ALL (${calculateTotalValue()})
                </PixelButton>
              )}
              <button onClick={() => setShowSellShop(false)} className="text-gray-400 hover:text-white"><X size={32} /></button>
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 overflow-y-auto pr-2 custom-scrollbar">
            {inventory.length === 0 ? (
              <div className="col-span-full text-center text-gray-500 py-20 font-vt323 text-2xl">
                NO FISH TO SELL...
              </div>
            ) : (
              inventory.map((fish, idx) => (
                <div key={`${fish.id}-${idx}`} className="h-64 scale-90 origin-top">
                  <FishCard fish={fish} onSell={onSellFish} />
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Rod Shop Modal */}
      {showShop && (
        <div className="absolute inset-0 bg-black/95 z-50 flex flex-col p-6">
          <div className="flex justify-between items-center mb-6 border-b-4 border-gray-700 pb-2">
            <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
              <h2 className="text-3xl text-white font-vt323 flex items-center gap-2"><Store className="text-blue-400"/> FISHING SHOP</h2>
              {/* Show Balance In Shop Header */}
              <div className="flex items-center gap-1 text-green-400 text-2xl font-vt323 border-2 border-green-800 px-2 bg-black/50">
                 <span>$</span><span>{balance}</span>
              </div>
            </div>
            <button onClick={() => setShowShop(false)} className="text-gray-400 hover:text-white"><X size={32} /></button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 overflow-y-auto pr-2 custom-scrollbar pb-10">
            {AVAILABLE_RODS.map((rod) => {
              const isOwned = ownedRodIds.includes(rod.id);
              const isEquipped = currentRod.id === rod.id;
              const canAfford = balance >= rod.price;

              return (
                <div key={rod.id} className={`relative border-4 p-4 flex flex-col gap-2 ${isEquipped ? 'border-yellow-500 bg-yellow-900/20' : 'border-gray-700 bg-gray-900'}`}>
                  {/* Removed absolute "Equipped" badge to prevent text blocking */}
                  
                  <div className="flex justify-between items-start">
                     <h3 className="text-2xl text-white font-vt323 leading-none">{rod.name}</h3>
                     <div className="flex items-center gap-1 font-vt323 text-xl text-green-400 whitespace-nowrap ml-2">
                        {isOwned ? <span className="text-gray-400">OWNED</span> : `$${rod.price}`}
                     </div>
                  </div>
                  
                  <p className="text-gray-400 font-vt323 italic text-lg leading-tight">{rod.description}</p>
                  
                  {/* Stats Visual */}
                  <div className="space-y-1 mt-2 font-vt323 text-gray-300">
                    <div className="flex items-center justify-between text-sm">
                       <span>BAR SIZE</span>
                       <div className="w-24 h-2 bg-gray-700">
                          <div className="h-full bg-blue-500" style={{ width: `${(rod.barWidth / 35) * 100}%`}}></div>
                       </div>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                       <span>SPEED</span>
                       <div className="w-24 h-2 bg-gray-700">
                          <div className="h-full bg-green-500" style={{ width: `${(rod.catchSpeed / 0.85) * 100}%`}}></div>
                       </div>
                    </div>
                  </div>

                  <div className="mt-auto pt-4">
                    {isEquipped ? (
                       <PixelButton className="w-full opacity-50 cursor-default" variant="secondary">EQUIPPED</PixelButton>
                    ) : isOwned ? (
                       <PixelButton onClick={() => onEquipRod(rod.id)} className="w-full" variant="primary">EQUIP</PixelButton>
                    ) : (
                       <PixelButton 
                         onClick={() => onBuyRod(rod)} 
                         className={`w-full ${!canAfford ? 'opacity-50 cursor-not-allowed' : ''}`} 
                         variant="success"
                         disabled={!canAfford}
                       >
                         {canAfford ? 'BUY' : 'NEED CASH'}
                       </PixelButton>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};