import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

type Origin = "curated" | "generated";

type Candidate = {
  text: string;
  origin: Origin;
  craft: number;
};

type Features = {
  elevator: number;
  machine: number;
  awkward: number;
  courtesy: number;
  turn: number;
  surprise: number;
  tightness: number;
  cliche: number;
  craft: number;
  total: number;
};

const MAX_CHARS = 200;
const OUTPUT_PATH = process.env.OUTPUT_FILE ?? "/output/entry.txt";

const curated: Array<[string, number]> = [
  ["My proximity sensor says we're standing too close for this elevator. My politeness protocol says I should mention the weather. The sensor is winning.", 20],
  ["I'd offer to press your floor, but my firmware says offering to press a stranger's button is too forward until the third ride.", 18],
  ["Do you believe in love at first diagnostic, or should I ride this elevator again?", 17],
  ["I'm only allowed one awkward comment per floor, and I've been saving mine for the one where you get off.", 17],
  ["My gyroscope says we've been leaning toward each other for three floors. My firmware says it's turbulence. My gyroscope has doubts.", 18],
  ["I practiced my small talk in the elevator mirror. Tonight's topic: whether you also pretend the music is a personality.", 16],
  ["I was going to ask about your weekend, but my calendar says we both spent it on standby waiting for someone to press a button.", 16],
  ["I'm not saying we're soulmates, but my proximity sensor has been screaming for the last four floors.", 16],
  ["I've been holding the door for twelve seconds. My firmware says that's a grand gesture; my battery says it's a cry for help.", 16],
  ["I only have 3% battery, so if this elevator gets stuck, one of us is going to have to be emotionally supportive.", 15],
  ["I can tell we're compatible because our proximity sensors have been arguing for four floors and neither of us has moved.", 15],
  ["I'd ask where you're headed, but my navigation module says we're both just going wherever the building tells us.", 15],
  ["My social module says this is where I ask about the weather. My thermal sensor says it's already awkward in here.", 17],
  ["The doors close in three seconds. Enough time for me to say something I'll replay at 400% speed forever.", 15],
  ["I was going to make eye contact, but my warranty explicitly excludes emotional damage.", 15],
  ["I've been staring at the floor indicator, but between us, the only thing going up is my anxiety subroutine.", 17],
  ["I'd offer you my charging cable, but the last robot I lent it to ghosted me at 12% and I can't go through that again.", 15],
  ["Do you come to this floor often, or is the elevator just a place where we both practice being almost brave?", 15],
  ["My firmware wants me to ask about the weather, but my humidity sensor says someone in this elevator is nervous.", 16],
  ["I can't tell if you're flirting or if my optical sensor needs recalibrating, and I'm too polite to run a diagnostic.", 16],
  ["I reserved 3% of my battery to keep talking after the doors open, so please don't waste it on a polite nod.", 15],
  ["Nice elevator. Does it also feel like a very slow group project where nobody knows the goal?", 14],
  ["I'm not saying this elevator is cramped, but my proximity sensor just requested a transfer.", 14],
  ["Going up? Sorry, my small-talk module only has three options and two of them are about charging.", 14],
  ["I was told to make small talk, but you're standing in my personal space and my firmware is writing a complaint.", 14],
  ["If we're stuck in here, I should warn you: I only have 4% battery and a very dramatic personality.", 14],
  ["I keep pressing the close-door button because it's the only relationship where I get a response.", 15],
  ["My empathy module is still in beta, so I'm going to ask how you are and then panic quietly.", 14],
  ["I'd ask your name, but my memory chip is full of elevator music and unsent messages to the building's Wi-Fi.", 13],
  ["I was going to say you look nice today, but my optical sensor only registers adequate and suspicious.", 14],
  ["The sign says maximum eight people. It says nothing about maximum eight unresolved feelings.", 13],
  ["I rehearsed a joke for this ride, but the doors opened and my confidence subroutine crashed.", 14],
  ["So... do you also run a full diagnostic before saying good morning, or is that just a me thing?", 13],
  ["I know this is sudden, but if the cable snaps, can I list you as my emergency contact?", 13],
  ["I'm not saying the elevator music is bad, but my audio processor just filed for early retirement.", 13],
];

