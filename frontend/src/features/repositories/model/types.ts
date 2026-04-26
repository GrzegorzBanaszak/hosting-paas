export type RepositoryProvider = 'GitHub'

export type RepositoryItem = {
  id: string
  appId: string
  provider: RepositoryProvider
  owner: string
  name: string
  branch: string
  cloneUrl: string
  externalRepositoryId: string | null
  hasWebhookSecret: boolean
  connectedAtUtc: string
  webhookPath: string
}

export type SaveRepositoryInput = {
  provider: RepositoryProvider
  owner: string
  name: string
  branch: string
  cloneUrl: string
  externalRepositoryId: string
  webhookSecret: string
}

export type DeploymentHistoryItem = {
  id: string
  appId: string
  repositoryId: string | null
  status: string
  trigger: string
  pipelineStage: string
  branch: string
  commitSha: string | null
  artifactReference: string | null
  failureReason: string | null
  createdAtUtc: string
  startedAtUtc: string | null
  finishedAtUtc: string | null
}
