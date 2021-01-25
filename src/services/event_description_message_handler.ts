import { PrismaClient } from "@prisma/client"
import { MessageEmbed } from "discord.js"
import { EventMessageGenerator } from "../message_generators/event_message_generator"
import { Session } from "../sessions/session"
import { MessageUtils } from "../utils/message_utils"

export class EventDescriptionMessageHandler {
  static async handle(
    potentialEventId: string, 
    session: Session, 
    prisma: PrismaClient
  ): Promise<void> {
    const eventId = Number(potentialEventId)
    const responseMessage = isNaN(eventId)
      ? new MessageEmbed().setColor("#cc0000").setTitle(`Invalid join ID ${potentialEventId}.`)
      : await new EventMessageGenerator(prisma).generateById(eventId)
    const sentMessage = await session.channel.send(responseMessage)
    MessageUtils.addEventReactions(sentMessage)
  }
}
