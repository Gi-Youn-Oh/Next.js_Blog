## 10주차 개발일지

1. Argument Passing
2. User Memory
3. System calls
4. Process Termination Messages
5. Denying Writes to Exexutables
6. Extend File Descriptor(extra)

### Pintos project 1-2 회고

project 2 의 구현이 어느정도 완성이 되어가고 있다.
Pintos를 진행하면서 많은 지식과 학습이 필요하다보니 이해하기 어렵고 난이도도 높은 프로젝트 이지만 이전의 과제들보다 훨씬 재밌고 성장하고 있는 느낌이 많이 들어서 즐겁게 하고 있다.
Project1 에서는 Kernel에서의 동작과 방식에 대한 과제였던 반면 이번 Project 2 에는 user가 어떻게 OS와 소통하고 접근하는지에 대한 프로젝트를 진행하고 있다.
사실 파고 들어가면 갈수록 끝이 없어서 힘이 빠지기도 하지만 파면 팔수록 프로그램 원리에 대해서 궁금했던 점들이 풀려나가서 어느 과제보다 몰입해서 하고 있는 것 같다.
혼자서 했으면 이 짧은 시간안에 해결하지 못했을 과제들을 함께 고민하고, 의논하고, 구현하는 시간이 행복하게 느껴졌고 팀원들 덕분에 해결해나가고 있다고 생각한다.

Pintos 프로젝트를 진행하면서 컴퓨터 시스템의 원리와 개념들을 아는 것은 너무나도 중요하지만 한편으로 팀 프로젝트를 직접적으로 경험해봄으로서 팀 프로젝트란 이런것이다 라는 것을 몸소 체험할 수 있어서 좋은 것 같다.
서로의 잘못된 지식이나 오류들을 찾아주면서 발전하고 프로젝트를 완성했을 때의 짜릿함은 평생 잊지못할것 같다.
이전까지는 머리로만 코드를 구현하고 직접 코드를 구현하는게 어려웠는데 팀원들이 옆에서 함께 봐주면서 코드를 작성하니 자신감도 붙고 코드 구현에 대한 두려움이 많이 사라졌다.
좋은 팀원들을 만나 스스럼없이 피드백을 주고 편하게 의견을 제시하고 함께 몰입하는 과정을 프로젝트가 끝날때까지 지치지 않고 다함께 이어나갔으면 좋겠다.

이번 과제에서 가장 어려웠던 부분에 대한 설명 후 글을 마치려한다.
User가 system call(user/syscall.c) 을 호출 하면 해당 파일에 대한 정보와 syscall number를
register에 저장하고 syscall 을 호출한다.
sycall 은 syscall_entry.S(어셈블리어)를 호출해 커널에서의 작업이 시작된다.
kernel stack에 interrupt_frame 형식으로 쌓은 인자들을 syscall_handler에게 전달해 작업이 시작된다.
여기서 제일 헷갈렸던 부분은 user/syscall.c 는 유저가 시스템콜을 하는 시스콜 userprog/syscall.c 는 kernel에서 작동하는 시스템콜에 대한 함수와 코드들이다.
남은 시간동안 잘 마무리해서 project2도 완성할 것이다.
그럼 내일도 즐기자!

```jsx
Project 1 에서는 커널에 있는 thread와 커널에서 일어나는 일들, interrupt handler와 scheduling 에 관한 코드를 구현해보고 학습했다.
Project 2 에서는 User program을 실행시키기 위한 작업들을 해나간다.
1. Argument Passing 
- User program 실행 시 입력된 argument 들을 program에서 사용할 수 있도록 user에 넘겨주는 작업

2. User memory
- user가 system call을 호출할 때 전달한 인자의 유효성을 검사하는 작업 

3. System calls
- user가 호출한 system call을 수행하고, 적합한 return 값을 돌려주는 작업

4. Process Terminating Messages 
- user process가 종료될 때 종료메시지를 띄워주는 작업 

5. Denying Writes to Executables 
- 실행 중인 파일에 대해 수정되지 않도록 조치하는 작업 
```

## Argument Passing

