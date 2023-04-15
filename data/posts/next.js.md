# Next?

- 리액트만으로는  어려운 더 많은 것들을 구현하도록 도와주는 리액트 기반 프레임워크

## Possible

1. Full stack 
2. File based rounting
3. SEO, image, font Optimization
4. SSR
5. Hybrid Rendering

## Next의 철학

### 1. 복잡한 설정 없이 프레임워크 사용 가능

### 2. 자바스크립트만으로 프론트, 백 풀스택 까지 가능하게

### 3. 자동 코드 분리와 서버사이드 렌더링 가능

- auto code-splitting이란 필요로 하는 요소만 잘게 잘라서 보냄 (로딩 속도 향상)

### 4. Data-fetching 설정 가능 (주기, 출처-client or server, 방법 등)

### 5. 요청 예상 가능 하도록

- 미리 받아오고 필요한 것들만 요청하도록

### 6. 배포를 손쉽게

---

## Rendering

### 1. CSR (Client Side Rendering)

- (content delivery network)  CDN 캐시 안됨! 인접한 국가나 지역에 캐싱
- 보안에 취약함
- seo 최적화 어려움
- 페이지 초기 로딩 시간 오래 걸림
- 서버 부하가 작고, 한번 로딩 되면 사용자 경험이 좋음

→ 이러한 문제점을 보완 및 해결 = SSR, SSG

### 2. SSR (Static Site Generation)

- 개발은 csr, 배포는 static
- 렌더링 주최 =서버, 언제 렌더링? ⇒ 빌드 시 렌더링
- 클라이언트에서 요청 시 미리 만들어준 페이지 제공

**장점**

- 페이지 로딩 시간 빠름
- 자바스크립트 필요 없음
- SEO 최적화 좋음
- 보안성
- CDN 첫 페이지 로딩 이후 캐싱  가능

**단점**

- 데이터가 정적임
- 사용자 별 정보 제공 어려움 (동일한 데이터 제공)

### 3. ISR (Incremental Static Regeneration)

- 렌더링 주최 = 서버, 언제 렌더링? ⇒ 주기적으로 렌더링
- SSG와 원리는 동일

**장점**

- SSG 장점 모두
- 데이터 주기적 업데이트

**단점**

- 실시간 데이터가 아님
- 사용자 별 정보 제공 어려움 (SSG보다는 상위 호환이지만 여전히 부족)

### 4. SSR (Client Side Rendering)

- 렌더링 주최 = 서버, 언제 렌더링? ⇒ 요청 시 렌더링

**장점**

- 페이지 로딩 시간 빠름
- 자바스크립트 필요 없음
- SEO 최적화, 보안성
- **실시간 데이터 사용**
- **사용자별 데이터 제공**

**단점**

- ssg, isr 비해 상대적으로 느림
- 서버 과부하 우려 (오버헤드 발생)
- CDN 캐시 안됨
- 사용자가 많아질수록 접속 오래 걸림

## Hybrid

- 혼합, 특정 목적을 달성하기 위해 두개 이상의 기능이나 요소를 결합
- next.js 에서는 여러 렌더링 방식을 혼합해서 함께 사용 가능하다.
- v13부터는 컴포넌트 별 렌더링 (v12에서는 페이지 단위)

## Hydrate

1. client 요청 → 정적HTML 생성 (pre-rendering이라고도함)
2. client 정적 페이지 우선 보여줌
3. react 라이브러리, 소스코드를 클라이언트에서 다운로드
4. 다운로드 되면  컴포넌트 렌더링
5. 이전에 잘못된 경우에는 순간적으로 깜빡임 이슈가 있었음 HTML 을  컴포넌트로 바꿀 때
6. **정적 HTML ~ Hydration 사이 간격을 줄이는 것이 포인트!**

## When? what?

- 사용자 로그인, 데이터 변경 x, 공개적 웹페이지 → SSG (next에서 기본적으로 해당하면 알아서 ssg 처리)
- 자주 변경되지 않으면 ISR
- 자주 변경되면 SSR
- 서버 과부하 우려되면 hybrid ( ISR or SSG  + CSR)
- 로그인이 필요하다면 CSR or SSR or Hybrid(SSG + CSR)

---

## Rounting

- 정적, 동적 라우팅 가능

## Image & Font

- 파일 빌드 시에 미리 해당 컴포넌트 공간을 HTML에 확보해두어, layout shift가 발생하지 않는다 ⇒ 성능, 사용자 경험 개선

## Loading & Error

- 내부적으로 React의 suspense, errorboundary 사용

## 동향

- v13에 들어서면서 React v18과 함께 Sever Component 및 SSR활용 극대화로 굉장히 좋은 성능을 보여주고 있지만, web socket이나 web rtc를 함께 사용하려면 별도의 서버를 만들어야 한다.