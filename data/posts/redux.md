## Redux

### React = Library

- 상태 관리나 라우팅 등 필요한 조건을 제공하지 못해 필요한 조건을 충족하지 못해서
- but 생태계 자체는 FrameWork Because 상태관리, 라우팅 다씀

<aside>
💡 그렇다면 상태관리는 ? Redux vs Mobx vs Context API 편한대로 프로젝트에 맞게 끔

</aside>

## Redux = Library

- **단 방향**
- **컴포넌트 간 State를 관리하기 어려워서 사용**

### Middleware

- dispatch - reducer 사이

### 장점

- **단방향:** action → dispatch (기록) → reducer (new object 생성) → store (state) 변경=대체 ⇒ error finding 용이!
- 기록이 있기 때문에 거슬러 올라갈 수 있음

### 단점

- 아주 작은 기능이여도 리덕스로 구현하는 순간 몇 개의 파일(액션등을 미리 만들어놔야함)들을 필수로 만들어야하여 코드량이 늘어난다.
- 타임머신 기능을 사용하려면 불변성 개념을 지켜야 사용할 수 있으므로 매번 state라는 객체를 만들어줘야 함

### Reducer (불변성)

- 얕은 복사를 하기 때문에 참조해서 많은 메모리 사용은 아니다.

```jsx
const reducer = (prevState, action) => { };

const initialState = {
    compA: 'a',
    compB: 12,
    compC: null,
}
// reducer 가 action을 통해 매번 새로운 객체를 만들어줌 (기록)
const nextState = {
    compA: 'b',
    compB: 12,
    compC: null,
}
const nextState = {
    compA: 'c',
    compB: 12,
    compC: null,
}
const nextState = {
    compA: 'd',
    compB: 12,
    compC: null,
}
```

- 순수함수: 매개변수와 함수내부에서 선언한 변수들을 제외한 나머지를 참조하지 않는다.

## action (함수 xx 객체 +{타입, 데이터or Payload 등 자유롭게})

- initialState  즉 기존 State를 어떻게 바꾸고 싶다에 대한 고민!

```jsx
1. store 만들기
createStore (reducer) 
2. 초기 state
3. action 만들기 (객체)
```

---

## Setting

```jsx
npm init
npm i redux
```

### 1. store 생성

Action을 실행하는 reducer와 초기 값 initialState로 구성됨

```jsx
//1. store 생성

const { createStore } = require('redux');

const reducer = () => {};

const initialState = {
    string: 'hello',
    number: 1,
    boolean: true,
};

const store = createStore(reducer, initialState);

console.log(store.getState());
```

### 2. Action 생성

- 함수가 아닌 객체이다.
- 기존(initialState)를 어떻게 바꾸고 싶은지 생각해 구현하면 된다.
- reducer와 짝

```jsx
//2. action 생성, 구체적 보다는 추상적으로 만드는 것이 확장성이 좋다.
// Bad Case
const chageString = {
    type: 'CHANGE_STRING',
    payload: 'bye',
}

// Good Case
const changeString = (text) => {
    return { // action
        type: 'CHANGE_STRING',
        data,
    }
};

store.dispatch(changeString('bye'));
```

### 3. Reducer 생성

- *state를 변경하는 함수, 순수함수여야 한다. (이전 state를 변경하지 않고, 새로운 state를 만들어서 반환한다.)*
- 불변성 유지
- 나중에 immer를 통해 코드 단축

```jsx
const reducer = (prevState, action) => {
    switch (action.type) {
        case 'CHANGE_STRING':
            return {
                ...prevState, // 기존의 state를 복사
                string: action.payload,
            };
        case 'CHANGE_NUMBER':
            return {
                ...prevState,
                number: action.payload,
            };
        case 'CHANGE_BOOLEAN':
            return {
                ...prevState,
                boolean: action.payload,
            };
        default:
            return prevState;
    }
};
```

### 4. dispatch

Action을 reducer 로 보냄

```jsx
store.dispatch(changeString('bye'));
console.log('after change string',store.getState()); 

store.dispatch(changeNumber(2));
console.log('after change number',store.getState()); 

store.dispatch(changeBoolean(false));
console.log('after change boolean',store.getState());
```

