package com.aistudio.luckybet.ui.components.sports

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Schedule
import androidx.compose.material.icons.filled.SportsSoccer
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.aistudio.luckybet.data.model.FootballMatch
import com.aistudio.luckybet.data.model.MatchStatus
import com.aistudio.luckybet.data.model.SlipSelection
import com.aistudio.luckybet.ui.theme.AccentAmber
import com.aistudio.luckybet.ui.theme.PrimaryRed
import com.aistudio.luckybet.ui.theme.SuccessGreen

@Composable
fun SportsBettingView(
    matches: List<FootballMatch>,
    activeSlip: List<SlipSelection>,
    onToggleSelection: (SlipSelection) -> Unit,
    modifier: Modifier = Modifier
) {
    var activeCategory by remember { mutableStateOf("ALL") }

    val categories = listOf(
        Pair("ALL", "All Fixtures"),
        Pair("LIVE", "Live In-Play"),
        Pair("Premier League", "Premier League"),
        Pair("Kenya Premier League", "Kenya Premier League"),
        Pair("Champions League", "Champions League"),
        Pair("La Liga", "La Liga")
    )

    val liveCount = matches.count { it.status == MatchStatus.LIVE }

    val filteredMatches = matches.filter {
        when (activeCategory) {
            "ALL" -> true
            "LIVE" -> it.status == MatchStatus.LIVE
            else -> it.league == activeCategory
        }
    }

    Column(modifier = modifier.fillMaxWidth()) {
        // League selector pill strip
        LazyRow(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            items(categories) { (id, label) ->
                val isActive = activeCategory == id
                Box(
                    modifier = Modifier
                        .clip(RoundedCornerShape(10.dp))
                        .background(if (isActive) AccentAmber else Color(0xFF0F1522))
                        .border(1.dp, if (isActive) AccentAmber else Color(0xFF1E293B), RoundedCornerShape(10.dp))
                        .clickable { activeCategory = id }
                        .padding(horizontal = 12.dp, vertical = 7.dp)
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text(
                            text = label,
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold,
                            color = if (isActive) Color.Black else Color(0xFFE2E8F0)
                        )
                        if (id == "LIVE" && liveCount > 0) {
                            Spacer(modifier = Modifier.width(6.dp))
                            Box(
                                modifier = Modifier
                                    .clip(CircleShape)
                                    .background(if (isActive) Color.Black else PrimaryRed)
                                    .padding(horizontal = 5.dp, vertical = 1.dp)
                            ) {
                                Text(
                                    text = "$liveCount",
                                    fontSize = 9.sp,
                                    fontWeight = FontWeight.Black,
                                    color = if (isActive) AccentAmber else Color.White
                                )
                            }
                        }
                    }
                }
            }
        }

        Spacer(modifier = Modifier.height(10.dp))

        // Fixtures List
        LazyColumn(
            modifier = Modifier.fillMaxWidth(),
            verticalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            items(filteredMatches, key = { it.id }) { match ->
                MatchCard(
                    match = match,
                    activeSlip = activeSlip,
                    onToggleSelection = onToggleSelection
                )
            }
        }
    }
}

