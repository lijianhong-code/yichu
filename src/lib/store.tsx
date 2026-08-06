'use client';

import React, { createContext, useContext, useReducer, useEffect, useCallback, type ReactNode } from 'react';
import { initialWardrobeItems, initialOutfits, type ClothingItem, type Outfit, type ClothingStatus, type ClothingCategory } from './mock-data';

// ============ Types ============

export interface WearingRecord {
  id: string;
  date: string;
  outfitId: string;
  outfit: Outfit;
  weather?: string;
  note?: string;
}

export interface UserProfile {
  name: string;
  city: string;
  avatar?: string;
  wardrobeDays: number;
  height?: number;
  weight?: number;
  topSize?: string;
  bottomSize?: string;
  shoeSize?: string;
}

interface WardrobeState {
  items: ClothingItem[];
  outfits: Outfit[];
  records: WearingRecord[];
  user: UserProfile;
  isLoaded: boolean;
}

type WardrobeAction =
  | { type: 'LOAD'; payload: Partial<WardrobeState> }
  | { type: 'ADD_ITEM'; payload: ClothingItem }
  | { type: 'UPDATE_ITEM'; payload: { id: string; updates: Partial<ClothingItem> } }
  | { type: 'DELETE_ITEM'; payload: string }
  | { type: 'BATCH_UPDATE_ITEMS'; payload: { ids: string[]; updates: Partial<ClothingItem> } }
  | { type: 'ADD_OUTFIT'; payload: Outfit }
  | { type: 'UPDATE_OUTFIT'; payload: { id: string; updates: Partial<Outfit> } }
  | { type: 'DELETE_OUTFIT'; payload: string }
  | { type: 'ADD_RECORD'; payload: WearingRecord }
  | { type: 'UPDATE_RECORD'; payload: { id: string; updates: Partial<WearingRecord> } }
  | { type: 'DELETE_RECORD'; payload: string }
  | { type: 'UPDATE_USER'; payload: Partial<UserProfile> };

// ============ Storage ============

const STORAGE_KEY = 'wardrobe-assistant-data';

