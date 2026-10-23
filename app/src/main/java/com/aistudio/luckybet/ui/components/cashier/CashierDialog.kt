package com.aistudio.luckybet.ui.components.cashier

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AccountBalanceWallet
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.PhoneAndroid
import androidx.compose.material.icons.filled.Security
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
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import com.aistudio.luckybet.data.model.TransactionType
import com.aistudio.luckybet.data.model.UserAccount
import com.aistudio.luckybet.data.model.WalletTransaction
import com.aistudio.luckybet.data.network.MpesaDarajaClient
import com.aistudio.luckybet.ui.theme.AccentAmber
import com.aistudio.luckybet.ui.theme.PrimaryRed
import com.aistudio.luckybet.ui.theme.SuccessGreen
import com.aistudio.luckybet.ui.theme.SuccessGreenDark
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

private fun categorizeTx(tx: WalletTransaction): String {
    return when (tx.type) {
        TransactionType.DEPOSIT_DEMO, TransactionType.PENDING_DEPOSIT -> "DEPOSITS"
        TransactionType.WITHDRAW_DEMO -> "WITHDRAWALS"
        TransactionType.AVIATOR_BET, TransactionType.SPORTS_BET -> "BETS"
        TransactionType.AVIATOR_WIN, TransactionType.SPORTS_WIN -> "WINS"
        TransactionType.BONUS, TransactionType.REFERRAL_BONUS -> "BONUSES"
    }
}

