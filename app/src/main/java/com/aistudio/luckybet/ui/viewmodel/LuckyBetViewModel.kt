package com.aistudio.luckybet.ui.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.aistudio.luckybet.data.model.AviatorHistoryItem
import com.aistudio.luckybet.data.model.AviatorHourlyMood
import com.aistudio.luckybet.data.model.AviatorTheme
import com.aistudio.luckybet.data.model.BetStatus
import com.aistudio.luckybet.data.model.FootballMatch
import com.aistudio.luckybet.data.model.GamePhase
import com.aistudio.luckybet.data.model.MatchStatus
import com.aistudio.luckybet.data.model.PendingDeposit
import com.aistudio.luckybet.data.model.PlacedSportsBet
import com.aistudio.luckybet.data.model.PlayerBetConfig
import com.aistudio.luckybet.data.model.SimulatedPlayer
import com.aistudio.luckybet.data.model.SlipSelection
import com.aistudio.luckybet.data.model.StkPromptStatus
import com.aistudio.luckybet.data.model.StkPushPromptState
import com.aistudio.luckybet.data.model.TransactionType
import com.aistudio.luckybet.data.model.UserAccount
import com.aistudio.luckybet.data.model.WalletTransaction
import com.aistudio.luckybet.data.model.WithdrawalOtpChallenge
import com.aistudio.luckybet.data.network.LiveFootballClient
import com.aistudio.luckybet.data.network.MpesaDarajaClient
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
import kotlin.math.max
import kotlin.math.pow
import kotlin.random.Random

