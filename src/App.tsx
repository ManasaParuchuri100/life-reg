import React, { useState, useEffect } from 'react';
import { 
  PlayerStats, 
  Quest, 
  InventoryItem, 
  LocationId, 
  AttributeType, 
  FloatingReward 
} from './types';
import { 
  loadSavedStats, 
  saveStats, 
  loadSavedQuests, 
  saveQuests, 
  loadSavedInventory, 
  saveInventory, 
  INITIAL_PLAYER_STATS 
} from './utils/storage';
import { sounds } from './utils/sound';
import { HUD } from './components/HUD';
import { WorldScene } from './components/WorldScene';
import { Navigation, NavTab } from './components/Navigation';
import { QuestsModal } from './components/QuestsModal';
import { CharacterModal } from './components/CharacterModal';
import { InventoryModal } from './components/InventoryModal';
import { ProgressModal } from './components/ProgressModal';
import { CreateQuestModal } from './components/CreateQuestModal';
import { LevelUpModal } from './components/LevelUpModal';
import { AudioSettingsModal } from './components/AudioSettingsModal';
import { SignInPage } from './components/SignInPage';
import { AuthProvider, useAuth } from './context/AuthContext';
import { 
  subscribeToUserStats, 
  subscribeToUserQuests, 
  subscribeToUserInventory,
  completeQuestInFirestore,
  addQuestToFirestore,
  buyItemInFirestore,
  equipItemInFirestore
} from './firebase';

