// Smart Switcher Strategy
export class SmartSwitcherStrategy {
  constructor() {
    this.state = {
      digitWinCount: 0,
      digitLossCount: 0, // Added loss tracking for digit switching
      marketWinCount: 0,
      marketLossCount: 0, // Added loss tracking for market switching
      overUnderWinCount: 0,
      overUnderLossCount: 0, // Added for over/under mode
      tickCount: 0, // Added tick counting for time-based switching
      currentDigit: 5,
      currentMarketIndex: 0,
      availableMarkets: ["R_10", "R_25", "R_50", "R_75", "R_100"],
      overUnderMode: "under", // Track whether we're in 'under' or 'over' mode
      overUnderValue: 5, // The digit value for over/under
    }
  }

  modifyTradeConfig(config, lastDigits) {
    const enableOverUnder = document.getElementById("switcherOverUnderCheck")?.checked
    if (enableOverUnder) {
      const underValue = Number.parseInt(document.getElementById("switcherUnderValue")?.value || 5)
      const overValue = Number.parseInt(document.getElementById("switcherOverValue")?.value || 4)

      if (this.state.overUnderMode === "under") {
        config.tradeType = "DIGITUNDER"
        config.targetDigit = underValue
      } else if (this.state.overUnderMode === "over") {
        config.tradeType = "DIGITOVER"
        config.targetDigit = overValue
      }

      document.getElementById("tradeTypeSelect").value = config.tradeType
      document.getElementById("targetDigitInput").value = config.targetDigit
    }

    // Apply digit switching if enabled
    const enableDigitSwitch = document.getElementById("switcherDigitCheck")?.checked
    if (enableDigitSwitch && !enableOverUnder) {
      config.targetDigit = this.state.currentDigit
      document.getElementById("targetDigitInput").value = this.state.currentDigit
    }

    return config
  }

  onTradeResult(won) {
    const enableDigitSwitch = document.getElementById("switcherDigitCheck")?.checked
    const enableMarketSwitch = document.getElementById("switcherMarketCheck")?.checked
    const enableOverUnder = document.getElementById("switcherOverUnderCheck")?.checked

    if (enableOverUnder) {
      const winInterval = Number.parseInt(document.getElementById("switcherOverUnderWins")?.value || 2)
      const lossInterval = Number.parseInt(document.getElementById("switcherOverUnderLosses")?.value || 3)
      const tickInterval = Number.parseInt(document.getElementById("switcherOverUnderTicks")?.value || 5)

      this.state.tickCount++

      if (won) {
        this.state.overUnderWinCount++
        this.state.overUnderLossCount = 0

        if (this.state.overUnderWinCount >= winInterval) {
          this.toggleOverUnderMode()
          this.state.overUnderWinCount = 0
          this.state.tickCount = 0
        }
      } else {
        this.state.overUnderLossCount++
        this.state.overUnderWinCount = 0

        if (this.state.overUnderLossCount >= lossInterval) {
          this.toggleOverUnderMode()
          this.state.overUnderLossCount = 0
          this.state.tickCount = 0
        }
      }

      // Switch based on tick count
      if (this.state.tickCount >= tickInterval) {
        this.toggleOverUnderMode()
        this.state.tickCount = 0
        this.state.overUnderWinCount = 0
        this.state.overUnderLossCount = 0
      }
    }

    if (enableDigitSwitch) {
      const digitWinInterval = Number.parseInt(document.getElementById("switcherDigitInterval")?.value || 1)
      const digitLossInterval = Number.parseInt(document.getElementById("switcherDigitLossInterval")?.value || 3)

      if (won) {
        this.state.digitWinCount++
        this.state.digitLossCount = 0

        if (this.state.digitWinCount >= digitWinInterval) {
          this.state.currentDigit = (this.state.currentDigit + 1) % 10
          this.state.digitWinCount = 0
        }
      } else {
        this.state.digitLossCount++
        this.state.digitWinCount = 0

        if (this.state.digitLossCount >= digitLossInterval) {
          this.state.currentDigit = (this.state.currentDigit + 1) % 10
          this.state.digitLossCount = 0
        }
      }
    }

    if (enableMarketSwitch) {
      const marketWinInterval = Number.parseInt(document.getElementById("switcherMarketInterval")?.value || 3)
      const marketLossInterval = Number.parseInt(document.getElementById("switcherMarketLossInterval")?.value || 2)

      if (won) {
        this.state.marketWinCount++
        this.state.marketLossCount = 0

        if (this.state.marketWinCount >= marketWinInterval) {
          this.state.currentMarketIndex = (this.state.currentMarketIndex + 1) % this.state.availableMarkets.length
          this.state.marketWinCount = 0
          document.getElementById("marketSelect").value = this.state.availableMarkets[this.state.currentMarketIndex]
        }
      } else {
        this.state.marketLossCount++
        this.state.marketWinCount = 0

        if (this.state.marketLossCount >= marketLossInterval) {
          this.state.currentMarketIndex = (this.state.currentMarketIndex + 1) % this.state.availableMarkets.length
          this.state.marketLossCount = 0
          document.getElementById("marketSelect").value = this.state.availableMarkets[this.state.currentMarketIndex]
        }
      }
    }

    this.updateUI()
  }