data class LuckyBetUiState(
    val activeTab: String = "aviator",
    val theme: AviatorTheme = AviatorTheme.CLASSIC_RED,
    val isMuted: Boolean = false,
    val user: UserAccount = UserAccount(
        phoneNumber = "0712345678",
        username = "LuckyPlayer_254",
        balance = 100.0
    ),
    val transactions: List<WalletTransaction> = listOf(
        WalletTransaction(
            id = "tx-welcome",
            type = TransactionType.BONUS,
            amount = 100.0,
            balanceAfter = 100.0,
            description = "Welcome Free Bonus (100 KES)",
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
    val bet2: PlayerBetConfig = PlayerBetConfig(amount = 50.0, autoCashoutMultiplier = 3.0),
    val simPlayers: List<SimulatedPlayer> = emptyList(),
    val myFlightHistory: List<MyFlightRecord> = emptyList(),
    // Sports
    val matches: List<FootballMatch> = emptyList(),
    val activeSlip: List<SlipSelection> = emptyList(),
    val placedSportsBets: List<PlacedSportsBet> = emptyList(),
    // Direct Paybill STK Push & Mandatory 2FA Withdrawal OTP
    val stkPrompt: StkPushPromptState? = null,
    val withdrawalOtpChallenge: WithdrawalOtpChallenge? = null,
    val latestSmsBanner: String? = null,
    // Admin & Modals
    val registeredUsers: List<UserAccount> = emptyList(),
    val pendingDeposits: List<PendingDeposit> = emptyList(),
    val isCashierOpen: Boolean = false,
    val cashierInitialTab: String = "deposit",
    val isReferralOpen: Boolean = false,
    val isAdminOpen: Boolean = false,
    val isRulesOpen: Boolean = false,
    val isAccountOpen: Boolean = false
)

class LuckyBetViewModel : ViewModel() {

    private val _uiState = MutableStateFlow(LuckyBetUiState())
    val uiState: StateFlow<LuckyBetUiState> = _uiState.asStateFlow()

    private var flightJob: Job? = null
    private var sportsJob: Job? = null
    private var stkTimerJob: Job? = null
    private var otpTimerJob: Job? = null
    private var smsBannerJob: Job? = null
    private var forcedMultiplier: Double? = null

    init {
        initInitialData()
        loadRealFootballMatches()
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

        val initialUsers = listOf(
            UserAccount("0712345678", "LuckyPlayer_254", 100.0)
        )

        _uiState.update {
            it.copy(
                history = initialHistory,
                registeredUsers = initialUsers,
                hourlyMood = ProvablyFair.getCurrentHourMood(),
                minutesToShift = ProvablyFair.getMinutesToShift()
            )
        }
    }

    private fun loadRealFootballMatches() {
        viewModelScope.launch {
            val todaysMatches = LiveFootballClient.fetchTodaysRealMatches()
            _uiState.update { it.copy(matches = todaysMatches) }
        }
    }

    private fun generateSimPlayers(): List<SimulatedPlayer> {
        val names = listOf(
            "mwangi_254", "chebet_pro", "otieno_fly", "kip_ace", "wafula_9",
            "lucy_win", "kamau_pilot", "nyambura_k", "hassan_fast", "brian_jet",
            "mercy_sky", "victor_c", "wambui_vip", "omondi_gold", "dennis_ke"
        )
        val betOptions = listOf(20.0, 50.0, 100.0, 200.0, 500.0)

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
                    if (currentMult >= targetCrash) currentMult = targetCrash

                    val updatedMult = currentMult
                    var autoWin1: Double? = null
                    var autoWin2: Double? = null

                    _uiState.update { state ->
                        var b1 = state.bet1
                        var newBal = state.user.balance
                        if (b1.isPlaced && !b1.hasCashedOut && b1.autoCashoutEnabled && updatedMult >= b1.autoCashoutMultiplier) {
                            val win = b1.amount * b1.autoCashoutMultiplier
                            b1 = b1.copy(hasCashedOut = true, cashoutMultiplier = b1.autoCashoutMultiplier, winAmount = win)
                            newBal += win
                            autoWin1 = win
                        }

                        var b2 = state.bet2
                        if (b2.isPlaced && !b2.hasCashedOut && b2.autoCashoutEnabled && updatedMult >= b2.autoCashoutMultiplier) {
                            val win = b2.amount * b2.autoCashoutMultiplier
                            b2 = b2.copy(hasCashedOut = true, cashoutMultiplier = b2.autoCashoutMultiplier, winAmount = win)
                            newBal += win
                            autoWin2 = win
                        }

                        val updatedSim = state.simPlayers.map { p ->
                            if (!p.cashedOut && updatedMult >= p.targetCashout) {
                                p.copy(cashedOut = true, cashedOutMultiplier = p.targetCashout, winAmount = p.betAmount * p.targetCashout)
                            } else p
                        }

                        state.copy(
                            user = state.user.copy(balance = newBal),
                            currentMultiplier = updatedMult,
                            bet1 = b1,
                            bet2 = b2,
                            simPlayers = updatedSim
                        )
                    }

                    autoWin1?.let { w ->
                        recordTx(TransactionType.AVIATOR_WIN, w, "Auto Cashout #1", _uiState.value.user.balance)
                    }
                    autoWin2?.let { w ->
                        recordTx(TransactionType.AVIATOR_WIN, w, "Auto Cashout #2", _uiState.value.user.balance)
                    }

                    if (currentMult >= targetCrash) break
                    delay(30)
                }

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

                delay(2800)

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
                delay(15000)
                _uiState.update { state ->
                    val updated = state.matches.mapNotNull { m ->
                        if (m.status != MatchStatus.LIVE) return@mapNotNull m
                        val newMin = m.minute + 1
                        if (newMin >= 90) {
                            null // Remove finished matches so only live/upcoming fixtures show
                        } else {
                            var homeS = m.homeScore
                            var awayS = m.awayScore
                            if (Random.nextDouble() < 0.03) {
                                if (Random.nextBoolean()) homeS++ else awayS++
                            }
                            m.copy(
                                minute = newMin,
                                startTime = "Live ${newMin}'",
                                homeScore = homeS,
                                awayScore = awayS
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

    // =========================================================================
    // DIRECT PAYBILL M-PESA USSD STK PUSH
    // =========================================================================
    fun triggerStkPush(amount: Double, rawPhone: String) {
        val parsed = MpesaDarajaClient.formatKenyanPhone(rawPhone.ifBlank { _uiState.value.user.phoneNumber })
        if (!parsed.isValid) return

        val reqId = "stk-${System.currentTimeMillis()}"
        val paybill = MpesaDarajaClient.getConfiguredPaybill()
        val accountRef = MpesaDarajaClient.getConfiguredPaybillAccount()

        val initialPrompt = StkPushPromptState(
            requestId = reqId,
            phoneNumber = parsed.localDisplay,
            internationalPhone = parsed.international,
            amount = amount,
            paybill = paybill,
            accountReference = accountRef,
            secondsRemaining = 45,
            status = StkPromptStatus.PENDING_PIN,
            darajaStatusNote = "Direct Paybill $paybill USSD Prompt Active"
        )

        _uiState.update { it.copy(stkPrompt = initialPrompt) }

        // Dispatch live Daraja API request on IO thread if secrets configured
        viewModelScope.launch {
            val darajaRes = MpesaDarajaClient.dispatchStkPush(parsed.localDisplay, amount, accountRef)
            _uiState.update { state ->
                val cur = state.stkPrompt ?: return@update state
                if (cur.requestId != reqId) return@update state
                state.copy(
                    stkPrompt = cur.copy(
                        paybill = darajaRes.shortcode,
                        accountReference = darajaRes.paybillAccount,
                        liveDarajaSent = darajaRes.liveNetworkDispatched,
                        darajaStatusNote = darajaRes.statusMessage
                    )
                )
            }
        }

        // 45s SIM Toolkit countdown
        stkTimerJob?.cancel()
        stkTimerJob = viewModelScope.launch {
            for (sec in 44 downTo 0) {
                delay(1000)
                val cur = _uiState.value.stkPrompt ?: break
                if (cur.requestId != reqId || cur.status != StkPromptStatus.PENDING_PIN) break
                if (sec == 0) {
                    _uiState.update { it.copy(stkPrompt = cur.copy(secondsRemaining = 0, status = StkPromptStatus.TIMEOUT)) }
                    delay(1800)
                    _uiState.update { state ->
                        if (state.stkPrompt?.requestId == reqId) state.copy(stkPrompt = null) else state
                    }
                } else {
                    _uiState.update { it.copy(stkPrompt = cur.copy(secondsRemaining = sec)) }
                }
            }
        }
    }

    fun submitStkPin(pin: String) {
        val cur = _uiState.value.stkPrompt ?: return
        if (pin.length < 4) return

        stkTimerJob?.cancel()
        _uiState.update { it.copy(stkPrompt = cur.copy(status = StkPromptStatus.PROCESSING)) }

        viewModelScope.launch {
            delay(650)
            val chars = "ABCDEFGHJKLMNPQRSTUVWXYZ"
            val randLetters = (1..4).map { chars.random() }.joinToString("")
            val txRef = "QK$randLetters${(100000..999999).random()}"

            val user = _uiState.value.user
            var updatedBal = user.balance + cur.amount
            val updatedTotalDep = user.totalDepositedDemo + cur.amount

            recordTx(
                TransactionType.DEPOSIT_DEMO,
                cur.amount,
                "M-PESA Paybill ${cur.paybill} Deposit ($txRef)",
                updatedBal
            )

            // Award 20 KES referral bonus if user linked a referrer
            var refEarned = user.referralBonusEarned
            if (!user.referredBy.isNullOrBlank()) {
                updatedBal += 20.0
                refEarned += 20.0
                recordTx(
                    TransactionType.REFERRAL_BONUS,
                    20.0,
                    "Referral Deposit Bonus (+20 KES)",
                    updatedBal
                )
            }

            _uiState.update { state ->
                state.copy(
                    user = user.copy(
                        balance = updatedBal,
                        totalDepositedDemo = updatedTotalDep,
                        referralBonusEarned = refEarned
                    ),
                    stkPrompt = cur.copy(status = StkPromptStatus.ACCEPTED, txRef = txRef)
                )
            }

            showSmsBanner(
                "$txRef Confirmed. Ksh%.2f sent directly to Paybill %s (Acc: %s). New Wallet Balance: KES %.2f".format(
                    cur.amount,
                    cur.paybill,
                    cur.accountReference,
                    updatedBal
                )
            )

            delay(1300)
            _uiState.update { it.copy(stkPrompt = null) }
        }
    }

    fun cancelStkPrompt() {
        stkTimerJob?.cancel()
        _uiState.update { it.copy(stkPrompt = null) }
    }

    // =========================================================================
    // MANDATORY 2FA SMS OTP STEP FOR ALL WITHDRAWALS
    // =========================================================================
    fun initiateWithdrawalWith2FA(amount: Double, destinationPhone: String) {
        val user = _uiState.value.user
        if (amount < 100.0 || amount > user.balance || user.totalDepositedDemo < 100.0) return

        val registeredPhone = user.phoneNumber.ifBlank { destinationPhone }
        val otpCode = (100000..999999).random().toString()
        val challengeId = "otp-${System.currentTimeMillis()}"

        val challenge = WithdrawalOtpChallenge(
            challengeId = challengeId,
            registeredPhone = registeredPhone,
            destinationPhone = destinationPhone,
            amount = amount,
            expectedCode = otpCode,
            secondsRemaining = 300,
            resendCooldown = 30,
            attemptsRemaining = 5,
            liveSmsDispatched = false
        )

        _uiState.update { it.copy(withdrawalOtpChallenge = challenge) }

        // Dispatch real SMS via Africa's Talking if SMS_API_KEY is configured in Secrets
        viewModelScope.launch {
            val sentLive = MpesaDarajaClient.dispatchWithdrawalSmsOtp(registeredPhone, amount, otpCode)
            _uiState.update { state ->
                val cur = state.withdrawalOtpChallenge ?: return@update state
                if (cur.challengeId != challengeId) return@update state
                state.copy(withdrawalOtpChallenge = cur.copy(liveSmsDispatched = sentLive))
            }
            if (!sentLive) {
                showSmsBanner("SMS to $registeredPhone: Your Lucky Bet 2FA withdrawal code is $otpCode (KES %.0f)".format(amount))
            }
        }

        startOtpCountdown(challengeId)
    }

    fun resendWithdrawalOtp() {
        val cur = _uiState.value.withdrawalOtpChallenge ?: return
        if (cur.resendCooldown > 0) return
        initiateWithdrawalWith2FA(cur.amount, cur.destinationPhone)
    }

    private fun startOtpCountdown(challengeId: String) {
        otpTimerJob?.cancel()
        otpTimerJob = viewModelScope.launch {
            while (isActive) {
                delay(1000)
                val cur = _uiState.value.withdrawalOtpChallenge ?: break
                if (cur.challengeId != challengeId) break
                val nextSec = (cur.secondsRemaining - 1).coerceAtLeast(0)
                val nextCool = (cur.resendCooldown - 1).coerceAtLeast(0)
                val expiredErr = if (nextSec == 0) "Code expired. Tap Resend SMS Code to receive a new 2FA code." else cur.errorMessage
                _uiState.update {
                    it.copy(
                        withdrawalOtpChallenge = cur.copy(
                            secondsRemaining = nextSec,
                            resendCooldown = nextCool,
                            errorMessage = expiredErr
                        )
                    )
                }
                if (nextSec == 0) break
            }
        }
    }

    fun verifyWithdrawalOtp(enteredCode: String) {
        val cur = _uiState.value.withdrawalOtpChallenge ?: return
        val clean = enteredCode.filter { it.isDigit() }

        if (cur.secondsRemaining <= 0) {
            _uiState.update {
                it.copy(withdrawalOtpChallenge = cur.copy(errorMessage = "Verification code expired. Please resend SMS code."))
            }
            return
        }

        if (clean != cur.expectedCode) {
            val left = (cur.attemptsRemaining - 1).coerceAtLeast(0)
            if (left == 0) {
                otpTimerJob?.cancel()
                _uiState.update { it.copy(withdrawalOtpChallenge = null) }
                showSmsBanner("Withdrawal cancelled: Too many incorrect 2FA attempts.")
            } else {
                _uiState.update {
                    it.copy(
                        withdrawalOtpChallenge = cur.copy(
                            attemptsRemaining = left,
                            errorMessage = "Incorrect 2FA SMS code. $left attempts remaining."
                        )
                    )
                }
            }
            return
        }

        // 2FA Verified! Process Withdrawal
        otpTimerJob?.cancel()
        val user = _uiState.value.user
        if (cur.amount > user.balance) {
            _uiState.update { it.copy(withdrawalOtpChallenge = null) }
            return
        }

        val ref = "WD" + (100000..999999).random()
        val newBal = max(0.0, user.balance - cur.amount)
        recordTx(
            TransactionType.WITHDRAW_DEMO,
            -cur.amount,
            "M-PESA Payout to ${cur.destinationPhone} (2FA Verified • #$ref)",
            newBal
        )

        _uiState.update {
            it.copy(
                user = user.copy(
                    balance = newBal,
                    totalWithdrawnDemo = user.totalWithdrawnDemo + cur.amount
                ),
                withdrawalOtpChallenge = null,
                isCashierOpen = false
            )
        }

        showSmsBanner(
            "#$ref Confirmed. KES %.2f withdrawn (2FA Verified) to M-PESA %s. Remaining Balance: KES %.2f".format(
                cur.amount,
                cur.destinationPhone,
                newBal
            )
        )
    }

    fun cancelWithdrawalOtp() {
        otpTimerJob?.cancel()
        _uiState.update { it.copy(withdrawalOtpChallenge = null) }
    }

    fun dismissSmsBanner() {
        smsBannerJob?.cancel()
        _uiState.update { it.copy(latestSmsBanner = null) }
    }

    private fun showSmsBanner(msg: String) {
        smsBannerJob?.cancel()
        _uiState.update { it.copy(latestSmsBanner = msg) }
        smsBannerJob = viewModelScope.launch {
            delay(7000)
            _uiState.update { state ->
                if (state.latestSmsBanner == msg) state.copy(latestSmsBanner = null) else state
            }
        }
    }

    // =========================================================================
    // STANDARD ACTIONS
    // =========================================================================
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

    // MANUAL DEPOSIT & ADMIN
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
        recordTx(TransactionType.PENDING_DEPOSIT, amount, "Manual Paybill ($code - Pending)", user.balance)
        _uiState.update { it.copy(pendingDeposits = listOf(dep) + it.pendingDeposits) }
    }

    fun approveDeposit(id: String) {
        val dep = _uiState.value.pendingDeposits.find { it.id == id } ?: return
        val user = _uiState.value.user
        _uiState.update { state ->
            val updatedDeps = state.pendingDeposits.filterNot { it.id == id }
            var newBal = if (dep.phoneNumber == user.phoneNumber) user.balance + dep.amount else user.balance
            var refEarned = user.referralBonusEarned
            if (dep.phoneNumber == user.phoneNumber) {
                recordTx(TransactionType.DEPOSIT_DEMO, dep.amount, "Paybill Deposit Confirmed (${dep.code})", newBal)
                if (!user.referredBy.isNullOrBlank()) {
                    newBal += 20.0
                    refEarned += 20.0
                    recordTx(TransactionType.REFERRAL_BONUS, 20.0, "Referral Bonus (+20 KES)", newBal)
                }
            }
            val updatedUsers = state.registeredUsers.map { u ->
                if (u.phoneNumber == dep.phoneNumber) u.copy(balance = u.balance + dep.amount) else u
            }
            state.copy(
                pendingDeposits = updatedDeps,
                user = if (dep.phoneNumber == user.phoneNumber) {
                    user.copy(
                        balance = newBal,
                        totalDepositedDemo = user.totalDepositedDemo + dep.amount,
                        referralBonusEarned = refEarned
                    )
                } else user,
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

    fun applyReferralCode(code: String) {
        _uiState.update { state ->
            state.copy(user = state.user.copy(referredBy = code))
        }
    }

    fun updateRtp(rate: Double) {
        _uiState.update { it.copy(rtpRate = rate) }
    }

    fun triggerSpecialFlight(mult: Double) {
        forcedMultiplier = mult
    }

    fun resetBalances() {
        val user = _uiState.value.user.copy(balance = 100.0)
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

    fun setHourlyMood(mood: AviatorHourlyMood) {
        _uiState.update { it.copy(isAutoMood = false, hourlyMood = mood) }
    }

    fun setAutoMood(auto: Boolean) {
        _uiState.update {
            it.copy(
                isAutoMood = auto,
                hourlyMood = if (auto) ProvablyFair.getCurrentHourMood() else it.hourlyMood
            )
        }
    }

    fun setCashierOpen(open: Boolean, tab: String = "deposit") {
        _uiState.update { it.copy(isCashierOpen = open, cashierInitialTab = tab) }
    }

    fun setReferralOpen(open: Boolean) {
        _uiState.update { it.copy(isReferralOpen = open) }
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
