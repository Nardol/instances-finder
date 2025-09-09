export type Preferences = {
  languages: Array<'fr' | 'en'>;
  size: 'small' | 'medium' | 'large';
  moderation: 'open' | 'balanced' | 'strict';
  signups: 'open' | 'approval';
  region: 'eu' | 'na' | 'other';
  nsfw: 'allowed' | 'limited';
};

export type Instance = {
  domain: string;
  description: string;
  languages: Array<'fr' | 'en'>;
  signups: 'open' | 'approval';
  size: 1 | 2 | 3; // 1 small, 2 medium, 3 large
  sizeLabel: string;
  region: 'eu' | 'na' | 'other';
  availability: number; // 0..1
};

