/**
 * Calculator — script.js
 * Handles all arithmetic logic, display updates, keyboard input, and UI effects.
 */
(function () {
  'use strict';
  // ──────────────────────────────────────
  // DOM references
  // ──────────────────────────────────────
  const displayExpression = document.getElementById('display-expression');
  const displayResult     = document.getElementById('display-result');
  const btnGrid           = document.querySelector('.btn-grid');
  const keyboardHint      = document.getElementById('keyboard-hint');
  // ──────────────────────────────────────
  // Calculator state
  // ──────────────────────────────────────
  let currentInput    = '0';   // What the user is currently typing
  let previousInput   = '';    // The left operand (after pressing an operator)
  let operator        = null;  // Current pending operator
  let shouldReset     = false; // Reset display on next number input
  let lastExpression  = '';    // Shown in the small expression line
  // ──────────────────────────────────────
  // Utility helpers
  // ──────────────────────────────────────
  /** Format a number string for display (add commas, limit decimals) */
  function formatDisplay(value) {
    if (value === '' || value === 'Error') return value || '0';
    const num = parseFloat(value);
    if (isNaN(num)) return 'Error';
    if (!isFinite(num)) return 'Error';
    // If the user is still typing (has trailing dot or trailing zeros after dot)
    if (value.includes('.') && (value.endsWith('.') || /\.\d*0+$/.test(value))) {
      const [intPart, decPart] = value.split('.');
      const formattedInt = Number(intPart).toLocaleString('en-US');
      return `${formattedInt}.${decPart}`;
    }
    // For very large or very small numbers, use exponential
    if (Math.abs(num) >= 1e12 || (Math.abs(num) < 1e-8 && num !== 0)) {
      return num.toExponential(6);
    }
    // Limit decimal places to avoid display overflow
    const rounded = parseFloat(num.toPrecision(12));
    return rounded.toLocaleString('en-US', { maximumFractionDigits: 10 });
  }
  /** Update the display elements */
  function updateDisplay() {
    displayExpression.textContent = lastExpression;
    displayResult.textContent = formatDisplay(currentInput);
    // Shrink font for long results
    const len = displayResult.textContent.length;
    displayResult.classList.toggle('shrink', len > 10);
  }
  // ──────────────────────────────────────
  // Core operations
  // ──────────────────────────────────────
  function calculate(a, op, b) {
    const numA = parseFloat(a);
    const numB = parseFloat(b);
    if (isNaN(numA) || isNaN(numB)) return 'Error';
    switch (op) {
      case '+': return numA + numB;
      case '−': return numA - numB;
      case '×': return numA * numB;
      case '÷': return numB === 0 ? 'Error' : numA / numB;
      default:  return numB;
    }
  }
  // ──────────────────────────────────────
  // Action handlers
  // ──────────────────────────────────────
  function inputNumber(value) {
    if (currentInput === 'Error') currentInput = '0';
    if (shouldReset) {
      currentInput = value;
      shouldReset = false;
    } else {
      if (currentInput === '0' && value !== '.') {
        currentInput = value;
      } else {
        // Limit input length
        if (currentInput.replace(/[^0-9]/g, '').length >= 15) return;
        currentInput += value;
      }
    }
    updateDisplay();
  }
  function inputDecimal() {
    if (shouldReset) {
      currentInput = '0.';
      shouldReset = false;
      updateDisplay();
      return;
    }
    if (!currentInput.includes('.')) {
      currentInput += '.';
    }
    updateDisplay();
  }
  function inputOperator(op) {
    if (currentInput === 'Error') return;
    // If there's a pending operation, evaluate it first (chaining)
    if (operator && !shouldReset) {
      const result = calculate(previousInput, operator, currentInput);
      if (result === 'Error') {
        currentInput = 'Error';
        previousInput = '';
        operator = null;
        lastExpression = '';
        updateDisplay();
        return;
      }
      currentInput = String(result);
    }
    lastExpression = `${formatDisplay(currentInput)} ${op}`;
    previousInput = currentInput;
    operator = op;
    shouldReset = true;
    // Highlight active operator button
    clearActiveOperator();
    const opBtn = document.querySelector(`.btn-operator[data-value="${op}"]`);
    if (opBtn) opBtn.classList.add('active');
    updateDisplay();
  }
  function evaluate() {
    if (!operator || previousInput === '') return;
    const result = calculate(previousInput, operator, currentInput);
    lastExpression = `${formatDisplay(previousInput)} ${operator} ${formatDisplay(currentInput)} =`;
    clearActiveOperator();
    if (result === 'Error') {
      currentInput = 'Error';
    } else {
      currentInput = String(result);
    }
    previousInput = '';
    operator = null;
    shouldReset = true;
    // Flash result color
    displayResult.classList.add('evaluating');
    setTimeout(() => displayResult.classList.remove('evaluating'), 350);
    updateDisplay();
  }
  function clearAll() {
    currentInput = '0';
    previousInput = '';
    operator = null;
    shouldReset = false;
    lastExpression = '';
    clearActiveOperator();
    updateDisplay();
  }
  function backspace() {
    if (currentInput === 'Error' || shouldReset) {
      clearAll();
      return;
    }
    currentInput = currentInput.slice(0, -1);
    if (currentInput === '' || currentInput === '-') {
      currentInput = '0';
    }
    updateDisplay();
  }
  function percent() {
    if (currentInput === 'Error') return;
    const num = parseFloat(currentInput);
    if (isNaN(num)) return;
    currentInput = String(num / 100);
    updateDisplay();
  }
  function clearActiveOperator() {
    document.querySelectorAll('.btn-operator.active').forEach(btn => btn.classList.remove('active'));
  }
  // ──────────────────────────────────────
  // Button click handler (delegation)
  // ──────────────────────────────────────
  btnGrid.addEventListener('click', (e) => {
    const btn = e.target.closest('.btn');
    if (!btn) return;
    const action = btn.dataset.action;
    const value  = btn.dataset.value;
    // Ripple effect
    triggerRipple(btn, e);
    switch (action) {
      case 'number':    inputNumber(value); break;
      case 'decimal':   inputDecimal();     break;
      case 'operator':  inputOperator(value); break;
      case 'equals':    evaluate();         break;
      case 'clear':     clearAll();         break;
      case 'backspace': backspace();        break;
      case 'percent':   percent();          break;
    }
  });
  // ──────────────────────────────────────
  // Keyboard support
  // ──────────────────────────────────────
  const keyMap = {
    '0': { action: 'number',   value: '0', selector: '#btn-0'        },
    '1': { action: 'number',   value: '1', selector: '#btn-1'        },
    '2': { action: 'number',   value: '2', selector: '#btn-2'        },
    '3': { action: 'number',   value: '3', selector: '#btn-3'        },
    '4': { action: 'number',   value: '4', selector: '#btn-4'        },
    '5': { action: 'number',   value: '5', selector: '#btn-5'        },
    '6': { action: 'number',   value: '6', selector: '#btn-6'        },
    '7': { action: 'number',   value: '7', selector: '#btn-7'        },
    '8': { action: 'number',   value: '8', selector: '#btn-8'        },
    '9': { action: 'number',   value: '9', selector: '#btn-9'        },
    '.': { action: 'decimal',  value: '.', selector: '#btn-decimal'  },
    '+': { action: 'operator', value: '+', selector: '#btn-add'      },
    '-': { action: 'operator', value: '−', selector: '#btn-subtract' },
    '*': { action: 'operator', value: '×', selector: '#btn-multiply' },
    '/': { action: 'operator', value: '÷', selector: '#btn-divide'   },
    '%': { action: 'percent',  value: '%', selector: '#btn-percent'  },
    'Enter':     { action: 'equals',    selector: '#btn-equals'    },
    '=':         { action: 'equals',    selector: '#btn-equals'    },
    'Backspace': { action: 'backspace', selector: '#btn-backspace' },
    'Delete':    { action: 'clear',     selector: '#btn-clear'     },
    'Escape':    { action: 'clear',     selector: '#btn-clear'     },
  };
  document.addEventListener('keydown', (e) => {
    const mapping = keyMap[e.key];
    if (!mapping) return;
    e.preventDefault();
    // Flash keyboard hint
    keyboardHint.classList.add('flash');
    setTimeout(() => keyboardHint.classList.remove('flash'), 500);
    // Visual feedback on the corresponding button
    const btn = document.querySelector(mapping.selector);
    if (btn) {
      btn.classList.add('ripple');
      btn.style.transform = 'scale(0.94)';
      setTimeout(() => {
        btn.classList.remove('ripple');
        btn.style.transform = '';
      }, 200);
    }
    switch (mapping.action) {
      case 'number':    inputNumber(mapping.value); break;
      case 'decimal':   inputDecimal();             break;
      case 'operator':  inputOperator(mapping.value); break;
      case 'equals':    evaluate();                 break;
      case 'clear':     clearAll();                 break;
      case 'backspace': backspace();                break;
      case 'percent':   percent();                  break;
    }
  });
  // ──────────────────────────────────────
  // Ripple effect
  // ──────────────────────────────────────
  function triggerRipple(btn, event) {
    const rect = btn.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    btn.style.setProperty('--ripple-x', `${x}%`);
    btn.style.setProperty('--ripple-y', `${y}%`);
    btn.classList.remove('ripple');
    // Force reflow for re-triggering the animation
    void btn.offsetWidth;
    btn.classList.add('ripple');
    setTimeout(() => btn.classList.remove('ripple'), 600);
  }
  // ──────────────────────────────────────
  // Initialise
  // ──────────────────────────────────────
  updateDisplay();
})();
