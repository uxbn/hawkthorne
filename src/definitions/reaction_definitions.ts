export interface ReactionDescription {
  key: string
  emoji: string
}

const reactionDefinitions: Record<string, ReactionDescription> = {
  ["d"]: {key: ":regional_indicator_d:", emoji: "🇩"},
  ["g"]: {key: ":regional_indicator_g:", emoji: "🇬"},
  ["w"]: {key: ":regional_indicator_w:", emoji: "🇼"},
}

export { reactionDefinitions }
