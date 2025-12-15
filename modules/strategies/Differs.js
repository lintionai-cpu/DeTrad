// Differs Focus Strategy
export class DiffersStrategy {
  constructor() {
    this.state = {
      targetDigit: null,
      // Volatility Sweep mode
      volatilitySweepEnabled: false,
      lastDigitsHistory: [],

      // Digit Shield mode
      digitShieldEnabled: false,
      shieldTargetDigit: 5,
      shieldTradeCount: 0,
      shieldMaxTrades: 5,
      shieldLossCount: 0,
      shieldPauseTicks: 3,
      shieldCurrentPauseTicks: 0,
      shieldPaused: false,
    }
  }

  modifyTradeConfig(config, lastDigits) {
    config.tradeType = "DIGITDIFF"

    if (this.state.digitShieldEnabled) {
      if (this.state.shieldPaused) {
        this.state.shieldCurrentPauseTicks++
        if (this.state.shieldCurrentPauseTicks >= this.state.shieldPauseTicks) {
          this.state.shieldPaused = false
          this.state.shieldCurrentPauseTicks = 0
          this.state.shieldLossCount = 0
          console.log("[v0] Digit Shield resumed after pause")
        } else {
          console.log(`[v0] Digit Shield paused: ${this.state.shieldCurrentPauseTicks}/${this.state.shieldPauseTicks}`)
          return null // Skip this trade
        }
      }

      config.targetDigit = this.state.shieldTargetDigit
      document.getElementById("targetDigitInput").value = this.state.shieldTargetDigit
      this.updateUI()
      return config
    }

    if (this.state.volatilitySweepEnabled && lastDigits && lastDigits.length >= 10) {
      const recent = lastDigits.slice(-10)

      // Track digit repetition patterns
      const digitCounts = {}
      const digitLastSeen = {}

      recent.forEach((digit, index) => {
        digitCounts[digit] = (digitCounts[digit] || 0) + 1
        digitLastSeen[digit] = index
      })

      // Check if digits are jumping around (volatility detection)
      const uniqueDigitsCount = Object.keys(digitCounts).length
      const isVolatile = uniqueDigitsCount >= 7 // 7+ different digits in last 10 = high volatility

      if (isVolatile) {
        // Find most recently repeated digit
        let mostRecentRepeated = null
        let mostRecentIndex = -1

        for (const [digit, count] of Object.entries(digitCounts)) {
          if (count >= 2 && digitLastSeen[digit] > mostRecentIndex) {
            mostRecentRepeated = Number.parseInt(digit)
            mostRecentIndex = digitLastSeen[digit]
          }
        }

        if (mostRecentRepeated !== null) {
          this.state.targetDigit = mostRecentRepeated
          console.log(`[v0] Volatility Sweep detected: targeting digit ${mostRecentRepeated}`)
        } else {
          // Fallback to most repeated if no recently repeated digit found
          const mostRepeated = Object.keys(digitCounts).reduce((a, b) => (digitCounts[a] > digitCounts[b] ? a : b))
          this.state.targetDigit = Number.parseInt(mostRepeated)
        }
      } else {
        // Low volatility - use most repeated digit
        const mostRepeated = Object.keys(digitCounts).reduce((a, b) => (digitCounts[a] > digitCounts[b] ? a : b))
        this.state.targetDigit = Number.parseInt(mostRepeated)
      }

      config.targetDigit = this.state.targetDigit
      document.getElementById("targetDigitInput").value = this.state.targetDigit
      this.updateUI()
      return config
    }

    // Original logic - find most repeated digit in last 10 ticks
    if (lastDigits && lastDigits.length >= 10) {
      const recent = lastDigits.slice(-10)
      const counts = {}
      recent.forEach((d) => (counts[d] = (counts[d] || 0) + 1))

      const mostRepeated = Object.keys(counts).reduce((a, b) => (counts[a] > counts[b] ? a : b))

      this.state.targetDigit = Number.parseInt(mostRepeated)
      config.targetDigit = this.state.targetDigit
      document.getElementById("targetDigitInput").value = this.state.targetDigit
    }

    this.updateUI()
    return config
  }

  onTradeResult(won) {
    if (this.state.digitShieldEnabled) {
      this.state.shieldTradeCount++

      if (!won) {
        this.state.shieldLossCount++
        if (this.state.shieldLossCount >= 1) {
          // Pause after 1 loss
          this.state.shieldPaused = true
          this.state.shieldCurrentPauseTicks = 0
          console.log(`[v0] Digit Shield paused after loss`)
        }
      } else {
        this.state.shieldLossCount = 0 // Reset on win
      }
    }

    this.updateUI()
  }

  onActivate() {
    document.getElementById("tradeTypeSelect").value = "DIGITDIFF"
  }

  reset() {
    this.state.targetDigit = null
    this.state.shieldTradeCount = 0
    this.state.shieldLossCount = 0
    this.state.shieldPaused = false
    this.state.shieldCurrentPauseTicks = 0
    this.updateUI()
  }

  updateUI() {
    const targetEl = document.getElementById("differsTarget")
    if (targetEl) {
      targetEl.textContent = this.state.targetDigit !== null ? this.state.targetDigit : "-"
    }

    const shieldStatusEl = document.getElementById("differsShieldStatus")
    const shieldTradesEl = document.getElementById("differsShieldTrades")
    const shieldPauseEl = document.getElementById("differsShieldPause")

    if (shieldStatusEl) {
      if (this.state.shieldPaused) {
        shieldStatusEl.textContent = "PAUSED"
        shieldStatusEl.className = "text-red-400 font-bold"
      } else {
        shieldStatusEl.textContent = "ACTIVE"
        shieldStatusEl.className = "text-green-400 font-bold"
      }
    }

    if (shieldTradesEl) {
      const maxTrades = Number.parseInt(document.getElementById("differsShieldMaxTrades")?.value || 5)
      shieldTradesEl.textContent = `${this.state.shieldTradeCount}/${maxTrades}`
    }

    if (shieldPauseEl) {
      if (this.state.shieldPaused) {
        shieldPauseEl.textContent = `${this.state.shieldCurrentPauseTicks}/${this.state.shieldPauseTicks}`
      } else {
        shieldPauseEl.textContent = "-"
      }
    }
  }