@Composable
fun CashierDialog(
    isOpen: Boolean,
    initialTab: String = "deposit",
    user: UserAccount,
    transactions: List<WalletTransaction>,
    onClose: () -> Unit,
    onTriggerStkPush: (amount: Double, phoneNumber: String) -> Unit,
    onRequestDeposit: (amount: Double, code: String) -> Unit,
    onInitiateWithdrawalWith2FA: (amount: Double, destinationPhone: String) -> Unit
) {
    if (!isOpen) return

    val configuredPaybill = remember { MpesaDarajaClient.getConfiguredPaybill() }
    val configuredAccount = remember { MpesaDarajaClient.getConfiguredPaybillAccount() }

    var currentTab by remember(initialTab) { mutableStateOf(initialTab) }
    var depositAmountText by remember { mutableStateOf("200") }
    var depositPhone by remember(user.phoneNumber) { mutableStateOf(user.phoneNumber.ifBlank { "0712345678" }) }
    var confCode by remember { mutableStateOf("") }
    var showManualPaybill by remember { mutableStateOf(false) }

    var withdrawAmount by remember { mutableDoubleStateOf(100.0) }
    var withdrawPhone by remember(user.phoneNumber) { mutableStateOf(user.phoneNumber.ifBlank { "0712345678" }) }

    var historyFilter by remember { mutableStateOf("ALL") }
    var successMsg by remember { mutableStateOf<String?>(null) }
    var errorMsg by remember { mutableStateOf<String?>(null) }

    val depositAmount = depositAmountText.toDoubleOrNull() ?: 0.0
    val isWithdrawalLocked = user.totalDepositedDemo < 100.0
    val remainingToUnlock = (100.0 - user.totalDepositedDemo).coerceAtLeast(0.0)

    Dialog(onDismissRequest = onClose) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .heightIn(max = 640.dp)
                .clip(RoundedCornerShape(20.dp))
                .background(Color(0xFF0F1522))
                .border(1.dp, Color(0xFF1E293B), RoundedCornerShape(20.dp))
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
                        contentDescription = "Cashier Wallet",
                        tint = AccentAmber,
                        modifier = Modifier.size(22.dp)
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Column {
                        Text(
                            text = "Cashier & M-PESA Wallet",
                            fontSize = 16.sp,
                            fontWeight = FontWeight.Black,
                            color = Color.White
                        )
                        Text(
                            text = "Balance: %.2f KES • %s".format(user.balance, user.phoneNumber),
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold,
                            color = SuccessGreen
                        )
                    }
                }

                IconButton(
                    onClick = onClose,
                    modifier = Modifier
                        .minimumInteractiveComponentSize()
                        .testTag("close_cashier_button")
                ) {
                    Icon(Icons.Default.Close, contentDescription = "Close cashier", tint = Color(0xFF94A3B8))
                }
            }

            Spacer(modifier = Modifier.height(10.dp))

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
                    Pair("history", "History (${transactions.size})")
                ).forEach { (tabId, label) ->
                    val isSelected = currentTab == tabId
                    Box(
                        modifier = Modifier
                            .weight(1f)
                            .minimumInteractiveComponentSize()
                            .clip(RoundedCornerShape(8.dp))
                            .background(if (isSelected) AccentAmber else Color.Transparent)
                            .clickable {
                                currentTab = tabId
                                successMsg = null
                                errorMsg = null
                            }
                            .padding(vertical = 8.dp)
                            .testTag("cashier_tab_$tabId"),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = label,
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Black,
                            color = if (isSelected) Color.Black else Color(0xFF94A3B8)
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(10.dp))

            // Status Alerts
            successMsg?.let { msg ->
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(10.dp))
                        .background(SuccessGreen.copy(alpha = 0.15f))
                        .border(1.dp, SuccessGreen.copy(alpha = 0.5f), RoundedCornerShape(10.dp))
                        .padding(10.dp)
                ) {
                    Text(text = msg, fontSize = 11.sp, color = SuccessGreen)
                }
                Spacer(modifier = Modifier.height(8.dp))
            }

            errorMsg?.let { msg ->
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(10.dp))
                        .background(PrimaryRed.copy(alpha = 0.15f))
                        .border(1.dp, PrimaryRed.copy(alpha = 0.5f), RoundedCornerShape(10.dp))
                        .padding(10.dp)
                ) {
                    Text(text = msg, fontSize = 11.sp, color = PrimaryRed)
                }
                Spacer(modifier = Modifier.height(8.dp))
            }

            // =========================================================================
            // TAB 1: DIRECT PAYBILL M-PESA USSD DEPOSIT
            // =========================================================================
            if (currentTab == "deposit") {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .verticalScroll(rememberScrollState())
                ) {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(14.dp))
                            .background(Color(0xFF081410))
                            .border(1.5.dp, SuccessGreen.copy(alpha = 0.55f), RoundedCornerShape(14.dp))
                            .padding(12.dp)
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(
                                imageVector = Icons.Default.PhoneAndroid,
                                contentDescription = null,
                                tint = SuccessGreen,
                                modifier = Modifier.size(20.dp)
                            )
                            Spacer(modifier = Modifier.width(8.dp))
                            Column(modifier = Modifier.weight(1f)) {
                                Text(
                                    text = "Direct Paybill USSD STK Push",
                                    fontSize = 13.sp,
                                    fontWeight = FontWeight.Black,
                                    color = Color.White
                                )
                                Text(
                                    text = "Prompts your phone for M-PESA PIN -> Paybill $configuredPaybill (Acc: $configuredAccount)",
                                    fontSize = 10.sp,
                                    color = Color(0xFFA7F3D0)
                                )
                            }
                        }

                        Spacer(modifier = Modifier.height(10.dp))

                        // Preset Chips
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(6.dp)
                        ) {
                            listOf(100, 200, 500, 1000).forEach { amt ->
                                val selected = depositAmount.toInt() == amt
                                Box(
                                    modifier = Modifier
                                        .weight(1f)
                                        .minimumInteractiveComponentSize()
                                        .clip(RoundedCornerShape(8.dp))
                                        .background(if (selected) SuccessGreen else Color(0xFF131F1B))
                                        .border(
                                            1.dp,
                                            if (selected) Color(0xFF6EE7B7) else Color(0xFF1E293B),
                                            RoundedCornerShape(8.dp)
                                        )
                                        .clickable { depositAmountText = amt.toString() }
                                        .padding(vertical = 8.dp)
                                        .testTag("deposit_preset_$amt"),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Text(
                                        text = "$amt KES",
                                        fontSize = 11.sp,
                                        fontWeight = FontWeight.Black,
                                        color = Color.White
                                    )
                                }
                            }
                        }

                        Spacer(modifier = Modifier.height(8.dp))

                        OutlinedTextField(
                            value = depositAmountText,
                            onValueChange = { depositAmountText = it.filter { ch -> ch.isDigit() } },
                            label = { Text("Amount (KES) - Min 10 KES") },
                            singleLine = true,
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedTextColor = Color.White,
                                unfocusedTextColor = Color.White,
                                focusedBorderColor = SuccessGreen,
                                unfocusedBorderColor = Color(0xFF1E293B)
                            ),
                            modifier = Modifier
                                .fillMaxWidth()
                                .testTag("deposit_amount_input")
                        )

                        Spacer(modifier = Modifier.height(8.dp))

                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(
                                text = "Phone Number to Receive USSD Prompt",
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold,
                                color = Color(0xFFCBD5E1)
                            )
                            if (user.phoneNumber.isNotBlank() && depositPhone != user.phoneNumber) {
                                Text(
                                    text = "Use ${user.phoneNumber}",
                                    fontSize = 10.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = AccentAmber,
                                    modifier = Modifier.clickable { depositPhone = user.phoneNumber }
                                )
                            }
                        }

                        Spacer(modifier = Modifier.height(4.dp))

                        OutlinedTextField(
                            value = depositPhone,
                            onValueChange = { depositPhone = it },
                            placeholder = { Text("e.g. 0712345678 or 254712345678") },
                            singleLine = true,
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Phone),
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedTextColor = Color.White,
                                unfocusedTextColor = Color.White,
                                focusedBorderColor = SuccessGreen,
                                unfocusedBorderColor = Color(0xFF1E293B)
                            ),
                            modifier = Modifier
                                .fillMaxWidth()
                                .testTag("deposit_phone_input")
                        )

                        Spacer(modifier = Modifier.height(10.dp))

                        Button(
                            onClick = {
                                if (depositAmount < 10.0) {
                                    errorMsg = "Minimum deposit is 10 KES"
                                    return@Button
                                }
                                val parsed = MpesaDarajaClient.formatKenyanPhone(depositPhone)
                                if (!parsed.isValid) {
                                    errorMsg = "Enter a valid Kenyan Safaricom number (e.g. 0712345678)"
                                    return@Button
                                }
                                errorMsg = null
                                successMsg = "Sending M-PESA USSD prompt to ${parsed.localDisplay} for Paybill $configuredPaybill..."
                                onTriggerStkPush(depositAmount, parsed.localDisplay)
                            },
                            colors = ButtonDefaults.buttonColors(containerColor = Color.Transparent),
                            shape = RoundedCornerShape(10.dp),
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(48.dp)
                                .background(
                                    Brush.horizontalGradient(listOf(SuccessGreen, SuccessGreenDark)),
                                    RoundedCornerShape(10.dp)
                                )
                                .testTag("send_stk_prompt_button")
                        ) {
                            Text(
                                text = "SEND M-PESA USSD PROMPT (KES %.0f)".format(depositAmount),
                                fontSize = 12.sp,
                                fontWeight = FontWeight.Black,
                                color = Color.White
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(10.dp))

                    // Secondary Manual Paybill Toggle
                    Text(
                        text = if (showManualPaybill) "Hide Manual Paybill Confirmation" else "Already paid via Paybill $configuredPaybill? Submit M-PESA Code",
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        color = AccentAmber,
                        modifier = Modifier
                            .minimumInteractiveComponentSize()
                            .clickable { showManualPaybill = !showManualPaybill }
                            .padding(vertical = 4.dp)
                    )

                    if (showManualPaybill) {
                        Spacer(modifier = Modifier.height(6.dp))
                        OutlinedTextField(
                            value = confCode,
                            onValueChange = { confCode = it.uppercase() },
                            label = { Text("M-PESA SMS Code (e.g. QK8912J1)") },
                            singleLine = true,
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedTextColor = Color.White,
                                unfocusedTextColor = Color.White,
                                focusedBorderColor = AccentAmber,
                                unfocusedBorderColor = Color(0xFF1E293B)
                            ),
                            modifier = Modifier.fillMaxWidth()
                        )
                        Spacer(modifier = Modifier.height(8.dp))
                        Button(
                            onClick = {
                                val code = confCode.ifBlank { "QK" + (10000000..99999999).random() }
                                onRequestDeposit(depositAmount.coerceAtLeast(100.0), code)
                                successMsg = "Manual Paybill code $code submitted for verification."
                                confCode = ""
                            },
                            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF1E293B)),
                            shape = RoundedCornerShape(10.dp),
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(48.dp)
                                .testTag("submit_deposit_button")
                        ) {
                            Text(
                                text = "SUBMIT MANUAL PAYBILL CODE",
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold,
                                color = Color.White
                            )
                        }
                    }
                }
            }

            // =========================================================================
            // TAB 2: WITHDRAW WITH MANDATORY 2FA SMS VERIFICATION
            // =========================================================================
            if (currentTab == "withdraw") {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .verticalScroll(rememberScrollState())
                ) {
                    if (isWithdrawalLocked) {
                        Column(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clip(RoundedCornerShape(12.dp))
                                .background(AccentAmber.copy(alpha = 0.12f))
                                .border(1.dp, AccentAmber.copy(alpha = 0.45f), RoundedCornerShape(12.dp))
                                .padding(12.dp)
                        ) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Icon(
                                    imageVector = Icons.Default.Lock,
                                    contentDescription = null,
                                    tint = AccentAmber,
                                    modifier = Modifier.size(18.dp)
                                )
                                Spacer(modifier = Modifier.width(6.dp))
                                Text(
                                    text = "Deposit 100 KES to Unlock Withdrawals",
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.Black,
                                    color = Color.White
                                )
                            }
                            Spacer(modifier = Modifier.height(4.dp))
                            Text(
                                text = "Deposit %.0f KES more via M-PESA USSD prompt to verify your account and withdraw your 100 KES welcome bonus, 20 KES referral bonuses, and winnings.".format(remainingToUnlock),
                                fontSize = 11.sp,
                                color = Color(0xFFCBD5E1),
                                lineHeight = 16.sp
                            )
                            Spacer(modifier = Modifier.height(8.dp))
                            Button(
                                onClick = {
                                    onTriggerStkPush(100.0, user.phoneNumber.ifBlank { withdrawPhone })
                                },
                                colors = ButtonDefaults.buttonColors(containerColor = SuccessGreen),
                                shape = RoundedCornerShape(10.dp),
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .height(48.dp)
                                    .testTag("unlock_withdrawal_stk_button")
                            ) {
                                Text(
                                    text = "VERIFY NOW (100 KES USSD PROMPT)",
                                    fontSize = 11.sp,
                                    fontWeight = FontWeight.Black,
                                    color = Color.White
                                )
                            }
                        }
                    } else {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clip(RoundedCornerShape(10.dp))
                                .background(SuccessGreen.copy(alpha = 0.12f))
                                .border(1.dp, SuccessGreen.copy(alpha = 0.4f), RoundedCornerShape(10.dp))
                                .padding(10.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Icon(
                                imageVector = Icons.Default.CheckCircle,
                                contentDescription = null,
                                tint = SuccessGreen,
                                modifier = Modifier.size(18.dp)
                            )
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(
                                text = "Account Verified! Mandatory 2FA SMS OTP protects every M-PESA withdrawal.",
                                fontSize = 11.sp,
                                color = Color(0xFFD1FAE5)
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(10.dp))

                    // Amount Presets
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(6.dp)
                    ) {
                        listOf(100.0, 300.0, 500.0).forEach { amt ->
                            Box(
                                modifier = Modifier
                                    .weight(1f)
                                    .minimumInteractiveComponentSize()
                                    .clip(RoundedCornerShape(8.dp))
                                    .background(if (withdrawAmount == amt) AccentAmber else Color(0xFF1E293B))
                                    .clickable { withdrawAmount = amt }
                                    .padding(vertical = 8.dp),
                                contentAlignment = Alignment.Center
                            ) {
                                Text(
                                    text = "%.0f KES".format(amt),
                                    fontSize = 11.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = if (withdrawAmount == amt) Color.Black else Color.White
                                )
                            }
                        }
                        Box(
                            modifier = Modifier
                                .weight(1f)
                                .minimumInteractiveComponentSize()
                                .clip(RoundedCornerShape(8.dp))
                                .background(AccentAmber.copy(alpha = 0.2f))
                                .border(1.dp, AccentAmber, RoundedCornerShape(8.dp))
                                .clickable { withdrawAmount = user.balance.coerceAtLeast(100.0) }
                                .padding(vertical = 8.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                text = "MAX",
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Black,
                                color = AccentAmber
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(8.dp))

                    OutlinedTextField(
                        value = "%.0f".format(withdrawAmount),
                        onValueChange = { str ->
                            str.filter { it.isDigit() }.toDoubleOrNull()?.let { withdrawAmount = it }
                        },
                        label = { Text("Withdrawal Amount (Min 100 KES)") },
                        singleLine = true,
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedTextColor = Color.White,
                            unfocusedTextColor = Color.White,
                            focusedBorderColor = AccentAmber,
                            unfocusedBorderColor = Color(0xFF1E293B)
                        ),
                        modifier = Modifier
                            .fillMaxWidth()
                            .testTag("withdraw_amount_input")
                    )

                    Spacer(modifier = Modifier.height(8.dp))

                    OutlinedTextField(
                        value = withdrawPhone,
                        onValueChange = { withdrawPhone = it },
                        label = { Text("M-PESA Payout Phone Number") },
                        singleLine = true,
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Phone),
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedTextColor = Color.White,
                            unfocusedTextColor = Color.White,
                            focusedBorderColor = AccentAmber,
                            unfocusedBorderColor = Color(0xFF1E293B)
                        ),
                        modifier = Modifier
                            .fillMaxWidth()
                            .testTag("withdraw_phone_input")
                    )

                    Spacer(modifier = Modifier.height(6.dp))

                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(
                            imageVector = Icons.Default.Security,
                            contentDescription = null,
                            tint = AccentAmber,
                            modifier = Modifier.size(14.dp)
                        )
                        Spacer(modifier = Modifier.width(6.dp))
                        Text(
                            text = "2FA SMS code will be sent to registered number: ${user.phoneNumber}",
                            fontSize = 10.sp,
                            fontFamily = FontFamily.Monospace,
                            color = Color(0xFF94A3B8)
                        )
                    }

                    Spacer(modifier = Modifier.height(12.dp))

                    Button(
                        onClick = {
                            if (isWithdrawalLocked) {
                                errorMsg = "Deposit at least 100 KES first to verify your account."
                                return@Button
                            }
                            if (withdrawAmount < 100.0) {
                                errorMsg = "Minimum withdrawal is 100 KES"
                                return@Button
                            }
                            if (withdrawAmount > user.balance) {
                                errorMsg = "Insufficient balance (Available: %.2f KES)".format(user.balance)
                                return@Button
                            }
                            val parsed = MpesaDarajaClient.formatKenyanPhone(withdrawPhone)
                            if (!parsed.isValid) {
                                errorMsg = "Enter a valid Kenyan M-PESA phone number"
                                return@Button
                            }
                            errorMsg = null
                            successMsg = null
                            onInitiateWithdrawalWith2FA(withdrawAmount, parsed.localDisplay)
                        },
                        enabled = !isWithdrawalLocked,
                        colors = ButtonDefaults.buttonColors(containerColor = AccentAmber),
                        shape = RoundedCornerShape(10.dp),
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(48.dp)
                            .testTag("submit_withdraw_button")
                    ) {
                        Text(
                            text = "WITHDRAW %.0f KES (SEND 2FA SMS)".format(withdrawAmount),
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Black,
                            color = Color.Black
                        )
                    }
                }
            }

            // =========================================================================
            // TAB 3: TRANSACTION HISTORY WITH CATEGORY FILTERS
            // =========================================================================
            if (currentTab == "history") {
                val categories = listOf("ALL", "BETS", "WINS", "BONUSES", "DEPOSITS", "WITHDRAWALS")
                val filtered = remember(transactions, historyFilter) {
                    if (historyFilter == "ALL") transactions
                    else transactions.filter { categorizeTx(it) == historyFilter }
                }

                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .horizontalScroll(rememberScrollState()),
                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    categories.forEach { cat ->
                        val count = if (cat == "ALL") transactions.size else transactions.count { categorizeTx(it) == cat }
                        val selected = historyFilter == cat
                        Box(
                            modifier = Modifier
                                .minimumInteractiveComponentSize()
                                .clip(RoundedCornerShape(50))
                                .background(if (selected) AccentAmber else Color(0xFF070A0F))
                                .border(1.dp, if (selected) AccentAmber else Color(0xFF1E293B), RoundedCornerShape(50))
                                .clickable { historyFilter = cat }
                                .padding(horizontal = 12.dp, vertical = 6.dp)
                                .testTag("history_filter_${cat.lowercase(Locale.US)}"),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                text = "$cat ($count)",
                                fontSize = 10.sp,
                                fontWeight = FontWeight.Bold,
                                color = if (selected) Color.Black else Color(0xFFCBD5E1)
                            )
                        }
                    }
                }

                Spacer(modifier = Modifier.height(8.dp))

                LazyColumn(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(240.dp),
                    verticalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    if (filtered.isEmpty()) {
                        item {
                            Text(
                                text = "No transactions in $historyFilter yet.",
                                fontSize = 12.sp,
                                color = Color(0xFF64748B),
                                modifier = Modifier.padding(16.dp)
                            )
                        }
                    } else {
                        items(filtered, key = { it.id }) { tx ->
                            val isPos = tx.amount >= 0
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .clip(RoundedCornerShape(8.dp))
                                    .background(Color(0xFF070A0F))
                                    .padding(10.dp),
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
