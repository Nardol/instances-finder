import type { Instance, Preferences } from '../types';

export function scoreInstance(i: Instance, p: Preferences): number {
  let s = 0;
  // Langues: +2 si inclut une des langues choisies
  if (p.languages.length > 0 && i.languages.some((l) => p.languages.includes(l))) s += 2;
  // Taille: préf small=1, medium=2, large=3 -> distance inverse
  if (p.size !== 'any') {
    const prefSize = p.size === 'small' ? 1 : p.size === 'medium' ? 2 : 3;
    s += 2 - Math.abs(prefSize - i.size);
  }
  // Modération: bonus équilibré
  if (p.moderation !== 'any') {
    if (p.moderation === 'balanced' && i.signups === 'approval') s += 0.5;
    if (p.moderation === 'open' && i.signups === 'open') s += 0.5;
    if (p.moderation === 'strict' && i.signups === 'approval') s += 0.5;
  }
  // Région
  if (p.region !== 'any' && i.region === p.region) s += 1;
  // Disponibilité
  s += i.availability * 1.5;
  return s;
}

export function rankInstances(list: Instance[], p: Preferences): Instance[] {
  return [...list].sort((a, b) => scoreInstance(b, p) - scoreInstance(a, p));
}
