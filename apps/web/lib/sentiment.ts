export type SentimentHint = 'positive' | 'neutral' | 'negative';

export type SubEmotion =
  | 'melancholy'
  | 'joyful'
  | 'angry'
  | 'hopeful'
  | 'peaceful'
  | 'longing'
  | 'defiant'
  | 'neutral';

// ── Positive / negative lexicons ─────────────────────────────────────────────

const POS_WORDS = new Set([
  'love','loved','loving','lovely','bright','shine','shining','shines',
  'happy','happiness','joy','joyful','joyous','hope','hopeful','fine',
  'good','great','sweet','smile','smiling','sun','sunny','light','alive',
  'peace','peaceful','calm','grace','graceful','win','winner','winning',
  'celebrate','celebration','glory','glorious','beautiful','beauty',
  'gorgeous','wonderful','amazing','excellent','perfect','bliss','blissful',
  'delight','delightful','laugh','laughing','laughter','dance','dancing',
  'sing','singing','song','free','freedom','liberate','liberated',
  'thrive','thriving','proud','pride','strong','strength','power','powerful',
  'rise','rising','soar','soaring','fly','flying','glow','glowing',
  'warm','warmth','summer','spring','bloom','blooming','blossom','blossom',
  'fresh','golden','gold','radiant','brilliant','thankful','grateful',
  'gratitude','cherish','treasure','adore','kiss','embrace','together',
  'unity','belong','home','trust','faith','believe','believing','dream',
  'safe','secure','protect','protected','heal','healed','healing',
  'bold','brave','courage','courageous','heart','soul','live','living',
  'life','breathe','breath','new','born','reborn','infinite','eternal',
  'kind','kindness','tender','gentle','serene','vibrant','electric',
  'euphoric','paradise','heaven','blessed','blessing','miracle','wonder',
  'sparkle','gleam','dazzle','luminous','effervescent','victorious','triumph',
  'overcome','persevere','resilient','flourish',
]);

const NEG_WORDS = new Set([
  'hate','hated','hating','sad','sadness','cry','crying','tears',
  'dark','darkness','alone','lonely','cold','pain','painful',
  'broken','break','breaking','lose','lost','losing','loss',
  'fear','fearful','afraid','scared','angry','anger','rage',
  'hurt','hurting','death','die','dying','dead','empty','emptiness',
  'despair','hopeless','helpless','worthless','useless','pointless',
  'meaningless','hollow','void','numb','stuck','trapped','cage','caged',
  'bleed','bleeding','blood','wound','wounded','scar','scarred',
  'shatter','shattered','collapse','collapsed','fall','fallen',
  'fade','fading','vanish','vanishing','disappear','gone','leave',
  'miss','missing','forget','forgotten','neglect','abandoned',
  'silence','silent','ghost','shadow','ash','ashes','dust',
  'war','fight','fighting','battle','destroy','destruction','ruin',
  'kill','killing','murder','violence','brutal','cruel','suffer',
  'suffering','misery','agony','torment','torture','prison',
  'shame','guilty','guilt','regret','mistake','wrong','fail','failure',
  'weak','weakness','nothing','nobody','never','nowhere',
  'storm','stormy','rain','raining','grey','gray','fog','foggy',
  'winter','frozen','freeze','freezing','drown','drowning',
  'ache','aching','sorrow','grief','mourn','mourning','wither',
  'crumble','decay','rot','rust','ruin','bleak','desolate','forsake',
  'forsaken','hollow','unloved','unworthy','shattered','poisoned',
  'haunted','nightmare','demon','devil','curse','cursed',
]);

// ── Negation words ────────────────────────────────────────────────────────────
// When these appear before a sentiment word the polarity flips.
const NEGATION_WORDS = new Set([
  "not","no","never","neither","nor","nobody","nothing","nowhere",
  "hardly","barely","scarcely","without",
  "ain't","isn't","aren't","wasn't","weren't",
  "don't","doesn't","didn't","won't","wouldn't",
  "can't","cannot","couldn't","shouldn't","haven't","hasn't","hadn't",
]);

// ── Intensity multipliers ─────────────────────────────────────────────────────
const INTENSIFIERS: Record<string, number> = {
  very: 1.4, so: 1.3, really: 1.3, deeply: 1.5, truly: 1.4,
  absolutely: 1.6, completely: 1.5, totally: 1.4, utterly: 1.6,
  always: 1.3, forever: 1.4, endlessly: 1.4, burning: 1.5,
  deadly: 1.5, terribly: 1.4, awfully: 1.4, incredibly: 1.4,
  extremely: 1.5, pure: 1.3, ever: 1.2,
  just: 0.85, 'kind': 0.7, 'sort': 0.7, 'a little': 0.6, 'a bit': 0.6,
};

