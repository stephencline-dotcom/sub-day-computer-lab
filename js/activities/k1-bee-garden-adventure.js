/* Bee Garden Adventure — a level-based Kindergarten trackpad game. */
(function () {
  const { element, button, shuffled, pulse } = window.SubDay.K1ActivityUtils;
  const SoundFx = window.SubDay.SoundFx;

  const FLOWER_SPOTS = [
    { x: 14, y: 34 }, { x: 27, y: 62 }, { x: 39, y: 42 },
    { x: 52, y: 66 }, { x: 64, y: 35 }, { x: 76, y: 61 },
    { x: 87, y: 40 }, { x: 20, y: 48 }, { x: 45, y: 52 },
    { x: 69, y: 50 }, { x: 82, y: 72 }, { x: 34, y: 73 }
  ];

  const GARDEN_SPOTS = [
    { x: 31, y: 71 }, { x: 47, y: 75 }, { x: 63, y: 70 },
    { x: 78, y: 76 }, { x: 38, y: 58 }, { x: 57, y: 58 },
    { x: 72, y: 60 }, { x: 87, y: 64 }
  ];

  const CLOUD_PATHS = [16, 38, 62, 82];

  class BeeGardenAdventure extends window.SubDay.ActivityBase {
    constructor(options) {
      super(options);

      this.levels = this.definition.content.levels;
      this.levelIndex = 0;
      this.levelNumber = 1;

      this.score = 0;
      this.honey = 0;

      this.warnedAboutClouds = false;
      this.selectedSeed = null;
      this.selectedWaterCan = null;

      this.guideHints = [
        {
          afterMs: 9000,
          message: "Look around the garden. What does Buzz need to do?",
          target: () => this.board
        },
        {
          afterMs: 9000,
          message: "Follow the glowing object.",
          target: () => this.board
        }
      ];
    }

    start() {
      this.container.innerHTML = `
        <section class="k1-activity bee-garden" aria-label="Bee Garden Adventure">

          <div class="bee-board" data-bee-board>

            <div class="bee-scenery" aria-hidden="true">
              <div class="bee-sun"></div>

              <div class="bee-scenery-cloud bee-scenery-cloud-one"></div>
              <div class="bee-scenery-cloud bee-scenery-cloud-two"></div>

              <div class="bee-hill bee-hill-back"></div>
              <div class="bee-hill bee-hill-front"></div>

              <div class="bee-fence">
                <span></span><span></span><span></span><span></span>
                <span></span><span></span><span></span><span></span>
                <span></span><span></span><span></span><span></span>
              </div>

              <div class="bee-grass-layer"></div>

              <span class="bee-butterfly bee-butterfly-one">🦋</span>
              <span class="bee-butterfly bee-butterfly-two">🦋</span>
            </div>

            <div class="bee-hud">

              <div class="bee-level-label" data-level-label></div>

              <div class="bee-hud-right">
                <div class="bee-honey">
                  <span class="bee-honey-icon">🍯</span>
                  <span class="bee-honey-track">
                    <span class="bee-honey-fill" data-honey-fill></span>
                  </span>
                  <strong data-honey-text>0%</strong>
                </div>

                <div class="bee-score" data-score aria-live="polite"></div>
              </div>

            </div>

            <div class="bee-level-banner" data-level-banner aria-hidden="true"></div>

            <div class="bee-character" data-bee aria-hidden="true">
              <span class="bee-wing bee-wing-left"></span>
              <span class="bee-wing bee-wing-right"></span>

              <span class="bee-body">
                <span class="bee-stripe bee-stripe-one"></span>
                <span class="bee-stripe bee-stripe-two"></span>
              </span>

              <span class="bee-head">
                <span class="bee-antenna bee-antenna-left"></span>
                <span class="bee-antenna bee-antenna-right"></span>
                <span class="bee-eye bee-eye-left"></span>
                <span class="bee-eye bee-eye-right"></span>
                <span class="bee-smile"></span>
              </span>
            </div>

          </div>

          <p class="activity-feedback" data-feedback aria-live="polite"></p>
        </section>
      `;

      this.board = this.container.querySelector("[data-bee-board]");
      this.bee = this.container.querySelector("[data-bee]");
      this.levelLabel = this.container.querySelector("[data-level-label]");
      this.scoreLabel = this.container.querySelector("[data-score]");
      this.honeyFill = this.container.querySelector("[data-honey-fill]");
      this.honeyText = this.container.querySelector("[data-honey-text]");
      this.levelBanner = this.container.querySelector("[data-level-banner]");
      this.feedback = this.container.querySelector("[data-feedback]");

      this.lastBeeX = 50;

      this.beeVisualX = 50;
      this.beeVisualY = 50;
      this.beeTargetX = 50;
      this.beeTargetY = 50;
      this.beeMoveFrame = null;

      this.bee.style.left = "50%";
      this.bee.style.top = "50%";

      this.board.addEventListener(
        "pointermove",
        (event) => this.moveBeeTo(event)
      );

      // Keep Buzz following the child's pointer during seed/watering drags too.
      this.board.addEventListener("dragover", (event) => {
        event.preventDefault();
        if (event.clientX || event.clientY) {
          this.moveBeeTo(event);
        }
      });

      this.updateScore(0);
      this.updateHoney(0);

      this.kidGuide.introduceGame("bee-garden-intro", {
        character: "🐝",
        tell: "Meet Buzz! Help Buzz grow the garden and fill the honey jar."
      }).then(() => this.runCoreLevel());
    }

    moveBeeTo(event) {
      const rect = this.board.getBoundingClientRect();

      const rawX = ((event.clientX - rect.left) / rect.width) * 100;
      const rawY = ((event.clientY - rect.top) / rect.height) * 100;

      const x = Math.min(96, Math.max(4, rawX));
      const y = Math.min(88, Math.max(10, rawY));

      const deltaX = x - this.lastBeeX;
      const tilt = Math.max(-14, Math.min(14, deltaX * 1.8));

      this.bee.style.left = `${x}%`;
      this.bee.style.top = `${y}%`;
      this.bee.style.setProperty("--bee-tilt", `${tilt}deg`);

      // The custom Bee artwork naturally faces left.
      // Flip it when Buzz flies toward the right.
      if (Math.abs(deltaX) > 0.6) {
        this.bee.style.setProperty(
          "--bee-facing",
          deltaX > 0 ? "-1" : "1"
        );
      }

      this.lastBeeX = x;

      window.clearTimeout(this.beeTiltTimer);

      this.beeTiltTimer = window.setTimeout(() => {
        this.bee.style.setProperty("--bee-tilt", "0deg");
      }, 130);
    }

    bounceBee() {
      this.bee.classList.remove("bee-bounce");
      void this.bee.offsetWidth;
      this.bee.classList.add("bee-bounce");
    }

    wetBee() {
      this.bee.classList.remove("bee-wet-shake");
      void this.bee.offsetWidth;
      this.bee.classList.add("bee-wet-shake");

      window.setTimeout(() => {
        this.bee.classList.remove("bee-wet-shake");
      }, 650);
    }

    updateScore(add) {
      this.score += add;
      this.scoreLabel.textContent = `🌼 ${this.score}`;

      if (add > 0) {
        this.scoreLabel.classList.remove("bee-score-pop");
        void this.scoreLabel.offsetWidth;
        this.scoreLabel.classList.add("bee-score-pop");
      }
    }

    updateHoney(add) {
      this.honey = Math.max(0, Math.min(100, this.honey + add));

      if (this.honeyFill) {
        this.honeyFill.style.width = `${this.honey}%`;
      }

      if (this.honeyText) {
        this.honeyText.textContent = `${Math.round(this.honey)}%`;
      }
    }

    showLevelBanner(level, number) {
      if (!this.levelBanner) return;

      this.levelBanner.innerHTML = `
        <span class="bee-level-banner-small">${level.label || `LEVEL ${number}`}</span>
        <strong>${level.title || "Garden Adventure"}</strong>
      `;

      this.levelBanner.classList.remove("bee-level-banner-show");
      void this.levelBanner.offsetWidth;
      this.levelBanner.classList.add("bee-level-banner-show");

      window.clearTimeout(this.levelBannerTimer);

      this.levelBannerTimer = window.setTimeout(() => {
        this.levelBanner.classList.remove("bee-level-banner-show");
      }, 1450);
    }

    makeFlower(index, lit = false) {
      const flower = element(
        "button",
        `bee-flower bee-flower-style-${(index % 4) + 1}${lit ? " bee-flower-lit" : ""}`
      );

      flower.type = "button";
      flower.setAttribute("aria-label", `Flower ${index + 1}`);

      flower.innerHTML = `
        <span class="bee-flower-stem"></span>
        <span class="bee-flower-leaf bee-flower-leaf-left"></span>
        <span class="bee-flower-leaf bee-flower-leaf-right"></span>

        <span class="bee-flower-head">
          <span class="bee-petal bee-petal-one"></span>
          <span class="bee-petal bee-petal-two"></span>
          <span class="bee-petal bee-petal-three"></span>
          <span class="bee-petal bee-petal-four"></span>
          <span class="bee-petal bee-petal-five"></span>
          <span class="bee-flower-center"></span>
        </span>
      `;

      return flower;
    }

    flowerSpots(count) {
      return shuffled(FLOWER_SPOTS).slice(0, Math.min(count, FLOWER_SPOTS.length));
    }

    gardenSpots(count) {
      return shuffled(GARDEN_SPOTS).slice(0, Math.min(count, GARDEN_SPOTS.length));
    }

    runCoreLevel() {
      if (this.levelIndex >= this.levels.length) {
        this.completeCore();
        return;
      }

      this.renderLevel(this.levels[this.levelIndex], this.levelIndex + 1);
    }

    renderLevel(level, number) {
      this.currentLevel = level;
      this.levelResolving = false;
      this.collected = 0;
      this.levelNumber = number;
      this.selectedSeed = null;
      this.selectedWaterCan = null;

      this.levelLabel.textContent = level.label || `LEVEL ${number}`;
      this.feedback.textContent = "";
      this.board.dataset.beeLevel = level.type;

      this.board.querySelectorAll(`
        .bee-flower,
        .bee-seed,
        .bee-seed-bag,
        .bee-plot,
        .bee-hive,
        .bee-carry-meter,
        .bee-watering-can,
        .bee-water-target,
        .bee-cloud,
        .bee-color-callout,
        .bee-ladybug,
        .bee-leaf-home,
        .bee-carried-ladybug,
        .bee-follow-butterfly,
        .bee-follow-ring,
        .bee-follow-meter
      `).forEach((node) => node.remove());

      this.showLevelBanner(level, number);

      if (level.type === "hover") this.renderHoverLevel(level);
      else if (level.type === "click") this.renderClickLevel(level);
      else if (level.type === "delivery") this.renderDeliveryLevel(level);
      else if (level.type === "drag") this.renderDragLevel(level);
      else if (level.type === "water") this.renderWaterLevel(level);
      else if (level.type === "colorhunt") this.renderColorHunt(level);
      else if (level.type === "rescue") this.renderLadybugRescue(level);
      else if (level.type === "follow") this.renderButterflyFollow(level);
      else if (level.type === "obstacle") this.renderObstacleLevel(level);

      let mechanicKey = "click";
      let targetEl = this.board.querySelector(".bee-flower");
      let fromEl;
      let toEl;

      if (
        level.type === "hover" ||
        level.type === "delivery" ||
        level.type === "colorhunt" ||
        level.type === "rescue" ||
        level.type === "follow"
      ) {
        mechanicKey = "hover";

        if (level.type === "colorhunt") {
          targetEl = this.board.querySelector(
            '.bee-flower[data-target-color="true"]'
          );
        }

        if (level.type === "rescue") {
          targetEl = this.board.querySelector(
            ".bee-ladybug:not(.bee-ladybug-rescued)"
          );
        }
      }

      let fullDemo = null;
      let gestureKind = mechanicKey;

      if (level.type === "drag") {
        mechanicKey = "bee-plant-seed";
        gestureKind = "drag";

        fromEl =
          this.board.querySelector(".bee-seed");

        toEl =
          this.board.querySelector(".bee-plot");

        targetEl = undefined;

        fullDemo = () =>
          this.showPlantingDemo();
      }

      if (level.type === "water") {
        mechanicKey = "bee-water-plant";
        gestureKind = "drag";

        fromEl =
          this.board.querySelector(".bee-watering-can");

        toEl =
          this.board.querySelector(".bee-water-target");

        targetEl = undefined;

        fullDemo = () =>
          this.showWateringDemo();
      }

      const teachPromise =
        this.kidGuide.teachMechanic(
          mechanicKey,
          {
            tell: level.direction,
            kind: gestureKind,
            targetEl,
            fromEl,
            toEl,
            fullDemo
          }
        );

      this.kidGuide.gateInteraction(this.board, teachPromise);
    }

    renderHoverLevel(level) {
      this.flowerSpots(level.count).forEach((spot, index) => {
        const flower = this.makeFlower(index, false);

        flower.style.left = `${spot.x}%`;
        flower.style.top = `${spot.y}%`;

        flower.addEventListener("pointerenter", () => this.collectFlower(flower));

        this.board.append(flower);
      });
    }

    renderClickLevel(level) {
      this.flowerSpots(level.count).forEach((spot, index) => {
        const flower = this.makeFlower(index, true);

        flower.style.left = `${spot.x}%`;
        flower.style.top = `${spot.y}%`;

        flower.addEventListener("click", () => this.collectFlower(flower));

        this.board.append(flower);
      });
    }

    renderDeliveryLevel(level) {
      this.carriedPollen = 0;
      this.deliveredPollen = 0;
      this.deliveryTarget = level.count;
      this.deliveryCapacity = level.capacity || 3;

      const hive = button(
        "bee-hive",
        "Bee hive. Bring the pollen here.",
        () => this.deliverPollen(hive)
      );

      hive.innerHTML = `
        <span class="bee-hive-roof"></span>
        <span class="bee-hive-body">
          <span></span><span></span><span></span><span></span>
        </span>
        <span class="bee-hive-door"></span>
        <span class="bee-hive-sign">HIVE</span>
      `;

      hive.addEventListener("pointerenter", () => this.deliverPollen(hive));

      const carryMeter = element("div", "bee-carry-meter");
      carryMeter.setAttribute("data-carry-meter", "");
      carryMeter.innerHTML = `
        <span>🌼 POLLEN</span>
        <strong data-carry-count>0 / ${this.deliveryCapacity}</strong>
      `;

      this.board.append(hive, carryMeter);

      this.flowerSpots(level.count).forEach((spot, index) => {
        const flower = this.makeFlower(index, false);
        flower.classList.add("bee-pollen-flower");

        flower.style.left = `${spot.x}%`;
        flower.style.top = `${spot.y}%`;

        flower.addEventListener(
          "pointerenter",
          () => this.collectPollenFlower(flower, hive)
        );

        flower.addEventListener(
          "click",
          () => this.collectPollenFlower(flower, hive)
        );

        this.board.append(flower);
      });

      this.updateCarryMeter();
    }

    updateCarryMeter() {
      const count = this.board.querySelector("[data-carry-count]");

      if (count) {
        count.textContent = `${this.carriedPollen} / ${this.deliveryCapacity}`;
      }
    }

    collectPollenFlower(flower, hive) {
      if (
        this.levelResolving ||
        flower.classList.contains("collected")
      ) return;

      if (this.carriedPollen >= this.deliveryCapacity) {
        hive.classList.add("bee-hive-ready");
        pulse(hive, "bee-hive-pulse");
        return;
      }

      flower.classList.add("collected");

      this.carriedPollen += 1;
      this.updateCarryMeter();
      this.updateScore(10);

      if (SoundFx) SoundFx.collect();

      this.bounceBee();

      if (
        this.carriedPollen >= this.deliveryCapacity ||
        this.deliveredPollen + this.carriedPollen >= this.deliveryTarget
      ) {
        hive.classList.add("bee-hive-ready");
        pulse(hive, "bee-hive-pulse");

        this.kidGuide.say("Buzz is full! Fly to the hive!");
      }
    }

    deliverPollen(hive) {
      if (this.levelResolving || !this.carriedPollen) return;

      const amount = this.carriedPollen;

      this.deliveredPollen += amount;
      this.carriedPollen = 0;

      this.updateCarryMeter();
      this.updateHoney(amount * 4);
      this.updateScore(amount * 5);

      hive.classList.remove("bee-hive-ready");
      pulse(hive, "bee-hive-happy");

      if (SoundFx) SoundFx.success();

      this.bounceBee();

      if (this.deliveredPollen >= this.deliveryTarget) {
        window.setTimeout(() => this.finishLevel(), 500);
      } else {
        this.kidGuide.say("Great delivery! Find more flowers.");
      }
    }

    async showPlantingDemo() {
      const demo = element("div", "bee-action-demo bee-plant-demo");

      demo.innerHTML = `
        <div class="bee-demo-title">
          <strong>WATCH FIRST!</strong>
          <span>Plant a seed</span>
        </div>

        <div class="bee-demo-seed" data-demo-seed>
          <span></span>
        </div>

        <div class="bee-demo-mound" data-demo-mound>
          <span class="bee-demo-dirt"></span>

          <span class="bee-demo-sprout" data-demo-sprout>
            <span class="bee-demo-sprout-stem"></span>
            <span class="bee-demo-sprout-leaf bee-demo-leaf-left"></span>
            <span class="bee-demo-sprout-leaf bee-demo-leaf-right"></span>
          </span>
        </div>

        <div class="bee-demo-hand" data-demo-hand>🤏</div>

        <div class="bee-demo-caption" data-demo-caption>
          1. GRAB THE SEED
        </div>
      `;

      this.board.append(demo);

      const seed = demo.querySelector("[data-demo-seed]");
      const mound = demo.querySelector("[data-demo-mound]");
      const sprout = demo.querySelector("[data-demo-sprout]");
      const hand = demo.querySelector("[data-demo-hand]");
      const caption = demo.querySelector("[data-demo-caption]");

      await this.kidGuide.wait(500);

      hand.classList.add("bee-demo-hand-down");
      seed.classList.add("bee-demo-seed-lift");

      await this.kidGuide.wait(650);

      caption.textContent = "2. HOLD AND MOVE";

      const seedRect = seed.getBoundingClientRect();
      const moundRect = mound.getBoundingClientRect();

      const dx =
        moundRect.left +
        moundRect.width / 2 -
        (seedRect.left + seedRect.width / 2);

      const dy =
        moundRect.top +
        moundRect.height / 2 -
        (seedRect.top + seedRect.height / 2);

      mound.classList.add("bee-demo-mound-ready");

      const seedMove = seed.animate(
        [
          { transform: "translate(0, 0) scale(1.12)" },
          {
            transform:
              `translate(${dx}px, ${dy - 8}px) scale(1.12)`
          }
        ],
        {
          duration: 1150,
          easing: "ease-in-out",
          fill: "forwards"
        }
      );

      const handMove = hand.animate(
        [
          { transform: "translate(0, 0)" },
          {
            transform:
              `translate(${dx}px, ${dy - 8}px)`
          }
        ],
        {
          duration: 1150,
          easing: "ease-in-out",
          fill: "forwards"
        }
      );

      await Promise.all([
        seedMove.finished.catch(() => {}),
        handMove.finished.catch(() => {})
      ]);

      caption.textContent = "3. LET GO IN THE DIRT";

      await this.kidGuide.wait(450);

      hand.classList.remove("bee-demo-hand-down");
      seed.style.opacity = "0";

      mound.classList.remove("bee-demo-mound-ready");
      mound.classList.add("bee-demo-mound-planted");

      await this.kidGuide.wait(350);

      sprout.classList.add("bee-demo-sprout-grow");

      caption.textContent = "LOOK! IT GROWS!";

      if (SoundFx) SoundFx.success();

      await this.kidGuide.wait(1000);

      caption.textContent = "NOW YOU TRY!";

      demo.classList.add("bee-demo-finish");

      await this.kidGuide.wait(750);

      demo.remove();
    }

    async showWateringDemo() {
      const demo = element("div", "bee-action-demo bee-water-demo");

      demo.innerHTML = `
        <div class="bee-demo-title">
          <strong>WATCH FIRST!</strong>
          <span>Water a plant</span>
        </div>

        <div class="bee-demo-can" data-demo-can>
          <span class="bee-demo-can-handle"></span>
          <span class="bee-demo-can-body"></span>
          <span class="bee-demo-can-spout"></span>
        </div>

        <div class="bee-demo-water-plant" data-demo-water-plant>
          <span class="bee-demo-dirt"></span>

          <span class="bee-demo-small-sprout">
            🌱
          </span>

          <span class="bee-demo-grown-flower" data-demo-flower>
            🌼
          </span>
        </div>

        <div class="bee-demo-hand bee-demo-water-hand"
             data-demo-hand>🤏</div>

        <div class="bee-demo-caption" data-demo-caption>
          1. GRAB THE WATERING CAN
        </div>
      `;

      this.board.append(demo);

      const can = demo.querySelector("[data-demo-can]");
      const plant = demo.querySelector("[data-demo-water-plant]");
      const flower = demo.querySelector("[data-demo-flower]");
      const hand = demo.querySelector("[data-demo-hand]");
      const caption = demo.querySelector("[data-demo-caption]");

      await this.kidGuide.wait(500);

      hand.classList.add("bee-demo-hand-down");
      can.classList.add("bee-demo-can-lift");

      await this.kidGuide.wait(600);

      caption.textContent = "2. MOVE IT TO THE PLANT";

      const canRect = can.getBoundingClientRect();
      const plantRect = plant.getBoundingClientRect();

      const dx =
        plantRect.left +
        plantRect.width / 2 -
        (canRect.left + canRect.width / 2);

      const dy =
        plantRect.top +
        plantRect.height / 2 -
        (canRect.top + canRect.height / 2);

      plant.classList.add("bee-demo-water-ready");

      const canMove = can.animate(
        [
          { transform: "translate(0,0) scale(1.08)" },
          {
            transform:
              `translate(${dx - 25}px, ${dy - 35}px) scale(1.08) rotate(-18deg)`
          }
        ],
        {
          duration: 1150,
          easing: "ease-in-out",
          fill: "forwards"
        }
      );

      const handMove = hand.animate(
        [
          { transform: "translate(0,0)" },
          {
            transform:
              `translate(${dx - 25}px, ${dy - 35}px)`
          }
        ],
        {
          duration: 1150,
          easing: "ease-in-out",
          fill: "forwards"
        }
      );

      await Promise.all([
        canMove.finished.catch(() => {}),
        handMove.finished.catch(() => {})
      ]);

      caption.textContent = "3. LET GO TO WATER";

      await this.kidGuide.wait(450);

      hand.classList.remove("bee-demo-hand-down");

      const splash = element(
        "span",
        "bee-demo-water-drops",
        "💧 💧 💧"
      );

      plant.append(splash);

      plant.classList.remove("bee-demo-water-ready");

      await this.kidGuide.wait(500);

      flower.classList.add("bee-demo-flower-grow");

      caption.textContent = "LOOK! A FLOWER!";

      if (SoundFx) SoundFx.success();

      await this.kidGuide.wait(950);

      caption.textContent = "NOW YOU TRY!";

      demo.classList.add("bee-demo-finish");

      await this.kidGuide.wait(750);

      demo.remove();
    }

    beginPointerCarry(item, event, options = {}) {
      event.preventDefault();

      const boardRect = this.board.getBoundingClientRect();

      item.classList.add("bee-carrying-object");

      if (item.setPointerCapture) {
        try {
          item.setPointerCapture(event.pointerId);
        } catch (error) {
          // Pointer capture is helpful but not required.
        }
      }

      const move = (moveEvent) => {
        moveEvent.preventDefault();

        this.moveBeeTo(moveEvent);

        const x = ((moveEvent.clientX - boardRect.left) / boardRect.width) * 100;
        const y = ((moveEvent.clientY - boardRect.top) / boardRect.height) * 100;

        item.style.left = `${Math.min(94, Math.max(6, x + (options.offsetX || 0)))}%`;
        item.style.top = `${Math.min(90, Math.max(10, y + (options.offsetY || 6)))}%`;
        item.style.bottom = "auto";
      };

      const finish = (upEvent) => {
        item.removeEventListener("pointermove", move);
        item.removeEventListener("pointerup", finish);
        item.removeEventListener("pointercancel", cancel);

        item.classList.remove("bee-carrying-object");

        if (item.releasePointerCapture) {
          try {
            item.releasePointerCapture(upEvent.pointerId);
          } catch (error) {
            // Safe fallback.
          }
        }

        let dropTarget = null;

        if (options.dropSelector) {
          const itemRect = item.getBoundingClientRect();

          const candidates = Array.from(
            this.board.querySelectorAll(options.dropSelector)
          );

          let bestOverlap = 0;

          candidates.forEach((candidate) => {
            const targetRect = candidate.getBoundingClientRect();

            // Make the drop zone slightly forgiving for Kindergarten.
            const padding = 12;

            const expanded = {
              left: targetRect.left - padding,
              right: targetRect.right + padding,
              top: targetRect.top - padding,
              bottom: targetRect.bottom + padding
            };

            const overlapWidth = Math.max(
              0,
              Math.min(itemRect.right, expanded.right) -
              Math.max(itemRect.left, expanded.left)
            );

            const overlapHeight = Math.max(
              0,
              Math.min(itemRect.bottom, expanded.bottom) -
              Math.max(itemRect.top, expanded.top)
            );

            const overlapArea = overlapWidth * overlapHeight;

            if (overlapArea > bestOverlap) {
              bestOverlap = overlapArea;
              dropTarget = candidate;
            }
          });

          // Require some real contact, but not perfect placement.
          const itemArea =
            Math.max(1, itemRect.width * itemRect.height);

          if (bestOverlap / itemArea < 0.12) {
            dropTarget = null;
          }
        }

        if (dropTarget && options.onDrop) {
          options.onDrop(dropTarget);
        } else if (options.onCancel) {
          options.onCancel();
        }
      };

      const cancel = () => {
        item.removeEventListener("pointermove", move);
        item.removeEventListener("pointerup", finish);
        item.removeEventListener("pointercancel", cancel);

        item.classList.remove("bee-carrying-object");

        if (options.onCancel) {
          options.onCancel();
        }
      };

      item.addEventListener("pointermove", move);
      item.addEventListener("pointerup", finish);
      item.addEventListener("pointercancel", cancel);

      move(event);
    }

    renderDragLevel(level) {
      const seedBag = element("div", "bee-seed-bag");

      seedBag.innerHTML = `
        <span class="bee-seed-bag-top"></span>
        <strong>SEEDS</strong>
      `;

      this.board.append(seedBag);

      const plots = this.gardenSpots(level.count);

      plots.forEach((spot, index) => {
        const plot = button(
          "bee-plot",
          `Garden dirt patch ${index + 1}`,
          () => {
            if (
              this.selectedSeed &&
              !this.selectedSeed.classList.contains("collected")
            ) {
              this.plantSeed(this.selectedSeed, plot);
            }
          }
        );

        plot.style.left = `${spot.x}%`;
        plot.style.top = `${spot.y}%`;

        plot.innerHTML = `
          <span class="bee-dirt"></span>
        `;

        this.board.append(plot);

        const seed = button(
          "bee-seed",
          `Seed ${index + 1}. Select it, then choose dirt.`,
          () => {
            this.selectedSeed = seed;

            this.container
              .querySelectorAll(".bee-seed")
              .forEach((node) => node.classList.remove("object-selected"));

            seed.classList.add("object-selected");
          }
        );

        seed.draggable = false;

        const homeLeft = `${10 + (index % 4) * 5}%`;
        const homeTop = `${69 + Math.floor(index / 4) * 8}%`;

        seed.style.left = homeLeft;
        seed.style.top = homeTop;

        seed.innerHTML = `<span class="bee-seed-shape"></span>`;

        seed.addEventListener("pointerdown", (event) => {
          if (seed.classList.contains("collected")) return;

          this.selectedSeed = seed;

          this.container
            .querySelectorAll(".bee-seed")
            .forEach((node) => node.classList.remove("object-selected"));

          seed.classList.add("object-selected");

          this.beginPointerCarry(seed, event, {
            offsetY: 7,
            dropSelector: ".bee-plot:not(.collected)",

            onDrop: (plot) => {
              this.plantSeed(seed, plot);
            },

            onCancel: () => {
              seed.style.left = homeLeft;
              seed.style.top = homeTop;
              seed.classList.remove("object-selected");
              this.selectedSeed = null;
            }
          });
        });

        this.board.append(seed);
      });
    }

    plantSeed(seed, plot) {
      if (
        seed.classList.contains("collected") ||
        plot.classList.contains("collected")
      ) return;

      seed.classList.add("collected");
      seed.classList.remove("object-selected");

      plot.classList.add("collected", "bee-plot-planted");

      plot.innerHTML = `
        <span class="bee-dirt"></span>
        <span class="bee-sprout">
          <span class="bee-sprout-stem"></span>
          <span class="bee-sprout-leaf bee-sprout-left"></span>
          <span class="bee-sprout-leaf bee-sprout-right"></span>
        </span>
      `;

      window.setTimeout(() => {
        plot.classList.add("bee-sprout-grown");
      }, 80);

      this.selectedSeed = null;

      if (SoundFx) SoundFx.pop();

      this.updateScore(15);
      this.bounceBee();

      this.collected += 1;

      if (this.collected >= this.currentLevel.count) {
        window.setTimeout(() => this.finishLevel(), 600);
      }
    }

    renderWaterLevel(level) {
      const wateringCan = button(
        "bee-watering-can",
        "Watering can. Select it, then water the sprouts.",
        () => {
          this.selectedWaterCan = wateringCan;
          wateringCan.classList.add("object-selected");
        }
      );

      wateringCan.draggable = false;

      wateringCan.innerHTML = `
        <span class="bee-can-handle"></span>
        <span class="bee-can-body"></span>
        <span class="bee-can-spout"></span>
        <span class="bee-can-water">💧</span>
      `;

      const canHome = {
        left: "7%",
        bottom: "8%"
      };

      wateringCan.addEventListener("pointerdown", (event) => {
        this.selectedWaterCan = wateringCan;
        wateringCan.classList.add("object-selected");

        this.beginPointerCarry(wateringCan, event, {
          offsetY: 8,
          dropSelector: ".bee-water-target:not(.bee-watered)",

          onDrop: (target) => {
            this.waterPlant(target);

            wateringCan.style.left = canHome.left;
            wateringCan.style.top = "";
            wateringCan.style.bottom = canHome.bottom;
            wateringCan.classList.remove("object-selected");
            this.selectedWaterCan = null;
          },

          onCancel: () => {
            wateringCan.style.left = canHome.left;
            wateringCan.style.top = "";
            wateringCan.style.bottom = canHome.bottom;
            wateringCan.classList.remove("object-selected");
            this.selectedWaterCan = null;
          }
        });
      });

      this.board.append(wateringCan);

      this.gardenSpots(level.count).forEach((spot, index) => {
        const target = button(
          "bee-water-target",
          `Sprout ${index + 1}. Water this plant.`,
          () => {
            if (this.selectedWaterCan) this.waterPlant(target);
          }
        );

        target.style.left = `${spot.x}%`;
        target.style.top = `${spot.y}%`;

        target.innerHTML = `
          <span class="bee-dirt"></span>
          <span class="bee-sprout bee-sprout-ready">
            <span class="bee-sprout-stem"></span>
            <span class="bee-sprout-leaf bee-sprout-left"></span>
            <span class="bee-sprout-leaf bee-sprout-right"></span>
          </span>
        `;

        this.board.append(target);
      });
    }

    waterPlant(target) {
      if (
        this.levelResolving ||
        target.classList.contains("bee-watered")
      ) return;

      target.classList.add("bee-watered");

      target.innerHTML = `
        <span class="bee-dirt"></span>
        <span class="bee-grown-flower">
          <span class="bee-grown-flower-stem"></span>
          <span class="bee-grown-flower-head">🌼</span>
        </span>
        <span class="bee-water-splash">💦</span>
      `;

      if (SoundFx) SoundFx.success();

      this.updateScore(15);
      this.updateHoney(3);

      this.bounceBee();

      this.collected += 1;

      if (this.collected >= this.currentLevel.count) {
        window.setTimeout(() => this.finishLevel(), 650);
      }
    }

    renderColorHunt(level) {
      this.colorRound = 0;

      this.colorPalette = [
        { name: "red", hex: "#ff546d" },
        { name: "yellow", hex: "#ffd83d" },
        { name: "purple", hex: "#9b6cff" },
        { name: "pink", hex: "#f36bc2" },
        { name: "orange", hex: "#ff914d" },
        { name: "blue", hex: "#55a9ff" }
      ];

      this.colorSequence = shuffled(this.colorPalette)
        .slice(0, Math.min(level.count, this.colorPalette.length));

      while (this.colorSequence.length < level.count) {
        const refill = shuffled(this.colorPalette);

        refill.forEach((color) => {
          if (this.colorSequence.length < level.count) {
            this.colorSequence.push(color);
          }
        });
      }

      const callout = element("div", "bee-color-callout");
      callout.setAttribute("data-color-callout", "");

      this.board.append(callout);

      this.showColorRound();
    }

    showColorRound() {
      if (this.colorRound >= this.colorSequence.length) {
        this.finishLevel();
        return;
      }

      const targetColor = this.colorSequence[this.colorRound];

      this.board
        .querySelectorAll(".bee-color-round-flower")
        .forEach((node) => node.remove());

      const callout = this.board.querySelector("[data-color-callout]");

      if (callout) {
        callout.innerHTML = `
          <span
            class="bee-color-swatch"
            style="--swatch-color:${targetColor.hex}"
          ></span>
          <strong>FIND ${targetColor.name.toUpperCase()}</strong>
        `;
      }

      const wrongColors = shuffled(
        this.colorPalette.filter((color) => color.name !== targetColor.name)
      ).slice(0, 4);

      const choices = shuffled([
        targetColor,
        ...wrongColors
      ]);

      const spots = this.flowerSpots(choices.length);

      choices.forEach((color, index) => {
        const flower = this.makeFlower(index, false);

        flower.classList.add("bee-color-round-flower");
        flower.style.setProperty("--flower-color", color.hex);
        flower.style.left = `${spots[index].x}%`;
        flower.style.top = `${spots[index].y}%`;
        flower.dataset.flowerColor = color.name;
        flower.dataset.targetColor =
          String(color.name === targetColor.name);

        flower.addEventListener("pointerenter", () => {
          this.chooseColorFlower(flower, color, targetColor);
        });

        flower.addEventListener("click", () => {
          this.chooseColorFlower(flower, color, targetColor);
        });

        this.board.append(flower);
      });

      this.kidGuide.say(`Find the ${targetColor.name} flower.`);
    }

    chooseColorFlower(flower, color, targetColor) {
      if (this.levelResolving || flower.classList.contains("collected")) {
        return;
      }

      if (color.name !== targetColor.name) {
        flower.classList.remove("bee-flower-wiggle");
        void flower.offsetWidth;
        flower.classList.add("bee-flower-wiggle");

        this.kidGuide.say(
          `Good try. Find the ${targetColor.name} flower.`
        );

        return;
      }

      flower.classList.add("collected");

      if (SoundFx) SoundFx.collect();

      this.updateScore(12);
      this.updateHoney(2);
      this.bounceBee();

      this.colorRound += 1;

      this.kidGuide
        .showSuccess(`${targetColor.name}!`)
        .then(() => {
          if (!this.levelResolving) {
            this.showColorRound();
          }
        });
    }

    renderLadybugRescue(level) {
      this.rescuedLadybugs = 0;
      this.ladybugTarget = level.count;
      this.carriedLadybug = null;

      const leaf = button(
        "bee-leaf-home",
        "Big leaf. Bring the ladybug here.",
        () => this.deliverLadybug(leaf)
      );

      leaf.innerHTML = `
        <span class="bee-leaf-shape"></span>
        <span class="bee-leaf-stem"></span>
        <span class="bee-leaf-label">SAFE LEAF</span>
        <span class="bee-leaf-family" data-leaf-family></span>
      `;

      leaf.addEventListener(
        "pointerenter",
        () => this.deliverLadybug(leaf)
      );

      this.board.append(leaf);

      const spots = this.flowerSpots(level.count);

      spots.forEach((spot, index) => {
        const ladybug = button(
          "bee-ladybug",
          `Ladybug friend ${index + 1}`,
          () => this.pickUpLadybug(ladybug, leaf)
        );

        ladybug.style.left = `${spot.x}%`;
        ladybug.style.top = `${spot.y}%`;

        ladybug.innerHTML = `
          <span class="bee-ladybug-head"></span>
          <span class="bee-ladybug-body">
            <span class="bee-ladybug-line"></span>
            <i class="bee-ladybug-dot bee-ladybug-dot-1"></i>
            <i class="bee-ladybug-dot bee-ladybug-dot-2"></i>
            <i class="bee-ladybug-dot bee-ladybug-dot-3"></i>
            <i class="bee-ladybug-dot bee-ladybug-dot-4"></i>
          </span>
        `;

        ladybug.addEventListener(
          "pointerenter",
          () => this.pickUpLadybug(ladybug, leaf)
        );

        this.board.append(ladybug);
      });
    }

    pickUpLadybug(ladybug, leaf) {
      if (
        this.levelResolving ||
        this.carriedLadybug ||
        ladybug.classList.contains("bee-ladybug-rescued")
      ) {
        return;
      }

      ladybug.classList.add("bee-ladybug-rescued");

      this.carriedLadybug = ladybug;

      const carried = element(
        "span",
        "bee-carried-ladybug",
        "🐞"
      );

      this.bee.append(carried);

      leaf.classList.add("bee-leaf-ready");

      if (SoundFx) SoundFx.collect();

      this.updateScore(8);
      this.bounceBee();

      this.kidGuide.say(
        "You found a ladybug! Take your friend to the big leaf."
      );
    }

    deliverLadybug(leaf) {
      if (
        this.levelResolving ||
        !this.carriedLadybug
      ) {
        return;
      }

      this.carriedLadybug = null;

      const carried = this.bee.querySelector(
        ".bee-carried-ladybug"
      );

      if (carried) carried.remove();

      leaf.classList.remove("bee-leaf-ready");

      this.rescuedLadybugs += 1;

      const family = leaf.querySelector(
        "[data-leaf-family]"
      );

      if (family) {
        const littleBug = element(
          "span",
          "bee-leaf-ladybug",
          "🐞"
        );

        family.append(littleBug);
      }

      leaf.classList.remove("bee-leaf-happy");
      void leaf.offsetWidth;
      leaf.classList.add("bee-leaf-happy");

      if (SoundFx) SoundFx.success();

      this.updateScore(15);
      this.updateHoney(2);
      this.bounceBee();

      if (this.rescuedLadybugs >= this.ladybugTarget) {
        window.setTimeout(() => {
          this.finishLevel();
        }, 550);

        return;
      }

      this.kidGuide.say(
        "Safe! Find another ladybug friend."
      );
    }

    renderButterflyFollow(level) {
      this.followProgress = 0;
      this.followRequired = level.followSeconds || 9;
      this.followStartedAt = performance.now();
      this.followLastFrame = performance.now();

      // Adaptive Butterfly Follow tracking.
      this.followTotalTime = 0;
      this.followCloseTime = 0;
      this.followGraceUntil = 0;
      this.followDifficulty = "normal";
      this.followLastAdaptCheck = 0;

      const butterfly = element(
        "div",
        "bee-follow-butterfly",
        "🦋"
      );

      const ring = element(
        "div",
        "bee-follow-ring"
      );

      const meter = element(
        "div",
        "bee-follow-meter"
      );

      meter.innerHTML = `
        <span>FOLLOW THE BUTTERFLY</span>
        <span class="bee-follow-track">
          <span class="bee-follow-fill" data-follow-fill></span>
        </span>
      `;

      this.board.append(ring, butterfly, meter);

      this.followButterfly = butterfly;
      this.followRing = ring;
      this.followFill = meter.querySelector("[data-follow-fill]");

      this.followLoop = (now) => {
        if (
          this.levelResolving ||
          !this.followButterfly ||
          !this.followButterfly.isConnected
        ) {
          return;
        }

        const elapsed =
          (now - this.followStartedAt) / 1000;

        /*
         * Start slowly so the child can find the butterfly.
         * Then gently reach normal Kindergarten speed.
         */
        const requestedSpeed =
          Number(level.speed || 1);

        /*
         * Quiet adaptive difficulty.
         *
         * Every few seconds, look at how successfully the
         * child has stayed near the butterfly.
         */
        if (
          elapsed > 3 &&
          now - this.followLastAdaptCheck > 1800
        ) {
          this.followLastAdaptCheck = now;

          const followRatio =
            this.followTotalTime > 0
              ? this.followCloseTime /
                this.followTotalTime
              : 0;

          if (followRatio < 0.38) {
            this.followDifficulty =
              "support";
          } else if (
            followRatio > 0.78 &&
            elapsed > 5
          ) {
            this.followDifficulty =
              "challenge";
          } else {
            this.followDifficulty =
              "normal";
          }

          this.board.dataset.followDifficulty =
            this.followDifficulty;
        }

        let adaptiveSpeed = 1;

        if (
          this.followDifficulty ===
          "support"
        ) {
          adaptiveSpeed = 0.72;
        }

        if (
          this.followDifficulty ===
          "challenge"
        ) {
          adaptiveSpeed = 1.12;
        }

        const speedRamp =
          Math.min(
            1,
            elapsed / 3
          );

        const speed =
          requestedSpeed *
          adaptiveSpeed *
          (
            0.55 +
            speedRamp * 0.45
          );

        /*
         * Smooth looping flight instead of rapid,
         * twitchy changes in direction.
         */
        const x =
          50 +
          Math.sin(
            elapsed * 0.62 * speed
          ) * 27 +
          Math.sin(
            elapsed * 1.05 * speed
          ) * 4;

        const y =
          47 +
          Math.cos(
            elapsed * 0.50 * speed
          ) * 18 +
          Math.sin(
            elapsed * 0.88 * speed
          ) * 4;

        butterfly.style.left = `${x}%`;
        butterfly.style.top = `${y}%`;

        ring.style.left = `${x}%`;
        ring.style.top = `${y}%`;

        /*
         * Use the REAL visible circle instead of percentage
         * coordinates. If Buzz looks like he is inside the
         * circle, the game should count it.
         */
        const beeRect =
          this.bee.getBoundingClientRect();

        const ringRect =
          ring.getBoundingClientRect();

        const beeCenterX =
          beeRect.left + beeRect.width / 2;

        const beeCenterY =
          beeRect.top + beeRect.height / 2;

        const ringCenterX =
          ringRect.left + ringRect.width / 2;

        const ringCenterY =
          ringRect.top + ringRect.height / 2;

        const distancePixels =
          Math.hypot(
            beeCenterX - ringCenterX,
            beeCenterY - ringCenterY
          );

        const ringRadius =
          Math.min(
            ringRect.width,
            ringRect.height
          ) / 2;

        /*
         * Count part of Buzz's body too. The child should not
         * need to put Buzz's exact center perfectly inside.
         */
        const beeAllowance =
          Math.min(
            beeRect.width,
            beeRect.height
          ) * 0.30;

        const physicallyInside =
          distancePixels <=
          ringRadius + beeAllowance;

        const deltaSeconds =
          Math.min(
            0.05,
            (now - this.followLastFrame) / 1000
          );

        this.followLastFrame = now;

        /*
         * Tiny edge grace period prevents the follow meter
         * flickering if a child brushes the boundary.
         */
        if (physicallyInside) {
          this.followGraceUntil =
            now + 220;
        }

        const countsAsInside =
          physicallyInside ||
          now <= (this.followGraceUntil || 0);

        this.followTotalTime +=
          deltaSeconds;

        if (countsAsInside) {
          this.followCloseTime +=
            deltaSeconds;

          this.followProgress +=
            deltaSeconds;

          ring.classList.add(
            "bee-follow-close"
          );

          butterfly.classList.add(
            "bee-butterfly-happy"
          );
        } else {
          ring.classList.remove(
            "bee-follow-close"
          );

          butterfly.classList.remove(
            "bee-butterfly-happy"
          );
        }

        const ratio =
          Math.min(
            1,
            this.followProgress / this.followRequired
          );

        if (this.followFill) {
          this.followFill.style.width =
            `${ratio * 100}%`;
        }

        if (ratio >= 1) {
          if (SoundFx) SoundFx.levelUp();

          this.updateScore(40);
          this.updateHoney(8);
          this.bounceBee();

          this.finishLevel();
          return;
        }

        this.followAnimationFrame =
          requestAnimationFrame(this.followLoop);
      };

      this.followAnimationFrame =
        requestAnimationFrame(this.followLoop);
    }

    stopButterflyFollow() {
      if (this.followAnimationFrame) {
        cancelAnimationFrame(
          this.followAnimationFrame
        );

        this.followAnimationFrame = null;
      }

      this.followButterfly = null;
      this.followRing = null;
      this.followFill = null;
    }

    renderObstacleLevel(level) {
      this.flowerSpots(level.count).forEach((spot, index) => {
        const flower = this.makeFlower(index, false);

        flower.style.left = `${spot.x}%`;
        flower.style.top = `${spot.y}%`;

        flower.addEventListener("click", () => this.collectFlower(flower));
        flower.addEventListener("pointerenter", () => this.collectFlower(flower));

        this.board.append(flower);
      });

      shuffled(CLOUD_PATHS)
        .slice(0, level.obstacles || 2)
        .forEach((left, index) => {
          const cloud = element("span", "bee-cloud", "☁️");

          cloud.style.left = `${left}%`;
          cloud.style.top = `${18 + (index % 3) * 22}%`;
          cloud.style.animationDuration = `${6.5 + index * 1.4}s`;

          cloud.addEventListener("pointerenter", () => this.reactToCloud());
          cloud.addEventListener("click", () => this.reactToCloud());

          this.board.append(cloud);
        });
    }

    reactToCloud() {
      this.wetBee();

      if (SoundFx) SoundFx.gentle();

      if (!this.warnedAboutClouds) {
        this.warnedAboutClouds = true;
        this.kidGuide.say("Splash! Buzz got a little wet. Keep going!");
      }
    }

    collectFlower(flower) {
      if (
        flower.classList.contains("collected") ||
        this.levelResolving
      ) return;

      flower.classList.add("collected");

      if (SoundFx) SoundFx.collect();

      this.updateScore(10);
      this.bounceBee();

      this.collected += 1;

      if (this.collected >= this.currentLevel.count) {
        this.finishLevel();
      }
    }

    finishLevel() {
      if (this.levelResolving) return;

      this.levelResolving = true;

      this.stopButterflyFollow();

      const reward = Number(this.currentLevel.honeyReward || 0);

      if (reward > 0) {
        this.updateHoney(reward);
      }

      this.updateScore(20);

      if (SoundFx) SoundFx.levelUp();

      const message =
        this.currentLevel.success ||
        "Great job in the garden!";

      this.kidGuide.showSuccess(message).then(() => {
        if (this.extensionNumber > 0) {
          this.completeExtension();
        } else {
          this.levelIndex += 1;
          this.runCoreLevel();
        }
      });
    }

    startExtension(context) {
      const template = this.levels[context.round % this.levels.length];

      let maxCount = 9;

      if (template.type === "drag" || template.type === "water") {
        maxCount = 6;
      }

      if (template.type === "delivery") {
        maxCount = 10;
      }

      const bonusLevel = {
        ...template,
        label: "BONUS",
        title: `${template.title || "Garden Job"} +`,
        count: Math.min(
          maxCount,
          (template.count || 4) + Math.floor(context.round / 2)
        ),
        obstacles: template.obstacles
          ? Math.min(5, template.obstacles + 1)
          : template.obstacles
      };

      this.renderLevel(
        bonusLevel,
        this.levelNumber + context.round
      );
    }

    demonstrate() {
      const target = this.board.querySelector(`
        .bee-flower[data-target-color="true"]:not(.collected),
        .bee-ladybug:not(.bee-ladybug-rescued),
        .bee-leaf-home.bee-leaf-ready,
        .bee-flower:not(.collected),
        .bee-hive.bee-hive-ready,
        .bee-plot:not(.collected),
        .bee-water-target:not(.bee-watered)
      `);

      if (target) {
        target.classList.add("demo-glow");

        window.setTimeout(() => {
          target.classList.remove("demo-glow");
        }, 1000);
      }
    }

    onActivityFinish() {
      this.kidGuide.say("Buzz did it! The garden is blooming and the hive is full!");

      return new Promise((resolve) => {
        window.setTimeout(resolve, 900);
      });
    }
  }

  window.SubDay.Activities.beeGardenAdventure = BeeGardenAdventure;
}());
