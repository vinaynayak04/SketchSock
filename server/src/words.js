export const WORDS = {
  easy: [
    "apple", "banana", "sun", "moon", "star", "tree", "flower", "house", "car", "boat",
    "cat", "dog", "fish", "bird", "book", "pen", "cup", "hat", "ball", "ring",
    "chair", "table", "door", "window", "key", "spoon", "fork", "cake", "milk", "egg",
    "bread", "cheese", "clock", "shoe", "socks", "shirt", "pants", "cloud", "rain", "snow",
    "heart", "smile", "leaf", "grass", "bone", "bell", "drum", "kite", "flag", "coin",
    "pencil", "box", "balloon", "duck", "pig", "frog", "worm", "bee", "spider", "snake",
    "water", "fire", "stone", "sand", "dirt", "wood", "gold", "paper", "card", "envelope",
    "stamp", "brush", "paint", "mask", "boot", "coat", "glove", "scarf", "belt", "crown",
    "bag", "sack", "rope", "wire", "net", "hook", "nail", "screw", "bolt", "wheel",
    "skirt", "pillow", "lemon", "pear", "grape", "nest", "shell", "horn", "baby"
  ],
  medium: [
    "computer", "keyboard", "guitar", "violin", "trumpet", "bicycle", "airplane", "rocket", "train", "truck",
    "camera", "watch", "glasses", "mirror", "pillow", "blanket", "bucket", "ladder", "hammer", "wrench",
    "spiderweb", "butterfly", "dinosaur", "giraffe", "elephant", "monkey", "penguin", "dolphin", "octopus", "shark",
    "castle", "bridge", "lighthouse", "volcano", "mountain", "desert", "island", "river", "rainbow", "forest",
    "pizza", "burger", "ice cream", "cookie", "donut", "sandwich", "taco", "sushi", "popcorn", "fries",
    "pineapple", "watermelon", "strawberry", "grape", "orange", "lemon", "carrot", "broccoli", "mushroom", "pumpkin",
    "battery", "switch", "remote", "tablet", "laptop", "drawer", "cabinet", "hanger", "towel", "sponge",
    "broom", "dustpan", "mop", "needle", "thread", "button", "zipper", "pocket", "wallet", "briefcase",
    "suitcase", "umbrella", "flashlight", "candle", "lantern", "teapot", "kettle", "toaster", "blender", "oven",
    "stove", "sink", "faucet", "shower", "bathtub", "toilet", "comb", "toothbrush", "toothpaste"
  ],
  hard: [
    "astronaut", "microscope", "telescope", "submarine", "helicopter", "skateboard", "rollercoaster", "wheelbarrow", "windmill", "compass",
    "campfire", "marshmallow", "backpack", "binoculars", "treasure chest", "sarcophagus", "sphinx", "pyramid", "colosseum", "eiffel tower",
    "statue of liberty", "spacestation", "satellite", "dna double helix", "brain", "skeleton", "microchip", "calculator", "hourglass", "metronome",
    "keyboard mouse", "headphones", "television", "washing machine", "refrigerator", "microwave", "toaster", "vacuum cleaner", "hair dryer", "toothbrush",
    "lighthouse keeper", "firefighter", "policeman", "doctor", "chef", "pirate", "ninja", "superhero", "wizard", "unicorn",
    "black hole", "solar system", "constellation", "virtual reality", "cryptocurrency", "archaeologist", "chameleon", "gladiator", "pharaoh", "labyrinth",
    "doppelganger", "frankenstein", "abominable snowman", "loch ness monster", "bermuda triangle", "crop circle", "greenhouse effect", "solar panel", "wind turbine", "nuclear power plant",
    "time machine", "parallel universe", "golden gate bridge", "mount rushmore", "leaning tower of pisa", "great wall of china", "stonehenge", "taj mahal", "grand canyon", "great barrier reef",
    "roller coaster", "hot air balloon", "ferris wheel", "merry go round", "cotton candy", "fortune cookie", "waffle iron", "garbage truck", "street sweeper", "lawn mower"
  ]
};

export function getRandomWords(count = 3, excludeWords = []) {
  const excludeSet = new Set(excludeWords.map(w => w.toLowerCase().trim()));

  const getUnused = (list) => list.filter(w => !excludeSet.has(w.toLowerCase().trim()));

  let unusedEasy = getUnused(WORDS.easy);
  let unusedMedium = getUnused(WORDS.medium);
  let unusedHard = getUnused(WORDS.hard);

  const selected = [];

  const drawRandom = (list) => {
    if (list.length === 0) return null;
    const idx = Math.floor(Math.random() * list.length);
    return list.splice(idx, 1)[0];
  };

  if (count === 3) {
    const easyWord = drawRandom(unusedEasy);
    if (easyWord) selected.push(easyWord);

    const mediumWord = drawRandom(unusedMedium);
    if (mediumWord) selected.push(mediumWord);

    const hardWord = drawRandom(unusedHard);
    if (hardWord) selected.push(hardWord);

    while (selected.length < 3) {
      const remainingPool = [...unusedEasy, ...unusedMedium, ...unusedHard];
      if (remainingPool.length === 0) break;
      const word = drawRandom(remainingPool);
      unusedEasy = unusedEasy.filter(w => w !== word);
      unusedMedium = unusedMedium.filter(w => w !== word);
      unusedHard = unusedHard.filter(w => w !== word);
      selected.push(word);
    }
  } else {
    let remainingPool = [...unusedEasy, ...unusedMedium, ...unusedHard];
    for (let i = 0; i < count; i++) {
      if (remainingPool.length === 0) break;
      const word = drawRandom(remainingPool);
      selected.push(word);
    }
  }

  if (selected.length < count) {
    const allWords = [...WORDS.easy, ...WORDS.medium, ...WORDS.hard];
    let fallbackPool = allWords.filter(w => !selected.includes(w));
    while (selected.length < count && fallbackPool.length > 0) {
      selected.push(drawRandom(fallbackPool));
    }
  }

  for (let i = selected.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [selected[i], selected[j]] = [selected[j], selected[i]];
  }

  return selected;
}

export function getRandomWordByDifficulty(difficulty) {
  const list = WORDS[difficulty] || WORDS.easy;
  return list[Math.floor(Math.random() * list.length)];
}

