import * as Actions from '../actions'
const objectAssign = require('object-assign')

export default {
  [Actions.FETCH_DOMAINS_FAILED]: (state: any = {}, action) => {
    return objectAssign({}, state, {
      err: action.payload
    })
  },
  [Actions.GOT_DOMAINS]: (state: any = {}, action) => {
    return objectAssign({}, state, {
      domains: action.payload
    })
  },
  [Actions.DOMAIN_SELECTED]: (state: any = {}, action) => {
    return objectAssign({}, state, {
      selectedDomain: action.payload
    })
  }
}
