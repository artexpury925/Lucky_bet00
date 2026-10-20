package com.aistudio.luckybet.ui.components.aviator

import androidx.compose.animation.core.LinearEasing
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.drawscope.Fill
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.drawscope.rotate
import androidx.compose.ui.graphics.drawscope.translate
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.aistudio.luckybet.data.model.AviatorTheme
import com.aistudio.luckybet.data.model.GamePhase
import com.aistudio.luckybet.ui.theme.AccentAmber
import com.aistudio.luckybet.ui.theme.CyberCyan
import com.aistudio.luckybet.ui.theme.PrimaryRed
import kotlin.math.atan2
import kotlin.math.ceil
import kotlin.math.max
import kotlin.math.min
import kotlin.math.pow

@Composable
fun AviatorCanvasView(
    phase: GamePhase,
    multiplier: Double,
    theme: AviatorTheme,
    countdown: Float,
    modifier: Modifier = Modifier
) {
    val infiniteTransition = rememberInfiniteTransition(label = "propSpin")
    val propAngle by infiniteTransition.animateFloat(
        initialValue = 0f,
        targetValue = 360f,
        animationSpec = infiniteRepeatable(
            animation = tween(200, easing = LinearEasing),
            repeatMode = RepeatMode.Restart
        ),
        label = "propAngle"
    )

    val (bgCol, curveCol, fillTopCol, planeCol) = when (theme) {
        AviatorTheme.CYBER_NEON -> QuadColor(
            Color(0xFF090D16),
            CyberCyan,
            CyberCyan.copy(alpha = 0.35f),
            Color(0xFF38BDF8)
        )
        AviatorTheme.SAHARA_GOLD -> QuadColor(
            Color(0xFF140F09),
            AccentAmber,
            AccentAmber.copy(alpha = 0.35f),
            Color(0xFFFBBF24)
        )
        AviatorTheme.CLASSIC_RED -> QuadColor(
            Color(0xFF0F0709),
            PrimaryRed,
            PrimaryRed.copy(alpha = 0.40f),
            PrimaryRed
        )
    }

    Box(
        modifier = modifier
            .fillMaxWidth()
            .height(260.dp)
            .clip(RoundedCornerShape(16.dp))
            .border(1.dp, Color(0xFF1E293B), RoundedCornerShape(16.dp))
            .background(bgCol),
        contentAlignment = Alignment.Center
    ) {
        Canvas(modifier = Modifier.fillMaxSize()) {
            val width = size.width
            val height = size.height

            // 1. Perspective runway grid lines
            val gridStep = 40f
            var gx = 0f
            while (gx < width) {
                drawLine(
                    color = Color(0xFF1E293B).copy(alpha = 0.5f),
                    start = Offset(gx, 0f),
                    end = Offset(gx, height),
                    strokeWidth = 1f
                )
                gx += gridStep
            }
            var gy = 0f
            while (gy < height) {
                drawLine(
                    color = Color(0xFF1E293B).copy(alpha = 0.5f),
                    start = Offset(0f, gy),
                    end = Offset(width, gy),
                    strokeWidth = 1f
                )
                gy += gridStep
            }

            val paddingLeft = 40f
            val paddingBottom = 40f
            val flightWidth = width - paddingLeft - 60f
            val flightHeight = height - paddingBottom - 40f

            if (phase == GamePhase.FLYING || phase == GamePhase.CRASHED) {
                val progress = min(1.0, max(0.0, (multiplier - 1.0) / (if (multiplier > 10.0) 30.0 else 6.0))).toFloat()

                val startX = paddingLeft
                val startY = height - paddingBottom

                val endX = if (phase == GamePhase.CRASHED) {
                    startX + flightWidth * 1.25f
                } else {
                    startX + flightWidth * (0.15f + 0.8f * progress.toDouble().pow(0.7).toFloat())
                }

                val endY = if (phase == GamePhase.CRASHED) {
                    startY - flightHeight * 1.2f
                } else {
                    startY - flightHeight * (0.1f + 0.85f * progress.toDouble().pow(0.8).toFloat())
                }

                val controlX = startX + (endX - startX) * 0.55f
                val controlY = startY

                // Filled Area under Curve
                val fillPath = Path().apply {
                    moveTo(startX, startY)
                    quadraticTo(controlX, controlY, endX, endY)
                    lineTo(endX, startY)
                    close()
                }

                drawPath(
                    path = fillPath,
                    brush = Brush.verticalGradient(
                        colors = listOf(fillTopCol, fillTopCol.copy(alpha = 0.02f)),
                        startY = endY,
                        endY = startY
                    )
                )

                // Flight Curve line
                val linePath = Path().apply {
                    moveTo(startX, startY)
                    quadraticTo(controlX, controlY, endX, endY)
                }
                drawPath(
                    path = linePath,
                    color = curveCol,
                    style = Stroke(width = 6f)
                )

                // Angle of flight
                val angleRad = atan2((endY - controlY).toDouble(), (endX - controlX).toDouble()).toFloat() * 0.5f
                val angleDeg = Math.toDegrees(angleRad.toDouble()).toFloat()

                // Airplane vector
                translate(left = endX, top = endY) {
                    rotate(degrees = angleDeg) {
                        drawPlane(planeColor = planeCol, propRotation = propAngle)
                    }
                }
            } else {
                // WAITING phase: plane idle on runway
                val runwayX = paddingLeft + 30f
                val runwayY = height - paddingBottom - 10f
                translate(left = runwayX, top = runwayY) {
                    drawPlane(planeColor = planeCol, propRotation = propAngle)
                }
            }
        }

        // Overlay status indicators
        when (phase) {
            GamePhase.FLYING -> {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text(
                        text = "%.2fx".format(multiplier),
                        fontSize = 44.sp,
                        fontWeight = FontWeight.Black,
                        fontFamily = FontFamily.SansSerif,
                        color = Color.White
                    )
                    Text(
                        text = "CURRENT MULTIPLIER",
                        fontSize = 10.sp,
                        fontWeight = FontWeight.Bold,
                        color = Color(0xFF94A3B8),
                        modifier = Modifier
                            .background(Color(0xFF090D16).copy(alpha = 0.8f), RoundedCornerShape(12.dp))
                            .padding(horizontal = 10.dp, vertical = 2.dp)
                    )
                }
            }
            GamePhase.CRASHED -> {
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .background(PrimaryRed.copy(alpha = 0.15f)),
                    contentAlignment = Alignment.Center
                ) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Text(
                            text = "FLEW AWAY!",
                            fontSize = 32.sp,
                            fontWeight = FontWeight.Black,
                            color = PrimaryRed
                        )
                        Text(
                            text = "%.2fx".format(multiplier),
                            fontSize = 38.sp,
                            fontWeight = FontWeight.Black,
                            color = Color.White
                        )
                    }
                }
            }
            GamePhase.WAITING -> {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Box(contentAlignment = Alignment.Center) {
                        CircularProgressIndicator(
                            progress = { max(0f, (5f - countdown) / 5f) },
                            modifier = Modifier.size(64.dp),
                            color = AccentAmber,
                            trackColor = Color(0xFF1E293B),
                            strokeWidth = 6.dp
                        )
                        Text(
                            text = "${max(1, ceil(countdown).toInt())}s",
                            fontSize = 18.sp,
                            fontWeight = FontWeight.Black,
                            color = Color.White
                        )
                    }
                    Spacer(modifier = Modifier.height(10.dp))
                    Text(
                        text = "WAITING FOR NEXT FLIGHT",
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        color = Color(0xFFE2E8F0),
                        letterSpacing = 1.sp
                    )
                    Spacer(modifier = Modifier.height(6.dp))
                    LinearProgressIndicator(
                        progress = { max(0f, (5f - countdown) / 5f) },
                        modifier = Modifier
                            .fillMaxWidth(0.5f)
                            .height(4.dp)
                            .clip(RoundedCornerShape(2.dp)),
                        color = AccentAmber,
                        trackColor = Color(0xFF1E293B)
                    )
                }
            }
        }
    }
}

