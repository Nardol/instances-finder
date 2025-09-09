import { invoke } from '@tauri-apps/api/tauri';

export type FetchParams = {
  language?: string;
  include_closed?: boolean;
  include_down?: boolean;
  max?: number;
  signups?: 'open' | 'approval';
  region?: 'eu' | 'na' | 'other';
  size?: 'small' | 'medium' | 'large';
};

export type JsInstance = {
  domain: string;
  description: string;
  languages: string[];
  signups: 'open' | 'approval';
  size: number;
  sizeLabel: string;
  region: string;
  availability: number;
};

export async function tokenStatus(): Promise<boolean> {
  return invoke<boolean>('token_status');
}

export async function saveToken(token: string, persist: boolean): Promise<void> {
  await invoke('save_token', { token, persist });
}

export async function clearToken(): Promise<void> {
  await invoke('clear_token');
}

export async function testToken(token?: string): Promise<void> {
  await invoke('test_token', { token });
}

export async function fetchInstances(params: FetchParams, bypassCache?: boolean): Promise<JsInstance[]> {
  return invoke('fetch_instances', { params, bypass_cache: bypassCache });
}

export async function clearInstancesCache(): Promise<void> {
  await invoke('clear_instances_cache');
}
