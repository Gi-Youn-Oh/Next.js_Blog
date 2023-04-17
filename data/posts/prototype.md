## Check Point

- 자바스크립트의 객체는 내부적으로 프로토타입 객체를 생성하며, 효율적인 상속을 위해서 프로토타입을 기반으로 상속을 구현한다.
- 클래스, 객체의 내용 복사 없이도 상속을 구현할 수 있게 해주는 방법이다.
- 상속을 통해 코드 재사용 및 불필요한 메모리 낭비를 방지한다.
- 객체 내부 프로퍼티가 없으면 객체와 연결된 프로토타입에서 찾고 없으면 연결된 프로토타입을 찾는다. (프로토타입 체이닝)
- 프로토타입 체이닝의 종점은 Object.prototype (단방향 링크드 리스트)
- 프로토 타입과 생성자 함수는 단독으로 존재할 수 없다. (항상 pair)
- 프로토타입은 생성자 함수가 생성되는 시점에 더불어 생성된다.

💡 클래스와 생성자 함수 모두 프로토타입 기반의 인스터를 생성하지만 정확히 동일하게 동작하지는 않으며, 클래스 보다 엄격하며 더 많은 기능을 제공한다.

```jsx
class Person {
	constructor(name) {
		this.name = name;
	}
	sayHello() {
		console.log(`${this.name} : hello!`);
	}
}
```

```jsx
function Person (name) {
	this.name = name;
	this.sayHello = function () {
		console.log(`${this.name} : hello!`);
	}
}
```

1. new 연산자가 새로운 빈 객체를 메모리 상에 생성한다.
2. 생성된 빈 객체가 this에 바인딩 된다.
3. this 객체의 속성을 채우는 동작이 수행된다.
4. return 하는 것이 없다면 그렇게 만들어진 this가 return된다.

```jsx
const giyoun = new Person('giyoun')
```

### 일반적 복사 상속 → 자바스크립트에서는 불가능

```jsx
class Person {
	constructor(name) {
		this.name = name;
	}
	sayHello() {
		console.log(`${this.name} : hello!`);
	}
}

class Crew extends Person {
	constructor(name) {
		super(name);
	}
	
	doCoding() {
		console.log(`${this.name}: coding...~`);
	}
}
```

💡 자바스크립트에서 복사는 원시 값과 객체의 참조값 뿐이다

## 프로토타입 객체

- 생성자 함수는 자신의 prototype 프로퍼티를 통해 프로토타입 객체에 접근할 수 있고, 프로토타입 객체는 자신의 constructor프로퍼티를 통해 생성자 함수에 접근할 수 있다.

## .__proto__

- __proto__ 접근자 프로퍼티를 통해 자신의 프로토타입 내부슬롯에 간접적으로 접근할 수 있다.
- 양방향으로 설정되어 무한루프에 빠지는 오류를 막기 위해 사용한다.

### 권장 사항

- 프로토 타입 취득 ⇒ getPrototyupeOf();
- 프로토 타입 교체 ⇒ setPrototypeOf();

💡 자바스크립트 모든 객체는 [[Prototype]]이라는 내부 슬롯을 가지지만, prototype 프로퍼티는 함수 객체 만이 소유한다.

## ES6 화살표 함수, 메서드 (축약표현으로 정의된)

- prototype프로퍼티를 소유하지 않으며, 프로토타입도 생성하지 않는다.
- 클래스도 함수이다.

```jsx
// 화살표 함수는 non-constructor이다.
const Person = name => {
    this.name = name;
};

// non-constructor는 prototype 프로퍼티를 소유하지 않는다.
console.log(Person.hasOwnProperty('prototype')); // false

// non-constructor는 프로토타입을 생성하지 않는다.
console.log(Person.prototype); // undefined

// ES6의 메서드 축약 표현으로 정의한 메서드는 non-constructor이다.
const obj = {
    foo() {}
};

// non-constructor는 prototype 프로퍼티를 소유하지 않는다.
console.log(obj.foo.hasOwnProperty('prototype')); // false

// non-constructor는 프로토타입을 생성하지 않는다.
console.log(obj.foo.prototype); // undefined
```

![image](https://user-images.githubusercontent.com/109953972/223552314-643aea15-ac7a-48da-a19a-e8b71a8fb512.png)

## 프로토타입체인과 스코프체인

- 프로토타입은 상속과 프로퍼티 검색을 위한 메커니즘
- 스코프체인은 식별자 검색을 위한 메커니즘
- 프로토타입 체인, 스코프 체인은 별도로 작동하는 것이 아니라 서로 협력하여 식별자와 프로퍼티를 검색하는데 사용된다.

```jsx
me.hasOwnProperty('name');
```

1. 스코프체인에서 me 식별자를 검색
2. me 식별자를 검색하면, me 객체의 프로토타입 체인에서 hasOwnProperty메서드를 검색

### 1. 다른 객체를 바탕으로 만들어진 객체

- 객체는 자신의 원형이라고 할 수 있는 객체가 있다면 그 객체를 가리키는 **proto** 링크를 자동으로 가짐

```jsx
const newObj = Object.create(oldObj)

newObj.__proto__ === oldObj
```

### 2. 그냥 객체가 아니라 함수

- Prototype객체 또한 생성한다.

![image](https://user-images.githubusercontent.com/109953972/223552264-e7182ef8-c7ab-4e89-97c6-62d663680587.png)

### 3. new + 함수로 만들어진 객체

- 만들어진 새로운 객체에 __proto__ 링크가 Person객체의 Prototype을 가리키게 된다.

![image](https://user-images.githubusercontent.com/109953972/223552151-fb2fdb43-fdf7-4c5f-a855-774f3cfd15e6.png)

```jsx
function sayHello() {
	console.log(`${this.name}: hello!`);
}

fucntion Person(name) {
	this.name = name;
}

Person.prototype.sayHello = sayHello();

const Giyoun = new Person('Giyoun);

Giyoun.sayHello(); // Giyoun : hello! 출력
```

![image](https://user-images.githubusercontent.com/109953972/223552033-32379ddf-4252-48ce-8e95-7679c653b849.png)

## Property 할당

```jsx
function sayHello() {
	console.log(`${this.name}: hello!`);
}

fucntion Person(name) {
	this.name = name;
}

Person.prototype.sayHello = sayHello();

const Giyoun = new Person('Giyoun);

Giyoun.sayHello = function () {
	console.log('hi');
};
```

### Case 1 : strict mode

```jsx
Object.defineProperty(Person.prototype."sayHello".{
	writable: false
...
})

strict mode => error
```

### Case 2 : Not strict mode

- 오버라이딩x 가려짐o

```jsx
Object.defineProperty(Person.prototype."sayHello".{
	writable: true
...
})

Giyoun.sayHello 추가

function sayHello() { 
	console.log(`${this.name}: hello!`);
}

fucntion Person(name) {
	this.name = name;
}

Person.prototype.sayHello = sayHello(); // 프로토 타입 메서드 쉐이딩
const Giyoun = new Person('Giyoun);

Giyoun.sayHello = function () {
	console.log('hi'); 
};

Giyoun.sayHello(); // hi 출력 인스턴스 메서드 오버라이딩

```