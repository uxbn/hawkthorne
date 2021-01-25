import { Event, PrismaClient, Registration } from "@prisma/client";
import { MessageEmbed } from "discord.js";
import { RegistrationType } from "../model/registration_type";
import { MessageEmbedUtils } from "../utils/message_embed_utils";
import { MessageGenerator } from './message_generator';

export class EventMessageGenerator implements MessageGenerator {
  private _prisma = new PrismaClient()

  async generateById(eventId: number): Promise<MessageEmbed> {
    const event = await this._prisma.event.findUnique({where: {id: eventId}})
    if (event == null) {
      return new MessageEmbed()
        .setColor("#cc0000")
        .setTitle(`Could not find join ID ${eventId}.`)
    }
    return this.generate(event)
  }

  async generate(event: Event): Promise<MessageEmbed> {
    const creator = await this._prisma.user.findUnique({ where: { id: event.createdById } })
    if (!creator) {
      throw Error("Could not get creator with user id: " + event.createdById)
    }
    const embed = new MessageEmbed()
      .setTitle(event.title)
      .setTimestamp(event.startDate)
      .setFooter(`Creator | ${creator.displayName} | Your Time`)
    // TODO: Locale from Discord User
    const dateString = new Intl.DateTimeFormat(
      [], 
      { weekday: "long", day: "numeric", month: "numeric", timeZone: event.timeZone },
    ).format(event.startDate)
    const timeString = new Intl.DateTimeFormat(
      [], 
      { hour: "numeric", minute: "2-digit", timeZone: event.timeZone, timeZoneName: "short" },
    ).format(event.startDate)
    embed.addField("When", dateString + "\n" + timeString, true)
    embed.addField('\u200B', '\u200B', true) // Blank space.
    MessageEmbedUtils.addEventIdToEmbed(event.id, embed)
    if (event.description) {
      embed.addField("Description", event.description, false)
    }
    
    const registrations = await this._prisma.event.findUnique(
      { where: { id: event.id } }).registrations()
    const categoriesToRegistrations: Record<number, Registration[]> = 
      registrations.reduce((map, registration) => {
        const categoryRegistrations = map[registration.registrationType] || []
        categoryRegistrations.push(registration)
        map[registration.registrationType] = categoryRegistrations
        return map
      }, {} as Record<number, Registration[]>)
    for (const category in categoriesToRegistrations) {
      const userIds = categoriesToRegistrations[category].map(r => {
        return r.userId
      })
      const names: string[] = []
      for (const userId of userIds) {
        const user = await this._prisma.user.findUnique({where: {id: userId}})
        if (!user) {
          throw new Error("Registered user not found in db")
        }
        names.push(user.displayName)
      }
      embed.addField(`${RegistrationType[category]}`, names.join("\n"), true)
    }

    return embed
  }
}
