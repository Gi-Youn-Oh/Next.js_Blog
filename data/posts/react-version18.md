# React (v18) = Concurrency?

# 글에 앞서..

- 최근 CSR의 단점을 보완하기 위해서 SSR을 함께 사용하는 방식이 유행인데, Next.js (v13)로 블로그를 만들며 Server Component의 장점을 많이 느꼈는데 이를 가능하게 해준 React version 18 이후 변화점에 대해 짚고 넘어가고자 글을 작성하게 되었다 📝

# Concurrent Mode

- React 18 에서 중요한 포인트는 Concurrent이다.
- **일시정지, 재가동, 우선순위**
- 그렇다면 왜 동시성을 포인트로 잡고 개선을 했는지 살펴보자~!

## **Concurrency 동시성?**

- **Concurrency** (동시성)이란 두 개 이상의 task를 **동시에 지원하는 것**
- **parallelism** (평행성) 은 두 개 이상의 task를 **동시에 실행**할 수 있는 것
- 하지만 자바스크립트는 싱글 스레드로 동작하기 때문에 평행성은 불가능하다 !

<aside>
💡 프로그램을 독립적으로 실행되도록 여러 조각으로 나누어서 구조화!

</aside>

### 비동기 vs 동시성

- **비동기**는 결과를 기다리지 않고 바로 다음 작업을 실행할 수 있게 하는 방식, 보통 메인스레드에서 작업을 다른 스레드로 분산 처리 후 그 작업이 끝나길 기다리지 않고 다음 작업을 생성
- **동시성**는 싱글 코어(또는 멀티 코어)에서 멀티 스레드를 동작시키기 위한 방식으로, 멀티 태스킹을 위해 여러 개의 스레드가 번갈아 가면서 실행되는 방식

### 정리해보면

- 동시성은 여러 작업을 작은 단위로 나눈 뒤, 그들 간의 우선순위를 정하고 그에 따라 작업을 번갈아 수행하는 방법
- 서로 다른 작업들이 실제로 동시에 수행되는 것은 아니라, 작업 간의 전환이 매우 빠르게 이루어지면서 동시에 수행되는 것처럼 보이는 것
- 핀토스 때 스레드에 관해 학습한 내용 덕에 어렵지 않게 이해😎

---

# Fiber를 알아야…

### why?

- 리액트는 어떤 렌더 작업들이 우선되어야 하는지 전제할 수 있다.
- 리액트는 내부적인 구조 조정으로 성능을 위한 최적화를 하고 있고, 이를 가능하게 하기 위해 Fiber라는 것을 사용

### Fiber?

1. Virtual-DOM을 사용해 재조정에 사용되는 Fiber 알고리즘
2. 개별 작업의 단위인 Fiber 노드
3. 컴포넌트 및 컴포넌트의 정보를 포함한 자바스크립트 객체
4. CS 영역에서 가벼운 실행 스레드인 Fiber

```jsx
type Fiber = {
  // 인스턴스 관련 
  tag: WorkTag,
  key: null | string,
  type: any,

  // 가상 스택 관련 
  return: Fiber | null,
  child: Fiber | null,
  sibling: Fiber | null,

  // 이펙트 관련 
  flags: Flags,
  nextEffect: Fiber | null,
  firstEffect: Fiber | null,
  lastEffect: Fiber | null,
  alternate: Fiber | null,
|};
```

### 어떤 역할?

1. 비동기 렌더링
    - React Fiber는 렌더링 작업을 비 동기적으로 처리할 수 있다. 이전에는 렌더링 작업이 시작되면 브라우저가 차단되어 다른 작업을 수행할 수 없었지만, Fiber에서는 작업을 쪼개서 여러 프레임에 걸쳐 처리하므로 브라우저가 차단되지 않는다.
2. 우선순위 처리
    - Fiber는 작은 단위로 쪼개진 작업들을 우선순위에 따라 처리한다.
    - 우선순위가 높은 작업을 먼저 처리하여 반응성을 높인다.
3. 에러 처리
    - 이전 버전에서는 에러가 발생하면 전체 애플리케이션이 중단되었지만, Fiber에서는 에러 경계를 설정하여 일부 컴포넌트의 렌더링이 실패해도 전체 애플리케이션이 정상적으로 작동하도록 보장한다.
