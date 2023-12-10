# 중간 점검

<dfn>
지금까지 리액트를 사용하는 데 필요한 기본적인 개념들과 동작원리, 올바른 state관리와 hook의 사용법에 대해서 살펴보았다. 본격적인 리액트 내부로 깊숙히 들어가기 전 다시 한 번 점검해보자.
</dfn>

### 1. 리액트는 왜 사용하나요?

- 리액트가 등장한 이유는 유저상호작용이 많은 SPA 웹페이지가 많아지면서 코드가 복잡해지고 관리하기 어려워졌다.
    
    ⇒ 이를 효율적으로 관리하고 전체 코드를 줄일 수 있게 되면서 점차 성장해왔고, 지금의 React가 있게 되었다.
    
    ⇒ UI 컴포넌트 분리로 순수한 컴포넌트를 사용함으로써 디커플링과 선언적 프로그래밍이 가능해졌다.
    
- 유저 상호작용 마다 발생하는 비효율적인 브라우저의 reflow & repaint과정을 virtualDOM을 사용하여 batching을 통해 효율적으로 업데이트 할 수 있게 되었다.
    
    **1-1. 가상돔은 항상 빠를까요?**
    
    - 정답은 (X)
        
        ⇒ 아무리 메모리상에서 realDOM의 추상객체를 가지고 비교를 한다고 하지만, 계산이 한번 더 이루어지는 것은 사실이다.
        
        ⇒ 유저 상호작용이 많은 (DOM변경이 많은) 서비스에서는 빠를 수 있겠지만, static한 서비스라면 더 느릴 수 있다.
        

### 2. 리액트에서 렌더링이란?

- 보통 렌더링을 특정 데이터 값 (state) 가 변화해서 화면에 보이는 과정까지를 렌더링이라고 표현한다.
- 하지만 리액트에서는 render phase → commit phase → browser paint 과정으로 분리할 필요가 있다.
    
    ⇒ component → react element return → VDOM reconciliation → DOM mount → browser paint
    
    **2-1. JSX는 어떤 역할을 하나요?**
    
    - “자바스크립트에 html 태그를 할당하고 반환하는 함수를 만들 수 있다” 라는 기본적인 기능 외에 사용 시 주의 사항, 이스케이프 할당 등을 알아두어야 한다. (리액트가 아니여도 사용 가능)
    - 리액트에서는 ( createElement → type, props, children ) React Element를 생성하고 반환해준다.
    
    **2-2. 리액트에서 컴포넌트를 비교할 때 어떻게 하나요?**
    
    - 자바스크립트에서 object.is() 함수는 불완전하다. 이를 보완하기 위해 React 에서는 효율적인 렌더링을 위해 shallowEqual 함수를 사용한다. (얕은 비교 가능)
        - props = object ⇒ object.is() → shallowEqual
        - 얕은비교 까지만 하는 이유는 component가 prop을 받고 prop까지만 비교해주면 큰 문제가 없기 때문 & 더 깊어질수록 시간복잡도가 상승..
        - 컴포넌트 이외에 의존성 배열 및 상태들은 object.is()를 사용한다.

### 3. 리액트의 생명주기를 설명해주세요.

