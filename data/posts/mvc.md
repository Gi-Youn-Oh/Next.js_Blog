### 디자인 패턴

- 프로그램이나 어떤 특정한 것을 개발하는 중에 발생했던 문제점들을 정리해서 상황에 따라 간편하게 적용해서 쓸 수 있는 것을 정리하여 특정한 "규약"을 통해 쉽게 쓸 수 있는 형태로 만든 것을 말합니다.

## 정의

- MVC란 **M**odel-**V**iew-**C**ontroller의 약자로 애플리케이션을 세 가지 역할로 구분한 개발 방법론입니다. 아래의 그림처럼 사용자가 Controller를 조작하면 Controller는 Model을 통해 데이터를 가져오고 그 데이터를 바탕으로 View를 통해 시각적 표현을 제어하여 사용자에게 전달하게 됩니다.
- 이러한 패턴을 성공적으로 사용하면, 사용자 인터페이스로부터 비즈니스 로직을 분리하여 애플리케이션의 시작적 요소나 그 이면에서 실행되는 비즈니스 로직을 서로 영향 없이 쉽게 고칠 수 있는 애플리케이션을 만들 수 있게 됩니다

## 왜?

- **비즈니스 로직과 UI로직을 분리하여 유지보수를 독립적으로 수행가능**
- **Model과 View가 다른 컴포넌트들에 종속되지 않아 애플리케이션의 확장성, 유연성에 유리함**
- **중복 코딩의 문제점 제거**

1. **Model (객체)**
- Data와 관련된 일을 하는 곳
1. **View (출력)**
- 사용자한테 보여지는 부분
1. **Controller (처리)**
- View 와  Model의 중개자 역할

![image](https://user-images.githubusercontent.com/109953972/224471592-832c1b69-46cb-48ef-8a69-ac361a2bae2e.png)

```jsx
사용자가 웹사이트에 접속 (Users)
Controller는 사용자가 요청한 웹페이지를 서비스하기 위해서 모델을 호출 (Manipulates)
Model은 데이터베이스나 파일과 같은 데이터 소스를 제어한 후 그 결과를 Return
Controller는 Model이 리턴한 결과를 View에 반영 (Updates)
데이터가 반영된 View는 사용자에게 보여짐 (Sees)
```

## 사용방법

1. Model은 Controller와 View에 의존하지 않아야 한다. (Model 내부에 Controller와 View에 관련된 코드가 있으면 안된다.)

```jsx
Public class Student {
	private String name;
	private int age;

	public Student(String name, int age){
		this.name = name;
		this.age = age;
	}
	
	public String getName() {
		return name;
	}

	public int getAge() {
		return age;
	}
}
```

1. View는 Model에만 의존해야 하고, Controller에는 의존하면 안 된다. (View내부에 Model의 코드만 있을 수 있고, Controller의 코드가 있으면 안 된다. )

```jsx
public class OutputView {
	public void printProfile(Student student) {
		System.out.println(
				"내 이름은" + student.getName() + "입니다.");
		System.out.println(
				"내 나이는" + student.getAge() + "입니다.");
	}
}
```

Student 는 Model에 관련된 코드

1. View가 Model로부터 데이터를 받을 때는, 사용자마다 다르게 보여주어야 하는 데이터에 대해서만 받아야 한다.

![image](https://user-images.githubusercontent.com/109953972/224471619-1708741a-5fe0-45fb-996a-97f94241a1f9.png)

![image](https://user-images.githubusercontent.com/109953972/224471626-ff50f36e-689f-4b2e-b25c-5609dfe52b94.png)

1. Controller는 Model과 View에 의존해도 된다. (Controller 내부에는 Model과 View의 코드가 있을 수 있다.)

```jsx
public class Controller {
	public static void main(String[] args) {
		Student student = new Student("기철", 25);
		OutputView.printProfile(student);
	}
}
```

1. View가 Model로부터 데이터를 받을 때, 반드시 Controller에서 받아야 한다.

## 추가 관점

- 프론트엔드는 View가 굉장히 많고 Model과의 interaction도 많다.
- 예를 들면 사용자 입력 값을 받아서 Model (data)를 변경하거나 주기적으로 data update를 통해 View를 변경하거나
- 이렇게 되면 View와 Model을 연결해주는 Controller의 부하가 심해진다.
- React에서도 초기에 MVC패턴을 사용했으나 이러한 문제점들을 해결하기 위해 Flux 패턴을 사용하게 되었다. (Redux, Recoil등)
- MVVM 패턴 (양방향 데이터 바인딩 View - ViewModel - View) Vue.js

![image](https://user-images.githubusercontent.com/109953972/224471666-75f20cce-911d-4dc1-87a3-cec5d1a148a6.png)

![image](https://user-images.githubusercontent.com/109953972/224471676-e414255d-f6d2-4508-85ef-15ccf6a63bcc.png)

![image](https://user-images.githubusercontent.com/109953972/224471683-94618fe5-cc0d-46f1-8d3d-fc37cb0db2b0.png)

![image](https://user-images.githubusercontent.com/109953972/224471686-286f364d-2179-42ee-b29e-83d4a68dca4a.png)