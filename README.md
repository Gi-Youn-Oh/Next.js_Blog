
# Personal Blog Project 

블로그 링크: https://giyoun-blog.vercel.app/

### [프로젝트 개요]

개인 블로그 디자인부터 배포까지 직접 구현해보고 싶어 기획하게 되었습니다.

Next.js version update를 follow하며 새로운 기술 적용 및 최적화를 진행하고 있습니다.

또한 주기적으로 학습하며 포스팅하고 있습니다.

### [기술 스택]

<div align="left">
    <img src="https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=TypeScript&logoColor=white" />
    <img src="https://img.shields.io/badge/React-61DAFB?style=flat&logo=React&logoColor=white" />
    <img src="https://img.shields.io/badge/Next-000000?style=flat&logo=Next.js&logoColor=white" />
    <img src="https://img.shields.io/badge/NextAuth-F58320?style=flat&logo=Next.js&logoColor=white" />
    <img src="https://img.shields.io/badge/Tailwind-06B6D4?style=flat&logo=TailwindCSS&logoColor=white" />
    <img src="https://img.shields.io/badge/Supabase-3FCF8E?style=flat&logo=Supabase&logoColor=white" />
    <img src="https://img.shields.io/badge/Vercel-000000?style=flat&logo=Vercel&logoColor=white" />
</div>

### [주요 기능]

- 정적, 동적 라우팅
- 마크다운 형식 포스팅
- 메일 전송
- 로그인
- 댓글 CRUD
  
### [개발과정 및 문제해결]

### **Procedure**

1. **Next.js** 
    - 프론트, 백 모두 구현 가능하며, SSR 사용, 간단한 배포를 위해서 선택하였으며 React 단독으로 사용한 경우 대비 장점을 알게 되었습니다.
    - (Next.js-v12)Page별 렌더링 설정이 아닌 Component 별 렌더링 설정을 위하여 v13을 채택하였으며, 간단한 라우팅 방식과 Server Component를 활용한 렌더링 최적화에 대해 이해하게 되었습니다.
    - Next에서 제공하는 Image, Font 활용하며, Layout Shift 현상과 Reflow 최적화 장점을 이해하게 되었습니다.
2. **Tailwind**
    - 생산성과 반응형 디자인을 위하여 Tailwind를 선택하여 진행하였으며, CSS 프레임워크 사용의 장점을 이해하게 되었습니다.
3. **Vercel**
    - 간단한 배포 방식과 CI / CD 확인을 위하여 선택하였으며, 개발/배포용 브랜치를 별도로 두어 버전 별 배포 방식을 활용할 수 있게 되었습니다.

### **ISSUE**

1. **Version** 
    - 최신 버전에서 Client Component 오류 및 타입 안정성 문제가 발생하여 공식문서 및 Github Issue를 참조하여 지원 버전 설정 및 예외 처리를 통해 해결하였으며, 최신 버전의 업데이트를 확인하면서 문제점과 개선 사항을 빠르게 파악하게 되었습니다.
