# React-deep-dive-5

## 2-3. useEffect in React.dev(2)

### Unnecessary useEffect

<aside>
💡 <b>이번 글에서는 올바른 useEffect의 사용에 대해서 정리합니다. 공식문서의 기본적인 예제들이지만 한번 더 숙지하면서 올바르게 사용하고 있는지 되돌아 보겠습니다. 불필요하게 useEffect를 남용하고 있지 않은지 체크해 봐야 합니다.</b>

</aside>

- **외부 시스템이 관여하지 않는 경우(예: 일부 props나 state가 변경될 때 컴포넌트의 state를 업데이트하려는 경우)에는 Effect가 필요하지 않다.**
- **불필요한 Effect를 제거하면 코드를 더 쉽게 따라갈 수 있고, 실행 속도가 빨라지며, 오류 발생 가능성이 줄어듭니다.**
    1. 순차적 실행: 여러 개의 `useEffect`가 있다면 각각은 순차적으로 실행됩니다. 따라서 `useEffect`의 수가 많아질수록 전체적인 실행 시간이 늘어날 수 있습니다.
    2. 불필요한 렌더링 트리거: `useEffect` 내에서 상태를 변경하면 해당 상태 변경이 렌더링을 트리거할 수 있습니다. 이때 불필요한 렌더링이 발생할 경우 성능 저하가 발생할 수 있습니다.

1. ****How to remove unnecessary Effects****
    - 렌더링을 위해 데이터를 변환하는 경우 useEffect는 필요하지 않습니다.
        
        ⇒ 종종 이렇게 useEffect를 잘못 사용해 왔다…😂 → 데이터 변환을 상위로 이동하여 자동실행 하도록 하자!
        
    
    ```jsx
    예를 들어, 목록을 표시하기 전에 필터링하고 싶다고 가정해 봅시다. 목록이 변경될 때 state 변수를 업데이트하는 Effect를 작성하고 싶을 수 있습니다. 하지만 이는 비효율적입니다. 컴포넌트의 state를 업데이트할 때 React는 먼저 컴포넌트 함수를 호출해 화면에 표시될 내용을 계산합니다. 다음으로 이러한 변경 사항을 DOM에 “commit”하여 화면을 업데이트하고, 그 후에 Effect를 실행합니다. 만약 Effect “역시” state를 즉시 업데이트한다면, 이로 인해 전체 프로세스가 처음부터 다시 시작될 것입니다! 불필요한 렌더링을 피하려면 모든 데이터 변환을 컴포넌트의 최상위 레벨에서 하세요. 그러면 props나 state가 변경될 때마다 해당 코드가 자동으로 다시 실행될 것입니다.
    ```
    
    - 사용자 이벤트를 처리하는 데에 Effect는 필요하지 않습니다.
        
        ⇒ 이전 글에서 살펴봤던 예시
        
    
    ```jsx
    예를 들어, 사용자가 제품을 구매할 때 /api/buy POST 요청을 전송하고 알림을 표시하고 싶다고 합시다. 구매 버튼 클릭 이벤트 핸들러에서는 정확히 어떤 일이 일어났는지 알 수 있습니다. 반면 Effect는 사용자가 무엇을 했는지(예: 어떤 버튼을 클릭했는지)를 알 수 없습니다. 그렇기 때문에 일반적으로 사용자 이벤트를 해당 이벤트 핸들러에서 처리합니다.
    ```
    

1. **Updating state based on props or state**
    - bad case
    
    ```jsx
    function Form() {
      const [firstName, setFirstName] = useState('Taylor');
      const [lastName, setLastName] = useState('Swift');
    
      // 🔴 Avoid: redundant state and unnecessary Effect
      // 🔴 이러지 마세요: 중복 state 및 불필요한 Effect
      const [fullName, setFullName] = useState('');
      useEffect(() => {
        setFullName(firstName + ' ' + lastName);
      }, [firstName, lastName]);
      // ...
    }
    ```
    
    - correct case
    
    ```jsx
    function Form() {
      const [firstName, setFirstName] = useState('Taylor');
      const [lastName, setLastName] = useState('Swift');
      // ✅ Good: calculated during rendering
      // ✅ 좋습니다: 렌더링 과정 중에 계산
      const fullName = firstName + ' ' + lastName;
      // ...
    }
    ```
    
    ⇒ **기존 props나 state에서 계산할 수 있는 것이 있으면 렌더링 중에 계산하자.**
    
