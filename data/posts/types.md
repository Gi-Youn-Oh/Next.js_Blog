1. 타입의 종류
    
     1) 원시타입 (숫자, 문자열, 불리언, null, undefined, symbol)
    
    - 변경 불가능하다. (immutable value)
    - 변수(확보된 메모리공간)에 할당 시 실제 값이 저장
    - 원시 값을 갖고 있는 변수를 다른 변수에 할당하면 원시 값이 복사된다. (pass by value)
    
    2) 객체 타입
    
    - 변경 가능하다. (mutable value)
    - 변수(확보된 메모리공간)에 할당 시 참조 값(메모리 주소 값)이 저장
    - 객체를 갖고 있는 변수를 다른 변수에 할당하면 참조 값이 복사된다. (pass by reference)
2. 원시 값
- 변경 불가능한 것은 변수가 아니라 값에 대한 진술이다. (변수 재할당하면  변수 값 변경(교체) 가능)
- 하지만 상수는 재할당 금지
- 원시 값을 할당한 변수는 재할당 이외에 변수 값을 변경할 수 있는 방법이 없다.
    
    ```jsx
    const o = {}; 상수는 재할당 금지
    
    o.a = 1; //프로퍼티는 할당 가능 
    console.log(o); => {a: 1}
    
    ```
    
1. 유사배열 객체
- 유사배열객체란 마치 배열처럼 인덱스로 프로퍼티 값에 접근할 수 있고 length 프로퍼티를 갖는 객체를 말한다.
- 래퍼객체 ? 21.3절에서 자세히..
    
    ```jsx
    let str = 'string';
    
    console.log(str[0]); => s 출력
    
    // 원시값이 문자열이 객체처럼 동작
    console.log(str.length) => 6 출력
    console.log(str.toUpperCase()); => STRING 출력
    ```
    
- 그렇다면 변경 가능?
    
    ```jsx
    let str = 'string';
    
    str[0] = S; // 대문자 S로 변경 시도
    console.log(str); // string 원시값이기에 변하지 않는다.
    ```
    
1. 값에 의한 전달 (pass by value)
- 원시값을  갖는 변수를 할당하면 값이 복사되어 전달된다.
- 동일한 80의 값을 갖는 다는 점에서는 동일하지만 score와 copy는 각각 다른 메모리 공간에 저장된 별개의 값이다.
- 따라서 score = 100이 되더라도 다른 메모리 공간에 저장되어 있기 때문에 copy는 변하지 않는다.
    
    ```jsx
    let score = 80;
    let copy = score; // 원시 값 복사 -> 값 전달
    
    console.log(score); // 80
    console.log(copy); // 80
    
    score = 100;
    
    console.log(score); // 100
    console.log(copy); // ?
    ```
    
    <aside>
    💡 엄격하게 표현하면 변수에는 값이 전달되는 것이 아니라 메모리 주소가 전돨된다. 이는 변수와 같은 식별자는 값이 아니라 메모리 주소를 기억하고 있기 때문이다.
    
    </aside>
    
    <aside>
    💡 결국은 두 변수의 원시 값은 서로 다른 메모리 공간에 저장된 별개의 값이 되어 어느 한쪽에서 재할당을 통해 값을 변경하더라도 서로 간섭할 수 없다.
    
    </aside>
    

1. 객체 
- 프로퍼티의 개수가 정해져 있지 않으며, 동적으로 추가 삭제가 가능하다.
- 프로퍼티 값에도 제약이 없다 → 원시 값처럼 확보해야 할 메모리 공간의 크기를 사전에 정해 둘 수 없다.
- Java, C++ (클래스 기반 객체 프로그래밍 언어)→객체 생성 이전에 프로퍼티와 메서드가 정해져 있으며 그대로 생성, 생성 이후에는 프로퍼티를 추가or삭제 할 수 없다.
- JavaScript → 클래스 없이 객체 생성 가능, 객체 생성 이후에도 동적으로 프로퍼티 추가 삭제 가능
- but! 객체 생성과 프로퍼티 접근에 비용이 더 많이 들어 비효율적 → V8 자바스크립트 엔진에서는 동적탐색 대신 히든 클래스 방식을 사용해 C++언어와 유사한 성능을 확보했다.
- 객체는 원시 값과 다르게 재할당 없이 값을 직접 변경할 수 있고, 동적으로 추가할 수 있다.
    
    ```jsx
    let person = {
    	name : 'Cho Bae Bae';
    };
    
    // 프로퍼티 값 변경
    person.name = 'Cho Ba Bo';
    
    // 프로퍼티 동적 생성
    person.height = '2m';
    
    console.log(person); -> {name: 'Cho Ba Bo', height = '2m'}
    ```
    
- 여러 개의 식별자가 하나의 객체를 공유할 수 있다. (구조적 단점!)
1. 얕은 복사 vs 깊은 복사
    
    ```jsx
    const o = {x : {y: 1} } ;
    
    // 얕은 복사
    const c1 = {...o};
    console.log(c1 === o); -> false
    console.log(c1.x === o.x); -> true
    
    //lodash의 cloneDeep을 사용한 깊은 복사
    //Node.js 환경에서 실행
    const _ = require('lodash');
    // 깊은 복사
    const c2 = _.cloneDeep(o);
    console.log(c2 === o); -> false
    console.log(c2.x === o.x); -> false
    ```
    

     원시값 → 깊은 복사 / 객체 → 얕은 복사

```jsx
const v = 1;

//깊은 복사라고 부르기도 한다
const c1 = v;
console.log(c1 === v) // true

const o = { x:1 };

//얕은 복사라고 부르기도 한다.
const c2 = o;
console.log(c2 === o); //true
```

1. 참조에 의한 전달 (pass by reference)
- 두 개의 식별자가 하나의 객체를 공유한다.
    
    ```jsx
    let person = {
    	name : 'Lee'
    };
    
    //참조 값을 복사 (얕은 복사)
    let copy = person;
    ```
    
- 값에 의한 전달과 참조에 의한 전달은 식별자가(변수) 기억하는 메모리 공간에 저장되어 있는 값을 복사해서 전달한다는 점에서 동일하다.
- 다만 식별자가 기억하는 메모리공간, 즉 변수에 저장되어 있는 값이 원시값이냐 참조 값이냐의 차이만 있다.
- **따라서 자바스크립트에는 ‘참조에의한 전달’은 존재하지 않고 ‘값에의한 전달’만이 존재한다고 말할 수 있다.**
- ‘공유에 의한 전달이라고도 표현’
- 자바스크립트에는 포인터가 존재하지 않는다.
    
    ```jsx
    let person = {
    	name : 'Lee'
    };
    
    // 참조 값을 복사(얕은 복사). copy와 person은 동일한 참조 값을 갖는다.
    let copy = person;
    
    // copy와 person은 동일한 객체를 참조한다.
    console.log(copy === person); //true
    
    // copy를 통해 객체를 변경한다.
    copy.name = 'Cho bae';
    
    // person을 통해 객체를 변경한다.
    person.address = 'Daejeon';
    
    // copy와 person은 동일한 객체를 가리킨다.
    // 따라서 서로 영향을 주고 받는다.
    console.log(person); // {name: 'Cho bae', address: 'Daejeon'}
    console.log(copy); // {name: 'Cho bae', address: 'Daejeon'}
    ```
    
- Last check
    
    ```jsx
    let person1 = {
    	name : 'Cho bae'
    };
    
    let person2 = {
    	name : 'Cho bae'
    };
    
    console.log(person1 === person2); -> ??? true or false?
    console.log(person1.name === person2.name); -> ??? true or false?
    ```