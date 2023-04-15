# Iterble?

- "iterable" 객체는 "Symbol.iterator" 속성을 가지며, 이 속성은 "Iterator" 객체를 반환하는 함수
- "Iterator" 객체는 "next()" 메서드를 가지며, 이 메서드를 호출하면 순ck적으로 요소를 반환하고, 마지막 요소에 도달하면 "done" 속성이 "true"가 된다.
- 자바스크립트에서는 배열, 문자열, 맵, 셋 등이 iterable 객체

### ES6 이전 순회 가능한 데이터

1. 배열
2. 문자열
3. 유사배열객체
4. DOM 컬렉션

### ES6 변경 사항

- 순회 가능한 데이터 컬렉션을 이터레이션 프로토콜을 준수하는 이터러블로 통일
- for…of, 스프레드, 배열 디스트럭처링

## Interation Interface (ES6)

## 1. iterable

- iterator 객체를 반환하는 함수를 값으로 갖는 @@iterator 프로퍼티를 포함해야 한다.
- @@iterator ⇒ Symbol.iterator

```jsx
arr.values()
-> Array Iterator {}

메서드 values()가 iterator 객체를 반환하는 함수
```

## 2. iterator

- iterator객체는 iteratorResult를 반환하는 next 메서드를 포함

## 3. iteratorResult

- boolean타입의 값을 갖는 done과 모든 타입의 값을 가질 수 있는 value프로퍼티를 갖는다.
- iterator가 끝에 도달하지 않았다면 done은 false이고 value는 이용 가능하다.
- iterator가 끝에 도달했다면 done은 true이고 value는 iterator의 반환 값이다.
- **done = 순회 완료 여부 / value = 최근 순회 요소**

참조 생각 코드

![image](https://user-images.githubusercontent.com/109953972/231972295-31f28fc7-b79e-4519-b689-5f1ef98f537c.png)

Math.max([1, 2, 3]) 안됨

![image](https://user-images.githubusercontent.com/109953972/231972344-c031db23-17ae-4cac-98aa-4435a5630aff.png)

## Iterable 활용

## rest랑 스프레드 연산자 구별 !

- 이 두 연산자를 구별하는 방법은 그 사용 위치에 따라서!
- 함수의 매개변수 목록에서 사용되면 rest 연산자, 함수 호출이나 배열이나 객체 리터럴에서 사용되면 스프레드 연산자

### 1) **rest 연산자**

- 함수의 인수 목록에서 나머지 매개변수를 표시하는데 사용
- rest 연산자는 함수의 매개변수 목록에서 마지막에 사용되며, 함수에 전달된 인수 중에서 해당 매개변수에 할당되지 않은 나머지 인수들을 배열로 수집

```jsx

function sum(a, b, ...rest) {
  console.log(rest); // [3, 4, 5]
  return a + b + rest.reduce((acc, val) => acc + val, 0);
}

sum(1, 2, 3, 4, 5);

```

### 2) **스프레드 연산자:**

- 배열이나 객체를 확장하거나 병합할 때 사용
- 스프레드 연산자는 함수 호출에서 인수 목록 중간에 사용되거나, 배열이나 객체 리터럴에서 사용

**Case 1. 함수 호출에서의 스프레드 연산자:**

```jsx

function sum(a, b, c) {
  return a + b + c;
}

const arr = [1, 2, 3];
console.log(sum(...arr)); // 6

```

**Case 2. 배열에서의 스프레드 연산자:**

```jsx

const arr1 = [1, 2];
const arr2 = [3, 4];

const arr3 = [...arr1, ...arr2];

console.log(arr3); // [1, 2, 3, 4]

```

**Case 3. 객체에서의 스프레드 연산자:**

```jsx

const obj1 = { a: 1, b: 2 };
const obj2 = { c: 3, d: 4 };

const obj3 = { ...obj1, ...obj2 };

console.log(obj3); // { a: 1, b: 2, c: 3, d: 4 }

```

## Array.from

- 이러터블 또는 유사배열객체를 전달받아 배열로 변환

```jsx
const arrayLike = {
	0: 1,
	1: 2,
	2: 3,
};

const arr = Array.from(arrayLike);
console.log(arr); // [1, 2, 3]
```
---

# Generator?

- 순회가 가능한 데이터 컬렉션인 iterable / iterator 객체이다.
- 코드 블록의 실행을 일시 중지했다가 필요한 시점에 재개할 수 있는 특수한 함수

## 특징

- 함수 호출자에게 함수 실행의 제어권을 양도 할 수 있다.
- 함수 호출자와 함수의 상태를 주고 받을 수 있다.
- 제너레이터 객체를 반환한다.
- 비동기 처리는 한 예시 일뿐
- 동기적 일 때도 처리 할 수 있음
- 애로우 펑션으로는 못만듬

## Generator 함수

- generator 인스턴스를 생성한다.

### Generator 인스턴스

- iterable 인터페이스와 iterator 인터페이스를 동시에 구현한다.

![image](https://user-images.githubusercontent.com/109953972/231973100-4605df82-13ac-452c-9530-d2ac1da2c4d5.png)

## 제너레이터 함수

### 1. function*

### 2. yield

### 3. yield*

## Lazy Evaluation

- 계산의 결과값이 필요할 때까지 계산을 늦추는 기법
- 필요한 데이터를 필요한 순간에 생성한다.

```jsx
function* generator () {
	yield 1;
	yield 2;
	yield 3;
}

const gen = generator();

console.log(gen.next().value); // 1
console.log(gen.next().value); // 2
console.log(gen.next().value); // 3

// 동일하게 동작
 
function* generator() {
  yield* [1, 2, 3]
}

const gen = generator();

```