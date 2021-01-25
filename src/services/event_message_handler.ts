import { PrismaClient } from "@prisma/client"
import { CommandMessage } from "@typeit/discord"
import { Message } from "discord.js"
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
        CreateEventMessageHandler.handle(session, prisma)
        break
      default:
        EventDescriptionMessageHandler.handle(message.args.commandName, session, prisma)
        break
    }
  }
}
