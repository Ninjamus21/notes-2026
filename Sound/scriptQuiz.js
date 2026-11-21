"use strict";

/* =====================================================================
   1. CONTENT  (this is the only part you need to edit)
   Question types: "choice", "truefalse", "scale", "open", "gate"
   "gate": the SECOND button ("no") sends her back to question number
   retryTo (0 = the first question). The first button ("yes") moves on.
   ===================================================================== */
const CONFIG = {
  intro: {
    heading: "Hello my cute bao",
    text: "Welcome back cutie pie, good to see you again!",   // EDIT
    button: "Start"
  },
  finale: {
    heading: "That’s all of them. (づ￣3￣)づ╭～❤️",                          // EDIT
    message: "here is your next clue", // EDIT
    codeword: "Listen to the audio"                                    // EDIT: the word that unlocks the next gift
  }
};

const QUESTIONS = [
  {
    type: "open",
    prompt: "what does or stamp mean?",
    placeholder: "Type your answer here",
    reply: "okay, see if Nico agrees with you, he will tell you your next clue if you are right"
  },

  {
    type: "gate",
    prompt: "did he agree with you?",
    labels: ["yes", "no"],
    retryTo: 0,                                           // "no" goes back to question 0
    ifTrue: "you are the best bb (づ￣3￣)づ╭～❤️",
    ifFalse: "aww, you are still the best bb (づ￣3￣)づ╭～❤️ try again"
  }
];

/* =====================================================================
   2. QUESTION CLASSES  (Template Method pattern)
   Question.run() is the template method: it fixes the order of the steps.
   Subclasses only fill in the steps that differ (collectAnswer, replyFor)
   or override a hook (replyFor, buttonFor, nextIndex).
   ===================================================================== */
class Question {
  constructor(cfg) {
    this.prompt = cfg.prompt;
    this.reply = cfg.reply ?? "Thank you.";
  }

  // TEMPLATE METHOD: show prompt -> collect answer -> show reply. Never overridden.
  async run(stage) {
    stage.showPrompt(this.prompt);
    const answer = await this.collectAnswer(stage);                                   // abstract step
    await stage.showReply(this.replyFor(answer), this.buttonFor(answer, stage.nextLabel)); // hooks + fixed step
    return answer;
  }

  collectAnswer(stage) {                              // abstract step
    throw new Error(this.constructor.name + " must implement collectAnswer()");
  }

  replyFor(answer) {                                  // hook: text of the reply
    return this.reply;
  }

  buttonFor(answer, fallback) {                       // hook: label of the button under the reply
    return fallback;
  }

  nextIndex(answer, index) {                          // hook: which question comes next
    return index + 1;
  }
}

class ChoiceQuestion extends Question {
  constructor(cfg) {
    super(cfg);
    this.options = this.buildOptions(cfg);
  }
  buildOptions(cfg) { return cfg.options; }           // hook for subclasses
  collectAnswer(stage) { return stage.pickOne(this.options.map(o => o.text)); }
  replyFor(index) { return this.options[index].reply; }
}

class TrueFalseQuestion extends ChoiceQuestion {
  buildOptions(cfg) {
    const [yes, no] = cfg.labels ?? ["True", "False"];
    return [{ text: yes, reply: cfg.ifTrue }, { text: no, reply: cfg.ifFalse }];
  }
}

// A true/false question she has to pass: "no" sends her back to question retryTo.
class GateQuestion extends TrueFalseQuestion {
  constructor(cfg) {
    super(cfg);
    this.retryTo = cfg.retryTo ?? 0;
  }
  failed(answer) { return answer === 1; }             // index 1 = the second button
  buttonFor(answer, fallback) { return this.failed(answer) ? "Try again" : fallback; }
  nextIndex(answer, index) { return this.failed(answer) ? this.retryTo : index + 1; }
}

class ScaleQuestion extends Question {
  constructor(cfg) {
    super(cfg);
    this.low = cfg.low;
    this.high = cfg.high;
    this.replies = cfg.replies ?? {};
  }
  collectAnswer(stage) { return stage.pickScale(7, this.low, this.high); }
  replyFor(value) { return this.replies[value] ?? this.reply; }
}

class OpenQuestion extends Question {
  constructor(cfg) {
    super(cfg);
    this.placeholder = cfg.placeholder ?? "Type here";
  }
  collectAnswer(stage) { return stage.writeText(this.placeholder); }
}

// To add a new question type: subclass Question, then register it here.
const QUESTION_TYPES = {
  choice: ChoiceQuestion,
  truefalse: TrueFalseQuestion,
  gate: GateQuestion,
  scale: ScaleQuestion,
  open: OpenQuestion
};

