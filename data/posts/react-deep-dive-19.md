이번 글에서도 분석의 바탕이 되는 코드는 [React 16.12.0 version](https://github.com/facebook/react/tree/v16.12.0)을 기준으로 하며, [해당 블로그](https://goidle.github.io/)에 감사 인사를 전합니다.

지난 글에서는 update가 이루어진 컴포넌트를 바탕으로 **reconcileChildren()** 과정을 살펴보았습니다.

이번 글에서는 reconcile된 Fiber를 Commit phase에서 사용할 수 있도록 마무리 하는 작업을 이어가보겠습니다.

아래 링크는  React의 렌더링 흐름에 따라 저 나름대로의 그림을 그려보았으며, 이 흐름에 따라 글이 이어 질 것입니다. (무단 복사 및 배포는 하지 말아주세요)

<a href="https://excalidraw.com/#json=9OvAI9bAcgOh5_pgeshV2,WeZyGvvW-nQ0nmIk-CiZVQ" target="_blank">Gy's React Diagram</a>

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

3) Perform rendering with hooks.

4) ReconcileChildren

5) <span style='background-color: #FFB6C1'>Finishing Work</span>

**5. Reconciler Commit Phase**

1) Execute `useEffect` and `useLayoutEffect`.

**6. Browser Paint**

---

# 1. Before

