// Trading Engine - Handles trade execution and management
export class TradingEngine {
  constructor(api, strategyManager) {
    this.api = api
    this.strategyManager = strategyManager

    // Trading state
    this.isTrading = false
    this.currentStake = 0
    this.martingaleStep = 0
    this.consecutiveLosses = 0

    // Session statistics
    this.totalPnl = 0
    this.totalTrades = 0
    this.wins = 0
    this.losses = 0
    this.tradeHistory = []

    // Pending trade data
    this.pendingTrade = null
    this.currentProposalId = null

    this.setupAPICallbacks()
  }

  setupAPICallbacks() {
    this.api.on("onContract", (event) => this.handleContractEvent(event))
  }

  async executeSingleTrade() {
    if (!this.api.isConnected()) {
      throw new Error("API not connected")
    }

    const config = this.getTradeConfig()
    const strategy = this.strategyManager.getActiveStrategy()

    // Apply strategy modifications
    const modifiedConfig = strategy.modifyTradeConfig(config, this.api.getLastDigits())

    if (!modifiedConfig) {
      console.log("[v0] Strategy prevented trade execution")
      return
    }

    await this.executeTrade(modifiedConfig)
  }

  async executeTrade(config) {
    const { tradeType, targetDigit, stake, market, duration } = config

    this.pendingTrade = { tradeType, targetDigit, stake, market, duration }
    this.currentStake = stake

    const proposalParams = {
      amount: stake,
      basis: "stake",
      contract_type: tradeType,
      currency: "USD",
      duration: duration,
      duration_unit: "t",
      symbol: market,
      barrier: targetDigit.toString(),
    }

    await this.api.sendProposal(proposalParams)
  }

  handleContractEvent(event) {
    if (event.type === "proposal") {
      this.handleProposal(event.data)
    } else if (event.type === "buy") {
      this.handleBuy(event.data)
    } else if (event.type === "contract_update") {
      this.handleContractUpdate(event.data)
    }
  }

  handleProposal(data) {
    if (data.error) {
      console.error("[v0] Proposal error:", data.error)
      return
    }

    if (data.proposal && this.pendingTrade) {
      this.currentProposalId = data.proposal.id
      this.api.buyContract(this.currentProposalId, this.pendingTrade.stake)
    }
  }

  handleBuy(data) {
    if (data.error) {
      console.error("[v0] Buy error:", data.error)
      this.pendingTrade = null
      return
    }

    const contractId = data.buy.contract_id
    this.api.subscribeToContract(contractId)
    this.pendingTrade = null
  }

  handleContractUpdate(data) {
    const contract = data.proposal_open_contract

    if (contract.status === "sold" || contract.is_sold) {
      const profit = Number.parseFloat(contract.profit)
      const won = profit > 0

      this.updateStatistics(won, profit)
      this.recordTrade(contract, won, profit)

      // Strategy callback
      this.strategyManager.onTradeResult(won)

      // Martingale management
      this.handleMartingale(won)

      // Check stop conditions
      this.checkStopConditions()
    }
  }

  updateStatistics(won, profit) {
    this.totalPnl += profit
    this.totalTrades++

    if (won) {
      this.wins++
      this.consecutiveLosses = 0
    } else {
      this.losses++
      this.consecutiveLosses++
    }

    // Dispatch event for UI update
    window.dispatchEvent(
      new CustomEvent("statsUpdate", {
        detail: {
          totalPnl: this.totalPnl,
          totalTrades: this.totalTrades,
          wins: this.wins,
          losses: this.losses,
          winRate: this.totalTrades > 0 ? ((this.wins / this.totalTrades) * 100).toFixed(1) : 0,
          currentStake: this.currentStake,
          martingaleStep: this.martingaleStep,
        },
      }),
    )
  }

  recordTrade(contract, won, profit) {
    const trade = {
      time: new Date().toLocaleTimeString(),
      type: contract.contract_type,
      market: contract.underlying,
      target: contract.barrier || "-",
      stake: Number.parseFloat(contract.buy_price),
      payout: Number.parseFloat(contract.payout || 0),
      result: won ? "Win" : "Loss",
      pnl: profit,
      martingaleStep: this.martingaleStep,
    }

    this.tradeHistory.unshift(trade)
    if (this.tradeHistory.length > 100) this.tradeHistory.pop()

    window.dispatchEvent(new CustomEvent("tradeComplete", { detail: trade }))
  }

