import microtick from 'mtapi'

var proto = "ws:"
if (window.location.protocol === "https:") {
  proto = "wss:"
}

const urlParams = new URLSearchParams(window.location.search)
const apiServer = urlParams.get('apiServer')

const url = apiServer !== null ? apiServer : proto + "//" + process.env.MICROTICK_WEBSOCKET

const config = {
  ws: url,
  version: "v2.0.0"
}

const api = new microtick()
api.setUrl(config.ws)

export default api
