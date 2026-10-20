package com.aistudio.luckybet.ui.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.aistudio.luckybet.data.model.AviatorHistoryItem
import com.aistudio.luckybet.data.model.AviatorHourlyMood
import com.aistudio.luckybet.data.model.AviatorTheme
import com.aistudio.luckybet.data.model.BetStatus
import com.aistudio.luckybet.data.model.DepositStatus
import com.aistudio.luckybet.data.model.FootballMatch
import com.aistudio.luckybet.data.model.GamePhase
import com.aistudio.luckybet.data.model.MatchOdds
import com.aistudio.luckybet.data.model.MatchStatus
import com.aistudio.luckybet.data.model.PendingDeposit
import com.aistudio.luckybet.data.model.PlacedSportsBet
import com.aistudio.luckybet.data.model.PlayerBetConfig
import com.aistudio.luckybet.data.model.SimulatedPlayer
import com.aistudio.luckybet.data.model.SlipSelection
import com.aistudio.luckybet.data.model.TransactionType
import com.aistudio.luckybet.data.model.UserAccount
import com.aistudio.luckybet.data.model.WalletTransaction
import com.aistudio.luckybet.data.util.ProvablyFair
import com.aistudio.luckybet.ui.components.aviator.MyFlightRecord
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import java.util.UUID
import kotlin.math.max
import kotlin.math.min
import kotlin.math.pow
import kotlin.random.Random

data class LuckyBetUiState(
    val activeTab: String = "aviator",
    val theme: AviatorTheme = AviatorTheme.CLASSIC_RED,
    val isMuted: Boolean = false,
    val user: UserAccount = UserAccount(
        phoneNumber = "0712345678",
        username = "LuckyPlayer_254",
        balance = 500.0
    ),
    val transactions: List<WalletTransaction> = listOf(
        WalletTransaction(
            id = "tx-welcome",
            type = TransactionType.BONUS,
            amount = 500.0,
            balanceAfter = 500.0,
            description = "Welcome Free Bonus (500 KES)",
            timestamp = System.currentTimeMillis() - 3600000
        )
    ),
    // Aviator
    val phase: GamePhase = GamePhase.WAITING,
    val currentMultiplier: Double = 1.0,
    val countdown: Float = 5.0f,
    val roundNumber: Long = 8429,
    val history: List<AviatorHistoryItem> = emptyList(),
    val hourlyMood: AviatorHourlyMood = AviatorHourlyMood.FAIR,
    val isAutoMood: Boolean = true,
    val minutesToShift: Int = 45,
    val rtpRate: Double = 0.97,
    val bet1: PlayerBetConfig = PlayerBetConfig(amount = 50.0, autoCashoutMultiplier = 2.0),
    val bet2: PlayerBetConfig = PlayerBetConfig(amount = 100.0, autoCashoutMultiplier = 3.0),
    val simPlayers: List<SimulatedPlayer> = emptyList(),
    val myFlightHistory: List<MyFlightRecord> = emptyList(),
    // Sports
    val matches: List<FootballMatch> = emptyList(),
    val activeSlip: List<SlipSelection> = emptyList(),
    val placedSportsBets: List<PlacedSportsBet> = emptyList(),
    // Admin & Cashier
    val registeredUsers: List<UserAccount> = emptyList(),
    val pendingDeposits: List<PendingDeposit> = emptyList(),
    val isCashierOpen: Boolean = false,
    val cashierInitialTab: String = "deposit",
    val isAdminOpen: Boolean = false,
    val isRulesOpen: Boolean = false,
    val isAccountOpen: Boolean = false
)

class LuckyBetViewModel : ViewModel() {

    private val _uiState = MutableStateFlow(LuckyBetUiState())
    val uiState: StateFlow<LuckyBetUiState> = _uiState.asStateFlow()

    private var flightJob: Job? = null
    private var sportsJob: Job? = null
    private var forcedMultiplier: Double? = null

    init {
        initInitialData()
        startAviatorGameLoop()
        startSportsSimulation()
        startHourlyMoodWatcher()
    }

