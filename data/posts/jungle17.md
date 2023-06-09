## 17주차 개발일지

### 나만의 무기 3주차

#Third

## Navigator

1) Stack Navigator

- 알고리즘 때 공부했던 Stack 개념 그대로 스크린을 쌓고 뒤로 갈 때 한 스크린 씩 팝 해주는 형태

2) Tab Navigator

- 어플 사용 때 흔히 상단 or 하단 탭 버튼 클릭으로 이동 되는 형태

3) Nested Navigator

- Stack & Tab 혼합 형태로 공식 문서에 따르면 Stack이 Tab을 감싸거나 Tab이 Stack을 감싸야 한다.

4) Custom & Solution

- 우리 프로젝트는 사용자의 편리성을 최대화 하기 위해 최소한의 움직임으로 많은 기능을 사용할 수 있도록 구성해야 했고, Stack & Tab 모두 사용해야 했다.
- 해당 과정에서 Tab 아이콘이 사라지는 현상, Tab 바가 일정 스크린에서는 보이지 않는 상황, 인자 전달이 되지 않는 상황 등이 있었다.
- 여러 Reference를 찾아보았지만 우리 프로젝트에 맞는 설명은 없었고, 결국 내가 직접 custom을 통해 Navigator 설계를 했다. ( 3개의 Tab 스크린을 하나의 컴포넌트로 재구성하여 Stack 으로 감쌌다.)
- Stack 인자는 navigate를 통해 인자로 전달하였고, Tab은 초기 routing 인자로 전달해주는 식으로 구현했다.

5) 느낀 점

- 해당 과정을 진행하면서 처음에 설계를 잘 해두어야 인자, 상태 관리에 용이하고 최소한의 비용으로 최대의 효율을 낼 수 있다는 것을 깨달았고, navigate로 변하지 않는 인자를 지속적으로 전달하면서 불필요한 반복이 지속된다고 생각했다.
- 이에 전역으로 인자를 관리하면 좋겠다 라는 생각이 들었고, 찾아보니 Redux, Recoil, Zustand등의 상태관리 라이브러리를 사용하면 효율적인 관리를 할 수  있다는 것을 알게 되었지만, 현재는 시간 상 먼저 구현을 하기로 했다.

## UI

- Navigator 설계 이후 UI를 본격적으로 다시 구성하기 시작했다.
- Navigator로 기본틀과 UI를 짜놓고, 기초적인 CRUD 기능을 빠르게 구현했다.
- 서버와 통신하면서 어떤 인자들을 주고 받고, 어떻게 통신하는지 확실하게 알게 되었다. 사실 정글 테스트 과제에서 정확히 알지 못했고, 어려웠던 부분 중 하나였어서 항상 답답했는데 서버측의 입장과 클라이언트 입장에서 어떻게 하면 효율적으로 통신을 하는지에 대한 고민도 많이 하게 되었다.

## 스토리지

### 1. 자동 로그인

- 사용자의 편의성을 최대화 하기 위해 앱 종료 후 재 실행 시에도 로그인이 유지되도록 하는것이 목표였다. 그러려면 아이디, 비밀번호, 토큰이 저장되어 있어야 했는데 여러 방법을 찾아보던 중 로컬 스토리지를 사용해 저장하는 방법이 있다는 것을 알게 되었다.
- 하지만 역시 로컬 스토리지가 최선일까 라는 생각도 해봤는데 인자 자체가 스트링 형태이고 대규모 데이터가 아니다보니  우리팀은 Async Storage를 사용하는 것으로 결정하였고 자동로그인 구현을 완료했다.

### 2. Extension 인자 공유

- 자동로그인을 구현했지만 또 하나의 풀어야할 문제가 있었는데 서비스의 특성 상 앱밖에서 서버로 통신해야만 했는데 최소한 아이디 정보는 알고 있어야 했다.
- 앞서 Share-Extension을 통해 많은 어려움을 겪었던 경험을 토대로 IOS 와 React-Native 공식문서를 샅샅히 뒤졌다.
- 결국 AppGroup Storage를 찾게 되었고 Application ↔ IOS를 Group으로 묶어 공유 할 수 있는 방법으로 해결하였다.

## 즉시 렌더링

- 가장 많은 고민과 방법을 서치했던 문제이다. 앱밖에서 서버로 아이템 추가 요청을 하고 앱 스크린 전환 없이 종료없이 앱으로 돌아왔을 때 아이템이 자동으로 추가되게끔 구현하는 것이다.
- 처음에는 interval 함수를 통해 주기적으로 호출하는 방식으로 구현을 했는데 아이템 추가를 하지않아도 불필요하게 서버와의 통신이 너무 많았고, 비효율적이라고 생각했다.
- 이 때 또 절실하게 상태관리를 해야겠다고 생각을 해(데이터 정보를 store에 저장해두고 변동이 있을 시 자동으로 호출하도록 설정할 생각) Recoil을 도입해 가장 많이 쓰이는 nickName인자를 전역으로 뿌려주는 것까지는 성공했지만, 의존성문제 때문에 앞서 구현했던 Storage에 저장하는 것까지 Recoil로 동기화하지 못했다.
- 여러고민을 하던 중 멘토님에게 AppState를 찾아보라는 피드백을 받았고, ForeGround(현재 보고있는 화면인 상태), BackGround(앱이 켜진상태로 다른 화면을 보고 있어 해당 페이지가 뒤에 가있는 상태) 를 활용해 문제를 해결했다.