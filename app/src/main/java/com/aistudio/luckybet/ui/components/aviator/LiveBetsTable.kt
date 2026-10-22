package com.aistudio.luckybet.ui.components.aviator

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
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Person
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
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.aistudio.luckybet.data.model.SimulatedPlayer
import com.aistudio.luckybet.ui.theme.AccentAmber
import com.aistudio.luckybet.ui.theme.SuccessGreen

data class MyFlightRecord(
    val round: Long,
    val bet: Double,
    val mult: Double,
    val win: Double,
    val date: String
)

@Composable
fun LiveBetsTable(
    players: List<SimulatedPlayer>,
    currentMultiplier: Double,
    myHistory: List<MyFlightRecord>,
    modifier: Modifier = Modifier
) {
    var activeTab by remember { mutableStateOf("all") }

    Column(
        modifier = modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(14.dp))
            .background(Color(0xFF0F1522))
            .border(1.dp, Color(0xFF1E293B), RoundedCornerShape(14.dp))
            .padding(10.dp)
    ) {
        // Tabs
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Row(
                modifier = Modifier
                    .clip(RoundedCornerShape(8.dp))
                    .background(Color(0xFF070A0F))
                    .padding(2.dp)
            ) {
                Box(
                    modifier = Modifier
                        .clip(RoundedCornerShape(6.dp))
                        .background(if (activeTab == "all") Color(0xFF1E293B) else Color.Transparent)
                        .clickable { activeTab = "all" }
                        .padding(horizontal = 10.dp, vertical = 4.dp)
                ) {
                    Text(
                        text = "All Bets (${players.size})",
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        color = if (activeTab == "all") Color.White else Color(0xFF94A3B8)
                    )
                }

                Box(
                    modifier = Modifier
                        .clip(RoundedCornerShape(6.dp))
                        .background(if (activeTab == "my") Color(0xFF1E293B) else Color.Transparent)
                        .clickable { activeTab = "my" }
                        .padding(horizontal = 10.dp, vertical = 4.dp)
                ) {
                    Text(
                        text = "My Bets",
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        color = if (activeTab == "my") Color.White else Color(0xFF94A3B8)
                    )
                }
            }

            val totalWin = players.filter { it.cashedOut }.sumOf { it.winAmount ?: 0.0 }
            Text(
                text = "Won: %.0f KES".format(totalWin),
                fontSize = 10.sp,
                fontWeight = FontWeight.Bold,
                color = SuccessGreen
            )
        }

        Spacer(modifier = Modifier.height(8.dp))

        // Headers
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 4.dp, vertical = 2.dp),
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Text(text = "User", fontSize = 10.sp, color = Color(0xFF64748B), modifier = Modifier.weight(1.2f))
            Text(text = "Bet", fontSize = 10.sp, color = Color(0xFF64748B), modifier = Modifier.weight(0.8f))
            Text(text = "Mult", fontSize = 10.sp, color = Color(0xFF64748B), modifier = Modifier.weight(0.8f))
            Text(text = "Cash Out", fontSize = 10.sp, color = Color(0xFF64748B), modifier = Modifier.weight(1f))
        }

        Spacer(modifier = Modifier.height(4.dp))

        // Rows
        LazyColumn(
            modifier = Modifier
                .fillMaxWidth()
                .height(180.dp),
            verticalArrangement = Arrangement.spacedBy(4.dp)
        ) {
            if (activeTab == "all") {
                items(players, key = { it.id }) { player ->
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(6.dp))
                            .background(if (player.cashedOut) Color(0xFF042F1A) else Color(0xFF070A0F))
                            .padding(horizontal = 6.dp, vertical = 4.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Row(modifier = Modifier.weight(1.2f), verticalAlignment = Alignment.CenterVertically) {
                            Box(
                                modifier = Modifier
                                    .size(16.dp)
                                    .clip(CircleShape)
                                    .background(Color(0xFF1E293B)),
                                contentAlignment = Alignment.Center
                            ) {
                                Icon(
                                    Icons.Default.Person,
                                    contentDescription = "User",
                                    tint = AccentAmber,
                                    modifier = Modifier.size(10.dp)
                                )
                            }
                            Spacer(modifier = Modifier.width(4.dp))
                            Text(
                                text = player.username,
                                fontSize = 10.sp,
                                fontWeight = FontWeight.Bold,
                                color = Color(0xFFCBD5E1),
                                maxLines = 1
                            )
                        }

                        Text(
                            text = "%.0f".format(player.betAmount),
                            fontSize = 10.sp,
                            color = Color(0xFF94A3B8),
                            modifier = Modifier.weight(0.8f)
                        )

                        Text(
                            text = if (player.cashedOut) "%.2fx".format(player.cashedOutMultiplier ?: player.targetCashout) else "-",
                            fontSize = 10.sp,
                            fontWeight = FontWeight.Bold,
                            color = if (player.cashedOut) AccentAmber else Color(0xFF64748B),
                            modifier = Modifier.weight(0.8f)
                        )

                        Text(
                            text = if (player.cashedOut) "+%.0f KES".format(player.winAmount ?: 0.0) else "In Play",
                            fontSize = 10.sp,
                            fontWeight = FontWeight.Bold,
                            color = if (player.cashedOut) SuccessGreen else Color(0xFF64748B),
                            modifier = Modifier.weight(1f)
                        )
                    }
                }
            } else {
                if (myHistory.isEmpty()) {
                    item {
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(120.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                text = "No personal flight bets placed yet",
                                fontSize = 11.sp,
                                color = Color(0xFF64748B)
                            )
                        }
                    }
                } else {
                    items(myHistory) { rec ->
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clip(RoundedCornerShape(6.dp))
                                .background(if (rec.win > 0) Color(0xFF042F1A) else Color(0xFF1A0A0F))
                                .padding(horizontal = 6.dp, vertical = 4.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(
                                text = "#${rec.round}",
                                fontSize = 10.sp,
                                fontWeight = FontWeight.Bold,
                                color = Color(0xFFCBD5E1),
                                modifier = Modifier.weight(1.2f)
                            )
                            Text(
                                text = "%.0f KES".format(rec.bet),
                                fontSize = 10.sp,
                                color = Color(0xFF94A3B8),
                                modifier = Modifier.weight(0.8f)
                            )
                            Text(
                                text = if (rec.mult > 0) "%.2fx".format(rec.mult) else "Lost",
                                fontSize = 10.sp,
                                fontWeight = FontWeight.Bold,
                                color = if (rec.mult > 0) AccentAmber else Color(0xFFEF4444),
                                modifier = Modifier.weight(0.8f)
                            )
                            Text(
                                text = if (rec.win > 0) "+%.0f KES".format(rec.win) else "0 KES",
                                fontSize = 10.sp,
                                fontWeight = FontWeight.Bold,
                                color = if (rec.win > 0) SuccessGreen else Color(0xFF64748B),
                                modifier = Modifier.weight(1f)
                            )
                        }
                    }
                }
            }
        }
    }
}
