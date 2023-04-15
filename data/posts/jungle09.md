<h2> 9주차 개발일지 </h2>
<hr>
<h3> 1. Alarm clock </h3>
Base 
- cpu 내부의 timer가 tick마다 interrupt를 발생시킨다.

1. 기존 alarm clock 방식
<br>
    1) alarm: 호출한 프로세스를 정해진 시간 후에 다시 시작하는 커널 내부 함수
<br>
    2) busy waiting : ready_list만 존재, round-robin 방식 -> 불필요한 thread가 cpu점유 및 대기로 인한 cpu 자원낭비, 전력낭비
<br>
1-1. 단점보완 -> sleep / wake up 방식
<br>
1-2. Thread Status
<br>
    1) running : 현재 실행중인 스레드, 하나의 스레드만 running 상태를 가진다.
<br>
    2) ready : 실행할 준비가 되어 실행을 기다리는 스레드
<br>
    3) blocked : 멈춰서 실행이 불가능한 상태, thread_unblock을 통해 실행 가능한 상태가 되면 ready 상태가 된다.
<br>
    4) dying : 스레드의 실행이 모두 끝나고 종료된 상태
​> sleep list 로 불필요한 스레드들을 유휴 상태로 두어 효율을 높힘(thread-status = blocked)
<hr>
<h3> 2. Priority scheduling </h3>
Base
- round-robin방식 -> priority 방식
- running 상태인 스레드와 ready_list에 있는 스레드의 우선 순위를 비교
- ready_list 우선 순위 정렬 (list_insert_ordered())

2-1. ready_list 추가 될 경우
<br>
    1) thread_cread -> (running thread priority < New thread priority) -> thread_yield
<br>
    2) thread_unblock
<br>
    3) thread_yield
<hr>
<h3> 3. Priority scheduling and Synchronization </h3>
Base
- lock, semaphore, conditional variable
- semaphore -> waiters (FIFO) - > 우선 순위 정렬 
- conditioanl variable -> 1) void cond_signal(가장 높은 thread에게 signal) / 2) void cond_broadcast(모든 스레드에게 signal)

sema
<br>
    1)sema_down
    - waiters list 삽입 시, 우선순위대로 삽입
<br>
    2)sema_up
    - waiters list에 있는 동안 우선순위가 변경되었을 경우 고려 우선순위 정렬
<br>
    3)conditional variable
<br>
    > cond_wait
    - condition variable -> waiters list -> 우선순위삽입
<br>
    > cond_signal
    - 재정렬 먼저, -> sema_up(pop_front) 
<hr>
<h3> 4. Priority inversion problem </h3>
Base
- Priority donation
- Multiple donation -> 한스레드가 두개 이상의 lock 보유시 (이전 상태의 우선순위를 기억해야함)
- Nested donation
- Donation list [donate_elem]
    4-1)lock_acquire 
    -> sema_down
<br>
    4-2)lock_release
    -> sema_up
<hr>

