# React-deep-dive-7

## 2-3. useEffect in React.dev(4)

### **Removing Effect Dependencies**

⇒ Effect를 작성하면 린터는 Effect의 의존성 목록에 Effect가 읽는 모든 반응형 값(예: props 및 state)을 포함했는지 확인해준다. 불필요한 의존성으로 인해 Effect가 너무 자주 실행되거나 무한 루프를 생성할 수도 있으므로 이 가이드를 따라 Effect에서 불필요한 의존성을 검토하고 제거해야 한다.

### Progress

1. 먼저 Effect의 코드 또는 반응형 값 선언 방식을 **변경**합니다.
    - reactive 하지 않게 외부에 선언 등
2. 그런 다음, **변경한 코드에 맞게** 의존성을 조정합니다.
    - reactive 하지 않은 변수 제거
3. 의존성 목록이 마음에 들지 않으면 **첫 번째 단계로 돌아가서** 코드를 다시 변경합니다. (그리고 코드를 다시 변경하세요).
    - 린터 확인 후 재조정

### Check

- 다른 조건에서 Effect의 *다른 부분*을 다시 실행하고 싶을 수도 있습니다.
- 일부 의존성의 변경에 “반응”하지 않고 “최신 값”만 읽고 싶을 수도 있습니다.
- 의존성이 객체나 함수일때 *의도치 않게* 너무 자주 변경될 수 있습니다.
⇒ 자바스크립트의 동등비교의 불완전성..

---

### **Are you reading some state to calculate the next state?**

⇒ 이 Effect는 새 메시지가 도착할 때마다 새로 생성된 배열로 `messages` state 변수를 업데이트합니다:

