import {getDomains} from '../actions/domain'

export default function initialActions(store) {
  store.dispatch(getDomains())
}
