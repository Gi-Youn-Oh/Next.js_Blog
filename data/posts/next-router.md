# Before

그동안 간단한 프로젝트부터 과제를 진행하며 window.location, window.history, react-router-dom, next/link, next/navigation 등을 어떤 차이점과 장단점이 있는지 모르고 그냥 사용해왔었다. 이에 대한 차이점과 장단점을 확실하게 정리하고 적재적소에 사용하고자 작성하게 되었다.

# Window

## window.location

- 현재 document의 location 정보를 담고 있다. (read only)
- 이 객체를 통해 현재 페이지의 URL을 알아내거나, 새로운 URL로 페이지를 이동시키는 등 다양한 작업을 수행할 수 있다.
- window.location.assign(url): 지정한 URL로 페이지를 이동시키며 브라우저 히스토리에 저장

    ```tsx
    // 새로운 페이지로 이동
    window.location.assign("https://www.naver.com");
    ```


- window.location.replace(url): 지정한 URL로 페이지를 이동시키며 이전 페이지가 브라우저 히스토리에 남지 않습니다.

![image](https://github.com/Gi-Youn-Oh/Next.js_Blog/assets/109953972/cfb767cf-edd4-49b6-91d5-4f2e77b62fb2)

### Example

http://www.example.com:8080/search?q=devmo#test

1. Properties

| Property | Description | Example |
| --- | --- | --- |
| hash | 주소값에 붙어있는 anchor값 반환 | #test |
| host | URL의 도메인과 포트 반환 | www.example.com:8080 |
| hostname | URL의 도메인 반환 | www.example.com |
| href | URL 반환 | http://www.example.com:8080/search?q=devmo#test |
| origin | 프로토콜 + URL의 도메인 + 포트 | http://www.example.com:8080 |
| pathname | URL 경로 반환 | /search |
| port | 서버포트 반환 | 8080 |
| protocol | 프로토콜 반환 | http: |
| search | URL에 붙은 매개변수 반환(물음표 뒤의 값) | ?q=devmo |

2. Methods

| Method | Description |
| --- | --- |
| assign(url) | 새로운 주소 이동 |
| reload(forceget) | 현재 페이지 새로고침 |
| replace(url) | 새로운 주소 이동 (세션 히스토리가 남지 않기 때문에 back 버튼으로 이동 불가) |

---

## window.history

- 브라우저의 방문 기록(히스토리)에 접근하는 데 사용되는 객체입니다. 이 객체를 사용하여 뒤로 가기, 앞으로 가기와 같은 브라우저 내 탐색 작업을 수행할 수 있다.
- window.history.back(): 브라우저의 방문 기록에서 이전 페이지로 이동합니다. "뒤로 가기" 버튼과 같은 작업을 수행합니다.
- window.history.forward(): 브라우저의 방문 기록에서 다음 페이지로 이동합니다. "앞으로 가기" 버튼과 같은 작업을 수행합니다.
- window.history.go(steps): 현재 페이지에서 주어진 스텝 수만큼 앞(양수), 뒤(음수)로 이동합니다.
- window.history.length 로 현재 쌓인 페이지 수를 확인 할 수 있다.

  ![image](https://github.com/Gi-Youn-Oh/Next.js_Blog/assets/109953972/1a16bf37-3e01-49c3-bbb3-247ed4a327a0)


<aside>
💡 window.history.forward / back 은 다시 서버에서 받아오거나 새로고침 하지 않으며 이동만!, go 는 스텝 수에 따라 동일하게 이동만

</aside>

---

## History.pushState(), History.replaceState()

<aside>
💡 페이지를 새로 고치지 않고 브라우저의 히스토리에 새로운 URL을 추가, SPA에서 주로 사용

</aside>

**history.pushState(state, title, url)**

- **`state`**: 페이지 상태를 나타내는 객체로서, 페이지 이동과 함께 관련 데이터를 저장할 수 있습니다. 주로 null 또는 객체를 사용
- **`title`**: 페이지의 제목을 나타내는 문자열입니다. 보통 빈 문자열("")을 사용하거나, 페이지 제목이 필요하지 않은 경우에는 null을 사용
- **`url`**: 새로운 URL을 나타내는 문자열, 반드시 현재 도메인 내의 URL이어야 한다.

```tsx
// 새로운 URL로 페이지 이동 (새로운 히스토리 추가)
history.pushState(null, "", "/new-page");
```

**history.replaceState(state, title, url)**

- 현재 페이지의 히스토리를 변경하며, 해당 URL로 페이지를 이동 **`pushState()`**와의 차이점은 히스토리에 새로운 URL을 추가하지 않고 현재 페이지의 URL을 대체한다는 것 따라서 뒤로 가기 버튼을 누르면 이전 페이지로 돌아가지 않고 바로 이전의 페이지로 이동합니다.

**popState()**

- pushState or replaceState로 주소를 바꾼 후 뒤로가기 or 앞으로가기 를 헀을 때 발생
- popState() 이벤트 발생 후 history.state로접근하면 이전 state를 가져올 수 있다 ⇒ 따라서 이전 페이지도 그 정보들을 활용해 다시 렌더링 할 수 있는 것

## Organize..

```markdown
1.  <a> 태그의 href 속성을 통해 라우팅 링크를 만들고 href 속성에 원하는 url 설정

2. 현재 페이지의 url과 관련된 정보를 제공하는 DOM API window.location을 통해 url 확인, 새로운 url 할당으로 페이지 이동 가능

3. window.history 객체는 브라우저의 히스토리(방문기록)을 관리 forward, back, go 등으로 페이지의 단순 이동 및 pushState, replaceState 등으로 새로고침없이 url 히스토리 추가 및 이동 가능 popState이벤트로 발생한 데이터 history.state로 관리 및 활용 가능
```

---

# Next.js

## Next/Link

1. vs <a>
- 기존  <a>태그는 페이지를 새로고침하여 로딩 하는 반면 Next.js 의 Link 태그는 client-side-navigation이 가능하다. (history.pushState()와 유사)
- code-splitting (이 개념은 react18에서 다루었으므로 자세한 내용은 pass)
- Options

```markdown
href - 이동할 경로 혹은 URL (필수)

as - 브라우저 URL 표시 줄에 표시 될 경로에 대한 선택적 데코레이터

passHref - href property를 Link 자식에게 강제로 전달하게 한다. 기본값은 false.

prefetch - 백그라운드에서 페이지를 미리 가져온다. 기본값은 true. 뷰 포트에 있는 모든 항목(초기에 혹은 스크롤을 통해)이 미리 로드 된다. prefetch={false}를 통해 프리페치를 비활성화할 수 있다. 정적 생성을 사용하는 페이지는 더 빠른 페이지 전환을 위해 데이터가 포함된 JSON파일을 미리 로드한다.

replace - history 스택(방문 기록)에 새 url을 추가하는 대신 현재 상태를 변경한다. 기본값은 false

scroll - 페이지 전환 후 페이지 상단으로 스크롤할지 여부. 기본값은 true.

shallow - getStaticProps, getServerSideProps, getInitialProps을 다시 실행하지 않고 현재 경로를 업데이트. 기본값은 false
```

### Example

```tsx
import Link from 'next/link';

function MyComponent() {
  return (
    <div>
      <Link href="/page1">
        <a>Page 1</a>
      </Link>
      <Link href="/page2">
        <a>Page 2</a>
      </Link>
    </div>
  );
}
// v13 부터는 a태그를 사용하지 않아도 된다.
```

## Router

### vs Link

- <a> 태그를 생성하지 않기 때문에 Link 태그에 비해 SEO가 좋지 않다.
- 외부 URL을 사용할 경우 window.location 혹은 a 태그를 사용해야 하는 것이 좋다. (페이지 전체를 다시 로딩해야 하기 때문)
- **<Link>는 클릭 시 바로 페이지가 전환되지만 router는 로직을 처리 후 원하는 시점에서 전환이 가능** (주로 click event에서 사용)
- 페이지 렌더링 시점에, 이동할 주소가 정해져 있지 않은 경우 사용 (ex. 비동기로 클릭 시점에 이동할 주소가 정해지는 경우 등)
- useRouter는 클래스 컴포넌트에서는 사용 x ⇒ withRouter 사용

### router.push

- 페이지가 이동되며 히스토리 스택이 쌓인다.
  Main -> Login -> List에서 마이페이지로 push 하면 Main -> Login -> List -> Mypage

```tsx
router.push(url, as, options)
```

**params**

- url: 탐색될 URL
- as: 브라우저에 표시될 URL의 optional decorator
- options: 옵션

**options**

- scroll: 탐색 후 페이지 맨 위로 스크롤 제어 (default: true)
- shallow: getStaticProps, getServerSideProps, getInitialProps를 다시 실행하지 않고 현재 페이지 경로 업데이트 (default: false)
- locale: 새로운 페이지의 locale

### router.replace

- 페이지가 이동되며 히스토리 스택이 교체된다.
  Main -> Login -> List 에서 마이페이지로 replace 하면 Main -> Login -> Mypage

```tsx
router.replace(url, as, options)
```

- 인자 및 옵션 push와 동일

### router.prefetch

- 빠른 클라이언트 전환을 위해 페이지를 미리 가져온다. **`next/link`** 의 경우 자동으로 페이지를 미리 가져오기 때문에 **`next/link`** 가 없는 탐색에서 유용하다.
- production only / 개발 시에는 x

```tsx
router.prefetch(url, as, options)
```

### router.beforePopState (v12 pages 폴더 내 next/router)

- popstate 시점에 맞추어 라우터가 동작하기전에 무언가 작업을 하고 싶을 때

```tsx
router.beforePopState(cb)
```

- cb:  popstate 이벤트에서 실행할 함수 (url, as, options)

### Shallow

- getStaticProps, getServerSideProps, getInitialProps를 다시 실행하지 않고(data-fetching없이) url변경하는 방식
- 즉, 일반적으로 Link 컴포넌트나 Router 객체를 사용하여 다른 페이지로 이동하면 해당 페이지의 모든 데이터가 새로 로드되는데, 이때 Shallow option을 사용하면 페이지의 데이터를 유지한 채로 페이지 간 이동이 가능하다.

**Example**

```tsx
import { useRouter } from 'next/router'

export default function ReadMore({ post }) {
  const router = useRouter()

  return (
    <button
      type="button"
      onClick={() => {
        router.push({
          pathname: '/post/[pid]',
          query: { pid: post.id },
          },
		  "/order"
        )
      }}
    >
      Click here to read more
    </button>
  )
}
```

---

## Router 12 vs 13

### v12 in Pages folder

- router object (next/router)

    ```markdown
    pathname: 현재 경로를 정보이다. /pages에 있는 페이지 경로
    query: 개체로 구문 분석된 쿼리 문자열이다. 페이지에 fetching 요구사항이 없으면 사전 랜더링 중에 빈 개체가 된다.
    asPath: basePath, locale 없이 브라우저에 표시되는 경로이다.
    isFallback: 현재 페이지가 fallback 모드인지 여부
    basePath: active basePath, 활성화된 경우
    locale: active locale, 활성화된 경우
    locales: 지원되는 모든 locales, 활성화된 경우
    defaultLocale: 현재 기본 locale, 활성화된 경우
    domainLocales: Array domain, defaultLocale, locales, 구성된 모든 도메인 locale
    isReady: router 필드가 클라이언트에서 업데이트되고 사용할 준비가 되었는지 여부. useEffect 메서드 내에서만 사용해야하며 서버에서 조건부로 랜더링해서는 안된다.
    isPreview: 앱이 현재 미리보기 모드인지 여부
    ```

![image](https://github.com/Gi-Youn-Oh/Next.js_Blog/assets/109953972/7ec80a43-6cd2-4263-9ae5-796699ee24af)

**Example**

```tsx
import { useRouter } from 'next/router'

function ActiveLink({ children, href }) {
  const router = useRouter()
  const style = {
    marginRight: 10,
    color: router.asPath === href ? 'red' : 'black',
  }

  const handleClick = (e) => {
    e.preventDefault()
    router.push(href)
  }

  return (
    <a href={href} onClick={handleClick} style={style}>
      {children}
    </a>
  )
}

export default ActiveLink
```

### v13 in App folder

- useRouter (next/navigation)

```markdown
router.push(href: string): 제공된 경로로 클라이언트 측 탐색을 수행합니다. 브라우저 기록 에 새 항목을 추가합니다.스택.
router.replace(href: string): 브라우저의 기록 스택 에 새 항목을 추가하지 않고 제공된 경로로 클라이언트 측 탐색을 수행합니다..
router.refresh(): 현재 경로를 새로 고칩니다. 서버에 새 요청을 만들고, 데이터 요청을 다시 가져오고, 서버 구성 요소를 다시 렌더링합니다. 클라이언트는 영향을 받지 않는 클라이언트 측 React(예: useState) 또는 브라우저 상태(예: 스크롤 위치)를 잃지 않고 업데이트된 React Server 구성 요소 페이로드를 병합합니다.
router.prefetch(href: string): 더 빠른 클라이언트 측 전환을 위해 제공된 경로를 미리 가져옵니다 .
router.back(): 소프트 탐색을 사용하여 브라우저의 기록 스택에서 이전 경로로 다시 이동합니다 .
router.forward(): 소프트 탐색을 사용하여 브라우저의 기록 스택에서 다음 페이지로 이동합니다 .
```

![image](https://github.com/Gi-Youn-Oh/Next.js_Blog/assets/109953972/d48a53eb-7427-44f7-9121-9c2fcd964808)

### Example

```tsx
'use client'

import { useRouter } from "next/navigation";

export default function Button() {
    const router = useRouter();
  return (
    <>
      <button
        onClick={() => {
          router.push("/about");
        }}
      >
        router button
      </button>
    </>
  );
}
```

### before (v12)

```tsx
import { useRouter } from 'next/router';
```

### After (v13)

- 기존 router객체로 주고받던 인자들을 별도의 객체로 마이그레이션 되었다.

```tsx
import {
  usePathname,
  useRouter,
  useSearchParams,
  useSelectedLayoutSegment,
  useSelectedLayoutSegments,
  redirect,  
  notFound,
} from 'next/navigation';
```

---

## Next function

### getStaticProps

- 정적 사이트 생성(Static Site Generation, SSG)을 위한 함수
- 빌드 시에 호출되며, 페이지 컴포넌트가 렌더링되기 전에 페이지의 데이터를 불러올 때 사용(CDN에 캐싱)
- 데이터를 미리 불러와 페이지를 정적으로 생성하므로, 빌드된 페이지들은 CDN에 캐싱되어 성능이 우수합니다.
- 보통 외부 데이터 소스(API, 데이터베이스 등)로부터 데이터를 가져오는데 사용되며, 반환된 데이터는 페이지 컴포넌트의 **`props`** 객체에 저장됩니다.

### getServerSideProps

- 서버 사이드 렌더링(Server-Side Rendering, SSR)을 지원하기 위한 함수
- 매 요청마다 서버에서 호출되며, 페이지 컴포넌트가 렌더링되기 전에 데이터를 불러올 때 사용
- 매 요청마다 데이터를 불러오므로 항상 최신 데이터를 가져올 수 있습니다.
- 페이지 요청 시 서버 측에서 데이터를 가져오므로, 빌드 시간에는 페이지가 미리 생성되지 않습니다.

### getInitialProps

- 이전 버전의 Next.js에서 사용되던 함수이지만, 현재(2021년 이후)의 최신 버전에서는 사용이 권장되지 않는다. (Deprecated)
- 현재는 **`getServerSideProps`**와 **`getStaticProps`**를 대체하여 사용하는 것을 권장

---

## Redirect & Rewrite(v12 only)

- 해당 url 요청 경로를 다른 경로로 redirect
- rewrite(v12) ⇒ url 유지 page변경 , redirect ⇒ url 변경 page 변경

### v12 (Pages router)

```tsx
module.exports = {
  async redirects() {
    return [
      {
        source: '/about',
        destination: '/',
        permanent: true,
      },
    ]
  },
}
```

### v13 (App router)

```tsx
redirect(path, type)
path: string 
type: replace or push
```

```tsx
import { redirect } from 'next/navigation'
 
async function fetchTeam(id) {
  const res = await fetch('https://...')
  if (!res.ok) return undefined
  return res.json()
}
 
export default async function Profile({ params }) {
  const team = await fetchTeam(params.id)
  if (!team) {
    redirect('/login')
  }
 
  // ...
}
```

---

# 글을 마치며..

- 기본적인 window.location & history 객체 부터 정리하고 next.js 의 routing방식을 파헤치니 확연한 장점들을 알 수 있었고, 정리가 되었다.
- 단순 SSR 과 Hydrate 를 통해 rendering최적화 보다 Next에서 제공하는 훌륭한 routing 방식을 활용해서 data-fetching의 최소화, 캐싱을 통해 routing하도록 해야 겠다.
- 더 세부적인 내용들을 다루기엔 내용이 길어져 가장 답답했던 부분을 해소하는 것으로 이 글은 마치려 한다.
- React Router Dom 도 함께 작성하려 했지만 version이 업그레이드 되면서 useHistory, useNavigate, Routes, Route, BrowserRouter, createBrowserRouter등 다뤄야 할 것이 많기에 추후에 다른글로 정리해 보겠다.