- `messages` 변수를 사용하여 모든 기존 메시지로 시작하는 [새 배열을 생성](https://react-ko.dev/learn/updating-arrays-in-state)하고 마지막에 새 메시지를 추가합니다. 하지만 `messages`는 useEffect에서 읽는 반응형 값이므로 의존성이어야 합니다.

⇒ 메시지를 수신할 때마다 `setMessages()`는 컴포넌트가 수신된 메시지를 포함하는 새 `messages` 배열로 리렌더링하도록 합니다. 하지만 이 Effect는 이제 `messages`에 따라 달라지므로 Effect도 다시 동기화됩니다. 따라서 새 메시지가 올 때마다 채팅이 다시 연결됩니다. 사용자가 원하지 않을 것입니다!

```jsx
function ChatRoom({ roomId }) {
  const [messages, setMessages] = useState([]);
  useEffect(() => {
    const connection = createConnection();
    connection.connect();
    connection.on('message', (receivedMessage) => {
      setMessages([...messages, receivedMessage]);
    });
    return () => connection.disconnect();
  }, [roomId, messages]); // ✅ All dependencies declared
  // ...
```

⇒ 이 문제를 해결하려면 Effect 내에서 `messages`를 읽지 마세요. 대신 [업데이터 함수](https://react-ko.dev/reference/react/useState#updating-state-based-on-the-previous-state)를 `setMessages`에 전달

⇒ **이제 Effect가 `messages` 변수를 전혀 읽지 않는 것을 알 수 있습니다.** `msgs => [...msgs, receivedMessage]`와 같은 업데이터 함수만 전달하면 됩니다. React는 [업데이터 함수를 대기열에 넣고](https://react-ko.dev/learn/queueing-a-series-of-state-updates) 다음 렌더링 중에 `msgs` 인수를 제공합니다. 이 때문에 useEffect 자체는 더 이상 `messages`에 의존할 필요가 없습니다. 이 수정으로 인해 채팅 메시지를 수신해도 더 이상 채팅이 다시 연결되지 않습니다.

```jsx
function ChatRoom({ roomId }) {
  const [messages, setMessages] = useState([]);
  useEffect(() => {
    const connection = createConnection();
    connection.connect();
    connection.on('message', (receivedMessage) => {
      setMessages(msgs => [...msgs, receivedMessage]);
    });
    return () => connection.disconnect();
  }, [roomId]); // ✅ All dependencies declared
  // ...
```

---

### **Does some reactive value change unintentionally?**

- bad case

```jsx
function ChatRoom({ roomId }) {
  // ...
  const options = {
    serverUrl: serverUrl,
    roomId: roomId
  };

// ...
  useEffect(() => {
    const connection = createConnection(options);
    connection.connect();
    return () => connection.disconnect();
  }, [options]); // ✅ All dependencies declared
  // ...
```

⇒ `ChatRoom` 컴포넌트를 리렌더링할 때마다 새로운 `options` 객체가 처음부터 새로 생성됩니다. React는 `options` 객체가 마지막 렌더링 중에 생성된 `options` 객체와 *다른 객체*임을 인식합니다. 그렇기 때문에 (`options`에 따라 달라지는) Effect를 다시 동기화하고 사용자가 입력할 때 채팅이 다시 연결됩니다.

**이 문제는 객체와 함수에만 영향을 줍니다. JavaScript에서는 새로 생성된 객체와 함수가 다른 모든 객체와 구별되는 것으로 간주됩니다. 그 안의 내용이 동일할 수 있다는 것은 중요하지 않습니다!**

```jsx
// During the first render
const options1 = { serverUrl: 'https://localhost:1234', roomId: 'music' };

// During the next render
const options2 = { serverUrl: 'https://localhost:1234', roomId: 'music' };

// These are two different objects!
console.log(Object.is(options1, options2)); // false
```

⇒ 객체 및 함수 의존성으로 인해 Effect가 필요 이상으로 자주 재동기화될 수 있습니다.

- correct case(1) 외부로 추출

```jsx
const options = {
  serverUrl: 'https://localhost:1234',
  roomId: 'music'
};

function ChatRoom() {
  const [message, setMessage] = useState('');

  useEffect(() => {
    const connection = createConnection(options);
    connection.connect();
    return () => connection.disconnect();
  }, []); // ✅ All dependencies declared
  // ...
```

- 함수의 경우도 마찬가지

```jsx
function createOptions() {
  return {
    serverUrl: 'https://localhost:1234',
    roomId: 'music'
  };
}

function ChatRoom() {
  const [message, setMessage] = useState('');

  useEffect(() => {
    const options = createOptions();
    const connection = createConnection();
    connection.connect();
    return () => connection.disconnect();
  }, []); // ✅ All dependencies declared
  // ...
```

- correct case(2) 내부로 이동

```jsx
const serverUrl = 'https://localhost:1234';

function ChatRoom({ roomId }) {
  const [message, setMessage] = useState('');

  useEffect(() => {
    const options = {
      serverUrl: serverUrl,
      roomId: roomId
    };
    const connection = createConnection(options);
    connection.connect();
    return () => connection.disconnect();
  }, [roomId]); // ✅ All dependencies declared
  // ...
```

⇒ 이제 `options`이 Effect 내부에서 선언되었으므로 더 이상 Effect의 의존성이 아닙니다. 대신 Effect에서 사용하는 유일한 반응형 값은 `roomId`입니다. 

⇒ `roomId`는 객체나 함수가 아니기 때문에 의도치 않게 달라지지 않을 것이라고 확신할 수 있습니다. JavaScript에서 숫자와 문자열은 그 내용에 따라 비교됩니다

```jsx
// During the first render
const roomId1 = 'music';

// During the next render
const roomId2 = 'music';

// These two strings are the same!
console.log(Object.is(roomId1, roomId2)); // true
```

### **Read primitive values from objects**

- bad case

```jsx
function ChatRoom({ options }) {
  const [message, setMessage] = useState('');

  useEffect(() => {
    const connection = createConnection(options);
    connection.connect();
    return () => connection.disconnect();
  }, [options]); // ✅ All dependencies declared
  // ...
```

```jsx
// 렌더링 중에 부모 컴포넌트가 객체를 생성한다는 점이 위험합니다
<ChatRoom
  roomId={roomId}
  options={{
    serverUrl: serverUrl,
    roomId: roomId
  }}
/>
```

⇒ 이렇게 하면 부모 컴포넌트가 리렌더링할 때마다 Effect가 다시 연결됩니다. 이 문제를 해결하려면 Effect 외부의 객체에서 정보를 읽고 객체 및 함수 의존성을 피해야 한다.

- correct case

```jsx
function ChatRoom({ options }) {
  const [message, setMessage] = useState('');

  const { roomId, serverUrl } = options;
  useEffect(() => {
    const connection = createConnection({
      roomId: roomId,
      serverUrl: serverUrl
    });
    connection.connect();
    return () => connection.disconnect();
  }, [roomId, serverUrl]); // ✅ All dependencies declared
  // ...
```

⇒ 로직은 약간 반복적입니다 (Effect 외부의 객체에서 일부 값을 읽은 다음 Effect 내부에 동일한 값을 가진 객체를 만듭니다). 하지만 Effect가 실제로 어떤 정보에 의존하는지 매우 명확하게 알 수 있습니다. 부모 컴포넌트에 의해 의도치 않게 객체가 다시 생성된 경우 채팅이 다시 연결되지 않습니다. 하지만 `options.roomId` 또는 `options.serverUrl`이 실제로 다른 경우 채팅이 다시 연결됩니다.

### **Calculate primitive values from functions**

- bad case

```jsx
<ChatRoom
  roomId={roomId}
  getOptions={() => {
    return {
      serverUrl: serverUrl,
      roomId: roomId
    };
  }}
/>
```

⇒ 의존성을 만들지 않으려면 (그리고 리렌더링할 때 다시 연결되는 것을 방지하려면) Effect 외부에서 호출하세요. 이렇게 하면 객체가 아니며 Effect 내부에서 읽을 수 있는 `roomId` 및 `serverUrl` 값을 얻을 수 있습니다:

```jsx
function ChatRoom({ getOptions }) {
  const [message, setMessage] = useState('');

  const { roomId, serverUrl } = getOptions();
  useEffect(() => {
    const connection = createConnection({
      roomId: roomId,
      serverUrl: serverUrl
    });
    connection.connect();
    return () => connection.disconnect();
  }, [roomId, serverUrl]); // ✅ All dependencies declared
  // ...
```

---

### Summary

- 의존성은 항상 코드와 일치해야 합니다.
- 의존성이 마음에 들지 않으면 코드를 수정해야 합니다.
- 린터를 억제하면 매우 혼란스러운 버그가 발생하므로 항상 피해야 합니다.
- 의존성을 제거하려면 해당 의존성이 필요하지 않다는 것을 린터에게 “증명”해야 합니다.
- 특정 상호작용에 대한 응답으로 일부 코드가 실행되어야 하는 경우 해당 코드를 이벤트 핸들러로 이동하세요.
- Effect의 다른 부분이 다른 이유로 다시 실행되어야 하는 경우 여러 개의 Effect로 분할하세요.
- 이전 state를 기반으로 일부 state를 업데이트하려면 업데이터 함수를 전달하세요.
- “반응”하지 않고 최신 값을 읽으려면 Effect에서 Effect Event를 추출하세요.
- JavaScript에서 객체와 함수는 서로 다른 시간에 생성된 경우 서로 다른 것으로 간주됩니다.
- 객체와 함수의 의존성을 피하세요. 컴포넌트 외부나 Effect 내부로 이동하세요.

---

### Extra

첫 글에서 React에서는 object.is() 개선해 얕은 비교까지 가능한 shallowEqual함수를 사용한다고 했는데, 공식문서에서는 object.is()를 사용한다고 되어 있다. 

shallowEqual은 컴포넌트에 한해서 사용하며(컴포넌트에서 사용하는 이유는 props를 객체로 관리한다는 점에서), useEffect의 dependency array등 대부분에서는 object.is()를 사용한다고 한다.