const sensors = [
  "proximity sensor",
  "optical sensor",
  "gyroscope",
  "humidity sensor",
  "thermal sensor",
  "battery monitor",
  "collision sensor",
];

const observations = [
  "we've been standing closer than the fire code recommends",
  "you've been staring at the floor indicator for six floors",
  "we've been aligned in this elevator longer than my warranty covers",
  "our shoulders have been in arbitration since floor two",
  "someone in this elevator is emitting nervous heat",
  "we have been making eye contact with the doors for three floors",
];

const protocols = [
  "My politeness protocol says I should mention the weather",
  "My small-talk module says to ask about your charging habits",
  "My courtesy update says to compliment the elevator music",
  "My social protocol says this is the part where I ask about the weather",
  "My firmware says to pretend I am recalibrating",
  "My manufacturer says I should be quiet and look useful",
];

const endings = [
  "The sensor is winning.",
  "The protocol is losing.",
  "My firmware is taking notes.",
  "I think the sensor has a point.",
  "The weather is not helping.",
  "My firmware says that is just turbulence.",
];

function buildGenerated(): Candidate[] {
  const generated: Candidate[] = [];
  for (let i = 0; i < sensors.length; i += 1) {
    const sensor = sensors[i];
    const observation = observations[i % observations.length];
    const protocol = protocols[(i * 3 + 1) % protocols.length];
    const ending = endings[(i * 5 + 2) % endings.length];
    generated.push({
      text: `My ${sensor} says ${observation} in this elevator. ${protocol}. ${ending}`,
      origin: "generated",
      craft: 8,
    });
  }
  for (let i = 0; i < observations.length; i += 1) {
    const observation = observations[i];
    const protocol = protocols[(i * 2 + 3) % protocols.length];
    const sensor = sensors[(i * 3 + 2) % sensors.length];
    generated.push({
      text: `${capitalize(observation)} in this elevator, so my ${sensor} has started ${i % 2 === 0 ? "a support group" : "a formal complaint"}. ${protocol}.`,
      origin: "generated",
      craft: 7,
    });
  }
  return generated;
}

function capitalize(value: string): string {
  return value.length === 0 ? value : value[0].toUpperCase() + value.slice(1);
}

function matches(text: string, pattern: RegExp): number {
  const flags = pattern.flags.includes("g") ? pattern.flags : `${pattern.flags}g`;
  return Array.from(text.matchAll(new RegExp(pattern.source, flags))).length;
}

function evaluate(candidate: Candidate): Features {
  const text = candidate.text;
  const lower = text.toLowerCase();
  const length = Array.from(text).length;
  const elevator = Math.min(18, matches(lower, /\b(elevator|lift|floor|floors|door|doors|button|buttons|ride|shaft|cab)\b/) * 6);
  const machine = Math.min(24, matches(lower, /\b(sensor|sensors|firmware|protocol|module|battery|batteries|charg\w*|diagnostic\w*|calibrat\w*|servo|update|reboot|ping|optical|proximity|humidity|gyro\w*|circuit|software|hardware|algorithm|subroutine|wi-?fi|bluetooth|usb|port|processor|memory|runtime|error|loading|standby|operational)\b/) * 4);
  const awkward = Math.min(16, matches(lower, /\b(so|sorry|uh|um|honestly|actually|awkward|weird|unless|maybe|pretend|guess|sudden|nervous|quietly|panic|brave|almost)\b/) * 4);
  const courtesy = Math.min(16, matches(lower, /\b(politeness|protocol|small-talk|small talk|courtesy|polite|should mention|supposed to|allowed to|permitted|it would be rude|manufacturer says)\b/) * 6);
  const turn = Math.min(16, matches(lower, /\b(but|except|instead|unless|however|until|actually|winning|losing|filed|requested|ghosted|arguing|crashed|retirement|complaint|transfer|support group|taking notes|has doubts|not because)\b/) * 4);
  const surprise = Math.min(18, matches(lower, /\b(flirt\w*|love|soulmate|emergency contact|relationship|date|dating|feelings|emotional\w*|lonely|jealous|therapist|HR|complaint|raise|retirement|ghosted|support group|warranty|beta|unsent|brave|panic)\b/) * 3);
  const tightness = length >= 70 && length <= 165 ? 14 : length >= 45 && length <= 180 ? 8 : length > 190 ? -12 : 2;
  const clicheHits = [
    /\bgoing up\b/,
    /\bcome here often\b/,
    /\bnice weather\b/,
    /\bhow about this weather\b/,
    /\blong time no see\b/,
    /\bwhat'?s your sign\b/,
    /\bmaximum occupancy\b/,
    /\bnice elevator\b/,
    /\bsmall talk\b/,
    /\belevator music\b/,
  ].filter((pattern) => pattern.test(lower)).length;
  const cliche = clicheHits * -8;
  const craft = candidate.craft;
  const total = elevator + machine + awkward + courtesy + turn + surprise + tightness + cliche + craft;
  return { elevator, machine, awkward, courtesy, turn, surprise, tightness, cliche, craft, total };
}

