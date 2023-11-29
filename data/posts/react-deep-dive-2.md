# 2. 공식문서 돌아보기

## 2-1. Before document

- 본격적으로 공식문서 예제와 설명을 보기 전에 간단한 React와 useState, useEffect를 만들어 보겠습니다.
- 면접 때 리액트의 훅 중에 클로저를 사용해서 만든 훅이 있을까요? 라는 질문을 받은 적이 있다.
    
    ⇒ 과거 스터디를 할 때 얘기가 나왔던 부분인데 겉핥기 식으로 넘어가서 결국 기억이 안나 대답을 못했었다.
    
    ⇒ 결론부터 말하자면 제일 많이 사용하는 훅인 useState이다.
    
    ⇒ 그렇다면 어떻게 클로저를 사용했는지 살펴보자.
    

### Closure

- 자바스크립트를 어느정도 깊게 공부해본 사람이라면 다들 이렇게 대답할 것이다.
- “함수와 그 함수과 선언된 렉시컬 환경의 조합이다.”
- 처음 위 문구를 보고서는 무슨 멍소리인지 이해가  되지 않았다.
- 나는 아래와 같이 조금 받아들이기 쉽게 정의해봤다.
- “어떤 함수 A에서 선언한 변수 a를 참조하는 내부함수 B를 외부로 전달할 경우 A의 실행 컨텍스트가 종료된 이후에도 변수 a를 참조하는 함수”
- 자세한 설명은 생략하겠다. (리액트를 사용한다는 것은 자바스크립트의 기본기는 탄탄히 갖추었을 것이기 때문에)

```jsx
function outerFunction() {
  // 외부 함수의 변수
  let outerVariable = "I am from the outer function";

  // 내부 함수 (클로저)
  function innerFunction() {
    console.log(outerVariable);
  }

  // 내부 함수를 반환
  return innerFunction;
}

// outerFunction을 호출하고 반환된 innerFunction을 변수에 저장
let closureFunction = outerFunction();

// closureFunction을 호출하여 클로저가 외부 변수에 접근
closureFunction(); // 출력: I am from the outer function
```

### useState

**Simple example**

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

- useState함수의 호출은 Component 내부 첫 줄에서 종료되었지만, setState는 useState 내부의 최신값을 어떻게 계속해서 확인할 수 있다.
    
    ⇒ 클로저가 useState내부에서 활용됐기 때문이다.
    
- 외부함수(useState)가 반환한 내부함수(setState)는 외부함수(useState)의 호출이 끝났음에도 자신이 선언된 외부 함수가 선언된 환경(state가 저장돼 있는 어딘가)을 기억하기 때문에 계속해서 state값을 사용할 수 있는 것이다.

**make useState**

```jsx
function useState(initVal) {
  let _val = initVal
  const state = _val
  const setState = newVal => {
    _val = newVal
  }
  return [state, setState]
}
const [count, setCount] = useState(1)
console.log(count) // 1
setCount(2)
console.log(count) // 1 (?)
```

- 위 코드에서 두 번째 count의 출력은 뭘까?
    
    ⇒ 정답은 1이다. 보다시피 count변수는 const로 한번 선언 및 할당되고 끝이다.
    
    ⇒ 그렇다면 함수로 바꾸어 보자.
    
    ```jsx
    function useState(initVal) {
      let _val = initVal
      const state = () => _val;
      const setState = newVal => {
        _val = newVal
      }
      return [state, setState]
    }
    const [count, setCount] = useState(1)
    console.log(count) // 1
    setCount(2)
    console.log(count) // 2
    ```
    
    - 값 자체를 사용하는게 아니라 함수를 호출해주기 때문에 새롭게 설정된 값을 반환하는 것을 확인할 수 있다.

**useState in React** 

