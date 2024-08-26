이번 글에서도 분석의 바탕이 되는 코드는 [React 16.12.0 version](https://github.com/facebook/react/tree/v16.12.0)을 기준으로 하며, [해당 블로그](https://www.notion.so/React-deep-dive-10-f903bf2b3e4248a29dd5402c89ccd591?pvs=21)에 감사 인사를전합니다.

이전 글에 이어서 scheduler로 전달된 callback을 어떻게 스케줄링 하는지 살펴보겠습니다.

아래 링크는  React의 렌더링 흐름에 따라 저 나름대로의 그림을 그려보았으며, 이 흐름에 따라 글이 이어 질 것입니다. (무단 복사 및 배포는 하지 말아주세요)

<a href="https://excalidraw.com/#json=fky4cO3h5RXKBcJgaVw_l,yczelRbNqAqHxBwE5Hf3kQ" target="_blank">Gy's React Diagram</a>

---
## Flow

Reconciler → **Scheduler** → host-config(in Scheduler) → Render Phase(in Reconciler) → Commit(in Reconciler)

![image](https://github.com/user-attachments/assets/e6ffd320-1be8-40b6-a453-cda5f8f6f6d0)

1. Reconcile

    1) trigger dispatchAction

    2) Reconciler Request Scheduling Work

2. <span style='background-color: #FFB6C1'>Hook의 실행 시점을 제어하는 Scheduler</span>
3. Scheduler의 양보 시스템
4. Hook의 실행 준비
5. Render Phase 진입
6. Reconciliation
7. Commit Phase 진입
8. useEffect, useLayoutEffect
9. Browser paint

---

# Scheduler

