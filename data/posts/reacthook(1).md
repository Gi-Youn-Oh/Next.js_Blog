## 1. useState

- class 형 컴포넌트에서는 this를 통해 state를 관리했었지만 함수 컴포넌트에서는 setState로 관리한다.
- 직접 변수를 새로 할당하면 리렌더링 되지 않는다 → React가 인식할 수 있도록 setState를 사용해야한다.

```jsx
const [<상태 값 저장 변수>, <상태 값 갱신 함수>] = useState(<상태 초기 값>);
```

- setState는 비동기로 동작한다. (변경된 값들을 모아 한번에 업데이트를 진행하여 렌더링을 줄이고자)

---

**setState는 비동기(이전 state로 현재 state를 만들 때 무조건)**

```jsx
this.setState((prevState) => {
	return {
		value: prevState.value + 1
};
```

### **setState의 Callback 함수를 사용하는 경우**

react에서 setState의 Callback 함수를 사용하는 경우는 state를 변경 후 변경된 state를 사용하는 경우

**Callback 함수를 사용하지 않은 경우**

```jsx
twiceButtonClick = () => {
    this.setState({ num: this.state.num * 2 });
    console.log("state : " + this.state.num);
  };
```

**실행 결과**

[* 2] 버튼을 클릭 전 결과입니다.

![image](https://user-images.githubusercontent.com/109953972/232232860-4156ed95-6889-4419-9784-b2b250f1a077.png)

[* 2] 버튼 클릭 전

[* 2] 버튼을 클릭 후 결과입니다.

![image](https://user-images.githubusercontent.com/109953972/232232867-8a1550de-8734-425b-af63-0ff92a3cf4ff.png)

[* 2] 버튼 클릭 후

setState 함수가 실행되어 this.state.num의 값이 2로 변경되었는데, 콘솔에는 변경되기 전 값이 출력

이러한 이유는 setState가 비동기 함수이기 때문

setState 함수는 이벤트 핸들러 함수에서 바로 값을 갱신(변경)하는 것이 아니라 이벤트 핸들러 함수가 종료 후 react에 의해 state 값이 갱신

setState 함수로 state의 값을 변경 후 갱신된 값을 콘솔에 출력하기 위해서는 setState의 Callback 함수를 사용해야 한다.

---

## 2. ShouldComponentUpdate( )

- React는 State가 변하지 않아도 class 에서는 setState가 호출 되기만해도 렌더링 된다.

### React.memo (함수 컴포넌트)

- 부모 컴포넌트가 리렌더링 → 자식 컴포넌트 리렌더링 막아줌
- State, props 변경 시에는 렌더링 됨

```jsx
개발자 도구 앞에 _C등 붙기때문에 
Try.displayName = 'Try'; 코드 입력
```

### PureComponent (Class 컴포넌트)

- state, props 변경시 인식 shouldComponentUpdate를 내부적으로 짜놓음

---

## 3. useRef

### 1) 특정 DOM element 참조하기

```jsx
function RefTest () {
    const [input, setInput] = useState({username: '', nickname: ''});

    const inputName = useRef();
    const {username, nickname } = input;

    const onChangeInput = (e) => {/
        const {name, value} = e.target;
        setInput({...input, [name]: value});
    };

    const onReset = () => {
        setInput({username: '', nickname: ''})
        inputName.current.focus(); //해당하는 컴포넌트 참조 ref={inputName}을 가지고 있는 컴포넌트가 참조 된다.
    };

    return (
        <>
            <input name={'username'} placeholder={'이름'} onChange={onChangeInput} value={username} ref={inputName}/>
            <input name={"nickname"} placeholder={'닉네임'} onChange={onChangeInput} value={nickname}/>
            <button onClick={onReset}>Reset</button>
        </>
    )
}
```

### 2) 리 렌더링과 관련 없는 데이터 저장 시 (초기 값을 기억)

```jsx
//useRef 미사용
let data = 0; // Test 컴포넌트를 여러개 사용하면 data를 공유하게 된다.
const Test = () => {
    let data = 0; 리렌더링 될 때 초기화 된다.
    const onClick = useCallback(() => {
       data ++;
        console.log(data);
    }, [data]);
    return <div><button onClick={onClick}>{data}</button></div>
}

//useRef 사용하면
const Test = () => {
    const dataRef = useRef(0);
    const onClick = useCallback(() => {
       dataRef.current++;
       console.log(dataRef);
    }, []);
    return <div><button onClick={onClick}>{data}</button></div>
};
```

### 3) useEffect에서 componentDidUpdate처럼 사용

- UseEffect에서는 componentDidmount, componentDidUpdate 같이 실행되지만 mount를 무시한다.

```jsx

const RefAsDidUpdate = () => {
    const mountRef = useRef(false);
    useEffect(() => {
        if(mountRef.current){  //초기값이 false이기 때문에  if문이 동작하지 않는다.
            console.log('updated!');
        }else{
            mountRef.current = true; // 다음 리렌더링에서는 동작하게 바꾼다.
        }
    });
    return <div>Ref</div>
};
```

## ETC

- Class는 Render( ) 만 재 실행, 함수 컴포넌트는 함수가 전체 다시 실행
- **webpack ⇒ 여러 .js 파일을 하나로 묶어준다.**
- node는 자바스크립트 실행기라고 생각하자. (백엔드, 서버 xx)
- **Bable ⇒ .jsx → .jx 파일로 변환**
- 화살표 함수는 return 생략 가능하다.
- Component를 분리했을 때 props로 전달을 해줘야 한다.

### 1) key

- 함수 컴포넌트에서의 배열은 map함수를 많이 사용하는데 key를 추가해 주어야 한다.

```jsx
map((v,i) => {}
i는 인덱스 넘버 (index를 key로 쓰면 성능최적화불가)
```

- React에서는 key를 기준으로 엘리먼트를 추가 하거나 수정 삭제 판단 하기 때문에 배열의 순서가 바뀌면 문제가 생기기 때문
- 즉 key가 없는 경우, 변경이 필요하지 않은 리스트의 요소까지 변경이 일어나게 되므로 비효율적이다.

### 2) setState rendering

- 클래스 컴포넌트에서는 setState만 실행되어도 리렌더링, 훅에서는 값이 달라져야지만 리렌더링

```jsx
const TestArr = () => {
    let Arr = [1, 2, 3];
    const [arr,setArr] = useState([1, 2, 3]);
    const onClick = () => {
        Arr.push(4);
        setArr(arr.push(4)); // 4만 출력
        arr.push(4);
        setArr(arr); // 123만 출력
        setArr((prev)=> [...prev, 4]); // 1234 출력
        console.log(arr);
    }
    return (
        <>
            <text>{arr}</text>
            <button onClick={onClick}>버튼</button>
        </>
    )
}
```

### 3) Lazy Init

```jsx
const [answer,setAnswer] = useState(getNumber()); 매번 함수 다시 실행
const [answer,setAnswer] = useState(getNumber) -> 함수의 return값이 answer에 한번만 들어가고 실행 안된다. // lazy init
 
setAnswer(getNumber()) set에서는 실행되야함
```