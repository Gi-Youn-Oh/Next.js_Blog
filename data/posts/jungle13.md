<h2> 13주차 개발일지 </h2>
<hr>
<h3>File System</h3>
PintOS의 마지막 과제 File System을 마주했다.
정글에 입소한게 엊그제 같은데 벌써 pintOS의 마지막 주차가 되었고, 다음주부터는 나만의 무기과제가 시작된다.
첫 정글에 입소했을때 처럼 기대 반, 걱정 반이다.
분명히 많이 성장했고, 지식도 많이 쌓였지만 모든 과제를 완벽하게 이해하고 구현한 것이 아니기 때문에 (애초에 모든 과제를 완벽하게 하라고 주시진 않았겠지만 ..) 더욱 많이 알고싶고 공부하고 싶은 마음이다.
부족한 부분 하나없이 취업시장에 나가고 싶은 욕심이지만, 시간은 기다려주지 않기에 하루하루 최선을 다하는 것이 최선이라 생각하고 나아간다.
<hr>
File system에서는 이전과제에서도 그러하였듯, Project 1,2,3 기반 코드 위에서 작동한다.
file system의 모든 과제를 구현하지는 못해서, 구현한 과제 위주로 대략적 요약을 하면 다음과 같다.
project3 까지는 파일은 여러 디스크 섹터에 연속적인 단일 청크로 저장되었었다.
즉 Continous Allocation 으로 구현된 파일시스템이다.
이 파일 시스템의 장점은 순차적, 직접 접근이 가능하기에 효율적인 파일 접근이 가능하지만,
새로운 파일을 위한 공간 확보가 어렵고, 외부단편화가 심하며 [(ex)7개의 sector를 필요로하는 file 크기에 대해 연속된 빈 공간이 5개의 sector만 있을경우], file이 커져야 할 수 있기 때문에 초기 공간 크기 결정이 어렵다.
이러한 단점을 극복하기위해 FAT(File Allocation Table)을 구현하는 것이 첫 번째 과제였다.
첫 번째로 Discontinous Allocation방식 중 하나인 Linked Allocation은
파일이 저장된 블록들을 linked_list로(비연속 할당)연결하는 방식인데, 단순하고 외부단편화를 최소화 할 수 있어 효율적이다.
하지만 직접 접근에는 비효율적이며, 포인터 저장을 위한 공간 할당이 필요하며, 신뢰성 문제 또한 발생할 수 있다.
두번째는 Discontinous Allocation의 다른 방법으로 indexed allocation 방법이 있는데 파일이 저장된 블록의 정보(pointer)를 index block에 모아두는 방식이다.
직접 접근에는 효율적이나 file 1개 당 index block을 유지해야하기 때문에 공간을 많이 잡아먹게된다.
이러한 파일 시스템에 대한 여러 장,단점으로 인해 처음 FAT 을 배열, 리스트, 비트맵중 어떤 것으로 구현하는 것이 효율적인지에 대한 고민이 많았다.
<hr>
FAT만 사용하게되면 FAT의 index 0에는 기초 정보가 들어가 있고 1에는 Root_dir_cluster (value = EOChain)이 있기에 0으로 파일의 미할당 여부를 표시하지 못하고, 파일의 끝부분을 나타내려면 -1을 사용해야하기 때문에 unsigned 를 사용하지 못하고 signed를 사용해야 한다고 생각해 처음에는 비트맵을 하나더 만들어 FAT의 value 값이 있는지 없는지를 나타내려 했다. 
아래와 같은 그림이다.

