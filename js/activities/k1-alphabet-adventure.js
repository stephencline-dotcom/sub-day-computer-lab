/* Early letter matching and beginning-sound picture choices. */
(function () {
  const { element, button, shuffled } = window.SubDay.K1ActivityUtils;

  class AlphabetAdventure extends window.SubDay.ActivityBase {
    constructor(options) {
      super(options);
      this.content = this.definition.content;
      this.letters = this.content.letters;
      this.coreIndex = 0;
      this.extensionTasks = [];
      this.guideHints = [
        { afterMs: 9000, message: "Look at the big letter and the choices.", target: () => this.choiceGrid },
        { afterMs: 9000, message: "Find the same letter or its picture.", target: () => this.choiceGrid }
      ];
    }

    start() {
      this.container.innerHTML = `<section class="k1-activity alphabet-adventure"><div class="letter-hero" data-letter-hero></div><div class="letter-choice-grid" data-choice-grid></div><p class="activity-feedback" data-feedback aria-live="polite"></p></section>`;
      this.hero = this.container.querySelector("[data-letter-hero]");
      this.choiceGrid = this.container.querySelector("[data-choice-grid]");
      this.feedback = this.container.querySelector("[data-feedback]");
      this.showCoreRound();
    }

    showCoreRound() {
      if (this.coreIndex >= this.content.coreRoundTypes.length) {
        this.completeCore();
        return;
      }
      const type = this.content.coreRoundTypes[this.coreIndex];
      const letter = this.letters[(this.coreIndex * 2 + 1) % this.letters.length];
      this.renderRound(type, letter);
    }

    renderRound(type, letter) {
      this.roundType = type;
      this.roundResolving = false;
      this.currentLetter = letter;
      this.feedback.textContent = "";
      this.choiceGrid.replaceChildren();
      this.hero.replaceChildren();
      this.hero.append(element("span", "letter-card-display", letter.letter));
      this.hero.append(element("span", "letter-picture", letter.picture));

      if (type === "match") {
        this.kidGuide.say(letter.spokenSound ? `${letter.spokenSound} Find another ${letter.letter}.` : `Find another ${letter.letter}.`);
        const other = shuffled(this.letters.filter((item) => item.letter !== letter.letter)).slice(0, 2);
        const choices = shuffled([
          { letter: letter.letter.toLowerCase(), answer: true },
          { letter: letter.letter, answer: true },
          ...other.map((item) => ({ letter: item.letter, answer: false }))
        ]);
        choices.forEach((choice) => {
          const option = button("letter-choice", choice.letter, () => this.choose(choice.answer));
          option.textContent = choice.letter;
          option.dataset.correct = String(choice.answer);
          this.choiceGrid.append(option);
        });
      } else {
        this.kidGuide.say(`Which picture starts like ${letter.letter}?`);
        const other = shuffled(this.letters.filter((item) => item.letter !== letter.letter)).slice(0, 2);
        shuffled([letter, ...other]).forEach((item) => {
          const option = button("picture-choice", item.pictureName, () => this.choose(item.letter === letter.letter));
          option.dataset.correct = String(item.letter === letter.letter);
          option.append(element("span", "picture-choice-icon", item.picture));
          this.choiceGrid.append(option);
        });
      }
    }

    choose(correct) {
      if (this.roundResolving) return;
      if (!correct) {
        this.kidGuide.say("Good try. Look at the letter again.");
        return;
      }
      this.roundResolving = true;
      this.kidGuide.showSuccess("You found it!").then(() => {
        if (this.extensionNumber > 0) {
          this.extensionTasks.shift();
          if (this.extensionTasks.length) this.renderRound(this.extensionTasks[0].type, this.extensionTasks[0].letter);
          else this.completeExtension();
        } else {
          this.coreIndex += 1;
          this.showCoreRound();
        }
      });
    }

    startExtension(context) {
      const letters = shuffled(this.letters).slice(0, 3);
      this.extensionTasks = letters.map((letter, index) => ({
        letter,
        type: index === 1 ? "picture" : (context.round % 2 ? "match" : "picture")
      }));
      this.renderRound(this.extensionTasks[0].type, this.extensionTasks[0].letter);
    }

    demonstrate() {
      const answer = this.choiceGrid.querySelector('[data-correct="true"]');
      if (answer) {
        answer.classList.add("demo-glow");
        window.setTimeout(() => answer.classList.remove("demo-glow"), 1000);
      }
    }
  }

  window.SubDay.Activities.alphabetAdventure = AlphabetAdventure;
}());