private fun androidx.compose.ui.graphics.drawscope.DrawScope.drawPlane(
    planeColor: Color,
    propRotation: Float
) {
    // Fuselage
    val bodyPath = Path().apply {
        moveTo(28f, 0f)
        quadraticTo(8f, -9f, -20f, -7f)
        lineTo(-30f, -18f)
        lineTo(-24f, -2f)
        lineTo(-32f, 2f)
        lineTo(-22f, 6f)
        quadraticTo(8f, 8f, 28f, 0f)
        close()
    }
    drawPath(bodyPath, color = planeColor, style = Fill)

    // Cockpit glass
    drawOval(
        color = Color.White,
        topLeft = Offset(-4f, -6f),
        size = androidx.compose.ui.geometry.Size(14f, 7f)
    )

    // Main wing
    val wingPath = Path().apply {
        moveTo(8f, -2f)
        lineTo(-10f, -22f)
        lineTo(-16f, -22f)
        lineTo(-4f, -1f)
        close()
    }
    drawPath(wingPath, color = Color.White.copy(alpha = 0.85f), style = Fill)

    // Lower wing
    val lowerWingPath = Path().apply {
        moveTo(8f, 2f)
        lineTo(-8f, 16f)
        lineTo(-14f, 16f)
        lineTo(-3f, 2f)
        close()
    }
    drawPath(lowerWingPath, color = Color.White.copy(alpha = 0.85f), style = Fill)

    // Propeller spinning blade
    rotate(degrees = propRotation, pivot = Offset(28f, 0f)) {
        drawRect(
            color = Color.White.copy(alpha = 0.85f),
            topLeft = Offset(26f, -16f),
            size = androidx.compose.ui.geometry.Size(4f, 32f)
        )
    }
}

private data class QuadColor(
    val bg: Color,
    val curve: Color,
    val fill: Color,
    val plane: Color
)
