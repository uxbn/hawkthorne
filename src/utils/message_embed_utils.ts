import { MessageEmbed } from "discord.js";

export class MessageEmbedUtils {
  private static joinIdName = "Join ID"

  static eventIdFromEmbed(embed: MessageEmbed): number|undefined {
    for (const field of embed.fields) {
      if (field.name == this.joinIdName) {
        return Number(field.value)
      }
    }
    return undefined
  }

  static addEventIdToEmbed(eventId: number, embed: MessageEmbed): void {
    embed.addField(this.joinIdName, eventId, true)
  }
}
