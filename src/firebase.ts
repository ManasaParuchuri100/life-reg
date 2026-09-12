import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInAnonymously,
  signOut, 
  User, 
  onAuthStateChanged 
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  getDoc, 
  getDocs,
  getDocFromServer,
  setDoc, 
  updateDoc, 
  deleteDoc, 
  collection, 
  onSnapshot, 
  writeBatch,
  query,
  Unsubscribe
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import { PlayerStats, Quest, InventoryItem } from './types';
import { INITIAL_PLAYER_STATS, INITIAL_QUESTS, INITIAL_INVENTORY } from './utils/storage';

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const googleProvider = new GoogleAuthProvider();

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map((provider) => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Test initial connection probe per instructions
export async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client appears to be offline.');
    }
  }
}
testConnection();

// Sign in with Google Popup
export async function signInWithGoogle(): Promise<User> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error('Google Sign-In Error:', error);
    throw error;
  }
}

// Sign in with Email and Password
export async function signInWithEmail(email: string, password: string): Promise<User> {
  try {
    const result = await signInWithEmailAndPassword(auth, email.trim(), password);
    return result.user;
  } catch (error) {
    console.error('Email Sign-In Error:', error);
    throw error;
  }
}

// Create new account with Email and Password
export async function signUpWithEmail(email: string, password: string): Promise<User> {
  try {
    const result = await createUserWithEmailAndPassword(auth, email.trim(), password);
    return result.user;
  } catch (error) {
    console.error('Email Sign-Up Error:', error);
    throw error;
  }
}

// Sign in as Guest / Anonymous
export async function signInGuest(): Promise<User> {
  try {
    const result = await signInAnonymously(auth);
    return result.user;
  } catch (error) {
    console.error('Anonymous Sign-In Error:', error);
    throw error;
  }
}

// Sign out
export async function signOutUser(): Promise<void> {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Sign-Out Error:', error);
    throw error;
  }
}

