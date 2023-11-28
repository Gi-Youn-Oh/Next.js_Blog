# React-deep-dive-3

### State update

- 기초적인 내용이지만 복습차원에서 다시 간단하게 확인하고 넘어가자.

In JavaScript, arrays are just another kind of object. [Like with objects](https://react-ko.dev/learn/updating-objects-in-state), **you should treat arrays in React state as read-only.** This means that you shouldn’t reassign items inside an array like `arr[0] = 'bird'`, and you also shouldn’t use methods that mutate the array, such as `push()` and `pop()`.

- **React state의 배열은 읽기 전용으로 취급해야 합니다.**
    
    ⇒ 왜 그래야 하는지 우리는 알고 있다. react의 state는 snapshot으로 각각 기록되기 때문에 직접 수정해선 안되고 새 객체를 만들어서 각각의 snapshot을 갖도록 해야한다. (React가 확인 할 수 있도록 해야 한다.)
    

Here is a reference table of common array operations. When dealing with arrays inside React state, you will need to avoid the methods in the left column, and instead prefer the methods in the right column:

- React에서 권장하는 메서드들

|  | avoid (mutates the array)비추천 (배열 직접 변이) | prefer (returns a new array)추천 (새 배열 반환) |
| --- | --- | --- |
| adding추가 | push, unshift | concat, [...arr] spread syntax (https://react-ko.dev/learn/updating-arrays-in-state#adding-to-an-array) |
| removing삭제 | pop, shift, splice | filter, slice (https://react-ko.dev/learn/updating-arrays-in-state#removing-from-an-array) |
| replacing교체 | splice, arr[i] = ... assignment | map (https://react-ko.dev/learn/updating-arrays-in-state#replacing-items-in-an-array) |
| sorting정렬 | reverse, sort | copy the array first (https://react-ko.dev/learn/updating-arrays-in-state#making-other-changes-to-an-array)배열을 복사한 다음 처리 |

---

## Managing State

### **How declarative UI compares to imperative**

In React, you don’t directly manipulate the UI—meaning you don’t enable, disable, show, or hide components directly. Instead, you **declare what you want to show,** and React figures out how to update the UI

- 명령형 프로그래밍과 달리 표시할 내용을 선언하면 React가 UI를 알아서 업데이트 해준다.

**Step 1: Identify your component’s different visual states**

- **비어있음**: form의 “Submit”버튼은 비활성화되어 있습니다.
- **입력중**: form의 “Submit”버튼이 활성화되어 있습니다.
- **제출중**: form은 완전히 비활성화되어있고 Spinner가 표시됩니다.
- **성공시**: form 대신 “Thank you”메세지가 표시됩니다.
- **실패시**: ‘입력중’ 상태와 동일하지만 추가로 오류 메세지가 표시됩니다.

```jsx
export default function Form({
  // Try 'submitting', 'error', 'success':
  status = 'empty'
}) {
  if (status === 'success') {
    return <h1>That's right!</h1>
  }
  return (
    <>
      <h2>City quiz</h2>
      <p>
        In which city is there a billboard that turns air into drinkable water?
      </p>
      <form>
        <textarea disabled={
          status === 'submitting'
        } />
        <br />
        <button disabled={
          status === 'empty' ||
          status === 'submitting'
        }>
          Submit
        </button>
        {status === 'error' &&
          <p className="Error">
            Good guess but a wrong answer. Try again!
          </p>
        }
      </form>
      </>
  );
}
```

⇒ React에서는 이와같이 시각적 상태를 통해 알아서 update해주지만 명령형은 show(), hide(), disable() 등의 함수를 명시적으로 적고 실행시켜주어야 한다.

**Step 2: Determine what triggers those state changes**

1. **사람의 입력** : 버튼 클릭, 필드 입력, 링크 이동 등
2. **컴퓨터의 입력** : 네트워크에서 응답 도착, 시간 초과, 이미지 로딩 등

In both cases, **you must set [state variables](https://react-ko.dev/learn/state-a-components-memory#anatomy-of-usestate) to update the UI.**

- 두 경우 모두 **[state 변수](https://react-ko.dev/learn/state-a-components-memory#anatomy-of-usestate)를 설정해야 UI를 업데이트할 수 있습니다.**
    - **text 입력을 변경**(사람)하면 text box가 비어있는지 여부에 따라 *비어있음* state에서 입력중 state로, 또는 그 반대로 전환해야합니다.
    - **제출 버튼을 클릭**(사람)하면 *제출중* state로 전환해야합니다.
    - 네트워크 응답 성공(컴퓨터)시 *성공* state로 전환해야 합니다.
    - 네트워크 요청 실패(컴퓨터)시 일치하는 오류 메세지와 함께 *오류* state로 전환해야 합니다.

![image](https://github.com/Gi-Youn-Oh/Next.js_Blog/assets/109953972/d0de5a3a-3769-4602-b9d0-c84b5981ccdb)


```jsx
import { useState } from 'react';

export default function Form() {
  const [answer, setAnswer] = useState('');
  const [error, setError] = useState(null);
  const [status, setStatus] = useState('typing');

  if (status === 'success') {
    return <h1>That's right!</h1>
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus('submitting');
    try {
      await submitForm(answer);
      setStatus('success');
    } catch (err) {
      setStatus('typing');
      setError(err);
    }
  }

  function handleTextareaChange(e) {
    setAnswer(e.target.value);
  }

  return (
    <>
      <h2>City quiz</h2>
      <p>
        In which city is there a billboard that turns air into drinkable water?
      </p>
      <form onSubmit={handleSubmit}>
        <textarea
          value={answer}
          onChange={handleTextareaChange}
          disabled={status === 'submitting'}
        />
        <br />
        <button disabled={
          answer.length === 0 ||
          status === 'submitting'
        }>
          Submit
        </button>
        {error !== null &&
          <p className="Error">
            {error.message}
          </p>
        }
      </form>
    </>
  );
}

function submitForm(answer) {
  // Pretend it's hitting the network.
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      let shouldError = answer.toLowerCase() !== 'lima'
      if (shouldError) {
        reject(new Error('Good guess but a wrong answer. Try again!'));
      } else {
        resolve();
      }
    }, 1500);
  });
}
```

### Summary

- 선언형 프로그래밍은 UI를 세밀하게 관리(명령형)하지 않고 각 시각적 상태에 대해 UI를 기술하는 것을 의미
- **컴포넌트를 개발할 때**
    1. 모든 시각적 상태를 확인
    2. 사람 및 컴퓨터가 상태 변화를 촉발하는 요인 확인
    3. `useState`로 상태를 모델링하세요.
    4. 모든 state 선언 → 불필요하거나 중복된 state 삭제
    5. 이벤트 핸들러를 연결하여 state를 설정
    

---

### **Sharing State Between Components**

Sometimes, you want the state of two components to always change together. To do it, remove state from both of them, move it to their closest common parent, and then pass it down to them via props. This is known as *lifting state up,* and it’s one of the most common things you will do writing React code.

- 두 컴포넌트의 state를 함께 변경하고 싶다면 부모컴포넌트로 state를 끌어 올린다.
    
    ⇒ React를 사용하면서 아주 자주 맞이하는 상황이지만, 컴포넌트를 분리하고 상태를 관리하는 측면에서 한번 더 고민해볼 필요가 있다.
    

**Controlled and uncontrolled components (제어 컴포넌트 vs 비제어 컴포넌트)**

- 보통 생각하는 개념은 다음과 같다.

```jsx
1. 제어 컴포넌트 (Controlled Component):
상태를 관리하는 컴포넌트: 제어 컴포넌트는 React의 상태(State)를 사용하여 컴포넌트의 상태를 관리합니다.

값과 상태 간의 동기화: 사용자 입력과 컴포넌트의 상태가 항상 동기화되어 있습니다. 사용자가 입력 필드에 값을 입력하면, 해당 값은 컴포넌트의 상태에 의해 제어됩니다.

onChange 이벤트 핸들러 사용: 사용자의 입력을 감지하기 위해 주로 onChange 이벤트 핸들러를 사용합니다.

2. 비제어 컴포넌트 (Uncontrolled Component):
상태를 직접적으로 관리하지 않음: 비제어 컴포넌트는 React의 상태를 사용하여 값의 상태를 관리하지 않습니다.

ref를 사용한 직접 접근: 사용자 입력 필드에 대한 접근을 직접적으로 ref를 사용하여 수행하며, 상태 변화를 직접적으로 추적하지 않습니다.

일반적으로 초기값만 설정하고 그 이후 상태를 신경쓰지 않음: 초기값을 설정하고 그 이후에는 React에 의해 직접 관리되지 않습니다.
```

- 컴포넌트 하나만 단일로 보았을 때 내부적으로는 위와 같겠지만, 부모 자식간의 컴포넌트 구조에서는 컴포넌트를 (props에 의해) “제어”할 지 (state에 의해) “비제어”할지 로 나뉜다.
- 제어 vs 비제어는 공식 명칭이 아니라 하나의 용어일 뿐이니 혼동하지 말도록 하자.

### Summary

- 두 컴포넌트를 조정하려면 해당 컴포넌트의 state를 공통 부모로 이동시킨다.
- 그런 다음 공통 부모로부터 props를 통해 정보를 전달한다.
- 마지막으로 이벤트 핸들러를 전달하여 자식이 부모의 state를 변경할 수 있도록 합니다.
- 컴포넌트를 (props에 의해) “제어”할 지 (state에 의해) “비제어”할지 고려해 보아야 한다.

### **Extracting State Logic into a Reducer**

Each of its event handlers calls `setTasks` in order to update the state. As this component grows, so does the amount of state logic sprinkled throughout it. To reduce this complexity and keep all your logic in one easy-to-access place, you can move that state logic into a single function outside your component, **called a “reducer”.**

- State가 많아지다 보면 한눈에 파악하기 어려워질 수 있다.
- 외부에 reducer를 두고 처리하도록 분리한다.

Managing state with reducers is slightly different from directly setting state. Instead of telling React “what to do” by setting state, you specify “what the user just did” by dispatching “actions” from your event handlers. (The state update logic will live elsewhere!) So instead of “setting `tasks`” via an event handler, you’re dispatching an “added/changed/deleted a task” action. This is more descriptive of the user’s intent.

- reducer를 사용한 state 관리는 state를 직접 설정하는 것이 아니다.
    
    ⇒ state를 설정하여 React에게 “무엇을 할 지”를 지시하는 대신, 이벤트 핸들러에서 “action” 객체를 전달하여 “사용자가 방금 한 일”을 지정합니다. (action은 객체일 뿐 함수가 아니다.)
    
- (state 업데이트 로직은 다른 곳에 있습니다!) 즉, 이벤트 핸들러를 통해 ”`tasks`를 설정”하는 대신 “task를 추가/변경/삭제”하는 action을 전달하는 것입니다.

**Example**

```jsx
import { useState } from 'react';
import AddTask from './AddTask.js';
import TaskList from './TaskList.js';

export default function TaskApp() {
  const [tasks, setTasks] = useState(initialTasks);

  function handleAddTask(text) {
    setTasks([
      ...tasks,
      {
        id: nextId++,
        text: text,
        done: false,
      },
    ]);
  }

  function handleChangeTask(task) {
    setTasks(
      tasks.map((t) => {
        if (t.id === task.id) {
          return task;
        } else {
          return t;
        }
      })
    );
  }

  function handleDeleteTask(taskId) {
    setTasks(tasks.filter((t) => t.id !== taskId));
  }

  return (
    <>
      <h1>Prague itinerary</h1>
      <AddTask onAddTask={handleAddTask} />
      <TaskList
        tasks={tasks}
        onChangeTask={handleChangeTask}
        onDeleteTask={handleDeleteTask}
      />
    </>
  );
}

let nextId = 3;
const initialTasks = [
  {id: 0, text: 'Visit Kafka Museum', done: true},
  {id: 1, text: 'Watch a puppet show', done: false},
  {id: 2, text: 'Lennon Wall pic', done: false},
];
```

1. state를 설정하는 것에서 action들을 전달하는 것으로 **변경**하기

```jsx
  function handleAddTask(text) {
    setTasks([
      ...tasks,
      {
        id: nextId++,
        text: text,
        done: false,
      },
    ]);
  }

  function handleChangeTask(task) {
    setTasks(
      tasks.map((t) => {
        if (t.id === task.id) {
          return task;
        } else {
          return t;
        }
      })
    );
  }

  function handleDeleteTask(taskId) {
    setTasks(tasks.filter((t) => t.id !== taskId));
  }
```

```jsx
function handleAddTask(text) {
  dispatch({
    type: 'added',
    id: nextId++,
    text: text,
	});
}

function handleChangeTask(task) {
  dispatch({
    type: 'changed',
    task: task,
  });
}

function handleDeleteTask(taskId) {
  dispatch({
    type: 'deleted',
    id: taskId,
  });
}

```

2. reducer 함수 **작성**하기
    - 현재의 state(`tasks`)를 첫 번째 매개변수로 선언하세요.
    - `action` 객체를 두 번째 매개변수로 선언하세요.
    - *다음* state를 reducer 함수에서 반환하세요. (React가 state로 설정할 것입니다.)

```jsx
function tasksReducer(tasks, action) {
  switch (action.type) {
    case 'added': {
      return [
        ...tasks,
        {
          id: action.id,
          text: action.text,
          done: false,
        },
      ];
    }
    case 'changed': {
      return tasks.map((t) => {
        if (t.id === action.task.id) {
          return action.task;
        } else {
          return t;
        }
      });
    }
    case 'deleted': {
      return tasks.filter((t) => t.id !== action.id);
    }
    default: {
      throw Error('Unknown action: ' + action.type);
    }
  }
}
```

3. 컴포넌트에서 reducer **사용**하기

App.js

```jsx
import { useReducer } from 'react';
import AddTask from './AddTask.js';
import TaskList from './TaskList.js';
import tasksReducer from './tasksReducer.js';

export default function TaskApp() {
  const [tasks, dispatch] = useReducer(tasksReducer, initialTasks);

  function handleAddTask(text) {
    dispatch({
      type: 'added',
      id: nextId++,
      text: text,
    });
  }

  function handleChangeTask(task) {
    dispatch({
      type: 'changed',
      task: task,
    });
  }

  function handleDeleteTask(taskId) {
    dispatch({
      type: 'deleted',
      id: taskId,
    });
  }

  return (
    <>
      <h1>Prague itinerary</h1>
      <AddTask onAddTask={handleAddTask} />
      <TaskList
        tasks={tasks}
        onChangeTask={handleChangeTask}
        onDeleteTask={handleDeleteTask}
      />
    </>
  );
}

let nextId = 3;
const initialTasks = [
  {id: 0, text: 'Visit Kafka Museum', done: true},
  {id: 1, text: 'Watch a puppet show', done: false},
  {id: 2, text: 'Lennon Wall pic', done: false},
];
```

tasksReducer.js

```jsx
export default function tasksReducer(tasks, action) {
  switch (action.type) {
    case 'added': {
      return [
        ...tasks,
        {
          id: action.id,
          text: action.text,
          done: false,
        },
      ];
    }
    case 'changed': {
      return tasks.map((t) => {
        if (t.id === action.task.id) {
          return action.task;
        } else {
          return t;
        }
      });
    }
    case 'deleted': {
      return tasks.filter((t) => t.id !== action.id);
    }
    default: {
      throw Error('Unknown action: ' + action.type);
    }
  }
}
```

### useState - end -

- 여기까지 useState 내용을 마무리 하고 다음에는 useEffect에 대해 파헤쳐 보려합니다.
- 공식문서를 찾아보면서 기초 예제를 굳이 다시 돌아본 이유는 스스로에게 당신은 과연 리액트의 기본적인 원칙을 지키며 효율적으로 설계를 하고 있습니까? 라고 물어본다면 100%라고 절대 답을 못할 것 같다.
- 이제는 useState는 어떤 원리로 작동하는지, 리액트는 어떻게 상태 변화를 감지 하는지, 상태는 어떻게 관리해야 좋은지, 효율적인 렌더링을 위해서는 어떻게 컴포넌트를 구성해야 하는지  대답할 수 있을 것이다.
- 헷갈리거나 까먹을 때 마다 위 내용을 돌아보며 기초부터 탄탄히 코드를 작성해나가고자 기본적인 부분까지 돌아보았습니다.