2. **Caching expensive calculations**
    
    ⇒ 아래 컴포넌트는 props로 받은 `todos`를 `filter` prop에 따라 필터링하여 `visibleTodos`를 계산합니다. 이 결과를 state 변수에 저장하고 Effect에서 업데이트하고 싶을 수도 있을 것이다.
    
    - bad case
    
    ```jsx
    function TodoList({ todos, filter }) {
      const [newTodo, setNewTodo] = useState('');
    
      // 🔴 Avoid: redundant state and unnecessary Effect
      // 🔴 이러지 마세요: 중복 state 및 불필요한 Effect
      const [visibleTodos, setVisibleTodos] = useState([]);
      useEffect(() => {
        setVisibleTodos(getFilteredTodos(todos, filter));
      }, [todos, filter]);
    
      // ...
    }
    ```
    
    - correct case
    
    ```jsx
    	function TodoList({ todos, filter }) {
      const [newTodo, setNewTodo] = useState('');
      // ✅ This is fine if getFilteredTodos() is not slow.
      // ✅ getFilteredTodos()가 느리지 않다면 괜찮습니다.
      const visibleTodos = getFilteredTodos(todos, filter);
      // ...
    }
    ```
    
    - improve
    
    ```jsx
    import { useMemo, useState } from 'react';
    
    function TodoList({ todos, filter }) {
      const [newTodo, setNewTodo] = useState('');
      // ✅ Does not re-run getFilteredTodos() unless todos or filter change
      // ✅ todos나 filter가 변하지 않는 한 getFilteredTodos()가 재실행되지 않음
      const visibleTodos = useMemo(() => getFilteredTodos(todos, filter), [todos, filter]);
      // ...
    }
    ```
    

<aside>
💡 `useMemo`로 감싸는 함수는 렌더링 중에 실행되므로, 순수 계산에만 작동합니다.

</aside>

**Extra - useMemo**

- calculate is expensive?

    ```jsx
    console.time('filter array');
    const visibleTodos = getFilteredTodos(todos, filter);
    console.timeEnd('filter array');
    ```

    ⇒ 1ms 이상 계산은 메모해 두는 것이 좋을 수 있습니다. 실험삼아 해당 계산을 `useMemo`로 감싸서 해당 상호작용에 대해 총 로그된 시간이 감소했는지 여부를 확인할 수 있습니다:

    ```jsx
    console.time('filter array');
    const visibleTodos = useMemo(() => {
    return getFilteredTodos(todos, filter); // Skipped if todos and filter haven't changed
    }, [todos, filter]);
    console.timeEnd('filter array');
    ```

4. **Resetting all state when a prop changes**
    - bad case
    
    ```jsx
    export default function ProfilePage({ userId }) {
      const [comment, setComment] = useState('');
    
      // 🔴 Avoid: Resetting state on prop change in an Effect
      // 🔴 이러지 마세요: prop 변경시 Effect에서 state 재설정 수행
      useEffect(() => {
        setComment('');
      }, [userId]);
      // ...
    }
    ```
    
    ⇒  `ProfilePage`와 그 자식들이 먼저 오래된 값으로 렌더링한 다음 새로운 값으로 다시 렌더링하기 때문에 비효율적입니다. 또한 `ProfilePage` 내부에 어떤 state가 있는 *모든* 컴포넌트에서 이 작업을 수행해야 하므로 복잡합니다. 예를 들어, 댓글 UI가 중첩되어 있는 경우 중첩된 하위 댓글 state들도 모두 지워야 할 것입니다.
    
    - correct case (using key)
    
    ```jsx
    export default function ProfilePage({ userId }) {
      return (
        <Profile
          userId={userId}
          key={userId}
        />
      );
    }
    
    function Profile({ userId }) {
      // ✅ This and any other state below will reset on key change automatically
      // ✅ key가 변하면 이 컴포넌트 및 모든 자식 컴포넌트의 state가 자동으로 재설정됨
      const [comment, setComment] = useState('');
      // ...
    }
    ```
    
    ⇒ **`userId`를 `key`로 `Profile` 컴포넌트에 전달하는 것은 곧, `userId`가 다른 두 `Profile` 컴포넌트를 state를 공유하지 않는 별개의 컴포넌트들로 취급하도록 React에게 요청하는 것, React key의 중요성에 대해서는 다들 인지하고 있을 것이니 자세한 내용은 생략하겠습니다.**
    