```jsx
Pintos는 부팅되면서 먼저 kernel의 thread, interrupt, timer, syscall 등의 기능들에 대해 초기화 한다.
이후 입력된 인자들을 바탕으로 User Program을 실행시킬 준비를 한다.

먼저 커널은 들어온 command line에서 filename을 parsing 하고 해당 name으로 program을 실행시키기 위한 thread를 생성한다.
(procss:Pintos에서는 멀티 쓰레딩이 지원되지 않아 process는 thread와 동일시 될 수 있다.)

filename으로 생성된 thread가 schedule되면 이 thread는 User program이 실행될 수 있도록 여러가지 환경을 만들어 준다.
interrupt frame, user memory(initializing, loading), argumnets
```

### Interrupt Frame (IF)

```jsx
Context switching할때는 실행되던 context를 나중에 그대로 되살릴 수 있도록 저장해두어야 한다.
이는 schedule로 인한 thread간의 switching뿐만 아니라 동일 thread에서 kernel과 user간의 switching시에도 필요하다.
이를 위해 context를 저장하는 frame을 Pinots에서는 interrupt frame 이라고 한다.
thread 간의 switching에서는 tcb(thread control block)에 위치한 if를 사용하며(thread launch() in schedule()), kernel-user간 switching에는 kernel thread의 stack영역에 if를 쌓아 사용한다.
kernel-user간 switching은 user mode로 process 실행 도중 interrupt 발생 또는 exception, trap(syscall) 발생 등에 의해 일어난다.
```

### User Memory

```jsx
Process들은 각각 독립된 가상 메모리 영역을 갖는다.
따라서 User program을 실행할 때마다 가상 메모리 공간을 세팅해야하며, 실행가능한 파일 형식인 ELF(Executable and Linkable Format)의 세그먼트 정보에 따라 program을 물리 메모리로 load하고 가상 메모리 주소와 mapping 시킨다.
```

### Arguments

```jsx
User program을 실행시키기 위해 입력된 Command line은 한 줄로 되어있다. 따라서 kernel은 arguments를 parsing 해야하며, 실제 user program이 실행될 때 이 arguments를 사용할 수 있도록 인자로 전다해 주어야 한다.
user program은 user 가상 메모리 영역 안에 있는 data에 접근할 수 있기 때문에 user의 stack영역에 arguments를 setting하고 if를 통해 user program이 실행될 때 main함수의 인자로 argc와 argv가 전달될 수 있도록 if의 rdi, rsi에 값과 해당 포인터를 저장한다.
stack에 쌓인 argumnets바로 아래엔 fake return address를 넣어주고, if의 rsp를 fake return address가 저장된 곳을 가리키도록 변경해준다.
```

```jsx
이러한 환경이 모두 완성되면 kernel은 작성한 if를 인자로 do_iret(interrupt return)함수를 실행하고 cpu의 register들을 if에 저장된 값으로 바꾸어 줌으로써 User program을 실행시킨다.
```

---

<aside>
💡 User memory

</aside>

```jsx
Process(또는 thread)가 진행되는 동안 실행되는 instruction 중 일부는 특별한 권한이 있어야만 실행할 수 있도록 되어있다. 이를 Privileged Instruction 이라고 한다. 이러한 instruction은 kernel(ring0)만 실행될 수 있고 user(ring3)는 실행할 수 없다. 이는 하드웨어가 가장 높은 권한을 가지고 있으며 하드웨어가 kernel만 해당 instruction을 실행할 수 있도록 정해두었기 때문에 그렇다. 하드웨어는 code를 실행할 때 해당 segment에서 권한을 표시하는 특정 bit를 확인하고 cpu의 mode bit를 설정한다. 그리고 이 mode bit에 따라서 instruction을 수행할지 말지 결정한다.

User는 Previleged Instruction을 직접 수행할 수 없지만 때로는 해당 instruction들이 실행되어야 한다. 예를 들면 디스크에서 파일을 읽고 쓰거나 자식 프로세스를 생성해야하는 경우 등이 있다. 이를 위해 운영체제는 사용자를 대신하여 kernel이 이 instruction을 수행할 수 있도록 system call을 지원한다.

X86 Architecture에서 system call은 일반적인 exception과 동일한 방식으로 동작하였다고 한다. 이 일반적인 방식이란 exception이 먼저 발생하고 exception vector table에서 해당되는 handler를 찾아 실행되는 방식이다. 이와 다르게 X86_64 에서는 syscall이라는 instruction을 지원하여 user가 system call을 호출하면 trap이 발생하고 바로 syscall handler로 진행되도록 한다.

User가 System call을 호출하여 인자를 넘겨주면 kernel에서는 해당 인자가 유효한지 확인해야한다. 특히 들어온 인자가 virtual address라면 해당 주소가 유효한 주소인지 (kernel 영역을 접근하고 있지는 않은지, NULL을 넘겨준 것은 아닌지, User에게 할당된 영역이 맞는지) 반드시 확인한 후 해당되는 함수를 진행해야 한다.
```