// Check and seed initial data for new users
export async function initializeUserAccount(user: User): Promise<{
  stats: PlayerStats;
  quests: Quest[];
  inventory: InventoryItem[];
}> {
  const userDocRef = doc(db, 'users', user.uid);
  const path = `users/${user.uid}`;

  try {
    const snap = await getDoc(userDocRef);

    if (snap.exists()) {
      const data = snap.data();
      const stats: PlayerStats = {
        name: data.name || user.displayName || 'Hero',
        title: data.title || INITIAL_PLAYER_STATS.title,
        level: data.level ?? INITIAL_PLAYER_STATS.level,
        xp: data.xp ?? INITIAL_PLAYER_STATS.xp,
        xpToNextLevel: data.xpToNextLevel ?? INITIAL_PLAYER_STATS.xpToNextLevel,
        hp: data.hp ?? INITIAL_PLAYER_STATS.hp,
        maxHp: data.maxHp ?? INITIAL_PLAYER_STATS.maxHp,
        gold: data.gold ?? INITIAL_PLAYER_STATS.gold,
        streak: data.streak ?? INITIAL_PLAYER_STATS.streak,
        lastActiveDate: data.lastActiveDate || INITIAL_PLAYER_STATS.lastActiveDate,
        attributes: data.attributes || INITIAL_PLAYER_STATS.attributes,
        completedQuestsCount: data.completedQuestsCount ?? INITIAL_PLAYER_STATS.completedQuestsCount,
        equipped: data.equipped || INITIAL_PLAYER_STATS.equipped,
      };

      // Fetch saved quests
      const questsSnap = await getDocs(collection(db, 'users', user.uid, 'quests'));
      const quests: Quest[] = [];
      questsSnap.forEach((d) => {
        const qData = d.data();
        quests.push({
          id: qData.id || d.id,
          title: qData.title || '',
          description: qData.description || '',
          attribute: qData.attribute || 'intellect',
          locationId: qData.locationId || 'knowledge_tower',
          xpReward: qData.xpReward ?? 25,
          goldReward: qData.goldReward ?? 5,
          attributeReward: qData.attributeReward ?? 1,
          isCompleted: qData.isCompleted ?? false,
          completedAt: qData.completedAt,
          isDaily: qData.isDaily ?? false,
          difficulty: qData.difficulty ?? 'medium',
        });
      });

      // Fetch saved inventory
      const invSnap = await getDocs(collection(db, 'users', user.uid, 'inventory'));
      const inventory: InventoryItem[] = [];
      invSnap.forEach((d) => {
        const iData = d.data();
        inventory.push({
          id: iData.id || d.id,
          name: iData.name || '',
          type: iData.type || 'decoration',
          description: iData.description || '',
          icon: iData.icon || '📦',
          cost: iData.cost ?? 0,
          isOwned: iData.isOwned ?? false,
          rarity: iData.rarity || 'common',
          attributeBonus: iData.attributeBonus,
          pixelSprite: iData.pixelSprite,
        });
      });

      // If existing user document existed but subcollections were empty, seed default items
      if (quests.length === 0) {
        const batch = writeBatch(db);
        for (const q of INITIAL_QUESTS) {
          batch.set(doc(db, 'users', user.uid, 'quests', q.id), { ...q, userId: user.uid });
          quests.push(q);
        }
        await batch.commit();
      }

      if (inventory.length === 0) {
        const batch = writeBatch(db);
        for (const item of INITIAL_INVENTORY) {
          batch.set(doc(db, 'users', user.uid, 'inventory', item.id), { ...item, userId: user.uid });
          inventory.push(item);
        }
        await batch.commit();
      }

      return { stats, quests, inventory };
    }

    // New user: Seed initial player stats, starter quests, and starter inventory
    const starterStats: PlayerStats = {
      ...INITIAL_PLAYER_STATS,
      name: user.displayName || user.email?.split('@')[0] || 'Adventurer',
    };

    const batch = writeBatch(db);

    // 1. User stats document
    batch.set(userDocRef, {
      ...starterStats,
      userId: user.uid,
      email: user.email || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // 2. Initial quests
    for (const q of INITIAL_QUESTS) {
      const qRef = doc(db, 'users', user.uid, 'quests', q.id);
      batch.set(qRef, {
        ...q,
        userId: user.uid,
      });
    }

    // 3. Initial inventory items
    for (const item of INITIAL_INVENTORY) {
      const itemRef = doc(db, 'users', user.uid, 'inventory', item.id);
      batch.set(itemRef, {
        ...item,
        userId: user.uid,
      });
    }

    await batch.commit();

    return {
      stats: starterStats,
      quests: INITIAL_QUESTS,
      inventory: INITIAL_INVENTORY,
    };
  } catch (err) {
    return handleFirestoreError(err, OperationType.WRITE, path);
  }
}

// Real-time listener for user profile stats
export function subscribeToUserStats(
  userId: string,
  onUpdate: (stats: PlayerStats) => void
): Unsubscribe {
  const path = `users/${userId}`;
  const userRef = doc(db, 'users', userId);

  return onSnapshot(
    userRef,
    (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        const stats: PlayerStats = {
          name: data.name || 'Hero',
          title: data.title || INITIAL_PLAYER_STATS.title,
          level: data.level ?? INITIAL_PLAYER_STATS.level,
          xp: data.xp ?? INITIAL_PLAYER_STATS.xp,
          xpToNextLevel: data.xpToNextLevel ?? INITIAL_PLAYER_STATS.xpToNextLevel,
          hp: data.hp ?? INITIAL_PLAYER_STATS.hp,
          maxHp: data.maxHp ?? INITIAL_PLAYER_STATS.maxHp,
          gold: data.gold ?? INITIAL_PLAYER_STATS.gold,
          streak: data.streak ?? INITIAL_PLAYER_STATS.streak,
          lastActiveDate: data.lastActiveDate || INITIAL_PLAYER_STATS.lastActiveDate,
          attributes: data.attributes || INITIAL_PLAYER_STATS.attributes,
          completedQuestsCount: data.completedQuestsCount ?? 0,
          equipped: data.equipped || INITIAL_PLAYER_STATS.equipped,
        };
        onUpdate(stats);
      }
    },
    (err) => {
      handleFirestoreError(err, OperationType.GET, path);
    }
  );
}

// Real-time listener for user quests
export function subscribeToUserQuests(
  userId: string,
  onUpdate: (quests: Quest[]) => void
): Unsubscribe {
  const path = `users/${userId}/quests`;
  const questsCol = collection(db, 'users', userId, 'quests');

  return onSnapshot(
    questsCol,
    (snapshot) => {
      const questsList: Quest[] = [];
      snapshot.forEach((docSnap) => {
        const d = docSnap.data();
        questsList.push({
          id: d.id || docSnap.id,
          title: d.title,
          description: d.description,
          attribute: d.attribute,
          locationId: d.locationId,
          xpReward: d.xpReward,
          goldReward: d.goldReward,
          attributeReward: d.attributeReward,
          isCompleted: d.isCompleted ?? false,
          completedAt: d.completedAt,
          isDaily: d.isDaily ?? false,
          difficulty: d.difficulty ?? 'medium',
        });
      });
      onUpdate(questsList);
    },
    (err) => {
      handleFirestoreError(err, OperationType.LIST, path);
    }
  );
}

// Real-time listener for user inventory
export function subscribeToUserInventory(
  userId: string,
  onUpdate: (inventory: InventoryItem[]) => void
): Unsubscribe {
  const path = `users/${userId}/inventory`;
  const inventoryCol = collection(db, 'users', userId, 'inventory');

  return onSnapshot(
    inventoryCol,
    (snapshot) => {
      const itemsList: InventoryItem[] = [];
      snapshot.forEach((docSnap) => {
        const d = docSnap.data();
        itemsList.push({
          id: d.id || docSnap.id,
          name: d.name,
          type: d.type,
          description: d.description,
          icon: d.icon,
          cost: d.cost,
          isOwned: d.isOwned,
          rarity: d.rarity,
          attributeBonus: d.attributeBonus,
          pixelSprite: d.pixelSprite,
        });
      });
      // Sort items matching default order
      if (itemsList.length > 0) {
        onUpdate(itemsList);
      }
    },
    (err) => {
      handleFirestoreError(err, OperationType.LIST, path);
    }
  );
}

// Update stats in Firestore
export async function saveStatsToFirestore(userId: string, stats: PlayerStats): Promise<void> {
  const path = `users/${userId}`;
  try {
    await setDoc(doc(db, 'users', userId), {
      ...stats,
      userId,
      updatedAt: new Date().toISOString(),
    }, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}

// Save or add new Quest to Firestore
export async function addQuestToFirestore(userId: string, quest: Quest): Promise<void> {
  const path = `users/${userId}/quests/${quest.id}`;
  try {
    await setDoc(doc(db, 'users', userId, 'quests', quest.id), {
      ...quest,
      userId,
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, path);
  }
}

// Mark quest completed & update stats in an atomic batch
export async function completeQuestInFirestore(
  userId: string,
  quest: Quest,
  newStats: PlayerStats
): Promise<void> {
  const questPath = `users/${userId}/quests/${quest.id}`;
  try {
    const batch = writeBatch(db);
    
    // 1. Update Quest
    const questRef = doc(db, 'users', userId, 'quests', quest.id);
    batch.set(questRef, {
      ...quest,
      userId,
      isCompleted: true,
      completedAt: Date.now(),
    }, { merge: true });

    // 2. Update Stats
    const userRef = doc(db, 'users', userId);
    batch.set(userRef, {
      ...newStats,
      userId,
      updatedAt: new Date().toISOString(),
    }, { merge: true });

    await batch.commit();
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, questPath);
  }
}

// Buy item & update stats in an atomic batch
export async function buyItemInFirestore(
  userId: string,
  item: InventoryItem,
  newGold: number
): Promise<void> {
  const itemPath = `users/${userId}/inventory/${item.id}`;
  try {
    const batch = writeBatch(db);

    const itemRef = doc(db, 'users', userId, 'inventory', item.id);
    batch.set(itemRef, {
      ...item,
      userId,
      isOwned: true,
    }, { merge: true });

    const userRef = doc(db, 'users', userId);
    batch.set(userRef, {
      userId,
      gold: newGold,
      updatedAt: new Date().toISOString(),
    }, { merge: true });

    await batch.commit();
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, itemPath);
  }
}

// Equip item update in Firestore
export async function equipItemInFirestore(
  userId: string,
  equipped: PlayerStats['equipped']
): Promise<void> {
  const path = `users/${userId}`;
  try {
    await setDoc(doc(db, 'users', userId), {
      userId,
      equipped,
      updatedAt: new Date().toISOString(),
    }, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}
