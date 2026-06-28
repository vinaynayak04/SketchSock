export const WORDS = {
  easy: [
    "apple", "banana", "sun", "moon", "star", "tree", "flower", "house", "car", "boat",
    "cat", "dog", "fish", "bird", "book", "pen", "cup", "hat", "ball", "ring",
    "chair", "table", "door", "window", "key", "spoon", "fork", "cake", "milk", "egg",
    "bread", "cheese", "clock", "shoe", "socks", "shirt", "pants", "cloud", "rain", "snow",
    "heart", "smile", "leaf", "grass", "bone", "bell", "drum", "kite", "flag", "coin",
    "pencil", "box", "balloon", "duck", "pig", "frog", "worm", "bee", "spider", "snake"
  ],
  medium: [
    "computer", "keyboard", "guitar", "violin", "trumpet", "bicycle", "airplane", "rocket", "train", "truck",
    "camera", "watch", "glasses", "mirror", "pillow", "blanket", "bucket", "ladder", "hammer", "wrench",
    "spiderweb", "butterfly", "dinosaur", "giraffe", "elephant", "monkey", "penguin", "dolphin", "octopus", "shark",
    "castle", "bridge", "lighthouse", "volcano", "mountain", "desert", "island", "river", "rainbow", "forest",
    "pizza", "burger", "ice cream", "cookie", "donut", "sandwich", "taco", "sushi", "popcorn", "fries",
    "pineapple", "watermelon", "strawberry", "grape", "orange", "lemon", "carrot", "broccoli", "mushroom", "pumpkin"
  ],
  hard: [
    "astronaut", "microscope", "telescope", "submarine", "helicopter", "skateboard", "rollercoaster", "wheelbarrow", "windmill", "compass",
    "campfire", "marshmallow", "backpack", "binoculars", "treasure chest", "sarcophagus", "sphinx", "pyramid", "colosseum", "eiffel tower",
    "statue of liberty", "spacestation", "satellite", "dna double helix", "brain", "skeleton", "microchip", "calculator", "hourglass", "metronome",
    "keyboard mouse", "headphones", "television", "washing machine", "refrigerator", "microwave", "toaster", "vacuum cleaner", "hair dryer", "toothbrush",
    "lighthouse keeper", "firefighter", "policeman", "doctor", "chef", "pirate", "ninja", "superhero", "wizard", "unicorn"
  ]
};

export function getRandomWords(count = 3) {
  const allWords = [...WORDS.easy, ...WORDS.medium, ...WORDS.hard];
  const selected = [];
  const tempWords = [...allWords];
  
  for (let i = 0; i < count; i++) {
    if (tempWords.length === 0) break;
    const index = Math.floor(Math.random() * tempWords.length);
    selected.push(tempWords.splice(index, 1)[0]);
  }
  return selected;
}

export function getRandomWordByDifficulty(difficulty) {
  const list = WORDS[difficulty] || WORDS.easy;
  return list[Math.floor(Math.random() * list.length)];
}
