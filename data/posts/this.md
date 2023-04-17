## This?

- 자신이 속한 객체 또는 자신이 생성할 인스턴스를 가리키는 자기 참조 변수다.
- This를 통해 자신이 속한 객체 또는 자신이 생성할 인스턴스의 프로퍼티나 메서드를 참조할 수 있다.
- 자바스크립트에서의 this는 조금 다르다
- 자바스크립트 엔진에 의해 암묵적으로 생성된다.
- This바인딩은 함수 호출 방식에 의해 동적으로 결정된다.

💡 바인딩 ⇒ {식별자 : 값} 연결하는 과정, ex) 변수 선언 ⇒ {변수 : 주소값}, this ⇒ {this : 가리킬 객체}

## Deference in JS

- 자바, C++ 같은 클래스 기반 언어에서 this는 언제나 클래스가 생성하는 인스턴스를 가리킨다.
- But 자바스크립트에서는 this 함수가 호출되는 방식에 따라 this 바인딩이 동적으로 결정된다.

## This Binding Rules

💡 우선 순위 new > 명시적 > 암시적 > 기본

```jsx
// this는 어디서든 참조 가능
// 전역에서 this는 전역 객체 window를 가리킨다.

console.log(this); // window

function squre(number) {
    // 일반 함수 내부에서 this는전역 객체 window를 가리킨다.
    console.log(this); // window
    return number * number;
}

squre(2);

const person = {
    name: 'Lee',
    getName(){
    // 메서드 내부에서 this는 메서드를 호출한 객체를 가리킨다.
    console.log(this); // person
    return this.name;
    }
};
console.log(person.getName()); // Lee

function Person(name) {
    this.name = name;
    // 생성자 함수 내부에서 this는 생성자 함수가 생성할 인스턴스를 가리킨다.
    console.log(this); // Person {name: "Lee"}
}

const me = new Person('Lee');
```

---

### 함수 호출 시 this binding

```jsx
// this는 함수가 호출될 때 결정이 된다.

const car = {
    name: 'KIA',
    getname: function () {
        console.log("car getName",this);
    }
}

// car.getname(); // car 객체 자체

const globarCar = car.getname;
globarCar(); // window

const car2 = {
    name: 'hyundai',
    getname: car.getname
}

// car2.getname(); // car2 객체 자체

const btn = document.getElementById('button');
btn.addEventListener('click', car.getname); // 버튼 자체가 this

-------------

// this 값을 고정시켜주기 위해 bind등장
const bindGetName=car2.getname.bind(car);
bindGetName(); // Car객체로 this 고정 
btn.addEventListener('click', car.getname.bind(car)); // 버튼 자체가 this
```

---

### 일반함수로 호출하면 함수 내부의 this에는 전역 객체가 할당

```jsx
const testCar = {
    name: 'benz',
    getname: function () {
        console.log("getName",this); // testCar
        const innerFunc = function () {
            console.log("innerFunc",this); // window
        };
        innerFunc();
    },
};
```

---

### 화살표 함수

```jsx
// 화살표함수에서의 this는 함수가 속해있는 곳의 상위 this를 계승받는다.
const testCar = {
        name: 'benz',
        getname: function () {
            console.log("getName",this); // testCar
            const innerFunc = () => {
                console.log("innerFunc",this); // testCar
            };
            innerFunc();
        },
    };
    
    testCar.getname();
```

---

### 예제

- this를 사용할 때는 일반함수를 쓰는 것이 좋다 -> .bind()로 원한느 객체를 지정해 줄 수 있다.
- 함수 안에 있는 함수 같은 경우 같은 this를 쓴다면 화살표 함수도 좋다.

```jsx
const ageTest = {
    unit : '살',
    ageList : [10, 20, 30],
    getAgeList : function () {
        // 불가능
        const result = this.ageList.map(function(age){
            console.log('check',this);
            console.log('check unit',this.unit);
            return age+this.unit;
        });
        console.log(result);
    },
    // 가능 1
    getAgeList : function () {
        const result = this.ageList.map(function(age){
            return age+this.unit;
        },ageTest);
        console.log(result);
    },
    // 불가능 2
    getAgeList : function () {
        const result = this.ageList.map((age)=>{
            return age+this.unit;
        });
        console.log(result);
    },
};

ageTest.getAgeList();

```

## 정리

- This란 자신이 속한 객체 또는 자신이 생성할 인스턴스를 가리키는 자기 참조 변수다. 하지만 자바스크립트에서 This는 어떻게 호출되느냐에 따라서 동적으로 바인딩 된다.
- 바인딩 방식은 일반 함수일 경우 전역객체, 메서드일 경우 메서드를 호출한 객체, 생성자 함수는 생성자 함수가 생성한 인스턴스를 가리킨다.
- Function.prototype.apply/call/bind
- apply, call 함수를 호출(동일) | apply는 인수를 배열로, call은 리스트로 전달하며, bind는 함수를 호출하지 않기 때문에 명시적으로 호출해야하며, this바인딩이 교체된 함수를 새롭게 생성해 반환한다.