  handleMartingale(won) {
    const enabled = document.getElementById("martingaleCheckbox").checked
    const initialStake = Number.parseFloat(document.getElementById("initialStakeInput").value)
    const maxSteps = Number.parseInt(document.getElementById("maxMartingaleInput").value)

    if (!enabled) {
      this.currentStake = initialStake
      this.martingaleStep = 0
      return
    }

    if (won) {
      this.currentStake = initialStake
      this.martingaleStep = 0
    } else {
      if (this.martingaleStep < maxSteps) {
        this.currentStake = this.currentStake * 2
        this.martingaleStep++
      } else {
        this.currentStake = initialStake
        this.martingaleStep = 0
      }
    }
  }

  checkStopConditions() {
    const maxLoss = Number.parseFloat(document.getElementById("maxLossInput").value)
    const maxProfit = Number.parseFloat(document.getElementById("maxProfitInput").value)
    const maxTrades = Number.parseInt(document.getElementById("maxTradesInput").value)
    const stopLosses = Number.parseInt(document.getElementById("stopLossesInput").value)

    if (this.consecutiveLosses >= stopLosses) {
      this.stopAutoTrading()
      window.dispatchEvent(
        new CustomEvent("tradingStop", {
          detail: { reason: `${this.consecutiveLosses} consecutive losses` },
        }),
      )
      return
    }

    if (Math.abs(this.totalPnl) >= maxLoss && this.totalPnl < 0) {
      this.stopAutoTrading()
      window.dispatchEvent(
        new CustomEvent("tradingStop", {
          detail: { reason: "Max loss reached" },
        }),
      )
      return
    }

    if (this.totalPnl >= maxProfit) {
      this.stopAutoTrading()
      window.dispatchEvent(
        new CustomEvent("tradingStop", {
          detail: { reason: "Profit target reached!" },
        }),
      )
      return
    }

    if (maxTrades > 0 && this.totalTrades >= maxTrades) {
      this.stopAutoTrading()
      window.dispatchEvent(
        new CustomEvent("tradingStop", {
          detail: { reason: "Trade limit reached" },
        }),
      )
      return
    }
  }

  getTradeConfig() {
    return {
      tradeType: document.getElementById("tradeTypeSelect").value,
      targetDigit: Number.parseInt(document.getElementById("targetDigitInput").value),
      stake: this.currentStake || Number.parseFloat(document.getElementById("initialStakeInput").value),
      market: document.getElementById("marketSelect").value,
      duration: Number.parseInt(document.getElementById("durationInput").value),
    }
  }

  async startAutoTrading() {
    if (this.api.getLastDigits().length < 5) {
      throw new Error("Waiting for tick data... Please wait.")
    }

    this.isTrading = true
    this.currentStake = Number.parseFloat(document.getElementById("initialStakeInput").value)
    this.martingaleStep = 0
    this.consecutiveLosses = 0

    this.tradingInterval = setInterval(async () => {
      if (this.isTrading && !this.pendingTrade) {
        try {
          await this.executeSingleTrade()
        } catch (error) {
          console.error("[v0] Auto trade error:", error)
        }
      }
    }, 6000)
  }

  stopAutoTrading() {
    this.isTrading = false
    if (this.tradingInterval) {
      clearInterval(this.tradingInterval)
      this.tradingInterval = null
    }
  }

  resetSession() {
    this.totalPnl = 0
    this.totalTrades = 0
    this.wins = 0
    this.losses = 0
    this.martingaleStep = 0
    this.consecutiveLosses = 0
    this.currentStake = Number.parseFloat(document.getElementById("initialStakeInput").value)
    this.tradeHistory = []
    this.strategyManager.reset()

    window.dispatchEvent(new CustomEvent("sessionReset"))
  }

  getStatistics() {
    return {
      totalPnl: this.totalPnl,
      totalTrades: this.totalTrades,
      wins: this.wins,
      losses: this.losses,
      winRate: this.totalTrades > 0 ? ((this.wins / this.totalTrades) * 100).toFixed(1) : 0,
    }
  }
}
