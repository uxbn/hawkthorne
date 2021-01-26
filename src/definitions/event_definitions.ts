import { ActivityCategory, ActivityDefinition } from "../model/activity"
import { reactionDefinitions } from "./reaction_definitions"

const eventDefinitions: ActivityDefinition[] = [
  { 
    id: "dsc",
    name: "Deep Stone Crypt",
    category: ActivityCategory.Raid,
    reaction: reactionDefinitions["d"],
    defaultMaxPlayers: 6,
  },
  {
    id: "gos",
    name: "Garden of Salvation",
    category: ActivityCategory.Raid,
    reaction: reactionDefinitions["g"],
    defaultMaxPlayers: 6,
  },
  { 
    id: "lw",
    name: "Last Wish",
    category: ActivityCategory.Raid,
    reaction: reactionDefinitions["w"],
    defaultMaxPlayers: 6,
  },
]

export { eventDefinitions }
