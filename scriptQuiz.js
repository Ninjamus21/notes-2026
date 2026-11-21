"use strict";

/* =====================================================================
   1. CONTENT  (this is the only part you need to edit)
   Question types: "choice", "truefalse", "scale", "open"
   Every answer gets a warm reply, so there are no wrong answers.
   ===================================================================== */
const CONFIG = {
  intro: {
    heading: "Hello my cute bao",
    text: "Take your time. There’s no rush. i made a little quiz for you :)",   // EDIT
    button: "Start"
  },
  finale: {
    heading: "That’s all of them. (づ￣3￣)づ╭～❤️",                          // EDIT
    message: "Keep this word safe. You’ll need it for the next step.", // EDIT
    codeword: "谢～谢～宝～宝"                                    // EDIT: the word that unlocks the next gift
  }
};

const QUESTIONS = [
  { type: "choice",                                           // EDIT all of these
    prompt: "Pick the best way to spend a rainy Sunday.",
    options: [
      { text: "Blanket, tea, and no plans at all.",
        reply: "Good answer. I’d pick that too, as long as you’re under the blanket with me." },
      { text: "Go out anyway and get properly soaked.",
        reply: "Chaotic and brave. I’ll bring the towels." },
      { text: "Cook something far too ambitious and laugh when it goes wrong.",
        reply: "That sounds like a really good day." },
      { text: "Lets make dumplings again haha",
        reply: "Our skill is improving, but I’m still not sure we can make them look like the ones in the restaurant."},
        { text: "Watch a movie together", reply: "That sounds like a great way to spend the day. (im all in)"}
    ] },

  { type: "truefalse",
    prompt: "True or false: I’m always right.",
    labels: ["True", "False"],
    ifTrue: "Bold. I’m going to remember you said that.",
    ifFalse: "Fair. But I’m right about you." },

  { type: "scale",
    prompt: "How good am I at keeping a secret?",
    low: "Terrible", high: "A vault",
    replies: {
      1: "Honest. Luckily this one is safe.",
      2: "Fair. I’m working on it.",
      3: "Somewhere in the middle, then.",
      4: "I’ll take that.",
      5: "You’ve seen nothing yet.",
      6: "I’m flattered. I’ll keep it that way.",
      7: "I’m glad you trust me. I’ll keep it safe."
    },
    reply: "Noted." },

  { type: "choice",
    prompt: "Which one of these sounds most like us?",
    options: [
      { text: "One planner, one follower.",
        reply: "Painfully accurate." },
      { text: "Laughing at the wrong times.",
        reply: "Every single time." },
      { text: "Cant find out how to hang up after a call.",
        reply: "My favourite kind." },
        { text: "我的手机在哪里", 
            reply: "Its in your hand 小笨蛋"}
    ] },

    { type: "scale",
        prompt: "Who is most 笨蛋?",
        low: "Me", high: "You",
        replies: {
          1: ";( 555 take it back 555",
          2: "okay so not fully 笨蛋",
          3: "I guess we’re both a little 笨蛋",
          4: "I’m glad we’re both a little 笨蛋",
          5: "I’m glad we’re both a little 笨蛋",
          6: "i can’t believe you said that",
          7: "simply not true i am the most 笨蛋"
    },
    reply: "Noted." },

  { type: "open",
    prompt: "Finish the sentence: I feel most myself when…",
    placeholder: "Type your answer here",
    reply: "Thank you for telling me that. I’m keeping it. muhaha" },

    { type: "scale",
        prompt: "How good would you say your singing voice is?",
        low: "Terrible", high: "Amazing",
        replies: {
            1: "I’m sure you’re being modest.",
            2: "I’m sure you’re being modest.",
            3: "i think you are better than you think",
            4: "Okay so middle of the road. I can work with that.",
            5: "i see you, maybe you need to warm up in a moment?",
            6: "okay so you are a little bit of a singer, i see",
            7: "i see you, i see you. i will be your audience."
        },
        reply: "Noted."
    },

    { type: truefalse,
        prompt: "True or false: I am the best gift giver.",
        labels: ["True", "False"],
        ifTrue: "o(*^@^*)o tak skat",
        ifFalse: "I’m sorry to hear that. I’ll do my best to improve."
    },

    {
        type: "choice",
        prompt: "Who is my favorite musician?",
        options: [
            { text: "Taylor Swift", reply: "..." },
            { text: "BTS", reply: "I love gangnam style... close enough." },
            { text: "Billy Joel", reply: "I love the piano man." },
            { text: "Justin Bieber", reply: "I will no procide to put on baby with just bieber if you think that hahhaha" },
            { text: "Sheena Ringo", reply: "I really like her music. But she is your favorite." }
        ]
    },

  { type: "choice",
    prompt: "What would you like to find in the very last box?",
    options: [
      { text: "Something sparkly", reply: "Noted. No promises." },
      { text: "Something I can eat", reply: "A practical choice. I respect it." },
      { text: "Something I can wear, ideally warm", reply: "I’m not saying anything." },
      { text: "Surprise me", reply: "That was always the plan." }
    ] }
];

/* =====================================================================
   2. QUESTION CLASSES  (Template Method pattern)
   Question.run() is the template method: it fixes the order of the steps.
   Subclasses only fill in the steps that differ (collectAnswer, replyFor).
   ===================================================================== */
class Question {
  constructor(cfg) {
    this.prompt = cfg.prompt;
    this.reply = cfg.reply ?? "Thank you.";
  }

  // TEMPLATE METHOD: show prompt -> collect answer -> show reply. Never overridden.
  async run(stage) {
    stage.showPrompt(this.prompt);
    const answer = await this.collectAnswer(stage);   // abstract step
    await stage.showReply(this.replyFor(answer));     // hook + fixed step
    return answer;
  }

  collectAnswer(stage) {                              // abstract step
    throw new Error(this.constructor.name + " must implement collectAnswer()");
  }

  replyFor(answer) {                                  // hook with a default
    return this.reply;
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

  showReply(text) {
    return new Promise(resolve => {
      const box = el("div", "reply", text);
      box.setAttribute("role", "status");
      const next = el("button", "primary", this.nextLabel);
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
    this.main.append(h, el("div", "codeword", finale.codeword), el("p", "lead", finale.message));
    this.main.lastChild.style.margin = "0";
    h.focus({ preventScroll: true });
  }
}

/* =====================================================================
   4. GAME  (runs the questions in order, then the finale)
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
    for (let i = 0; i < total; i++) {
      this.stage.progress(i, total);
      this.stage.nextLabel = i === total - 1 ? "Finish" : "Next";
      this.answers.push(await this.questions[i].run(this.stage));
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

