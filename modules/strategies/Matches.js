// Matches Focus Strategy
export class MatchesStrategy {
  constructor() {
    this.state = {
      // Original prime mode
      primeNumbers: [2, 3, 5, 7],
      currentPrimeIndex: 0,
      primeWinCount: 0,

      digitMatchEnabled: false,
      selectedDigit: 5,
      digitMatchRange: { min: 0, max: 9 },

      echoEnabled: false,
      echoHistory: [],
      echoObserveTicks: 5,
      echoQueuedDigit: null,
      echoLossCount: 0,
      echoMaxLosses: 3,

      strikeEnabled: false,
      strikeCurrentDigit: 0,
      strikeAttempts: 0,
      strikeMaxAttempts: 3,
    }
  }

  modifyTradeConfig(config, lastDigits) {
    config.tradeType = "DIGITMATCH"

    if (this.state.echoEnabled && this.state.echoQueuedDigit !== null) {
      // Execute queued echo pattern trade
      config.targetDigit = this.state.echoQueuedDigit
    } else if (this.state.strikeEnabled) {
      // 3-strike entry mode
      config.targetDigit = this.state.strikeCurrentDigit
    } else if (this.state.digitMatchEnabled) {
      // Digit match mode
      config.targetDigit = this.state.selectedDigit
    } else {
      // Original prime mode
      config.targetDigit = this.state.primeNumbers[this.state.currentPrimeIndex]
    }

    document.getElementById("targetDigitInput").value = config.targetDigit

    if (this.state.echoEnabled && lastDigits && lastDigits.length > 0) {
      this.processEchoPattern(lastDigits[lastDigits.length - 1])
    }

    return config
  }

  processEchoPattern(lastDigit) {
    this.state.echoHistory.push(lastDigit)

    // Keep only the last N ticks as specified
    if (this.state.echoHistory.length > this.state.echoObserveTicks) {
      this.state.echoHistory.shift()
    }

    // Check if any digit appears twice in the history
    if (this.state.echoHistory.length >= 2 && !this.state.echoQueuedDigit) {
      const digitCounts = {}
      this.state.echoHistory.forEach((digit) => {
        digitCounts[digit] = (digitCounts[digit] || 0) + 1
      })

      // Find digits that appeared twice
      for (const [digit, count] of Object.entries(digitCounts)) {
        if (count >= 2) {
          this.state.echoQueuedDigit = Number.parseInt(digit)
          console.log(`[v0] Echo pattern detected: digit ${digit} appeared ${count} times`)
          break
        }
      }
    }
  }

  onTradeResult(won) {
    if (this.state.echoEnabled && this.state.echoQueuedDigit !== null) {
      if (!won) {
        this.state.echoLossCount++
        if (this.state.echoLossCount >= this.state.echoMaxLosses) {
          console.log(`[v0] Echo pattern stopped after ${this.state.echoMaxLosses} losses`)
          this.state.echoQueuedDigit = null
          this.state.echoLossCount = 0
          this.state.echoHistory = []
        }
      } else {
        // Reset after win
        this.state.echoQueuedDigit = null
        this.state.echoLossCount = 0
        this.state.echoHistory = []
      }
      this.updateUI()
      return
    }

    if (this.state.strikeEnabled) {
      this.state.strikeAttempts++

      if (won) {
        // Reset on win
        this.state.strikeAttempts = 0
      } else if (this.state.strikeAttempts >= this.state.strikeMaxAttempts) {
        // Switch to next digit after max attempts
        this.state.strikeCurrentDigit = (this.state.strikeCurrentDigit + 1) % 10
        this.state.strikeAttempts = 0
        console.log(`[v0] 3-Strike switched to digit ${this.state.strikeCurrentDigit}`)
      }
      this.updateUI()
      return
    }

    if (this.state.digitMatchEnabled) {
      this.updateUI()
      return
    }

    // Original prime mode logic
    if (won) {
      this.state.primeWinCount++
      const switchWins = Number.parseInt(document.getElementById("matchesSwitchWins")?.value || 2)

      if (this.state.primeWinCount >= switchWins) {
        this.state.currentPrimeIndex = (this.state.currentPrimeIndex + 1) % this.state.primeNumbers.length
        this.state.primeWinCount = 0
      }
    }
    this.updateUI()
  }

  onActivate() {
    document.getElementById("tradeTypeSelect").value = "DIGITMATCH"
  }

  reset() {
    this.state.primeWinCount = 0
    this.state.currentPrimeIndex = 0
    this.state.echoHistory = []
    this.state.echoQueuedDigit = null
    this.state.echoLossCount = 0
    this.state.strikeAttempts = 0
    this.state.strikeCurrentDigit = 0
    this.updateUI()
  }

