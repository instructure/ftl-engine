import {getDomains, createApi} from '../actions'
import Api from '../api'

export default function initialActions(store) {
  store.dispatch(createApi(new Api()))
  store.dispatch(getDomains())
}
