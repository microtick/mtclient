import API from 'microtick'

var proto = "ws:"
if (window.location.protocol === "https:") {
  proto = "wss:"
}

const urlParams = new URLSearchParams(window.location.search)
const apiServer = urlParams.get('apiServer')

const url = apiServer !== null ? apiServer : proto + "//" + process.env.MICROTICK_WEBSOCKET

const config = {
  ws: url,
  version: "v0.1.6"
}

const api = new API(config.ws)

export default api
