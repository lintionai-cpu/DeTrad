// UI Manager - Handles all UI updates and interactions
export class UIManager {
  constructor(tradingEngine, api, strategyManager) {
    this.tradingEngine = tradingEngine
    this.api = api
    this.strategyManager = strategyManager
  }

  init() {
    this.setupEventListeners()
    this.renderStrategyPanels()
  }

  setupEventListeners() {
    // Listen for trading engine events
    window.addEventListener("statsUpdate", (e) => this.updateStats(e.detail))
    window.addEventListener("tradeComplete", (e) => this.addTradeToHistory(e.detail))
    window.addEventListener("tradingStop", (e) => this.handleTradingStop(e.detail))
    window.addEventListener("sessionReset", () => this.handleSessionReset())

    // API events
    this.api.on("onBalance", (balance) => this.updateBalance(balance))
    this.api.on("onTick", (data) => this.handleTick(data))
  }

  updateConnectionStatus(connected) {
    const badge = document.getElementById("connectionBadge")
    if (connected) {
      badge.textContent = "🟢 Online"
      badge.className =
        "px-3 py-1 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm font-semibold bg-green-600 pulse-animation"
    } else {
      badge.textContent = "⚫ Offline"
      badge.className = "px-3 py-1 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm font-semibold bg-red-600"
    }
  }

  updateBalance(balance) {
    document.getElementById("balanceDisplay").textContent = `$${balance.toFixed(2)}`
  }

  updateStats(stats) {
    document.getElementById("pnlDisplay").textContent = `$${stats.totalPnl.toFixed(2)}`
    document.getElementById("pnlDisplay").className =
      `text-lg sm:text-xl lg:text-2xl font-bold ${stats.totalPnl >= 0 ? "text-green-400" : "text-red-400"}`

    document.getElementById("winRateDisplay").textContent = `${stats.winRate}%`
    document.getElementById("tradesDisplay").textContent = stats.totalTrades
    document.getElementById("stakeDisplay").textContent = `$${stats.currentStake.toFixed(2)}`
    document.getElementById("martingaleDisplay").textContent = stats.martingaleStep

    // Update streak
    const streak = stats.wins - stats.losses
    document.getElementById("streakDisplay").textContent = streak > 0 ? `+${streak}` : streak
    document.getElementById("streakDisplay").className =
      `text-sm sm:text-base font-bold ${streak >= 0 ? "text-green-400" : "text-red-400"}`

    // Update remaining trades
    const maxTrades = Number.parseInt(document.getElementById("maxTradesInput").value)
    if (maxTrades > 0) {
      const remaining = maxTrades - stats.totalTrades
      document.getElementById("remainingDisplay").textContent = remaining >= 0 ? remaining : 0
    }
  }

  addTradeToHistory(trade) {
    const tbody = document.getElementById("tradeHistoryBody")

    // Remove "no trades" message
    if (tbody.children.length === 1 && tbody.children[0].children.length === 1) {
      tbody.innerHTML = ""
    }

    const row = document.createElement("tr")
    row.className = "hover:bg-gray-700 transition-colors"
    row.innerHTML = `
            <td class="p-2 text-xs">${trade.time}</td>
            <td class="p-2 text-xs hidden sm:table-cell">${this.formatTradeType(trade.type)}</td>
            <td class="p-2 text-xs hidden lg:table-cell">${trade.market}</td>
            <td class="p-2 text-center font-bold text-yellow-400">${trade.target}</td>
            <td class="p-2 text-right text-xs">$${trade.stake.toFixed(2)}</td>
            <td class="p-2 text-center">
                <span class="px-2 py-1 rounded text-xs font-semibold ${trade.result === "Win" ? "bg-green-600" : "bg-red-600"}">
                    ${trade.result}
                </span>
            </td>
            <td class="p-2 text-right font-bold text-xs ${trade.pnl >= 0 ? "text-green-400" : "text-red-400"}">
                ${trade.pnl >= 0 ? "+" : ""}$${trade.pnl.toFixed(2)}
            </td>
        `

    tbody.insertBefore(row, tbody.firstChild)

    // Keep only last 50 trades visible
    if (tbody.children.length > 50) {
      tbody.removeChild(tbody.lastChild)
    }
  }

  formatTradeType(type) {
    const typeMap = {
      DIGITOVER: "Over",
      DIGITUNDER: "Under",
      DIGITMATCH: "Match",
      DIGITDIFF: "Differs",
      DIGITEVEN: "Even",
      DIGITODD: "Odd",
      CALL: "Rise",
      PUT: "Fall",
    }
    return typeMap[type] || type
  }

  clearHistory() {
    const tbody = document.getElementById("tradeHistoryBody")
    tbody.innerHTML = '<tr><td colspan="7" class="p-4 text-center text-gray-500">No trades yet</td></tr>'
  }

  handleTradingStop(detail) {
    this.showToast(`Trading stopped: ${detail.reason}`, "warning")
    document.getElementById("startBtn").disabled = false
    document.getElementById("startBtn").classList.remove("opacity-50")
    document.getElementById("stopBtn").disabled = true
    document.getElementById("stopBtn").classList.add("opacity-50")
  }

  handleSessionReset() {
    this.updateStats({
      totalPnl: 0,
      totalTrades: 0,
      wins: 0,
      losses: 0,
      winRate: 0,
      currentStake: Number.parseFloat(document.getElementById("initialStakeInput").value),
      martingaleStep: 0,
    })
    this.clearHistory()
  }

  handleTick(data) {
    // Could add live tick display here if needed
  }

  showToast(message, type = "info") {
    const container = document.getElementById("toastContainer")
    const toast = document.createElement("div")

    const bgColors = {
      success: "bg-green-600",
      error: "bg-red-600",
      warning: "bg-yellow-600",
      info: "bg-blue-600",
    }

    toast.className = `toast ${bgColors[type]} text-white px-6 py-3 rounded-lg shadow-lg max-w-sm`
    toast.textContent = message

    container.appendChild(toast)

    setTimeout(() => {
      toast.classList.add("removing")
      setTimeout(() => container.removeChild(toast), 300)
    }, 3000)
  }

  renderStrategyPanels() {
    const container = document.getElementById("strategyPanels")
    const strategies = this.strategyManager.getAllStrategies()

    container.innerHTML = `
            <div id="panel-switcher" class="strategy-panel">
                ${strategies.switcher.renderUI()}
            </div>
            <div id="panel-rebound" class="strategy-panel hidden">
                ${strategies.rebound.renderUI()}
            </div>
            <div id="panel-matches" class="strategy-panel hidden">
                ${strategies.matches.renderUI()}
            </div>
            <div id="panel-differs" class="strategy-panel hidden">
                ${strategies.differs.renderUI()}
            </div>
        `

    // Bind strategy-specific event listeners
    Object.values(strategies).forEach((strategy) => strategy.bindEvents())
  }

  updateStrategyUI(strategyName) {
    document.querySelectorAll(".strategy-panel").forEach((panel) => {
      panel.classList.add("hidden")
    })

    const activePanel = document.getElementById(`panel-${strategyName}`)
    if (activePanel) {
      activePanel.classList.remove("hidden")
    }
  }
}
