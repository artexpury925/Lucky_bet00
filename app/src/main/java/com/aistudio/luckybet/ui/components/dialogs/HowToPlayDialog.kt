package com.aistudio.luckybet.ui.components.dialogs

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.HelpOutline
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import com.aistudio.luckybet.ui.theme.AccentAmber

@Composable
fun HowToPlayDialog(
    isOpen: Boolean,
    onClose: () -> Unit
) {
    if (!isOpen) return

    Dialog(onDismissRequest = onClose) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(18.dp))
                .background(Color(0xFF0F1522))
                .border(1.dp, Color(0xFF1E293B), RoundedCornerShape(18.dp))
                .padding(16.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(
                        imageVector = Icons.Default.HelpOutline,
                        contentDescription = "Rules",
                        tint = AccentAmber,
                        modifier = Modifier.size(22.dp)
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        text = "How to Play Lucky Bet",
                        fontSize = 16.sp,
                        fontWeight = FontWeight.Black,
                        color = Color.White
                    )
                }

                IconButton(onClick = onClose, modifier = Modifier.size(28.dp)) {
                    Icon(Icons.Default.Close, contentDescription = "Close", tint = Color(0xFF94A3B8))
                }
            }

            Spacer(modifier = Modifier.height(12.dp))

            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(10.dp))
                    .background(Color(0xFF070A0F))
                    .padding(10.dp)
            ) {
                Text(
                    text = "✈️ Aviator Crash Rules",
                    fontSize = 13.sp,
                    fontWeight = FontWeight.Bold,
                    color = AccentAmber
                )
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = "1. Place your bet before takeoff during the 5-second countdown.\n" +
                            "2. Watch the multiplier climb as the stunt plane ascends.\n" +
                            "3. Tap CASH OUT before the plane flies away to bank your win! If the plane flies away before cash out, the bet is lost.",
                    fontSize = 11.sp,
                    color = Color(0xFFCBD5E1),
                    lineHeight = 16.sp
                )
            }

            Spacer(modifier = Modifier.height(8.dp))

            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(10.dp))
                    .background(Color(0xFF070A0F))
                    .padding(10.dp)
            ) {
                Text(
                    text = "⚽ Sports Multi-Betting",
                    fontSize = 13.sp,
                    fontWeight = FontWeight.Bold,
                    color = AccentAmber
                )
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = "1. Browse live in-play and upcoming football fixtures.\n" +
                            "2. Pick match outcomes (1X2, Over/Under 2.5, GG/NG).\n" +
                            "3. Combine multiple selections to earn Accumulator Multi-Boosts up to +25% extra on your payout!",
                    fontSize = 11.sp,
                    color = Color(0xFFCBD5E1),
                    lineHeight = 16.sp
                )
            }

            Spacer(modifier = Modifier.height(8.dp))

            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(10.dp))
                    .background(Color(0xFF070A0F))
                    .padding(10.dp)
            ) {
                Text(
                    text = "💼 Free Virtual Demo Wallet",
                    fontSize = 13.sp,
                    fontWeight = FontWeight.Bold,
                    color = AccentAmber
                )
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = "All accounts start with 500 KES free welcome bonus. You can simulate instant deposits and practice M-PESA withdrawals at any time.",
                    fontSize = 11.sp,
                    color = Color(0xFFCBD5E1),
                    lineHeight = 16.sp
                )
            }

            Spacer(modifier = Modifier.height(14.dp))

            Button(
                onClick = onClose,
                colors = ButtonDefaults.buttonColors(containerColor = AccentAmber),
                shape = RoundedCornerShape(10.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                Text(
                    text = "GOT IT, LET'S PLAY",
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Black,
                    color = Color.Black
                )
            }
        }
    }
}
