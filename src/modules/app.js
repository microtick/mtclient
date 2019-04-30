import store from '../store'

const MENU = 'app/menu'

const initialState = {
  menu: {
    selected: 'trading'
  },
  constants: {
    UNIT_PRECISION: -4,
    TOKEN_PRECISION: -6,
    SPOT_PRECISION: -4
  }
}

export const menuSelected = target => {
  return dispatch => {
    dispatch({
      type: MENU,
      target: target
    })
  }
}

export const selectMenu = page => {
  store.dispatch({
    type: MENU,
    target: page
  })
}

export default (state = initialState, action) => {
  switch (action.type) {
    case MENU:
      return {
        ...state,
        menu: {
          selected: action.target
        }
      }
    default:
      return state
  }
}