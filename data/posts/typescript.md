# Why TypeScript?

- 자바스크립트 동작하는 어느 곳이든 대체 가능하다.
- 자바스크립트를 한 단계 감싸는 트랜스컴파일러, 자체 컴파일러 or 바벨
- 자바스크립트는 동적 타입 언어로 런타임 시에 예기치 못한 에러를 발생하는데 이를 statically typed 컴파일 시에 에러 확인
- 자바스크립트 - 프로토타입기반, 생성자 함수, class = 결국 prototype
- 타입스크립트 - 클래스, 인터페이스, 제네릭, 타입 등 강력한 객체지향 프로그래밍 가능

## 1. Basic Types

- 자바스크립트 타입 별 타입 정의

```jsx
{
    /*
    JavaScript
    Primitive: number, string, null, undefined, symbol, boolean, bigint
    Object: function, array ...
     */

    // number
    const num:number = 6;

    // string
    const str:string = 'hello';

    // boolean
    const bool:boolean = false;

    // undefined 값이 있다 or 없다 정해지지 x
    let age: number | undefined;
    age = undefined;
    age = 1;
    function find(): number | undefined {
        return undefined;
    }

    // null 없다!
    let person: string | null;
    person = 'giyoun';
    person = null;

    //unknown 가능하면 사용 x
    let notSure: unknown = 0;
    notSure = 'giyoun';
    notSure = true;

    // any 가능하면 사용 x
    let anything: any = 0;
    anything = 'hello';

    // void 함수에서 아무것도 return 하지 않을 때 생략 가능
    function print(): void {
        console.log('hello');
        // return; 생략되어져 있는 것과 같다.
    }

    // never 절대 리턴할 수 없다.
    function throwError(message: string): never { // never를 리턴
        // message -> server (log)
        throw new Error(message);
        while(true) {

        }
        // return;  리턴 불가!
    }

    // object 원시타입 제외 모든 객체 사용하지 않는 것 권장 명확히 명시하는 것이 좋다!
    let obj: object;
    function acceptSomeObject(obj: object){

    }
    acceptSomeObject({name: 'giyoun'});
    acceptSomeObject({animal: 'cat'});
}
```

## 2. In function

- 인자, 리턴 값 정의하기

```jsx
{
    // JavaScript
    function jsAdd(num1, num2){
        return num1 + num2;
    }
    
    // TypeScript
    function Add(num1: number, num2: number): number {
        return num1 + num2;
    }
    
    // JavaScript
    function jsFetch(id){
        // code ...
        // code ...
        return new Promise((resolve, reject) => {
            resolve(100);
        })
    }
    // TypeScript
    function fetching(id: string): Promise <number> { // promise return 그리고 promise함수는 number 를 return
        // code ...
        // code ...
        return new Promise ((resolve, reject) => {
            resolve(100);
        })
    }

    // JavaScript => TypeScript
    // Optional parameter, ? -> 전달 받을 수도 안 받을 수도

    function printName(firstName: string, lastName?: string){
        console.log(firstName);
        console.log(lastName);
    }
    printName('Oh', 'Giyoun');
    printName('Oh');
    printName('Oh', undefined);

    // Default parameter
    // 인자 전달 없이 default 값 사용
    function printMessage(message: string = 'default message'){
        console.log(message);
    }
    printMessage();

    // Rest parameter
    function addNumber (...numbers: number[]): number{ // 숫자 타입의 배열
        return numbers.reduce((a,b) => a + b);
    }
    console.log(addNumber(1,2));
    console.log(addNumber(1,2,3,4));
    console.log(addNumber(1,2,3,4,5,0));
}
```

## 3. Array

```jsx
{
    // Array 한가지 타입
    const fruits: string[] = ['apple','banana'];
    const scores: number[] = [1, 2, 3];
    const numbers: Array<number> = [1, 2, 3];

    function printArray(fruits: readonly string[]){ // 변경 불가 readonly 일때는 Array<string> 안됨
        // fruits.push  안됨!
    }

    // Tuple 여러 타입의 데이터, 권장 x 가독성 떨어짐 -> interface, type alias, class로 대체
    let student: [string, number];
    student = ['giyoun', 30];
    student[0] // giyoun
    student[1] // 30
    const [name, age] = student; // 구조분해 할당이 인덱싱 보다 가독성 좋음
}
```

## 4. Alias

- 타입 정의해서 유연하게 할당하기

```jsx
{
    // Type ALiases
    // 내가 타입을 정해서 사용 가능
    type Text = string;
    const name: Text = 'Giyoun'; // 문자열만
    const from: Text = 'korea';
    type num = number;
    type Student = {
        name: string;
        age: num;
    };
    const student: Student ={
        name: 'giyoun',
        age: 30,
    }

    // string literal types
    type Name = 'name'; // Name 타입에는 'name' 만 할당 가능
    let Giyoun: Name;
    Giyoun: 'name';
    type Number = 10;
    const age: Number = 10;

    type Bool = true;
    const isPerson: Bool = true;

}
```

## 5. Union