![image](https://user-images.githubusercontent.com/109953972/233972924-236b8b66-4a75-4f12-8561-728461ce0ea0.png)

### Example

```jsx
//1. store 생성

const { createStore } = require('redux');

// 3. reducer 생성, state를 변경하는 함수, 순수함수여야 한다. (이전 state를 변경하지 않고, 새로운 state를 만들어서 반환한다.)
const reducer = (prevState, action) => {
    switch (action.type) {
        case 'LOG_IN':
            return {
                ...prevState, // 기존의 state를 복사
                user: action.payload,
            };
        case 'ADD_POSTING':
            return {
                ...prevState,
                posts: [...prevState.posts, action.payload]
            };
        case 'LOG_OUT':
            return {
                ...prevState,
                user: null,
            };
        default: // 오타 대비
            return prevState;
    }
};

const initialState = {
    user: null,
    posts: [],
};

const store = createStore(reducer, initialState);

const logIn = (payload) => { // action creator
    return { // action
        type: 'LOG_IN',
        payload,
    }
};

const logOut = () => {
    return {
        type: 'LOG_OUT',
    }
};

const addPosting = (payload) => {
    return {
        type: 'ADD_POSTING',
        payload,
    }
};
// 위 쪽은 미리 만들어 두기
//--------------------------------------------------------

console.log(store.getState(), '\n'); 

store.dispatch(logIn({
    id: 1,
    name: 'Giyoun',
    admin: true,
}));
console.log('after log-in', store.getState(), '\n');

store.dispatch(addPosting({
    useId: 1,
    id: 1,
    content: 'Redux ing',
}));
console.log('after posting', store.getState(), '\n');

store.dispatch(addPosting({
    useId: 1,
    id: 2,
    content: 'Second posting',
}));
console.log('after posting 2', store.getState(), '\n');

store.dispatch(logOut());
console.log('after log-out', store.getState());
```

![image](https://user-images.githubusercontent.com/109953972/233972969-12d6f0dc-54d2-4d53-9343-c80ea16f888f.png)

---

## 폴더구조

- 데이터를 중심으로 나눈다.
- 보통 reducer, action 폴더로 나누어서 분리
- reducer에는 index가 있고 함수이기 때문에 combineReducer를 통해 분리한 함수를 합쳐준다.
- action은 index없이 데이터 중심으로 구별
- 분리하고 나서는 각 action 과 reducer가 담당하는 initailState의 스코프가 줄었기 때문에 해당 리듀서에서 initailState를 다시 재설정 해줘야 한다.

---

## Middleware

- dispatch 와 reducer 사이
- 동기 비동기 동기
- 동기와 동기 사이에 어떤 작업을 할 수 있도록 해준다.
- 간단한 것들은 thunk 복잡한 비동기 처리는 redux-saga

```jsx
const firstMiddleware = (store) => (next) => (action) => {
    console.log('first middleware');
    next(action);
};

function firstMiddleware(store) {
    console.log('first middleware');
    return function (next) {
        console.log('first middleware');
        return function (action) {
            console.log('first middleware');
            next(action);
        }
    }
}
```

### compose

- 합쳐서 구성해줌

```jsx
const enhancer = compose(
    applyMiddleware(firstMiddleware),
    devtool,
);
```

### test

- code

```jsx
// next = dispatch
const firstMiddleware = (store) => (next) => (action) => {
    console.log('action logging', action, '\n'); // 추가 기능
    next(action); // 기본 기능
    console.log('end action', '\n'); // 전 후로 추가 가능 
};

const enhancer = applyMiddleware(firstMiddleware);
```

- result

![image](https://user-images.githubusercontent.com/109953972/233973032-13d3081a-4a35-44d2-bbf4-4f697983fa75.png)

## React-redux connect

- 기존 react 필요 모듈 설치

## redux-devtools

```jsx
npm i redux-devtools-extension -D
```

## Class component

- connect () 함수를 통해 HOC high ordered component 연결

## Immer

- redux에서 직관적인 단점인 reducer 코드의 길어지는 현상 해결

```jsx
const userReducer = (prevState = initialState, action) => { // 새로운 state 만들어주기
  switch (action.type) {
    case 'LOG_IN_REQUEST':
      return {
        ...prevState,
        data: null,
        isLoggingIn: true,
      };
    case 'LOG_IN_SUCCESS':
      return {
        ...prevState,
        data: action.data,
        isLoggingIn: false,
      };
    case 'LOG_IN_FAILURE':
      return {
        ...prevState,
        data: null,
        isLoggingIn: false,
      };
    case 'LOG_OUT':
      return {
        ...prevState,
        data: null,
      };
    default:
      return prevState;
  }
};
```

### 극적인 예시

```jsx
    case 'LOG_OUT':
      return {
        ...prevState,
        data: null,
				deep {
					...prevState.deep,
						deeper: {
								...prevState.deeper,
								a: 'b',
							}
					}
      };

=> state.deep.deeper.a = 'b';
```

- produce안에 넣어주고, case마다 break

```jsx
const { produce } = require('immer');

const initialState = {
  isLoggingIn: false,
  data: null,
};

// nextState = produce(prevState, (draft) => {}) 기본 코드
// immer => 불변성 유지를 위해 코드가 길어지는 것을 해결해줌
const userReducer = (prevState = initialState, action) => { // 새로운 state 만들어주기
  return produce(prevState, (draft) => {
    switch (action.type) {
      case 'LOG_IN_REQUEST':
        draft.data = null;
        draft.isLoggingIn = true;
        break;
      case 'LOG_IN_SUCCESS':
        draft.data = action.data;
        draft.isLoggingIn = false;
        break;
      case 'LOG_IN_FAILURE':
        draft.data = null;
        draft.isLoggingIn = false;
        break;
      case 'LOG_OUT':
        draft.data = null;
        break;
      default:
        break;
    }
  });
};

module.exports = userReducer;
```

## toolkit

- redux에서 쓰는 대표적인 기능들을 축약 해서 모아놓음
- immer , redux , devtools , thunk 내장
- 코드 간결화

### slice 등장

- reducer, action, initailState 합쳐짐
- 왜 합침? action ↔ reducer 짝
- action에는 비동기만 처리

### devtool

- 동일한 requsetId를 부여해서 action 포함관계를 파악하기 쉽다.

![image](https://user-images.githubusercontent.com/109953972/233973108-29624ff8-efb2-4bdd-8147-f63d5314cff7.png)

![image](https://user-images.githubusercontent.com/109953972/233973126-79245400-5f0c-461d-b88c-63bde1b9e315.png)

---

## Redux 사용하지 말아야 할 때

- 코드양이 많아지기 때문에 무조건 쓰는 것은 좋지 않다.
- input 에서 웬만하면 사용 하지 않는 편이 좋다 ( 한 컴포넌트에서만 쓰이는 것들은 state로 관리 )

매번 dispatch → onBlur ? onSubmit

![image](https://user-images.githubusercontent.com/109953972/233973176-fd3018ed-1c10-4f57-8f30-4f9957e10b0f.png)

setState를 쓰고 onSubmit 할때 dispatch

![image](https://user-images.githubusercontent.com/109953972/233973195-0df96205-d412-4208-880f-df0e08bbcba6.png)

- 비동기 요청이 한 컴포넌트에서만 실행 될 때, 다른 컴포넌트에 영향을 미치지 않을 때

```jsx
// 컴포넌트 하나에서만 요청을 보내는 경우 dispatch로 보내는 것보다 낫다.
  // dispatch로 처리하면 코드가 길어진다.
  const onClick = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setFulfilled(false);
    try {
      const response = await axios.post('/api/login');
      setFulfilled(true);
    } catch (e) {
      setError(e);
    } finally{
      setIsLoading(false);
    }
  }, []);
```

# Saga

### 필요한 이유

- 동기적으로 바로바로 실행되기 때문에 특정시간, 또는 특정 동작 이후에 액션을 실행할 수 없다.
- thunk가 쉽지만 기능이 부족

```jsx
npm i redux-saga
```

- 제너레이터 사용 함수 중간에 중단, 재개 할 수 있다. → 비동기나 무한
- 별도 미들웨어 만들지 말고 스토어에서 뿌리기
- 리듀서처럼 루트사가 만들고 세부 사가들 만들어서 연결
- 스토어에서 미들웨어 사가 생성 후 미들웨어에 연결 스토어랑 연결 앱이랑 연결
- async/await 보다 제너레이터가 할 수 있는게 많아서 씀
- 제너레이터로 callback hell 해결
- 사가에서 동작하지 않아도 리듀서는 동작

```jsx
function* generator() {
  let i = 0;
  while (true) {
    yield i++;
  }
}
```

## 상태 관리는 어떤 것을 사용해야 좋을까?

### ⇒ 프로젝트 규모와 상황에 따라서

- 간단한 context API부터 Recoil, Zustand 등이 있지만, 규모가 커질수록 Client State는 Redux로, Server State는 ReactQuery로 관리하는 것이 좋을 것 같다.