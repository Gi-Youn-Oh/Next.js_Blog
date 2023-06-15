# Authentication & Authorization

# 개요

- 3월에 원티드 프리온보딩에서 실습해보았던 인증 인가 방식에 대하여 복습 및 이번 인스타그램 프로젝트를 진행하면서 Next-Auth를 활용한 Google Login방식까지 정리해보려 글을 작성하게 되었다.

## 인증이란?

- 대표적으로 로그인 즉, 특정 서비스에 입장 권한을 가졌다는 것을 인증

## 인가란?

- 인증 받은 사용자가 이후 서비스의 여러 기능을 사용할 때 허가 (로그인 유지 상태)
- 매번 로그인 정보를 주고 받기에는 무거운 작업 → 디비에서 사용자 계정의 해시값을 가져와 확인해야 한다.
- 매 요청마다 정보가 누출될 위험이 있다.

## Session 방식

- 로그인 성공 시 서버는 세션 표를 발급 하여 사용자에게 전달해 사용자는 브라우저에(Session ID)쿠키로 저장하고 서버 측은 메모리 or 하드디스크 or DB에 저장한다.
- 요청마다 이 쿠키를 실어 보내고, 서버 측에서 확인한다.
- Session ⇒ 서버에 로그인이 지속되는 상태

### Question

1. **메모리에 저장**

- 많은 세션을 저장하기에는 무리이며 에러로 메모리가 날아가면 문제 발생 ⇒ 재 로그인 필요

2. **하드 디스크**

- 메모리보다 시간이 오래 걸리는 단점이 있다.
- 규모가 큰 서비스 같은 경우 서버가 다수일 경우 문제가 된다. (로드 밸런싱 필요)

3. **DB**

- 속도가 많이 느리다 ⇒ Reddis(휘발성 위험)와 같은 메모리형 DB 서버를 사용을 할 수 도 있다.

### 결론

- 사용자의 모든 정보를 서버가 기억하게끔 구현하는 것이 오래걸리고 부담되지만 기억하는 대상의 상태들을 언제든 제어할 수 있다.
- 프론트 쪽에서 인증이 쉽우며, JWT보다는 보안이 우수하다.

## JWT ( JSON Web Token ) 방식

- 로그인 시 JWT를 사용자에게 발급
- 인코딩 암호화된 3가지 정보를 이어 붙인 형식
- Header, Payload, Verify-Signature 로 구성
- 서버는 발급해준 JWT를 받으면 Header와 Payload의 값을 비밀 키와 함께 signature 값의 동일 여부 및 유효 기간을 판별
- 사용자 stateless, 서버 stateful