<aside>
💡 System Calls

</aside>

```jsx
운영체제는 부팅할 때 system call이 호출되면 어떠한 instruction들을 수행한 뒤 handler 함수를 진행하도록 하드웨어를 설정한다. 이후 user program이 실행되고 user program에서 system call을 호출하면 하드웨어는 설정된 instruction들을 수행하고 system call handler를 실행한다.

PintOS에서는 syscall 호출시 syscall_entry.S에 작성된 instruction을 먼저 수행한다. 이는 tss로부터 저장된 kernel stack에서의 stack pointer를 가져와 rsp에 세팅하고, kernel stack으로 이동하여 user mode에서 실행되던 context를 stack에 interrupt frame 형식으로 쌓는다. 그리고 마지막 rsp의 값(if를 가리키는 주소)를 rdi에 저장하고 handler 함수로 이동함으로써 함수의 인자로 if를 전달한다.

System call handler에서는 인자로 들어온 if의 rax값을 확인(syscall을 수행하기 전에 syscall number를 rax에 저장하기 때문)하여 해당되는 syscall 요청에 따라 함수를 수행한다. 인자로 들어온 값들이 정상적이라면 syscall number에 따라 요청받은대로 작업을 진행한 뒤 if의 rax에 return 값을 setting하고, if을 인자로하여 do_iret함수를 호출함으로써 syscall을 호출한 user에게 해당되는 return값을 돌려주게 된다. 이로써 system call이 완료된다.
```

---

<aside>
💡 Fork system call

</aside>

```jsx
Fork system call은 fork를 호출한 process와 동일한 자식 process를 생성하는 함수이다. 특이한 점은 return을 두 번 한다는 점이다. 부모에게는 자식의 pid(tid)를 return하지만 자식에게는 0을 return 한다. 이로써 부모와 자식에 따라 다른 code를 실행하도록 분기할 수 있다. 그렇다면 kernel은 fork를 어떻게 처리해야하며, 어떻게 해야 두 번의 return을 진행할 수 있을까?

우선 user가 fork를 호출하면 다른 system call과 동일하게 trap이 발생된 뒤 kernel mode에서 syscall handler가 실행되고, syscall number가 저장된 if의 rax의 값에 따라 해당되는 함수가 실행된다. 실행된 함수에서는 들어온 인자(fork의 경우 user에서 자식 process의 name을 인자로 전달함)가 유효한지 확인하고, 유효하다면 fork를 진행한다.

우선 부모 process의 kernel mode에서, 자식 process를 생성하기 위해 실제 fork를 진행하는 함수와 user context가 담긴 if를 인자로하여 thread를 create한다. 이때 create을 진행하면서 생성되는 자식 thread를 부모 thread의 자식 리스트에, 그리고 부모 thread를 자식 thread의 부모 필드에 저장한다. 또한 부모는 자식 process가 fork를 마치기까지 기다려야하므로 자식 thread의 fork_sema를 0으로 초기화한다. 자식 thread의 create을 마치면, 부모 process는 자식 thread의 fork_sema를 sema down하여 자식 process가 fork를 마치고 신호를 줄 때까지 대기한다.

자식 thread가 schedule되면 본격적으로 부모 process를 fork한다. 여기서 중요한 점은, fork의 대상은 fork를 호출한 부모 process의 user관련 context라는 점이다. 부모와 동일한 process를 생성한다고 하면 kernel mode에서 실행되던 context까지 전부 동일해야 할 것 같지만, 사실 user mode로 실행되던 context만 동일하게 만들면 되는 것이다(자식 thread가 schedule 되어 실행되는 순간부터 이미 부모와 자식은 다른 kernel context를 실행하고 있다). 이러한 점에서 fork가 어떻게 부모와 자식에게 다른 return값을 전달하게 되는지 의문이 풀리게 된다.

자식 thread는 thread create시 인자로 전달된 함수와 인자로 fork를 진행한다. 부모 process의 user if를 kernel stack에 복제하고 가상 메모리 공간과 메모리들을 모두 복제한다. 또한 부모의 file descriptor table과 file table들을 그대로 복제하여 자식 process의 그것들에 setting 한다. 이러한 일련의 작업들이 성공적으로 진행되면 자신의 thread에 있는 fork_flag를 갱신하고 fork_sema 를 sema up하여 fork가 완료되기를 기다리는 부모 process를 깨워준다. 마지막으로 부모로부터 복제했던 if의 rax값을 0으로 setting한 뒤 do_iret을 실행하여 user에게 return하게 된다.

Sema down하고 기다리고 있었던 부모 thread가 schedule되면 자식의 fork_flag를 통해 fork가 정상적으로 이루어졌는지 확인하고, 정상적이라면 자식의 pid값을 if의 rax에 담고 do_iret을 실행하여 user에게 또한 return 한다. 이로써 부모와 자식은 kernel mode의 각각 다른 위치(부모는 system call handler, 자식은 do_fork)에서 if - rax 값을 setting하고 return하였지만 user process는 동일한 fork를 실행한 결과로 각각 다른 return 값을 받게 된다.
```

