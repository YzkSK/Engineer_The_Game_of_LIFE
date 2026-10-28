import { initialState, reduce } from './reducer';
import type { Action, GameState } from './types';

export const replay = (actions: Action[]): GameState => actions.reduce(reduce, initialState);
