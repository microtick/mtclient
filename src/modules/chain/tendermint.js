import store from '../../store'
import api from '../api'

export const BLOCK = 'tendermint/newblock'
export const ACCOUNTLIST = 'tendermint/accountlist'
export const CLOCKTICK = 'tendermint/clocktick'
export const PROVIDER = 'tendermint/provider'

const initialState = {
  app: {
    version: "0.1", //config.version,
    timestamp: 0
  },
  block: {
    number: 0,
    hash: '',
    timestamp: 0
  },
  provider: {
    url: "none",
    edit: false
  }
}

export default (state = initialState, action) => {
  switch (action.type) {
    case CLOCKTICK:
      return {
        ...state,
        app: {
          ...state.app,
          timestamp: action.value
        }
      }
    case BLOCK:
      return {
        ...state,
        block: {
          number: action.block.number,
          hash: action.block.hash,
          timestamp: action.block.timestamp
        }
      }
    case ACCOUNTLIST:
      return {
        ...state,
        accounts: action.accounts
      }
    case PROVIDER:
      return {
        ...state,
        provider: {
          url: action.edit ? state.provider.url : action.url,
          edit: action.edit
        }
      }
    default:
      return state
  }
}

export const init = async () => {
  /*
  const checkProvider = document.cookie.split(';').filter(item => {
    return item.indexOf('mtm.provider=') >= 0
  }).map(item => {
    return item.slice(item.indexOf('=') + 1)
  })
  if (checkProvider.length > 0) {
    await api.setProvider(checkProvider[0])
    store.dispatch({
      type: PROVIDER,
      edit: false,
      url: checkProvider[0]
    })
  }
  */
  console.log("Creating web socket")
  var lasttime = 0
  var lastlocal = 0
  api.subscribe("tm.event='NewBlock'", message => {
    try {
      lasttime = new Date(message.value.block.header.time).getTime() / 1000
      lastlocal = new Date().getTime() / 1000
      store.dispatch({
        type: BLOCK,
        block: {
          number: parseInt(message.value.block.header.height, 10),
          timestamp: lasttime,
          hash: message.value.block.header.last_block_id.hash
        }
      })
    } catch (err) {
    }
  })
  
  setInterval(() => {
    const cur = new Date().getTime() / 1000
    store.dispatch({
      type: CLOCKTICK,
      value: (cur - lastlocal) + lasttime
    })
  }, 1000)
  
  //const accts = await(await api.getAccounts())
  //store.dispatch({
    //type: ACCOUNTLIST,
    //accounts: accts.map(acct => {
      //return { value: acct, label: acct }
    //})
  //})
}

/*
export const setProvider = async status => {
  if (!status) {
    var provider = document.getElementById('providerInput').value
    console.log("new provider=" + provider)
    var res = await api.setProvider(provider)
    if (res) {
      document.cookie = "mtm.provider=" + provider + ";max-age=31536000;"
    }
  }
  store.dispatch({
    type: PROVIDER,
    edit: status,
    url: res ? provider : config.provider
  })
}
*/

init()
