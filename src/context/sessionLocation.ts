const API_PORT = '8000'

export type SessionLocation = {
  apiBaseUrl: string
  clientOrigin: string
  clientHost: string
  clientHostname: string
  clientPort: string
}

export const getLocationContext = (): SessionLocation => {
  const { protocol, origin, host, hostname, port } = window.location

  return {
    apiBaseUrl: `${protocol}//${hostname}:${API_PORT}`,
    clientOrigin: origin,
    clientHost: host,
    clientHostname: hostname,
    clientPort: port
  }
}
