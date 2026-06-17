const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize the Gemini AI SDK safely with your environment variable
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

// =========================================================================
// 🧩 1. POST /api/ai/hint — HYBRID HINT ENGINE
// =========================================================================
router.post('/hint', async (req, res) => {
  const { sequence, userInput, targetSolution, diagnostic } = req.body;

  const prompt = `
You are ARIA, a helpful, witty, and mystical math companion in the Maths Wizard arena.
The player is tackling a Hectoc puzzle challenge.
Objective: Use the 6-digit sequence [${sequence ? sequence.split('').join(', ') : ''}] in that exact order to build an algebraic expression that evaluates to 100.

Target Math Solution Blueprint: ${targetSolution}
Player's current draft expression: "${userInput || 'Empty'}"

🚨 CRITICAL SYSTEM DIAGNOSTIC ANALYSIS (TRUST THIS PROMPT CONDITION ABSOLUTELY):
"${diagnostic}"

YOUR TASK:
- Read the system diagnostic statement carefully. It contains the exact location of a user typo or the correct next move calculated by our algorithmic backend.
- Translate that technical diagnostic info into a dynamic, engaging hint response.
- If the diagnostic flags a digit mistake or structural rule violation (like entering multi-digit combinations out of order), tell them precisely where they slipped up and instruct them to delete the mistake.
- If they are completely on track, encourage them and nudge them with the next operator provided in the diagnostic.
- Never reveal the full, raw formula layout string.
- Keep the response under 2 sentences max.
- Speak with high wizard energy, be encouraging, and use emojis sparingly.
- Respond with ONLY the finalized hint text, no extra prefixes or markdown tags.
`;

  try {
    const result = await model.generateContent(prompt);
    const hint = result.response.text().trim();
    res.json({ hint });
  } catch (err) {
    console.error('Gemini Hectoc Error:', err);
    res.status(500).json({ hint: 'Focus your arcane energy! Double-check your digit progression layout.' });
  }
});

// =========================================================================
// ⚡ 2. POST /api/ai/commentary — LIGHTNING MATH LIVE COMMENTARY
// =========================================================================
router.post('/commentary', async (req, res) => {
  const { isCorrect, playerAnswer, correctAnswer, question, responseTime, playerScore, aiScore, round } = req.body;

  const prompt = `
You are ARIA, a hyper-competitive AI wizard opponent in a split-second math speed duel called Lightning Math.
You just went head-to-head against a human on this equation: ${question} = ${correctAnswer}

Player answered: ${playerAnswer} (${isCorrect ? 'CORRECT' : 'WRONG'})
Player calculation velocity speed: ${responseTime} seconds
Current Match Arena Scoreboard - Player: ${playerScore}, You (ARIA): ${aiScore}
Round: ${round}

Generate a SHORT, punchy competitive comment (1 sentence max, under 15 words).
- If the player was correct and blindingly fast: act slightly impressed but highly determined.
- If they were correct but sluggish/slow: tease them playfully about their casting speed.
- If they missed the answer: mock them with playful wizard wit.
- If you are winning the match: sound confident and dominant.
- If they are winning: sound highly focused on a comeback.
- Respond with ONLY the commentary sentence, no quotes or filler text.
`;

  try {
    const result = await model.generateContent(prompt);
    const commentary = result.response.text().trim();
    res.json({ commentary });
  } catch (err) {
    console.error('Gemini Commentary Error:', err);
    res.json({ commentary: isCorrect ? 'Nice shot, but your casting speed can be faster!' : 'Boom! Incorrect matrix coordinates.' });
  }
});

// =========================================================================
// 📈 3. POST /api/ai/difficulty — ADAPTIVE DIFFICULTY TUNER
// =========================================================================
router.post('/difficulty', async (req, res) => {
  const { correctAnswers, wrongAnswers, avgResponseTime, currentLevel } = req.body;

  const prompt = `
You are an adaptive algorithm calibration unit adjusting difficulties.
Player performance profile arrays:
- Correct entries: ${correctAnswers}
- Incorrect entries: ${wrongAnswers}
- Average speed metrics: ${avgResponseTime} seconds
- Current tier level: ${currentLevel}/10

Suggest a new integer tier level strictly between 1 and 10.
- Level 1-3: baseline addition/subtraction.
- Level 4-6: introductory products/multiplication.
- Level 7-10: massive scale multi-step terms.
Respond with ONLY a single numeric character token between 1 and 10.
`;

  try {
    const result = await model.generateContent(prompt);
    const level = parseInt(result.response.text().trim());
    res.json({ level: isNaN(level) ? currentLevel : Math.min(10, Math.max(1, level)) });
  } catch (err) {
    res.json({ level: currentLevel });
  }
});

// =========================================================================
// 💡 4. POST /api/ai/explain — ANALYTICAL MISTAKE BREAKDOWN
// =========================================================================
router.post('/explain', async (req, res) => {
  const { question, playerAnswer, correctAnswer } = req.body;

  const prompt = `
You are ARIA, an expert math tutor.
Equation: ${question} = ?
Player input entry: ${playerAnswer}
Verified math answer: ${correctAnswer}

Provide a ONE-sentence analytical breakdown (under 20 words) explaining exactly where the math failed.
Focus on order of operations or sign values, and be concise.
Respond with ONLY the explanation text.
`;

  try {
    const result = await model.generateContent(prompt);
    const explanation = result.response.text().trim();
    res.json({ explanation });
  } catch (err) {
    res.json({ explanation: `The correct output evaluate parameter is ${correctAnswer}. Mind your operations!` });
  }
});

module.exports = router;