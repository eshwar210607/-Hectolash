import axios from 'axios';

const API_URL = 'http://localhost:5000/api/ai';

export const getHint = async (sequence, userInput, hintsUsed, solution) => {
  try {
    const res = await axios.post(`${API_URL}/hint`, {
      sequence, userInput, hintsUsed, solution
    });
    return res.data.hint;
  } catch {
    return '💡 Try thinking about which operators work best with these numbers!';
  }
};

export const getCommentary = async (isCorrect, playerAnswer, correctAnswer, question, responseTime, playerScore, aiScore, round) => {
  try {
    const res = await axios.post(`${API_URL}/commentary`, {
      isCorrect, playerAnswer, correctAnswer,
      question, responseTime, playerScore, aiScore, round
    });
    return res.data.commentary;
  } catch {
    return isCorrect ? '⚡ Nice one!' : '😏 Wrong answer!';
  }
};

export const getAdaptiveDifficulty = async (correctAnswers, wrongAnswers, avgResponseTime, currentLevel) => {
  try {
    const res = await axios.post(`${API_URL}/difficulty`, {
      correctAnswers, wrongAnswers, avgResponseTime, currentLevel
    });
    return res.data.level;
  } catch {
    return currentLevel;
  }
};

export const explainMistake = async (question, playerAnswer, correctAnswer) => {
  try {
    const res = await axios.post(`${API_URL}/explain`, {
      question, playerAnswer, correctAnswer
    });
    return res.data.explanation;
  } catch {
    return `The correct answer is ${correctAnswer}.`;
  }
};