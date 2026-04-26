import { apiFetch } from '../../../shared/api/http'
import type { AppItem, SaveAppInput } from '../model/types'

function mapSavePayload(input: SaveAppInput) {
  return {
    name: input.name.trim(),
    slug: input.slug.trim(),
    description: input.description.trim() || null,
    status: input.status,
    port: input.port.trim() ? Number(input.port.trim()) : null,
    buildCommand: input.buildCommand.trim() || null,
    startCommand: input.startCommand.trim(),
    projectRootPath: input.projectRootPath.trim() || null,
    healthCheckPath: input.healthCheckPath.trim(),
    primaryHostname: input.primaryHostname.trim() || null,
  }
}

export function fetchApps() {
  return apiFetch<AppItem[]>('/api/apps')
}

export function fetchAppById(appId: string) {
  return apiFetch<AppItem>(`/api/apps/${appId}`)
}

export function createApp(input: SaveAppInput) {
  return apiFetch<AppItem>('/api/apps', {
    method: 'POST',
    body: JSON.stringify(mapSavePayload(input)),
  })
}

export function updateApp(appId: string, input: SaveAppInput) {
  return apiFetch<AppItem>(`/api/apps/${appId}`, {
    method: 'PUT',
    body: JSON.stringify(mapSavePayload(input)),
  })
}

export function deleteApp(appId: string) {
  return apiFetch<void>(`/api/apps/${appId}`, {
    method: 'DELETE',
  })
}
