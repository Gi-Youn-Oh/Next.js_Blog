# React-deep-dive-4

## 2-3. useEffect in React.dev

### 1. Concept of useEffect

<dfn>
Some components need to <b>synchronize with external systems.</b> For example, you might want to control a non-React component based on the React state, set up a server connection, or send an analytics log when a component appears on the screen. <b>Effects let you run some code after rendering so that you can synchronize your component with some system outside of React</b>.
</dfn>

- useEffect는 렌더링 이후에 리액트 외부의 시스템과 동기화 할 수 있게 해준다.
    
    ⇒ React state기반의 제어 이외에 서버 데이터 연결 설정이나 렌더링 이후 일부 코드를 실행 가능하게 하여 **동기화** 할 수 있다.
    
    1. 기본적으로 useEffect는 모든 렌더링 후에 실행 된다.
    2. useEffect는 React의 생명주기 이다 → (X) 리액트의 생명주기에 동기화 시켜준다. 즉, 컴포넌트의 생명주기와 useEffect의 생명주기는 별개이다.
    3. 따라서 useEffect는 외부 서비스와 동기화 시키거나 동기화를 끊거나 둘 중 하나이다.

    참고: useEffect 개발 환경에서는 디버깅과 로직 체크를 위해 2번씩 실행된다.

---

### 2. Why useEffect?

**Component = rendering code + event handlers**

 ⇒ React에서 Rendering Code는 props, state를 기반으로 화면에 표시할 JSX를 반환 즉 React Element를 반환한다. 결국 순수한 UI 로직이다.

 ⇒ UI 이외에 컴포넌트 내부에는 입력을 받거나, http요청을 하거나 routing등의 특정 사용자 작업으로 발생하는 side Effect를 포함하는 Event handler가 있다.

 ⇒ 하지만 화면에 표시될 때마다 서버에 연결을 해야하는 컴포넌트 같은 경우 (서버 연결은 side Effect에 해당함) 렌더링중에 발생할 수 없음 

 ⇒ 따라서 렌더링 이후에 동기화 시키는 것이 필요

**render → commit → useEffect(동기화)**

### 2-1. POC

**1) Rendering code**

