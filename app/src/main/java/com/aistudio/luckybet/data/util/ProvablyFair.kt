package com.aistudio.luckybet.data.util

import com.aistudio.luckybet.data.model.AviatorHourlyMood
import java.security.MessageDigest
import java.util.Calendar
import kotlin.math.floor
import kotlin.math.max
import kotlin.math.min
import kotlin.math.pow
import kotlin.random.Random

object ProvablyFair {

    fun sha256(message: String): String {
        val digest = MessageDigest.getInstance("SHA-256")
        val hash = digest.digest(message.toByteArray(Charsets.UTF_8))
        return hash.joinToString("") { "%02x".format(it) }
    }

    fun getCurrentHourMood(): AviatorHourlyMood {
        val calendar = Calendar.getInstance()
        val hour = calendar.get(Calendar.HOUR_OF_DAY)
        val cycle = listOf(
            AviatorHourlyMood.FAIR,
            AviatorHourlyMood.GENEROUS,
            AviatorHourlyMood.GREEDY
        )
        return cycle[hour % 3]
    }

    fun getMinutesToShift(): Int {
        val calendar = Calendar.getInstance()
        val currentMinute = calendar.get(Calendar.MINUTE)
        return max(1, 60 - currentMinute)
    }

    fun generateCrashPoint(
        rtpRate: Double = 0.97,
        mood: AviatorHourlyMood? = null
    ): Pair<Double, Double> {
        val effectiveRtp = when (mood) {
            AviatorHourlyMood.GENEROUS -> 0.99
            AviatorHourlyMood.GREEDY -> 0.92
            AviatorHourlyMood.FAIR -> 0.97
            null -> rtpRate
        }

        val instantCrashProbability = 1.0 - effectiveRtp
        val r = Random.nextDouble()

        if (r < instantCrashProbability) {
            return Pair(1.00, r)
        }

        val normalizedR = (r - instantCrashProbability) / (1.0 - instantCrashProbability)

        val rawMult: Double = when (mood) {
            AviatorHourlyMood.GENEROUS -> 1.02 / (1.0 - normalizedR).pow(1.08)
            AviatorHourlyMood.GREEDY -> 0.96 / (1.0 - normalizedR).pow(0.92)
            else -> 0.99 / (1.0 - normalizedR)
        }

        val formattedMult = max(1.01, min(300.00, floor(rawMult * 100.0) / 100.0))
        return Pair(formattedMult, r)
    }
}
