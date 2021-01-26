import { Event, PrismaClient, Registration } from "@prisma/client";
import { MessageEmbed } from "discord.js";
import { RegistrationType } from "../model/registration_type";
import { MessageEmbedUtils } from "../utils/message_embed_utils";
import { MessageGenerator } from './message_generator';

export class EventMessageGenerator implements MessageGenerator {
  private _prisma: PrismaClient

  constructor(prisma: PrismaClient) {
    this._prisma = prisma
  }

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
    MessageEmbedUtils.addEventIdFieldToEmbed(event.id, embed)
    if (event.description) {
      embed.addField("Description", event.description, false)
    }
    
    const registrations = await this._prisma.event.findUnique({
      where: { id: event.id },
      select: {
        registrations: {
          orderBy: {
            createdAt: "asc",
          },
        },
      },
    }).registrations()
    const categoriesToRegistrations: Record<number, Registration[]> = 
      registrations.reduce((map, registration) => {
        const categoryRegistrations = map[registration.registrationType] || []
        categoryRegistrations.push(registration)
        map[registration.registrationType] = categoryRegistrations
        return map
      }, {} as Record<number, Registration[]>)
    await EventMessageGenerator.addAttendeeFields(
      embed, event, categoriesToRegistrations, this._prisma)
    return embed
  }

  private static async addAttendeeFields(
    embed: MessageEmbed,
    event: Event,
    categoriesToRegistrations: Record<number, Registration[]>,
    prisma: PrismaClient
  ): Promise<void> {
    const confirmedRegistrations = categoriesToRegistrations[RegistrationType.Confirmed] || []
    const maxPlayers = event.maxPlayers
    if (maxPlayers == null || confirmedRegistrations.length <= maxPlayers) {
      // Do a basic list if the number of registrations is not over the max.
      const names = await this.attendeeNamesForRegistrations(confirmedRegistrations, prisma)
      if (names.length == 0) { names.push("None") }
      embed.addField(
        `${RegistrationType[RegistrationType.Confirmed]} ` +
          `(${confirmedRegistrations.length}/${event.maxPlayers})`,
        names.join("\n"),
        true)
    } else {
      // Divide the confirmed into groups based on max player count.
      const confirmedGroups: Registration[][] =
        confirmedRegistrations.reduce((arrayOfArrays, registration) => {
          const lastGroup = arrayOfArrays[arrayOfArrays.length - 1]
          if (lastGroup.length < maxPlayers) {
            lastGroup.push(registration)
          } else {
            arrayOfArrays.push([registration])
          }
          return arrayOfArrays
        }, [[]] as Registration[][])
      for (let groupNumber = 0; groupNumber < confirmedGroups.length; groupNumber++) {
        const group = confirmedGroups[groupNumber]
        const names = await this.attendeeNamesForRegistrations(group, prisma)
        const count = group.length < maxPlayers ? `${group.length}/${event.maxPlayers}` : "Full"
        embed.addField(`Group ${groupNumber+1} (${count})`, names.join("\n"), true)
      }
    }

    const tentativeRegistrations = categoriesToRegistrations[RegistrationType.Tentative] || []
    const names = await this.attendeeNamesForRegistrations(tentativeRegistrations, prisma)
    if (names.length > 0) {
      embed.addField(`${RegistrationType[RegistrationType.Tentative]}`, names.join("\n"), true)
    }
  }

  private static async attendeeNamesForRegistrations(
    registrations: Registration[],
    prisma: PrismaClient
  ): Promise<string[]> {
    const userIds = registrations.map(r => { return r.userId })
    const names: string[] = []
    for (const userId of userIds) {
      const user = await prisma.user.findUnique({where: {id: userId}})
      if (!user) {
        throw new Error("Registered user not found in db")
      }
      names.push(user.displayName)
    }
    return names
  }
}