- 보통은 (과거의 나도 마찬가지) useEffect를 사용해서 mount될때 어쩌구, 중간에 작성해서 update 어쩌구, return 할때 unmount 어쩌구라고 대답해왔지만 이제 우리는 컴포넌트와 useEffect의 생명주기는 다르다는 것을 알고 있다.
- 따라서 리액트의 생명주기는 mount, update, unmount로 이루어지며, 외부 store와 동기화 시키기위해서이 생명주기에 맞추어 동기화 시킬 수 있는 useEffect를 사용합니다라고 말할  수 있다.
- Class컴포넌트를 사용할 때는 훨씬 더 많은 생명주기 함수가 많았지만 자세한 사항은 생략.
    
    **3-1. useEffect의 역할은 뭔가요?**
    
    - React state기반의 제어 이외에 서버 데이터 연결 설정이나 렌더링 이후 일부 코드를 실행 가능하게 하여 **동기화** 할 수 있다.
        
        ⇒ **Component = rendering code + event handlers**
        
        ⇒ **render → commit → useEffect(동기화)**
        
    
    **3-2. useEffect를 그럼 언제 사용해야 할까요?** 
    
    - *외부* 시스템과 동기화하는 데에 사용 ( 브라우저 API, 서드파티 위젯, 네트워크 등 )
    - 다른 state를 기반으로 일부 state만을 조정하는 경우 (x)
    - 외부 시스템과 동기화가 아닌 Event (x)
    
    **3-3. useEffect를 사용할 때 주의할 점은 뭐가 있을까요?**
    
    - 의존성 배열 관리
        
        ⇒ 기본적으로 작성안하면 렌더링마다 실행, [] 비어있을 시 초기 mount에만 실행, 있을 시 해당 의존성 객체가 변화할 때마다 실행
        
        ⇒ 의존성 배열에 추가할 때 관련없는 state는 외부로 이동하거나 제거하여 불필요한 리렌더링을 하지 않도록 해야 한다.
        
    - 3-2에서 살펴 보았듯 남용 자제
    - clean-up함수 작성
        
        ⇒ 예를 들어 특정 객체에 이벤트 리스너를 달아줄 경우 반드시 제거해주어야 한다.
        
        ⇒ mount될때마다 중복 등록 될 수 있다.
        
    - data-fetching
        
        ⇒ 비동기로 이루어지기 때문에 이전의 fetching이 완료되지 않을 수 있으므로 flag를 통해 이전 fetching은 무시하도록 설정
        

### 4. useState는 자바스크립트의 어떤 특성으로 만들어 졌나요?

- closure
- 예를 들어 다음과 같다.
    
    ```jsx
    function Component() {
    	const [state, useState] = useState();
    
    	function handleClick() {
    		// useState 호출은 위에서 끝났지만,
    		// setState는 계속 내부의 최신값(prev)을 알고 있다.
    	  // 이는 클로저를 활용했기 때문에 가능하다.
    		setState((prev) => prev + 1)
    	}
    
    }
    ```
    
    **4-1. state는 어떻게 관리해야 하나요?**
    
    - 리액트는 선언적으로 프로그래밍을 할 수 있기 때문에 불변성을 유지
        
        ⇒ 리액트가 알아서 컴포넌트를 렌더링하도록 만들어야 하며 state를 통해 알려준다.
        
        ⇒ 따라서 리액트가 인식할 수 있게 state는 불변성을 지켜줘야 한다.
        
    - 불필요한 state는 사용하지 않도록 해야 한다.
    - 기타 hook을 활용한 최적화 등은 생략

---

## 프로젝트 수정

공식문서를 돌아보면서 내가 기존에 작성한 코드를 수정해보았다.

### 1. Key 값 활용 useEffect 제거 (prop에 따른 전체 state 초기화)

<aside>
💡 이 경우 key prop이 변경되면 전체가 새로 렌더링 되면서 전체 state가 초기 값이 된다. 전체 state를 새로 초기화 하는 경우는 아니지만 활용 예시 임으로 참고만 하자.

</aside>

**Before**

- 기존 코드는 부모 컴포넌트의 state인 floor 라는 값을 prop으로 받아 floor가 바뀔 때마다 열려있던 모달창을 닫아주도록 useEffect를 사용해서 작성했다.
- 이 때의 문제점은 렌더링 이후 바뀐 floor에 따라서 또 다시 렌더링이 이루어 진다는 것이다.
    
    ⇒ props변경에 따른 useEffect는 좋지 않다 불필요한 리렌더링을 한번 더해야 한다.
    
    ⇒ render → mount → setModalOpen → re-render → mount 
    