    private fun initInitialData() {
        val initialHistory = listOf(
            AviatorHistoryItem("h1", 8421, 2.45, System.currentTimeMillis() - 40000, "a4f89b12c8e3...4b1"),
            AviatorHistoryItem("h2", 8422, 1.18, System.currentTimeMillis() - 35000, "c901bc430e7...88a"),
            AviatorHistoryItem("h3", 8423, 14.82, System.currentTimeMillis() - 30000, "7e289f41b2...91d"),
            AviatorHistoryItem("h4", 8424, 3.12, System.currentTimeMillis() - 25000, "3d8102a9cf...33b"),
            AviatorHistoryItem("h5", 8425, 1.05, System.currentTimeMillis() - 20000, "e992b810fa...71c"),
            AviatorHistoryItem("h6", 8426, 5.64, System.currentTimeMillis() - 15000, "210acbf941...55e"),
            AviatorHistoryItem("h7", 8427, 1.88, System.currentTimeMillis() - 10000, "88bfe4301a...99f"),
            AviatorHistoryItem("h8", 8428, 22.40, System.currentTimeMillis() - 5000, "5561a09cb1...22c")
        )

        val initialMatches = listOf(
            FootballMatch(
                id = "m1",
                league = "Premier League",
                homeTeam = "Arsenal",
                awayTeam = "Chelsea",
                homeScore = 1,
                awayScore = 0,
                minute = 68,
                status = MatchStatus.LIVE,
                startTime = "Live 68'",
                odds = MatchOdds(1.65, 3.80, 5.20, 1.72, 2.10, 1.85, 1.95)
            ),
            FootballMatch(
                id = "m2",
                league = "Kenya Premier League",
                homeTeam = "Gor Mahia",
                awayTeam = "AFC Leopards",
                homeScore = 2,
                awayScore = 1,
                minute = 82,
                status = MatchStatus.LIVE,
                startTime = "Live 82'",
                odds = MatchOdds(1.55, 3.60, 6.00, 1.90, 1.80, 1.65, 2.15)
            ),
            FootballMatch(
                id = "m3",
                league = "Champions League",
                homeTeam = "Real Madrid",
                awayTeam = "Bayern Munich",
                homeScore = 0,
                awayScore = 0,
                minute = 23,
                status = MatchStatus.LIVE,
                startTime = "Live 23'",
                odds = MatchOdds(2.25, 3.50, 3.10, 1.65, 2.20, 1.55, 2.35)
            ),
            FootballMatch(
                id = "m4",
                league = "Premier League",
                homeTeam = "Manchester City",
                awayTeam = "Liverpool",
                homeScore = 0,
                awayScore = 0,
                minute = 0,
                status = MatchStatus.UPCOMING,
                startTime = "Today 21:00",
                odds = MatchOdds(1.95, 3.75, 3.80, 1.55, 2.45, 1.50, 2.50)
            ),
            FootballMatch(
                id = "m5",
                league = "La Liga",
                homeTeam = "Barcelona",
                awayTeam = "Atletico Madrid",
                homeScore = 0,
                awayScore = 0,
                minute = 0,
                status = MatchStatus.UPCOMING,
                startTime = "Tomorrow 20:30",
                odds = MatchOdds(1.80, 3.65, 4.40, 1.85, 1.95, 1.70, 2.10)
            )
        )

        val initialUsers = listOf(
            UserAccount("0712345678", "LuckyPlayer_254", 500.0),
            UserAccount("0722894102", "Kiprotich_99", 750.0),
            UserAccount("0714529381", "Amina_Bet", 1200.0),
            UserAccount("0799812401", "Omondi_K", 350.0)
        )

        val initialPendingDeposits = listOf(
            PendingDeposit("dep-101", "0722894102", "Kiprotich_99", 200.0, "QKF81920J1", System.currentTimeMillis() - 120000),
            PendingDeposit("dep-102", "0714529381", "Amina_Bet", 300.0, "QK9103982A", System.currentTimeMillis() - 360000)
        )

        _uiState.update {
            it.copy(
                history = initialHistory,
                matches = initialMatches,
                registeredUsers = initialUsers,
                pendingDeposits = initialPendingDeposits,
                hourlyMood = ProvablyFair.getCurrentHourMood(),
                minutesToShift = ProvablyFair.getMinutesToShift()
            )
        }
    }

