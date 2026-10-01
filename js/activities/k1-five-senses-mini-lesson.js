/* Narrated animated five senses walkthrough: a mascot-led scene that changes per sense, no card grids. */
(function () {
  const { element, button, scatterPositions, pulse } = window.SubDay.K1ActivityUtils;

  class FiveSensesMiniLesson extends window.SubDay.ActivityBase {
    constructor(options) {
      super(options);
      this.scenes = this.definition.content.scenes;
      this.sceneIndex = 0;
      this.destroyedFlag = false;
      this.guideHints = [
        { afterMs: 10000, message: "Watch and listen to the mini lesson.", target: () => this.stage }
      ];
    }

    start() {
      this.container.innerHTML = `<section class="k1-activity senses-mini-lesson" aria-label="Five Senses Mini Lesson"><div class="mini-scene" data-stage><span class="mini-scene-badge" data-badge aria-hidden="true"></span><div class="mini-scene-objects" data-scene-objects></div><span class="mini-mascot" data-mascot aria-hidden="true">🦉</span></div></section>`;
      this.stage = this.container.querySelector("[data-stage]");
      this.badge = this.container.querySelector("[data-badge]");
      this.objects = this.container.querySelector("[data-scene-objects]");
      this.mascot = this.container.querySelector("[data-mascot]");
      this.playScenes();
    }

    async playScenes() {
      for (this.sceneIndex = 0; this.sceneIndex < this.scenes.length; this.sceneIndex += 1) {
        if (this.destroyedFlag) return;
        await this.playScene(this.scenes[this.sceneIndex]);
      }
      if (this.destroyedFlag) return;
      this.completeCore();
    }

    async playScene(scene) {
      this.stage.className = `mini-scene mini-scene-${scene.sense} scene-enter`;
      // eslint-disable-next-line no-void
      void this.stage.offsetWidth;
      this.badge.textContent = scene.icon;
      this.renderDecorative(scene.examples);
      pulse(this.mascot, "mascot-bounce");

      for (const line of scene.narration) {
        if (this.destroyedFlag) return;
        await this.kidGuide.sayAndWait(line, { timeoutMs: 6000 });
        if (this.destroyedFlag) return;
        pulse(this.mascot, "mascot-bounce");
      }

      if (scene.question && !this.destroyedFlag) await this.askQuestion(scene.question);
    }

    renderDecorative(examples) {
      this.objects.replaceChildren();
      scatterPositions(examples.length).forEach((pos, index) => {
        const obj = element("span", "mini-scene-object mini-scene-floating", examples[index]);
        obj.style.left = `${pos.x}%`;
        obj.style.top = `${pos.y}%`;
        obj.style.animationDelay = `${index * 0.4}s`;
        this.objects.append(obj);
      });
    }

    askQuestion(question) {
      return new Promise((resolve) => {
        this.objects.replaceChildren();
        let resolved = false;
        const positions = scatterPositions(question.choices.length);
        question.choices.forEach((choice, index) => {
          const obj = button("mini-scene-object mini-scene-choice", `Choice ${index + 1}`, () => {
            if (resolved) return;
            if (!choice.correct) {
              pulse(obj, "scene-shake");
              this.kidGuide.say("Good try. Look again.");
              return;
            }
            resolved = true;
            pulse(obj, "scene-pop");
            pulse(this.mascot, "mascot-bounce");
            if (window.SubDay.SoundFx) window.SubDay.SoundFx.collect();
            this.kidGuide.showSuccess("That's right!").then(() => resolve());
          });
          obj.textContent = choice.icon;
          obj.style.left = `${positions[index].x}%`;
          obj.style.top = `${positions[index].y}%`;
          this.objects.append(obj);
        });
        this.kidGuide.say(question.prompt);
      });
    }

    demonstrate() {}

    destroy() { this.destroyedFlag = true; }
  }

  window.SubDay.Activities.fiveSensesMiniLesson = FiveSensesMiniLesson;
}());