4. 서버 렌더링 향상

### **Before : Stack Reconciler 스택 재조정**

- Stack reconciler는 virtual DOM 트리를 비교하고 화면에 변경 사항을 푸시하는 이 모든 작업을 **동기적으로, 하나의 큰 테스크로 실행한다**. 이는 현 상태의 트리와 작업 중인 트리를 DFS 패턴으로 재귀적으로 탐색하며 굉장히 **깊은 콜 스택**을 만들게 된다. 이런 작업은 일시 중지되거나 취소될 수 없어서, 이 콜 스택이 전부 처리되기 전까지는 메인 스레드는 다른 작업을 할 수 없고, 앱은 일시적으로 무반응 상태가 되거나 버벅거리는 현상이 발생했다.

### After **: Fiber Reconciler**

- **incremental rendering**(렌더링 테스크에 우선순위를 매겨서 중요한 것을 먼저 처리하고 덜 중요한 것을 나중에 처리), 렌더링 작업을 잘게 쪼개어 여러 프레임에 걸쳐 실행할 수 있고, 특정 작업에 “우선순위”를 매겨 **작업의 작은 조각들을 concurrent하게** “일시 정지”, “재가동” 할 수 있게 해준다.  Fiber 트리에서는 각 노드가 return, sibling, child 포인터 값을 사용하여 단방향 링크드 리스트를 이룬다.
- 각 노드의 return, sibling, child 포인터를 사용해서 child가 있으면 child, child가 없으면 sibling, sibling이 없으면 return… 의 순으로 다음 fiber로 이동
- 각 fiber는 다음으로 처리해야 할 fiber를 가리키고 있기 때문에, 이 긴 일련의 작업이 중간에 멈춰도, 지금 작업 중인 fiber만 알고 있다면 돌아와서 같은 위치에서 작업을 이어가는 것이 가능하게 되는 것이다.
- 각 fiber는 이 과정에서 각자의 ‘변경 사항에 대한 정보 (effect)'를 들고 있고, 이를 DOM에 바로바로 반영하지 않고, 모아뒀다가 모든 fiber 탐색이 끝난 후, 마지막 commit 단계에서 한 번에 반영하기 때문에, reconciliation 작업이 commit 단계 전에 중단되어도 실제 렌더 된 화면에는 영향을 미치지 않는다.

---

# 1. CreateRoot()

## 1) 코드 변화

### v18 이전 버전

```jsx
import ReactDOM from 'react-dom';
import App from './App';

ReactDOM.render(<App />, document.getElementById('root'));
```

### v18 이후

```jsx
import ReactDOM from 'react-dom/client';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
```

## 2) Check Point

### Why?

- Concurrent 모드에서 더욱 효율적인 렌더링을 가능하게 하기 위해서
- "suspense" 를 지 원하며, 비동기적으로 로딩되는 데이터를 처리하는 데 더욱 유용해서
- 여러 개의 루트를 렌더링할 수 있도록 지원한다.

### Before ReactDOM.render()

- 이전 버전의 React에서는 **`ReactDOM.render()`**함수를 한 번만 호출하여 하나의 루트만 렌더링 할 수 있었다.
- 모든 변화가 있을 때마다 **`ReactDOM.render()`**함수를 호출하여 HTML root 요소를 파싱하고, 전체 DOM을 업데이트했었다. 이는 비효율적인 방식이며, 성능 저하를 초래할 수 있다.
- 즉 18 버전 이전의 React 에서는 루트가 되는 컨테이너에 변화가 없더라도 render 하기 위해서, 루트를 반드시 체크하고, 루트를 통과 했어야만 했다. 이 과정은 React 가 Virtual DOM을 사용하기 때문에 거쳐야 하는 작업이기 때문이다.

### After createRoot()

- **`createRoot()`**함수를 사용하여 생성한 루트는 실제 DOM에 마운트되기 전까지는 Virtual DOM에만 존재
- 변경된 부분만 업데이트하는 방식으로 작동하도록 하여 성능 개선
- unmount() 가능

## 3) hydrateRoot()

- 서버에서 렌더링 된 HTML 을 가져와 hydrate 해줄 때 사용
- 서버 렌더링 앱은 `createRoot`대신`hydrateRoot` 사용

