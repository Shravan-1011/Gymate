import type {
  PokemonLevelUpEvent,
} from './pokemonProgressionService';

export type PokemonEvolutionEvent = {
  userPokemonId: string;

  fromSpeciesId: string;

  toSpeciesId: string;

  previousLevel: number;

  newLevel: number;
};

type EvolutionListener =
  (event: PokemonEvolutionEvent) => void;

const listeners =
  new Set<EvolutionListener>();

const pendingEvents:
  PokemonEvolutionEvent[] = [];

export function publishPokemonEvolution(
  event: PokemonLevelUpEvent
): void {
  if (!event.evolvedToSpeciesId) {
    return;
  }

  const evolutionEvent:
    PokemonEvolutionEvent = {
      userPokemonId:
        event.userPokemonId,

      fromSpeciesId:
        event.previousSpeciesId,

      toSpeciesId:
        event.evolvedToSpeciesId,

      previousLevel:
        event.previousLevel,

      newLevel:
        event.newLevel,
    };

  if (listeners.size === 0) {
    pendingEvents.push(
      evolutionEvent
    );

    return;
  }

  listeners.forEach(
    (listener) => {
      listener(evolutionEvent);
    }
  );
}

export function subscribeToPokemonEvolution(
  listener: EvolutionListener
): () => void {
  listeners.add(listener);

  if (pendingEvents.length > 0) {
    const events =
      pendingEvents.splice(
        0,
        pendingEvents.length
      );

    events.forEach(
      (event) => {
        listener(event);
      }
    );
  }

  return () => {
    listeners.delete(listener);
  };
}