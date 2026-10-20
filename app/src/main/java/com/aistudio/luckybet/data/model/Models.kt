package com.aistudio.luckybet.data.model

enum class GamePhase {
    WAITING,
    FLYING,
    CRASHED
}

enum class AviatorTheme(val displayName: String) {
    CLASSIC_RED("Classic Red"),
    CYBER_NEON("Cyber Neon"),
    SAHARA_GOLD("Sahara Gold")
}

enum class AviatorHourlyMood(val displayName: String, val rtp: Double, val description: String) {
    GENEROUS("Generous Hour", 0.99, "High multiplier frequency! Smooth skies with frequent high flights."),
    FAIR("Fair Hour", 0.97, "Standard statistical casino balance with 97% Return-to-Player."),
    GREEDY("Greedy Hour", 0.92, "Turbulent skies! Lower multipliers with quick sudden drop-offs.")
}

data class AviatorHistoryItem(
    val id: String,
    val roundNumber: Long,
    val multiplier: Double,
    val timestamp: Long,
    val hash: String
)

data class PlayerBetConfig(
    val amount: Double = 50.0,
    val autoCashoutEnabled: Boolean = false,
    val autoCashoutMultiplier: Double = 2.0,
    val isPlaced: Boolean = false,
    val hasCashedOut: Boolean = false,
    val cashoutMultiplier: Double = 0.0,
    val winAmount: Double = 0.0
)

data class SimulatedPlayer(
    val id: String,
    val username: String,
    val betAmount: Double,
    val targetCashout: Double,
    val cashedOut: Boolean = false,
    val cashedOutMultiplier: Double? = null,
    val winAmount: Double? = null
)

enum class MatchStatus {
    LIVE,
    UPCOMING,
    FINISHED
}

data class MatchOdds(
    val home: Double,
    val draw: Double,
    val away: Double,
    val over25: Double,
    val under25: Double,
    val bothToScoreYes: Double,
    val bothToScoreNo: Double
)

data class FootballMatch(
    val id: String,
    val league: String,
    val homeTeam: String,
    val awayTeam: String,
    val homeScore: Int,
    val awayScore: Int,
    val minute: Int,
    val status: MatchStatus,
    val startTime: String,
    val odds: MatchOdds
)

data class SlipSelection(
    val matchId: String,
    val matchTitle: String,
    val marketName: String,
    val outcomeName: String,
    val odds: Double
)

enum class BetStatus {
    PENDING,
    WON,
    LOST
}

data class PlacedSportsBet(
    val id: String,
    val timestamp: Long,
    val selections: List<SlipSelection>,
    val stake: Double,
    val totalOdds: Double,
    val bonusPercentage: Int,
    val potentialWin: Double,
    val status: BetStatus = BetStatus.PENDING
)

enum class TransactionType {
    BONUS,
    DEPOSIT_DEMO,
    WITHDRAW_DEMO,
    AVIATOR_WIN,
    AVIATOR_BET,
    SPORTS_BET,
    SPORTS_WIN,
    PENDING_DEPOSIT
}

data class WalletTransaction(
    val id: String,
    val type: TransactionType,
    val amount: Double,
    val balanceAfter: Double,
    val description: String,
    val timestamp: Long
)

enum class DepositStatus {
    PENDING,
    APPROVED,
    REJECTED
}

data class PendingDeposit(
    val id: String,
    val phoneNumber: String,
    val username: String,
    val amount: Double,
    val code: String,
    val timestamp: Long,
    val status: DepositStatus = DepositStatus.PENDING
)

data class UserAccount(
    val phoneNumber: String,
    val username: String,
    val balance: Double = 500.0,
    val joinedAt: Long = System.currentTimeMillis(),
    val initialBonusClaimed: Boolean = true,
    val totalDepositedDemo: Double = 0.0,
    val totalWithdrawnDemo: Double = 0.0
)
