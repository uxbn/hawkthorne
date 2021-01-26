import { User as DiscordUser } from "discord.js"
import { Event, PrismaClient, User } from "@prisma/client"

export class EventService {
  private _prisma = new PrismaClient()

  async insertEvent(
    name: string,
    createdById: number,
    description?: string,
    startDate?: Date,
    timeZoneName?: string,
    timeZoneOffset?: number,
    maxPlayers?: number,
  ): Promise<Event> {
    return this._prisma.event.create({ data: {
      title: name,
      description: description,
      startDate: startDate,
      createdBy: { connect: { id: createdById } },
      timeZoneOffset: timeZoneOffset,
      timeZone: timeZoneName,
      maxPlayers: maxPlayers,
    }})
  }

  async upsertUser(user: DiscordUser): Promise<User> {
    const dbUserPromise = this._prisma.user.upsert({
      create: { displayName: user.username, discordId: user.id },
      update: { displayName: user.username },
      where: { discordId: user.id }
    })
    return dbUserPromise
  }
}
