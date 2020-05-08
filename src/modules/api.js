import API from 'microtick'

const config = {
  ws: "ws://" + process.env.MICROTICK_WEBSOCKET,
  version: "v0.1.6"
}

const api = new API(config.ws)

export default api
