/* Fast-moving sprint that rotates short senses, rhyme, letter, and sorting rounds, each its own mini-scene. */
(function () {
  const { element, button, shuffled, scatterPositions, pulse } = window.SubDay.K1ActivityUtils;

  const SENSE_IDS = ["hear", "smell", "taste", "touch", "see"];
  const SECTION_BADGES = { senses: "👃", rhymes: "🎵", alphabet: "🔤", sort: "🧺" };

  class K1PracticeSprint extends window.SubDay.ActivityBase {
    constructor(options) {
      super(options);
      this.content = this.definition.content;
      this.sensePools = this.lessonContent.sensePools;
      this.sections = this.content.sections;
      this.sectionIndex = 0;
      this.itemIndex = 0;
      this.lastSense = null;
      this.lastRhyme = -1;
      this.lastLetter = null;
      this.lastSort = -1;
      this.guideHints = [
        { afterMs: 8000, message: "Pick the object that matches.", target: () => this.scene }
      ];
    }

    start() {
      this.container.innerHTML = `<section class="k1-activity practice-sprint" aria-label="Kindergarten Practice Sprint"><div class="sprint-scene" data-scene><span class="sprint-scene-badge" data-badge aria-hidden="true"></span><div class="sprint-scene-objects" data-objects></div></div><div class="sprint-banner" data-banner hidden></div></section>`;
      this.scene = this.container.querySelector("[data-scene]");
      this.badge = this.container.querySelector("[data-badge]");
      this.objects = this.container.querySelector("[data-objects]");
      this.banner = this.container.querySelector("[data-banner]");
      this.runSection();
    }

    runSection() {
      if (this.sectionIndex >= this.sections.length) {
        this.completeCore();
        return;
      }
      this.itemIndex = 0;
      const section = this.sections[this.sectionIndex];
      this.kidGuide.say(section.intro).then(() => { if (!this.completed) this.runItem(); });
    }

    runItem() {
      const section = this.sections[this.sectionIndex];
      if (this.itemIndex >= section.count) {
        this.showSectionBanner(section);
        return;
      }
      this.renderChallenge(section.id);
    }

    showSectionBanner(section) {
      this.banner.hidden = false;
      this.banner.textContent = section.banner;
      this.kidGuide.sayAndWait(section.banner, { timeoutMs: 2200 }).then(() => {
        window.setTimeout(() => {
          this.banner.hidden = true;
          if (this.completed) return;
          this.sectionIndex += 1;
          this.runSection();
        }, 500);
      });
    }

    renderChallenge(sectionId) {
      this.objects.replaceChildren();
      this.scene.className = `sprint-scene sprint-scene-${sectionId}`;
      this.badge.textContent = SECTION_BADGES[sectionId] || "⭐";
      this.resolving = false;
      if (sectionId === "senses") this.renderSenseChallenge();
      else if (sectionId === "rhymes") this.renderRhymeChallenge();
      else if (sectionId === "alphabet") this.renderAlphabetChallenge();
      else if (sectionId === "sort") this.renderSortChallenge();
    }

    /* --- Round A: senses scene (objects scattered through a themed backdrop) --- */
    renderSenseChallenge() {
      const senseId = shuffled(SENSE_IDS.filter((id) => id !== this.lastSense))[0];
      this.lastSense = senseId;
      const pool = this.sensePools[senseId];
      const target = shuffled(pool)[0];
      const otherSenseIds = SENSE_IDS.filter((id) => id !== senseId);
      const distractors = shuffled(otherSenseIds).slice(0, 2).map((id) => shuffled(this.sensePools[id])[0]);
      const prompt = senseId === "see" ? target.prompt : `Which one can you ${senseId}?`;
      this.badge.textContent = this.lessonContent.senses[senseId].icon;
      this.kidGuide.say(prompt);
      const positions = scatterPositions(3);
      shuffled([target, ...distractors]).forEach((item, index) => {
        const choice = button("sprint-scene-object", item.name, () => this.resolveChoice(item.id === target.id, choice));
        choice.textContent = item.icon;
        choice.style.left = `${positions[index].x}%`;
        choice.style.top = `${positions[index].y}%`;
        this.objects.append(choice);
      });
    }

    /* --- Round B: rhyme scene (illustrated choices scattered across the backdrop) --- */
    renderRhymeChallenge() {
      const rhymes = this.content.rhymes;
      let index = Math.floor(Math.random() * rhymes.length);
      if (rhymes.length > 1) while (index === this.lastRhyme) index = Math.floor(Math.random() * rhymes.length);
      this.lastRhyme = index;
      const round = rhymes[index];
      this.kidGuide.say(round.prompt);
      const positions = scatterPositions(round.choices.length);
      shuffled(round.choices).forEach((choice, index2) => {
        const card = button("sprint-scene-object", choice.name, () => this.resolveChoice(choice.name === round.answer, card));
        card.textContent = choice.icon;
        card.style.left = `${positions[index2].x}%`;
        card.style.top = `${positions[index2].y}%`;
        this.objects.append(card);
      });
    }

    /* --- Round C: alphabet scene (huge faded letter behind pictures popping into place) --- */
    renderAlphabetChallenge() {
      const letters = this.content.letters;
      let letter = shuffled(letters)[0];
      if (letters.length > 1) while (letter.letter === this.lastLetter) letter = shuffled(letters)[0];
      this.lastLetter = letter.letter;
      const asPicture = this.itemIndex % 2 === 1;
      this.objects.append(element("span", "sprint-big-letter", letter.letter));
      this.kidGuide.say(letter.spokenSound);
      if (asPicture) {
        const other = shuffled(letters.filter((item) => item.letter !== letter.letter)).slice(0, 2);
        const positions = scatterPositions(3);
        shuffled([letter, ...other]).forEach((item, index) => {
          const option = button("sprint-scene-object", item.pictureName, () => this.resolveChoice(item.letter === letter.letter, option));
          option.textContent = item.picture;
          option.style.left = `${positions[index].x}%`;
          option.style.top = `${positions[index].y}%`;
          this.objects.append(option);
        });
      } else {
        const other = shuffled(letters.filter((item) => item.letter !== letter.letter)).slice(0, 2);
        const positions = scatterPositions(3);
        shuffled([{ letter: letter.letter, answer: true }, ...other.map((item) => ({ letter: item.letter, answer: false }))]).forEach((choice, index) => {
          const option = button("sprint-scene-object sprint-letter-chip", `Letter ${choice.letter}`, () => this.resolveChoice(choice.answer, option));
          option.textContent = choice.letter;
          option.style.left = `${positions[index].x}%`;
          option.style.top = `${positions[index].y}%`;
          this.objects.append(option);
        });
      }
    }

    /* --- Round D: sort scene (object dragged down onto an illustrated table destination) --- */
    renderSortChallenge() {
      const rounds = this.content.sortRounds;
      let index = Math.floor(Math.random() * rounds.length);
      if (rounds.length > 1) while (index === this.lastSort) index = Math.floor(Math.random() * rounds.length);
      this.lastSort = index;
      const round = rounds[index];
      const table = element("div", "sprint-sort-table");
      this.objects.append(table);
      const object = button("sprint-sort-object", `${round.object.name}. Select it, then choose a sense.`, () => {
        this.selectedSortObject = true;
        object.classList.add("object-selected");
      });
      object.textContent = round.object.icon;
      object.draggable = true;
      object.addEventListener("dragstart", (event) => {
        this.selectedSortObject = true;
        event.dataTransfer.setData("text/plain", round.object.name);
      });
      this.objects.append(object);
      const destSpots = [18, 50, 82];
      const targets = shuffled(round.senses).map((senseId, index2) => {
        const sense = this.lessonContent.senses[senseId];
        const target = button("sprint-sort-destination", sense.name, () => {
          if (this.selectedSortObject) this.resolveChoice(senseId === round.object.sense, target);
        });
        target.append(element("span", "sprint-sort-destination-icon", sense.icon));
        target.append(element("span", "sprint-sort-destination-name", sense.name));
        target.style.left = `${destSpots[index2 % destSpots.length]}%`;
        target.addEventListener("dragover", (event) => event.preventDefault());
        target.addEventListener("drop", (event) => {
          event.preventDefault();
          this.resolveChoice(senseId === round.object.sense, target);
        });
        this.objects.append(target);
        return target;
      });
      const teachPromise = this.kidGuide.teachMechanic("drag", {
        tell: `${round.object.name}. Which sense would you use? Drag it to the right place.`,
        kind: "drag",
        fromEl: object,
        toEl: targets[0]
      });
      this.kidGuide.gateInteraction(this.objects, teachPromise);
    }

    resolveChoice(correct, el) {
      if (this.resolving) return;
      if (!correct) {
        if (el) pulse(el, "scene-shake");
        this.kidGuide.say("Good try. Look again.");
        return;
      }
      this.resolving = true;
      this.selectedSortObject = false;
      if (el) pulse(el, "scene-pop");
      if (window.SubDay.SoundFx) window.SubDay.SoundFx.collect();
      this.kidGuide.showSuccess("Nice work!").then(() => {
        this.itemIndex += 1;
        if (this.extensionNumber > 0) this.completeExtension();
        else this.runItem();
      });
    }

    startExtension() {
      const sectionId = shuffled(this.sections.map((section) => section.id))[0];
      this.renderChallenge(sectionId);
    }

    demonstrate() {
      const correct = this.objects.querySelector(".sprint-scene-object, .sprint-sort-destination");
      if (correct) {
        correct.classList.add("demo-glow");
        window.setTimeout(() => correct.classList.remove("demo-glow"), 1000);
      }
    }
  }

  window.SubDay.Activities.k1PracticeSprint = K1PracticeSprint;
}());
