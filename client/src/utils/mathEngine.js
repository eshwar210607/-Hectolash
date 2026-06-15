const OPERATORS = ['+', '-', '*', '/'];

function evaluate(expr) {
  try {
    // eslint-disable-next-line no-new-func
    const result = new Function('return ' + expr)();
    return Math.abs(result - 100) < 1e-9 ? 100 : result;
  } catch {
    return null;
  }
}

function dfs(digits, index, current) {
  if (index === digits.length) {
    return evaluate(current) === 100 ? current : null;
  }
  for (const op of OPERATORS) {
    const result = dfs(digits, index + 1, current + op + digits[index]);
    if (result !== null) return result;
  }
  return null;
}

export function findExpression(sequence) {
  const digits = sequence.split('');
  return dfs(digits, 1, digits[0]);
}

export function generateSequence() {
  let sequence = '';
  let expression = null;
  while (!expression) {
    sequence = Array.from({ length: 6 }, () =>
      Math.floor(Math.random() * 9) + 1
    ).join('');
    expression = findExpression(sequence);
  }
  return sequence;
}

export function isValidExpression(expr, sequence) {
  const exprDigits = expr.replace(/[^1-9]/g, '');
  return exprDigits === sequence;
}

export function checkAnswer(expr, sequence) {
  const exprDigits = expr.replace(/[^1-9]/g, '');
  if (exprDigits !== sequence) return false;
  try {
    // eslint-disable-next-line no-new-func
    const result = new Function('return ' + expr)();
    return Math.abs(result - 100) < 1e-9;
  } catch {
    return false;
  }
}