  updateUI() {
    const primeEl = document.getElementById("matchesCurrentPrime")
    const winsEl = document.getElementById("matchesPrimeWins")
    const digitMatchEl = document.getElementById("matchesDigitMatchCurrent")
    const echoStatusEl = document.getElementById("matchesEchoStatus")
    const echoQueuedEl = document.getElementById("matchesEchoQueued")
    const strikeDigitEl = document.getElementById("matchesStrikeDigit")
    const strikeAttemptsEl = document.getElementById("matchesStrikeAttempts")

    if (primeEl) primeEl.textContent = this.state.primeNumbers[this.state.currentPrimeIndex]

    const switchWins = Number.parseInt(document.getElementById("matchesSwitchWins")?.value || 2)
    if (winsEl) winsEl.textContent = switchWins - this.state.primeWinCount

    if (digitMatchEl) {
      digitMatchEl.textContent = this.state.selectedDigit
    }

    if (echoStatusEl) {
      if (this.state.echoQueuedDigit !== null) {
        echoStatusEl.textContent = "QUEUED"
        echoStatusEl.className = "text-green-400 font-bold"
      } else {
        echoStatusEl.textContent = "OBSERVING"
        echoStatusEl.className = "text-yellow-400 font-bold"
      }
    }
    if (echoQueuedEl) {
      echoQueuedEl.textContent = this.state.echoQueuedDigit !== null ? this.state.echoQueuedDigit : "-"
    }

    if (strikeDigitEl) strikeDigitEl.textContent = this.state.strikeCurrentDigit
    if (strikeAttemptsEl) {
      const maxAttempts = Number.parseInt(document.getElementById("matchesStrikeMaxAttempts")?.value || 3)
      strikeAttemptsEl.textContent = `${this.state.strikeAttempts}/${maxAttempts}`
    }
  }

  renderUI() {
    return `
            <div class="bg-gradient-to-r from-purple-900/40 to-pink-900/40 p-4 rounded-lg space-y-4">
                <p class="font-semibold mb-2">🎯 Matches Strategy Modes</p>
                <p class="text-xs text-gray-300 mb-4">Multiple match trading approaches for different market conditions</p>
                
                <!-- Original Prime Mode -->
                <div class="bg-gray-800 p-3 rounded-lg">
                    <p class="text-sm font-semibold mb-3">📊 Prime Number Mode (Default)</p>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm mb-2">Switch After N Wins:</label>
                            <input type="number" id="matchesSwitchWins" min="1" max="10" value="2" 
                                class="w-full bg-gray-700 rounded-lg px-3 py-2">
                        </div>
                        <div class="bg-gray-900 p-3 rounded">
                            <p class="text-xs">Current Prime: <span id="matchesCurrentPrime" class="text-blue-400 font-bold">2</span></p>
                            <p class="text-xs">Wins until switch: <span id="matchesPrimeWins" class="text-green-400 font-bold">2</span></p>
                        </div>
                    </div>
                </div>
                
                <!-- Digit Match Mode -->
                <div class="bg-gray-800 p-3 rounded-lg">
                    <label class="flex items-center gap-3 mb-3 cursor-pointer">
                        <input type="checkbox" id="matchesDigitMatchCheck" class="w-5 h-5 rounded">
                        <span class="text-sm font-semibold">🎲 Digit Match Mode</span>
                    </label>
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div>
                            <label class="block text-xs mb-1">Target Digit (0-9):</label>
                            <input type="number" id="matchesDigitMatchValue" min="0" max="9" value="5" 
                                class="w-full bg-gray-700 rounded px-2 py-1 text-sm">
                        </div>
                        <div>
                            <label class="block text-xs mb-1">Range Min:</label>
                            <input type="number" id="matchesDigitRangeMin" min="0" max="9" value="0" 
                                class="w-full bg-gray-700 rounded px-2 py-1 text-sm">
                        </div>
                        <div>
                            <label class="block text-xs mb-1">Range Max:</label>
                            <input type="number" id="matchesDigitRangeMax" min="0" max="9" value="9" 
                                class="w-full bg-gray-700 rounded px-2 py-1 text-sm">
                        </div>
                    </div>
                    <div class="mt-2 p-2 bg-gray-900 rounded text-center">
                        <p class="text-xs">Current: <span id="matchesDigitMatchCurrent" class="text-blue-400 font-bold">5</span></p>
                    </div>
                </div>
                
                <!-- Digit Echo Pattern Mode -->
                <div class="bg-gradient-to-r from-green-900/40 to-teal-900/40 p-3 rounded-lg">
                    <label class="flex items-center gap-3 mb-3 cursor-pointer">
                        <input type="checkbox" id="matchesEchoCheck" class="w-5 h-5 rounded">
                        <span class="text-sm font-semibold">🔄 Digit Echo Pattern</span>
                    </label>
                    <p class="text-xs text-gray-400 mb-3">Trades digits that repeat in recent history</p>
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div>
                            <label class="block text-xs mb-1">Observe Last N Ticks:</label>
                            <input type="number" id="matchesEchoObserveTicks" min="2" max="20" value="5" 
                                class="w-full bg-gray-700 rounded px-2 py-1 text-sm">
                        </div>
                        <div>
                            <label class="block text-xs mb-1">Max Losses Before Stop:</label>
                            <input type="number" id="matchesEchoMaxLosses" min="1" max="10" value="3" 
                                class="w-full bg-gray-700 rounded px-2 py-1 text-sm">
                        </div>
                        <div class="bg-gray-900 p-2 rounded">
                            <p class="text-xs">Status: <span id="matchesEchoStatus" class="text-yellow-400 font-bold">OBSERVING</span></p>
                            <p class="text-xs">Queued: <span id="matchesEchoQueued" class="text-green-400 font-bold">-</span></p>
                        </div>
                    </div>
                </div>
                
                <!-- 3-Strike Entry Mode -->
                <div class="bg-gradient-to-r from-red-900/40 to-orange-900/40 p-3 rounded-lg">
                    <label class="flex items-center gap-3 mb-3 cursor-pointer">
                        <input type="checkbox" id="matchesStrikeCheck" class="w-5 h-5 rounded">
                        <span class="text-sm font-semibold">⚡ 3-Strike Entry</span>
                    </label>
                    <p class="text-xs text-gray-400 mb-3">Try each digit N times before moving to next</p>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                            <label class="block text-xs mb-1">Max Attempts Per Digit:</label>
                            <input type="number" id="matchesStrikeMaxAttempts" min="1" max="10" value="3" 
                                class="w-full bg-gray-700 rounded px-2 py-1 text-sm">
                        </div>
                        <div class="bg-gray-900 p-2 rounded">
                            <p class="text-xs">Current Digit: <span id="matchesStrikeDigit" class="text-blue-400 font-bold">0</span></p>
                            <p class="text-xs">Attempts: <span id="matchesStrikeAttempts" class="text-orange-400 font-bold">0/3</span></p>
                        </div>
                    </div>
                </div>
            </div>
        `
  }

