# Callback

1. 자바스크립트는 동기적 
- 호이스팅이 된 이후로 순서에 맞추어 자동적으로 동기적으로 실행된다.
- (호이스팅? ⇒ var, function declaration 선언들이 자동적으로 제일 위로 올라가는 것)

1. setTimeout 비동기 대표적 브라우저 API 통신 setTimeout(callback, time)

1. callback hell ⇒ 가독성이 떨어짐, 로직파악 어려움, 디버깅 어려움, 유지보수 어려움

# Promise

- 정해진 장시간의 기능을 수행하고 나서 정상적으로 기능이 성공적으로 수행됬다면 성공의 메시지와 처리값을 전달해주고, 예상치 못한 문제가 발생했다면 에러 전달
- 비동기적인 것을 수행할 때 콜백함수 대신에 사용할 수 있다.
- State(성공, 실패) / Producer ↔ Consumer

1. State
    
    1) pending - operate 수행중인 상태
    
    2) fulfilled - 완료된 상태
    
    3) rejected - 실패시
    
2. Producer 
    
    1) promise 만들기
    
    - Executor 콜백함수 ⇒ resolve (정상적으로 수행 데이터 전달) / reject(예상치 못한 에러 전달)
    - 만드는 순간 executor 실행됨 (유의! 불필요한 네트워크 통신)
3. Consumer
    
    1) then 
    
    - resolve 된 데이터를 활용
    
    2) catch
    
    - reject 된 에러를 활용
    
    3) finally
    
    - 성공 실패 여부와 상관없이 무조건적 실행 ( 어떤 기능을 마지막으로 실행하고 싶을 때)
    
 ![image](https://user-images.githubusercontent.com/109953972/221883252-11dd074c-f53a-418b-ae87-d6d6406a90cf.png)
    
4. Chaining
    
    .then .then .catch …   
    

# Async & Await

- 기존에 존재하는 것 위에 or 기존에 존재하는 것을 감싸서 간편하게 사용할 수 있느 것 (syntactic sugar)
- 깔끔하게 promise를 사용할 수 있다. (무조건 async가 좋은 것은 아님)

1. async

```jsx
function fetchUser() {
	return new Promise((resolve, reject) => {
		resolve('giyoun');
	});
}

자동으로 함수 안의 코드블록들이 promise로 변경
async function fetchUser() {
	return 'giyoun';
}
```

1. await

```jsx
promise chaining
function pickFruits() {
	return getApple().then(apple => {
		return getBanana().then(banana => `${apple} + ${banana}`);
	});
}

pickFruits().then(console.log);

병렬 처리 순차적 진행 비효율적
async function pickFruits() {
	const apple = await getApple();
	const banana = await getBanana();
	return `${apple} + ${banana}`;
}

pickFruits().then(console.log);

서로 연관이 없을 때 병렬적 처리 (코드 지저분)
async function pickFruits() {
	const applePromise = getApple(); [promise 함수는 바로 실행]
	const bananaPromise = getBanana();
	
	const apple = await applePromise();
	const banana = await bananaPromise();
	return `${apple} + ${banana}`;
}

pickFruits().then(console.log);

// all  모든 Promise들이 병렬적으로 다 받을 때까지 기다려줌
function pickAllFruits () {
	return Promise.all ([getApple(), getBanana()])
	.then(fruits => fruits.join(' + ')); // join - string 으로 합치기
}

pickAllFruits().then(console.log);

// 둘 중 하나만 먼저 따지는 것만
function pickOnlyOne(){
	return Promise.race([getApple(), getBanana()]);
}

pickOnlyOne().then(console.log)

```