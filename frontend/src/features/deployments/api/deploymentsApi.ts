import { apiFetch } from '../../../shared/api/http'
import type { AppLogEntry, DeploymentQueueItem, QueueDeploymentInput } from '../model/types'

function mapQueuePayload(input: QueueDeploymentInput) {
  return {
    commitSha: input.commitSha.trim(),
    branch: input.branch?.trim() || null,
  }
}

export function queueRedeploy(appId: string, input: QueueDeploymentInput) {
  return apiFetch<DeploymentQueueItem>(`/api/apps/${appId}/deployments/redeploy`, {
    method: 'POST',
    body: JSON.stringify(mapQueuePayload(input)),
  })
}

export function fetchAppLogs(appId: string, limit = 50) {
  return apiFetch<AppLogEntry[]>(`/api/apps/${appId}/runtime/logs?limit=${limit}`)
}
