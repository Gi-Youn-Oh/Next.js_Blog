앞서 공식 문서를 통한 기본 개념과 사용, React 내부 코드들을 살펴보기 위한 개념들을 정리해봤습니다.

앞으로 분석의 바탕이 되는 코드는 [React 16.12.0 version](https://github.com/facebook/react/tree/v16.12.0)을 기준으로 하며, 현재 사용 중인 18이상의 버전과는 조금 다르지만 (LANE 등) Fiber Architecture를 사용하는 것은 동일하고 React의 rendering 핵심 로직과 내부에서 어떻게 이벤트에 대한 처리와 순서를 관리하는지 확인하는 것에는 충분 하기에 해당 버전으로 진행하도록 하겠습니다.

사실 이전에도 React 내부 코드를 파헤쳐 보려 했지만 useState를 따라가다 보니 해당 훅의 코드를 주입하는 곳을 찾지 못해 중단 했었는데 좋은 분석 글을 찾아 많은 도움을 받았으며 감사의 말씀을 전합니다.
[해당 블로그](https://goidle.github.io)를 바탕으로 신입 입장에서 정리를 한번 해보려 합니다.

아래 링크는  React의 렌더링 흐름에 따라 저 나름대로의 그림을 그려보았으며, 이 흐름에 따라 글이 이어 질 것입니다. (무단 복사 및 배포는 하지 말아주세요)

<a href="https://excalidraw.com/#json=fky4cO3h5RXKBcJgaVw_l,yczelRbNqAqHxBwE5Hf3kQ" target="_blank">Gy's React Diagram</a>

---
## Flow

**Reconciler** → Scheduler → Scheduler Host-config → Reconciler Render Phase → Reconciler Commit Phase

![image](https://github.com/user-attachments/assets/e6ffd320-1be8-40b6-a453-cda5f8f6f6d0)

**1. Reconciler**
    
- <span style='background-color: #FFB6C1'>Dispatch a trigger to update.</span>

- The reconciler requests the scheduler to schedule a task.

**2. Scheduler**

- Schedule the work.

**3. Scheduler Host Config**

- Yield control to the host.

**4. Reconciler Render Phase**

- Prepare for reconciliation.

- Enter the render phase.

- Perform rendering with hooks.

- Reconcile the `workInProgress` tree.

**5. Reconciler Commit Phase**

- Execute `useEffect` and `useLayoutEffect`.

**6. Browser Paint**

---

## Reconciler

- 이전 글에서도 살펴보았듯, Reconciler는 React에서 Rendering 핵심을 담당하는 중요한 패키지이다.
- 컴포넌트에서 update가 발생하면 [ex) useState훅을 통해 setState(dispatchAction)를 실행 등] 발생 시간(expirationTime)을 새기고, 이벤트가 발생한 component(Fiber)의 root(해당 컴포넌트의 V-DOM root에 스케줄 정보(expirtaionTime)를 기록하고, 정리 후 Scheduler에게 넘긴다.
- 이후 Scheduler에 의해 실행 시점에 따라 Reconcile과정이 실행되는데 흔히 우리가 말하는 React의 Rendering(Render Phase + Commit Phase)이 실행된다.

### expirationTime

[expirationTime-code](https://github.com/facebook/react/blob/v16.12.0/packages/react-reconciler/src/ReactFiberExpirationTime.js#L23)

- 나중에 발생한 작업일수록 더 작은 expirationTime 값을 가지게 된다 ⇒ **큰 숫자가 더 먼저 발생한 작업이다.**
- expirationTime은 work의 우선순위를 조정하는데 사용됩니다.
- reconciler와 scheduler에 의미가 조금 다른데 다음과 같습니다.
    - <span style='background-color: #FFB6C1'>in reconciler</span>
        - 같은 expirationTime에 발생한 연속적 이벤트 ⇒ 단일 이벤트
        - 다른 expirationTime ⇒ 개별 이벤트
    - <span style='background-color: yellow'>in scheduler</span>
        - work(Task)의 만료시간, 즉 work가 expirationTime까지 완료되어야 한다.

---

## Reconcile trigger dispatchAction

- 흐름은 다음과 같습니다.
    1. dispatchAction이 발생하면 해당 이벤트 발생 시점(expirationTime)을 기록하고 → markUpdateTimeFromFiberToRoot()
    2. 해당 update event(Work)를 sync or async로 처리할 지 확인 후 → sheduleUpdateOnFiber() 
    3. scheduler에게 전달하기 전 expirationTime을 통하여 우선순위 정리 → ensureRootIsScheduled()
    4. sync → scheduleSyncCallback() / async → scheduleCallback()

### dispatchAction()

[dispatchAciton-code](https://github.com/facebook/react/blob/v16.12.0/packages/react-reconciler/src/ReactFiberHooks.js#L1358)

- dispatchAction함수는 추후 hook 호출과 렌더링 과정에서 세세하게 살펴볼 것이기 때문에 지금은 setState와 같이 V-DOM 재조정의 trigger정도로 생각해주시면 좋을 것 같습니다.

### scheduleUpdateOnFiber()

[scheduleUdpateOnFiber-code](https://github.com/facebook/react/blob/v16.12.0/packages/react-reconciler/src/ReactFiberWorkLoop.js#L374)

- 꽤나 애를 먹었던 부분인데 아무래도 각 패키지도 추상화 되어 있고 외부에서 주입받거나 지역변수, 전역변수가 혼재되어 있기 때문에 여러번 보면서 파악하는 수 밖에 없었다.
- 우선 재조정을 위해 event발생 시점을 기록해준다.
- 분기처리를 통해 실행 or 스케줄링한다.
  1. <span style='background-color: lightblue'>expirationTime = Sync or Async ?</span>
        - 발생한 Work가 Sync 즉 지금 동기적으로 처리해야 하는 것인지, Async 비동기로 처리해야하는 것인지로 나눈다.
        
        1-1. <span style='background-color: lightblue'>expirationTime === Sync (동기)</span>
        
        2. <span style='background-color: lightgreen'>excutionContext =?</span>
           - 동기처리인 경우에도 2가지 경우의 수로 나뉜다.
          
            2-1. <span style='background-color: lightgreen'>(executionContext & LegacyUnbatchedContext) !== NoContext &&(executionContext & (RenderContext | CommitContext)) === NoContext)</span>
            
            - 즉시 실행으로 넘어간다. (scheduler 넘길 필요 없음)
              - LegacyUnbatchedContext 라는 뜻은 이전에 batching없이 하나씩 처리하던 방식이다.
              - Render | Commit Context 둘다 아니라는 뜻은 V-DOM생성 자체가 안된 것
            
            2-2. <span style='background-color: lightgreen'>else</span>
            
            - 일괄(batching)처리와 기존 Work가 있다면 우선순위 비교로 정리한 뒤에

                3. <span style='background-color: #FFB6C1'>if (executionContext === NoContext)</span>
                    - NoContext라면 flushSyncCallbackQueue()를 통해 내부 queue(syncQueue)를 비워줍니다. (scheduler에 넘길 필요 없이 Reconciler에서 처리하면 된다.)
                        - 사용자 클릭과 같은 UserEvent는 EventContext로 등록되어 batching처리
                        - v18부터는 setTimeout과 같은 event또한 batching처리 가능하게 되었다.
                            - 원하지 않는다면 flushSync를 사용
                                
                                [flushSync](https://ko.react.dev/reference/react-dom/flushSync)
                                
            
        1-2. <span style='background-color: lightblue'>expirationTime === Async (비동기)</span>
        
        - expirationTime에 의거해 우선순위와 함께 scheduler에 전달하여 스케줄링 한다.
    
    <span style='font-weight:800'>⇒ 이 함수에서 알 수 있는 것은 React가 Stack 기반으로 바로바로 하나씩 Work를 처리하는 방식에서 여러 이벤트를 일괄 업데이트하여 효율성을 높히는 방법을 이러한 코드에서 구현하였다는 것을 알 수 있다.</span>
    
- 코드 주석과 함께 살펴보자

```jsx
export function scheduleUpdateOnFiber(
  fiber: Fiber,
  expirationTime: ExpirationTime
) {
  // update가 발생한 fiber(expirationTime)부터 root까지 올라가며 (childExirationTime)을 새겨 준다.
  const root = markUpdateTimeFromFiberToRoot(fiber, expirationTime);

  // work 호출 동기 작업일 때
  if (expirationTime === Sync) {
    // LegacyUnbatchedContext -> 비일괄 처리 (no batching)
    // render & commit 둘다 아니라는 것은 V-DOM이 없다는 뜻 -> 바로 실행
    if (
      (executionContext & LegacyUnbatchedContext) !== NoContext &&
      (executionContext & (RenderContext | CommitContext)) === NoContext
    ) {
      // 레거시 동기 작업이며, 렌더링 또는 커밋 작업 중이 아닌 경우
      performSyncWorkOnRoot(root); // 즉시 동기 작업 수행
    } else {
      // batching(일괄 처리)를 위해 스케줄 등록을 하고, 우선순위 비교를위해 이미 스케줄링된 work 우선순위 비교
      ensureRootIsScheduled(root);
      // user event의 경우 EventContext를 가져 바로 처리되지 않고 batching된다.
      // legacy가 아니면서 NoContext 즉 유휴 상태라면
      if (executionContext === NoContext) {
        flushSyncCallbackQueue(); // 동기 콜백 큐 비우기 flushSyncCallbakcQueue() = performSyncWorkOnRoot()반복하여 비워줌 ex) setTimeout(), Promise ..
      }
    }
  }
  // 비동기 작업일 때 -> 지금 당장 호출해야 하는 것은 아니므로 스케줄링을 통해 실행
  else {
    ensureRootIsScheduled(root); // 루트 작업 스케줄링
  }
}

export const scheduleWork = scheduleUpdateOnFiber;
```

### ensureRootIsScheduled()

- 기존 등록된 work (existingCallbackNode)가 있다면 새롭게 스케줄링 등록할 work와 우선 순위를 비교하여 취소 또는 유지를 해준다.
- sync or async에 따라서 Scheduler에게 스케줄링 요청 함수를 실행한다.
    - 아래 두 함수는 다음 글에서 자세히 다루어 보도록 하겠습니다.
        - scheduleSyncCallback(동기)
        - scheduleCallback(비동기)
- 주석과 함께 코드를 살펴보겠습니다.

<span style='font-weight:800'>⇒ 이 함수를 통해 알 수 있는 점은 root (workInProgress tree)에서 하나의 작업만 실행하도록 보장하며, 여러 작업들의 실행 시점을 scheduler에게 위임하여 관리한다는 것입니다.
결국 reconciler에서는 주어진 work만을 책임지도록 하고, 우선순위 및 실행 시점관리를 위해 필요한 정보들을 담아 scheduler에게 전달하는 것입니다.</span>

또한 사용자 클릭과 같은 우선순위 이벤트가 먼저 처리될 수 있는 기반의 코드를 살펴볼 수 있었습니다.

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

  const expirationTime = getNextRootExpirationTimeToWorkOn(root);
  const existingCallbackNode = root.callbackNode;
  if (expirationTime === NoWork) {
    // 작업할 것이 없습니다.
    if (existingCallbackNode !== null) {
      root.callbackNode = null;
      root.callbackExpirationTime = NoWork;
      root.callbackPriority = NoPriority;
    }
    return;
  }

  const currentTime = requestCurrentTimeForUpdate();
  // 현재시점과 비교하여 우선순위를 결정합니다.
  const priorityLevel = inferPriorityFromExpirationTime(
    currentTime,
    expirationTime,
  );

  // 기존의 렌더링 작업이 있는 경우, 올바른 우선순위와 만료 시간을 확인합니다.
  // 그렇지 않으면, 기존 작업을 취소하고 새 작업을 예약합니다.
  if (existingCallbackNode !== null) {
    const existingCallbackPriority = root.callbackPriority;
    const existingCallbackExpirationTime = root.callbackExpirationTime;
    if (
      // 콜백은 정확히 동일한 만료 시간을 가져야 합니다.
      existingCallbackExpirationTime === expirationTime &&
      // 콜백은 더 크거나 같은 우선순위를 가져야 합니다.
      existingCallbackPriority >= priorityLevel
    ) {
      // 기존 콜백이 충분합니다.
      return;
    }
    // 새로운 작업을 예약해야 합니다.
	  // 기존 callback을 취소요청 -> scheduler
    cancelCallback(existingCallbackNode);
  }

  root.callbackExpirationTime = expirationTime;
  root.callbackPriority = priorityLevel;

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

---

# Summary

- 본격적인 내부코드의 첫 번째 Reconcile trigger dispatchAction 을 살펴보았습니다.
- 지금까지 본 흐름은 dispatchAction을 통해 재조정 작업이 trigger 되었고, 이 work를 실행하기에 앞서 실행시점을 관리하기 위한 분기처리와 scheduler에게 전달까지 살펴보았습니다.
- 다음 글에서는 scheduler에게 넘겨진 이 work가 어떻게 scheduling되어 처리되는지 살펴보도록 하겠습니다.