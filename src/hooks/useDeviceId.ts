import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DEVICE_ID_KEY = '@sssmantrajapam_device_id';

function randomId() {
  return `dev_${globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2) + Date.now().toString(36)}`;
}

export function useDeviceId() {
  const [deviceId, setDeviceId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      let id: string | null = null;
      try {
        id = await AsyncStorage.getItem(DEVICE_ID_KEY);
        if (!id) {
          id = randomId();
          await AsyncStorage.setItem(DEVICE_ID_KEY, id);
        }
      } catch {
        id = id ?? randomId();
      }
      if (active) setDeviceId(id);
    })();
    return () => {
      active = false;
    };
  }, []);

  return { deviceId };
}
