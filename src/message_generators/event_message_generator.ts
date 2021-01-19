import { Event, PrismaClient, Registration } from "@prisma/client";
import { MessageEmbed } from "discord.js";
import { RegistrationType } from "../model/registration_type";
import { MessageGenerator } from './message_generator';

export class EventMessageGenerator implements MessageGenerator {
  async generateById(eventId: number): Promise<MessageEmbed> {
    const prisma = new PrismaClient()
    const event = await prisma.event.findUnique({where: {id: eventId}})
    if (event == null) {
      return new MessageEmbed()
        .setColor("#cc0000")
        .setTitle(`Could not find join ID ${eventId}.`)
    }
    return this.generate(event)
  }

  async generate(event: Event): Promise<MessageEmbed> {
    const prisma = new PrismaClient()

    const creatorDisplayName = (await prisma.user.findUnique(
      { where: { id: event.createdById } })).displayName
    const embed = new MessageEmbed()
      .setTitle(event.title)
      .setTimestamp(event.startDate)
      .setFooter(`Creator | ${creatorDisplayName} | Your Time`)
    // TODO: Locale from Discord User
    const dateString = new Intl.DateTimeFormat(
      [], 
      { weekday: "long", day: "numeric", month: "numeric", timeZone: "CST" },
    ).format(event.startDate)
    const timeString = new Intl.DateTimeFormat(
      [], 
      { hour: "numeric", minute: "2-digit", timeZone: "CST", timeZoneName: "short" },
    ).format(event.startDate)
    embed.addField("When", dateString + "\n" + timeString, true)
    embed.addField('\u200B', '\u200B', true) // Blank space.
    embed.addField("Join ID", event.id, true)
    if (event.description) {
      embed.addField("Description", event.description, false)
    }
    
    const registrations = await prisma.event.findUnique({ where: { id: event.id } }).registrations()
    const categoriesToRegistrations: { [key: string]: Registration[] } = 
      registrations.reduce((map, registration) => {
        const categoryRegistrations = map[registration.registrationType] || []
        categoryRegistrations.push(registration)
        map[registration.registrationType] = categoryRegistrations
        return map
    }, {});
    for (const category in categoriesToRegistrations) {
      const userIds = categoriesToRegistrations[category].map(r => {
        return r.userId
      })
      const names: string[] = []
      for (const userId of userIds) {
        names.push((await prisma.user.findUnique({where: {id: userId}})).displayName)
      }
      embed.addField(`${RegistrationType[category]}`, names.join("\n"), true)
    }

    return embed
  }
}
