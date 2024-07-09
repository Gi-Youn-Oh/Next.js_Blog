# Fiber

- React는 원래 stack 구조로 되어 있어서 React가 점유(call stack)하고 있는 동안에는 main thread를 브라우저에게 양보하지 못하여 화면이 멈춰 있거나 렌더링이 부자연스럽게 이루어 지는 현상이 종종 발생했었습니다.
- 이를 보완하기 위해 Fiber Architecture를 도입했으며, Fiber를 통해 다음과 같은 기능들이 가능해졌습니다.
    1. 일시 정지 및 재 가동 (useTransition)
    2. 우선 순위 지정 (useDeferredValue)
    3. 재 사용 (useRef)
    4. 중단 (useEffect)
- 앞서 React-deep-dive 첫 글에서 React Component (jsx)는 React Element를 반환한다고 했습니다. 이렇게 반환 된 React Element를 tag를 참조하여 Fiber로 확장합니다.
- Fiber로 확장하면서 정보들을 갖게 되고 Fiber로 연결된 V-DOM이 생성됩니다.
- 앞으로 내부 코드를 분석할 때 가장 중요하면서 많이 보게 될 Fiber는 어떻게 생성되고 어떤 속성들이 있는지 살펴보겠습니다.

## 1. React Element

### 1-1. **Types of React Component**

- React Component는 3가지 종류로 나뉘어집니다.
1. Host Component (React DOM elements)
    - div, input, button 등 HTML element에 대응하는 component
2. Custom Component (React Component elements)
    - 개발자들이 선언한 class or fucntion component
3. Static Component
    - Fragment, lazy, context, memo등

### 1-2. createElement()

- React Element는 Rendering시 React.createElement()를 호출하며 React Element를 반환한다.
- 인자로 type, config(props), children을 받는다.
    
    ```tsx
    	export function createElement(type, config, children) {
    	// tag -> div, button etc
    	// config -> props
    	// children -> children components
    	...
      return ReactElement(
        type,
        key,
        ref,
        self,
        source,
        ReactCurrentOwner.current,
        props,
      );
    }
    ```
    
- Example
    
    ```tsx
    import React from 'react';
    
    function MyComponent() {
      const handleClick = () => {
        alert('Button clicked!');
      };
    
      const handleChange = (event) => {
        console.log(event.target.value);
      };
    
      return (
        <div className="container">
          <button onClick={handleClick} style={{ backgroundColor: 'blue', color: 'white' }}>
            Click me
          </button>
          <input type="text" placeholder="Enter your name" onChange={handleChange} />
        </div>
      );
    }
    
    export default MyComponent;
    
      // createElement를 사용하여 JSX 요소 생성
      const buttonElement = React.createElement('button', { onClick: handleClick, style: { backgroundColor: 'blue', color: 'white' } }, 'Click me');
      const inputElement = React.createElement('input', { type: 'text', placeholder: 'Enter your name', onChange: handleChange });
    
      // JSX 반환
      return React.createElement('div', { className: 'container' }, buttonElement, inputElement);
    ```
    

### 1-3. React Element

- $$typeof에는 기본적으로 REACT_ELEMENT_TYPE 들어가며, REACT_MEMO_TYPE등이 들어갈 수 있다.
    
    ```tsx
    const ReactElement = function(type, key, ref, self, source, owner, props) {
      const element = {
        // This tag allows us to uniquely identify this as a React Element
        $$typeof: REACT_ELEMENT_TYPE,
    
        // Built-in properties that belong on the element
        type: type,
        key: key,
        ref: ref,
        props: props,
    
        // Record the component responsible for creating this element.
        _owner: owner,
      };
      
      ...
      
        return element;
    };
    ```
    

## 2. createFiber()

- rendering을 통해 반환된 reactElement는 Fiber로 확장된다.

### 2-1. createFiberFromElement()

- element의 속성에 따라 생성한다.
    
    ```tsx
    export function createFiberFromElement(
      element: ReactElement,
      mode: TypeOfMode,
      expirationTime: ExpirationTime,
    ): Fiber {
    
      const type = element.type;
      const key = element.key;
      const pendingProps = element.props;
      // 이때 fiber의 type이 function인지 class인지, host인지, fragment인지 구분하여 생성
      
      const fiber = createFiberFromTypeAndProps(
        type,
        key,
        pendingProps,
        owner,
        mode,
        expirationTime,
      );
      return fiber;
    }
    
    ```
    

### 2-2 createFiberFromTypeAndProps()

- function or class, host, static 타입에 따라 Tag를 설정해주고 creatFiber() 호출한다.
    
    ```tsx
    export function createFiberFromTypeAndProps(
      type: any,
      key: null | string,
      pendingProps: any,
      mode: TypeOfMode,
      expirationTime: ExpirationTime,
    ): Fiber {
      let fiber;
      let fiberTag = IndeterminateComponent; 
      let resolvedType = type;
    
      if (typeof type === 'function') {
        // class component
        if (shouldConstruct(type)) { // type.prototype && type.prototype.isReactComponent;
          fiberTag = ClassComponent;
        }
    
      // type이 string이면 호스트 컴포넌트
      } else if (typeof type === 'string') {
        fiberTag = HostComponent;
    
      // static component
      } else {
        getTag: switch (type) {
          case REACT_FRAGMENT_TYPE:
            return createFiberFromFragment(
              pendingProps.children,
              mode,
              expirationTime,
              key,
            );
          case REACT_CONCURRENT_MODE_TYPE:
            fiberTag = Mode;
            mode |= ConcurrentMode | BlockingMode | StrictMode;
            break;
          /*...*/
          default: {
            if (typeof type === 'object' && type !== null) {
              switch (type.$$typeof) {
                case REACT_MEMO_TYPE:
                  fiberTag = MemoComponent;
                  break getTag;
                case REACT_LAZY_TYPE:
                  fiberTag = LazyComponent;
                  resolvedType = null;
                  break getTag;
                /*...*/
              }
            }
            let info = '';
            invariant(
              false,
              'Element type is invalid: expected a string (for built-in ' +
                'components) or a class/function (for composite components) ' +
                'but got: %s.%s',
              type == null ? type : typeof type,
              info,
            );
          }
        }
      }
    
      fiber = createFiber(fiberTag, pendingProps, key, mode);
      fiber.elementType = type;
      fiber.type = resolvedType;
      fiber.expirationTime = expirationTime;
    
      return fiber;
    }
    ```
    

