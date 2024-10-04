이번 글에서도 분석의 바탕이 되는 코드는 [React 16.12.0 version](https://github.com/facebook/react/tree/v16.12.0)을 기준으로 하며, [해당 블로그](https://goidle.github.io/)에 감사 인사를 전합니다.

이전 글에서 scheduler에서 Work(callback, priorityLevel, options)를 기반으로 Task를 생성하고 두 개의 Queue로 소비 순서를 정리하는 것까지 살펴보았습니다.

지금까지 callback은 다음과 같이 흘러가고 있고 아직 소비하지 못했습니다. 결국 적절한 시기에 Reconciler가 소비할 수 있도록 정리하는 과정임을 잊지 마시길 바랍니다.

- callback(performWorkOnRoot) → Reconciler(Work) → Scheduler(TimerQueue To TaskQueue Task)→ Reconciler(task소비)

오늘은 host 환경에 따라 어떻게 브라우저에게 양보하며, task를 실행하도록 하는지 살펴보겠습니다.

이번 글에서는 MessageChannel(), requestAnimationFrame(), Vsync 개념이 선행되어야 합니다.

글에서 설명은 하지만 자세한 내용은 우선적으로 학습하시고 읽는 것을 추천드립니다.

아래 링크는  React의 렌더링 흐름에 따라 저 나름대로의 그림을 그려보았으며, 이 흐름에 따라 글이 이어 질 것입니다. (무단 복사 및 배포는 하지 말아주세요)

<a href="https://excalidraw.com/#json=V0SwRJn2D2oo3pSesIVo5,H-kq_Lc5OnichbquJKzDBw" target="_blank">Gy's React Diagram</a>

---
## Flow

Reconciler → Scheduler → **Scheduler Host-config** → Reconciler Render Phase → Reconciler Commit Phase

![image](https://github.com/user-attachments/assets/e6ffd320-1be8-40b6-a453-cda5f8f6f6d0)

**1. Reconciler**

1) Dispatch a trigger to update.

2) The reconciler requests the scheduler to schedule a task.

**2. Scheduler**

1) Schedule the work.

**3. Scheduler Host Config**

1) <span style='background-color: #FFB6C1'>Yield control to the host.</span>

**4. Reconciler Render Phase**

1) Prepare for reconciliation.

2) Enter the render phase.

3) Perform rendering with hooks.

4) ReconcileChildren

5) Finishing Work

**5. Reconciler Commit Phase**

1) Execute `useEffect` and `useLayoutEffect`.

**6. Browser Paint**

---

# Browser (host_config)

- 본격적으로 함수들을 살펴보기 전 필요한 개념들을 잡고 가도록 하겠습니다.

## Frame

- 보통의 현대 모니터는 60hz를 지원하기 때문에 16.6ms안에 렌더링 과정이 완료되어 보여줘야 부드러운 화면 동작이 가능하다.
- 그렇지 않으면 janking현상으로 부자연스러운 화면이 보여진다.

### janking

- janking 현상은 브라우저의 렌더링 과정에서 CPU와 GPU의 작업 완료 시점이 맞지 않거나, 특정 작업이 예상보다 오래 걸려 발생하는 일종의 시각적 끊김 현상입니다.