  toggleOverUnderMode() {
    this.state.overUnderMode = this.state.overUnderMode === "under" ? "over" : "under"
  }

  onActivate() {
    this.state.currentDigit = Number.parseInt(document.getElementById("targetDigitInput").value)
  }

  reset() {
    this.state.digitWinCount = 0
    this.state.digitLossCount = 0
    this.state.marketWinCount = 0
    this.state.marketLossCount = 0
    this.state.overUnderWinCount = 0
    this.state.overUnderLossCount = 0
    this.state.tickCount = 0
    this.updateUI()
  }

  updateUI() {
    const digitEl = document.getElementById("switcherCurrentDigit")
    const marketEl = document.getElementById("switcherCurrentMarket")
    const digitWinsEl = document.getElementById("switcherDigitWins")
    const marketWinsEl = document.getElementById("switcherMarketWins")
    const overUnderModeEl = document.getElementById("switcherOverUnderMode")
    const overUnderTicksEl = document.getElementById("switcherOverUnderTicks")

    if (digitEl) digitEl.textContent = this.state.currentDigit
    if (marketEl) marketEl.textContent = this.state.availableMarkets[this.state.currentMarketIndex]

    const digitInterval = Number.parseInt(document.getElementById("switcherDigitInterval")?.value || 1)
    const marketInterval = Number.parseInt(document.getElementById("switcherMarketInterval")?.value || 3)

    if (digitWinsEl) digitWinsEl.textContent = digitInterval - this.state.digitWinCount
    if (marketWinsEl) marketWinsEl.textContent = marketInterval - this.state.marketWinCount

    if (overUnderModeEl) {
      overUnderModeEl.textContent = this.state.overUnderMode.toUpperCase()
      overUnderModeEl.className =
        this.state.overUnderMode === "under" ? "text-blue-400 font-bold" : "text-orange-400 font-bold"
    }
    if (overUnderTicksEl) overUnderTicksEl.textContent = this.state.tickCount
  }

