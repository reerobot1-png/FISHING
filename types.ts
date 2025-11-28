export enum GameState {
  IDLE = 'IDLE',
  CASTING = 'CASTING',
  WAITING = 'WAITING',
  BITING = 'BITING',
  REELING = 'REELING',
  CAUGHT = 'CAUGHT',
  ESCAPED = 'ESCAPED',
}

export enum FishRarity {
  COMMON = 'Common',
  UNCOMMON = 'Uncommon',
  RARE = 'Rare',
  LEGENDARY = 'Legendary',
  MYTHICAL = 'Mythical',
  SECRET = 'Secret'
}

export interface Fish {
  id: string;
  name: string;
  rarity: FishRarity;
  weight: number; // in lbs
  description: string;
  color: string; // hex for the fish body
  price: number;
  timestamp: number;
}

export interface GenerateFishResponse {
  name: string;
  rarity: string;
  weight: number;
  description: string;
  color: string;
  price: number;
}

export interface Rod {
  id: string;
  name: string;
  description: string;
  price: number;
  color: string;
  // Stats
  barWidth: number; // % of screen
  catchSpeed: number; // Multiplier for progress gain
  controlStability: number; // 0-1, higher is less drift/gravity
}