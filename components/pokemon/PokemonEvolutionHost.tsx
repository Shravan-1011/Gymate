import React, {
  useCallback,
  useEffect,
  useState,
} from 'react';

import PokemonEvolutionOverlay from './PokemonEvolutionOverlay';

import {
  subscribeToPokemonEvolution,
} from '../../services/pokemonEvolutionEventService';

import type {
  PokemonEvolutionEvent,
} from '../../services/pokemonEvolutionEventService';

export default function PokemonEvolutionHost() {
  const [queue, setQueue] =
    useState<PokemonEvolutionEvent[]>(
      []
    );

  const [currentEvent, setCurrentEvent] =
    useState<PokemonEvolutionEvent | null>(
      null
    );

  useEffect(() => {
    return subscribeToPokemonEvolution(
      (event) => {
        setQueue((currentQueue) => [
          ...currentQueue,
          event,
        ]);
      }
    );
  }, []);

  useEffect(() => {
    if (
      currentEvent ||
      queue.length === 0
    ) {
      return;
    }

    const [nextEvent, ...remaining] =
      queue;

    setQueue(remaining);
    setCurrentEvent(nextEvent);
  }, [queue, currentEvent]);

  const handleComplete =
    useCallback(() => {
      setCurrentEvent(null);
    }, []);

  return (
    <PokemonEvolutionOverlay
      event={currentEvent}
      onComplete={handleComplete}
    />
  );
}