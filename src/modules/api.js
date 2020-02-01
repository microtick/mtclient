import API from 'mtapi'

const config = {
  ws: process.env.MICROTICK_WEBSOCKET,
  version: "v0.1.6"
}

const api = new API(config.ws)

export default api
