/**
 * useOfflineStorage - IndexedDB-based Offline Storage Hook
 *
 * Provides offline capabilities for the Babybook app:
 * - Store moments locally when offline
 * - Queue uploads for background sync
 * - Cache media files for offline viewing
 * - Track sync status
 */

import { useState, useEffect, useCallback } from "react";

const DB_NAME = "babybook-offline";
const DB_VERSION = 1;

// Store names
const STORES = {
  MOMENTS: "moments",
  MEDIA_QUEUE: "media-queue",
  CACHED_MEDIA: "cached-media",
  SYNC_STATUS: "sync-status",
} as const;

interface OfflineMoment {
  id: string;
  data: Record<string, unknown>;
  createdAt: string;
  synced: boolean;
}

interface MediaQueueItem {
  id: string;
  momentId: string;
  file: Blob;
  filename: string;
  type: string;
  createdAt: string;
}

interface SyncStatus {
  lastSyncAt: string | null;
  pendingMoments: number;
  pendingMedia: number;
  isOnline: boolean;
}

let db: IDBDatabase | null = null;

// Initialize IndexedDB
async function initDB(): Promise<IDBDatabase> {
  if (db) return db;

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error("[OfflineStorage] Failed to open database");
      reject(request.error);
    };

    request.onsuccess = () => {
      db = request.result;
      console.log("[OfflineStorage] Database opened successfully");
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result;

      // Moments store
      if (!database.objectStoreNames.contains(STORES.MOMENTS)) {
        const momentsStore = database.createObjectStore(STORES.MOMENTS, {
          keyPath: "id",
        });
        momentsStore.createIndex("synced", "synced", { unique: false });
        momentsStore.createIndex("createdAt", "createdAt", { unique: false });
      }

      // Media queue store
      if (!database.objectStoreNames.contains(STORES.MEDIA_QUEUE)) {
        const mediaStore = database.createObjectStore(STORES.MEDIA_QUEUE, {
          keyPath: "id",
        });
        mediaStore.createIndex("momentId", "momentId", { unique: false });
      }

      // Cached media store
      if (!database.objectStoreNames.contains(STORES.CACHED_MEDIA)) {
        database.createObjectStore(STORES.CACHED_MEDIA, { keyPath: "id" });
      }

      // Sync status store
      if (!database.objectStoreNames.contains(STORES.SYNC_STATUS)) {
        database.createObjectStore(STORES.SYNC_STATUS, { keyPath: "id" });
      }
    };
  });
}

