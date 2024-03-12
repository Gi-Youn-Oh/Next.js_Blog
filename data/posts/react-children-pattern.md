# Before

- Next.js 프로젝트에서 전역 상태관리로 (client) Recoil을 사용하려던 도중 해결 방법을 찾았지만 children pattern에 대해 잘 알지 못했기에 이를 정확하게 이해하고자 분석하게 되었다.
- github issue → https://github.com/facebookexperimental/Recoil/issues/2082

# What is children pattern?

### **1. 기본 구조: App -> Parent -> Child**

- 보통 컴포넌트를 구성할 때 다음과 같이 구성할 수 있다.

```jsx
function Child() {
  return <div>Child</div>;
}

function Parent() {
  return <div><Child /></div>;
}

function App() {
  return <Parent />;
}
```

### **2. Child 컴포넌트에 React.memo**

- 간단한 리렌더링 최적화의 방법으로 Child 컴포넌트를 React.memo로 감싸면 부모 컴포넌트가 리렌더링 되더라도 Child 컴포넌트의 prop이 변경되지 않으면 재렌더링을 방지할 수 있다.

```jsx
const Child = React.memo(function Child() {
  return <div>Child</div>;
});

function Parent() {
  return <div><Child /></div>;
}

function App() {
  return <Parent />;
}
```

### **3. Child 컴포넌트를 {children}으로 Parent에서 받을 때**

- 여기서 child는 memo를 사용하지 않아도 memo와 같은 효과로 렌더링 되지 않습니다.
- 이유는 App에서 렌더링 되어 이미 React.creatElement로 생성된 객체이기 때문
- App컴포넌트가 즉 parent의 부모노드가 다시 렌더링 되지 않는 이상 child 컴포넌트는 새로 생성되지 않습니다. 즉 Parent컴포넌트 입장에서는 이미 App에서 렌더링 된(React.createElement())로 생성된 객체를 전달 받았고 다시 App이 렌더링 되어 새로 객체를 전달 받지 않는 이상 child는 그대로 인 것!

```jsx
function Child() {
  return <div>Child</div>;
}

function Parent({children}) {
  return <div>{children}</div>;
}
// 1. App 실행
-> Parent react element 생성
-> Child react element 생성
function App() {
  return (
		<Parent>
			<Child />
    <Parent />
  );
}
```

- 반대로 아래의 예시를 보겠습니다.
- 이 상황에서 Parent를 메모한다면 Parent는 메모되지 않습니다.
왜냐면 App에서 Parent와 Child는 렌더링 되어 Child는 Parent에 새로운 객체로 전달되기 때문이죠.

```jsx
function Child() {
  return <div>Child</div>;
}

function Parent({children}) {
  return <div>{children}</div>;
}

// Parent를 메모!
export const React.memo(Parent);

// 1. App 실행
-> Parent react element 생성
-> Child react element 생성
function App() {
  return (
		<Parent>
			<Child />
    <Parent />
  );
}

즉 App 입장에서는 Parent와 Child 모두 React Element로 렌더링 되는 컴포넌트 두개
Parent입장에서는 Child는 이미 App에서 렌더링 되어 전달받은 객체 (App에서 Child를 다시 생성하여 전달하지 않는이상 다시말해, App이 다시 렌더링 되지 않는 이상은 Child는 새로 생성되지 않고 동일한 객체) 이기 때문에 자동적으로 메모(React.memo)와 같음

Parent 입장에서는 App은 부모 트리 Child는 App에서 렌더링 되어 전달받은 객체 그자체 입니다.

Parent가 메모되지 않는 이유는 App입장에서 Parent가 바뀌지 않더라도 Child를 렌더링 해 새로 생성하여 Parent로 전달되기 때문에 Parent의 prop(즉 child가 새로 생성)이 바뀌었다고 판단하여 Parent는 memo되지 않는 것 입니다!

결국 Child가 어디서 렌더링 되는 것인가를 중점으로 두시면 이해하기 편하다.
```

# 4. Next.js

- 아래와 같이 생성된다면 next.js에서는 기본적으로 ‘use client로 선언한 하위 컴포넌트들에 대하여 모두 client 컴포넌트로 간주되지만 children패턴을 사용했기 때문에 Layout으로 들어오는 어떤 component든 이미 렌더링 (React.creatElement)가 되어 있는 상태여서 recoil state를 선택적으로 사용가능하게 되는 것이다.
- 즉 위치(트리구조)상으로는 하위지만 실제로는 상위에서 렌더링되어 전달되므로 recoil을 사용하느냐 안하느냐에 따라 ‘use client’여부가 동적으로 결정되는 것이다.

```jsx
"use client";

import React from "react";
import { RecoilRoot } from "recoil";

function RecoilRootWrapper({ children }: { children: React.ReactNode }) {
  return <RecoilRoot >{children}</RecoilRoot>;
}

export default RecoilRootWrapper;
```

```jsx
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
  params: { slug: string };
}) {
  console.log(children, 'children')
  return (
    <html className={myFont.className}>
      <body className={myFont.className}>
        <RecoilRootWrapper>{children}</RecoilRootWrapper>
        <script/>
      </body>
    </html>
  );
}
```