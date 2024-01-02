# React-deep-dive-9

## Before to dive inside of React

- 본격적으로 React 내부 코드를 들여다보기 전에 알아둬야할 개념들을 짚고 넘어가자.
    1. circular linked list
    2. scheduler 
    3. priority queue
    4. double buffering

---
<a href="https://www.geeksforgeeks.org/circular-linked-list" target="_blank">
<h2>1. Circular linked list</h2>
</a>

- *순환 **연결 리스트(Circular Linked List)는** 모든 노드가 원으로 연결되어 있는 연결 리스트이다. 순환 연결 리스트에서는 첫 번째 노드와 마지막 노드가 서로 연결되어 원을 형성합니다. 끝에 NULL이 없습니다.*

![image](https://github.com/Gi-Youn-Oh/Next.js_Blog/assets/109953972/5d07bd27-6cbf-4103-b00e-63ea38e068e2)

**일반적으로 순환 연결 목록에는 두 가지 유형이 있습니다.**

- **순환 단일 연결 목록:**
    
    순환 단일 연결 목록에서 목록의 마지막 노드에는 목록의 첫 번째 노드에 대한 포인터가 포함됩니다. 우리가 시작한 동일한 노드에 도달할 때까지 순환 단일 연결 리스트를 탐색합니다. 순환형 단일 연결 리스트에는 시작이나 끝이 없습니다. 노드의 다음 부분에는 null 값이 없습니다.
    

![image](https://github.com/Gi-Youn-Oh/Next.js_Blog/assets/109953972/382e343e-bef2-46c2-9806-46376cdd0fcb)

*원형 단일 연결 리스트 표현*

```jsx
let one = new Node(3); 
let two = new Node(5); 
let three = new Node(9); 
  
// Connect nodes 
one.next = two; 
two.next = three; 
three.next = one;
```

- **순환 이중 연결 목록:**
    
    순환 이중 연결 목록에는 이중 연결 목록과 순환 연결 목록의 속성이 있습니다. 두 개의 연속 요소가 이전 및 다음 포인터로 연결되거나 연결되고 마지막 노드가 다음 포인터로 첫 번째 노드를 가리키고 첫 번째 노드는 이전 포인터로 마지막 노드를 가리킵니다.
    

![image](https://github.com/Gi-Youn-Oh/Next.js_Blog/assets/109953972/4877f7f6-9b12-4406-93ea-04f3f3770888)

*순환 이중 연결 리스트의 표현*

### 단일 원형 연결 리스트 예시 코드

```jsx
// 원형 링크드 리스트의 노드를 나타내는 클래스
class Node {
    constructor(data) {
        this.data = data;
        this.next = null;
    }
}

// 원형 링크드 리스트를 나타내는 클래스
class CircularLinkedList {
    constructor() {
        this.head = null;
    }

    // 맨 앞에 노드를 삽입하는 메서드
    insertAtFront(data) {
        const newNode = new Node(data);

        // 리스트가 비어있으면 새로운 노드를 head로 지정하고 자기 자신을 가리키도록 함
        if (!this.head) {
            this.head = newNode;
            newNode.next = this.head;
        } else {
            // 리스트가 비어있지 않으면 새로운 노드를 head로 지정하고 새로운 노드가 다음 노드를 가리키도록 함
            newNode.next = this.head;

            // 마지막 노드의 next를 새로운 head로 업데이트하여 원형을 유지
            let current = this.head;
            while (current.next !== this.head && current.next !== null) {
                current = current.next;
            }
            current.next = newNode;
        }
    }
    // 특정 데이터를 갖는 노드를 삭제하는 메서드
    deleteNode(data) {
        if (!this.head) {
            console.log("리스트가 비어 있습니다.");
            return;
        }

        let current = this.head;
        let prev = null;

        // 삭제할 노드를 찾음
        while (current.data !== data && current.next !== this.head) {
            prev = current;
            current = current.next;
        }

        // 삭제할 노드를 찾지 못한 경우
        if (current.data !== data) {
            console.log("해당 데이터를 갖는 노드를 찾을 수 없습니다.");
            return;
        }

        // 삭제할 노드가 head인 경우
        if (current === this.head) {
            // 마지막 노드인 경우 head를 null로 설정하여 리스트를 비움
            if (current.next === this.head) {
                this.head = null;
            } else {
                // head가 아닌 노드를 삭제하는 경우, head를 다음 노드로 변경
                prev = this.head;
                while (prev.next !== this.head) {
                    prev = prev.next;
                }
                prev.next = current.next;
                this.head = current.next;
            }
        } else {
            // 중간이나 마지막 노드를 삭제하는 경우
            prev.next = current.next;
        }
    }
    displayForNIterations(iterations) {
        let result = [];
        let current = this.head;

        if (!current) {
            console.log("리스트가 비어 있습니다.");
            return;
        }

        for (let i = 0; i < iterations; i++) {
            do {
                result.push(current.data);
                current = current.next;
            } while (current !== this.head);
        }

        console.log(result.join(" -> "));
    }
}

// 테스트
const circularList = new CircularLinkedList();

circularList.insertAtFront(3);
circularList.insertAtFront(2);
circularList.insertAtFront(1);

circularList.displayForNIterations(2);

circularList.deleteNode(2);

circularList.displayForNIterations(2);
```

### 장점:

- 모든 노드가 시작점이 될 수 있습니다. 어느 지점에서든 시작하여 전체 목록을 탐색할 수 있습니다. 처음 방문한 노드를 다시 방문할 때 중지하면 됩니다.
- 대기열 구현에 유용합니다. 마지막으로 삽입된 노드에 대한 포인터를 유지할 수 있으며 앞부분은 항상 마지막 노드 다음으로 얻을 수 있습니다.
- 순환 목록은 목록을 반복적으로 탐색하는 애플리케이션에 유용합니다.

### 단점:

- 단일 연결 목록에 비해 순환 목록은 더 복잡합니다.
- 코드를 주의 깊게 처리하지 않으면 무한 루프에 빠질 수 있습니다.
- 순환 연결 목록은 특정 응용 프로그램에서 효율적일 수 있지만 목록을 정렬하거나 검색해야 하는 경우와 같은 특정 경우에는 다른 데이터 구조보다 성능이 느려질 수 있습니다.

### 왜 순환 연결 리스트인가?

- 노드는 항상 다른 노드를 가리키므로 NULL 할당이 필요하지 않습니다.
- 모든 노드를 시작점으로 설정할 수 있습니다.

---

## 2. Scheduler

- SW사관학교 정글에서 pintOS 프로젝트를 진행할 당시 cpu scheduling을 구현해보았었는데 간단하게만 되짚어보고 넘어가려고 한다.

### 2-1. Round-Robin (비 선점형)

- 기존 순서대로 정해진 시간동안 cpu 를 선점하는 방식, 이렇게 되면 공평한 시간의 cpu를 점유한다는 장점이 있지만, timeslice 문제점이 있다.
- 시간 할당량이 너무 크면 선입선출 방식과 다를바 없고 시간 할당량이 너무 작으면 context switching 오버헤드가 발생할 수 있다는 단점이 있다.
    
    **busy-waiting**
    
    - 일정 시간마다 발생하는 interrupt에 의해 thread가 점유 가능 여부를 확인하고 다시 잠드는 것을 반복
    - cpu 비효율적 낭비
        
        ![image](https://github.com/Gi-Youn-Oh/Next.js_Blog/assets/109953972/40da5f16-3d99-418d-bde5-ff258dcf6e3c)
        
    
    **sleep & awake**
    
    - **잠이 든** **스레드를 ready state 가 아닌** **block state 로** 두어서 깨어날 시간이 되기 전까지 스케줄링에 포함되지 않도록 하고, **깨어날 시간이 되었을 때 ready state 로** 바꾸어 주면 된다.
        
        ![image](https://github.com/Gi-Youn-Oh/Next.js_Blog/assets/109953972/535202bd-ecf6-441d-bd00-d8c77d04746d)
        

### 2-2. Priority Queue (선점형)

- 프로세스별 우선순위를 주고 이를 통해 cpu를 선점하는 방식.
- 하지만 우선순위 스케줄링은 우선순위가 높은 프로세스가 cpu를 점유하기 때문에 우선순위가 낮은 프로세스는 계속 뒤로 밀려나는 starvation 현상을 일으키는 문제 발생 가능
- 이러한 문제를 해결 하기 위해서 기다린 시간에 비례해서 일정 시간이 지나면 우선순위를 한 단계식 높여주는 방법인 에이징 기법을 통해 해결 가능

### 2-3. 동기화

- thread가 공유 자원에 접근할 때에는 하나의 thread만 접근 가능하도록 하여 자원의 안정성을 확보해야한다.
- Sema, Lock, Conditional Variable 등

---

## 3.  Priority Queue

- **우선순위 큐는** 우선 순위 값에 따라 요소를 정렬하는 큐 유형입니다. 우선순위 값이 높은 요소는 일반적으로 우선순위 값이 낮은 요소보다 먼저 검색됩니다.
- 우선순위 대기열에서 각 요소에는 관련된 우선순위 값이 있습니다. 대기열에 요소를 추가하면 해당 요소는 우선순위 값에 따라 위치에 삽입됩니다. 예를 들어, 우선순위 값이 높은 요소를 우선순위 큐에 추가하면 해당 요소는 큐의 앞쪽에 삽입되고, 우선순위 값이 낮은 요소는 뒤쪽에 삽입될 수 있습니다.

### 장점:

- 더 빠른 방법으로 요소에 액세스하는 데 도움이 됩니다. 이는 우선순위 큐의 요소가 우선순위에 따라 정렬되기 때문에 전체 큐를 검색할 필요 없이 가장 높은 우선순위 요소를 쉽게 검색할 수 있기 때문입니다.
- 우선순위 큐의 요소 순서는 동적으로 수행됩니다. 우선순위 대기열의 요소는 우선순위 값을 업데이트할 수 있으며, 이를 통해 우선순위 변경에 따라 대기열이 동적으로 재 정렬될 수 있습니다.
- 실시간 시스템에 포함됩니다. 우선순위 큐를 사용하면 우선순위가 가장 높은 요소를 빠르게 검색할 수 있기 때문에 시간이 중요한 실시간 시스템에서 자주 사용됩니다.

### 단점:

- 복잡성이 높습니다. 우선순위 큐는 배열 및 연결 목록과 같은 단순한 데이터 구조보다 더 복잡하며 구현 및 유지 관리가 더 어려울 수 있습니다.
- 메모리 소비가 높습니다. 우선순위 큐의 각 요소에 대한 우선순위 값을 저장하면 추가 메모리를 차지할 수 있으며 이는 리소스가 제한된 시스템에서 문제가 될 수 있습니다.
- 때로는 예측하기가 어렵습니다. 이는 우선순위 큐의 요소 순서가 우선순위 값에 따라 결정되기 때문에 요소가 검색되는 순서는 선입선출(first-in, first-out)을 따르는 스택이나 큐와 같은 다른 데이터 구조보다 예측하기 어려울 수 있습니다. FIFO) 또는 후입선출(LIFO) 순서.

---

## 4. Double Buffering

- 싱글버퍼(single buffer)의 경우 채널이 데이터를 버퍼에 저장하면 프로세서가 처리하는 방식으로 진행된다. 이경우 채널이 데이터를 저장하는 동안에는 데이터에 대한 처리가 이루어질 수 없으며, 프로세서가 데이터를 처리하는 동안에는 다른 데이터가 저장될 수 없게된다.
- 더블버퍼(double buffer)의 경우에는 데이터에 대한 저장과 처리가 동시에 일어날 수 있다. 입력채널이 첫 번째 버퍼에 데이터를 저장하는 동안 프로세서가 두 번째 버퍼의 데이터를 처리할 수 있는 것이다. 이렇게 두개의 버퍼를 서로 교대로 사용하는 것을 플립플롭버퍼링(flip-flop buffering)이라하고, 여러개의 버퍼를 번갈아 사용하는 것을 순환버퍼링(circular buffering)이라고 한다.

![image](https://github.com/Gi-Youn-Oh/Next.js_Blog/assets/109953972/e53e80b2-bf80-4017-84b1-53587ef0459c)
![image](https://github.com/Gi-Youn-Oh/Next.js_Blog/assets/109953972/7dfdcc00-27c0-4260-956e-f1ba7472b7c6)