function GameApp() {
  const { user, loading, signOut, userInitialData } = useAuth();

  // Main persistent state
  const [stats, setStats] = useState<PlayerStats>(() => userInitialData?.stats || loadSavedStats());
  const [quests, setQuests] = useState<Quest[]>(() => 
    userInitialData?.quests && userInitialData.quests.length > 0 ? userInitialData.quests : loadSavedQuests()
  );
  const [inventory, setInventory] = useState<InventoryItem[]>(() => 
    userInitialData?.inventory && userInitialData.inventory.length > 0 ? userInitialData.inventory : loadSavedInventory()
  );

  // Navigation & UI state
  const [currentTab, setCurrentTab] = useState<NavTab>('world');
  const [selectedLocation, setSelectedLocation] = useState<LocationId | null>(null);
  const [activeBuildingGlow, setActiveBuildingGlow] = useState<LocationId | null>(null);
  const [floatingRewards, setFloatingRewards] = useState<FloatingReward[]>([]);
  const [timeOfDay, setTimeOfDay] = useState<'day' | 'sunset' | 'night'>('day');
  const [isMuted, setIsMuted] = useState<boolean>(() => sounds.getMuted());

  // Modals state
  const [isNewQuestModalOpen, setIsNewQuestModalOpen] = useState(false);
  const [createQuestPreset, setCreateQuestPreset] = useState<{ locationId?: LocationId; attribute?: AttributeType }>({});
  const [isLevelUpModalOpen, setIsLevelUpModalOpen] = useState(false);
  const [isAudioSettingsOpen, setIsAudioSettingsOpen] = useState(false);

  // When initial data arrives from Auth initialization, populate state
  useEffect(() => {
    if (userInitialData) {
      if (userInitialData.stats) setStats(userInitialData.stats);
      if (userInitialData.quests && userInitialData.quests.length > 0) setQuests(userInitialData.quests);
      if (userInitialData.inventory && userInitialData.inventory.length > 0) setInventory(userInitialData.inventory);
    }
  }, [userInitialData]);

  // Real-time Firestore synchronization for authenticated user
  useEffect(() => {
    if (!user) return;

    const unsubStats = subscribeToUserStats(user.uid, (cloudStats) => {
      setStats(cloudStats);
      saveStats(cloudStats);
    });

    const unsubQuests = subscribeToUserQuests(user.uid, (cloudQuests) => {
      if (cloudQuests && cloudQuests.length > 0) {
        setQuests(cloudQuests);
        saveQuests(cloudQuests);
      }
    });

    const unsubInventory = subscribeToUserInventory(user.uid, (cloudInventory) => {
      if (cloudInventory && cloudInventory.length > 0) {
        setInventory(cloudInventory);
        saveInventory(cloudInventory);
      }
    });

    return () => {
      unsubStats();
      unsubQuests();
      unsubInventory();
    };
  }, [user]);

  // Audio mute handler
  const handleToggleSound = () => {
    const muted = sounds.toggleMute();
    setIsMuted(muted);
  };

  // Complete a quest and trigger RPG cascade rewards!
  const handleCompleteQuest = async (quest: Quest) => {
    sounds.playQuestComplete();
    setTimeout(() => sounds.playCoin(), 250);

    // 1. Mark quest as completed
    const updatedQuests = quests.map((q) =>
      q.id === quest.id ? { ...q, isCompleted: true, completedAt: Date.now() } : q
    );
    setQuests(updatedQuests);

    // 2. Calculate XP and check for Level Up
    let newXp = stats.xp + quest.xpReward;
    let newLevel = stats.level;
    let newXpToNextLevel = stats.xpToNextLevel;
    let didLevelUp = false;

    if (newXp >= stats.xpToNextLevel) {
      didLevelUp = true;
      newLevel += 1;
      newXp = newXp - stats.xpToNextLevel;
      newXpToNextLevel = Math.round(stats.xpToNextLevel * 1.45);
    }

    // Determine hero title based on level
    const titlesByLevel: Record<number, string> = {
      1: 'Novice Adventurer',
      2: 'Realm Wayfarer',
      3: 'Adept of Daily Discipline',
      4: 'Master Craftsman of Habits',
      5: 'Grand Sovereign of the Realm',
      6: 'Mythic Paragon of Mastery'
    };
    const title = titlesByLevel[newLevel] || `Grand Master Lvl ${newLevel}`;

    // 3. Update attributes & gold
    const newAttributes = {
      ...stats.attributes,
      [quest.attribute]: (stats.attributes[quest.attribute] || 0) + quest.attributeReward
    };

    const newStats: PlayerStats = {
      ...stats,
      level: newLevel,
      xp: newXp,
      xpToNextLevel: newXpToNextLevel,
      gold: stats.gold + quest.goldReward,
      title: title,
      hp: didLevelUp ? stats.maxHp : Math.min(stats.maxHp, stats.hp + 5),
      completedQuestsCount: stats.completedQuestsCount + 1,
      attributes: newAttributes
    };

    setStats(newStats);

    // Persist changes to Firestore
    if (user) {
      completeQuestInFirestore(user.uid, quest, newStats).catch((err) => {
        console.error('Failed to sync completed quest to Firebase:', err);
      });
    }

    // 4. Trigger visual building glow for the location
    setActiveBuildingGlow(quest.locationId);
    setTimeout(() => {
      setActiveBuildingGlow(null);
    }, 2800);

    // 5. Add floating rewards animations
    const rewardId = String(Date.now());
    const newRewards: FloatingReward[] = [
      {
        id: `${rewardId}-xp`,
        x: 48,
        y: 46,
        text: `⭐ +${quest.xpReward} XP`,
        type: 'xp',
        color: '#fbbf24'
      },
      {
        id: `${rewardId}-gold`,
        x: 52,
        y: 42,
        text: `🟡 +${quest.goldReward} GOLD`,
        type: 'gold',
        color: '#facc15'
      },
      {
        id: `${rewardId}-attr`,
        x: 50,
        y: 38,
        text: `✨ +${quest.attributeReward} ${quest.attribute.toUpperCase()}`,
        type: 'attribute',
        color: '#38bdf8'
      }
    ];

    setFloatingRewards((prev) => [...prev, ...newRewards]);
    setTimeout(() => {
      setFloatingRewards((prev) => prev.filter((r) => !r.id.startsWith(rewardId)));
    }, 2500);

    // 6. If leveled up, show level-up fanfare modal
    if (didLevelUp) {
      setTimeout(() => {
        setIsLevelUpModalOpen(true);
      }, 700);
    }
  };

  // Create a new user quest
  const handleCreateQuest = (newQuestData: Omit<Quest, 'id' | 'isCompleted'>) => {
    const newQuest: Quest = {
      ...newQuestData,
      id: `q_${Date.now()}`,
      isCompleted: false
    };
    setQuests((prev) => [newQuest, ...prev]);

    // Persist to Firebase
    if (user) {
      addQuestToFirestore(user.uid, newQuest).catch((err) => {
        console.error('Failed to sync new quest to Firebase:', err);
      });
    }
  };

  // Equip Item
  const handleEquipItem = (item: InventoryItem) => {
    const slotKey = item.type === 'weapon' ? 'weapon' 
      : item.type === 'headgear' ? 'headgear'
      : item.type === 'armor' ? 'armor'
      : item.type === 'pet' ? 'pet' : null;

    if (!slotKey) return;

    const newEquipped = {
      ...stats.equipped,
      [slotKey]: item.id
    };

    setStats((prev) => ({
      ...prev,
      equipped: newEquipped
    }));

    if (user) {
      equipItemInFirestore(user.uid, newEquipped).catch((err) => {
        console.error('Failed to sync equip item to Firebase:', err);
      });
    }
  };

  // Buy Item from Shop
  const handleBuyItem = (item: InventoryItem) => {
    if (stats.gold < item.cost) return;

    sounds.playCoin();
    const newGold = stats.gold - item.cost;

    // Deduct gold
    setStats((prev) => ({
      ...prev,
      gold: newGold
    }));

    // Mark as owned locally
    setInventory((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, isOwned: true } : i))
    );

    // Persist to Firebase
    if (user) {
      buyItemInFirestore(user.uid, item, newGold).catch((err) => {
        console.error('Failed to sync purchased item to Firebase:', err);
      });
    }
  };

  // Loading Screen
  if (loading) {
    return (
      <div className="min-h-screen w-full bg-[#0a0f1d] flex flex-col items-center justify-center text-amber-400 font-pixel">
        <div className="w-12 h-12 border-4 border-amber-400 border-t-transparent rounded-full animate-spin mb-4" />
        <div className="text-xl tracking-wider text-amber-300">ENTERING THE REALM...</div>
        <div className="text-xs text-slate-400 font-sans mt-2">Connecting to Firebase Cloud</div>
      </div>
    );
  }

  // If user is not signed in, show Sign In Page
  if (!user) {
    return <SignInPage />;
  }

  const activeQuestCount = quests.filter((q) => !q.isCompleted).length;

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-100 flex flex-col items-center justify-start p-2 sm:p-4 md:p-6 overflow-x-hidden font-sans">
      
      {/* Maximum Width Main Container */}
      <div className="w-full max-w-6xl flex flex-col items-center">
        
        {/* RPG Character HUD Header */}
        <HUD
          stats={stats}
          isMuted={isMuted}
          onToggleMute={handleToggleSound}
          onOpenInventory={() => setCurrentTab('inventory')}
          onOpenAudioSettings={() => setIsAudioSettingsOpen(true)}
          onOpenNewQuestModal={() => {
            setCreateQuestPreset({});
            setIsNewQuestModalOpen(true);
          }}
          onOpenCharacterSheet={() => setCurrentTab('character')}
          userEmail={user.email}
          onSignOut={signOut}
          isCloudSynced={true}
        />

        {/* The World is the Primary Stage - Always rendered and interactive */}
        <main className="w-full flex-1 relative">
          <WorldScene
            stats={stats}
            quests={quests}
            onSelectLocation={(locId) => {
              setSelectedLocation(locId);
              setCurrentTab('quests');
            }}
            activeBuildingGlow={activeBuildingGlow}
            floatingRewards={floatingRewards}
            timeOfDay={timeOfDay}
            setTimeOfDay={setTimeOfDay}
          />
        </main>

        {/* Floating Game Navigation Bar */}
        <Navigation
          currentTab={currentTab}
          onChangeTab={(tab) => {
            setCurrentTab(tab);
            if (tab === 'world') {
              setSelectedLocation(null);
            }
          }}
          activeQuestCount={activeQuestCount}
        />

        {/* Quests Board Modal (triggered via Nav or Location click) */}
        <QuestsModal
          isOpen={currentTab === 'quests' || selectedLocation !== null}
          onClose={() => {
            setCurrentTab('world');
            setSelectedLocation(null);
          }}
          quests={quests}
          selectedLocationId={selectedLocation}
          onSelectLocationFilter={(locId) => setSelectedLocation(locId)}
          onCompleteQuest={handleCompleteQuest}
          onOpenCreateQuest={(locId, attr) => {
            setCreateQuestPreset({ locationId: locId, attribute: attr });
            setIsNewQuestModalOpen(true);
          }}
        />

        {/* Character Chronicle Modal */}
        <CharacterModal
          isOpen={currentTab === 'character'}
          onClose={() => setCurrentTab('world')}
          stats={stats}
          inventory={inventory}
          onEquipItem={handleEquipItem}
        />

        {/* Inventory Treasure Chest Modal */}
        <InventoryModal
          isOpen={currentTab === 'inventory'}
          onClose={() => setCurrentTab('world')}
          stats={stats}
          inventory={inventory}
          onEquipItem={handleEquipItem}
          onBuyItem={handleBuyItem}
        />

        {/* Progress & Realm Harmony Modal */}
        <ProgressModal
          isOpen={currentTab === 'progress'}
          onClose={() => setCurrentTab('world')}
          stats={stats}
          onSelectLocation={(locId) => {
            setSelectedLocation(locId);
            setCurrentTab('quests');
          }}
        />

        {/* Create Quest Modal */}
        <CreateQuestModal
          isOpen={isNewQuestModalOpen}
          onClose={() => setIsNewQuestModalOpen(false)}
          defaultLocationId={createQuestPreset.locationId}
          defaultAttribute={createQuestPreset.attribute}
          onCreateQuest={handleCreateQuest}
        />

        {/* Level Up Celebration Modal */}
        <LevelUpModal
          isOpen={isLevelUpModalOpen}
          onClose={() => setIsLevelUpModalOpen(false)}
          stats={stats}
        />

        {/* Audio & Ambience Mixer Modal */}
        <AudioSettingsModal
          isOpen={isAudioSettingsOpen}
          onClose={() => setIsAudioSettingsOpen(false)}
          onVolumeChange={() => setIsMuted(sounds.getMuted())}
        />

      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <GameApp />
    </AuthProvider>
  );
}
