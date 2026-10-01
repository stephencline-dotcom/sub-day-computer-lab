/* Picture-scene hunt that practices noticing what each sense can do. */
(function () {
  const { element, button, shuffled } = window.SubDay.K1ActivityUtils;

  class FiveSensesHunt extends window.SubDay.ActivityBase {
    constructor(options) {
      super(options);
      this.content = this.definition.content;
      this.coreIndex = 0;
      this.extensionTasks = [];
      this.guideHints = [
        { afterMs: 9000, message: "Look at each picture.", target: () => this.choiceGrid },
        { afterMs: 9000, message: "Choose the picture that matches the sense.", target: () => this.choiceGrid }
      ];
    }

    start() {
      this.container.innerHTML = `<section class="k1-activity sense-hunt"><div class="sense-hunt-scene"><div class="sense-hunt-icon" data-sense-icon aria-hidden="true"></div><div class="picture-choice-grid" data-choice-grid></div></div><p class="activity-feedback" data-feedback aria-live="polite"></p></section>`;
      this.choiceGrid = this.container.querySelector("[data-choice-grid]");
      this.senseIcon = this.container.querySelector("[data-sense-icon]");
      this.feedback = this.container.querySelector("[data-feedback]");
      this.showCoreRound();
    }

    showCoreRound() {
      if (this.coreIndex >= this.content.rounds.length) {
        this.completeCore();
        return;
      }
      this.currentRound = this.content.rounds[this.coreIndex];
      this.renderRound(this.currentRound);
    }

    renderRound(round) {
      this.currentRound = round;
      this.senseIcon.textContent = round.icon;
      this.roundResolving = false;
      this.feedback.textContent = "";
      this.kidGuide.say(round.direction);
      this.choiceGrid.replaceChildren();
      const objects = this.content.objects.filter((item) => round.choices.includes(item.id));
      shuffled(objects).forEach((item) => {
        const choice = button("picture-choice", item.name, () => this.choose(item.id));
        choice.dataset.itemId = item.id;
        choice.append(element("span", "picture-choice-icon", item.icon));
        this.choiceGrid.append(choice);
      });
    }

    choose(id) {
      if (this.roundResolving) return;
      if (id !== this.currentRound.answer) {
        this.kidGuide.say("Good try. Have another look.");
        return;
      }
      this.roundResolving = true;
      this.kidGuide.showSuccess("Great finding!").then(() => {
        if (this.extensionNumber > 0) {
          this.extensionTasks.shift();
          if (this.extensionTasks.length) this.renderRound(this.extensionTasks[0]);
          else this.completeExtension();
        } else {
          this.coreIndex += 1;
          this.showCoreRound();
        }
      });
    }

    startExtension() {
      this.extensionTasks = shuffled(this.content.rounds).slice(0, 3);
      this.renderRound(this.extensionTasks[0]);
    }

    demonstrate() {
      const correctChoice = this.choiceGrid.querySelector(`[data-item-id="${this.currentRound.answer}"]`);
      if (correctChoice) {
        correctChoice.classList.add("demo-glow");
        window.setTimeout(() => correctChoice.classList.remove("demo-glow"), 1000);
      }
    }
  }

  window.SubDay.Activities.fiveSensesHunt = FiveSensesHunt;
}());