  renderUI() {
    return `
            <div class="bg-gray-700/30 p-4 rounded-lg space-y-4">
                <p class="text-sm text-gray-300 mb-4">Automatically rotates strategies based on wins, losses, or tick count.</p>
                
                <!-- New Over/Under Mode Section -->
                <div class="bg-gradient-to-r from-blue-900/40 to-orange-900/40 p-4 rounded-lg">
                    <label class="flex items-center gap-3 mb-3 cursor-pointer">
                        <input type="checkbox" id="switcherOverUnderCheck" class="w-5 h-5 rounded">
                        <span class="font-semibold">🎲 Enable Over/Under Mode</span>
                    </label>
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div>
                            <label class="block text-xs mb-1">Under Digit Value:</label>
                            <input type="number" id="switcherUnderValue" min="1" max="9" value="5" 
                                class="w-full bg-gray-700 rounded px-2 py-1 text-sm">
                        </div>
                        <div>
                            <label class="block text-xs mb-1">Over Digit Value:</label>
                            <input type="number" id="switcherOverValue" min="0" max="8" value="4" 
                                class="w-full bg-gray-700 rounded px-2 py-1 text-sm">
                        </div>
                        <div class="bg-gray-800 p-2 rounded text-center">
                            <p class="text-xs">Mode: <span id="switcherOverUnderMode" class="text-blue-400 font-bold">UNDER</span></p>
                            <p class="text-xs">Ticks: <span id="switcherOverUnderTicks" class="text-green-400 font-bold">0</span></p>
                        </div>
                    </div>
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
                        <div>
                            <label class="block text-xs mb-1">Switch After N Wins:</label>
                            <input type="number" id="switcherOverUnderWins" min="1" max="20" value="2" 
                                class="w-full bg-gray-700 rounded px-2 py-1 text-sm">
                        </div>
                        <div>
                            <label class="block text-xs mb-1">Switch After N Losses:</label>
                            <input type="number" id="switcherOverUnderLosses" min="1" max="20" value="3" 
                                class="w-full bg-gray-700 rounded px-2 py-1 text-sm">
                        </div>
                        <div>
                            <label class="block text-xs mb-1">Switch After N Ticks:</label>
                            <input type="number" id="switcherOverUnderTicks" min="1" max="50" value="5" 
                                class="w-full bg-gray-700 rounded px-2 py-1 text-sm">
                        </div>
                    </div>
                </div>
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div class="bg-gray-700 p-4 rounded-lg">
                        <label class="flex items-center gap-3 mb-3 cursor-pointer">
                            <input type="checkbox" id="switcherDigitCheck" class="w-5 h-5 rounded">
                            <span class="font-semibold">Enable Digit Switching</span>
                        </label>
                        <label class="block text-sm mb-2">Switch Every N Wins:</label>
                        <input type="number" id="switcherDigitInterval" min="1" max="10" value="1" 
                            class="w-full bg-gray-600 rounded-lg px-3 py-2 mb-2">
                        <!-- Added loss interval for digit switching -->
                        <label class="block text-sm mb-2">Switch After N Losses:</label>
                        <input type="number" id="switcherDigitLossInterval" min="1" max="10" value="3" 
                            class="w-full bg-gray-600 rounded-lg px-3 py-2">
                        <div class="mt-3 p-2 bg-gray-800 rounded">
                            <p class="text-xs">Current: <span id="switcherCurrentDigit" class="text-blue-400 font-bold">5</span></p>
                            <p class="text-xs">Wins until switch: <span id="switcherDigitWins" class="text-green-400 font-bold">-</span></p>
                        </div>
                    </div>
                    
                    <div class="bg-gray-700 p-4 rounded-lg">
                        <label class="flex items-center gap-3 mb-3 cursor-pointer">
                            <input type="checkbox" id="switcherMarketCheck" class="w-5 h-5 rounded">
                            <span class="font-semibold">Enable Market Switching</span>
                        </label>
                        <label class="block text-sm mb-2">Switch Every N Wins:</label>
                        <input type="number" id="switcherMarketInterval" min="1" max="20" value="3" 
                            class="w-full bg-gray-600 rounded-lg px-3 py-2 mb-2">
                        <!-- Added loss interval for market switching -->
                        <label class="block text-sm mb-2">Switch After N Losses:</label>
                        <input type="number" id="switcherMarketLossInterval" min="1" max="20" value="2" 
                            class="w-full bg-gray-600 rounded-lg px-3 py-2">
                        <div class="mt-3 p-2 bg-gray-800 rounded">
                            <p class="text-xs">Current: <span id="switcherCurrentMarket" class="text-purple-400 font-bold">R_10</span></p>
                            <p class="text-xs">Wins until switch: <span id="switcherMarketWins" class="text-green-400 font-bold">-</span></p>
                        </div>
                    </div>
                </div>
            </div>
        `
  }

  bindEvents() {
    const digitCheck = document.getElementById("switcherDigitCheck")
    const marketCheck = document.getElementById("switcherMarketCheck")
    const overUnderCheck = document.getElementById("switcherOverUnderCheck")
    const digitInterval = document.getElementById("switcherDigitInterval")
    const marketInterval = document.getElementById("switcherMarketInterval")
    const digitLossInterval = document.getElementById("switcherDigitLossInterval")
    const marketLossInterval = document.getElementById("switcherMarketLossInterval")

    if (digitCheck) digitCheck.addEventListener("change", () => this.updateUI())
    if (marketCheck) marketCheck.addEventListener("change", () => this.updateUI())
    if (overUnderCheck) overUnderCheck.addEventListener("change", () => this.updateUI())
    if (digitInterval) digitInterval.addEventListener("input", () => this.updateUI())
    if (marketInterval) marketInterval.addEventListener("input", () => this.updateUI())
    if (digitLossInterval) digitLossInterval.addEventListener("input", () => this.updateUI())
    if (marketLossInterval) marketLossInterval.addEventListener("input", () => this.updateUI())
  }
}
