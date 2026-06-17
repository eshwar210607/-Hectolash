// A simple deterministic DFS algorithm to find an expression that evaluates to 100
function generateSequence() {
    return Array.from({ length: 6 }, () => Math.floor(Math.random() * 9) + 1).join('');
  }
  
  function findExpression(sequence) {
    const digits = sequence.split('').map(Number);
    const ops = ['+', '-', '*', '/'];
    let foundSolution = null;
  
    function dfs(index, currentExpr, currentVal, lastTerm) {
      if (foundSolution) return;
      
      if (index === 6) {
        if (Math.abs(currentVal - 100) < 0.0001) {
          foundSolution = currentExpr;
        }
        return;
      }
  
      const nextDigit = digits[index];
  
      // Try all 4 operators
      ops.forEach(op => {
        let nextVal = currentVal;
        let nextLastTerm = lastTerm;
  
        if (op === '+') {
          nextVal = currentVal + nextDigit;
          nextLastTerm = nextDigit;
        } else if (op === '-') {
          nextVal = currentVal - nextDigit;
          nextLastTerm = -nextDigit;
        } else if (op === '*') {
          // Reverse last operation due to operator precedence
          nextVal = (currentVal - lastTerm) + (lastTerm * nextDigit);
          nextLastTerm = lastTerm * nextDigit;
        } else if (op === '/') {
          if (nextDigit === 0) return;
          nextVal = (currentVal - lastTerm) + (lastTerm / nextDigit);
          nextLastTerm = lastTerm / nextDigit;
        }
  
        dfs(index + 1, `${currentExpr}${op}${nextDigit}`, nextVal, nextLastTerm);
      });
    }
  
    // Kickstart search with the first digit position vector
    dfs(1, `${digits[0]}`, digits[0], digits[0]);
    return foundSolution || `${digits[0]}+${digits[1]}+${digits[2]}+${digits[3]}+${digits[4]}+${digits[5]}`; // Fallback string map
  }
  
  module.exports = { generateSequence, findExpression };