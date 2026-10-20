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
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AccountBalanceWallet
import androidx.compose.material.icons.filled.ArrowDownward
import androidx.compose.material.icons.filled.ArrowUpward
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.History
import androidx.compose.material.icons.filled.PhoneAndroid
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
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
import androidx.compose.ui.window.Dialog
import com.aistudio.luckybet.data.model.UserAccount
import com.aistudio.luckybet.data.model.WalletTransaction
import com.aistudio.luckybet.ui.theme.AccentAmber
import com.aistudio.luckybet.ui.theme.PrimaryRed
import com.aistudio.luckybet.ui.theme.SuccessGreen
import com.aistudio.luckybet.ui.theme.SuccessGreenDark
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

@Composable
fun CashierDialog(
    isOpen: Boolean,
    initialTab: String = "deposit",
    user: UserAccount,
    transactions: List<WalletTransaction>,
    onClose: () -> Unit,
    onRequestDeposit: (amount: Double, code: String) -> Unit,
    onWithdrawFunds: (amount: Double, description: String) -> Unit
) {
    if (!isOpen) return

    var currentTab by remember(initialTab) { mutableStateOf(initialTab) }
    var depositAmount by remember { mutableDoubleStateOf(200.0) }
    var confCode by remember { mutableStateOf("") }
    var withdrawAmount by remember { mutableDoubleStateOf(100.0) }
    var withdrawPhone by remember { mutableStateOf(user.phoneNumber) }
    var successMsg by remember { mutableStateOf<String?>(null) }
    var errorMsg by remember { mutableStateOf<String?>(null) }

    Dialog(onDismissRequest = onClose) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(18.dp))
                .background(Color(0xFF0F1522))
                .border(1.dp, Color(0xFF1E293B), RoundedCornerShape(18.dp))
                .padding(16.dp)
                .testTag("cashier_dialog")
        ) {
            // Header
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(
                        imageVector = Icons.Default.AccountBalanceWallet,
                        contentDescription = "Wallet",
                        tint = AccentAmber,
                        modifier = Modifier.size(22.dp)
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Column {
                        Text(
                            text = "Cashier & Wallet",
                            fontSize = 16.sp,
                            fontWeight = FontWeight.Black,
                            color = Color.White
                        )
                        Text(
                            text = "Balance: %.2f KES".format(user.balance),
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Bold,
                            color = SuccessGreen
                        )
                    }
                }

                IconButton(onClick = onClose, modifier = Modifier.size(28.dp)) {
                    Icon(Icons.Default.Close, contentDescription = "Close", tint = Color(0xFF94A3B8))
                }
            }

            Spacer(modifier = Modifier.height(12.dp))

            // Navigation Tabs
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(10.dp))
                    .background(Color(0xFF070A0F))
                    .padding(3.dp),
                horizontalArrangement = Arrangement.SpaceEvenly
            ) {
                listOf(
                    Pair("deposit", "Deposit"),
                    Pair("withdraw", "Withdraw"),
                    Pair("history", "History")
                ).forEach { (tabId, label) ->
                    val isSelected = currentTab == tabId
                    Box(
                        modifier = Modifier
                            .weight(1f)
                            .clip(RoundedCornerShape(8.dp))
                            .background(if (isSelected) AccentAmber else Color.Transparent)
                            .clickable {
                                currentTab = tabId
                                successMsg = null
                                errorMsg = null
                            }
                            .padding(vertical = 6.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = label,
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Bold,
                            color = if (isSelected) Color.Black else Color(0xFF94A3B8)
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(12.dp))

            // Status alerts
            successMsg?.let { msg ->
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(8.dp))
                        .background(SuccessGreen.copy(alpha = 0.15f))
                        .border(1.dp, SuccessGreen.copy(alpha = 0.5f), RoundedCornerShape(8.dp))
                        .padding(8.dp)
                ) {
                    Text(text = msg, fontSize = 11.sp, color = SuccessGreen)
                }
                Spacer(modifier = Modifier.height(8.dp))
            }

            errorMsg?.let { msg ->
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(8.dp))
                        .background(PrimaryRed.copy(alpha = 0.15f))
                        .border(1.dp, PrimaryRed.copy(alpha = 0.5f), RoundedCornerShape(8.dp))
                        .padding(8.dp)
                ) {
                    Text(text = msg, fontSize = 11.sp, color = PrimaryRed)
                }
                Spacer(modifier = Modifier.height(8.dp))
            }

            // Tab 1: Deposit
            if (currentTab == "deposit") {
                Column(modifier = Modifier.fillMaxWidth()) {
                    Text(
                        text = "Instant M-PESA Deposit (Demo)",
                        fontSize = 13.sp,
                        fontWeight = FontWeight.Bold,
                        color = Color.White
                    )
                    Spacer(modifier = Modifier.height(6.dp))

                    // Preset chips
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(6.dp)
                    ) {
                        listOf(100.0, 200.0, 500.0, 1000.0).forEach { amt ->
                            Box(
                                modifier = Modifier
                                    .weight(1f)
                                    .clip(RoundedCornerShape(8.dp))
                                    .background(if (depositAmount == amt) SuccessGreen.copy(alpha = 0.25f) else Color(0xFF1E293B))
                                    .border(1.dp, if (depositAmount == amt) SuccessGreen else Color.Transparent, RoundedCornerShape(8.dp))
                                    .clickable { depositAmount = amt }
                                    .padding(vertical = 6.dp),
                                contentAlignment = Alignment.Center
                            ) {
                                Text(
                                    text = "%.0f KES".format(amt),
                                    fontSize = 11.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = if (depositAmount == amt) SuccessGreen else Color.White
                                )
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(10.dp))

                    OutlinedTextField(
                        value = confCode,
                        onValueChange = { confCode = it.uppercase() },
                        label = { Text("M-PESA Ref Code (e.g. QK8912J1)") },
                        placeholder = { Text("Leave blank to auto-generate") },
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth(),
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedTextColor = Color.White,
                            unfocusedTextColor = Color.White,
                            focusedBorderColor = AccentAmber,
                            unfocusedBorderColor = Color(0xFF1E293B)
                        )
                    )

                    Spacer(modifier = Modifier.height(12.dp))

                    Button(
                        onClick = {
                            val code = confCode.ifBlank { "QK" + (10000000..99999999).random() }
                            onRequestDeposit(depositAmount, code)
                            successMsg = "Deposit request of %.0f KES submitted! Ref: %s (Pending Admin Approval)".format(depositAmount, code)
                            confCode = ""
                        },
                        colors = ButtonDefaults.buttonColors(containerColor = Color.Transparent),
                        shape = RoundedCornerShape(10.dp),
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(44.dp)
                            .background(
                                brush = Brush.horizontalGradient(listOf(SuccessGreen, SuccessGreenDark)),
                                shape = RoundedCornerShape(10.dp)
                            )
                            .testTag("submit_deposit_button")
                    ) {
                        Text(
                            text = "SUBMIT DEPOSIT (%.0f KES)".format(depositAmount),
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Black,
                            color = Color.White
                        )
                    }
                }
            }

            // Tab 2: Withdraw
            if (currentTab == "withdraw") {
                Column(modifier = Modifier.fillMaxWidth()) {
                    Text(
                        text = "Request M-PESA Payout",
                        fontSize = 13.sp,
                        fontWeight = FontWeight.Bold,
                        color = Color.White
                    )
                    Spacer(modifier = Modifier.height(8.dp))

                    OutlinedTextField(
                        value = withdrawPhone,
                        onValueChange = { withdrawPhone = it },
                        label = { Text("M-PESA Phone Number") },
                        singleLine = true,
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Phone),
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
                        value = "%.0f".format(withdrawAmount),
                        onValueChange = { str ->
                            str.toDoubleOrNull()?.let { withdrawAmount = it }
                        },
                        label = { Text("Amount (KES) - Min 100 KES") },
                        singleLine = true,
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                        modifier = Modifier.fillMaxWidth(),
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedTextColor = Color.White,
                            unfocusedTextColor = Color.White,
                            focusedBorderColor = AccentAmber,
                            unfocusedBorderColor = Color(0xFF1E293B)
                        )
                    )

                    Spacer(modifier = Modifier.height(12.dp))

                    Button(
                        onClick = {
                            if (withdrawAmount < 100.0) {
                                errorMsg = "Minimum withdrawal is 100 KES"
                                return@Button
                            }
                            if (withdrawAmount > user.balance) {
                                errorMsg = "Insufficient balance (Current: %.2f KES)".format(user.balance)
                                return@Button
                            }
                            val ref = "WD" + (100000..999999).random()
                            onWithdrawFunds(withdrawAmount, "Payout to $withdrawPhone (Ref: #$ref)")
                            successMsg = "Withdrawal of %.0f KES queued! M-PESA processing takes 5-15 mins. Ref: #%s".format(withdrawAmount, ref)
                            errorMsg = null
                        },
                        colors = ButtonDefaults.buttonColors(containerColor = AccentAmber),
                        shape = RoundedCornerShape(10.dp),
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(44.dp)
                            .testTag("submit_withdraw_button")
                    ) {
                        Text(
                            text = "REQUEST WITHDRAWAL",
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Black,
                            color = Color.Black
                        )
                    }
                }
            }

            // Tab 3: History
            if (currentTab == "history") {
                LazyColumn(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(220.dp),
                    verticalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    if (transactions.isEmpty()) {
                        item {
                            Text(
                                text = "No transactions yet.",
                                fontSize = 12.sp,
                                color = Color(0xFF64748B),
                                modifier = Modifier.padding(16.dp)
                            )
                        }
                    } else {
                        items(transactions, key = { it.id }) { tx ->
                            val isPos = tx.amount >= 0
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
                                        text = tx.description,
                                        fontSize = 11.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = Color.White
                                    )
                                    val dateStr = SimpleDateFormat("dd MMM, HH:mm", Locale.getDefault()).format(Date(tx.timestamp))
                                    Text(
                                        text = "$dateStr • Bal: %.2f KES".format(tx.balanceAfter),
                                        fontSize = 9.sp,
                                        color = Color(0xFF64748B)
                                    )
                                }
                                Text(
                                    text = if (isPos) "+%.2f KES".format(tx.amount) else "%.2f KES".format(tx.amount),
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.Black,
                                    color = if (isPos) SuccessGreen else PrimaryRed
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}