@Composable
private fun MatchCard(
    match: FootballMatch,
    activeSlip: List<SlipSelection>,
    onToggleSelection: (SlipSelection) -> Unit
) {
    val isLive = match.status == MatchStatus.LIVE

    Column(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(14.dp))
            .background(Color(0xFF0F1522))
            .border(1.dp, Color(0xFF1E293B), RoundedCornerShape(14.dp))
            .padding(12.dp)
            .testTag("match_card_${match.id}")
    ) {
        // League & Status
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = match.league.uppercase(),
                fontSize = 10.sp,
                fontWeight = FontWeight.Bold,
                color = Color(0xFF94A3B8)
            )

            if (isLive) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Box(
                        modifier = Modifier
                            .clip(RoundedCornerShape(10.dp))
                            .background(PrimaryRed.copy(alpha = 0.2f))
                            .border(1.dp, PrimaryRed.copy(alpha = 0.5f), RoundedCornerShape(10.dp))
                            .padding(horizontal = 6.dp, vertical = 2.dp)
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Box(
                                modifier = Modifier
                                    .size(6.dp)
                                    .clip(CircleShape)
                                    .background(PrimaryRed)
                            )
                            Spacer(modifier = Modifier.width(4.dp))
                            Text(
                                text = "LIVE",
                                fontSize = 9.sp,
                                fontWeight = FontWeight.Black,
                                color = PrimaryRed
                            )
                        }
                    }
                    Spacer(modifier = Modifier.width(6.dp))
                    Text(
                        text = "${match.minute}'",
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        color = AccentAmber
                    )
                }
            } else {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(
                        Icons.Default.Schedule,
                        contentDescription = "Upcoming",
                        tint = Color(0xFF64748B),
                        modifier = Modifier.size(12.dp)
                    )
                    Spacer(modifier = Modifier.width(3.dp))
                    Text(
                        text = match.startTime,
                        fontSize = 11.sp,
                        color = Color(0xFF94A3B8)
                    )
                }
            }
        }

        Spacer(modifier = Modifier.height(8.dp))

        // Teams & Score
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = match.homeTeam,
                    fontSize = 14.sp,
                    fontWeight = FontWeight.Bold,
                    color = Color.White
                )
                Spacer(modifier = Modifier.height(2.dp))
                Text(
                    text = match.awayTeam,
                    fontSize = 14.sp,
                    fontWeight = FontWeight.Bold,
                    color = Color.White
                )
            }

            if (isLive) {
                Column(horizontalAlignment = Alignment.End) {
                    Text(
                        text = "${match.homeScore}",
                        fontSize = 15.sp,
                        fontWeight = FontWeight.Black,
                        color = AccentAmber
                    )
                    Spacer(modifier = Modifier.height(2.dp))
                    Text(
                        text = "${match.awayScore}",
                        fontSize = 15.sp,
                        fontWeight = FontWeight.Black,
                        color = AccentAmber
                    )
                }
            }
        }

        Spacer(modifier = Modifier.height(10.dp))

        // 1 X 2 Primary Markets
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(6.dp)
        ) {
            MarketButton(
                label = "1 (Home)",
                odds = match.odds.home,
                isSelected = isOutcomeSelected(match.id, "1X2", "1 (Home Win)", activeSlip),
                onClick = {
                    onToggleSelection(
                        SlipSelection(
                            matchId = match.id,
                            matchTitle = "${match.homeTeam} vs ${match.awayTeam}",
                            marketName = "1X2",
                            outcomeName = "1 (Home Win)",
                            odds = match.odds.home
                        )
                    )
                },
                modifier = Modifier.weight(1f)
            )

            MarketButton(
                label = "X (Draw)",
                odds = match.odds.draw,
                isSelected = isOutcomeSelected(match.id, "1X2", "X (Draw)", activeSlip),
                onClick = {
                    onToggleSelection(
                        SlipSelection(
                            matchId = match.id,
                            matchTitle = "${match.homeTeam} vs ${match.awayTeam}",
                            marketName = "1X2",
                            outcomeName = "X (Draw)",
                            odds = match.odds.draw
                        )
                    )
                },
                modifier = Modifier.weight(1f)
            )

            MarketButton(
                label = "2 (Away)",
                odds = match.odds.away,
                isSelected = isOutcomeSelected(match.id, "1X2", "2 (Away Win)", activeSlip),
                onClick = {
                    onToggleSelection(
                        SlipSelection(
                            matchId = match.id,
                            matchTitle = "${match.homeTeam} vs ${match.awayTeam}",
                            marketName = "1X2",
                            outcomeName = "2 (Away Win)",
                            odds = match.odds.away
                        )
                    )
                },
                modifier = Modifier.weight(1f)
            )
        }

        Spacer(modifier = Modifier.height(6.dp))

        // Secondary Markets (Totals Over/Under 2.5 & GG/NG)
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(4.dp)
        ) {
            SmallMarketButton(
                label = "Ov 2.5",
                odds = match.odds.over25,
                isSelected = isOutcomeSelected(match.id, "Totals", "Over 2.5", activeSlip),
                onClick = {
                    onToggleSelection(
                        SlipSelection(match.id, "${match.homeTeam} vs ${match.awayTeam}", "Totals", "Over 2.5", match.odds.over25)
                    )
                },
                modifier = Modifier.weight(1f)
            )

            SmallMarketButton(
                label = "Un 2.5",
                odds = match.odds.under25,
                isSelected = isOutcomeSelected(match.id, "Totals", "Under 2.5", activeSlip),
                onClick = {
                    onToggleSelection(
                        SlipSelection(match.id, "${match.homeTeam} vs ${match.awayTeam}", "Totals", "Under 2.5", match.odds.under25)
                    )
                },
                modifier = Modifier.weight(1f)
            )

            SmallMarketButton(
                label = "GG",
                odds = match.odds.bothToScoreYes,
                isSelected = isOutcomeSelected(match.id, "GG/NG", "GG (Both Score)", activeSlip),
                onClick = {
                    onToggleSelection(
                        SlipSelection(match.id, "${match.homeTeam} vs ${match.awayTeam}", "GG/NG", "GG (Both Score)", match.odds.bothToScoreYes)
                    )
                },
                modifier = Modifier.weight(1f)
            )

            SmallMarketButton(
                label = "NG",
                odds = match.odds.bothToScoreNo,
                isSelected = isOutcomeSelected(match.id, "GG/NG", "NG (No Goal)", activeSlip),
                onClick = {
                    onToggleSelection(
                        SlipSelection(match.id, "${match.homeTeam} vs ${match.awayTeam}", "GG/NG", "NG (No Goal)", match.odds.bothToScoreNo)
                    )
                },
                modifier = Modifier.weight(1f)
            )
        }
    }
}

