import { PrismaClient } from "@prisma/client"
import { CommandMessage } from "@typeit/discord"
import { Message, MessageEmbed } from "discord.js"
import { Session } from "../sessions/session"
import { CreateEventMessageHandler } from "./create_event_message_handler"
import { EventDescriptionMessageHandler } from "./event_description_message_handler"

export interface EventSession extends Session {
  responseMessage?: Message,
}

export class EventMessageHandler {
  static async handle(
    message: CommandMessage, 
    session: Session, 
    prisma: PrismaClient
  ): Promise<void> {
    switch (message.args.commandName) {
      case "create":
        return CreateEventMessageHandler.handle(session, prisma)
      default:
        return this.handleDefault(message.args.commandName, session, prisma)
    }
  }

  private static async handleDefault(
    potentialEventId: string,
    session: Session,
    prisma: PrismaClient
  ): Promise<void> {
    if (isNaN(Number(potentialEventId))) {
      const helpEmbed = new MessageEmbed()
        .setColor("#cc0000")
        .setTitle("Available Commands")
        .setDescription("`$lfg create`: Creates a new event.\n" +
                        "`$lfg #`: Replace # with an event's join ID to display event details.")
      await session.channel.send(helpEmbed)
      return
    }
    return EventDescriptionMessageHandler.handle(potentialEventId, session, prisma)
  }
}
