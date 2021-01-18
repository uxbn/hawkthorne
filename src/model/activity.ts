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
  name: string
  category: ActivityCategory
  reaction: ReactionDescription
}
