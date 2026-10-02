package com.vynyl.record.ui.components

import android.content.Context
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.pager.HorizontalPager
import androidx.compose.foundation.pager.rememberPagerState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.animation.core.animateDpAsState
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.DrawScope
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.vynyl.record.ui.theme.V
import com.vynyl.record.ui.theme.decoStyle
import com.vynyl.record.ui.theme.displayStyle
import com.vynyl.record.ui.theme.sansStyle
import kotlinx.coroutines.launch

private const val KEY = "onboarded"

private class Slide(val kicker: String, val title: String, val body: String, val art: DrawScope.() -> Unit)

private val SLIDES = listOf(
    Slide("WELCOME TO VYNYL", "Press a moment into wax", "Record a voice note — a birthday wish, a lullaby, a memory — and Vynyl presses it onto a one-of-a-kind vinyl record.") { artMic() },
    Slide("STUDIO", "Give it a character", "Pick a sound like a 1950s radio or a dusty jazz club, add crackle, set background music, and choose the colour of the wax.") { artDials() },
    Slide("TURNTABLE", "Drop the needle", "Play your record on a real 3D turntable. Drag to look around, pinch to zoom, and add a loved-one photo to the centre label.") { artDisc() },
    Slide("MASTER VAULT", "Keep it, share it", "Every record waits on your shelf. Export it as audio or a spinning-turntable video. Everything stays on this device unless you share it.") { artVault() },
)

/** True until the welcome slides have been finished or skipped once. */
fun needsOnboarding(ctx: Context) = !ctx.getSharedPreferences("vynyl", Context.MODE_PRIVATE).getBoolean(KEY, false)

/** First-launch welcome slides; shown once, after the splash (mirrors web Onboarding.tsx). */
@Composable
fun Onboarding(onDone: () -> Unit) {
    val ctx = LocalContext.current
    val pager = rememberPagerState { SLIDES.size }
    val scope = rememberCoroutineScope()
    val finish = { ctx.getSharedPreferences("vynyl", Context.MODE_PRIVATE).edit().putBoolean(KEY, true).apply(); onDone() }
    val last = pager.currentPage == SLIDES.lastIndex

    Column(
        Modifier.fillMaxSize().background(V.obsidian)
            .background(Brush.radialGradient(listOf(V.amber.copy(alpha = 0.2f), Color.Transparent), center = Offset(540f, 620f), radius = 900f))
            .clickable(remember { MutableInteractionSource() }, null) {}
            .statusBarsPadding().navigationBarsPadding(),
    ) {
        Row(Modifier.fillMaxWidth().padding(16.dp), horizontalArrangement = Arrangement.End) {
            Text("Skip", style = sansStyle(12, V.muted), modifier = Modifier.clip(CircleShape).clickable { finish() }.padding(horizontal = 12.dp, vertical = 10.dp))
        }
        HorizontalPager(pager, Modifier.weight(1f).fillMaxWidth()) { n ->
            val s = SLIDES[n]
            Column(Modifier.fillMaxSize().padding(horizontal = 32.dp), horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.Center) {
                Canvas(Modifier.size(160.dp)) {
                    drawCircle(V.stone); drawCircle(V.brass.copy(alpha = 0.4f), style = Stroke(1.dp.toPx()))
                    s.art(this)
                }
                Text(s.kicker, style = decoStyle(10, V.amberBright), modifier = Modifier.padding(top = 40.dp))
                Text(s.title, style = displayStyle(32), textAlign = TextAlign.Center, modifier = Modifier.padding(top = 12.dp))
                Text(s.body, style = sansStyle(14, V.muted).copy(lineHeight = 22.sp), textAlign = TextAlign.Center, modifier = Modifier.padding(top = 16.dp).widthIn(max = 300.dp))
            }
        }
        Row(Modifier.fillMaxWidth().padding(start = 24.dp, end = 24.dp, top = 16.dp, bottom = 28.dp), verticalAlignment = Alignment.CenterVertically) {
            Row(Modifier.weight(1f), horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                SLIDES.indices.forEach { n ->
                    val w by animateDpAsState(if (n == pager.currentPage) 24.dp else 6.dp, label = "dot")
                    Box(Modifier.size(w, 6.dp).clip(CircleShape).background(if (n == pager.currentPage) V.amberBright else V.cream.copy(alpha = 0.25f))
                        .clickable { scope.launch { pager.animateScrollToPage(n) } })
                }
            }
            Box(
                Modifier.height(48.dp).clip(CircleShape).background(Brush.verticalGradient(listOf(V.gold1, V.gold2, V.gold3)))
                    .clickable { if (last) finish() else scope.launch { pager.animateScrollToPage(pager.currentPage + 1) } }
                    .padding(horizontal = 24.dp),
                contentAlignment = Alignment.Center,
            ) { Text(if (last) "START RECORDING" else "NEXT", style = decoStyle(14, V.obsidian)) }
        }
    }
}

