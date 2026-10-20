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
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.History
import androidx.compose.material.icons.filled.Shield
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.aistudio.luckybet.data.model.AviatorHistoryItem
import com.aistudio.luckybet.data.model.AviatorHourlyMood
import com.aistudio.luckybet.ui.theme.AccentAmber
import com.aistudio.luckybet.ui.theme.PurpleAccent
import com.aistudio.luckybet.ui.theme.SuccessGreen

@Composable
fun FlightHistoryBar(
    history: List<AviatorHistoryItem>,
    hourlyMood: AviatorHourlyMood,
    minutesToShift: Int,
    modifier: Modifier = Modifier
) {
    var selectedItem by remember { mutableStateOf<AviatorHistoryItem?>(null) }

    Row(
        modifier = modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(12.dp))
            .background(Color(0xFF0F1522))
            .border(1.dp, Color(0xFF1E293B), RoundedCornerShape(12.dp))
            .padding(horizontal = 10.dp, vertical = 6.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Icon(
            imageVector = Icons.Default.History,
            contentDescription = "History",
            tint = Color(0xFF94A3B8),
            modifier = Modifier.size(16.dp)
        )

        Spacer(modifier = Modifier.width(6.dp))

        LazyRow(
            modifier = Modifier.weight(1f),
            horizontalArrangement = Arrangement.spacedBy(6.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            items(history, key = { it.id }) { item ->
                val (chipBg, chipText) = when {
                    item.multiplier >= 10.0 -> Pair(Color(0xFF382305), AccentAmber)
                    item.multiplier >= 2.0 -> Pair(Color(0xFF28133E), PurpleAccent)
                    else -> Pair(Color(0xFF0B1F33), Color(0xFF38BDF8))
                }

                Box(
                    modifier = Modifier
                        .clip(RoundedCornerShape(6.dp))
                        .background(chipBg)
                        .border(1.dp, chipText.copy(alpha = 0.4f), RoundedCornerShape(6.dp))
                        .clickable { selectedItem = item }
                        .padding(horizontal = 8.dp, vertical = 3.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = "%.2fx".format(item.multiplier),
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        color = chipText
                    )
                }
            }
        }

        Spacer(modifier = Modifier.width(8.dp))

        // Hourly Mood Chip
        val (moodBg, moodCol) = when (hourlyMood) {
            AviatorHourlyMood.GENEROUS -> Pair(SuccessGreen.copy(alpha = 0.2f), SuccessGreen)
            AviatorHourlyMood.GREEDY -> Pair(Color(0xFFEF4444).copy(alpha = 0.2f), Color(0xFFEF4444))
            AviatorHourlyMood.FAIR -> Pair(AccentAmber.copy(alpha = 0.2f), AccentAmber)
        }

        Row(
            modifier = Modifier
                .clip(RoundedCornerShape(16.dp))
                .background(moodBg)
                .border(1.dp, moodCol.copy(alpha = 0.4f), RoundedCornerShape(16.dp))
                .padding(horizontal = 8.dp, vertical = 3.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Box(
                modifier = Modifier
                    .size(6.dp)
                    .clip(CircleShape)
                    .background(moodCol)
            )
            Spacer(modifier = Modifier.width(4.dp))
            Text(
                text = "${hourlyMood.displayName.take(8).uppercase()} (${minutesToShift}M)",
                fontSize = 9.sp,
                fontWeight = FontWeight.Black,
                color = moodCol
            )
        }
    }

    // Provably Fair Audit Dialog
    selectedItem?.let { item ->
        AlertDialog(
            onDismissRequest = { selectedItem = null },
            icon = {
                Icon(
                    imageVector = Icons.Default.Shield,
                    contentDescription = "Provably Fair",
                    tint = AccentAmber
                )
            },
            title = {
                Text("Provably Fair Audit", fontWeight = FontWeight.Bold)
            },
            text = {
                Column(modifier = Modifier.fillMaxWidth()) {
                    Text(
                        text = "Round #${item.roundNumber}",
                        fontWeight = FontWeight.Bold,
                        fontSize = 14.sp,
                        color = Color.White
                    )
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = "Multiplier: %.2fx".format(item.multiplier),
                        fontWeight = FontWeight.Black,
                        fontSize = 18.sp,
                        color = AccentAmber
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        text = "SHA-256 Hash Verification:",
                        fontSize = 11.sp,
                        color = Color(0xFF94A3B8)
                    )
                    Text(
                        text = item.hash,
                        fontSize = 10.sp,
                        fontFamily = FontFamily.Monospace,
                        color = Color(0xFFE2E8F0),
                        modifier = Modifier
                            .background(Color(0xFF070A0F), RoundedCornerShape(6.dp))
                            .padding(6.dp)
                    )
                }
            },
            confirmButton = {
                TextButton(onClick = { selectedItem = null }) {
                    Text("Close", color = AccentAmber)
                }
            },
            containerColor = Color(0xFF131824)
        )
    }
}
