## 이벤트 핸들러

- 이벤트가 발생했을 때 호출될 함수

## 이벤트 핸들러 등록

- 브라우저에게 이벤트 핸들러의 호출을 위임하는 것

target = 이벤트를 발생시킨 DOM 요소

currentTarget = 이벤트 핸들러가 바인딩 된 요소

```jsx
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Event</title>
  </head>
  <body>
    <ul id="fruits">
      <!-- ul태그에 이벤트 바인딩 -->
      <li id="apple">apple</li>
      <li id="banana">banana</li>
      <!-- li태그에 이벤트 발생 (타깃) -->
      <li id="orange">orange</li>
    </ul>
    <script>
      const $fuirts = document.querySelector("#fruits");

      // fruits 하위 요소인 li 요소를 클릭한 경우
      $fuirts.addEventListener("click", (event) => {
        console.log(`이벤트 단계: ${event.eventPhase}`); //3. 버블링단계
        console.log(`이벤트 타깃: ${event.target}`); // li 태그
        console.log(`커런트 타켓: ${event.currentTarget}`); // ul 태그
      });
    </script>
  </body>
</html>
```

![image](https://user-images.githubusercontent.com/109953972/231974457-fb0c1e4b-e2d2-47fe-b0da-24db8b46f8bf.png)

<aside>
💡 event 객체는 e or event 로 다른 단어 xx

</aside>

## 이벤트 전파

### 1. 캡처링 단계

- 이벤트가 상위 요소에서 하위 요소 방향으로 전파

### 2. 타깃 단계

- 이벤트가 이벤트 타깃에 도달

### 3. 버블링 단계

- 이벤트가 하위 요소에서 상위 요소 방향으로 전파

## 1. 이벤트 핸들러 어트리뷰트 등록

- 함수 몸체를  의미
- 여러개 전달 가능
- HTML과 자바스크립트를 분리하는 것이 좋으므로 비권장
- BUT~! react등 라이브러리 또는 다른 프레임워크에서는 다른 개별요소가 아닌 뷰를 구성하기위한 요소로 보기 때문에 사용
- 타깃 단계, 버블링 단계만 캐치 가능

```jsx
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Event</title>
  </head>
  <body>
    <button onclick = "sayHi('giyoun')">Click me</button>
    <script>
        function sayHi(name) {
            alert(`Hi! ${name}`);
        }
    </script>
  </body>
</html>

// 여러개 전달
<button onclick = "console.log('hi'); console.log('bye');"> click me </button>
```

## 2. 이벤트 핸들러 프로퍼티 등록

- 이벤트 타깃($button), 타입,(on + click) 핸들러(function ())
- HTML 자바스크립 뒤섞이는 문제 해결
- But 하나의 프로퍼티에 하나의 이벤트 핸들러만 바인딩 가능하다는 단점!
- 타깃 단계, 버블링 단계만 캐치 가능

```jsx
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Event</title>
  </head>
  <body>
    <button>Click me</button>
    <script>
        const $button = document.querySelector('button');

        //이벤트 핸들러 프로퍼티에 이벤트 핸들러를 바인딩
        $button.onclick = function () {
            console.log('click');
        };
    </script>
  </body>
</html>
```

## 3. 이벤트 핸들러 addEventListener 등록

- 프로퍼티 바인딩 이벤트 핸들러에 아무 영향 x 중복 사용 가능
- 하나 이상의 이벤트 핸들러 등록 가능 but 동일한 이벤트 핸들러 등록은 안된다
- 캡처링, 타깃, 버블링 단계 캡처 가능

```jsx
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Event</title>
  </head>
  <body>
    <button>Click me</button>
    <script>
        const $button = document.querySelector('button');

        $button.addEventListener('click', () => {
            console.log('click');
        });
    </script>
  </body>
</html>
```

## 이벤트 위임

- 여러 개의 하위 DOM 요소에 각각 이벤트 핸들러를 등록하는 대신 하나의 상위 DOM 요소에 이벤트 핸들러를 등록하는 방법 (상위 DOM 요소에서도 캐치할 수 있기 때문!)
- 이벤트 반응이 필요한 DOM 요소에 한정하여 이벤트 핸들러가 실행되도록 주의할 것!