function createQuestion(cfg) {
  const Type = QUESTION_TYPES[cfg.type];
  if (!Type) throw new Error("Unknown question type: " + cfg.type);
  return new Type(cfg);
}

/* =====================================================================
   3. STAGE  (everything that touches the DOM lives here)
   ===================================================================== */
function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

class Stage {
  constructor(main, bar, count) {
    this.main = main;
    this.bar = bar;
    this.count = count;
    this.nextLabel = "Next";
  }

  progress(done, total, label) {
    this.bar.style.width = (done / total * 100) + "%";
    this.count.textContent = label ?? "Question " + (done + 1) + " of " + total;
  }

  showPrompt(text) {
    this.main.replaceChildren();
    const h = el("h1", null, text);
    h.tabIndex = -1;
    this.main.append(h);
    h.focus({ preventScroll: true });
  }

  pickOne(labels) {
    return new Promise(resolve => {
      const wrap = el("div", "choices");
      const buttons = labels.map((label, i) => {
        const b = el("button", "choice", label);
        b.type = "button";
        b.addEventListener("click", () => {
          buttons.forEach(x => { x.disabled = true; });
          b.classList.add("is-chosen");
          resolve(i);
        });
        return b;
      });
      wrap.append(...buttons);
      this.main.append(wrap);
    });
  }

  pickScale(n, low, high) {
    return new Promise(resolve => {
      const wrap = el("div", "scale");
      const buttons = [];
      for (let v = 1; v <= n; v++) {
        const b = el("button", "choice", String(v));
        b.type = "button";
        b.addEventListener("click", () => {
          buttons.forEach(x => { x.disabled = true; });
          b.classList.add("is-chosen");
          resolve(v);
        });
        buttons.push(b);
      }
      wrap.append(...buttons);
      const labels = el("div", "scale-labels");
      labels.append(el("span", null, low), el("span", null, high));
      this.main.append(wrap, labels);
    });
  }

  writeText(placeholder) {
    return new Promise(resolve => {
      const field = el("textarea");
      field.placeholder = placeholder;
      field.setAttribute("aria-label", "Your answer");
      const send = el("button", "primary", "Send");
      send.type = "button";
      send.disabled = true;
      field.addEventListener("input", () => { send.disabled = field.value.trim() === ""; });
      send.addEventListener("click", () => {
        field.readOnly = true;
        send.remove();
        resolve(field.value.trim());
      });
      this.main.append(field, send);
    });
  }

  showReply(text, label = this.nextLabel) {
    return new Promise(resolve => {
      const box = el("div", "reply", text);
      box.setAttribute("role", "status");
      const next = el("button", "primary", label);
      next.type = "button";
      next.addEventListener("click", () => resolve());
      this.main.append(box, next);
      next.scrollIntoView({ block: "nearest", behavior: "smooth" });
    });
  }

  showIntro(intro) {
    return new Promise(resolve => {
      this.main.replaceChildren();
      const h = el("h1", null, intro.heading);
      h.tabIndex = -1;
      const start = el("button", "primary", intro.button);
      start.type = "button";
      start.addEventListener("click", () => resolve());
      this.main.append(h, el("p", "lead", intro.text), start);
    });
  }

  showFinale(finale) {
    this.main.replaceChildren();
    const h = el("h1", null, finale.heading);
    h.tabIndex = -1;
      const audio = el("audio");
  audio.src = "clue2.mp3";        // e.g. "audio/finale.mp3"
  audio.controls = true;           // shows play/pause/seek UI
  audio.preload = "metadata";
  audio.setAttribute("aria-label", "Finale audio");

    this.main.append(h, el("div", "codeword", finale.codeword), el("p", "lead", finale.message), audio);
    this.main.lastChild.style.margin = "0";
    h.focus({ preventScroll: true });
  }
}

/* =====================================================================
   4. GAME  (runs the questions, follows nextIndex(), then the finale)
   ===================================================================== */
class QuizGame {
  constructor(stage, questions, config) {
    this.stage = stage;
    this.questions = questions;
    this.config = config;
    this.answers = [];
  }

  async play() {
    const total = this.questions.length;
    await this.stage.showIntro(this.config.intro);
    let i = 0;
    while (i < total) {
      this.stage.progress(i, total);
      this.stage.nextLabel = i === total - 1 ? "Finish" : "Next";
      const answer = await this.questions[i].run(this.stage);
      this.answers.push(answer);
      i = this.questions[i].nextIndex(answer, i);     // the question decides what comes next
    }
    this.stage.progress(total, total, "All done");
    this.stage.showFinale(this.config.finale);
  }
}

/* ===== start ===== */
new QuizGame(
  new Stage(document.getElementById("main"), document.getElementById("bar"), document.getElementById("count")),
  QUESTIONS.map(createQuestion),
  CONFIG
).play();