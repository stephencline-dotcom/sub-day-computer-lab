/* Pointer and click warm-up with progressively varied extension rounds. */
(function () {
  const positions = [
    { x: 13, y: 28 }, { x: 37, y: 68 }, { x: 62, y: 31 }, { x: 86, y: 67 },
    { x: 25, y: 75 }, { x: 74, y: 23 }, { x: 52, y: 50 }, { x: 49, y: 17 }
  ];
  const { shuffled } = window.SubDay.K1ActivityUtils;

  class StarCatch extends window.SubDay.ActivityBase {
    constructor(options) {
      super(options);
      this.roundCount = this.definition.content.starCount || 5;
      this.roundNumber = 0;
      this.collected = 0;
      this.guideHints = [
        { afterMs: 9000, message: "Move your pointer over a star.", target: () => this.board },
        { afterMs: 9000, message: "Try touching a star with your pointer.", target: () => this.board }
      ];
    }

    start() {
      this.container.innerHTML = `<section class="star-game" aria-label="Star Catch"><p class="round-label" data-round-label></p><div class="star-board" data-star-board aria-label="Star Catch play area"></div><p class="activity-feedback" data-feedback aria-live="polite"></p></section>`;
      this.board = this.container.querySelector("[data-star-board]");
      this.roundLabel = this.container.querySelector("[data-round-label]");
      this.feedback = this.container.querySelector("[data-feedback]");
      this.beginRound("touch", this.roundCount, "Move your pointer and touch the stars.");
    }

    beginRound(mode, count, instruction, moving, bonus, smaller) {
      this.roundNumber += 1;
      this.mode = mode;
      this.collected = 0;
      this.feedback.textContent = "";
      this.roundLabel.textContent = bonus ? "Bonus Round!" : "Star Catch";
      this.board.replaceChildren();
      shuffled(positions).slice(0, count).forEach((position, index) => {
        const star = document.createElement("button");
        star.className = `star-target${smaller ? " star-small" : ""}${moving ? " star-drifting" : ""}`;
        star.type = "button";
        star.textContent = "★";
        star.setAttribute("aria-label", `Star ${index + 1}`);
        star.style.left = `${position.x}%`;
        star.style.top = `${position.y}%`;
        if (mode === "touch") star.addEventListener("pointerenter", () => this.collect(star));
        star.addEventListener("click", () => this.collect(star));
        this.board.append(star);
      });
      const teachPromise = this.kidGuide.teachMechanic(mode === "touch" ? "hover" : "click", {
        tell: instruction,
        kind: mode === "touch" ? "hover" : "click",
        targetEl: this.board.querySelector(".star-target")
      });
      this.kidGuide.gateInteraction(this.board, teachPromise);
    }

    startExtension(context) {
      const mode = context.round % 2 === 1 ? "touch" : "click";
      const count = Math.min(7, this.roundCount + Math.min(context.round, 2));
      const instruction = mode === "touch" ? "Bonus round! Touch each star with your pointer." : "Bonus round! Click each star.";
      this.beginRound(mode, count, instruction, context.round >= 3, true, context.round >= 2);
    }

    demonstrate() {
      const star = this.board.querySelector(".star-target");
      if (!star) return;
      star.classList.add("demo-glow");
      window.setTimeout(() => star.classList.remove("demo-glow"), 900);
    }

    collect(star) {
      if (this.completed || star.classList.contains("collected")) return;
      star.classList.add("collected");
      this.collected += 1;
      if (this.collected < this.board.children.length) return;
      if (window.SubDay.SoundFx) window.SubDay.SoundFx.collect();
      this.kidGuide.showSuccess("You found every star!").then(() => {
        if (this.roundNumber === 1) {
          this.beginRound("click", this.roundCount, "Great! Now click the stars.");
        } else if (this.extensionNumber === 0) {
          this.completeCore();
        } else {
          this.completeExtension();
        }
      });
    }

    destroy() {}
  }

  window.SubDay.Activities.starCatch = StarCatch;
}());