### 2-3. createFiber()

- 결정된 정보에 따라 최종적으로 reactElement를 FiberNode로 확장하며, 이 FiberNode들은 연결리스트로 트리구조를 갖게 되며 그 트리가 V-DOM이 된다.
    
    ```tsx
    const createFiber = function(
      tag: WorkTag,
      pendingProps: mixed,
      key: null | string,
      mode: TypeOfMode,
    ): Fiber {
      return new FiberNode(tag, pendingProps, key, mode);
    };
    ```
    

## 3. Fiber  Object

- ReactElement가 확장된 Fiber는 아래와 같이 구성되어 있으며, linked-list로 연결되어 tree 구조를 갖는다.
- state, hook에 대한 정보 또한 Fiber에서 관리되며, udpate발생 시간 또한 포함되어 있다.
    
    ```tsx
    function FiberNode(tag, pendingProps, key){
      // Instance
      this.tag = tag; // fiber의 종류
      this.key = key;
      this.type = null; // React element type
      this.stateNode = null; // 호스트 컴포넌트에 대응되는 HTML element
    
      // Fiber linked-list
      // 자식 Node중 천번째 자식만을 참조하며 나머지 자식들은 sibling으로 연결되어 있다.
      this.return = null; // 부모 fiber
      this.child = null; // 자식 fiber
      this.sibling = null; // 형제 fiber
      this.index = 0; // sibling 중 index
    
      this.pendingProps = pendingProps; // In workInProgress
      this.memoizedProps = null; // Render phase end ->  pendingProps -> memoizedProps
      this.updateQueue = null; // element의 변경점 or life-cycle
      this.memoizedState = null; // function component hook-lists
    
      // Effects
      this.effectTag = NoEffect; // side effect tag
      this.nextEffect = null; 
      this.firstEffect = null;
      this.lastEffect = null; 
    
      this.expirationTime = NoWork; // component update time
      this.childExpirationTime = NoWork; // sub-tree udpate time
    
      this.alternate = null; // workInProgress <- alternate -> current
    }
    ```
    

---

# Packages

- 단순히 react와 react-dom을 install하거나, create-react-app, vite를 통해 쉽게 react 앱을 만들곤 해습니다만, 실제로 React내부는 그렇게 간단하지 않았으며, 여러가지 패키지들로 구성되어 있습니다.
- React가 Browser와 app에서 모두 동작할 수 있고, react를 웹 프로젝트에서 사용할 때 항상 package.json 파일을 가보면 react와 함께 react-dom이 install 되어 있는 이유 또한 여기서 찾아볼 수 있습니다.
- React는 여러 패키지들을 통해 추상화, 분리 및 재 사용, 의존성 주입을 통해 안정성 있게 구성 하였습니다.
- 여러 패키지들이 있지만 핵심적인 패키지들만 살펴보겠습니다.

![image](https://github.com/Gi-Youn-Oh/Next.js_Blog/assets/109953972/d8d83657-b893-49af-8697-6ed061f18ad3)

### 1. react (core)

- react의 핵심 패키지이자 컴포넌트 정의와 관련된 패키지입니다.
- 다른 패키지들의 모듈을 주입받아 제공하기 때문에 브라우저 또는 모바일(React-native)에 올려 사용할 수 있습니다

### 2. renderer

- Host환경 (browser, mobile)에 의존적인 패키지로서 Host ↔ React를 연결해주는 역할을 합니다.

### 3. legacy-event

- syntheticEvent로 기존 Host event를 wrapping하며 리액트에서 추가적인 작업이 이루어집니다.
- HTML Element를 생성하고 DOM에 mount시키는 작업 과정 중

### 4. scheduler

- Concurrent Mode, render phase에서의 일시정지, 중단, 재시작 등을 위해 이벤트의 우선순위에 따라 처리 순서를 조정하는 패키지 이며 host 환경에 의존적입니다. (브라우저의 경우 react가 계속 작업을 진행중이면 화면 rendering작업을 할 수 가 없다.)
- commit phase는 일관성을 위해 중지 없이 진행됩니다.

### 5. reconciler

- react에서 사용하는 Hooks (useState, useEffect등) 실제 코드가 구현된 패키지이며, reconcile(재조정) 과정에 필요한 핵심 코드들이 담겨있는 패키지입니다.
- 이 패키지에 구현된 코드들은 shared패키지에게 전달되어 react core패키지로 주입 됩니다.

---

# Summary

- React Fiber Architecture의 핵심 Fiber와 Package 구성을 살펴보았습니다.
- 이제 정말 React 내부 코드로 들어갈 준비가 완료된 것 같습니다.
- 다음 글부터 React내부 코드와 함께 본격적인 여정을 시작해보도록 하곘습니다.
