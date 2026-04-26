export const appStatuses = [
  'Draft',
  'Stopped',
  'Starting',
  'Running',
  'Degraded',
  'Failed',
  'Archived',
] as const

export type AppStatus = (typeof appStatuses)[number]

export type AppDomain = {
  id: string
  hostname: string
  isPrimary: boolean
  status: string
  createdAtUtc: string
}

export type AppItem = {
  id: string
  name: string
  slug: string
  description: string | null
  status: AppStatus
  port: number | null
  buildCommand: string | null
  startCommand: string
  projectRootPath: string | null
  healthCheckPath: string
  primaryHostname: string | null
  hasRepository: boolean
  deploymentCount: number
  domainCount: number
  createdAtUtc: string
  updatedAtUtc: string
  domains: AppDomain[]
}

export type SaveAppInput = {
  name: string
  slug: string
  description: string
  status: AppStatus
  port: string
  buildCommand: string
  startCommand: string
  projectRootPath: string
  healthCheckPath: string
  primaryHostname: string
}
