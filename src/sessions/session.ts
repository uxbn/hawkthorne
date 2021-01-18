import { TextChannel, User } from "discord.js";
// import { User } from "./user";

export interface Session {
  channel: TextChannel
  // snowflake: Snowflake
  user: User
}
