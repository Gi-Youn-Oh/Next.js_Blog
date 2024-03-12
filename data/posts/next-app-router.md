# Before to dive

편의상 이 글에서는 React Server Component = RSC / React Client Component = RCC 로 칭하겠습니다.

필자는 Next.js 13 App router 버전을 먼저 사용해 보았고, Next.js 12 Page router는 간단한 소규모 프로젝트에만 사용해 봤었다. 

13버전부터 컴포넌트 단위의 렌더링이 가능해졌다고 하는데 Next.js 12 Page router에서도 Client Comoponent는 개별 렌더링이 되었었다. 

그래서(RCC위주의 프로젝트이다 보니) 도대체 컴포넌트 단위의 렌더링이 가능하다는게 무슨 의미인지 크게 와닿지 않았었다.

이러한 궁금증과 이번에 Next.js 12 page router를 사용해 만들어진 프로젝트를 Next.js App router로 마이그레이션 해야 하는 프로젝트를 맡게 되어 차이점을 알아보게 되었다.

# Features

[Next.js Blog에서 version13](https://nextjs.org/blog/next-13) 부터 App router방식 업데이트에 대한 특징들을 다음과 같이 소개하고 있다.

![image](https://github.com/Gi-Youn-Oh/Next.js_Blog/assets/109953972/c48ae993-0de9-40cf-8d12-34a2c7e5792e)

- 이미지 & 폰트 최적화, next/link 의 자체 지원, Turbopack 등 여러 업데이트 들이 있지만 가장 두드러지는 부분은 page → app directory 변화에 대한 것이다.

---

# Page routing (Before App directory)

이전 글에서 설명했던 부분과 자세한 개념은 생략하도록 하겠다.

## _app.js

- 앱의 전역 레이아웃, 공통 기능 설정, 상태 관리, 글로벌 스타일, 에러 핸들링 등을 정의할 수 있다.
    - 단일 layout의 경우 별도의 컴포넌트를 정의하고  _app.tsx에서 import 하여 레이아웃을 적용해 주었으며, 개별 layout을 적용하기 위해선 getLayout으로 받아 사용해야 했다.
    - Single Shared Layout
    
    ```jsx
    // pages/_app.js
    import Layout from '../components/layout'
     
    export default function MyApp({ Component, pageProps }) {
      return (
        <Layout>
          <Component {...pageProps} />
        </Layout>
      )
    }
    ```
    
    - Per-Page Layouts
    
    ```jsx
     
    // pages/index.js
    import Layout from '../components/layout'
    import NestedLayout from '../components/nested-layout'
     
    export default function Page() {
      return (
        /** Your content */
      )
    }
     
    Page.getLayout = function getLayout(page) {
      return (
        <Layout>
          <NestedLayout>{page}</NestedLayout>
        </Layout>
      )
    }
    ```
    
    ```jsx
    
    // pages/_app.js
    export default function MyApp({ Component, pageProps }) {
      // Use the layout defined at the page level, if available
      const getLayout = Component.getLayout ?? ((page) => page)
     
      return getLayout(<Component {...pageProps} />)
    }
    ```
    

## _document.js

- font or charset, meta data setting에 사용한다.

## Data Fetching

- page 생성에 필요한 초기 데이터를 아래 함수들을 사용하여 prop으로 내려주었다.
    
    ### 1. getInitialProps()
    
    - 초기 페이지 생성 시 (서버에서) 실행, 페이지 전환 시 (클라이언트에서) 실행
    - 자동 정적 최적화 x
    
    ### 2. getStaticProps()
    
    - 페이지 빌드 시 실행
    - 자동 정적 최적화 o
    
    ### 3. getServerSideProps()
    
    - 페이지 요청시 실행
    - 자동 정적 최적화 x

---

# App routing

그렇다면 13버전부터 어떤 형식으로 바뀌었는지 살펴보자.

## Layout.js (_app + _document)

- _app, _document가 사라지고 Layout으로 합쳐졌다.
- 또한 페이지 별 getLayout으로 사용하지 않고 폴더 안에 중첩으로 layout을 설정할 수 있다.

```jsx
// app/layout.tsx
export default function RootLayout({
  // Layouts must accept a children prop.
  // This will be populated with nested layouts or pages
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
```

## Data Fetching

- 기존에 사용하던 getInitialProps(), getStaticProps(), getServerSideProps() 등의 함수를 더 이상 사용할 필요가 없어졌다.
    - 확장된 fetch를 사용한다.

## Streaming

- 서버에서 렌더링 된 컴포넌트를 RSC payload형식으로 클라이언트에서 stream 형태로 수신하여 업데이트한다. (페이지 → 컴포넌트)

---

# How?

다른 이미지 폰트 최적화 레이아웃 형태도 중요한 사항들이지만 data fetching방식의 변화와 streaming방식으로 점진적 업데이트가 가능하게된 이유는 13버전부터는 모든 컴포넌트의 default값이 Server Component이기 때문이다.

---

# React Server Component (RSC)

본격적으로 RSC에 대해 알아보자.

<aside>
💡 RSC는 서버에서 렌더링 되어 직렬화 된 데이터로 전달한다.

</aside>

```jsx
M1:{"id":"./src/ClientComponent.client.js","chunks":["client1"],"name":""}
S2:"react.suspense"
J0:["$","@1",null,{"children":[["$","span",null,{"children":"Hello from server land"}],["$","$2",null,{"fallback":"Loading tweets...","children":"@3"}]]}]
M4:{"id":"./src/Tweet.client.js","chunks":["client8"],"name":""}
J3:["$","ul",null,{"children":[["$","li",null,{"children":["$","@4",null,{"tweet":{...}}}]}],["$","li",null,{"children":["$","@4",null,{"tweet":{...}}}]}]]}]
```

## Concept

[Next.js 공식문서](https://nextjs.org/docs/app/building-your-application/rendering/server-components)에서 다음과 같이 Server Component를 설명하고 있다.

**In Server**

- Next.js는 서버에서 React API를 사용하여 렌더링 한다.
- 개별 segment 및 suspense 경계를 기준으로 청크로 분할되며 각 청크는 다음 두 단계로 렌더링 된다.
    1. **React는 서버 구성요소를 React Server Component Payload(RSC Payload)**
        
        라는 특수 데이터 형식으로 렌더링합니다 .
        
    2. Next.js는 RSC 페이로드 및 클라이언트 구성 요소 JavaScript 지침을 사용하여 서버에서 **HTML을 렌더링합니다.**

**In Client**

- 그리고 클라이언트에서 다음 단계를 수행한다.
    1. 서버에서 렌더링된 HTML은 미리보기를 즉시 표시하는 데 사용됩니다. 이는 초기 페이지 로드에만 해당됩니다.
    2. **RSC Payload**는 클라이언트 및 서버 구성 요소 트리를 조정하고 DOM을 업데이트하는 데 사용됩니다.
    3. JavaScript 지침은 Hydrating에 사용된다. 클라이언트 구성 요소를 선택하고 응용 프로그램을 대화형으로 만듭니다.

**React Server Component**

- 렌더링된 React 서버 구성 요소 트리의 압축된 바이너리 표현입니다. 클라이언트의 React에서 브라우저의 DOM을 업데이트하는 데 사용됩니다. RSC 페이로드에는 다음이 포함됩니다.
    - 서버 구성 요소의 렌더링 결과
    - 클라이언트 구성 요소를 렌더링해야 하는 위치 및 해당 JavaScript 파일에 대한 참조에 대한 자리 표시자
    - 서버 구성 요소에서 클라이언트 구성 요소로 전달되는 모든 소품

---

위의 말을 조금 더 이해하기 쉽도록 Meta 팀 개발자인 [dan의 그림](https://github.com/reactwg/server-components/discussions/4)을 가져와봤다.

흔히 우리가 사용해온 리액트의 모델은 다음과 같을 것이다. (with SSR) 

1. React의 Component들이 HTML화 되어 초기 페이지가 보여진 뒤 interaction에 필요한 JS를 hydrating하여 보여주거나 (SSR) 모든 JS bundle을 다운로드하고 보여주거나 (CSR) 였다.

![image](https://github.com/Gi-Youn-Oh/Next.js_Blog/assets/109953972/bdf4c961-a301-4e74-be76-f67d30545c52)

2. 하지만 여전히 이 구조는 변하지 않았으며, 이전에 한 단계의 층만 형성되었을 뿐이다 라고 설명한다.

![image](https://github.com/Gi-Youn-Oh/Next.js_Blog/assets/109953972/95a39f55-718b-40f6-86ba-a69899ed75be)

![image](https://github.com/Gi-Youn-Oh/Next.js_Blog/assets/109953972/c97192aa-b7ec-41eb-b096-d2c04ec82d2b)

- 이전에 우리가 Next.js를 포함한 모든 컴포넌트들은 Client컴포넌트라고 생각하면 조금 받아들이기 쉬울 수 있다.
    - 이 때 SSG, SSR은 서버에서 렌더링하는 거 아니야? 그럼 Next.js는 서버에서 렌더링 했던 것이 아닌건가? 라고 생각할 수 있지만 SSR 과 RSC 는 전혀 다르다. (이 내용은 바로 아래에서 다루도록 하겠다.)
- 추가된 (client tree 이전 server tree)단계에서 Server Component는 서버에서 렌더링 된다.
    - 즉 서버에서 먼저 실행하기 때문에 서버에서만 할 수 있는 file or DB 접근, 데이터 fetching, cache등이 가능하다.
- 중요한 점은 흐름이 항상 Server → Client로 흐른다는 것이다. (Props are passing Server to Client)
    - Server Component는 서버에서 실행된다.
    - Client Component는 초기 HTML 생성과 DOM(Browser)에서 실행된다.

## From Meta

### Core Concept

- 기존 모든 컴포넌트는 Client Component였으며, Server Component의 등장으로 아래와 같은 장점들을 가져올 수 있었다.
- 또한 한쪽에 국한되는 것이 아닌 필요에 따라 Client or Server Component로 사용할 수 있다.
- 서버 컴포넌트의 등장은 벌써 3년전부터 대두되었다.
- 아래 영상은 Facebook (현 Meta)에서 데모를 첫 발표한 영상이며, 꼭 시청해보길 추천한다. (바쁘면 데모시연 이라도 보시길)
    
    https://www.youtube.com/watch?v=TQQPAU21ZUw&t=2172s
    
- 해당 데모 영상에서는 베타 단계였지만 현재 Next.js 13 이후에 확인할 수 있듯이 모든 컴포넌트가 기본적으로 Server Component이다.
    - Server Component 렌더링 후에 HTML화 및 Client Tree와 함께 동작하기 위해서는 추가적인 번들링이나 작업이 필요하기 때문에 Next.js와 같은 Framework를 사용해야 한다.

## Process (Only describe React with RSC not SSR)

- 만약 다음과 같이 tree가 구성되어 있다고 가정해보자.
    - 여기서 RCC 하위에 어떻게 RSC가 위치할 수 있는지 물어본다면 children pattern으로 가능한 것이다. (Next.js에서도 client 하위에 위치한 컴포넌트들은 자동적으로 client컴포넌트로 간주)

![image](https://github.com/Gi-Youn-Oh/Next.js_Blog/assets/109953972/b1219a99-a334-4d52-beab-af1f320bd3f1)

### 1. Server receive render

```jsx
// ClientComponent.client.jsx
export default function ClientComponent({ children }) {
  return (
    <div>
      <h1>Hello from client land</h1>
      {children}
    </div>
  )
}

// ServerComponent.server.jsx
export default function ServerComponent() {
  return <span>Hello from server land</span>
}

// OuterServerComponent.server.jsx
// OuterServerComponent can instantiate both client and server
// components, and we are passing in a <ServerComponent/> as
// the children prop to the ClientComponent.
import ClientComponent from './ClientComponent.client'
import ServerComponent from './ServerComponent.server'
export default function OuterServerComponent() {
  return (
    <ClientComponent>
      <ServerComponent />
    </ClientComponent>
  )
}

```

### 2. serialize root component <a href="https://github.com/facebook/react/blob/42c30e8b122841d7fe72e28e36848a6de1363b0c/packages/react-server/src/ReactFlightServer.js#L368">`[resolveModelToJSON()` in `ReactFlightServer.js]`</a>

```jsx
// React element for <div>oh my</div>
> React.createElement("div", { title: "oh my" })
{
  $$typeof: Symbol(react.element),
  type: "div",
  props: { title: "oh my" },
  ...
}

// React element for <MyComponent>oh my</MyComponent>
> function MyComponent({children}) {
    return <div>{children}</div>;
  }
> React.createElement(MyComponent, { children: "oh my" });
{
  $$typeof: Symbol(react.element),
  type: MyComponent  // reference to the MyComponent function
  props: { children: "oh my" },
  ...
}

```

- 하지만 서버에서는 RCC를 렌더링 할 수 없기 때문에, module reference라고 칭하는 참조 값만 두고 넘어간다.
    - 이 작업은 **`react-server-dom-webpack`** as a **[webpack loader](https://github.com/facebook/react/blob/main/packages/react-server-dom-webpack/src/ReactFlightWebpackNodeLoader.js)** or a **[node-register](https://github.com/facebook/react/blob/main/packages/react-server-dom-webpack/src/ReactFlightWebpackNodeRegister.js)**. 에서 이루어진다.
    
    ```jsx
    {
      $$typeof: Symbol(react.element),
      // The type field  now has a reference object,
      // instead of the actual component function
      type: {
        $$typeof: Symbol(react.module.reference), // RCC 또한 function이므로 직렬화 할 수 없기에 module.reference 표시를 해둔다.
        // ClientComponent is the default export...
        name: "default",
        // from this file!
        filename: "./src/ClientComponent.client.js"
      },
      props: { children: "oh my" },
    }
    
    ```
    
- 다음과 같이 직렬화 되어 있을 것이다.
    
    ```jsx
    {
      // The ClientComponent element placeholder with "module reference"
      $$typeof: Symbol(react.element),
      type: {
        $$typeof: Symbol(react.module.reference),
        name: "default",
        filename: "./src/ClientComponent.client.js"
      },
      props: {
        // children passed to ClientComponent, which was <ServerComponent />.
        children: {
          // ServerComponent gets directly rendered into html tags;
          // notice that there's no reference at all to the
          // ServerComponent - we're directly rendering the `span`.
          $$typeof: Symbol(react.element),
          type: "span",
          props: {
            children: "Hello from server land"
          }
        }
      }
    }
    
    ```
    
    ![image](https://github.com/Gi-Youn-Oh/Next.js_Blog/assets/109953972/dd5da72e-5034-4c28-8b85-7a35c9ad672e)
    

### 3. 브라우저 DOM

- 이제 module reference인 RCC 또한 진짜 컴포넌트로 렌더링할 차례다.
    
    ```jsx
    import { createFromFetch } from 'react-server-dom-webpack'
    function ClientRootComponent() {
      // fetch() from our RSC API endpoint.  react-server-dom-webpack
      // can then take the fetch result and reconstruct the React
      // element tree
      const response = createFromFetch(fetch('/rsc?...'))
      return <Suspense fallback={null}>{response.readRoot() /* Returns a React element! */}</Suspense>
    }
    
    ```
    
- 다시 bundler의 도움을 받는다. (RCC를 server module.reference로 대체한 것도 bundler)

![image](https://github.com/Gi-Youn-Oh/Next.js_Blog/assets/109953972/9a7618f7-7d33-4029-a501-64fc1aaefb9c)

---

# Server Component Benefit?

그렇다면 RSC의 장점은 뭐가 있을까?

## data  fetching

### Before😮‍💨

- 기존의 client 에서 data fetching 방식은 크게 2가지이다.
    
    ![image](https://github.com/Gi-Youn-Oh/Next.js_Blog/assets/109953972/c9fecf90-8174-446e-a652-98dcc75084e9)
    
    1. 모든 정보를 부모 컴포넌트에서 API 호출하여 큰 data를 받아 자식에게 prop으로 전달한다.
        - 클라이언트에서 서버로 요청하는 API 요청수를 줄일 수 있지만 그로 인해 부모와 자식 컴포넌트가 결속되고 유지보수가 어려워지게 됩니다. 만일 컴포넌트의 구성이 바뀌거나 자식 컴포넌트가 다른 컴포넌트로 이동되는 경우, 해당 API를 다른 컴포넌트에서도 호출해줘야 하며 불필요한 정보를 over-fetching하게 됩니다.
            
            ```jsx
            function BeforeComponent({ targetId }) {
                const stuff = fetchAllData();
                return (
                  <ParentComponent targetId={targetId}>
                    <FirstChild details={stuff.details} targetId={targetId}></FirstChild>
                    <SecondChild summary={stuff.summary} targetId={targetId}></SecondChild>
                  </ParentComponent>
                );
              }
            ```
            
    2. 컴포넌트에 필요한 API를 각 컴포넌트에서 호출한다.
        - 각 컴포넌트가 렌더링 될 때 필요한 데이터만 가져와 보여줄 수 있다는 장점이 있지만 high latency를 가진 클라이언트부터의 서버 요청은 늘어나게 됩니다. 또한 부모 컴포넌트는 렌더링 된 후 필요한 데이터를 받아오기 시작하고 이 과정이 끝나기 전까지 자식 컴포넌트의 렌더링과 API 호출 또한 지연됩니다. 결국 연속된 client-server API 요청과 중첩된 컴포넌트 내 API 호출 지연으로 인한 waterfall은 사용자 경험을 떨어트릴 수 있습니다.
            
            ```jsx
            
            function FirstChild({targetId}) {
                const stuffDetails = fetchDetails(targetId);
                return (
                  <div>
                    <h1>{stuffDetails.title}</h1>
                    <p>{stuffDetails.content}</p>
                  </div>
                );
            }
            
            function SecondChild({targetId}) {
                const stuffSummary = fetchSummary(targetId);
                return (
                  <div>
                    <h2>{stuffSummary.title}</h2>
                    <p>{stuffSummary.content}</p>
                  </div>
                );
            }
            ```
            

**Issue**

- 기존 리액트 컴포넌트의 비동기적 data fetching의 가장 큰 문제점은 클라이언트와 서버 간 요청의 high latency와 연속된 Client-Server API 요청으로 발생하는 waterfall이었습니다.

### After😲

- 서버에서 Render를 수행하기 때문에 API를 통한 데이터 요청의 latency를 줄일 수 있고, 클라이언트에서의 연속된 API 호출을 제거하여 client-server waterfall를 막을 수 있습니다.
    
    ![image](https://github.com/Gi-Youn-Oh/Next.js_Blog/assets/109953972/1d6211da-8dcc-43df-b600-c852ca140a68)
    

## Benefit

다음과 같은 장점들이 있다.

### 1. resource accessibility

- file, db등 server data source에 직접 접근 가능
    - fetching data 중 serializable props만 전달 가능하며 function은 전달할 수 없습니다.
    - 실행코드와 실행 컨텍스트를 모두 포함하는 개념이기 때문인데, 함수는 자신이 선언된 스코프에 대한 참조를 유지하고, 그 시점의 외부 변수에 대한 참조를 기억하고 있다.

### 2. secure

- 토큰 및 API 키와 같은 민감한 데이터와 논리를 클라이언트에 노출할 위험 없이 서버에 보관

### 3. zero bundle size

- 필요에 따라 많은 라이브러리들을 설치하게 되는데 서버에서 렌더링 되어 전달되므로 클라이언트에서 다운로드 할 필요가 없다.
    - 트리 쉐이킹, code-splitting을 지원하지만 결국 번들 사이즈가 늘어나는 것은 해결할 수 없었다.

### 4. code splitting

- 서버 컴포넌트에서 import되는 모든 client component를 code splitting point로 간주하기 때문에 React.lazy로 명시 하지 않아도 된다.
    - 위에서 말했듯이 컴포넌트의 흐름은 Server Component → Client Component이기 때문에 Server Component가 렌더링 될때에 Client컴포넌트는 렌더링 될 수 없다. (자연스럽게 lazy loading)
    - 기존에도 가능했지만 React.lazy와 dynamic import를 적용해야 했으며, 부모 컴포넌트가 렌더링 된 이후 로딩을 시작하기 때문에 딜레이가 존재했다.

### 5. cache

- 서버에서 렌더링하면 결과를 캐시하고 후속 요청 및 사용자 전체에서 재사용할 수 있습니다. 이렇게 하면 각 요청에 대해 수행되는 렌더링 및 데이터 가져오기 양이 줄어들어 성능이 향상되고 비용이 절감될 수 있습니다.

### 6. streaming

- 아래 설명 참고.

### 7. ETC..

- SEO 등등..

---

# Streaming

다시 돌아가서 Next.js 13부터 App router는 기본적으로 RSC로 동작한다고 했고, 컴포넌트 단위로 렌더링이 가능하다고 했다. 이를 다시 말하면 점진적으로 렌더링이 가능하다는 것이다.

### **Before Next.js 13 (in page router)**

- 전체 페이지를 구성하여 전달 (getInitialProps(), getServerSideProps())

### Now

- 컴포넌트 단위로 서버에서 렌더링(해석)하여 직렬화된 RSC payload로 전달
    
    ![image](https://github.com/Gi-Youn-Oh/Next.js_Blog/assets/109953972/5a00e832-94bf-4351-af47-d8077013a035)
    

---

# Server Component vs Client  Component

- Next.js 공식 홈페이지에서 다음과 같이 컴포넌트를 구분하여 사용하기를 권장하고 있다.

![image](https://github.com/Gi-Youn-Oh/Next.js_Blog/assets/109953972/bd164070-40a8-4436-94b3-6444bea81ee8)

---

# Server Component vs SSR (Server Side Rendering)

- 서버 컴포넌트와 서버 사이드 렌더링은 서버에서 렌더링 된다는 유사점이 있지만 해결하고자 하는 문제점이 다르다.
- 서버 컴포넌트의 코드는 클라이언트로 전달되지 않습니다. (RSC payload형식으로 직렬화되어 전달 - Zero bundle size) 하지만 서버 사이드 렌더링의 모든 컴포넌트의 코드는 자바스크립트 번들에 포함되어 클라이언트로 전송됩니다.
- 서버 컴포넌트는 페이지 레벨에 상관없이 모든 컴포넌트에서 서버에 접근 가능하다.
    - Next.js 12까지의 Page router의 경우 가장 top level의 페이지에서만 `getServerProps()`나 `getInitialProps()`로 서버에 접근 가능 했었다. → 바로 이 부분이 컴포넌트 단위로 렌더링이 가능하다는 것이다.
- 서버 컴포넌트는 클라이언트 상태를 유지하며 refetch 될 수 있다. 서버 컴포넌트는 HTML이 아닌 특별한 형태로 컴포넌트를 전달하기 때문에 필요한 경우 포커스, 인풋 입력값 같은 클라이언트 상태를 유지하며 여러 번 데이터를 가져오고 리 렌더링하여 전달할 수 있습니다. 하지만 SSR의 경우 HTML로 전달되기 때문에 새로운 refetch가 필요한 경우 HTML 전체를 리 렌더링 해야 하며 이로 인해 클라이언트 상태를 유지할 수 없다.
    - 서버 컴포넌트가 전달되는 형태
        
        ![image](https://github.com/Gi-Youn-Oh/Next.js_Blog/assets/109953972/5622b525-b200-4b7b-ac02-69a7e380ecac)
        
- 그렇다면 RSC가 SSR을 대체할 수 있을까?  🙅🏼
    - 서버 컴포넌트는 서버 사이드 렌더링 대체가 아닌 보완의 수단으로 사용할 수 있다. 서버 사이드 렌더링으로 초기 HTML 페이지를 빠르게 보여주고, 서버 컴포넌트로는 클라이언트로 전송되는 자바스크립트 번들 사이즈를 감소시킨다면 사용자에게 기존보다 훨씬 빠르게 인터랙팅한 페이지를 제공할 수 있을 것입니다.

<aside>
💡 즉 SSR은 초기 페이지 로딩 시 전체 렌더링을 통해 HTML로 먼저 보여주는 것이고, RSC는 서버에서 필요한 초기 data fetching & Library들을 해석하여 직렬화 한 상태로 넘겨지는 것이다.

</aside>

---

# Question?

RSC가 직렬화된 상태로 streaming되어 전달되는 것 까지는 알겠다. 

그런데 만약 간단한 메모 앱이 있다고 하고, 사용자가 특정 메모를 클릭 (RCC) 했을 때 메모를 불러와서 보여줘야 한다면? (RSC) 어떻게 자동으로 RSC를 업데이트 할 수 있을까?

- 위에서 언급했던 RSC demo 영상에서는 다음과 같이 말한다.
    - 예를 들어 user interaction에 의해 targetId가 변경되면 이 변경사항은 React API에 의해 추적된다.
    - RSC Architecture는 Infra 에서 감지할 수 있도록 제공한다.
        - 이 때 Infra는 Next.js가 하나의 예시이다. (context로 참조)
    - 변경사항을 서버에 전달하기 위해 요청한다. React API 감지 → Infra(Next.js) 처리 → Server Component 재호출 (항상 흐름은 서버 → 클라이언트 임을 잊지 말자)
    - Streaming수신 (RSC payload) → React DOM reconciliation → Update UI

---

# In Project Example

## Personal Blog - Next.js 13 App router

- 필자 블로그 또한 Next.js 13 App router를 사용해 개발했는데 이 때 실제 렌더링 과정을 들여다 볼 수 있다.
    
    ### 1. 첫 페이지 로딩 시에는 HTML만 (Can’t interative) 수신하여 초기 페이지를 보여준다.
    
    - 자동 정적 최적화되어 HTML형식으로 보내진다.

    ![image](https://github.com/Gi-Youn-Oh/Next.js_Blog/assets/109953972/a5004b76-5ba9-442f-a5fc-84c4ea187e9a)
    
    ### 2. 이후 각 RSC는 직렬화 되어 수신 된다.
    
    - 이 때 각 컴포넌트들이 차례로 Streaming되는 것을 볼 수 있다. (Page 전체가 아닌)
    - DOM tree 형성
        
        ![image](https://github.com/Gi-Youn-Oh/Next.js_Blog/assets/109953972/387f0acd-bd3b-4b21-9e1b-6f040c5d5b22)
        
    
    ### 3. RCC또한 렌더링되고 필요한 event handler등이 등록된다 (hydrating)
    
    - 또한 새로운 컴포넌트가 로딩 될때 마다 컴포넌트 단위로 RSC payload를 수신하여 업데이트 한다.
        
        ![image](https://github.com/Gi-Youn-Oh/Next.js_Blog/assets/109953972/cc089036-4cbf-4e92-b9c5-b25df5e38469)
        

## Next.js 12 page router project

- 다음은 12 page router 프로젝트이다.
    
    ### 1. 마찬가지로 첫 페이지 로딩 시에는 HTML만 (Can’t interative) 수신하여 초기 페이지를 보여준다.
    
    - 초기 페이지에 아무것도 보이지 않는 이유는 전부 `<Client></Client>` 로 감싸진 컴포넌트이기 때문이다.
        
        ![image](https://github.com/Gi-Youn-Oh/Next.js_Blog/assets/109953972/49b7aee4-e85d-4b56-b9bd-32b3898ab607)
        
        ![image](https://github.com/Gi-Youn-Oh/Next.js_Blog/assets/109953972/cc5c8855-f099-4228-9fcd-b2c7892f2642)
        
    - <Client> 태그를 없애면 보인다.
        
        ![image](https://github.com/Gi-Youn-Oh/Next.js_Blog/assets/109953972/1881a87c-36a5-44f3-980e-0e38dd293d6b)
        
        ![image](https://github.com/Gi-Youn-Oh/Next.js_Blog/assets/109953972/dae98dcb-7bd4-45a8-9c3d-7d93d033d506)
        
    - **react-hydration-provider**
        - 정상적이라면 SSR을 위해 초기 렌더링 값들은 `<Server>` 태그로 감싸고
        - hydration 이후 Rendering 되는 것들만 `<Client>` 로 감싸야 했다.
            
            ```jsx
            import { HydrationProvider, Server, Client } from "react-hydration-provider";
            
            function App() {
            	return (
            		// HydrationProvider should usually be placed at a high level in your app.
            		<HydrationProvider>
            			<main>
            				<Server>
            						<p>
            						This will be rendered during html generation (SSR, SSG, etc) and the
            						initial app hydration. It should always have a reliable value that
            						will render the same in both a server and client environment.
            					</p>
            				</Server>
            				<Client>
            					<p>This will be rendered after initial app hydration.</p>
            					<p>
            						It can safely contain dynamic content, like this: {Math.random()}
            					</p>
            				</Client>
            				<p>This will always be rendered.</p>
            			</main>
            		</HydrationProvider>
            	);
            }
            ```
            
    - getInitialProps()를 _app에서 사용하고, 모든 페이지에서 getServerSideProps()를 사용하므로 자동정적 최적화가 되지 않는다.
        - next.js 공식문서
            
            ![image](https://github.com/Gi-Youn-Oh/Next.js_Blog/assets/109953972/c5c05ef1-0387-4a04-a5c4-eaa0b01eee66)
            
        - 다음은 빌드 결과이며, index.js 로 존재하는 것을 확인할 수 있다.
            
            ![image](https://github.com/Gi-Youn-Oh/Next.js_Blog/assets/109953972/c2d052ff-5d50-41fb-acb3-78b056d9c25b)
            
        - next.js 13 App router에서 기존 getInitailProps와 같은 함수를 사용하지 않은 빌드 결과는 다음과 같이 html형식으로 자동 정적 최적화 되어 있는 것을 확인할 수 있다.
            
            ![image](https://github.com/Gi-Youn-Oh/Next.js_Blog/assets/109953972/439819ec-145e-44cb-be08-fb03a09ed918)
            
    
    ### 2. 페이지 이동 시 App router에서는 컴포넌트 단위로 스트리밍 받는 반면 전체 js를 받아오는 것을 확인할 수 있다.
    
    ![image](https://github.com/Gi-Youn-Oh/Next.js_Blog/assets/109953972/d08b3e8b-35be-40e6-b1c6-0e8885c74bc0)
    
    ### 3. Hydrating과정은 동일
    

---

# 정리

많은 내용들이 쏟아져서 복잡하고 어렵게 느껴지긴 하지만 결국 Next.js 13 App router의 핵심은 개인적으로 RSC (React Server Component)라고 생각한다.

RSC가 SSR을 대체할수는 없고, 모든 RCC(React Client Component)를 RSC로 변환할 수는 없지만 Next.js가 현재 지향하는 방향처럼 사이트에 필요한 데이터 및 라이브러리들을 Server Component에서 렌더링하여 초기 번들 크기를 줄이고 client API waterfall을 개선 시키며, 초기 렌더링은 RSC payload와 RCC를 SSR을 통해 HTML을 우선 보여주고, Streaming방식을 통한 점진적 렌더링으로 사용자 경험을 상승 시킬 수 있다는 것은 분명하다. 

사실 App router에서 뭐가 좋아졌는지 크게 느끼지 못했었는데 이번에 정리를 하면서 많은 것들이 개선되었다는 것을 체감할 수 있었다.