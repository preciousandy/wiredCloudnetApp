import Constants from 'expo-constants';
import { Platform } from 'react-native';

interface AppExtra {
  apiBaseUrl: string;
  useMockApi: boolean;
  env: string;
}

const extra = (Constants.expoConfig?.extra ?? {}) as Partial<AppExtra>;

function getBaseUrl(): string {
  // Detect Expo Metro bundler host IP dynamically from active network
  const hostUri = Constants.expoConfig?.hostUri;
  const devMachineIp = hostUri ? hostUri.split(':')[0] : null;

  if (Platform.OS === 'android' && !hostUri) {
    return 'http://10.0.2.2:8000/api';
  }

  if (Platform.OS !== 'web' && devMachineIp) {
    return `http://${devMachineIp}:8000/api`;
  }

  const envUrl = process.env.EXPO_PUBLIC_API_BASE_URL || extra.apiBaseUrl;
  if (envUrl) {
    return envUrl.replace(/\/+$/, '');
  }

  return 'http://172.20.10.5:8000/api';
}


const useMock =
  process.env.EXPO_PUBLIC_USE_MOCK_API !== undefined
    ? process.env.EXPO_PUBLIC_USE_MOCK_API === 'true'
    : extra.useMockApi ?? false;

export const apiConfig = {
  baseUrl: getBaseUrl(),
  /** True when using mock API, false when connecting to Laravel backend */
  useMock,
  env: process.env.EXPO_PUBLIC_ENV ?? extra.env ?? 'development',
  timeoutMs: 20_000,
  maxRetries: 2,
};