![jwt](https://github.com/Gi-Youn-Oh/Next.js_Blog/assets/109953972/7233282c-613b-4bc7-9ae9-0030613fded4)

### 1. Header

- Type = JWT
- Alg = 암호화 알고리즘 (서명 값을 만드는데 사용될 알고리즘)

### 2. Payload

- Payload → Base64 디코딩 정보 확인 (Claim)
- 누가 누구에게 발급했는지, 언제까지 유효한지, 공개 내용 등

### 3. Signature

- Header & Payload 정보를 통해 암호화된 계산 값

### Question

- 서버가 토큰을 기록하고 가지고 있지 않기 때문에 통제가 어렵다.
- 토큰 탈취 시 무효화 할 수 없다.

### Solution

- 만료시간이 짧은 Access 토큰과 상대적으로 긴 Refresh 토큰 두 개를 발급
- Refresh 토큰을 DB에 저장
- 사용자는 Access 토큰이 만료되면 Refresh 토큰으로 서버에 새로운 Access 토큰을 발급 받는다.
- Refresh Token은 HttpOnly로 발급하여 악성 스크립트 실행 방지
- Refresh 토큰만 잘 관리하면 되지만, 완벽한 보안은 아니다.

### 결론

- 서버 백엔드 비용이 감소하지만 프론트 구현의 복잡도가 올라가고 보안 상 세션 방식보다는 위험하다.

## O-Auth (Open Authorization)

- 허가된 다른 서비스를 통해 기존 서비스의 권한을 “위임” 하는 것

![oauth](https://github.com/Gi-Youn-Oh/Next.js_Blog/assets/109953972/6d0ae563-5271-46f6-8fff-dee587bed083)

### Instagram O-Auth 적용 (Next-Auth)

```jsx
//1. Auth Opiton Set-up
export const authOptions: NextAuthOptions = {
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_OAUTH_ID || '',
            clientSecret: process.env.GOOGLE_OAUTH_SECRET || '',
        }),
    ],
    callbacks: {
        async signIn({user: {id, name, email, image}}){
            // console.log('signIn', user);
            if(!email){
                return false;
            }
            addUser({id, name: name || '', image, email, username: email.split('@')[0]});
            return true;
        },
        async session({ session, token }) {
            // Send properties to the client, like an access_token and user id from a provider.
            // console.log('session', session);
            const user = session?.user;
            if(user){
                session.user = {
                    ...user,
                    username: user.email?.split('@')[0] || '',
                    id:token.id as string,
                }
            }
            return session
        },
        async jwt({token, user}) {
            if(user) {
                token.id = user.id;
            }
            return token;
        }
    },
    pages: {
        signIn: '/auth/signin',
    }
};
export default NextAuth(authOptions);

//2. Auth Context Component 생성
'use client';

import { SessionProvider } from 'next-auth/react'

type Props = {
    children: React.ReactNode;
};

export default function AuthContext({ children }: Props) {
    return (
        <SessionProvider>
            {children}
        </SessionProvider>
    )
}

//3. AuthContext로 필요한 하위 컴포넌트 감싸주기
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang='en' className={openSans.className}>
      <body className="w-full bg-neutral-50 overflow-auto">
        <AuthContext>
          <header className="sticky top-0 bg-white z-10 border-b">
            <div className='max-w-screen-xl mx-auto'>
              <Navbar />
            </div>
          </header>
          <main className='w-full flex justify-center max-w-screen-xl mx-auto'>
            <SWRConfigContext>{children}</SWRConfigContext>
          </main>
        </AuthContext>
        <div id="portal" />
      </body>
    </html>
  );
}

//4. Routing 시 Session 확인
export async function withSessionUser(handler: (user: AuthUser) => Promise<Response>): Promise<Response> {
    const session = await getServerSession(authOptions);
    const user = session?.user;

    if (!user) {
        return new Response("Authentication is required", { status: 401 });
    }

    return handler(user);
}
```

## Storage

### Cookie Storage

- 쿠키는 작은 텍스트 파일로서, 웹 사이트가 클라이언트의 웹 브라우저에 저장하는 데이터
- 주로 사용자 인증, 세션 관리, 사용자 기본 설정 등을 저장하기 위해 사용
- 쿠키는 만료 기간을 설정하여 일정 기간 동안 유지되며, 서버와 클라이언트 간의 통신 시에 자동으로 서버로 전송
- 보안 상의 이유로 민감한 정보를 저장하는 것은 좋지 않으며, 쿠키는 일반적으로 데이터 용량이 제한되어 있다.
- 쿠키의 유지 기간은 만료 기간에 따라 결정되며, 컴퓨터의 종료나 브라우저의 재 시작에 상관없이 유지

### Local Storage

- 로컬 스토리지는 클라이언트의 웹 브라우저에 데이터를 영구적으로 저장하는 방식
- HTML5에서 도입되었으며, 사용자가 명시적으로 삭제하지 않는 이상 데이터가 계속 유지됩니다.
- 주로 웹 애플리케이션에서 사용자 기본 설정, 임시 데이터 등을 저장하기 위해 활용됩니다.
- 로컬 스토리지는 일정 용량 제한이 있지만, 쿠키보다는 훨씬 더 많은 데이터를 저장할 수 있습니다.

### Session Storage

- 세션 스토리지는 로컬 스토리지와 유사한 방식으로 데이터를 저장하지만, 데이터의 수명이 세션 동안에만 유지됩니다.
- 세션은 사용자가 웹 사이트에 접속한 후 브라우저를 닫을 때까지의 기간
- 세션 스토리지는 사용자 세션 동안 임시 데이터를 저장하기 위해 사용되며, 브라우저를 닫으면 데이터가 삭제

### 결론

- 로컬 스토리지와 세션 스토리지는 클라이언트 측에서 데이터를 보다 지속적으로 유지하기 위해 사용되는 반면, 쿠키는 주로 서버와 클라이언트 간의 통신에 사용

## 궁금했던 요소

### Bearer?

- 토큰 기반 인증에서 인증 토큰을 식별하기 위한 표시 일종의 타입

### XSS (Cross-Site Scripting)

- 악의적인 사용자가 웹 페이지에 악성 스크립트를 삽입하여 사용자들의 브라우저에서 실행
- 스크립트가 실행되면 웹 페이지가 현재 로그인된 사용자의 쿠키 값을 탈취하고, 이를 악의적인 공격자의 서버로 전송할 수 있다.

⇒ HTTP Only Cookie 방식으로 JavaScript 실행 불가 or 유효성 검사 등을 통해 방지

### CSRF (Cross-Site Request Forgery)

- 스팸 메일 등을 통해 같은 브라우저를 이용해 방문하면 브라우저가 쿠키를 자동으로 전송해 탈취

⇒ CSRF 토큰 사용을 통해 모든 중요한 요청에 해당 토큰을 포함 or SameSite=Strict 속성을 설정하여 다른 도메인에서의 요청에 대한 쿠키 전송을 제한

## 정리

- 실제 서비스에서는 로그인(인증)이 필요한 페이지에 따라 페이지를 구분하고, 로그 추적 및 접근 권한을 통해 안정적으로 서비스를 운영할 수 있도록 설계하는 것이 좋겠다.
