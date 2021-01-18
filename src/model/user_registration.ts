import { User } from 'discord.js';

enum UserRegistrationType {
  Confirmed,
  Tentative
}

enum Experience {
  New,
  Experienced,
  Sherpa
}

export interface UserRegistration {
  user: User
  registrationType: UserRegistrationType
  experience: Experience
}