- **Rendering code** (introduced in [Describing the UI](https://react-ko.dev/learn/describing-the-ui)) lives at the top level of your component. This is where you take the props and state, transform them, and return the JSX you want to see on the screen. [Rendering code must be pure.](https://react-ko.dev/learn/keeping-components-pure) Like a math formula, it should only *calculate* the result, but not do anything else.
    
    ⇒ **렌더링 코드는** props와 state를 가져와 변환하고 화면에 표시할 JSX를 반환합니다. 렌더링 코드는 순수해야한다. 결과만 계산할 뿐 다른 작업은 수행하지 않습니다.
    

**2) Event handlers**

- **Event handlers**(introduced in [Adding Interactivity](https://react-ko.dev/learn/adding-interactivity)) are nested functions inside your components that *do* things rather than just calculate them. An event handler might update an input field, submit an HTTP POST request to buy a product, or navigate the user to another screen. Event handlers contain [“side effects”](https://en.wikipedia.org/wiki/Side_effect_(computer_science)) (they change the program’s state) caused by a specific user action (for example, a button click or typing).
⇒ **이벤트 핸들러**는 컴포넌트 내부에 있는 중첩된 함수로, 별도의 작업을 수행
    - 입력 필드를 업데이트하거나
    - HTTP POST요청을 제출하여 제품을 구매하거나
    - 사용자를 다른 화면으로 이동할 수 있다.
    - 이벤트 핸들러에는 특정 사용자 작업(예:버튼 클릭 또는 입력)으로 인해 발생하는 [“사이드 이펙트”](https://en.wikipedia.org/wiki/Side_effect_(computer_science))(state를 변경하는)가 포함되어 있습니다.

**3) Background**

- Sometimes this isn’t enough. Consider a `ChatRoom` component that must connect to the chat server whenever it’s visible on the screen. Connecting to a server is not a pure calculation (it’s a side effect) so it can’t happen during rendering. However, there is no single particular event like a click that causes `ChatRoom` to be displayed.
⇒ 때로는 이것만으로는 부족할 수 있다. 화면에 표시될 때마다 채팅 서버에 연결해야 하는 `ChatRoom` 컴포넌트를 고려해 봅시다. 서버에 연결하는 것은 순수한 계산이 아니므로(사이드 이펙트) 렌더링 중에 발생할 수 없습니다. 그러나 `ChatRoom` 표시를 촉발하는 클릭과 같은 특정한 단일 이벤트는 없습니다.

**4) useEffect** 

- ***Effects* let you specify side effects that are caused by rendering itself, rather than by a particular event.** Sending a message in the chat is an *event* because it is directly caused by the user clicking a specific button. However, setting up a server connection is an *Effect* because it should happen no matter which interaction caused the component to appear. Effects run at the end of a [commit](https://react-ko.dev/learn/render-and-commit) after the screen updates. This is a good time to synchronize the React components with some external system (like network or a third-party library).<br>
⇒ ***Effect*를 사용하면 특정 이벤트가 아닌 렌더링 자체로 인해 발생하는 사이드 이펙트를 명시할 수 있습니다.** 채팅에서 메시지를 보내는 것은 사용자가 특정 버튼을 클릭함으로써 직접적으로 발생하기 때문에 이벤트입니다. 그러나 서버 연결을 설정하는 것은 컴포넌트를 표시하게 만든 상호작용에 관계없이 발생해야 하기 때문에 하나의 Effect입니다. Effect는 화면 업데이트 후 [커밋](https://react-ko.dev/learn/render-and-commit)이 끝날 때 실행됩니다. 이 때가 React 컴포넌트를 일부 외부 시스템(네트워크 또는 서드파티 라이브러리와 같은)과 동기화하기에 좋은 시기입니다.

---

### 3. When to use useEffect?

=> 그렇다면 언제 useEffect를 사용해야할까?
- *외부* 시스템과 동기화하는 데에 사용 ( 브라우저 API, 서드파티 위젯, 네트워크 등 )
- 다른 state를 기반으로 일부 state만을 조정하는 경우 사용 지양
    -> 가장 많이 하는 실수 중 하나가 state를 조정하기 위해서 useEffect를 남용하는 것..

**Basic use**

⇒ 아래 코드는 다음 사진과 같은 에러를 발생한다.

- bad case

```jsx
import { useState, useRef, useEffect } from 'react';

function VideoPlayer({ src, isPlaying }) {
  const ref = useRef(null);

  if (isPlaying) {
    ref.current.play();  // Calling these while rendering isn't allowed.
  } else {
    ref.current.pause(); // Also, this crashes.
  }

  return <video ref={ref} src={src} loop playsInline />;
}

export default function App() {
  const [isPlaying, setIsPlaying] = useState(false);
  return (
    <>
      <button onClick={() => setIsPlaying(!isPlaying)}>
        {isPlaying ? 'Pause' : 'Play'}
      </button>
      <VideoPlayer
        isPlaying={isPlaying}
        src="https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4"
      />
    </>
  );
}
```

![image](https://github.com/Gi-Youn-Oh/Next.js_Blog/assets/109953972/8d30f0a5-fc9a-47cf-a833-a43324a4d243)

- error?
⇒ 이 코드가 올바르지 않은 이유는 렌더링 중에 DOM 노드로 무언가를 시도하기 때문, React에서 [렌더링은 JSX의 순수한 계산이어야](https://react-ko.dev/learn/keeping-components-pure) 하며 DOM 수정과 같은 사이드 이펙트를 포함해서는 안됩니다.
    
    ⇒ 더구나 `VideoPlayer`가 처음 호출될 때 DOM은 아직 존재하지 않는다. React는 JSX를 반환하기 전까지는 어떤 DOM을 생성할지 모르기 때문입니다. `play()`나 `pause()`를 호출할 DOM 노드가 아직 없는 상태입니다.
    
    ⇒ **사이드 이펙트를 `useEffect`로 감싸 렌더링 계산 밖으로 옮기면 된다.**
    

- correct case

```jsx
import { useState, useRef, useEffect } from 'react';

function VideoPlayer({ src, isPlaying }) {
  const ref = useRef(null);

  useEffect(() => {
    if (isPlaying) {
      ref.current.play();
    } else {
      ref.current.pause();
    }
  },[]);

  return <video ref={ref} src={src} loop playsInline />;
}

export default function App() {
  const [isPlaying, setIsPlaying] = useState(false);
  return (
    <>
      <button onClick={() => setIsPlaying(!isPlaying)}>
        {isPlaying ? 'Pause' : 'Play'}
      </button>
      <VideoPlayer
        isPlaying={isPlaying}
        src="https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4"
      />
    </>
  );
}
```

⇒ 이 예제에서 React state에 동기화한 “외부 시스템”은 브라우저 미디어 API였습니다.

---

### 4. Caution

<dfn>
By default, Effects run after every render. This is why code like this will produce an infinite loop:
</dfn>
<b>기본적으로 Effect는 매번 렌더링 후에 실행됩니다. 그렇기 때문에 다음과 같은 코드는 무한 루프를 생성합니다:</b>

```jsx
const [count, setCount] = useState(0);

useEffect(() => {  setCount(count + 1);});
```

⇒ Effect는 렌더링의 *결과*로 실행됩니다. state를 설정하면 렌더링을 *촉발*합니다. Effect에서 즉시 state를 설정하는 것은 전원 콘센트를 꽂는 것과 같습니다. Effect가 실행되고, state를 설정하면 다시 렌더링이 발생하고, 다시 렌더링이 발생하면 Effect가 실행되고, 다시 state를 설정하면 또 다시 렌더링이 발생하는 식입니다.

⇒ Effect는 보통 컴포넌트를 외부 시스템과 동기화해야 합니다. 외부 시스템이 없고 다른 state를 기반으로 일부 state만 조정하려는 경우 [Effect가 필요하지 않을 수도 있습니다.](https://react-ko.dev/learn/you-might-not-need-an-effect)

```jsx
useEffect(() => {
  // This runs after every render
  // 렌더시마다 실행됩니다.
});

useEffect(() => {
  // This runs only on mount (when the component appears)
  // 오직 마운트시(컴포넌트가 나타날 때)에만 실행됩니다.
}, []);

useEffect(() => {
  // This runs on mount *and also* if either a or b have changed since the last render
  // 마운트시 뿐만 아니라 a 또는 b가 직전 렌더와 달라졌을 때에도 실행됩니다.
}, [a, b]);
```

---

### 5. Examples

1. **Subscribing to events**
    - useEffect가 무언가를 구독하는 경우, 클린업 함수는 구독을 취소해야 한다.

```jsx
useEffect(() => {
  function handleScroll(e) {
    console.log(window.scrollX, window.scrollY);
  }
  window.addEventListener('scroll', handleScroll);
  return (
```

2. **Triggering animations**

- useEffect가 무언가를 애니메이션하는 경우 클린업 함수는 애니메이션을 초기값으로 재설정해야 한다.

```jsx
useEffect(() => {
  const node = ref.current;
  node.style.opacity = 1; // Trigger the animation
                          // 애니메이션 촉발
  return () => {
    node.style.opacity = 0; // Reset to the initial value
                            // 초기값으로 재설정
  };
}, []);
```

3. **Fetching data** 
    - Effect가 무언가를 페치하면 클린업 함수는 [페치를 중단](https://developer.mozilla.org/en-US/docs/Web/API/AbortController) 하거나 그 결과를 무시해야 한다.
        
        ⇒ 이미 발생한 네트워크 요청을 “실행 취소”할 수는 없으므로, 대신 클린업 함수에서 더 이상 관련이 없는 페치가 애플리케이션에 계속 영향을 미치지 않도록 해야 합니다. 만약 userId가 'Alice'에서 'Bob'으로 변경되면 클린업은 'Alice' 응답이 'Bob' 이후에 도착하더라도 이를 무시하도록 합니다.
        
    ```jsx
    useEffect(() => {
        let ignore = false;
    
        async function startFetching() {
        const json = await fetchTodos(userId);
        if (!ignore) {
            setTodos(json);
        }
        }
    
        startFetching();
    
        return () => {
        ignore = true;
        };
    }, [userId]);
    ```
        
    - 인지사항 (useEffect 내부에서 data fetching 시)
        - useEffects는 서버에서 실행되지 않는다. 즉, 초기 서버에서 렌더링되는 HTML에는 데이터가 없는 로딩 state만 포함된 상태, 클라이언트에서 모든JavaScript를 다운로드하고 앱을 렌더링하고 나서야 비로소 데이터를 로드한다.
        - useEffect에서 직접 페치하면 “네트워크 워터폴”이 만들어지기 쉽습니다. 상위 컴포넌트를 렌더링하면, 상위 컴포넌트가 일부 데이터를 페치하고, 하위 컴포넌트를 렌더링한 다음, 다시 하위 컴포넌트의 데이터를 페치하기 시작합니다. 네트워크가 매우 빠르지 않다면, 모든 데이터를 병렬로 페치하는 것보다 훨씬 느립니다.
        - 직접 페치하는 것은 일반적으로 데이터를 미리 로드하거나 캐시하지 않음을 의미한다. 예를 들어, 컴포넌트가 마운트 해제되었다가 다시 마운트되면, 데이터를 다시 Fetch한다.
        
        ⇒ 따라서 React Query, useSWR, React Router등과 같은 효율적이면서 클라이언트 캐싱을 사용하는 라이브러리 or 프레임워크 들을 권장한다.

---

### 6. Not useEffect

1. **application starts**
    - 일부 로직은 애플리케이션이 시작될 때 한 번만 실행되어야 한다 → 이런 로직은 컴포넌트 외부에 넣는다.

    ```jsx
    if (typeof window !== 'undefined') { // Check if we're running in the browser.
                                        // 실행환경이 브라우저인지 여부 확인
    checkAuthToken();
    loadDataFromLocalStorage();
    }

    function App() {
    // ...
    }

    This guarantees that such logic only runs once after the browser loads the page.
    이렇게 하면 위 로직은 브라우저가 페이지를 로드한 후 한 번만 실행됩니다.
    ```

2. **Just Event (ex.Buying a product)**
    - 구매는 렌더링으로 인한 것이 아닙니다. 특정 상호 작용으로 인해 발생합니다. 사용자가 버튼을 누를 때만 실행되어야 합니다. **Effect를 삭제하고 `/api/buy` 요청을 구매 버튼 이벤트 핸들러로 작성하자.**
    - bad case
        
    ```jsx
    useEffect(() => {
        // 🔴 Wrong: This Effect fires twice in development, exposing a problem in the code.
        // 🔴 틀렸습니다: 이 Effect는 개발모드에서 두 번 실행되며, 문제를 일으킵니다.
        fetch('/api/buy', { method: 'POST' });
    }, []);
    ```
        
    - correct case

---

### 7. Process (Component render with useEffect)

**Example Component**

```jsx
export default function ChatRoom({ roomId }) {
  useEffect(() => {
    const connection = createConnection(roomId);
    connection.connect();
    return () => connection.disconnect();
  }, [roomId]);

  return <h1>Welcome to {roomId}!</h1>;
}
```

1. **Initial render**
    
    1-1.  사용자가 `<ChatRoom roomId="general" />`을 방문합니다. `roomId`를 `'general'`로 임의 설정
    
    ```jsx
    // JSX for the first render (roomId = "general")
      // 첫번째 렌더링시의 JSX (roomId = "general")
      return <h1>Welcome to general!</h1>;
    ```
    
    1-2. useEffect는 렌더링 출력의 일부*이기도* 합니다. (useEffect도 hook이다.)
    
    - React는 `'general'` 대화방으로 연결되는 이 Effect를 실행합니다.
    
    ```jsx
    // Effect for the first render (roomId = "general")
      // 첫번째 렌더링시의 JSX (roomId = "general")
      () => {
        const connection = createConnection('general');
        connection.connect();
        return () => connection.disconnect();
      },
      // Dependencies for the first render (roomId = "general")
      // 첫번째 렌더링시의 의존성 (roomId = "general")
      ['general']
    ```
    
2. **Re-render with same dependencies**
    
    2-1. 다시 렌더링된다고 가정, JSX 출력은 동일
    
    - React는 렌더링 출력이 변경되지 않았다고 판단하여 DOM을 업데이트하지 않습니다.
    
    ```jsx
    // JSX for the second render (roomId = "general")
      // 두번째 렌더링시의 JSX (roomId = "general")
      return <h1>Welcome to general!</h1>;
    ```
    
    2-2. 두 번째 렌더링의 useEffect
    
    - **모든 의존성이 동일하기 때문에 React는 두 번째 렌더링의 Effect를 *무시*합니다.**
    
    ```jsx
    // Effect for the second render (roomId = "general")
      // 두번째 렌더링시의 JSX (roomId = "general")
      () => {
        const connection = createConnection('general');
        connection.connect();
        return () => connection.disconnect();
      },
      // Dependencies for the second render (roomId = "general")
      // 두번째 렌더링시의 의존성 (roomId = "general")
      ['general']
    ```
    

3. **Re-render with different dependencies**
    
    3-1. `<ChatRoom roomId="travel" />`을 방문 가정. 이번에는 컴포넌트가 다른 JSX를 반환합니다
    
    - React는 DOM을 업데이트하여 `"Welcome to general"`을 `"Welcome to travel"`로 변경합니다
    
    ```jsx
    // JSX for the third render (roomId = "travel")
      // 세번째 렌더링시의 JSX (roomId = "travel")
      return <h1>Welcome to travel!</h1>;
    ```
    
    3-2. useEffect 
    
    - React는 세 번째 렌더링의 `['travel']`을 두 번째 렌더링의 `['general']`과 비교
    - **React가 세 번째 렌더링에서 Effect를 적용하려면 *먼저* 실행된 마지막 Effect를 정리해야 한다 → 두 번째 렌더링은 skip했으므로 첫 번째 렌더링의 useEffect를 정리한다. (clean-up ⇒ disconnect())**
    - 그 후 세 번째 useEffect 실행 (connect → travel)
    
    ```jsx
    // Effect for the third render (roomId = "travel")
      // 세번째 렌더링시의 JSX (roomId = "travel")
      () => {
        const connection = createConnection('travel');
        connection.connect();
        return () => connection.disconnect();
      },
      // Dependencies for the third render (roomId = "travel")
      // 세번째 렌더링시의 의존성 (roomId = "travel")
      ['travel']
    ```
    
4. **Unmount**
    - 컴포넌트 unmount 시 마지막 clean-up 함수 실행 (disconnect → travel)

---

### Summary

- 이벤트와 달리 useEffect는 특정 상호 작용이 아닌 렌더링 자체에 의해 발생한다.
    - **일반적인 Event와 useEffect를 구분하여 잘 사용해야 한다.**
- Effect를 사용하면 일부 외부 시스템(서드파티 API, 네트워크 등)과 컴포넌트를 **동기화할 수 있다.**
- 기본적으로 **useEffect는 모든 렌더링 후에 실행된다**(초기 렌더링 포함).
- React는 모든 의존성이 마지막 렌더링 시점과 동일한 값을 갖는 경우 useEffect를 건너뛴다.
- Strict 모드에서 React는 컴포넌트를 두 번 마운트하여(개발 중인 경우에만!) useEffect를 스트레스 테스트한다.
    - 개발환경에서 두번 실행한다고 당황할 필요가 없다.
- 이벤트를 구독할 경우, clean-up함수를 반드시 작성해 주어야 한다.
- React는 다음 useEffect가 실행되기 전 및 마운트 해제 시점에 클린업 함수를 호출한다.
    - useEffect는 차례대로 이루어진다.

---

### 8. Extra

- useEffect의 실행은 리렌더링 이후에 발생하며, useEffect 자체가 실행되더라도 컴포넌트의 리렌더링이 발생하지 않을 수 있다.
    
    ⇒ 따라서, useEffect의 실행이 컴포넌트의 리렌더링을 일으키는 것은 아니며, 의존성 배열과 useEffect 내의 로직에 따라 조절됩니다. 컴포넌트의 리렌더링은 주로 상태(state) 또는 속성(props)의 변경에 의해 트리거 된다.
    
    ```jsx
    useEffect(() => {
      console.log('Effect ran');
      // 어떤 상태도 변경하지 않음
    }, [someDependency]);
    
    useEffect(() => {
      console.log('Effect ran on mount');
    }, []);
    
    useEffect(() => {
      console.log('Effect ran on every render');
    });
    ```