- 여러 타입을 함께 정의해서 사용 가능 (가독성 및 확장성)

```jsx
{
    // Union Types: OR

    type Direction = 'left' | 'right' | 'up' | 'down';

    function move(direction: Direction) {
        console.log(direction);
    }

    move('down');

    type TileSize = 8 | 16 | 32;
    const tile: TileSize = 16; // 해당 숫자만

    // function: login -> success, fail
    type SuccessState = {
        response: {
            body: string;
        }
    }
    type Failure = {
        reason: string;
    }
    type LoginState = SuccessState | Failure
    function LoginAPI(id: string, password: string): LoginState{
        return {
            response: {
                body: 'log in',
            },
        }
    }

    // printLoginState(state: LoginState)
    // success -> 'good', body
    // fail -> 'fail', reason
    function printLoginState(state: LoginState): void {
        // console.log(response.body); // 이렇게 하면 안됨!
        if ('response' in state){ // response 가 있다면 접근 가능
            console.log(`good ${state.response.body}`);
        }else{
            console.log(`bad ${state.reason}`);
        }
    }
}
```

## 6. Discriminated

```jsx
{ // 동일한 변수 값을 두고 차별화를 두어 직관적 코드 작성 가능
    type SuccessState = {
        result: 'success';
        response: {
            body: string;
        }
    }
    type Failure = {
        result: 'fail';
        reason: string;
    }
    type LoginState = SuccessState | Failure

    function LoginAPI(id: string, password: string): LoginState {
        return {
            result: 'success',
            response: {
                body: 'log in',
            },
        }
    }

// printLoginState(state: LoginState)
// success -> 'good', body
// fail -> 'fail', reason
    function printLoginState(state: LoginState): void {
        // state.result // success or fail 바로 접근 가능
        if (state.result === 'success') { // response 가 있다면 접근 가능
            console.log(`good ${state.response.body}`);
        } else {
            console.log(`bad ${state.reason}`);
        }
    }
}
```

## 7. Intersection

```jsx
{
    // Intersection Types: &
    type Student = {
        name: string;
        score: number;
    };

    type Worker = {
        employeeId: number;
        work: () => void;
    };

    function interWork(person: Student & Worker){
        console.log(person.name, person.employeeId, person.work()); // 다 접근 가능
    }
    // 인자로 두 타입의 모든 데이터를 전달해야 한다.
    interWork({
        name: 'Giyoun',
        score: 100,
        employeeId: 1,
        work: () => {},
    });
}
```

## 8. Enum

```jsx
{
    // Enum Types
    // 여러 상수 값들은 한 곳에 모아

    // JavaScript 존재 x
    const MAX_NUM = 6;
    const MAX_STUDENS_PER_CLASS = 10;
    const MONDAY = 0;
    const TUESDAY = 1;
    const WEDNESDAY = 2;
    const DAYS_ENUM = Object.freeze({'MONDAY': 0, 'TUESDAY': 1, "WEDNESDAY": 2})
    const daysOfToday = DAYS_ENUM.MONDAY;

    // TypeScript

    enum Days { // 첫 글자만 대문자 나머지 소문자로
        Monday, // 자동 값 주어짐 0부터 Monday =1 로 지정도 가능, 문자열도 할당 가능하지만 수동적으로 각각 다 할당해 주어야 한다.
        Tuesday,
        Wednesday,
        Thursday,
        Friday,
        Saturday,
        Sunday,
    }
    console.log(Days.Friday);
    let day: Days = Days.Saturday;
    day = Days.Saturday;
    day = 10; // 다른 어떤 숫자도 새로 할당 가능 -> 문제!!
    console.log(day);

    // enum은 다른 네이티브 모바일 앱 통신 아니면 type으로 설정해두고 고정값을 사용하는 것이 안전하다.
    type DaysOfWeek = 'Monday' | 'Tuesday' | 'Wednesday';
    let dayOfWeek: DaysOfWeek = 'Monday';
    dayOfWeek = 'Wednesday'; // 해당값만 보장 가능
}
```

## 9. Inference

```jsx
{
    //Type Inference
    // 타입 자동 지정, 너무 당연한 것이 아니면 명시적으로 지정해주는 것이 좋음
    let text = 'hello'; // 선언동시 할당하면 string 타입 지정
    function print(message = 'typescript') { // 타입없이 사용하면 any로 타입 -> 명시적으로 지정해주는 것이 좋다!
        console.log(message);
    }
    print ('hello');
    // print (23);

    function add(x: number, y: number) { // 인자 두 타입이 숫자이기 때문에 함수의 return값도 숫자로 추론
        return x + y;
    }

    const result = add(1, 2); // result 는 자동으로 숫자 지정
}
```

## 10. Assertion

