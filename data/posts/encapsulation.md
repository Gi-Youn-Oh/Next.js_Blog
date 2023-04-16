## 캡슐화

- 객체의 상태를 나타내는 프로퍼티와 프로퍼티를 참조하고 참조할 수 있는 동작인 메서드를 하나로 묶는 것

## 정보 은닉

- 객체의 특정 프로퍼티나 메서드를 감출 목적으로 사용

→ 외부에 공개할 필요가 없는 구현의 일부를 외부에 공개되지 않도록 감추어 적절치 못한 접근으로 부터 객체의 상태 변경을 방지해 정보 보호, 상호 의존성 (결합도)를 낮춘다.

### Class

- Public
- Private
- Protected

### In JavaScript

```jsx
function Person(name, age) {
    this.name = name; // public
    let _age = age; // private

    // 인스턴스 메서드
    this.sayHi = function() {
        console.log(`Hi! My name is ${this.name}. I'm ${_age} years old.`);
    };
}

const me = new Person('Lee', 20);
me.sayHi(); // Hi! My name is Lee. I'm 20 years old.
console.log(me.name); // Lee
console.log(me._age); // undefined

const you = new Person('Kim', 30);
you.sayHi(); // Hi! My name is Kim. I'm 30 years old.
console.log(you.name); // Kim
console.log(you._age); // undefined
```

- 인스턴스 메서드는 Person객체가 생성될 때마다 중복 생성된다.

### Prototype

```jsx
function Person(name, age) {
    this.name = name; // public
    let _age = age; // private
}

// 프로토타입 메서드
Person.prototype.sayHi = function() {
    // Person 생성장 함수의 지역 변수 _age에 접근할 수 없다.
    console.log(`Hi! My name is ${this.name}. I'm ${_age} years old.`);
};
```

- Person.prototype.sayHi 메서드 내에서 Person 생성자 함수의 지역 변수 _age를 참조할 수 없다.

```jsx
const Person = (function() {
    let _age = 0; // private

    // 생성자 함수
    function Person(name, age) {
        this.name = name; // public
        _age = age; // private
    }

    // 프로토타입 메서드
    Person.prototype.sayHi = function() {
        console.log(`Hi! My name is ${this.name}. I'm ${_age} years old.`);
    };

    return Person;
}());

const me = new Person('Lee', 20);
me.sayHi(); // Hi! My name is Lee. I'm 20 years old.
console.log(me.name); // Lee
console.log(me._age); // undefined

const you = new Person('Kim', 30);
you.sayHi(); // Hi! My name is Kim. I'm 30 years old.
console.log(you.name); // Kim
console.log(you._age); // undefined
```

### Problem

```jsx
const me = new Person('Lee', 20);
me.sayHi(); // Hi MyName is Lee. I am 20.

const you = new Person('Kim', 30);
you.sayHi(); // Hi My Nmae is Kim. I am 30.

// _age변수 값이 변경된다.
me.sayHi(); // Hi My Name is Lee. I am 30.
```

- Person.prototype.sayHi 메서드가 단 한번 생성되는 클로저 이기 때문

## 잘못된 클로저 사용 예시

```jsx
var funcs = [];

for (var i = 0; i < 3; i++) {
    funcs[i] = function() { return i; };
    // console.log(funcs[i]()); // [
    //     [Function (anonymous)],
    //     [Function (anonymous)],
    //     [Function (anonymous)]
    //   ]
    console.log(i); // 0 1 2 3
}
console.log(i);
for (var j = 0; j < funcs.length; j++) {
    console.log(funcs[j]()); // 3 3 3 
}
```

- var 키워드로 선언한  i 변수는 블록 레벨 스코프가 아닌 함수 레벨 스코프를 갖기 때문에 전역 변수이다.

## 올바른 클로저 사용

```jsx
var funcs = [];

for (var i = 0; i < 3; i++) {
    funcs[i] = (function (id) {
			return function () {
				return id;
			};
		}(i));
}

for (var j = 0; j < funcs.length; j++) {
    console.log(funcs[j]()); // 3 3 3 
}
```

- var 키워드로 선언한  변수가 전역 변수가 되기 때문에 발생하는 현상

```jsx
const funcs = [];

for (let i = 0; i < 3; i++) {
	funcs[i] = function () {return i};
}

for (let i = 0; i < funcs.length; i++) {
	console.log(funcs[i]()); // 0 1 2
}
```

- for문의 변수 선언문에서 let 키워드로 선언한 변수를 사용하면 for문의 코드 블록이 반복 실행될 때 마다 for문 코드 블록의 새로운 렉시컬 환경이 생성된다.

<aside>
💡 코드 블록 내부에서 함수를 정의할 때 의미가 있다. 반복문의 코드 블록 내부에 함수 정의가 없는 반복문이 생성하는 새로운 렉시컬 환경은 반복 직후, 아무도 참조하지 않기 때문에 가비지 컬렉션의 대상이 된다.

</aside>

### 고차 함수 사용 (함수형 프로그래밍)

```jsx
// 요소가 3개인 배열을 생성하고 배열의 인덱스를 반환하는 함수를 요소로 추가한다.
// 배열의 요소로 추가된 함수들은 모두 클로저다.
const funcs = Array.from(new Array(3), (_, i) => () => i); // (3) [f, f, f]

// 배열의 요소로 추가된 함수들을 순차적으로 호출한다.
funcs.forEach(f => console.log(f())); // 0 1 2
```