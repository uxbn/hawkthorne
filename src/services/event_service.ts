import { CommandMessage } from "@typeit/discord"
import { Message, MessageEmbed } from "discord.js"
import { eventDefinitions } from "../definitions/event_definitions"
import { ActivityDefinition } from "../model/activity"
import { Session } from "../sessions/session"
import { Event, PrismaClient, Registration, User } from "@prisma/client"
import { EventMessageGenerator } from "../message_generators/event_message_generator"
import { parseDate } from "./date_parsing"

export interface CreateEventSession extends Session {
  activityDefinition: ActivityDefinition,
  startDate: Date,
  timezoneOffset: number,
  eventDescription?: string,
  responseMessage: Message
}

export class EventMessageHandler {
  static async handle(message: CommandMessage, session: Session): Promise<void> {
    switch (message.args.commandName) {
      case "create":
        // TODO: Remove this cast.
        CreateEventMessageHandler.handle(session as CreateEventSession)
        break
      default:
        this.generateEventSummary(message.args.commandName, session)
        break
    }
  }

  private static async generateEventSummary(potentialEventId: string, session: Session) {
    const eventId = Number(potentialEventId)
    const responseMessage = isNaN(eventId)
      ? new MessageEmbed().setColor("#cc0000").setTitle(`Invalid join ID ${potentialEventId}.`)
      : await new EventMessageGenerator().generateById(eventId)
    await session.channel.send(responseMessage)
  }
}

export class CreateEventMessageHandler {
  static async handle(session: CreateEventSession): Promise<void> {
    await this.promptForActivity(session)
    await this.promptForStartDate(session)
    await this.promptForDescription(session)
    
    // TODO: Check for the user first and direct to an initial config message.
    const dbUser = await this.upsertUser(session)
    const event = await this.insertEvent(session, dbUser)
    await this.joinUserToEvent(dbUser, event)
    const responseMessage = await new EventMessageGenerator().generate(event)
    session.responseMessage.edit(responseMessage)
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
    
    for (const definition of eventDefinitions) {
      // TODO: Should we be using identifier instead?
      if (definition.reaction.emoji === reaction.emoji.name) {
        session.activityDefinition = definition
      }
    }

    await session.responseMessage.reactions.removeAll()
  }

  private static selectionStringForActivity(activity: ActivityDefinition): string {
    return activity.name + ": " + activity.reaction.emoji
  }

  private static async promptForStartDate(session: CreateEventSession): Promise<void> {
    const responseEmbed = new MessageEmbed()
      .setColor("#0099ff")
      .setTitle("What time should the activity start?")
      .setDescription("Reply with a format like: `h:m am/pm tz m/d`\n" +
                      "If starting now, reply with `now`")
    await session.responseMessage.edit(responseEmbed)
    
    try {
      const response = (await session.channel.awaitMessages(
        message => message.author.id === session.user.id, 
        {
          max: 1,
          time: 60000,
          errors: ["time"]
        })).first()
      const dateResults = parseDate(response.content)
      // TODO: show error and retry input if there is no parsed result.
      if (dateResults.length > 0) {
        const result = dateResults[0]
        session.startDate = result.date()
        session.timezoneOffset = result.start.get("timezoneOffset")
      }
      session.channel.messages.delete(response)
    } catch (e) {
      const responseEmbed = new MessageEmbed()
        .setColor("#cc0000")
        .setTitle("Timed out creating event.")
        .setDescription("You did not provide a start date.")
      await session.responseMessage.edit(responseEmbed)
    }
  }

  private static async promptForDescription(session: CreateEventSession): Promise<void> {
    const responseEmbed = new MessageEmbed()
      .setColor("#0099ff")
      .setTitle("What should the event description be?")
      .setDescription("You can add *italics* by surrounding text with an *. To **bold**, use **.")
    await session.responseMessage.edit(responseEmbed)

    try {
      const response = (await session.channel.awaitMessages(
        message => message.author.id === session.user.id, 
        {
          max: 1,
          time: 60000,
          errors: ["time"]
        })).first()
      session.eventDescription = response.content
      session.channel.messages.delete(response)
    } catch (e) {
      // no-op, empty description
    }
  }

  private static async insertEvent(session: CreateEventSession, user: User): Promise<Event> {
    const prisma = new PrismaClient()
    return prisma.event.create({ data: {
      title: session.activityDefinition.name,
      description: session.eventDescription,
      startDate: session.startDate,
      createdBy: { connect: { id: user.id } },
      timezoneOffset: session.timezoneOffset ? session.timezoneOffset : undefined,
    }})
  }

  private static upsertUser(session: CreateEventSession): Promise<User> {
    const prisma = new PrismaClient()
    // Ensure User is in the DB.
    const dbUserPromise = prisma.user.upsert({
      create: { displayName: session.user.username, discordId: session.user.id },
      update: { displayName: session.user.username },
      where: { discordId: session.user.id }
    })
    return dbUserPromise
  }

  private static joinUserToEvent(user: User, event: Event): Promise<Registration> {
    const prisma = new PrismaClient()
    return prisma.registration.create({ data: {
      registrationType: 0,
      user: { connect: { id: user.id } },
      event: { connect: { id: event.id } }
    }})
  }
}
