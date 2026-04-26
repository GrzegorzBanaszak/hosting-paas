export type QueueDeploymentInput = {
  commitSha: string
  branch?: string
}

export type DeploymentQueueItem = {
  id: string
  appId: string
  repositoryId: string | null
  status: string
  trigger: string
  branch: string
  commitSha: string | null
  createdAtUtc: string
}

export type AppLogEntry = {
  id: string
  appId: string
  deploymentId: string | null
  level: string
  source: string
  message: string
  timestampUtc: string
}
