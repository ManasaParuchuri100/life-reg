import { LocationMeta, LocationId, Quest, PlayerStats, InventoryItem } from '../types';

export const WORLD_LOCATIONS: Record<LocationId, LocationMeta> = {
  knowledge_tower: {
    id: 'knowledge_tower',
    name: 'Knowledge Tower',
    attribute: 'intellect',
    tagline: 'Build your intellect through action.',
    description: 'Expand your mind through coding, deep reading, learning new subjects, and research.',
    activities: ['Focus Study', 'Reading', 'Coding', 'Coursework', 'Language Learning'],
    color: 'from-blue-500 to-indigo-600',
    accentHex: '#3b82f6',
    bgHex: '#0c1a30'
  },
  mine_training: {
    id: 'mine_training',
    name: 'Training Grounds',
    attribute: 'strength',
    tagline: 'Forge strength through physical trials.',
    description: 'Hone physical resilience with workouts, runs, athletics, and pushing past limits.',
    activities: ['Heavy Lifting', 'Running', 'Strength Training', 'Stretching', 'Pushups'],
    color: 'from-red-500 to-amber-600',
    accentHex: '#ef4444',
    bgHex: '#300f0f'
  },
  workshop: {
    id: 'workshop',
    name: 'Creative Workshop',
    attribute: 'creativity',
    tagline: 'Channel your imagination into works of craft.',
    description: 'Channel your imagination into design, music, creative writing, art, and maker projects.',
    activities: ['Digital Art', 'Music Composition', 'Side Project', 'Writing', 'Design'],
    color: 'from-amber-500 to-orange-600',
    accentHex: '#f59e0b',
    bgHex: '#331904'
  },
  village: {
    id: 'village',
    name: 'Lantern Village',
    attribute: 'social',
    tagline: 'Connect with community and build bonds.',
    description: 'Connect with kindred spirits, call family, network with peers, and share kindness.',
    activities: ['Catch up with Friends', 'Family Call', 'Team Meetup', 'Community Service', 'Networking'],
    color: 'from-emerald-500 to-teal-600',
    accentHex: '#10b981',
    bgHex: '#06261f'
  },
  sanctuary: {
    id: 'sanctuary',
    name: 'Moonlit Garden',
    attribute: 'wellness',
    tagline: 'Restore vitality, mindfulness, and peace.',
    description: 'Restore body and soul with mindful breathing, 8 hours of restorative sleep, hydration, and peace.',
    activities: ['Mindful Meditation', '8h Sleep', 'Hydration Goal', 'Nature Walk', 'Digital Detox'],
    color: 'from-pink-500 to-rose-600',
    accentHex: '#ec4899',
    bgHex: '#2b0c1e'
  },
  player_home: {
    id: 'player_home',
    name: 'Player Home',
    attribute: 'all',
    tagline: 'Your Base · Level 3',
    description: 'The central hearth representing your overall life progression, achievements, and mastery.',
    activities: ['Daily Review', 'Journaling', 'Planning Tomorrow', 'Habit Audit'],
    color: 'from-amber-400 to-yellow-600',
    accentHex: '#f59e0b',
    bgHex: '#1a1807'
  }
};

export const INITIAL_PLAYER_STATS: PlayerStats = {
  name: 'Ari',
  title: 'Pathfinder',
  level: 7,
  xp: 420,
  xpToNextLevel: 600,
  hp: 82,
  maxHp: 100,
  gold: 128,
  streak: 6,
  lastActiveDate: new Date().toISOString().split('T')[0],
  attributes: {
    intellect: 16,
    strength: 12,
    creativity: 14,
    social: 9,
    wellness: 13
  },
  completedQuestsCount: 0,
  equipped: {
    weapon: 'wood_sword',
    headgear: 'wanderer_cap',
    armor: 'linen_tunic',
    pet: 'cat_companion'
  }
};

