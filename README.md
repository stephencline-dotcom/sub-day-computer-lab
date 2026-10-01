# Sub Day Computer Lab

A dependency-free browser application for a substitute computer lab. The student flow currently includes one complete Kindergarten K1 lesson.

## Run locally

From this directory, start a static server:

```sh
python3 -m http.server 8000
```

Then open [http://localhost:8000](http://localhost:8000). A local server is recommended because browser speech and browser security features work more consistently over HTTP than from a `file://` URL.

For developer testing with shortened K1 activity timing, open [http://localhost:8000/student.html?test=1](http://localhost:8000/student.html?test=1). The test badge appears only during this lesson session.

## K1 lesson

The lesson runs in this order: Star Catch, Five Senses Hunt, Nursery Rhyme Rescue, Alphabet Adventure, Five Senses Sort, and Teddy's School Adventure. Each activity has required core rounds and can offer extension rounds when its minimum active time has not elapsed.

Activity timing is configured in `data/lessons.js`. The K1 activity minimums total 34 minutes and the target windows total 35 minutes. The engine pauses active-time clocks when the browser tab is hidden. If core rounds finish early, extension rounds continue automatically; once the minimum has elapsed, the current extension is allowed to finish before the lesson advances. There is no student countdown or score. Brief transitions add a little time between activities.

The Kid Guide is created once by the Lesson Engine and remains visible across activities and transitions. It uses the preferred natural English voice when available, speaks each direction and success message, and provides a first visual hint after 9 seconds of inactivity, a second after another 9 seconds, then an activity demonstration after further inactivity. Pointer, click, keyboard, drag, and scroll interactions restart the hint sequence. Demonstrations highlight an action but never complete it.

## Architecture

- `index.html` is the simple Student/Teacher entry point.
- `student.html` hosts the class, student, confirmation, welcome, lesson, and finish screens. `js/app.js` controls the student flow; the Lesson Engine owns activity sequence, shared-guide lifecycle, timing, and transitions.
- `teacher.html` is a small placeholder entry for the future teacher experience; it has no roster-management or analytics features yet.
- `data/classes.js` keeps the demo roster; `data/lessons.js` keeps lesson order, timing, prompts, and picture/letter content.
- `js/activities/activity-base.js` provides core/extension completion hooks. `js/activities/k1-*.js` contains the six K1 activity implementations, and `k1-activity-utils.js` shares small visual helpers.
- `js/kid-guide.js` provides shared spoken directions, replay, inactivity hints, success messages, and non-completing demonstrations.
- `js/roster.js` is the roster access boundary; `js/progress.js` holds the current learner and timing summary in memory only.
- `css/` contains shared, student, teacher, and activity styles. `assets/images/` and `assets/sounds/` are reserved for later assets.

The demo Kindergarten roster remains available in `data/classes.js`. A manual roster-file importer and ClassLink connection are not implemented. Later, an importer can provide classes through the roster data boundary without changing the student page or lesson engine.

This build intentionally has no database, authentication, analytics, background roster syncing, or K2/First/Second Grade activities. Progress and elapsed-time summaries remain in the current page session only.