```jsx
const React = (function() {
  function useState(initVal) {
    let _val = initVal
    const state = _val
    const setState = newVal => {
      _val = newVal
    }
    return [state, setState]
  }
  function render(Component) {
    const C = Component()
    C.render()
    return C
  }
  return { useState, render }
})()
function Component() {
  const [count, setCount] = React.useState(1)
  return {
    render: () => console.log(count),
    click: () => setCount(count + 1),
  }
}

let App = React.render(Component) // 1
App.click()
let App = React.render(Component) // 1?
```

- 위와 같이 실제 리액트는 아니지만 간단하게 구현해보면 1이 두번 출력된다.
    
    ⇒ _val변수를 상위 스코프로 올려보면 예상한 값대로 작동한다.
    
    ```jsx
    const React = (function() {
      let _val;
    	function useState(initVal) {
        const state = _val || initVal
        const setState = newVal => {
          _val = newVal
        }
        return [state, setState]
      }
      function render(Component) {
        const C = Component()
        C.render()
        return C
      }
      return { useState, render }
    })()
    function Component() {
      const [count, setCount] = React.useState(1)
      return {
        render: () => console.log(count),
        click: () => setCount(count + 1),
      }
    }
    
    let App = React.render(Component) // 1
    App.click()
    let App = React.render(Component) // 2
    ```
    
    **several useState**
    
    ```jsx
    function Component() {
      const [count, setCount] = React.useState(1)
      const [text, setText] = React.useState('apple')
      return {
        render: () => console.log({ count, text }),
        click: () => setCount(count + 1),
        type: word => setText(word),
      }
    }
    var App = React.render(Component) // {count: 1, text: 'apple'}
    App.click()
    var App = React.render(Component) // {count: 2, text: 2}
    App.type('banana')
    var App = React.render(Component) // {count: 'banana', text: 'banana'}
    ```
    
    - _val 하나에 의존하는 지금 상태에서 useState를 두번 호출하면 위와 같이 덮어씌워지는 상황이 발생한다.
        
        ⇒ 배열로 관리해보자
        
        ```jsx
        const React = (function() {
          let hooks = []
          let idx = 0
          function useState(initVal) {
            const state = hooks[idx] || initVal
            const _idx = idx // 이 훅이 사용해야 하는 인덱스
            const setState = newVal => {
              hooks[_idx] = newVal
            }
            idx++ // 다음 훅은 다른 인덱스를 사용하도록 한다.
            return [state, setState]
          }
          function render(Component) {
            idx = 0 // 랜더링 시 훅의 인덱스를 초기화한다.
            const C = Component()
            C.render()
            return C
          }
          return { useState, render }
        })()
        ```
        
        - 위 코드를 기반으로 생각해보면 왜 조건부나 루프안에서 훅이 호출되면 안되는지 규칙을 이해할 수 있다.

### useEffect

- 상태의 변화에 따라 sideEffect를 실행하기 위해서 필요

```jsx
function useEffect(cb, depArray) {
  const oldDeps = hooks[idx] // 기존 의존 값 배열 유무 확인.
  let hasChanged = true
  if (oldDeps) {
    // 있다면 차이가 있는지 확인
    // 실제로 리액트 구현체에서는 이전 글에서 살펴보았던 shallowEqual함수로 비교한다.
    hasChanged = depArray.some((dep, i) => !Object.is(dep, oldDeps[i]))
  }
  // 바뀌었다면 콜백함수 실행
  if (hasChanged) {
    cb()
  }
  // useEffect도 훅의 일부분이다. hooks 배열에 넣어서 관리해준다.
  hooks[idx] = depArray
  idx++
}
```

**React with useState & useEffect**

