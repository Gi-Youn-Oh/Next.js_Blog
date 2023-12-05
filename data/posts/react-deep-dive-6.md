# React-deep-dive-6

## 2-3. useEffect in React.dev(3)

### The lifecycle of an Effect

<dfn>
<b>Effects have a different lifecycle from components. Components may mount, update, or unmount. An Effect can only do two things: to start synchronizing something, and later to stop synchronizing it.</b> This cycle can happen multiple times if your Effect depends on props and state that change over time. React provides a linter rule to check that you’ve specified your Effect’s dependencies correctly. This keeps your Effect synchronized to the latest props and state.
</dfn>

⇒ **Effect는 컴포넌트와 다른 생명주기를 가집니다. 컴포넌트는 마운트, 업데이트 또는 마운트 해제할 수 있습니다. Effect는 동기화를 시작하고 나중에 동기화를 중지하는 두 가지 작업만 할 수 있습니다.** 

⇒ 이 사이클은 시간이 지남에 따라 변하는 props와 state에 의존하는 Effect의 경우 여러 번 발생할 수 있습니다.

### Component

모든 React 컴포넌트는 동일한 생명주기를 거친다.

1. 컴포넌트는 화면에 추가될 때 **마운트** 된다.
2. 컴포넌트는 새로운 props나 state를 받으면 **업데이트** 된다. 이는 보통 상호작용에 대한 응답으로 발생합니다.
3. 화면에서 제거되면 컴포넌트가 **마운트 해제(언마운트)** 된다.

### Not useEffect

