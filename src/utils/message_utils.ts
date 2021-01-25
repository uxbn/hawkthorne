import { Message } from "discord.js"
import { reactionDefinitions } from "../definitions/reaction_definitions"

export class MessageUtils {
  static async addEventReactions(message: Message): Promise<void> {
    await message.react(reactionDefinitions["plus"].key)
    await message.react(reactionDefinitions["remove"].key)
    await message.react(reactionDefinitions["question"].key)
  }
}