```jsx
{
    // Type assertions 비추천

    function jsStrFunc(): any { // 항상 문자열을 리턴하는 함수 
        return 'hello'; // return 2; 를 해도 코딩중에 오류 표시 x 런타임 시에 오류
    }

    const result = jsStrFunc();
    // result.length; 타입스크립트에서는 any type이기 때문에 문자열 api를 사용할 수 없다.
    console.log((result as string).length); // 확신할 때는 assertion으로 지정해주어 사용할 수 있다.
    console.log((<string>result).length);  // 동일

    const wrong: any = 5;
    console.log((wrong as Array<number>).push(1)); // error

    function findNumbers(): number[] | undefined {
        return undefined;
    }

    const numbers = findNumbers();
    // numbers.push(2); //  error undefined일 수도 있기 때문에 push를 사용할 수 없다.
    numbers!.push(2); // ! -> 무조건 있을거라고 확신할 때 사용

    const button = document.querySelector('class');
    if(button){
        button.nodeValue;
    }

    const button1 = document.querySelector('class')!; // ! -> 무조건 있을거라고 확신할 때 사용

}
```

## 11. Generic

```jsx
{
    // generic
    // 유연함, 타입 보장, 재사용성 

    // 1. 문제는 숫자만 확인가능 ... 타입별로 다만들어? xxx
    function checkNotNullBad(arg: number | null): number {
        if (arg == null) {
            throw new Error('Not valid Number')
        }
        return arg;
    }

    const result = checkNotNullBad(123);
    console.log(result);
    checkNotNullBad(null);

    // 2. 그렇다면 any로 ? => type 보장이 안됨... => 안정성 떨어짐
    function checkNotNullAnyBad(arg: any | null): any {
        if (arg == null) {
            throw new Error('Not valid Number')
        }
        return arg;
    }

    // 3. 이럴 때 제네릭! = 통상적, 포용적
    // 인자가 어떤 타입이든 null이 아닐 때만 리턴 
    // 통상적으로 T 로 사용
    // T 또는 null을 받아서 T 타입을 리턴
    function checkNotNull<T>(arg: T | null): T {
        if (arg == null) {
            throw new Error('Not valid Number')
        }
        return arg;
    }

    const number = checkNotNull(123); // 코드 치는 이순간에 number 로 결정 타입 보장
    const bool: boolean = checkNotNull(true); // 코드 치는 순간 boolean 로 결정 타입 보장

}
```

```jsx
{
    // a or b
    interface Either<L, R> {
        left: () => L;
        right: () => R;
    }

    // 왼쪽 타입이 같을수도 다를수도
    class SimpleEither<L, R> implements Either<L, R>{
        constructor(private leftValue: L, private rightValue: R) {}
        left(): L {
            return this.leftValue;
        }
        right(): R {
            return this.rightValue;
        }
    }

    const either: Either<number, number>  = new SimpleEither(4, 5);
    either.left(); // 4
    either.right(); // 5
    
    const best = new SimpleEither({name: 'giyoun'}, 'hello');

}
```

```jsx
{
    interface Employee {
        pay(): void;

    }

    class FullTimeEmployee implements Employee {
        pay() {
            console.log(`full time`);
        }
        workFullTime() {

        }
    }

    class PartTimeEmployee implements Employee {
        pay(): void {
            console.log(`part time`);
        }
        workPartTime() { }
    }

    // 인자를 fulltime으로 받아도 return은 그냥 interface Employee로 반환 하기 때문에 pay함수 실행 이후에는 더이상 일을 못함.. 즉 세부 클래스 메서드 사용불가
    // 세부적인 타입을 인자로 받아서 정말 추상적인 타입으로 다시 리턴하는 함수는 정말 좋지 않다.
    function payBad(employee: Employee): Employee {
        employee.pay();
        return employee;
    }

    // genric 활용
    // 조건부 제네릭
    function pay<T extends Employee>(employee: T): T {
        employee.pay(); // <T> => employee에 어떤 타입도 들어올 수 있기 때문에 pay() 없다. <T extends Employee> 제네릭이긴 한데 Employee를 확장한 아이만 가능
        return employee
    }

    const giyoun = new FullTimeEmployee();
    const noye = new PartTimeEmployee();
    giyoun.workFullTime();
    noye.workPartTime();

    // const giyounAfterPay = pay(giyoun);
    // const noyeAfterPay = pay(noye);
    // giyounAfterPay.workFullTime(); 접근 못함

    // const giyounAfterPay = pay(giyoun) as FullTimeEmployee; // 확신이 있다면 but 좋지 않음 as 사용은
    // const noyeAfterPay = pay(noye) as PartTimeEmployee;
    // giyounAfterPay.workFullTime(); //가능은함

    const giyounAfterPay = pay(giyoun);
    const noyeAfterPay = pay(noye);

    giyounAfterPay.workFullTime(); // 제네릭으로 가능

    const obj = {
        name: 'giyoun',
        age: 30,
    };

    const obj2 = {
        animal: 'dog',
    };

    // T = object
    // K extends keyof T = T 객체 안에 들어있는 키중 하나
    function getValue<T, K extends keyof T>(object: T, key: K): T[K] {
        return object[key];
    }

    console.log(getValue(obj, 'name')); // giyoun
    console.log(getValue(obj, 'age')); // 30
    console.log(getValue(obj2, 'animal')); // dog
}
```