[Scheduler-code](https://github.com/facebook/react/blob/v16.12.0/packages/scheduler/src/Scheduler.js#L63)

- scheduler는 reconciler에서 넘겨받은 work를 스케줄하는 패키지이며, host환경에 의존적입니다. (이 글에서는 browser 환경에 맞추어 살펴보겠습니다.)
- 항상 다이어그램과 함께 보시는 것이 흐름 파악에 도움이 되실 겁니다.
- Scheduler에서의 work는 **task**로 관리되는데 코드를 보면 taskQueue와 timerQueue 두개의 큐가 있는 것을 확인 할 수 있다.

    ```jsx
    // Tasks are stored on a min heap
    var taskQueue = [];
    var timerQueue = [];
    ```

    - [Task는 최소힙 자료구조](https://github.com/facebook/react/blob/v16.12.0/packages/scheduler/src/SchedulerMinHeap.js)에 추가되어 우선순위에 맞춰 정렬되며, 정렬 기준은 Task의 sortIndex입니다.
- 단일 큐에서 정렬을 하면 비용이 많이 발생하므로 React에서는  하나의 큐를 더 생성하여 task를 정렬하는 방식을 선택했다.
    - timerQueue → taskQueue

  ![image](https://github.com/user-attachments/assets/b954609d-27b5-4cc4-bf09-5427271948f9)

### Task 생성

[task-code](https://github.com/facebook/react/blob/v16.12.0/packages/scheduler/src/Scheduler.js#L318)

```jsx
  var newTask = {
    id: taskIdCounter++,
    callback, // Reconciler에서 넘겨준 callback (performSyncWorkOnRoot())
    priorityLevel, // Reconciler에서 넘겨준 priority Level
    startTime, // currentTime + delay (delay는 Reconciler에서 options로 넘겨준 값)
    expirationTime, // startTime + timeout (timeout은 Reconciler에서 options로 넘겨준 값 or timeoutForPriorityLevel(priorityLevel) 로 구한 값
    sortIndex: -1,
  };
```

### scheduleCallback(priorityLevel, callback, options)

[scheduleCallback-code](https://github.com/facebook/react/blob/v16.12.0/packages/scheduler/src/Scheduler.js#L295)

- 이전에 Reconciler에서 Scheduler로 넘겨준 인자들로 Task 객체를 생성하고 실행시점을 제어하기 위하여 timerQueue와 taskQueue로 관리한다.
- 주석에 설명을 적어두었으니, 주석과 함께 읽어보시기 바랍니다.
- requestHostTimeout은 handleTimeout을 호출하고 이는 결국 requestHostCallback을 호출하게 되는데 host_config내용이 적지 않으니 다음 글에서 살펴보겠습니다.
- 전반적인 흐름은 다음과 같습니다.
    1. Reconciler에서 넘겨준 callback과 priorityLevel, options(timeout, delay)로 task를 생성한다.
    2. 해당 task를 우선순위와 delay에 따라 두개의 Queue를 Timer 관리하며 순위를 정렬한다.
    3. 가장 높은 순위의 task를 host_config에 맞추어 실행한다.

  **⇒ 복잡해 보이지만 결국엔 callback의 실행 시점을  우선순위와 지연 시간에 따라 줄 세우고, host_config에 맞추어 해당 callback을 실행하는 것입니다.**


```jsx
function unstable_scheduleCallback(priorityLevel, callback, options) {
  var currentTime = getCurrentTime();

  var startTime;
  var timeout;
  // task의 startTime & timeout 
  if (typeof options === 'object' && options !== null) {
    var delay = options.delay;
    if (typeof delay === 'number' && delay > 0) {
      startTime = currentTime + delay; 
    } else {
      startTime = currentTime;
    }
    timeout =
      typeof options.timeout === 'number'
        ? options.timeout
        : timeoutForPriorityLevel(priorityLevel);
  } else {
    timeout = timeoutForPriorityLevel(priorityLevel); // 우선순위에 따라 시간을 구함
    startTime = currentTime;
  }
	// scheduler에서의 ExpirationTime은 Task가 실행되어야 할 만료 시간
  var expirationTime = startTime + timeout;

	// 위 에서 구한 값들과 전달받은 인자들로 task 생성
  var newTask = {
    id: taskIdCounter++,
    callback,
    priorityLevel,
    startTime,
    expirationTime,
    sortIndex: -1,
  };
  if (enableProfiling) {
    newTask.isQueued = false;
  }
	// startTime이 currentTime보다 크다는 것은 delay가 있다는 뜻 
  if (startTime > currentTime) 
    // This is a delayed task.
    newTask.sortIndex = startTime;
		//delay가 있기 때문에 timerQueue에 push
    push(timerQueue, newTask);
    // 모든 task가 delay가 있다면 즉, taskQueue로 들어간 task가 현재 없다면, 가장 빠른 delay를 가진 task를 timerQueue에서 꺼낸다.
    if (peek(taskQueue) === null && newTask === peek(timerQueue)) {
      if (isHostTimeoutScheduled) {
        // 중복실행 방지를위해 기존 Timeout을 cancle
        cancelHostTimeout(); // requestHostTimeout() clear
      } else {
	      // 없다면 flag true
        isHostTimeoutScheduled = true;
      }
      // 실행 1순위 타이머가 바뀌었기 때문에 해당 task의 delay시간으로 다시 설정
      // Schedule a timeout, startTime - currentTime = delay
      requestHostTimeout(handleTimeout, startTime - currentTime);
    }
  } else { // delay가 있는 task가 아니라면
    newTask.sortIndex = expirationTime;
    // taskQueue에 push
    push(taskQueue, newTask);
    if (enableProfiling) {
      markTaskStart(newTask, currentTime);
      newTask.isQueued = true;
    }
    // Schedule a host callback, if needed. If we're already performing work,
    // wait until the next time we yield.
    if (!isHostCallbackScheduled && !isPerformingWork) {
      isHostCallbackScheduled = true;
      requestHostCallback(flushWork);
    }
  }

  return newTask;
}
```

### requestHostTimeout(), cancleTimeout() / In scheduler_host_config

[requestHostTimeout, cancleTimeout - code](https://github.com/facebook/react/blob/v16.12.0/packages/scheduler/src/forks/SchedulerHostConfig.default.js#L237)

- 해당 함수는 다음 글에서 살펴볼 host_config에 속한 함수이지만 이해를 위해 먼저 살펴 보겠습니다.
- 흔히 사용하는 setTimeout함수입니다.
- 해당 callback함수(handleTimeout())를 delay시간 이후에 실행 시키도록 하는 것이죠.

```jsx
requestHostTimeout = function(callback, ms) {
	taskTimeoutID = setTimeout(() => {
		callback(getCurrentTime())
	}, ms)
}

cancleHostTimeout = function(){
	clearTimeout(taskTimeoutID)
	taskTimeoutID = -1
}	
```

### handleTimeout()

[handleTimeout-code](https://github.com/facebook/react/blob/v16.12.0/packages/scheduler/src/Scheduler.js#L105)

- handleTimeout 함수가 실행되었다는 것은 가장 빠른 즉 1순위 Timer가 timeout되었다는 것이고, 이렇게 timeout된 task는 taskQueue로 이동됩니다.
- 이동된 task들은 host_config에 맞추어 소비되고, delay가 있는 task들은 다시 Timer를 통해 예약되고 소비가 반복됩니다.

```jsx
function handleTimeout(currentTime) {
  isHostTimeoutScheduled = false; // timeout이 되었기 때문에 False
  advanceTimers(currentTime); // task move from timerQueue to taskQueue
	
  if (!isHostCallbackScheduled) {
	  // taskQueue로 옮겨진 task가 있다면 
    if (peek(taskQueue) !== null) {
      isHostCallbackScheduled = true;
      // taskQueue를 host_config에 맞추어 소비
      requestHostCallback(flushWork); // flushWork는 taskQueue소비 함수
    } else { // taskQueue에 task가 없다면 (advacneTimers()실행 후에도 없다면)
      const firstTimer = peek(timerQueue); // timerQueue에서 꺼내 다시 timer실행
      if (firstTimer !== null) {
        requestHostTimeout(handleTimeout, firstTimer.startTime - currentTime);
      }
    }
  }
}
```

### advanceTimers()

[advanceTimers-code](https://github.com/facebook/react/blob/v16.12.0/packages/scheduler/src/Scheduler.js#L81)

- 시간이 만료된 task를 timerQueue에서 taskQueue로 보내 task를 소비하도록 해주는 함수입니다.
- timerQueue의 모든 Task(Timer)를 (`startTime > currentTime`)만족하는 task를 만날때까지 확인하며, 만료가 된 task들 taskQueue로 이동시킵니다.
- 없다면 return (advanceTimers()를 실행한 뒤에도 taskQueue는 비어 있을 수 있다.)

```jsx
function advanceTimers(currentTime) {
  // Check for tasks that are no longer delayed and add them to the queue.
  let timer = peek(timerQueue);
  while (timer !== null) {
	  // task가 취소되었을 경우 callback = null
    if (timer.callback === null) {
      // Timer was cancelled.
      pop(timerQueue);
    } else if (timer.startTime <= currentTime) {
      // Timer fired. Transfer to the task queue.
      pop(timerQueue);
      // taksQueue의 정렬기준은 expirationTime
      timer.sortIndex = timer.expirationTime;
      push(taskQueue, timer);
      if (enableProfiling) {
        markTaskStart(timer, currentTime);
        timer.isQueued = true;
      }
    } else {
      // Remaining timers are pending.
      return;
    }
    timer = peek(timerQueue);
  }
}
```

---

## Summary

이번 글에서는 Reconciler에서 넘겨준 callback, priorityLevel, options로 Task를 생성하고 해당 Task를

timerQueue, taskQueue두 개의 Queue로 관리하며 순차적으로 넘겨받은 Task(Work = callback)을 처리하는 과정을 살펴보았습니다.

다음 글에서는 미뤄둔 requestHostCallback()함수부터 React의 host_config(browser기준)는 어떻게 구축되어 있는지 살펴보도록 하겠습니다.