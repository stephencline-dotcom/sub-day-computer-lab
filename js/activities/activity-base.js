/* Shared activity lifecycle: subclasses start, complete once, then release resources. */
(function () {
  class ActivityBase {
    constructor(options) {
      this.definition = options.definition;
      this.container = options.container;
      this.kidGuide = options.kidGuide;
      this.lessonContent = options.lessonContent || {};
      this.onComplete = options.onComplete;
      this.onCoreComplete = options.onCoreComplete;
      this.onExtensionComplete = options.onExtensionComplete;
      this.completed = false;
      this.extensionNumber = 0;
      this.coreReported = false;
      this.extensionReported = false;
    }
    start() { throw new Error("Activities must implement start()."); }
    startExtension() { throw new Error("Activities with extensions must implement startExtension()."); }

    getGuideOptions() {
      return {
        container: this.container,
        hints: this.guideHints || [
          { afterMs: 9000, message: "Keep going!" },
          { afterMs: 9000, message: "Try another one." }
        ],
        demonstrate: () => this.demonstrate(),
        demonstrateAfterMs: 9000
      };
    }

    demonstrate() {}
    onActivityFinish() {}

    completeCore() {
      if (this.completed || this.coreReported) return;
      this.coreReported = true;
      this.onCoreComplete();
    }

    completeExtension() {
      if (this.completed || this.extensionReported) return;
      this.extensionReported = true;
      this.onExtensionComplete();
    }

    complete() {
      if (this.completed) return;
      this.completed = true;
      this.onComplete();
    }
    destroy() {}
  }

  window.SubDay = window.SubDay || {};
  window.SubDay.ActivityBase = ActivityBase;
  window.SubDay.Activities = window.SubDay.Activities || {};
}());