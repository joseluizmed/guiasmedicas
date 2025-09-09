
import localforage from 'localforage';

export const setupLocalForage = () => {
  localforage.config({
    name: 'medicalGuideGenerator',
    storeName: 'appData',
    description: 'Storage for medical guide form data',
  });
};

export const saveData = async <T,>(key: string, data: T): Promise<T> => {
  return await localforage.setItem<T>(key, data);
};

export const loadData = async <T,>(key: string): Promise<T | null> => {
  return await localforage.getItem<T>(key);
};