```jsx
import './styles.css';
import { hydrateRoot } from 'react-dom/client';
import App from './App.js';

hydrateRoot(
  document.getElementById('root'),
  <App />
);
```

---

# 2. Auto Batching

### Before v18 이전에는 .. ?

- React Event Handler만이 state 업데이트를 Batching 처리했다.

### After v18 이후에는 .. ?

- React Event Handler뿐만 아니라 **promise, setTimeout 등 다양한 로직에서도 Batching 작업이 가능**하게 되었다.
- 모든 state 업데이트는, React 에서 발생하는 이벤트 내부의 업데이트와 동일한 방식으로 state 업데이트 들을 Batching 하여 여러 번 수행 했어야 했던 랜더링 과정을 단 한 번만 처리할 수 있게 해줬고, 이는 **리 랜더링 횟수를 최소화**하여, 애플리케이션의 성능 향상을 기대할 수 있게 되었다.
- 비동기 함수의 순서 보장 문제 해결

### **Batching 을 원하지 않는 경우..**

만약 Batching 을 원하지 않는 코드 (state 변경 후 즉시 DOM 으로 부터 값을 가져와야 하는 경우 등) 일 경우엔 `ReactDOM.flusySync()` 를 사용하면 state 업데이트를 진행할 때 Batching 하지 않고 업데이트를 진행할 수 있다.

```jsx
import {flushSync} from 'react-dom';

function handleClick() {
  flushSync(() => {
    setCount(prev => prev + 1);
  });
  flushSync(() => {
    setFlag(f => !f);
  });
}
```

### 변경 확인 예시 코드

```jsx
// 아래 두 업데이트 모두 배칭되어서 한 번만 렌더링
function handleClick() {
  setCount((prev) => prev + 1);
  setFlag((f) => !f);
}

// setTimeout 내에서 업데이트도 배칭되어 한번의 리렌더링을 하게된다.
setTimeout(() => {
  setCount((prev) => prev + 1);
  setFlag((f) => !f);
}, 1000);

// fetch api에서 또한 배칭되어 한번의 리렌더링을 하게된다.
fetch("api").then(() => {
  setCount((prev) => prev + 1);
  setFlag((f) => !f);
});
```

---

# 3. Transition

- 빠르게 ***업데이트되어야***하는 컴포넌트와 그렇지 않은 컴포넌트를 ***구별하여 의도적으로 작업을 지연시켜 UX 향상***
- 즉, **우선순위 부여**
- next.js에서 SSR ⇒ SSG 미리 빌딩 하는 방식과 유사한 둣

### Before

- state를 업데이트에 우선순위를 두는 것이 어렵다.
- 예를 들어 Throttling, Debounce 기법을 활용하여 업데이트의 우선순위를 설정할 수는 있지만, 두 방법 모두 원하지 않는 작업 시간이 발생 한다는 문제점이 발생했습니다.
- 또한 Throttling, Debounce을 활용하는 동안엔 어떤 컴포넌트는 업데이트에 반응을 (리랜더링) 하지 않는 문제가 있었다.

### After

- 의도된 방식으로 작업을 지연시켜 사용자와의 상호작용 및 UX 를 지속적으로 향상

### **Transition 예제**

**isPending**

- isPending 은 boolean 값이며, Transition이 활용 중 인지 알 수 있는 정보를 제공
- 백 그라운드에서 컴포넌트가 Rendering 되는 동안 유저가 페이지와 상호작용할 수 있도록 UI를 쉽게 설정할 수 있으며 이는 사용자들에게 지금 화면이 로딩 중이거나 업데이트 되고 있다는 정보를 쉽게 제공

```jsx
import { useState, useTransition } from "react";
import { getSearchList } from "./util";

export default function Search() {
  const [keyword, setKeyword] = useState("");
  const [result, setResult] = useState([]);

  const [isPending, startTransition] = useTransition({ timeoutMs: 3000 });

  const handleChange = (event) => {
    //input의 결과는 즉시 화면에 반영
    setKeyword(event.target.value);
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    //search의 result 는 즉시 화면에 즉시 반영되지 않아도 괜찮
    startTransition(() => {
      setResult(() => getSearchList(keyword, result));
    });

    setKeyword("");
  };

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <input value={keyword} onChange={handleChange} />
      </form>
      <div>
        <h3>Result</h3>
        {isPending ? <div>loading...</div> : null}
        <ul>
          {result.map((item, index) => (
            <li key={index}>{item}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
```