- 컴포넌트에 대해 생각하는 좋은 방법이지만 useEffect에 대해서는 생각하지 않는 것이 좋다.
- 각 useEffect를 컴포넌트의 생명주기와 독립적으로 생각해보자.
- Effect는 [외부 시스템을 현재 props 및 state에 동기화](https://react-ko.dev/learn/synchronizing-with-effects)하는 방법을 설명한다. 코드가 변경되면 이 동기화를 더 자주 또는 덜 자주 수행해야 합니다.

---

### **Perspectives on Component and useEffect**

```jsx
const serverUrl = 'https://localhost:1234';

function ChatRoom({ roomId /* "general" */ }) {

    useEffect(() => {
    const connection = createConnection(serverUrl, roomId); // Connects to the "general" room
    connection.connect();
    return () => {
      connection.disconnect(); // Disconnects from the "general" room
    };
  }, [roomId]);

  return <h1>Welcome to the {roomId} room!</h1>;
}

//if change roomId: general -> travel -> music
```

Co**mponent perspective**

`ChatRoom` 컴포넌트의 관점에서 일어난 모든 일을 요약해 보겠습니다:

1. `ChatRoom` mounted with `roomId` set to `"general"`
2. `ChatRoom` updated with `roomId` set to `"travel"`
3. `ChatRoom` updated with `roomId` set to `"music"`
4. `ChatRoom` unmounted
    
    **useEffect do**
    
    1. Your Effect connected to the `"general"` room
    2. Your Effect disconnected from the `"general"` room and connected to the `"travel"` room
    3. Your Effect disconnected from the `"travel"` room and connected to the `"music"` room
    4. Your Effect disconnected from the `"music"` room

**useEffect perspective**

이제 Effect 자체의 관점에서 무슨 일이 일어났는지 생각해 봅시다:

1. Your Effect connected to the `"general"` room (until it disconnected)
2. Your Effect connected to the `"travel"` room (until it disconnected)
3. Your Effect connected to the `"music"` room (until it disconnected)

### what you think about..

- 이전에는 컴포넌트의 관점에서 생각하여 useEffect를 “렌더링 후” 또는 “마운트 해제 전”과 같은 특정 시점에 실행되는 “콜백” 또는 “생명주기 이벤트”로 생각했지만, 이러한 사고 방식은 매우 복잡해지므로 피하는 것이 좋다고 권장한다.
- 따라서 **항상 한 번에 하나의 시작/중지 사이클에만 집중 해야 한다. 컴포넌트를 마운트, 업데이트 또는 마운트 해제하는 것 말고 동기화를 시작하는 방법과 중지하는 것에만 집중하면 된다.**
- 화면에 무엇이 표시되어야 하는지는 JSX 즉 ReactElement로 선언하면 [나머지는 React가 알아서 처리합니다](https://react-ko.dev/learn/reacting-to-input-with-state).

---

### **Each Effect represents a separate synchronization process**

⇒ 동기화와 관련 없는 것은 분리하여 작성한다.

- bad case

```jsx
function ChatRoom({ roomId }) {
  useEffect(() => {
    logVisit(roomId);
    const connection = createConnection(serverUrl, roomId);
    connection.connect();
    return () => {
      connection.disconnect();
    };
  }, [roomId]);
  // ...
}
```

- correct case

```jsx
function ChatRoom({ roomId }) {
  useEffect(() => {
    logVisit(roomId);
  }, [roomId]);

  useEffect(() => {
    const connection = createConnection(serverUrl, roomId);
    // ...
  }, [roomId]);
  // ...
}
```

---

### Not only props & state but also reactive State

- **컴포넌트 내부의 모든 값(컴포넌트 본문의 props, state, 변수 포함)은 반응형입니다. 모든 반응형 값은 다시 렌더링할 때 변경될 수 있으므로 반응형 값을 Effect의 의존성으로 포함시켜야 합니다.**
    
    ⇒ props와 state만 반응형 값인 것은 아니다. 이들로부터 계산하는 값들 역시 반응형입니다. 
    
    ⇒ props나 state가 변경되면 컴포넌트가 다시 렌더링되고 그로부터 계산된 값도 변경된다. 
    
    ⇒ 그렇기 때문에 Effect가 사용하는 컴포넌트 본문의 모든 변수는 Effect 의존성 목록에 있어야 합니다.
    

```jsx
function ChatRoom({ roomId, selectedServerUrl }) { // roomId is reactive
  const settings = useContext(SettingsContext); // settings is reactive
  const serverUrl = selectedServerUrl ?? settings.defaultServerUrl; // serverUrl is reactive
  useEffect(() => {
    const connection = createConnection(serverUrl, roomId); // Your Effect reads roomId and serverUrl
    connection.connect();
    return () => {
      connection.disconnect();
    };
  }, [roomId, serverUrl]); // So it needs to re-synchronize when either of them changes!
  // ...
}
```

⇒ 이 예제에서 `serverUrl`은 prop이나 state 변수가 아닙니다. 렌더링 중에 계산하는 일반 변수입니다. 하지만 렌더링 중에 계산되므로 리렌더링으로 인해 변경될 수 있습니다. 따라서 `serverUrl`은 반응형 변수입니다.

---

### **Can global or mutable values be dependencies?**

- 변이 가능한 값(전역 변수 포함)은 반응하지 않습니다
    
    ⇒ **location.pathname 과 같은 변이 가능한 값은 의존성이 될 수 없습니다.** 이 값은 변이 가능하므로 React 렌더링 데이터 흐름 **외부에서** 언제든지 바뀔 수 있습니다. 
    
    ⇒ 이 값을 변경해도 컴포넌트가 다시 렌더링되지 않습니다. 따라서 이를 의존성에 지정하더라도 React는 이 값이 변경될 때 Effect를 다시 동기화해야 하는지 알 수 없습니다. 
    
    ⇒ 또한 렌더링 도중(의존성을 계산할 때) 변경 가능한 데이터를 읽는 것은 [렌더링의 순수성](https://react-ko.dev/learn/keeping-components-pure)을 깨뜨리기 때문에 React의 규칙을 위반합니다. 대신, `useSyncExternalStore`를 사용하여 외부 변경 가능한 값을 읽고 구독해야 합니다.
    
    ⇒ **`ref.current`와 같이 변이 가능한 값 또는 이 값으로부터 읽은 것 역시 의존성이 될 수 없습니다.** `useRef`가 반환하는 ref 객체 자체는 의존성이 될 수 있지만, `current` 프로퍼티는 의도적으로 변이 가능합니다. 이를 통해 [리렌더링을 촉발하지 않고도 무언가를 추적](https://react-ko.dev/learn/referencing-values-with-refs)할 수 있습니다. 하지만 이를 변경하더라도 리렌더링을 촉발하지는 않기 때문에, 이는 반응형 값이 아니며, React는 이 값이 변경될 때 Effect를 다시 실행해야 할지 알 수 없습니다.

---

### Summary

- 컴포넌트는 마운트, 업데이트, 마운트 해제할 수 있습니다.
- 각 useEffect는 주변 컴포넌트와 별도의 생명주기를 가집니다.
- 각 useEffect는 *시작* 및 *중지* 할 수 있는 별도의 동기화 프로세스를 설명합니다.
- useEffect를 작성하고 읽을 때는 컴포넌트의 관점(마운트, 업데이트 또는 마운트 해제 방법)이 아니라 각 개별 Effect의 관점(동기화 시작 및 중지 방법)에서 생각해야 합니다.
- 컴포넌트 본문 내부에 선언된 값은 “반응형”입니다.
- 반응형 값은 시간이 지남에 따라 변경될 수 있으므로 useEffect를 다시 동기화해야 합니다.
- 린터는 useEffect 내부에서 사용된 모든 반응형 값이 의존성으로 지정되었는지 확인합니다.
- 린터에 의해 플래그가 지정된 모든 오류는 합법적인 오류입니다. 규칙을 위반하지 않도록 코드를 수정할 수 있는 방법은 항상 있습니다.