  bindEvents() {
    const switchWins = document.getElementById("matchesSwitchWins")
    if (switchWins) switchWins.addEventListener("input", () => this.updateUI())

    const digitMatchCheck = document.getElementById("matchesDigitMatchCheck")
    const digitMatchValue = document.getElementById("matchesDigitMatchValue")
    const digitRangeMin = document.getElementById("matchesDigitRangeMin")
    const digitRangeMax = document.getElementById("matchesDigitRangeMax")

    if (digitMatchCheck) {
      digitMatchCheck.addEventListener("change", (e) => {
        this.state.digitMatchEnabled = e.target.checked
        if (e.target.checked) {
          this.state.echoEnabled = false
          this.state.strikeEnabled = false
          document.getElementById("matchesEchoCheck").checked = false
          document.getElementById("matchesStrikeCheck").checked = false
        }
        this.updateUI()
      })
    }

    if (digitMatchValue) {
      digitMatchValue.addEventListener("input", (e) => {
        this.state.selectedDigit = Number.parseInt(e.target.value)
        this.updateUI()
      })
    }

    if (digitRangeMin) {
      digitRangeMin.addEventListener("input", (e) => {
        this.state.digitMatchRange.min = Number.parseInt(e.target.value)
      })
    }

    if (digitRangeMax) {
      digitRangeMax.addEventListener("input", (e) => {
        this.state.digitMatchRange.max = Number.parseInt(e.target.value)
      })
    }

    const echoCheck = document.getElementById("matchesEchoCheck")
    const echoObserveTicks = document.getElementById("matchesEchoObserveTicks")
    const echoMaxLosses = document.getElementById("matchesEchoMaxLosses")

    if (echoCheck) {
      echoCheck.addEventListener("change", (e) => {
        this.state.echoEnabled = e.target.checked
        if (e.target.checked) {
          this.state.digitMatchEnabled = false
          this.state.strikeEnabled = false
          document.getElementById("matchesDigitMatchCheck").checked = false
          document.getElementById("matchesStrikeCheck").checked = false
          this.state.echoHistory = []
        }
        this.updateUI()
      })
    }

    if (echoObserveTicks) {
      echoObserveTicks.addEventListener("input", (e) => {
        this.state.echoObserveTicks = Number.parseInt(e.target.value)
      })
    }

    if (echoMaxLosses) {
      echoMaxLosses.addEventListener("input", (e) => {
        this.state.echoMaxLosses = Number.parseInt(e.target.value)
      })
    }

    const strikeCheck = document.getElementById("matchesStrikeCheck")
    const strikeMaxAttempts = document.getElementById("matchesStrikeMaxAttempts")

    if (strikeCheck) {
      strikeCheck.addEventListener("change", (e) => {
        this.state.strikeEnabled = e.target.checked
        if (e.target.checked) {
          this.state.digitMatchEnabled = false
          this.state.echoEnabled = false
          document.getElementById("matchesDigitMatchCheck").checked = false
          document.getElementById("matchesEchoCheck").checked = false
          this.state.strikeCurrentDigit = 0
          this.state.strikeAttempts = 0
        }
        this.updateUI()
      })
    }

    if (strikeMaxAttempts) {
      strikeMaxAttempts.addEventListener("input", () => this.updateUI())
    }
  }
}
