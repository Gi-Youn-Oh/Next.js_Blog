# 글에 앞서…

- JavaScript의 경우 공식 사이트 및 스터디를 통해 내부 동작 원리에 대해 이해하고 사용을 하고 있지만 (물론 여전히 부족한 부분이 많아 꾸준히 노력중이다..), React의 경우에는 사용하기 급급해 먼저 사용해보고 오류나 원리에 대해 이해하지 못하는 부분들만 찾아서 채워넣고 있었다.
- 실무에서 일한 지 몇달이 지나고보니 항상 React를 사용할 때는 과연 내가 올바르게 사용하고 있는지에 대한 자신감이 부족했다.
- React hook, Redux, Recoil, ReactQuery 같은 상태관리, 최적화 쪽에만 오히려 시간과 노력을 쏟고, 정작 중요한 React의 LifeCycle, Rendering이 어디서부터 어떻게 이루어지는 지 근본적인 원리에 대해 많이 부족하다고 느꼈다.
- 이에 React 공식문서에서 부족한 부분들에 대한 갈증을 채우고, 현재 사용중인 React18에 대해 깊은 이해를 갖고자 시작하게 되었다.
- 추가적으로 나와 같은 신입 개발자 분들이 React를 사용중이긴 하지만(작동은 잘 되지만..)React의 깊은 곳까지 파헤쳐보고 싶을 때 어디서부터 시작해야할지 막막한 분들에게 조금이나마 도움이 될까 싶어 공식문서와 책 그리고 여러 훌륭한 개발자 분들이 작성해주신 글을 참조해 신입 개발자의 입장에서 풀어나가보려합니다.

<aside>
💡 모든 내용은 주관적으로 선정했으며, 틀린 부분이 있을 수도 있습니다.

</aside>
</br>


# 목차

## 1. React Basic Concepts

- React 부족한 필수 기본 개념들에 대한 정리

## 2.  공식문서 돌아보기

- 모든 문서를 돌아 보지는 않을 것이고, 내가 부족하다고 느낀 파트 들에 대한 정리 특히 useState, useEffect의 올바른 사용에 관하여

## 3. 본격적인 React 내부로 들어가기전  준비

- circular linked list
- scheduler
- priority queue
- double buffering

## 4. React Github 내부 코드

- 모든 코드를 보는 건 어렵고, 핵심 코드 들만 살펴보겠습니다.

---

# 1. React Basic Concepts

- 리액트를 하면 제일 먼저 떠오르는 것이 “렌더링” 입니다.
- 하지만 정작 마르고 닳도록 말했던 렌더링이 어떤 동작을 말하는 것인지 정확히 짚고 넘어갑시다.

## 1-1. Render & Commit

