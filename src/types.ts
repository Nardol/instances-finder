export type Preferences = {
  languages: string[];
  size: 'any' | 'small' | 'medium' | 'large';
  moderation: 'any' | 'open' | 'balanced' | 'strict';
  signups: 'any' | 'open' | 'approval';
  region: 'any' | 'eu' | 'na' | 'other';
  nsfw: 'any' | 'allowed' | 'limited';
};

export type Instance = {
  domain: string;
  description: string;
  languages: string[];
  signups: 'open' | 'approval';
  size: 1 | 2 | 3; // 1 small, 2 medium, 3 large
  sizeLabel: string;
  region: 'eu' | 'na' | 'other';
  availability: number; // 0..1
};
