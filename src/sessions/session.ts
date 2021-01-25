import { CommandMessage } from "@typeit/discord";
import { TextChannel, User } from "discord.js";
export interface Session {
  channel: TextChannel
  user: User
}
