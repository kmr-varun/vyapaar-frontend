import { mockSettings } from '../mock-data'
import type { AppSettings } from '../types'
import { delay } from './_mock'

export async function getSettings(): Promise<AppSettings> {
  await delay()
  return { ...mockSettings }
}

export async function updateSettings(data: Partial<AppSettings>): Promise<AppSettings> {
  await delay(400)
  Object.assign(mockSettings, data)
  return { ...mockSettings }
}
