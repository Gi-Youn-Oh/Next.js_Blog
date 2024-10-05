# Commit phase

- 이제 Commit phase를 파헤쳐보기 위한 준비는 끝났습니다. 본격적으로 Commit phase 코드를 살펴보겠습니다.
- 흐름은 다음과 같습니다. (<span style='background-color: #D8BFD8'>Host Component</span>, <span style='background-color: #FFDAB9'>Class Component</span>, <span style='background-color: #90EE90'>Function Component</span>
1. `finishSyncRender()`
2. `commitRoot()`
3. `commitRootImpl()`

   3-1. `commitBeforeMutationEffects()` → **DOM 변경 전**🌑

    - <span style='background-color: #FFDAB9'>`getSnapshotBeforeUpdate()`</span>
    - <span style='background-color: #90EE90'>`clean-up useEffect()`, `useEffect()`</span>
        - schedule `flushPassiveEffects()`
        - 스케줄링 된 useEffect는 다음 프레임에 실행됩니다.

   3-2. `commitMutationEffects()` → **DOM 변경 적용**🌗

    - **Placement**: <span style='background-color: #D8BFD8'>`commitPlacement()`</span>
    - **Update:**`commitWork()`
        - <span style='background-color: #90EE90'>`clean-up-useLayoutEffect()`</span>
        - <span style='background-color: #D8BFD8'>`commitUpdate()`</span>
    - **Deletion:**`commitDeletion()`
        - <span style='background-color: #D8BFD8'>`unmountHostComponents()`</span>
            - `commitUnmount`
                - <span style='background-color: #FFDAB9'>`componentWillUnmount()`</span>
                - <span style='background-color: #90EE90'>`clean-up-useEffect()`, `clean-up-useLayoutEffect()`</span>
        - `detachFiber()` → For GC

   3-3. `commitLayoutEffects()` → **DOM 변경 후**🌕

    - `commitLifeCyles()`
        - <span style='background-color: #90EE90'>`useLayoutEffect()`</span>
        - <span style='background-color: #FFDAB9'>`componentDidMount()`, `componentDidUpdate()`</span>
        - <span style='background-color: #D8BFD8'>`auto-focus`</span>

   3-4. `requestPaint()` → Browser paint 요청

   3-5. `ensureRootIsScheduled()`

   3-6. `flushSyncCallbackQueue()`


---

### performSyncWorkOnRoot()

- 현재 상태는 `workLoopSync()`를 통해 render phase가 마무리 되었으며 `workInProgress = null` 입니다.
- Commit phase는 `finishSyncRender()` 호출부터 살펴보겠습니다.

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

# finishSyncRender()

[finishSyncRender-code](https://github.com/facebook/react/blob/v16.12.0/packages/react-reconciler/src/ReactFiberWorkLoop.js#L1062)

- **workInProgressRoot**는 render phase에서 사용하기 위한 root참조 변수였습니다.
- **commit phase는 동기적으로 실행되기 때문에** 중단될 일이 없고, 더 이상 현재 진행 중인 작업 루트가 필요하지 않기 때문에 null로 초기화 해줍니다.

```jsx
function finishSyncRender(root, exitStatus, expirationTime) {
  // Set this to null to indicate there's no in-progress render.
  workInProgressRoot = null;

  commitRoot(root);
}
```

# commitRoot()

- 어려운 내용은 없으므로 `commitRootImpl()` 함수로 넘어가겠습니다.

[commitRoot-code](https://github.com/facebook/react/blob/v16.12.0/packages/react-reconciler/src/ReactFiberWorkLoop.js#L1706)

```jsx
function commitRoot(root) {
  const renderPriorityLevel = getCurrentPriorityLevel();
  runWithPriority(
    ImmediatePriority,
    commitRootImpl.bind(null, root, renderPriorityLevel),
  );
  return null;
}
```

# commitRootImpl()

[commitRootImpl-code](https://github.com/facebook/react/blob/v16.12.0/packages/react-reconciler/src/ReactFiberWorkLoop.js#L1715)

- 실질적으로 변경 사항들을 DOM에 적용하고 Browser에게 paint요청하는 함수입니다.
- 이후 commit phase 진행 도중 발생할 update에 대비해 스케줄링합니다.
- 크게 3파트로 나누어 살펴보겠습니다.
    1. DOM 변경 전 `commitBeforeMutationEffects()`
    2. DOM 변경 적용 `commitMutationEffects()`
    3. DOM 변경 후 `commitLayoutEffects()`

```jsx
function commitRootImpl(root, renderPriorityLevel) {
  const finishedWork = root.finishedWork
  const expirationTime = root.finishedExpirationTime
  if (finishedWork === null) {
    return null
  }

  // 초기화
  root.finishedWork = null
  root.finishedExpirationTime = NoWork
  root.callbackNode = null
  root.callbackExpirationTime = NoWork
  root.callbackPriority = NoPriority
  root.nextKnownPendingLevel = NoWork

  // Effect list의 head를 가지고 온다.
  let firstEffect
  if (finishedWork.effectTag > PerformedWork) {
    if (finishedWork.lastEffect !== null) {
      finishedWork.lastEffect.nextEffect = finishedWork
      firstEffect = finishedWork.firstEffect
    } else {
      firstEffect = finishedWork
    }
  } else {
    // There is no effect on the root.
    firstEffect = finishedWork.firstEffect
  }

  if (firstEffect !== null) {
    const prevExecutionContext = executionContext
    executionContext |= CommitContext

    // DOM 변경 전
    nextEffect = firstEffect
    do {
      try {
        commitBeforeMutationEffects()
      } catch (error) {
        invariant(nextEffect !== null, 'Should be working on an effect.')
        captureCommitPhaseError(nextEffect, error)
        nextEffect = nextEffect.nextEffect
      }
    } while (nextEffect !== null)

    // DOM 변경 적용
    nextEffect = firstEffect
    do {
      try {
        commitMutationEffects(root, renderPriorityLevel)
      } catch (error) {
        invariant(nextEffect !== null, 'Should be working on an effect.')
        captureCommitPhaseError(nextEffect, error)
        nextEffect = nextEffect.nextEffect
      }
    } while (nextEffect !== null)

    // workInProgress tree를 DOM에 적용했으니 지금부터 current입니다.
    root.current = finishedWork

    // DOM 변경 후
    nextEffect = firstEffect
    do {
      try {
        commitLayoutEffects(root, expirationTime)
      } catch (error) {
        invariant(nextEffect !== null, 'Should be working on an effect.')
        captureCommitPhaseError(nextEffect, error)
        nextEffect = nextEffect.nextEffect
      }
    } while (nextEffect !== null)

    nextEffect = null

    // brower paint request to scheduler
    requestPaint()

    executionContext = prevExecutionContext
  } else {
    // No effects.
    root.current = finishedWork
  }

  // Passive effect(useEffect)를 위한 설정
  const rootDidHavePassiveEffects = rootDoesHavePassiveEffects
  if (rootDoesHavePassiveEffects) {
	  // useEffect를 실행해야 한다면 다음 frame에 실행해야 하기 때문에
    // browser paint 이후 실행될 effect를 위해 root를 잡아둡니다.
    rootDoesHavePassiveEffects = false
    rootWithPendingPassiveEffects = root
    pendingPassiveEffectsExpirationTime = expirationTime
    pendingPassiveEffectsRenderPriority = renderPriorityLevel
  } else {
    // Passive effect가 없으면 effect를 모두 소비한 것이므로 GC를 위해 참조를 끊어줍니다.
    nextEffect = firstEffect
    while (nextEffect !== null) {
      const nextNextEffect = nextEffect.nextEffect
      nextEffect.nextEffect = null
      nextEffect = nextNextEffect
    }
  }
	// commit phase 도중 발생했을 update를 위해 스케줄링
  ensureRootIsScheduled(root)
  flushSyncCallbackQueue()
  return null
}
```

---

## 1. commitBeforeMutationEffects()

[commitBeforeMutationEffects-code](https://github.com/facebook/react/blob/v16.12.0/packages/react-reconciler/src/ReactFiberWorkLoop.js#L2031)

- **DOM 변경 전** 작업입니다.
    - **Class Component**: `getSnapshotBeforeUpdate()`
    - **Function Component**: `clean-up-useEffect()`, `useEffect()`
    - **Host Component**:  X
- Effect를 소비하는 방법은 이전에 말씀드린대로 effect-list의 first부터 last까지 순회하며 지금 처리해야하는 effect를 변경 사항(effectTag)에 맞게 소비하면 됩니다.

```jsx
function commitBeforeMutationEffects() {
  while (nextEffect !== null) {
    const effectTag = nextEffect.effectTag;
    
    // Class Component: getSnapshotBeforeUpdate()
    if ((effectTag & Snapshot) !== NoEffect) {
      const current = nextEffect.alternate;
      commitBeforeMutationEffectOnFiber(current, nextEffect);
    }
    
    // useEffect()를 호출했다면 Effect Tag에 passive tag가 달려있습니다.
    if ((effectTag & Passive) !== NoEffect) {
      // If there are passive effects, schedule a callback to flush at
      // the earliest opportunity.
      // 다음 프레임에 실행할 수 있도록 스케줄링합니다.
      if (!rootDoesHavePassiveEffects) {
        rootDoesHavePassiveEffects = true;
        scheduleCallback(NormalPriority, () => {
	        // flushPassiveEffectsImpl() -> commitPassiveHookEffects -> clean-up-Effect, run-Effect
          flushPassiveEffects(); 
          return null;
        });
      }
    }
    nextEffect = nextEffect.nextEffect;
  }
}

```

- `scheduleCallback()` 으로 예약하는 것을 보면 알 수 있듯이 즉 `useEffect()`는 지금 실행시키는 것이 아니라 **DOM 변경 전~후 → Browser paint 이후 → 다음 프레임에 실행**합니다.
    - 다음 프레임에 스케줄링된 `flushPassiveEffects()`는 effect 소비 함수로 `clean-up-useEffect()`, `useEffect()`를 실행시킵니다.
    - **다시 말하면, 처리는 DOM 변경 전에 하지만 실질적으로 실행은 다음 프레임에 실행됩니다.**

### **1-1. commitBeforeMutationEffectOnFiber()**

[commitBeforeMutationEffectOnFiber-code](https://github.com/facebook/react/blob/v16.12.0/packages/react-reconciler/src/ReactFiberCommitWork.js#L242)

- Class Component에서는 DOM 변경 전 snapshot을 찍어두고`getSnapshotBeforeUpdate()` DOM 변경 이후 `componentDidUpdate(prevProps, prevState, snapshot)` 에서비교할 수 있도록 합니다.

```jsx
function commitBeforeMutationLifeCycles(current, finishedWork) {
  switch (finishedWork.tag) {
    case FunctionComponent:
    case ForwardRef:
    case SimpleMemoComponent: {
      // noop
      return
    }
    case ClassComponent: {
      if (finishedWork.effectTag & Snapshot) {
        if (current !== null) {
          const prevProps = current.memoizedProps
          const prevState = current.memoizedState
          const instance = finishedWork.stateNode // class instance
          const snapshot = instance.getSnapshotBeforeUpdate(
            finishedWork.elementType === finishedWork.type
              ? prevProps
              : resolveDefaultProps(finishedWork.type, prevProps), // defaultProps 적용
            prevState
          )
          instance.__reactInternalSnapshotBeforeUpdate = snapshot
        }
      }
      return
    }
    //HostRoot, HostComponent..
    default: {
      invariant(
        false,
        'This unit of work tag should not have side-effects. This error is ' +
          'likely caused by a bug in React. Please file an issue.'
      )
    }
  }
}
```

### 1-2. flushPassiveEffects()

[flushPassiveEffects-code](https://github.com/facebook/react/blob/v16.12.0/packages/react-reconciler/src/ReactFiberWorkLoop.js#L2166)

- passive effects, 즉 `useEffect()`를 실행 시키는 함수입니다.
- `flushPassiveEffectsImpl()` -> `commitPassiveHookEffects()` -> `clean-up-Effect, run-Effect`

```jsx
export function flushPassiveEffects() {
  if (pendingPassiveEffectsRenderPriority !== NoPriority) { // 우선순위가 있는 경우에만 실행
    const priorityLevel =
      pendingPassiveEffectsRenderPriority > NormalPriority
        ? NormalPriority
        : pendingPassiveEffectsRenderPriority;
    pendingPassiveEffectsRenderPriority = NoPriority; // 처리 될 것이기 때문에 초기화
    return runWithPriority(priorityLevel, flushPassiveEffectsImpl); // 실행
  }
}
```

### 1-3. flushPassiveEffectsImpl()

[flushPassiveEffectsImpl-code](https://github.com/facebook/react/blob/v16.12.0/packages/react-reconciler/src/ReactFiberWorkLoop.js#L2177)

```jsx
function flushPassiveEffectsImpl() {
  // commitRootImpl()에서 잡아두었던 root
  // 즉 effect가 있을 때만 실행
  if (rootWithPendingPassiveEffects === null) {
    return false
  }

  const root = rootWithPendingPassiveEffects
  // 전역 변수 정리
  rootWithPendingPassiveEffects = null
  pendingPassiveEffectsExpirationTime = NoWork

  invariant(
    (executionContext & (RenderContext | CommitContext)) === NoContext,
    'Cannot flush passive effects while already rendering.'
  )

  const prevExecutionContext = executionContext
  executionContext |= CommitContext

	// effect-list의 head를 가져온다.
  let effect = root.current.firstEffect
  while (effect !== null) {
    try {
      commitPassiveHookEffects(effect) // effect 실행
    } catch (error) {
      invariant(effect !== null, 'Should be working on an effect.')
      captureCommitPhaseError(effect, error)
    }
    const nextNextEffect = effect.nextEffect
    // Remove nextEffect pointer to assist GC
    effect.nextEffect = null
    effect = nextNextEffect
  }

  executionContext = prevExecutionContext

  return true
}
```

### 1-4. commitPassiveHookEffects()

[commitPassiveHookEffects-code](https://github.com/facebook/react/blob/v16.12.0/packages/react-reconciler/src/ReactFiberCommitWork.js#L395)

- clean-up, run effect를 실행합니다.

```jsx
import {
  NoEffect as NoHookEffect,
  UnmountPassive,
  MountPassive,
} from './ReactHookEffectTags';

function commitPassiveHookEffects(finishedWork: Fiber): void {
  if ((finishedWork.effectTag & Passive) !== NoEffect) {
    switch (finishedWork.tag) {
      case FunctionComponent:
      case ForwardRef:
      case SimpleMemoComponent: {
	      // clean-up
        commitHookEffectList(UnmountPassive, NoHookEffect, finishedWork)
        // run effect
        commitHookEffectList(NoHookEffect, MountPassive, finishedWork)
        break
      }
      default:
        break
    }
  }
}
```

### 1-5. commitHookEffectList()

[commitHookEffectList-code](https://github.com/facebook/react/blob/v16.12.0/packages/react-reconciler/src/ReactFiberCommitWork.js#L331)

- `commitPassiveHookEffects()` 함수에서 UnmountPassive와 함께 호출하여 clean-up실행 후 MountPassive와 함께 호출하여 effect를 실행시킵니다.

```jsx
function commitHookEffectList(unmountTag, mountTag, finishedWork) {
	// effect가 담겨있는 list
  const updateQueue = finishedWork.updateQueue 
  let lastEffect = updateQueue !== null ? updateQueue.lastEffect : null
  if (lastEffect !== null) {
    const firstEffect = lastEffect.next
    let effect = firstEffect
    do {
	    // clean-up 실행
      if ((effect.tag & unmountTag) !== NoHookEffect) {
        // Unmount
        const destroy = effect.destroy
        effect.destroy = undefined
        if (destroy !== undefined) {
          destroy()
        }
      }
      // effect 실행
      if ((effect.tag & mountTag) !== NoHookEffect) {
        // Mount
        const create = effect.create
        // destroy 함수는 첫 mount 시 실행 후 할당 된다.
        effect.destroy = create()
      }
      effect = effect.next
    } while (effect !== firstEffect)
  }
}
```

- mount시 코드를 보면 effect.destroy = create()로 할당되는 것을 볼 수 있습니다.
- 이제는 useEffect가 내부에서 어떻게 할당되고 실행되는지 아래 코드를 보며 생각할 수 있습니다.

    ```jsx
    useEffect(() => {
      // Mount 시 실행
      console.log('Component mounted.');
    
      // destroy 함수에 해당하는 부분을 반환 (update 또는 unmount 시 실행)
      return () => {
        console.log('Component updated or unmounted.');
      };
    }, [count]); // deps, count가 바뀌면 update
    
    ```

- 그렇다면 `useState()` 구현체를 살펴보았듯이 effect 함수들은 어떻게 생성되었는지 잠시 `useEffect()`와 `useLayoutEffect()`의 구현체를 먼저 살펴보고 이어가겠습니다.

---

## Sub) useEffect, useLayoutEffect

### Part1: Mount구현체: mountEffect(), mountLayoutEffect()

[mountEffect, mountLayoutEffect - code](https://github.com/facebook/react/blob/v16.12.0/packages/react-reconciler/src/ReactFiberHooks.js#L923)

- `useState()`의 구현체가 mountState(), updateState()로 나누어져 있던 것처럼 effect함수들 또한 **mount와 update**구현체가 존재합니다.

```jsx
import {
  Update as UpdateEffect,
  Passive as PassiveEffect,
} from 'shared/ReactSideEffectTags';
import {
  UnmountMutation,
  MountLayout,
  UnmountPassive,
  MountPassive,
} from './ReactHookEffectTags';

// useEffect()
function mountEffect(
  create: () => (() => void) | void, // create, 반환함수 destroy
  deps: Array<mixed> | void | null // 의존성 배열 
): void {
  return mountEffectImpl(
    UpdateEffect | PassiveEffect,
    UnmountPassive | MountPassive,
    create,
    deps
  )
}

// useLayoutEffect()
function mountLayoutEffect(
  create: () => (() => void) | void, // create, 반환함수 destroy
  deps: Array<mixed> | void | null // 의존성 배열 
): void {
  return mountEffectImpl(
    UpdateEffect,
    UnmountMutation | MountLayout,
    create,
    deps
  )
}
```

### mountEffectImpl()

[mountEffectImpl-code](https://github.com/facebook/react/blob/v16.12.0/packages/react-reconciler/src/ReactFiberHooks.js#L895)

- `mountWorkInProgressHook()` 는 [React-deep-dive-17](https://giyoun-blog.vercel.app/posts/react-deep-dive-17) 에서 살펴봤었습니다.
    - Hook객체를 생성하고 할당해줍니다.
- 첫 번째 인자 `fiberEffectTag`는 effect Tag로 fiber에 새겨집니다.
    - **useEffect()**
        - UpdateEffect | PassiveEffect
    - **useLayoutEffect()**
        - UpdateEffect
- 두 번째 인자 `hookEffectTag` 는 Life-cycle Effect에 새겨집니다.
    - **useEffect()**
        - UnmountPassive | MountPassive
    - **useLayoutEffect()**
        - UnmountMutation | MountLayout

```jsx
function mountEffectImpl(fiberEffectTag, hookEffectTag, create, deps): void {
  const hook = mountWorkInProgressHook()
  const nextDeps = deps === undefined ? null : deps // 의존성 배열
  sideEffectTag |= fiberEffectTag // UpdateEffect | PassiveEffect를 새겨줍니다.
	// pushEffect()의 3번째 인자는 destory
	// mount 시에는 undefined
  hook.memoizedState = pushEffect(hookEffectTag, create, undefined, nextDeps)
}
```

- sideEffectTag는 [React-deep-dive-17](https://giyoun-blog.vercel.app/posts/react-deep-dive-17) `renderwithHooks()` 에서 사용되었습니다.

    ```jsx
     function renderWithHooks(...) {
       /*...*/
      let children = Component(props, refOrContext);
    
      const renderedWork = currentlyRenderingFiber;
      renderedWork.updateQueue = componentUpdateQueue; // Life-cyle Effect list
      renderedWork.effectTag |= sideEffectTag; // add effect tag
    
      /*...*/
     }
    ```

    - 즉 컴포넌트 호출`Component()` 시 component내부에 **useEffect**가 있었다면 useEffect 구현체에서 sideEffectTag에 PassiveEffect Tag가 새겨졌을 것이고 호출 후 workInProgress에 side-effect Tag (PassiveEffect)를 새겨줍니다.

### pushEffect()

[pushEffect-code](https://github.com/facebook/react/blob/v16.12.0/packages/react-reconciler/src/ReactFiberHooks.js#L854)

- 컴포넌트 호출 중 생성된 **Effect**는 `mountEffectImpl()` 코드에서 `pushEffect()` 를 통해 **updateQueue에 담기게 됩니다.**
- `mountEffectImpl()` 코드에서 3번째 인자를 undefined로 넘겨주었기 때문에 **destory는** mount시에는 없으며, `commitHookEffectList()` 에서 살펴보았듯이 **소비시점에 할당**됩니다.

```jsx
function pushEffect(tag, create, destroy, deps) {
  const effect: Effect = {
    tag,
    create,
    destroy,
    deps,
    // Circular
    next: (null: any),
  };
  // updateQueue가 없다면 생성해줍니다.
  if (componentUpdateQueue === null) {
    componentUpdateQueue = createFunctionComponentUpdateQueue(); // return { lastEffect: null }
    componentUpdateQueue.lastEffect = effect.next = effect;
  } else {
    const lastEffect = componentUpdateQueue.lastEffect;
    if (lastEffect === null) {
      componentUpdateQueue.lastEffect = effect.next = effect; // circular-linked-list
    } else {
      const firstEffect = lastEffect.next; // circular-linked-list
      lastEffect.next = effect;
      effect.next = firstEffect;
      componentUpdateQueue.lastEffect = effect;
    }
  }
  return effect;
}
```

## Part2: Update구현체: updateEffect(), updateLayoutEffect()

[updateEffect, updateLayoutEffect - code](https://github.com/facebook/react/blob/v16.12.0/packages/react-reconciler/src/ReactFiberHooks.js#L943)

- mount에서는 `mountEffectImpl()`, update에서는 `updateEffectImpl()` 호출한다는 점 외에는 동일합니다.
- update시에는 이전에 실행되었던 Hook도 참조하여야 합니다.

```jsx
// useEffect()
function updateEffect(
  create: () => (() => void) | void,
  deps: Array<mixed> | void | null
): void {
  return updateEffectImpl(
    UpdateEffect | PassiveEffect,
    UnmountPassive | MountPassive,
    create,
    deps,
  );
}

// useLayoutEffect()
function updateLayoutEffect(
  create: () => (() => void) | void,
  deps: Array<mixed> | void | null
): void {
  return updateEffectImpl(
    UpdateEffect,
    UnmountMutation | MountLayout,
    create,
    deps,
  );
}
```

### updateEffectImpl()

[updateEffectImpl-code](https://github.com/facebook/react/blob/v16.12.0/packages/react-reconciler/src/ReactFiberHooks.js#L902)

- `updateWorkInProgressHook()` 은 마찬가지 [React-deep-dive-17](https://giyoun-blog.vercel.app/posts/react-deep-dive-17) 에서 살펴보았습니다.
- 각 인자에 대한 내용은 `mountEffectImpl()`과 동일합니다.

```jsx
function updateEffectImpl(fiberEffectTag, hookEffectTag, create, deps): void {
  const hook = updateWorkInProgressHook()
  const nextDeps = deps === undefined ? null : deps // 빈배열이라면 [] 존재
  let destroy = undefined
	// 전에 실행한 Hook이 있다면
  if (currentHook !== null) {
    const prevEffect = currentHook.memoizedState
    destroy = prevEffect.destroy
    if (nextDeps !== null) { // 의존성 배열 유무를 확인합니다.
      const prevDeps = prevEffect.deps
      if (areHookInputsEqual(nextDeps, prevDeps)) { // 의존성 배열값이 동일하다면
	      // NoHookEffect Flag를 통해 실행되지 않도록하며
	      // 추후 unMount시 destory 실행을 위해서 updateQueue에 추가해 가지고 있습니다. (참조용)
	      // unmount시에는 unmountTag가 달릴 것입니다.
        pushEffect(NoHookEffect, create, destroy, nextDeps)
        return
      }
    }
  }

  sideEffectTag |= fiberEffectTag
  // 전에 Hook이 실행된적 없다면 바로 추가
  // Hook이 실행은 되었으나 deps(의존성 배열)가 없다면 매번 실행되어야 합니다.
  // 의존성 배열값이 다르면 실행되어야 합니다.
  hook.memoizedState = pushEffect(hookEffectTag, create, destroy, nextDeps)
}
```

- 이전에 실행된 Hook이 있다면 `(currentHook !== null)` 이전의 effect로부터 저장된 deps(의존성 배열)와 destroy 함수가 있습니다.
- 의존성 배열이 있는 경우 `(nextDeps !== null)`, 이전의 deps와 비교하여 변경 여부를 확인합니다.
    - 의존성 배열이 동일하다면 hook effect를 다시 실행하지 않습니다.
    - 대신, 해당 hook은 `(NoHookEffect)`플래그를 추가하고, 추후 언마운트 시 destroy 함수가 호출될 수 있도록 처리합니다.
- 의존성 배열이 없거나`(nextDeps === null)`, **변경된 경우**에는 소비 시점에 create 함수를 실행하고 해당 hook을 업데이트합니다.
- 위 함수 코드를 통해 의존성 배열이 다르거나 없다면 매번 실행되는 이유를 확인할 수 있습니다.

    ```jsx
    useEffect(() => {
    	console.log("매번 실행");
    })
    
    useEffect(() => {
    	console.log("의존성 배열값이 다르다면 실행");
    },[count])  // count: 1 -> 2
    ```


---

## 2. commitMutationEffects()

[commitMutationEffects-code](https://github.com/facebook/react/blob/v16.12.0/packages/react-reconciler/src/ReactFiberWorkLoop.js#L2058)

- **DOM 변경** 작업입니다.
    - **Class Component**: `componentWillUnmount()`
    - **Function Component**: `clean-up-useLayoutEffect()`, `clean-up-useEffect()`
    - **Host Component**:  element 추가, 이동, 삭제

```jsx
function commitMutationEffects(root: FiberRoot, renderPriorityLevel) {
  while (nextEffect !== null) {
	  // effect-list에서 Fiber.effecTag를 참조하여 알맞게 routing
    const effectTag = nextEffect.effectTag
		
    if (effectTag & ContentReset) {
      commitResetTextContent(nextEffect) // node.textContent = text
    }

    let primaryEffectTag = effectTag & (Placement | Update | Deletion)

    switch (primaryEffectTag) {
      case Placement: { 
        commitPlacement(nextEffect)
        nextEffect.effectTag &= ~Placement
        break
      }
      case PlacementAndUpdate: { 
        commitPlacement(nextEffect)
        nextEffect.effectTag &= ~Placement
        const current = nextEffect.alternate
        commitWork(current, nextEffect)
        break
      }
      case Update: {
        const current = nextEffect.alternate
        commitWork(current, nextEffect)
        break
      }
      case Deletion: {
        commitDeletion(root, nextEffect, renderPriorityLevel)
        break
      }
    }

    nextEffect = nextEffect.nextEffect
  }
}
```

### 2-1. commitPlacement()

[commitMutationEffects-code](https://github.com/facebook/react/blob/v16.12.0/packages/react-reconciler/src/ReactFiberCommitWork.js#L1031)

- **commit phase는 실제 DOM에 적용하는 과정이기 때문에 HostComponent만이 적용된다는 점을 인지하셔야 합니다.**
    - Custom Component의 경우 [React-deep-dive-15](https://giyoun-blog.vercel.app/posts/react-deep-dive-15) 그림에서 살펴보았듯이 반환된 HTML element만 남게됩니다.

  <img src="https://github.com/user-attachments/assets/31a4839d-6bb4-4c9b-a106-cbabf3ce5686" alt="exception"/>

- DOM에 element를 삽입(이동, 추가) 변경 점을 적용하는 함수입니다.
    1. 부모 호스트 컴포넌트를 찾습니다.
    2. PlacementTag가 없는 형제 컴포넌트를 찾습니다.
    3. 삽입 대상을 찾아 변경 점을 적용합니다.
- DOM에 이동, 추가 변경점을 적용하기 위해서는 두 가지 컴포넌트를 참조해야합니다.

    1) Parent Host Component

    - 현재 element를 삽입하기 위해서는 당연히 **부모 컴포넌트는 필수**입니다.

    2) Sibling Component with No PlacementTag

- 자식 컴포넌트의 형제들 중 어디에 위치시킬지 판단하기 위해 필요합니다.
- 형제 컴포넌트에 Placement Tag가 있을 시 V-DOM에서는 참조 가능하지만 DOM 에서는 아직 삽입 처리가 되기 전이므로 기준점으로 사용할 수 없습니다.
- 만약 대상 Fiber가 HostCompoent라면 해당 컴포넌트만 삽입하면 되지만 CustomComponent일 경우 해당 컴포넌트의 모든 자식 HostComponent를 삽입 처리해야 합니다.

```jsx
function commitPlacement(finishedWork: Fiber): void {

  // Recursively insert all host nodes into the parent.
  // 1. 부모 호스트 컴포넌트 찾기
  const parentFiber = getHostParentFiber(finishedWork);

  // Note: these two variables *must* always be updated together.
  let parent;
  let isContainer
  const parentStateNode = parentFiber.stateNode;
  switch (parentFiber.tag) {
    case HostComponent:
      parent = parentStateNode;
      isContainer = false;
      break;
    case HostRoot:
	    // 부모가 HostRoot라면 stateNode는 containerInfo에서 꺼내야 합니다.
      parent = parentStateNode.containerInfo;
      isContainer = true;
      break;
    /*...*/
    default:
      invariant(
        false,
        'Invalid host parent fiber. This error is likely caused by a bug ' +
          'in React. Please file an issue.',
      );
  }
  
  if (parentFiber.effectTag & ContentReset) {
    // Reset the text content of the parent before doing any insertions
    resetTextContent(parent);
    // Clear ContentReset from the effect tag
    parentFiber.effectTag &= ~ContentReset;
  }
  
	// 2. Placement Tag가 달려있지 않은 형제 컴포넌트 찾기
	before = getHostSibling(finishedWork);
  
  // 3. 삽입 대상 element 찾기
  // 1, 2를 통해 기준점을 찾았다면 삽입 대상이 되는 모든 HostComponent를 삽입합니다.
  // 대상이 HostComponent라면 대상만 처리하면 되지만 CustomComponent라면 반환하는 모든 자식 HostComponent 를 처리해주어야 합니다.
   let node: Fiber = finishedWork;
   while (true) {
    const isHost = node.tag === HostComponent || node.tag === HostText;
    if (isHost)) {
      const stateNode = node.stateNode;
      if (before) {
        if (isContainer) {
          insertInContainerBefore(parent, stateNode, before); // parent.insertBefore(stateNode, before)
        } else {
          insertBefore(parent, stateNode, before);
        }
      } else {
        if (isContainer) {
          appendChildToContainer(parent, stateNode); // appendChild(parent, stateNode)
        } else {
          appendChild(parent, stateNode);
        }
      }
    // 만약 대상 Fiber가 HostCompoent라면 해당 컴포넌트만 삽입하면 되지만 CustomComponent일 경우 해당 컴포넌트의 모든 자식 HostComponent를 삽입 처리해야 합니다.
    
    // 호스트 컴포넌트가 아니라면 밑으로 내려간다.
    } else if (node.child !== null) {
      node.child.return = node;
      node = node.child;
      continue;
    }

    // 삽입한 노드가 finishedWork라면 작업완료를 뜻한다.
    if (node === finishedWork) {
      return;
    }
    // 형제가 없다면 위로 올라간다.
    while (node.sibling === null) {
      if (node.return === null || node.return === finishedWork) {
        return;
      }
      node = node.return;
    }
    // 형제로 이동
    node.sibling.return = node.return;
    node = node.sibling;
  }
}
```

### 2-2. getHostComponent()

[getHostComponent-code](https://github.com/facebook/react/blob/v16.12.0/packages/react-reconciler/src/ReactFiberCommitWork.js#L962)

- 부모 Host Component를 반환합니다.

```jsx
function getHostParentFiber(fiber: Fiber): Fiber {
  let parent = fiber.return
  while (parent !== null) {
    if (isHostParent(parent)) { 
      return parent
    }
    parent = parent.return
  }
  invariant(
    false,
    'Expected to find a host parent. This error is likely caused by a bug ' +
      'in React. Please file an issue.'
  )
}

function isHostParent(fiber: Fiber): boolean {
  return (
    fiber.tag === HostComponent ||
    fiber.tag === HostRoot ||
    fiber.tag === HostPortal
  )
}
```

### 2-3. getHostSibling()

[getHostSibling-code](https://github.com/facebook/react/blob/v16.12.0/packages/react-reconciler/src/ReactFiberCommitWork.js#L985)

- PlacementTag 가 없는 형제 노드를 반환합니다.
    - 참조할 HostComponent를 찾지 못한다면 null을 반환합니다.

```jsx
function getHostSibling(fiber: Fiber): ?Instance {
  let node: Fiber = fiber
  siblings: while (true) {
	  // 부모로 이동
    while (node.sibling === null) { // 현재 노드의 형제가 없고
      if (node.return === null || isHostParent(node.return)) { // 부모가 Host컴포넌트라면
        return null // 탐색 중단
      } 
      // 실제 DOM에는 HostComponent만 삽입되기 때문에 부모가 HostComponent가 아니라면 
      node = node.return  // 위로 올라간다.
    }
    
		// 형제로 이동
    node.sibling.return = node.return
    node = node.sibling
    
		// 자식으로 이동
    while (node.tag !== HostComponent && node.tag !== HostText) {
      if (node.effectTag & Placement) { // Placement Tag가 있으면 안된다.
        continue siblings
      }
      if (node.child === null) { // 자식이 없다면 의미 없다.
        continue siblings
      } else {
        node.child.return = node
        node = node.child
      }
    }
		
    if (!(node.effectTag & Placement)) {
      // Found it!
      return node.stateNode
    }
  }
}
```

### 2-4. commitWork()

[commitWork-code](https://github.com/facebook/react/blob/v16.12.0/packages/react-reconciler/src/ReactFiberCommitWork.js#L1284)

- Host Component의 변경 사항을 DOM에 적용하거나 clean-up-useLayoutEffect()를 호출합니다.

```jsx
function commitWork(current: Fiber | null, finishedWork: Fiber): void {
  switch (finishedWork.tag) {
    case FunctionComponent:
    case MemoComponent:
    case SimpleMemoComponent: {
      // Note: We currently never use MountMutation, but useLayout uses UnmountMutation.
      // clean-up-useLayoutEffect()
      commitHookEffectList(UnmountMutation, MountMutation, finishedWork); 
      return;
    }
    case ClassComponent: {
      return;
    }
    case HostComponent: {
      const instance: Instance = finishedWork.stateNode;
      if (instance != null) {
        const newProps = finishedWork.memoizedProps;
        const updatePayload= finishedWork.updateQueue; // element의 변경점을 담고 있다.
        finishedWork.updateQueue = null;
        if (updatePayload !== null) {
          commitUpdate(instance, updatePayload, newProps); // 변경사항 적용
        }
      }
      return;
    }
    case HostText: {
      const textInstance: TextInstance = finishedWork.stateNode;
      const newText: string = finishedWork.memoizedProps;
      commitTextUpdate(textInstance, newText); // textInstance.nodeValue = newText;
      return;
    }
    /*...*/
    default: {
      invariant(
        false,
        'This unit of work tag should not have side-effects. This error is ' +
          'likely caused by a bug in React. Please file an issue.',
      );
    }
  }
}
```

### 2-5. commitUpdate()

[commitUpdate-code](https://github.com/facebook/react/blob/v16.12.0/packages/react-dom/src/client/ReactDOMHostConfig.js#L371)

```jsx
function commitUpdate(
  domElement: Instance,
  updatePayload: Array<mixed>,
  newProps: Props,
): void {
  updateFiberProps(domElement, newProps);
  updateProperties(domElement, updatePayload, newProps);
}
```

### 2-6. updateFiberProps()

[updateFiberProps-code](https://github.com/facebook/react/blob/v16.12.0/packages/react-dom/src/client/ReactDOMComponentTree.js#L164)

- [React-deep-dive-19](https://giyoun-blog.vercel.app/posts/react-deep-dive-19) `completeWork()` 과정에서 Host영역에서 Fiber에 접근할 수 있도록 작업해 두었던 internalEventHandlersKey를 통해 접근하여 새로운 props로 덮어줍니다.

```jsx
const internalEventHandlersKey = '__reactEventHandlers$' + randomKey;
export function updateFiberProps(node, props) {
  node[internalEventHandlersKey] = props;
}
```

### 2-7. updateProperties()

[updateProperties-code](https://github.com/facebook/react/blob/v16.12.0/packages/react-dom/src/client/ReactDOMComponent.js#L848)

- 변경점을 실제 DOM node에 적용해줍니다.
    - [setValueForStyles](https://github.com/facebook/react/blob/v16.12.0/packages/react-dom/src/shared/CSSPropertyOperations.js#L62)
    - [setInnerHTML](https://github.com/facebook/react/blob/v16.12.0/packages/react-dom/src/client/setInnerHTML.js#L26)
    - [setTextContent](https://github.com/facebook/react/blob/v16.12.0/packages/react-dom/src/client/setTextContent.js#L21)
    - [setValueForProperty](https://github.com/facebook/react/blob/v16.12.0/packages/react-dom/src/client/DOMPropertyOperations.js#L127)

```jsx
function updateProperties(domElement: Element, updatePayload: Array<any>): void {
  // Apply the diff.
  updateDOMProperties(domElement, updatePayload);
}

function updateDOMProperties(domElement: Element, updatePayload: Array<any>): void {
  for (let i = 0; i < updatePayload.length; i += 2) {
    const propKey = updatePayload[i];
    const propValue = updatePayload[i + 1];
    if (propKey === STYLE) {
      setValueForStyles(domElement, propValue);
    } else if (propKey === DANGEROUSLY_SET_INNER_HTML) {
      setInnerHTML(domElement, propValue);
    } else if (propKey === CHILDREN) {
      setTextContent(domElement, propValue);
    } else {
      setValueForProperty(domElement, propKey, propValue);
    }
  }
```

### 2-8. commitDeletion()

[commitDeletion-code](https://github.com/facebook/react/blob/v16.12.0/packages/react-reconciler/src/ReactFiberCommitWork.js#L1268)

```jsx
function commitDeletion(
finishedRoot: FiberRoot,
current: Fiber,
renderPriorityLevel: ReactPriorityLevel,
): void {
	// 삭제, 삭제대상 subtree 컴포넌트 unmount
  unmountHostComponents(finishedRoot, current, renderPriorityLevel);
  // for GC, reset Fiber
  detachFiber(current);
}
```

### 2-9. unmountHostComponents()

[unmountHostComponents-code](https://github.com/facebook/react/blob/v16.12.0/packages/react-reconciler/src/ReactFiberCommitWork.js#L1120)

- `commitPlacement()` 삽입 과정과 동일하게 대상 HostComponent 또는 Custom Component라면 모든 자식 HostComponent를 찾아 삭제해 주어야합니다.

```jsx
function unmountHostComponents(
  finishedRoot,
  current,
  renderPriorityLevel,
): void {
  let node: Fiber = current;

  let currentParentIsValid = false; // 중복실행 방지 flag
  let currentParent;
  let currentParentIsContainer;

  while (true) {
    // 부모를 찾습니다.
    if (!currentParentIsValid) {
      let parent = node.return;
      findParent: while (true) {
        invariant(
          parent !== null,
          'Expected to find a host parent. This error is likely caused by ' +
            'a bug in React. Please file an issue.',
        );
        const parentStateNode = parent.stateNode;
        //  부모 HTML element 추출
        switch (parent.tag) {
          case HostComponent:
            currentParent = parentStateNode;
            currentParentIsContainer = false;
            break findParent;
          case HostRoot:
            currentParent = parentStateNode.containerInfo;
            currentParentIsContainer = true;
            break findParent;
            /*...*/
        }
        parent = parent.return;
      }
      currentParentIsValid = true;
    }
    
    // 삭제 대상이 HostComponent 라면
    // 부모 컴포넌트에서 자식 삭제
    if (node.tag === HostComponent || node.tag === HostText) {
      if (currentParentIsContainer) {
        removeChildFromContainer(currentParent, node.stateNode); // currentParent.removeChild(node.stateNode);
      } else {
        removeChild(currentParent, node.stateNode); // currentParent.removeChild(node.stateNode);
      }
    // 삭제 대상이 HostComponent가 아니라면
    } else {
      // 컴포넌트 언마운트 처리
      commitUnmount(finishedRoot, node, renderPriorityLevel);
      // 호스트 컴포넌트를 찾기 위해 밑으로 내려간다.
      if (node.child !== null) {
        node.child.return = node;
        node = node.child;
        continue;
      }
    }

    if (node === current) {
      return;
    }
    // 내려온 만큼 위로 올라간다.
    while (node.sibling === null) {
      if (node.return === null || node.return === current) {
        return;
      }
      node = node.return;
    }
    // 옆으로 이동
    node.sibling.return = node.return;
    node = node.sibling;
  }
}
```

### 2-10. commitUnmount()

[commitUnmount-code](https://github.com/facebook/react/blob/v16.12.0/packages/react-reconciler/src/ReactFiberCommitWork.js#L736)

- Component 삭제를 위해 unmount 처리를 해야합니다.
    - Class Component → `componentWillUnmount()`
    - Function Component → `clean-up-useEffect()`, `clean-up-useLayoutEffect()`

```jsx
function commitUnmount(
  finishedRoot: FiberRoot,
  current: Fiber,
  renderPriorityLevel: ReactPriorityLevel,
): void {
  switch (current.tag) {
    case FunctionComponent:
    case ForwardRef:
    case MemoComponent:
    case SimpleMemoComponent: {
      const updateQueue = current.updateQueue;
      if (updateQueue !== null) {
        const lastEffect = updateQueue.lastEffect;
        if (lastEffect !== null) {
          const firstEffect = lastEffect.next;

          const priorityLevel =
            renderPriorityLevel > NormalPriority
              ? NormalPriority
              : renderPriorityLevel;
          runWithPriority(priorityLevel, () => {
            let effect = firstEffect;
            do {
              const destroy = effect.destroy;
              if (destroy !== undefined) {
	              // clean-up-useEffect, clean-up-useLayoutEffect
                safelyCallDestroy(current, destroy); // destroy();
              }
              effect = effect.next;
            } while (effect !== firstEffect);
          });
        }
      }
      break;
    }
    case ClassComponent: {
      const instance = current.stateNode;
      if (typeof instance.componentWillUnmount === 'function') {
        safelyCallComponentWillUnmount(current, instance); // instance.componentWillUnmount();
      }
      return;
    }
  }
}
```

### 2-11. detachFiber()

[detachFiber-code](https://github.com/facebook/react/blob/v16.12.0/packages/react-reconciler/src/ReactFiberCommitWork.js#L895)

- GC를 위해서 fiber를 초기화 해줍니다.
- 삭제 대상의 참조를 해제하면 자연스럽게 서브트리 Fiber들도 GC대상이 됩니다.

```jsx
function detachFiber(current: Fiber) {
  const alternate = current.alternate;
  current.return = null;
  current.child = null;
  current.memoizedState = null;
  current.updateQueue = null;
  current.dependencies = null;
  current.alternate = null;
  current.firstEffect = null;
  current.lastEffect = null;
  current.pendingProps = null;
  current.memoizedProps = null;
  if (alternate !== null) {
    detachFiber(alternate);
  }
}
```

---

## 3. commitLayoutEffects()

[commitLayoutEffects-code](https://github.com/facebook/react/blob/v16.12.0/packages/react-reconciler/src/ReactFiberWorkLoop.js#L2135)

- **DOM 변경 후** 작업입니다.
    - **Class Component**: `componentDidMount()`, `componentDidUpdate()`
    - **Function Component**: `useLayoutEffect()`
    - **Host Component**:  auto-focus

```jsx
function commitLayoutEffects(root, committedExpirationTime) {
  while (nextEffect !== null) {
    const effectTag = nextEffect.effectTag;
    if (effectTag & (Update | Callback)) {
      const current = nextEffect.alternate;
      commitLifeCycles(root, current, nextEffect, committedExpirationTime);
    }
    nextEffect = nextEffect.nextEffect;
  }
}
```

### 3-1. commitLifeCycles()

[commitLifeCycles-code](https://github.com/facebook/react/blob/v16.12.0/packages/react-reconciler/src/ReactFiberCommitWork.js#L411)

```jsx
function commitLifeCycles(finishedRoot, current, finishedWork, committedExpirationTime) {
  switch (finishedWork.tag) {
    case FunctionComponent:
    case ForwardRef:
    case SimpleMemoComponent: {
      commitHookEffectList(UnmountLayout, MountLayout, finishedWork); // useLayoutEffect
      break;
    }
    case ClassComponent: {
      const instance = finishedWork.stateNode;
      if (finishedWork.effectTag & Update) {
        if (current === null) {
          instance.componentDidMount();
        } else {
          const prevProps = finishedWork.elementType === finishedWork.type
              ? current.memoizedProps
              : resolveDefaultProps(finishedWork.type, current.memoizedProps); // defaultProps 적용
          const prevState = current.memoizedState;
          instance.componentDidUpdate(
            prevProps,
            prevState,
            instance.__reactInternalSnapshotBeforeUpdate // commitBeforeMutationEffectOnFiber에서 찍어놨던 스냅샷
          );
        }
      }
      return;
    }
    case HostComponent: {
      const instance: Instance = finishedWork.stateNode;
      if (current === null && finishedWork.effectTag & Update) {
        const type = finishedWork.type;
        const props = finishedWork.memoizedProps;
        commitMount(instance, type, props, finishedWork); // auto-focus
      }
      return;
    }
     /*...*/
    default: {
      invariant(
        false,
        'This unit of work tag should not have side-effects. This error is ' +
          'likely caused by a bug in React. Please file an issue.',
      );
    }
  }
}
```

### 3-2. commitMount()

[commitMount-code](https://github.com/facebook/react/blob/v16.12.0/packages/react-dom/src/client/ReactDOMHostConfig.js#L350)

- HostComponent의 경우 auto-focus 여부를 확인하여 처리해야합니다.

```jsx
function commitMount(domElement, type, newProps) {
    if (shouldAutoFocusHostComponent(type, newProps)) {
      domElement.focus();
    }
}
```

## Sub) useEffect() vs useLayoutEffect()

- 각 함수는 언제 사용하면 좋을까요
    - `useEffect()`는 **비동기 작업**이나 **비 UI 관련 작업**(API 호출, 이벤트 리스너 설정 등)에 적합합니다.
    - `useLayoutEffect()`는 **UI 업데이트와 관련된 작업**(예: DOM 측정, 레이아웃 계산)에서 유용합니다.
- 만약 useEffect()를 사용하여 UI 작업을 실행했는데, blinking Issue가 있을 경우 useLayoutEffect() 사용하면 좋습니다.
- 저희는 useEffect(), useLayoutEffect()의 실행 시점을 알고 있습니다.
- useEffect()는 Browser paint 요청 후 다음 프레임에서 실행되지만, useLayoutEffect()의 경우 DOM 변경 사항을 적용 후 Browser paint 요청 전에 실행되기 때문입니다.
- 하지만 useLayoutEffet()에서 무거운 작업을 실행시킨다면 작업이 완료될 때까지Browser에게 call stack을 양보하지 않기 때문에 주의해서 사용해야 합니다.

---

# Summary

- 이번 글을 끝으로 React-deep-dive의 모든 여정이 끝났습니다.
- 이제는 다음과 같은 점들에 대해 설명할 수 있습니다.
    - React의 Life-cycle은 어떻게 흘러가는지
    - useEffect()와 useLayoutEffect()는 각각 언제 사용하면 좋은지
    - state변경을 위해서 useEffect() 남용하면 왜 좋지 않은지
- 이외에도 저는 너무나 많은 궁금증들이 해소되었습니다.
- 다음 글에서는 React-deep-dive를 진행하면서 느낀 점을 회고하는 글로 찾아뵙겠습니다.
- 감사합니다!