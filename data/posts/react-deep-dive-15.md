이번 글에서도 분석의 바탕이 되는 코드는 [React 16.12.0 version](https://github.com/facebook/react/tree/v16.12.0)을 기준으로 하며, [해당 블로그](https://www.notion.so/React-deep-dive-10-f903bf2b3e4248a29dd5402c89ccd591?pvs=21)에 감사 인사를 전합니다.

지금까지 update가 발생하고 scheduler를 거쳐 드디어 callback(performSyncWorkOnRoot())을 소비하는 Reconciler로 도착했습니다.

오늘은 재조정을 진행하기 위해 V-DOM(workInProgress)을 생성하고 준비하는 과정을 살펴보도록 하겠습니다.

아래 링크는  React의 렌더링 흐름에 따라 저 나름대로의 그림을 그려보았으며, 이 흐름에 따라 글이 이어 질 것입니다. (무단 복사 및 배포는 하지 말아주세요)

<a href="https://excalidraw.com/#json=fky4cO3h5RXKBcJgaVw_l,yczelRbNqAqHxBwE5Hf3kQ" target="_blank">Gy's React Diagram</a>

---

## Flow

Reconciler → Scheduler → Scheduler Host-config → **Reconciler Render Phase** → Reconciler Commit Phase

![image](https://github.com/user-attachments/assets/e6ffd320-1be8-40b6-a453-cda5f8f6f6d0)

**1. Reconciler**

- Dispatch a trigger to update.

- The reconciler requests the scheduler to schedule a task.

**2. Scheduler**

- Schedule the work.

**3. Scheduler Host Config**

- Yield control to the host.

**4. Reconciler Render Phase**

- <span style='background-color: #FFB6C1'>Prepare for reconciliation.</span>

- Enter the render phase.

- Perform rendering with hooks.

- Reconcile the `workInProgress` tree.

**5. Reconciler Commit Phase**

- Execute `useEffect` and `useLayoutEffect`.

**6. Browser Paint**

---

# Reconciler

## Preview V-DOM

- reconciler가 재조정을 위한 준비과정을 살펴보기 전 전체적으로 어떻게 재조정 과정이 일어나는지 간단하게 살펴보고 가겠습니다.
- [React-deep-dive-9](https://giyoun-blog.vercel.app/posts/react-deep-dive-9)에서 Virtual DOM 그림을 기억하시나요? reconcile과정이 일어나면 아래 그림과 같이 **현재 렌더링 중인 current트리와 업데이트가 발생하여 변동된 workInProgress트리를 비교하여 변동사항을 적용하는 과정이 재조정(reconcile)입니다.**

  ![image](https://github.com/user-attachments/assets/cf392d0b-5088-4bac-875d-d06ce5d25fc4)

- 이 때 제일 상단에 위치한 **RootNode**는 무엇일까요? React 프로젝트를 실행하면 제일먼저 render()하는 root가 바로 **FiberRootNode**입니다.
    - V-DOM을 대표하는 Root Node입니다.
    - Current, WorkInProgress tree는 계속 바뀔 수 있으므로 필요한 context를 담고 있어야 할 Root가 필요합니다.
    - 이전에 [React-deep-dive-11](https://giyoun-blog.vercel.app/posts/react-deep-dive-11) 글에서 update가 발생하고 해당 fiber부터 root까지 올라가며 childExpirationTime을 새기고 반환하는 함수 markUpdateTimeFromFiberToRoot(fiber, expirationTime)의 return값인 root가 FiberRootNode입니다. → 이전에 주석으로 간단히 설명하고 넘어갔는데 글의 마지막부분에서 자세히 다루겠습니다.

  ![image](https://github.com/user-attachments/assets/8665f4a2-d253-4f3d-95ee-9314a623f824)
  
- ![image](https://github.com/user-attachments/assets/8148967d-3173-45d9-bb95-5e96ca64c477)

- containerInfo는 index.html에서 `<div id=”root”><div>` 해당 태그를 참조합니다.

  ![image](https://github.com/user-attachments/assets/5147fbbf-61a5-4f00-bee6-6e52e5299580)

- **current**는 현재 렌더링 중인 V-DOM tree로 RootNode가 가리키고 있습니다.
- 위 그림에서 봤듯이, **alternate**로 workInProgress 와 서로 참조하고 있습니다. (double-buffering)
- 원래 FiberNode의 **return**은 부모 FiberNode를 반환하지만, 해당 tree의 V-DOM에서는 최상단이므로 null입니다.
- **HostRoot**는 각 current, workInProgress의 root node입니다. (그 위에 위치한 것이 FiberRootNode)
- **stateNode**는 호스트 컴포넌트에서는 실제DOM에 삽입된 HTML element를 가리키지만, 개발자가 작성한 커스텀 컴포넌트의 stateNode는 null입니다. (DOM에 직접 마운트되는 element가 아니기 때문) 특별히 Host root만 DOM에 마운트 되지 않아도 root를 가리키도록 되어있습니다.

  ![image](https://github.com/user-attachments/assets/19ecccff-7534-4c1b-b853-1ff662cc0ec1)

## Reconciliation Process

- 간단한 예시코드로 재조정이 일어나는 과정을 살펴보겠습니다.

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

- 전반적인 흐름은 다음과 같습니다.
    1. React Component Render → JSX return → React Element Tree
        - 사용자가 만든 커스텀 컴포넌트가 렌더링되면 JSX를 return하여 React Element를 반환합니다.

       <img src="https://github.com/user-attachments/assets/6959e68b-c3e7-46a0-8971-d2162123998d" alt="exception"/>
  
    2. React Element tree → React Fiber Tree
        - React Fiber Architecture 도입 이후 React Component는 Fiber로 확장합니다.
        - 이 때 불필요한 Fragment tree는 별도로 만들지 않습니다. (key값이 부여되었을 경우에는 생성)
        - 그림을 보시면 아시겠지만 FiberNode는 하나의 자식만을 참조(children prop)하며, 나머지 자식Node들은 참조하는 첫번째 자식Node의 sibling(형제Node)로 연결되어 있습니다.

       <img src="https://github.com/user-attachments/assets/2bbb8a68-d6ae-4ec9-930e-9ed77d2e0913" alt="exception"/>
  
    3. React Fiber Tree completed Reconcile & commit DOM → DOM tree
        - 재조정 과정을 마친 후 DOM tree는 custom component가 아닌 실제 HTML element에 해당하는 Node들로만 구성된다.

       <img src="https://github.com/user-attachments/assets/31a4839d-6bb4-4c9b-a106-cbabf3ce5686" alt="exception"/>

    
---

## Prepare Reconciliation

- 이제 어떻게 V-DOM이 구성되어 있는지, 재조정 과정이 전반적으로 어떻게 흘러가서 실제 DOM에 반영되는지 그림이 그려지셨을 거라 믿습니다.
- 다시 돌아와서 스케줄러를 거쳐 소비할 시점이 온 **callback함수 performConcurrentWorkOnRoot()**부터 살펴보겠습니다.
- 결국 performConcurrentWorkOnRoot()함수가 스케줄러를 거쳐 소비하게 되는callback함수임을 잊지마세요.
- [React-deep-dive-11](https://giyoun-blog.vercel.app/posts/react-deep-dive-11) 에서 살펴보았던 ensureRootIsScheduled() 기억하시나요?

### ensureRootIsScheduled()

- 이 함수에서 sync, async실행에 따라 callback을 예약하고 scheduler를 거쳐 왔습니다.

```jsx
// 이 함수는 루트에 대한 작업을 예약하는 데 사용됩니다. 루트당 작업은 하나만 있습니다. 
// 이미 작업이 예약된 경우, 기존 작업의 만료 시간이 루트가 작업을 할 다음 수준의 만료 시간과 
// 동일한지 확인합니다. 이 함수는 모든 업데이트 시 호출되며, 작업을 종료하기 직전에도 호출됩니다.
function ensureRootIsScheduled(root: FiberRoot) {
  const lastExpiredTime = root.lastExpiredTime;
  if (lastExpiredTime !== NoWork) {
    // 특수 경우: 만료된 작업은 동기적으로 처리해야 합니다.
    // 이미 시간이 지난 경우 즉시 처리할 수 있도록 처리
    root.callbackExpirationTime = Sync;
    root.callbackPriority = ImmediatePriority;
    root.callbackNode = scheduleSyncCallback(
      performSyncWorkOnRoot.bind(null, root),
    );
    return;
  }

	... 생략

  let callbackNode;
  if (expirationTime === Sync) {
    // 동기 React 콜백은 특별한 내부 큐에 예약됩니다.
    callbackNode = scheduleSyncCallback(performSyncWorkOnRoot.bind(null, root));
  } else if (disableSchedulerTimeoutBasedOnReactExpirationTime) {
    callbackNode = scheduleCallback(
      priorityLevel,
      performConcurrentWorkOnRoot.bind(null, root),
    );
  } else {
    callbackNode = scheduleCallback(
      priorityLevel,
      performConcurrentWorkOnRoot.bind(null, root),
      // 만료 시간을 기반으로 작업 타임아웃을 계산합니다. 이는 작업이 타임아웃 순서대로 
      // 처리되기 때문에 순서에도 영향을 미칩니다.
      {timeout: expirationTimeToMs(expirationTime) - now()},
    );
  }

  root.callbackNode = callbackNode;
}
```

### performConcurrentWorkOnRoot() / Async

[performConcurrentWorkOnRoot-code](https://github.com/facebook/react/blob/v16.12.0/packages/react-reconciler/src/ReactFiberWorkLoop.js#L631)

- 지난 글 workLoop()함수에서 아래 코드와 같이 잔여 작업 여부를 확인하고,남아 있다면 다음 frame에 실행 할 수 있도록 처리 했었습니다.
- performConcurrentWorkOnRoot()함수, 즉 하나의 작업 단위는 setState()와 같은 단순히 하나의 업데이트를 의미하는 것이 아니라, 업데이트가 발생한 후의 전체 렌더링 과정을 의미합니다. 이 과정에서 여러 개의 업데이트가 하나로 묶여 처리될 수 있습니다. →  "배칭(batch processing)”
- expirtaionTime = NoWork인 경우 유휴 상태라고 생각하시면 됩니다.
- 전반적인 흐름은 다음과 같습니다.
    1. workLoop에서 performConcurrentWorkOnRoot() 실행 후 반환 값 check
    2. performConcurrentWorkOnRoot()가 완료(null)일 경우는
       - (1) 만료시간이 지나 다음 프레임에 즉시 실행으로 스케줄 되거나
       - (2) work가 commit phase까지 완료된 경우 두 가지이다.
    3. performConcurrentWorkOnRoot()가 중단되었다면 해당 callback을 root binding 하여 반환하고 performWorkUntilDeadline()을 통해 time slicing하며 계속 진행 한다. (메인 스레드 장시간 점유 방지)
       - 실행 중단된 경우는 commit phase까지 완료하지 못하고 중지된 상황 “performConcurrentWorkOnRoot() → prepareFreshStack() → workLoopConcurrent()”

            ```jsx
            function workLoopConcurrent() { #2
              // Perform work until Scheduler asks us to yield
              while (workInProgress !== null && !shouldYield()) {
                workInProgress = performUnitOfWork(workInProgress);
              }
            }
            ```

       - phase진행 과정 중 추가적 업데이트를 확인하기 위해 한번 더 ensureRootIsScheduled()했음에도 불구하고 root.callbackNode === originCallbackNode라면 동일한 work이므로 반환한다. (return  performConcurrentWorkOnRoot.bind(null, root);)
    4. workLoop과정 중 중지되었으므로 해당 currentTask.callback에 할당되고 해당 callback이 남아 있으므로 다음 프레임에 실행된다. → performWorkUntilDeadline()

    <img src="https://github.com/user-attachments/assets/46221a39-be92-475c-ac4f-cdce806e1108" alt="exception"/>

- **workLoop() in scheduler**
    - 작업이 아직 남아있고, 그 작업을 처리하기 위한 작업 노드가 변경되지 않은 상황에서, 남은 작업을 계속 처리하기 위해 함수 자체를 콜백으로 반환하는 경우

    ```jsx
    function workLoop(hasTimeRemaining, initialTime) 
    		... 
    	 const didUserCallbackTimeout = currentTask.expirationTime <= currentTime
        // Work 진행, 잔여 작업 여부 반환(concurrent mode)
        // Sync는 동기적으로 실행될 것이므로 여기 해당 되지 않음 
        // performConcurrentWorkOnRoot()실행하다 만료되면 performConcurrentWorkOnRoot.bind(null, root); 반환하고 다음 프레임에 예약된다. #3
       const continuationCallback = callback(didUserCallbackTimeout)   
    	...
    } 
    ```

- 해당 callback이 didTimeout이라면 이미 실행되었어야할 work이므로, 다음 프레임에 sync로 즉시 실행되도록 스케줄링한다.
- workInProgress 를 확인하고 필요 시 새로운 workInProgress tree를 생성한다. → prepareFreshStack()
- 양보시점을 체크하며 (shouldYield & priority work) render phase를 실행한다.
- workInProgress 가 null이라면 render phase가 완료되었다는 뜻입니다.  → commit phase실행
- 추후 살펴볼 render phase의 completeUnitOfWork()에서 workInProgress = null이 됩니다.
    - 해당 Fiber(workInProgress)부터 시작하여 자식, 형제 노드를 모두 reconcile하고 workInProgress = returnFiber를 할당하여 root까지 도달한다.
    - 따라서 workInProgress = null이 되었을 때는 render phase과정이 끝났다는 뜻이다.
- workInProgress 는 현재 작업 중인 fiber를 가리키며 workInProgressRoot는 render phase에서 사용되는 전역변수로 prepareFreshStack()에서 workInProgressRoot에 root가 할당된다.
    - 이 때 `root`는 `FiberRootNode`로, 전체 애플리케이션 상태를 관리하는 최상위 루트입니다.
    - **`workInProgressRoot`**는 렌더링 중에 사용되는 루트로, 작업이 완료되면 commit phase finishConcurrentRender() 함수에서 `null`로 초기화됩니다.
    - 이는 React가 새로운 작업이 시작되기 전에 상태를 정리하기 위한 과정입니다.
- Context (bit flag)
    - 현재 실행중인 context를 표시하기 위함

    ```jsx
    const NoContext = /*                    */ 0b000000; // 0
    const BatchedContext = /*               */ 0b000001; // 1
    const EventContext = /*                 */ 0b000010; // 2
    const DiscreteEventContext = /*         */ 0b000100; // 4
    const LegacyUnbatchedContext = /*       */ 0b001000; // 8
    const RenderContext = /*                */ 0b010000; // 16
    const CommitContext = /*                */ 0b100000; // 32
    
    //example
    const RenderContext = 0b010000;
    
    // 1. 플래그 추가
    executionContext |= RenderContext; // RenderContext를 추가
    
    // 2. 플래그 확인
    if (executionContext & RenderContext) {
      console.log('RenderContext is set');
    }
    
    // 3. 플래그 삭제
    executionContext &= ~RenderContext; // RenderContext를 제거
    ```

- 나머지 performSyncWorkOnRoot()와 동일한 코드에 대한 설명은 아래에서 이어서 진행하겠습니다.

    ```jsx
    function performConcurrentWorkOnRoot(root, didTimeout) {
      // Since we know we're in a React event, we can clear the current
      // event time. The next update will compute a new event time.
      currentEventTime = NoWork;
    
      if (didTimeout) {
    	  // 시간이 만료되어 완료하지 못한 경우, 현재시간을 마킹하고 다음 프레임에 동기로 즉시 실행된다.
    	  // 모든 만료된 work들은 일괄 처리 (batching)
        const currentTime = requestCurrentTimeForUpdate();
        // lastExpiredTime marking
        markRootExpiredAtTime(root, currentTime);
        // 아래에서 한번 더 확인 #1
        // callback은 렌더중인 root객체8에 등록되어 있다. root.callbackNode
        ensureRootIsScheduled(root);
        // 다음 프레임에 실행되도록 스케줄링 되었으므로 null 반환
        return null;
      }
    
      // Determine the next expiration time to work on, using the fields stored
      // on the root.
      const expirationTime = getNextRootExpirationTimeToWorkOn(root);
      if (expirationTime !== NoWork) {
        const originalCallbackNode = root.callbackNode;
    		// 비동기, 지연된 side-effect 처리
        flushPassiveEffects();
    
        // root or expirationTime이 변경된 경우 새로운 workInProgres tree를 생성한다.
        // 동일하다면 이어서 진행
        if (
          root !== workInProgressRoot ||
          expirationTime !== renderExpirationTime
        ) {
          prepareFreshStack(root, expirationTime);
        }
    
        // workInProgress가 있다는 것은 작업이 남아 있다는 뜻 render 진행
        // render phase
        if (workInProgress !== null) {
          const prevExecutionContext = executionContext;
          // render phase 진입 context 
          executionContext |= RenderContext;
          startWorkLoopTimer(workInProgress);
          do {
            try {
    	        // 이전 시간에 살펴 보았던 reconciler에서 shouldToYield()실행 되는 곳이다.
    	        // 이 함수에서 실행 도중 중지될 수 있다.
    	        // #2
              workLoopConcurrent();
              break;
            } catch (thrownValue) {
              handleError(root, thrownValue);
            }
          } while (true);
    			// render phase종료 후 이전 context로 
          executionContext = prevExecutionContext;
          // workInProgress === null이라는 것은 render phase가 완료 되었다는 뜻
    			// commit phase는 중단 되지 않는다.
          } else { 
            // We now have a consistent tree. The next step is either to commit it,
            // or, if something suspended, wait to commit it after a timeout.
            const finishedWork: Fiber = ((root.finishedWork =
              root.current.alternate): any);
            root.finishedExpirationTime = expirationTime;
            
            finishConcurrentRender(
              root,
              finishedWork,
              workInProgressRootExitStatus,
              expirationTime,
            );
          }
    			// phase도중 추가 업데이트가 발생하였을 수도 있으므로 shedule update
          ensureRootIsScheduled(root);
          if (root.callbackNode === originalCallbackNode) {
            // The task node scheduled for this root is the same one that's
            // currently executed. Need to return a continuation.
            // 진행중 callback 반환 #3
    				// root.callbackNode는 commit phase가 지나면 null
    	      // null이 아니라는 것은 workLoopConcurrent()에서 while문이 중지 되었다는 뜻
    	      // 또한 ensureRootIsScheduled(root); 실행했음에도 현재 작업의 root.callbackNode(originCallbackNode)와 같다는 것은 우선순위가 가장 높은 work이다.
    	      // 여기서 반환되어 workLoop에서 schduler를 통해 다음 프레임에 실행한다.
            return performConcurrentWorkOnRoot.bind(null, root);
          }
        }
      }
      return null;
    }
    
    ```

- didTimeout된 함수 처리 **ensureRootIsScheduled() #1**

    ```jsx
    function ensureRootIsScheduled(root: FiberRoot) {
      const lastExpiredTime = root.lastExpiredTime;
      if (lastExpiredTime !== NoWork) {
        // 특수 경우: 만료된 작업은 동기적으로 처리해야 합니다.
        // 이미 시간이 지난 경우 즉시 처리할 수 있도록 처리
        root.callbackExpirationTime = Sync;
        root.callbackPriority = ImmediatePriority;
        root.callbackNode = scheduleSyncCallback(
          performSyncWorkOnRoot.bind(null, root),
        );
        return;
      }
      ...
    }
    ```


### performSyncWorkOnRoot() / Sync

[performSyncWorkOnRoot-code](https://github.com/facebook/react/blob/v16.12.0/packages/react-reconciler/src/ReactFiberWorkLoop.js#L977)

- concurrent함수와 비슷하지만 동기적으로 실행되는 함수입니다.
- lastExpiredTime는 이전 Work가 만료되었을 때 할당되는 시간으로 perfromConcurrentWorkOnRoot()에서 만료되었을 때 새겨집니다. #1
- lastExpirationTime이 유휴상태가 아니면서 finishedExpirationTime이라면 이미 커밋이 진행되었어야 하기 때문에 밀린 commit을 즉시 실행합니다.
- Sync work는 두 가지 Case가 존재합니다.
    - (1) 처음부터 Sync로 scheduling을 거치지 않고 reconciler 별도의 내부 큐에서 실행 되는 함수
    - (2) performConcurrentWorkOnRoot()에서 만료시간이 되어 즉시 실행 함수로 예약되어 실행되는 함수
- JS는 싱글 스레드 이므로 하나의 V-DOM에 대한 Work만 진행 가능하기 때문에 reconciler가 작업 중인 root를 workInProgressRoot로 잡아 두고 확인합니다.
    - ReactDOM이 여러 root를 생성했을 때 현재 작업 해야 하는 root와 작업 중인 wokInProgressRoot가 다르다면 (ReactDOM 모듈은 하나 이기 때문에) 새로운 workInProgress 를 생성해야 한다.
- prepareFreshStack에서 renderExpirationTime = expirationTime로맞춰두기 때문에 만약 다르다면 다른 우선 순위의 작업이 있다는 뜻이므로 새롭게 생성해야 합니다.

```jsx
// This is the entry point for synchronous tasks that don't go
// through Scheduler
function performSyncWorkOnRoot(root) {
  // Check if there's expired work on this root. Otherwise, render at Sync.
  const lastExpiredTime = root.lastExpiredTime;
  // 만료된 작업이 있다면 만료시간, 아니라면 Sync
	// 처음부터 sync, Async -> sync가 된 sync
  const expirationTime = lastExpiredTime !== NoWork ? lastExpiredTime : Sync;
  // 현재 만료 시간과 같은지 확인합니다. 만약 같다면, 이미 이 만료 시간에 대한 커밋이 대기 중이라는 의미
  if (root.finishedExpirationTime === expirationTime) {
    // There's already a pending commit at this expiration time.
    // TODO: This is poorly factored. This case only exists for the
    // batch.commit() API.
    commitRoot(root);
  } else {
	  //현재 함수가 실행될 때, 실행 컨텍스트가 RenderContext나 CommitContext에 속해 있지 않음을 보장
    invariant(
      (executionContext & (RenderContext | CommitContext)) === NoContext,
      'Should not already be working.',
    );
		// 비동기, 지연된 side-effect 처리
    flushPassiveEffects();

    // If the root or expiration time have changed, throw out the existing stack
    // and prepare a fresh one. Otherwise we'll continue where we left off.
    // renderExpirationTime의 초기값은 NoWork
    // expirationTime !== renderExpirationTime 다르다는 것은 작업의 우선순위가 변경되었다는 뜻입니다.
    if (
      root !== workInProgressRoot ||
      expirationTime !== renderExpirationTime
    ) {
      prepareFreshStack(root, expirationTime);
    }

    // workInProgress fiber 가 있다면, 여전히 처리해야 할 work 가 남아있다는 뜻입니다.
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

### prepareFreshStack()

[prepareFreshStack-code](https://github.com/facebook/react/blob/v16.12.0/packages/react-reconciler/src/ReactFiberWorkLoop.js#L1236)

- performSyncWorkOnRoot() 함수에서 살펴보았듯이  현재 우선순위가 가장 높은 Task의 `root`가 작업 중이던 workInProgressRoot와 다르다면 **reconciler는 우선순위의** **작업을 진행**하기 위해 컨텍스트를 초기화합니다.
- 쉽게 말해, 우선순위의 work를 먼저 실행하기 위해 깨끗한 stack을 준비한다고 생각하시면 됩니다.
- **전역변수 workInProgressRoot**에 현재 의 root를 할당하고 workInProgress Fiber를 root.current를 복제하여 Host root를 만듭니다. (workInProgressRoot변수로 현재 작업중인 root를 확인하고 다르다면 새로운 stack을 준비해야 합니다.)
- 현재 root.current (최상단 노드인 Host root)를 복제하여 **workInProgress** tree의 Host root를 만들고 **reconciler**의 컨텍스트를 초기화합니다.
- 항상 최상단 Host Root를 만드는 것으로 시작하며 모든 node를 생성하는 것은 아닙니다.

```jsx

function prepareFreshStack(root, expirationTime) {
  root.finishedWork = null;
  root.finishedExpirationTime = NoWork;
	// 전역변수 workInProgressRoot에 현재 root를 할당 
  workInProgressRoot = root;
  // workInProgress Fiber에 현재 root의 current의 최상단 (HostRoot)를 복제하여
  // workInProgress의 최상단 HostRoot를 만든다.
  workInProgress = createWorkInProgress(root.current, null, expirationTime);
  // context init
  renderExpirationTime = expirationTime;
  workInProgressRootExitStatus = RootIncomplete;
  workInProgressRootFatalError = null;
  workInProgressRootLatestProcessedExpirationTime = Sync;
  workInProgressRootLatestSuspenseTimeout = Sync;
  workInProgressRootCanSuspendUsingConfig = null;
  workInProgressRootNextUnprocessedUpdateTime = NoWork;
  workInProgressRootHasPendingPing = false;
}
```

### createWorkInProgress()

[createWorkInProgress-code](https://github.com/facebook/react/blob/v16.12.0/packages/react-reconciler/src/ReactFiber.js#L393)

- 재조정 작업은 빈번하게 발생하기 때문에 workInProgress를 매번 새로운 객체로 만들어내지 않습니다.
- 기존에 만들어진 객체를 재활용하고 속성만 초기화합니다.

```jsx
export function createWorkInProgress(
  current: Fiber,
  pendingProps: any,
  expirationTime: ExpirationTime,
): Fiber {
  let workInProgress = current.alternate;
  // current.alternate로 참조하고 있는 workInProgress 가 없다면 새로 생성
  if (workInProgress === null) {
	  // current를 참조하여 생성
    workInProgress = createFiber(
      current.tag,
      pendingProps,
      current.key,
      current.mode,
    );
    workInProgress.elementType = current.elementType;
    workInProgress.type = current.type;
    workInProgress.stateNode = current.stateNode;

    workInProgress.alternate = current;
    current.alternate = workInProgress;

  // 기존 workInProgress가 있다면 재활용
  } else {
    // 재활용 하지 못하는 속성들은 초기화 해준다.
    workInProgress.pendingProps = pendingProps;
    workInProgress.effectTag = NoEffect;
    workInProgress.nextEffect = null;
    workInProgress.firstEffect = null;
    workInProgress.lastEffect = null;
  }
  // current ~ workInProgress 공유 속성들
  workInProgress.childExpirationTime = current.childExpirationTime;
  workInProgress.expirationTime = current.expirationTime;

  workInProgress.child = current.child;
  workInProgress.memoizedProps = current.memoizedProps;
  workInProgress.memoizedState = current.memoizedState;
  workInProgress.updateQueue = current.updateQueue;

  workInProgress.sibling = current.sibling;
  workInProgress.index = current.index;
  workInProgress.ref = current.ref;

  return workInProgress;
}
```

![image](https://github.com/user-attachments/assets/506b3128-5af1-40fb-98dc-29434b22efe0)

- prepareFreshStack()이 실행되고 나면 위 그림과 같은 상황입니다.
- 재조정 작업을 진행하기 전 시작 위치이며 최상단 current을 복제한 workInProgress Host root를 만들었습니다.
- 항상 Host root부터 시작하여 자식까지 workInProgress 트리를 만들어 가게 됩니다.

---

# ReactDom.createRoot()

- 위에서 살펴보았던 performSyncWorkOnRoot(), performConcurrentWorkOnRoot()에서 아래 코드를 생각해보다 문득 궁금한 점이 생겼습니다.

    ```jsx
        if (
          root !== workInProgressRoot ||
          expirationTime !== renderExpirationTime
        ) {
          prepareFreshStack(root, expirationTime);
        }
    ```

- root ≠ workInProgressRoot의 조건은 구체적으로 어떤 상황일까?
- 만약 createRoot()통해 두개의 root를 생성하면 각각 current ←alternate→ workInProgress 를 생성하고 실행되는 걸까?
- 그렇다면 각각의 React가 실행되는 것인가?
- 의문점들을 해결하기 위해서 우선 root부터 찾아봐야 합니다.
- [React-deep-dive-11](https://giyoun-blog.vercel.app/posts/react-deep-dive-11) 에서 건너뛰었던 update가 발생하면 ExpirationTime을 해당 fiber부터 root까지 childExpirationTime을 새기고 root를 반환하는 함수 markUpdateTimeFromFiberToRoot()를 먼저 살펴 보겠습니다.

### markUpdateTimeFromFiberToRoot()

[markUpdateTimeFromFiberToRoot-code](https://github.com/facebook/react/blob/v16.12.0/packages/react-reconciler/src/ReactFiberWorkLoop.js#L450)

- 결국 실행하는  performSyncWorkOnRoot(), performConcurrentWorkOnRoot()에서 받는 root는 여기서 생성된 root 입니다.
- update가 발생한 fiber에 expirationTime을 새깁니다.
- 그리고 root를 찾기 위해 위로 올라가며 거쳐가는 모든 Fiber에 childExpirationTime을 새겨줍니다.
- 진행 과정 중 alternate에도 체크해주는 이유는 더블 버퍼링 형태로 current와 workInProgress는 commit phase를 지나면 교체됩니다.
- 현재의 currentlyRenderingFiber가 어떤것인지 알 수 없기 때문입니다.

```jsx
function markUpdateTimeFromFiberToRoot(fiber, expirationTime) {
  // Update the source fiber's expiration time
  if (fiber.expirationTime < expirationTime) {
    fiber.expirationTime = expirationTime;
  }
  let alternate = fiber.alternate;
  if (alternate !== null && alternate.expirationTime < expirationTime) {
    alternate.expirationTime = expirationTime;
  }
  // Walk the parent path to the root and update the child expiration time.
  // find root
  let node = fiber.return;
  let root = null;
  // FiberNode의 return값이 null이고, HostRoot tag를 지닌 FiberNode는 V-DOM tree에서의 최상단 Node입니다. 
  // HostRoot는 stateNode로 V-DOM을 대표하는 최상단 FiberRootNode를 참조합니다.
  // 즉 update발생 시간을 마킹하고 해당 FiberRootNode를 반환하는 함수입니다.
  if (node === null && fiber.tag === HostRoot) {
    root = fiber.stateNode;
  } else {
    while (node !== null) {
      alternate = node.alternate;
      // marking childExpirationTime
      if (node.childExpirationTime < expirationTime) {
        node.childExpirationTime = expirationTime;
        if (
          alternate !== null &&
          alternate.childExpirationTime < expirationTime
        ) {
          alternate.childExpirationTime = expirationTime;
        }
      } else if (
        alternate !== null &&
        alternate.childExpirationTime < expirationTime
      ) {
        alternate.childExpirationTime = expirationTime;
      }
      if (node.return === null && node.tag === HostRoot) {
        root = node.stateNode;
        break;
      }
      node = node.return;
    }
  }
  return root;
}
```

- 이제 root가 update가 발생한 해당 FiberRootNode라는 것이 확인 되었습니다.
- 그렇다면 workInProgressRoot변수는 왜 사용하는 것일까요?
- [공식문서](https://ko.react.dev/reference/react-dom/client/createRoot#rendering-a-page-partially-built-with-react)에서도 확인할 수 있듯이 ReactDom.createRoot()를 통해 여러 개의 FiberRootNode를 생성할 수 있습니다.
- 테스트 해보면 실제로 두개의 root를 생성해도 잘 동작합니다.

  ![image](https://github.com/user-attachments/assets/3d43b1ff-7c16-42a1-9b13-7f083e8107dd)
  
  ![image](https://github.com/user-attachments/assets/6e4b8a48-2896-49ee-b228-81339db17d43)

  ![root-render](https://github.com/user-attachments/assets/b0350847-769f-4adc-833b-ac2f8fb893bb)

- 실제로 각각의 FiberRootNode를 갖고 해당 FiberRootNode는 각각의 current ← alternate → workInProgress를 가질 것입니다.
- 이 상황에서 동기적으로 하나씩 업데이트가 이루어진다면 문제되지 않을 것입니다.
- 하지만 root를 렌더링하던 중 anotherRoot에서 사용자 이벤트와 같은 우선순위 작업이 발생한다면 어떻게 될까요?
    1. React.createRoot()를 통해 V-DOM을 대표하는 FiberRootNode를 생성합니다.
    2. FiberRootNode는 현재 commit된 current와 alternate인 workInProgress로 Double-Buffering형태로 commit phase를 지나면서 switching 됩니다.
    3. React.createRoot()통해 두 개의 root1, root2를 생성할 수 있습니다.
    4. JavaScript는 싱글 스레드 언어이기 때문에 한번에 하나의 작업만 가능합니다.
    5. 따라서 개별 React 인스턴스가 생성되고 동작하는 것이 아니라, 각 root의 작업들은 하나의 React 내부 Scheduler에 의해 각각의 root에 할당된 expirationTime을 기준으로 queue에 스케줄링되어 통합 관리됩니다.
    6. 때문에 현재 작업중인 root가 어떤 root의 작업인지 workInProgressRoot라는 전역변수로 확인할 필요가 있는 것이고, 중단 되었을 때 다음 프레임에 실행될 수 있도록  performSyncWorkOnRoot.bind(null, root); bind로 중단된 root를 묶어서 예약하는 것입니다.
    7. 결국 React Scheduler에서 root가 하나이든 여러개이든 queue에 work가 정렬되어 있을 것이고 각각의 root를 참조할 것입니다.
    8. 만약 root1에서 work1를 실행하다가 다른 root2에서 우선순위가 높은 work2가 유입된다면 기존 root1에서의 work1이 실행되다 중단시키고 다음 프레임에 root를 binding하여 스케줄링합니다.
    9. root2에서 우선순위의 작업 work2가 root1의work1보다 먼저 실행되어야 하므로 현재의 workInProgressRoot는 root1할당되어 있으므로 root(root2) !== workInProgressRoot(root1) 일 것이고 각각의 독립된 context를 보존하기 위해서 새롭게 workInProgress를 생성하여 처리합니다.
- 간과하지 말아야 할 점은 JS는 싱글 스레드라는 점입니다.
    - React.createRoot()를 통해 여러 개의 root를 생성한다고 여러 개의 React가 실행되는 것은 아닙니다.
    - React의 내부 Scheduler에서 각 Root의 expirationTime이 새겨진 work를 통합하여 queue에서 관리하는 것입니다.
    - 결국 React가 순차적으로 실행될때는 각각의 root를 참조하여 실행하다가 작업중인 workInProgressRoot가 현재 참조하는 root와 다르다면 해당 작업을 미루고 workInProgress를 생성하여 먼저 실행하는 것입니다.


---

## 정리

### 1. **작업 큐에 작업 등록**

- 각 root에서 작업(업데이트, 렌더링 등)이 발생하면 해당 작업에 대한 `expirationTime`이 설정됩니다.
- 이 `expirationTime`은 해당 작업이 언제까지 완료되어야 하는지를 나타내는 시간 값입니다.
- 해당 작업은 스케줄러의 작업 큐에 등록되며, 큐에는 여러 root에서 발생한 작업들이 모입니다.

### 2. **우선순위 정렬**

- 스케줄러는 작업 큐에 있는 작업들을 `expirationTime`에 따라 정렬합니다. 이 정렬된 작업 큐에서 가장 `expirationTime`이 임박한(가장 우선순위가 높은) 작업이 맨 앞에 위치하게 됩니다.
- 이렇게 정렬된 큐를 통해 React는 가장 시급한 작업을 먼저 처리할 수 있게 됩니다.

### 3. **작업 실행**

- 스케줄러는 큐의 맨 앞에 있는 작업을 선택해 실행합니다. 이 작업은 해당 root의 작업이 될 수 있고, 다른 root의 작업이 될 수도 있습니다.
- 작업이 완료되거나 중단이 필요한 경우, 스케줄러는 다음 작업을 선택해 실행합니다.

### 4. **중단과 재개**

- 만약 스케줄러가 작업을 수행 중 다른 root에서 더 높은 우선순위의 작업이 발생하면, 현재 작업을 중단하고 더 시급한 작업을 먼저 처리합니다.
- 이후 중단된 작업은 다시 큐에 재 등록되어 나중에 재개됩니다.

### 5. **결과적으로 단일 큐 관리**

- 모든 root에서 발생한 작업들이 단일 스케줄러 큐에서 관리되기 때문에, 여러 root가 동시에 작업을 처리할 때도 React는 각 작업의 우선순위를 고려해 효율적으로 처리할 수 있습니다

---

## Summary

- 이번 글은 유난히 양이 많습니다..ㅎㅎ 글을 작성하다보니 짚고 넘어가야할 내용들이 계속 생겨서 좀 길어졌네요.
- 여기까지 꽤나 많은 것들을 알 수 있었습니다.
- 저는 마법처럼 보였던 많은 궁금증들이 해소 되었습니다.
    - 어떻게 리액트가 렌더링하여 화면이 업데이트 되는지
    - 리액트 내부에서 V-DOM은 어떻게 생겼고 업데이트가 이루어 지는지
    - 어떻게 Concurrent Mode에서 time slicing을 구현했고 작업들이 우선순위에 따라 일시정지 재가동되는지
    - Browser에게 어떤 기준으로 call stack을 양보하고 부드러운 UI update를 가능하게 했는지
    - 어떻게 createRoot()로 여러개의 root를 생성하고 실행하는 것인지
- 내부코드를 살펴보면서 전체적인 흐름을 모두 알 수는 없지만, React팀이 생각해낸 방법들과 좋은 코드들을 살펴보는 것이 많은 도움이 되는 것 같습니다.
- 이제 재조정 작업을 위한 준비는 끝났습니다.
- 다음 글에서는 재조정 작업을 진행하는 workLoopSync() 함수 부터 살펴보도록 하겠습니다.