import API from 'microtick'

var proto = "ws://"
if (window.location.protocol === "https:") {
  proto = "wss:"
}

const config = {
  ws: proto + "//" + process.env.MICROTICK_WEBSOCKET,
  version: "v0.1.6"
}

const api = new API(config.ws)

export default api
