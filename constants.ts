import { FishRarity, Rod } from './types';

export const COLORS = {
  skyDay: '#639bff',
  skyNight: '#1a1c2c',
  waterDay: '#3b82f6',
  waterNight: '#1e3a8a',
  grass: '#4ade80',
  uiBg: '#f3f4f6',
  uiBorder: '#1f2937',
};

export const FALLBACK_FISH = {
  name: "Glitch Trout",
  rarity: FishRarity.COMMON,
  weight: 2.5,
  description: "A shimmering anomaly from the 16-bit ether.",
  color: "#a855f7",
  price: 200
};

export const AVAILABLE_RODS: Rod[] = [
  {
    id: 'rod_bamboo',
    name: 'Bamboo Stick',
    description: 'A basic stick. It wobbles a lot.',
    price: 0,
    color: '#d4a373',
    barWidth: 15,
    catchSpeed: 0.4,
    controlStability: 0.8
  },
  {
    id: 'rod_fiberglass',
    name: 'Fiberglass Rod',
    description: 'Standard issue. Decent control.',
    price: 1500,
    color: '#60a5fa',
    barWidth: 20,
    catchSpeed: 0.5,
    controlStability: 0.85
  },
  {
    id: 'rod_carbon',
    name: 'Carbon Pro',
    description: 'Lightweight and precise. Wider catch zone.',
    price: 7500,
    color: '#1f2937',
    barWidth: 25,
    catchSpeed: 0.65,
    controlStability: 0.92
  },
  {
    id: 'rod_golden',
    name: 'The Golden Rod',
    description: 'Legendary gear. Catches fish almost instantly.',
    price: 30000,
    color: '#f59e0b',
    barWidth: 35,
    catchSpeed: 0.85,
    controlStability: 0.96
  }
];