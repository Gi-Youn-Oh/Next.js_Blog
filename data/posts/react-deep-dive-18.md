이번 글에서도 분석의 바탕이 되는 코드는 [React 16.12.0 version](https://github.com/facebook/react/tree/v16.12.0)을 기준으로 하며, [해당 블로그](https://www.notion.so/f903bf2b3e4248a29dd5402c89ccd591?pvs=21)에 감사 인사를 전합니다.
지난 글에서는 reconcile을 위해 V-DOM을 필요에 따라 생성, 초기화 하여 컴포넌트를 호출하고 update를 적용했었습니다.

이번 글에서는 update로 인하여 호출하고 반환된 React Element를 바탕으로 reconcileChildren()함수부터 살펴보겠습니다.

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

2) Enter the render phase.

3) Perform rendering with hooks.

4) <span style='background-color: #FFB6C1'>ReconcileChildren</span>

5) Finishing Work

**5. Reconciler Commit Phase**

1) Execute `useEffect` and `useLayoutEffect`.

**6. Browser Paint**

---

# 1. Before

- 이전 글까지는 컴포넌트를 호출하여 Update하는 과정까지 살펴보았습니다.

![image](https://github.com/user-attachments/assets/17428754-670b-432e-9dd9-f5accefe6894)

1. **`workLoopSync()`**
2. **`performUnitOfWork()`**
3. **`beginWork()`**
4. **`bailoutOnAlreadyFinishedWork()`**
5. `update…`
    - 업데이트가 발생한 컴포넌트의 `workInProgress` 상태에 따라 해당 태그에 맞는 작업을 수행합니다.

   5-1. FunctionComponent → `renderWithHooks()`

    - 훅을 기반으로 업데이트 작업이 수행됩니다.

   5-2. Other Type Components

    - 클래스형 컴포넌트 및 기타 유형에 맞는 업데이트 작업이 수행됩니다.
6. <span style='background-color: #FFB6C1'>**`reconcileChildren()`**</span>
7. **`completeUnitOfWork()`**
8. **`completeWork()`**
- 이번 글에서는 **6. reconcileChildren()** 함수부터 이어서 진행해보겠습니다.

---

# 2. Render phase

## React의 휴리스틱 알고리즘

[공식홈페이지](https://ko.legacy.reactjs.org/docs/reconciliation.html)

- 재조정(Reconciliation)은 V-DOM의 변경점을 효율적으로 비교하여 업데이트 된 트리를 만들어 내는 것입니다.
- React에서는 V-DOM의 비교과정(diffing)을 최적화하기 위해 휴리스틱 알고리즘을 구현했습니다.
- 시간복잡도 O(n3) ⇒  O(n)
    1. 서로 다른 타입의 두 엘리먼트는 서로 다른 트리를 만들어낸다.
    2. 개발자가 `key` prop을 통해, 여러 렌더링 사이에서 어떤 자식 엘리먼트가 변경되지 않아야 할지 표시해 줄 수 있다.
- 중요한 포인트는 React element → Fiber로 확장할 때 current를 재사용 or 새로운 Fiber 생성에 대해 어떤 조건으로 선택하는지 입니다.
    - 새로운 Fiber생성 시 하위 서브트리는 모두 새로운 서브트리로 재구축 됩니다.

### 1) ChildReconciler()

[ChildReconciler-code](https://github.com/facebook/react/blob/v16.12.0/packages/react-reconciler/src/ReactChildFiber.js#L258)

- 재조정 작업과 관련된 추가, 삭제, 생성 등 여러 함수들이 존재합니다.

  <img src="https://github.com/user-attachments/assets/fc525a39-2be5-46a7-8bd4-a86a026166ed" alt="exception" />

- Fiber의 mount 여부에 따라 로직 경로가 다르며 빈번하게 호출 되므로 리액트 컴파일러의 최적화에 도움을 주기 위해서 경로가 다른 함수들을 미리 분리하여 사용되도록 설정해 두었습니다.

```jsx
function ChildReconciler(shouldTrackSideEffects) {
  // 삭제
	function deleteChild(returnFiber: Fiber, childToDelete: Fiber): void {
    if (!shouldTrackSideEffects) { // mount
      // Noop.
      return;
    }
    /*...*/
  }

  // 추가, 위치 이동
  function placeChild(newFiber: Fiber, lastPlacedIndex: number, newIndex: number,
  ): number {
    newFiber.index = newIndex;
    if (!shouldTrackSideEffects) { // mount
      // Noop.
      return lastPlacedIndex;
    }
    /*...*/
  }
  // 생성
  function createChild(returnFiber: Fiber,newChild: any, expirationTime: ExpirationTime,
  ): Fiber | null {
    if (typeof newChild === 'string' || typeof newChild === 'number') {
        /*...*/
      }
      /*...*/
    }  
  /*...*/

  // 재조정 작업 진행
  function reconcileChildFibers(returnFiber: Fiber, currentFirstChild: Fiber | null,
  newChild: any, expirationTime: ExpirationTime,): Fiber | null {
  /*...*/
  return reconcileChildFibers;
	}
}

// flag를 통해 마운트, 업데이트용 함수를 미리 나눠둠.
const reconcileChildFibers = ChildReconciler(true); //update
const mountChildFibers = ChildReconciler(false); // mount
```

### 2) reconcileChildren()

[reconcileChildren-code](https://github.com/facebook/react/blob/v16.12.0/packages/react-reconciler/src/ReactFiberBeginWork.js#L210)

- ChildReconciler()의 함수들은 아래와 같이 사용됩니다.

```jsx
export function reconcileChildren(
  current: Fiber | null,
  workInProgress: Fiber,
  nextChildren: any,
  renderExpirationTime: ExpirationTime,
) {
  if (current === null) {
    // 이 컴포넌트가 아직 한 번도 렌더링되지 않은 새로운 컴포넌트라면,
    // 최소한의 부작용만 적용하여 자식 세트를 업데이트하지 않겠습니다.
    // 대신, 렌더링되기 전에 자식을 모두 추가합니다. 이는 이 재조정(reconciliation) 과정을
    // 최적화하여 부작용을 추적하지 않아도 된다는 것을 의미합니다.
    workInProgress.child = mountChildFibers(
      workInProgress,
      null,
      nextChildren,
      renderExpirationTime,
    );
  } else {
    // 현재 자식과 진행 중인 작업(fiber)이 동일하다면,
    // 해당 자식들에 대한 작업겨이 아직 시작되지 않았다는 것을 의미합니다.
    // 따라서 현재 자식들의 복사본을 생성하기 위해 클론(clone) 알고리즘을 사용합니다.

    // 이미 어느 정도 진행된 작업이 있다면, 이 시점에서는 유효하지 않으므로
    // 이를 무효화하고 버립니다.
    workInProgress.child = reconcileChildFibers(
      workInProgress,
      current.child,
      nextChildren,
      renderExpirationTime,
    );
  }
}
```

### 3) reconcileChildFibers()

[reconcileChildFibers-code](https://github.com/facebook/react/blob/v16.12.0/packages/react-reconciler/src/ReactChildFiber.js#L1246)

- ChildReconciler() 에서 반환하는 reconcileChildFibers() 함수는 자식 React Element의 형식에 따라 재조정 함수로 라우팅합니다.
- 이 때 올바르지 않은 type이거나 반환값이 없다면 에러를 반환합니다.

```jsx
 // 이 API는 재조정 과정 자체의 부수효과로 자식들을 태깅합니다.
 // 자식들과 부모를 통과할 때 그들은 부수효과 리스트에 추가될 것입니다.
  function reconcileChildFibers(
    returnFiber: Fiber,
    currentFirstChild: Fiber | null,
    newChild: any,
    expirationTime: ExpirationTime,
  ): Fiber | null {
	// 이 함수는 재귀적이지 않습니다.
	// 최상위 항목이 배열인 경우, 이를 조각(Fragment)으로 취급하지 않고 자식 요소들로 처리합니다.
	// 반면, 중첩된 배열은 조각 노드로 처리됩니다. 재귀는 일반적인 흐름에서 발생합니다.
	
	// 최상위에 키가 없는 조각은 배열처럼 처리됩니다.
	// 이는 <>{[...]}</>와 <>...</> 사이에서 모호함을 초래할 수 있습니다.
	// 우리는 위의 모호한 경우를 동일하게 처리합니다.
    
	 // key 가 없는 Fragment
    const isUnkeyedTopLevelFragment =
      typeof newChild === 'object' &&
      newChild !== null &&
      newChild.type === REACT_FRAGMENT_TYPE &&
      newChild.key === null;
    if (isUnkeyedTopLevelFragment) {
      newChild = newChild.props.children;
    }

    // Handle object types
    const isObject = typeof newChild === 'object' && newChild !== null;
    
    // React Element
    // isObject이면서 React Element Type에 해당되는 경우
    if (isObject) {
      switch (newChild.$$typeof) {
        case REACT_ELEMENT_TYPE:
          return placeSingleChild(
            reconcileSingleElement(
              returnFiber,
              currentFirstChild,
              newChild,
              expirationTime,
            ),
          );
        case REACT_PORTAL_TYPE:
          return placeSingleChild(
            reconcileSinglePortal(
              returnFiber,
              currentFirstChild,
              newChild,
              expirationTime,
            ),
          );
      }
    }
    // Text
    if (typeof newChild === 'string' || typeof newChild === 'number') {
      return placeSingleChild(
        reconcileSingleTextNode(
          returnFiber,
          currentFirstChild,
          '' + newChild,
          expirationTime,
        ),
      );
    }
    // 여러개의 자식을 담고 있는 배열
    if (isArray(newChild)) {
      return reconcileChildrenArray(
        returnFiber,
        currentFirstChild,
        newChild,
        expirationTime,
      );
    }

    if (getIteratorFn(newChild)) {
      return reconcileChildrenIterator(
        returnFiber,
        currentFirstChild,
        newChild,
        expirationTime,
      );
    }
    
    // 만약 newChild가 REACT_ELEMENT_TYPE이나 REACT_PORTAL_TYPE이 아닌 객체 유형인 경우
    // 이 객체는 올바른 React Element가 아닐 수 있습니다. 이 경우 throwOnInvalidObjectType 함수가 호출되어 오류를 발생시킵니다. 
    // 이 함수는 newChild가 유효하지 않은 React 요소 유형일 때 경고를 띄우거나, 코드가 중단되지 않도록 하는 역할을 합니다.
    if (isObject) {
      throwOnInvalidObjectType(returnFiber, newChild);
    }
    
    // 에러 체크
    // 만약 newChild(새롭게 렌더링된 요소)가 undefined이고, 이 요소가 key 없는 최상위 Fragment가 아닌 경우에 이 조건문이 실행됩니다. 
    // 즉, 컴포넌트가 렌더링할 때 아무런 값을 반환하지 않은 경우를 처리합니다.
    if (typeof newChild === 'undefined' && !isUnkeyedTopLevelFragment) {

      // returnFiber.tag는 현재 렌더링 중인 Fiber가 어떤 종류의 컴포넌트인지 확인합니다. returnFiber는 부모 컴포넌트를 가리키며, 이 부모 컴포넌트가 어떤 타입인지에 따라 다른 처리를 수행합니다. 
      // 여기서 tag 값에 따라 ClassComponent와 FunctionComponent를 처리합니다.
      switch (returnFiber.tag) {
        case ClassComponent: {
						/*...*/
        }
        // 함수형 컴포넌트나 클래스형 컴포넌트 모두 처리되는 부분입니다. Component는 현재 렌더링 중인 컴포넌트를 참조합니다.
        // invariant 함수를 통해 오류를 발생시킵니다.
        // 이 오류 메시지는 컴포넌트의 render 함수에서 아무것도 반환하지 않았다는 경고를 나타냅니다. 
        // 주로 return문이 없거나, null을 반환해야 할 상황에서 아무것도 반환하지 않은 경우 발생합니다. 
        // 오류 메시지는 컴포넌트 이름과 함께 제공되며, 이는 개발자가 해당 오류를 쉽게 추적할 수 있도록 돕습니다.
        case FunctionComponent: {
          const Component = returnFiber.type;
          invariant(
            false,
            '%s(...): Nothing was returned from render. This usually means a ' +
              'return statement is missing. Or, to render nothing, ' +
              'return null.',
            Component.displayName || Component.name || 'Component',
          );
        }
      }
    }

    // Remaining cases are all treated as empty.
    return deleteRemainingChildren(returnFiber, currentFirstChild);
  }

  return reconcileChildFibers;
}

```

- **isUnkeyedTopLevelFragment** (key가 없는 Fragment) 경우에는 하위 컴포넌트를 묶어주는 용도로만 사용되므로 굳이 fiber로 만들지 않고, 자식을 props에서 꺼내 재조정을 진행합니다.
- Type별 재조정을 통해 반환된 Fiber를 placeSingleChild()에서 판단하여 Placement side-effect tag를 달아줍니다.
- reconcile과정을 통해 생기는 side-effect 들은 트리에 변경점을 불러오는 모든 경우(이동, 추가, 삭제 등의 update)입니다.
- 이후 Fiber에 새겨진 effectTag는 commit phase에서 확인하여 DOM조작, life-cycle 등을 마무리 합니다.

### 3-1) placeSingleChild()

[placeSingleChild-code](https://github.com/facebook/react/blob/v16.12.0/packages/react-reconciler/src/ReactChildFiber.js#L361)

- **if (shouldTrackSideEffects && newFiber.alternate === null)**
    - **shouldTrackSideEffects(true = update flag) →** current가 존재하는 상태
    - **newFiber.alternate === null →** 호출로 반환된 컴포넌트가 이전 컴포넌트와 type 또는 key가 달라 fiber를 새로 생성했음을 의미
    - 새로 만들어진 newFiber를 삽입 →  Placement tag 추가

```jsx
  function placeSingleChild(newFiber: Fiber): Fiber {
    // This is simpler for the single child case. We only need to do a
    // placement for inserting new children.
    // DOM 삽입 여부 판단
    if (shouldTrackSideEffects && newFiber.alternate === null) {
      newFiber.effectTag = Placement;
    }
    return newFiber;
  }

```

### 4) reconcileSingleElement()

[reconcileSingleElement-code](https://github.com/facebook/react/blob/v16.12.0/packages/react-reconciler/src/ReactChildFiber.js#L1132)

- 제일 먼저 **기존 Fiber(currrent)의 재사용 가능 여부를 판단**해야 합니다.
- 단일 element만이 위치해야합니다. (single) → current에 형제들이 있다면 삭제
- 설명은 주석을 통해 하도록 하겠습니다.

```jsx
  function reconcileSingleElement(
    returnFiber: Fiber,
    currentFirstChild: Fiber | null,
    element: ReactElement,
    expirationTime: ExpirationTime,
  ): Fiber {
    const key = element.key;
    let child = currentFirstChild;
    
    // newChild와 매칭되는 current를 Find
    while (child !== null) {
      // 1-1. current에 매칭되는 여러 형제노드 중 일치하는 fiber를 찾는다.
      if (child.key === key) {
        // 2-1. key값도 같고, type도 같다면 찾고자하는 "single element"를 찾았으니, 나머지 형제들은 삭제 deleteRemainingChildren()해주고, 현재 current를 재사용
        if (
          child.tag === Fragment
            ? element.type === REACT_FRAGMENT_TYPE
            : child.elementType === element.type
            ) {
          deleteRemainingChildren(returnFiber, child.sibling);
          const existing = useFiber( // current 재사용
            child,
            element.type === REACT_FRAGMENT_TYPE // 부모컴포넌트가 호출되었다면 props가 변경되었을 수 있기 때문에 반드시 호출하여 반환된 React element의 props를 사용
              ? element.props.children
              : element.props,
            expirationTime,
          );
          existing.ref = coerceRef(returnFiber, child, element);
          existing.return = returnFiber; // current 재사용 시 current의 부모(current.return)을 가리키고 있기 때문에 workInProgress tree로 연결해줍니다.
          return existing;
        } else { // 2-2. key값은 같지만 type이 다르다면 current를 삭제하고 다시 만들어야 합니다. 이때 해당 current뿐만 아니라 형제Node 모두 삭제합니다. 해당 depth에는 단일(single) Fiber만 위치해야 하기 때문입니다. 재사용은 불가하지만 매칭 current를 찾았기 때문에 while문을 종료합니다.
          deleteRemainingChildren(returnFiber, child);
          break;
        }
      } else { // 1-2.  key 값이 다르다면 찾는 current가 아니라는 뜻 -> 삭제
        deleteChild(returnFiber, child);
      }
      child = child.sibling; // 형제 node 순회
    }
		
		// new Fiber 생성
    if (element.type === REACT_FRAGMENT_TYPE) {
      const created = createFiberFromFragment(
        element.props.children,
        returnFiber.mode,
        expirationTime,
        element.key,
      );
      created.return = returnFiber;
      return created;
    } else {
      const created = createFiberFromElement(
        element,
        returnFiber.mode,
        expirationTime,
      );
      created.ref = coerceRef(returnFiber, currentFirstChild, element);
      created.return = returnFiber;
      return created;
    }
  }

```

- reconcileSingleElement()는 해당 depth에서 단일 자식만 위치한다는 것을 나타냅니다. 따라서 지금 처리되고 있는 element와 매칭 되지 않는 current들은 삭제됩니다.
- 전반적인 흐름은 다음과 같습니다.
    1. Key, Type 확인하여 동일한 current 찾기
    2. 동일한 current가 있다면 재 사용
        - 주의사항은 부모 컴포넌트가 호출 되었기 때문에 props의 변경이 일어날 수 있음으로 current의 props가 아니라 반환된 element.props를 사용하고, current.return이 아닌 현재 render중인 Fiber의 부모를 참조하도록 변경
    3. singleElement만 위치해야 하기 때문에 나머지 형제 Fiber Node들이 current에 존재한다면 삭제
    4. Key or Type이 다르다면 새롭게 Fiber를 생성

### 4-1) deleteRemainingChildren()

[deleteRemainingChildren-code](https://github.com/facebook/react/blob/v16.12.0/packages/react-reconciler/src/ReactChildFiber.js#L280)

```jsx
  function deleteRemainingChildren(
    returnFiber: Fiber,
    currentFirstChild: Fiber | null,
  ): null {
    if (!shouldTrackSideEffects) { // mount 시
      // Noop. // mount라면 current(현재 DOM 트리와의 연결 정보)가 없으므로 삭제할 것이 없음.
      return null;
    }
    // currentFirstChild 부터 모든 형제 Node들을 삭제해줍니다.
    let childToDelete = currentFirstChild;
    while (childToDelete !== null) {
      deleteChild(returnFiber, childToDelete);
      childToDelete = childToDelete.sibling;
    }
    return null;
  }
```

### 4-2) deleteChild()

[deleteChild-code](https://github.com/facebook/react/blob/v16.12.0/packages/react-reconciler/src/ReactChildFiber.js#L259)

- 위에서 언급했듯이, reconcile과정을 통해 side-effect가 생기고, 이를 처리하기 위해 부모로 전달해야합니다. (effect들은 commit phase에서 소비)
    - effect를 추가하여 부모로 전달하기 위해서는 7. completeUnitOfWork()까지 effect가 유지되어야 하는데 삭제되는 Fiber는 현재 시점 이후에는 접근할 수가 없습니다.
    - 따라서 여기서 Deletion tag를 가진 fiber를 연결해줍니다.
    - 나머지 effect tag는 7. completeUnitOfWork()에서 연결해줍니다.

```jsx
function deleteChild(returnFiber: Fiber, childToDelete: Fiber): void {
  // mount의 경우 삭제할 사이드 이펙트를 추적할 필요가 없음
  if (!shouldTrackSideEffects) { // mount의 경우
     // Noop. // mount라면 current(현재 DOM 트리와의 연결 정보)가 없으므로 삭제할 것이 없음.
    return;
  }
  // 삭제되는 항목은 역순으로 추가되므로 앞쪽에 추가함.
  // 이 시점에서 return fiber(부모 Fiber)의 effect 리스트는 삭제 항목만 비어있으므로
  // 여기서 삭제 작업을 리스트에 추가할 수 있음.
  // 나머지 효과들은 complete 단계까지 추가되지 않음.
  const last = returnFiber.lastEffect; 
  if (last !== null) { 
    last.nextEffect = childToDelete;
    returnFiber.lastEffect = childToDelete;
  } else {
    returnFiber.firstEffect = returnFiber.lastEffect = childToDelete;
  }
  
  childToDelete.nextEffect = null;
  childToDelete.effectTag = Deletion;
}

```

### 4-3) useFiber()

[useFiber-code](https://github.com/facebook/react/blob/v16.12.0/packages/react-reconciler/src/ReactChildFiber.js#L320)

- props 제외 current의 속성들을 복사한 workInProgress를 만듭니다. 현재 위치에 존재하는 노드는 자기자신 하나이므로 형제 노드 중 첫 번째 위치를 나타내는 index = 0, sibling = null로 세팅해줍니다.
- index 속성은 형제노드들 중 자신의 순번 위치를 나타내는 속성으로 여러 자식이 담겨있는 배열을 재조정할 때 사용됩니다.

```jsx
  function useFiber(
    fiber: Fiber,
    pendingProps: mixed,
    expirationTime: ExpirationTime,
  ): Fiber {
    // We currently set sibling to null and index to 0 here because it is easy
    // to forget to do before returning it. E.g. for the single child case.
    const clone = createWorkInProgress(fiber, pendingProps, expirationTime);
    clone.index = 0;
    clone.sibling = null;
    return clone;
  }
```

### 5) reconcileSingleTextNode()

[reconcileSingleTextNode-code](https://github.com/facebook/react/blob/v16.12.0/packages/react-reconciler/src/ReactChildFiber.js#L1104)

- Text는 key값을 가지고 있지 않기 때문에 첫 번째 current자식이 Text Fiber라면 재사용하고, 아니라면 모두 삭제하고 새로운 Fiber를 만들어 반환합니다.

```jsx
function reconcileSingleTextNode(
    returnFiber: Fiber,
    currentFirstChild: Fiber | null,
    textContent: string,
    expirationTime: ExpirationTime,
  ): Fiber {
    // There's no need to check for keys on text nodes since we don't have a
    // way to define them.
    if (currentFirstChild !== null && currentFirstChild.tag === HostText) {
      // We already have an existing node so let's just update it and delete
      // the rest.
      deleteRemainingChildren(returnFiber, currentFirstChild.sibling);
      const existing = useFiber(currentFirstChild, textContent, expirationTime);
      existing.return = returnFiber;
      return existing;
    }
    // The existing first child is not a text node so we need to create one
    // and delete the existing ones.
    deleteRemainingChildren(returnFiber, currentFirstChild);
    const created = createFiberFromText(
      textContent,
      returnFiber.mode,
      expirationTime,
    );
    created.return = returnFiber;
    return created;
  }

```

### 6) reconcileChildrenArray()

[reconcileChildrenArray-code](https://github.com/facebook/react/blob/v16.12.0/packages/react-reconciler/src/ReactChildFiber.js#L756)

- 해당 함수의 길이가 상당히 길기 때문에 나누어서 살펴보겠습니다.

```jsx
  function reconcileChildrenArray(
    returnFiber: Fiber,
    currentFirstChild: Fiber | null,
    newChildren: Array<*>,
    expirationTime: ExpirationTime,
  ): Fiber | null {

    let resultingFirstChild: Fiber | null = null;
    let previousNewFiber: Fiber | null = null;

    let oldFiber = currentFirstChild;
    let lastPlacedIndex = 0;
    let newIdx = 0;
    let nextOldFiber = null;
    
    // part 1
    for (; oldFiber !== null && newIdx < newChildren.length; newIdx++) {
      if (oldFiber.index > newIdx) {
        nextOldFiber = oldFiber;
        oldFiber = null;
      } else {
        nextOldFiber = oldFiber.sibling;
      }
      const newFiber = updateSlot(
        returnFiber,
        oldFiber,
        newChildren[newIdx],
        expirationTime,
      );
      if (newFiber === null) {
        if (oldFiber === null) {
          oldFiber = nextOldFiber;
        }
        break;
      }
      if (shouldTrackSideEffects) {
        if (oldFiber && newFiber.alternate === null) {
          deleteChild(returnFiber, oldFiber);
        }
      }
      lastPlacedIndex = placeChild(newFiber, lastPlacedIndex, newIdx);
      if (previousNewFiber === null) {
        resultingFirstChild = newFiber;
      } else {
        previousNewFiber.sibling = newFiber;
      }
      previousNewFiber = newFiber;
      oldFiber = nextOldFiber;
    }
    
		// part 2
    if (newIdx === newChildren.length) {
      // We've reached the end of the new children. We can delete the rest.
      deleteRemainingChildren(returnFiber, oldFiber);
      return resultingFirstChild;
    }
    if (oldFiber === null) {
      for (; newIdx < newChildren.length; newIdx++) {
        const newFiber = createChild(
          returnFiber,
          newChildren[newIdx],
          expirationTime,
        );
        if (newFiber === null) {
          continue;
        }
        lastPlacedIndex = placeChild(newFiber, lastPlacedIndex, newIdx);
        if (previousNewFiber === null) {
          resultingFirstChild = newFiber;
        } else {
          previousNewFiber.sibling = newFiber;
        }
        previousNewFiber = newFiber;
      }
      return resultingFirstChild;
    }

    // part 3
    const existingChildren = mapRemainingChildren(returnFiber, oldFiber);

    for (; newIdx < newChildren.length; newIdx++) {
      const newFiber = updateFromMap(
        existingChildren,
        returnFiber,
        newIdx,
        newChildren[newIdx],
        expirationTime,
      );
      if (newFiber !== null) {
        if (shouldTrackSideEffects) {
          if (newFiber.alternate !== null) {
            existingChildren.delete(
              newFiber.key === null ? newIdx : newFiber.key,
            );
          }
        }
        lastPlacedIndex = placeChild(newFiber, lastPlacedIndex, newIdx);
        if (previousNewFiber === null) {
          resultingFirstChild = newFiber;
        } else {
          previousNewFiber.sibling = newFiber;
        }
        previousNewFiber = newFiber;
      }
    }
    
		// part 4
    if (shouldTrackSideEffects) {
      existingChildren.forEach(child => deleteChild(returnFiber, child));
    }

    return resultingFirstChild;
  }
```

### 6-1) **arguments & algorithm**

- **currentFirstChild →** current의 연결리스트
- **newChild →** 컴포넌트가 반환한 React element를 담고있는 배열

```jsx
if (isArray(newChild)) {
  return reconcileChildrenArray(
    returnFiber,
    currentFirstChild, // current의 첫번째 자식노드이며, 형제들 중 몇번째 위치해 있는지 index를 가지고 있음
    newChild, // 컴포넌트가 반환한 React element를 담고있는 배열
    expirationTime
  )
}
```

- 두 배열을 비교하여 각 배열 요소의 추가, 이동, 삭제 판별 로직은 어떻게?
    1. 두 배열을 비교할 때 간단하게 완전 탐색을 할 경우 O(n²)의 시간 복잡도
    2. O(n)의 시간복잡도를 보장하기 해서 연결리스트를 map으로 변환하여 사용 (대신 공간복잡도는 상승)

       **⇒ key, type, index**

- **Case1. 배열의 current들이 움직이지 않고 원래 위치에 있음**
    - current의 이동이 없다면, 추가 삭제는 시간복잡도에 별다른 영향을 주지 않습니다.
    - 요소 하나씩 이동하며, 추가 또는 삭제 판단만 하면 됩니다.

  ![image](https://github.com/user-attachments/assets/376f0f15-d0c3-419d-b5cc-dc0a23ab6d5f)

- **Case2. 배열의 current들이 원래 위치에 있지 않음**
    - current가 원래 위치에 있지 않다면 배열의 모든 요소를 탐색하기 전까지는 해당 요소가 이동되어 다른 위치에 있는지 삭제되었는지 알 수 없습니다.
    - 따라서 map을 사용하여 key 또는 index로 current를 찾아내어 O(n)의 시간복잡도를 확보합니다. (공간복잡도는 증가)

  ![image](https://github.com/user-attachments/assets/2029dbd2-701f-4bd6-97b3-f447b5627cab)


### 6-2) part1: case1

- newChildren의 요소가 즉, newFiber가 null을 반환하지 않을 때까지 진행 (다음 리스트 요소로 이동)
    - null을 반환한다면 해당 요소가 삭제인지 이동인지 모두 탐색하기 전까지는 알 수 없기 때문에 중단
    - `oldFiber`와 `newChildren[newIdx]`의 **key**값이 다르면 newFiber는 무조건 null, 마지막 newFiber의 index를 기록 lastPlacedIndex
- 원래 current와 newFiber의 key가 다르거나 newFiber가 null 일 경우 순차 탐색으로는 O(n)을 확보할 수 없다.

```jsx
  function reconcileChildrenArray(
    returnFiber: Fiber,
    currentFirstChild: Fiber | null,
    newChildren: Array<*>,
    expirationTime: ExpirationTime,
  ): Fiber | null {

    let resultingFirstChild: Fiber | null = null; 
    let previousNewFiber: Fiber | null = null;

    let oldFiber = currentFirstChild; // current pointer
    let lastPlacedIndex = 0; // 마지막으로 처리된 Fiber의 index
    let newIdx = 0; // new child pointer
    let nextOldFiber = null;
    
    // part 1
    // 순차 탐색
    for (; oldFiber !== null && newIdx < newChildren.length; newIdx++) {
	    // oldFiber위치가 새로운 childArray의 index보다 크다면 삭제되었다는 뜻
	    // [null, null, a] => a{ index:2 }, [b] => b{ index: 0} 라면
	    // oldFiber.index = 2, newIdx = 0
      if (oldFiber.index > newIdx) { 
        nextOldFiber = oldFiber; // 이후 순회에서 check할 수 있도록 임시 보관
        oldFiber = null; // newIdx 매칭되는 current가 없으므로 null 설정을 통해 새로운 Fiber 생성 or 기존 Fiber와 매칭되지 않도록 설정
      } else {
        nextOldFiber = oldFiber.sibling; // 이후 순회에서 check 하도록 다음 형제로 이동
      }
      // key값이 다르다면 null, key값이 같다면 type을 비교하여 다르다면 생성 같다면 current 재사용하여 fiber 반환 
      const newFiber = updateSlot(
        returnFiber,
        oldFiber,
        newChildren[newIdx],
        expirationTime,
      );
      // key값이 다르다면 newFiber는 무조건 null이기 때문에 중단
      if (newFiber === null) {
        if (oldFiber === null) { // 위의 if문에서 매칭되는 current가 없어서 oldFiber가 null이라면 임시 저장해 두었던 nextOldFiber와 비교할 수 있도록 저장
          oldFiber = nextOldFiber; 
        }
        break;
      }
      // 이전 oldFiber가 존재하고, 새로 생성된 Fiber의 alternate가 null 이라는 것은 이전 fiber를 사용하지 않는다는 의미이므로기존 fiber(current)를 삭제하여 메모리 누수 방지 
      if (shouldTrackSideEffects) {
        if (oldFiber && newFiber.alternate === null) {
          deleteChild(returnFiber, oldFiber);
        }
      }
      // fiber에 index(위치표시)를 새기며 이동, 추가의 경우 placement effect tag 추가
      lastPlacedIndex = placeChild(newFiber, lastPlacedIndex, newIdx);
      if (previousNewFiber === null) {
        resultingFirstChild = newFiber;
      } else {
        previousNewFiber.sibling = newFiber;
      }
      previousNewFiber = newFiber; // 이전 형제와 연결
      oldFiber = nextOldFiber;
    }
    
		/*...*/

    return resultingFirstChild;
  }
```

- **case  if (oldFiber.index > newIdx) :**

    ```jsx
    // before Array
    [null, null, a] => a{ index:2 }
    // new Array
    [b] => b{ index: 0} 
    // oldFiber.index = 2, newIdx = 0
    ```


### 6-2-1) updateSlot()

[updateSlot-code](https://github.com/facebook/react/blob/v16.12.0/packages/react-reconciler/src/ReactChildFiber.js#L544)

- key값이 다르거나 fiber로 확장 불가능하면 null, key값이 같다면 type을 비교하여 newChild를 반환해주는 함수입니다.
    - oldFiber와 newChild의 key값이 다르다면 무조건 null을 반환
    - newChild가 fiber로 확장될 수 없을 때도 null 반환 → 배열을 모두 탐색해보기 전까지는 알 수 없기 때문에 중단
        - `[null, <div key="1"/>] => [null, <div key="1"/>]`

            ```jsx
            // before                 
            [null, <div key="1"/>] 
            // after
            [null, <div key="1"/>]
            ```

        - `[<div key="1"/>, <div key="2"/>] => [null, <div key="2"/>]`

            ```jsx
            // before
            [<div key="1"/>, <div key="2"/>]  
            // after
            [null, <div key="2"/>]
            ```

    - key값이 같다면 type을 비교하여 다르다면 생성 같다면 current 재사용하여 fiber 반환 합니다.

```jsx
function updateSlot(
  returnFiber: Fiber,
  oldFiber: Fiber | null,
  newChild: any,
  expirationTime: ExpirationTime,
): Fiber | null {
  // Update the fiber if the keys match, otherwise return null.

  const key = oldFiber !== null ? oldFiber.key : null;

  if (typeof newChild === 'string' || typeof newChild === 'number') {
    // React element에는 key를 설정할 수 있지만 Text에는 key를 설정할 수 없다. 
    // newChild가 key를 설정할 수 없는 text이지만 기존 current에는 key가 존재한다면 이는 current가 이동, 삭제되었다고 볼 수 있으므로 null을 반환합니다.
    if (key !== null) {
      return null;
    }
    return updateTextNode(
      returnFiber,
      oldFiber,
      '' + newChild,
      expirationTime,
    );
  }
  // type별 routing update
  // update함수들은 current를 재사용 하거나 불가하면 새롭게 만들어 반환합니다.
  if (typeof newChild === 'object' && newChild !== null) {
    switch (newChild.$$typeof) {
      case REACT_ELEMENT_TYPE: {
        if (newChild.key === key) {
          if (newChild.type === REACT_FRAGMENT_TYPE) {
            return updateFragment(
              returnFiber,
              oldFiber,
              newChild.props.children,
              expirationTime,
              key,
            );
          }
          return updateElement(
            returnFiber,
            oldFiber,
            newChild,
            expirationTime,
          );
        } else {
          return null;
        }
      }
      case REACT_PORTAL_TYPE: {
        if (newChild.key === key) {
          return updatePortal(
            returnFiber,
            oldFiber,
            newChild,
            expirationTime,
          );
        } else {
          return null;
        }
      }
    }

    if (isArray(newChild) || getIteratorFn(newChild)) {
      // React element에는 key를 설정할 수 있지만 배열에는 key를 설정할 수 없다. 
      // newChild가 key를 설정할 수 없는 배열이지만 기존 current에는 key가 존재한다면 이는 current가 이동, 삭제되었다고 볼 수 있으므로 null을 반환합니다.
      if (key !== null) {
        return null;
      }

      return updateFragment(
        returnFiber,
        oldFiber,
        newChild,
        expirationTime,
        null,
      );
    }

    throwOnInvalidObjectType(returnFiber, newChild);
  }
  return null;
}
```

### 6-2-2) updateElement()

[updateElement-code](https://github.com/facebook/react/blob/v16.12.0/packages/react-reconciler/src/ReactChildFiber.js#L393)

- type이 같다면 element.props제외 current를 복사하여 반환
- type이 다르다면 새로 생성하여 반환

```jsx
function updateElement(
    returnFiber: Fiber,
    current: Fiber | null,
    element: ReactElement,
    expirationTime: ExpirationTime,
  ): Fiber {
    if ( // key & type이 같은지 check
      current !== null && current.elementType === element.type  {
      // current의 prop이 아니라 반환된 element.props를 사용해야 한다.
      const existing = useFiber(current, element.props, expirationTime);
      existing.ref = coerceRef(returnFiber, current, element);
      existing.return = returnFiber;
    
      return existing;
    } else {
      // Insert
      const created = createFiberFromElement(
        element,
        returnFiber.mode,
        expirationTime,
      );
      created.ref = coerceRef(returnFiber, current, element);
      created.return = returnFiber;
      return created;
    }
  }

```

### 6-2-3) placeChild()

[placeChild-code](https://github.com/facebook/react/blob/v16.12.0/packages/react-reconciler/src/ReactChildFiber.js#L333)

- updateSlot()에서 반환받은 newChild(Fiber)의 index와 이동, 추가 상태를 나타내는 Placement tag를 표시해야 합니다.
- 이동 + 추가는 한 묶음으로 [HTML appendChild()](https://developer.mozilla.org/ko/docs/Web/API/Node/appendChild)를 사용하여 한번에 처리할 수 있습니다.
- 다음과 같은 배열의 변화에서 React는 어떻게 판단할까요?
    1. **2, 3번째 요소는 그대로 있었으며 1번째 요소만 맨 뒤로 이동했다.**
    2. 1번째 요소는 그대로 있었으며 2, 3번째 요소가 앞으로 이동했다.

    ```jsx
    // before
    [<div key="1"/>, <div key="2"/>, <div key="3"/>] 
    // after
    [<div key="2"/>, <div key="3"/>, <div key="1"/>]
    ```


![image](https://github.com/user-attachments/assets/d252f8a9-3020-4fa2-ab15-19b1b739c143)

![image](https://github.com/user-attachments/assets/82e6896b-6b63-4972-8db5-3702f5ef9e32)

- 최악의 경우는 last 원소가 제일 앞인 first로 이동했을 경우입니다. 이때는 first원소를 제외한 나머지 fiber에 모두 placement tag가 추가됩니다.

![image](https://github.com/user-attachments/assets/429047a5-d939-4481-9431-51c83fb7f1a5)

```jsx
function placeChild(
    newFiber: Fiber,
    lastPlacedIndex: number,
    newIndex: number,
  ): number {
    newFiber.index = newIndex;
    if (!shouldTrackSideEffects) { // 마운트 시
      // Noop.
      return lastPlacedIndex;
    }
    const current = newFiber.alternate;
    if (current !== null) {
      const oldIndex = current.index;
      if (oldIndex < lastPlacedIndex) {
        // This is a move. 이동
        newFiber.effectTag = Placement;
        return lastPlacedIndex;
      } else {
        // This item can stay in place. 이동하지 않았음
        return oldIndex;
      }
    } else {
      // This is an insertion. Placement Effect Tag 추가
      newFiber.effectTag = Placement;
      return lastPlacedIndex;
    }
  }
```

### 6-3) part2: after case1

- 여기에 해당하는 case는 **삭제할 current만 있거나** 새로 **생성하여 추가할 newChild만 있는 경우** 입니다.
    - **if (newIdx === newChildren.length) →** current list가 더 길다는 것은 나머지 요소들은 모두 삭제되었다는 뜻
    - **if (oldFiber === null)** → newChilren의 요소가 남아있는데 oldFiber는 null이라면 newChildren의 요소가 더 많은 것이므로 (추가된 것이므로) 생성하고 placement Tag

```jsx
  function reconcileChildrenArray(
    returnFiber: Fiber,
    currentFirstChild: Fiber | null,
    newChildren: Array<*>,
    expirationTime: ExpirationTime,
  ): Fiber | null {

    let resultingFirstChild: Fiber | null = null;
    let previousNewFiber: Fiber | null = null;

    let oldFiber = currentFirstChild;
    let lastPlacedIndex = 0;
    let newIdx = 0;
    let nextOldFiber = null;
    
    // part 1 
    // case1 순차 탐색
    /*...*/
    
		// part 2
		// 2-1. newChildren리스트의 마지막 요소에 도달했음에도 기존 current가 남아있다면 삭제되어야하므로 나머지 삭제
    if (newIdx === newChildren.length) {
      // We've reached the end of the new children. We can delete the rest.
      deleteRemainingChildren(returnFiber, oldFiber);
      return resultingFirstChild;       
    }
    // 2-2. 만약 newChilren의 요소가 남아있는데 oldFiber는 null이라면 newChildren의 요소가 더많은 것이므로 (추가된 것이므로) 생성하고 placement Tag
    if (oldFiber === null) {
      for (; newIdx < newChildren.length; newIdx++) {
        const newFiber = createChild( // type에 맞추어 Fiber 생성
          returnFiber,
          newChildren[newIdx],
          expirationTime,
        ); 
        if (newFiber === null) {
          continue;
        }
        lastPlacedIndex = placeChild(newFiber, lastPlacedIndex, newIdx);
        if (previousNewFiber === null) {
          resultingFirstChild = newFiber;
        } else {
          previousNewFiber.sibling = newFiber;
        }
        previousNewFiber = newFiber;
      }
      return resultingFirstChild;
    }

    // part 3
		/*...*/
    
		// part 4
		/*...*/
   
    return resultingFirstChild;
  }
```

### 6-4) part3: case2

- **배열의 current들이 원래 위치에 있지 않은 경우입니다. → Map()으로 변환하여 진행**
    1. current list → Map()으로 변환
    2. newChildren 배열에서 아직 탐색하지 않은 나머지 요소들을 탐색하며 Map()에서 current를 찾는다.
    3. 찾았다면 current가 이동 한 것이고 못 찾았다면 current가 삭제 된 것입니다.

```jsx
  function reconcileChildrenArray(
    returnFiber: Fiber,
    currentFirstChild: Fiber | null,
    newChildren: Array<*>,
    expirationTime: ExpirationTime,
  ): Fiber | null {

    let resultingFirstChild: Fiber | null = null;
    let previousNewFiber: Fiber | null = null;

    let oldFiber = currentFirstChild;
    let lastPlacedIndex = 0;
    let newIdx = 0;
    let nextOldFiber = null;
    
    // part 1
 		/*...*/
   
		// part 2
		/*...*/
   
    // part 3
    // Map()으로 변환
    const existingChildren = mapRemainingChildren(returnFiber, oldFiber);
		// newChildren의 나머지 요소들을 탐색하며 current를 찾아 처리한다.
    for (; newIdx < newChildren.length; newIdx++) {
      const newFiber = updateFromMap( // same logic updateSlot() but reference Map
        existingChildren,
        returnFiber,
        newIdx,
        newChildren[newIdx],
        expirationTime,
      );
      if (newFiber !== null) {
        if (shouldTrackSideEffects) {
          if (newFiber.alternate !== null) {
            existingChildren.delete(
              newFiber.key === null ? newIdx : newFiber.key,
            );
          }
        }
        lastPlacedIndex = placeChild(newFiber, lastPlacedIndex, newIdx);
        if (previousNewFiber === null) {
          resultingFirstChild = newFiber;
        } else {
          previousNewFiber.sibling = newFiber;
        }
        previousNewFiber = newFiber;
      }
    }
    
		// part 4
		/*...*/
   
    return resultingFirstChild;
  }
```

### 6-4-1) mapRemainingChildren()

[mapRemainingChildren-code](https://github.com/facebook/react/blob/v16.12.0/packages/react-reconciler/src/ReactChildFiber.js#L299)

- 기존의 current list를 Map으로 변환합니다.

```jsx
 function mapRemainingChildren(
    returnFiber: Fiber,
    currentFirstChild: Fiber,
  ): Map<string | number, Fiber> {
    // Add the remaining children to a temporary map so that we can find them by
    // keys quickly. Implicit (null) keys get added to this set with their index
    // instead.
    const existingChildren: Map<string | number, Fiber> = new Map();

    let existingChild = currentFirstChild;
    while (existingChild !== null) {
      if (existingChild.key !== null) { // key값이 있다면 key값을 사용
        existingChildren.set(existingChild.key, existingChild);
      } else { // 없다면 index 사용
        existingChildren.set(existingChild.index, existingChild);
      }
      existingChild = existingChild.sibling;
    }
    return existingChildren;
  }

```

### 6-4-2) updateFromMap()

- updateSlot()에서는 oldFiber.key로 찾고

    ```jsx
     const key = oldFiber !== null ? oldFiber.key : null
    ```

- updateFromMap()에서는 Map()에서 설정한 current의 key값(oldFiber.key 또는 index)으로 찾습니다.

    ```jsx
     const matchedFiber = existingChildren.get(
     newChild.key === null ? newIdx : newChild.key,) || null;
    ```


[updateFromMap-code](https://github.com/facebook/react/blob/v16.12.0/packages/react-reconciler/src/ReactChildFiber.js#L632)

```jsx
  function updateFromMap(
    existingChildren: Map<string | number, Fiber>,
    returnFiber: Fiber,
    newIdx: number,
    newChild: any,
    expirationTime: ExpirationTime,
  ): Fiber | null {
    if (typeof newChild === 'string' || typeof newChild === 'number') {
      // Text nodes don't have keys, so we neither have to check the old nor
      // new node for the key. If both are text nodes, they match.
      const matchedFiber = existingChildren.get(newIdx) || null;
      return updateTextNode(
        returnFiber,
        matchedFiber,
        '' + newChild,
        expirationTime,
      );
    }
		
		/*...*/
		 if (typeof newChild === 'object' && newChild !== null) {
      switch (newChild.$$typeof) {
        case REACT_ELEMENT_TYPE: {
          const matchedFiber =
            existingChildren.get(
              newChild.key === null ? newIdx : newChild.key,
            ) || null;
            
             return updateElement(
	            returnFiber,
	            matchedFiber,
	            newChild,
	            expirationTime,
	          );
        }
     }
		/*...*/

    return null;
  }

```

### 6-5) part4: after case2

- newChildren 배열을 모두 탐색한 뒤에도 current가 남아 있다면 삭제된 것이므로 모두 제거해줍니다.

```jsx
function reconcileChildrenArray(
  returnFiber: Fiber,
  currentFirstChild: Fiber | null,
  newChildren: Array<*>,
  expirationTime: ExpirationTime,
): Fiber | null {

  let resultingFirstChild: Fiber | null = null;
  let previousNewFiber: Fiber | null = null;

  let oldFiber = currentFirstChild;
  let lastPlacedIndex = 0;
  let newIdx = 0;
  let nextOldFiber = null;
  
  // part 1
		/*...*/
 
	// part 2
	/*...*/
 
  // part 3
	/*...*/
 
	 // part 4
	 // 남아있는 current 모두 제거
	 if (shouldTrackSideEffects) {
	    existingChildren.forEach(child => deleteChild(returnFiber, child));
	  }

  return resultingFirstChild;
}
```

## Importance of Key

[react-key](https://ko.react.dev/learn/rendering-lists#keeping-list-items-in-order-with-key)

- key와 type이 같으면 props만 변경된다.
- key를 설정하지 않으면 key는 null이다.

![image](https://github.com/user-attachments/assets/39a8ff2d-4140-4a89-8d5a-044a50d0c2b5)

- **Bad Case 1 (key = null)**

  ![badkey](https://github.com/user-attachments/assets/025f0b11-8d24-4903-907d-2b07ec3f156e)

- **react에서 key를 null로 사용하는 경우** props만 변경됩니다.

    ```jsx
    import React, { useState } from 'react';
    
    const CounterBox = ({ color }) => {
        const [count, setCount] = useState(0);
        
        return (
            <div style={{ backgroundColor: color, padding: '10px', margin: '10px' }}>
            Count: {count}
            <button onClick={() => setCount(count + 1)}>Increment</button>
            </div>
        );
    }
    function ListWithoutKey() {
      const [items, setItems] = useState([
        { color: 'lightblue' },
        { color: 'red' }
      ]);
    
      const handleReverse = () => {
        setItems([...items.reverse()]);
      };
    
      return (
        <div>
          {items.map((item) => (
            <CounterBox color={item.color} />
          ))}
          <button onClick={handleReverse}>Reverse</button>
        </div>
      );
    }
    
    export default ListWithoutKey;
    
    ```

    - 조금 더 구체적으로 말하면 key가 null일 경우 newIdx는 0부터 탐색 할 것이고,
    - `const existingChildren = mapRemainingChildren(returnFiber, oldFiber);` 를 통해 생성된 existingChildren 또한 index를 기준으로 key를 부여 받기 때문에 key는 일치할 것(existingChild.index = newIdx)이고 type도 동일한 상태이기 때문에 props만 변경됩니다.
- 만약 다음과 같은 극단적인 예시는 어떨까요?

    ```jsx
    // before existingChildren  
    [null, null, a]
    // after newChildren
    [null, a, null]
    ```

    - key값이 null 이기 때문에 newIdx를  0부터 순차적으로 탐색하고, `existingChildren` 또한 index기반으로 0, 1, 2의 key를 부여 받게 됩니다.
    - 이때 `newChildren`의 a요소의 newIdx는 1이며, 같은 요소인 a는 index기반 key값 2를 갖기 때문에 동일한 요소임에도 재사용하지 못하고 새로 생성하게 됩니다.
    - 이후 마지막 요소 null은 삭제되었다고 판단하여 `existingChildren` 의 a요소를 삭제할 것입니다.


- **Bad Case 2 (key = index)**

  ![badkey](https://github.com/user-attachments/assets/025f0b11-8d24-4903-907d-2b07ec3f156e)

- **react에서 key를 index로 사용하는 경우**에도 props만 변경됩니다.

    ```jsx
    // before key = 0, 1, 2
    [‘a’, ‘b’, ‘c’].map((color, index) => <div key={index} name={color} />);
    // after key still = 0, 1, 2 but change element
    [‘a’, ‘c’, ‘b’].map((color, index) => <div key={index} name={color} />);
    
      return (
        <div>
          {items.map((item, index) => (
            <CounterBox key={index} color={item.color} />
          ))}
          <button onClick={handleReverse}>Reverse</button>
        </div>
      );
    ```

    - 요소가 이동하더라도 key는 여전히 index기준으로 0, 1, 2이기 때문에 key값이 동일하다고 판단할 것이며 type까지 같다면 props만 변경됩니다.
- **Bad Case 3 (key = Math.random())**

  ![randomkeygen](https://github.com/user-attachments/assets/6abc93c6-d09d-42f7-aed6-8ec8ec8576da)

- 공식 홈페이지에서도 확인해볼 수 있듯이 즉석에서 key를 생성하면 렌더링 간에 key가 일치하지 않아 모든 컴포넌트와 DOM이 매번 다시 생성될 수 있습니다.

    ```jsx
      return (
        <div>
          {items.map((item) => (
            <CounterBox key={Math.random()} color={item.color} />
          ))}
          <button onClick={handleReverse}>Reverse</button>
        </div>
      );
    ```

- **Correct Case (unique key)**
    - 따라서 react에서는 고유한 key 값을 부여하여야 합니다.

  ![correctkey](https://github.com/user-attachments/assets/904e1b21-7452-47a8-aa10-4e5a01d1703f)

    ```jsx
    import React, { useState } from 'react';
    
    const CounterBox = ({ color }) => {
        const [count, setCount] = useState(0);
        
        return (
            <div style={{ backgroundColor: color, padding: '10px', margin: '10px' }}>
            Count: {count}
            <button onClick={() => setCount(count + 1)}>Increment</button>
            </div>
        );
    }
    function ListWithoutKey() {
      const [items, setItems] = useState([
         { id: 0, color: 'lightblue' },
         { id: 1, color: 'red' }
      ]);
    
      const handleReverse = () => {
        setItems([...items.reverse()]);
      };
    
      return (
        <div>
          {items.map((item) => (
            <CounterBox key={item.id} color={item.color} />
          ))}
          <button onClick={handleReverse}>Reverse</button>
        </div>
      );
    }
    
    export default ListWithoutKey;
    
    ```

---

# 3. Summary

- 이제 V-DOM의 Root부터 update가 발생한 component를 찾아 호출하여 Update하고 reconcile과정까지 이루어졌습니다.

  ![image](https://github.com/user-attachments/assets/423b1522-ed6c-4a86-83f7-5fa3921ea941)

- reconcile과정을 살펴보며 React가 어떤 기준으로 휴리스틱 알고리즘을 구현하여 O(n)의 시간복잡도를 확보했는지 알 수 있었으며,
- 특히 reconcileChildrenArray() 함수를 살펴보며 react에서 key 값을 왜 중요시하는지 명확하게 알 수 있었습니다.
- 다음 글에서는 reconcile을 통해 반환된 Fiber를 Commit Phase에서 사용할 수 있게 마무리하고 준비하는 `7. completeUnitOfWork()` 부터 이어가보겠습니다.