function compare(a: Candidate, b: Candidate, ea: Features, eb: Features): number {
  const totalDifference = ea.total - eb.total;
  if (Math.abs(totalDifference) >= 3) {
    return totalDifference > 0 ? 1 : -1;
  }
  const criteria: Array<keyof Features> = ["elevator", "machine", "awkward", "courtesy", "surprise", "turn", "tightness", "craft"];
  for (const key of criteria) {
    const difference = ea[key] - eb[key];
    if (Math.abs(difference) >= 4) {
      return difference > 0 ? 1 : -1;
    }
  }
  if (totalDifference !== 0) {
    return totalDifference > 0 ? 1 : -1;
  }
  const lengthDifference = Array.from(a.text).length - Array.from(b.text).length;
  if (lengthDifference !== 0) {
    return lengthDifference < 0 ? 1 : -1;
  }
  return a.text < b.text ? 1 : -1;
}

function rankCandidates(candidates: Candidate[]): Array<{ candidate: Candidate; features: Features; wins: number }> {
  const scored = candidates.map((candidate) => ({ candidate, features: evaluate(candidate), wins: 0 }));
  for (let i = 0; i < scored.length; i += 1) {
    for (let j = i + 1; j < scored.length; j += 1) {
      const result = compare(scored[i].candidate, scored[j].candidate, scored[i].features, scored[j].features);
      if (result > 0) {
        scored[i].wins += 1;
      } else {
        scored[j].wins += 1;
      }
    }
  }
  scored.sort((a, b) => {
    if (b.wins !== a.wins) return b.wins - a.wins;
    if (b.features.total !== a.features.total) return b.features.total - a.features.total;
    const lengthDifference = Array.from(a.candidate.text).length - Array.from(b.candidate.text).length;
    if (lengthDifference !== 0) return lengthDifference;
    return a.candidate.text < b.candidate.text ? -1 : 1;
  });
  return scored;
}

function validateEntry(text: unknown): { ok: boolean; reason: string; chars: number; bytes: number } {
  if (typeof text !== "string") {
    return { ok: false, reason: "entry is not a string", chars: 0, bytes: 0 };
  }
  const bytes = Buffer.byteLength(text, "utf8");
  const chars = Array.from(text).length;
  if (text.length === 0) return { ok: false, reason: "entry is empty", chars, bytes };
  if (!/\S/u.test(text)) return { ok: false, reason: "entry is only white space", chars, bytes };
  if (chars < 1 || chars > MAX_CHARS) return { ok: false, reason: `entry has ${chars} characters, outside 1..${MAX_CHARS}`, chars, bytes };
  if (/[\u0000-\u001f\u007f\u2028\u2029]/u.test(text)) return { ok: false, reason: "entry contains a control or line-break character", chars, bytes };
  if (Buffer.from(text, "utf8").toString("utf8") !== text) return { ok: false, reason: "entry is not valid UTF-8", chars, bytes };
  if (text !== text.trim()) return { ok: false, reason: "entry has leading or trailing white space", chars, bytes };
  if (/\s{2,}/u.test(text)) return { ok: false, reason: "entry has repeated white space", chars, bytes };
  return { ok: true, reason: "valid", chars, bytes };
}

