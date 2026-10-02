package com.vynyl.record.ui

import androidx.activity.compose.BackHandler
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import com.vynyl.record.data.RecordMeta
import com.vynyl.record.data.RecordStore
import com.vynyl.record.pro.Pro
import com.vynyl.record.ui.paywall.Paywall
import com.vynyl.record.ui.player.Player
import com.vynyl.record.ui.studio.Studio
import com.vynyl.record.ui.theme.*
import com.vynyl.record.ui.vault.Vault

/** App shell — port of src/App.tsx (phone frame omitted; this is the phone). */
@Composable
fun VynylApp() {
    var tab by rememberSaveable { mutableStateOf("studio") }
    val records by RecordStore.records.collectAsState()
    var playingId by rememberSaveable { mutableStateOf<String?>(null) }
    val playing = playingId?.let { id -> records.firstOrNull { it.id == id } }
    val paywall by Pro.paywall.collectAsState()

    BackHandler(enabled = paywall != null) { Pro.closePaywall() }
    BackHandler(enabled = paywall == null && playing != null) { playingId = null }

    Box(Modifier.fillMaxSize()) {
    Column(
        Modifier.fillMaxSize().background(V.obsidian).drawBehind {
            drawRect(Brush.radialGradient(listOf(V.amber.copy(.18f), Color.Transparent), Offset(size.width * .2f, size.height * .2f), size.width * .6f))
            drawRect(Brush.radialGradient(listOf(V.ruby.copy(.2f), Color.Transparent), Offset(size.width * .85f, size.height * .8f), size.width * .5f))
        },
    ) {
        Box(Modifier.weight(1f).fillMaxWidth().statusBarsPadding()) {
            if (tab == "studio") Studio(recordCount = records.size, onDone = { r -> tab = "vault"; playingId = r.id })
            else Vault(records = records, onPlay = { playingId = it.id }, onNew = { tab = "studio" })
            playing?.let { Player(record = it, onClose = { playingId = null }) }
        }
        Row(
            Modifier.fillMaxWidth().background(V.stone)
                .drawBehind { drawRect(V.brass.copy(.2f), size = Size(size.width, 1f)) }
                .navigationBarsPadding().heightIn(min = 68.dp).padding(top = 8.dp, bottom = 8.dp),
            horizontalArrangement = Arrangement.SpaceAround, verticalAlignment = Alignment.Top,
        ) {
            listOf(Triple("studio", "Studio", "●"), Triple("vault", "Master Vault", "◎")).forEach { (id, label, glyph) ->
                val on = tab == id
                val c = if (on) V.amberBright else V.muted
                Column(
                    Modifier.widthIn(min = 96.dp).heightIn(min = 48.dp).clickable { tab = id; playingId = null },
                    horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(2.dp),
                ) {
                    Text(glyph, style = sansStyle(18, c))
                    Text(label, style = sansStyle(11, c))
                }
            }
        }
    }
    Paywall()
    }
}