    private fun generateSimPlayers(): List<SimulatedPlayer> {
        val names = listOf(
            "mwangi_254", "chebet_pro", "otieno_fly", "kip_ace", "wafula_9",
            "lucy_win", "kamau_pilot", "nyambura_k", "hassan_fast", "brian_jet",
            "mercy_sky", "victor_c", "wambui_vip", "omondi_gold", "dennis_ke",
            "grace_star", "john_m", "faith_w", "george_fly", "esther_win"
        )
        val betOptions = listOf(20.0, 50.0, 100.0, 200.0, 500.0, 1000.0)

        return names.mapIndexed { idx, name ->
            val bet = betOptions.random()
            val target = Math.round((1.1 + Random.nextDouble() * 8.5) * 100.0) / 100.0
            SimulatedPlayer(
                id = "sim-$idx-${System.currentTimeMillis()}",
                username = name,
                betAmount = bet,
                targetCashout = target
            )
        }
    }

    private fun startAviatorGameLoop() {
        flightJob?.cancel()
        flightJob = viewModelScope.launch {
            while (isActive) {
                // WAITING PHASE (5 seconds countdown)
                _uiState.update {
                    it.copy(
                        phase = GamePhase.WAITING,
                        currentMultiplier = 1.0,
                        simPlayers = generateSimPlayers()
                    )
                }

                val waitStart = System.currentTimeMillis()
                val waitDuration = 5000L
                while (System.currentTimeMillis() - waitStart < waitDuration) {
                    val remaining = max(0f, (waitDuration - (System.currentTimeMillis() - waitStart)) / 1000f)
                    _uiState.update { it.copy(countdown = remaining) }
                    delay(50)
                }

                // FLYING PHASE
                val newRound = _uiState.value.roundNumber + 1
                val targetCrash = forcedMultiplier ?: run {
                    val (mult, _) = ProvablyFair.generateCrashPoint(
                        _uiState.value.rtpRate,
                        if (_uiState.value.isAutoMood) _uiState.value.hourlyMood else null
                    )
                    mult
                }
                forcedMultiplier = null

                val seedHash = ProvablyFair.sha256("round_${newRound}_mult_${targetCrash}_${System.currentTimeMillis()}")

                _uiState.update {
                    it.copy(
                        phase = GamePhase.FLYING,
                        countdown = 0f,
                        roundNumber = newRound,
                        currentMultiplier = 1.0
                    )
                }

                val flightStart = System.currentTimeMillis()
                var currentMult = 1.0

                while (currentMult < targetCrash && isActive) {
                    val elapsedSec = (System.currentTimeMillis() - flightStart) / 1000.0
                    currentMult = max(1.0, 1.0 + 0.08 * elapsedSec + 0.048 * elapsedSec.pow(2.0))

                    if (currentMult >= targetCrash) {
                        currentMult = targetCrash
                    }

                    val updatedMult = currentMult
                    _uiState.update { state ->
                        // Check auto cashout bet1
                        var b1 = state.bet1
                        if (b1.isPlaced && !b1.hasCashedOut && b1.autoCashoutEnabled && updatedMult >= b1.autoCashoutMultiplier) {
                            val win = b1.amount * b1.autoCashoutMultiplier
                            b1 = b1.copy(hasCashedOut = true, cashoutMultiplier = b1.autoCashoutMultiplier, winAmount = win)
                        }

                        // Check auto cashout bet2
                        var b2 = state.bet2
                        if (b2.isPlaced && !b2.hasCashedOut && b2.autoCashoutEnabled && updatedMult >= b2.autoCashoutMultiplier) {
                            val win = b2.amount * b2.autoCashoutMultiplier
                            b2 = b2.copy(hasCashedOut = true, cashoutMultiplier = b2.autoCashoutMultiplier, winAmount = win)
                        }

                        // Update simulated players cashing out
                        val updatedSim = state.simPlayers.map { p ->
                            if (!p.cashedOut && updatedMult >= p.targetCashout) {
                                p.copy(cashedOut = true, cashedOutMultiplier = p.targetCashout, winAmount = p.betAmount * p.targetCashout)
                            } else p
                        }

                        state.copy(
                            currentMultiplier = updatedMult,
                            bet1 = b1,
                            bet2 = b2,
                            simPlayers = updatedSim
                        )
                    }

                    if (currentMult >= targetCrash) break
                    delay(30)
                }

                // CRASHED PHASE
                _uiState.update { state ->
                    val historyItem = AviatorHistoryItem(
                        id = "round-$newRound-${System.currentTimeMillis()}",
                        roundNumber = newRound,
                        multiplier = targetCrash,
                        timestamp = System.currentTimeMillis(),
                        hash = seedHash
                    )

                    val myRecs = state.myFlightHistory.toMutableList()
                    val timeStr = SimpleDateFormat("HH:mm", Locale.getDefault()).format(Date())
                    if (state.bet1.isPlaced) {
                        myRecs.add(
                            0,
                            MyFlightRecord(
                                round = newRound,
                                bet = state.bet1.amount,
                                mult = if (state.bet1.hasCashedOut) state.bet1.cashoutMultiplier else 0.0,
                                win = if (state.bet1.hasCashedOut) state.bet1.winAmount else 0.0,
                                date = timeStr
                            )
                        )
                    }

                    state.copy(
                        phase = GamePhase.CRASHED,
                        currentMultiplier = targetCrash,
                        history = listOf(historyItem) + state.history.take(39),
                        myFlightHistory = myRecs.take(20)
                    )
                }

                // Pause on crash screen for 2.8 seconds
                delay(2800)

                // Reset placed bets for next flight
                _uiState.update { state ->
                    state.copy(
                        bet1 = state.bet1.copy(isPlaced = false, hasCashedOut = false, cashoutMultiplier = 0.0, winAmount = 0.0),
                        bet2 = state.bet2.copy(isPlaced = false, hasCashedOut = false, cashoutMultiplier = 0.0, winAmount = 0.0)
                    )
                }
            }
        }
    }

