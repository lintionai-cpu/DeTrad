// Rebound Recovery Strategy
export class ReboundStrategy {
  constructor() {
    this.state = {
      isRecoveryMode: false,
    }
  }

  modifyTradeConfig(config, lastDigits) {
    if (this.state.isRecoveryMode) {
      config.tradeType = "DIGITOVER"
      config.stake = Number.parseFloat(document.getElementById("initialStakeInput").value) * 2
    } else {
      config.tradeType = "DIGITDIFF"
    }
    return config
  }

  onTradeResult(won) {
    if (this.state.isRecoveryMode) {
      if (won) {
        this.state.isRecoveryMode = false
      }
    } else {
      if (!won) {
        this.state.isRecoveryMode = true
      }
    }
    this.updateUI()
  }

  onActivate() {
    document.getElementById("tradeTypeSelect").value = "DIGITDIFF"
  }

  reset() {
    this.state.isRecoveryMode = false
    this.updateUI()
  }

  updateUI() {
    const modeEl = document.getElementById("reboundMode")
    const statusEl = document.getElementById("reboundStatus")

    if (modeEl) {
      modeEl.textContent = this.state.isRecoveryMode ? "OVER (Recovery)" : "DIFFERS"
      modeEl.className = this.state.isRecoveryMode ? "text-red-400 font-bold" : "text-green-400 font-bold"
    }

    if (statusEl) {
      statusEl.textContent = this.state.isRecoveryMode ? "YES" : "NO"
      statusEl.className = this.state.isRecoveryMode ? "text-red-400 font-bold" : "text-green-400 font-bold"
    }
  }

  renderUI() {
    return `
            <div class="bg-gradient-to-r from-orange-900/40 to-red-900/40 p-4 rounded-lg">
                <p class="font-semibold mb-2">📌 Strategy Logic:</p>
                <ul class="text-sm space-y-1 mb-4">
                    <li>✅ <strong>Default:</strong> Trade DIFFERS on target digit</li>
                    <li>❌ <strong>On Loss:</strong> Switch to OVER (same digit) with 2x stake</li>
                    <li>✅ <strong>Recovery Win:</strong> Back to DIFFERS with initial stake</li>
                </ul>
                
                <div class="bg-gray-800 p-3 rounded">
                    <p class="text-xs font-semibold mb-2">Status:</p>
                    <div class="grid grid-cols-2 gap-2 text-xs">
                        <div>Mode: <span id="reboundMode" class="text-green-400 font-bold">DIFFERS</span></div>
                        <div>Recovery Active: <span id="reboundStatus" class="text-yellow-400 font-bold">NO</span></div>
                    </div>
                </div>
            </div>
        `
  }

  bindEvents() {
    // No specific events needed
  }
}
