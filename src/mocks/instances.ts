import type { Instance } from '../types';

export const mockInstances: Instance[] = [
  {
    domain: 'mastodon.social',
    description: 'Instance généraliste avec large communauté et modération équilibrée.',
    languages: ['en'],
    signups: 'open',
    size: 3,
    sizeLabel: 'Grande',
    region: 'eu',
    availability: 0.997,
  },
  {
    domain: 'mastodon.art',
    description: 'Communauté orientée art & créateur·rices, modération active.',
    languages: ['en', 'fr'],
    signups: 'approval',
    size: 2,
    sizeLabel: 'Moyenne',
    region: 'eu',
    availability: 0.999,
  },
  {
    domain: 'piaille.fr',
    description: 'Instance francophone, généraliste; communauté conviviale.',
    languages: ['fr'],
    signups: 'open',
    size: 2,
    sizeLabel: 'Moyenne',
    region: 'eu',
    availability: 0.995,
  },
  {
    domain: 'fosstodon.org',
    description: 'Communauté FOSS/tech anglophone, modération claire.',
    languages: ['en'],
    signups: 'approval',
    size: 2,
    sizeLabel: 'Moyenne',
    region: 'na',
    availability: 0.998,
  }
];

