# Before

- 이번에 Next.12 page router방식과 redux로 구성된 프로젝트를 유지보수하게 되었는데, 13 app router는 사용해 보았지만 12 page router와 redux-wrapper에 대해 파악하고자 분석하게 되었다.

<aside>
💡 중요한 점은 Next.js 는 서버라는 것을 놓치지 말자

</aside>

# 1. Next.js version 12

<aside>
💡 _app → page Component rendering→ _document → html

</aside>

## 1)_app.tsx

- 역할: `_app.tsx` 파일은 Next.js 앱의 전역 레이아웃과 공통 기능을 설정, 모든 페이지에 공통으로 적용되는 레이아웃, 상태 관리, 글로벌 스타일, 에러 핸들링 등을 정의할 수 있습니다.
- 위치: `pages` 폴더 안에 위치해야 합니다.
- 설명: 이 파일은 일반적인 React 컴포넌트로, `App` 함수를 내보내는데, 이 함수는 `Component`와 `pageProps` 두 개의 매개변수를 받습니다. `Component`는 현재 라우팅된 페이지의 컴포넌트를 나타내며, `pageProps`는 해당 페이지 컴포넌트에 대한 초기 속성을 나타냅니다. 이 파일을 사용하여 전역적으로 적용되는 레이아웃을 구성하거나 상태 관리를 설정할 수 있습니다.
    - pageProps는 `getInitialProps`, `getStaticProps`, `getServerSideProps` 중 하나를 통해 페칭한 초기 속성값이 됩니다.
    - `_app`에서도 `getInitialProps`를 사용해 모든 페이지에서 사용할 공통 속성값을 지정할 수 있으나, 이럴 경우 자동 정적 최적화(Automatic Static Optimization)이 비활성화되어 모든 페이지가 서버 사이드 렌더링을 통해 제공됩니다.
    - 만약 `_app`에서 `getInitialProps`를 사용하고자 한다면, 꼭 아래처럼 App 객체를 불러온 후 `getInitialProps`를 통해 데이터를 불러와야 합니다.
    - 아래와 같이 구성하고 각 페이지 컴포넌트마다 getServerSideProps를 통해 서버를 구성한다면 getInitialProps도 같이 매번 실행하여 pageProps로 전달해준다.
        - getInitialProps → getServerSideProps → Component Rendering
        
        ```jsx
        import App from 'next/app'
        
        function app({ Component, pageProps }) {
            return <Component {...pageProps} />
          }
        
        app.getInitialProps = async (appContext) => {
          const appProps = await App.getInitialProps(appContext);
        
          return { ...appProps }
        }
        ```
        

## 2)_document.tsx

- 역할: `_document`는 `_app` 다음에 실행되며, 공통적으로 활용할 <head> (Ex. 메타 태그)나 <body> 태그 안에 들어갈 내용들을 커스텀할때 활용합니다.
- 위치: pages 폴더 안에 위치, _app과 동일한 위치
- 설명:  font import or charset, meta tag setting /  `_document`는 언제나 서버에서 실행되므로 브라우저 api 또는 이벤트 핸들러가 포함된 코드는 실행되지 않습니다.

## 3) index.tsx

- 역할: `index.tsx`는 기본적으로 루트 페이지를 나타냅니다. 이 파일은 애플리케이션의 기본 경로(`/`)로 접속했을 때 보여지는 페이지를 정의합니다.
- 위치: `pages` 폴더 안에 위치하며, 파일 이름에 따라 라우팅 경로가 결정됩니다.
- 설명: 각 페이지 파일은 React 컴포넌트로 구현되며, 일반적인 React 개발 방식과 동일하게 컴포넌트를 작성합니다. Next.js의 라우팅 시스템에 의해 해당 파일들이 각각의 라우팅 경로와 매칭되어 화면에 보여집니다.

## 4) getInitialProps vs getStaticProps vs getServerSideProps

