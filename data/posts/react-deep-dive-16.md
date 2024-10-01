이번 글에서도 분석의 바탕이 되는 코드는 [React 16.12.0 version](https://github.com/facebook/react/tree/v16.12.0)을 기준으로 하며, [해당 블로그](https://www.notion.so/f903bf2b3e4248a29dd5402c89ccd591?pvs=21)에 감사 인사를 전합니다.
지난 글에서는 재조정을 위해 준비하는 과정을 살펴봤습니다.

이번 시간에는 render phase에 진입해 React가 reconcile하는 과정을 살펴보겠습니다.

그 시작점은 workLoopSync()함수 입니다.

ConcurrentMode에서는 workLoopConcurrent()함수가 실행 되지만 지난 시간까지 React에서의 ConcurrentMode가 어떻게 실행되는지는 충분히 살펴보았으므로 앞으로는 Sync기준으로 흐름을 이어 가보도록 하겠습니다.

아래 링크는  React의 렌더링 흐름에 따라 저 나름대로의 그림을 그려보았으며, 이 흐름에 따라 글이 이어 질 것입니다. (무단 복사 및 배포는 하지 말아주세요)

<a href="https://excalidraw.com/#json=V0SwRJn2D2oo3pSesIVo5,H-kq_Lc5OnichbquJKzDBw" target="_blank">Gy's React Diagram</a>

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

2) <span style='background-color: #FFB6C1'>Enter the render phase.</span>

3) Perform rendering with hooks.

4) ReconcileChildren

5) Finishing Work

**5. Reconciler Commit Phase**

1) Execute `useEffect` and `useLayoutEffect`.

**6. Browser Paint**

---

# Before

