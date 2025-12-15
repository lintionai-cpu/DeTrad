// Main Application Entry Point
import { DerivAPI } from "./modules/DerivAPI.js"
import { TradingEngine } from "./modules/TradingEngine.js"
import { UIManager } from "./modules/UIManager.js"
import { StrategyManager } from "./modules/StrategyManager.js"

class DerivAutoTrader {
  constructor() {
    this.api = new DerivAPI()
    this.strategyManager = new StrategyManager()
    this.tradingEngine = new TradingEngine(this.api, this.strategyManager)
    this.ui = new UIManager(this.tradingEngine, this.api, this.strategyManager)

    this.init()
  }

  init() {
    console.log("🚀 DeTrad Pro initializing...")
    this.setupEventListeners()
    this.ui.init()
  }

  setupEventListeners() {
    // API Connection
    document.getElementById("connectBtn").addEventListener("click", () => this.handleConnect())
    document.getElementById("disconnectBtn").addEventListener("click", () => this.handleDisconnect())

    // Trading Controls
    document.getElementById("startBtn").addEventListener("click", () => this.handleStartAuto())
    document.getElementById("stopBtn").addEventListener("click", () => this.handleStopAuto())
    document.getElementById("singleTradeBtn").addEventListener("click", () => this.handleSingleTrade())
    document.getElementById("resetBtn").addEventListener("click", () => this.handleReset())

    // Market Change
    document.getElementById("marketSelect").addEventListener("change", () => this.handleMarketChange())

    // Strategy Selection
    document.querySelectorAll(".strategy-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const strategy = e.currentTarget.dataset.strategy
        this.handleStrategyChange(strategy)
      })
    })

    // Clear History
    document.getElementById("clearHistoryBtn").addEventListener("click", () => {
      this.ui.clearHistory()
    })
  }

  async handleConnect() {
    const token = document.getElementById("apiTokenInput").value.trim()
    if (!token) {
      this.ui.showToast("Please enter your API token", "error")
      return
    }

    try {
      await this.api.connect(token)
      this.ui.showToast("Connected to Deriv API successfully!", "success")
      this.ui.updateConnectionStatus(true)
      document.getElementById("connectBtn").classList.add("hidden")
      document.getElementById("disconnectBtn").classList.remove("hidden")
    } catch (error) {
      this.ui.showToast(`Connection failed: ${error.message}`, "error")
    }
  }

  handleDisconnect() {
    this.tradingEngine.stopAutoTrading()
    this.api.disconnect()
    this.ui.updateConnectionStatus(false)
    document.getElementById("connectBtn").classList.remove("hidden")
    document.getElementById("disconnectBtn").classList.add("hidden")
    this.ui.showToast("Disconnected from Deriv API", "info")
  }

  handleMarketChange() {
    if (this.api.isConnected()) {
      this.api.subscribeToTicks(document.getElementById("marketSelect").value)
    }
  }

  async handleStartAuto() {
    if (!this.api.isConnected()) {
      this.ui.showToast("Please connect to API first", "error")
      return
    }

    try {
      await this.tradingEngine.startAutoTrading()
      this.ui.showToast("Auto trading started!", "success")
      document.getElementById("startBtn").disabled = true
      document.getElementById("startBtn").classList.add("opacity-50")
      document.getElementById("stopBtn").disabled = false
      document.getElementById("stopBtn").classList.remove("opacity-50")
    } catch (error) {
      this.ui.showToast(`Failed to start: ${error.message}`, "error")
    }
  }

  handleStopAuto() {
    this.tradingEngine.stopAutoTrading()
    this.ui.showToast("Auto trading stopped", "info")
    document.getElementById("startBtn").disabled = false
    document.getElementById("startBtn").classList.remove("opacity-50")
    document.getElementById("stopBtn").disabled = true
    document.getElementById("stopBtn").classList.add("opacity-50")
  }

  async handleSingleTrade() {
    if (!this.api.isConnected()) {
      this.ui.showToast("Please connect to API first", "error")
      return
    }

    try {
      await this.tradingEngine.executeSingleTrade()
      this.ui.showToast("Trade executed", "info")
    } catch (error) {
      this.ui.showToast(`Trade failed: ${error.message}`, "error")
    }
  }

  handleReset() {
    if (confirm("Reset all session data? This will clear trade history and statistics.")) {
      this.tradingEngine.resetSession()
      this.ui.clearHistory()
      this.ui.showToast("Session reset successfully", "success")
    }
  }

  handleStrategyChange(strategy) {
    this.strategyManager.setActiveStrategy(strategy)
    this.ui.updateStrategyUI(strategy)

    // Update button styles
    document.querySelectorAll(".strategy-btn").forEach((btn) => {
      if (btn.dataset.strategy === strategy) {
        btn.classList.add("active")
      } else {
        btn.classList.remove("active")
      }
    })
  }
}

// Initialize app when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  window.app = new DerivAutoTrader()
})
