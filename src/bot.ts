import { Description, Discord, GuardFunction, Command, Guard, CommandMessage, On, ArgsOf } from "@typeit/discord"
import { 
  MessageReaction, 
  PartialUser as PartialDiscordUser, 
  ReactionEmoji, 
  TextChannel, 
  User as DiscordUser 
} from 'discord.js';
import { EventMessageGenerator } from "./message_generators/event_message_generator";
import { ExampleMessageGenerator } from "./message_generators/example_message_generator";
import { CreateEventMessageHandler, EventMessageHandler } from "./services/event_service";
import { SessionManager } from "./sessions/session_manager";
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
  private _sessionManager = new SessionManager()

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
      command, { channel: command.channel as TextChannel, user: command.author })
  }

  @On("ready")
  initialize(): void {
    console.log("Bot logged in.");
  }

  @On("message")
  receivedMessage([message]: ArgsOf<"message">): void {
    console.log("Got message", message.content);
  }

  @On("messageReactionAdd")
  messageReactionAdd(
    [reaction, user]: ArgsOf<"messageReactionAdd">,
  ): void {
    this.reactionAddedByUser(reaction, user)
  }

  @On("messageReactionRemove")
  messageReactionRemove(
    [reaction, user]: ArgsOf<"messageReactionRemove">,
  ): void {
    this.reactionRemovedByUser(reaction, user)
  }

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
    if (!reaction.me) {
      console.log(`Removing reaction ${reaction.emoji.name} from message ${message.id}`)
      await reaction.remove()
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
    const dbUser = await CreateEventMessageHandler.upsertUser(discordUser)
    const registration = await CreateEventMessageHandler.joinUserToEventId(dbUser, eventId)
    if (!registration) {
      throw "Failed to create registration"
    }
    message.edit(await new EventMessageGenerator().generateById(eventId))
    await reaction.users.remove(discordUser.id)
  }

  private async reactionRemovedByUser(
    reaction: MessageReaction,
    user: DiscordUser | PartialDiscordUser
  ) {
    const message = reaction.message.partial ? await reaction.message.fetch() : reaction.message
    // Ignore non-bot messages and reactions that are not the bot's.
    if (!message.author.bot || !reaction.me) {
      // TODO: Only check for this bot's messages.
      console.log(`Skipping reaction ${reaction.emoji.name} on message ${message.id}`)
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
    const dbUser = await CreateEventMessageHandler.upsertUser(discordUser)
    await CreateEventMessageHandler.removeUserFromEventId(dbUser, eventId)
    message.edit(await new EventMessageGenerator().generateById(eventId))
  }
}