- 이전 글에서 컴포넌트를 호출하고 Fiber로 확장해 subtree를 reconcile하는 과정까지 살펴보았습니다.
- **reconcileChildren()**은 이 과정에서 **부모 컴포넌트가 반환한 새로운 JSX와 기존의 Fiber 트리를 비교**하는 역할을 합니다.

  ![image](https://github.com/user-attachments/assets/423b1522-ed6c-4a86-83f7-5fa3921ea941)

- **하나의 Work는 단일 Fiber에 해당하는 것이 아니라 Compoent호출로 인하여 변경된 모든 작업을 포함합니다.**
- 과정을 정리해보겠습니다.

    ```jsx
    import { useState } from "react";
    
    export default function App () {
        return (
            <TodoList />
        )
    }
    
    function TodoList () {
        const [todos, setTodos] = useState([]);
        return (
            <>
                <Input submit={(todo) => setTodos([...todos, todo])} />
                <List list = {todos} />
            </>
        )
    }
    
    function Input ({submit}) {
        const [todo, setTodo] = useState("");
        return(
            <>
            <input value={todo} onChange={(e) => setTodo(e.target.value)}/>
            <button onClick={() => {
                submit(todo);
                setTodo("");
            }}>Add</button>
            </>
        )
    }
    
    function List ({list}) {
        return (
            <ul>
                {list.map((todo, i) => <li key={i}>{todo}</li>)}
            </ul>
        )
    }
    ```

- List Component에 대한 Update는 생략하겠습니다.
- Input 컴포넌트에서 setTodo()로 인해 dispatchAction() → Update가 발생했다고 가정해봅시다.
    1. **업데이트 발생**:
        - `App` 및 `TodoList` 컴포넌트는 변경되지 않았기 때문에, **Bailout하여 빠르게 Update가 발생한 Input 컴포넌트까지 도달합니다.**
        - `Input` 컴포넌트에서 상태 업데이트 발생 → `workLoopSync()` 실행.
    2. **첫 번째 작업 - `Input` 컴포넌트**:
        - `(1) workLoopSync()` -> `(2) performUnitOfWork()` → `(3) beginWork()` → `(5) updateFunctionComponent()`(Input Component 호출)→ `(6) reconcileChildren()`
        - `(6) reconcileChildren()`은 **첫 번째 자식 노드인 `<input>` Fiber**를 반환. (이때 서브트리 input의  value 또한 변경 적용 됨)
        - `workInProgress`로 **`<input>` Fiber**를 설정.
    3. **두 번째 작업 - `input` 태그**:
        - `(1) workLoopSync()` ->`(2) performUnitOfWork()` → `(3) beginWork()` → `(5) updateHostComponent()`(value가 변경되었기에 Update진행)→ `(6) reconcileChildren()`
        - 자식 노드가 없으므로 `(6) reconcileChildren()` `return null`
        - 자식 노드가 없으므로 `(7) completeUnitOfWork()`  → `(8) completeWork()`
        - **형제 노드 `<button>` Fiber** 반환.
    4. **세 번째 작업 - `button` 태그**:
        - `(1) workLoopSync()` ->`(2) performUnitOfWork()` → `(3) beginWork()` → `(5) updateHostComponent()` (변경점이 없으므로 `bailoutOnAlreadyFinishedWork()`하여 `return null`
        - 자식이 없으므로 `(7) completeUnitOfWork()` → `(8) completeWork()`
        - 모든 작업 완료 후, **`workLoopSync()` 종료**.
- update 발생으로 인한 컴포넌트 호출은 다음과 같습니다만 (전위순회)
    - `<App />` → `<TodoList />` → `<Input />` (input, button ⇒ HostComponent) → `<List />`
- 마무리 순서는 다음과 같습니다. (후위순회)
    - `<input />` → `<button />` → `<Input />` → `<List />` → `<TodoList />` - > `<App/>`

  <img src="https://github.com/user-attachments/assets/d83a03e0-6aa1-419b-ae74-1bb6f4042aa9" alt="exception"/>

- 이번 글에서는 Work의 결과물들을 정리하고 마무리 하는 `completeUnitOfWork()` 와 `completeWork()`함수를 살펴보겠습니다.

---

# 2. Render phase

- return **`(6) reconcileChildren()`** → return **`(5) update…`** → return **`(3) beginWork()`** = `null`이면 `(7) completeUnitOfWork()`를 실행합니다.
- **`(3) beginWork()`** = `null`이라는 것은 leaf노드 까지 도달했다는 뜻이고 형제 노드로 이동해야 합니다.

```jsx
function performUnitOfWork(unitOfWork: Fiber): Fiber | null {
  const current = unitOfWork.alternate

  let next = beginWork(current, unitOfWork, renderExpirationTime) // 자식 반환
  unitOfWork.memoizedProps = unitOfWork.pendingProps
  // leaf까지 도달했으면 형제 탐색
  if (next === null) {    
	  next = completeUnitOfWork(unitOfWork)  // 형제 반환
  }

  ReactCurrentOwner.current = null
  return next
}
```

- Work를 완료하려면 다음 사항들을 정리해줘야 합니다.
    - Host_Config 관련 부분 → `completeWork()`
    - V-DOM 변경점을 담고 있는 Side-Effects → `completeUnitOfWork()`

### 2-1) completeUnitOfWork()

[completeUnitOfWork-code](https://github.com/facebook/react/blob/v16.12.0/packages/react-reconciler/src/ReactFiberWorkLoop.js#L1498)

- 현재 작업 중인 unitOfWork를 완료하고, 다음 형제 노드로 이동합니다.
- 형제 노드가 없으면 부모 Fiber로 돌아갑니다.
- leaf노드와 sibling 모두 마무리되었다면 부모 또한 여기서 마무리해주며 while문을 반복합니다.
- while문은 최상단 노드인 HostRoot에 도달하며 끝납니다.
- effect는 자식을 먼저 연결해주고 자신을 맨 마지막에 추가하여 순서대로 처리됩니다. (후위순회)

```jsx
function completeUnitOfWork(unitOfWork: Fiber): Fiber | null {
  workInProgress = unitOfWork;
  
  do {
    const current = workInProgress.alternate;
    const returnFiber = workInProgress.return;

    // 작업이 완료되었는지 혹은 오류가 발생했는지 확인합니다.
    if ((workInProgress.effectTag & Incomplete) === NoEffect) { // 작업 중 오류가 발생하지 않았다면 
      let next;
      // leaf 노드의 작업 마무리
      next = completeWork(current, workInProgress, renderExpirationTime);
      // 작업이 완료되었기 때문에 더이상 expirationTime은 필요하지 않습니다.
      resetChildExpirationTime(workInProgress);

      if (next !== null) {
        // 이 Fiber에서 추가 작업이 발생한 경우, 그 작업을 다음에 처리합니다.
        return next;
      }
			// effect-list 연결 
      if (
        returnFiber !== null &&
        // 형제가 완료에 실패한 경우 effect를 부모에게 달면 안됩니다. check
        (returnFiber.effectTag & Incomplete) === NoEffect
      ) {
        // 부모 Fiber에 자식 노드의 effect를 연결합니다.
        if (returnFiber.firstEffect === null) {
          returnFiber.firstEffect = workInProgress.firstEffect;
        }
        if (workInProgress.lastEffect !== null) {
          if (returnFiber.lastEffect !== null) {
            returnFiber.lastEffect.nextEffect = workInProgress.firstEffect;
          }
          returnFiber.lastEffect = workInProgress.lastEffect;
        }
        
        // 현재 Fiber의 effect연결
        // 이 Fiber에 side-effects가 있다면, 자식들의 side-effects 뒤에 추가합니다.
        const effectTag = workInProgress.effectTag;
				// PerformedWork는 updateFucntionComponent()에서 component호출 후 달아주었다.
        // 단순히 컴포넌트가 렌더링된 것 이외에 추가적인 side-effect가 존재한다는 것을 의미
        // 호출 이외에 side-effect를 체크
        if (effectTag > PerformedWork) {
          if (returnFiber.lastEffect !== null) {
            returnFiber.lastEffect.nextEffect = workInProgress;
          } else {
            returnFiber.firstEffect = workInProgress;
          }
          returnFiber.lastEffect = workInProgress;
        }
      }
    } else {
      // 오류가 발생했을 경우, 완성 단계에 들어가지 않고 스택에서 값을 제거합니다.
			// 완성하지 못했기 때문에 expirationTime을 reset 하지 않습니다.
      // 부모 Fiber를 미완료 상태로 표시하고, 효과 목록을 초기화합니다.
			/*.. 오류발생 처리 코드 ..*/
    }

    const siblingFiber = workInProgress.sibling;
    if (siblingFiber !== null) {
      // 형제 Fiber가 있으면 Work를 진행하기 위해서 반환합니다.
      return siblingFiber;
    }
    // 그렇지 않으면 부모 Fiber로 돌아갑니다.
    workInProgress = returnFiber;
  } while (workInProgress !== null);

  // 루트에 도달했을 때 완료 상태로 설정합니다.
  if (workInProgressRootExitStatus === RootIncomplete) {
    workInProgressRootExitStatus = RootCompleted;
  }
  return null;
}

```

- 주의할 점은 effectTag는 말 그대로 effect의 flag를 설정하는 것으로 현재 Fiber의 effect 상태를 표시합니다.
- fisrtEffect와 lastEffect는 현재 fiber의 effect리스트가 아닌 effect가 발생한 자식 Fiber자체를 리스트로 갖습니다.
- 다시 말하면, `firstEffect`와 `lastEffect`는 **부모 노드가 자식들 사이에서 side-effect를 추적하는 역할**을 하지만, 이는 **side-effect가 있는 자식 Fiber들만** 연결합니다.
- 즉, **side-effect**가 없는 자식은 `firstEffect`나 `lastEffect`에 포함되지 않습니다.

    ```jsx
    // Effect
    effectTag: SideEffectTag,
    
    // Singly linked list fast path to the next fiber with side-effects.
    nextEffect: Fiber | null,
    
    // The first and last fiber with side-effect within this subtree. This allows
    // us to reuse a slice of the linked list when we reuse the work done within
    // this fiber.
    firstEffect: Fiber | null,
    lastEffect: Fiber | null,
      
    function FiberNode(tag, pendingProps, key){
    	/*...*/
      // Effects
      this.effectTag = NoEffect; // fiber가 가지고 있는 effect Tag
      // Fiber 자체를 참조
      this.nextEffect = null; // side effect list 
      this.firstEffect = null; // side effect list
      this.lastEffect = null; // side effect list 
    	/*...*/
    }
    
    // 예를들면 다음과 같습니다. 
    ParentFiber
      ├── firstEffect -> ChildFiber1
      └── lastEffect -> ChildFiber3
    
    ChildFiber1 -> nextEffect -> ChildFiber2 -> nextEffect -> ChildFiber3
    
    // effect Tag
    export const NoEffect = /                / 0b0000000000000;
    export const PerformedWork = /           / 0b0000000000001;
    export const Placement = /               / 0b0000000000010;
    export const Update = /                  / 0b0000000000100;
    export const PlacementAndUpdate = /      / 0b0000000000110;
    export const Deletion = /                / 0b0000000001000;
    export const ContentReset = /            / 0b0000000010000;
    export const Passive = /                 / 0b0001000000000;
    ```

- `if (effectTag > PerformedWork)`
    - effectTag의 값이 PerformedWork의 값보다 크거나 같다는 것은 해당 Fiber 노드에 적용된 작업이 PerformedWork 이상의 중요도나 작업 범위를 가지고 있음을 의미합니다.

### 2-2) completeWork()

[completeWork-code](https://github.com/facebook/react/blob/v16.12.0/packages/react-reconciler/src/ReactFiberCompleteWork.js#L632)

- commit phase에서는 완성된 element를 요구하기 때문에 element를 완성해줍니다.
- element 생성, 수정, 삭제, event binding, attribute set, Update Tag, focus..etc
- 새롭게 생성된 Fiber라면 Element도 생성해주어야 하고 아니라면 Update해줍니다.
- 여기서 element의 부모 자식 연결은 **V-DOM에서의 연결이 아닌 실제 DOM에서의 연결입니다**.
- 생성 부분 코드 먼저 살펴보고 업데이트를 살펴보겠습니다.

```jsx
function completeWork(
  current: Fiber | null,
  workInProgress: Fiber,
  renderExpirationTime: ExpirationTime
): Fiber | null {
  const newProps = workInProgress.pendingProps
  // 마찬가지 workInProgress의 tag에 따라 라우팅
  switch (workInProgress.tag) {
    case IndeterminateComponent:
    case SimpleMemoComponent:
    case FunctionComponent:
    case ClassComponent: {
      break
    }
     /*...*/
     case HostComponent: {
      const rootContainerInstance = getRootHostContainer(); // get HostRoot
      const type = workInProgress.type;
      if (current !== null && workInProgress.stateNode != null) {
	      // element 업데이트
        updateHostComponent(
          current,
          workInProgress,
          type,
          newProps,
          rootContainerInstance,
        );
      }  else {
        // element 생성
	      let instance = createInstance( 
            type,
            newProps,
            rootContainerInstance,
            currentHostContext,
            workInProgress,
         );
        // 새로 생성한 instance 하위에 자식 노드들이 있다면 추가해줍니다. 
        appendAllChildren(instance, workInProgress, false, false);
        workInProgress.stateNode = instance; // 생성된 element를 Fiber의 stateNode에 저장

        // event binding, attribute set, auto focus, Update Tag
        if (finalizeInitialChildren(instance, type, newProps, rootContainerInstance)) {
          markUpdate(workInProgress);
        }
      }
      break;
    }
    // suspense, portal..
  }
}
```

## 2-2) Part 1 / HTML Element 생성

### 2-2-1) createInstance()

[createInstance-code](https://github.com/facebook/react/blob/v16.12.0/packages/react-dom/src/client/ReactDOMHostConfig.js#L213)

- 설명은 주석을 통해 하겠습니다.

```jsx
export function createInstance(
  type: string,
  props: Props,
  rootContainerInstance: Container, // HostRoot
  hostContext: HostContext, 
  internalInstanceHandle: Object, // workInProgress
): Instance {
  let parentNamespace: string;
  parentNamespace = ((hostContext: any): HostContextProd)
  const domElement: Instance = createElement( // document.createElement()
    type,
    props,
    rootContainerInstance,
    parentNamespace,
  );
  // Host_Config = Browser 가정
  // Fiber.stateNode -> DOM 요소 참조하는 것처럼
  // DOM -> Fiber 참조할 수 있도록 fiber, props를 element에 저장
  precacheFiberNode(internalInstanceHandle, domElement);
  updateFiberProps(domElement, props);
  return domElement;
}

```

```jsx
const randomKey = Math.random().toString(36).slice(2)
const internalInstanceKey = '__reactInternalInstance$' + randomKey
const internalEventHandlersKey = '__reactEventHandlers$' + randomKey

// Fiber instance 저장
// node => 실제 DOM node
function precacheFiberNode(hostInst, node) {
  node[internalInstanceKey] = hostInst
}
// props 저장
function updateFiberProps(node, props) {
  node[internalEventHandlersKey] = props
}
```

### 2-2-2) appendAllChildren()

[appendAllChildren-code](https://github.com/facebook/react/blob/v16.12.0/packages/react-reconciler/src/ReactFiberCompleteWork.js#L151)

- 실제 DOM 기준 자식 Host Component를 연결해줍니다.

```jsx
function appendAllChildren = function(
    parent: Instance, // DOM node
    workInProgress: Fiber,
    needsVisibilityToggle: boolean,
    isHidden: boolean,
  ) {
    // 최상위 Fiber만 생성했지만 하위 모든 컴포넌트를 반복해서 연결해줍니다.
    // We only have the top Fiber that was created but we need recurse down its
    // children to find all the terminal nodes.
    let node = workInProgress.child; // 여기서의 Node는 Fiber입니다.
    // Fiber 트리에서 하위 노드를 탐색하기 위한 시작점입니다.
    // 자식 노드가 있을 동안 반복합니다.
    while (node !== null) {
	    // Host Component (HTML 엘리먼트와 같은 최종 렌더링 요소인지 확인)
      if (node.tag === HostComponent || node.tag === HostText) {
	      // Fiber가 Host Component나 Text인 경우, 실제 DOM 노드(stateNode)를 부모 노드에 추가합니다.
        appendInitialChild(parent, node.stateNode); // parent.appendChild(node.stateNode)
      // Other Component (기타 특수 컴포넌트)
      } else if (enableFundamentalAPI && node.tag === FundamentalComponent) {
        // FundamentalComponent인 경우도 마찬가지로 실제 DOM 인스턴스를 부모에 추가합니다.
        appendInitialChild(parent, node.stateNode.instance);
      } else if (node.tag === HostPortal) {
        // Portal인 경우, 자식들을 개별적으로 처리하기 때문에 이 트리에서 더 이상 탐색하지 않습니다
        // If we have a portal child, then we don't want to traverse
        // down its children. Instead, we'll get insertions from each child in
        // the portal directly.
      } else if (node.child !== null) {
	      // 자식이 있는 경우, 그 자식으로 내려가 계속 탐색을 이어갑니다.
        node.child.return = node; // 자식의 return 값을 현재 노드로 설정합니다.
        node = node.child;
        continue;
      }
      // workInProgress 노드로 되돌아가면 더 이상 진행할 필요가 없으므로 종료합니다.
      if (node === workInProgress) {
        return;
      }
      // 형제가 없으면 부모로 돌아가 형제가 있는지 확인합니다.
      while (node.sibling === null) {
        // 부모가 없거나 부모가 workInProgress와 같으면 종료합니다.
        if (node.return === null || node.return === workInProgress) {
          return;
        }
        // 부모로 돌아가 탐색을 계속합니다.
        node = node.return;
      }
      // 형제가 있는 경우 그 형제를 탐색 대상으로 설정합니다.
      node.sibling.return = node.return;
      node = node.sibling;
    }
  };
```

### 2-2-3) finalizeInitialChildren()

[finalizeInitialChildren-code](https://github.com/facebook/react/blob/v16.12.0/packages/react-dom/src/client/ReactDOMHostConfig.js#L258)

```jsx
function finalizeInitialChildren(
  domElement: Instance,
  type: string,
  props: Props, 
  rootContainerInstance: Container
): boolean {
  setInitialProperties(domElement, type, props, rootContainerInstance)
  return shouldAutoFocusHostComponent(type, props) // auto focus 여부반환 true / false
}
```

### 2-2-3-2) setInitialProperties()

[setInitialProperties-code](https://github.com/facebook/react/blob/v16.12.0/packages/react-dom/src/client/ReactDOMComponent.js#L511)

- Event Listener를 bind하고 attribute를 추가해줍니다.
- Event binding에 대한 자세한 부분은 넘어가겠습니다.
    - `trapBubbledEvent()`는 명시된 이벤트만 element에 바인딩
    - `ensureListeningTo()`는 명시된 이벤트 이외에도 해당 이벤트와 의존성을 가지고 있는 이벤트를 document에 이벤트 위임 형식으로 바인딩 ex) onChange

```jsx
export function setInitialProperties(
  domElement: Element,
  tag: string,
  rawProps: Object,
  rootContainerElement: Element | Document, 
): void {
  const isCustomComponentTag = isCustomComponent(tag, rawProps);

  // TODO: Make sure that we check isMounted before firing any of these events.
  let props: Object;
  // Event Binding
  switch (tag) {
    case 'iframe':
    case 'object':
    case 'embed':
      trapBubbledEvent(TOP_LOAD, domElement);
      props = rawProps;
      break;
    case 'video':
    case 'audio':
      // Create listener for each media event
      for (let i = 0; i < mediaEventTypes.length; i++) {
        trapBubbledEvent(mediaEventTypes[i], domElement);
      }
      props = rawProps;
      break;
    case 'source':
      trapBubbledEvent(TOP_ERROR, domElement);
      props = rawProps;
      break;
    case 'img':
    case 'image':
    case 'link':
      trapBubbledEvent(TOP_ERROR, domElement);
      trapBubbledEvent(TOP_LOAD, domElement);
      props = rawProps;
      break;
    case 'form':
      trapBubbledEvent(TOP_RESET, domElement);
      trapBubbledEvent(TOP_SUBMIT, domElement);
      props = rawProps;
      break;
    case 'details':
      trapBubbledEvent(TOP_TOGGLE, domElement);
      props = rawProps;
      break;
    case 'input':
      ReactDOMInputInitWrapperState(domElement, rawProps);
      props = ReactDOMInputGetHostProps(domElement, rawProps);
      trapBubbledEvent(TOP_INVALID, domElement);
      // For controlled components we always need to ensure we're listening
      // to onChange. Even if there is no listener.
      ensureListeningTo(rootContainerElement, 'onChange');
      break;
    case 'option':
      ReactDOMOptionValidateProps(domElement, rawProps);
      props = ReactDOMOptionGetHostProps(domElement, rawProps);
      break;
    case 'select':
      ReactDOMSelectInitWrapperState(domElement, rawProps);
      props = ReactDOMSelectGetHostProps(domElement, rawProps);
      trapBubbledEvent(TOP_INVALID, domElement);
      // For controlled components we always need to ensure we're listening
      // to onChange. Even if there is no listener.
      ensureListeningTo(rootContainerElement, 'onChange');
      break;
    case 'textarea':
      ReactDOMTextareaInitWrapperState(domElement, rawProps);
      props = ReactDOMTextareaGetHostProps(domElement, rawProps);
      trapBubbledEvent(TOP_INVALID, domElement);
      // For controlled components we always need to ensure we're listening
      // to onChange. Even if there is no listener.
      ensureListeningTo(rootContainerElement, 'onChange');
      break;
    default:
      props = rawProps;
  }

  assertValidProps(tag, props);
	// attribute add
  setInitialDOMProperties(
    tag,
    domElement,
    rootContainerElement,
    props,
    isCustomComponentTag,
  );

  switch (tag) {
    case 'input':
      // TODO: Make sure we check if this is still unmounted or do any clean
      // up necessary since we never stop tracking anymore.
      track((domElement: any));
      ReactDOMInputPostMountWrapper(domElement, rawProps, false);
      break;
    case 'textarea':
      // TODO: Make sure we check if this is still unmounted or do any clean
      // up necessary since we never stop tracking anymore.
      track((domElement: any));
      ReactDOMTextareaPostMountWrapper(domElement, rawProps);
      break;
    case 'option':
      ReactDOMOptionPostMountWrapper(domElement, rawProps);
      break;
    case 'select':
      ReactDOMSelectPostMountWrapper(domElement, rawProps);
      break;
    default:
      if (typeof props.onClick === 'function') {
        // TODO: This cast may not be sound for SVG, MathML or custom elements.
        trapClickOnNonInteractiveElement(((domElement: any): HTMLElement));
      }
      break;
  }
}
```

- **`ReactDOMInputInitWrapperState(domElement, rawProps)`, `ReactDOMInputGetHostProps(domElement, rawProps);` → input tag에 기본적으로 필요한 속성 추가**

  [ReactDOMInputInitWrapperState, ReactDOMInputGetHostProps - code](https://github.com/facebook/react/blob/v16.12.0/packages/react-dom/src/client/ReactDOMInput.js#L73)

    ```jsx
    // ReactDOMInputInitWrapperState
    function initWrapperState(element: Element, props: Object) {
      const node = element
      const defaultValue = props.defaultValue == null ? '' : props.defaultValue
    
      node._wrapperState = {
        initialChecked:
          props.checked != null ? props.checked : props.defaultChecked,
        initialValue: getToStringValue(
          props.value != null ? props.value : defaultValue
        ),
        controlled: isControlled(props),
      }
    }
    
    function isControlled(props) {
      const usesChecked = props.type === 'checkbox' || props.type === 'radio'
      return usesChecked ? props.checked != null : props.value != null
    }
    
    // ReactDOMInputGetHostProps
    function getHostProps(element: Element, props: Object) {
      const node = element
      const checked = props.checked
    
      const hostProps = Object.assign({}, props, {
        defaultChecked: undefined,
        defaultValue: undefined,
        value: undefined,
        checked: checked != null ? checked : node._wrapperState.initialChecked,
      })
    
      return hostProps
    }
    ```

- **`setInitialDOMProperties(args);` → Host Component가 가지고 있는 props를 element에 적용**
- Host에서 Props 그대로 사용할 수 없기 때문에 가공처리

  [setInitialDOMProperties-code](https://github.com/facebook/react/blob/v16.12.0/packages/react-dom/src/client/ReactDOMComponent.js#L308)

    ```jsx
    function setInitialDOMProperties(
      tag: string,
      domElement: Element,
      rootContainerElement: Element | Document,
      nextProps: Object,
      isCustomComponentTag: boolean
    ): void {
      for (const propKey in nextProps) {
        if (!nextProps.hasOwnProperty(propKey)) {
          continue
        }
    
        const nextProp = nextProps[propKey]
    
        if (propKey === STYLE) {
          setValueForStyles(domElement, nextProp)
        } else if (propKey === DANGEROUSLY_SET_INNER_HTML) {
          const nextHtml = nextProp ? nextProp[HTML] : undefined
          if (nextHtml != null) {
            setInnerHTML(domElement, nextHtml)
          }
        } else if (propKey === CHILDREN) {
          if (typeof nextProp === 'string') {
            setTextContent(domElement, nextProp)
          } else if (typeof nextProp === 'number') {
            setTextContent(domElement, '' + nextProp)
          }
        } else if (registrationNameModules.hasOwnProperty(propKey)) {
          if (nextProp != null) {
            ensureListeningTo(rootContainerElement, propKey)
          }
        } else if (nextProp != null) {
          setValueForProperty(domElement, propKey, nextProp, isCustomComponentTag)
        }
      }
    }
    ```

- registrationNameModules에는 HTML 모든 이벤트를 on*** 형태로 보유
- Props
    - [setValueForStyles](https://github.com/facebook/react/blob/v16.12.0/packages/react-dom/src/shared/CSSPropertyOperations.js#L62)
    - [setInnerHTML](https://github.com/facebook/react/blob/v16.12.0/packages/react-dom/src/client/setInnerHTML.js#L26)
    - [setTextContent](https://github.com/facebook/react/blob/v16.12.0/packages/react-dom/src/client/setTextContent.js#L21)
    - [setValueForProperty](https://github.com/facebook/react/blob/v16.12.0/packages/react-dom/src/client/DOMPropertyOperations.js#L127)

### 2-2-3-2) shouldAutoFocusHostComponent()

[shouldAutoFocusHostComponent-code](https://github.com/facebook/react/blob/v16.12.0/packages/react-dom/src/client/ReactDOMHostConfig.js#L132)

- HTML 요소의 타입과 해당 요소의 속성(props)을 기반으로 `autoFocus`가 설정되었는지 여부를 확인합니다.

```jsx
function shouldAutoFocusHostComponent(type: string, props: Props): boolean {
  switch (type) {
    case 'button':
    case 'input':
    case 'select':
    case 'textarea':
      return !!props.autoFocus
  }
  return false
}
```

### 2-2-4) markUpdate()

[markUpdate-code](https://github.com/facebook/react/blob/v16.12.0/packages/react-reconciler/src/ReactFiberCompleteWork.js#L134)

- finalizeInitialChildren() 반환 값이 true일때 Update Tag를 추가해줍니다.

```jsx
function markUpdate(workInProgress: Fiber) {
  // Tag the fiber with an update effect. This turns a Placement into
  // a PlacementAndUpdate.
  workInProgress.effectTag |= Update;
}
```

## 2-2) Part 2 / HTML Element 업데이트

### 2-2-5) updateHostComponent()

[updateHostComponent-code](https://github.com/facebook/react/blob/v16.12.0/packages/react-reconciler/src/ReactFiberCompleteWork.js#L191)

- `updateHostComponent()`는 current ↔ workInProgress 간의 차이점을 Commit phase에서 소비할 수 있도록 가공합니다.
- 실질적으로 **props가 element에 반영되는 시점은 Commit phase** 입니다.

```jsx
 updateHostComponent = function(
    current: Fiber,
    workInProgress: Fiber,
    type: Type,
    newProps: Props,
    rootContainerInstance: Container,
  ) {
	  // 만약 alternate가 존재하면, 이는 업데이트라는 의미이며,
	  // 업데이트를 수행하기 위한 side-effect(부수 효과)를 예약해야 합니다.
    const oldProps = current.memoizedProps;
    // 변경점 없음
    if (oldProps === newProps) {
      // 만약 mutation 모드에서 자식이 변경되었더라도 이 노드를 건드리지 않으므로,
	    // 이 코드만으로도 동작을 최적화할 수 있습니다. (bailout: 작업 중단)
      return;
    }

    // 만약 자식이 업데이트되어 우리가 함께 업데이트되었고,
	  // 새로운 속성(newProps)이 없다면, 기존 속성(oldProps)을 재사용해야 합니다.
    const instance: Instance = workInProgress.stateNode;
    const currentHostContext = getHostContext();
		// 변경점을 찾아 가공 데이터 반환
		// 추가, 수정, 삭제 등
    const updatePayload = prepareUpdate( 
      instance,
      type,
      oldProps,
      newProps,
      rootContainerInstance,
      currentHostContext,
    );
    // updateQueue에 저장
    // updateQueue에는 함수형 컴포넌트는 라이프 사이클 hook을 저장하고 호스트 컴포넌트는 변경된 정보를 저장합니다
    workInProgress.updateQueue = (updatePayload: any);
    // updatePayload에 변경이 있거나 새로운 ref가 있을 경우, 이를 업데이트로 표시합니다.
    // 모든 작업은 commitWork에서 처리됩니다.
    if (updatePayload) {
      markUpdate(workInProgress); // Update Tag 추가 -> Commit phase에서 적용을 위함
    }
  };
```

### 2-2-5-1) prepareUpdate()

- 변경점 추출은 마찬가지로 O(n)을 보장하기 위해서 2단계로 나누어 처리합니다.
    1. current 기준 workInProgress에 없다면 → **삭제**
    2. workInProgress 기준 current에 없다면 → **추가**, 값이 다르다면 → **수정**

[prepareUpdate-code](https://github.com/facebook/react/blob/v16.12.0/packages/react-dom/src/client/ReactDOMHostConfig.js#L269)

```jsx
export function prepareUpdate(
  domElement: Instance,
  type: string,
  oldProps: Props, // current.memoizedProps;
  newProps: Props,
  rootContainerInstance: Container,
  hostContext: HostContext,
): null | Array<mixed> {
 
  return diffProperties(
    domElement,
    type,
    oldProps,
    newProps,
    rootContainerInstance,
  );
}

```

### **diffProperties()**

[diffProperties-code](https://github.com/facebook/react/blob/v16.12.0/packages/react-dom/src/client/ReactDOMComponent.js#L643)

- style은 유일하게 추가, 수정, 삭제가 한번에 가능할 수 있다.

```jsx
// Calculate the diff between the two objects.
export function diffProperties(
  domElement: Element,
  tag: string,
  lastRawProps: Object, //  current.memoizedProps;
  nextRawProps: Object,
  rootContainerElement: Element | Document,
): null | Array<mixed> {

	// 변경점 저장소
	// [[key, value], ...] 
  let updatePayload: null | Array<any> = null;

  let lastProps: Object;
  let nextProps: Object;
  // 기본 속성 추가
  switch (tag) {
    case 'input':
      lastProps = ReactDOMInputGetHostProps(domElement, lastRawProps);
      nextProps = ReactDOMInputGetHostProps(domElement, nextRawProps);
      updatePayload = [];
      break;
    case 'option':
      lastProps = ReactDOMOptionGetHostProps(domElement, lastRawProps);
      nextProps = ReactDOMOptionGetHostProps(domElement, nextRawProps);
      updatePayload = [];
      break;
    case 'select':
      lastProps = ReactDOMSelectGetHostProps(domElement, lastRawProps);
      nextProps = ReactDOMSelectGetHostProps(domElement, nextRawProps);
      updatePayload = [];
      break;
    case 'textarea':
      lastProps = ReactDOMTextareaGetHostProps(domElement, lastRawProps);
      nextProps = ReactDOMTextareaGetHostProps(domElement, nextRawProps);
      updatePayload = [];
      break;
    default:
      lastProps = lastRawProps;
      nextProps = nextRawProps;
      if (
        typeof lastProps.onClick !== 'function' &&
        typeof nextProps.onClick === 'function'
      ) {
        // TODO: This cast may not be sound for SVG, MathML or custom elements.
        trapClickOnNonInteractiveElement(((domElement: any): HTMLElement));
      }
      break;
  }

  assertValidProps(tag, nextProps);

  let propKey;
  let styleName;
  // style 임시 저장소
  let styleUpdates = null;
  
  // step 1. 삭제 current 기준
  for (propKey in lastProps) {
    if (
      nextProps.hasOwnProperty(propKey) || // workInProgress에 있다면 삭제 x
      !lastProps.hasOwnProperty(propKey) ||
      lastProps[propKey] == null
    ) {
      continue;
    }
    // workInProgress에 없다면 모두 삭제
    if (propKey === STYLE) {
      const lastStyle = lastProps[propKey];
      for (styleName in lastStyle) {
        if (lastStyle.hasOwnProperty(styleName)) {
          if (!styleUpdates) {
            styleUpdates = {};
          }
          styleUpdates[styleName] = '';
        }
      } 
    } else if (propKey === DANGEROUSLY_SET_INNER_HTML || propKey === CHILDREN) {
			// prop이 DANGEROUSLY_SET_INNER_HTML 또는 CHILDREN이면 아무 작업도 하지 않음
	    // 이는 텍스트를 삭제하는 별도의 메커니즘으로 처리됨
    } else if (
      (enableFlareAPI && propKey === LISTENERS) ||
      propKey === SUPPRESS_CONTENT_EDITABLE_WARNING ||
      propKey === SUPPRESS_HYDRATION_WARNING
    ) {
      // prop이 LISTENERS, SUPPRESS_CONTENT_EDITABLE_WARNING, SUPPRESS_HYDRATION_WARNING 중 하나일 때 아무 작업도 하지 않음
    } else if (propKey === AUTOFOCUS) {
      // AUTOFOCUS는 업데이트 시 작동하지 않으므로 아무 작업도 하지 않음
    } else if (registrationNameModules.hasOwnProperty(propKey)) {
      // 이벤트 리스너와 관련된 경우입니다. 리스너가 업데이트되면 "현재" fiber 포인터를 업데이트해야 하므로
      // 이 엘리먼트를 업데이트하는 커밋이 필요합니다.
      if (!updatePayload) {
        updatePayload = []; // 업데이트 페이로드 배열을 생성
      }
    } else {
      // 그 외의 모든 삭제된 속성들은 큐에 추가합니다.
      // 커밋 단계에서 화이트리스트를 사용하여 처리됩니다.
      (updatePayload = updatePayload || []).push(propKey, null);  // propKey를 삭제하는 작업을 큐에 추가
    }
  }
  // step 2. 추가, 수정 workInProgress 기준
  for (propKey in nextProps) {
    const nextProp = nextProps[propKey];
    const lastProp = lastProps != null ? lastProps[propKey] : undefined;
    if (
      !nextProps.hasOwnProperty(propKey) ||
      nextProp === lastProp ||
      (nextProp == null && lastProp == null)
    ) {
      continue;
    }
    if (propKey === STYLE) {
     // style은 추가, 수정, 삭제가 동시에 일어날 수 있습니다.
     // current에만 존재 시 삭제만 하면 되지만 그렇지 않을 경우 모든 케이스에 대한 처리가 필요
      // 추가, 수정, 삭제
      if (lastProp) {
        // Unset styles on `lastProp` but not on `nextProp`.
        // 삭제
        for (styleName in lastProp) {
          if (
            lastProp.hasOwnProperty(styleName) &&
            (!nextProp || !nextProp.hasOwnProperty(styleName))
          ) {
            if (!styleUpdates) {
              styleUpdates = {};
            }
            styleUpdates[styleName] = '';
          }
        }
        // 추가, 수정
        // Update styles that changed since `lastProp`.
        for (styleName in nextProp) {
          if (
            nextProp.hasOwnProperty(styleName) &&
            lastProp[styleName] !== nextProp[styleName]
          ) {
            if (!styleUpdates) {
              styleUpdates = {};
            }
            styleUpdates[styleName] = nextProp[styleName];
          }
        }
        // 추가
      } else {
        // Relies on `updateStylesByID` not mutating `styleUpdates`.
        if (!styleUpdates) {
          if (!updatePayload) {
            updatePayload = [];
          }
          updatePayload.push(propKey, styleUpdates);
        }
        styleUpdates = nextProp;
      }
    } else if (propKey === DANGEROUSLY_SET_INNER_HTML) {
      const nextHtml = nextProp ? nextProp[HTML] : undefined;
      const lastHtml = lastProp ? lastProp[HTML] : undefined;
      if (nextHtml != null) {
        if (lastHtml !== nextHtml) {
          (updatePayload = updatePayload || []).push(
            propKey,
            toStringOrTrustedType(nextHtml), // return '' + nextHtml
          );
        }
      }
    } else if (propKey === CHILDREN) {
      if (
        lastProp !== nextProp &&
        (typeof nextProp === 'string' || typeof nextProp === 'number')
      ) {
        (updatePayload = updatePayload || []).push(propKey, '' + nextProp);
      }
    } else if (
      (enableFlareAPI && propKey === LISTENERS) ||
      propKey === SUPPRESS_CONTENT_EDITABLE_WARNING ||
      propKey === SUPPRESS_HYDRATION_WARNING
    ) {
      // Noop
    } else if (registrationNameModules.hasOwnProperty(propKey)) {
      if (nextProp != null) {
        // We eagerly listen to this even though we haven't committed yet.
        if (__DEV__ && typeof nextProp !== 'function') {
          warnForInvalidEventListener(propKey, nextProp);
        }
        ensureListeningTo(rootContainerElement, propKey);
      }
      if (!updatePayload && lastProp !== nextProp) {
        // This is a special case. If any listener updates we need to ensure
        // that the "current" props pointer gets updated so we need a commit
        // to update this element.
        updatePayload = [];
      }
    } else {
      // For any other property we always add it to the queue and then we
      // filter it out using the whitelist during the commit.
      (updatePayload = updatePayload || []).push(propKey, nextProp);
    }
  }
  // style 변경점 저장소를 추가하면서 마무리
  if (styleUpdates) {
    (updatePayload = updatePayload || []).push(STYLE, styleUpdates);
  }
  return updatePayload;
}
```

- 여기까지 `completeWork()`를 통해 반환 된 **workInProgress**를 `completeUnitOfWork()`에서 마무리 하고 모든 **workInProgress** 작업 후 **Host Root**에 도달했다면 null을 return 할 것입니다.
- null을 반환 받은 workLoopSync()는 종료됩니다.

    ```jsx
    function workLoopSync() {
      while (workInProgress !== null) {
        workInProgress = performUnitOfWork(workInProgress)
      }
    }
    ```

- workLoopSync()가 끝났다면 workInProgress = null 입니다. (Sync)

    ```jsx
    function performSyncWorkOnRoot(root) {
      /*...*/
      // if (..) prepareFreshStack(root, expirationTime);
    
      if (workInProgress !== null) {
        const prevExecutionContext = executionContext
        executionContext |= RenderContext
        do {
          try {
            workLoopSync()
            break
          } catch (thrownValue) {
            handleError(root, thrownValue)
          }
        } while (true)
        executionContext = prevExecutionContext
      // render phase 종료 시 workInProgress는 null 이여야합니다. (Sync)
      // Commit phase..
      if (workInProgress !== null) {
          invariant(
            false,
            'Cannot commit an incomplete root. This error is likely caused by a ' +
              'bug in React. Please file an issue.'
          )
        } else {
          root.finishedWork = root.current.alternate
          root.finishedExpirationTime = expirationTime
          finishSyncRender(root, workInProgressRootExitStatus, expirationTime)
        }
      }
    
      return null 
    }
    ```


---

# Summary

- 드디어 Render Phase를 마무리 했습니다.
- 정리해보면 
  - `workLoopSync()`에서 개별 Fiber에 대해 반복적으로 Work와 관련된 Node를 순회하며 작업을 수행합니다.
  - `completeUnitOfWork()`에서는 작업중인 UnitOfWork를 completeWork()를 통해 마무리 하고 형제노드가 존재한다면 반환하여 다시 workLoopSync()로 돌아갑니다.
  - leaf, sibling까지 완료되었다면 부모 또한 마무리해주며 while문을 통해 HostRoot까지 도달하면 종료합니다.
  - 또한 effect-list를 후위순회 순서로 연결해줍니다.
  - `completeWork()`에서는 Host Component의 생성, 수정, 삭제, event binding, attribute set, Update Tag, focus..etc를 처리하여 Commit Phase에서 적용할 수 있도록 실제 DOM Element를 완성해줍니다.
  - 마지막으로 workLoopSync()가 종료되면 workInProgress는 null이 되어야합니다.
- 다음 글에서는 실제 DOM에 변경점을 적용하고 browser에게 paint를 요청하는 Commit Phase로 찾아뵙겠습니다!