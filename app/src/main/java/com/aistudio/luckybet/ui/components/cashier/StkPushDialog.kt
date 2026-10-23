package com.aistudio.luckybet.ui.components.cashier

import android.content.Context
import android.os.Build
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager
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
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.Backspace
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.ErrorOutline
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.PhoneAndroid
import androidx.compose.material.icons.filled.Schedule
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.material3.minimumInteractiveComponentSize
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import com.aistudio.luckybet.data.model.StkPromptStatus
import com.aistudio.luckybet.data.model.StkPushPromptState
import com.aistudio.luckybet.ui.theme.AccentAmber
import com.aistudio.luckybet.ui.theme.PrimaryRed
import com.aistudio.luckybet.ui.theme.SuccessGreen
import com.aistudio.luckybet.ui.theme.SuccessGreenDark

@Composable
fun StkPushDialog(
    promptState: StkPushPromptState?,
    onSubmitPin: (String) -> Unit,
    onCancel: () -> Unit
) {
    if (promptState == null) return

    val context = LocalContext.current
    var pin by remember(promptState.requestId) { mutableStateOf("") }
    var localError by remember(promptState.requestId) { mutableStateOf<String?>(null) }

    LaunchedEffect(promptState.requestId) {
        try {
            val vibrator = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                val vm = context.getSystemService(Context.VIBRATOR_MANAGER_SERVICE) as? VibratorManager
                vm?.defaultVibrator
            } else {
                @Suppress("DEPRECATION")
                context.getSystemService(Context.VIBRATOR_SERVICE) as? Vibrator
            }
            vibrator?.vibrate(VibrationEffect.createWaveform(longArrayOf(0, 140, 80, 140), -1))
        } catch (_: Exception) {
        }
    }

    Dialog(
        onDismissRequest = { /* Require explicit Send or Cancel like SIM Toolkit */ },
        properties = DialogProperties(dismissOnBackPress = false, dismissOnClickOutside = false)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(24.dp))
                .background(Color(0xFF0B1411))
                .border(2.dp, SuccessGreen.copy(alpha = 0.75f), RoundedCornerShape(24.dp))
                .testTag("stk_push_dialog")
        ) {
            // Safaricom SIM Toolkit Header
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(
                        Brush.horizontalGradient(
                            listOf(Color(0xFF047857), Color(0xFF16A34A), Color(0xFF047857))
                        )
                    )
                    .padding(horizontal = 16.dp, vertical = 12.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Box(
                        modifier = Modifier
                            .size(34.dp)
                            .clip(CircleShape)
                            .background(Color.White.copy(alpha = 0.2f)),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            imageVector = Icons.Default.PhoneAndroid,
                            contentDescription = "Safaricom SIM Toolkit",
                            tint = Color.White,
                            modifier = Modifier.size(18.dp)
                        )
                    }
                    Spacer(modifier = Modifier.width(10.dp))
                    Column {
                        Text(
                            text = "SAFARICOM SIM TOOLKIT",
                            fontSize = 10.sp,
                            fontWeight = FontWeight.Bold,
                            fontFamily = FontFamily.Monospace,
                            color = Color(0xFFD1FAE5)
                        )
                        Text(
                            text = "Lipa na M-PESA Paybill",
                            fontSize = 14.sp,
                            fontWeight = FontWeight.Black,
                            color = Color.White
                        )
                    }
                }

                Row(
                    modifier = Modifier
                        .clip(RoundedCornerShape(50))
                        .background(Color.Black.copy(alpha = 0.3f))
                        .padding(horizontal = 10.dp, vertical = 4.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(
                        imageVector = Icons.Default.Schedule,
                        contentDescription = "Countdown",
                        tint = Color(0xFFA7F3D0),
                        modifier = Modifier.size(13.dp)
                    )
                    Spacer(modifier = Modifier.width(4.dp))
                    Text(
                        text = "${promptState.secondsRemaining}s",
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        fontFamily = FontFamily.Monospace,
                        color = Color.White
                    )
                }
            }

            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(16.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                when (promptState.status) {
                    StkPromptStatus.ACCEPTED -> {
                        Spacer(modifier = Modifier.height(12.dp))
                        Icon(
                            imageVector = Icons.Default.CheckCircle,
                            contentDescription = "Payment Confirmed",
                            tint = SuccessGreen,
                            modifier = Modifier.size(54.dp)
                        )
                        Spacer(modifier = Modifier.height(10.dp))
                        Text(
                            text = "M-PESA PIN Accepted!",
                            fontSize = 17.sp,
                            fontWeight = FontWeight.Black,
                            color = Color.White
                        )
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(
                            text = "KES %.2f sent directly to Paybill %s (Acc: %s)".format(
                                promptState.amount,
                                promptState.paybill,
                                promptState.accountReference
                            ),
                            fontSize = 12.sp,
                            color = Color(0xFFCBD5E1),
                            textAlign = TextAlign.Center
                        )
                        promptState.txRef?.let { ref ->
                            Spacer(modifier = Modifier.height(6.dp))
                            Text(
                                text = "M-PESA Receipt: $ref",
                                fontSize = 11.sp,
                                fontFamily = FontFamily.Monospace,
                                fontWeight = FontWeight.Bold,
                                color = AccentAmber
                            )
                        }
                        Spacer(modifier = Modifier.height(12.dp))
                    }

                    StkPromptStatus.TIMEOUT -> {
                        Spacer(modifier = Modifier.height(12.dp))
                        Icon(
                            imageVector = Icons.Default.ErrorOutline,
                            contentDescription = "Timed Out",
                            tint = AccentAmber,
                            modifier = Modifier.size(48.dp)
                        )
                        Spacer(modifier = Modifier.height(8.dp))
                        Text(
                            text = "USSD Session Timed Out",
                            fontSize = 16.sp,
                            fontWeight = FontWeight.Bold,
                            color = Color.White
                        )
                        Text(
                            text = "No M-PESA PIN entered within 45 seconds.",
                            fontSize = 12.sp,
                            color = Color(0xFF94A3B8)
                        )
                        Spacer(modifier = Modifier.height(12.dp))
                    }

                    else -> {
                        // Target Phone & Direct Paybill Details Card
                        Column(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clip(RoundedCornerShape(14.dp))
                                .background(Color(0xFF060B09))
                                .border(1.dp, SuccessGreen.copy(alpha = 0.35f), RoundedCornerShape(14.dp))
                                .padding(12.dp)
                        ) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text(
                                    text = "USSD Target Phone:",
                                    fontSize = 10.sp,
                                    fontFamily = FontFamily.Monospace,
                                    color = Color(0xFF94A3B8)
                                )
                                Text(
                                    text = promptState.phoneNumber,
                                    fontSize = 11.sp,
                                    fontFamily = FontFamily.Monospace,
                                    fontWeight = FontWeight.Black,
                                    color = AccentAmber
                                )
                            }
                            Spacer(modifier = Modifier.height(8.dp))
                            Text(
                                text = "Enter M-PESA PIN to send KES %.2f directly to Paybill %s (Account: %s)".format(
                                    promptState.amount,
                                    promptState.paybill,
                                    promptState.accountReference
                                ),
                                fontSize = 12.sp,
                                fontWeight = FontWeight.SemiBold,
                                color = Color.White,
                                lineHeight = 17.sp
                            )
                            Spacer(modifier = Modifier.height(6.dp))
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Icon(
                                    imageVector = Icons.Default.Lock,
                                    contentDescription = null,
                                    tint = SuccessGreen,
                                    modifier = Modifier.size(12.dp)
                                )
                                Spacer(modifier = Modifier.width(4.dp))
                                Text(
                                    text = promptState.darajaStatusNote,
                                    fontSize = 10.sp,
                                    fontFamily = FontFamily.Monospace,
                                    color = SuccessGreen
                                )
                            }
                        }

                        Spacer(modifier = Modifier.height(12.dp))

                        Text(
                            text = "ENTER 4-DIGIT M-PESA PIN",
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold,
                            color = Color(0xFFCBD5E1)
                        )

                        Spacer(modifier = Modifier.height(8.dp))

                        // 4 PIN Dots
                        Row(
                            horizontalArrangement = Arrangement.spacedBy(16.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            repeat(4) { idx ->
                                val filled = pin.length > idx
                                Box(
                                    modifier = Modifier
                                        .size(16.dp)
                                        .clip(CircleShape)
                                        .background(if (filled) SuccessGreen else Color(0xFF1E293B))
                                        .border(
                                            2.dp,
                                            if (filled) Color(0xFF6EE7B7) else Color(0xFF475569),
                                            CircleShape
                                        )
                                )
                            }
                        }

                        localError?.let { err ->
                            Spacer(modifier = Modifier.height(6.dp))
                            Text(
                                text = err,
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold,
                                color = PrimaryRed
                            )
                        }

                        Spacer(modifier = Modifier.height(12.dp))

                        // 3x4 SIM Toolkit Numeric Keypad
                        val rows = listOf(
                            listOf("1", "2", "3"),
                            listOf("4", "5", "6"),
                            listOf("7", "8", "9")
                        )

                        Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                            rows.forEach { r ->
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                                ) {
                                    r.forEach { digit ->
                                        Box(
                                            modifier = Modifier
                                                .weight(1f)
                                                .minimumInteractiveComponentSize()
                                                .height(48.dp)
                                                .clip(RoundedCornerShape(12.dp))
                                                .background(Color(0xFF131F1B))
                                                .border(1.dp, Color(0xFF1E293B), RoundedCornerShape(12.dp))
                                                .clickable {
                                                    if (pin.length < 4) {
                                                        pin += digit
                                                        localError = null
                                                    }
                                                }
                                                .testTag("stk_key_$digit"),
                                            contentAlignment = Alignment.Center
                                        ) {
                                            Text(
                                                text = digit,
                                                fontSize = 17.sp,
                                                fontWeight = FontWeight.Black,
                                                fontFamily = FontFamily.Monospace,
                                                color = Color.White
                                            )
                                        }
                                    }
                                }
                            }

                            // Bottom keypad row: Cancel | 0 | Backspace
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.spacedBy(6.dp)
                            ) {
                                Box(
                                    modifier = Modifier
                                        .weight(1f)
                                        .minimumInteractiveComponentSize()
                                        .height(48.dp)
                                        .clip(RoundedCornerShape(12.dp))
                                        .background(PrimaryRed.copy(alpha = 0.14f))
                                        .border(1.dp, PrimaryRed.copy(alpha = 0.4f), RoundedCornerShape(12.dp))
                                        .clickable { onCancel() }
                                        .testTag("stk_cancel_button"),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Text(
                                        text = "Cancel",
                                        fontSize = 12.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = PrimaryRed
                                    )
                                }

                                Box(
                                    modifier = Modifier
                                        .weight(1f)
                                        .minimumInteractiveComponentSize()
                                        .height(48.dp)
                                        .clip(RoundedCornerShape(12.dp))
                                        .background(Color(0xFF131F1B))
                                        .border(1.dp, Color(0xFF1E293B), RoundedCornerShape(12.dp))
                                        .clickable {
                                            if (pin.length < 4) {
                                                pin += "0"
                                                localError = null
                                            }
                                        }
                                        .testTag("stk_key_0"),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Text(
                                        text = "0",
                                        fontSize = 17.sp,
                                        fontWeight = FontWeight.Black,
                                        fontFamily = FontFamily.Monospace,
                                        color = Color.White
                                    )
                                }

                                Box(
                                    modifier = Modifier
                                        .weight(1f)
                                        .minimumInteractiveComponentSize()
                                        .height(48.dp)
                                        .clip(RoundedCornerShape(12.dp))
                                        .background(Color(0xFF131F1B))
                                        .border(1.dp, Color(0xFF1E293B), RoundedCornerShape(12.dp))
                                        .clickable {
                                            if (pin.isNotEmpty()) {
                                                pin = pin.dropLast(1)
                                            }
                                        }
                                        .testTag("stk_backspace_button"),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Icon(
                                        imageVector = Icons.AutoMirrored.Filled.Backspace,
                                        contentDescription = "Delete PIN digit",
                                        tint = Color(0xFFCBD5E1),
                                        modifier = Modifier.size(18.dp)
                                    )
                                }
                            }
                        }

                        Spacer(modifier = Modifier.height(12.dp))

                        // Send PIN Action
                        Button(
                            onClick = {
                                if (pin.length < 4) {
                                    localError = "Please enter your 4-digit M-PESA PIN"
                                } else {
                                    onSubmitPin(pin)
                                }
                            },
                            enabled = promptState.status != StkPromptStatus.PROCESSING,
                            colors = ButtonDefaults.buttonColors(containerColor = Color.Transparent),
                            shape = RoundedCornerShape(12.dp),
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(48.dp)
                                .background(
                                    Brush.horizontalGradient(listOf(SuccessGreen, SuccessGreenDark)),
                                    RoundedCornerShape(12.dp)
                                )
                                .testTag("stk_send_pin_button")
                        ) {
                            Text(
                                text = if (promptState.status == StkPromptStatus.PROCESSING) {
                                    "PROCESSING PAYBILL PAYMENT..."
                                } else {
                                    "SEND M-PESA PIN (KES %.0f)".format(promptState.amount)
                                },
                                fontSize = 13.sp,
                                fontWeight = FontWeight.Black,
                                color = Color.White
                            )
                        }
                    }
                }
            }
        }
    }
}
