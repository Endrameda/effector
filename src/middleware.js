//@flow

import {
  createStore,
  type StoreCreator,
  type Reducer,
  type Middleware,
  type Dispatch,
} from 'redux'

import {type Carrier, is} from './carrier/carrier'
import type {Domain} from './domain'
import {Store} from './store'
import {incSeq} from './id'

function middleware<State>({
  store,
  // dispatch,
  getState,
  next,
  data,
}: {
  store: Store<State>,
  dispatch: Dispatch,
  getState: () => State,
  next: *,
  data: Carrier<any>,
}) {
  const unwrapped = data.plain()
  next(unwrapped)
  store.seq = incSeq(store.seq)
  store.update$.next({data, state: getState()})
  data.dispose.disposed(data.payload)
  return data
}

function middlewareCurry<State>(
  store: Store<State>
): Middleware<State> {
  return ({dispatch, getState}) => (next) => (data) => {
    if (!is(data)) return next(data)
    if (!store.uniq.isUniq(data)) return
    return middleware({
      dispatch, getState, next, data, store,
    })
  }
}

export function effectorEnhancer<T>(
  domains: Array<Domain<T>> = [],
  storeContext: Store<T>
) {
  return (createStore: StoreCreator<T>): StoreCreator<T> => (
    reducer, preloadedState, enhancer
  ): $todo => {
    //console.error('effect enhancer')
    storeContext.scopeName = []
    const store = createStore(reducer, preloadedState, enhancer)
    storeContext.injector.setStore(store)
    let dispatch = store.dispatch

    const middlewareAPI = {
      getState: () => (console.log(store.getState()), store.getState()),
      dispatch: (action) => dispatch(action)
    }
    dispatch = middlewareCurry(storeContext)(middlewareAPI)(store.dispatch)
    storeContext.dispatch = dispatch
    storeContext.stateGetter = middlewareAPI.getState
    //storeContext.reduxSubscribe = store.subscribe
    //storeContext.getState = storeContext.stateGetter
    //storeContext.subscribe = storeContext.reduxSubscribe
    //storeContext.replaceReducer = store.replaceReducer
    domains.forEach(dom => storeContext.connect(dom))
    return {
      // ...storeContext,
      ...store,
      ...middlewareAPI,
      dispatch,
      // stateGetter: store.getState,
      // reduxSubscribe: store.subscribe
    }
  }
}

export function getStore<State>(
  description: string,
  reducer: Reducer<State>,
): Store<State> {
  const store: Store<State> = new Store
  const storeContext = createStore(
    reducer,
    effectorEnhancer([], store)
  )
  store.scopeName = [description]
  store.injector.saveStatic(reducer)
  // store.subscribe(() => { storeContext.state$.next(store.getState()) })
  return store
}


