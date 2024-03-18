본격적인 프로젝트 시작 전 (찐막..) 마지막으로 Next.js caching 전략이 어떻게 이루어 지고 있는지 알아보려 한다. 해당 프로젝트의 경우 정적인 데이터가 굉장히 많기 때문에(업데이트 주기가 낮은) 가능한 재사용 가능하도록 캐싱을 해줘야 하는데 효율적이고 올바르게 사용하기 위해선 반드시 필요하다고 생각했다.

그럼 지금부터 Next.js에서 어떻게 캐싱을 하고 있는지 살펴보자! (머리 아플 예정)

# 1. Overview

- 아래 사진은 Next.js에서의 Caching mechanism의 흐름이다.
- 성능 향상 및 비용절감을 위해서 정적 데이터는 캐시를 기본으로 둔다.
- **주의할 점은 아래는 정적 빌드된 페이지를 방문할 때 라는 점**

![image](https://github.com/Gi-Youn-Oh/Next.js_Blog/assets/109953972/fe31158b-3e6c-4285-b7a5-081659d06b4f)

- 아래는 각 캐싱 데이터에 대한 설명이다. 하나씩 자세히 살펴볼 것이기 때문에 대략적 설명만 참고하고 다음으로 넘어가자

![image](https://github.com/Gi-Youn-Oh/Next.js_Blog/assets/109953972/e91a18b5-365d-4c70-9239-b1b50aff519e)

## Check

**캐싱은 경로가 정적 또는 동적으로 렌더링되는지, 데이터가 캐시되는지 또는 캐시되지 않는지, 요청이 초기 방문 또는 후속 탐색의 일부인지 여부에 따라 달라진다.**

# 2.  Request Memoization

<aside>
💡 Server에서 React component를 렌더링할 때 GET 요청에 대하여 렌더링 완료할 때 까지 동일한 요청을 최소화 하기 위함.

</aside>

- 이 부분에 주의할 점은 data cache가 아니라는 점이다.
    - 흔히 생각하는 정적 데이터가 반환되는 cache라고 혼동하여 처음에 이해하는데 많은 어려움을 겪었다.
- 공식문서에 따르면 같은 URL과 options를 보유한 fetch API를 React가 메모한다 라고 설명해 두었다.
- 이 말이 무슨 말이냐면, 컴포넌트 트리 안에 동일한 fetch함수를 각각 호출하였을 때 자동으로 메모하여 코드상으로는 각 컴포넌트마다 호출하지만 해당 값을 캐싱해두어 한번의 요청만 이루어진다.
- 즉, 중첩된 fetch 요청을 최소화할 수 있다.
    - 예를 들어, 경로 전체(예: 레이아웃, 페이지 및 여러 구성 요소)에서 동일한 데이터를 사용해야 하는 경우 트리 상단에서 데이터를 가져오고 구성 요소 간에 prop을 전달할 필요가 없습니다. 대신 동일한 데이터에 대해 네트워크를 통해 여러 번 요청하는 경우 성능에 미치는 영향을 걱정하지 않고 필요한 구성 요소에서 데이터를 가져올 수 있습니다.
    
    ```jsx
    async function getItem() {
      // The `fetch` function is automatically memoized and the result
      // is cached
      const res = await fetch('https://.../item/1')
      return res.json()
    }
     
    // This function is called twice, but only executed the first time
    const item = await getItem() // cache MISS
     
    // The second call could be anywhere in your route
    const item = await getItem() // cache HIT
    ```
    

![image](https://github.com/Gi-Youn-Oh/Next.js_Blog/assets/109953972/a870cfa2-932a-49c0-8598-4d14d03dc28f)

## Flow

- 기본 캐싱 전략은 간단하다.
    - fetch요청 → memory check (miss) → data cache (hit)
        - refetch → memory check (hit)
    - 해당 rendering pass가 완료되면 memory는 reset 되고 초기화 된다.
        - 이 때 말을 잘 봐야하는데 이때는 data cache가 아니라 위 그림처럼 리액트 컴포넌트 트리 안에서 동일한 요청을 메모하는 것으로 트리 렌더링이 완료되면 다른 렌더링을 위해 메모를 초기화 하는 것이 효율적일 것이다.
- request memo는 Next.js가 아니라 React에서 제공하는 기능이다. 즉 컴포넌트 트리 안에서 memo가 유지된다.
    - GET요청에 대해서만 memo
    - Layout, Page, generateMetadata, generateStaticParams ..
    - route handler fetch 요청은 memo 되지 않는다. ( react component에 속하지 않기 때문 / cache가 안된다는 것이 아님 )
- db, cms, GraphQl 등에 memo를 원할 경우 React cache를 사용하면 된다.
- 서버에서 렌더링 중에만 적용된다.

![image](https://github.com/Gi-Youn-Oh/Next.js_Blog/assets/109953972/46af5238-0efd-4650-9267-917f8fef31e9)

# 3. Data Cache

- Next.js에서 fetch API를 확장하여 서버요청과 배포에 걸쳐 요청 결과 값을 캐싱해둔다.
    - 브라우저에서의 cache는 http 요청에 대한 cache라면, Next.js에서는 server-side에서 요청에 대한 server data cache이다.
        - 기본적으로 fetch data는 캐시되도록 되어있으며, next.revalidate option들로 조정할 수 있다.
- Data의 cache여부와 상관없이 request memo는 react rendering 완료될 때까지 유지된다.
    - 즉 여러 요청을 최소화 하여 중복 요청을 피하고 (request memoization, 요청에 대한 data 값은 cache 되는 것.

![image](https://github.com/Gi-Youn-Oh/Next.js_Blog/assets/109953972/e6fd2588-e90a-4ac7-9b9f-c29660a3cd38)

## 3-1. Revalidate Data Cache

### 1) Time-based Revalidation

- 일정 간격으로 재검증
- 갱신되기 전까지는 그전의 cache된 값을 반환
    - background에서 revalidate

```jsx
// Revalidate at most every hour
fetch('https://...', { next: { revalidate: 3600 } })
```

![image](https://github.com/Gi-Youn-Oh/Next.js_Blog/assets/109953972/5f288b2e-86f2-42e0-b472-fc829be87621)

### 2) On-demand

- revalidatePath()
- revalidateTag()
    - 시간 기반과 달리 두 함수를 실행하는 시점에 data cahe를 제거한다.
    - 즉, 다음 요청이 이루어지면 cache가 된다.

![image](https://github.com/Gi-Youn-Oh/Next.js_Blog/assets/109953972/d48b997b-e89f-453f-b95c-0065a190dc9c)

### 3) Opting out

- 아예 캐시하지 않도록 설정 가능
- no-store option

```jsx
// Opt out of caching for an individual `fetch` request
fetch(`https://...`, { cache: 'no-store' })
```

- route segment config option

```jsx
// Opt out of caching for all data requests in the route segment
export const dynamic = 'force-dynamic'
```

## 3-2. Request Memoization vs Data Cache

- 캐시된 데이터를 재사용하여 성능 향상한다는 점에서 공통되지만, Data Cache는 요청과 배포 전반에 걸쳐 시속되지만, Request Memoization은 요청 수명 주기 동안만 지속된다.
- Request Memoization을 사용하면 rendering server → data cache server로 중복 요청 수를 줄인다.
    - 즉 예를 들어 React Project에서 각 컴폰넌트에 대해 동일한 data 값을 사용하기 위해 각 컴포넌트에서 호출할 수 있는데, Request Memoization을 사용하면 각 컴포넌트에서 개별 fetch 요청을 하더라도 중복된 요청을 하지 않고 한번만 요청한다.
- Data Cache를 사용하면 원본 데이터에 대한 요청 수를 줄인다.
    - Request Memoization이 요청에 대한 cache라면, Data Cache는 요청 응답 값에 대한 cache라고 생각하면 이해가 쉽다.
- 처음에 Cache라는 것에만 초점을 두어 Request Memoization은 Route Handler는 memo되지 않는다고 하여, Cache가 안되는 줄 알았다.
    - 다음과 같이 config 설정을 해주면 fetch 요청에 대한 로그를 확인 할 수 있다.
        - ctrl or command + shift + r 을 누르면 캐시 사용을 하지 않고 렌더링 가능
    
    ![image](https://github.com/Gi-Youn-Oh/Next.js_Blog/assets/109953972/1a4767d2-363c-4e00-88d7-061073935ab9)
    
    - 하지만 RSC에서의 요청뿐만 아니라 route handler에서도 cache HIT로 표시가 되어 굉장히 혼란 스러웠는데, 이는 Data Cache값이 Cache되었다는 것이다.
    
    ```jsx
    // app/api/route.ts
    
    export async function GET(request:Request) {
        const data = await fetch('https://api.github.com/users/lukeed')
        const json = await data.json();
        return Response.json(json)
    }
    ```
    
    ```jsx
    // app/about/page.tsx
    // route handler로부터 받아옴
    
    export default async function Page() {
      let data = await fetch('http://localhost:3000/api')
      let json = await data.json()
      return <h1>{JSON.stringify(json)}</h1>
    }
    ```
    
    ```jsx
    // app/contact/page.tsx
    // RSC에서 직접 호출
    
    export default async function Page() {
        const data = await fetch('https://api.github.com/users/Gi-Youn-Oh')
        const json = await data.json()
        return <h1>{JSON.stringify(json)}</h1>
    }
    ```
    
    ![image](https://github.com/Gi-Youn-Oh/Next.js_Blog/assets/109953972/9389ff75-6a31-4488-a541-718ab3c457e7)
    
    - 물론 위의 경우에서 이전 글에서 살펴보았듯이 Route Handler에서 data를 요청하는 것보다 RSC에서 직접호출하는 것이 좋다.

# 4. Full Route Cache

- Next.js는 SSR을 지원하며 초기 페이지 HTML을 보여주고 이후 Hydrating과정이 이루어진다.
    
    ![image](https://github.com/Gi-Youn-Oh/Next.js_Blog/assets/109953972/fce25b02-a298-4a1b-adda-106d4ff73f99)
    
    - 위 그림은 정적 데이터에 대한 cache이므로 Hydrating은 빼고 생각하자.
        - Server Component가 추가 되었다고 SSR이 바뀌는 것은 아니다.
            - React Server Component를 렌더링하여 직렬화 된 payload를 생성하고,
            - 초기 페이지를 위한 HTML을 생성한다. (Client컴포넌트가 있다면 함께 초기 페이지 구성 이후 Hydrating될 것이다.)
    - client 측 에서는 다음과 같이 진행될 것이다.
        1. HTML은 클라이언트 및 서버  초기 미리 보기를 즉시 표시하는 데 사용됩니다. (not interactive)
            
            ![image](https://github.com/Gi-Youn-Oh/Next.js_Blog/assets/109953972/ba85caa4-ec42-49cd-b229-c7e6390aed37)
            
        2. React 서버 구성 요소 페이로드는 클라이언트와 렌더링된 서버 구성 요소 트리를 조정하고 DOM을 업데이트하는 데 사용됩니다.
            
            ![image](https://github.com/Gi-Youn-Oh/Next.js_Blog/assets/109953972/91fcc25c-4a60-4598-8ffe-6d583714c2fe)
            
        3. JavaScript 지침은 수화하는 데 사용되며, 클라이언트 구성 요소를 선택하고 interactive하게 만든다.
    
- Full Route Cache = RSC payload + HTML
    - build 시에 구성되며 server 측의 cache이다.
    - client가 해당 route에 대하여 요청하면 build시 만들어둔 정적 데이터를 반환하고 RSC payload는 segment 단위로 router cache (client) 에 저장된다.
        - Full route cache또한 server cache이므로 Route Cache(client측)에 저장해두어 server로의 요청을 최소화 하기 위함이다.
- build시에 캐싱된 것이므로 revalidate 또는 rebuild시 초기화 될 것이다.
    
    ![image](https://github.com/Gi-Youn-Oh/Next.js_Blog/assets/109953972/fbacd6c7-1596-4ac1-93f7-4f97ab8e25e6)
    

## **4-1. Static and Dynamic Rendering**

- 정적 데이터에 대한 cache이므로 동적 렌더링 시에는 cache되지 않는 다는 점을 잊지말자.

![image](https://github.com/Gi-Youn-Oh/Next.js_Blog/assets/109953972/d30228b5-5fcc-4d45-ba23-902b9fb79462)

## 4-2. Invalidation

### 1) Revalidating data

- revalidate를 하게 되면 앞선cache계층 또한 다시 렌더링 될 것이다.

### 2) Redeploying

- 배포 전반에 걸쳐 유지되지만, 다시 build 후 배포하게 되면 당연히 무효화 된다.

## 4-2. Opting out

### 1) Using Dynamic function

- cookies(), headers(), searchParams()와 같은 동적 함수를 사용하면 Full Route Cache가 되지 않는다.
    - Data Cache는 사용 가능하다.

### 2) **Using the `dynamic = 'force-dynamic'` or `revalidate = 0` route segment config options**

- 위와 같이 설정해두면 Full Route Cache 뿐만 아니라 Data Cache또한 skip한다.
    - 즉, server request마다 fetch 후 반환
        - Route Cache는 지속된다 (Client측이므로 Server Request 요청 하기 전까지 유지)

### 3) **Opting out of the Data Cache**

- 만약 Data Cache가 cache되지 않은 즉 fetch요청에 대한 값이 cache되지 않은 값이 있다면 Full Route Cache에서도 매번 fetch요청을 한다.
    - 특정 no-cache fetch요청에 대해서만 요청하며, 나머지 Data Cache는 여전히 사용된다.
    - 즉, cached data & uncached data를 함께 사용할 수 있다는 것이다.

# 5. Router Cache

- 아래 사진에서 볼 수 있듯이, Route Cache는 Client측 Memory에 저장된 Cache인데, RSC Payload만 저장된다.

![image](https://github.com/Gi-Youn-Oh/Next.js_Blog/assets/109953972/56c8341e-ec70-4965-99c1-334f5889cd91)

## 5-1. Partial Rendering

- React App router부터는 RSC를 기본으로 두며, 이는 Component 단위로 rendering된다는 것을 의미한다. (즉, 전체 page가 아니라 segment 단위로 부분 캐싱이 가능하다.)
    - 여러 route에서 공통된 요소를 미리 rendering 했다면 전체를 렌더링 할 필요없이 cache되지 않는 나머지 부분에 대해서만 server에 요청하여 받아오면 된다.
    - 아래 사진을 보면 dashboard의 Layout이 settings Page와 analytics Page이 공통적으로 사용되는데 Layout은 route cache에 저장되어 다시 렌더링 할 필요 없다.

![image](https://github.com/Gi-Youn-Oh/Next.js_Blog/assets/109953972/93c28891-279b-41e0-9a5f-1b3660c4383d)

## 5-2. Prefetch

- 사용자가 방문할 가능성이높은 route에 대해 background에서 미리 로드한다.

### 1) <Link> Component

- 정적 route에 대해서 prefetch = true 가 default.
- 동적 route에 대해서 첫번째 loading.js file까지만 먼저 렌더링되어 30초간 cache

### 2) router.prefetch()

## 5-2. Route Cache vs Full Route Cache

### 1) Route Cache

- 브라우저 Session동안 유지 (client)
- RSC payload만 caching
- Static + Dynamic route

### 2) Full Route Cache

- 여러 사용자 요청에 걸쳐 유지 (server)
- RSC payload + HTML
- Static route only

## 5-3. Duration

### 1) Session

- 브라우저 탐색 동안은 유지되지만 새로고침 시 삭제된다.

### 2) Automatic Invalidation Period

- 브라우저가 켜져 있다고 무한히 cache 되는 것은 아니며, 다음과 같이 지속된다. (각 segment별로)
    - Static render - 5분
    - Dynamic render - 30초

## 5-4. Invalidation

### 1) Server Action

- revalidatePath() or revalidateTag()
- cookies.set() or cookies.delete()

### 2) router.refresh()

## 5-2. Opting out

- 별도의 방법은 없지만 위에서 본 router.refresh(), revalidatePath(), revalidateTag()등을 실행하거나 <
- Link>의 prefetch option을 false로 해둘 수 있다.
    - 하지만 중첩된 segment는 30초간 cache된다.

# 6. Recap

- Data Cache를 revalidate하거나 Option out하면 rendering data가 바뀌므로 Full Route Cache 또한 무효화 될 것이다.
- Full Route Cache를 무효화하거나 Opting out해도 Data Cache에는 영향을 미치지 않는다.
- Route Handler에서 Data Cache를 Revalidating해도 즉시 Route Cache가 revalidating 되지는 않는다.
    - Router Cache는 특정 route에 국한되어 있지 않기 때문이다.
    - Route Cache를 Revalidating 하기 위해서는  위에서 살펴 보았듯이, refresh or automatic invalidation period(static-30s, dynamic-5m)이 지나야 한다.
    - 즉시 invalidate를 원한다면 Server Action에서 revalidatePath() or revalidateTag()를 사용할 수 있다.

# 7. APIs
- 전체 API를 정리하면 다음과 같다.

| API | Router Cache | Full Route Cache | Data Cache | React Cache |
| --- | --- | --- | --- | --- |
| Link.prefech | Cache |  |  |  |
| router.prefetch | Cache |  |  |  |
| router.refresh | Revalidate |  |  |  |
| fetch |  |  | Cache | Cache |
| fetch-options.cache |  |  | Cache or Opt out |  |
| fetch-options.next.revalidate |  | Revalidate | Revalidate |  |
| fetch-options.next.tags |  | Cache | Cache |  |
| revalidateTag | Revalidate (Server Action) | Revalidate | Revalidate |  |
| revalidatePath | Revalidate (Server Action) | Revalidate | Revalidate |  |
| const revalidate |  | Revalidate or Opt out | Revalidate or Opt out |  |
| cosnt dynamic |  | Cache or Opt out | Cache or Opt out |  |
| cookies | Revalidate (Server Action) | Opt out |  |  |
| headers, searchParams |  | Opt out |  |  |
| generateStaticParams |  | Cache |  |  |
| react.cache |  |  |  | Cache |
| unstable_cache |  |  |  |  |	

## 7-1. Example

### 1) fetch options.cache

```jsx
// Opt out of caching
fetch(`https://...`, { cache: 'no-store' })
```

### 2) fetch options.next.revalidate

```jsx
// Revalidate at most after 1 hour
fetch(`https://...`, { next: { revalidate: 3600 } })
```

### 3) fetch options.next.tags & revalidateTag

- setting fetch option next tags

```jsx
// Cache data with a tag
fetch(`https://...`, { next: { tags: ['a', 'b', 'c'] } })
```

- revalidateTag 사용
    - In route handler
        - 위에서 봤듯이, 즉시 Route Cache가 invalidate되지는 않는다 (특정 경로에 Route handler가 묶여있지는 않기 떄문에)
    - In Server Action

```jsx
// Revalidate entries with a specific tag
revalidateTag('a')
```

### 4) revalidatePath

- revalidatePath사용
    - In route handler
    - In Server Action

```jsx
revalidatePath(path: string, type?: 'page' | 'layout'): void;
revalidatePath('/')
```

# 정리

- 전반적으로 RSC를 사용하며 pre-rendering과 cache가 되는 것은 알고 있었지만, client와 server각각에서 cache된다는 것도 처음 알았고, 단일 cache가 아닌 단계별로 cache를 해두어 효율적인 rendering과 최적화를 해둔 것을 파악 할 수 있었다
- 복잡하지만 정확히 파악하여 적재적소에 Next.js 의 caching mechanism을 최대한 활용하여 프로젝트를 진행하도록 해야겠다.