export const INITIAL_QUESTS: Quest[] = [
  // Knowledge Tower
  {
    id: 'q_intellect_1',
    title: 'Study for 2 hours',
    description: 'Focus quest · 120 min',
    attribute: 'intellect',
    locationId: 'knowledge_tower',
    xpReward: 80,
    goldReward: 20,
    attributeReward: 3,
    isCompleted: false,
    isDaily: true,
    difficulty: 'medium'
  },
  {
    id: 'q_intellect_2',
    title: 'Read 20 pages',
    description: 'Knowledge quest · 20 pages',
    attribute: 'intellect',
    locationId: 'knowledge_tower',
    xpReward: 35,
    goldReward: 8,
    attributeReward: 1,
    isCompleted: false,
    isDaily: true,
    difficulty: 'easy'
  },

  // Player Home
  {
    id: 'q_home_1',
    title: "Plan tomorrow's adventure",
    description: 'Base quest · 10 min',
    attribute: 'intellect',
    locationId: 'player_home',
    xpReward: 25,
    goldReward: 6,
    attributeReward: 1,
    isCompleted: false,
    isDaily: true,
    difficulty: 'easy'
  },

  // Training Grounds
  {
    id: 'q_strength_1',
    title: '30-min heavy lift',
    description: 'Workout quest · 30 min',
    attribute: 'strength',
    locationId: 'mine_training',
    xpReward: 75,
    goldReward: 15,
    attributeReward: 3,
    isCompleted: false,
    isDaily: true,
    difficulty: 'medium'
  },
  {
    id: 'q_strength_2',
    title: 'Run 5 kilometers',
    description: 'Cardio quest · 5 km',
    attribute: 'strength',
    locationId: 'mine_training',
    xpReward: 60,
    goldReward: 12,
    attributeReward: 2,
    isCompleted: false,
    isDaily: false,
    difficulty: 'medium'
  },

  // Creative Workshop
  {
    id: 'q_creativity_1',
    title: 'Work on passion project',
    description: 'Maker quest · 60 min',
    attribute: 'creativity',
    locationId: 'workshop',
    xpReward: 70,
    goldReward: 15,
    attributeReward: 3,
    isCompleted: false,
    isDaily: true,
    difficulty: 'medium'
  },
  {
    id: 'q_creativity_2',
    title: 'Write journal thoughts',
    description: 'Reflection quest · 15 min',
    attribute: 'creativity',
    locationId: 'workshop',
    xpReward: 30,
    goldReward: 6,
    attributeReward: 1,
    isCompleted: false,
    isDaily: true,
    difficulty: 'easy'
  },

  // Moonlit Garden
  {
    id: 'q_wellness_1',
    title: '15-min mindfulness meditation',
    description: 'Zen quest · 15 min',
    attribute: 'wellness',
    locationId: 'sanctuary',
    xpReward: 40,
    goldReward: 10,
    attributeReward: 2,
    isCompleted: false,
    isDaily: true,
    difficulty: 'easy'
  },
  {
    id: 'q_wellness_2',
    title: 'Hydrate 2 liters water',
    description: 'Health quest · Daily habit',
    attribute: 'wellness',
    locationId: 'sanctuary',
    xpReward: 25,
    goldReward: 5,
    attributeReward: 1,
    isCompleted: false,
    isDaily: true,
    difficulty: 'easy'
  },

  // Lantern Village
  {
    id: 'q_social_1',
    title: 'Catch up with old friend',
    description: 'Community quest · 20 min',
    attribute: 'social',
    locationId: 'village',
    xpReward: 50,
    goldReward: 12,
    attributeReward: 2,
    isCompleted: false,
    isDaily: false,
    difficulty: 'easy'
  },
  {
    id: 'q_social_2',
    title: 'Help someone in need',
    description: 'Kindness quest · Good deed',
    attribute: 'social',
    locationId: 'village',
    xpReward: 45,
    goldReward: 10,
    attributeReward: 2,
    isCompleted: false,
    isDaily: false,
    difficulty: 'easy'
  }
];

