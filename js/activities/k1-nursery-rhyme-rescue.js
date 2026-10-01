/* Short familiar rhyme fragments paired with large picture choices. */
(function () {
  const { element, button, shuffled } = window.SubDay.K1ActivityUtils;

  class NurseryRhymeRescue extends window.SubDay.ActivityBase {
    constructor(options) {
      super(options);
      this.rounds = this.definition.content.rounds;
      this.coreIndex = 0;
      this.extensionTasks = [];
      this.guideHints = [
        { afterMs: 9000, message: "Look at the rhyme pictures.", target: () => this.choiceGrid },
        { afterMs: 9000, message: "Which picture finishes the rhyme?", target: () => this.choiceGrid }
      ];
    }

    start() {
      this.container.innerHTML = `<section class="k1-activity rhyme-rescue"><div class="rhyme-scene" data-rhyme-scene><span data-scene-mark aria-hidden="true">🎵</span></div><div class="rhyme-choice-grid" data-choice-grid></div><p class="activity-feedback" data-feedback aria-live="polite"></p></section>`;
      this.choiceGrid = this.container.querySelector("[data-choice-grid]");
      this.scene = this.container.querySelector("[data-rhyme-scene]");
      this.sceneMark = this.container.querySelector("[data-scene-mark]");
      this.feedback = this.container.querySelector("[data-feedback]");
      this.showCoreRound();
    }

    showCoreRound() {
      if (this.coreIndex >= this.rounds.length) {
        this.completeCore();
        return;
      }
      this.currentRound = this.rounds[this.coreIndex];
      this.renderRound(this.currentRound, false);
    }

    renderRound(round, dragMode) {
      this.currentRound = round;
      this.roundResolving = false;
      this.feedback.textContent = "";
      this.sceneMark.textContent = dragMode ? "🏞️" : "🎵";
      this.kidGuide.say(dragMode ? `Drag a picture to finish: ${round.prompt}` : round.prompt);
      this.scene.classList.toggle("rhyme-drop-scene", dragMode);
      this.scene.ondragover = dragMode ? (event) => event.preventDefault() : null;
      this.scene.ondrop = dragMode ? (event) => {
        event.preventDefault();
        this.choose(event.dataTransfer.getData("text/plain"));
      } : null;
      this.choiceGrid.replaceChildren();
      shuffled(round.choices).forEach((choice) => {
        const card = button("picture-choice rhyme-choice", choice.name, () => this.choose(choice.name));
        card.dataset.answer = choice.name;
        card.append(element("span", "picture-choice-icon", choice.icon));
        if (dragMode) {
          card.draggable = true;
          card.addEventListener("dragstart", (event) => event.dataTransfer.setData("text/plain", choice.name));
        }
        this.choiceGrid.append(card);
      });
    }

    choose(answer) {
      if (this.roundResolving) return;
      if (answer !== this.currentRound.answer) {
        this.kidGuide.say("Good try. Listen again and choose a picture.");
        return;
      }
      this.roundResolving = true;
      this.kidGuide.showSuccess("Rhyme rescued!").then(() => {
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

    startExtension() {
      this.extensionTasks = shuffled(this.rounds).slice(0, 3);
      this.renderRound(this.extensionTasks[0], true);
    }

    demonstrate() {
      const answer = this.choiceGrid.querySelector(`[data-answer="${this.currentRound.answer}"]`);
      if (answer) {
        answer.classList.add("demo-glow");
        window.setTimeout(() => answer.classList.remove("demo-glow"), 1000);
      }
    }
  }

  window.SubDay.Activities.nurseryRhymeRescue = NurseryRhymeRescue;
}());