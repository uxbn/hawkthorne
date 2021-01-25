import { CommandMessage } from "@typeit/discord"
import { Message } from "discord.js"
import { Session } from "../sessions/session"
import { CreateEventMessageHandler } from "./create_event_message_handler"
import { EventDescriptionMessageHandler } from "./event_description_message_handler"

export interface EventSession extends Session {
  responseMessage?: Message,
}

export class EventMessageHandler {
  static async handle(message: CommandMessage, session: Session): Promise<void> {
    switch (message.args.commandName) {
      case "create":
        CreateEventMessageHandler.handle(session)
        break
      default:
        EventDescriptionMessageHandler.handle(message.args.commandName, session)
        break
    }
  }
}
