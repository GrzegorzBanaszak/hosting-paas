import { apiFetch } from '../../../shared/api/http'
import type {
  DeploymentHistoryItem,
  RepositoryItem,
  SaveRepositoryInput,
} from '../model/types'

function mapSavePayload(input: SaveRepositoryInput) {
  return {
    provider: input.provider,
    owner: input.owner.trim(),
    name: input.name.trim(),
    branch: input.branch.trim(),
    cloneUrl: input.cloneUrl.trim(),
    externalRepositoryId: input.externalRepositoryId.trim() || null,
    webhookSecret: input.webhookSecret.trim() || null,
  }
}

export function fetchRepository(appId: string) {
  return apiFetch<RepositoryItem>(`/api/apps/${appId}/repository`)
}

export function saveRepository(appId: string, input: SaveRepositoryInput) {
  return apiFetch<RepositoryItem>(`/api/apps/${appId}/repository`, {
    method: 'PUT',
    body: JSON.stringify(mapSavePayload(input)),
  })
}

export function removeRepository(appId: string) {
  return apiFetch<void>(`/api/apps/${appId}/repository`, {
    method: 'DELETE',
  })
}

export function fetchDeploymentHistory(appId: string) {
  return apiFetch<DeploymentHistoryItem[]>(`/api/apps/${appId}/deployments`)
}
