## Life-Cycle

### componentDidMount

- 렌더함수가 실행 되면 React가 JSX를 DOM에다 붙여줌 붙여주고 난 바로 그 순간에 특정한 동작을 할 수 있게 할 수 있다.
- 리 렌더링 시에는 작동하지 않는다.
- 비동기 요청 (setInterval 함수가 있다면 컴포넌트가 Unmount 되더라도 비동기 함수를 계속 실행된다.) 최악의 경우 함수가 다시 mount 했을 때  또 다른 setInterval 함수가 실행
- WillUnmount와 짝

### componentDidUpdate

- 리렌더링 후

### componentWillUnmount

- 컴포넌트가 제거되기 직전
- 부모가 나를 없앴을 때
- 비동기 요청 정리
- clearInterval

```jsx
클래스의 경우
constructor -> render -> Ref -> componentDidMount -> setState/props바뀔 때 -> shouldComponentUpdate -> re-render -> componentDidUpdate -> (부모가 나를 없앴을 때) componentWillUnmount -> 소멸
```

![image](https://user-images.githubusercontent.com/109953972/232232601-52d63e27-62e5-4b97-a14d-2bbb2efdf58b.png)

### Hook에서는 Life-Cycle함수를 사용 못한다 →UseEffect

## useEffect

함수 컴포넌트는 함수가 전체 다 다시 실행 되기 때문에 완전히 같다고 볼 수 없다.

```jsx
useEffect ( () => { // componentDidmount,componentDidUpdate 역할 (1대1 대응은 아니다)
	interval.current = setInterval(changeHand, 1000); 
	return () => { // componentWillUnmount 역할
		clearInterval(interval.current);
	}
}, [imgcoord]);
```

## 4. useMemo

- 함수의 리턴 값을 캐싱해서 기억
- useMemo : 복잡한 함수 값 기억 / useRef 일반 값 기억
- 

💡  랜더링이 발생했을 때, 이전 랜더링과 현재 랜더링 간에 `x`와 `y` 값이 동일한 경우, 다시 함수를 호출을 하여 `z` 값을 구하는 대신, 기존에 메모리의 어딘가에 저장해두었던 `z` 값을 그대로 사용

```jsx
 function MyComponent({ x, y }) {
  const z = useMemo(() => compute(x, y), [x, y]);
  return <div>{z}</div>;
}
```

### example

```jsx
function getLottoNumber() {
    console.log('getNumber');
    const candidate = Array(45).fill().map((v, i) => i + 1);
    const randomNum = [];
    while (candidate.length > 0){
        randomNum.push(candidate.splice(Math.floor(Math.random() * candidate.length), 1)[0])
    }
    const bonusNum = randomNum[randomNum.length -1];
    const lottoNum = randomNum.slice(0,6).sort((a, b) => b - a);
    return [...lottoNum, bonusNum]; //스프레드 연산자로 얕은 복사 (불변성 유지)
};

// Not useMemo
// const Lotto = () => {
//     const [lotto, setLotto] = useState(getLottoNumber()); // 컴포넌트 리렌더링 마다 함수 호출
//     // const [lotto, setLotto] = useState(getLottoNumber); lazy init 함수 자체를 전달하면 한번만 렌더링
//     return <div>{lotto.join(',')}</div>
// };
// useMemo
const Lotto = () => {
    const cacheNum = useMemo(() => getLottoNumber(), []);
    const [lotto, setLotto] = useState(cacheNum); // 컴포넌트 리렌더링 마다 함수 호출
    // const [lotto, setLotto] = useState(getLottoNumber); lazy init 함수 자체를 전달하면 한번만 렌더링
    return <div>{lotto.join(',')}</div>
};
```

## 5. useEffect

- componentDidMount, componentDidUpdate, componentWillUnmount

```jsx
const Effect = () => {
    const [hidden, setHidden] = useState(false);
    //첫 렌더링 시 실행 후 hidden이 변경될 때 마다 실행
    useEffect(() => {
        console.log('hidden changed');
    }, [hidden]); // componentDidMount, componentDidUpdate

    useEffect(() => {
        console.log('hidden changed');
        return () => { // componentWillUnmount
         console.log('hidden이 바뀔 예정');
        };
    },[hidden]);

    // mount될 때 한번만 실행하고 싶다면? [] 빈 배열
    useEffect(() => {
        console.log('mounted');
        return () => {
            console.log('unmount');
        }
    },[])

    // re-rendering 마다 실행
    useEffect(() => {
        console.log('re-render');
    })
};
```

## 6. useCallback

- 함수 자체를 캐싱
- 자식컴포넌트에 함수를 넘길 때는 필수!

```jsx
const memoizedCallback = useCallback(함수, 배열);
```

### example

- button의 props인 함수가 새로 생성되면 props가 바뀌는 것이므로 리렌더링 됨새로 생성되어야 할 상황이 아니라면 막아야 한다.

```jsx
//Not useCallback
const Callback = ({name, age, lang}) => {
    const [hide, setHide] = useState(false);
    return (
        <div>
            <span>저는 {lang} 전문 {name}입니다.</span>
            {!hide && <span>{age}살 입니다.</span>}
            <button onClick={()=> setHide(true)}>Hiding</button>
        </div>
    );
};
//useCallback
const Callback =({name, age, lang}) => {
    const [hide, setHide] = useState(false);

    const onClickButton = useCallback(() => {
        setHide(true);
    },[])
    return (
        <div>
            <span>저는 {lang} 전문 {name}입니다.</span>
            {!hide && <span>{age}살 입니다.</span>}
            <button onClick={onClickButton}>Hiding</button>
        </div>
    );
};
```

## 7. useContext

- Redux 이전부터 존재, Redux에서도 내부적으로 context 도입
- A→B→C→D 에서 A→D
- **전역 state 공유 시 유용, But ! Provider value 변경 시 useContext를 사용하는 모든 컴포넌트가 리렌더링된다. → 다른 컨텍스트를 사용하거나, 컴포넌트를 분리해서 React.memo를 사용하자!**

### example

- GrandParent → Parent → Child 구조에서 GrandParent → Child로 바로 전달

**GrandParent**

```jsx
export const UserContext = createContext({ // 원하는 공유 데이터 초깃 값
   setLogIn: () => {},
   setLoading: () => {},
});

const GrandParent = () => {
    const [logIn, setLogIn] = useState(false);
    const [loading, setLoading] = useState(false);
    // value=객체, useMemo를 안하면 이 데이터를 사용하는 모든 컴포넌트가 매번 리렌더링
    const value = useMemo(() => ({setLogIn, setLoading}), [setLogIn, setLoading]);
    return (
        <UserContext.Provider value={value}>
            <Parent/>
            <div>{logIn ? '로그인' : '노 로그인'}</div>
            <div>{loading ? '로딩중' : '노 로딩'}</div>
        </UserContext.Provider>
    );
};
```

**Parent**

```jsx
const Parent = memo(() => {
    return <Child />;
});
```

**Child**

```jsx
const Child = () => {
  const {setLogIn, setLoading} = useContext(UserContext);
  return (
      <>
        <button onClick={() => setLogIn((prev) => !prev)}>로그인</button>
          <button onClick={() => setLoading((prev) => !prev)}>로딩</button>
      </>
  )
}
```

## 8. useReducer

- 많은 State를 관리하기 어려울 때
- redux는 동기적 useReducer는 비동기적으로 작동
- State는 dispatch로만 접근한다.
- dispatch (action 전달 type과 값)로 State관리
- action을 어떻게 할 것인가? → Reducer

```jsx
function reducer (state, action) {
    switch (action.type) {
        case "increase":
            return {count: state.count + action.step};
        case "decrease":
            return {count: state.count - action.step};
        default:
            throw new Error('undefinde Action Type', action.type);
    }
}

const initialState = {
    count: 0,
}
function Counter () {
    const [state, dispatch] = useReducer(reducer, initialState);

    return (
        <>
            <h2>{state.count}</h2>
            <button onClick={() => dispatch({ type: "increase", step: 1 })}>증가</button>
            <button onClick = {() => dispatch({type: 'decrease', step: 1})}>감소</button>
        </>
    );
};
```