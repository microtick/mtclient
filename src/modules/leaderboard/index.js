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

const globals = { }

const initialState = {
  loading: true,
  active: false
}

export default (state = initialState, action) => {
  switch (action.type) {
    case MENU:
      globals.page = action.target
      if (action.target === 'leaderboard') {
        getLeaderboardData(0)
      }
      return {
        ...state,
        loading: true
      }
    case LEADERBOARD:
      return {
        ...state,
        loading: false,
        active: action.active,
        total: action.total,
        pages: action.totalPages,
        reward: action.reward,
        fee: action.fee,
        startTime: action.startTime,
        endTime: action.endTime,
        updateInterval: action.updateInterval,
        registeredAddress: action.registeredAddress,
        leaders: action.leaders,
        page: action.page
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
    getLeaderboardData(0)
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

export const getLeaderboardData = async page => {
    
  const update = async () => {
    try {
      const wallet = await api.getWallet()
      const endpoint = await axios.get(process.env.MICROTICK_LEADERBOARD + "/endpoint/" + wallet.acct)
      globals.endpoint = endpoint.data
    
      const leaders = await axios.get(process.env.MICROTICK_LEADERBOARD + "/leaderboard/" + page)
      //console.log("leaders: " + JSON.stringify(leaders.data))
      const startTime = new Date(globals.endpoint.startTime)
      const startTimeString = startTime.toLocaleDateString() + " " + startTime.toLocaleTimeString() 
      const endTime = new Date(globals.endpoint.endTime)
      const endTimeString = endTime.toLocaleDateString() + " " + endTime.toLocaleTimeString() 
      const data = {
        type: LEADERBOARD,
        active: globals.endpoint.active,
        total: globals.endpoint.totalAccounts,
        totalPages: globals.endpoint.totalPages,
        reward: globals.endpoint.reward,
        fee: globals.endpoint.fee,
        startTime: startTimeString,
        endTime: endTimeString,
        updateInterval: globals.endpoint.updateInterval,
        registeredAddress: globals.endpoint.current,
        leaders: leaders.data,
        page: page
      }
      store.dispatch(data)
    } catch (err) {
      console.log(err)
      store.dispatch({
        type: LEADERBOARD,
        active: false
      })
    }
    
    if (globals.endpoint !== undefined) {
      globals.updater = setTimeout(update, globals.endpoint.updateInterval * 1000)
    }
  }
  
  if (globals.updater !== undefined) {
    clearTimeout(globals.updater)
    delete globals.updater
  }
  
  update()
}
