## 개념 정의

- 함수와 그 함수가 선언된 렉시컬 환경의 조합이다.
- 어떤 함수 A에서 선언한 변수 a를 참조하는 내부함수 B를 외부로 전달할 경우 A의 실행 컨텍스트가 종료된 이후에도 변수 a가 사라지지 않는 현상

<aside>
💡 어떤 함수의 렉시컬 환경은 해당 함수의 생명주기가 종료되는 즉시 사라지는 것이 아니고, 참조가 없을 때 가비지 컬렉터에 의해서 사라진다.

</aside>

## 렉시컬 환경과 클로저

- 함수 객체는 내부 슬롯에 저장한 렉시컬 환경의 참조, 즉 상위 스코프를 자신이 존재하는 한 기억한다.

## 예시

```jsx
const x = 1;

function outer() {
	const x = 10;
	const inner = function () { console.log(x); }
	return inner;
}

const innerFunc = outer(); // 여기서 outer()는 inner를 리턴해주고 생명주기 종료
innerFunc(); // 10
```

- outer 함수를 호출하면 중첩 함수 inner를 반환하고 생명 주기 마감
- outer 함수 실행 컨텍스트 스택에서 팝
- 이 때 outer 지역변수 x와 값 10 또한 생명 주기 마감
- 그러나 innerFunct() 호출 하면 10 출력

<aside>
💡 이와 같이 중첩함수가 외부함수보다 더 오래 유지되는 경우 이미 종료된 외부함수의 변수를 참조할 수 있다! 이러한 중첩함수를 클로저라고 한다.

</aside>

## 클로저에 해당하지 않는 경우

- 상위 스코프의 식별자를 참조 하지 않을 때

```jsx
function foo () {
    const x = 1;
    const y = 2;
    // 클로저 x
    function bar () {
        const z = 3;
        
        debugger;
        // 상위 스코프의 식별자를 참조하지 않는다.
        console.log(z);
    }
    return bar;
}

const bar = foo ();
bar();
```

- 외부 함수보다 먼저 소멸하는 경우

```jsx
function foo () {
    const x = 1;

    // bar함수는 클로저였지만 곧바로 소멸한다.
    // 이러한 함수는 일반적으로 클로저라고 하지 않는다.
    function bar () {
        debugger;
        // 상위 스코프의 식별자를 참조한다.
        console.log(x);
    }
    bar();
}

foo();
```

## 클로저에 해당하는 경우

```jsx
function foo () {
    const x = 1;
    const y = 2;

    // 클로저
    // 중첩함수 bar는 외부함수보다 더 오래 유지되며 상위 스코프의 식별자를 참조한다.
    function bar () {
        debugger;
        console.log(x);
    }
    return bar;
}

const bar = foo ();
bar();
```

<aside>
💡 클로저에 의해 참조되는 상위 스코프의 변수를 자유변수라고 부른다.

</aside>

- 클로저란 함수가 자유 변수에 대해 닫혀있다.

## 클로저 활용

- 상태를 안전하게 변경하고 유지하기 위해 사용!  ( 상태를 안전하게 은닉하고 특정 함수에게만 상태 변경을 허용)

### 오류 발생 우려 되는 코드

```jsx
let num = 0;

const increase = function () {
    return ++num;
};

console.log(increase()); // 1
console.log(increase()); // 2
console.log(increase()); // 3
```

- num은 전역변수이기 때문에 누구든 접근할 수 있고 변경할 수 있다는 문제점 발생

### 클로저 사용 안전성 보장 코드

```jsx
const increase = (function () {
    let num = 0;
    // 클로저
    return function () {
        return ++num;
    }
}());

console.log(increase()); // 1
console.log(increase()); // 2
console.log(increase()); // 3
```

- 클로저는 상태가 의도치 않게 변경되지 않도록 안전하게 은닉하고 특정 함수에게만 상태 변경을 허용하여 상태를 안전하게 변경하고 유지하기 위해 사용한다.

