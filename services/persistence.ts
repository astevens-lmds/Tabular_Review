/**
 * IndexedDB persistence layer using the raw IDB API (no dependencies).
 * Stores project state so extraction results survive page refreshes.
 */

import { DocumentFile, Column, ExtractionResult } from "../types";

const DB_NAME = "tabular_review";
const DB_VERSION = 1;
const STORE_NAME = "project_state";
const STATE_KEY = "current";

export interface ProjectState {
  projectName: string;
  documents: DocumentFile[];
  columns: Column[];
  results: ExtractionResult;
  selectedModel: string;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveProjectState(state: ProjectState): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    store.put(state, STATE_KEY);
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  } catch (e) {
    console.warn("Failed to save project state:", e);
  }
}

export async function loadProjectState(): Promise<ProjectState | null> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const request = store.get(STATE_KEY);
    const result = await new Promise<ProjectState | null>((resolve, reject) => {
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
    db.close();
    return result;
  } catch (e) {
    console.warn("Failed to load project state:", e);
    return null;
  }
}

export async function clearProjectState(): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    store.delete(STATE_KEY);
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  } catch (e) {
    console.warn("Failed to clear project state:", e);
  }
}
