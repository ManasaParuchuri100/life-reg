export type AttributeType = 'intellect' | 'strength' | 'creativity' | 'social' | 'wellness';

export type LocationId = 
  | 'knowledge_tower' 
  | 'mine_training' 
  | 'workshop' 
  | 'village' 
  | 'sanctuary' 
  | 'player_home';

export type ItemType = 'weapon' | 'headgear' | 'armor' | 'pet' | 'decoration' | 'badge';

export type ItemRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

export interface Quest {
  id: string;
  title: string;
  description: string;
  attribute: AttributeType;
  locationId: LocationId;
  xpReward: number;
  goldReward: number;
  attributeReward: number;
  isCompleted: boolean;
  completedAt?: number;
  isDaily: boolean;
  difficulty: 'easy' | 'medium' | 'hard' | 'legendary';
}

export interface PlayerStats {
  name: string;
  title: string;
  level: number;
  xp: number;
  xpToNextLevel: number;
  hp: number;
  maxHp: number;
  gold: number;
  streak: number;
  lastActiveDate: string;
  attributes: Record<AttributeType, number>;
  completedQuestsCount: number;
  equipped: {
    weapon: string;
    headgear: string;
    armor: string;
    pet: string;
  };
}

export interface InventoryItem {
  id: string;
  name: string;
  type: ItemType;
  description: string;
  icon: string;
  cost: number;
  isOwned: boolean;
  rarity: ItemRarity;
  attributeBonus?: {
    attribute: AttributeType;
    value: number;
  };
  pixelSprite: string; // Identifier for character render
}

export interface LocationMeta {
  id: LocationId;
  name: string;
  attribute: AttributeType | 'all';
  description: string;
  activities: string[];
  tagline: string;
  color: string;
  accentHex: string;
  bgHex: string;
}

export interface FloatingReward {
  id: string;
  x: number;
  y: number;
  text: string;
  type: 'xp' | 'gold' | 'attribute' | 'levelup';
  color: string;
}
