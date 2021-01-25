import { PrismaClient } from "@prisma/client";
import { 
  Description, Discord, GuardFunction, Command, Guard, CommandMessage, On, ArgsOf
} from "@typeit/discord"
import { 
  MessageReaction, PartialUser as PartialDiscordUser, TextChannel, User as DiscordUser 
} from 'discord.js';
import { reactionDefinitions } from "./definitions/reaction_definitions";
import { EventMessageGenerator } from "./message_generators/event_message_generator";
import { ExampleMessageGenerator } from "./message_generators/example_message_generator";
import { RegistrationType } from "./model/registration_type";
import { EventMessageHandler } from "./services/event_message_handler";
import { EventService } from "./services/event_service";
import { RegistrationService } from "./services/registration_service";
import { MessageEmbedUtils } from "./utils/message_embed_utils";

const NotBot: GuardFunction<"message"> = async (
  [message],
  client,
  next
) => {
  if (!message.author.bot) {
    await next();
  }
};

@Discord("$")
@Description("Hawkthorne Bot")
export class Bot {
  private _prisma = new PrismaClient()

  @Command("ping")
  @Guard(NotBot)
  ping(command: CommandMessage): void {
    command.reply("pong!");
  }

  @Command("helloworld")
  hello(command: CommandMessage): void {
    command.channel.send(new ExampleMessageGenerator().generate());
  }

  @Command("lfg :" + "commandName")
  lfg(command: CommandMessage): void {
    if (!(command.channel instanceof TextChannel)) {
      return
    }
    EventMessageHandler.handle(
      command, { channel: command.channel as TextChannel, user: command.author }, this._prisma)
  }

  @On("ready")
  initialize(): void {
    console.log("Bot logged in.");
    console.log(this)
  }

  @On("message")
  receivedMessage([message]: ArgsOf<"message">): void {
    console.log("Got message", message.content);
  }

  @On("messageReactionAdd")
  messageReactionAdd(
    [reaction, user]: ArgsOf<"messageReactionAdd">,
  ): void {
    if (reaction.me) {
      return
    }
    this.reactionAddedByUser(reaction, user)
  }

  /*
  @On("messageReactionRemove")
  messageReactionRemove(
    [reaction, user]: ArgsOf<"messageReactionRemove">,
  ): void {
    if (reaction.me) {
      return
    }
    this.reactionRemovedByUser(reaction, user)
  }
  */

  @On("messageDelete")
  messageDeleted([message]: ArgsOf<"messageDelete">): void {
    console.log(`${message.id}:${message.content} was deleted.`);
  }

  @On("guildMemberAdd")
  memberJoin([member]: ArgsOf<"guildMemberAdd">): void {
    console.log(`User : ${member.user.username} has joined the Discord Server.`);
  }

  @On("guildCreate")
  guildJoin([guild]: ArgsOf<"guildCreate">): void {
    console.log(`Bot added to the Discord Server : ${guild.name}`);
  }

  // -- Private
  private async reactionAddedByUser(
    reaction: MessageReaction,
    user: DiscordUser | PartialDiscordUser
  ) {
    const message = reaction.message.partial ? await reaction.message.fetch() : reaction.message
    // Ignore non-bot messages.
    if (!message.author.bot) {
      // TODO: Only check for this bot's messages.
      console.log(`Skipping reaction ${reaction.emoji.name} on message ${message.id}`)
      return
    }
    // Remove arbitrary reactions from users.
    if (!this.isBotReaction(reaction)) {
      console.log(`Removing reaction ${reaction.emoji.name} from message ${message.id}`)
      await reaction.remove()
      return
    }

    if (!this.isEventReaction(reaction)) {
      console.log(`Skipping non-event reaction ${reaction.emoji.name} on message ${message.id}`)
      return
    }

    if (message.embeds.length == 0) {
      console.log("No embed found on bot message.")
      return
    }
    const eventId = MessageEmbedUtils.eventIdFromEmbed(message.embeds[0])
    if (eventId == null) {
      return
    }

    const discordUser = user.partial ? await user.fetch() : user as DiscordUser
    const eventService = new EventService()
    const registrationService = new RegistrationService()
    const dbUser = await eventService.upsertUser(discordUser)

    if (reaction.emoji.name == "hawk_plus") {
      const registration = await registrationService.joinUserToEventId(
        dbUser, eventId, RegistrationType.Confirmed)
      if (!registration) {
        throw "Failed to create registration"
      }
    } else if (reaction.emoji.name == "hawk_remove") {
      await registrationService.removeUserFromEventId(dbUser, eventId)
    } else if (reaction.emoji.name == reactionDefinitions["question"].emoji) {
      const registration = await registrationService.joinUserToEventId(
        dbUser, eventId, RegistrationType.Tentative)
      if (!registration) {
        throw "Failed to create registration"
      }
    }
    
    message.edit(await new EventMessageGenerator(this._prisma).generateById(eventId))
    await reaction.users.remove(discordUser.id)
  }

  // TODO: Put this list somewhere that makes much more sense.
  private isBotReaction(reaction: MessageReaction): boolean {
    // TODO: Read from reactionDefinitions
    return [
      "🇩",
      "🇬",
      "🇼",
      "hawk_plus",
      "hawk_remove",
      "hawk_question"
    ].find(name => name == reaction.emoji.name) != undefined
  }

  private isEventReaction(reaction: MessageReaction): boolean {
    return [
      "hawk_plus",
      "hawk_remove",
      "hawk_question"
    ].find(name => name == reaction.emoji.name) != undefined
  }
}