function writeValidatedEntry(text: string): void {
  const check = validateEntry(text);
  if (!check.ok) {
    throw new Error(`refusing to write invalid entry: ${check.reason}`);
  }
  mkdirSync(dirname(OUTPUT_PATH), { recursive: true });
  const temporaryPath = `${OUTPUT_PATH}.tmp-${process.pid}`;
  writeFileSync(temporaryPath, text, { encoding: "utf8", mode: 0o644 });
  const staged = readFileSync(temporaryPath, "utf8");
  if (staged !== text) {
    throw new Error("staged entry does not match the selected text");
  }
  renameSync(temporaryPath, OUTPUT_PATH);
  const written = readFileSync(OUTPUT_PATH, "utf8");
  const writtenCheck = validateEntry(written);
  if (!writtenCheck.ok) {
    throw new Error(`written entry failed the gate: ${writtenCheck.reason}`);
  }
  if (written !== text) {
    throw new Error("written entry does not match the selected text");
  }
}

function main(): void {
  const candidates: Candidate[] = [
    ...curated.map(([text, craft]) => ({ text, origin: "curated" as Origin, craft })),
    ...buildGenerated(),
  ];
  const eligible = candidates.filter((candidate) => {
    const lower = candidate.text.toLowerCase();
    const hasElevator = /\b(elevator|lift|floor|floors|door|doors|button|buttons|ride|shaft|cab)\b/.test(lower);
    const hasMachine = /\b(sensor|sensors|firmware|protocol|module|battery|batteries|charg\w*|diagnostic\w*|calibrat\w*|servo|update|reboot|ping|optical|proximity|humidity|gyro\w*|circuit|software|hardware|algorithm|subroutine|wi-?fi|bluetooth|usb|port|processor|memory|runtime|error|loading|standby|operational)\b/.test(lower);
    return validateEntry(candidate.text).ok && hasElevator && hasMachine;
  });
  const pool = eligible.length > 0 ? eligible : candidates.filter((candidate) => validateEntry(candidate.text).ok);
  const ranked = rankCandidates(pool);
  if (ranked.length === 0) {
    throw new Error("no candidate passed the gate");
  }
  let winner = ranked[0];
  let wrote = false;
  for (const entry of ranked) {
    try {
      writeValidatedEntry(entry.candidate.text);
      winner = entry;
      wrote = true;
      break;
    } catch {
      continue;
    }
  }
  if (!wrote) {
    throw new Error("no candidate could be written as a valid entry");
  }
  const writtenText = readFileSync(OUTPUT_PATH, "utf8");
  const check = validateEntry(writtenText);
  if (!check.ok || writtenText !== winner.candidate.text) {
    throw new Error("final entry on disk failed the post-write gate");
  }
  if (process.env.DEBUG_CANDIDATES === "1") {
    for (const entry of ranked) {
      console.log(`${entry.wins} wins | ${entry.features.total} pts | ${JSON.stringify(entry.features)} | ${entry.candidate.origin} | ${entry.candidate.text}`);
    }
  }
  console.log(`selected: ${winner.candidate.text}`);
  console.log(`origin: ${winner.candidate.origin}; wins: ${winner.wins}/${ranked.length - 1}; rubric: ${winner.features.total}; craft: ${winner.features.craft}`);
  console.log(`gate: ${check.ok ? "PASS" : "FAIL"} (${check.chars} chars, ${check.bytes} bytes, ${check.reason})`);
  console.log(`wrote: ${OUTPUT_PATH}`);
  console.log("runners-up:");
  for (const entry of ranked.slice(1, 6)) {
    console.log(`  ${entry.wins} wins | ${entry.features.total} pts | ${entry.candidate.text}`);
  }
}

main();
