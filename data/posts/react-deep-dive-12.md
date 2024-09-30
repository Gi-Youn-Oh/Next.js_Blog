이번 글에서도 분석의 바탕이 되는 코드는 [React 16.12.0 version](https://github.com/facebook/react/tree/v16.12.0)을 기준으로 하며, [해당 블로그](https://www.notion.so/React-deep-dive-10-f903bf2b3e4248a29dd5402c89ccd591?pvs=21)에 감사 인사를전합니다.

이번 글에서는 발생한 Work(Update)를 Reconciler에서 Scheduler로 스케줄 요청하는 과정을 살펴보겠습니다.

아래 링크는  React의 렌더링 흐름에 따라 저 나름대로의 그림을 그려보았으며, 이 흐름에 따라 글이 이어 질 것입니다. (무단 복사 및 배포는 하지 말아주세요)

<a href="https://excalidraw.com/#json=uLcMHu8jJEoJQ3OqUjgDt,wN2ucGYl5b9B6B82ShNMgQ" target="_blank">Gy's React Diagram</a>

---
## Flow

**Reconciler** → Scheduler → Scheduler Host-config → Reconciler Render Phase → Reconciler Commit Phase

![image](https://github.com/user-attachments/assets/e6ffd320-1be8-40b6-a453-cda5f8f6f6d0)

**1. Reconciler**

- Dispatch a trigger to update.

- <span style='background-color: #FFB6C1'>The reconciler requests the scheduler to schedule a task.</span>

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

## Reconciler → Scheduler

- 이전 글에서는 DispatchAction을 통해 Reconciliation의 trigger가 되어 다음과 같은 흐름을 살펴보았습니다.
    1. dispatchAction이 발생하면 해당 이벤트 발생 시점(expirationTime)을 기록하고 → scheduleWork()
    2. 해당 update event(Work)를 sync or async로 처리할 지 확인 후 → sheduleUpdateOnFiber()
    3. scheduler에게 전달하기 전 expirationTime을 통하여 우선순위 정리 → ensureRootIsScheduled()
    4. **sync → scheduleSyncCallback() / async → scheduleCallback()**
- 이번 글에서는 ensureRootIsScheduled()에 이어서 Reconciler에서 scheduler로 스케줄 요청을 하는 scheduleSyncCallback(), scheduleCallback() 함수부터 살펴보겠습니다.

  (아직까지는 Reconciler이며, Scheduler로 들어가지 않았습니다.)


---

### ensureRootIsScheduled()

- 이전 글에서 살펴보았던 ensureRootIsScheduled()에서 scheduleSyncCallback, scheduleCallback 함수를 다음과 같이 호출했습니다.
- Sync의 경우 바로 callback함수(performSyncWorkOnRoot())를 스케줄러에게 넘기지만, Async의 경우 우선순위와 timeout시간과 함께 callback을 넘깁니다.

  ⇒ 스케줄러에서 해당 시간과 우선순위로 실행 시점을 조정한다는 것을 알 수 있습니다.


```jsx
scheduleSyncCallback(performSyncWorkOnRoot.bind(null, root));
 
scheduleCallback(
      priorityLevel,
      performConcurrentWorkOnRoot.bind(null, root),
      // 만료 시간을 기반으로 작업 타임아웃을 계산합니다. 
      {timeout: expirationTimeToMs(expirationTime) - now()},
    );
  }
```

### scheduleCallback() / Async
[scheduleCallback-code](https://github.com/facebook/react/blob/v16.12.0/packages/react-reconciler/src/SchedulerWithReactIntegration.js#L128)

- 우선순위, callback, options를 scheduler에 넘겨주며 스케줄링을 요청합니다.
    - options
        - timeout - 만료시간
        - delay - 지연시간


```jsx
import * as Scheduler from 'scheduler'
const { unstable_scheduleCallback: Scheduler_scheduleCallback } = Scheduler

function scheduleCallback(
  reactPriorityLevel: ReactPriorityLevel,
  callback: SchedulerCallback,
  options: SchedulerCallbackOptions | void | null
) {
  const priorityLevel = reactPriorityToSchedulerPriority(reactPriorityLevel)
  return Scheduler_scheduleCallback(priorityLevel, callback, options)
}
```

### scheduleSyncCallback() / Sync
[scheduleSyncCallback-code](https://github.com/facebook/react/blob/v16.12.0/packages/react-reconciler/src/SchedulerWithReactIntegration.js#L137)

- Sync는 동기적으로 실행되기 때문에scheduler에게 넘길 필요 없이 reconciler 내부적으로 처리합니다.
- Sync work들은 내부 queue에 따로 저장해두고 적당한 시기에 queue를 비워줍니다. (flushSycnCallbackQueue())
- 만약 이전 시간에 살펴보았던  **scheduleUpdateOnFiber()**함수에서 **executionContext ≠ NoContext**라서 syncQueue를 비우지 않았다면 다음 틱에 동시에 발생한 업데이트는 배치 처리됩니다. 해당 업데이트는 Linked List로 이미 연결되어 있기 때문에 한번의 렌더링(**Work**)으로 처리됩니다.

  ⇒ Hook에서 자세히 살펴보겠지만 update는  circular-linked-list로 연결되어 있습니다.

![image](https://github.com/user-attachments/assets/51da26de-2cfe-458a-9c21-639f31e5a0f0)

![image](https://github.com/user-attachments/assets/553db63f-a509-493b-940e-95db9f3d5021)


```jsx
function scheduleSyncCallback(callback: SchedulerCallback) {
  // Push this callback into an internal queue. We'll flush these either in
  // the next tick, or earlier if something calls `flushSyncCallbackQueue`.
  if (syncQueue === null) {
    syncQueue = [callback]
    // Flush the queue in the next tick, at the earliest.
    immediateQueueCallbackNode = Scheduler_scheduleCallback(
      Scheduler_ImmediatePriority,
      flushSyncCallbackQueueImpl
    )
  } else {
    // Push onto existing queue. Don't need to schedule a callback because
    // we already scheduled one when we created the queue.
    syncQueue.push(callback)
  }
  return fakeCallbackNode 
}
```

### flushSyncCallbackQueue()
[flushSyncCallbackQueue-code](https://github.com/facebook/react/blob/v16.12.0/packages/react-reconciler/src/SchedulerWithReactIntegration.js#L161)

- 만약 React가 유휴 상태여서 해당 함수를 호출했다면  기존에 스케줄링 요청한 callback은 취소하고 실행해야 한다.


```jsx
export function flushSyncCallbackQueue() {
  if (immediateQueueCallbackNode !== null) {
    const node = immediateQueueCallbackNode;
    immediateQueueCallbackNode = null;
    Scheduler_cancelCallback(node);
  }
  flushSyncCallbackQueueImpl();
}
```

### flushSyncCallbackQueueImpl()

[flushSyncCallbackQueueImpl-code](https://github.com/facebook/react/blob/v16.12.0/packages/react-reconciler/src/SchedulerWithReactIntegration.js#L170)

```jsx
function flushSyncCallbackQueueImpl() {
  if (!isFlushingSyncQueue && syncQueue !== null) {
    // Prevent re-entrancy. 중복 실행 방지
    isFlushingSyncQueue = true;
    let i = 0;
    try {
      const isSync = true;
      const queue = syncQueue;
      // scheduler에게 callback함수의 우선순위와 실행을 요청하는 함수
      runWithPriority(ImmediatePriority, () => {
        for (; i < queue.length; i++) {
          let callback = queue[i];
          do {
            callback = callback(isSync); // performSyncWorkOnRoot()
          } while (callback !== null);
        }
      });
      syncQueue = null;
    } catch (error) {
      // If something throws, leave the remaining callbacks on the queue.
      if (syncQueue !== null) {
        syncQueue = syncQueue.slice(i + 1);
      }
      // Resume flushing in the next tick
      Scheduler_scheduleCallback(
        Scheduler_ImmediatePriority,
        flushSyncCallbackQueue,
      );
      throw error;
    } finally {
      isFlushingSyncQueue = false;
    }
  }
}
```

---

# Summary

- 이렇게하여 Reconciler가 Scheduler에게 scheduling을 요청하는 과정을 살펴보았습니다.
- Reconciler는 재조정 작업 / Scheduler는 Work의 실행시점을 scheduling 하도록 분리시켜 각자의 맡은 일만 하도록 구성되어 있는 것을 확인 할 수 있었습니다.
- 다음 글에서는 이제 work를 넘겨받은 scheduler가 스케줄링하는 방식을 살펴보겠습니다.