// ── slide art, on the same 160-unit grid as the web SVGs ──
private fun DrawScope.u() = size.minDimension / 160f
private fun DrawScope.line(x1: Float, y1: Float, x2: Float, y2: Float, a: Float = 1f) =
    drawLine(V.amberBright.copy(alpha = a), Offset(x1 * u(), y1 * u()), Offset(x2 * u(), y2 * u()), 2.5f * u(), StrokeCap.Round)
private val Fill = Color(0xFFF59E0B)

private fun DrawScope.artMic() {
    val k = u(); val st = Stroke(2.5f * k, cap = StrokeCap.Round)
    drawRoundRect(V.amberBright, Offset(64 * k, 38 * k), Size(32 * k, 54 * k), CornerRadius(16 * k), style = st)
    drawArc(V.amberBright, 0f, 180f, false, Offset(52 * k, 52 * k), Size(56 * k, 56 * k), style = st)
    line(80f, 108f, 80f, 122f); line(66f, 122f, 94f, 122f)
    for (i in 0..2) drawArc(V.amberBright.copy(alpha = 1f - i * 0.3f), -50f, 100f, false, Offset((106 + i * 7) * k, (68 - i * 4) * k), Size(16 * k, 24 * k), style = st)
}

private fun DrawScope.artDials() {
    val k = u()
    listOf(52f to 86f, 80f to 54f, 108f to 72f).forEach { (x, y) ->
        line(x, 40f, x, 120f, 0.35f)
        drawRoundRect(Fill, Offset((x - 9) * k, y * k), Size(18 * k, 12 * k), CornerRadius(3 * k))
    }
}

private fun DrawScope.artDisc() {
    val k = u(); val c = Offset(80 * k, 80 * k)
    drawCircle(V.obsidian, 50 * k, c)
    listOf(44f, 38f, 32f).forEach { drawCircle(V.amberBright.copy(alpha = 0.35f), it * k, c, style = Stroke(1 * k)) }
    drawCircle(Fill, 18 * k, c); drawCircle(V.obsidian, 3 * k, c)
    line(128f, 34f, 104f, 92f); drawCircle(Fill, 6 * k, Offset(128 * k, 34 * k))
}

private fun DrawScope.artVault() {
    val k = u(); val st = Stroke(2.5f * k)
    line(38f, 112f, 122f, 112f, 0.4f); line(38f, 76f, 122f, 76f, 0.4f)
    listOf(48f, 64f, 80f).forEachIndexed { i, x ->
        if (i == 1) drawRoundRect(Fill, Offset(x * k, 40 * k), Size(12 * k, 36 * k), CornerRadius(2 * k))
        else drawRoundRect(V.amberBright, Offset(x * k, 40 * k), Size(12 * k, 36 * k), CornerRadius(2 * k), style = st)
    }
    drawCircle(V.amberBright, 14 * k, Offset(104 * k, 96 * k), style = st); drawCircle(Fill, 4 * k, Offset(104 * k, 96 * k))
}
