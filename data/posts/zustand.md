- 오늘은 최근 많은 인기를 얻고 있는 Zustand에 대해서 알아보려 합니다.
- 저는 초기에 Redux, Redux-thunk를 사용해서 client + server 상태를 모두 관리 했었는데요, 프로젝트 규모에 비해 boiler-plate가 너무 불편했고, client와 server상태를 redux에서 모두 관리하다보니 불편함이 있었습니다.
- 그래서 recoil + react-query 조합으로 client 상태는 recoil에서, server상태는 react-query를 통해 관리하면서 상태 분리, boiler-plate등의 감소로 개발 경험이 훨씬 좋아졌었습니다.
- recoil도 충분히 간편하지만 점차 느려지는 업데이트와 Zustand의 흥행으로 Zustand를 파헤쳐보고 사용해보려 합니다.

---

# 1. What is the Zustand?

- [공식문서](https://docs.pmnd.rs/zustand/getting-started/introduction)에서는 다음과 같이 소개하고 있습니다.
    
    ![image](https://github.com/Gi-Youn-Oh/Next.js_Blog/assets/109953972/982af7c3-1132-40f3-b211-ff097b51201c)
    
- 작고, 빠르며, 훅에 기반한 API, 그리고 render 과정에서 일어나는 여러 문제들을 해결해주는 상태관리 라이브러리이다.
- [다양한 상태 관리 라이브러리들과 비교한 문서](https://docs.pmnd.rs/zustand/getting-started/comparison)도 찾아볼 수 있는데 Zustand가 얼만큼 자신감이 있는지 느껴집니다.
- 제가 생각하는 장점은 가볍고, Hook기반 API를 사용하다보니 굉장히 쉬운 사용법과, React가 추구하는 불변성에 맞추어 있고, 무엇보다 기본 예제에서 보면 알겠지만 Context를 감싸지 않고 개별 store를 생성할 수 있다는 점입니다. (물론 Next.js와 같은 framework에서는 감싸줘야합니다.)

---

# 2. Basic Usages

## 2-1. In React Project

- React 프로젝트에서는 Context를 감싸줄 필요 없이 개별 Store를 생성하고 가져다 사용하면 끝이다.

### 1) store 생성

- initial data
- API
    
    ```jsx
    import create from 'zustand';
    
    const useStore = create(set => ({
    	// initail State
      count: 0,
      // API
      increment: () => set(state => ({ count: state.count + 1 })),
      decrement: () => set(state => ({ count: state.count - 1 })),
    }));
    ```
    

### 2) useStore

- using in component
    
    ```jsx
    import React from 'react';
    // useStoreWithEqualityFn()
    import { useStore } from './store'; 
    	
    function Counter() {
    	// using state, api
      const { count, increment, decrement } = useStore();
      return (
        <div>
          <p>Count: {count}</p>
          <button onClick={increment}>+</button>
          <button onClick={decrement}>-</button>
        </div>
      );
    }
    
    export default Counter;
    ```
    

## 2-2. In Next.js Project

- 두개의 개별 store를 생성하는 예시로 만들어 보았다.

### 1) store 생성 (동일)

- initial data
- api
- 여기서 차이점은 store를 create 함수가 아닌 createStore로 생성해야 한다는 것이다.
    - create함수는 Hook을 반환하고 createStore는 Store(객체)를 반환하기 때문에 createStore를 통해 생성해야 한다.
    
    ```jsx
    import { createStore } from 'zustand/vanilla'
    
    export type CounterState = {
      count: number
      testValue: string
    }
    
    export type CounterActions = {
      decrementCount: () => void
      incrementCount: () => void
    }
    
    export type CounterStore = CounterState & CounterActions
    
    export const defaultInitState: CounterState = {
      count: 0,
      testValue: 'test',
    }
    
    export const createCounterStore = (
      initState: CounterState = defaultInitState,
    ) => {
      return createStore<CounterStore>()((set) => ({
        ...initState,
        decrementCount: () =>
          set((state) => {
            console.log('render')
            return { count: state.count - 1 }
          }),
        incrementCount: () => set((state) => ({ count: state.count + 1 })),
      }))
    }
    
    ```
    
    ```jsx
    import { createStore } from 'zustand/vanilla'
    
    export type AnotherState = {
      count: number
      testValue: string
    }
    
    export type AnotherActions = {
      decrementCount: () => void
      incrementCount: () => void
    }
    
    export type AnotherStore = AnotherState & AnotherActions
    
    export const defaultInitState: AnotherState = {
      count: 10,
      testValue: 'another',
    }
    
    export const createAnotherStore = (
      initState: AnotherState = defaultInitState,
    ) => {
      return createStore<AnotherStore>()((set) => ({
        ...initState,
        decrementCount: () =>
          set((state) => {
            return { count: state.count - 1 }
          }),
        incrementCount: () => set((state) => ({ count: state.count + 1 })),
      }))
    }
    
    ```
    

### 2) Provider

- Next.js에서는 SSR을 위해서 초기 상태를 공유하고 hydration을 위해  Context로 감싸줘야 한다. (이전 children pattern에서 살펴봤던 내용과 동일하다.)
- 두 개의 개별 store를  제공할 provider wrapper를 생성한다.
    
    ```jsx
    // store-provider.tsx
    'use client'
    
    import { createContext, useRef, useContext, ReactNode } from 'react'
    import { AnotherStore, createAnotherStore } from 'shared/store/another-store'
    import { CounterStore, createCounterStore } from 'shared/store/couter-store'
    import { StoreApi, useStore } from 'zustand'
    
    export interface StoreProviderProps {
      children: ReactNode
    }
    
    type CombinedStore = {
      counterStore: StoreApi<CounterStore>
      anotherStore: StoreApi<AnotherStore>
    }
    
    const StoreContext = createContext<CombinedStore | null>(null)
    
    export const ExampleStoreProvider = ({ children }: StoreProviderProps) => {
      const counterStoreRef = useRef<StoreApi<CounterStore>>()
      const anotherStoreRef = useRef<StoreApi<AnotherStore>>()
    
      if (!counterStoreRef.current) {
        counterStoreRef.current = createCounterStore()
      }
      if (!anotherStoreRef.current) {
        anotherStoreRef.current = createAnotherStore()
      }
    
      const stores = {
        counterStore: counterStoreRef.current,
        anotherStore: anotherStoreRef.current,
      }
    
      return (
        <StoreContext.Provider value={stores}>
          {children}
        </StoreContext.Provider>
      )
    }
    
    export const useCountStore = <T,>(selector: (store: CounterStore) => T): T => {
      const storeContext = useContext(StoreContext)
      if (!storeContext) {
        throw new Error('useCounterStore must be used within StoreProvider')
      }
      // useStoreWithEqualityFn()
      return useStore(storeContext.counterStore, selector)
    }
    
    export const useAnotherStore = <T,>(selector: (store: AnotherStore) => T): T => {
      const storeContext = useContext(StoreContext)
      if (!storeContext) {
        throw new Error('useAnotherStore must be used within StoreProvider')
      }
      // useStoreWithEqualityFn()
      return useStore(storeContext.anotherStore, selector)
    }
    ```
    

### 3) Using in Client Component

- 이후 사용 방법은 동일하다.
    
    ```jsx
    'use client'
    
    import { useAnotherStore } from "app/provider/combine-store-provider"
    
    export const AnotherCouneter = () => {
      const { count, incrementCount, decrementCount } = useAnotherStore(
        (state) => state,
      )
    
      return (
        <div>
          Count: {count}
          <hr />
          <button type="button" onClick={() => void incrementCount()}>
            Increment Count
          </button>
          <button type="button" onClick={() => void decrementCount()}>
            Decrement Count
          </button>
        </div>
      )
    }
    ```
    

## 2-3) Work

- zustand는 redux의 flux패턴을 이어 받아 단방향으로 상태관리가 이루어지며, create함수를 통해 store를 생성한다.
- 해당 상태를 구독(사용)하려면 create함수를 통해 만들어 놓은 store를 가져다 사용하기만 하면 자동 subcribe가 되며, subcribe된 (useStore를 사용중인) 함수들에 대하여 업데이트(re-render)가 이루어진다.
- 어떻게 이렇게 zustand가 store를 생성하고, 업데이트를 알려주는지 자세히 파헤쳐보자.

---

# 3. Deep dive

- Zustand 공식 github 내부 코드를 따라가보면 핵심 코드를 vanilla.ts에서 찾아볼 수 있다.

https://github.com/pmndrs/zustand/blob/main/src/vanilla.ts#L105

### Before to dive → Object.assign()

- **`Object.assign`**는 자바스크립트에서 객체를 병합하는 데 사용되는 메서드입니다.
- 하나 이상의 소스 객체의 모든 열거 가능한 속성을 대상 객체에 복사합니다. 이 과정에서 원래의 대상 객체가 변경됩니다.
- **불변성 유지**: 원래 객체들을 수정하지 않고 새로운 객체를 생성하기 때문에 상태 변화의 추적이 용이합니다.
- **명확성**: 상태 변화를 명확히 보여주며, 디버깅이 쉬워집니다.

**Basic Example**

```jsx
const state = { a: 1, b: 2 };
const nextState = { b: 3, c: 4 };

const newState = Object.assign({}, state, nextState);

console.log(newState); // { a: 1, b: 3, c: 4 }
```

- **newState**는 **{ a: 1, b: 3, c: 4 }**가 됩니다. **state**의 **b** 속성은 **nextState**의 **b** 속성으로 덮어쓰여 **3**이 되고, 새로운 **c** 속성이 추가됩니다.
    1. **빈 객체 `{}`를 생성**: 새로운 객체를 생성하여 대상 객체로 사용합니다.
    2. **`state` 객체의 모든 속성을 빈 객체로 복사**: 기존 상태 객체의 속성을 모두 새 객체로 복사합니다.
    3. **`nextState` 객체의 모든 속성을 새 객체로 복사**: 새로운 상태 객체의 속성들을 기존 복사된 속성 위에 덮어씁니다.

## 3-1. Create

- create함수를 사용하면 내부적으로 createWithEqualityFnImpl() 가 실행되며 큰 그림 순서로 보면 다음과 같습니다.
    1. createState(initialState)기반으로 api 생성하고 store를 반환한다.
    2. react와 zustand를 연결한다. 
    3. 해당 store를 binding후 외부로 반환한다.
        
        ```jsx
          const createWithEqualityFnImpl = <T>(
            createState: StateCreator<T, [], []>,
            defaultEqualityFn?: <U>(a: U, b: U) => boolean,
          ) => {
            const api = createStore(createState) // createStore를 기반으로 store를 생성하고 관련 api생성 (getState, setState ...)
          
            const useBoundStoreWithEqualityFn: any = ( 
              selector?: any,
              equalityFn = defaultEqualityFn,
            ) => useStoreWithEqualityFn(api, selector, equalityFn) // react <-> zustand(store)연결 및 구독
          
            Object.assign(useBoundStoreWithEqualityFn, api) // api -> useBoundStore할당
          
            return useBoundStoreWithEqualityFn
          }
          
        ```
        

### 1) createStoreImpl()

- state, listeners 지역변수이며, setState(), getState(), getInitialState(), subscribe(), destroy() 클로저 생성
    - state, listeners를 가진 5개의 api를 closure로 반환
    
    ```tsx
    const createStoreImpl: CreateStoreImpl = (createState) => {
      type TState = ReturnType<typeof createState>
      type Listener = (state: TState, prevState: TState) => void
      let state: TState // 1. 초기 state = createState(setState, getState, api)
      const listeners: Set<Listener> = new Set() // 2. 이 store를 구독할 함수들
    
     // 3-1. setState
      const setState: StoreApi<TState>['setState'] = (partial, replace) => {
        const nextState =
          typeof partial === 'function'
            ? (partial as (state: TState) => TState)(state)
            : partial
        if (!Object.is(nextState, state)) {
          const previousState = state
          state =
            replace ?? (typeof nextState !== 'object' || nextState === null)
              ? (nextState as TState)
              : Object.assign({}, state, nextState)
          listeners.forEach((listener) => listener(state, previousState))
        }
      }
    	// 3-2. getState
      const getState: StoreApi<TState>['getState'] = () => state
    	// 3-3. getInitialState
      const getInitialState: StoreApi<TState>['getInitialState'] = () =>
        initialState
    	// 3-4. subscribe
      const subscribe: StoreApi<TState>['subscribe'] = (listener) => {
        listeners.add(listener)
        // Unsubscribe
        return () => listeners.delete(listener)
      }
    	// 3-5. destroy()
      const destroy: StoreApi<TState>['destroy'] = () => {
        if (import.meta.env?.MODE !== 'production') {
          console.warn(
            '[DEPRECATED] The `destroy` method will be unsupported in a future version. Instead use unsubscribe function returned by subscribe. Everything will be garbage-collected if store is garbage-collected.',
          )
        }
        listeners.clear()
      }
    
      const api = { setState, getState, getInitialState, subscribe, destroy }
      const initialState = (state = createState(setState, getState, api))
      return api as any
    }
    
    ```
    
- 따라서 create함수를 실행할때 set뿐만 아니라 get, api를 인자로 받아 store를 생성할 수도 있으며,
    
    ![image](https://github.com/Gi-Youn-Oh/Next.js_Blog/assets/109953972/6ec91648-2263-463e-9ec8-cf2279112b25)
    
    ![image](https://github.com/Gi-Youn-Oh/Next.js_Blog/assets/109953972/85a8b8ba-bb9a-47a7-ae6d-77368e557d57)

- store자체에 bind된 api가 있기 때문에 내부 함수를 직접 호출해도 된다.
    
    ![image](https://github.com/Gi-Youn-Oh/Next.js_Blog/assets/109953972/45a45e81-c434-4345-9b26-2a590f8fc2fb)

    ![image](https://github.com/Gi-Youn-Oh/Next.js_Blog/assets/109953972/db9db207-684c-425e-9ad6-ef06c8ee03ef)  

### 1-1) setState()

- createState ⇒ create함수의 인자
    
    ```tsx
    // 이때의 set이 setState()
    (set) => ({
      bears: 0,
      increasePopulation: () => set((state) => ({ bears: state.bears + 1 })),
      removeAllBears: () => set({ bears: 0 }),
    })
    
    const initialState = (state = createState(setState, getState, api))
    ```
    
- 코드 분석
    
    ```tsx
     // 3-1. setState
    const setState: StoreApi<TState>['setState'] = (partial, replace) => {
      // 'partial'의 타입에 따라 다음 상태를 결정합니다.
      const nextState =
        typeof partial === 'function'
          ? (partial as (state: TState) => TState)(state) // 'partial'이 함수이면 현재 상태를 인수로 호출합니다.
          : partial; // 'partial'이 객체이면 이를 다음 상태로 사용합니다.
    
      // 다음 상태가 현재 상태와 다른지 확인합니다.
      if (!Object.is(nextState, state)) {
        const previousState = state; // 이전 상태를 저장합니다.
    
        // 상태를 업데이트합니다. 전체를 교체하거나 부분 상태 객체와 병합합니다.
        state =
          replace ?? (typeof nextState !== 'object' || nextState === null)
            ? (nextState as TState) // 'replace'가 true이거나 'nextState'가 객체가 아닌 경우 상태를 교체합니다.
            : Object.assign({}, state, nextState); // 부분 상태 객체를 현재 상태와 병합합니다.
    
        // 상태 변경을 모든 등록된 리스너에게 알립니다.
        listeners.forEach((listener) => listener(state, previousState));
      }
    };
    
    ```
    
- replace는 boolean이며, 보통 생략 (false default) 하며 true로 설정할 시 완전히 값이 대체된다.
    
    ![image](https://github.com/Gi-Youn-Oh/Next.js_Blog/assets/109953972/63afb265-baf5-488b-ae1f-384458224510)
    

### 2) useStore()

- useStore를 통하여 특정 state, api만 구독할 수 있고, shallow option을 사용할 수 있다.
  
    ![image](https://github.com/Gi-Youn-Oh/Next.js_Blog/assets/109953972/cb4636ec-fd12-459d-b670-f14b3cefbebd)
    
    ```tsx
    function BearCounter() {
    	// store전체 구독
    	const bears = useStore(bearStore)
    	// bears selector 해당 state만 구독
      const bears = useStore((state) => state.bears)
      // shallow 비교 현재는 useShallow훅으로 바뀜
       const bears = useStore((state) => state.bears, shallow);
      return <h1>{bears} around here...</h1>
    }
    
    function Controls() {
      const increasePopulation = useStore((state) => state.increasePopulation)
      return <button onClick={increasePopulation}>one up</button>
    }
    ```
    

### 3) useStoreWithEqualityFn()

- Zustand에서는 useStore()를 통해 해당 store를 구독하고 사용할 수 있다.
- React와 Zustand를 연결해주는 함수로서 useStore를 사용하게 되면 동작하는 함수이다.
- 앞서 생성한 closure (api)를 넘겨준다.
    
    ```jsx
    export function useStoreWithEqualityFn<TState, StateSlice>(
      api: WithReact<StoreApi<TState>>,
      selector: (state: TState) => StateSlice = identity as any,
      equalityFn?: (a: StateSlice, b: StateSlice) => boolean,
    ) {
      const slice = useSyncExternalStoreWithSelector(
        api.subscribe,
        api.getState,
        api.getServerState || api.getInitialState,
        selector,
        equalityFn,
      )
      useDebugValue(slice)
      return slice
    }
    
    ```
    

### 3-1) useSyncExternalStore() & tearing

- https://github.com/facebook/react/blob/dddfe688206dafa5646550d351eb9a8e9c53654a/packages/use-sync-external-store/src/useSyncExternalStoreWithSelector.js
- https://github.com/facebook/react/blob/dddfe688206dafa5646550d351eb9a8e9c53654a/packages/use-sync-external-store/src/useSyncExternalStoreShimClient.js
- useSyncExternalStore함수는 React Fiber Architecture를 도입하며 Concurrent Mode에서 tearing이 발생할 때 동기화 시켜주는 함수이다.
- 쉽게 말해서 외부 스토어의 초기값을 가지고 렌더링 도중 stratTransition과 같이 비동기로 store가 업데이트되고 각 컴포넌트가 초기 외부 스토어의 값과 업데이트된 외부 store의 값을 각각 갖게 될 수 있어 불일치 현상이 발생할 수 있다.
- Transition 업데이트가 발생할 때마다 React는 DOM에 변경을 적용하기 직전에 **`getSnapshot`**을 다시 호출합니다. 이때 처음 호출했을 때와 다른 값을 반환하면, React는 업데이트를 처음부터 다시 시작하여 차단 업데이트로 적용합니다. 이렇게 해서 화면에 있는 모든 컴포넌트가 store의 동일한 버전을 반영하도록 보장한다.
- Zustand에서는 useSyncExternalStoreWithSelector()를 사용하여 선택적으로 구독하지만 내부에서 useSyncExternalStore를 사용하는 것은 동일하므로 핵심 코드만 파악하고 넘어가자.
    
    ```jsx
    export function useSyncExternalStore<T>(
      subscribe: (() => void) => () => void,
      getSnapshot: () => T,
      getServerSnapshot?: () => T,
    ): T {
    
      const value = getSnapshot();
      const [{inst}, forceUpdate] = useState({inst: {value, getSnapshot}});
    
      useLayoutEffect(() => {
        inst.value = value;
        inst.getSnapshot = getSnapshot;
    
        if (checkIfSnapshotChanged(inst)) {
          // Force a re-render.
          forceUpdate({inst});
        }
      }, [subscribe, value, getSnapshot]);
    
      useEffect(() => {
        if (checkIfSnapshotChanged(inst)) {
          forceUpdate({inst});
        }
        const handleStoreChange = () => {
          if (checkIfSnapshotChanged(inst)) {
            // Force a re-render.
            forceUpdate({inst});
          }
        };
        // Subscribe to the store and return a clean-up function.
        return subscribe(handleStoreChange); // createStore로 생성한 subscribe -> listeners Set에 등록 -> setState호출 될때마다 실행
      }, [subscribe]);
    
      useDebugValue(value);
      return value;
    }
    
    function checkIfSnapshotChanged<T>(inst: {
      value: T,
      getSnapshot: () => T,
    }): boolean {
      const latestGetSnapshot = inst.getSnapshot; // closure getState()
      const prevValue = inst.value; // before update store
      try {
        const nextValue = latestGetSnapshot();
        return !is(prevValue, nextValue); // check value
      } catch (error) {
        return true;
      }
    }
    ```
    
    - useSyncExtrernalStore는 업데이트가 발생하면 dom 변경직전에 snapshot을 다시 받아와 초기 store snapshot값과 다르다면 처음부터 업데이트를 다시 진행하도록 하여 일치시킨다.
        - createStoreImpl함수에서 생성한 클로저들은 넘겨 getState를 통해 과거,현재 값을 비교하고 변동 사항이 있다면 forceUpdate()를 통해 re-render 시킨다.
    - handleStoreChange함수는 넘겨받은 subscribe클로저를 이용하여 listener에 추가한 함수이다.
        - createStoreImpl() - getState, subscribe → useStore() - useSyncExternalStoreWithSelector

---

# 4. Summary

- 적은 용량, 단순한 boiler-plate, 개별 store를 생성하고 구독하는 장점으로 분리, 유지 보수가 간편하고 효과적이다.
- API가 hook 친화적으로 설계되어 빠르게 익히고 내부적으로 useSyncExternalStore 사용, shallowEqual 등 확장성 좋게 설계되어 있다.
- code level 분석을 통해 어떻게 개별 store를  생성하고 각 store를 구독하고 동기화 하는지 알게 되어 추후 개발이나 디버깅에 도움이 많이 될 것 같다.
- 무조건 Zustand를 사용하기 보다는 여전히 대규모 프로젝트는 Redux가 좋을 수도 있고, client + server 상태를 함께 관리할 것인지, 분리하여 관리할 것인지 등 프로젝트 범위와 기능에 따라 적절히 사용하는 것이 좋을 것 같다.