### 즉시 실행 함수

```jsx
const counter = (function () {
    let num = 0;

    // 클로저인 메서드를 갖는 객체를 반환
    // 객체 리터럴은 스코프를 만들지 않는다.
    // 따라서 아래 메서드들의 상위 스코프는 즉시 실행 함수의 렉시컬 환경이다.
    return {
        // num: 0 //프로퍼티는public하므로 은닉되지 않는다.
        increase() {
            return ++num;
        },
        decrease() {
            return num > 0 ? --num : 0;
        }
    };
}());

console.log(counter.increase()); // 1
console.log(counter.increase()); // 2
console.log(counter.decrease()); // 1
console.log(counter.decrease()); // 0
```

### 생성자 함수로 표현

```jsx
const Counter = (function () {

    let num = 0;

    function Counter() {
        // this.num = 0; // 프로퍼티는 public하므로 은닉되지 않는다.
    }

    Counter.prototype.increase = function () {
        return ++num;
    }

    Counter.prototype.decrease = function () {
        return num > 0 ? --num : 0;
    }

    return Counter;
}());

const counter = new Counter();

console.log(counter.increase()); // 1
console.log(counter.increase()); // 2
console.log(counter.decrease()); // 1
console.log(counter.decrease()); // 0
```

- 즉시 실행 함수가 반환하는 객체 리터럴은 즉시 실행 함수의 실행 단계에서 평가되어 객체가 된다. 이 때 객체의 메서드도 함수 객체로 생성된다. 객체 리터럴의 중괄호는 코드 블록이 아니므로 별도의 스코프를 생성하지 않는다.

### 함수형 프로그래밍에서의 활용

```jsx
// 함수를 인수로 전달받고 함수를 반환하는 고차 함수
// 이 함수는 카운트 상태를 유지하기 위한 자유 변수 counter를 기억하는 클로저를 반환한다.
function makeCounter(aux) {
    // 카운트 상태를 유지하기 위한 자유 변수
    let counter = 0;

    // 클로저를 반환
    return function () {
        // 인수로 전달받은 보조 함수에 상태 변경을 위임한다.
        counter = aux(counter);
        return counter;
    };
}

// 보조 함수
function increase(n) {
    return ++n;
}

// 보조 함수
function decrease(n) {
    return n > 0 ? --n : 0;
}

// 함수로 함수를 생성한다.
// makeCounter함수는 보조 함수를 인수로 전달받아 클로저를 반환한다.
const increaser = makeCounter(increase);
console.log(increaser()); // 1
console.log(increaser()); // 2
// increaser 함수와는 별개의 독립된 렉시컬 환경을 갖기 때문에 카운터 상태가 연동하지 않는다.
const decreaser = makeCounter(decrease);
console.log(decreaser()); // -1
console.log(decreaser()); // -2
```

<aside>
💡 자유변수를 공유하지 않기 때문에  증감이 연동되지 않는다.

</aside>

### 렉시컬 환경을 공유하는 클로저

```jsx
// 함수를 인수로 전달받고 함수를 반환하는 고차 함수
// 이 함수는 카운트 상태를 유지하기 위한 자유 변수 counter를 기억하는 클로저를 반환한다.
const Counter = (function () {
    // 카운트 상태를 유지하기 위한 자유 변수
    let counter = 0;

    // 클로저를 반환
    return function (aux) {
        // 인수로 전달받은 보조 함수에 상태 변경을 위임한다.
        counter = aux(counter);
        return counter;
    };
}());

// 보조 함수
function increase(n) {
    return ++n;
}

// 보조 함수
function decrease(n) {
    return n > 0 ? --n : 0;
}

// 보조함수를 전달하여 호출
console.log(Counter(increase)); // 1
console.log(Counter(increase)); // 2

// 자유 변수를 공유한다.
console.log(Counter(decrease)); // 1
console.log(Counter(decrease)); // 0
```