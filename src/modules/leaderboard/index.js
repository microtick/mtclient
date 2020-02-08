import store from '../../store'
import axios from 'axios'
import api from '../api'

import {createRegisterNotification, 
        createSuccessNotification,
        createErrorNotification,
        removeNotification} from '../notifications'

const MENU = 'app/menu'
const LEADERBOARD = 'leaderboard/info'
const CHANGEADDRESS = "leaderboard/change"

const globals = {}

const initialState = {
  loading: true
}

export default (state = initialState, action) => {
  switch (action.type) {
    case MENU:
      globals.page = action.target
      if (action.target === 'leaderboard') {
        getLeaderboardData()
      }
      return {
        ...state,
        loading: true
      }
    case LEADERBOARD:
      return {
        ...state,
        loading: false,
        total: action.total,
        reward: action.reward,
        fee: action.fee,
        endTime: action.endTime,
        registeredAddress: action.registeredAddress,
        leaders: action.leaders
      }
    case CHANGEADDRESS:
      return {
        ...state,
        registeredAddress: null
      }
    default:
      return state
  }
}

export const registerAccount = async memo => {
  try {
    const wallet = await api.getWallet()
  
    //console.log("registering with: " + JSON.stringify(info))
  
    //console.log("memo=" + memo)
    const envelope = await api.postEnvelope()
    const amount = ""  + (globals.endpoint.fee * 1000000)
    
    const registrationData = {
      tx: {
        msg: [
          {
            type: "cosmos-sdk/MsgSend",
            value: {
              from_address: wallet.acct,
              to_address: globals.endpoint.leaderboardAccount,
              amount: [
                {
                  amount: amount,
                  denom: "kits"
                }
              ]
            }
          }
        ],
        fee: {
          amount: [],
          gas: "200000"
        },
        signatures: null,
        memo: memo
      }
    }
  
    var notId = createRegisterNotification(store.dispatch, memo)
    await api.postTx(Object.assign(registrationData, envelope))
    //console.log("Result=" + JSON.stringify(tx, null, 2))
    setTimeout(() => {
      removeNotification(store.dispatch, notId)
    }, 1500)
    createSuccessNotification(store.dispatch, 1750, notId)
    getLeaderboardData()
  } catch (err) {
    if (notId !== undefined) removeNotification(store.dispatch, notId)
    console.log(err)
    createErrorNotification(store.dispatch, err.message)
  }
}

export const changeAddress = () => {
  store.dispatch({
    type: CHANGEADDRESS
  })
}

const getLeaderboardData = async () => {
  const wallet = await api.getWallet()
  const endpoint = await axios.get(process.env.MICROTICK_LEADERBOARD + "/endpoint/" + wallet.acct)
  globals.endpoint = endpoint.data
  
  const leaders = await axios.get(process.env.MICROTICK_LEADERBOARD + "/leaderboard/0")
  //console.log("leaders: " + JSON.stringify(leaders.data))
  const data = {
    type: LEADERBOARD,
    total: endpoint.data.totalAccounts,
    reward: endpoint.data.reward,
    fee: endpoint.data.fee,
    endTime: endpoint.data.endTime,
    registeredAddress: endpoint.data.current,
    leaders: leaders.data
  }
  store.dispatch(data)
}
