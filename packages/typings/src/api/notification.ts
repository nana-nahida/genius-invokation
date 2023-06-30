import { DiceType, DamageType, Aura } from "../enums";

export type PhaseType =
  | "initHands"
  | "initActives"
  | "roll"
  | "action"
  | "end"
  | "gameEnd";

export interface CharacterData {
  id: number;
  entityId: number;
  health: number;
  energy: number;
  weapon: number | null;
  artifact: number | null;
  equipments: number[];
  statuses: StatusData[];
  applied: Aura;
}

export interface StatusData {
  id: number;
  entityId: number;
  value?: number;
}

export interface SupportData {
  id: number;
  entityId: number;
  value?: number;
}

export interface SummonData {
  id: number;
  entityId: number;
  value: number;
}

export interface CardData {
  id: number;
  entityId: number;
}

export interface MyPlayerData {
  type: "my";
  pileNumber: number;
  active: number | null;
  hands: CardData[];
  characters: CharacterData[];
  combatStatuses: StatusData[];
  supports: SupportData[];
  summons: SummonData[];
  dice: DiceType[];
}

export interface OppPlayerData {
  type: "opp";
  pileNumber: number;
  active: number | null;
  hands: number;
  characters: CharacterData[];
  combatStatuses: StatusData[];
  supports: SupportData[];
  summons: SummonData[];
  dice: number;
}

export interface StateData {
  phase: PhaseType;
  turn: number;
  players: [MyPlayerData, OppPlayerData];
}

export interface GamePhaseEvent {
  type: "newGamePhase";
  phase: "roll" | "action" | "end";
  roundNumber: number;
  isFirst: boolean;
}
export interface DamageData {
  type: DamageType;
  value: number;
  target: number;
  log: {
    source: number | string; // id or "elementalReaction" or ...
    what: string;
  }[];
}
export interface StateUpdatedEvent {
  type: "stateUpdated";
  source?: number;
  damages: DamageData[];
}
export interface PlayCardEvent {
  type: "playCard";
  card: number;
  opp: boolean;
}
export interface UseSkillEvent {
  type: "useSkill";
  skill: number;
  opp: boolean;
}
export interface OppChangeHandsEvent {
  type: "oppChangeHands";
  opp: boolean;
  removed: number;
  added: number;
  discarded: number;
}
export interface SwitchActiveEvent {
  type: "switchActive";
  target: number;
}
export interface DeclareEndEvent {
  type: "declareEnd";
  opp: boolean;
}
export interface OtherEvent {
  type: "oppChoosingActive"
}
export type Event =
  | GamePhaseEvent
  | StateUpdatedEvent
  | PlayCardEvent
  | UseSkillEvent
  | OppChangeHandsEvent
  | SwitchActiveEvent
  | DeclareEndEvent
  | OtherEvent;

export type NotificationMessage = {
  event: Event;
  state: StateData;
};