    private fun startSportsSimulation() {
        sportsJob?.cancel()
        sportsJob = viewModelScope.launch {
            while (isActive) {
                delay(12000)
                _uiState.update { state ->
                    val updated = state.matches.map { m ->
                        if (m.status != MatchStatus.LIVE) return@map m
                        val newMin = m.minute + 1
                        if (newMin >= 90) {
                            m.copy(minute = 90, status = MatchStatus.FINISHED, startTime = "FT")
                        } else {
                            var homeS = m.homeScore
                            var awayS = m.awayScore
                            if (Random.nextDouble() < 0.04) {
                                if (Random.nextBoolean()) homeS++ else awayS++
                            }
                            m.copy(
                                minute = newMin,
                                homeScore = homeS,
                                awayScore = awayS,
                                odds = m.odds.copy(
                                    home = max(1.1, Math.round((m.odds.home + (Random.nextDouble() - 0.5) * 0.04) * 100.0) / 100.0),
                                    away = max(1.1, Math.round((m.odds.away + (Random.nextDouble() - 0.5) * 0.04) * 100.0) / 100.0)
                                )
                            )
                        }
                    }
                    state.copy(matches = updated)
                }
            }
        }
    }

    private fun startHourlyMoodWatcher() {
        viewModelScope.launch {
            while (isActive) {
                delay(15000)
                if (_uiState.value.isAutoMood) {
                    _uiState.update {
                        it.copy(
                            hourlyMood = ProvablyFair.getCurrentHourMood(),
                            minutesToShift = ProvablyFair.getMinutesToShift()
                        )
                    }
                }
            }
        }
    }

    // ACTIONS
    fun setActiveTab(tab: String) {
        _uiState.update { it.copy(activeTab = tab) }
    }

    fun setTheme(theme: AviatorTheme) {
        _uiState.update { it.copy(theme = theme) }
    }

    fun toggleMute() {
        _uiState.update { it.copy(isMuted = !it.isMuted) }
    }

    fun placeBet1(amount: Double, autoCashout: Boolean, autoMult: Double) {
        val user = _uiState.value.user
        if (amount > user.balance) return
        val newBal = user.balance - amount
        recordTx(TransactionType.AVIATOR_BET, -amount, "Aviator Bet #1 (%.0f KES)".format(amount), newBal)
        _uiState.update {
            it.copy(
                user = user.copy(balance = newBal),
                bet1 = it.bet1.copy(
                    amount = amount,
                    autoCashoutEnabled = autoCashout,
                    autoCashoutMultiplier = autoMult,
                    isPlaced = true,
                    hasCashedOut = false,
                    cashoutMultiplier = 0.0,
                    winAmount = 0.0
                )
            )
        }
    }

    fun cancelBet1() {
        val b = _uiState.value.bet1
        val user = _uiState.value.user
        val newBal = user.balance + b.amount
        recordTx(TransactionType.BONUS, b.amount, "Aviator Bet #1 Refund", newBal)
        _uiState.update {
            it.copy(
                user = user.copy(balance = newBal),
                bet1 = it.bet1.copy(isPlaced = false)
            )
        }
    }

