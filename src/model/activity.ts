import { ReactionDescription } from "../definitions/reaction_definitions";

export enum ActivityCategory {
  Raid,
  Dungeon,
  Crucible,
  Gambit,
  Seasonal,
  Other
}

export interface ActivityDefinition {
  id: string
  name: string
  category: ActivityCategory
  reaction: ReactionDescription
  defaultMaxPlayers?: number
}
