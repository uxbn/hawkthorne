import { PrismaClient } from "@prisma/client"
import { MessageEmbed } from "discord.js"
import { eventDefinitions } from "../definitions/event_definitions"
import { EventMessageGenerator } from "../message_generators/event_message_generator"
import { ActivityDefinition } from "../model/activity"
import { RegistrationType } from "../model/registration_type"
import { MessageUtils } from "../utils/message_utils"
import { TimeZoneParser } from "../utils/time_zone"
import { parseDate } from "./date_parsing"
import { EventSession } from "./event_message_handler"
import { EventService } from "./event_service"
import { RegistrationService } from "./registration_service"

export interface CreateEventSession extends EventSession {
  activityDefinition?: ActivityDefinition,
  startDate?: Date,
  timeZoneOffset?: number,
  timeZoneName?: string,
  eventDescription?: string,
}

export class CreateEventMessageHandler {
  static async handle(session: CreateEventSession, prisma: PrismaClient): Promise<void> {
    // TODO: Check for the user first and direct to an initial config message.
    await this.promptForActivity(session)
    await this.promptForStartDate(session)
    await this.promptForDescription(session)
    if (!session.responseMessage) {
      throw new Error("No response message in session after prompts.")
    }
    
    const eventService = new EventService()
    const registrationService = new RegistrationService()
    const dbUser = await eventService.upsertUser(session.user)
    if (!session.activityDefinition) {
      throw new Error("Did not have an activity definition to use")
    }
    if (!session.startDate) {
      throw new Error("Did not have a start date")
    }
    if (!session.timeZoneName) {
      throw new Error("Did not have a timezone name")
    }
    const event = await eventService.insertEvent(
      session.activityDefinition.name,
      dbUser.id,
      session.eventDescription,
      session.startDate,
      session.timeZoneName,
      session.timeZoneOffset)
    await registrationService.joinUserToEvent(dbUser, event, RegistrationType.Confirmed)
    const eventMessage = await new EventMessageGenerator(prisma).generate(event)
    const sentMessage = await session.responseMessage.edit(eventMessage)
    return MessageUtils.addEventReactions(sentMessage)
  }

  private static async promptForActivity(session: CreateEventSession): Promise<void> {
    const responseEmbed = new MessageEmbed()
      .setColor("#0099ff")
      .setTitle("Which raid would you like?")
      .setDescription(
        eventDefinitions.map(
          event => CreateEventMessageHandler.selectionStringForActivity(event)).join("\n"))
    session.responseMessage = await session.channel.send(responseEmbed)
    for (const definition of eventDefinitions) {
      await session.responseMessage.react(definition.reaction.emoji)
    }
    
    const reaction = (await session.responseMessage.awaitReactions(
      (reaction, user) => user.id === session.user.id,
      { max: 1, time: 60000, errors: ["time"] })).first()
    if (!reaction) {
      throw new Error("Failed to get reaction during prompt after 60 seconds.")
    }

    for (const definition of eventDefinitions) {
      // TODO: Should we be using identifier instead?
      if (definition.reaction.emoji === reaction.emoji.name) {
        session.activityDefinition = definition
      }
    }

    await session.responseMessage.reactions.removeAll()
  }

  private static selectionStringForActivity(activity: ActivityDefinition): string {
    return activity.name + ": " + activity.reaction.key
  }

  private static async promptForStartDate(session: CreateEventSession): Promise<void> {
    const responseEmbed = new MessageEmbed()
      .setColor("#0099ff")
      .setTitle("What time should the activity start?")
      .setDescription("Reply with a format like: `h:m am/pm tz m/d`\n" +
                      "If starting now, reply with `now`")
    if (!session.responseMessage) {
      throw new Error("No response message in session after prompts.")
    }
    await session.responseMessage.edit(responseEmbed)
    
    try {
      const response = (await session.channel.awaitMessages(
        message => message.author.id === session.user.id, 
        {
          max: 1,
          time: 60000,
          errors: ["time"]
        })).first()
      if (!response) {
        throw new Error("No response received")
      }
      const dateResults = parseDate(response.content)
      // TODO: show error and retry input if there is no parsed result.
      if (dateResults.length > 0) {
        const result = dateResults[0]
        session.startDate = result.date()
        session.timeZoneOffset = result.start.get("timezoneOffset") || 0
        const timeZoneName = TimeZoneParser.offsetToTimeZoneName(session.timeZoneOffset)
        session.timeZoneName = timeZoneName || "GMT"
      }
      session.channel.messages.delete(response)
    } catch (e) {
      const responseEmbed = new MessageEmbed()
        .setColor("#cc0000")
        .setTitle("Timed out creating event.")
        .setDescription("You did not provide a valid start date.")
      await session.responseMessage.edit(responseEmbed)
    }
  }

  private static async promptForDescription(session: CreateEventSession): Promise<void> {
    const responseEmbed = new MessageEmbed()
      .setColor("#0099ff")
      .setTitle("What should the event description be?")
      .setDescription("You can add _italics_ by surrounding text with _.\n" +
                      "To **bold**, use **.")
    if (!session.responseMessage) {
      throw new Error("No response message in session after prompts.")
    }
    await session.responseMessage.edit(responseEmbed)

    try {
      const response = (await session.channel.awaitMessages(
        message => message.author.id === session.user.id, 
        {
          max: 1,
          time: 60000,
          errors: ["time"]
        })).first()
      if (!response) {
        throw new Error("No response received for description")
      }
      session.eventDescription = response.content
      session.channel.messages.delete(response)
    } catch (e) {
      // no-op, empty description
    }
  }
}
