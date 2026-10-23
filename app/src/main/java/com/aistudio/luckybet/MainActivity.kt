package com.aistudio.luckybet

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.BackHandler
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.safeDrawing
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CardGiftcard
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.FlightTakeoff
import androidx.compose.material.icons.filled.HelpOutline
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Sms
import androidx.compose.material.icons.filled.SportsSoccer
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.minimumInteractiveComponentSize
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
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
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import com.aistudio.luckybet.ui.components.admin.AdminPanelDialog
import com.aistudio.luckybet.ui.components.aviator.AviatorCanvasView
import com.aistudio.luckybet.ui.components.aviator.BetPanelComponent
import com.aistudio.luckybet.ui.components.aviator.FlightHistoryBar
import com.aistudio.luckybet.ui.components.aviator.LiveBetsTable
import com.aistudio.luckybet.ui.components.cashier.CashierDialog
import com.aistudio.luckybet.ui.components.cashier.StkPushDialog
import com.aistudio.luckybet.ui.components.cashier.WithdrawalOtpDialog
import com.aistudio.luckybet.ui.components.dialogs.HowToPlayDialog
import com.aistudio.luckybet.ui.components.dialogs.ReferralDialog
import com.aistudio.luckybet.ui.components.dialogs.UserAccountDialog
import com.aistudio.luckybet.ui.components.sports.BetSlipView
import com.aistudio.luckybet.ui.components.sports.SportsBettingView
import com.aistudio.luckybet.ui.theme.AccentAmber
import com.aistudio.luckybet.ui.theme.BgDark
import com.aistudio.luckybet.ui.theme.LuckyBetTheme
import com.aistudio.luckybet.ui.theme.PrimaryRed
import com.aistudio.luckybet.ui.theme.SuccessGreen
import com.aistudio.luckybet.ui.theme.SuccessGreenDark
import com.aistudio.luckybet.ui.viewmodel.LuckyBetViewModel

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            LuckyBetTheme {
                LuckyBetApp()
            }
        }
    }
}

