export interface ReactionDescription {
  key: string
  emoji: string
}

const reactionDefinitions: { [key: string]: ReactionDescription } = {
  "d": {key: ":regional_indicator_d:", emoji: "🇩"},
  "g": {key: ":regional_indicator_g:", emoji: "🇬"},
  "w": {key: ":regional_indicator_w:", emoji: "🇼"},
  "plus": {key: "<:hawk_plus:802672391971930163>", emoji: "hawk_plus"},
  "remove": {key: "<:hawk_remove:802672392177582131>", emoji: "hawk_remove"},
  "question": {key: "<:hawk_question:802672392161591307>", emoji: "hawk_question"},
}

export { reactionDefinitions }