1. **Adjusting some state when a prop changes**
    - 때론 prop이 변경될 때 state의 전체가 아닌 일부만 재설정하거나 조정하고 싶을 수 있습니다.
    - bad case
    
    ```jsx
    function List({ items }) {
      const [isReverse, setIsReverse] = useState(false);
      const [selection, setSelection] = useState(null);
    
      // 🔴 Avoid: Adjusting state on prop change in an Effect
      // 🔴 이러지 마세요: prop 변경시 Effect에서 state 조정
      useEffect(() => {
        setSelection(null);
      }, [items]);
      // ...
    }
    ```
    
    ⇒  items가 `변경될 때마다` List`와 그 하위 컴포넌트는 처음에는 오래된` selection`값으로 렌더링됩니다. 그런 다음 React는 DOM을 업데이트하고 Effects를 실행합니다. 마지막으로`setSelection(null)`호출은`List와 그 자식 컴포넌트를 다시 렌더링하여 이 전체 과정을 재시작하게 됩니다
    
    - correct case
    
    ```jsx
    function List({ items }) {
      const [isReverse, setIsReverse] = useState(false);
      const [selection, setSelection] = useState(null);
    
      // Better: Adjust the state while rendering
      // 더 나음: 렌더링 중에 state 조정
      const [prevItems, setPrevItems] = useState(items);
      if (items !== prevItems) {
        setPrevItems(items);
        setSelection(null);
      }
      // ...
    }
    ```
    
    ⇒ use Effect에서 동일한 state를 업데이트하는 것보다는 낫습니다. 위 예시에서는 렌더링 도중 `setSelection`이 직접 호출됩니다. React는 `return`문과 함께 종료된 *직후에* `List`를 다시 렌더링합니다. 이 시점에서 React는 아직 `List`의 자식들을 렌더링하거나 DOM을 업데이트하지 않았기 때문에, `List`의 자식들은 기존의 `selection` 값에 대한 렌더링을 건너뛰게 됩니다.
    
    ⇒ 렌더링 도중 컴포넌트를 업데이트하면, React는 반환된 JSX를 버리고 즉시 렌더링을 다시 시도합니다. React는 계단식으로 전파되는 매우 느린 재시도를 피하기 위해, 렌더링 중에 *동일한* 컴포넌트의 state만 업데이트할 수 있도록 허용합니다. 렌더링 도중 다른 컴포넌트의 state를 업데이트하면 오류가 발생합니다. 동일 컴포넌트가 무한으로 리렌더링을 반복 시도하는 상황을 피하기 위해 `items !== prevItems`와 같은 조건이 필요한 것입니다. 이런 식으로 state를 조정할 수 있긴 하지만, 다른 side effect(DOM 변경이나 timeout 설정 등)은 이벤트 핸들러나 Effect에서만 처리함으로써 [컴포넌트의 순수성을 유지](https://react-ko.dev/learn/keeping-components-pure)해야 합니다.
    
    - improve
    
    ```jsx
    function List({ items }) {
      const [isReverse, setIsReverse] = useState(false);
      const [selectedId, setSelectedId] = useState(null);
      // ✅ Best: Calculate everything during rendering
      // ✅ 가장 좋음: 렌더링 중에 모든 값을 계산
      const selection = items.find(item => item.id === selectedId) ?? null;
      // ...
    }
    ```
    
    ⇒ 이제 state를 “조정”할 필요가 전혀 없습니다. 선택한 ID를 가진 항목이 목록에 있으면 선택된 state로 유지됩니다. 그렇지 않은 경우 렌더링 중에 계산된 `selection` 항목은 일치하는 항목을 찾지 못하므로 `null`이 됩니다. 이 방식은 `items`에 대한 대부분의 변경과 무관하게 ‘selection’ 항목은 그대로 유지되므로 대체로 더 나은 방법입니다.
    

1. **Sharing logic between event handlers**
    
    ⇒ **컴포넌트가 사용자에게 표시되었기 *때문에* 실행되어야 하는 코드에만 Effect를 사용.** 
    
    - bad case
    
    ```jsx
    function ProductPage({ product, addToCart }) {
      // 🔴 Avoid: Event-specific logic inside an Effect
      // 🔴 이러지 마세요: Effect 내부에 특정 이벤트에 대한 로직 존재
      useEffect(() => {
        if (product.isInCart) {
          showNotification(`Added ${product.name} to the shopping cart!`);
        }
      }, [product]);
    
      function handleBuyClick() {
        addToCart(product);
      }
    
      function handleCheckoutClick() {
        addToCart(product);
        navigateTo('/checkout');
      }
      // ...
    }
    ```
    
    - correct case
    
    ```jsx
    function ProductPage({ product, addToCart }) {
      // ✅ Good: Event-specific logic is called from event handlers
      // ✅ 좋습니다: 이벤트 핸들러 안에서 각 이벤트별 로직 호출
      function buyProduct() {
        addToCart(product);
        showNotification(`Added ${product.name} to the shopping cart!`);
      }
    
      function handleBuyClick() {
        buyProduct();
      }
    
      function handleCheckoutClick() {
        buyProduct();
        navigateTo('/checkout');
      }
      // ...
    }
    ```
    

1. **Sending a POST request**
    - bad case
    
    ```jsx
    function Form() {
      const [firstName, setFirstName] = useState('');
      const [lastName, setLastName] = useState('');
    
      // ✅ Good: This logic should run because the component was displayed
      // ✅ 좋습니다: '컴포넌트가 표시되었기 때문에 로직이 실행되어야 하는 경우'에 해당
    	  useEffect(() => {
        post('/analytics/event', { eventName: 'visit_form' });
      }, []);
    
      // 🔴 Avoid: Event-specific logic inside an Effect
      // 🔴 이러지 마세요: Effect 내부에 특정 이벤트에 대한 로직 존재
      const [jsonToSubmit, setJsonToSubmit] = useState(null);
      useEffect(() => {
        if (jsonToSubmit !== null) {
          post('/api/register', jsonToSubmit);
        }
      }, [jsonToSubmit]);
    
      function handleSubmit(e) {
        e.preventDefault();
        setJsonToSubmit({ firstName, lastName });
      }
      // ...
    }
    ```
    
    - correct case
    
    ```jsx
    function Form() {
      const [firstName, setFirstName] = useState('');
      const [lastName, setLastName] = useState('');
    
      // ✅ Good: This logic runs because the component was displayed
      // ✅ 좋습니다: '컴포넌트가 표시되었기 때문에 로직이 실행되어야 하는 경우'에 해당
      useEffect(() => {
        post('/analytics/event', { eventName: 'visit_form' });
      }, []);
    
      function handleSubmit(e) {
        e.preventDefault();
        // ✅ Good: Event-specific logic is in the event handler
        // ✅ 좋습니다: 이벤트 핸들러 안에서 특정 이벤트 로직 호출
        post('/api/register', { firstName, lastName });
      }
      // ...
    }
    ```
    

<aside>
💡 로직이 특정 상호작용으로 인해 발생하는 것이라면 이벤트 핸들러. 사용자가 화면에서 컴포넌트를 *보는* 것이 원인이라면 useEffect. **어떤 로직을 이벤트 핸들러에 넣을지 Effect에 넣을지 선택할 때, 사용자 관점에서 *어떤 종류의 로직*인지에 대한 답을 찾아야 한다.**

</aside>

8. **Chains of computations**
    - bad case
    
    ```jsx
    function Game() {
      const [card, setCard] = useState(null);
      const [goldCardCount, setGoldCardCount] = useState(0);
      const [round, setRound] = useState(1);
      const [isGameOver, setIsGameOver] = useState(false);
    
      // 🔴 Avoid: Chains of Effects that adjust the state solely to trigger each other
      // 🔴 이러지 마세요: 오직 서로를 촉발하기 위해서만 state를 조정하는 Effect 체인
      useEffect(() => {
        if (card !== null && card.gold) {
          setGoldCardCount(c => c + 1);
        }
      }, [card]);
    
      useEffect(() => {
        if (goldCardCount > 3) {
          setRound(r => r + 1)
          setGoldCardCount(0);
        }
      }, [goldCardCount]);
    
      useEffect(() => {
        if (round > 5) {
          setIsGameOver(true);
        }
      }, [round]);
    
      useEffect(() => {
        alert('Good game!');
      }, [isGameOver]);
    
      function handlePlaceCard(nextCard) {
        if (isGameOver) {
          throw Error('Game already ended.');
        } else {
          setCard(nextCard);
        }
      }
    
      // ...
    ```
    
    ⇒ 매우 비효율적. 컴포넌트(및 그 자식들)은 체인의 각 `set` 호출 사이에 다시 렌더링해야 합니다. 위의 예시에서 최악의 경우(`setCard` → 렌더링 → `setGoldCardCount` → 렌더링 → `setRound` → 렌더링 → `setIsGameOver` → 렌더링)에는 하위 트리의 불필요한 리렌더링이 세 번이나 발생합니다.
    
    ⇒ 이 경우 렌더링 중에 가능한 것을 계산하고 이벤트 핸들러에서 state를 조정하는 것이 좋다
    
    - correct case
    
    ```jsx
    function Game() {
      const [card, setCard] = useState(null);
      const [goldCardCount, setGoldCardCount] = useState(0);
      const [round, setRound] = useState(1);
    
      // ✅ Calculate what you can during rendering
      // ✅ 가능한 것을 렌더링 중에 계산
      const isGameOver = round > 5;
    
      function handlePlaceCard(nextCard) {
        if (isGameOver) {
          throw Error('Game already ended.');
        }
    
        // ✅ Calculate all the next state in the event handler
        // ✅ 이벤트 핸들러에서 다음 state를 모두 계산
        setCard(nextCard);
        if (nextCard.gold) {
          if (goldCardCount <= 3) {
            setGoldCardCount(goldCardCount + 1);
          } else {
            setGoldCardCount(0);
            setRound(round + 1);
            if (round === 5) {
              alert('Good game!');
            }
          }
        }
      }
    
      // ... 
    ```
    

9. **Initializing the application**
    
    ⇒ 일부 로직은 앱이 로드될 때 한 번만 실행되어야 한다. 최상위 컴포넌트의 Effect에 배치하고 싶을 수도 있습니다.
    
    ⇒ 일부 로직이 *컴포넌트 마운트당 한 번*이 아니라 *앱 로드당 한 번* 실행되어야 하는 경우, 최상위 변수를 추가하여 이미 실행되었는지 여부를 추적해야 한다.
    
    ⇒ 과도하게 사용하지 말 것 (반드시 필요한 경우에만)
    
    - bad case
    
    ```jsx
    function App() {
      // 🔴 Avoid: Effects with logic that should only ever run once
      // 🔴 이러지 마세요: 한 번만 실행되어야 하는 로직이 포함된 Effect
      useEffect(() => {
        loadDataFromLocalStorage();
        checkAuthToken();
      }, []);
      // ...
    }
    ```
    
    - correct case
    
    ```jsx
    let didInit = false;
    
    function App() {
      useEffect(() => {
        if (!didInit) {
          didInit = true;
          // ✅ Only runs once per app load
          // ✅ 앱 로드당 한 번만 실행됨
          loadDataFromLocalStorage();
          checkAuthToken();
        }
      }, []);
      // ...
    }
    ```
    
    - correct case 2
    
    ```jsx
    if (typeof window !== 'undefined') { // Check if we're running in the browser.
                                         // 브라우저에서 실행중인지 확인
      // ✅ Only runs once per app load
      // ✅ 앱 로드당 한 번만 실행됨
      checkAuthToken();
      loadDataFromLocalStorage();
    }
    
    function App() {
      // ...
    }
    ```
    

10. **Notifying parent components about state changes**
    - bad case
    
    ```jsx
    function Toggle({ onChange }) {
      const [isOn, setIsOn] = useState(false);
    
      // 🔴 Avoid: The onChange handler runs too late
      // 🔴 이러지 마세요: onChange 핸들러가 너무 늦게 실행됨
      useEffect(() => {
        onChange(isOn);
      }, [isOn, onChange])
    
      function handleClick() {
        setIsOn(!isOn);
      }
    
      function handleDragEnd(e) {
        if (isCloserToRightEdge(e)) {
          setIsOn(true);
        } else {
          setIsOn(false);
        }
      }
    
      // ...
    }
    ```
    
    ⇒ 먼저 `Toggle`이 state를 업데이트하고, React가 화면을 업데이트합니다. 그런 다음 React는 부모 컴포넌트로부터 전달받은 `onChange` 함수를 호출하는 Effect를 실행합니다. 이제 부모 컴포넌트가 자신의 state를 업데이트하고, 다른 렌더 패스를 실행합니다. 이보다는, 모든 것을 단일 명령 안에서 처리하는 것이 더 좋습니다.
    
    - correct case
        
        ⇒ Effect를 삭제하고, 대신 동일한 이벤트 핸들러 내에서 *두* 컴포넌트의 state를 업데이트 
        
    
    ```jsx
    function Toggle({ onChange }) {
      const [isOn, setIsOn] = useState(false);
    	
      function updateToggle(nextIsOn) {
        // ✅ Good: Perform all updates during the event that caused them
        // ✅ 좋습니다: 이벤트 발생시 모든 업데이트를 수행
        setIsOn(nextIsOn);
        onChange(nextIsOn);
      }
    
      function handleClick() {
        updateToggle(!isOn);
      }
    
      function handleDragEnd(e) {
        if (isCloserToRightEdge(e)) {
          updateToggle(true);
        } else {
          updateToggle(false);
        }
      }
    
      // ...
    }
    ```
    
    - correct case 2
    
    ```jsx
    // ✅ Also good: the component is fully controlled by its parent
    // ✅ 좋습니다: 부모 컴포넌트에 의해 완전히 제어됨
    function Toggle({ isOn, onChange }) {
      function handleClick() {
        onChange(!isOn);
      }
    
      function handleDragEnd(e) {
        if (isCloserToRightEdge(e)) {
          onChange(true);
        } else {
          onChange(false);
        }
      }
    
      // ...
    }
    ```
    

11. **Passing data to the parent**
    - bad case
    
    ```jsx
    function Parent() {
      const [data, setData] = useState(null);
      // ...
      return <Child onFetched={setData} />;
    }
    
    function Child({ onFetched }) {
      const data = useSomeAPI();
      // 🔴 Avoid: Passing data to the parent in an Effect
      // 🔴 이러지 마세요: Effect에서 부모에게 데이터 전달
      useEffect(() => {
        if (data) {
          onFetched(data);
        }
      }, [onFetched, data]);
      // ...
    ```
    
    ⇒ React에서 데이터는 부모 컴포넌트에서 자식 컴포넌트로 흐릅니다. 화면에 뭔가 잘못된 것이 보이면, 컴포넌트 체인을 따라 올라가서 어떤 컴포넌트가 잘못된 prop을 전달하거나 잘못된 state를 가지고 있는지 찾아냄으로써 정보의 출처를 추적할 수 있습니다. 자식 컴포넌트가 Effect에서 부모 컴포넌트의 state를 업데이트하면, 데이터 흐름을 추적하기가 매우 어려워집니다. 자식과 부모 컴포넌트 모두 동일한 데이터가 필요하므로, 대신 부모 컴포넌트가 해당 데이터를 페치해서 자식에게 *전달하도록 수정*
    
    - correct case
    
    ```jsx
    function Parent() {
      const data = useSomeAPI();
      // ...
      // ✅ Good: Passing data down to the child
      // ✅ 좋습니다: 자식에게 데이터 전달
      return <Child data={data} />;
    }
    
    function Child({ data }) {
      // ...
    }
    ```
    

12. **Subscribing to an external store**
    
    ⇒ 이 훅은 처음 봤다.. 나중에 자세하게 한번 더 읽어봐야 겠다.
    
    ⇒ 때로는 컴포넌트가 React state 외부의 일부 데이터를 구독해야 할 수도 있습니다. 서드파티 라이브러리나 브라우저 빌트인 API에서 데이터를 가져와야 할 수도 있습니다. 이 데이터는 React가 모르는 사이에 변경될 수도 있는데, 그럴 땐 수동으로 컴포넌트가 해당 데이터를 구독하도록 해야 합니다. 이 작업은 종종 Effect에서 수행합니다.
    
    ```jsx
    function useOnlineStatus() {
      // Not ideal: Manual store subscription in an Effect
      // 이상적이지 않음: Effect에서 수동으로 store 구독
      const [isOnline, setIsOnline] = useState(true);
      useEffect(() => {
        function updateState() {
          setIsOnline(navigator.onLine);
        }
    
        updateState();
    
        window.addEventListener('online', updateState);
        window.addEventListener('offline', updateState);
        return () => {
          window.removeEventListener('online', updateState);
          window.removeEventListener('offline', updateState);
        };
      }, []);
      return isOnline;
    }
    
    function ChatIndicator() {
      const isOnline = useOnlineStatus();
      // ...
    }
    ```
    
    ⇒ 여기서 컴포넌트는 외부 데이터 저장소(이 경우 브라우저 `navigator.onLine` API)에 구독합니다. 이 API는 서버에 존재하지 않으므로(따라서 초기 HTML을 생성하는 데 사용할 수 없으므로) 처음에는 state가 `true`로 설정됩니다. 브라우저에서 해당 데이터 저장소의 값이 변경될 때마다 컴포넌트는 해당 state를 업데이트합니다.
    
    ⇒ 이를 위해 Effect를 사용하는 것이 일반적이지만, React에는 외부 저장소를 구독하기 위해 특별히 제작된 훅이 있습니다. Effect를 삭제하고 `[useSyncExternalStore](https://react-ko.dev/reference/react/useSyncExternalStore)`호출로 대체하세요:
    
    ```jsx
    function subscribe(callback) {
      window.addEventListener('online', callback);
      window.addEventListener('offline', callback);
      return () => {
        window.removeEventListener('online', callback);
        window.removeEventListener('offline', callback);
      };
    }
    
    function useOnlineStatus() {
      // ✅ Good: Subscribing to an external store with a built-in Hook
      // ✅ 좋습니다: 빌트인 훅에서 외부 store 구독
      return useSyncExternalStore(
        subscribe, // React won't resubscribe for as long as you pass the same function
                   // React는 동일한 함수를 전달하는 한 다시 구독하지 않음
        () => navigator.onLine, // How to get the value on the client
                                // 클라이언트에서 값을 가져오는 방법
        () => true // How to get the value on the server
                   // 서버에서 값을 가져오는 방법
      );
    }
    
    function ChatIndicator() {
      const isOnline = useOnlineStatus();
      // ...
    }
    ```
    

13. **Fetching data**
    - bad case
    
    ```jsx
    function SearchResults({ query }) {
      const [results, setResults] = useState([]);
      const [page, setPage] = useState(1);
    
      useEffect(() => {
        // 🔴 Avoid: Fetching without cleanup logic
        // 🔴 이러지 마세요: 클린업 없이 fetch 수행
        fetchResults(query, page).then(json => {
          setResults(json);
        });
      }, [query, page]);
    
      function handleNextPageClick() {
        setPage(page + 1);
      }
      // ...
    }
    ```
    
    ⇒ 이벤트 핸들러에 로직을 넣어야 했던 앞선 예제와 모순되는 것처럼 보일 수 있습니다! 하지만 페치해야 하는 주된 이유가 *타이핑 이벤트*가 아니라는 점을 생각해 보세요. 검색 입력은 URL에 미리 채워져 있는 경우가 많으며, 사용자는 input을 건드리지 않고도 앞뒤로 탐색할 수 있습니다.
    
    ⇒ `page`와 `query`가 어디에서 오는지는 중요하지 않습니다. 이 컴포넌트가 표시되는 동안 현재의 `page` 및 `query`에 대한 네트워크의 데이터와 `results`의 [동기화](https://react-ko.dev/learn/synchronizing-with-effects)가 유지되면 됩니다. 이것이 Effect인 이유입니다.
    
    ⇒ 다만 위 코드에는 버그가 있습니다. `"hello"`를 빠르게 입력한다고 합시다. 그러면 `query`가 `"h"`에서 `"he"`, `"hel"`, `"hell"`, `"hello"`로 변경됩니다. 이렇게 하면 각각 페칭을 수행하지만, 어떤 순서로 응답이 도착할지는 보장할 수 없습니다. 예를 들어, `"hell"` 응답은 `"hello"` 응답 *이후*에 도착할 수 있습니다. 이에 따라 마지막에 호출된 `setResults()`로부터 잘못된 검색 결과가 표시될 수 있습니다. 이를 [“경쟁 조건”](https://en.wikipedia.org/wiki/Race_condition)이라고 합니다. 서로 다른 두 요청이 서로 “경쟁”하여 예상과 다른 순서로 도착한 경우입니다
    
    ⇒ **경쟁 조건을 수정하기 위해서는 오래된 응답을 무시하도록 [클린업 함수를 추가](https://react-ko.dev/learn/synchronizing-with-effects#fetching-data)해야 합니다.**
    
    - correct case
    
    ```jsx
    function SearchResults({ query }) {
      const [results, setResults] = useState([]);
      const [page, setPage] = useState(1);
      useEffect(() => {
        let ignore = false;
        fetchResults(query, page).then(json => {
          if (!ignore) {
            setResults(json);
          }
        });
        return () => {
          ignore = true;
        };
      }, [query, page]);
    
      function handleNextPageClick() {
        setPage(page + 1);
      }
      // ...
    }
    ```
    
    ⇒ 데이터 페칭을 구현할 때 경합 조건 이외에도, 응답을 캐시하는 방법(사용자가 Back을 클릭하고면 스피너 대신 이전 화면을 즉시 볼 수 있도록), 서버에서 페치하는 방법(초기 서버 렌더링 HTML에 스피너 대신 가져온 콘텐츠가 포함되도록), 네트워크 워터폴을 피하는 방법(데이터를 페치해야 하는 하위 컴포넌트가 시작하기 전에 위의 모든 부모가 데이터 페치를 완료할 때까지 기다릴 필요가 없도록) 등도 고려해볼 사항입니다.
    
    ⇒ **이런 문제는 React뿐만 아니라 모든 UI 라이브러리에 적용됩니다. 이러한 문제를 해결하는 것은 간단하지 않기 때문에 최신 [프레임워크](https://react-ko.dev/learn/start-a-new-react-project#building-with-a-full-featured-framework)들은 컴포넌트에서 직접 Effect를 작성하는 것보다 더 효율적인 빌트인 데이터 페칭 메커니즘을 제공합니다.**
    
    ⇒ 프레임워크를 사용하지 않고(또한 직접 만들고 싶지 않고) Effect에서 만들고 싶다면, 다음 예시처럼 페칭 로직을 커스텀 훅으로 추출하는 것을 고려해 보세요:
    
    ```jsx
    function SearchResults({ query }) {
      const [page, setPage] = useState(1);
      const params = new URLSearchParams({ query, page });
      const results = useData(`/api/search?${params}`);
    
      function handleNextPageClick() {
        setPage(page + 1);
      }
      // ...
    }
    
    function useData(url) {
      const [data, setData] = useState(null);
      useEffect(() => {
        let ignore = false;
        fetch(url)
          .then(response => response.json())
          .then(json => {
            if (!ignore) {
              setData(json);
            }
          });
        return () => {
          ignore = true;
        };
      }, [url]);
      return data;
    }
    ```
    

---

### Summary

- 렌더링 중에 처리가능하다면 useEffect를 사용할 필요 없다.
- 비용이 많이 드는 계산을 캐시하려면 useMemo를 사용하자.
- 전체 컴포넌트 트리의 state를 재설정하고 싶을 때는 key값을 사용하자.
- prop 변경에 대한 응답으로 특정 state 일부를 조정하려면 렌더링 중에 설정하자.
- **컴포넌트가 *표시*되었기 때문에 실행해야 하는 코드는 Effect에 있어야 하고, 나머지는 이벤트에 있어야 한다.**
- 여러 컴포넌트의 state를 업데이트해야 하는 경우 단일 이벤트에서 처리하는 것이 좋다.
- 여러 컴포넌트에서 state 변수를 동기화하려고 할 때마다 state 끌어올리기를 고려하세요.
- Effect로 데이터를 페치할 수 있지만, 경쟁 조건을 피하기 위해 클린업 로직을 구현해야 한다.

```jsx
생각보다 많은 예시와 사용규칙들이 있다. 예시들을 살펴보면서 그동안 useEffect를 남용해온 것을 체감할 수 있었다.. 공식문서 파트가 끝나면 useState와 useEffect의 원리와 사용 규칙에 대해 다시 정리해 보겠습니다.
```