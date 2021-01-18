import { Event, PrismaClient, Registration } from "@prisma/client";
import { MessageEmbed } from "discord.js";
import { MessageGenerator } from './message_generator';

export class EventMessageGenerator implements MessageGenerator {
  async generate(event: Event): Promise<MessageEmbed> {
    const embed = new MessageEmbed()
      .setTitle(event.title)
      .setTimestamp(event.startDate)
    if (event.description) {
      embed.setDescription(event.description)
    }
    
    const prisma = new PrismaClient()
    const registrations = await prisma.event.findUnique({where: {id: event.id}}).registrations()
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
        names.push(await (await prisma.user.findUnique({where: {id: userId}})).displayName)
      }
      embed.addField(`${category}`, names.join("\n"), true)
    }

    return embed
  }
}