// ── Sub-emotion lexicons ──────────────────────────────────────────────────────
const SUB_EMOTION_WORDS: Record<SubEmotion, Set<string>> = {
  melancholy: new Set([
    'sad','sadness','grey','gray','rain','winter','cold','alone','lonely',
    'miss','missing','gone','tears','cry','lost','empty','hollow','sorrow',
    'grief','mourn','shadow','dark','drown','fade','fading','silence',
    'ghost','ash','dust','fall','fallen','broken','fog','numb','void',
    'abandoned','forgotten','disappear','vanish','leave','leaving',
    'wander','wandering','drift','drifting','ache','aching','wither',
    'crumble','decay','bleak','desolate','forsaken','unloved',
  ]),
  joyful: new Set([
    'dance','dancing','sing','singing','song','laugh','celebration',
    'joy','happy','smile','light','bright','glow','shine','golden',
    'sun','summer','warm','alive','free','fly','flying','love',
    'beautiful','delight','bliss','celebrate','glorious','wonderful',
    'amazing','gorgeous','radiant','brilliant','treasure','cherish',
    'paradise','heaven','euphoric','sparkle','gleam','dazzle','luminous',
    'vibrant','electric','exhilarating','soar','soaring','triumph',
  ]),
  angry: new Set([
    'rage','fire','burn','burning','hate','anger','angry','war',
    'fight','scream','shout','destroy','break','smash','crash',
    'blood','kill','hell','damn','fury','violence','storm',
    'bitter','bitterness','resentment','revenge','explode','exploding',
    'shatter','rip','tear','lash','strike','wound','weapon','battle',
    'ruin','murder','brutal','cruel','hatred','venom','poison',
  ]),
  hopeful: new Set([
    'hope','dream','dreaming','rise','rising','future','tomorrow',
    'begin','new','change','faith','believe','trust','better',
    'forward','grow','growing','bloom','spring','dawn','light',
    'breakthrough','horizon','await','wish','wishing','prayer','pray',
    'possibility','chance','opportunity','seek','overcome','persevere',
    'resilient','reborn','born','flourish','infinite',
  ]),
  peaceful: new Set([
    'peace','calm','quiet','silence','still','gentle','soft',
    'breath','breathe','rest','sleep','river','ocean','sea',
    'sky','blue','white','cloud','moon','star','slow','ease',
    'easy','safe','flow','flowing','float','floating','serene',
    'serenity','tranquil','harmony','balance','stillness','meadow',
    'forest','nature','eternal','timeless','tender','sanctuary',
  ]),
  longing: new Set([
    'wish','need','far','away','distance','remember','memory','memories',
    'past','used','before','return','returning','home','belong',
    'reach','reaching','yearn','yearning','hunger','thirst',
    'desire','wanting','searching','seeking','find','finding',
    'lost','ache','hollow','missing','across','somewhere','somehow',
  ]),
  defiant: new Set([
    'rise','stand','standing','refuse','never','break','strong',
    'strength','power','fight','push','resist','resistance',
    'overcome','survive','surviving','warrior','soldier','bold',
    'fearless','unbroken','unstoppable','lion','roar','march','marching',
    'thunder','lightning','rebel','revolution','defiance','iron',
    'unyielding','relentless','storm','fire','burning','conquer',
  ]),
  neutral: new Set([]),
};

// ── Exported functions ────────────────────────────────────────────────────────

function tokenize(text: string): string[] {
  return (text.toLowerCase().match(/\b[\p{L}\p{N}]+'?[\p{L}\p{N}]*\b/gu) ?? []).filter(
    (t) => t.length > 0,
  );
}

/** Returns 'positive' | 'neutral' | 'negative' with negation + intensity support. */
export function sentimentHint(text: string): SentimentHint {
  const tokens = tokenize(text);
  let score = 0;
  let negated = false;
  let intensifier = 1.0;
  let contentWordsSinceNegation = 0;

  for (const w of tokens) {
    if (NEGATION_WORDS.has(w)) {
      negated = true;
      contentWordsSinceNegation = 0;
      continue;
    }

    const boost = INTENSIFIERS[w];
    if (boost !== undefined) {
      intensifier = boost;
      continue;
    }

    const isPos = POS_WORDS.has(w);
    const isNeg = NEG_WORDS.has(w);

    if (isPos || isNeg) {
      const base = isPos ? 1 : -1;
      score += (negated ? -base : base) * intensifier;
    }

    // Negation window: reset after 3 content words
    if (w.length > 2) {
      contentWordsSinceNegation++;
      if (contentWordsSinceNegation >= 3) {
        negated = false;
        contentWordsSinceNegation = 0;
      }
      intensifier = 1.0;
    }
  }

  if (score >= 2) return 'positive';
  if (score <= -2) return 'negative';
  return 'neutral';
}

/** Classifies the dominant emotional register of the lyric. */
export function subEmotion(text: string): SubEmotion {
  const tokens = tokenize(text);
  const counts: Partial<Record<SubEmotion, number>> = {};

  for (const w of tokens) {
    for (const [emotion, wordSet] of Object.entries(SUB_EMOTION_WORDS) as [
      SubEmotion,
      Set<string>,
    ][]) {
      if (emotion === 'neutral') continue;
      if (wordSet.has(w)) counts[emotion] = (counts[emotion] ?? 0) + 1;
    }
  }

  let best: SubEmotion = 'neutral';
  let bestCount = 0;
  for (const [emotion, count] of Object.entries(counts) as [SubEmotion, number][]) {
    if (count > bestCount) {
      bestCount = count;
      best = emotion;
    }
  }
  // Need at least 2 word hits to claim a sub-emotion
  return bestCount >= 2 ? best : 'neutral';
}

/** 0-1 score for emotional intensity based on caps, exclamations, and intensifiers. */
export function intensityScore(text: string): number {
  const upperCaseWords = (text.match(/\b[A-Z]{2,}\b/g) ?? []).length;
  const totalWords = (text.match(/\b\w+\b/g) ?? []).length;
  const exclamations = (text.match(/!/g) ?? []).length;
  const lineCount = text.split('\n').filter((l) => l.trim().length > 0).length;
  const intensifierCount = (
    text
      .toLowerCase()
      .match(
        /\b(very|so|really|deeply|truly|always|forever|burning|never|absolutely|completely|utterly|endlessly)\b/g,
      ) ?? []
  ).length;

  if (totalWords === 0) return 0;

  const capsRatio = Math.min(1, (upperCaseWords / totalWords) * 4);
  const exclamRatio = Math.min(1, exclamations / Math.max(1, lineCount));
  const intensRatio = Math.min(1, (intensifierCount / totalWords) * 6);

  return Math.min(1, capsRatio * 0.4 + exclamRatio * 0.35 + intensRatio * 0.25);
}
