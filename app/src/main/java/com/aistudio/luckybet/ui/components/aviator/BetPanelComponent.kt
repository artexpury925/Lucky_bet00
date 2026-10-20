package com.aistudio.luckybet.ui.components.aviator

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
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Bolt
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Remove
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Checkbox
import androidx.compose.material3.CheckboxDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
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
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.aistudio.luckybet.data.model.GamePhase
import com.aistudio.luckybet.data.model.PlayerBetConfig
import com.aistudio.luckybet.ui.theme.AccentAmber
import com.aistudio.luckybet.ui.theme.AccentAmberDark
import com.aistudio.luckybet.ui.theme.PrimaryRed
import com.aistudio.luckybet.ui.theme.PrimaryRedDark
import com.aistudio.luckybet.ui.theme.SuccessGreen
import com.aistudio.luckybet.ui.theme.SuccessGreenDark
import kotlin.math.max
import kotlin.math.min

@Composable
fun BetPanelComponent(
    id: String,
    title: String,
    phase: GamePhase,
    currentMultiplier: Double,
    betConfig: PlayerBetConfig,
    userBalance: Double,
    onPlaceBet: (amount: Double, autoCashout: Boolean, autoMult: Double) -> Unit,
    onCancelBet: () -> Unit,
    onCashOut: () -> Unit,
    modifier: Modifier = Modifier
) {
    var amount by remember(betConfig.amount) { mutableDoubleStateOf(betConfig.amount) }
    var autoCashout by remember(betConfig.autoCashoutEnabled) { mutableStateOf(betConfig.autoCashoutEnabled) }
    var autoMultiplier by remember(betConfig.autoCashoutMultiplier) { mutableDoubleStateOf(betConfig.autoCashoutMultiplier) }
    var isAutoTab by remember { mutableStateOf(false) }

    val presets = listOf(20.0, 50.0, 100.0, 200.0, 500.0)
    val livePotentialWin = "%.2f".format(amount * currentMultiplier)

    Column(
        modifier = modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(14.dp))
            .border(1.dp, Color(0xFF1E293B), RoundedCornerShape(14.dp))
            .background(Color(0xFF0F1522))
            .padding(12.dp)
            .testTag("bet_panel_$id")
    ) {
        // Panel Header & Tabs
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = title,
                fontSize = 11.sp,
                fontWeight = FontWeight.Bold,
                color = Color(0xFF94A3B8)
            )

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
                        .background(if (!isAutoTab) Color(0xFF1E293B) else Color.Transparent)
                        .clickable { isAutoTab = false }
                        .padding(horizontal = 10.dp, vertical = 4.dp)
                ) {
                    Text(
                        text = "Bet",
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        color = if (!isAutoTab) Color.White else Color(0xFF94A3B8)
                    )
                }

                Box(
                    modifier = Modifier
                        .clip(RoundedCornerShape(6.dp))
                        .background(if (isAutoTab) AccentAmber.copy(alpha = 0.2f) else Color.Transparent)
                        .clickable { isAutoTab = true }
                        .padding(horizontal = 10.dp, vertical = 4.dp)
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(
                            imageVector = Icons.Default.Bolt,
                            contentDescription = "Auto",
                            tint = if (isAutoTab) AccentAmber else Color(0xFF94A3B8),
                            modifier = Modifier.size(12.dp)
                        )
                        Spacer(modifier = Modifier.width(2.dp))
                        Text(
                            text = "Auto",
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold,
                            color = if (isAutoTab) AccentAmber else Color(0xFF94A3B8)
                        )
                    }
                }
            }
        }

        Spacer(modifier = Modifier.height(10.dp))

        // Amount Stepper & Inputs
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(10.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column(modifier = Modifier.weight(1f)) {
                // Stepper Row
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(8.dp))
                        .background(Color(0xFF070A0F))
                        .border(1.dp, Color(0xFF1E293B), RoundedCornerShape(8.dp))
                        .padding(2.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    IconButton(
                        onClick = { amount = max(10.0, amount - 10.0) },
                        enabled = !betConfig.isPlaced || phase != GamePhase.FLYING,
                        modifier = Modifier.size(32.dp)
                    ) {
                        Icon(Icons.Default.Remove, contentDescription = "Minus", tint = Color.White)
                    }

                    Text(
                        text = "%.0f".format(amount),
                        fontSize = 16.sp,
                        fontWeight = FontWeight.Black,
                        color = Color.White
                    )

                    IconButton(
                        onClick = { amount = min(userBalance, amount + 10.0) },
                        enabled = !betConfig.isPlaced || phase != GamePhase.FLYING,
                        modifier = Modifier.size(32.dp)
                    ) {
                        Icon(Icons.Default.Add, contentDescription = "Plus", tint = Color.White)
                    }
                }

                Spacer(modifier = Modifier.height(6.dp))

                // Presets
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(4.dp)
                ) {
                    presets.forEach { preset ->
                        Box(
                            modifier = Modifier
                                .weight(1f)
                                .clip(RoundedCornerShape(6.dp))
                                .background(if (amount == preset) AccentAmber.copy(alpha = 0.25f) else Color(0xFF1E293B))
                                .border(
                                    1.dp,
                                    if (amount == preset) AccentAmber else Color.Transparent,
                                    RoundedCornerShape(6.dp)
                                )
                                .clickable { amount = min(userBalance, preset) }
                                .padding(vertical = 4.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                text = "%.0f".format(preset),
                                fontSize = 10.sp,
                                fontWeight = FontWeight.Bold,
                                color = if (amount == preset) AccentAmber else Color(0xFFE2E8F0)
                            )
                        }
                    }
                }

                // Auto Cashout options
                AnimatedVisibility(visible = isAutoTab) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(top = 6.dp)
                            .clip(RoundedCornerShape(6.dp))
                            .background(Color(0xFF070A0F))
                            .padding(4.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Checkbox(
                                checked = autoCashout,
                                onCheckedChange = { autoCashout = it },
                                colors = CheckboxDefaults.colors(checkedColor = AccentAmber)
                            )
                            Text(
                                text = "Auto Cashout",
                                fontSize = 11.sp,
                                color = Color.White
                            )
                        }

                        OutlinedTextField(
                            value = "%.1f".format(autoMultiplier),
                            onValueChange = { str ->
                                val v = str.toDoubleOrNull()
                                if (v != null) autoMultiplier = v
                            },
                            enabled = autoCashout,
                            modifier = Modifier.width(65.dp),
                            singleLine = true,
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedTextColor = AccentAmber,
                                unfocusedTextColor = AccentAmber,
                                focusedBorderColor = AccentAmber,
                                unfocusedBorderColor = Color(0xFF1E293B)
                            )
                        )
                    }
                }
            }

            // Big Action / Cashout Button
            Box(
                modifier = Modifier
                    .weight(0.9f)
                    .height(84.dp)
            ) {
                when {
                    // Not placed yet
                    !betConfig.isPlaced -> {
                        Button(
                            onClick = {
                                if (amount > 0 && amount <= userBalance && phase != GamePhase.FLYING) {
                                    onPlaceBet(amount, autoCashout, autoMultiplier)
                                }
                            },
                            enabled = phase != GamePhase.FLYING && amount > 0 && amount <= userBalance,
                            colors = ButtonDefaults.buttonColors(
                                containerColor = Color.Transparent,
                                disabledContainerColor = Color(0xFF1E293B)
                            ),
                            shape = RoundedCornerShape(12.dp),
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(84.dp)
                                .background(
                                    brush = Brush.horizontalGradient(
                                        colors = listOf(SuccessGreen, SuccessGreenDark)
                                    ),
                                    shape = RoundedCornerShape(12.dp)
                                )
                                .testTag("place_bet_$id")
                        ) {
                            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                Text(
                                    text = if (phase == GamePhase.FLYING) "WAIT NEXT" else "BET",
                                    fontSize = 16.sp,
                                    fontWeight = FontWeight.Black,
                                    color = Color.White
                                )
                                Text(
                                    text = if (phase == GamePhase.FLYING) "In Flight" else "%.2f KES".format(amount),
                                    fontSize = 11.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = Color.White.copy(alpha = 0.9f)
                                )
                            }
                        }
                    }

                    // Placed & Waiting
                    betConfig.isPlaced && phase == GamePhase.WAITING -> {
                        Button(
                            onClick = onCancelBet,
                            colors = ButtonDefaults.buttonColors(containerColor = Color.Transparent),
                            shape = RoundedCornerShape(12.dp),
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(84.dp)
                                .background(
                                    brush = Brush.horizontalGradient(
                                        colors = listOf(PrimaryRed, PrimaryRedDark)
                                    ),
                                    shape = RoundedCornerShape(12.dp)
                                )
                                .testTag("cancel_bet_$id")
                        ) {
                            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                Text(
                                    text = "CANCEL",
                                    fontSize = 15.sp,
                                    fontWeight = FontWeight.Black,
                                    color = Color.White
                                )
                                Text(
                                    text = "%.2f KES (QUEUED)".format(amount),
                                    fontSize = 9.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = Color.White.copy(alpha = 0.8f)
                                )
                            }
                        }
                    }

                    // In Flight & Not Cashed Out
                    betConfig.isPlaced && phase == GamePhase.FLYING && !betConfig.hasCashedOut -> {
                        Button(
                            onClick = onCashOut,
                            colors = ButtonDefaults.buttonColors(containerColor = Color.Transparent),
                            shape = RoundedCornerShape(12.dp),
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(84.dp)
                                .background(
                                    brush = Brush.horizontalGradient(
                                        colors = listOf(AccentAmber, AccentAmberDark)
                                    ),
                                    shape = RoundedCornerShape(12.dp)
                                )
                                .testTag("cashout_button_$id")
                        ) {
                            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                Text(
                                    text = "CASH OUT",
                                    fontSize = 13.sp,
                                    fontWeight = FontWeight.Black,
                                    color = Color.Black
                                )
                                Text(
                                    text = "$livePotentialWin KES",
                                    fontSize = 16.sp,
                                    fontWeight = FontWeight.Black,
                                    color = Color.Black
                                )
                            }
                        }
                    }

                    // Cashed Out Successfully
                    betConfig.isPlaced && betConfig.hasCashedOut -> {
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(84.dp)
                                .clip(RoundedCornerShape(12.dp))
                                .background(Color(0xFF042F1A))
                                .border(1.dp, SuccessGreen, RoundedCornerShape(12.dp))
                                .padding(4.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Icon(
                                        imageVector = Icons.Default.CheckCircle,
                                        contentDescription = "Cashed Out",
                                        tint = SuccessGreen,
                                        modifier = Modifier.size(14.dp)
                                    )
                                    Spacer(modifier = Modifier.width(3.dp))
                                    Text(
                                        text = "CASHED OUT",
                                        fontSize = 10.sp,
                                        fontWeight = FontWeight.Black,
                                        color = SuccessGreen
                                    )
                                }
                                Text(
                                    text = "+%.2f KES".format(betConfig.winAmount),
                                    fontSize = 15.sp,
                                    fontWeight = FontWeight.Black,
                                    color = Color.White
                                )
                                Text(
                                    text = "@ %.2fx".format(betConfig.cashoutMultiplier),
                                    fontSize = 11.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = SuccessGreen
                                )
                            }
                        }
                    }

                    // Crashed / Lost
                    else -> {
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(84.dp)
                                .clip(RoundedCornerShape(12.dp))
                                .background(Color(0xFF2D0D12))
                                .border(1.dp, PrimaryRed.copy(alpha = 0.5f), RoundedCornerShape(12.dp)),
                            contentAlignment = Alignment.Center
                        ) {
                            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                Text(
                                    text = "FLEW AWAY",
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = PrimaryRed
                                )
                                Text(
                                    text = "-%.2f KES".format(amount),
                                    fontSize = 13.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = Color(0xFFCBD5E1)
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}
