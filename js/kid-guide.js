/* Reusable on-screen directions, speech, replay, hints, success, and demonstrations. */
(function () {
  class KidGuide {
    constructor(container) {
      this.container = container;
      this.instruction = "";
      this.hintTimer = null;
      this.highlightTimer = null;
      this.speechRetryTimer = null;
      this.speechRetryResolve = null;
      this.speechEndTimer = null;
      this.speechRequestId = 0;
      this.activeSpeechResolve = null;
      this.activityRoot = null;
      this.activityOptions = null;
      this.inactivityTimer = null;
      this.activityEvents = ["pointerdown", "pointermove", "click", "dragstart", "dragover", "drop", "keydown", "wheel", "scroll"];
      /* Mechanics already taught this lesson (hover, click, drag, scroll...), shared across every activity. */
      this.taughtMechanics = new Set();
      this.destroyed = false;
      this.render();
    }

    render() {
      this.container.innerHTML = `<aside class="kid-guide" aria-label="Kid Guide"><div><p class="kid-guide-message" data-guide-message></p><p class="kid-guide-hint" data-guide-hint hidden></p></div><button class="guide-replay" type="button" data-guide-replay>Hear again</button></aside>`;
      this.message = this.container.querySelector("[data-guide-message]");
      this.hint = this.container.querySelector("[data-guide-hint]");
      this.container.querySelector("[data-guide-replay]").addEventListener("click", () => this.replay());
    }

    say(text, options) {
      this.instruction = text;
      this.message.textContent = text;
      this.hint.hidden = true;
      if (options && options.speak === false) return Promise.resolve({ spoken: false });
      return this.speak(text);
    }

    replay() { if (this.instruction) this.speak(this.instruction); }

    sayAndWait(text, options) {
      this.instruction = text;
      this.message.textContent = text;
      this.hint.hidden = true;
      return this.speak(text, { ...(options || {}), waitForEnd: true });
    }

    wait(ms) {
      return new Promise((resolve) => {
        const timer = window.setTimeout(resolve, ms);
        if (!this._tutorialTimers) this._tutorialTimers = [];
        this._tutorialTimers.push(timer);
      });
    }

    /*
     * TELL + SHOW: speak a short direction, then (only the first time this
     * mechanic key is used in the lesson) visually demonstrate it without
     * ever completing the task for the child. TRY starts once this resolves.
     * Activities should pair this with gateInteraction() so clicks can't
     * land mid-demonstration.
     */
    async teachMechanic(
      key,
      {
        tell,
        kind,
        targetEl,
        fromEl,
        toEl,
        fullDemo
      } = {}
    ) {
      if (tell) {
        await this.sayAndWait(tell, { timeoutMs: 5000 });
      }

      if (this.destroyed) return;

      const firstTime =
        key && !this.taughtMechanics.has(key);

      if (!firstTime) return;

      /*
       * A fullDemo shows the entire cause-and-effect sequence:
       * grab -> move -> release -> result.
       *
       * If an activity does not provide one, fall back to the
       * simpler reusable gesture demonstration.
       */
      if (typeof fullDemo === "function") {
        await Promise.resolve(fullDemo());
      } else if (kind) {
        await this.demonstrateGesture(
          kind,
          { targetEl, fromEl, toEl }
        );
      }

      if (key) {
        this.taughtMechanics.add(key);
      }
    }

    /* Briefly introduces a new game's character and goal before Level 1. */
    async introduceGame(key, { tell, character } = {}) {
      if (key && this.taughtMechanics.has(key)) return;
      if (character) {
        this.message.textContent = `${character}  ${tell || ""}`.trim();
      }
      if (tell) await this.sayAndWait(tell, { timeoutMs: 5000 });
      if (key) this.taughtMechanics.add(key);
    }

    /* Locks an interactive area (no clicks land) until the given promise settles. */
    gateInteraction(container, promise) {
      if (!container) return Promise.resolve(promise);
      container.classList.add("teaching-lock");
      const release = () => container.classList.remove("teaching-lock");
      return Promise.resolve(promise).then(release, release);
    }

    /*
     * Ghost-pointer demonstration: moves a floating hand/finger icon to show
     * hover, click, drag, or scroll gestures. Pure visuals, no real events
     * are dispatched, so the child's own action is always still required.
     */
    async demonstrateGesture(kind, { targetEl, fromEl, toEl } = {}) {
      if (this.destroyed) return;
      const anchor = targetEl || fromEl;
      if (!anchor) return;
      const pointer = document.createElement("div");
      pointer.className = `kid-guide-ghost-pointer ghost-${kind}`;
      pointer.setAttribute("aria-hidden", "true");
      pointer.textContent = kind === "scroll" ? "✌️" : kind === "drag" ? "🤏" : "👆";
      document.body.append(pointer);

      const place = (el, offsetY = 0) => {
        const rect = el.getBoundingClientRect();
        pointer.style.left = `${rect.left + rect.width / 2}px`;
        pointer.style.top = `${rect.top + rect.height / 2 + offsetY}px`;
      };

      // Place instantly at the starting spot so it doesn't slide in from the page corner.
      pointer.style.transition = "none";
      place(fromEl || targetEl);
      void pointer.offsetWidth;
      pointer.style.transition = "";

      try {
        if (kind === "drag" && fromEl && toEl) {
          place(fromEl);
          pointer.classList.add("ghost-visible");
          await this.wait(260);
          pointer.classList.add("ghost-pressed");
          await this.wait(180);
          place(toEl);
          await this.wait(420);
          pointer.classList.remove("ghost-pressed");
          pointer.classList.add("ghost-release");
          await this.wait(260);
        } else if (kind === "scroll" && anchor) {
          place(anchor, -30);
          pointer.classList.add("ghost-visible", "ghost-scroll-down");
          const originalTop = anchor.scrollTop;
          await this.wait(200);
          if (typeof anchor.scrollTo === "function") anchor.scrollTo({ top: originalTop + 60, behavior: "smooth" });
          await this.wait(420);
          pointer.classList.remove("ghost-scroll-down");
          if (typeof anchor.scrollTo === "function") anchor.scrollTo({ top: originalTop, behavior: "smooth" });
          await this.wait(420);
        } else {
          place(anchor);
          pointer.classList.add("ghost-visible");
          await this.wait(280);
          pointer.classList.add("ghost-tap");
          anchor.classList.add("demo-glow");
          await this.wait(260);
          anchor.classList.remove("demo-glow");
          await this.wait(120);
        }
      } finally {
        pointer.classList.add("ghost-fade");
        await this.wait(200);
        pointer.remove();
      }
    }

    getPreferredVoice(allowFallback = true) {
      if (!("speechSynthesis" in window)) return null;

      let voices;
      try {
        voices = window.speechSynthesis.getVoices();
      } catch (error) {
        return null;
      }
      if (!voices.length) return null;

      const englishVoices = voices.filter(
        (voice) =>
          voice.lang &&
          voice.lang
            .toLowerCase()
            .startsWith("en")
      );

      let savedVoiceName = "";

      try {
        savedVoiceName =
          window.localStorage.getItem(
            "subDayPreferredVoiceName"
          ) || "";
      } catch (error) {
        savedVoiceName = "";
      }

      if (savedVoiceName) {
        const savedVoice =
          englishVoices.find(
            (voice) =>
              voice.name === savedVoiceName
          );

        if (savedVoice) return savedVoice;
      }

      /*
       * Prefer voices that advertise themselves as
       * natural/enhanced before using generic system voices.
       */
      const preferredPatterns = [
        /Natural/i,
        /Premium/i,
        /Enhanced/i,
        /Microsoft.*Aria/i,
        /Microsoft.*Jenny/i,
        /Ava/i,
        /Samantha/i,
        /Google US English/i,
        /Google.*English.*United States/i
      ];

      for (const pattern of preferredPatterns) {
        const match =
          englishVoices.find(
            (voice) =>
              pattern.test(voice.name)
          );

        if (match) return match;
      }

      if (!allowFallback) return null;

      return (
        voices.find((voice) =>
          voice.lang === "en-US" &&
          /Google|Microsoft|Natural/i.test(voice.name)
        ) ||
        voices.find((voice) => voice.lang === "en-US") ||
        voices.find((voice) =>
          voice.lang && voice.lang.toLowerCase().startsWith("en")
        ) ||
        null
      );
    }

    speak(text, options) {
      if (
        !("speechSynthesis" in window) ||
        !("SpeechSynthesisUtterance" in window)
      ) return Promise.resolve({ spoken: false });

      this.cancelSpeech();
      return this.speakAttempt(text, 0, this.speechRequestId, options || {});
    }

    speakAttempt(text, attempt, requestId, options) {
      if (requestId !== this.speechRequestId) return Promise.resolve({ cancelled: true });
      window.clearTimeout(this.speechRetryTimer);

      /*
       * Chrome/Chromebook voices often load asynchronously.
       * Wait briefly for one of our preferred natural voices so
       * the first instruction does not use the robotic fallback.
       */
      const preferredVoice = this.getPreferredVoice(false);

      if (!preferredVoice && attempt < 12) {
        return new Promise((resolve) => {
          this.speechRetryResolve = resolve;
          this.speechRetryTimer = window.setTimeout(() => {
            this.speechRetryResolve = null;
            this.speechRetryTimer = null;
            resolve(this.speakAttempt(text, attempt + 1, requestId, options));
          }, 100);
        });
      }

      const voice = preferredVoice || this.getPreferredVoice(true);
      let utterance;
      try {
        utterance = new SpeechSynthesisUtterance(text);
        if (voice) {
          utterance.voice = voice;
          utterance.lang = voice.lang || "en-US";
        } else {
          utterance.lang = "en-US";
        }
      } catch (error) {
        return Promise.resolve({ spoken: false, error });
      }

      utterance.rate = 0.9;
      utterance.pitch = 1.04;
      utterance.volume = 1;

      return new Promise((resolve) => {
        let settled = false;
        const finish = (result) => {
          if (settled) return;
          settled = true;
          if (this.activeSpeechResolve === finish) {
            window.clearTimeout(this.speechEndTimer);
            this.speechEndTimer = null;
            this.activeSpeechResolve = null;
          }
          resolve(result);
        };
        utterance.onend = () => finish({ spoken: true });
        utterance.onerror = () => finish({ spoken: false });
        this.activeSpeechResolve = finish;

        if (options.waitForEnd) {
          const timeoutMs = options.timeoutMs || Math.max(5000, Math.min(8000, text.length * 120));
          this.speechEndTimer = window.setTimeout(() => finish({ spoken: false, timedOut: true }), timeoutMs);
        }

        try {
          window.speechSynthesis.speak(utterance);
        } catch (error) {
          finish({ spoken: false, error });
        }
      });
    }

    cancelSpeech() {
      this.speechRequestId += 1;
      window.clearTimeout(this.speechRetryTimer);
      this.speechRetryTimer = null;
      if (this.speechRetryResolve) {
        const resolveRetry = this.speechRetryResolve;
        this.speechRetryResolve = null;
        resolveRetry({ cancelled: true });
      }
      window.clearTimeout(this.speechEndTimer);
      this.speechEndTimer = null;
      const resolveSpeech = this.activeSpeechResolve;
      this.activeSpeechResolve = null;
      if ("speechSynthesis" in window) {
        try {
          window.speechSynthesis.cancel();
        } catch (error) {
          // Speech failures should not interrupt lesson navigation.
        }
      }
      if (resolveSpeech) resolveSpeech({ cancelled: true });
    }

    showVisualHint(message, target) {
      this.hint.textContent = message;
      this.hint.hidden = false;
      if (target) {
        target.classList.add("guide-hint-target");
        window.clearTimeout(this.highlightTimer);
        this.highlightTimer = window.setTimeout(() => target.classList.remove("guide-hint-target"), 1800);
      }
    }

    watchActivity(options) {
      this.stopWatchingActivity();
      this.activityRoot = options.container;
      this.activityOptions = options;
      this.activityEvents.forEach((name) => this.activityRoot.addEventListener(name, this.handleInteraction, true));
      this.resetInactivity();
    }

    handleInteraction = () => this.resetInactivity();

    resetInactivity() {
      window.clearTimeout(this.inactivityTimer);
      if (!this.activityOptions) return;
      this.hint.hidden = true;
      this.activityOptions.hints.forEach((hint) => {
        if (hint.target && typeof hint.target !== "function") hint.target.classList.remove("guide-hint-target");
      });
      this.scheduleHint(0);
    }

    scheduleHint(index) {
      const options = this.activityOptions;
      if (!options) return;
      if (index < options.hints.length) {
        const hint = options.hints[index];
        this.inactivityTimer = window.setTimeout(() => {
          const target = typeof hint.target === "function" ? hint.target() : hint.target;
          this.showVisualHint(hint.message, target);
          this.scheduleHint(index + 1);
        }, hint.afterMs);
        return;
      }
      if (typeof options.demonstrate === "function") {
        this.inactivityTimer = window.setTimeout(() => {
          Promise.resolve(options.demonstrate()).catch(() => {});
        }, options.demonstrateAfterMs || 9000);
      }
    }

    stopWatchingActivity() {
      window.clearTimeout(this.inactivityTimer);
      if (this.activityRoot) {
        this.activityEvents.forEach((name) => this.activityRoot.removeEventListener(name, this.handleInteraction, true));
      }
      this.activityRoot = null;
      this.activityOptions = null;
    }

    /*
     * Success speech must finish before the next instruction begins, so
     * activities should chain their next step off the returned promise
     * instead of using their own setTimeout.
     */
    showSuccess(message, options) {
      this.message.textContent = message;
      this.hint.hidden = true;
      if (window.SubDay.SoundFx) window.SubDay.SoundFx.success();
      return this.speak(message, { waitForEnd: true, timeoutMs: 2600, ...(options || {}) });
    }

    demonstrate(demonstration) {
      return typeof demonstration === "function" ? Promise.resolve(demonstration()) : Promise.resolve();
    }

    destroy() {
      this.destroyed = true;
      this.stopWatchingActivity();
      window.clearTimeout(this.highlightTimer);
      (this._tutorialTimers || []).forEach((timer) => window.clearTimeout(timer));
      this._tutorialTimers = [];
      this.cancelSpeech();
    }
  }

  window.SubDay = window.SubDay || {};
  window.SubDay.KidGuide = KidGuide;
}());