![file8](https://user-images.githubusercontent.com/109953972/208286032-632fb0b9-3e6d-4f6a-910a-762fea7fc7e6.jpg)

하지만 FAT과 동일한 사이즈의 Bitmap을 만들어야 하기에 구현도중 다시 고민에 빠졌다.
코드를 구현하다보니 FAT의 0에는 접근하지 못하게 하고, value값을 놓지 않으면 0을 미할당 표시로 사용할 수 있다는 생각을 하게 되었고, FAT 테이블만 그대로 구현해 사용하는 것으로 전환했다. (현재의 FAT은 array형태이지만 value값이 다음 cluster를 가리켜 linked list 가 혼합된 형태)
이 또한 fat_create_chain을 구현할때 많은 혼란이 있었는데 Root_dir_cluster를 0번에 놓는 것이 맞는가, 1번에 그대로 두는것이 맞는가에 고민이 많았는데 0번 index에 접근만 조심하도록 코드를 구현하면 상관없었다.
우리조는 1번 index에 Root_dir_cluster를 그대로 두게끔 chain을 구현했고 아래 그림과 같다.

![file9](https://user-images.githubusercontent.com/109953972/208286116-97bac535-f224-4c0b-a587-83d10e568d11.jpg)

<hr>
PintOS의 디스크 구조

1. Boot block 

부트 블록은 컴퓨터 부팅 관련한 총체적인 정보가 들어있는 디스크로, 디스크 가장 앞쪽에 위치해있다. UNIX뿐만 아니라 어떤 파일 시스템이건 Boot block이 가장 맨 앞에 있다. 어떤 파일 시스템을 쓰던 0번 블록에 부팅에 필요한 정보(Bootstrap loader)를 메모리에 올리면 복잡한 로직 없이 부팅을 바로 진행할 수 있기 때문이다.

2. FAT
FAT의 index 0에는 기초 정보가 들어가 있고 1에는 Root_dir_cluster (value = EOChain)이 있다.

파일 메타데이터 중 일부를 FAT에 저장한다. 여기서 FAT에 저장하는 일부 데이터는 파일 위치 정보에 해당하며, 나머지 메타데이터는 루트 디렉토리에 저장한다. 따라서 FAT을 확인해보면 데이터 블록에 있는 해당 파일 contents로 곧바로 접근이 가능하다. 이 역시 직접 접근이 가능한 구조에 해당한다.

예를 들어 파일의 네 번째 블록을 본다고 해보자. FAT은 부팅이 시작되고 나면 통째로 메모리에 올라와 있다. 이 파일의 네 번째 블록을 가려면 메모리 내 FAT 테이블 안에서 위치를 계속 확인해 최종 위치까지 갈 수 있다. 여기서 핵심은 디스크 헤드를 움직이는 게 아니라 FAT 테이블을 메모리에 올려놓고 메모리 안에서 왔다갔다해서 찾아내는 방식이라는 점이다.
이와 같은 방식을 적용하면 포인터가 하나 유실되더라도 FAT에 위치 데이터가 보관되어 있으니 문제되지 않는다. 게다가, FAT는 매우 중요한 정보기 때무에 여러 copy를 디스크 내에 저장해두고 있다. 즉, 하나만 있지 않다. 이를 통해 reliability를 개선할 수 있다. 또한, FAT를 통해 직접 접근이 가능하므로 linked allocation 문제 역시 해결한다.

3. DATA section

<hr>
마지막으로 이번 project 진행중 가장 애를 먹었던 debug에 대해 정리하고 글을 마무리 하려한다.

```jsx
FAIL tests/filesys/base/syn-remove

(저희조가 애를 먹었던 test_case입니다.)

1. fat_remove_chain();
=> 처음 문제라고 생각했던 함수 / remove_chain 함수 내용이 없더라도 통과가 됨

2. fat_remove_chain(); 를 호출하는 함수? ->> inode_close();

3. 근본적인 문제 = inode_create();
```

## 1. fat_remove_chain();

![1](https://user-images.githubusercontent.com/109953972/208286201-d6ebb486-0b12-41ee-b7c7-1f9dcb3f8ce6.png)

![2](https://user-images.githubusercontent.com/109953972/208286204-3ab5d58b-3af4-4a16-a512-21173d40a31b.png)

<aside>
💡 도대체 왜 113 → 114 → 115 → 116 → 117 → 114 → 0 → 0 . ………??

</aside>

```jsx
if(next_clst == EOChain){
	break;    
}
반복문 탈출 조건 문제?
EOChain이 없어서?
```

![3](https://user-images.githubusercontent.com/109953972/208286208-ead49d4e-a28f-4cda-b5aa-bff3bb389823.png)

![4](https://user-images.githubusercontent.com/109953972/208286216-6a159eab-584d-4c9a-894b-510283f64990.png)

<aside>
💡 EOChain 값 있음 .. 그럼 왜 무한 루프를 돌까?

</aside>

![5](https://user-images.githubusercontent.com/109953972/208286228-5e080ee3-bf95-4246-b7b3-0bcf44f54ce9.png)

```jsx
while 문 제거하고 check
113 - > 114 -> 115 -> 116 -> 117 -> EOChain
```

![6](https://user-images.githubusercontent.com/109953972/208286235-726a108f-9024-4ec0-81e1-980ec2f41c08.png)

![7](https://user-images.githubusercontent.com/109953972/208286262-b27f349b-f7cb-4c27-8a50-3fee7336abff.png)

![8](https://user-images.githubusercontent.com/109953972/208286263-7adb4907-c0bf-4954-aab7-f11e00fcb404.png)

<aside>
💡 도대체 왜 114로 돌아가서 무한루프를 돌까? fat_remove_chain 을 호출한 함수를 보자!

</aside>

```jsx
inode_close (struct inode *inode);
```

![9](https://user-images.githubusercontent.com/109953972/208286269-fe3a5a7b-4180-4ba4-871d-fb98571dc648.png)

![10](https://user-images.githubusercontent.com/109953972/208286270-482ab04c-3396-4037-8138-1affd8d2d2b5.png)

```jsx
inode sector 와 inode data.start 가 이어져있나?
중간에 끊어주는 역할을 하는 EOChain 이 없다!
즉 inode sector 에 EOChain이 있어야 하는데 이어져있다.
애초에 create 할때 잘못 만들었구나
inode_create 함수로 가자!
```

<aside>
💡 inode_create 수정!

</aside>

![11](https://user-images.githubusercontent.com/109953972/208286289-2833524d-75e9-40e5-a730-f3822397e9c0.png)

```jsx
inode_create(); 수정 코드 
```

![12](https://user-images.githubusercontent.com/109953972/208286291-f211b79e-c553-4bde-ad44-0d1fd9ecdb0c.png)

```jsx
성공
```

```jsx
결론
inode_close(){
	.....
	1. fat_remove_chain (sector_to_cluster(inode->sector), 0);
	2. fat_remove_chain (sector_to_cluster(inode->data.start),0);
}

1. fat_remove_chain (sector_to_cluster(inode->sector), 0);

inode->sector = 113 (in fat) 
113 / value 에는 EOChain이 들어가있어야 했는데 114 가 들어가 있었다.
따라서 117 EOChain 까지 돌고 난 후

2. fat_remove_chain (sector_to_cluster(inode->data.start),0);

함수가 작동하는데 
inode->data.start = 114  (in fat)
114 / value = 0 인상태라 무한루프 

정상 작동

1. fat_remove_chain (sector_to_cluster(inode->sector), 0);

inode->sector = 113 (in fat) 
113 / value = EOChain
따라서 113 EOChain 까지 돌고 난 후

2. fat_remove_chain (sector_to_cluster(inode->data.start),0);

함수 작동
inode->data.start = 114 (in fat)
114 / value = 115 
114 -> 115 -> 116 -> 117 (EOChain) 종료 
```

![13](https://user-images.githubusercontent.com/109953972/208286306-357aa49f-980b-464f-8ac3-eb318e81ec96.jpg)

![14](https://user-images.githubusercontent.com/109953972/208286307-7bf642bc-9e53-4b78-8d20-e376d65a6f7e.png)

![15](https://user-images.githubusercontent.com/109953972/208286308-5745699e-7ce3-45e9-9e54-c644b4d70093.png)