    fun cashoutBet1() {
        val b = _uiState.value.bet1
        val mult = _uiState.value.currentMultiplier
        val win = b.amount * mult
        val user = _uiState.value.user
        val newBal = user.balance + win
        recordTx(TransactionType.AVIATOR_WIN, win, "Aviator Win @ %.2fx".format(mult), newBal)
        _uiState.update {
            it.copy(
                user = user.copy(balance = newBal),
                bet1 = b.copy(hasCashedOut = true, cashoutMultiplier = mult, winAmount = win)
            )
        }
    }

    fun placeBet2(amount: Double, autoCashout: Boolean, autoMult: Double) {
        val user = _uiState.value.user
        if (amount > user.balance) return
        val newBal = user.balance - amount
        recordTx(TransactionType.AVIATOR_BET, -amount, "Aviator Bet #2 (%.0f KES)".format(amount), newBal)
        _uiState.update {
            it.copy(
                user = user.copy(balance = newBal),
                bet2 = it.bet2.copy(
                    amount = amount,
                    autoCashoutEnabled = autoCashout,
                    autoCashoutMultiplier = autoMult,
                    isPlaced = true,
                    hasCashedOut = false,
                    cashoutMultiplier = 0.0,
                    winAmount = 0.0
                )
            )
        }
    }

    fun cancelBet2() {
        val b = _uiState.value.bet2
        val user = _uiState.value.user
        val newBal = user.balance + b.amount
        recordTx(TransactionType.BONUS, b.amount, "Aviator Bet #2 Refund", newBal)
        _uiState.update {
            it.copy(
                user = user.copy(balance = newBal),
                bet2 = it.bet2.copy(isPlaced = false)
            )
        }
    }

    fun cashoutBet2() {
        val b = _uiState.value.bet2
        val mult = _uiState.value.currentMultiplier
        val win = b.amount * mult
        val user = _uiState.value.user
        val newBal = user.balance + win
        recordTx(TransactionType.AVIATOR_WIN, win, "Aviator Win @ %.2fx".format(mult), newBal)
        _uiState.update {
            it.copy(
                user = user.copy(balance = newBal),
                bet2 = b.copy(hasCashedOut = true, cashoutMultiplier = mult, winAmount = win)
            )
        }
    }

    // SPORTS SLIP
    fun toggleSlipSelection(selection: SlipSelection) {
        _uiState.update { state ->
            val exists = state.activeSlip.any { it.matchId == selection.matchId && it.marketName == selection.marketName }
            val newSlip = if (exists) {
                state.activeSlip.filterNot { it.matchId == selection.matchId && it.marketName == selection.marketName }
            } else {
                state.activeSlip + selection
            }
            state.copy(activeSlip = newSlip)
        }
    }

    fun removeSlipSelection(matchId: String, marketName: String) {
        _uiState.update { state ->
            state.copy(activeSlip = state.activeSlip.filterNot { it.matchId == matchId && it.marketName == marketName })
        }
    }

    fun clearSlip() {
        _uiState.update { it.copy(activeSlip = emptyList()) }
    }

    fun placeSportsBet(stake: Double, totalOdds: Double, bonusPct: Int, potentialWin: Double) {
        val user = _uiState.value.user
        if (stake > user.balance || _uiState.value.activeSlip.isEmpty()) return
        val newBal = user.balance - stake
        recordTx(TransactionType.SPORTS_BET, -stake, "Sports Bet (${_uiState.value.activeSlip.size} Legs)", newBal)

        val bet = PlacedSportsBet(
            id = "sp-${System.currentTimeMillis()}",
            timestamp = System.currentTimeMillis(),
            selections = _uiState.value.activeSlip,
            stake = stake,
            totalOdds = totalOdds,
            bonusPercentage = bonusPct,
            potentialWin = potentialWin,
            status = BetStatus.PENDING
        )

        _uiState.update {
            it.copy(
                user = user.copy(balance = newBal),
                activeSlip = emptyList(),
                placedSportsBets = listOf(bet) + it.placedSportsBets
            )
        }
    }

