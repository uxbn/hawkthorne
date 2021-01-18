import { UserRegistration } from './user_registration';

export interface Event {
  title: string
  startDate: Date 
  description: string
  registrations: [UserRegistration]
}
