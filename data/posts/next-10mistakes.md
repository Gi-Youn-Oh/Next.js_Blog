Next.js 14 App router로 프로젝트를 시작하기 전 Next.js 공식 [Youtube](https://www.youtube.com/watch?v=RBM03RihZVs)에서 가장 많이 실수하는 10가지와 best practice를 안내해줘서 살펴보았다.

# 1. Router Handler with Server Components

Next 14에서는 app → api folder안에 route.ts 파일에서 routing 시 HTTP methods(GET, POST, PUT, DELETE 등) 를 사용할 수 있다.

<h2 style="color: red">Bad Case</h2>

- in app/page.tsx에서 해당 경로의 API요청을 할 수 있다.

```jsx
// app/page.tsx
export default async function Page() {
  let res = await fetch("http://localhost:3000/api/data");
  let data = await res.json();
  return <h1>{JSON.stringify(data)}</h1>;
}
```

```jsx
// app/api/data/route.ts
export async function GET(request: Request) {
  return Response.json({ data: "Next.js" });
}
```

- 하지만 위 사항에 대하여 짚어봐야할 점들이 있다.

### 1) Have to use Route Handler?

- Route Handler나 ServerComponent(Next.js 13부터 app router는 기본적으로 RSC) 둘다 서버에서 안전하게 실행되므로 불필요한 네트워크 요청을 할 필요가 없다.
  - <span style='background-color: #FFB6C1'>즉 Server Component에서 바로 fetch 요청을 하면 된다.</span>
    - Router Handler로부터 데이터를 가져오는 추가 요청을 할 필요가 없다.

### 2) Have to provide full URL?

- 개발 환경(Node.js)에서는 절대경로로 ‘http://localhost:3000/api/data’와 같이 경로를 제공해주거나 환경에 따라 조건적으로 URL을 설정해야하는 번거로움이 있다.
- 하지만 서버컴포넌트에서 직접 호출한다면 절대경로로 URL을 제공하거나 환경에 따른 조건 체크를 할 필요가 없다.

<h2 style="color: blue">Better to use like this</h2>

- route handler 대신 server component에서 직접 호출하자!

```jsx
// app/page.tsx
export default async function Page() {
  // call your async function directly
  let data = await getData(); // { data: 'Next.js' }
  // or call an external API directly
  let data = await fetch("https://api.vercel.app/blog");
  // ...
}
```

# 2. Static or dynamic Route Handlers

- route handler에서 GET 요청은 기본적으로 캐시 된다.
- route handler를 page의 구성요소 간주할 수 있다.

### 1) Check cache the static data

- local에서는 매번 받아오지만 production에서는 build시 생성한 정적데이터를 사용한다.
- 갱신되지 않기 때문에 개발환경과 착각하지 말아야 한다.
  - in local dev
    ![image](https://github.com/Gi-Youn-Oh/Next.js_Blog/assets/109953972/c7a491a9-705d-45bc-8415-97ae39140341)
    ![image](https://github.com/Gi-Youn-Oh/Next.js_Blog/assets/109953972/0243b39a-ed64-44b9-91e1-b3b033ce6a20)
  - in prodction
    ![image](https://github.com/Gi-Youn-Oh/Next.js_Blog/assets/109953972/c7a491a9-705d-45bc-8415-97ae39140341)
    ![image](https://github.com/Gi-Youn-Oh/Next.js_Blog/assets/109953972/c7a491a9-705d-45bc-8415-97ae39140341)

### 2) Cached data will not change until another build has completed

- 따라서 빌드 시 정적 데이터를 캐시하므로 <span style='background-color: #FFB6C1'>새롭게 빌드하지 않는 한 바뀌지 않는다.</span>

### 3) page → app router extends JSON or txt files or any..

- app router 부터는 json, text파일을 비롯한 정적데이터를 캐싱할 수 있다.

### 4) revalidate cached data

- revalidata 옵션으로 재생성할 수 있다.

```jsx
export async function GET() {
  const res = await fetch("https://data.mongodb-api.com/...", {
    next: { revalidate: 60 }, // Revalidate every 60 seconds
  });
  const data = await res.json();

  return Response.json(data);
}
```

### When use route handler?

- server component의 경우 바로 호출하면 되지만, <span style='background-color: #ADD8E6
  '>client component의 경우<span> 바로 호출 할 수 없기 때문에 route handler에서 (서버에서 생성) 불러올 수 있다.

# 3. **Route Handlers and Client Components**

- client 컴포넌트에서 별도의 API 요청을 만드는 대신 server action을 통해 처리할 수 있다.

## Before

```jsx
"use client";

export default function Page() {
  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    console.log("submit");
  }

  return (
    <form onSubmit={onSubmit}>
      <input type="text" />
      <button type="submit">Submit</button>
    </form>
  );
}
```

## After

```tsx
"use client";

import { send } from "app/actions";

export default function Page() {
  return (
    <form action={send}>
      <input type="text" />
      <button type="submit">Submit</button>
    </form>
  );
}
```

```tsx
"use server";

export async function send() {
  console.log("submit");
}
```

# 4. Using Suspense with Server Components

- Suspense 경계는 어디에 설정하는 것이 맞을까?
- 예를 들어 다음과 같은 코드가 있다고 가정하자

```jsx
async function BlogPosts() {
  let data = await fetch("https://api.vercel.app/blog");
  let posts = await data.json();
  return (
    <ul>
      {posts.map((post) => (
        <li key={post.id}>{post.title}</li>
      ))}
    </ul>
  );
}

export default function Page() {
  return (
    <section>
      <h1>Blog Posts</h1>
      <BlogPosts />
    </section>
  );
}
```

## Bad Case

```jsx
import {Suspense} from 'react';

async function BlogPosts() {
  let data = await fetch('https://api.vercel.app/blog');
  let posts = await data.json();
  return (
  <Suspense fallback={}>
    <ul>
      {posts.map((post) => (
        <li key={post.id}>{post.title}</li>
      ))}
    </ul>
  </Suspens>
  );
}

export default function Page() {
  return (
    <section>
      <h1>Blog Posts</h1>
      <BlogPosts />
    </section>
  );
}
```

## Correct Case

- async component를 감싸야한다.

```jsx
import { Suspense } from "react";

async function BlogPosts() {
  let data = await fetch("https://api.vercel.app/blog");
  let posts = await data.json();
  return (
    <ul>
      {posts.map((post) => (
        <li key={post.id}>{post.title}</li>
      ))}
    </ul>
  );
}

export default function Page() {
  return (
    <section>
      <h1>Blog Posts</h1>
      <Suspense fallback={<p>Loading...</p>}>
        <BlogPosts />
      </Suspense>
    </section>
  );
}
```

## Dynamic opt

```jsx
import { unstable_noStore as noStore } from "next/cache";

async function BlogPosts() {
  noStore(); // This component should run dynamically
  let data = await fetch("https://api.vercel.app/blog");
  let posts = await data.json();
  return (
    <ul>
      {posts.map((post) => (
        <li key={post.id}>{post.title}</li>
      ))}
    </ul>
  );
}
```

# 5. **Using the incoming request**

- useSearchParams와 같은 불필요한 client hook들을 사용하지 않아도 된다.

## functions

- cookies()
- headers()
- params
- searchParams

## use

```jsx
// app/blog/[slug]/page.tsx
export default function Page({
  params,
  searchParams,
}: {
  params: { slug: string }
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  return <h1>My Page</h1>
}
```

# 6. **Using Context providers with App Router**

- 이 부분은 [recoil provider & children pattern](https://giyoun-blog.vercel.app/posts/react-children-pattern)에서 다뤘으므로 생략하겠습니다.

# 7. client & server component together

- 이 부분은 [recoil provider & children pattern](https://giyoun-blog.vercel.app/posts/react-children-pattern)에서 다뤘으므로 생략하겠습니다.

# 8. **Adding “use client” unnecessarily**

- next.js에서 ‘use client’로 선언한 하위 컴포넌트들은 기본적으로 client 컴포넌트로 간주되기 때문에 반드시 모든 client 컴포넌트에서 ‘use client’를 선언해줄 필요는 없다.

# 9. Not revalidating data after mutations

- mutate 요청 후에 revalidate (갱신) 하는 것을 종종 까먹는다.

## Example

- 만약 다음과 같이 입력한 이름을 추가한다고 했을 때 새롭게 추가된 데이터가 보일까?
  - 보이지 않는다.

```jsx
export default function Page() {
  async function create(formData: FormData) {
    "use server";

    let name = formData.get("name");
    await sql`INSERT INTO users (name) VALUES (${name})`;
  }

  return (
    <form action={create}>
      <input name="name" type="text" />
      <button type="submit">Create</button>
    </form>
  );
}
```

- 다음과 같이 revalidatePath() 같은 method를 사용하여 revalidate를 해주어야 한다.

```jsx
import { revalidatePath } from "next/cache";

export default async function Page() {
  let names = await sql`SELECT * FROM users`;

  async function create(formData: FormData) {
    "use server";

    let name = formData.get("name");
    await sql`INSERT INTO users (name) VALUES (${name})`;

    revalidatePath("/");
  }

  return (
    <section>
      <form action={create}>
        <input name="name" type="text" />
        <button type="submit">Create</button>
      </form>
      <ul>
        {names.map((name) => (
          <li>{name}</li>
        ))}
      </ul>
    </section>
  );
}
```

# 10. **Redirects inside of try/catch blocks**

- redirect()는 never 타입이기 때문에 return redirect()와 같이 사용할 필요가 없다.
- redirect()는 내부적으로 특정 에러를 던지기 때문에 try/catch 바깥에서 사용해야 한다.
  - 종종 안에서 사용하는 실수를 저지른다.

# Guide

### in RSC

```jsx
// app.page.tsx

import { redirect } from "next/navigation";

async function fetchTeam(id) {
  const res = await fetch("https://...");
  if (!res.ok) return undefined;
  return res.json();
}

export default async function Profile({ params }) {
  const team = await fetchTeam(params.id);
  if (!team) {
    redirect("/login");
  }

  // ...
}
```

### in RCC

```jsx
// app/client-redirect.tsx

"use client";

import { navigate } from "./actions";

export function ClientRedirect() {
  return (
    <form action={navigate}>
      <input type="text" name="id" />
      <button>Submit</button>
    </form>
  );
}
```

```jsx
// app/actions.ts
"use server";

import { redirect } from "next/navigation";

export async function navigate(data: FormData) {
  redirect("/posts");
}
```

# 정리

10가지 흔히 저지르는 실수들에 대해 살펴봤는데 아는 부분도 있었고 생각하지 못한 부분들도 볼 수 있어서 좋았다. 무엇보다 fetch 특히GET 요청에 대해 Server Component, Route Handler, Server Actions 등 방법이 있는데 적재적소에 활용하고 best practice로 프로젝트를 진행하는데 큰 도움이 될 것 같다.