```jsx
const React = (function () {
    let hooks = []
    let idx = 0
    function useState(initVal) {
        const state = hooks[idx] || initVal
        const _idx = idx // 이 훅이 사용해야 하는 인덱스를 가둬둔다.
        const setState = newVal => {
            hooks[_idx] = newVal
        }
        idx++ // 다음 훅은 다른 인덱스를 사용하도록 한다.
        return [state, setState]
    }
    function useEffect(cb, depArray) {
        const oldDeps = hooks[idx] // 이미 저장되어있던 의존 값 배열이 있는지 본다.
        let hasChanged = true
        if (oldDeps) {
            // 의존 값 배열의 값 중에서 차이가 발생했는지 확인한다.
            // 실제로 리액트 구현체는 shallowEqual이라는 함수를 사용한다.
            hasChanged = depArray.some((dep, i) => !Object.is(dep, oldDeps[i]))
        }
        // 값이 바뀌었으니 콜백을 실행한다.
        if (hasChanged) {
            cb()
        }
        // useEffect도 훅의 일부분이다. hooks 배열에 넣어서 관리해준다.
        hooks[idx] = depArray
        idx++
    }

    function render(Component) {
        idx = 0 // 랜더링 시 훅의 인덱스를 초기화한다.
        const C = Component()
        C.render()
        return C
    }
    return { useState, render, useEffect }
})()

function Component() {
    const [count, setCount] = React.useState(1)
    const [text, setText] = React.useState('apple')
    // 랜더링 시 최초에 한 번만 실행된다.
    // 배열 안에 관찰하고자 하는 상태를 전달하면 그 상태에 반응하여 콜백이 실행된다.
    React.useEffect(() => {
        console.log('side effect')
    }, [count, text])
    // ...
    return {
        render: () => console.log({ count, text }),
        click: () => setCount(count + 1),
        type: word => setText(word),
      }
}

var App = React.render(Component) 
App.click()
var App = React.render(Component)
App.type('banana')
var App = React.render(Component) 

// side effect
// { count: 1, text: 'apple' }
// side effect
// { count: 2, text: 'apple' }
// side effect
// { count: 2, text: 'banana' }
```

---

## 2-2. useState in React.dev

### State as a Snapshot

[“Rendering”](https://react-ko.dev/learn/render-and-commit#step-2-react-renders-your-components) means that **React is calling your component, which is a function. The JSX you return from that function is like a snapshot of the UI in time.** Its props, event handlers, and local variables were all calculated **using its state at the time of the render.**

- **렌더링은 컴포넌트 (함수)를 호출한다는 뜻이다. JSX는 그 시간의 스냅샷과 같다.**
    
    ⇒ 이제 우리는 이 말을 정확히 이해 할 수 있다. 렌더링은 컴포넌트(클래스형이든 함수형이든)를 호출하는 것이고 → 컴포넌트 호출은 JSX를 return 해주고 → JSX는 React.createElement() 호출 하고 → React.createElement()는 React Element를 반환해준다. 이 때의 React Element는 호출 당시의 State로 구성되어 있다.
    

As a component’s memory, state is not like a regular variable that disappears after your function returns. State actually “lives” in React itself—as if on a shelf!—outside of your function. When React calls your component, it gives you a snapshot of the state for that particular render. Your component returns a snapshot of the UI with a fresh set of props and event handlers in its JSX, all calculated **using the state values from that render!**

- 컴포넌트의 메모리로서 state는 함수가 반환된 후 사라지는 일반 변수와 다릅니다. state는 실제로 함수 외부에, 마치 선반에 있는 것처럼 React 자체에 “존재”합니다.
- React가 컴포넌트를 호출하면 특정 렌더링에 대한 state의 스냅샷을 제공합니다. 컴포넌트는 **해당 렌더링의 state 값을 사용해** 계산된 새로운 props 세트와 이벤트 핸들러가 포함된 UI의 스냅샷을 JSX에 반환합니다.
    
    ⇒ 이 말을 바탕으로 기존의 snapshot에서 렌더링이 발생하면 React가 state를 업데이트 해주고 새로운 snapshot을 반환해준다는 것을 알 수 있다. 
    
    ⇒ 흔히 useState로 확인해보는 setState이후 이전의 state값이 변화가 없을 때 그 당시의 snapshot을 반환해주기 때문임을 알 수 있다.
    

![image](https://github.com/Gi-Youn-Oh/Next.js_Blog/assets/109953972/26535494-7f6d-41f6-a7ad-91d0e48c52ae)

다음 글에 이어서..