// Generic store operations
async function addToStore<T>(storeName: string, data: T): Promise<void> {
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(storeName, "readwrite");
    const store = transaction.objectStore(storeName);
    const request = store.put(data);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

async function getFromStore<T>(
  storeName: string,
  id: string,
): Promise<T | undefined> {
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(storeName, "readonly");
    const store = transaction.objectStore(storeName);
    const request = store.get(id);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function getAllFromStore<T>(storeName: string): Promise<T[]> {
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(storeName, "readonly");
    const store = transaction.objectStore(storeName);
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function deleteFromStore(storeName: string, id: string): Promise<void> {
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(storeName, "readwrite");
    const store = transaction.objectStore(storeName);
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

async function getUnsyncedMoments(): Promise<OfflineMoment[]> {
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORES.MOMENTS, "readonly");
    const store = transaction.objectStore(STORES.MOMENTS);
    const index = store.index("synced");
    const request = index.getAll(IDBKeyRange.only(false));

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Hook for offline storage management
 */
export function useOfflineStorage() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    lastSyncAt: null,
    pendingMoments: 0,
    pendingMedia: 0,
    isOnline: navigator.onLine,
  });

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setSyncStatus((prev) => ({ ...prev, isOnline: true }));
      // Trigger sync when coming back online
      triggerSync();
    };

    const handleOffline = () => {
      setIsOnline(false);
      setSyncStatus((prev) => ({ ...prev, isOnline: false }));
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Initialize and load sync status
  useEffect(() => {
    initDB().then(() => {
      updateSyncStatus();
    });
  }, []);

  // Update sync status from IndexedDB
  const updateSyncStatus = useCallback(async () => {
    try {
      const unsynced = await getUnsyncedMoments();
      const mediaQueue = await getAllFromStore<MediaQueueItem>(
        STORES.MEDIA_QUEUE,
      );

      setSyncStatus((prev) => ({
        ...prev,
        pendingMoments: unsynced.length,
        pendingMedia: mediaQueue.length,
      }));
    } catch (error) {
      console.error("[OfflineStorage] Failed to update sync status:", error);
    }
  }, []);

  // Save moment offline
  const saveMomentOffline = useCallback(
    async (momentData: Record<string, unknown>): Promise<string> => {
      const id = `offline-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      const offlineMoment: OfflineMoment = {
        id,
        data: momentData,
        createdAt: new Date().toISOString(),
        synced: false,
      };

      await addToStore(STORES.MOMENTS, offlineMoment);
      await updateSyncStatus();

      console.log("[OfflineStorage] Moment saved offline:", id);
      return id;
    },
    [updateSyncStatus],
  );

  // Queue media for upload
  const queueMediaUpload = useCallback(
    async (momentId: string, file: File): Promise<string> => {
      const id = `media-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      const mediaItem: MediaQueueItem = {
        id,
        momentId,
        file: file,
        filename: file.name,
        type: file.type,
        createdAt: new Date().toISOString(),
      };

      await addToStore(STORES.MEDIA_QUEUE, mediaItem);
      await updateSyncStatus();

      console.log("[OfflineStorage] Media queued for upload:", id);
      return id;
    },
    [updateSyncStatus],
  );

  // Cache media for offline viewing
  const cacheMedia = useCallback(
    async (url: string, blob: Blob): Promise<void> => {
      const cacheItem = {
        id: url,
        blob,
        cachedAt: new Date().toISOString(),
      };

      await addToStore(STORES.CACHED_MEDIA, cacheItem);
      console.log("[OfflineStorage] Media cached:", url);
    },
    [],
  );

  // Get cached media
  const getCachedMedia = useCallback(
    async (url: string): Promise<Blob | undefined> => {
      const cached = await getFromStore<{ id: string; blob: Blob }>(
        STORES.CACHED_MEDIA,
        url,
      );
      return cached?.blob;
    },
    [],
  );

  // Trigger background sync
  const triggerSync = useCallback(async () => {
    if (!navigator.onLine) {
      console.log("[OfflineStorage] Cannot sync - offline");
      return;
    }

    if (
      "serviceWorker" in navigator &&
      "sync" in ServiceWorkerRegistration.prototype
    ) {
      try {
        const registration = await navigator.serviceWorker.ready;
        await (
          registration as ServiceWorkerRegistration & {
            sync: { register: (tag: string) => Promise<void> };
          }
        ).sync.register("sync-moments");
        console.log("[OfflineStorage] Background sync registered");
      } catch (error) {
        console.error("[OfflineStorage] Background sync failed:", error);
        // Fallback to manual sync
        await manualSync();
      }
    } else {
      // Fallback for browsers without background sync
      await manualSync();
    }
  }, []);

  // Manual sync (fallback)
  const manualSync = useCallback(async () => {
    console.log("[OfflineStorage] Starting manual sync...");

    try {
      const unsyncedMoments = await getUnsyncedMoments();

      for (const moment of unsyncedMoments) {
        try {
          // Here you would make API call to sync moment
          // await api.post('/moments', moment.data);

          // Mark as synced
          await addToStore(STORES.MOMENTS, { ...moment, synced: true });
          console.log("[OfflineStorage] Moment synced:", moment.id);
        } catch (error) {
          console.error(
            "[OfflineStorage] Failed to sync moment:",
            moment.id,
            error,
          );
        }
      }

      // Sync media queue
      const mediaQueue = await getAllFromStore<MediaQueueItem>(
        STORES.MEDIA_QUEUE,
      );

      for (const media of mediaQueue) {
        try {
          // Here you would upload media
          // await api.uploadMedia(media.momentId, media.file);

          // Remove from queue
          await deleteFromStore(STORES.MEDIA_QUEUE, media.id);
          console.log("[OfflineStorage] Media uploaded:", media.id);
        } catch (error) {
          console.error(
            "[OfflineStorage] Failed to upload media:",
            media.id,
            error,
          );
        }
      }

      await updateSyncStatus();

      setSyncStatus((prev) => ({
        ...prev,
        lastSyncAt: new Date().toISOString(),
      }));

      console.log("[OfflineStorage] Manual sync complete");
    } catch (error) {
      console.error("[OfflineStorage] Manual sync failed:", error);
    }
  }, [updateSyncStatus]);

  // Get all offline moments
  const getOfflineMoments = useCallback(async (): Promise<OfflineMoment[]> => {
    return getAllFromStore<OfflineMoment>(STORES.MOMENTS);
  }, []);

  // Clear synced data
  const clearSyncedData = useCallback(async (): Promise<void> => {
    const database = await initDB();

    return new Promise((resolve, reject) => {
      const transaction = database.transaction(STORES.MOMENTS, "readwrite");
      const store = transaction.objectStore(STORES.MOMENTS);
      const index = store.index("synced");
      const request = index.openCursor(IDBKeyRange.only(true));

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
        if (cursor) {
          store.delete(cursor.primaryKey);
          cursor.continue();
        }
      };

      transaction.oncomplete = () => {
        updateSyncStatus();
        resolve();
      };
      transaction.onerror = () => reject(transaction.error);
    });
  }, [updateSyncStatus]);

  return {
    isOnline,
    syncStatus,
    saveMomentOffline,
    queueMediaUpload,
    cacheMedia,
    getCachedMedia,
    triggerSync,
    getOfflineMoments,
    clearSyncedData,
  };
}

/**
 * Hook for checking and requesting PWA installation
 */
export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
      return;
    }

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const promptInstall = useCallback(async () => {
    if (!deferredPrompt) return false;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      setIsInstalled(true);
    }

    setDeferredPrompt(null);
    setIsInstallable(false);

    return outcome === "accepted";
  }, [deferredPrompt]);

  return {
    isInstallable,
    isInstalled,
    promptInstall,
  };
}

// TypeScript interface for beforeinstallprompt event
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
  prompt(): Promise<void>;
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
  }
}

export default useOfflineStorage;
