## 11주차 개발일지

### Virtual Memory

어느덧 Pintos 과제의 중간점을 지나 project3 pintos의 꽃이자 가장 어려운 파트인 가상 메모리에 들어섰다. 며칠 작업을 한 소감은 굉장히 어렵다. 하지만 가장 중요한 메모리 파트이기도 하고 가장 궁금증이 해소되지 않았던 파트여서 기대도 되고 걱정도 되는 파트이다.

가상메모리를 사용하는 이유는 크게 두가지이다.

**1) process 별 isolation**

**2)** **physical메모리의 한정적인 공간을 더 크게 사용**

현재 Memory Managemnet 와 Anonymous Page 까지 구현을 완료했는데 이전의 thread 및 user_program은 물론 vitual memory를 physical 메모리로 mapping 하는 과정 및 방법, Anonymous Memory/File-backed Memory, 각각의 메모리에 대한 오류 처리 방식, file, disk 등 연결되어 있는 파트가 너무 많아 어디서부터 어떻게 공부를 하고 정리를 해야 할 지 감이 오지 않는다.
가장 중요한 파트이자 pintos의 project를 하는 본질은 운영체제가 어떻게 동작하고 왜 이렇게 아키텍처가 이루어져 있고 어떻게 개선을 더 할 수 있는지 생각을 하고 발전 시키는 것이기 때문에 천천히 처음부터 다시 한번 git-book 과 코드들을 정리하며 다음 주에는 온전한 이해와 발전을 통해 project3 를 잘 마무리 해보려 한다.

SPT (supplemental_page_table) 을 구현하면서 공부했던 자료구조에 대한 간략 정리를 하면 다음과 같다.

### 1. **Array**

**장점**

- index와 RandomAccess를 통해 Reading동작이 빠르다.
- 연속된 메모리 공간에 위치하기 때문에 메모리 관리가 용이하다.

**단점**

- 배열 생성시 크기를 정해주어야 하며, 추후에 변경할 수 없다.
- Insert/Delete작업 시 배열의 추가 생성, 각 Element의 이동 등 때문에 비효율적이다.

### 2. **List**

**장점**

- Insert/Delete동작에서 각 Element가 가리키는 주소만 변경하면 되기 때문에 효율적이다.
- 크기가 고정적이지 않기 때문에 Array와 같은 불편함이 없다.

**단점**

- 각 Element가 다른 Element를 가리키는 형태이기 때문에 Reading작업에 비효율적이다.
- 다른 Element의 주소를 저장하기 위해 추가적인 메모리 공간 사용이 필요하다.

### 3. **Hash_Table**

- Hash_Table은 기본적으로 key:value 시스템을 가지고 있다.
- key = value를 찾는 수단, value는 우리가 찾는 값
- 정렬된 데이터가 필요하거나, 키에 대한 검색이 필요할 때(키의 길이가 가변적or 길다), 데이터의 키가 유일하지 않을 때 부적합하다.
- key 값을 넣으면 해당 인덱스를 바로 찾을 수 있어 접근 속도는 O(1)과 같다.
- 삽입/탐색/삭제 모두 O(1)
- 연속적인 메모리를 참조하기에 비효율적 -> 배열
- 해시함수를 잘못 설정하거나, 버킷이 충분하지 않으면 O(N)의 시간복잡도를 갖는다.
- Collision 발생시(다른 key값이지만 같은 인덱스 일시) 처리해야한다.
- 충돌 제거 방법에는 1) 연결리스트(chaining), 2) Open addressing 배열, 3) Double hashing 두개의 해시함수 등의 방법이 있다.

이번주에는 naver협력사가 와서 발표 및 피드백들을 들을 수 있었다.
그동안 바쁘다는 핑계로 기술 블로그에 대한 정리가 많이 부족했고, 나만의 차별점, 과제를 구현하면서 가장 재밌고 자신있는 파트, 과제를 구현하면서 맞이한 문제들과 어떻게 해결해 나갔는지에 대한 기록이 많이 부족하다는 점을 느꼈다.
지금부터라도 맞이한 문제와 해결책 그리고 개선점 등을 정리하고 이전에 하지 못했던 파트들도 최대한 되짚어보면서 전반적인 정리를 해보려한다.
내일도 즐기자!