@Composable
fun LuckyBetApp(
    vm: LuckyBetViewModel = viewModel()
) {
    val state by vm.uiState.collectAsStateWithLifecycle()
    var adminTapCount by remember { mutableIntStateOf(0) }

    if (state.activeTab != "aviator") {
        BackHandler {
            vm.setActiveTab("aviator")
        }
    }

    Scaffold(
        contentWindowInsets = WindowInsets.safeDrawing,
        containerColor = BgDark,
        bottomBar = {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(Color(0xFF0E121A))
                    .border(1.dp, Color(0xFF1E293B))
                    .navigationBarsPadding()
                    .padding(horizontal = 12.dp, vertical = 6.dp),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                val tabs = listOf(
                    Triple("aviator", "Aviator Crash", Icons.Default.FlightTakeoff),
                    Triple("sports", "Live Football (${state.matches.size})", Icons.Default.SportsSoccer)
                )
                tabs.forEach { (id, label, icon) ->
                    val selected = state.activeTab == id
                    Row(
                        modifier = Modifier
                            .weight(1f)
                            .minimumInteractiveComponentSize()
                            .clip(RoundedCornerShape(12.dp))
                            .background(if (selected) AccentAmber else Color(0xFF131824))
                            .clickable { vm.setActiveTab(id) }
                            .padding(vertical = 10.dp, horizontal = 12.dp)
                            .testTag("nav_tab_$id"),
                        horizontalArrangement = Arrangement.Center,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(
                            imageVector = icon,
                            contentDescription = label,
                            tint = if (selected) Color.Black else Color(0xFF94A3B8),
                            modifier = Modifier.size(18.dp)
                        )
                        Spacer(modifier = Modifier.width(6.dp))
                        Text(
                            text = label,
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Black,
                            color = if (selected) Color.Black else Color.White
                        )
                    }
                }
            }
        }
    ) { innerPadding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
        ) {
            // Top Bar
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(Color(0xFF0E121A))
                    .padding(horizontal = 12.dp, vertical = 8.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    modifier = Modifier.clickable {
                        adminTapCount++
                        if (adminTapCount >= 5) {
                            adminTapCount = 0
                            vm.setAdminOpen(true)
                        }
                    }
                ) {
                    Box(
                        modifier = Modifier
                            .size(34.dp)
                            .clip(RoundedCornerShape(10.dp))
                            .background(Brush.linearGradient(listOf(PrimaryRed, AccentAmber))),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            imageVector = Icons.Default.FlightTakeoff,
                            contentDescription = "Lucky Bet Logo",
                            tint = Color.White,
                            modifier = Modifier.size(18.dp)
                        )
                    }
                    Spacer(modifier = Modifier.width(8.dp))
                    Column {
                        Text(
                            text = "LUCKY BET",
                            fontSize = 15.sp,
                            fontWeight = FontWeight.Black,
                            color = Color.White
                        )
                        Text(
                            text = "%.2f KES".format(state.user.balance),
                            fontSize = 12.sp,
                            fontFamily = FontFamily.Monospace,
                            fontWeight = FontWeight.Black,
                            color = SuccessGreen,
                            modifier = Modifier.testTag("header_balance_text")
                        )
                    }
                }

                Row(
                    horizontalArrangement = Arrangement.spacedBy(4.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Button(
                        onClick = { vm.setCashierOpen(true, "deposit") },
                        colors = ButtonDefaults.buttonColors(containerColor = SuccessGreen),
                        shape = RoundedCornerShape(10.dp),
                        modifier = Modifier
                            .height(48.dp)
                            .testTag("open_deposit_button")
                    ) {
                        Text(
                            text = "DEPOSIT",
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Black,
                            color = Color.White
                        )
                    }

                    Button(
                        onClick = { vm.setCashierOpen(true, "withdraw") },
                        colors = ButtonDefaults.buttonColors(containerColor = AccentAmber),
                        shape = RoundedCornerShape(10.dp),
                        modifier = Modifier
                            .height(48.dp)
                            .testTag("open_withdraw_button")
                    ) {
                        Text(
                            text = "WITHDRAW",
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Black,
                            color = Color.Black
                        )
                    }

                    IconButton(
                        onClick = { vm.setReferralOpen(true) },
                        modifier = Modifier
                            .minimumInteractiveComponentSize()
                            .testTag("open_referral_button")
                    ) {
                        Icon(
                            imageVector = Icons.Default.CardGiftcard,
                            contentDescription = "Refer and earn 20 KES",
                            tint = AccentAmber
                        )
                    }

                    IconButton(
                        onClick = { vm.setAccountOpen(true) },
                        modifier = Modifier
                            .minimumInteractiveComponentSize()
                            .testTag("open_account_button")
                    ) {
                        Icon(
                            imageVector = Icons.Default.Person,
                            contentDescription = "Player account",
                            tint = Color(0xFFCBD5E1)
                        )
                    }

                    IconButton(
                        onClick = { vm.setRulesOpen(true) },
                        modifier = Modifier
                            .minimumInteractiveComponentSize()
                            .testTag("open_rules_button")
                    ) {
                        Icon(
                            imageVector = Icons.Default.HelpOutline,
                            contentDescription = "How to play",
                            tint = Color(0xFF94A3B8)
                        )
                    }
                }
            }

            // Real-time Incoming SMS Banner (M-PESA Receipts & 2FA OTPs)
            AnimatedVisibility(visible = state.latestSmsBanner != null) {
                state.latestSmsBanner?.let { sms ->
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 12.dp, vertical = 6.dp)
                            .clip(RoundedCornerShape(12.dp))
                            .background(Color(0xFF06281E))
                            .border(1.dp, SuccessGreen, RoundedCornerShape(12.dp))
                            .padding(10.dp)
                            .testTag("sms_notification_banner"),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(
                            imageVector = Icons.Default.Sms,
                            contentDescription = "SMS Notification",
                            tint = SuccessGreen,
                            modifier = Modifier.size(20.dp)
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = sms,
                            fontSize = 11.sp,
                            fontWeight = FontWeight.SemiBold,
                            color = Color.White,
                            modifier = Modifier.weight(1f)
                        )
                        IconButton(
                            onClick = { vm.dismissSmsBanner() },
                            modifier = Modifier.minimumInteractiveComponentSize()
                        ) {
                            Icon(
                                imageVector = Icons.Default.Close,
                                contentDescription = "Dismiss SMS",
                                tint = Color(0xFFA7F3D0),
                                modifier = Modifier.size(16.dp)
                            )
                        }
                    }
                }
            }

            // Main Adaptive Content
            BoxWithConstraints(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(horizontal = 12.dp)
            ) {
                val isWide = maxWidth >= 700.dp

                Column(
                    modifier = Modifier
                        .fillMaxSize()
                        .verticalScroll(rememberScrollState()),
                    verticalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    Spacer(modifier = Modifier.height(4.dp))

                    // Welcome Bonus & Direct Paybill Banner
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(12.dp))
                            .background(
                                Brush.horizontalGradient(
                                    listOf(Color(0xFF1A2234), Color(0xFF0F172A))
                                )
                            )
                            .border(1.dp, AccentAmber.copy(alpha = 0.35f), RoundedCornerShape(12.dp))
                            .padding(horizontal = 12.dp, vertical = 8.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                text = "100 KES Welcome Bonus • +20 KES Referral",
                                fontSize = 12.sp,
                                fontWeight = FontWeight.Black,
                                color = AccentAmber
                            )
                            Text(
                                text = "Instant M-PESA USSD Paybill deposits & 2FA SMS protected payouts.",
                                fontSize = 10.sp,
                                color = Color(0xFFCBD5E1)
                            )
                        }
                        Box(
                            modifier = Modifier
                                .minimumInteractiveComponentSize()
                                .clip(RoundedCornerShape(8.dp))
                                .background(Brush.horizontalGradient(listOf(SuccessGreen, SuccessGreenDark)))
                                .clickable { vm.setCashierOpen(true, "deposit") }
                                .padding(horizontal = 10.dp, vertical = 8.dp)
                                .testTag("banner_ussd_topup_button"),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                text = "USSD TOP-UP",
                                fontSize = 10.sp,
                                fontWeight = FontWeight.Black,
                                color = Color.White
                            )
                        }
                    }

                    if (state.activeTab == "aviator") {
                        FlightHistoryBar(
                            history = state.history,
                            hourlyMood = state.hourlyMood,
                            minutesToShift = state.minutesToShift
                        )

                        AviatorCanvasView(
                            phase = state.phase,
                            multiplier = state.currentMultiplier,
                            theme = state.theme,
                            countdown = state.countdown,
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(250.dp)
                        )

                        if (isWide) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.spacedBy(10.dp)
                            ) {
                                BetPanelComponent(
                                    id = "bet1",
                                    title = "Flight Bet #1",
                                    phase = state.phase,
                                    currentMultiplier = state.currentMultiplier,
                                    betConfig = state.bet1,
                                    userBalance = state.user.balance,
                                    onPlaceBet = vm::placeBet1,
                                    onCancelBet = vm::cancelBet1,
                                    onCashOut = vm::cashoutBet1,
                                    modifier = Modifier.weight(1f)
                                )
                                BetPanelComponent(
                                    id = "bet2",
                                    title = "Flight Bet #2",
                                    phase = state.phase,
                                    currentMultiplier = state.currentMultiplier,
                                    betConfig = state.bet2,
                                    userBalance = state.user.balance,
                                    onPlaceBet = vm::placeBet2,
                                    onCancelBet = vm::cancelBet2,
                                    onCashOut = vm::cashoutBet2,
                                    modifier = Modifier.weight(1f)
                                )
                            }
                        } else {
                            BetPanelComponent(
                                id = "bet1",
                                title = "Flight Bet #1",
                                phase = state.phase,
                                currentMultiplier = state.currentMultiplier,
                                betConfig = state.bet1,
                                userBalance = state.user.balance,
                                onPlaceBet = vm::placeBet1,
                                onCancelBet = vm::cancelBet1,
                                onCashOut = vm::cashoutBet1
                            )
                            BetPanelComponent(
                                id = "bet2",
                                title = "Flight Bet #2",
                                phase = state.phase,
                                currentMultiplier = state.currentMultiplier,
                                betConfig = state.bet2,
                                userBalance = state.user.balance,
                                onPlaceBet = vm::placeBet2,
                                onCancelBet = vm::cancelBet2,
                                onCashOut = vm::cashoutBet2
                            )
                        }

                        LiveBetsTable(
                            players = state.simPlayers,
                            currentMultiplier = state.currentMultiplier,
                            myHistory = state.myFlightHistory
                        )
                    } else {
                        if (isWide) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.spacedBy(10.dp)
                            ) {
                                SportsBettingView(
                                    matches = state.matches,
                                    activeSlip = state.activeSlip,
                                    onToggleSelection = vm::toggleSlipSelection,
                                    modifier = Modifier.weight(1.4f)
                                )
                                BetSlipView(
                                    selections = state.activeSlip,
                                    placedBets = state.placedSportsBets,
                                    userBalance = state.user.balance,
                                    onRemoveSelection = vm::removeSlipSelection,
                                    onClearSlip = vm::clearSlip,
                                    onPlaceBet = vm::placeSportsBet,
                                    modifier = Modifier.weight(1f)
                                )
                            }
                        } else {
                            SportsBettingView(
                                matches = state.matches,
                                activeSlip = state.activeSlip,
                                onToggleSelection = vm::toggleSlipSelection
                            )
                            BetSlipView(
                                selections = state.activeSlip,
                                placedBets = state.placedSportsBets,
                                userBalance = state.user.balance,
                                onRemoveSelection = vm::removeSlipSelection,
                                onClearSlip = vm::clearSlip,
                                onPlaceBet = vm::placeSportsBet
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(16.dp))
                }
            }
        }
    }

    // =========================================================================
    // DIALOGS & MODALS
    // =========================================================================
    CashierDialog(
        isOpen = state.isCashierOpen,
        initialTab = state.cashierInitialTab,
        user = state.user,
        transactions = state.transactions,
        onClose = { vm.setCashierOpen(false) },
        onTriggerStkPush = vm::triggerStkPush,
        onRequestDeposit = vm::requestDeposit,
        onInitiateWithdrawalWith2FA = vm::initiateWithdrawalWith2FA
    )

    StkPushDialog(
        promptState = state.stkPrompt,
        onSubmitPin = vm::submitStkPin,
        onCancel = vm::cancelStkPrompt
    )

    WithdrawalOtpDialog(
        challenge = state.withdrawalOtpChallenge,
        onVerifyOtp = vm::verifyWithdrawalOtp,
        onResendOtp = vm::resendWithdrawalOtp,
        onCancel = vm::cancelWithdrawalOtp
    )

    ReferralDialog(
        isOpen = state.isReferralOpen,
        user = state.user,
        onClose = { vm.setReferralOpen(false) },
        onApplyReferralCode = vm::applyReferralCode
    )

    HowToPlayDialog(
        isOpen = state.isRulesOpen,
        onClose = { vm.setRulesOpen(false) }
    )

    UserAccountDialog(
        isOpen = state.isAccountOpen,
        currentUser = state.user,
        onClose = { vm.setAccountOpen(false) },
        onUpdateUser = vm::updateUser
    )

    AdminPanelDialog(
        isOpen = state.isAdminOpen,
        onClose = { vm.setAdminOpen(false) },
        registeredUsers = state.registeredUsers,
        pendingDeposits = state.pendingDeposits,
        onApproveDeposit = vm::approveDeposit,
        onRejectDeposit = vm::rejectDeposit,
        onAdminAddFundsToUser = vm::adminAddFunds,
        rtpRate = state.rtpRate,
        onUpdateRtp = vm::updateRtp,
        onTriggerSpecialFlight = vm::triggerSpecialFlight,
        onResetBalances = vm::resetBalances,
        hourlyMood = state.hourlyMood,
        onSetMood = vm::setHourlyMood,
        isAutoMood = state.isAutoMood,
        onToggleAutoMood = vm::setAutoMood
    )
}