---

# 4. Suspense & SSR

### Suspense?

- 어떤 컴포넌트가 읽어야 하는 데이터가 아직 준비가 되지 않았다는 알림의 개념으로 이해하면 쉽다.
- 작업이 끝날 때까지 잠시 **중단시키고, 다른 컴포넌트를 먼저 렌더링**할 수 있다.

### why?

- 성공한 경우에만 집중할 수 있어서
- 로딩 상태와 에러 상태가 분리되어서
- 동기처럼 사용할 수 있어서

<aside>
💡 컴포넌트는 성공한 상태만을 다루고, 로딩 상태와 에러 상태는 외부에 위임함

</aside>

```jsx
<ErrorBoundary fallback={<MyErrorPage />}>
  <Suspense fallback={<Loader />}>
    <App />
  </Suspense>
</ErrorBoundary>;
```

- 컴포넌트를 사용할 때 그 컴포넌트를 위 코드처럼 Suspense로 감싸주면, 컴포넌트의 렌더링을 특정 작업 이후로 미루고, 그 작업이 끝날 때까지는 fallback 속성으로 넘긴 컴포넌트를 대신 보여줄 수 있다.
- 에러 상태는 ErrorBoundary가 componentDidCatch()로 처리합니다.
- React는 기본적으로 예외가 발생하면 해당 컴포넌트가 렌더링되지 않고 전체 애플리케이션이 중단되지만 **`componentDidCatch()`**를 사용하면 예외가 발생한 경우 컴포넌트가 그려지지 않는 대신 다른 UI를 보여줄 수 있다.

### 예시 코드

```
<Layout>
  <NavBar />
  <Suspense fallback={<Spinner />}>
    <Sidebar />
  </Suspense>
  <RightPane>
    <Post />
    <Suspense fallback={<Spinner />}>
      <Comments />
    </Suspense>
  </RightPane>
</Layout>
```

![image](https://user-images.githubusercontent.com/109953972/232880125-85f57854-2063-4d35-a6ba-62d1a3eab96b.png)

### Selective hydrating

- 만약 사용자가 다른 우선순위의 컴포넌트를 hydrating하는 도중 `<Sidebar />` 컴포넌트의 클릭 이벤트를 발생시킨다면 React는 `<Sidebar />` 의 **우선순위를 높여 먼저 hydration을 진행**합니다.

![image](https://user-images.githubusercontent.com/109953972/232880144-1664df93-52d4-4ee3-8e2c-a1b47b926fc7.png)

## Data Fetching

### Before

- 모든 정보를 부모 컴포넌트에서 하나의 거대한 API로 호출하여 자식으로 내려주는 방식 (waterfall)
    - ⇒ 부모와 자식 컴포넌트가 커플링 현상이 높아지고 유지보수가 어려워지게 된다.
- 컴포넌트에 필요한 API를 각 컴포넌트에서 호출한다.
    - ⇒ 렌더링 될 때 필요한 데이터만 가져와 보여줄 수 있다는 장점이 있지만 high latency를 가진 클라이언트부터의 서버 요청은 늘어나게 된다.
    - 부모 컴포넌트는 렌더링 된 후 필요한 데이터를 받아오기 시작하고 이 과정이 끝나기 전까지 자식 컴포넌트의 렌더링과 API 호출 또한 지연된다.

![image](https://user-images.githubusercontent.com/109953972/232880152-aaf7b76f-b199-4e66-882d-d5294efd0d22.png)

### After

- 서버에서 Render를 수행하기 때문에 API를 통한 데이터 요청의 latency를 줄일 수 있다.
- 클라이언트에서의 연속된 API 호출을 제거하여 client-server waterfall를 막을 수 있다.
- React(v18)부터는 `pipeToNodeWritable()`를 활용해 HTML코드를 작은 청크로 나눈 후 보내줄 수 있다.

![image](https://user-images.githubusercontent.com/109953972/232880172-a34b1712-50b6-4668-a34d-f260ba08b0dd.png)

## 결론

- React v18 업데이트 이후 동시성 관련 많은 개선 사항이 있었으며, 불필요한 리렌더링 최소화 및 Server Component활용 장점이 많아졌다.