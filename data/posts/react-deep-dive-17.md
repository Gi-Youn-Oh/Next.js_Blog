이번 글에서도 분석의 바탕이 되는 코드는 [React 16.12.0 version](https://github.com/facebook/react/tree/v16.12.0)을 기준으로 하며, [해당 블로그](https://www.notion.so/React-deep-dive-10-f903bf2b3e4248a29dd5402c89ccd591?pvs=21)에 감사 인사를 전합니다.
지난 글에서는 render phase에 진입하여 update가 이루어지기 직 전까지 workInProgress tree를 구축해가는 과정을 살펴보았습니다.

이번 글에서는 workInProgress.tag 따라 update하는 과정부터 hook에 대해 자세히 살펴보도록 하겠습니다.

아래 링크는  React의 렌더링 흐름에 따라 저 나름대로의 그림을 그려보았으며, 이 흐름에 따라 글이 이어 질 것입니다. (무단 복사 및 배포는 하지 말아주세요)

<a href="https://excalidraw.com/#json=fky4cO3h5RXKBcJgaVw_l,yczelRbNqAqHxBwE5Hf3kQ" target="_blank">Gy's React Diagram</a>

---

## Flow

Reconciler → Scheduler → Scheduler Host-config → **Reconciler Render Phase** → Reconciler Commit Phase

![image](https://github.com/user-attachments/assets/e6ffd320-1be8-40b6-a453-cda5f8f6f6d0)

**1. Reconciler**

1) Dispatch a trigger to update.

2) The reconciler requests the scheduler to schedule a task.

**2. Scheduler**

1) Schedule the work.

**3. Scheduler Host Config**

1) Yield control to the host.

**4. Reconciler Render Phase**

1) Prepare for reconciliation.

2) Enter the render phase.

3) <span style='background-color: #FFB6C1'>Perform rendering with hooks.</span>

4) Reconcile the `workInProgress` tree.

**5. Reconciler Commit Phase**

1) Execute `useEffect` and `useLayoutEffect`.

**6. Browser Paint**

---

# 1. Before

- 이전 글까지는 Bailout까지만 되었었습니다. 이번 글에서는 Update과정을 이어갑니다.

