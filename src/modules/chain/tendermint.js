import store from '../../store'
import api from '../api'

export const BLOCK = 'tendermint/newblock'
export const ACCOUNTLIST = 'tendermint/accountlist'
export const CLOCKTICK = 'tendermint/clocktick'
export const PROVIDER = 'tendermint/provider'

const initialState = {
  app: {
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
  var lasttime = 0
  var lastlocal = 0
  api.subscribe("tm.event='NewBlock'", message => {
    try {
      lasttime = new Date(message.data.value.block.header.time).getTime() / 1000
      lastlocal = new Date().getTime() / 1000
      store.dispatch({
        type: BLOCK,
        block: {
          number: parseInt(message.data.value.block.header.height, 10),
          timestamp: lasttime,
          hash: message.data.value.block.header.last_block_id.hash
        }
      })
    } catch (err) {
      console.log("Block error")
    }
  })
  
  setInterval(() => {
    const cur = new Date().getTime() / 1000
    store.dispatch({
      type: CLOCKTICK,
      value: (cur - lastlocal) + lasttime
    })
  }, 1000)
  
}
