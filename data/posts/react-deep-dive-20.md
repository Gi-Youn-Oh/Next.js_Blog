이번 글에서도 분석의 바탕이 되는 코드는 [React 16.12.0 version](https://github.com/facebook/react/tree/v16.12.0)을 기준으로 하며, [해당 블로그](https://goidle.github.io/)에 감사 인사를 전합니다.

지난 시간까지 React-deep-dive 시작인 `dispatchAction()`으로 발생한 **update**를 **Scheduler**를 거쳐 `prepareFreshStack()`을 통해 **workInProgress**를 생성하여 **V-DOM**을 준비하고  컴포넌트 호출 후 **current ← alternate → workInProgress** 비교하는 `reconcileChildren()`, 그리고 DOM에 변경 점을 적용하기 위한 마무리 준비 `completeUnitOfWork()`, `completeWork()`까지 마무리 했습니다.

이번 글에서는 **DOM**에 **effect-list**를 소비하며 **변경 점을 적용**하고, 생명주기 함수인 `useEffect()`, `useLayoutEffect()`를 살펴보며 **Commit phase**를 마무리 해보겠습니다.

이번 파트는 글을 적다보니 너무 길어져서 2개의 글로 나누어 올리겠습니다.

아래 링크는  React의 렌더링 흐름에 따라 저 나름대로의 그림을 그려보았으며, 이 흐름에 따라 글이 이어 질 것입니다. (무단 복사 및 배포는 하지 말아주세요)

<a href="https://excalidraw.com/#json=9OvAI9bAcgOh5_pgeshV2,WeZyGvvW-nQ0nmIk-CiZVQ" target="_blank">Gy's React Diagram</a>

---

## Flow

Reconciler → Scheduler → Scheduler Host-config → Reconciler Render Phase → **Reconciler Commit Phase**

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

5) Finishing Work

**5. <span style='background-color: #FFB6C1'>Reconciler Commit Phase</span>**

1) <span style='background-color: #FFB6C1'>Execute `useEffect` and `useLayoutEffect`.</span>

**6. <span style='background-color: #FFB6C1'>Browser Paint</span>**

---

# Before

- 마지막 commit phase의 본격적인 코드를 살펴보기 전에 사전 지식을 정리하고 가겠습니다.

## 1. Life-Cycle

