// Strategy Manager - Handles different trading strategies
import { SmartSwitcherStrategy } from "./strategies/SmartSwitcher.js"
import { ReboundStrategy } from "./strategies/Rebound.js"
import { MatchesStrategy } from "./strategies/Matches.js"
import { DiffersStrategy } from "./strategies/Differs.js"

export class StrategyManager {
  constructor() {
    this.strategies = {
      switcher: new SmartSwitcherStrategy(),
      rebound: new ReboundStrategy(),
      matches: new MatchesStrategy(),
      differs: new DiffersStrategy(),
    }

    this.activeStrategy = "switcher"
  }

  setActiveStrategy(strategyName) {
    if (this.strategies[strategyName]) {
      this.activeStrategy = strategyName
      this.strategies[strategyName].onActivate()
    }
  }

  getActiveStrategy() {
    return this.strategies[this.activeStrategy]
  }

  onTradeResult(won) {
    this.strategies[this.activeStrategy].onTradeResult(won)
  }

  reset() {
    Object.values(this.strategies).forEach((strategy) => strategy.reset())
  }

  getAllStrategies() {
    return this.strategies
  }
}
