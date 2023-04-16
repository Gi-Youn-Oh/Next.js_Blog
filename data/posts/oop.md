## 짚고 넘어갈 개념

### 객체
- 자바스크립트의 객체는 키(key)과 값(value)으로 구성된 프로퍼티(Property)들의 집합이다.
- 자바스크립트에서는 원시타입을 제외한 모든 것이 객체이다.
- 프로퍼티로 함수를 갖을 수 있고, 이를 메소드(method)라고 한다,

### 인스턴스
- 객체 지향 프로그래밍에서 인스턴스는 해당 클래스의 구조로 컴퓨터 저장공간에서 할당된 실체를 의미한다. 

### 헷갈리는 개념 한줄 정리해보기
- 객체 (구현하고자 하는 것)
- 클래스 (구현하고자 하는 대상의 설계도)
- 인스턴스 (구현하고자 하는 대상의 실체화)

### 프로토 타입

- 자바스크립트의 모든 객체는 프로토타입(prototype)이라는 객체를 가지고 있다.
- 모든 객체는 그들의 프로토타입으로부터 프로퍼티와 메소드를 상속받는다.
- 이처럼 자바스크립트의 모든 객체는 최소한 하나 이상의 다른 객체로부터 상속을 받으며, 이때 상속되는 정보를 제공하는 객체를 프로토타입(prototype)이라고 합니다.

```jsx
function Dog(color, name, age) { // 개에 관한 생성자 함수를 작성함.

    this.color = color;          // 색에 관한 프로퍼티

    this.name = name;            // 이름에 관한 프로퍼티

    this.age = age;              // 나이에 관한 프로퍼티

}

var myDog = new Dog("흰색", "마루", 1); // 이 객체는 Dog라는 프로토타입을 가짐.

document.write("우리 집 강아지는 " + myDog.name + "라는 이름의 " + myDog.color + " 털이 매력적인 강아지입니다.");
```

## 정의

- 객체 지향 프로그래밍은 컴퓨터 프로그래밍 패러다임 중 하나로, **프로그래밍에서 필요한 데이터를 추상화시켜 상태와 행위를 가진 객체를 만들고 그 객체들 간의 유기적인 상호작용을 통해 로직을 구성하는 프로그래밍 방법**이다.

## 장, 단점

- **장점**

▶코드 재사용이 용이

남이 만든 클래스를 가져와서 이용할 수 있고 상속을 통해 확장해서 사용할 수 있다.

▶유지보수가 쉬움

절차 지향 프로그래밍에서는 코드를 수정해야할 때 일일이 찾아 수정해야하는 반면 객체 지향 프로그래밍에서는 수정해야 할 부분이 클래스 내부에 멤버 변수혹은 메서드로 존재하기 때문에 해당 부분만 수정하면 된다.

▶대형 프로젝트에 적합

클래스 단위로 모듈화시켜서 개발할 수 있으므로 대형 프로젝트처럼 여러 명, 여러 회사에서 프로젝트를 개발할 때 업무 분담하기 쉽다.

- **단점**

▶처리 속도가 상대적으로 느림

▶객체가 많으면 용량이 커질 수 있음

▶설계시 많은 시간과 노력이 필요

## 특징

**1) 클래스 + 인스턴스(객체)**

**2) 추상화**

- 객체들이 공통적으로 **필요로 하는 속성이나 동작을 하나로 추출**해내는 작업
- **추상적인 개념에 의존**하여 **설계해야 유연함**을 갖출 수 있다. 즉, **세부적인 사물들의 공통적인 특징을 파악**한 후, 하나의 **묶음으로 만들어내는 것이 추상화**다.

**3) 캡슐화**

- 정보 **은닉화를 통해 높은 응집도, 낮은 결합도를 유지**할 수 있도록 설계하는 것

**4) 상속**

- 자바스크립트는 프로토타입 기반이기 때문에 상속의 개념이 클래스 기반의 객체 지향 언어와는 약간 다르다.

- 자바스크립트에서는 현재 존재하고 있는 객체를 프로토타입으로 사용하여, 해당 객체를 복제하여 재사용하는 것을 상속이라고 합니다.

**5) 다형성**

- 서로 다른 클래스의 객체가 같은 동작 수행 명령을 받았을 때, **각자의 특성에 맞는 방식으로 동작**
하는 것

## 등장 배경

### 순차적 (비구조적) 프로그래밍

- 정의한 기능의 흐름에 따라 **순서대로 동작을 추가하며 프로그램을 완성**하는 방식이다.
- 간단한 프로그램의 경우, 이렇게 코드를 짜게 되면 **흐름이 눈으로 보이기 때문에 매우 직관적**일 것이다.
- 그러나, 조금이라도 프로그램의 규모가 커지게 되면 **동작이 직관적이지 못하게 되고** 유일한 장점이 사라지는 셈이다.

### 절차적 (구조적) 프로그래밍

- 절차적 프로그래밍에서 **'절차'는 함수를 의미**한다. 따라서 절차적 프로그래밍이란, **반복되는 동작을 함수 및 프로시저 형태로 모듈화하여 사용**하는 방식이다.
- **반복 동작을 모듈화하여 코드를 많이 줄일 수 있다**. 하지만 프로시저라는 것 자체가 **너무 추상적**
이라는 단점이 있다.

### 객체지향 프로그래밍

## vs 절차지향 프로그래밍

- 장점
    
    ▶컴퓨터의 처리구조와 유사해 실행속도가 빠름
    
- 단점
▶유지보수가 어려움
▶실행 순서가 정해져 있으므로 코드의 순서가 바뀌면 동일한 결과를 보장하기 어려움
▶디버깅이 어려움

## 사용 경험

- C언어로 pintos 프로젝트를 할 때 함수 구조적으로 짜여져 있긴 하지만 디버깅 시에 어디서 문제가 발생하였는지 발견하기 어려웠으며, 실행 순서가 정해져 있어 변경 시 사이드 이펙트까지 고려해야하는 단점이 있었다.
- 반면 React-Native로 프로젝트를 할 당시에는 객체 ( 컴포넌트) 단위로 구성하다보니 문제점을 찾기 쉬웠고, 유지보수 또한 용이했습니다. 하지만 처음에 설계를 하는 데에 시간이 오래 걸린다는 단점 또한 느꼈다.

