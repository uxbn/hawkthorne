import { Event, PrismaClient, Registration, User } from "@prisma/client"

export class RegistrationService {
  private _prisma = new PrismaClient()

  async joinUserToEventId(user: User, eventId: number): Promise<Registration> {
    const event = await this._prisma.event.findUnique({ where: { id: eventId } })
    if (!event) {
      throw `No event ${eventId}`
    }
    return this.joinUserToEvent(user, event)
  }

  async joinUserToEvent(user: User, event: Event): Promise<Registration> {
    return this._prisma.registration.create({ data: {
      registrationType: 0,
      user: { connect: { id: user.id } },
      event: { connect: { id: event.id } }
    }})
  }

  async removeUserFromEventId(user: User, eventId: number): Promise<void> {
    const event = await this._prisma.event.findUnique({ where: { id: eventId } })
    if (!event) {
      throw `No event ${eventId}`
    }
    return this.removeUserFromEvent(user, event)
  }

  async removeUserFromEvent(user: User, event: Event): Promise<void> {
    const registration = await this._prisma.registration.findFirst(
      { where: { event: event, user: user } })
    if (registration) {
      await this._prisma.registration.delete({where: {id: registration.id}})
    }
  }
}