- 특히 외부 시스템과 연동하는 것이 아니므로, render phase에서 계산하도록 하는 것이 효율적일 것이다.

```jsx
// In Parent Component
<UnderMap
	floor={floor}
	...
/>

// UnderMap Component
useEffect(() => {
  setModalOpen(false);
}, [floor]);
```

**After**

- 따라서 useEffect를 제거하고자 key값을 설정해 React가 변화를 알아서 인지하여 render phase에서 처리하도록 수정했다.
    
    ⇒ **동일한 위치의 동일한 컴포넌트는 state를 유지하며, React에서 중요한 것은 JSX 마크업이 아니라 UI 트리에서의 위치라는 것**
    
    ⇒ 기존에는UnderMap은 같은 트리에 위치해 있기 때문에 부모에서 다른 prop내려주더라도 기존 state값을 유지한다.
    
- 이렇게 수정하여 불필요하게 useEffect를 사용하지 않고 더 효율적으로 처리 할 수 있었다.

```jsx
// In Parent Component
<UnderMap
  key={floor}
	...
/>

// UnderMap Component

// useEffect제거
// useEffect(() => {
//   setModalOpen(false);
// }, [floor]);
```

### 2. prop에 따른 일부 state 변경

**Before**

- 기존 코드는 해당 위젯 컴포넌트의 위치가 변할 때 마다  모든 모달을 닫아주기 위해서 useEffect를 사용했었다.
- 마찬가지로 렌더링이 한번 더 이루어지므로 비효율적이다.

```jsx
useEffect(() => {
  closeAllModals();
}, [calPosition]);
```

**After**

- 무한 렌더링을 피하기 위해 이전 값과 비교할 수 있는 state설정 후 렌더링 시에 처리하도록 변경
- 렌더링 도중 처리

```jsx
const [prevPosition, setPrevPosition] = useState(calPosition);
  if (calPosition !== prevPosition) {
    setPrevPosition(calPosition);
    closeAllModals();
  }
```

### 3. Unnecessary useState

**Before**

- 기존에는 screenStyle이 변할 때 마다 full Screen 확인을 위해 useState로 선언해두고 useEffect로 변하게 확인했다.
- 여기서 useEffect는 외부 시스템과 동기화 하는 것이 아니며, full Screen에 대한 state도 렌더링 도중 체크 가능하다고 생각했다.

```jsx
const handleFullScreen = () => {
    if (screenStyle === 'cctv_viewer full') {
      setIsFull(true);
    } else {
      setIsFull(false);
    }
  };

useEffect(() => {
    hadleFullScreen();
  }, [screenStyle]);
```

**After**

- 따라서 불필요한 useState, useEffect를 제거하고 다음과 같이 수정했다.

```jsx
const isFull = screenStyle === 'cctv_viewer full';
```

### 4. clean-up

**Before**

- 기존에는 컴포넌트에 다음과 같이 작성하여 렌더링 할때 마다 해당 이벤트를 등록했었다.
- 이렇게 되면 불필요하게 계속 해당 코드가 실행될 것이다.

```jsx
document.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      setScreenStyle('layout_right');
      setReturnState(true);
    }
  });
```

**After**

- 생명주기에 맞춰 mount 될 때 등록하고 unmount될 때 제거 되도록 수정했다.

```jsx
useEffect (() => {
    const returnScreen = () => {
      setScreenStyle('layout_right');
      setReturnState(true);
    };
    document.addEventListener('keydown', returnScreen);
    return () => {
      document.removeEventListener('keydown', returnScreen);
    };
  }, []);
```

---

## Summary

지금까지 기본 개념과 원리 간단한 활용 예제를 통해 기본기를 탄탄히 다져왔다. 다음 시간부터는 본격적인 react 내부로 들어가기에 앞서 필요한 개념들을 정리해보겠습니다.