export const INITIAL_INVENTORY: InventoryItem[] = [
  // The 4 Unlocked Starter Items in Treasure Chest
  {
    id: 'item_wood',
    name: 'Raw Oak Wood',
    type: 'decoration',
    description: 'Freshly harvested timber from the whispering grove. Essential for homestead crafting.',
    icon: '🪵',
    cost: 15,
    isOwned: true,
    rarity: 'common',
    pixelSprite: 'wood_log'
  },
  {
    id: 'item_compass',
    name: "Pathfinder's Compass",
    type: 'weapon',
    description: 'A finely calibrated brass compass that always points toward growth and purpose.',
    icon: '🧭',
    cost: 45,
    isOwned: true,
    rarity: 'uncommon',
    attributeBonus: { attribute: 'intellect', value: 2 },
    pixelSprite: 'compass_gold'
  },
  {
    id: 'item_sprout',
    name: 'Sacred Seedling',
    type: 'decoration',
    description: 'A glowing sprout that flourishes with regular morning meditation and wellness habits.',
    icon: '🌱',
    cost: 30,
    isOwned: true,
    rarity: 'uncommon',
    attributeBonus: { attribute: 'wellness', value: 2 },
    pixelSprite: 'sprout_rare'
  },
  {
    id: 'item_brick',
    name: 'Terracotta Brick',
    type: 'decoration',
    description: 'Kiln-fired building block used to upgrade your Player Home to higher tiers.',
    icon: '🧱',
    cost: 25,
    isOwned: true,
    rarity: 'common',
    pixelSprite: 'brick_red'
  },
  // Locked Chest Slots (to unlock as you progress)
  {
    id: 'item_wand',
    name: 'Starlight Wand',
    type: 'weapon',
    description: 'Infused with crystallised insight from the Knowledge Spire.',
    icon: '🪄',
    cost: 150,
    isOwned: false,
    rarity: 'rare',
    attributeBonus: { attribute: 'intellect', value: 4 },
    pixelSprite: 'wand_starlight'
  },
  {
    id: 'item_cat',
    name: 'Midnight Familiar',
    type: 'pet',
    description: 'A loyal feline companion that rests by your home hearth and brings good fortune.',
    icon: '🐈‍⬛',
    cost: 200,
    isOwned: false,
    rarity: 'rare',
    pixelSprite: 'cat_black'
  },
  {
    id: 'item_herbs',
    name: 'Moonlit Herb Bundle',
    type: 'decoration',
    description: 'Fragrant lavender and chamomile harvested beneath the evening stars.',
    icon: '🌿',
    cost: 50,
    isOwned: false,
    rarity: 'common',
    attributeBonus: { attribute: 'wellness', value: 2 },
    pixelSprite: 'herb_bundle'
  },
  {
    id: 'item_lantern',
    name: 'Hearth Lantern',
    type: 'decoration',
    description: 'A brass lantern casting warm light along the village paths.',
    icon: '🏮',
    cost: 75,
    isOwned: false,
    rarity: 'uncommon',
    attributeBonus: { attribute: 'social', value: 2 },
    pixelSprite: 'lantern_brass'
  },
  {
    id: 'item_crystal',
    name: 'Mana Crystal',
    type: 'weapon',
    description: 'Gleaming stone mined from the training peaks.',
    icon: '💎',
    cost: 180,
    isOwned: false,
    rarity: 'epic',
    attributeBonus: { attribute: 'strength', value: 5 },
    pixelSprite: 'crystal_blue'
  },
  {
    id: 'item_scroll',
    name: 'Ancient Blueprint',
    type: 'decoration',
    description: 'Architectural designs for an expanded workshop studio.',
    icon: '📜',
    cost: 110,
    isOwned: false,
    rarity: 'rare',
    attributeBonus: { attribute: 'creativity', value: 3 },
    pixelSprite: 'scroll_blueprint'
  },
  {
    id: 'item_potion',
    name: 'Vitality Elixir',
    type: 'decoration',
    description: 'Brimming with pure spring water and restorative herbs.',
    icon: '🧪',
    cost: 60,
    isOwned: false,
    rarity: 'uncommon',
    attributeBonus: { attribute: 'wellness', value: 3 },
    pixelSprite: 'potion_flask'
  },
  {
    id: 'item_crown',
    name: 'Sovereign Laurels',
    type: 'headgear',
    description: 'Awarded to master adventurers who complete every real-world goal.',
    icon: '👑',
    cost: 300,
    isOwned: false,
    rarity: 'legendary',
    attributeBonus: { attribute: 'intellect', value: 6 },
    pixelSprite: 'crown_gold'
  }
];

const STORAGE_KEYS = {
  STATS: 'hearthbound_stats_v2',
  QUESTS: 'hearthbound_quests_v2',
  INVENTORY: 'hearthbound_inventory_v2',
};

export function loadSavedStats(): PlayerStats {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.STATS);
    if (raw) return JSON.parse(raw);
  } catch {}
  return INITIAL_PLAYER_STATS;
}

export function saveStats(stats: PlayerStats): void {
  try {
    localStorage.setItem(STORAGE_KEYS.STATS, JSON.stringify(stats));
  } catch {}
}

export function loadSavedQuests(): Quest[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.QUESTS);
    if (raw) return JSON.parse(raw);
  } catch {}
  return INITIAL_QUESTS;
}

export function saveQuests(quests: Quest[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.QUESTS, JSON.stringify(quests));
  } catch {}
}

export function loadSavedInventory(): InventoryItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.INVENTORY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return INITIAL_INVENTORY;
}

export function saveInventory(items: InventoryItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.INVENTORY, JSON.stringify(items));
  } catch {}
}

// Calculate Location Tier based on Attribute points
export function getLocationTier(attributeScore: number): { tier: number; name: string; badge: string } {
  if (attributeScore >= 45) {
    return { tier: 4, name: 'Sanctum of Mastery (Tier IV)', badge: '⭐ Master' };
  } else if (attributeScore >= 25) {
    return { tier: 3, name: 'Grand Citadel (Tier III)', badge: '🔷 Grand' };
  } else if (attributeScore >= 12) {
    return { tier: 2, name: 'Developed Outpost (Tier II)', badge: '🔹 Adept' };
  } else {
    return { tier: 1, name: 'Starter Settlement (Tier I)', badge: '▫️ Novice' };
  }
}
