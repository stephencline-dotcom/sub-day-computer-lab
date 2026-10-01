/* Large-target drag sorting, with click-to-select support for keyboard users. */
(function () {
  const { element, button, shuffled } = window.SubDay.K1ActivityUtils;

  class FiveSensesSort extends window.SubDay.ActivityBase {
    constructor(options) {
      super(options);
      this.content = this.definition.content;
      this.senses = this.lessonContent.senses;
      this.coreIndex = 0;
      this.extensionTasks = [];
      this.selectedObject = false;
      this.guideHints = [
        { afterMs: 9000, message: "Look at the object and both big sense pictures.", target: () => this.targetGrid },
        { afterMs: 9000, message: "Drag the object to a sense picture.", target: () => this.targetGrid }
      ];
    }

    start() {
      this.container.innerHTML = `<section class="k1-activity sense-sort"><div class="sort-object" data-sort-object></div><div class="sense-target-grid" data-sense-targets></div><p class="activity-feedback" data-feedback aria-live="polite"></p></section>`;
      this.objectSlot = this.container.querySelector("[data-sort-object]");
      this.targetGrid = this.container.querySelector("[data-sense-targets]");
      this.feedback = this.container.querySelector("[data-feedback]");
      this.showCoreRound();
    }

    showCoreRound() {
      if (this.coreIndex >= this.content.rounds.length) {
        this.completeCore();
        return;
      }
      this.renderRound(this.content.rounds[this.coreIndex], false);
    }

    renderRound(round, extension) {
      this.currentRound = round;
      this.selectedObject = false;
      this.roundResolving = false;
      this.feedback.textContent = "";
      this.kidGuide.say(`${round.object.name}. Which sense would you use? Drag it to the right place.`);
      this.objectSlot.replaceChildren();
      this.targetGrid.replaceChildren();

      const object = button("sort-object-card", `${round.object.name}. Select it, then choose a sense.`, () => {
        this.selectedObject = true;
        object.classList.add("object-selected");
      });
      object.draggable = true;
      object.append(element("span", "picture-choice-icon", round.object.icon));
      object.addEventListener("dragstart", (event) => {
        this.selectedObject = true;
        event.dataTransfer.setData("text/plain", round.object.name);
      });
      object.addEventListener("dragend", () => object.classList.remove("object-selected"));
      this.objectSlot.append(object);

      const otherSenses = shuffled(Object.keys(this.senses).filter((id) => id !== round.object.sense)).slice(0, 2);
      const targetIds = extension ? [round.object.sense, ...otherSenses] : round.senses;
      shuffled(targetIds).forEach((senseId) => {
        const sense = this.senses[senseId];
        const target = button("sense-target", sense.name, () => {
          if (this.selectedObject) this.choose(senseId);
        });
        target.dataset.sense = senseId;
        target.append(element("span", "sense-target-icon", sense.icon));
        target.append(element("span", "sense-target-name", sense.name));
        target.addEventListener("dragover", (event) => event.preventDefault());
        target.addEventListener("drop", (event) => {
          event.preventDefault();
          this.choose(senseId);
        });
        this.targetGrid.append(target);
      });
    }

    choose(senseId) {
      if (this.roundResolving) return;
      if (senseId !== this.currentRound.object.sense) {
        this.selectedObject = false;
        this.objectSlot.querySelector(".sort-object-card").classList.remove("object-selected");
        this.kidGuide.say("Good try. You can try again.");
        return;
      }
      this.roundResolving = true;
      this.kidGuide.showSuccess("That is the right sense!").then(() => {
        if (this.extensionNumber > 0) {
          this.extensionTasks.shift();
          if (this.extensionTasks.length) this.renderRound(this.extensionTasks[0], true);
          else this.completeExtension();
        } else {
          this.coreIndex += 1;
          this.showCoreRound();
        }
      });
    }

    startExtension(context) {
      const tasks = shuffled(this.content.rounds);
      this.extensionTasks = [0, 1, 2].map((index) => tasks[(index + context.round) % tasks.length]);
      this.renderRound(this.extensionTasks[0], true);
    }

    demonstrate() {
      const target = this.targetGrid.querySelector(`[data-sense="${this.currentRound.object.sense}"]`);
      if (target) {
        target.classList.add("demo-glow");
        window.setTimeout(() => target.classList.remove("demo-glow"), 1000);
      }
    }
  }

  window.SubDay.Activities.fiveSensesSort = FiveSensesSort;
}());