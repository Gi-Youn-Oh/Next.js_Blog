### Basic

- 자바스크립트의 모든 값은 타입이 있다.
- 개발자의 의도적으로 값의 타입을 변환 하는 것 → **명시적 타입 변환, 타입 캐스팅**
    
    ```jsx
    let x = 10;
    
    let str = x.toString(); // 명시적 타입 변환
    console.log(typeof str, str) // string 10
    
    // x변수의 값은 그대로 유지
    console.log(typeof x, x) // number 10
    ```
    
- 개발자의 의도와는 상관없이 표현식을 평가하는 도중에 자바스크립트 엔진에 의해 암묵적으로 타입이 변환 되는 것 → **암묵적 타입 변환, 타입 강제 변환**
    
    ```jsx
    let x = 10;
    
    // 암묵적 타입 변환
    let str = x + '';
    console.log(typeof str, str) // string 10
    
    // x변수의 값은 그대로 유지
    console.log(typeof x, x) // number 10
    ```
    
- 암묵적 타입이 가독성 측면에서 더 좋을 수 있기 때문에 코드를 정확히 이해하고 예측할 수 있어야 한다. → 암묵적 타입 변환을 잘 숙지해서 적재적소에 사용해라!

### Remember (외우기)

- false, undefined, null, 0, -0, NaN, ‘’(빈문자열) ⇒ false

### 단축 평가

- 논리 곱 연산자는 좌항에서 우항으로 평가가 진행된다.
    
    ```jsx
    'Cat' && 'Dog' => 'Dog'
    논리 연산의 결과를 결정하는 두 번째 피연산자(둘다 true여야 함), 즉 문자열 'Dog'를 그대로 반환한다.
    ```
    
- 논리 합 연산자도 좌항에서 우항으로 평가가 진행된다.
    
    ```jsx
    'Cat' || 'Dog' => 'Cat'
    'Cat'이 Truthly 값이므로 두 번째 연산자까지 확인하지 않아도 된다.
    즉 논리 연산의 결과가 'Cat'에서 끝났기 때문에 'Cat' 바로 반환
    ```
    

**→ 논리 연산자는 논리 연산의 결과를 결정하는 피연산자를 타입 변환하지 않고 그대로 반환한다. 이를 단축평가라고 한다.**

**→ 단축 평가는 표현식을 평가하는 도중에 평가 결과가 확정된 경우 나머지 평가 과정을 생략하는 것을 말한다.**

- 단축평가 예제
    
    ### 단축평가 → if 문 대체
    
    1. 주어진 조건이 true일 때 논리 곱 연산자
        
        ```jsx
        let done = true;
        let message = '';
        
        // 주어진 조건이 true일 때
        if (done) message = '완료';
        ---
        //if 문 단축평가로 대체
        //done이 true이면 message에 '완료'를 할당
        message = done && '완료';
        console.log(message);
        => '완료' 
        ```
        
    2. 주어진 조건이 false일 때 논리 합 연산자
        
        ```jsx
        let done = false;
        let message = '';
        
        // 주어진 조건이 false일 때
        if (!done) message = '미완료';
        ---
        //if 문 단축평가로 대체
        //done이 false이면 message에 '완료'를 할당
        message = done || '미완료';
        console.log(message);
        => '미완료' 
        ```
        
    3. 삼항연산자 if else 문 대체
        
        ```jsx
        let done = true;
        let message = '';
        
        if (done){
        	message = '완료';
        }else {
        	message = '미완료';
        }
        console.log(message);
        => '완료' 출력
        ---
        message = done ? '완료' : '미완료';
        console.log(message);
        => '완료' 출력
        ```
        
- 유용한 사용
    
    ### 유용한 사용
    
    1. 객체를 가리키기를 기대하는 변수가 null 또는 undefined인지 아닌지 확인하고 프러퍼티를 참조할 때
        
        ```jsx
        let elem = null;
        let value = elem.value; => 타입에러!
        
        let elem = null;
        let value = elem && elem.value; => null
        ```
        
    2. 함수 매개변수에 기본값을 설정할 때
        
        ```jsx
        // 단축 평가 사용
        function getStringLength(str){
        	str = str || '';
        	return str.length;
        }
        
        getStringLength(); => 0
        getStringLength('hi'); => 2
        
        // ES6 
        function getStringLength(str = ''){
        	return str.length;
        }
        
        getStringLength(); => 0
        getStringLength('hi'); => 2
        
        ```
- 옵셔널 체이닝 (ES11에서 도입-2020) 추가 자료 [https://ko.javascript.info/optional-chaining](https://ko.javascript.info/optional-chaining)
    - 옵셔널 체이닝 연산자(?)는 좌항 피연산자가 null or undefined가 아니면 우항의 프로퍼티 참조를 이어간다.
    
    ```jsx
    let str = '';
    let length = str && str.length;
    
    console.log(length); => '' 문자열의 길이 참조 못함
    
    let str = '';
    let length = str?.length;
    console.log(length); => 0 falsy값이라도 null or undefined 가 아니면 우항의 참조를 이어간다.
    '' or 0은 객체로 평가될 때
    ```
    
- null 병합 연산자(ES11에서 도입-2020) 추가 자료 [https://ko.javascript.info/nullish-coalescing-operator](https://ko.javascript.info/nullish-coalescing-operator)
    - 좌항의 피연산자가 null 또는 undefined인 경우 우항의 피연산자를 반환하고, 그렇지 않으면 좌항의 피연산자를 반환한다.
    - null 병합연산자(??)는 변수에 기본값을 설정할 때 유용하다.
        
        ```jsx
        let foo = null ?? 'default string';
        console.log(foo); => 'default string'
        ```
        
    - null or undefined가 아니면 좌항의 피연산자를 그대로 반환한다.
        
        ```jsx
        // falsy값인 0이나 ''도 기본값으로 유효하다면 예기치 않은 동작이 발생할 수 있다.
        let foo = '' || 'default string';
        console.log(foo) => 'default string'
        
        let foo = '' ?? 'default string';
        console.log(foo) => '';
        ```