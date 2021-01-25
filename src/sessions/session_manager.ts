import { Snowflake } from "discord.js";
import { Session } from "inspector";

export class SessionManager {
  // Make thread safe.
  private _sessions: { [key: string /* Snowflake */]: Session } = {}

  sessionForSnowflake(snowflake: Snowflake): Session {
    let session = this._sessions[snowflake]
    if (!session) {
      session = new Session()
    }
    return new Session()
  }
}
