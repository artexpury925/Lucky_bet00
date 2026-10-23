package com.aistudio.luckybet.ui.components.cashier

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
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Schedule
import androidx.compose.material.icons.filled.Security
import androidx.compose.material.icons.filled.Sms
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Text
import androidx.compose.material3.minimumInteractiveComponentSize
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import com.aistudio.luckybet.data.model.WithdrawalOtpChallenge
import com.aistudio.luckybet.ui.theme.AccentAmber
import com.aistudio.luckybet.ui.theme.PrimaryRed
import com.aistudio.luckybet.ui.theme.SuccessGreen
import com.aistudio.luckybet.ui.theme.SuccessGreenDark

@Composable
fun WithdrawalOtpDialog(
    challenge: WithdrawalOtpChallenge?,
    onVerifyOtp: (String) -> Unit,
    onResendOtp: () -> Unit,
    onCancel: () -> Unit
) {
    if (challenge == null) return

    var enteredOtp by remember(challenge.challengeId) { mutableStateOf("") }

    Dialog(
        onDismissRequest = onCancel,
        properties = DialogProperties(dismissOnBackPress = true, dismissOnClickOutside = false)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(22.dp))
                .background(Color(0xFF0F1522))
                .border(1.5.dp, AccentAmber.copy(alpha = 0.65f), RoundedCornerShape(22.dp))
                .padding(18.dp)
                .testTag("withdrawal_otp_dialog")
        ) {
            // Header
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Box(
                        modifier = Modifier
                            .size(38.dp)
                            .clip(RoundedCornerShape(10.dp))
                            .background(AccentAmber.copy(alpha = 0.18f))
                            .border(1.dp, AccentAmber.copy(alpha = 0.45f), RoundedCornerShape(10.dp)),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            imageVector = Icons.Default.Security,
                            contentDescription = "2FA Security",
                            tint = AccentAmber,
                            modifier = Modifier.size(20.dp)
                        )
                    }
                    Spacer(modifier = Modifier.width(10.dp))
                    Column {
                        Text(
                            text = "MANDATORY 2FA CHECK",
                            fontSize = 10.sp,
                            fontWeight = FontWeight.Black,
                            fontFamily = FontFamily.Monospace,
                            color = AccentAmber
                        )
                        Text(
                            text = "SMS Withdrawal Verification",
                            fontSize = 15.sp,
                            fontWeight = FontWeight.Black,
                            color = Color.White
                        )
                    }
                }

                IconButton(
                    onClick = onCancel,
                    modifier = Modifier
                        .minimumInteractiveComponentSize()
                        .testTag("close_withdrawal_otp_button")
                ) {
                    Icon(
                        imageVector = Icons.Default.Close,
                        contentDescription = "Cancel 2FA verification",
                        tint = Color(0xFF94A3B8)
                    )
                }
            }

            Spacer(modifier = Modifier.height(12.dp))

            // SMS Delivery Banner (shows simulated SMS preview if live SMS gateway isn't configured)
            if (!challenge.liveSmsDispatched) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(10.dp))
                        .background(SuccessGreen.copy(alpha = 0.14f))
                        .border(1.dp, SuccessGreen.copy(alpha = 0.45f), RoundedCornerShape(10.dp))
                        .padding(10.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(
                        imageVector = Icons.Default.Sms,
                        contentDescription = null,
                        tint = SuccessGreen,
                        modifier = Modifier.size(18.dp)
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            text = "SMS Sent to ${challenge.registeredPhone}",
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold,
                            color = Color.White
                        )
                        Text(
                            text = "Your Lucky Bet 2FA withdrawal code is ${challenge.expectedCode}",
                            fontSize = 11.sp,
                            fontFamily = FontFamily.Monospace,
                            fontWeight = FontWeight.Bold,
                            color = SuccessGreen
                        )
                    }
                }
                Spacer(modifier = Modifier.height(10.dp))
            }

            // Transaction Details Summary
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(12.dp))
                    .background(Color(0xFF070A0F))
                    .border(1.dp, Color(0xFF1E293B), RoundedCornerShape(12.dp))
                    .padding(12.dp)
            ) {
                Text(
                    text = "Enter the 6-digit one-time code sent via SMS to your registered phone (${challenge.registeredPhone}) to authorize this payout:",
                    fontSize = 11.sp,
                    color = Color(0xFFCBD5E1),
                    lineHeight = 16.sp
                )
                Spacer(modifier = Modifier.height(8.dp))
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Text(text = "Payout Amount:", fontSize = 11.sp, color = Color(0xFF94A3B8))
                    Text(
                        text = "KES %.2f".format(challenge.amount),
                        fontSize = 13.sp,
                        fontWeight = FontWeight.Black,
                        color = SuccessGreen
                    )
                }
                Spacer(modifier = Modifier.height(4.dp))
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Text(text = "M-PESA Recipient:", fontSize = 11.sp, color = Color(0xFF94A3B8))
                    Text(
                        text = challenge.destinationPhone,
                        fontSize = 12.sp,
                        fontFamily = FontFamily.Monospace,
                        fontWeight = FontWeight.Bold,
                        color = Color.White
                    )
                }
            }

            Spacer(modifier = Modifier.height(12.dp))

            // Timer & Label
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "6-DIGIT SMS CODE",
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Bold,
                    color = Color(0xFFCBD5E1)
                )
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(
                        imageVector = Icons.Default.Schedule,
                        contentDescription = null,
                        tint = AccentAmber,
                        modifier = Modifier.size(13.dp)
                    )
                    Spacer(modifier = Modifier.width(4.dp))
                    val mins = challenge.secondsRemaining / 60
                    val secs = challenge.secondsRemaining % 60
                    Text(
                        text = "Expires %d:%02d".format(mins, secs),
                        fontSize = 11.sp,
                        fontFamily = FontFamily.Monospace,
                        fontWeight = FontWeight.Bold,
                        color = AccentAmber
                    )
                }
            }

            Spacer(modifier = Modifier.height(6.dp))

            OutlinedTextField(
                value = enteredOtp,
                onValueChange = { raw ->
                    enteredOtp = raw.filter { it.isDigit() }.take(6)
                },
                placeholder = {
                    Text(
                        text = "000000",
                        modifier = Modifier.fillMaxWidth(),
                        textAlign = TextAlign.Center,
                        color = Color(0xFF475569)
                    )
                },
                singleLine = true,
                textStyle = TextStyle(
                    fontSize = 22.sp,
                    fontWeight = FontWeight.Black,
                    fontFamily = FontFamily.Monospace,
                    textAlign = TextAlign.Center,
                    letterSpacing = 6.sp,
                    color = Color.White
                ),
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.NumberPassword),
                colors = OutlinedTextFieldDefaults.colors(
                    focusedBorderColor = AccentAmber,
                    unfocusedBorderColor = Color(0xFF334155),
                    focusedContainerColor = Color(0xFF070A0F),
                    unfocusedContainerColor = Color(0xFF070A0F)
                ),
                shape = RoundedCornerShape(12.dp),
                modifier = Modifier
                    .fillMaxWidth()
                    .testTag("withdrawal_otp_input")
            )

            challenge.errorMessage?.let { err ->
                Spacer(modifier = Modifier.height(8.dp))
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(8.dp))
                        .background(PrimaryRed.copy(alpha = 0.15f))
                        .border(1.dp, PrimaryRed.copy(alpha = 0.45f), RoundedCornerShape(8.dp))
                        .padding(8.dp)
                ) {
                    Text(
                        text = err,
                        fontSize = 11.sp,
                        fontWeight = FontWeight.SemiBold,
                        color = PrimaryRed
                    )
                }
            }

            Spacer(modifier = Modifier.height(8.dp))

            // Resend SMS Row
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "Didn't get the SMS?",
                    fontSize = 11.sp,
                    color = Color(0xFF94A3B8)
                )
                Box(
                    modifier = Modifier
                        .minimumInteractiveComponentSize()
                        .clip(RoundedCornerShape(8.dp))
                        .clickable(enabled = challenge.resendCooldown <= 0) { onResendOtp() }
                        .padding(horizontal = 8.dp, vertical = 6.dp)
                        .testTag("resend_withdrawal_otp_button"),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = if (challenge.resendCooldown > 0) {
                            "Resend in ${challenge.resendCooldown}s"
                        } else {
                            "Resend SMS Code"
                        },
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        color = if (challenge.resendCooldown > 0) Color(0xFF64748B) else AccentAmber
                    )
                }
            }

            Spacer(modifier = Modifier.height(10.dp))

            // Verify & Complete Withdrawal Button
            Button(
                onClick = { onVerifyOtp(enteredOtp) },
                enabled = enteredOtp.length == 6 && challenge.secondsRemaining > 0,
                colors = ButtonDefaults.buttonColors(containerColor = Color.Transparent),
                shape = RoundedCornerShape(12.dp),
                modifier = Modifier
                    .fillMaxWidth()
                    .height(48.dp)
                    .background(
                        Brush.horizontalGradient(
                            if (enteredOtp.length == 6 && challenge.secondsRemaining > 0) {
                                listOf(SuccessGreen, SuccessGreenDark)
                            } else {
                                listOf(Color(0xFF1E293B), Color(0xFF1E293B))
                            }
                        ),
                        RoundedCornerShape(12.dp)
                    )
                    .testTag("verify_withdrawal_otp_button")
            ) {
                Text(
                    text = "VERIFY & COMPLETE WITHDRAWAL",
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Black,
                    color = Color.White
                )
            }
        }
    }
}
