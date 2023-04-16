## 1. Static Sites ( 1990 중반 )

- 서버에 이미 잘 만들어진 HTML 문서가 존재
- client가 요청 (url입력등)
- 서버로부터 HTML 문서를 받아와서 렌더링
- 페이지 내의 다른 페이지를 요청하면 전체를 다시 다 받아와서 업데이트 해야 한다.

![image](https://user-images.githubusercontent.com/109953972/222462378-50c85e21-d36c-4af8-89ba-734cc28b963c.png)

---

## 2. iframe ( 1996 )

- 부분적으로 받아올 수 있게 되었다.

![image](https://user-images.githubusercontent.com/109953972/222462328-d30406c9-26e4-4c44-862f-b79c68b562d9.png)

---

3.  XML HttpRequest ( 1998~ )

- fetch API 원조
- JSON 과 같은 형식으로 필요한 데이터만 가볍게 받아올 수 있다.
- 받아온 데이터를 자바스크립트 언어로 동적으로 HTML을 생성해서 페이지 업데이트

![image](https://user-images.githubusercontent.com/109953972/222462286-3f543652-5e81-4993-851d-0f3e57516549.png)

---

## 4. AJAX ( 2005 )  SPA (single page application)

- 사용자가 한 페이지 내에서 머무르면서 필요한 데이터를 부분적으로 받아올 수 있음

![image](https://user-images.githubusercontent.com/109953972/222462244-7269c64d-417f-4b43-b2aa-0f9fdd035653.png)

---

## 5. CSR ( Client Side Rendering )

- React, Vue, Angular 등등 등장 (자바스크립트 발전)
- 서버에서 클라이언트에게 HTML, JS 링크를 보낸다. (처음 접속 시 빈 화면)
- 클라이언트 측에서 JS다운로드하고, DOM 생성
- 어플리케이션을 구동하는 프레임워크, 라이브러리 소스코드까지 포함 (사이즈가 큼 → 다운로드 시 오래 걸림) ↔ 이후에는 필요한 데이터만 받아 렌더링하기 때문에 속도가 빠르다.
- 추가로 필요한 데이터는 Request를 통해 받아와 동적으로 표현함

![image](https://user-images.githubusercontent.com/109953972/222462006-18bc60c8-5e74-429b-81ae-6d45d9c32018.png)

![image](https://user-images.githubusercontent.com/109953972/222461966-15da9a4b-48aa-4080-bb23-16bd793747cb.png)

![image](https://user-images.githubusercontent.com/109953972/222461924-137a05ff-6398-40f5-a654-4a6edf344fff.png)

![image](https://user-images.githubusercontent.com/109953972/222461886-d2c44a22-dbf4-43f5-b71c-70fb17f5b8a9.png)

### 장점

1. 서버 부하가 낮다.
2. 클라이언트 측에서의 연산 라우팅을 처리하기 때문에 빠르고 사용자 경험이 좋다.

### 단점

1. 사용자가 첫 화면을 보기까지 너무 오래 걸린다.
2. Low SEO (Search Engine Optimization) HTML 문서 분석, 검색엔진 등록 등 → HTML은 비어져 있기 때문에 검색 어려움

### 결론

- 최종적으로 번들링해서 사용자에게 보내주는 .js 파일을 어떻게하면 효율적으로 분할해서 사용자에게 정말 필수적인 요소들만 보여줄 수 있을까 고민해봐야함
- 유저와의 상호작용이 많고 유저 정보 위주의 페이지들이며, 검색엔진 노출이 적어도 되는 서비스에 적합하다.

![image](https://user-images.githubusercontent.com/109953972/222461842-22d4a210-6980-4cb8-9a54-772975edd724.png)

---

## 6. SSR (Server Side Rendering)

- 서버에서 필요한 데이터를 모두 가져와서 HTML 파일을 생성
- 동적으로 조금 제어할 수 있는 파일로 클라이언트에게 전송

![image](https://user-images.githubusercontent.com/109953972/222461625-bcb9d2fb-7fa2-4583-bb41-d39d90ca422a.png)

![image](https://user-images.githubusercontent.com/109953972/222461588-eb5edae3-a792-4de9-bc4a-d5f3898525ae.png)

### 장점

1. CSR보다 첫 페이지 로딩이 빠르다.
2. 모든 컨텐츠가 HTML에 담겨져 있다. → High SEO

### 단점

1. Blinking Issue 사용자가 클릭하면 전체적인 웹사이트를 다시 받아오는 것과 같기 때문에 (Static Sties와 유사)
2. 서버 과부하 우려
3. 동적인 데이터 처리가 오래 걸려 사용자의 요청에도 응답이 늦거나 없을 수 있다.

### 결론

- TTV 와 TTI간 단차를 어떻게 줄여서 사용자 경험을 개선할 수 있을 지 고민해봐야함
- 회사 홈페이지나 항상 같은 내용을 보여주고, 자주 업데이트가 발생하는 서비스에 적합하다.

![image](https://user-images.githubusercontent.com/109953972/222461540-0daf0d96-7890-4b48-8ba4-956793afe9d2.png)

---

## TTV & TTI

## TTV (Time To View)

- 사용자가 웹사이트를 볼 수 있음과 동시에 상호 작용이 가능하다. (TTV = TTI)

![image](https://user-images.githubusercontent.com/109953972/222461500-4f0ba05f-2cbe-4d76-971b-4ecd7e99cf04.png)

## TTI (Time To Interact)

- HTML을 먼저 받아와서 보여주기 때문에 TTV는 빠르지만 TTI는 나중에 된다 (사이에 텀이 존재)

![image](https://user-images.githubusercontent.com/109953972/222461360-267359e2-cceb-4398-95f5-1e8ee664c613.png)

---

## 7. SSG (Static Site Generation)

- React로 생성되는 동적인 요소들을 Gatsby를 통해서 서버에 정적으로 미리 만들어 둔다.
- 추가적으로 데이터를 받아오거나 동적으로 처리해야한다면 .js파일을 함께 가지고 있을 수 있기 때문에 문제없다.
- 미리 만들어 두기 때문에 바뀔일이 거의 없는 페이지에 적합하다.
- 회사 홈페이지나 항상 같은 내용을 보여주고, 업데이트가 거의 없는 서비스에 적합하다.

## 8. Universal (CSR + SSR)

- 사용자에 따라서 페이지 내용이 달라지고, 빠른 상호작용과 검색 노출까지 필요한 서비스에 적합하다.