### getInitialProps → 자동 정적 최적화 비활성화

- 이 함수는 서버 측과 클라이언트 측 모두에서 실행될 수 있으며, 페이지 전환 시 클라이언트 측에서 다시 실행될 수 있습니다.
- 레거시 API → getStaticProps or getServerSideProps를 추천
- 자동 정적 최적화 ?
- 페이지가 빌드 타임에 HTML로 미리 생성되어 사용자에게 더 빠르게 제공될 수 있게 하는 과정입니다. 이러한 최적화는 서버사이드 렌더링(SSR)이나 클라이언트사이드 렌더링(CSR)보다 퍼포먼스와 SEO 측면에서 유리한 경우가 많습니다. → CDN & 캐싱
- about..
    1. 서버에서 페이지 요청 시: 첫 페이지 로드 시 서버에서 실행되며, 이를 통해 서버 사이드 렌더링이 가능해집니다. 서버는 `getInitialProps()`를 실행하여 필요한 데이터를 가져온 후, 이 데이터를 사용하여 HTML을 렌더링하고 클라이언트에게 전송합니다.
    2. 클라이언트 사이드 네비게이션 시: Next.js 애플리케이션 내에서 한 페이지에서 다른 페이지로 클라이언트 사이드 네비게이션(예: `Link` 컴포넌트 사용 또는 `router.push()` 메소드 호출)을 할 때 `getInitialProps()`가 클라이언트 측에서 실행됩니다. 이를 통해 새로운 페이지로 이동할 때 필요한 데이터를 동적으로 가져올 수 있습니다.
    
    `getInitialProps()` 함수는 비동기적으로 실행되며, 객체를 반환해야 합니다. 이 객체는 컴포넌트의 props로 전달되어 서버에서 렌더링된 HTML에 포함되거나 클라이언트 사이드에서 추가적인 데이터 요청으로 사용됩니다.
    

### getStaticProps (SSG) → 자동 정적 최적화 가능

- 빌드 시간에 데이터를 가져와 페이지를 미리 생성하는 SSG 방식을 사용합니다. 이 함수는 각 페이지의 빌드 시 실행되며, 빌드 결과는 재사용됩니다. 따라서, 빌드 시에만 데이터가 갱신되며, 사용자가 요청할 때는 사전에 생성된 정적 파일을 제공합니다. `getStaticProps`는 주로 정적 사이트 생성에 사용되며, 데이터가 변경되지 않는 페이지에 적합합니다.

### getServerSideProps (SSR) → 자동 정적 최적화 비활성화

- 각 요청마다 서버에서 데이터를 가져오는 SSR(Server Side Rendering) 방식을 사용합니다. 이 함수는 사용자의 요청마다 페이지를 생성하기 위해 실행되며, 항상 최신의 데이터를 제공할 수 있습니다. `getServerSideProps`는 동적인 데이터가 필요한 페이지나 사용자별 커스텀 데이터를 제공해야 하는 페이지에 적합합니다.

# 2. Redux

- redux의 기본 flux 패턴을 다시 돌아보자.

<aside>
💡 Action → Dispatch → Middleware → Reducer (store) → UI (View)

</aside>