    // CASHIER
    fun requestDeposit(amount: Double, code: String) {
        val user = _uiState.value.user
        val dep = PendingDeposit(
            id = "dep-${System.currentTimeMillis()}",
            phoneNumber = user.phoneNumber,
            username = user.username,
            amount = amount,
            code = code,
            timestamp = System.currentTimeMillis()
        )
        recordTx(TransactionType.PENDING_DEPOSIT, amount, "Deposit via M-PESA ($code - Pending)", user.balance)
        _uiState.update { it.copy(pendingDeposits = listOf(dep) + it.pendingDeposits) }
    }

    fun withdrawFunds(amount: Double, desc: String) {
        val user = _uiState.value.user
        if (amount > user.balance) return
        val newBal = max(0.0, user.balance - amount)
        recordTx(TransactionType.WITHDRAW_DEMO, -amount, desc, newBal)
        _uiState.update {
            it.copy(
                user = user.copy(
                    balance = newBal,
                    totalWithdrawnDemo = user.totalWithdrawnDemo + amount
                )
            )
        }
    }

    // ADMIN
    fun approveDeposit(id: String) {
        val dep = _uiState.value.pendingDeposits.find { it.id == id } ?: return
        val user = _uiState.value.user
        _uiState.update { state ->
            val updatedDeps = state.pendingDeposits.filterNot { it.id == id }
            val newBal = if (dep.phoneNumber == user.phoneNumber) user.balance + dep.amount else user.balance
            if (dep.phoneNumber == user.phoneNumber) {
                recordTx(TransactionType.DEPOSIT_DEMO, dep.amount, "Deposit Confirmed (${dep.code})", newBal)
            }
            val updatedUsers = state.registeredUsers.map { u ->
                if (u.phoneNumber == dep.phoneNumber) u.copy(balance = u.balance + dep.amount) else u
            }
            state.copy(
                pendingDeposits = updatedDeps,
                user = if (dep.phoneNumber == user.phoneNumber) user.copy(balance = newBal, totalDepositedDemo = user.totalDepositedDemo + dep.amount) else user,
                registeredUsers = updatedUsers
            )
        }
    }

    fun rejectDeposit(id: String) {
        _uiState.update { it.copy(pendingDeposits = it.pendingDeposits.filterNot { d -> d.id == id }) }
    }

    fun adminAddFunds(phone: String, amount: Double) {
        val user = _uiState.value.user
        val newBal = if (phone == user.phoneNumber) user.balance + amount else user.balance
        if (phone == user.phoneNumber) {
            recordTx(TransactionType.BONUS, amount, "Admin Credit (+%.0f KES)".format(amount), newBal)
        }
        _uiState.update { state ->
            val updatedUsers = state.registeredUsers.map { u ->
                if (u.phoneNumber == phone) u.copy(balance = u.balance + amount) else u
            }
            state.copy(
                user = if (phone == user.phoneNumber) user.copy(balance = newBal) else user,
                registeredUsers = updatedUsers
            )
        }
    }

    fun updateRtp(rate: Double) {
        _uiState.update { it.copy(rtpRate = rate) }
    }

    fun triggerSpecialFlight(mult: Double) {
        forcedMultiplier = mult
    }

    fun resetBalances() {
        val user = _uiState.value.user.copy(balance = 1000.0)
        _uiState.update {
            it.copy(
                user = user,
                transactions = emptyList()
            )
        }
    }

    fun updateUser(user: UserAccount) {
        _uiState.update { it.copy(user = user) }
    }

    fun setCashierOpen(open: Boolean, tab: String = "deposit") {
        _uiState.update { it.copy(isCashierOpen = open, cashierInitialTab = tab) }
    }

    fun setAdminOpen(open: Boolean) {
        _uiState.update { it.copy(isAdminOpen = open) }
    }

    fun setRulesOpen(open: Boolean) {
        _uiState.update { it.copy(isRulesOpen = open) }
    }

    fun setAccountOpen(open: Boolean) {
        _uiState.update { it.copy(isAccountOpen = open) }
    }

    private fun recordTx(type: TransactionType, amount: Double, desc: String, newBal: Double) {
        val tx = WalletTransaction(
            id = "tx-${System.currentTimeMillis()}-${(100..999).random()}",
            type = type,
            amount = amount,
            balanceAfter = newBal,
            description = desc,
            timestamp = System.currentTimeMillis()
        )
        _uiState.update { it.copy(transactions = listOf(tx) + it.transactions.take(49)) }
    }
}