- 전체적인 Life-cycle은 다음과 같습니다.

  ![image](https://github.com/user-attachments/assets/ebd9c52c-f2eb-404a-bdbf-70db86c8a550)

- 이제는 React의 Life-cycle을 보시는 느낌이 많이 다르실거라 생각됩니다.
- 다음 함수들은 class형 컴포넌트에서 사용되는 메소드 들입니다.
    - `getSnapshotBeforeUpdate` 함수는 update진행 전 이전 상태를 가져오는 함수입니다.
    - `componentDid Mount, Update, Unmount`는 모두 생명주기에 맞춰 실행할 수 있는 함수입니다. → 함수형 컴포넌트에서는 `useEffect`를 사용합니다.
    - `shouldComponentUpdate`함수는 불필요한 컴포넌트 리렌더링을 막기 위한 함수로 `React.memo()` 와 동일하게 생각하셔도 좋습니다.
- 저희는 함수형 컴포넌트 위주로 살펴볼 것이기 때문에 자세한 설명은 생략하겠습니다.
- `forceUpdate()`는 강제로 리렌더링을 실행하는 함수로 [Zustand 관련 posting](https://giyoun-blog.vercel.app/posts/zustand) 에서 `useSyncExternalStore()` 함수를 살펴보며 확인했습니다.
- **Render phase**
    - Pure and has no side effects.
        - 저희는 React Component의 호출은 JSX의 return이고, 항상 같은 값을 반환하는 React Element라는 것을 알고 있습니다.
    - May be paused, aborted, or restarted by React.
        - 저희는 일시정지, 중단, 재가동이 performConcurrentWorkOnRoot()부터 workLoopConcurrent()에서 작업의 우선순위, Host_Config에 따라 조정 가능하다는 것을 알고 있습니다.
- **Commit phase**
    - Can work with DOM, run side effects,
        - 이번 글에서 살펴볼 내용이지만 render phase에서 준비해둔 변경점을 DOM에 적용시킵니다.
        - side effects는 Host Component에서는 DOM의 추가, 이동, 삭제 등을 의미하며, Function Component에서는 useEffect, useLayoutEffect와 같은 passive Effect를 의미합니다.
    - schedule updates.
        - 작업 마무리 후 commit phase도중 발생했을 수 있는 update들을 스케줄링 합니다.

**⇒ 어떠신가요? 위의 내용이 머릿속에서 자연스럽게 튀어나와야 합니다. 기억이 안 나시거나 이해가 되지 않으신다면 하나씩 차근차근 다시 정리해보시길 바랍니다.**

## 2. Hook flow

- 전체적인 흐름은 다음과 같습니다.

    ```
    1. render phase -> 
    2. commit phase -> 
    	3. (clean-up useLayoutEffect) -> 
    	4. useLayoutEffect -> 
    	5. browser paint -> 
    	6. (clean-up useEffect) -> 
    	7. useEffect
    ```

- 대부분의 `useState()`, `useReducer()` 와 같은 훅들은 Render에서 소비되지만, `useEffect()`, `useLayoutEffect()`는 Commit phase에서 소비됩니다.
- `useLayoutEffect()` 는 **browser paint 이전**에, `useEffect()`는 **browser paint 이후**에 실행됩니다.
- 중요한 점은 실행 직전 clean-up function을 실행한다는 점입니다.
    - **메모리 누수 방지, 비동기 작업 정리 등 리소스를 관리 하기 위해 실행합니다.**

    ```jsx
    import React, {useEffect, useLayoutEffect, useState} from 'react';
    
    function ExampleComponent() {
        const [count, setCount] = useState(0);
    
        useLayoutEffect(() => {
            console.log('Layout effect runs: Count is', count);
    
            return () => {
                // Cleanup 함수가 실행되어 정리 작업 수행
                console.log('Layout cleanup runs before next layout effect or unmount: Count was', count);
            };
        }, [count]);
    
        useEffect(() => {
            console.log('Effect runs: Count is', count);
    
            return () => {
                // Cleanup 함수가 실행되어 정리 작업 수행
                console.log('Cleanup runs before next effect or unmount: Count was', count);
            };
        }, [count]); // count가 변경될 때마다 effect 실행
        console.log("render this component !")
    
        const handleClick = () => {
            // 상태 업데이트 전에 flushPassiveEffects가 실행되어
            // 위의 cleanup 함수가 실행된다고 생각할 수 있음
            setCount((prevCount) => prevCount + 1);
        };
    
        return (
            <div>
                <p>Count: {count}</p>
                <button onClick={handleClick}>Increment</button>
            </div>
        );
    }
    
    export default ExampleComponent;
    ```

    - 아래`commitHookEffectList()`에서 살펴보겠지만 clean-up(destroy()) 함수는 첫 mount 시 실행 후 할당 되기 때문에 mount이후 update 또는 unmount시 실행됩니다.

  ![image](https://github.com/user-attachments/assets/217e10b0-4fdc-4112-af57-40676cd98006)

- 한 가지 생각해야 할 점은 `useEffect()`는 **동기적으로 즉시 실행 되는 것이 아니라 sheduler를 통해 다음 frame에 실행하도록 합니다.**

![image](https://github.com/user-attachments/assets/b98fc43e-5e1a-45d1-a6af-4cf7936b2649)

- Notes
    1. 이제는 업데이트가 부모 컴포넌트 호출로 인하여 props의 변경, 내부 state의 변경 또는 context의 변경으로 업데이트가 발생할 수 있다는 것을 알고 있습니다.
    2. Lazy init은  [React-deep-dive-17](https://giyoun-blog.vercel.app/posts/react-deep-dive-17) 에서 살펴본 내용입니다.

## 3. Queue

### **1) Fiber.firstEffect, nextEffect, lastEffect**

- 컴포넌트의 side-effect를 담고 있습니다.
    - **render phase를 거치고나면 workInProgress는 null입니다.** `completeUnitOfWork()` 에서 연결해주었던 **effect-list**를 **HostRoot는 변경점을 알고 있으며 이 list를 통해서 DOM에 변경 점을 적용합니다.**
- [React-deep-dive-19](https://giyoun-blog.vercel.app/posts/react-deep-dive-19) 에서 `completeUnitOfWork()` 함수를 살펴보며 확인했으며, 요소는 Fiber자체를 담았습니다.
- 또한 `if (effectTag > PerformedWork)` 조건에 해당하는 effectTag일때 엮어주었습니다.
- **commit phase에서 이 리스트를 기준으로 변경 점을 소비합니다.**

### **2) Fiber.memoizedState**

- 함수형 컴포넌트에서 훅의 **상태와 결과 값**을 연결 리스트 형태로 관리합니다. (useEffect 포함)
- 예를 들면 다음과 같습니다.

    ```jsx
    // 각 훅의 상태가 연결 리스트로 저장된다고 가정해보자면:
    function Component() {
      const [count, setCount] = useState(0); // 첫 번째 훅
      const [name, dispatch] = useReducer(reducer, 'initialName'); // 두 번째 훅
      const memoizedState = {
        // 첫 번째 노드: useState()의 결과
        state: [count, setCount], // 첫 번째 훅의 상태값과 setter
        next: {
          // 두 번째 노드: useReducer()의 결과
          state: [name, dispatch], // 두 번째 훅의 상태값과 dispatch
          next: null // 다음 훅이 없으면 null
        }
      };
    }
    
    ```

- [React-deep-dive-17](https://giyoun-blog.vercel.app/posts/react-deep-dive-17) 에서 살펴 보았듯이, **훅의 순서가 보장되어야** 하는 이유이기도 합니다. (Invaild hook error)

### 3) Fiber.updateQueue

- Host Component에서는 추가, 이동, 삭제 등의 변경 점을 담아 둡니다.
    - [React-deep-dive-19](https://giyoun-blog.vercel.app/posts/react-deep-dive-19)  `updateHostComponent()` 에서 담아주었습니다. → `commitWork()` 에서 소비
- Function Component에서는 Life-Cycle Effect를 담고 있습니다.
    - [React-deep-dive-17](https://giyoun-blog.vercel.app/posts/react-deep-dive-17) `renderWithHooks()` 에서 잠깐 살펴봤었습니다.

        ```jsx
         renderedWork.updateQueue = (componentUpdateQueue: any);
        ```

    - 컴포넌트 호출 시 `useEffect()` 가 있었다면  추후 살펴볼 `pushEffect()`  에서`componentUpdateQueue` 에 추가합니다.
    - 추후 소비 시점에서 `commitHookEffectList()` **함수에서 updateQueue에서 꺼내 소비됩니다.**

### PerformedWork Tag

- 컴포넌트 호출 시 달아주었습니다.
- `PerformedWork` 태그는 해당 fiber가 **어떤 작업이 일어났다는 표시**로만 쓰입니다. 이 태그 자체는 DOM 업데이트와 같은 작업을 수행하는 데는 직접적인 영향을 주지 않습니다. 대신, **다른 더 중요한 태그들** (예: `Placement`, `Update`)가 있을 때, 이 작업들이 `Effect List`에 추가됩니다.
- `useEffect()`에서는 **passive** Effect Tag를 달아줍니다.

### 4) Summary

- 정리하면 다음과 같습니다.
1. **Fiber.firstEffect, nextEffect, lastEffect (Effect-list)**
- 실질적으로 변경이 필요한 Fiber들의 리스트를 담고 있으며, Fiber.effectTag를 통하여 각 변경 사항을 판단하고 routing하여 적용하도록 하는 역할입니다.
1. **Fiber.memoizedState**
- 훅의 상태 정보를 담고 있는 리스트 입니다. (순서 보장 필수)
1. **Fiber.updateQueue**
- 실제 Host Component의 삽입, 수정, 삭제 변경과 life-cycle effect를 담고 있어 소비 시점에 꺼내어 사용

## Continue..

- 글이 길어져 다음 포스팅에서 이어가겠습니다.