  renderUI() {
    return `
            <div class="bg-gradient-to-r from-red-900/40 to-orange-900/40 p-4 rounded-lg space-y-4">
                <p class="font-semibold mb-2">🛡️ Differs Focus Strategy</p>
                <p class="text-xs text-gray-300 mb-4">Multiple DIFFERS trading modes for different market conditions</p>
                
                <!-- Volatility Sweep Mode -->
                <div class="bg-gray-800 p-3 rounded-lg">
                    <label class="flex items-center gap-3 mb-3 cursor-pointer">
                        <input type="checkbox" id="differsVolatilityCheck" class="w-5 h-5 rounded">
                        <span class="text-sm font-semibold">⚡ Volatility Sweep</span>
                    </label>
                    <p class="text-xs text-gray-400 mb-3">Best for fast/spiking markets - targets most recently repeated digit during volatility</p>
                    <div class="bg-gray-900 p-3 rounded">
                        <p class="text-xs font-semibold mb-2">Current Status:</p>
                        <div class="text-xs">
                            <div>Target Digit: <span id="differsTarget" class="text-red-400 font-bold">-</span></div>
                            <div class="mt-1 text-gray-400">Monitors last 10 ticks for volatility patterns</div>
                        </div>
                    </div>
                </div>
                
                <!-- Digit Shield Mode -->
                <div class="bg-gradient-to-r from-blue-900/40 to-cyan-900/40 p-3 rounded-lg">
                    <label class="flex items-center gap-3 mb-3 cursor-pointer">
                        <input type="checkbox" id="differsShieldCheck" class="w-5 h-5 rounded">
                        <span class="text-sm font-semibold">🛡️ Digit Shield (Low Risk)</span>
                    </label>
                    <p class="text-xs text-gray-400 mb-3">Steady payout - pauses after loss to avoid variance</p>
                    
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div>
                            <label class="block text-xs mb-1">Target Digit:</label>
                            <input type="number" id="differsShieldDigit" min="0" max="9" value="5" 
                                class="w-full bg-gray-700 rounded px-2 py-1 text-sm">
                        </div>
                        <div>
                            <label class="block text-xs mb-1">Max Consecutive Trades:</label>
                            <input type="number" id="differsShieldMaxTrades" min="1" max="20" value="5" 
                                class="w-full bg-gray-700 rounded px-2 py-1 text-sm">
                        </div>
                        <div>
                            <label class="block text-xs mb-1">Pause Ticks After Loss:</label>
                            <input type="number" id="differsShieldPauseTicks" min="1" max="20" value="3" 
                                class="w-full bg-gray-700 rounded px-2 py-1 text-sm">
                        </div>
                    </div>
                    
                    <div class="mt-3 grid grid-cols-3 gap-2">
                        <div class="bg-gray-900 p-2 rounded text-center">
                            <p class="text-xs">Status</p>
                            <p id="differsShieldStatus" class="text-green-400 font-bold">ACTIVE</p>
                        </div>
                        <div class="bg-gray-900 p-2 rounded text-center">
                            <p class="text-xs">Trades</p>
                            <p id="differsShieldTrades" class="text-blue-400 font-bold">0/5</p>
                        </div>
                        <div class="bg-gray-900 p-2 rounded text-center">
                            <p class="text-xs">Pause Ticks</p>
                            <p id="differsShieldPause" class="text-yellow-400 font-bold">-</p>
                        </div>
                    </div>
                </div>
            </div>
        `
  }

  bindEvents() {
    const volatilityCheck = document.getElementById("differsVolatilityCheck")
    const shieldCheck = document.getElementById("differsShieldCheck")
    const shieldDigit = document.getElementById("differsShieldDigit")
    const shieldMaxTrades = document.getElementById("differsShieldMaxTrades")
    const shieldPauseTicks = document.getElementById("differsShieldPauseTicks")

    if (volatilityCheck) {
      volatilityCheck.addEventListener("change", (e) => {
        this.state.volatilitySweepEnabled = e.target.checked
        if (e.target.checked) {
          this.state.digitShieldEnabled = false
          if (shieldCheck) shieldCheck.checked = false
        }
        this.updateUI()
      })
    }

    if (shieldCheck) {
      shieldCheck.addEventListener("change", (e) => {
        this.state.digitShieldEnabled = e.target.checked
        if (e.target.checked) {
          this.state.volatilitySweepEnabled = false
          if (volatilityCheck) volatilityCheck.checked = false
          this.state.shieldTradeCount = 0
          this.state.shieldLossCount = 0
          this.state.shieldPaused = false
        }
        this.updateUI()
      })
    }

    if (shieldDigit) {
      shieldDigit.addEventListener("input", (e) => {
        this.state.shieldTargetDigit = Number.parseInt(e.target.value)
        this.updateUI()
      })
    }

    if (shieldMaxTrades) {
      shieldMaxTrades.addEventListener("input", () => this.updateUI())
    }

    if (shieldPauseTicks) {
      shieldPauseTicks.addEventListener("input", (e) => {
        this.state.shieldPauseTicks = Number.parseInt(e.target.value)
        this.updateUI()
      })
    }
  }
}