- prepareFreshStack()을 통해 준비가 끝난 workInProgress()의 상태는 다음과 같았습니다.

  ![image](https://github.com/user-attachments/assets/29e118fa-006a-48ac-b4b1-88e28c3f2cad)

- 흐름은 다음과 같습니다.
1. **`workLoopSync()`**
- 동기적으로 작업을 처리하는 루프입니다. 모든 작업이 완료될 때까지 반복적으로 실행됩니다.
2. **`performUnitOfWork()`**
- HostRoot부터 시작해 `beginWork()`와 `completeUnitOfWork()`를 통해 자식 및 형제 노드로 이동하며 업데이트를 진행합니다.
3. **`beginWork()`**
- 현재 작업 중인 Fiber 노드의 자식 노드를 처리합니다. 만약 해당 서브트리에서 업데이트가 발생하지 않았다면 `null`을 반환해 더 이상 작업하지 않고 멈춥니다.
4. **`bailoutOnAlreadyFinishedWork()`**
- `childExpirationTime`을 통해 서브트리에 업데이트가 발생했는지 확인합니다. 만약 업데이트가 있다면 새로운 Fiber 노드를 복제하고, 없다면 `null`을 반환해 더 이상의 불필요한 작업을 방지합니다.
5. `update…`
- 업데이트가 발생한 컴포넌트에 대해 실제 작업이 이루어집니다.
- 업데이트가 발생한 컴포넌트의 `workInProgress` 상태에 따라 해당 태그에 맞는 작업을 수행합니다.

   5-1. **FunctionComponent → `renderWithHooks()`**

  - 훅을 기반으로 업데이트 작업이 수행됩니다.

   5-2. **Other Type Components**

  - 클래스형 컴포넌트 및 기타 유형에 맞는 업데이트 작업이 수행됩니다.
6. **`reconcileChildren()`**
- 업데이트가 발생한 컴포넌트의 서브트리를 포함해, 새로운 자식 노드와 기존 자식 노드를 비교하고(조정) 필요한 변경을 적용합니다.
7. **`completeUnitOfWork()`**
- `beginWork()`에서 `null`이 반환되면, 형제 노드를 반환하여 작업을 이어갑니다. 모든 업데이트 작업이 끝나면 마무리 작업을 진행합니다.
8. **`completeWork()`**
  - 현재 노드의 작업을 최종적으로 완료합니다. 이 과정에서 element를 완성합니다.
- renderWithHooks()에서 살펴보아야 할 양이 많으므로, 오늘은 4. bailoutOnAlreadyFinishiedWork() 까지만 다루고 Hook에 관하여 정리한 뒤에 이어 가보도록 하겠습니다.

---

# Render phase

### performSyncWorkOnRoot()

- workLoopSync()함수는 performSyncWorkOnRoot()함수에서 실행됩니다.

    ```jsx
    // This is the entry point for synchronous tasks that don't go
    // through Scheduler
    function performSyncWorkOnRoot(root) {
        //... 생략
        if (
          root !== workInProgressRoot ||
          expirationTime !== renderExpirationTime
        ) {
          prepareFreshStack(root, expirationTime);
        }
        // render phase
        if (workInProgress !== null) {
          const prevExecutionContext = executionContext;
          executionContext |= RenderContext;
          do {
            try {
              workLoopSync();
              break;
            } catch (thrownValue) {
              handleError(root, thrownValue);
            }
          } while (true);
    
          executionContext = prevExecutionContext;
    			// Sync함수에서는 동기로 처리되므로 위의 while문을 거치면 workInProgress는 null이 되어야 합니다.
          if (workInProgress !== null) {
            // This is a sync render, so we should have finished the whole tree.
            invariant(
              false,
              'Cannot commit an incomplete root. This error is likely caused by a ' +
                'bug in React. Please file an issue.',
            );
          } else {
    	      // commit phase 진입
            root.finishedWork = (root.current.alternate: any);
            root.finishedExpirationTime = expirationTime;
            finishSyncRender(root, workInProgressRootExitStatus, expirationTime);
          }
    
          // phase도중 추가 업데이트가 발생하였을 수도 있으므로 shedule update
          ensureRootIsScheduled(root);
        }
      }
    
      return null;
    }
    ```

- Sync Mode에서는 중단될 일이 없으므로 Work를 소비하기만 하면 됩니다.

### workLoopSync()

[workLoopSync-code](https://github.com/facebook/react/blob/v16.12.0/packages/react-reconciler/src/ReactFiberWorkLoop.js#L1454)

- 생각보다 간단합니다. workInProgress가 null이 아닐때까지 반복해서 소비합니다.
    - 첫 시작의 workInProgress는 current.child를 참조하는 Root만 존재합니다.
    - React에서는 휴리스틱 알고리즘을 구현했지만 기본적으로 Root부터 제일 하단의 자식까지 탐색 후 형제로 이동하여 다시 탐색을 반복하는 DFS방식과 유사합니다.
- Sync이기 때문에 중단하고 양보할 필요가 없습니다.

```jsx
function workLoopSync() {
  // Already timed out, so perform work without checking if we need to yield.
  while (workInProgress !== null) {
    workInProgress = performUnitOfWork(workInProgress); // 자식노드 반환
  }
}
```

### performUnitOfWork()

[performUnitOfWork-code](https://github.com/facebook/react/blob/v16.12.0/packages/react-reconciler/src/ReactFiberWorkLoop.js#L1469)

```jsx
function performUnitOfWork(unitOfWork: Fiber): Fiber | null {
	// double-buffering
  const current = unitOfWork.alternate;

  let next;

  next = beginWork(current, unitOfWork, renderExpirationTime); //자식 Fiber반환
	// 해당 fiber의 props로 인해 더 이상 영향을 받는 부분이 없으므로 확정 짓습니다. 
  unitOfWork.memoizedProps = unitOfWork.pendingProps;
  if (next === null) {
    // If this doesn't spawn new work, complete the current work.
    next = completeUnitOfWork(unitOfWork); // 형제 Fiber반환
  }

  return next;
}
```

- **pendingProps**, **memoizedProps**
    - pendingProps는 확정되지 않은 진행 중인 props이고, memoizedProps는 확정된 props입니다.
    - React에서 props가 영향을 줄 때는 부모 컴포넌트가 리렌더링 되어 변경된 props를 전달해 줄 때입니다.
    - memoizedProps에 pendingProps를 할당한다는 것은 props변경이 더 이상 일어나지 않음으로 확정 짓는다는 의미입니다.
    - beginWork() 이후에는 이미 자식을 반환한 뒤이므로 호출되어 props가 변경될 일은 없으므로 확정지어 주는 것입니다.

### beginWork()

[beginWork-code](https://github.com/facebook/react/blob/v16.12.0/packages/react-reconciler/src/ReactFiberBeginWork.js#L2808)

- 이 함수에서는 컴포넌트를 필요에 따라 호출하고 아니라면 bailout(단순히 current.alternate를 복제하여 트리를 구성)하고 다음으로 넘어갑니다.
- 호출 조건은 다음과 같습니다.
    - component state change
    - props change
- update여부는 **markUpdateTimeFromFiberToRoot() 에서 expirationTime, childExpirationTime을 통해 설정해주었습니다.**
- expirationTime이 renderExpirationTime 같은 컴포넌트를 찾는다면 해당 컴포넌트는 호출(render)가 필요합니다.
    - renderExpirationTime은 현재 work를 발생시킨 컴포넌트의 expirationTime
- `didReceiveUpdate`는 **실제 props나 상태 변경**에 따른 업데이트가 발생했는지를 추적하는 플래그입니다.
- 이 플래그는 나중에 업데이트 경로에서 **불필요한 작업을 생략**하기 위해 사용됩니다.
- 예를 들어, `didReceiveUpdate`가 `false`라면, 아래의 `update` 함수 내부에서 해당 Fiber의 자식 컴포넌트들이 변경되지 않았다고 가정하고 **업데이트를 생략**하는 경로로 빠져나갈 수 있습니다.
- 추후 switch문의 update함수들에서 state의 변경여부에 따라 `didReceiveUpdate` 값이 true로 전환될 수 있습니다.
```jsx
// 컴포넌트의 props, state 변경 여부
let didReceiveUpdate: boolean = false;

function beginWork(
  current: Fiber | null,
  workInProgress: Fiber,
  renderExpirationTime: ExpirationTime
): Fiber | null {
  const updateExpirationTime = workInProgress.expirationTime
	// props의 변경과 우선순위 (expirationTime)를 기준으로 지금 즉시 컴포넌트가 업데이트될지, 아니면 업데이트를 건너뛸지 결정합니다.
  // 1-1. current가 없다는 것은 새롭게 mount되는 컴포넌트이다.
  if (current !== null) {
    const oldProps = current.memoizedProps
    const newProps = workInProgress.pendingProps

    // 2-1. props가 다르다면 update가 필요합니다. 
    // 객체 -> 참조값 비교
    if (oldProps !== newProps) {
      didReceiveUpdate = true

    // 2-2. 현재의 workInProgress의 expirationTime이 더 작다면 현재 처리해야 할 work 가 아닙니다.
    } else if (updateExpirationTime < renderExpirationTime) {
      didReceiveUpdate = false
			
			// 현재 처리해야 할 work는 아니지만 밑으로 내려갈 수 있도록 단순 복제 후 반환
      return bailoutOnAlreadyFinishedWork(
        current,
        workInProgress,
        renderExpirationTime
      )

    // 2-3.  해당 컴포넌트에서 Work가 예약되었지만, props는 변경된 것이 없음을 나타냅니다.
    } else {
      didReceiveUpdate = false
    }

  // 1-2. 첫 컴포넌트의 mount 이기 때문에 생성 후 삽입만 하면 된다. (update는 아님)
  } else {
    didReceiveUpdate = false
  }
  
  workInProgress.expirationTime = NoWork

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

### **bailoutOnAlreadyFinishedWork()**

[bailoutOnAlreadyFinishedWork-code](https://github.com/facebook/react/blob/v16.12.0/packages/react-reconciler/src/ReactFiberBeginWork.js#L2708)

- HostRoot부터 시작하여 update가 발생한 컴포넌트까지 workInProgress tree를 만들어 나가는데 업데이트 발생한 컴포넌트에 도달하기 까지는 React Element가 변경된 부분은 없기 때문에 current를 재사용하여 빠르게 만들어 줍니다.
- React Fiber Architecture에서 Fiber는 컴포넌트 모델이 변경된 경우, 즉 **React element가 변경된 경우에만 fiber로 다시 확장**시킵니다.
- 컴포넌트 모델이 변경될 경우는 다음 2가지 뿐입니다.
    - component type이 변경된 경우
    - props가 변경된 경우
- useState()와 같이 내부 상태값은 Fiber에 포함되어 있기 때문에 fiber를 새로 만들 필요는 없습니다.

```jsx
function bailoutOnAlreadyFinishedWork(
  current: Fiber | null,
  workInProgress: Fiber,
  renderExpirationTime: ExpirationTime
): Fiber | null {
	// 자손 update여부 확인
  var childExpirationTime = workInProgress.childExpirationTime
	// 자손에서도 update가 여부가 없다면 null을 반환하여 끊어주고 performUnitOfWork()에서 형제노드 탐색하도록
  if (childExpirationTime < renderExpirationTime) {
    return null
  } else {
    // 자손에서 update발생했다면 서브트리로 work 진행되도록 current를 복제하여 작업용 Fiber 반환
    cloneChildFibers(current, workInProgress)
    return workInProgress.child
  }
}
```
- null로 끊어주는 이유는 예를 들어 tree의 두 번째 자식 노드의 서브트리에서 update가 발생했고, 첫 번째 자식 노드의 서브 트리를 포함 update가 발생하지 않았다면 null을 반환하여 탐색하지 않습니다.
  - 모든 노드를 탐색할 필요 없이 추후에 실제 DOM에는 추가, 수정, 삭제가 발생한 update된 Node들만 적용될 것이기 때문입니다.

### cloneChildFibers()

[cloneChildFibers-code](https://github.com/facebook/react/blob/v16.12.0/packages/react-reconciler/src/ReactChildFiber.js#L1373)

```jsx
function cloneChildFibers(current: Fiber | null, workInProgress: Fiber): void {
  if (workInProgress.child === null) {
    return
  }
  // 첫번째 자식 노드 복사
  let currentChild = workInProgress.child
  let newChild = createWorkInProgress(
    currentChild,
    currentChild.pendingProps,
    currentChild.expirationTime
  )
  workInProgress.child = newChild
  newChild.return = workInProgress

  // 형제노드들 복사
  while (currentChild.sibling !== null) {
    currentChild = currentChild.sibling
    newChild = newChild.sibling = createWorkInProgress(
      currentChild,
      currentChild.pendingProps,
      currentChild.expirationTime
    )
    newChild.return = workInProgress
  }
  // 마지막 형제노드 표시
  newChild.sibling = null
}
```

### V-DOM

- 위 과정을 거친 tree는 다음과 같은 형태일 것입니다.
- reconcile은 아직 진행되지 않았으며 bailout까지만 진행되었습니다.

![image](https://github.com/user-attachments/assets/398625c9-6a0d-40df-86e4-9dd492baed10)

---

# Optimize render

- 위 과정을 통해 React에서 경로 최적화를 알 수 있었습니다.
- 이전에 글 [react-deep-dive](https://giyoun-blog.vercel.app/posts/react-deep-dive-1)와  [children pattern](https://giyoun-blog.vercel.app/posts/react-children-pattern)을 쭉 보셨으면 아시겠지만 React는
    - JSX로 선언된 컴포넌트를 React element로 생성되고 props는 리터럴 객체로 되어 있습니다.
    - 부모 컴포넌트가 호출되면 createElement()를 통해 새로운 React element가 생성될 것입니다.

⇒ 다음과 같은 경우에 자식 컴포넌트는 렌더링 될까요?

```jsx
export default function ParentComponent () {
	return (
		<div>
			parent component
			<ChildComponent>
		</div>
	)
}
```

- 정답은 O입니다.
    - props를 넘겨주지 않더라도 props는 매번 새로운 빈 객체로 생성되기 때문입니다.
    - 이와 같은 경우를 방지하기 위해서 [React.memo()](https://ko.react.dev/reference/react/memo) 또는 Children Pattern 방식으로 최적화를 하곤 합니다.
    - React.memo

        ```jsx
        const ChildTest = ()=> {
          return (
        	  <div>
        	    <h1>ChildTest</h1>
        	    <p>This is ChildTest render</p>
        	  </div>
        })
        
        export default memo(ChildTest);
        ```

    - Children Pattern

        ```jsx
        export default function ParentComponent ({children}) {
        	return (
        		<div>
        			parent component
        			{children}
        		</div>
        	)
        }
        ```


### React.memo

[React.memo](https://github.com/facebook/react/blob/v16.12.0/packages/react-reconciler/src/ReactFiberBeginWork.js#L476)

```jsx
function updateSimpleMemoComponent(current, nextProps,...){
  /*...*/
  const prevProps = current.memoizedProps;
  if (shallowEqual(prevProps, nextProps)) {
    didReceiveUpdate = false;
    if (updateExpirationTime < renderExpirationTime) {
      return bailoutOnAlreadyFinishedWork(...);
    }
  }
  /*...*/
}
```

- 번외로 onClick과 같은 이벤트 핸들러를 전달한다면 [useCallback()](https://ko.react.dev/reference/react/useCallback)을 사용하면 됩니다.

# Summary

- 오늘은 render phase에 진입하여 update가 이루어지기 직 전까지 workInProgress tree를 구축해가는 과정을 살펴보았습니다.
- 다음 글에서는 workInProgress.tag 따라 update하는 과정부터 hook에 대해 자세히 살펴보도록 하겠습니다.