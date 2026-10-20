package com.aistudio.luckybet.ui.components.admin

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
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AdminPanelSettings
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Flight
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.People
import androidx.compose.material.icons.filled.RocketLaunch
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Slider
import androidx.compose.material3.SliderDefaults
import androidx.compose.material3.Switch
import androidx.compose.material3.SwitchDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableDoubleStateOf
import androidx.compose.runtime.mutableFloatStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import com.aistudio.luckybet.data.model.AviatorHourlyMood
import com.aistudio.luckybet.data.model.PendingDeposit
import com.aistudio.luckybet.data.model.UserAccount
import com.aistudio.luckybet.ui.theme.AccentAmber
import com.aistudio.luckybet.ui.theme.PrimaryRed
import com.aistudio.luckybet.ui.theme.SuccessGreen

@Composable
fun AdminPanelDialog(
    isOpen: Boolean,
    onClose: () -> Unit,
    registeredUsers: List<UserAccount>,
    pendingDeposits: List<PendingDeposit>,
    onApproveDeposit: (id: String) -> Unit,
    onRejectDeposit: (id: String) -> Unit,
    onAdminAddFundsToUser: (phone: String, amount: Double) -> Unit,
    rtpRate: Double,
    onUpdateRtp: (Double) -> Unit,
    onTriggerSpecialFlight: (Double) -> Unit,
    onResetBalances: () -> Unit,
    hourlyMood: AviatorHourlyMood,
    onSetMood: (AviatorHourlyMood) -> Unit,
    isAutoMood: Boolean,
    onToggleAutoMood: (Boolean) -> Unit
) {
    if (!isOpen) return

    var isAuthenticated by remember { mutableStateOf(false) }
    var username by remember { mutableStateOf("KENYA@254") }
    var password by remember { mutableStateOf("KENYA@254") }
    var errorMsg by remember { mutableStateOf<String?>(null) }
    var adminTab by remember { mutableStateOf<"deposits" | "users" | "flight">("deposits") }
    var userCreditSuccess by remember { mutableStateOf<String?>(null) }

    Dialog(onDismissRequest = onClose) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(18.dp))
                .background(Color(0xFF0F1522))
                .border(1.dp, Color(0xFF1E293B), RoundedCornerShape(18.dp))
                .padding(16.dp)
                .testTag("admin_panel_dialog")
        ) {
            // Header
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(
                        imageVector = Icons.Default.AdminPanelSettings,
                        contentDescription = "Admin",
                        tint = AccentAmber,
                        modifier = Modifier.size(22.dp)
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        text = "Admin Control Panel",
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

            if (!isAuthenticated) {
                // Login Form
                Column(modifier = Modifier.fillMaxWidth()) {
                    Text(
                        text = "Administrative Access Required",
                        fontSize = 12.sp,
                        color = Color(0xFF94A3B8)
                    )
                    Spacer(modifier = Modifier.height(8.dp))

                    OutlinedTextField(
                        value = username,
                        onValueChange = { username = it },
                        label = { Text("Admin Username") },
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth(),
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedTextColor = Color.White,
                            unfocusedTextColor = Color.White,
                            focusedBorderColor = AccentAmber,
                            unfocusedBorderColor = Color(0xFF1E293B)
                        )
                    )

                    Spacer(modifier = Modifier.height(8.dp))

                    OutlinedTextField(
                        value = password,
                        onValueChange = { password = it },
                        label = { Text("Admin Password") },
                        singleLine = true,
                        visualTransformation = PasswordVisualTransformation(),
                        modifier = Modifier.fillMaxWidth(),
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedTextColor = Color.White,
                            unfocusedTextColor = Color.White,
                            focusedBorderColor = AccentAmber,
                            unfocusedBorderColor = Color(0xFF1E293B)
                        )
                    )

                    errorMsg?.let {
                        Spacer(modifier = Modifier.height(6.dp))
                        Text(text = it, fontSize = 11.sp, color = PrimaryRed)
                    }

                    Spacer(modifier = Modifier.height(12.dp))

                    Button(
                        onClick = {
                            if (username.trim().equals("KENYA@254", ignoreCase = true) &&
                                password.trim().equals("KENYA@254", ignoreCase = true)
                            ) {
                                isAuthenticated = true
                                errorMsg = null
                            } else {
                                errorMsg = "Invalid credentials. Use KENYA@254 / KENYA@254"
                            }
                        },
                        colors = ButtonDefaults.buttonColors(containerColor = AccentAmber),
                        shape = RoundedCornerShape(10.dp),
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(44.dp)
                    ) {
                        Text(
                            text = "LOGIN AS ADMIN",
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Black,
                            color = Color.Black
                        )
                    }
                }
            } else {
                // Admin Dashboard Tabs
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(8.dp))
                        .background(Color(0xFF070A0F))
                        .padding(2.dp),
                    horizontalArrangement = Arrangement.SpaceEvenly
                ) {
                    listOf(
                        Pair("deposits", "Deposits (${pendingDeposits.size})"),
                        Pair("users", "Users (${registeredUsers.size})"),
                        Pair("flight", "Flight Controls")
                    ).forEach { (t, label) ->
                        val isSel = adminTab == t
                        Box(
                            modifier = Modifier
                                .weight(1f)
                                .clip(RoundedCornerShape(6.dp))
                                .background(if (isSel) AccentAmber else Color.Transparent)
                                .clickable { adminTab = t }
                                .padding(vertical = 5.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                text = label,
                                fontSize = 10.sp,
                                fontWeight = FontWeight.Bold,
                                color = if (isSel) Color.Black else Color(0xFF94A3B8)
                            )
                        }
                    }
                }

                Spacer(modifier = Modifier.height(10.dp))

                // Tab 1: Deposits Queue
                if (adminTab == "deposits") {
                    if (pendingDeposits.isEmpty()) {
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(160.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                text = "No pending deposits awaiting verification",
                                fontSize = 12.sp,
                                color = Color(0xFF64748B)
                            )
                        }
                    } else {
                        LazyColumn(
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(220.dp),
                            verticalArrangement = Arrangement.spacedBy(6.dp)
                        ) {
                            items(pendingDeposits, key = { it.id }) { dep ->
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
                                            text = "${dep.username} (${dep.phoneNumber})",
                                            fontSize = 11.sp,
                                            fontWeight = FontWeight.Bold,
                                            color = Color.White
                                        )
                                        Text(
                                            text = "Ref: ${dep.code} • %.0f KES".format(dep.amount),
                                            fontSize = 10.sp,
                                            color = AccentAmber
                                        )
                                    }
                                    Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                                        Button(
                                            onClick = { onApproveDeposit(dep.id) },
                                            colors = ButtonDefaults.buttonColors(containerColor = SuccessGreen),
                                            shape = RoundedCornerShape(6.dp),
                                            modifier = Modifier.height(30.dp)
                                        ) {
                                            Text("Approve", fontSize = 10.sp, fontWeight = FontWeight.Bold)
                                        }
                                        Button(
                                            onClick = { onRejectDeposit(dep.id) },
                                            colors = ButtonDefaults.buttonColors(containerColor = PrimaryRed),
                                            shape = RoundedCornerShape(6.dp),
                                            modifier = Modifier.height(30.dp)
                                        ) {
                                            Text("Reject", fontSize = 10.sp, fontWeight = FontWeight.Bold)
                                        }
                                    }
                                }
                            }
                        }
                    }
                }

                // Tab 2: Users Management
                if (adminTab == "users") {
                    userCreditSuccess?.let {
                        Text(text = it, fontSize = 11.sp, color = SuccessGreen)
                        Spacer(modifier = Modifier.height(6.dp))
                    }

                    LazyColumn(
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(220.dp),
                        verticalArrangement = Arrangement.spacedBy(6.dp)
                    ) {
                        items(registeredUsers, key = { it.phoneNumber }) { usr ->
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
                                        text = usr.username,
                                        fontSize = 11.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = Color.White
                                    )
                                    Text(
                                        text = "${usr.phoneNumber} • Bal: %.2f KES".format(usr.balance),
                                        fontSize = 10.sp,
                                        color = Color(0xFF94A3B8)
                                    )
                                }

                                Row(horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                                    Button(
                                        onClick = {
                                            onAdminAddFundsToUser(usr.phoneNumber, 500.0)
                                            userCreditSuccess = "+500 KES credited to ${usr.phoneNumber}"
                                        },
                                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF1E293B)),
                                        shape = RoundedCornerShape(6.dp),
                                        modifier = Modifier.height(28.dp)
                                    ) {
                                        Text("+500", fontSize = 9.sp, fontWeight = FontWeight.Bold, color = AccentAmber)
                                    }
                                }
                            }
                        }
                    }
                }

                // Tab 3: Flight Controls
                if (adminTab == "flight") {
                    Column(modifier = Modifier.fillMaxWidth()) {
                        // RTP Slider
                        var currentRtp by remember(rtpRate) { mutableFloatStateOf(rtpRate.toFloat()) }
                        Text(
                            text = "RTP Rate: ${(currentRtp * 100).toInt()}%",
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Bold,
                            color = Color.White
                        )
                        Slider(
                            value = currentRtp,
                            onValueChange = {
                                currentRtp = it
                                onUpdateRtp(it.toDouble())
                            },
                            valueRange = 0.90f..0.99f,
                            colors = SliderDefaults.colors(
                                thumbColor = AccentAmber,
                                activeTrackColor = AccentAmber
                            )
                        )

                        Spacer(modifier = Modifier.height(8.dp))

                        // Trigger special flight
                        Text(
                            text = "Trigger Special High Multiplier Flight:",
                            fontSize = 11.sp,
                            color = Color(0xFF94A3B8)
                        )
                        Spacer(modifier = Modifier.height(4.dp))
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            Button(
                                onClick = { onTriggerSpecialFlight(50.0) },
                                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF1E293B)),
                                shape = RoundedCornerShape(8.dp),
                                modifier = Modifier.weight(1f)
                            ) {
                                Text("50x Next Flight", fontSize = 10.sp, fontWeight = FontWeight.Bold, color = AccentAmber)
                            }

                            Button(
                                onClick = { onTriggerSpecialFlight(100.0) },
                                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF1E293B)),
                                shape = RoundedCornerShape(8.dp),
                                modifier = Modifier.weight(1f)
                            ) {
                                Text("100x Next Flight", fontSize = 10.sp, fontWeight = FontWeight.Bold, color = SuccessGreen)
                            }
                        }

                        Spacer(modifier = Modifier.height(10.dp))

                        // Reset Balances
                        Button(
                            onClick = onResetBalances,
                            colors = ButtonDefaults.buttonColors(containerColor = PrimaryRed),
                            shape = RoundedCornerShape(8.dp),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Text("Reset All Demo Balances (1000 KES)", fontSize = 11.sp, fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }
        }
    }
}
