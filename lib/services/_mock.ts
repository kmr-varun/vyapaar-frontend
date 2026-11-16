// Shared mock utilities
export const delay = (ms = 250) => new Promise<void>(res => setTimeout(res, ms))

export function generateId(): string {
  return crypto.randomUUID()
}

export function nowISO(): string {
  return new Date().toISOString()
}
