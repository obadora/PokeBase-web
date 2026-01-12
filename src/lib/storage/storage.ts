/**
 * localStorage型安全ラッパー
 */

/** Storageエラー */
export class StorageError extends Error {
  constructor(
    message: string,
    public cause?: unknown
  ) {
    super(message);
    this.name = "StorageError";
  }
}

/** localStorageが利用可能かチェック */
export function isLocalStorageAvailable(): boolean {
  try {
    const testKey = "__localStorage_test__";
    localStorage.setItem(testKey, "test");
    localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

/** データをlocalStorageに保存 */
export function setItem<T>(key: string, value: T): void {
  if (!isLocalStorageAvailable()) {
    throw new StorageError("localStorage is not available");
  }

  try {
    const serialized = JSON.stringify(value);
    localStorage.setItem(key, serialized);
  } catch (error) {
    throw new StorageError(`Failed to save to localStorage: ${key}`, error);
  }
}

/** localStorageからデータ取得 */
export function getItem<T>(key: string): T | null {
  if (!isLocalStorageAvailable()) {
    return null;
  }

  try {
    const serialized = localStorage.getItem(key);
    if (serialized === null) {
      return null;
    }
    return JSON.parse(serialized) as T;
  } catch (error) {
    console.error(`Failed to load from localStorage: ${key}`, error);
    return null;
  }
}

/** localStorageからデータ削除 */
export function removeItem(key: string): void {
  if (!isLocalStorageAvailable()) {
    return;
  }

  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error(`Failed to remove from localStorage: ${key}`, error);
  }
}

/** localStorageをクリア */
export function clear(): void {
  if (!isLocalStorageAvailable()) {
    return;
  }

  try {
    localStorage.clear();
  } catch (error) {
    console.error("Failed to clear localStorage", error);
  }
}