![image](https://github.com/Gi-Youn-Oh/Next.js_Blog/assets/109953972/9e765a02-01c2-4960-b717-4e941a792ddc)

![image](https://github.com/Gi-Youn-Oh/Next.js_Blog/assets/109953972/c0b27795-7e32-4d72-8e85-fbae4140e7d6)

---

# 3. next-redux-wrapper

## 1) 배경

- Next.js 는 기본적으로 Server Side Rendering 방식 즉, 렌더링 할때 마다 Server에서 Redux store를 새로 생성 (초기화) 한다.

## 2) 패턴

- 결국 패턴은 다음과 같다.
    1. getInitialProps or getServerSideProps 등 서버 페이지 필요한 데이터 fetching (페이지 렌더링 전에 호출) - Server
    2. Redux 초기화 및 상태 업데이트(store) 1. 과정에서 받아온 데이터를 기반으로 Store 상태 업데이트 - Server
    3. 초기 Store의 상태를 pageProps로 client에 전달 - Server to Client / data 직렬화 `serializeState` and `deserializeState`
    4. client Redux store 초기화 (pageProps를 기반) - Client
    5. hydrate
- 공식문서
    - Phase 1: `getInitialProps`/`getStaticProps`/`getServerSideProps`
        - The wrapper creates a server-side store (using `makeStore`) with an empty initial state. In doing so it also provides the `Request` and `Response` objects as options to `makeStore`.
        - In App mode:
            - The wrapper calls the `_app`'s `getInitialProps` function and passes the previously created store.
            - Next.js takes the props returned from the `_app`'s `getInitialProps` method, along with the store's state.
        - In per-page mode:
            - The wrapper calls the Page's `getXXXProps` function and passes the previously created store.
            - Next.js takes the props returned from the Page's `getXXXProps` method, along with the store's state.
    - Phase 2: SSR
        - The wrapper creates a new store using `makeStore`
        - The wrapper dispatches `HYDRATE` action with the previous store's state as `payload`
        - That store is passed as a property to the `_app` or `page` component.
        - Connected components may alter the store's state, but the modified state will not be transferred to the client.
    - Phase 3: Client
        - The wrapper creates a new store
        - The wrapper dispatches `HYDRATE` action with the state from Phase 1 as `payload`
        - That store is passed as a property to the `_app` or `page` component.
        - The wrapper persists the store in the client's window object, so it can be restored in case of HMR.

## 3) 장점

- 페이지 네비게이션 시 store가 교체되더라도, next-redux-wrapper가 store 인스턴스를 메모하고 있기 때문에, 실제로 store가 교체되지 않도록 관리한다는 것입니다. 이는 Redux를 통한 컴포넌트의 불필요한 대규모 재 렌더링을 방지하여 애플리케이션의 성능 향상
- getInitialProps or getStaticProps or getServerSideProps 등를 통해 server side rendering 시에도 redux store에 접근할 수 있는 인스턴스를 자동으로 생성
    - `getStaticProps`사용자가 페이지를 열거 나 `getServerSideProps`열 때마다 `HYDRATE`작업이 전달됩니다.

## 4) 정리

- 현 프로젝트는 _app에서 getInitailProps를 통하여 store 초기화 세팅 및 hydrate 이후 각 page 별로 getServerSideProps를 실행
- 이 때 page이동 시 마다 server에서 store를 초기화하고, client에게 전달하여 hydrating을 하는데 만약 전달 받은 state를 기준으로 reducer가 실행되고 state가 변경된다면?
- 아래 코드와 같이 유지
    
    ```jsx
    extraReducers: {
        [HYDRATE]: (state, action) => {
          if (!action.payload[NAME]) { // 서버로 부터 전달받은 state값이 없다면 기존 state(previous state)로 유지
            return state;
          }
          state = action.payload[NAME];
          return state;
        },
      },
    ```
    

---

# 4. next-redux-cookie-wrapper

## 1) 배경

- 위에서 봤다시피 next-redux-wapper를 통해 불필요한(서버 렌더링 시 마다) store를 생성하지 않고(memo) server state → client state 로 hydrating을 해주는 간편함이 있었지만, 결국 state값은 페이지 렌더링마다 (현재 SSR이기 때문) 초기화 된다.
- 그렇다면 token값과 같은 state를 redux-persist와 같이 영구적으로 저장하여 자동로그인과 같은 기능을 구현하려면?
    - React단일 Application에서는 CSR이기 때문에, local or session에(browser storage)접근 가능하다.
    - 하지만 Next.js (SSG or SSR 등)와 같이 server rendering을 사용한다면 local or session에(browser storage)접근할 수 없다.
    - 그래서 등장한 것이 cookie이다.

## 2) cookie

- 흔히 token을 저장하는 곳 이라고만 생각하여 한계를 두었지만 사실 token은 Server ↔ Client가 http 통신을 할때마다 header에 담아 주고 받을 수 있다.
- next-redux-cookie-wrapper는 이를 활용하여 cookie를 통해 state값을 Server ↔ Client 동기화를 시켜주는 것이다.

## 3) Work

1. 서버 측: `makeStore()` 함수 주변에 구현된 래퍼는 Next.js 컨텍스트를 액션을 통해 미들웨어에 전달합니다. 그런 다음, 미들웨어는 쿠키를 읽고 클라이언트의 상태를 포함하는 초기 `HYDRATE` 액션을 디스패치합니다. 서버 측 상태 변경이 발생하면, 클라이언트의 쿠키를 업데이트하기 위해 `set-cookie` 헤더들이 설정됩니다.

2. 클라이언트 측: 클라이언트는 관련 상태 부분이 변경될 때마다 쿠키를 업데이트합니다. 또한, 클라이언트에서 `HYDRATE` 액션은 가로채고, 구성된 상태 서브트리들은 기본적으로 검색된 JSON 데이터 대신 쿠키에서 파싱됩니다. 이렇게 하면, `getStaticProps()`로부터 오는 상태 업데이트가 동기화된 상태 서브트리를 덮어쓰지 않게 됩니다. `getStaticProps()`가 쿠키를 업데이트하지 않기 때문입니다. 필요한 경우, 이 동작을 상태 서브트리별로 선택적으로 무시하고

항상 서버의 상태를 `HYDRATE` 리듀서에서 받을 수 있습니다. 이렇게 하면 `getStaticProps()`에서 오는 상태 부분을 직접 처리할 수 있습니다.

- 결국 기본 wrapper middleware 이전에 cookie wrapper middleware 먼저 동작

압축: 기본적으로, 직렬화된 쿠키 상태는 lz-string을 사용하여 압축되어 쿠키 크기를 작게 유지합니다. 압축을 전역적으로 또는 상태 서브트리별로 비활성화하고자 할 경우, 압축 옵션을 `false`로 설정할 수 있습니다.

## 4) In Project

```jsx

const rootReducer = combineReducers({
  [commonSlice.name]: commonSlice.reducer,
  [statisticsSlice.name]: statisticsSlice.reducer,
  [sideBannerSlice.name]: sideBannerSlice.reducer,
  [homeSlice.name]: homeSlice.reducer,
  [searchFilterSlice.name]: searchFilterSlice.reducer,
  [registSlice.name]: registSlice.reducer,
  [lawmanDetailSlice.name]: lawmanDetailSlice.reducer,
  [accountSlice.name]: accountSlice.reducer,
  [lawmanVerifySlice.name]: lawmanVerifySlice.reducer,
});

export type RootState = ReturnType<typeof rootReducer>;

const DOAMIN = process.env.NODE_ENV === '';

// cookie를 통해 동기화 하려는 state들을 정의
const subtrees: Array<string | SubtreeConfig> = [
  commonSlice.name,
  registSlice.name,
  `${accountSlice.name}.ticket`,
  `${lawmanVerifySlice.name}.isVerified`,

  // 토큰만 따로 비암호화 해서 쿠키에 저장
  {
    subtree: `${accountSlice.name}.token`,
    domain: DOAMIN,
    sameSite: 'lax',
    compress: false,
    deserializationFunction: (value: string) => value,
    serializationFunction: (value: unknown) => value as string,
  },
];

const makeStore = () => {
  const store = configureStore({
    reducer: rootReducer,
    devTools: true,
    middleware: (getDefaultMiddleware) => {
    // cookie middleware에 subtrees를 등록
      return getDefaultMiddleware().prepend(nextReduxCookieMiddleware({ subtrees })).concat(thunk);
    },
  });

  return store;
};
```