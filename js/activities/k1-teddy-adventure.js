/* Real journey game: Teddy visibly advances HOME -> PARK -> FARM -> FOREST -> BRIDGE -> SCHOOL. */
(function () {
  const { element, button, shuffled, pulse } = window.SubDay.K1ActivityUtils;
  const SoundFx = window.SubDay.SoundFx;

  const STAR_SPOTS = [15, 38, 62, 85];

  class TeddyAdventure extends window.SubDay.ActivityBase {
    constructor(options) {
      super(options);
      this.content = this.definition.content;
      this.stops = this.content.stops;
      this.levels = this.content.levels;
      this.coreIndex = 0;
      this.stopIndex = 0;
      this.score = 0;
      this.stars = 0;
      this.lastBonusId = null;
      this.levelResolving = false;
      this.guideHints = [
        { afterMs: 9000, message: "Help Teddy with this little challenge.", target: () => this.challengeArea },
        { afterMs: 9000, message: "Look for what Teddy needs.", target: () => this.challengeArea }
      ];
    }

    start() {
      this.container.innerHTML = `<section class="k1-activity teddy-adventure" aria-label="Teddy's School Adventure"><header class="teddy-journey-header"><div class="teddy-map" data-teddy-map></div><p class="teddy-score" data-score aria-live="polite"></p></header><p class="teddy-level-label" data-level-label></p><div class="teddy-challenge" data-teddy-challenge></div><p class="activity-feedback" data-feedback aria-live="polite"></p></section>`;
      this.map = this.container.querySelector("[data-teddy-map]");
      this.levelLabel = this.container.querySelector("[data-level-label]");
      this.scoreLabel = this.container.querySelector("[data-score]");
      this.challengeArea = this.container.querySelector("[data-teddy-challenge]");
      this.feedback = this.container.querySelector("[data-feedback]");
      this.buildMap();
      this.updateScore(0);
      this.kidGuide.introduceGame("teddy-intro", {
        character: "🧸",
        tell: "Teddy needs help getting to school. Finish each little challenge to help Teddy move forward."
      }).then(() => this.showCoreLevel());
    }

    buildMap() {
      this.map.replaceChildren();
      this.stopMarkers = this.stops.map((name, index) => {
        const stop = element("div", "teddy-stop", name);
        stop.dataset.index = String(index);
        this.map.append(stop);
        return stop;
      });
      this.runner = element("span", "teddy-path-runner", "🧸");
      this.runner.setAttribute("aria-hidden", "true");
      this.map.append(this.runner);
      this.placeRunner(0, false);
    }

    placeRunner(index, animate) {
      this.stopIndex = Math.min(index, this.stops.length - 1);
      this.stopMarkers.forEach((marker, markerIndex) => marker.classList.toggle("stop-complete", markerIndex <= this.stopIndex));
      const percent = (this.stopIndex / (this.stops.length - 1)) * 100;
      if (!animate) this.runner.classList.add("no-transition");
      this.runner.style.left = `${percent}%`;
      if (!animate) window.requestAnimationFrame(() => this.runner.classList.remove("no-transition"));
    }

    updateScore(add) {
      this.score += add;
      this.scoreLabel.textContent = `⭐ ${this.stars}   •   ${this.score} points`;
    }

    showCoreLevel() {
      if (this.coreIndex >= this.levels.length) {
        this.completeCore();
        return;
      }
      this.renderLevel(this.levels[this.coreIndex]);
    }

    renderLevel(level) {
      this.currentLevel = level;
      this.levelResolving = false;
      this.stepIndex = 0;
      this.collected = 0;
      this.feedback.textContent = "";
      this.challengeArea.replaceChildren();
      this.challengeArea.className = `teddy-challenge teddy-scene-${level.id.replace(/-b$/, "").split("-")[0]}`;
      this.levelLabel.textContent = `${level.icon} ${level.label}`;

      if (level.type === "collect") this.renderCollect(level);
      else if (level.type === "dragMatch") this.renderDragMatch(level);
      else if (level.type === "scrollFind") this.renderScrollFind(level);
      else if (level.type === "letterBridge") this.renderLetterStep(level, 0);
      else if (level.type === "sense") this.renderSense(level);
      else if (level.type === "mixed") this.renderMixedStep(level, 0);

      const mechanicKey = level.type === "collect" ? "hover" : level.type === "dragMatch" ? "drag" : level.type === "scrollFind" ? "scroll" : "click";
      const teachPromise = this.kidGuide.teachMechanic(mechanicKey, {
        tell: level.direction,
        kind: mechanicKey,
        targetEl: mechanicKey === "drag" ? undefined : this.challengeArea.querySelector(".teddy-star, .scroll-practice-panel, .teddy-scene-object, .teddy-stone"),
        fromEl: mechanicKey === "drag" ? this.challengeArea.querySelector(".teddy-scene-animal") : undefined,
        toEl: mechanicKey === "drag" ? this.challengeArea.querySelector(".teddy-scene-home") : undefined
      });
      this.kidGuide.gateInteraction(this.challengeArea, teachPromise);
    }

    renderCollect(level) {
      const board = element("div", "teddy-star-board");
      this.challengeArea.append(board);
      const spots = shuffled(STAR_SPOTS.concat(STAR_SPOTS.map((value) => (value + 20) % 96))).slice(0, level.count);
      spots.forEach((left, index) => {
        const star = button("teddy-star", `Star ${index + 1}`, () => this.collectTarget(star, board));
        star.textContent = "★";
        star.style.left = `${left}%`;
        star.style.top = index % 2 ? "68%" : "30%";
        star.addEventListener("pointerenter", () => this.collectTarget(star, board));
        board.append(star);
      });
    }

    renderDragMatch(level) {
      const animalSpots = [16, 38, 62, 84];
      const homeSpots = [20, 50, 80];
      const shuffledPairs = shuffled(level.pairs);
      shuffledPairs.forEach((pair, index) => {
        const item = button("teddy-scene-object teddy-scene-animal", `${pair.name}. Select it, then choose its home.`, () => {
          this.selectedPair = pair;
          this.challengeArea.querySelectorAll(".teddy-scene-animal").forEach((node) => node.classList.remove("object-selected"));
          item.classList.add("object-selected");
        });
        item.textContent = pair.icon;
        item.draggable = true;
        item.style.left = `${animalSpots[index % animalSpots.length]}%`;
        item.style.top = "28%";
        item.addEventListener("dragstart", (event) => {
          this.selectedPair = pair;
          event.dataTransfer.setData("text/plain", pair.name);
        });
        this.challengeArea.append(item);
      });
      shuffled(level.pairs).forEach((pair, index) => {
        const target = button("teddy-scene-object teddy-scene-home", pair.targetName, () => {
          if (this.selectedPair) this.tryDragMatch(this.selectedPair, pair, target);
        });
        target.textContent = pair.targetIcon;
        target.style.left = `${homeSpots[index % homeSpots.length]}%`;
        target.style.top = "74%";
        target.addEventListener("dragover", (event) => event.preventDefault());
        target.addEventListener("drop", (event) => {
          event.preventDefault();
          if (this.selectedPair) this.tryDragMatch(this.selectedPair, pair, target);
        });
        this.challengeArea.append(target);
      });
    }

    tryDragMatch(selectedPair, targetPair, targetNode) {
      if (targetNode.classList.contains("collected")) return;
      if (selectedPair.name !== targetPair.name) {
        pulse(targetNode, "scene-shake");
        this.kidGuide.say("Good try. Look for its real home.");
        return;
      }
      targetNode.classList.add("collected");
      pulse(targetNode, "scene-pop");
      this.challengeArea.querySelectorAll(".teddy-scene-animal").forEach((node) => {
        if (node.classList.contains("object-selected")) {
          node.classList.add("collected");
          node.classList.remove("object-selected");
        }
      });
      this.selectedPair = null;
      this.collected += 1;
      if (SoundFx) SoundFx.pop();
      if (this.collected >= this.currentLevel.pairs.length) this.finishLevel();
    }

    renderScrollFind(level) {
      const panel = element("div", "scroll-practice-panel");
      panel.setAttribute("aria-label", "Scroll inside this game panel to find the hidden object");
      shuffled([...level.decoys, level.target]).forEach((icon) => {
        const isTarget = icon === level.target;
        const item = button("scroll-find-item", isTarget ? "Hidden object" : "Forest item", () => {
          if (isTarget) this.finishLevel();
          else this.kidGuide.say("Keep looking. Scroll a little more.");
        });
        item.textContent = icon;
        if (isTarget) item.dataset.scrollTarget = "true";
        panel.append(item);
      });
      this.challengeArea.append(panel);
    }

    renderLetterStep(level, stepIndex) {
      this.stepIndex = stepIndex;
      this.challengeArea.replaceChildren();
      const step = level.steps[stepIndex];
      this.kidGuide.say(`Find the letter ${step.answer}.`);
      const arc = [[18, 70], [50, 46], [82, 70]];
      shuffled(step.choices).forEach((letter, index) => {
        const stone = button("teddy-stone", `Letter ${letter}`, () => {
          if (letter === step.answer) {
            pulse(stone, "scene-pop");
            if (stepIndex + 1 < level.steps.length) window.setTimeout(() => this.renderLetterStep(level, stepIndex + 1), 260);
            else this.finishLevel();
          } else {
            pulse(stone, "scene-shake");
            this.kidGuide.say("Good try. Look for the letter Teddy needs.");
          }
        });
        stone.textContent = letter;
        stone.style.left = `${arc[index % arc.length][0]}%`;
        stone.style.top = `${arc[index % arc.length][1]}%`;
        this.challengeArea.append(stone);
      });
    }

    renderSense(level) {
      const positions = [[20, 30], [50, 64], [80, 32]];
      shuffled(level.choices).forEach((choice, index) => {
        const item = button("teddy-scene-object", choice.id, () => {
          if (choice.id === level.answer) {
            pulse(item, "scene-pop");
            this.finishLevel();
          } else {
            pulse(item, "scene-shake");
            this.kidGuide.say("Good try. Have another look.");
          }
        });
        item.textContent = choice.icon;
        item.style.left = `${positions[index % positions.length][0]}%`;
        item.style.top = `${positions[index % positions.length][1]}%`;
        this.challengeArea.append(item);
      });
    }

    renderMixedStep(level, stepIndex) {
      this.stepIndex = stepIndex;
      this.challengeArea.replaceChildren();
      const step = level.steps[stepIndex];
      this.kidGuide.say(step.direction);
      if (step.kind === "click") {
        this.collected = 0;
        const spots = [16, 34, 52, 70, 86];
        for (let index = 0; index < step.count; index += 1) {
          const item = button("teddy-scene-object", `Apple ${index + 1}`, () => {
            if (item.classList.contains("collected")) return;
            item.classList.add("collected");
            pulse(item, "scene-pop");
            this.collected += 1;
            if (SoundFx) SoundFx.pop();
            if (this.collected >= step.count) this.advanceMixedStep(level, stepIndex);
          });
          item.textContent = "🍎";
          item.style.left = `${spots[index % spots.length]}%`;
          item.style.top = index % 2 ? "62%" : "32%";
          this.challengeArea.append(item);
        }
      } else if (step.kind === "letter") {
        const arc = [[18, 70], [50, 46], [82, 70]];
        shuffled(step.choices).forEach((letter, index) => {
          const stone = button("teddy-stone", `Letter ${letter}`, () => {
            if (letter === step.answer) {
              pulse(stone, "scene-pop");
              this.advanceMixedStep(level, stepIndex);
            } else {
              pulse(stone, "scene-shake");
              this.kidGuide.say("Good try. Look again.");
            }
          });
          stone.textContent = letter;
          stone.style.left = `${arc[index % arc.length][0]}%`;
          stone.style.top = `${arc[index % arc.length][1]}%`;
          this.challengeArea.append(stone);
        });
      }
    }

    advanceMixedStep(level, stepIndex) {
      if (stepIndex + 1 < level.steps.length) this.renderMixedStep(level, stepIndex + 1);
      else this.finishLevel();
    }

    collectTarget(target, parent) {
      if (target.classList.contains("collected") || this.levelResolving) return;
      target.classList.add("collected");
      if (SoundFx) SoundFx.pop();
      if (Array.from(parent.children).every((child) => child.classList.contains("collected"))) this.finishLevel();
    }

    finishLevel() {
      if (this.levelResolving) return;
      this.levelResolving = true;
      this.stars += 1;
      this.updateScore(25);
      if (SoundFx) SoundFx.levelUp();
      if (this.extensionNumber === 0) this.placeRunner(this.coreIndex + 1, true);
      this.kidGuide.showSuccess("Teddy is getting closer!").then(() => {
        if (this.extensionNumber > 0) this.completeExtension();
        else {
          this.coreIndex += 1;
          this.showCoreLevel();
        }
      });
    }

    startExtension() {
      const pool = this.content.bonusPool.filter((level) => level.id !== this.lastBonusId);
      const bonus = shuffled(pool)[0] || shuffled(this.content.bonusPool)[0];
      this.lastBonusId = bonus.id;
      this.renderLevel(bonus);
    }

    demonstrate() {
      const target = this.challengeArea.querySelector("[data-scroll-target], .teddy-scene-home:not(.collected), .teddy-star:not(.collected), .teddy-scene-object, .teddy-stone");
      if (target) {
        if (target.hasAttribute("data-scroll-target")) target.scrollIntoView({ block: "nearest" });
        target.classList.add("demo-glow");
        window.setTimeout(() => target.classList.remove("demo-glow"), 1000);
      }
    }

    onActivityFinish() {
      this.kidGuide.say("Teddy made it to school! Hooray!");
      this.placeRunner(this.stops.length - 1, true);
      this.challengeArea.innerHTML = `<div class="teddy-arrival"><span aria-hidden="true">🧸</span><span aria-hidden="true">🏫</span><p>Teddy made it!</p></div>`;
      return new Promise((resolve) => window.setTimeout(resolve, 900));
    }
  }

  window.SubDay.Activities.teddyAdventure = TeddyAdventure;
}());
