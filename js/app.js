/* Owns student-facing screens and hands lesson execution to LessonEngine. */
(function () {
  const root = document.getElementById("student-flow");
  const roster = new SubDay.Roster(SubDay.Classes);
  const progress = new SubDay.Progress();
  const testMode = new URLSearchParams(window.location.search).get("test") === "1";
  let selectedClass = null;
  let selectedStudent = null;

  function showClassPicker() {
    root.innerHTML = `<section class="flow-screen"><p class="eyebrow">Sub Day Computer Lab</p><h1>Choose your class</h1><p class="prompt">Tap your classroom.</p><div class="class-list" id="class-list"></div></section>`;
    const list = root.querySelector("#class-list");
    roster.getClasses().forEach((classroom) => {
      const button = document.createElement("button");
      button.className = "pick-button";
      button.type = "button";
      button.textContent = classroom.name;
      button.addEventListener("click", () => { selectedClass = classroom; showNamePicker(); });
      list.append(button);
    });
  }

  function showNamePicker() {
    root.innerHTML = `<section class="flow-screen"><p class="eyebrow">${selectedClass.name}</p><h1>Find your name</h1><p class="prompt">Tap your name.</p><div class="name-grid" id="name-grid"></div><a class="back-link" href="#" id="class-back">Back to classes</a></section>`;
    root.querySelector("#class-back").addEventListener("click", (event) => { event.preventDefault(); showClassPicker(); });
    const grid = root.querySelector("#name-grid");
    roster.getStudents(selectedClass.id).forEach((student) => {
      const button = document.createElement("button");
      button.className = "pick-button";
      button.type = "button";
      button.textContent = student.name;
      button.addEventListener("click", () => { selectedStudent = student; showConfirmation(); });
      grid.append(button);
    });
  }

  function showConfirmation() {
    root.innerHTML = `<section class="flow-screen"><p class="eyebrow">Check your name</p><h1>Are you <span class="welcome-name"></span>?</h1><div class="choice-row"><button class="pick-button confirm-yes" id="confirm-yes" type="button">YES</button><button class="pick-button go-back" id="confirm-back" type="button">GO BACK</button></div></section>`;
    root.querySelector(".welcome-name").textContent = selectedStudent.name;
    root.querySelector("#confirm-yes").addEventListener("click", showWelcome);
    root.querySelector("#confirm-back").addEventListener("click", showNamePicker);
  }

  function showWelcome() {
    progress.startSession(selectedClass, selectedStudent);
    root.innerHTML = `<section class="flow-screen"><p class="welcome-mark" aria-hidden="true">&#9733;</p><p class="eyebrow">You're ready</p><h1>Hi, <span class="welcome-name"></span>!</h1><p class="prompt">Let's go on an adventure.</p><button class="button button-student" id="start-lesson" type="button">Start</button></section>`;
    root.querySelector(".welcome-name").textContent = selectedStudent.name;
    root.querySelector("#start-lesson").addEventListener("click", startLesson);
  }

  function startLesson() {
    const lesson = SubDay.Lessons.find((item) => item.id === "k1-computer-adventure");
    root.innerHTML = `<section class="lesson-screen"><header class="lesson-header"><div class="lesson-title-group"><h1></h1>${testMode ? '<span class="test-mode-label">TEST MODE</span>' : ""}</div><span class="lesson-progress" id="lesson-progress"></span></header><div class="progress-track" role="progressbar" aria-label="Lesson progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><div class="progress-fill" id="progress-fill"></div></div><div id="kid-guide-host"></div><div class="activity-mount" id="activity-mount"></div></section>`;
    root.querySelector(".lesson-header h1").textContent = lesson.title;

    const progressText = root.querySelector("#lesson-progress");
    const progressFill = root.querySelector("#progress-fill");
    const progressBar = root.querySelector("[role='progressbar']");
    const engine = new SubDay.LessonEngine({
      activities: SubDay.Activities,
      guideContainer: root.querySelector("#kid-guide-host"),
      testMode,
      onProgress: (state) => {
        const percent = state.total ? Math.round((state.completed / state.total) * 100) : 100;
        progressText.textContent = `${Math.min(state.current, state.total)} of ${state.total}`;
        progressFill.style.width = `${percent}%`;
        progressBar.setAttribute("aria-valuenow", String(percent));
      },
      onComplete: (summary) => {
        progress.completeLesson(lesson.id, summary);
        showFinish(summary.kidGuide);
      }
    });
    engine.load(lesson);
    engine.start(root.querySelector("#activity-mount"));
  }

  function showFinish(guide) {
    guide.say("Great job! You finished computer class. Take off your headphones and wait quietly for your teacher.");
    root.querySelector("#activity-mount").innerHTML = `<section class="lesson-finish"><p class="finish-mark" aria-hidden="true">&#9733;</p><p class="eyebrow">YOU DID IT!</p><h1>Computer Class Complete!</h1><p class="prompt">Take off your headphones.<br>Wait quietly for your teacher.</p></section>`;
    root.querySelector(".lesson-screen").classList.add("is-finished");
  }

  showClassPicker();
}());