function loadFromStorage(): Partial<WardrobeState> | null {
  if (typeof window === 'undefined') return null;
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

function saveToStorage(state: WardrobeState) {
  if (typeof window === 'undefined') return;
  try {
    const { isLoaded, ...data } = state;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Storage full or unavailable
  }
}

// ============ Reducer ============

function wardrobeReducer(state: WardrobeState, action: WardrobeAction): WardrobeState {
  switch (action.type) {
    case 'LOAD':
      return {
        ...state,
        items: action.payload.items ?? state.items,
        outfits: action.payload.outfits ?? state.outfits,
        records: action.payload.records ?? state.records,
        user: action.payload.user ?? state.user,
        isLoaded: true,
      };

    case 'ADD_ITEM':
      return { ...state, items: [action.payload, ...state.items] };

    case 'UPDATE_ITEM':
      return {
        ...state,
        items: state.items.map(item =>
          item.id === action.payload.id ? { ...item, ...action.payload.updates } : item
        ),
      };

    case 'DELETE_ITEM':
      return { ...state, items: state.items.filter(item => item.id !== action.payload) };

    case 'BATCH_UPDATE_ITEMS':
      return {
        ...state,
        items: state.items.map(item =>
          action.payload.ids.includes(item.id) ? { ...item, ...action.payload.updates } : item
        ),
      };

    case 'ADD_OUTFIT':
      return { ...state, outfits: [action.payload, ...state.outfits] };

    case 'UPDATE_OUTFIT':
      return {
        ...state,
        outfits: state.outfits.map(outfit =>
          outfit.id === action.payload.id ? { ...outfit, ...action.payload.updates } : outfit
        ),
      };

    case 'DELETE_OUTFIT':
      return { ...state, outfits: state.outfits.filter(o => o.id !== action.payload) };

    case 'ADD_RECORD':
      return { ...state, records: [action.payload, ...state.records] };

    case 'UPDATE_RECORD':
      return {
        ...state,
        records: state.records.map(r =>
          r.id === action.payload.id ? { ...r, ...action.payload.updates } : r
        ),
      };

    case 'DELETE_RECORD':
      return { ...state, records: state.records.filter(r => r.id !== action.payload) };

    case 'UPDATE_USER':
      return { ...state, user: { ...state.user, ...action.payload } };

    default:
      return state;
  }
}

// ============ Context ============

interface WardrobeContextValue {
  state: WardrobeState;
  dispatch: React.Dispatch<WardrobeAction>;
  // Convenience methods
  addItem: (item: ClothingItem) => void;
  updateItem: (id: string, updates: Partial<ClothingItem>) => void;
  deleteItem: (id: string) => void;
  batchUpdateItems: (ids: string[], updates: Partial<ClothingItem>) => void;
  addOutfit: (outfit: Outfit) => void;
  updateOutfit: (id: string, updates: Partial<Outfit>) => void;
  deleteOutfit: (id: string) => void;
  addRecord: (record: WearingRecord) => void;
  updateRecord: (id: string, updates: Partial<WearingRecord>) => void;
  deleteRecord: (id: string) => void;
  updateUser: (updates: Partial<UserProfile>) => void;
  // Computed values
  getItemById: (id: string) => ClothingItem | undefined;
  getOutfitById: (id: string) => Outfit | undefined;
  getRecordsByDate: (date: string) => WearingRecord[];
  getRecordsByOutfit: (outfitId: string) => WearingRecord[];
  getItemStats: (itemId: string) => { wearCount: number; lastWorn: string | null };
  getOutfitStats: (outfitId: string) => { wearCount: number; lastWorn: string | null };
  getStats: () => { totalItems: number; totalOutfits: number; utilizationRate: number; adoptionRate: number };
}

const WardrobeContext = createContext<WardrobeContextValue | null>(null);

// ============ Provider ============

const initialState: WardrobeState = {
  items: initialWardrobeItems,
  outfits: initialOutfits,
  records: [],
  user: {
    name: '小明',
    city: '上海',
    wardrobeDays: 128,
  },
  isLoaded: false,
};

export function WardrobeProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(wardrobeReducer, initialState);

  // Load from storage on mount
  useEffect(() => {
    const stored = loadFromStorage();
    if (stored) {
      dispatch({ type: 'LOAD', payload: stored });
    } else {
      dispatch({ type: 'LOAD', payload: {} });
    }
  }, []);

  // Save to storage on state change
  useEffect(() => {
    if (state.isLoaded) {
      saveToStorage(state);
    }
  }, [state]);

  // Convenience methods
  const addItem = useCallback((item: ClothingItem) => dispatch({ type: 'ADD_ITEM', payload: item }), []);
  const updateItem = useCallback((id: string, updates: Partial<ClothingItem>) =>
    dispatch({ type: 'UPDATE_ITEM', payload: { id, updates } }), []);
  const deleteItem = useCallback((id: string) => dispatch({ type: 'DELETE_ITEM', payload: id }), []);
  const batchUpdateItems = useCallback((ids: string[], updates: Partial<ClothingItem>) =>
    dispatch({ type: 'BATCH_UPDATE_ITEMS', payload: { ids, updates } }), []);
  const addOutfit = useCallback((outfit: Outfit) => dispatch({ type: 'ADD_OUTFIT', payload: outfit }), []);
  const updateOutfit = useCallback((id: string, updates: Partial<Outfit>) =>
    dispatch({ type: 'UPDATE_OUTFIT', payload: { id, updates } }), []);
  const deleteOutfit = useCallback((id: string) => dispatch({ type: 'DELETE_OUTFIT', payload: id }), []);
  const addRecord = useCallback((record: WearingRecord) => dispatch({ type: 'ADD_RECORD', payload: record }), []);
  const updateRecord = useCallback((id: string, updates: Partial<WearingRecord>) =>
    dispatch({ type: 'UPDATE_RECORD', payload: { id, updates } }), []);
  const deleteRecord = useCallback((id: string) => dispatch({ type: 'DELETE_RECORD', payload: id }), []);
  const updateUser = useCallback((updates: Partial<UserProfile>) =>
    dispatch({ type: 'UPDATE_USER', payload: updates }), []);

  // Computed values
  const getItemById = useCallback((id: string) => state.items.find(i => i.id === id), [state.items]);
  const getOutfitById = useCallback((id: string) => state.outfits.find(o => o.id === id), [state.outfits]);
  const getRecordsByDate = useCallback((date: string) =>
    state.records.filter(r => r.date === date), [state.records]);
  const getRecordsByOutfit = useCallback((outfitId: string) =>
    state.records.filter(r => r.outfitId === outfitId), [state.records]);

  const getItemStats = useCallback((itemId: string) => {
    const itemRecords = state.records.filter(r =>
      r.outfit.items.some(oi => oi.id === itemId)
    );
    return {
      wearCount: itemRecords.length,
      lastWorn: itemRecords.length > 0 ? itemRecords[0].date : null,
    };
  }, [state.records]);

  const getOutfitStats = useCallback((outfitId: string) => {
    const outfitRecords = state.records.filter(r => r.outfitId === outfitId);
    return {
      wearCount: outfitRecords.length,
      lastWorn: outfitRecords.length > 0 ? outfitRecords[0].date : null,
    };
  }, [state.records]);

  const getStats = useCallback(() => {
    const totalItems = state.items.length;
    const totalOutfits = state.outfits.length;
    const wornItems = new Set(state.records.flatMap(r => r.outfit.items.map(i => i.id))).size;
    const utilizationRate = totalItems > 0 ? Math.round((wornItems / totalItems) * 100) : 0;
    const adoptedOutfits = new Set(state.records.map(r => r.outfitId)).size;
    const adoptionRate = totalOutfits > 0 ? Math.round((adoptedOutfits / totalOutfits) * 100) : 0;
    return { totalItems, totalOutfits, utilizationRate, adoptionRate };
  }, [state.items, state.outfits, state.records]);

  const value: WardrobeContextValue = {
    state,
    dispatch,
    addItem,
    updateItem,
    deleteItem,
    batchUpdateItems,
    addOutfit,
    updateOutfit,
    deleteOutfit,
    addRecord,
    updateRecord,
    deleteRecord,
    updateUser,
    getItemById,
    getOutfitById,
    getRecordsByDate,
    getRecordsByOutfit,
    getItemStats,
    getOutfitStats,
    getStats,
  };

  return (
    <WardrobeContext.Provider value={value}>
      {children}
    </WardrobeContext.Provider>
  );
}

// ============ Hook ============

export function useWardrobe() {
  const context = useContext(WardrobeContext);
  if (!context) {
    throw new Error('useWardrobe must be used within a WardrobeProvider');
  }
  return context;
}