![image](https://github.com/Gi-Youn-Oh/Next.js_Blog/assets/109953972/572ac3d5-a2d4-4a47-a710-41ee469cbd04)

- React를 공부하면서 수도 없이 보았던 위 사진이지만 Rendering에서 정확히 어떤 작업이 이루어지고 Commit에서 어떤작업이 이루어지는 지 무시한 채 통틀어 Rendering이라고 칭해왔다.
- 여기서 중요한 점은 Render Phase 와 Commit Phase의 역할은 다르다는 것 즉, 지금부터는 rendering = render phase + commit phase가 아니라 **render phase 역할만을 rendering**이라고 하겠습니다.
    - point1 : rendering / event 와 sideEffect 들을 구분할 것
    - point2 : 컴포넌트의 생명주기와 effect의 생명주기는 다르다는 것

<aside>
💡 공식문서 파트에서 위 개념들을 정리하면 그동안 얼마나 useState와 useEffect를 멍청하게 사용해왔는지 알 수 있을 것이다..😂

</aside>

### Rendering

- React Component를 호출하여 React Element 를 return
- 이후 VDOM 재조정 = reconciliation

### Commit

- Component가 반환한 React Element를 DOM에 삽입 (mount)

### Browser Paint

- Browser paint

### Process

1. 컴포넌트 호출
2. VDOM 재조정
3. DOM에 삽입
4. 브라우저 paint

---

## 1-2. JSX

- 자바스크립트에 html 태그를 할당하고 반환하는 함수를 만들 수 있다.
- 태그 안에 {} 객체를 사용해 자바스크립트 객체를 할당할 수 있다.
- undefined는 런타임시 에러를 유발 할 수 있기 때문에 조건부 렌더링에서는 사용하지 말자.
- null은 렌더링 안됨.
- 숫자 0은 그대로 렌더링 될 수 있음.
- <>fragment는 부모노드로 묶어줄 때에만 사용하자.

### JSX → React.createElement()

- 이 때의 createElement는 React Element를 반환합니다.

```jsx
const element = createElement(type, props, ...children)

- `type`: 엘리먼트의 타입. 예를 들면 `'div'`, 또는 사용자 정의 클래스 or 함수 컴포넌트
- `props`: 엘리먼트에 전달되는 속성들을 포함한 객체.
- `children`: 엘리먼트 내부에 포함되는 자식 엘리먼트들.
```

### example

```jsx
const element = (
  <h1 className="greeting">
    Hello, world!
  </h1>
);

const element = React.createElement(
  'h1',
  {className: 'greeting'},
  'Hello, world!'
);
```

### React Project

```jsx
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
```

```jsx
export interface Root {
    render(children: React.ReactNode): void;
    unmount(): void;
}

export function createRoot(container: Element | DocumentFragment, options?: RootOptions): Root;
```

- 흔히 보는 React의 시작점 index.jsx의 코드를 보면 DOM의 시작점을 참조하여 Root(React.Node)를 rendering하는 것을 볼 수 있다.
- 이 ReactNode 또한 React Element이다.
- 결국 rendering은 React Element를 반환하는 것부터 시작한다.

<aside>
💡 제일 중요한 것은 결국 Rendering과정에서 React Element를 반환 한다는 것인데 이 React Element는 실제 DOM Element가 아니라 참조값들로 이루어진 가벼운 추상 객체 이다.

</aside>

---

## 1-3. Virtual DOM

```jsx
- 가상 DOM(VDOM)은 이상적인 또는 "가상" UI 표현이 메모리에 유지되고 ReactDOM과 같은 라이브러리에 의해 "실제" DOM과 동기화되는 프로그래밍 개념입니다.
- React의 선언적 API를 가능하게 합니다. React는 UI에 원하는 상태를 알려주고 DOM이 해당 상태와 일치하는지 확인합니다. 이는 앱을 빌드하는 데 사용해야 하는 속성 조작, 이벤트 처리 및 수동 DOM 업데이트를 추상화합니다.
```

- 위 공식문서의 내용은 다들 알고 있겠지만 몇가지 더 짚고 넘어가야 합니다.
- 가상돔은 유저 상호작용(interaction)이 많아지고 single page application이 확대되면서 브라우저가 매번 화면을 다시 그리는 작업을 효율적인 작업이 필요했다. 이를 가상돔을 통해 실제 브라우저에는 필요한 부분만 다시 그릴 수 있도록 효율적으로 어플리케이션이 동작하게 되었다.
    
    ⇒  첫번째, 그럼 여기서 React 가상돔은 항상 빠를까?
    
    - 리액트 개발 팀원인 dan의 말에 따르면 다음과 같다.
    
    ```jsx
    Myth: React is "faster than DOM".
    Reality: it helps create maintainable applications, and is 'fast enough' for most use cases. 
    ```
    
    - 가상돔은 메모리에서 유지되기 때문에 그 자체 동작은 빠르긴 하겠지만 유저상호작용이 적거나 브라우저가 DOM을 reflow, repaint 하는 작업이 적은 어플리케이션이라면 어쨌든 메모리에서 작업이 한번 더 이루어지고 브라우저 작업이 이루어지기 때문에 느릴 수도 있다.
    - 하지만 현대 어플리케이션의 대부분은 유저와의 상호작용이 많고, 규모가 커지면서 재 사용성, 확장성 등을 고려해야하기 때문에 React의 Virtual DOM이 유용하게 작용하며 효율적이기 때문에 빠르다고 표현해온 것이다.
    - 즉 리액트의 효율성은 충분히 빠르지만 가상돔 자체가 무조건 더 빨라서 사용한다 라는 대답이 항상 옳지는 않다는 것이다.
    
    ⇒ 두번째, 선언적 API를 가능하게 한다.
    
    - React에서 선언적으로 프로그래밍 한다는 것은 리액트가 알아서 UI를 업데이트하고 표시해준다는 것이다.
    - 이 말은 다시 말해 컴포넌트는 React Element를 반환하고 React Element는 순수한 UI일 뿐이라는 것이다.
    
    ⇒ 세번째, 가상돔은 어떻게 동작하는가?
    
    - 이후 자세히 다루겠지만 double buffering 형태로 current와 workInProgress 두 가상돔을 비교하고 workInProgress가 렌더링이 완료되면 current 트리가 되며, 기존 current 트리는 기본 객체는 재활용 되고 fiber는 초기화 되어 새로운 workInProgress tree로 사용된다.
    - 또한 가상돔은 React Element들로 구성된 트리 구조이다.

---

## 1-4. Background

- 처음 페이스북 (현 메타) 팀이 리액트를 발표했을 때는 굉장히 회의적이였다고 한다.
- 하지만 점차 다음과 같은 장점들을 인정받아 지금의 리액트가 되었다. (야후, 넷플릭스가 대표적 리액트 도입 사이트)
    1. 자바스크립트의 자체 코드 감소
    2. 완만한 학습 곡선
    3. 빠른 기능 추가
- 초기 리액트의 코드

```jsx
var TextBoxList = React.createClass({
  getInitailState: function () {
    return { count: 1 };
  },
  add: function () {
    this.setState({ count: this.state.count + 1 });
  },
  render: function () {
    var items = [];
    for (var i = 0; i < this.state.count; i++) {
      items.push(
        <li key={i}>
          <input type="text" placeholder="change me!" />
        </li>
      );
    }
    return (
      <ul>
        {items}
        <input type="button" value="Add an item" onClick={this.add} />
      </ul>
    );
  },
});

ReactDOM.render(
  <div>
    <p>
      만약 이 배열에 새로운 텍스트를 추가하게 되면 리액트는 전체 배열을 새로운
      텍스트를 추가하게 되면 리액트는 전체 배열을 새로 렌더링하지만 기존의 input
      내용에 있던 것은 그대로 유지합니다. 리액트는 기존의 모든 DOM 요소를 초기화
      하지 않고, 새로운 text를 추가하는 방식으로 똑똑하게 작용합니다.
    </p>
    <TextBoxList />
  </div>
);
```

### 1-4-1. React에서의 동등 비교

- ==, === 가 아닌 object.is 바탕의 shallowEqual
- object.is

```jsx
// polyfill
function is(x: any, y: any) {
  return (x === y && (x !== 0 || 1 / x === 1 / y)) || (x !== x && y !== y);
}

// es6
const objectIs: (x: any, y: any) => boolean =
  typeof Object.is === "function" ? Object.is : is;

export default objectIs;
```

- shallowEqual
    - object.is를 먼저 비교 수행한 이후에 객체 간 얕은 비교를 한번 더 수행한다.
    - 객체 간 얕은 비교를 수행한다는 것은 첫번째 깊이에 존재하는 값만 비교한다는 것

```jsx
import is from "./objectIs";

import hasOwnProperty from "./hasOwnProperty";

/**
 * 주어진 객체의 키를 순회하면서 두 값이 엄격한 동등성을 가지고 있는지 확인한다.
 * 다른 값이 있다면 false를 반환한다.
 * 만약 두 객체 간에 모든 키의 값이 동일하다면 true를 반환한다.
 */

// 단순히 object.is 를 수행하는 것 뿐만 아니라 객체 간의 비교도 추가 되어 있다.

function shallowEqual(objA: mixed, objB: mixed): boolean {
  // 두 객체가 동일하다면 true를 반환한다.
  if (is(objA, objB)) {
    return true;
  }

  // 두 객체 중 하나라도 객체가 아니라면 false를 반환한다.
  if (
    typeof objA !== "object" ||
    objA === null ||
    typeof objB !== "object" ||
    objB === null
  ) {
    return false;
  }

  // 각 키 배열을 꺼낸다.
  const keysA = Object.keys(objA);
  const keysB = Object.keys(objB);

  if (keysA.length !== keysB.length) {
    return false;
  }

  // A의 키를 기준으로, B에 같은 키가 있는지, 그리고 그 값이 같은 지 확인한다.
  for (let i = 0; i < keysA.length; i++) {
    const currentKey = keysA[i];
    if (
      !hasOwnProperty.call(objB, currentKey) ||
      !is(objA[currentKey], objB[currentKey])
    ) {
      return false;
    }
  }

  // 모든 키의 값이 동일하다면 true를 반환한다.
  return true;
}
```

```jsx
//object.is는 참조가 다른 객체에 대해 비교가 불가능하다.
Object.is({hello: 'world'}, {hello: 'world'}) // false

// 하지만 shallowEqual은 가능하다.
shallowEqual({hello: 'world'}, {hello: 'world'}) // true

// 그러나 2 depth 이상의 객체에 대해서는 불가능하다.
shallowEqual({hello: {world: 'world'}}, {hello: {world: 'world'}}) // false
```

⇒ 기본적으로 리액트에서는 props에서 꺼내온 값을 기준으로 렌더링 하기 때문에 얕은 비교로 충분, 만약 props에 또 다른 객체를 넘겨준다면 (2depth이상의) 렌더링이 원하는대로 제어되지 않을 것이다.

---

## 1-5. React Element

- react element 는 DOM Tree 생성에 필요한 정보를 담은 객체다.
- React DOM node element, React Component element 두 종류
- element 는 property 로 다른 element 를 가질 수 있다.
- React Component → JSX → React.createElement → return React Element
- 결국 component는 Element들이 mixed & nested 된 트리구조로 바뀌고 그 트리구조가 가상돔이 되는 것이다.
- React Element는 상대로적으로 가벼운 DOM 추상 객체이다.
    
    ```jsx
    {
      type: 'button',
      props: {
        className: 'button button-blue',
        children: {
          type: 'b',
          props: {
            children: 'OK!'
          }
        }
      }
    }<button class='button button-blue'>
      <b>
        OK!
      </b>
    </button>
    ```
    
- 컴포넌트는 해당 element만을 독립적으로 가지며, mixed & nesting될 수 있는 트리구조이다. (de-coupled, easy to traverse)
    
    ```jsx
    {
      type: Button,
      props: {
        color: 'blue',
        children: 'OK!'
      }
    }// React는 Button을 만나면 component에게 물어봐서 아래 DOM element 를 return 받음
    {
      type: 'button',
      props: {
        className: 'button button-blue',
        children: {
          type: 'b',
          props: {
            children: 'OK!'
          }
        }
      }
    }
    ```
    
    ```jsx
    const DeleteAccount = () => ({
      type: 'div',
      props: {
        children: [{
          type: 'p',
          props: {
            children: 'Are you sure?'
          }
        }, {
          type: DangerButton,
          props: {
            children: 'Yep'
          }
        }, {
          type: Button,
          props: {
            color: 'blue',
            children: 'Cancel'
          }
       }]
    });const DeleteAccount = () => (
      <div>
        <p>Are you sure?</p>
        <DangerButton>Yep</DangerButton>
        <Button color='blue'>Cancel</Button>
      </div>
    );
    ```
    
- React가 알아서 create, update, destroy 해준다. (선언적 API)
    
    **Before**
    
    ```jsx
    class Form extends TraditionalObjectOrientedView {
      render() {
        // Read some data passed to the view
        const { isSubmitted, buttonText } = this.attrs;    if (!isSubmitted && !this.button) {
          // Form is not yet submitted. Create the button!
          this.button = new Button({
            children: buttonText,
            color: 'blue'
          });
          this.el.appendChild(this.button.el);
        }    if (this.button) {
          // The button is visible. Update its text!
          this.button.attrs.children = buttonText;
          this.button.render();
        }    if (isSubmitted && this.button) {
          // Form was submitted. Destroy the button!
          this.el.removeChild(this.button.el);
          this.button.destroy();
        }    if (isSubmitted && !this.message) {
          // Form was submitted. Show the success message!
          this.message = new Message({ text: 'Success!' });
          this.el.appendChild(this.message.el);
        }
      }
    }
    ```
    
    - 각 component 는 DOM node 주소와, 자식 component 의 instance 주소를 보관해야 한다.
    - 관리할 컴포넌트 늘어나면 컴포넌트 간의 의존성이 깊어지고 관리하기 어려웠다.
    
    **After**
    
    ```jsx
    const Form = ({ isSubmitted, buttonText }) => {
      if (isSubmitted) {
        // Form submitted! Return a message element.
        return {
          type: Message,
          props: {
            text: 'Success!'
          }
        };
      }  // Form is still visible! Return a button element.
      return {
        type: Button,
        props: {
          children: buttonText,
          color: 'blue'
        }
      };
    };
    ```
    

## 1-6. Summary

- 렌더링은 리액트에서 render phase + commit phase이며 각각의 역할은 명확히 다르며 조금 더 세분화하면 return element → VDOM reconciliation → mount → browser paint
- 리액트는 무조건 항상 빠르진 않지만, 유저와의 상호작용이 많아지는 어플리케이션에서 이를 효율적으로 관리하고 작용 가능하게 한다.
- Element 개념 도입으로 기존 UI 모델의 문제점(커플링, 복잡성)들을 해결하고, 선언적 프로그래밍이 가능하게 해주었다.
- React의 Element는 순수해야한다.