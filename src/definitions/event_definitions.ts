import { ActivityCategory, ActivityDefinition } from "../model/activity"
import { reactionDefinitions } from "./reaction_definitions"

const eventDefinitions: ActivityDefinition[] = [
  { name: "Deep Stone Crypt", category: ActivityCategory.Raid, reaction: reactionDefinitions["d"] },
  {
    name: "Garden of Salvation", 
    category: ActivityCategory.Raid, 
    reaction: reactionDefinitions["g"]
  },
  { name: "Last Wish", category: ActivityCategory.Raid, reaction: reactionDefinitions["w"] },
]

export { eventDefinitions }
