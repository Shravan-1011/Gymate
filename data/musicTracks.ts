export type MusicTrack = {
  id: string;
  name: string;
  subtitle: string;
  source: number;
};

export const MUSIC_TRACKS: MusicTrack[] = [
  {
    id: 'cerulean-city',
    name: 'Cerulean City',
    subtitle: 'Kanto',
    source: require('../assets/audio/Cerulean City.ogg'),
  },

  {
    id: 'hoenn-town',
    name: 'Hoenn Town',
    subtitle: 'Hoenn',
    source: require('../assets/audio/Hoenn Town.ogg'),
  },

  {
    id: 'johto-town',
    name: 'Johto Town',
    subtitle: 'Johto',
    source: require('../assets/audio/Johto Town.ogg'),
  },

  {
    id: 'kalos-town',
    name: 'Kalos Town',
    subtitle: 'Kalos',
    source: require('../assets/audio/Kalos Town.ogg'),
  },

  {
    id: 'kanto-town',
    name: 'Kanto Town',
    subtitle: 'Kanto',
    source: require('../assets/audio/Kanto Town.ogg'),
  },

  {
    id: 'national-park',
    name: 'National Park',
    subtitle: 'Johto',
    source: require('../assets/audio/National Park.ogg'),
  },

  {
    id: 'oaks-lab',
    name: "Oak's Lab",
    subtitle: 'Kanto',
    source: require("../assets/audio/Oak's Lab.ogg"),
  },

  {
    id: 'pkmrs-fallarbor',
    name: 'PkmRS-Fallarbor',
    subtitle: 'Hoenn',
    source: require('../assets/audio/PkmRS-Fallarbor.ogg'),
  },

  {
    id: 'poke-center',
    name: 'PokéCenter',
    subtitle: 'Pokémon Center',
    source: require('../assets/audio/PokeCenter.ogg'),
  },

  {
    id: 'poke-mart',
    name: 'PokéMart',
    subtitle: 'Pokémon Mart',
    source: require('../assets/audio/PokeMart.ogg'),
  },

  {
    id: 'radio-oak',
    name: 'Radio - Oak',
    subtitle: 'Radio',
    source: require('../assets/audio/Radio - Oak.ogg'),
  },

  {
    id: 'route-202',
    name: 'Route 202',
    subtitle: 'Sinnoh',
    source: require('../assets/audio/Route_202.ogg'),
  },

  {
    id: 'sinnoh-town',
    name: 'Sinnoh Town',
    subtitle: 'Sinnoh',
    source: require('../assets/audio/Sinnoh Town.ogg'),
  },

  {
    id: 'unova-town',
    name: 'Unova Town',
    subtitle: 'Unova',
    source: require('../assets/audio/Unova Town.ogg'),
  },
];