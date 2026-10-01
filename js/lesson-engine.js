/* Loads lesson definitions and runs their activity lists without page-specific transitions. */
(function () {
  const TEST_TIMING_OVERRIDES = {
    "star-catch": { minimumActiveSeconds: 15, targetActiveSeconds: 15 },
    "bee-garden-adventure": { minimumActiveSeconds: 40, targetActiveSeconds: 40 },
    "five-senses-mini-lesson": { minimumActiveSeconds: 30, targetActiveSeconds: 30 },
    "k1-practice-sprint": { minimumActiveSeconds: 45, targetActiveSeconds: 45 },
    "teddy-school-adventure": { minimumActiveSeconds: 60, targetActiveSeconds: 60 }
  };

  class ActiveClock {
    constructor() {
      this.elapsed = 0;
      this.startedAt = null;
      this.onVisibilityChange = () => {
        if (document.hidden) this.pause();
        else this.resume();
      };
      document.addEventListener("visibilitychange", this.onVisibilityChange);
      this.resume();
    }

    get seconds() {
      const running = this.startedAt === null ? 0 : performance.now() - this.startedAt;
      return (this.elapsed + running) / 1000;
    }

    pause() {
      if (this.startedAt === null) return;
      this.elapsed += performance.now() - this.startedAt;
      this.startedAt = null;
    }

    resume() {
      if (this.startedAt !== null || document.hidden) return;
      this.startedAt = performance.now();
    }

    destroy() {
      this.pause();
      document.removeEventListener("visibilitychange", this.onVisibilityChange);
    }
  }

  class LessonEngine {
    constructor(options) {
      this.activities = options.activities;
      this.onProgress = options.onProgress || function () {};
      this.onComplete = options.onComplete || function () {};
      this.guideContainer = options.guideContainer;
      this.testMode = options.testMode === true;
      this.transitionMs = options.transitionMs || 1400;
      this.lesson = null;
      this.currentIndex = 0;
      this.container = null;
      this.kidGuide = null;
      this.activeActivity = null;
      this.lessonClock = null;
      this.activityClock = null;
      this.activityDurations = [];
      this.transitionTimer = null;
      this.transitionResolve = null;
      this.finishingActivity = false;
      this.destroyed = false;
    }

    load(lesson) {
      if (!lesson || !Array.isArray(lesson.activities) || lesson.activities.length === 0) {
        throw new Error("A lesson must define at least one activity.");
      }
      this.lesson = this.testMode ? {
        ...lesson,
        activities: lesson.activities.map((activity) => ({
          ...activity,
          timing: {
            ...activity.timing,
            ...TEST_TIMING_OVERRIDES[activity.id]
          }
        }))
      } : lesson;
      this.currentIndex = 0;
    }

    start(container) {
      if (!this.lesson) throw new Error("Load a lesson before starting it.");
      this.container = container;
      this.kidGuide = new window.SubDay.KidGuide(this.guideContainer);
      this.lessonClock = new ActiveClock();
      this.runNext();
    }

    runNext() {
      if (this.destroyed) return;
      if (this.currentIndex >= this.lesson.activities.length) {
        this.container.replaceChildren();
        const activeSeconds = this.lessonClock.seconds;
        this.lessonClock.destroy();
        this.onProgress({
          current: this.lesson.activities.length,
          completed: this.lesson.activities.length,
          total: this.lesson.activities.length,
          activity: null
        });
        this.onComplete({ lesson: this.lesson, activeSeconds, activityDurations: this.activityDurations, kidGuide: this.kidGuide });
        return;
      }
      const definition = this.lesson.activities[this.currentIndex];
      const Activity = this.activities[definition.type];
      if (!Activity) throw new Error(`Unknown activity type: ${definition.type}`);
      this.container.replaceChildren();
      this.finishingActivity = false;
      this.activityClock = new ActiveClock();
      this.onProgress({ current: this.currentIndex + 1, completed: this.currentIndex, total: this.lesson.activities.length, activity: definition, activeSeconds: this.lessonClock.seconds });
      this.activeActivity = new Activity({
        definition,
        lessonContent: this.lesson.shared,
        container: this.container,
        kidGuide: this.kidGuide,
        onCoreComplete: () => this.handleCoreComplete(definition),
        onExtensionComplete: () => this.handleExtensionComplete(definition),
        onComplete: () => this.finishActivity(definition)
      });
      this.kidGuide.watchActivity(this.activeActivity.getGuideOptions());
      this.activeActivity.start();
    }

    handleCoreComplete(definition) {
      const timing = definition.timing || {};
      if (timing.allowExtensions && this.activityClock.seconds < (timing.minimumActiveSeconds || 0)) {
        this.startExtension(definition);
        return;
      }
      this.finishActivity(definition);
    }

    handleExtensionComplete(definition) {
      const timing = definition.timing || {};
      if (this.activityClock.seconds < (timing.minimumActiveSeconds || 0)) {
        this.startExtension(definition);
        return;
      }
      this.finishActivity(definition);
    }

    startExtension(definition) {
      this.activeActivity.extensionNumber += 1;
      this.activeActivity.extensionReported = false;
      this.activeActivity.startExtension({
        round: this.activeActivity.extensionNumber,
        elapsedSeconds: this.activityClock.seconds,
        minimumActiveSeconds: definition.timing.minimumActiveSeconds,
        targetActiveSeconds: definition.timing.targetActiveSeconds
      });
    }

    finishActivity(definition) {
      if (!this.activeActivity || this.finishingActivity) return;
      this.finishingActivity = true;
      const activity = this.activeActivity;
      Promise.resolve(activity.onActivityFinish()).then(() => {
        if (this.destroyed || this.activeActivity !== activity) return;
        activity.completed = true;
        activity.destroy();
        this.completeActivity(definition);
      }, () => {
        if (this.destroyed || this.activeActivity !== activity) return;
        activity.completed = true;
        activity.destroy();
        this.completeActivity(definition);
      });
    }

    completeActivity(definition) {
      this.kidGuide.stopWatchingActivity();
      const activeSeconds = this.activityClock.seconds;
      this.activityClock.destroy();
      this.activityDurations.push({
        id: definition.id,
        activeSeconds,
        targetActiveSeconds: definition.timing.targetActiveSeconds
      });
      this.activeActivity = null;
      this.currentIndex += 1;

      if (this.currentIndex >= this.lesson.activities.length) {
        this.runNext();
        return;
      }

      this.container.innerHTML = `<div class="lesson-transition"><span aria-hidden="true">&#9733;</span><p>Great job!<br>Next adventure!</p></div>`;
      if (window.SubDay.SoundFx) window.SubDay.SoundFx.transition();
      const transitionIndex = this.currentIndex;
      let speech;
      try {
        speech = this.kidGuide.sayAndWait("Great job! Next adventure!", { timeoutMs: 7000 });
      } catch (error) {
        speech = Promise.resolve();
      }
      const cardDelay = new Promise((resolve) => {
        this.transitionResolve = resolve;
        this.transitionTimer = window.setTimeout(() => {
          this.transitionTimer = null;
          this.transitionResolve = null;
          resolve();
        }, this.transitionMs);
      });
      Promise.all([Promise.resolve(speech).catch(() => {}), cardDelay]).then(() => {
        if (this.destroyed || this.currentIndex !== transitionIndex) return;
        this.runNext();
      });
    }

    destroy() {
      this.destroyed = true;
      window.clearTimeout(this.transitionTimer);
      this.transitionTimer = null;
      if (this.transitionResolve) {
        const resolveTransition = this.transitionResolve;
        this.transitionResolve = null;
        resolveTransition();
      }
      if (this.activeActivity) this.activeActivity.destroy();
      if (this.activityClock) this.activityClock.destroy();
      if (this.lessonClock) this.lessonClock.destroy();
      if (this.kidGuide) this.kidGuide.destroy();
    }
  }

  window.SubDay = window.SubDay || {};
  window.SubDay.LessonEngine = LessonEngine;
}());