export type AuthTokenResponse = {
  accessToken: string
  tokenType: string
  expiresAtUtc: string
  role: string
  username: string
  displayName: string
}

export type AdminSessionResponse = {
  username: string
  role: string
  email: string | null
  displayName: string | null
}

export type AuthSession = {
  accessToken: string
  tokenType: string
  expiresAtUtc: string
  user: {
    username: string
    role: string
    email: string | null
    displayName: string | null
  }
}

export type LoginInput = {
  username: string
  password: string
}
