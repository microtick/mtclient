import API from 'mtapi'

const config = {
  ws: "ws://localhost:1320",
  version: "v0.1.6"
}

const api = new API(config.ws)

export default api
