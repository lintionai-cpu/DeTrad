// Deriv API WebSocket Handler
export class DerivAPI {
  constructor() {
    this.ws = null
    this.connected = false
    this.balance = 0
    this.tickHistory = []
    this.lastDigits = []
    this.callbacks = {
      onTick: [],
      onBalance: [],
      onContract: [],
      onError: [],
    }
  }

  async connect(token) {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket("wss://ws.derivws.com/websockets/v3?app_id=1089")

        this.ws.onopen = () => {
          this.ws.send(JSON.stringify({ authorize: token }))
        }

        this.ws.onmessage = (msg) => {
          const data = JSON.parse(msg.data)
          this.handleMessage(data, resolve, reject)
        }

        this.ws.onerror = (error) => {
          console.error("[v0] WebSocket error:", error)
          this.connected = false
          this.callbacks.onError.forEach((cb) => cb(error))
          reject(new Error("WebSocket connection failed"))
        }

        this.ws.onclose = () => {
          console.log("[v0] WebSocket closed")
          this.connected = false
        }
      } catch (error) {
        reject(error)
      }
    })
  }

  handleMessage(data, resolve, reject) {
    console.log("[v0] Deriv API message:", data.msg_type)

    if (data.msg_type === "authorize") {
      if (data.authorize) {
        this.connected = true
        this.balance = Number.parseFloat(data.authorize.balance)
        this.callbacks.onBalance.forEach((cb) => cb(this.balance))
        resolve(data.authorize)
      } else {
        reject(new Error("Authorization failed"))
      }
    } else if (data.msg_type === "tick") {
      this.handleTick(data.tick)
    } else if (data.msg_type === "balance") {
      this.balance = Number.parseFloat(data.balance.balance)
      this.callbacks.onBalance.forEach((cb) => cb(this.balance))
    } else if (data.msg_type === "proposal") {
      this.callbacks.onContract.forEach((cb) => cb({ type: "proposal", data }))
    } else if (data.msg_type === "buy") {
      this.callbacks.onContract.forEach((cb) => cb({ type: "buy", data }))
    } else if (data.msg_type === "proposal_open_contract") {
      this.callbacks.onContract.forEach((cb) => cb({ type: "contract_update", data }))
    } else if (data.error) {
      console.error("[v0] Deriv API error:", data.error)
      this.callbacks.onError.forEach((cb) => cb(data.error))
    }
  }

  handleTick(tick) {
    const lastDigit = Number.parseInt(tick.quote.toString().slice(-1))
    this.lastDigits.push(lastDigit)
    if (this.lastDigits.length > 200) this.lastDigits.shift()

    this.tickHistory.push(tick)
    if (this.tickHistory.length > 200) this.tickHistory.shift()

    this.callbacks.onTick.forEach((cb) => cb({ tick, lastDigit }))
  }

  subscribeToTicks(market) {
    if (!this.connected) return
    this.lastDigits = []
    this.tickHistory = []
    this.send({ ticks: market, subscribe: 1 })
  }

  async sendProposal(params) {
    if (!this.connected) throw new Error("Not connected to API")
    this.send({ proposal: 1, ...params })
  }

  async buyContract(proposalId, price) {
    if (!this.connected) throw new Error("Not connected to API")
    this.send({ buy: proposalId, price })
  }

  subscribeToContract(contractId) {
    this.send({ proposal_open_contract: 1, contract_id: contractId, subscribe: 1 })
  }

  send(data) {
    if (this.ws && this.connected) {
      this.ws.send(JSON.stringify(data))
    }
  }

  on(event, callback) {
    if (this.callbacks[event]) {
      this.callbacks[event].push(callback)
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
    this.connected = false
  }

  isConnected() {
    return this.connected
  }

  getBalance() {
    return this.balance
  }

  getLastDigits() {
    return this.lastDigits
  }
}
