/* K1 lesson order, activity timing, prompts, and reusable visual content.
   Five-stage rhythm: warm-up game, real game, mini lesson, practice sprint, big-finale game. */
window.SubDay = window.SubDay || {};
window.SubDay.Lessons = [{
  id: "k1-computer-adventure",
  grade: "Kindergarten",
  version: "K1",
  title: "K1 Computer Adventure",
  shared: {
    senses: {
      see: { name: "SEE", icon: "👀" },
      hear: { name: "HEAR", icon: "👂" },
      smell: { name: "SMELL", icon: "👃" },
      taste: { name: "TASTE", icon: "👅" },
      touch: { name: "TOUCH", icon: "✋" }
    },
    /* Larger sense pools so practice rounds avoid repeating the same few pictures. */
    sensePools: {
      hear: [
        { id: "bell", icon: "🔔", name: "bell" },
        { id: "drum", icon: "🥁", name: "drum" },
        { id: "bird", icon: "🐦", name: "bird" },
        { id: "whistle", icon: "📯", name: "whistle" },
        { id: "guitar", icon: "🎸", name: "guitar" },
        { id: "dog", icon: "🐶", name: "dog" }
      ],
      smell: [
        { id: "flower", icon: "🌼", name: "flower" },
        { id: "soap", icon: "🧼", name: "soap" },
        { id: "cookie", icon: "🍪", name: "cookie" },
        { id: "pizza", icon: "🍕", name: "pizza" },
        { id: "orange", icon: "🍊", name: "orange" },
        { id: "cinnamon", icon: "🍂", name: "cinnamon" }
      ],
      taste: [
        { id: "apple", icon: "🍎", name: "apple" },
        { id: "cookie2", icon: "🍪", name: "cookie" },
        { id: "pizza2", icon: "🍕", name: "pizza" },
        { id: "strawberry", icon: "🍓", name: "strawberry" },
        { id: "icecream", icon: "🍦", name: "ice cream" },
        { id: "banana", icon: "🍌", name: "banana" }
      ],
      touch: [
        { id: "teddy", icon: "🧸", name: "teddy bear" },
        { id: "blanket", icon: "🧣", name: "soft blanket" },
        { id: "feather", icon: "🪶", name: "feather" },
        { id: "ice", icon: "🧊", name: "ice" },
        { id: "sponge", icon: "🧽", name: "sponge" },
        { id: "rock", icon: "🪨", name: "rough rock" }
      ],
      see: [
        { id: "rainbow", icon: "🌈", name: "rainbow", prompt: "Which one has lots of colors?" },
        { id: "sun", icon: "☀️", name: "sun", prompt: "Which one shines in the sky?" },
        { id: "stars", icon: "⭐", name: "stars", prompt: "Which one twinkles at night?" },
        { id: "butterfly", icon: "🦋", name: "butterfly", prompt: "Which one is bright and colorful?" },
        { id: "kite", icon: "🪁", name: "kite", prompt: "Which one flies high in the sky?" },
        { id: "balloon", icon: "🎈", name: "balloon", prompt: "Which one is round and colorful?" }
      ]
    }
  },
  activities: [
    {
      id: "star-catch",
      type: "starCatch",
      title: "Star Catch Warm-Up",
      timing: { minimumActiveSeconds: 180, targetActiveSeconds: 200, allowExtensions: true },
      content: { starCount: 5 }
    },
    {
      id: "bee-garden-adventure",
      type: "beeGardenAdventure",
      title: "Bee Garden Adventure",
      timing: { minimumActiveSeconds: 480, targetActiveSeconds: 520, allowExtensions: true },
      content: {
        levels: [
          { id: "learn-to-fly", label: "LEVEL 1", title: "Learn to Fly", direction: "Move Buzz over the flowers.", success: "Buzz can fly! Great job!", type: "hover", count: 5, honeyReward: 5 },
          { id: "nectar-hunt", label: "LEVEL 2", title: "Nectar Hunt", direction: "Click the glowing flowers to collect nectar.", success: "You found the nectar!", type: "click", count: 6, honeyReward: 5 },
          { id: "pollen-delivery", label: "LEVEL 3", title: "Pollen Delivery", direction: "Collect pollen. When Buzz is full, fly back to the hive.", success: "The hive has more honey!", type: "delivery", count: 6, capacity: 3 },
          { id: "plant-the-garden", label: "LEVEL 4", title: "Plant the Garden", direction: "Drag each seed into a dirt patch.", success: "Look! The seeds are growing!", type: "drag", count: 4, honeyReward: 8 },
          { id: "water-the-garden", label: "LEVEL 5", title: "Water the Garden", direction: "Use the watering can to water every sprout.", success: "You made the flowers bloom!", type: "water", count: 4, honeyReward: 8 },
          { id: "flower-color-hunt", label: "LEVEL 6", title: "Flower Color Hunt", direction: "Listen for a color. Fly Buzz to the matching flower.", success: "You found all the colors!", type: "colorhunt", count: 5, honeyReward: 5 },
          { id: "ladybug-rescue", label: "LEVEL 7", title: "Ladybug Rescue", direction: "Find a ladybug. Then bring your friend to the big leaf.", success: "All the ladybugs are safe!", type: "rescue", count: 4, honeyReward: 7 },
          { id: "butterfly-follow", label: "LEVEL 8", title: "Follow the Butterfly", direction: "Keep Buzz close to the butterfly until the meter fills.", success: "Great flying! You stayed with the butterfly!", type: "follow", followSeconds: 10, speed: 1 },
          { id: "big-pollen-delivery", label: "LEVEL 9", title: "Fill the Hive", direction: "Collect lots of pollen and bring it back to the hive.", success: "The honey jar is almost full!", type: "delivery", count: 8, capacity: 4 },
          { id: "garden-party", label: "LEVEL 10", title: "Garden Party", direction: "Collect the last flowers for the garden party!", success: "Garden party! Buzz did it!", type: "click", count: 8, honeyReward: 15 }
        ]
      }
    },
    {
      id: "five-senses-mini-lesson",
      type: "fiveSensesMiniLesson",
      title: "Five Senses Mini Lesson",
      timing: { minimumActiveSeconds: 240, targetActiveSeconds: 260, allowExtensions: false },
      content: {
        scenes: [
          {
            sense: "see",
            icon: "👀",
            narration: ["Your eyes help you see.", "You can see colors, shapes, and your friends!"],
            examples: ["🌈", "🦋", "⭐"]
          },
          {
            sense: "hear",
            icon: "👂",
            narration: ["Your ears help you hear.", "You can hear music, voices, and animal sounds."],
            examples: ["🔔", "🥁", "🐦"],
            question: {
              prompt: "Which one helps you hear?",
              choices: [{ id: "bell", icon: "🔔", correct: true }, { id: "eye", icon: "👀", correct: false }, { id: "nose", icon: "👃", correct: false }]
            }
          },
          {
            sense: "smell",
            icon: "👃",
            narration: ["Your nose helps you smell.", "You can smell flowers and yummy cookies."],
            examples: ["🌼", "🍪", "🍊"]
          },
          {
            sense: "taste",
            icon: "👅",
            narration: ["Your tongue helps you taste.", "You can taste sweet, sour, and salty foods."],
            examples: ["🍎", "🍓", "🍦"],
            question: {
              prompt: "Which one would you taste?",
              choices: [{ id: "icecream", icon: "🍦", correct: true }, { id: "bell", icon: "🔔", correct: false }, { id: "feather", icon: "🪶", correct: false }]
            }
          },
          {
            sense: "touch",
            icon: "✋",
            narration: ["Your sense of touch helps you feel things.", "You can feel soft, smooth, and bumpy things."],
            examples: ["🧸", "🪶", "🧊"],
            question: {
              prompt: "Which one feels soft to touch?",
              choices: [{ id: "teddy", icon: "🧸", correct: true }, { id: "sun", icon: "☀️", correct: false }, { id: "drum", icon: "🥁", correct: false }]
            }
          }
        ]
      }
    },
    {
      id: "k1-practice-sprint",
      type: "k1PracticeSprint",
      title: "Kindergarten Practice Sprint",
      timing: { minimumActiveSeconds: 420, targetActiveSeconds: 450, allowExtensions: true },
      content: {
        sections: [
          { id: "senses", label: "ROUND A", banner: "SENSE CHALLENGE COMPLETE!", intro: "Let's use our senses!", count: 3 },
          { id: "rhymes", label: "ROUND B", banner: "RHYME CHALLENGE COMPLETE!", intro: "Rhyme time!", count: 3 },
          { id: "alphabet", label: "ROUND C", banner: "LETTER CHALLENGE COMPLETE!", intro: "Letter time!", count: 4 },
          { id: "sort", label: "ROUND D", banner: "SORTING CHALLENGE COMPLETE!", intro: "Let's sort and drag!", count: 3 }
        ],
        rhymes: [
          { prompt: "Humpty Dumpty sat on a...", answer: "wall", choices: [{ icon: "🧱", name: "wall" }, { icon: "🌳", name: "tree" }, { icon: "🚗", name: "car" }] },
          { prompt: "Little Bo Peep lost her...", answer: "sheep", choices: [{ icon: "🐑", name: "sheep" }, { icon: "🐟", name: "fish" }, { icon: "🐶", name: "dog" }] },
          { prompt: "Twinkle, twinkle, little...", answer: "star", choices: [{ icon: "⭐", name: "star" }, { icon: "🏠", name: "house" }, { icon: "🌙", name: "moon" }] },
          { prompt: "Jack and Jill went up the...", answer: "hill", choices: [{ icon: "⛰️", name: "hill" }, { icon: "🏫", name: "school" }, { icon: "🚂", name: "train" }] },
          { prompt: "Old MacDonald had a...", answer: "farm", choices: [{ icon: "🚜", name: "farm" }, { icon: "🎡", name: "fair" }, { icon: "🏰", name: "castle" }] }
        ],
        letters: [
          { letter: "A", picture: "🍎", pictureName: "apple", spokenSound: "A says aaa, like apple." },
          { letter: "B", picture: "⚽", pictureName: "ball", spokenSound: "B says buh, like ball." },
          { letter: "C", picture: "🐱", pictureName: "cat", spokenSound: "C says kuh, like cat." },
          { letter: "M", picture: "🌙", pictureName: "moon", spokenSound: "M says mmm, like moon." },
          { letter: "S", picture: "☀️", pictureName: "sun", spokenSound: "S says sss, like sun." },
          { letter: "T", picture: "🐢", pictureName: "turtle", spokenSound: "T says tuh, like turtle." },
          { letter: "P", picture: "🐷", pictureName: "pig", spokenSound: "P says puh, like pig." }
        ],
        sortRounds: [
          { senses: ["hear", "smell"], object: { icon: "🔔", name: "Bell", sense: "hear" } },
          { senses: ["taste", "touch"], object: { icon: "🍪", name: "Cookie", sense: "taste" } },
          { senses: ["see", "hear"], object: { icon: "🌈", name: "Rainbow", sense: "see" } },
          { senses: ["smell", "taste"], object: { icon: "🌼", name: "Flower", sense: "smell" } },
          { senses: ["touch", "see"], object: { icon: "🧸", name: "Teddy", sense: "touch" } }
        ]
      }
    },
    {
      id: "teddy-school-adventure",
      type: "teddyAdventure",
      title: "Teddy's School Adventure",
      timing: { minimumActiveSeconds: 720, targetActiveSeconds: 760, allowExtensions: true },
      content: {
        stops: ["HOME", "PARK", "FARM", "FOREST", "BRIDGE", "SCHOOL"],
        levels: [
          { id: "park", label: "PARK", icon: "🌳", type: "collect", direction: "Move Teddy through the park! Touch every star.", count: 5 },
          {
            id: "farm",
            label: "FARM",
            icon: "🐄",
            type: "dragMatch",
            direction: "Drag each animal to its home on the farm.",
            pairs: [
              { icon: "🐮", name: "cow", targetIcon: "🏠", targetName: "barn" },
              { icon: "🐔", name: "chicken", targetIcon: "🥚", targetName: "nest" },
              { icon: "🐑", name: "sheep", targetIcon: "🌾", targetName: "field" }
            ]
          },
          { id: "forest", label: "FOREST", icon: "🌲", type: "scrollFind", direction: "Scroll down in the forest and find the hidden acorn.", target: "🌰", decoys: ["🍄", "🦔", "🐿️", "🍁"] },
          {
            id: "bridge",
            label: "BRIDGE",
            icon: "🌉",
            type: "letterBridge",
            direction: "Help Teddy cross the bridge! Choose the letter Teddy needs.",
            steps: [
              { answer: "M", choices: ["A", "M", "S"] },
              { answer: "T", choices: ["T", "P", "C"] }
            ]
          },
          { id: "senses", label: "SENSES TRAIL", icon: "🌻", type: "sense", direction: "Which one can you hear?", answer: "bell", choices: [{ icon: "🔔", id: "bell" }, { icon: "🌼", id: "flower" }, { icon: "🍎", id: "apple" }] },
          {
            id: "school",
            label: "SCHOOL GATE",
            icon: "🏫",
            type: "mixed",
            direction: "One last challenge before school!",
            steps: [
              { kind: "click", direction: "Click the apples for Teddy.", count: 3 },
              { kind: "letter", direction: "Find the letter S.", answer: "S", choices: ["S", "A", "P"] }
            ]
          }
        ],
        bonusPool: [
          { id: "park-b", label: "SCHOOLYARD", icon: "🌳", type: "collect", direction: "Bonus! Help Teddy collect more stars.", count: 6 },
          {
            id: "farm-b",
            label: "SCHOOLYARD",
            icon: "🧰",
            type: "dragMatch",
            direction: "Bonus! Drag each toy to its shelf.",
            pairs: [
              { icon: "🚗", name: "car", targetIcon: "🧰", targetName: "toy bin" },
              { icon: "📚", name: "book", targetIcon: "📖", targetName: "bookshelf" }
            ]
          },
          { id: "forest-b", label: "SCHOOLYARD", icon: "🌲", type: "scrollFind", direction: "Bonus! Scroll and find the hidden pinecone.", target: "🌰", decoys: ["🍁", "🐛", "🦋", "🍄"] },
          { id: "bridge-b", label: "SCHOOLYARD", icon: "🌉", type: "letterBridge", direction: "Bonus! Cross again with new letters.", steps: [{ answer: "A", choices: ["A", "B", "C"] }, { answer: "P", choices: ["P", "T", "M"] }] },
          { id: "senses-b", label: "SCHOOLYARD", icon: "🌻", type: "sense", direction: "Which one can you taste?", answer: "apple", choices: [{ icon: "🍎", id: "apple" }, { icon: "🔔", id: "bell" }, { icon: "🧸", id: "teddy" }] }
        ]
      }
    }
  ]
}];