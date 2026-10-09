import type { User } from './user'

export function greet(user: User): string {
  if (user.name === '') return 'Hello'
  return `Hello ${user.name}`
}