### Process termination Messages

```jsx
User process가 자식 process를 생성하면 부모 process는 자식 process를 청소할 의무(?)가 생긴다. 부모 process가 만일 자식 process보다 먼저 종료되면 자식 process는 실행하지도 종료하지도 못하는 상태(좀비 process)가 되기 때문이다. 따라서 부모 process는 어느 시점에서 자식 process가 termination 되기를 wait 한다.

자식 process의 user program이 main함수에서 0을 return하거나 exit(0)을 호출하면 exit system call이 실행된다. 그 결과로 kernel mode에서는 user program을 위해 사용되었던 file descriptor table과 file table, 가상 메모리 공간 등을 모두 청소하고 exit여부와 exit status를 저장하며 자신의 exit_sema를 sema up한 뒤 다른 thread를 schedule함으로써 process를 종료한다.

자식 process를 wait하던 부모 process가 schedule 되면 자식이 종료된 것을 확인하고 자식 thread를 청소하며 자식의 exit status를 if - rax에 저장한 뒤 user에 return한다.

PintOS는 termination message를 통해 자식 process의 exit과 부모 process의 wait이 정상적으로 작동되는지 확인한다. 하여 해당 chapter에서는 exit system call에서 exit되는 thread name과 exit status를 출력하도록 구현한다.
```

### Denying Writes to Executables

```jsx
User Program이 load될 때 loader는 실행파일을 open하고 ELF 정보를 읽어 실행시키는데 필요한 segment를 memory로 load한다. 이후에 기존에 구현되어있는 PintOS에서는 해당 file을 close하고 program을 실행시키도록 되어있다. 그러나 파일이 실행되는 중간에 코드가 변경되는 등의 파일 수정이 발생하면 예상치 못한 상황이 생길 수 있기에 실행되고 있는 파일은 수정될 수 없도록 보호할 필요가 있다.

File을 open하면 file system은 file로부터 metadata를 inode 구조체 형식으로 읽어온다. 그리고 이 inode를 가리키며 파일을 읽거나 쓰는 위치를 가리키는 offset pointer를 갖는 file 구조체를 만든다. Kernel은 process마다 file의 pointer를 저장하는 배열을 만들어 관리하며, 이것을 file descriptor table이라 하고 이 table의 file을 구분할 수 있는 구분자 index를 file descriptor라고 한다.

inode는 모든 process를 통틀어 동일한 file이라면 한 개만 생성된다. 즉, 모든 process는 동일한 file에 대해 유일한 inode를 갖는다(== 다른 process가 수정하면 모든 process에서도 수정된다 == inode는 공유자원이다). 이 inode의 member중에 하나(deny_write_cnt)가 파일을 수정할 수 있는지의 여부를 저장한다. 값이 0이면 수정 가능하며 1이상이면 수정이 불가하다. 대표적인 파일 수정 interface인 write함수에서도 이 값을 확인하고 수정이 가능할 때 수정을 진행하는걸 확인할 수 있다. 이렇듯 파일의 수정여부를 inode에 저장하며 inode는 공유자원이므로 해당 값을 1 이상으로 변경함으로써 다른 process로부터 file이 수정되는 것을 막을 수 있다.

File system은 이러한 값을 변경할 수 있도록 파일의 수정을 막기위한 file_deny_write와 파일의 수정을 허용하는 file_allow_write interface를 제공한다. 추가로 file을 닫는 file_close는 file_allow_write를 내장하고 있다. 따라서 program load시 file open 직후 file의 수정을 막도록 조치하고 file을 close하지 않은 상태로 유지한 뒤, program 종료시 해당 file을 close 함으로써 실행중인 파일이 수정되는 것을 막을 수 있다.
```

