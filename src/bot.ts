import { Description, Discord, GuardFunction, Command, Guard, CommandMessage, On, ArgsOf } from "@typeit/discord"
import { MessageEmbed, TextChannel } from 'discord.js';
import { Session } from "./sessions/session";
import { ExampleMessageGenerator } from "./message_generators/example_message_generator";
import { EventMessageHandler } from "./services/event_service";
import { SessionManager } from "./sessions/session_manager";

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
  messageReactionAdd([reaction]: ArgsOf<"messageReactionAdd">): void {
    if (reaction.message.author.bot && !reaction.me) {
      reaction.remove()
    }
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
}
