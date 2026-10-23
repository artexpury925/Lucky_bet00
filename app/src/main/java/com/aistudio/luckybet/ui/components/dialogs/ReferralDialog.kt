package com.aistudio.luckybet.ui.components.dialogs

import android.content.Intent
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
import androidx.compose.material.icons.filled.CardGiftcard
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.ContentCopy
import androidx.compose.material.icons.filled.Share
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
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalClipboardManager
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.AnnotatedString
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import com.aistudio.luckybet.data.model.UserAccount
import com.aistudio.luckybet.ui.theme.AccentAmber
import com.aistudio.luckybet.ui.theme.SuccessGreen

@Composable
fun ReferralDialog(
    isOpen: Boolean,
    user: UserAccount,
    onClose: () -> Unit,
    onApplyReferralCode: (String) -> Unit
) {
    if (!isOpen) return

    val context = LocalContext.current
    val clipboard = LocalClipboardManager.current
    var copied by remember { mutableStateOf(false) }
    var friendCode by remember { mutableStateOf(user.referredBy.orEmpty()) }
    var feedback by remember { mutableStateOf<String?>(null) }

    Dialog(onDismissRequest = onClose) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(18.dp))
                .background(Color(0xFF0F1522))
                .border(1.dp, Color(0xFF1E293B), RoundedCornerShape(18.dp))
                .padding(16.dp)
                .testTag("referral_dialog")
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(
                        imageVector = Icons.Default.CardGiftcard,
                        contentDescription = "Refer and Earn",
                        tint = AccentAmber,
                        modifier = Modifier.size(22.dp)
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        text = "Invite Friends, Earn 20 KES",
                        fontSize = 16.sp,
                        fontWeight = FontWeight.Black,
                        color = Color.White
                    )
                }

                IconButton(
                    onClick = onClose,
                    modifier = Modifier.minimumInteractiveComponentSize()
                ) {
                    Icon(Icons.Default.Close, contentDescription = "Close referral dialog", tint = Color(0xFF94A3B8))
                }
            }

            Spacer(modifier = Modifier.height(8.dp))

            Text(
                text = "Friends get a 100 KES Welcome Bonus when they join, and you earn an instant 20 KES cash bonus every time they deposit!",
                fontSize = 11.sp,
                color = Color(0xFFCBD5E1),
                lineHeight = 16.sp
            )

            Spacer(modifier = Modifier.height(12.dp))

            // Stats Row
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Column(
                    modifier = Modifier
                        .weight(1f)
                        .clip(RoundedCornerShape(10.dp))
                        .background(Color(0xFF070A0F))
                        .padding(10.dp)
                ) {
                    Text(text = "Friends Invited", fontSize = 10.sp, color = Color(0xFF94A3B8))
                    Text(
                        text = "${user.referralCount}",
                        fontSize = 18.sp,
                        fontWeight = FontWeight.Black,
                        color = Color.White
                    )
                }
                Column(
                    modifier = Modifier
                        .weight(1f)
                        .clip(RoundedCornerShape(10.dp))
                        .background(Color(0xFF070A0F))
                        .padding(10.dp)
                ) {
                    Text(text = "Total Earned (+20/dep)", fontSize = 10.sp, color = Color(0xFF94A3B8))
                    Text(
                        text = "%.0f KES".format(user.referralBonusEarned),
                        fontSize = 18.sp,
                        fontWeight = FontWeight.Black,
                        color = SuccessGreen
                    )
                }
            }

            Spacer(modifier = Modifier.height(12.dp))

            // Code & Copy/Share
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(10.dp))
                    .background(Color(0xFF070A0F))
                    .border(1.dp, AccentAmber.copy(alpha = 0.4f), RoundedCornerShape(10.dp))
                    .padding(10.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text(text = "YOUR REFERRAL CODE", fontSize = 9.sp, color = Color(0xFF94A3B8))
                    Text(
                        text = user.referralCode,
                        fontSize = 15.sp,
                        fontFamily = FontFamily.Monospace,
                        fontWeight = FontWeight.Black,
                        color = AccentAmber
                    )
                }

                Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                    IconButton(
                        onClick = {
                            clipboard.setText(AnnotatedString(user.referralCode))
                            copied = true
                        },
                        modifier = Modifier
                            .minimumInteractiveComponentSize()
                            .testTag("copy_referral_code_button")
                    ) {
                        Icon(
                            imageVector = Icons.Default.ContentCopy,
                            contentDescription = "Copy referral code",
                            tint = if (copied) SuccessGreen else Color.White
                        )
                    }
                    IconButton(
                        onClick = {
                            val sendIntent = Intent(Intent.ACTION_SEND).apply {
                                type = "text/plain"
                                putExtra(
                                    Intent.EXTRA_TEXT,
                                    "Join Lucky Bet with my code ${user.referralCode} and claim your 100 KES Welcome Bonus!"
                                )
                            }
                            context.startActivity(Intent.createChooser(sendIntent, "Share Referral Code"))
                        },
                        modifier = Modifier
                            .minimumInteractiveComponentSize()
                            .testTag("share_referral_code_button")
                    ) {
                        Icon(
                            imageVector = Icons.Default.Share,
                            contentDescription = "Share referral code",
                            tint = AccentAmber
                        )
                    }
                }
            }

            if (user.referredBy.isNullOrBlank()) {
                Spacer(modifier = Modifier.height(12.dp))
                OutlinedTextField(
                    value = friendCode,
                    onValueChange = { friendCode = it.uppercase() },
                    label = { Text("Have a Friend's Code? Enter Here") },
                    singleLine = true,
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedTextColor = Color.White,
                        unfocusedTextColor = Color.White,
                        focusedBorderColor = AccentAmber,
                        unfocusedBorderColor = Color(0xFF1E293B)
                    ),
                    modifier = Modifier
                        .fillMaxWidth()
                        .testTag("friend_referral_input")
                )
                Spacer(modifier = Modifier.height(8.dp))
                Button(
                    onClick = {
                        if (friendCode.isNotBlank() && friendCode != user.referralCode) {
                            onApplyReferralCode(friendCode.trim())
                            feedback = "Referral code ${friendCode.trim()} linked! Your referrer earns 20 KES when you deposit."
                        }
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = AccentAmber),
                    shape = RoundedCornerShape(10.dp),
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(48.dp)
                        .testTag("apply_referral_button")
                ) {
                    Text(
                        text = "LINK FRIEND CODE",
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Black,
                        color = Color.Black
                    )
                }
            }

            feedback?.let {
                Spacer(modifier = Modifier.height(8.dp))
                Text(text = it, fontSize = 11.sp, color = SuccessGreen)
            }
        }
    }
}