---
# 발표

## introduction

```jsx
유저 프로그램에서 운영체제 혹은 하드웨어에 직접 접근하지 않고 커널에다가 요청(시스템 콜) 하면 운영체제가 시스템 콜 핸들러를 이용해 내부적으로 작업하고 결과값만 넘겨주며 
이 작업으로 유저 프로그램은 복잡한 작업을 할 필요가 사라집니다.
(시스템콜이 없다면 각기 다른 OS마다 함수를 개별적으로 짜야한다.)
더불어 유저 프로그램이 다른 유저 프로그램에도 접근할 수 없기에(isolation) 보안 차원에서도 장점입니다.
```

![1](https://user-images.githubusercontent.com/109953972/215666688-56f1c96e-bd4e-44a9-a6e1-b5a58bfdfccf.png)


<aside>
💡 In user/syscall.c

</aside>

![2](https://user-images.githubusercontent.com/109953972/215666766-9998f0dc-967d-4150-9d6e-22c083210acf.jpg)


```jsx
1. User가 sysytem call 을 호출 ex) exec system call 호출

2. 인자에 따른 syscall1~N 함수 (인자 number (from lib/syscall-nr.h),file)
```

![3](https://user-images.githubusercontent.com/109953972/215666765-910c5a74-7eea-44af-b8bc-98936c5d93bf.jpg)


```jsx
3. syscall 함수 호출
```

![4](https://user-images.githubusercontent.com/109953972/215666760-0ef7d1c1-464d-4960-ac1e-e8c4884a43fa.jpg)


```jsx
4. Register에 rax와 인자들을 넣어주고 syscall(userporg/syscall-entry.S) 호출
	 여기부터 userporg/syscall.c
```

<aside>
💡 In userporg/syscall.c

</aside>

![5](https://user-images.githubusercontent.com/109953972/215666856-1e44aa05-feb5-4b32-8e01-7722d1887133.jpg)


```jsx
5. rbx, r12 를 임시로 저장해주고 , rsp 또한 rbx에 저장한다.
   tss에서 kernel stack pointer(rsp)를 가져와 rsp에 입력하는 작업으로 kernel stack 으로                진입한다.

```

![6](https://user-images.githubusercontent.com/109953972/215666853-efc13310-7c2d-4cc8-9cb8-bdd58cb128af.jpg)


```jsx
6. tss 구조체 주소에 가보면 4를 이동하면 kernel stack pointer (rsp) 를 찾을 수 있다.

```

![7](https://user-images.githubusercontent.com/109953972/215666848-a7bcc5a1-3c14-4de3-a52c-0b56ec02e2a2.jpg)


```jsx
7. 이때의 커널 상태는 그림과 같다.
	 intr_frame 구조로 쌓고 syscall_hander에게 전달해준다.

```

![8](https://user-images.githubusercontent.com/109953972/215666858-55955c4a-0653-45df-97cb-fcf918eb7d11.jpg)


```jsx
8. syscall 전체 흐름
```

## 회고

```jsx
1) 팀원들과 함께 고민하고 서로 피드백하며 함께 성장하는 과정에서 팀 프로젝트의 장점을 많이 느낄 수 있었다.
2) 전반적인 흐름에 대한 이해는 했지만 multi-oom 과제에서 debuging에 시간을 많이 할애하게 되었는데 세부적인 메모리할당 동기화에 대한 정확한 이해가 아직 부족한 것 같아 아쉬움이 남는다.
```