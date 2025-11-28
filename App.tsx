import React, { useState, useEffect } from 'react';
import { FishingGame } from './components/FishingGame';
import { Fish, Rod } from './types';
import { AVAILABLE_RODS } from './constants';

function App() {
  const [inventory, setInventory] = useState<Fish[]>([]);
  const [balance, setBalance] = useState(0);
  
  // Rod State
  const [ownedRodIds, setOwnedRodIds] = useState<string[]>(['rod_bamboo']);
  const [equippedRodId, setEquippedRodId] = useState<string>('rod_bamboo');

  // Load from local storage on mount
  useEffect(() => {
    const savedInv = localStorage.getItem('fishInventory');
    const savedBal = localStorage.getItem('fishBalance');
    const savedRods = localStorage.getItem('fishOwnedRods');
    const savedEquipped = localStorage.getItem('fishEquippedRod');

    if (savedInv) setInventory(JSON.parse(savedInv));
    if (savedBal) setBalance(JSON.parse(savedBal));
    if (savedRods) setOwnedRodIds(JSON.parse(savedRods));
    if (savedEquipped) setEquippedRodId(JSON.parse(savedEquipped));
  }, []);

  // Save to local storage on change
  useEffect(() => {
    localStorage.setItem('fishInventory', JSON.stringify(inventory));
    localStorage.setItem('fishBalance', JSON.stringify(balance));
    localStorage.setItem('fishOwnedRods', JSON.stringify(ownedRodIds));
    localStorage.setItem('fishEquippedRod', JSON.stringify(equippedRodId));
  }, [inventory, balance, ownedRodIds, equippedRodId]);

  const handleCatch = (fish: Fish) => {
    setInventory(prev => [fish, ...prev]);
    // setBalance(prev => prev + fish.price); // Removed: Balance only increases when sold now? Or keep as is? 
    // Usually fishing games give you the fish, you have to sell it. 
    // But previous logic added balance immediately. 
    // To support "Selling", I should NOT add balance immediately upon catch unless auto-sold.
    // However, to avoid breaking user expectation from previous version, I'll assume 
    // the user now WANTS to manually sell. 
    // So I will NOT add balance here. The fish goes to inventory.
  };

  const handleSellFish = (fishToSell: Fish) => {
    setInventory(prev => prev.filter(f => f.id !== fishToSell.id));
    setBalance(prev => prev + fishToSell.price);
  };

  const handleSellAll = () => {
    const totalValue = inventory.reduce((sum, fish) => sum + fish.price, 0);
    setInventory([]);
    setBalance(prev => prev + totalValue);
  };

  const handleBuyRod = (rod: Rod) => {
    if (balance >= rod.price && !ownedRodIds.includes(rod.id)) {
      setBalance(prev => prev - rod.price);
      setOwnedRodIds(prev => [...prev, rod.id]);
    }
  };

  const handleEquipRod = (rodId: string) => {
    if (ownedRodIds.includes(rodId)) {
      setEquippedRodId(rodId);
    }
  };

  const currentRod = AVAILABLE_RODS.find(r => r.id === equippedRodId) || AVAILABLE_RODS[0];

  return (
    <div className="min-h-screen bg-[#111] text-gray-100 font-sans selection:bg-pink-500 selection:text-white flex flex-col relative overflow-hidden">
      {/* CRT Scanline Overlay */}
      <div className="fixed inset-0 scanlines pointer-events-none z-50 opacity-10"></div>
      
      {/* Vignette */}
      <div className="fixed inset-0 pointer-events-none z-40 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.4)_100%)]"></div>

      {/* Main Content */}
      <main className="container mx-auto mt-6 md:mt-8 px-4 flex-grow flex flex-col items-center justify-start pb-8">
        <FishingGame 
          onCatch={handleCatch} 
          inventory={inventory}
          balance={balance}
          currentRod={currentRod}
          ownedRodIds={ownedRodIds}
          onBuyRod={handleBuyRod}
          onEquipRod={handleEquipRod}
          onSellFish={handleSellFish}
          onSellAll={handleSellAll}
        />
      </main>

      <footer className="p-4 text-center text-gray-600 mt-auto border-t-4 border-gray-900 bg-[#0a0a0a] text-sm font-vt323 text-lg">
        <p className="opacity-60">Powered by Gemini AI • React • Tailwind</p>
      </footer>
    </div>
  );
}

export default App;