@Composable
private fun MarketButton(
    label: String,
    odds: Double,
    isSelected: Boolean,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    Box(
        modifier = modifier
            .clip(RoundedCornerShape(8.dp))
            .background(if (isSelected) AccentAmber else Color(0xFF070A0F))
            .border(1.dp, if (isSelected) AccentAmber else Color(0xFF1E293B), RoundedCornerShape(8.dp))
            .clickable { onClick() }
            .padding(vertical = 8.dp, horizontal = 4.dp),
        contentAlignment = Alignment.Center
    ) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Text(
                text = label,
                fontSize = 9.sp,
                fontWeight = FontWeight.Bold,
                color = if (isSelected) Color.Black.copy(alpha = 0.8f) else Color(0xFF94A3B8)
            )
            Text(
                text = "%.2f".format(odds),
                fontSize = 13.sp,
                fontWeight = FontWeight.Black,
                color = if (isSelected) Color.Black else Color.White
            )
        }
    }
}

@Composable
private fun SmallMarketButton(
    label: String,
    odds: Double,
    isSelected: Boolean,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    Box(
        modifier = modifier
            .clip(RoundedCornerShape(6.dp))
            .background(if (isSelected) SuccessGreen else Color(0xFF070A0F).copy(alpha = 0.7f))
            .border(1.dp, if (isSelected) SuccessGreen else Color(0xFF1E293B), RoundedCornerShape(6.dp))
            .clickable { onClick() }
            .padding(vertical = 4.dp, horizontal = 2.dp),
        contentAlignment = Alignment.Center
    ) {
        Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween,
            modifier = Modifier.padding(horizontal = 4.dp)
        ) {
            Text(
                text = label,
                fontSize = 9.sp,
                color = if (isSelected) Color.White else Color(0xFF94A3B8)
            )
            Spacer(modifier = Modifier.width(2.dp))
            Text(
                text = "%.2f".format(odds),
                fontSize = 10.sp,
                fontWeight = FontWeight.Bold,
                color = if (isSelected) Color.White else AccentAmber
            )
        }
    }
}

private fun isOutcomeSelected(
    matchId: String,
    marketName: String,
    outcomeName: String,
    activeSlip: List<SlipSelection>
): Boolean {
    return activeSlip.any { it.matchId == matchId && it.marketName == marketName && it.outcomeName == outcomeName }
}
