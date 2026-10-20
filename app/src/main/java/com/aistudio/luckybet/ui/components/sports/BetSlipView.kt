package com.aistudio.luckybet.ui.components.sports

import androidx.compose.animation.AnimatedVisibility
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
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AutoAwesome
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.Receipt
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableDoubleStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.aistudio.luckybet.data.model.BetStatus
import com.aistudio.luckybet.data.model.PlacedSportsBet
import com.aistudio.luckybet.data.model.SlipSelection
import com.aistudio.luckybet.ui.theme.AccentAmber
import com.aistudio.luckybet.ui.theme.PrimaryRed
import com.aistudio.luckybet.ui.theme.SuccessGreen
import com.aistudio.luckybet.ui.theme.SuccessGreenDark
import kotlin.math.min

@Composable
fun BetSlipView(
    selections: List<SlipSelection>,
    placedBets: List<PlacedSportsBet>,
    userBalance: Double,
    onRemoveSelection: (matchId: String, marketName: String) -> Unit,
    onClearSlip: () -> Unit,
    onPlaceBet: (stake: Double, totalOdds: Double, bonusPct: Int, potentialWin: Double) -> Unit,
    modifier: Modifier = Modifier
) {
    var stake by remember { mutableDoubleStateOf(100.0) }
    var activeTab by remember { mutableStateOf<"slip" | "history">("slip") }

    val totalOdds = if (selections.isEmpty()) 1.0 else {
        var prod = 1.0
        selections.forEach { prod *= it.odds }
        Math.round(prod * 100.0) / 100.0
    }

    val bonusPct = when (selections.size) {
        0, 1 -> 0
        2 -> 5
        3 -> 10
        4 -> 15
        else -> 25
    }

    val baseWin = stake * totalOdds
    val potentialWin = baseWin * (1.0 + bonusPct / 100.0)

    Column(
        modifier = modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(16.dp))
            .background(Color(0xFF0F1522))
            .border(1.dp, Color(0xFF1E293B), RoundedCornerShape(16.dp))
            .padding(12.dp)
            .testTag("bet_slip_container")
    ) {
        // Header
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Row(
                modifier = Modifier
                    .clip(RoundedCornerShape(8.dp))
                    .background(Color(0xFF070A0F))
                    .padding(2.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Box(
                    modifier = Modifier
                        .clip(RoundedCornerShape(6.dp))
                        .background(if (activeTab == "slip") AccentAmber else Color.Transparent)
                        .clickable { activeTab = "slip" }
                        .padding(horizontal = 10.dp, vertical = 4.dp)
                ) {
                    Text(
                        text = "Slip (${selections.size})",
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        color = if (activeTab == "slip") Color.Black else Color(0xFF94A3B8)
                    )
                }

                Box(
                    modifier = Modifier
                        .clip(RoundedCornerShape(6.dp))
                        .background(if (activeTab == "history") AccentAmber else Color.Transparent)
                        .clickable { activeTab = "history" }
                        .padding(horizontal = 10.dp, vertical = 4.dp)
                ) {
                    Text(
                        text = "My Bets (${placedBets.size})",
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        color = if (activeTab == "history") Color.Black else Color(0xFF94A3B8)
                    )
                }
            }

            if (activeTab == "slip" && selections.isNotEmpty()) {
                IconButton(
                    onClick = onClearSlip,
                    modifier = Modifier.size(28.dp)
                ) {
                    Icon(
                        imageVector = Icons.Default.Delete,
                        contentDescription = "Clear Slip",
                        tint = PrimaryRed,
                        modifier = Modifier.size(16.dp)
                    )
                }
            }
        }

        Spacer(modifier = Modifier.height(10.dp))

        if (activeTab == "slip") {
            if (selections.isEmpty()) {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(100.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = "Tap odds from any football match to build your bet slip!",
                        fontSize = 12.sp,
                        color = Color(0xFF64748B),
                        textAlign = androidx.compose.ui.text.style.TextAlign.Center
                    )
                }
            } else {
                // Selections List
                LazyColumn(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(140.dp),
                    verticalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    items(selections, key = { "${it.matchId}-${it.marketName}" }) { sel ->
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clip(RoundedCornerShape(8.dp))
                                .background(Color(0xFF070A0F))
                                .padding(8.dp),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Column(modifier = Modifier.weight(1f)) {
                                Text(
                                    text = sel.matchTitle,
                                    fontSize = 11.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = Color.White
                                )
                                Text(
                                    text = "${sel.marketName}: ${sel.outcomeName}",
                                    fontSize = 10.sp,
                                    color = Color(0xFF94A3B8)
                                )
                            }
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Text(
                                    text = "%.2f".format(sel.odds),
                                    fontSize = 13.sp,
                                    fontWeight = FontWeight.Black,
                                    color = AccentAmber
                                )
                                Spacer(modifier = Modifier.width(6.dp))
                                Icon(
                                    imageVector = Icons.Default.Close,
                                    contentDescription = "Remove",
                                    tint = Color(0xFF64748B),
                                    modifier = Modifier
                                        .size(16.dp)
                                        .clickable { onRemoveSelection(sel.matchId, sel.marketName) }
                                )
                            }
                        }
                    }
                }

                // Accumulator Multi-Boost Tag
                if (bonusPct > 0) {
                    Spacer(modifier = Modifier.height(8.dp))
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(8.dp))
                            .background(AccentAmber.copy(alpha = 0.15f))
                            .border(1.dp, AccentAmber.copy(alpha = 0.4f), RoundedCornerShape(8.dp))
                            .padding(horizontal = 10.dp, vertical = 6.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(
                                Icons.Default.AutoAwesome,
                                contentDescription = "Bonus",
                                tint = AccentAmber,
                                modifier = Modifier.size(14.dp)
                            )
                            Spacer(modifier = Modifier.width(4.dp))
                            Text(
                                text = "${selections.size} Legs Multi-Boost:",
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold,
                                color = AccentAmber
                            )
                        }
                        Text(
                            text = "+$bonusPct% Boost",
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Black,
                            color = AccentAmber
                        )
                    }
                }

                Spacer(modifier = Modifier.height(8.dp))

                // Total Odds & Stake
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Text(text = "Total Odds:", fontSize = 12.sp, color = Color(0xFF94A3B8))
                    Text(
                        text = "%.2f".format(totalOdds),
                        fontSize = 15.sp,
                        fontWeight = FontWeight.Black,
                        color = Color.White
                    )
                }

                Spacer(modifier = Modifier.height(6.dp))

                // Quick stake chips
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    listOf(50.0, 100.0, 200.0, 500.0).forEach { amt ->
                        Box(
                            modifier = Modifier
                                .weight(1f)
                                .clip(RoundedCornerShape(6.dp))
                                .background(Color(0xFF1E293B))
                                .clickable { stake = min(userBalance, amt) }
                                .padding(vertical = 4.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                text = "+%.0f".format(amt),
                                fontSize = 10.sp,
                                fontWeight = FontWeight.Bold,
                                color = Color.White
                            )
                        }
                    }
                }

                Spacer(modifier = Modifier.height(8.dp))

                // Potential Win Display
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(8.dp))
                        .background(Color(0xFF070A0F))
                        .padding(horizontal = 10.dp, vertical = 8.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(text = "Potential Win:", fontSize = 11.sp, color = Color(0xFF94A3B8))
                    Text(
                        text = "%.2f KES".format(potentialWin),
                        fontSize = 15.sp,
                        fontWeight = FontWeight.Black,
                        color = SuccessGreen
                    )
                }

                Spacer(modifier = Modifier.height(10.dp))

                // Place Bet Button
                Button(
                    onClick = {
                        if (stake > 0 && stake <= userBalance && selections.isNotEmpty()) {
                            onPlaceBet(stake, totalOdds, bonusPct, potentialWin)
                        }
                    },
                    enabled = stake > 0 && stake <= userBalance && selections.isNotEmpty(),
                    colors = ButtonDefaults.buttonColors(containerColor = Color.Transparent),
                    shape = RoundedCornerShape(10.dp),
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(44.dp)
                        .background(
                            brush = Brush.horizontalGradient(
                                colors = listOf(SuccessGreen, SuccessGreenDark)
                            ),
                            shape = RoundedCornerShape(10.dp)
                        )
                        .testTag("place_sports_bet_button")
                ) {
                    Text(
                        text = "PLACE BET (%.0f KES)".format(stake),
                        fontSize = 13.sp,
                        fontWeight = FontWeight.Black,
                        color = Color.White
                    )
                }
            }
        } else {
            // My Placed Bets History
            if (placedBets.isEmpty()) {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(120.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = "No sports bets placed yet",
                        fontSize = 12.sp,
                        color = Color(0xFF64748B)
                    )
                }
            } else {
                LazyColumn(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(200.dp),
                    verticalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    items(placedBets, key = { it.id }) { bet ->
                        Column(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clip(RoundedCornerShape(8.dp))
                                .background(Color(0xFF070A0F))
                                .padding(8.dp)
                        ) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween
                            ) {
                                Text(
                                    text = "${bet.selections.size} Legs Accumulator",
                                    fontSize = 11.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = Color.White
                                )
                                val (statusCol, statusTxt) = when (bet.status) {
                                    BetStatus.WON -> Pair(SuccessGreen, "WON")
                                    BetStatus.LOST -> Pair(PrimaryRed, "LOST")
                                    BetStatus.PENDING -> Pair(AccentAmber, "IN PLAY")
                                }
                                Text(
                                    text = statusTxt,
                                    fontSize = 10.sp,
                                    fontWeight = FontWeight.Black,
                                    color = statusCol
                                )
                            }
                            Spacer(modifier = Modifier.height(4.dp))
                            Text(
                                text = bet.selections.joinToString(" • ") { it.outcomeName },
                                fontSize = 9.sp,
                                color = Color(0xFF94A3B8)
                            )
                            Spacer(modifier = Modifier.height(4.dp))
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween
                            ) {
                                Text(
                                    text = "Stake: %.0f KES".format(bet.stake),
                                    fontSize = 10.sp,
                                    color = Color(0xFF64748B)
                                )
                                Text(
                                    text = "Win: %.2f KES".format(bet.potentialWin),
                                    fontSize = 11.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = SuccessGreen
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}