![image](https://github.com/user-attachments/assets/73e40e60-6c2f-4555-936f-7c573dd94a8a)
## Solution?

- 따라서 Vsync, rAF사용 등을 통해 싱크를 맞추는 방법을 통해 자연스러운 화면 전환을 목표로 한다.
- 브라우저에서는 main thread외에 compositor, raster thread를 별도로 두어 최적화 하고 있다.

### Vsync

- vsync를 사용하게 되면 frame을  생성하는 작업의 sync를 맞춰 부드러운 화면 동작을 가능하게 합니다.

### [requestAnimationFrame(rAF)](https://developer.mozilla.org/ko/docs/Web/API/Window/requestAnimationFrame)

- `requestAnimationFrame` 함수는 브라우저가 다음 프레임을 그리기 직전에 지정된 콜백 함수를 호출합니다.
- 하지만 함수 동작이 너무 오래 걸리게 되면 frame drop이 발생할 수도 있습니다.
- 별도의 animation frame queue에서 작업됩니다.

### 하드웨어 가속

- 레이어 단위로 각각 픽셀화 하고 GPU를 이용해 하나의 이미지로 합성해서 출력하는 기술로 쉽게말해 cpu 작업을 gpu 에서 대신해준다고 생각하면 된다.
- 너무 많은 레이어를 생성하면 GPU의 메모리와 리소스를 과도하게 사용하게 되어 성능이 저하될 수 있습니다.
- transform, opacity, canvas 등등

---

# In React

[SchedulerHostConfig-code](https://github.com/facebook/react/blob/v16.12.0/packages/scheduler/src/forks/SchedulerHostConfig.default.js#L125)

- fiber architecture 도입 전에는 stack reconciliation으로 계속해서 call stack을 점유하기 때문에 화면 버벅임 등 이슈가 있었고 이를 해결하기 위해 requestAnimationFrame(), requestidleCallback()등을 사용해 해결하려 했지만, 결국 Scheduler를 직접 개발하게 되었다고 한다.
    - requestAnimationFrame()의 경우 얼만큼의 시간이 소요되는지알 수 없었고,
    - requestidleCallback()의 경우 IE, Safari의 미 지원 이슈로 명쾌한 해결이 되지는 않았다.
- 아래 함수들을 살펴보면 알 수 있으시겠지만, performWorkUntilDeadline()을 통해 timeSlicing으로 Concurrent하게 실행이 가능하게 됩니다.
- 이 과정에서 Facebook(현 Meta)팀에서 관여한 browser API isInputPending() 이 탄생하게 됩니다.

[input Event blocking test](https://ajaxlab.github.io/deview2021/blocking/)

### [isInputPending()](https://developer.mozilla.org/en-US/docs/Web/API/Scheduling/isInputPending)

- 실행할 작업 대기열이 있고 사용자 상호작용이 발생할 수 있도록 정기적으로 메인 스레드에 양보하여 앱의 응답성과 성능을 최대한 유지

### shouldYieldToHost()

- Scheduler에서의 양보는 call Stack점유를 지속해도 되는지, work가 완료되어 paint진행을 해야하는지 여부를 체크하여 양보합니다.

```jsx
let maxYieldInterval = 300
let needsPaint = false
let deadline = 0

if ( // isInputPending을 지원하는 환경
  enableIsInputPending &&
  navigator !== undefined &&
  navigator.scheduling !== undefined &&
  navigator.scheduling.isInputPending !== undefined
) {
  const scheduling = navigator.scheduling

  shouldYieldToHost = function() {
    const currentTime = getCurrentTime()
    // deadline을 넘겼는지 check 이미 넘겼으면 browser에게 양보해야 한다.
    if (currentTime >= deadline) {
	    // paint & userEvent 가 필요하다면 마찬가지로 browser에게 양보해야 한다.
      if (needsPaint || scheduling.isInputPending()) {
        return true
      }
      // maxYieldInterval 까지 계속 진행 가능
      return currentTime >= maxYieldInterval
    } else {
      return false
    }
  }
	// needsPaint는 commitPhase가 완료되었을 때 Reconciler에서 알려준다.
  requestPaint = function() {
    needsPaint = true 
  }
} else {
    // isInputPending을 지원하지 않는 환경에서는 타이미을 알 수 없으므로, 주기적으로 브라우저에게 양보해야 한다.
    // deadline을 frame별로 조절하도록 하는 함수 -> forceFrameRate()
    // deadline은 위에서 살펴보았듯이 currentTime + yieldInterval이다.
    shouldYieldToHost = function() {
      return getCurrentTime() >= deadline;
    };

    // frame에 상관없이 주기적으로 양보해야하므로 여기서는 의미가 없다.
    requestPaint = function() {};
  }

  forceFrameRate = function(fps) {
    if (fps < 0 || fps > 125) {
      console.error(
        'forceFrameRate takes a positive int between 0 and 125, ' +
          'forcing framerates higher than 125 fps is not unsupported',
      );
      return;
    }
    if (fps > 0) {
      yieldInterval = Math.floor(1000 / fps);
    } else {
      // reset the framerate
      yieldInterval = 5;
    }
  };
```

### Reconciler shouldYield()

[Reconciler shouldYield-code](https://github.com/facebook/react/blob/v16.12.0/packages/scheduler/src/Scheduler.js#L398)

- Reconciler에서는 workLoopConcurrent()에서 사용된다.
- 즉 Work를 중간에 일시정지, 재가동할 수 있는 바탕이 되는 함수이다.
- Reconciler에서의 양보는 우선순위가 더 높은 작업이 있는지, 브라우저에게 양보해야 하는지 확인하고 중지합니다.

```jsx
function unstable_shouldYield() {
  const currentTime = getCurrentTime()
  advanceTimers(currentTime) // timeout Timer task to taskQueue
  const firstTask = peek(taskQueue)
  // 새롭게 삽입된 꺼낸 first task가 현재 진행 중인 currentTask보다 우선 순위가 높고, currentTask, firstTask가 둘다 존재하며, firstTask가 이미 실행되었어야 한다면 Render Phase중지
  // 마찬가지로 브라우저에게 양보해야 한다면 Render Phase 중지
  // 즉 우선순위가 높은 작업이나 브라우저에게 양보해야 한다면 중지합니다.
  return (
    (firstTask !== currentTask &&
      currentTask !== null &&
      firstTask !== null &&
      firstTask.callback !== null &&
      firstTask.startTime <= currentTime &&
      firstTask.expirationTime < currentTask.expirationTime) ||
    shouldYieldToHost()
  )
}
```

---

# Scheduler_host_config

[Scheduler_host_config-code](https://github.com/facebook/react/blob/v16.12.0/packages/scheduler/src/forks/SchedulerHostConfig.default.js)

<img src="https://github.com/user-attachments/assets/e851953b-29f4-4f1b-8cc8-7bff535904a5" alt="exception" />

- scheduler_host_config 에서는 host (browser or app) 환경에 따라 (이 글에서는 browser기준) 작업 소비 시점을 스케줄링하며, 메인 스레드에서 작업을 효율적으로 운영하기 위하여 필요 시 콜스택을 양보하여 브라우저가 사용자 입력이나 페인팅 같은 우선순위 작업을 처리할 수 있도록 합니다.
- 전반적인 흐름은 다음과 같습니다.
    1. requestHostCallback() 함수에서 MesssageChannel()을 사용하여 performWorkUntilDeadline()를 호출
    2. performWorkUntilDeadline() 함수에서 requestHostCallback()에서 전역으로 잡아두었던 scheduledHostCallback = callback(flushWork()) 호출합니다.
    3. flushWork()에서 workLoop()호출하며 workLoop()의 결과 반환
    4. workLoop()에서 browser에게 양보 타이밍을 확인하며 task를 반복하여 소비하고 마감시간의 경과로 task를 다 소비하지 못했다면 hasMoreWork flag를 return
    5. performWorkUntilDeadline()에서hasMoreWork flag를 통해 MesssageChannel()을 사용하여 다시 재귀적으로  performWorkUntilDeadline()를 반복 호출하고 다음 frame에 소비

       ⇒  requestHostCallback()은 결국 <span style='background-color: #FFB6C1'>Reconciler에서 task(performWorkOnRoot())를 반복하여 소비하도록 Loop를 실행시키는 역할</span>입니다.

       ⇒ task를 소비할 때 JavaScript의 single thread의 한계점을 극복하기 위하여 Browser에게 양보해야 하고 타이밍을 shouldToYieldHost()로 체크하며 양보합니다.

       ⇒ performWorkUntilDeadline()은  flushWork()를 호출하며 이는 결국 workLoop()의 반환 값입니다.

       ⇒ 결국 [performWorkUntilDeadline() ~ flushWork() ~ workLoop()] 과정이 task를 소비하는 과정이고 브라우저에게 양보하며 task소비 과정을 반복하는 것이다.

       ⇒ workLoop()에서 callback (performWorkOnRoot())호출하는 것은 Reconciler에서 해당 callback을 소비하는 reconcile과정을 의미합니다.

       ⇒ shouldToYieldHost()는 다음 두 가지 경우에 호출합니다.

        1) Scheduler에서 Task를 소비하는 함수인 workLoop() 실행 전

        2) Reconciler에서 Task를 소비하는 과정 중 재 조정 작업을 위하여 workInProgress를 생성하고 비동기로 작업 실행을 하는 workLoopConcurrent() 실행 전

        - render phase에서의 일시정지, 재가동

  <img src="https://github.com/user-attachments/assets/8f6de09b-6750-4eb9-abac-3925d70976d4" alt="exception" />

---

### requestHostCallback

[requestHostCallback-code](https://github.com/facebook/react/blob/v16.12.0/packages/scheduler/src/forks/SchedulerHostConfig.default.js#L225)

- requestHostCallback()은 MessageChannel()을 사용하여 performWorkUntilDeadline()를 호출합니다.

  ⇒ MessageChannel()은 async API입니다.

- performWorkUntilDeadline() 실행시키는 것은 workLoop()를 실행시키는 것과 같습니다.
- 따라서 performWorkUntilDeadline()에서 scheduledHostCallback = null이 되면 isMessageLoopRunning = false가 됩니다.

```jsx
  const channel = new MessageChannel(); 
  const port = channel.port2; // message 송수신할 다른 port
  channel.port1.onmessage = performWorkUntilDeadline; // message 송수신 port 1, 즉 performWorkUntilDeadline함수가 수신만 하며 work를 소비

  requestHostCallback = function(callback) {
    scheduledHostCallback = callback; // flushWork를 전역으로 잡아둔다.
    if (!isMessageLoopRunning) { 
      isMessageLoopRunning = true; // Loop running flag
      port.postMessage(null); // message to performWorkUntilDeadline
    }
  };
  
  cancelHostCallback = function() {
  // 전역으로 잡아둔 scheduledHostCallback을 null로 초기화
  scheduledHostCallback = null
}
```

### MessageChannel()

- [messageChannel()](https://developer.mozilla.org/en-US/docs/Web/API/MessageChannel)은 **서로 다른 브라우징 컨텍스트에서 실행되는 두 개의 독립된 스크립트 환경 간의 통신**을 위해 사용합니다.
- React에서 MessageChannel()을 선택한 이유는 `setTimeout`이나 `requestAnimationFrame`을 사용하여 비동기 작업을 예약할 수 있지만 `setTimeout`은 최소 지연 시간이 있어 정확한 스케줄링이 어렵습니다.
- `MessageChannel`은 이벤트 루프의 한 사이클이 끝난 후, 즉시 후속 작업을 실행할 수 있는 기능을 제공합니다. 이는 브라우저가 현재 작업을 완료한 후 곧바로 다음 작업을 처리하도록 할 수 있어, 타이밍 제어가 더 정밀하고 효율적입니다.

### performWorkUntilDeadline()

[performWorkUntilDeadline-code](https://github.com/facebook/react/blob/v16.12.0/packages/scheduler/src/forks/SchedulerHostConfig.default.js#L186)

- performWorkUntilDeadline는 scheduledHostCallback()를 호출하여 flushWork() → workLoop()를 실행시키고, 남은 작업이 있다면   port.postMessage(null)를 호출하여 재귀적으로 작업을 반복합니다.

```jsx
    // workLoop에서 browser에게 양보해야 하는지 check하는 shouldYieldToHost()에서 사용, 전역변수
  // task소비는 메모리 작업 즉, rendering작업이 아니기 때문에 보통 브라우저의 60hz frame fetch time인 16.6ms에 맞출 필요는 없다고 판단
  let yieldInterval = 5 // ms
	let deadline = 0
  
  const performWorkUntilDeadline = () => {
	  // requestCallback이 cancle되지 않았다면 전역으로 잡아둔 scheduledHostCallback이 있음
    if (scheduledHostCallback !== null) {
      const currentTime = getCurrentTime();
      // task를 마무리해야하는 마감 시간
      deadline = currentTime + yieldInterval;
      // 시작타이밍에는 항상 true, flushWork() -> workLoop()에서 hasTimeRemaining을 check
      const hasTimeRemaining = true;
      try {
	      // scheduledHostCallback = flushWork() -> workLoop() return value
	      // hasMoreWork => workLoop()에서 잔여작업 여부
        const hasMoreWork = scheduledHostCallback(
          hasTimeRemaining,
          currentTime,
        );
        // 작업이 모두 완료되었다면
        if (!hasMoreWork) {
          isMessageLoopRunning = false;
          // 전역으로 잡아두었던 callback을 초기화
          scheduledHostCallback = null;
        } else {
          // 작업이 남아있다면 다음 frame에 실행
          port.postMessage(null);
        }
      } catch (error) {
        // If a scheduler task throws, exit the current browser task so the
        // error can be observed.
        port.postMessage(null);
        throw error;
      }
    } else {
      isMessageLoopRunning = false;
    }
    // Yielding to the browser will give it a chance to paint, so we can
    // reset this.
    needsPaint = false;
  };
```

---

# Scheduler

- 다시 performWorkUntilDeadline()를 통해 호출된 scheduler에 속한 함수들을 마저 살펴보도록 하겠습니다.

### flushWork()

[flushWork-code](https://github.com/facebook/react/blob/v16.12.0/packages/scheduler/src/Scheduler.js#L122)

- taskQueue를 소비하기 위해 정리하는 사전 작업함수로 결국 workLoop()의 결과 값을 반환합니다.



```jsx
function flushWork(hasTimeRemaining, initialTime) {
  // We'll need a host callback the next time work is scheduled.
  isHostCallbackScheduled = false;
  if (isHostTimeoutScheduled) {
    // We scheduled a timeout but it's no longer needed. Cancel it.
    isHostTimeoutScheduled = false;
    // timeout API가 실행되어 있다면 task를 실행시킬 것이기 때문에 취소
    cancelHostTimeout();
  }

  isPerformingWork = true;	// 중복 실행 방지
  const previousPriorityLevel = currentPriorityLevel;
  try {
      return workLoop(hasTimeRemaining, initialTime); // workLoop()의 결과값을 반환
    }
  } finally {
    currentTask = null;
    currentPriorityLevel = previousPriorityLevel;
    isPerformingWork = false;
  }
}
```

### workLoop()

[workLoop-code](https://github.com/facebook/react/blob/v16.12.0/packages/scheduler/src/Scheduler.js#L164)

- 기아 상태를 방지하기 위하여 timerQueue → taskQueue 업데이트 해주며(advanceTimers()), browser에게 양보해야 하는 지 check하면서 taskQueue의 task를 소비하는 함수, 작업이 남아있다면 true없다면 false 반환
- **taskQueue의 작업을 가능한 한 많이 소비하다가, 작업을 다 소비하면 timerQueue에 있는 타이머 작업을 처리하기 위해 timeout 스케줄을 설정하고,** **만약 작업을 다 소비하기 전에 스케줄러가 양보해야 한다면 남아 있는 작업이 있다는 것을 시스템에 알려주는 함수**

```jsx
function workLoop(hasTimeRemaining, initialTime) {
  let currentTime = initialTime
  advanceTimers(currentTime) // Task 소비 전 timeout Timer task -> taskQueue로 이동
  currentTask = peek(taskQueue)

  while (currentTask !== null) {
    if (
      currentTask.expirationTime > currentTime &&
      (!hasTimeRemaining || shouldYieldToHost()) // browser양보 확인
    ) {
      // currentTask의 만료시간은 남아 있지만, scheduler에게 할당 시간이 끝났다면
      // 만료시간이 남았다는 뜻은 지금 당장 처리하지 않아도 된다는 의미이다.
      // 만료시간이 이미 지났다면 제어권을 넘기지 않고 동기적으로 만료된 모든 task를 소비합니다.
      break
    }

    const callback = currentTask.callback
    if (callback !== null) {
      currentTask.callback = null
      currentPriorityLevel = currentTask.priorityLevel
      const didUserCallbackTimeout = currentTask.expirationTime <= currentTime
      // Work 진행, 잔여 작업 여부 반환(concurrent mode)
      const continuationCallback = callback(didUserCallbackTimeout)
      currentTime = getCurrentTime()

      if (typeof continuationCallback === 'function') {
        currentTask.callback = continuationCallback
      } else {
        if (currentTask === peek(taskQueue)) {
          pop(taskQueue)
        }
      }
      advanceTimers(currentTime)
    } else {
      pop(taskQueue)
    }
    currentTask = peek(taskQueue)
  }

  // Return whether there's additional work
  // currentTask가 남아 있다면
  if (currentTask !== null) {
    return true
  } else { //task 가 완료되었다면
	   // timerQueue를 소비하기 위해 예약
    let firstTimer = peek(timerQueue)
    if (firstTimer !== null) {
      requestHostTimeout(handleTimeout, firstTimer.startTime - currentTime)
    }
    // taskQueue는 소비가 끝났으므로 false 반환
    return false
  }
}
```

---

## Summary

- 개인적으로 React 내부 코드를 살펴보며 가장 어려웠던 파트 중 하나입니다.
- 어려웠던 만큼 리액트가 어떤 기준과 방법으로 browser에게 양보하며 reconcile과정을 진행했는지 마법 같던 궁금증이 많이 해소된 파트입니다.
- 또한 front에서도 OS에서 작업을 scheduling하는 것처럼 작업 단위를 분리하고 실행한다는 점이 굉장히 흥미로웠습니다.
- 여러분들도 단순히 글을 읽고 가져가기보다는 자신만의 React-deep-dive를 통해 많은 것을 얻어가셨으면 좋겠습니다.
- 여기까지 Scheduler 파트는 끝입니다. 
- 다음 글에서는 본격적으로 React가 Reconcile을 위하여 Double-Buffering 형식의 V-dom을 생성하고 Render하는 과정을 살펴보겠습니다. 드디어 Reconciler 파트로 진입합니다!😎 