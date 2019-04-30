import API from './mtapi'

const config = {
  tm: "http://127.0.0.1:26657",
  cosmos: "http://127.0.0.1:1317",
  faucet: "http://127.0.0.1:3000",
  version: "v0.1.6"
}

const api = new API(config.tm, config.cosmos, config.faucet)

export default api
