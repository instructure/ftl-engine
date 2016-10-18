import * as Actions from '../actions'
const objectAssign = require('object-assign')
export default {
  [Actions.GRAPH_LOADED]: (state: any = {}, action) => {
    return objectAssign({}, state, {
      loadedGraph: action.payload
    })
  }
}