![image](https://github.com/user-attachments/assets/423b1522-ed6c-4a86-83f7-5fa3921ea941)

- 지난 글에서 1~3을 거쳐 4.**`bailoutOnAlreadyFinishedWork()`** 통해 빠르게 update에 해당하는 컴포넌트까지 workInProgress tree를 만들어 주었습니다.
1. **`workLoopSync()`**
2. **`performUnitOfWork()`**
3. **`beginWork()`**
4. **`bailoutOnAlreadyFinishedWork()`**
5. `update…`
    - 업데이트가 발생한 컴포넌트의 `workInProgress` 상태에 따라 해당 태그에 맞는 작업을 수행합니다.

   **5-1. FunctionComponent → `renderWithHooks()`**

    - **훅을 기반으로 업데이트 작업이 수행됩니다.**

   5-2. **Other Type Components**

    - 클래스형 컴포넌트 및 기타 유형에 맞는 업데이트 작업이 수행됩니다.
6. **`reconcileChildren()`**
7. **`completeUnitOfWork()`**
8. **`completeWork()`**
- 이번 글에서는 각 tag에 따른 update를 살펴볼 것이며, 모든 tag에 따른 update관해 살펴보지는 않을 것이고 저희가 많이 사용하는 FunctionComponent에 집중해서 살펴보겠습니다.
- 그 과정에서 renderWithHooks()에 의해 훅과 함께 컴포넌트를 렌더링하는 과정을 자세히 살펴보도록 하겠습니다.

### beginWork()

```jsx
// 컴포넌트의 props, state 변경 여부
let didReceiveUpdate: boolean = false;

function beginWork(
  current: Fiber | null,
  workInProgress: Fiber,
  renderExpirationTime: ExpirationTime
): Fiber | null {
	 ... 생략
	
   // fiber에 맞는 재조정 작업 라우팅
  switch (workInProgress.tag) {
    case IndeterminateComponent: {
      return mountIndeterminateComponent(...);
    }
    case FunctionComponent: {
      /*...*/
      return updateFunctionComponent(...);
    }
    case HostComponent:
      return updateHostComponent(...);
    case Fragment:
      return updateFragment(...);

    /* HostRoot, LazyComponent, Memo, ClassComponent... */
  }
}
```

- switch문까지 도달했다면 `workInProgress`는 업데이트가 필요한 컴포넌트 입니다.
    - **Mount되는 컴포넌트**
    - **Props가 변경된 컴포넌트**
    - **Props는 변경되지 않았지만 update가 필요한 컴포넌트**
- 컴포넌트를 호출하여 변경된 상태를 반영한 자식을 반환받아 재조정 작업을 진행해야 합니다.

---

# 2. Update…

- **재조정**
    - 컴포넌트를 호출하여 update를 적용해 React element를 반환합니다.
    - 해당 React element와 current fiber를 비교하여 workInProgress를 새로 만들어야 하는지, 수정되었는지, 삭제되었는지 확인하고 조정합니다.
- Update에서는 조정하기 위해 컴포넌트를 호출하여 비교할 React element를 반환해줍니다.
- 모든 tag에 대해 살펴보지는 않을 것이고 Host, Fragment, Function Component만 살펴보겠습니다.

### 2-1. updateHostComponent

[updateHostComponent-code](https://github.com/facebook/react/blob/v16.12.0/packages/react-reconciler/src/ReactFiberBeginWork.js#L976)

- Host 컴포넌트는 개발자가 작성한 Custom컴포넌트와는 다릅니다.
- Custom 컴포넌트는 상태값을 가지고 있기 때문에 호출을 통하여 적용해야 하지만, Host 컴포넌트 div, li 등 HTMLelement에 대응하는 컴포넌트이기 때문에 변경된 정보를 바탕으로 Host config에 의존적인 처리가 필요합니다.

```jsx
function updateHostComponent(current, workInProgress, renderExpirationTime) {
  const type = workInProgress.type
  const nextProps = workInProgress.pendingProps
  const prevProps = current !== null ? current.memoizedProps : null

  let nextChildren = nextProps.children
  // 자식이 텍스트 콘텐츠(문자열)인지 여부를 판별
  // ex) <div>Some text</div> -> true
  const isDirectTextChild = shouldSetTextContent(type, nextProps)

  if (isDirectTextChild) {
    nextChildren = null 
    // isDireactTextChild 가 false이므로 즉 문자열 콘텐츠가 아니므로 render되야함
    // 이전 렌더링에서 해당 컴포넌트의 자식이 문자열 콘텐츠(즉, 텍스트 노드)였는지 확인
  } else if (prevProps !== null && shouldSetTextContent(type, prevProps)) {
    // 이전 렌더링에서 단순 텍스트 였지만 이번에는 아니라면 update를 위해 tag를 붙여준다.
    workInProgress.effectTag |= ContentReset
  }
	// nextChildren이 null이라면 아무 작업도 하지 않는다.
  reconcileChildren(current, workInProgress, nextChildren, renderExpirationTime)
  return workInProgress.child
}
```

- Host 컴포넌트는 자식으로 문자열 하나만 가질 때, 해당 문자열을 굳이 Fiber로 만들지 않습니다.
    - 문자열이 직접 자식으로 있을 때(`isDirectTextChild` === true) `nextChildren`을 `null`로 설정하여, 이후 자식 노드 재조정(reconciliation) 과정에서 이 문자열이 새로운 Fiber로 생성되지 않도록 합니다.
    - `reconcileChildren()` 함수는  nextChildren = null인 경우 아무 작업도 하지 않으므로, 문자열 자식이 있을 때 불필요한 Fiber 생성을 방지하는 역할을 합니다.
- 기존 자식이 문자열이었을 경우(`prevProps`가 문자열을 포함하고 있을 때), Fiber로 생성되지 않았기 때문에 재조정 작업 중 삭제 로직이 동작하지 않을 수 있습니다.
    - 이를 해결하기 위해 `ContentReset` 태그를 추가하여, 자식 재조정 로직에서 해당 호스트 컴포넌트의 내용을 초기화해야 함을 알립니다. 만약 `ContentReset` 태그가 설정되지 않으면, 새로운 `nextChildren`이 기존의 문자열 자식 옆에 형제로 잘못 삽입될 위험이 있습니다. 그래서 `ContentReset`을 통해 문자열을 먼저 제거하도록 하는 것입니다.

### 2-2. updateFragment

[updateFragment-code](https://github.com/facebook/react/blob/v16.12.0/packages/react-reconciler/src/ReactFiberBeginWork.js#L539)

- Fragment는 아시겠지만 자식 저장소이기 때문에 자식 요소를 reconcileChildren으로 넘겨줍니다.

```jsx
function updateFragment(current, workInProgress, renderExpirationTime) {
  const nextChildren = workInProgress.pendingProps // Fragment는 props 자체가 자식 저장소이다
  reconcileChildren(current, workInProgress, nextChildren, renderExpirationTime)
  return workInProgress.child
}
```

### 2-3. updateFunctionComponent

- updateFunctionComponent호출 전 resolveDefaultProps()먼저 살펴보겠습니다.

```jsx
function beginWork(...) {
  /*...*/
  // workInProgress.expirationTime = NoWork;

  switch (workInProgress.tag) {
    /*...*/
    case FunctionComponent: {
      const Component = workInProgress.type;
      const unresolvedProps = workInProgress.pendingProps;
      const resolvedProps =
        workInProgress.elementType === Component
          ? unresolvedProps
          : resolveDefaultProps(Component, unresolvedProps);

      return updateFunctionComponent(
        current,
        workInProgress,
        Component,
        resolvedProps,
        renderExpirationTime,
      );
    }
    /*...*/
  }
}
```

**resolveDefaultProps**

[resolveDefaultProps-code](https://github.com/facebook/react/blob/v16.12.0/packages/react-reconciler/src/ReactFiberLazyComponent.js#L14)

- FunctionComponent를 update하기 전에 resolveDefaultProps() 함수를 통해 `baseProps`에 `defaultProps`에 있는 속성들이 없을 경우, `defaultProps` 값을 `baseProps`에 채워줍니다.

```jsx
export function resolveDefaultProps(Component: any, baseProps: Object): Object {
  if (Component && Component.defaultProps) {
    // Resolve default props. Taken from ReactElement
    const props = Object.assign({}, baseProps);
    const defaultProps = Component.defaultProps;
    for (let propName in defaultProps) {
      if (props[propName] === undefined) {
        props[propName] = defaultProps[propName];
      }
    }
    return props;
  }
  return baseProps;
}
```

**updateFunctionComponent**

[updateFunctionComponent-code](https://github.com/facebook/react/blob/v16.12.0/packages/react-reconciler/src/ReactFiberBeginWork.js#L599)

- 이번 글에서는 renderWithHooks() 내용이 많기 때문에 reconcileChildren() 호출 이전까지만 살펴보고 분석이 끝나면 이어서 보도록 하겠습니다.

```jsx
function updateFunctionComponent(current, workInProgress, Component, nextProps, renderExpirationTime) {
	// component 호출
	// update component
	// check state change
  let nextChildren = renderWithHooks(
    current, 
    workInProgress, 
    Component, 
    nextProps, 
    context, 
    renderExpirationTime
  );
  
	// didReceiveUpdate는 props or state의 변경 여부입니다.
	// props는 beginWork()에서 확인했었고, state는 renderWithHooks()과정에서 useState, useReducer의 구현체인 updateReducer()에서 판단합니다.
	// 최적화
  if (current !== null && !didReceiveUpdate) {
    bailoutHooks(current, workInProgress, renderExpirationTime); // 훅과 관련된 부분들을 초기화
    return bailoutOnAlreadyFinishedWork(...);
  }

  workInProgress.effectTag |= PerformedWork;

  reconcileChildren(
    current,
	    workInProgress,
    nextChildren,
    renderExpirationTime,
  );
  return workInProgress.child;
}
```

- useState, useReducer의 구현체 **updateReducer() code 중 didReceiveUpdate 확인 부분**

    ```jsx
      if (!is(newState, hook.memoizedState)) { // state가 변경되었다면
        markWorkInProgressReceivedUpdate(); //didReceiveUpdate = true
      }
    ```

- `if (current !== null && !didReceiveUpdate)` 의미는 다음과 같습니다.
    - beginWork()에서 props가 변경되지 않았음을 확인했다.
    - 하지만 update가 발생했으므로 호출되어야 한다. → swich.tag → update… → 컴포넌트 호출 (renderWithHooks())
    - 컴포넌트 호출 후에도 didReceivedUpdate가 false라면 컴포넌트 상태 또한 변경되지 않았다.
        - 다음과 같은 경우 변경되지 않을 수 있습니다.
            1. 리액트에서 부모 컴포넌트가 리렌더링되면 자식 컴포넌트들도 기본적으로 다시 렌더링됩니다. 이 경우 자식 컴포넌트에 전달된 `props`가 이전과 동일할 수 있지만, 부모가 리렌더링된다는 사실만으로 자식도 다시 호출됩니다.
            2. `setState()`가 호출되었지만, 이전 상태와 동일한 값으로 업데이트 되었다면 실제로 컴포넌트의 상태는 변경되지 않습니다.

  ⇒ 이런 경우  update가 필요없지만 호출되었기 때문에 라이프 사이클 훅(useEffect(), useLayoutEffect())의 잔여물이 fiber에 남아있게 됩니다.

    - 따라서 잔여물을 제거해줍니다.
    - **bailoutHooks()**

        ```jsx
        function bailoutHooks(current, workInProgress, expirationTime) {
        // updateQueue 함수형 컴포넌트는 라이프 사이클 hook을 저장하고 호스트 컴포넌트는 변경된 정보를 저장합니다
          workInProgress.updateQueue = current.updateQueue // 라이프 사이클 초기화
          workInProgress.effectTag &= ~(PassiveEffect | UpdateEffect) // 라이프 사이클 tag 삭제
          if (current.expirationTime <= expirationTime) {
             current.expirationTime = NoWork
          }
        }
        ```

    - 잔여물이 제거 되었다면 불필요한 work를 실행하지 않도록 bailoutOnAlreadyFinishedWork() 실행하여 끊어줍니다.
        - 자손에서 update가 있다면 반환, 없다면 null

---

# 3. Hooks

- renderWithHooks()를 살펴보기 전 Hook이 어떻게 구현되었는지 살펴봐야 합니다.

## 3-1. Hook의 출처

### (1) react > React.js

[React.js-code](https://github.com/facebook/react/blob/v16.12.0/packages/react/src/React.js#L66)

- 먼저 react core package의 React.js에 가보면 ReactHooks에서 hook들을 가져오는 것을 확인할 수 있습니다.

```jsx
import { useState, useEffect, ... } from './ReactHooks'
import ReactSharedInternals from './ReactSharedInternals' // 의존성 주입
const React = {
  useState,
  useEffect,
  __SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED: ReactSharedInternals,
  /*...*/
}

export default React
```

### (2) react > ReactHooks.js

- ReactHooks.js에 가보면 useState, useEffect등 모두 resolveDispatcher에서 가져온 값입니다.

[ReactHooks.js-code](https://github.com/facebook/react/blob/v16.12.0/packages/react/src/ReactHooks.js#L21)

```jsx
import ReactCurrentDispatcher from './ReactCurrentDispatcher'

function resolveDispatcher() {
  const dispatcher = ReactCurrentDispatcher.current
  return dispatcher
}

export function useState(initialState) {
  const dispatcher = resolveDispatcher()
  return dispatcher.useState(initialState)
}

export function useEffect(create, inputs) {
  const dispatcher = resolveDispatcher()
  return dispatcher.useEffect(create, inputs)
}
/*...*/
```

### (3) react > ReactCurrentDispatcher.js

[ReactCurrentDispatcher.js-code](https://github.com/facebook/react/blob/v16.12.0/packages/react/src/ReactCurrentDispatcher.js#L15)

```jsx
const ReactCurrentDispatcher = {
  current: null,
}
export default ReactCurrentDispatcher
```

- 그런데 값이 null 입니다.. 아무것도 없습니다.
- 이쯤에서 React의 package들에 대해서 다시 생각해 볼 필요가 있습니다.
    - **React Element와 Fiber**:

      React element는 그 자체로는 컴포넌트의 모델일 뿐, 실행 상태는 아닙니다. Fiber는 이러한 React element를 인스턴스화하여 실행 가능한 구조로 만들고, 이는 React의 **reconciler**가 담당합니다. 즉, Fiber는 element를 트리 구조로 관리하고 변경사항을 추적합니다.

    - **Reconciler와 Hooks**:

      훅은 컴포넌트의 상태를 관리하는데, 이 상태는 React element가 아니라 Fiber와 관련이 있습니다. Fiber는 훅과 함께 컴포넌트 상태를 관리하면서, **reconciler**를 통해 컴포넌트의 업데이트를 처리합니다.

    - **React element는 결국 Fiber로 확장되어야 한다는 것이며 Fiber는 Reconciler가 담당합니다.**
- React core package에서는 어디에서도 Hook을 가져다 사용하는 곳을 찾지 못했습니다.
    - 이 말은 훅 객체를 외부에서 주입해준다는 뜻입니다.
    - React에서는 직접 주입 받지 않고 Shared package를 중간자로 두고 주입합니다.





### (4) react > ReactSharedInternals.js

[ReactSharedInternals.js-code](https://github.com/facebook/react/blob/v16.12.0/packages/react/src/ReactSharedInternals.js)

```jsx
import ReactCurrentDispatcher from './ReactCurrentDispatcher'
import ReactCurrentBatchConfig from './ReactCurrentBatchConfig'
import ReactCurrentOwner from './ReactCurrentOwner'
/*...*/

const ReactSharedInternals = {
  ReactCurrentDispatcher,
  ReactCurrentBatchConfig,
  ReactCurrentOwner,
  /*...*/
}

export default ReactSharedInternals
```

### (5) shared > ReactSharedInternals.js

[ReactSharedInternals.js-code](https://github.com/facebook/react/blob/v16.12.0/packages/shared/ReactSharedInternals.js#L10)

```jsx
import React from 'react'

const ReactSharedInternals =
  React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED // core의 ReactSharedInternals.js

if (!ReactSharedInternals.hasOwnProperty('ReactCurrentDispatcher')) {
  ReactSharedInternals.ReactCurrentDispatcher = {
    current: null,
  }
}
/*...*/

export default ReactSharedInternals
```

- 정리해보면 흐름은 다음과 같습니다.

  **reconciler -> shared/ReactSharedInternal -> react/ReactSharedInternal -> react/ReactCurrentDispatcher -> react/ReactHooks -> react -> 개발자**


![image](https://github.com/user-attachments/assets/daba8e34-4098-49e3-a8a1-414a70433f27)

- 훅 주입은 우리가 지금부터 살펴볼 renderWithHooks()에서 주입 받게 됩니다.

### renderWithHooks()

[renderWithHooks-code](https://github.com/facebook/react/blob/v16.12.0/packages/react-reconciler/src/ReactFiberHooks.js#L375)

- 전체 코드는 아래와 같습니다.
- 컴포넌트를 기본적으로 호출하는 부분과 렌더링 도중 업데이트가 발생하는 부분을 나누어서 보도록 하겠습니다.

```jsx
export function renderWithHooks(
  current: Fiber | null, // null 이라면 새로 mount되는 component
  workInProgress: Fiber,
  Component: any,
  props: any,
  refOrContext: any,
  nextRenderExpirationTime: ExpirationTime // 렌더링이 완료되어야 하는 시간
) {
  renderExpirationTime = nextRenderExpirationTime; // 현재 렌더링하는 컴포넌트의 expirationTime 할당
  currentlyRenderingFiber = workInProgress // 현재 작업 중인 Fiber를 전역 변수로 잡아둔다.
  nextCurrentHook = current !== null ? current.memoizedState : null // current가 존재한다면 이전 렌더링에서의 hook 참조를 가져온다. memoizedState에 hook이 있다는 것을 확인할 수 있다.
  
  // 컴포넌트 호출 전 초기화 되어 있어야 할 값들
  // The following should have already been reset
  // currentHook = null;
  // workInProgressHook = null;

  // remainingExpirationTime = NoWork;
  // componentUpdateQueue = null;

  // didScheduleRenderPhaseUpdate = false;
  // renderPhaseUpdates = null;
  // numberOfReRenders = 0;
  // sideEffectTag = 0;

	// 훅 주입
	// mount or update 구분
	// mount된 이후에는 unmount되기 전까지 update구현체가 사용된다.
  ReactCurrentDispatcher.current =
    nextCurrentHook === null ? HooksDispatcherOnMount : HooksDispatcherOnUpdate
  
	// 컴포넌트 호출
  let children = Component(props, refOrContext)
 
 // Part2: 렌더링 중 update 다시 발생
 if (didScheduleRenderPhaseUpdate) {
    do {
      didScheduleRenderPhaseUpdate = false
      // 무한 루프 방지, 업데이트 구현체에게 Render phase update Flag
      numberOfReRenders += 1

      // 재호출을 위한 변수 설정
      nextCurrentHook = current !== null ? current.memoizedState : null
      nextWorkInProgressHook = firstWorkInProgressHook
      
      **currentHook = null
      workInProgressHook = null
      componentUpdateQueue = null;
      
      // 업데이트 구현체 주입
      // render도중 update가 발생했으므로 mount가 아니다.
      ReactCurrentDispatcher.current = HooksDispatcherOnUpdate 

      children = Component(props, refOrContext) // 컴포넌트 재호출
    } while (didScheduleRenderPhaseUpdate)

    renderPhaseUpdates = null // Render phase update 저장소 초기화
    numberOfReRenders = 0
  }
  
  // We can assume the previous dispatcher is always this one, since we set it
  // at the beginning of the render phase and there's no re-entrancy.
  // rendering완료 후 hook이 호출되어선 안되기 때문에 에러 방지
  ReactCurrentDispatcher.current = ContextOnlyDispatcher;
	
	// 결과값 update
  const renderedWork = currentlyRenderingFiber
  // workInProrgress Fiber.memoizedState에 매핑
  renderedWork.memoizedState = firstWorkInProgressHook;
  renderedWork.expirationTime = remainingExpirationTime;
  renderedWork.updateQueue = (componentUpdateQueue: any);
  renderedWork.effectTag |= sideEffectTag;

	// 전역변수 초기화 다음 렌더링에서 사용
  renderExpirationTime = NoWork;
  currentlyRenderingFiber = null;

  currentHook = null;
  nextCurrentHook = null;
  firstWorkInProgressHook = null;
  workInProgressHook = null;
  nextWorkInProgressHook = null;

  remainingExpirationTime = NoWork;
  componentUpdateQueue = null;
  sideEffectTag = 0;
  
  return children;
}
```

**Variables**

- renderWithHooks에서 사용되는 전역변수 먼저 살펴보겠습니다.
- **reconciler pakage에서 선언되는 모든 전역 변수들(firstWorkInProgressHook, nextCurrentHook..)은 작업 중인 컴포넌트에만 국한되는 상태 값으로 사용됩니다.**
- 따라서 작업 중에만 참조 값으로 사용하고 끝나게 되면 모두 초기화시켜서 다음에 사용할 수 있도록 합니다.

```jsx
// 컴포넌트 호출 전 초기 값으로 세팅되어 있어야 합니다.

// 만료시간 (우선순위 구별)
let renderExpirationTime: ExpirationTime = NoWork;

// 현재 렌더링 중인 Fiber
let currentlyRenderingFiber: Fiber | null = null;

// Hooks는 Fiber.memoizedState에 linked-list로 저장됩니다.
// 실제 훅의 상태는 current.memoizedState에 저장되고, currentHook은 그 상태에 접근하는 임시 변수 입니다.
let currentHook: Hook | null = null;

// currentHook에서 다음에 위치한 훅을 가리킵니다. 이는 훅 리스트를 순차적으로 탐색하기 위해 사용됩니다.
let nextCurrentHook: Hook | null = null;

//  현재 작업 중인 훅 리스트의 첫 번째 훅을 가리킵니다. 이 훅은 새롭게 추가되거나 업데이트된 훅 리스트의 시작점이 됩니다.
// mount 시에 훅 리스트가 생성되어 저장됩니다. 
let firstWorkInProgressHook: Hook | null = null;

// 새로운 리스트로, 현재 작업 중인 Hook리스트 입니다.
let workInProgressHook: Hook | null = null;

// 현재 작업 중인 훅 리스트에서 다음에 위치한 훅을 가리킵니다. 훅 리스트의 다음 항목을 순차적으로 처리할 수 있도록 합니다.
let nextWorkInProgressHook: Hook | null = null;

// 아직 처리되지 않은 남은 작업의 만료 시간을 나타냅니다. 
// 값이 클수록 우선순위가 높습니다.
let remainingExpirationTime: ExpirationTime = NoWork;

// 발생한 effect들을 담아두는 queue입니다.
let componentUpdateQueue: FunctionComponentUpdateQueue | null = null;

// 사이드 이펙트를 추적하는 태그입니다. 컴포넌트가 렌더링될 때 발생하는 부작용(e.g., DOM 업데이트, 상태 변경 등)을 추적하고 기록합니다. 이 태그는 작업이 완료된 후 React가 사이드 이펙트를 처리할 때 사용됩니다.
let sideEffectTag: SideEffectTag = 0;

//  렌더링 중에 업데이트가 발생했는지 Flag로 사용합니다.
let didScheduleRenderPhaseUpdate: boolean = false;
// Lazily created map of render-phase updates
// 렌더링 중에 발생한 업데이트를 저장하는 맵(Map)입니다. 이 업데이트는 일반적인 업데이트 큐에 저장되지 않고, 렌더링이 끝나면 폐기될 수도 있습니다. 렌더링 도중 발생한 업데이트를 따로 추적하기 위한 구조입니다.
let renderPhaseUpdates: Map<
  UpdateQueue<any, any>,
  Update<any, any>,
> | null = null;

// 최대 리렌더링 발생횟수를 체크하기위한 변수입니다.
let numberOfReRenders: number = 0;
// 마찬가지 최대 리렌더링 발생횟수 체크를 위한 상수값으로 부적절한 render를 발생시키면 
// Too many re-renders Error를 발생시킵니다.
const RE_RENDER_LIMIT = 25;
```

### renderWithHooks() : Part 1

```jsx
export function renderWithHooks(
  current: Fiber | null, // null 이라면 새로 mount되는 component
  workInProgress: Fiber,
  Component: any,
  props: any,
  refOrContext: any,
  nextRenderExpirationTime: ExpirationTime // 렌더링이 완료되어야 하는 시간
) {
	... 생략
	nextCurrentHook = current !== null ? current.memoizedState : null // current가 존재한다면 이전 렌더링에서의 hook 참조를 가져온다. memoizedState에 hook이 있다는 것을 확인할 수 있다.
	... 생략
	// 훅 주입
	// mount or update 구분
	// mount된 이후에는 unmount되기 전까지 update구현체가 사용된다.
  ReactCurrentDispatcher.current =
    nextCurrentHook === null ? HooksDispatcherOnMount : HooksDispatcherOnUpdate
  
	// 컴포넌트 호출
  let children = Component(props, refOrContext)
 
 // 렌더링 중 update 다시 발생
 ... 생략
 
  // rendering완료 후 hook이 호출되어선 안되기 때문에 에러 방지
  ReactCurrentDispatcher.current = ContextOnlyDispatcher;
	
	// 결과값 update
  const renderedWork = currentlyRenderingFiber
  // workInProrgress Fiber.memoizedState에 매핑
  renderedWork.memoizedState = firstWorkInProgressHook;
  
	... 생략
  
  return children;
}
```

1. `renderedWork.memoizedState = firstWorkInProgressHook;`구문을 보면 Hook이 memoizedState에 할당됩니다.
2. `nextCurrentHook = current !== null ? current.memoizedState : null`
3. `ReactCurrentDispatcher.current = nextCurrentHook === null ? HooksDispatcherOnMount : HooksDispatcherOnUpdate`
    - 2, 3 위 두개의 구문에서 current.memoizedState에는 Hook이 있을 것이고 null 이 아니라면 한번 mount되었던 컴포넌트라는 것을 추측할 수 있습니다.
- 컴포넌트 호출하기 전 훅이 주입 되는 곳의 구현체를 찾아가보겠습니다.

### HooksDispatcherOnMount, HooksDispatcherOnUpdate

[HooksDispatcherOnMount, HooksDispatcherOnUpdate-code](https://github.com/facebook/react/blob/v16.12.0/packages/react-reconciler/src/ReactFiberHooks.js#L1362)

```jsx
// mount
const HooksDispatcherOnMount = {
  useState: mountState,
  useEffect: mountEffect,
  /*...*/
};

// update
const HooksDispatcherOnUpdate: = {
  useState: updateState,
  useEffect: updateEffect,
  /*...*/
};

// invalid hook call
export const ContextOnlyDispatcher: Dispatcher = {
  useState: throwInvalidHookError,
  useEffect: throwInvalidHookError,
  /*...*/
};
```

- HooksDispatcherOnMount, HooksDispatcherOnUpdate는 각각의 구현체가 있습니다.
- 컴포넌트 호출 이후에는 다시 호출되어선 안되기 때문에 error를 호출하는 구현체를 참조하도록 설정해줍니다.
- 훅은 어떻게 생겼는지 알아봅시다.

## 3-2. Hook의 생성

### Hook : linked-list & Hook.queue : circular-linked-list

- 이해를 돕기 위해 그림 먼저 살펴보고 가겠습니다.

  ![image](https://github.com/user-attachments/assets/c213cfee-0ed5-46e4-984f-c52e9249abe8)
- 
  ![image](https://github.com/user-attachments/assets/e3af5f04-e180-4e34-ac9a-7bdf461e8fb3)

- Hook은 linked-list로 이어져 있으며, Hook의 내부에는 update들이 circular-linked-list로 구현되어 있습니다.
- linked-list로 구현한 이유는 random-access접근이 없고 삭제와 같은 조작이 쉽기 때문이며 hook의 순서가 보장되야 하는 이유의 근거이기도 합니다.
- 다음과 같이 조건, 반복문 코드 내에서 사용하게 될 경우 동일하게 훅이 순서대로 호출된다는 보장이 없기 때문에 Invalid hook call 에러가 발생하는 것을 확인할 수 있습니다.

    ```jsx
    import React, { useState } from 'react';
    
    function MyComponent({ condition }) {
      // 훅을 조건문 안에서 호출하는 잘못된 예시
      if (condition) {
        const [count, setCount] = useState(0); // condition이 true일 때만 useState가 호출됨
      }
    
      const [name, setName] = useState('React');
    
      return (
        <div>
          <p>Name: {name}</p>
        </div>
      );
    }
    
    export default MyComponent;
    
    ```


### mountWorkInProgressHook()

[mountWorkInProgressHook-code](https://github.com/facebook/react/blob/v16.12.0/packages/react-reconciler/src/ReactFiberHooks.js#L572)

- mountState()에 앞서 훅을 생성하고 할당해주는 함수 먼저 살펴보겠습니다.

```jsx
function mountWorkInProgressHook(): Hook {
  
  const hook: Hook = {
    memoizedState: null, // 컴포넌트에 적용된 마지막 상태 값 (state)
    queue: null, // 해당 훅이 호출될 때마다 update(setState)를 circular-linked-list에 추가합니다.
    next: null, // next hook pointer
    baseState: null, // baseUpdate 소비 결과 값
    baseUpdate: null, // 마지막으로 적용된 update 포인터
  }

  if (workInProgressHook === null) {
    // 맨 처음 실행되는 훅인 경우 연결 리스트의 head로 잡아둠
    firstWorkInProgressHook = workInProgressHook = hook
  } else {
    // 두번 째부터는 연결 리스트에 추가
    workInProgressHook = workInProgressHook.next = hook
  }
  return workInProgressHook
}
```

- `firstWorkInProgressHook`은 훅 연결 리스트의 head로 위에서 살펴봤듯이 컴포넌트 호출 뒤 fiber에 저장되어 컴포넌트와 훅 리스트를 연결해주고 `workInProgressHook`은 현재 처리되고 있는 훅을 나타내면서 동시에 리스트의 tail 포인터로 사용합니다.

### mountState()

[mountState-code](https://github.com/facebook/react/blob/v16.12.0/packages/react-reconciler/src/ReactFiberHooks.js#L823)

```jsx
function mountState<S>(
  initialState: (() => S) | S,
): [S, Dispatch<BasicStateAction<S>>] {
	// hook생성 후 할당
  const hook = mountWorkInProgressHook();
  // 초기값이 함수이면 실행해서 할당
  if (typeof initialState === 'function') {
    initialState = initialState();
  }
  // 초기값 설정
  hook.memoizedState = hook.baseState = initialState;
  // hook의 queue에는 
  const queue = (hook.queue = {
    last: null, // 마지막 update(setState)
    dispatch: null, // queue.push
    lastRenderedReducer: basicStateReducer,
    lastRenderedState: (initialState: any),
  });
  
  const dispatch: Dispatch<
    BasicStateAction<S>,
  > = (queue.dispatch = (dispatchAction.bind( // 외부 노출 위해 bind
    null,
    // Flow doesn't know this is non-null, but we do.
    ((currentlyRenderingFiber: any): Fiber),
    queue,
  ): any));
  return [hook.memoizedState, dispatch]; // const [state, setState] = useState();
}
```

- 초기값 함수 실행 할당에서 다음과 같은 최적화 예시 코드를 확인해볼 수 있습니다. (lazy init)
    - 초기 mount이후에는 update구현체를 사용하기 때문에 실행되지 않습니다.

    ```jsx
      if (typeof initialState === 'function') {
        // 초기값이 함수이면 실행해서 할당
        initialState = initialState()
      }
    ```

- 만약 많은 계산이 들어가는 함수가 있다면 매 렌더링 마다 실행 될 것입니다.

    ```jsx
    // Bad case
    import React, { useState } from 'react';
    
    const expensiveCalculation = () => {
      console.log('expensiveCalculation 실행 중...');
      return 42; // 예시: 계산의 결과값
    }
    
    function MyComponent() {
      // useState에 전달된 expensiveCalculation() 함수가 컴포넌트가 렌더링될 때마다 실행됨
      const [count, setCount] = useState(expensiveCalculation());
    
      return (
        <div>
          <p>Count: {count}</p>
          <button onClick={() => setCount(count + 1)}>Increase</button>
        </div>
      );
    }
    
    export default MyComponent;
    
    ```

    ```jsx
    // Correct case
    import React, { useState } from 'react';
    
    const expensiveCalculation = () => {
      console.log('expensiveCalculation 실행 중...');
      return 42; // 예시: 계산의 결과값
    }
    
    function MyComponent() {
      // 컴포넌트가 처음 렌더링될 때만 expensiveCalculation 실행
      const [count, setCount] = useState(() => expensiveCalculation());
    
      return (
        <div>
          <p>Count: {count}</p>
          <button onClick={() => setCount(count + 1)}>Increase</button>
        </div>
      );
    }
    
    export default MyComponent;
    
    ```

- **dispatch**

    ```jsx
      // hook의 queue에는 
      const queue = (hook.queue = {
        last: null, // 마지막 update(setState)
        dispatch: null, // queue.push
        lastRenderedReducer: basicStateReducer,
        lastRenderedState: (initialState: any),
      });
      
      const dispatch: Dispatch<
        BasicStateAction<S>,
      > = (queue.dispatch = (dispatchAction.bind( // 외부 노출 위해 bind
        null,
    		currentlyRenderingFiber,
        queue,
      ): any));
      return [hook.memoizedState, dispatch]; // const [state, setState] = useState();
    ```

- dispatch 는 queue에 update를 추가해주는 push 함수입니다. setState() 호출할 때마다 update가 queue에 추가됩니다.
- 외부에 노출해야 하기 때문에 현재  렌더링 중인 Fiber(currentlyRenderingFiber)와 Hook.queue를 bind합니다.
- 마지막 return문이 저희가 컴포넌트에서 종종 선언하는 const [state, setState] = useState(); 코드입니다.
- 조금 더 쉬운 이해를 위해 Hook의 상태를 코드와 함께 살펴보겠습니다.

    ```jsx
    function ExampleComponent () {
        const [value, setValue] = useState(0); // Hook 1
        const [secondValue, setSecondValue] = useState(0); // Hook 2
    
        setValue((prev) => prev + 1); // first update
        setValue((prev) => prev + 1); // second update
        setValue((prev) => prev + 1); // third update
    }
    
    // Hook1 -> Hook2는 linked-list로 pointer참조 
    // fiber.memoizedState => Hook1.next => Hook2.next => null
    
    // update들은 circular linked-list 
    // Hook1의 setValue를 3번 호출하면 Hook.queue에 update를 3개 push
    // Hook1.queue = [first update, second update, third update]
    ```


### dispatchAction()

[dispatchAction-code](https://github.com/facebook/react/blob/v16.12.0/packages/react-reconciler/src/ReactFiberHooks.js#L1221)

- render phase상태에서의 update인지 idle 상태에서의 update인지 구분해야 합니다.
- 전체코드는 아래와 같습니다만 2파트로 나누어서 살펴보겠습니다.

```jsx
function dispatchAction<S, A>(
  fiber: Fiber,
  queue: UpdateQueue<S, A>,
  action: A,
) {
  invariant(
    numberOfReRenders < RE_RENDER_LIMIT,
    'Too many re-renders. React limits the number of renders to prevent ' +
      'an infinite loop.',
  );
  const alternate = fiber.alternate;
  // Part2: render phase 상태 update 
  // currentlyRenderingFiber는 renderWithHooks()에서 할당 비어있지 않다는 것은 render 도중이라는 의미
  // current <- alternate -> workInProgress 이기 때문에 둘다 check필요
   if (
    fiber === currentlyRenderingFiber ||
    (alternate !== null && alternate === currentlyRenderingFiber)
  ) {
  
    // flag true
    didScheduleRenderPhaseUpdate = true;
    const update: Update<S, A> = {
      expirationTime: renderExpirationTime,
      suspenseConfig: null,
      action,
      eagerReducer: null,
      eagerState: null,
      next: null,
    };

    if (renderPhaseUpdates === null) {
      renderPhaseUpdates = new Map();
    }
    
    const firstRenderPhaseUpdate = renderPhaseUpdates.get(queue);
    
    if (firstRenderPhaseUpdate === undefined) {
      renderPhaseUpdates.set(queue, update);
    } else {
      // Append the update to the end of the list.
      let lastRenderPhaseUpdate = firstRenderPhaseUpdate;
      while (lastRenderPhaseUpdate.next !== null) {
        lastRenderPhaseUpdate = lastRenderPhaseUpdate.next;
      }
      lastRenderPhaseUpdate.next = update;
    }
  } else { // Part1: idle (유휴) 상태에서의 update
    const currentTime = requestCurrentTimeForUpdate();
    const suspenseConfig = requestCurrentSuspenseConfig();
    const expirationTime = computeExpirationForFiber(
      currentTime,
      fiber,
      suspenseConfig,
    );
   
    // 1. update 생성
    const update = {
      expirationTime,
      action, // setState()의 인자
      next: null, // 노드 포인터
      // 최적화 check 변수들
      eagerReducer: null,
      eagerState: null,
    }

    // 2. update를 queue에 추가
    // circular-linked-list
    const last = queue.last
    if (last === null) {
      // This is the first update. Create a circular list.
      update.next = update
    } else {
      const first = last.next
      if (first !== null) {
        // Still circular.
        update.next = first
      }
      last.next = update
    }
    queue.last = update
    
     // 컴포넌트에서 업데이트가 발생한 적이 있는지 확인
     // 3. 최적화
     // 현재 컴포넌트로 인하여 work가 스케줄링 되어 있지 않으며
    if (
      fiber.expirationTime === NoWork &&
      (alternate === null || alternate.expirationTime === NoWork)
    )  {
      const lastRenderedReducer = queue.lastRenderedReducer
      if (lastRenderedReducer !== null) {
        const currentState = queue.lastRenderedState // 컴포넌트에 적용된 상태값
        const eagerState = lastRenderedReducer(currentState, action) // action의 결과값
        update.eagerReducer = lastRenderedReducer
        update.eagerState = eagerState
        // action의 결과값이 현재와 동일하다면 return
        if (is(eagerState, currentState)) {
          return
        }
      }
    }
    // 만약 위의 최적화 로직에서 다르다고 판별이 나면 update해야하므로 work 스케줄링
    // 4. work schedule
    scheduleWork(fiber, expirationTime)
  }
}
```

### dispatchAction: Part 1 (idle update)

1. 업데이트 정보를 담은 `update`객체를 만듭니다.
2. `update`를 `queue`에 저장합니다.
3. 렌더링 최적화를 합니다.
4. 업데이트를 적용을 위해 **Work**를 스케줄링합니다.

```jsx
function dispatchAction<S, A>(
  fiber: Fiber,
  queue: UpdateQueue<S, A>,
  action: A,
) {
  invariant(
    numberOfReRenders < RE_RENDER_LIMIT,
    'Too many re-renders. React limits the number of renders to prevent ' +
      'an infinite loop.',
  );
	const alternate = fiber.alternate

  // Render phase update
  if (...) {
	// idle update
  } else {
    // time 구하는 함수는 생략하겠습니다.
    const currentTime = requestCurrentTimeForUpdate()
    const suspenseConfig = requestCurrentSuspenseConfig()
    const expirationTime = computeExpirationForFiber(
      currentTime,
      fiber,
      suspenseConfig
    )

    // 1. update 생성
    const update = {
      expirationTime,
      action, // setState()의 인자
      next: null, // 노드 포인터
      // 최적화 check 변수들
      eagerReducer: null,
      eagerState: null,
    }

    // 2. update를 queue에 추가
    // circular-linked-list
    const last = queue.last
    if (last === null) {
      // This is the first update. Create a circular list.
      update.next = update
    } else {
      const first = last.next
      if (first !== null) {
        // Still circular.
        update.next = first
      }
      last.next = update
    }
    queue.last = update
    
     // 컴포넌트에서 업데이트가 발생한 적이 있는지 확인
     // 3. 최적화
     // 현재 컴포넌트로 인하여 work가 스케줄링 되어 있지 않으며
    if (
      fiber.expirationTime === NoWork &&
      (alternate === null || alternate.expirationTime === NoWork)
    )  {
      const lastRenderedReducer = queue.lastRenderedReducer
      if (lastRenderedReducer !== null) {
        const currentState = queue.lastRenderedState // 컴포넌트에 적용된 상태값
        const eagerState = lastRenderedReducer(currentState, action) // action의 결과값
        update.eagerReducer = lastRenderedReducer
        update.eagerState = eagerState
        // action의 결과값이 현재와 동일하다면 return
        if (is(eagerState, currentState)) {
          return
        }
      }
    }
    // 만약 위의 최적화 로직에서 다르다고 판별이 나면 update해야하므로 work 스케줄링
    // 4. work schedule
    scheduleWork(fiber, expirationTime)
  }
}
```

### dispatchAction: part2 (render phase update)

- idle상태에서 dispatchAction()을 통해 work가 예약되어 render phase 실행 도중 추가로 dispatchAction()이 호출된 경우
    - 이 때는 렌더링 최적화를 하거나 work를 schedule할 필요가 없습니다. (이미 work는 진행중이기 때문)
    - render phase update가 발생하지 않을 때까지 계속 컴포넌트를 호출하며 action을 소비하면 됩니다.
- render phase update를 소비하기 위해 임시저장소가 필요합니다.
- Map()을 사용했는데 queue객체를 key값으로 사용하기 위해서 입니다.
    - map https://ko.javascript.info/map-set
    - [맵(Map)](https://developer.mozilla.org/ko/docs/Web/JavaScript/Reference/Global_Objects/Map)은 키가 있는 데이터를 저장한다는 점에서 `객체`와 유사합니다. 다만, `맵`은 키에 다양한 자료형을 허용한다는 점에서 차이가 있습니다.

```jsx
function dispatchAction<S, A>(
  fiber: Fiber,
  queue: UpdateQueue<S, A>,
  action: A,
) {
  invariant(
    numberOfReRenders < RE_RENDER_LIMIT,
    'Too many re-renders. React limits the number of renders to prevent ' +
      'an infinite loop.',
  );

  const alternate = fiber.alternate;
  // render phase 상태 update 
  // currentlyRenderingFiber는 renderWithHooks()에서 할당 비어있지 않다는 것은 render 도중이라는 의미
  // current <- alternate -> workInProgress 이기 때문에 둘다 check필요
   if (
    fiber === currentlyRenderingFiber ||
    (alternate !== null && alternate === currentlyRenderingFiber)
  ) {
  
    // flag true
    didScheduleRenderPhaseUpdate = true;
    const update = {
      expirationTime: renderExpirationTime,
      action,
      suspenseConfig: null,
      eagerReducer: null,
      eagerState: null,
      next: null,
    };

    if (renderPhaseUpdates === null) {
      renderPhaseUpdates = new Map(); // update 임시 저장소
    }

    const firstRenderPhaseUpdate = renderPhaseUpdates.get(queue);
    if (firstRenderPhaseUpdate === undefined) {
      renderPhaseUpdates.set(queue, update); // set(key, value)
    } else {
      // Append the update to the end of the list.
      // linked-list 연결
      let lastRenderPhaseUpdate = firstRenderPhaseUpdate;
      while (lastRenderPhaseUpdate.next !== null) {
        lastRenderPhaseUpdate = lastRenderPhaseUpdate.next;
      }
      lastRenderPhaseUpdate.next = update;
    }
  } else {
    /*idle update..*/
  }
}
```

**Example : didScheduleRenderPhaseUpdate**

- render phase도중 update되는 경우는 다음과 같은 경우입니다.

```jsx
import { useState } from "react";

export default function RenderUpdates() {

    const [count, setCount] = useState(0);
    // render도중 update
    if(count === 1) setCount((prev)=> prev + 1);
    
    return (
	    <div>
        <button onClick = {() => setCount((prev)=> prev +1)}></button>
        <p>{count}</p>
      </div>
    )
}
```

### renderWithHooks(): Part 2

- 다시 돌아와서 didScheduleRenderPhaseUpdate 가 true일때 while문을 살펴보겠습니다.
- dispatchAction()이 render phase 도중 update를 발생시키면 didScheduleRenderPhaseUpdate 값은 true가 될 것이고 while문을 반복할 것입니다.
- 따라서 처음 React를 개발하면 종종 마주하는 Too many re-renders Error가 여기서 발생한다는 것을 확인할 수 있습니다.
    - render 도중 update가 발생하면 numberOfReRenders +=1 이 반복될 것이고 처음에 살펴봤던 전역변수 RE_RENDER_LIMIT = 25 에 도달하면 error를 발생시키게 되는 것입니다.

```jsx
export function renderWithHooks(
  current: Fiber | null, // null 이라면 새로 mount되는 component
  workInProgress: Fiber,
  Component: any,
  props: any,
  refOrContext: any,
  nextRenderExpirationTime: ExpirationTime // 렌더링이 완료되어야 하는 시간
) {
	/*...*/
	  
 // Part2: 렌더링 중 update 다시 발생
 if (didScheduleRenderPhaseUpdate) {
    do {
      didScheduleRenderPhaseUpdate = false
      // 무한 루프 방지, 업데이트 구현체에게 Render phase update Flag
      numberOfReRenders += 1

      // 재호출을 위한 변수 설정
      nextCurrentHook = current !== null ? current.memoizedState : null
      nextWorkInProgressHook = firstWorkInProgressHook
      
      **currentHook = null
      workInProgressHook = null
      componentUpdateQueue = null;
      
      // 업데이트 구현체 주입
      // render도중 update가 발생했으므로 mount가 아니다.
      ReactCurrentDispatcher.current = HooksDispatcherOnUpdate 

      children = Component(props, refOrContext) // 컴포넌트 재호출
    } while (didScheduleRenderPhaseUpdate)

    renderPhaseUpdates = null // Render phase update 저장소 초기화
    numberOfReRenders = 0
  }
  /*...*/
}
```

## 3-3. Hook의 상태변경과 리렌더링

- 위에서는 mounState만 살펴보았지만 mount이후에는 update구현체가 사용됩니다.

### updateState()

[updateState-code](https://github.com/facebook/react/blob/v16.12.0/packages/react-reconciler/src/ReactFiberHooks.js#L848)

- updateState는 updateReducer를 return합니다.

```jsx
function updateState(initialState) {
  return updateReducer(basicStateReducer, initialState)
}
```

- useState() 와 useReducer()의 차이는 내부에서 action을 소비하는 reducer를 외부에서 주입할 수 있는지 없는지 입니다.
- update 구현체에서는 이전의 훅을 다시 불러와야 하며 Hook.queue의 update를 소비하여 최종 state값을 도출해야 합니다.
    - useState(), useReducer() 각 훅 객체마다 행해지며 baseState, baseUpdate에 저장된다.
- **컴포넌트 렌더링 도중 concurrent, suspense등 여러 이유로 중단될 수 있기 때문에 이전 상태 보존을 위해서 작업용 훅을 만들어 사용합니다.**
- 작업용 훅을 생성하는 updateWorkInProgressHook()먼저 살펴보겠습니다.

### updateWorkInProgressHook()

[updateWorkInProgressHook-code](https://github.com/facebook/react/blob/v16.12.0/packages/react-reconciler/src/ReactFiberHooks.js#L593)

- 작업용 hook객체를 만들어 두고 render phase update에서는 만들어 둔 작업용 hook을 재사용합니다.

```jsx
function updateWorkInProgressHook(): Hook {
  // This function is used both for updates and for re-renders triggered by a
  // render phase update. It assumes there is either a current hook we can
  // clone, or a work-in-progress hook from a previous render pass that we can
  // use as a base. When we reach the end of the base list, we must switch to
  // the dispatcher used for mounts.
  
  // nextWorkInProgressHook이 null이 아니라는 것은 render phase update
  // else에서 만들어 둔 작업용 hook 객체 사용
  if (nextWorkInProgressHook !== null) {
    // There's already a work-in-progress. Reuse it.
    // 재사용
    workInProgressHook = nextWorkInProgressHook;
    nextWorkInProgressHook = workInProgressHook.next;

    currentHook = nextCurrentHook;
    nextCurrentHook = currentHook !== null ? currentHook.next : null;
  } else {
    // Clone from the current hook.
    invariant(
      nextCurrentHook !== null,
      'Rendered more hooks than during the previous render.',
    );
    currentHook = nextCurrentHook;
		// 작업용 Hook객체
    const newHook: Hook = {
      memoizedState: currentHook.memoizedState,

      baseState: currentHook.baseState,
      queue: currentHook.queue,
      baseUpdate: currentHook.baseUpdate,

      next: null,
    };
		// linked-list
    if (workInProgressHook === null) {
      // This is the first hook in the list.
      workInProgressHook = firstWorkInProgressHook = newHook;
    } else {
      // Append to the end of the list.
      workInProgressHook = workInProgressHook.next = newHook;
    }
    nextCurrentHook = currentHook.next;
  }
  return workInProgressHook;
}
```

### updateReducer()

[updateReducer-code](https://github.com/facebook/react/blob/v16.12.0/packages/react-reconciler/src/ReactFiberHooks.js#L679)

1. update list인 queue의 head를 가져옵니다.
    1. Hook의 baseUpdate.next or Queue의 last.next
    2. Circular linked list라면 순환 구조를 끊어줍니다.
2. update list(queue)의 head 부터 tail까지 순서대로 action을 소비합니다.
3. 최종 action 소비 상태값을 저장합니다.
- 마찬가지로 renderPhaseUpdate인지 여부에 따라 나뉩니다.

```jsx
function updateReducer<S, I, A>(
  reducer: (S, A) => S,
  initialArg: I,
  init?: I => S,
): [S, Dispatch<A>] {
	// 작업용 훅 생성
  const hook = updateWorkInProgressHook();
  const queue = hook.queue;
  invariant(
    queue !== null,
    'Should have a queue. This is likely a bug in React. Please file an issue.',
  );

  queue.lastRenderedReducer = reducer;
	
	// render phase update 
	// 우선순위를 비교할필요 없이 계속 소비하면 됩니다.
	// queue에 추가되는것이 아니므로 baseUpdate에 결과값을 저장 할 필요 없습니다.
  if (numberOfReRenders > 0) {
    // This is a re-render. Apply the new render phase updates to the previous
    // work-in-progress hook.
    const dispatch: Dispatch<A> = (queue.dispatch: any);
    if (renderPhaseUpdates !== null) {
      // Render phase updates are stored in a map of queue -> linked list
			// renderPhaseUpdates는 render phase도중 업데이트를 소비하기 위한 임시 저장소 입니다.
      const firstRenderPhaseUpdate = renderPhaseUpdates.get(queue);
      if (firstRenderPhaseUpdate !== undefined) {
        renderPhaseUpdates.delete(queue);
        let newState = hook.memoizedState;
        let update = firstRenderPhaseUpdate;
        do {
          // 계속 update를 action하여 소비
          const action = update.action;
          newState = reducer(newState, action);
          update = update.next;
        } while (update !== null);

        hook.memoizedState = newState;
        if (hook.baseUpdate === queue.last) {
          hook.baseState = newState;
        }
        queue.lastRenderedState = newState;

        return [newState, dispatch];
      }
    }
    return [hook.memoizedState, dispatch];
  }

  // The last update in the entire queue
  const last = queue.last;
  // The last update that is part of the base state.
  const baseUpdate = hook.baseUpdate;
  const baseState = hook.baseState;

  // 1. update list인 queue의 head를 가져옵니다.
  let first;
  if (baseUpdate !== null) {
    if (last !== null) {
      last.next = null; // 1-2. 연결을 끊어줍니다.
    }
    first = baseUpdate.next; // 1-1. baseUpdate.next로 head참조
  } else {
    first = last !== null ? last.next : null; // 1-1. circular linked list로 head참조  }
  // 2. update list(queue)의 head 부터 tail까지 순서대로 action을 소비합니다.
  if (first !== null) {
    let newState = baseState;
    let newBaseState = null;
    let newBaseUpdate = null;
    let prevUpdate = baseUpdate;
    let update = first;
    let didSkip = false;
    do {
      const updateExpirationTime = update.expirationTime;
      // 현재 진행중 update가 지금 처리해야 할 update가 아니라면 건너뛴다.
      if (updateExpirationTime < renderExpirationTime) {
        if (!didSkip) {
          didSkip = true;
          newBaseUpdate = prevUpdate;
          newBaseState = newState;
        }
        // Update the remaining priority in the queue.
        if (updateExpirationTime > remainingExpirationTime) {
          remainingExpirationTime = updateExpirationTime;
          markUnprocessedUpdateTime(remainingExpirationTime);
        }
      } else {
	      // 지금 처리해야할 update들이라면 (우선순위 충족)
        // Process this update.
          const action = update.action;
          newState = reducer(newState, action);
        }
      prevUpdate = update;
      update = update.next;
    } while (update !== null && update !== first); // update.next가 null이거나 update가 첫 시작점 first와 같아지면 중단

    if (!didSkip) {
      newBaseUpdate = prevUpdate;
      newBaseState = newState;
    }
    
    
    // Mark that the fiber performed work, but only if the new state is
    // different from the current state.
    if (!is(newState, hook.memoizedState)) {
      markWorkInProgressReceivedUpdate();  //didReceiveUpdate = true
    }

		// 3. 최종 action 소비 상태값을 저장합니다.
		// 이렇게 첫 업데이트가 소비완료되고 난 뒤에는 baseUpdate가 설정되기 때문에 다음 호출 시에는 last.next로 끊어줄 것 입니다.
    hook.memoizedState = newState;
    hook.baseUpdate = newBaseUpdate;
    hook.baseState = newBaseState;

    queue.lastRenderedState = newState;
  }

  const dispatch: Dispatch<A> = (queue.dispatch: any);
  return [hook.memoizedState, dispatch]; // 최종 결과 값 반환
}

```

### Hook.queue → circular linked list / baseState, baseUpdate

```jsx
const hook = {
  memoizedState: null,
  queue: null,
  next: null,
  baseState: null,
  baseUpdate: null,
}

const last = queue.last
if (last === null) {
  update.next = update
} else {
  const first = last.next
  if (first !== null) {
    update.next = first
  }
  last.next = update
}
queue.last = update
```

- setState() 호출시 update는 Hook.queue에 push되어 추가되고 이후 컴포넌트가 재호출 된다면 queue에서 update를 꺼내와서 소비하게 됩니다.
- 문제는 update를 소비할 때 항상 처음(head)부터 시작해 소비하게 된다면 update를 중복으로 처리하게 됩니다.
- 따라서 적용된 부분과 아직 미 적용된 부분을 구분 지을 경계가 필요합니다.
    - 미 적용된 update들만 소비하고 GC를 통한 메모리 확보를 위해서
    - 경계는 baseState, baseUpdate로 표시합니다.
        - baseState = baseUpdate 실행 state 값
        - baseUpdate = 마지막으로 적용된 update pointer
    - baseUpdate 이후 update들은 미적용 Update list

![image](https://github.com/user-attachments/assets/c1794a59-95df-4fba-b75c-edbc57b8710c)

- queue는 last를 통해 마지막 update만 참조하고 있으며 첫 update가 발생하기전까지 baseUpdate는 null이기 때문에 첫 update소비 전까지는 시작점(head)를 알수가 없습니다.
    - 따라서 첫 업데이트 발생 전까지는 자기 자신을 가리키도록 하여 circular linked list로 만듭니다.
- 이 후 setState()호출할 때마다 queue에 추가될 것이며 **첫 소비가 발생하기 전까지는 아래와 같은 동작으로 순환구조를 유지하게 됩니다.**

![image](https://github.com/user-attachments/assets/02242afe-b410-4d69-a6c5-d3102e4612e7)

![image](https://github.com/user-attachments/assets/8ed94109-20d6-4074-8d56-3e2ee3d702c7)

- 첫 소비시점에 last.next = null을 할당하여 끊어줍니다.
- 따라서 fisrt !== null이라는 것은 baseUpdate가 아직 존재하지 않기 때문에 head를 참조하기 위해 circular linked list 로 계속 유지해 주는 것입니다.

    ```jsx
    	
    const first = last.next;
    if(first !== null) {
    	update.next = fisrt
    }
    ```

- 소비 로직을 정리해보면 다음과 같습니다.

    ```jsx
    let first // 적용시킬 update의 시작점 찾기
    if (baseUpdate !== null) { // baseUpdate가있고
    	if (last !== null) { // last가 있다면
    		last.next = null // 순환을 끊어줍니다.
    	}
    	first = baseUpdate.next // baseUpdate.next로 head(시작점) 참조
    } else { // baseUpdate가 없다면, 즉 update가 진행된 적 없다면
    	first = last !== null ? last.next : null // 순환구조 상태이기 때문에 last.next가 첫 시작점인 head를 갖고 있을 것이다.
    }
    
    /* ... 소비 로직 */
    while (update !== null && update !== first); // update.next가 null이거나 update가 첫 시작점 first와 같아지면 중단
    
    // 이렇게 첫 업데이트가 소비완료되고 난 뒤에는 baseUpdate가 설정되기 때문에 다음 호출 시에는 last.next로 끊어줄 것 입니다.
    hook.memoizedState = newState;
    hook.baseUpdate = newBaseUpdate;
    hook.baseState = newBaseState;
    ```

    - 첫 소비 시에는 circular linked list의 head를 시작점으로 하여 첫 시작점과 같아질 때 종료하고 baseUpdate로 tail표시
    - 다음 소비 시에는 baseUpdate가 있기 때문에 last.next로 순환 구조를 끊어주고 종료시점을 판단합니다.

## mount & update

### mount

- **`ReactDOM.render()` 호출** ➡️ **컴포넌트 트리 생성** ➡️ **Render Phase (Virtual DOM 생성)** ➡️ **Reconciliation (처음이므로 비교 생략)** ➡️ **Commit Phase (DOM 생성 및 반영)** ➡️ **화면에 출력**

### update

- **`setState()` 호출** ➡️ **dispatchAction()** ➡️ **scheduleUpdateOnFiber()** ➡️ **scheduleWork()** ➡️ **컴포넌트 다시 호출 (Render Phase)** ➡️ **Reconciliation (Virtual DOM 비교)** ➡️ **Commit Phase (DOM 생성 및 반영)** ➡️ **화면에 출력**

---

# Summary

- Hook에 관한 내용이 길어져서 다음 글로 끊어갈까 했지만 전체 흐름 파악에 더 어려움이 있을 것 같아 길더라도 이번 글에서 마무리 지었습니다.
- 이번 글에서는 꽤나 많이 접해본 에러와 최적화, 코드들을 살펴볼 수 있었습니다.
    - Too many re-renders 에러는 왜 발생하는 것 인지?
    - Invalid hook 에러는 왜 발생하는 것 인지?
    - useState() 의 초기값을 lazy init으로 최적화 하는 것은 어떻게 가능한 것인지?
    - useState()는 어떻게 구현되어 있으며 `const [state, setState] = useState();` 는 어디서 왔는지
    - setState를 여러번 호출하면 어떻게 되는지?
    - render phase 도중 발생한 setState()는 어떻게 처리되는지?
    - 렌더링 최적화는 어떤식으로 이루어지는지?
- 다음 글에서는 <b>update…</b>에 이어서 <b>reconcileChildren()</b>함수부터 이어서 render phase를 진행해보도록 하겠습니다.