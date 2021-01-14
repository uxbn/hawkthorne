import { Client } from "@typeit/discord";

export class Main {
  private static _client: Client;

  static get Client(): Client {
    return this._client;
  }

  static start(): void {
    this._client = new Client();

    this._client.login(
      "Nzk5MTU0MDk0MjIzOTE3MDY2.X__cPw.2bh17Dc54NLCSWd1FtUCKoOe3OU",
      `${__dirname}/*.ts`,
      `${__dirname}/*.js`,
    );
  }
}

Main.start();
