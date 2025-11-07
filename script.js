const GEMINI_API_KEY = "AIzaSyDHdGl9hZvD4Y-G2ysGPoSL9OPleyYSKJY";
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

const themeToggle = document.getElementById("themeToggle");
const generateBtn = document.getElementById("generateBtn");
const topicInput = document.getElementById("topic");
const countSelect = document.getElementById("count");
const quizArea = document.getElementById("quizArea");
const nextBtn = document.getElementById("nextBtn");
const progressBar = document.getElementById("progressBar");
const progressFill = document.getElementById("progressFill");

let questions = [];
let currentIndex = 0;
let answered = false;
let correctAnswers = 0;

themeToggle.onclick = () => {
  const current = document.body.getAttribute("data-theme");
  const newTheme = current === "dark" ? "light" : "dark";
  document.body.setAttribute("data-theme", newTheme);
  themeToggle.querySelector(".theme-toggle-slider").textContent = newTheme === "dark" ? "🌙" : "☀️";
};

async function fetchQuestions(topic, count) {
  const prompt = `Generate ${count} unique multiple-choice questions in JSON array format about "${topic}".
Each object must include:
{
 "question": "string",
 "options": ["A","B","C","D"],
 "answer": 0-3,
 "explanation": "brief explanation"
}`;
  const body = JSON.stringify({contents:[{parts:[{text:prompt}]}]});
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body
  });
  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
  const jsonText = text.substring(text.indexOf("["), text.lastIndexOf("]")+1);
  return JSON.parse(jsonText);
}

function updateProgress() {
  const progress = ((currentIndex + 1) / questions.length) * 100;
  progressFill.style.width = progress + "%";
}

function showCompletion() {
  const percentage = Math.round((correctAnswers / questions.length) * 100);
  const emoji = percentage >= 80 ? "🏆" : percentage >= 60 ? "🎉" : percentage >= 40 ? "👍" : "📚";
  const message = percentage >= 80 ? "Outstanding!" : percentage >= 60 ? "Great Job!" : percentage >= 40 ? "Good Effort!" : "Keep Learning!";
  
  quizArea.innerHTML = `
    <div class="completion">
      <div class="completion-icon">${emoji}</div>
      <div class="completion-text">${message}</div>
      <div class="score-display">
        <div class="score-percentage">${percentage}%</div>
        <div class="score-label">Your Score</div>
        <div class="score-details">
          <div class="score-stat">
            <span class="score-stat-value">${correctAnswers}</span>
            <span class="score-stat-label">Correct</span>
          </div>
          <div class="score-stat">
            <span class="score-stat-value">${questions.length - correctAnswers}</span>
            <span class="score-stat-label">Incorrect</span>
          </div>
          <div class="score-stat">
            <span class="score-stat-value">${questions.length}</span>
            <span class="score-stat-label">Total</span>
          </div>
        </div>
      </div>
      <div class="completion-subtext">You've completed all questions!</div>
      <button class="restart-btn" onclick="location.reload()">Start New Quiz</button>
    </div>
  `;
}

function renderQuestion(qIndex) {
  const q = questions[qIndex];
  if (!q) {
    quizArea.innerHTML = '<div class="empty-state"><div class="empty-icon">❌</div><p class="empty-text">No question found</p></div>';
    return;
  }

  answered = false;
  nextBtn.classList.remove("show");
  updateProgress();

  quizArea.innerHTML = `
    <div class="question-card">
      <div class="question-header">
        <span class="question-number">Q${qIndex + 1}</span>
        <h2 class="question-text">${q.question}</h2>
      </div>
      <div class="options" id="options"></div>
      <div id="solutionArea"></div>
    </div>
  `;

  const optionsContainer = document.getElementById("options");
  const solutionArea = document.getElementById("solutionArea");

  q.options.forEach((opt, i) => {
    const div = document.createElement("div");
    div.className = "option";
    div.textContent = opt;
    div.onclick = () => {
      if (answered) return;
      answered = true;

      const allOptions = optionsContainer.querySelectorAll(".option");
      allOptions.forEach(o => o.style.cursor = "default");

      if (i === q.answer) {
        div.classList.add("correct");
        correctAnswers++;
      } else {
        div.classList.add("wrong");
        allOptions[q.answer].classList.add("correct");
      }

      solutionArea.innerHTML = `
        <div class="solution">
          <div class="solution-label">Explanation</div>
          <div class="solution-text">${q.explanation || "No explanation provided."}</div>
        </div>
      `;

      if (currentIndex < questions.length - 1) {
        nextBtn.classList.add("show");
      } else {
        setTimeout(() => {
          showCompletion();
        }, 1500);
      }
    };
    optionsContainer.appendChild(div);
  });
}

generateBtn.onclick = async () => {
  const topic = topicInput.value.trim() || "general knowledge";
  const count = parseInt(countSelect.value);

  generateBtn.disabled = true;
  generateBtn.textContent = "Generating...";
  nextBtn.classList.remove("show");
  progressBar.style.display = "block";
  progressFill.style.width = "0%";
  correctAnswers = 0;

  quizArea.innerHTML = `
    <div class="loading">
      <div class="spinner"></div>
      <p class="loading-text">Creating your quiz...</p>
    </div>
  `;

  try {
    questions = await fetchQuestions(topic, count);
    currentIndex = 0;
    renderQuestion(currentIndex);
  } catch (err) {
    quizArea.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">⚠️</div>
        <p class="empty-text" style="color:var(--error)">Error: ${err.message}</p>
      </div>
    `;
    progressBar.style.display = "none";
  } finally {
    generateBtn.disabled = false;
    generateBtn.textContent = "Generate Quiz";
  }
};

nextBtn.onclick = () => {
  currentIndex++;
  if (currentIndex < questions.length) {
    renderQuestion(currentIndex);
  }
};

topicInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") generateBtn.click();
});
