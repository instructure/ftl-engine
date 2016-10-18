// electing to user superagent, as I can do cb style for now but transition to promises easily if
// I can stomach it
import * as superagent from 'superagent'
import { createAction, Action } from 'redux-actions'
import {getState, AllState} from '../types'

export const GOT_DOMAINS = 'gotDomains'
export const gotDomains = createAction(GOT_DOMAINS)

export const FETCH_DOMAINS_FAILED = 'fetchDomainsFailed'
export const fetchDomainsFailed = createAction(FETCH_DOMAINS_FAILED)

export const DOMAIN_SELECTED = 'selectedDomain'
export const domainSelected = createAction(DOMAIN_SELECTED)

export function getDomains() {
  return (dispatch, getState: getState) => {
    const state = getState()
    state.app.api.listDomains((err, data) => {
      if (err) return dispatch(fetchDomainsFailed(err.message))
      dispatch(gotDomains(data))
    })
  }
}
