package com.vynyl.record.ui.vault

import androidx.compose.foundation.*
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.PathEffect
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import com.vynyl.record.audio.PRESETS
import com.vynyl.record.audio.STYLES
import com.vynyl.record.data.RecordMeta
import com.vynyl.record.data.RecordStore
import com.vynyl.record.data.SavedVoice
import com.vynyl.record.data.VoiceStore
import androidx.compose.runtime.saveable.rememberSaveable
import com.vynyl.record.pro.Free
import com.vynyl.record.pro.Pro
import com.vynyl.record.ui.components.*
import com.vynyl.record.ui.paywall.ProButton
import com.vynyl.record.ui.theme.*
import kotlinx.coroutines.launch

private enum class Sort(val label: String) { Newest("Newest"), Oldest("Oldest"), Title("Title"), Duration("Longest") }

@Composable
fun Vault(records: List<RecordMeta>, onPlay: (RecordMeta) -> Unit, onNew: () -> Unit, onUseVoice: (SavedVoice) -> Unit = {}) {
    var shelf by rememberSaveable { mutableStateOf("records") }
    val voices by VoiceStore.voices.collectAsState()
    var q by remember { mutableStateOf("") }
    var grid by remember { mutableStateOf(true) }
    var fav by remember { mutableStateOf(false) }
    var sort by remember { mutableStateOf(Sort.Newest) }
    var sortOpen by remember { mutableStateOf(false) }
    var confirm by remember { mutableStateOf<RecordMeta?>(null) }
    val pro = Pro.entitlement.collectAsState().value.pro
    val scope = rememberCoroutineScope()

    val list = remember(records, q, fav, sort) {
        val s = q.lowercase()
        records.filter { r -> (!fav || r.favorite) && listOf(r.title, r.recipient, r.occasion).any { it.lowercase().contains(s) } }
            .let { l -> when (sort) { Sort.Newest -> l.sortedByDescending { it.createdAt }; Sort.Oldest -> l.sortedBy { it.createdAt }; Sort.Title -> l.sortedBy { it.title.lowercase() }; Sort.Duration -> l.sortedByDescending { it.duration } } }
    }
    fun toggleFav(r: RecordMeta) = scope.launch { RecordStore.update(r.id) { it.copy(favorite = !it.favorite) } }

    Box(Modifier.fillMaxSize()) {
        Column(Modifier.fillMaxSize()) {
            Column(Modifier.padding(start = 24.dp, end = 24.dp, top = 16.dp)) {
                Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                    Eyebrow("MASTER VAULT · ${records.size} PRESSED"); ProButton()
                }
                Text(if (shelf == "records") "Your shelf" else "Your voices", Modifier.padding(top = 4.dp), style = displayStyle(36))
                Row(Modifier.padding(top = 12.dp).fillMaxWidth().clip(CircleShape).background(V.panel).border(1.dp, V.brass.copy(.25f), CircleShape).padding(4.dp)) {
                    listOf("records" to "Records · ${records.size}", "voices" to "Voices · ${voices.size}").forEach { (id, label) ->
                        val on = shelf == id
                        Box(Modifier.weight(1f).heightIn(min = 40.dp).clip(CircleShape).background(if (on) V.amber.copy(.2f) else Color.Transparent)
                            .then(if (on) Modifier.border(1.dp, V.amber.copy(.5f), CircleShape) else Modifier).clickable { shelf = id }, contentAlignment = Alignment.Center) {
                            Text(label, style = sansStyle(14, if (on) V.cream else V.muted))
                        }
                    }
                }
                if (shelf == "records" && !pro) {
                    val sh = RoundedCornerShape(12.dp)
                    Column(Modifier.padding(top = 12.dp).fillMaxWidth().clip(sh).background(V.panel.copy(.7f)).border(1.dp, V.brass.copy(.25f), sh)
                        .clickable { Pro.openPaywall("Free shelves hold three records. Go Pro to keep every voice you press.") }.padding(horizontal = 14.dp, vertical = 10.dp)) {
                        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                            Text("${minOf(records.size, Free.MAX_RECORDS)} of ${Free.MAX_RECORDS} free shelf slots used", style = sansStyle(11, V.cream.copy(.85f)))
                            Text("UNLIMITED WITH PRO ›", style = decoStyle(10, V.amberBright))
                        }
                        Row(Modifier.padding(top = 8.dp), horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                            repeat(Free.MAX_RECORDS) { i -> Box(Modifier.weight(1f).height(4.dp).clip(CircleShape).background(if (i < records.size) V.amberBright else V.cream.copy(.1f))) }
                        }
                    }
                }
                if (shelf == "records") {
                BasicTextField(q, { q = it }, Modifier.padding(top = 16.dp).fillMaxWidth().clip(CircleShape).background(V.panel).border(1.dp, V.brass.copy(.25f), CircleShape).padding(horizontal = 16.dp, vertical = 10.dp),
                    textStyle = sansStyle(14), singleLine = true, cursorBrush = SolidColor(V.amberBright),
                    decorationBox = { inner -> Box { if (q.isEmpty()) Text("Search titles, people, occasions", style = sansStyle(14, V.muted.copy(.6f))); inner() } })
                Row(Modifier.padding(top = 12.dp).fillMaxWidth(), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    Chip("♥ Favorites", fav) { fav = !fav }
                    Box {
                        Chip(sort.label + " ▾", false) { sortOpen = true }
                        DropdownMenu(sortOpen, { sortOpen = false }, Modifier.background(V.panel)) {
                            Sort.entries.forEach { s -> DropdownMenuItem({ Text(s.label, style = sansStyle(13, if (s == sort) V.cream else V.muted)) }, { sort = s; sortOpen = false }) }
                        }
                    }
                    Spacer(Modifier.weight(1f))
                    Row(Modifier.border(1.dp, V.brass.copy(.25f), CircleShape).padding(2.dp)) {
                        listOf(true to "Grid", false to "List").forEach { (g, l) ->
                            Text(l, Modifier.clip(CircleShape).background(if (grid == g) V.amber.copy(.2f) else Color.Transparent).clickable { grid = g }.padding(horizontal = 12.dp, vertical = 4.dp),
                                style = sansStyle(12, if (grid == g) V.cream else V.muted))
                        }
                    }
                }
                }
            }
            if (shelf == "voices") {
                VoiceShelf(voices, Modifier.weight(1f), onUseVoice, onNew)
            } else if (records.isEmpty()) {
                Column(Modifier.weight(1f).fillMaxWidth().padding(24.dp), horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.Center) {
                    Canvas(Modifier.size(128.dp)) {
                        var r = size.minDimension / 2
                        while (r > 0) { drawCircle(V.brass.copy(.12f), r - 7.dp.toPx(), style = Stroke(1.dp.toPx())); r -= 8.dp.toPx() }
                        drawCircle(V.brass.copy(.4f), size.minDimension / 2, style = Stroke(1.dp.toPx(), pathEffect = PathEffect.dashPathEffect(floatArrayOf(6f, 6f))))
                    }
                    Text("Your shelf is waiting for its first voice.", Modifier.widthIn(max = 224.dp).padding(top = 24.dp), style = displayStyle(24).copy(lineHeight = androidx.compose.ui.unit.TextUnit(32f, androidx.compose.ui.unit.TextUnitType.Sp)), textAlign = TextAlign.Center)
                    Btn("Press a record", onNew, Modifier.padding(top = 24.dp))
                }
            } else if (grid) {
                LazyVerticalGrid(GridCells.Fixed(2), Modifier.weight(1f), contentPadding = PaddingValues(24.dp, 20.dp), horizontalArrangement = Arrangement.spacedBy(16.dp), verticalArrangement = Arrangement.spacedBy(24.dp)) {
                    items(list, key = { it.id }) { r ->
                        val pr = PRESETS.firstOrNull { it.id == r.presetId } ?: PRESETS[0]
                        Column {
                            Sleeve(r, Modifier.fillMaxWidth().clickable { onPlay(r) })
                            Row(Modifier.padding(top = 8.dp).fillMaxWidth(), verticalAlignment = Alignment.Top) {
                                Column(Modifier.weight(1f)) {
                                    Text(r.title, style = sansStyle(14, V.cream, 600), maxLines = 1, overflow = TextOverflow.Ellipsis)
                                    Text("for ${r.recipient} · ${r.occasion}", style = sansStyle(12, V.muted), maxLines = 1, overflow = TextOverflow.Ellipsis)
                                }
                                Text("♥", Modifier.clickable { toggleFav(r) }.padding(4.dp), style = sansStyle(14, if (r.favorite) V.amberBright else V.muted.copy(.5f)))
                            }
                            Row(Modifier.padding(top = 4.dp), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                Text(pr.name, Modifier.border(1.dp, V.brass.copy(.3f), CircleShape).padding(horizontal = 8.dp, vertical = 2.dp), style = sansStyle(10, V.muted))
                                Text(fmt(r.duration), style = monoStyle(10))
                            }
                        }
                    }
                }
            } else {
                LazyColumn(Modifier.weight(1f), contentPadding = PaddingValues(24.dp, 20.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    items(list, key = { it.id }) { r ->
                        val pr = PRESETS.firstOrNull { it.id == r.presetId } ?: PRESETS[0]
                        val sh = RoundedCornerShape(12.dp)
                        Row(Modifier.fillMaxWidth().clip(sh).background(V.panel).border(1.dp, V.brass.copy(.15f), sh).padding(start = 8.dp, top = 8.dp, bottom = 8.dp, end = 12.dp),
                            verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                            Sleeve(r, Modifier.width(56.dp).clickable { onPlay(r) }, small = true)
                            Column(Modifier.weight(1f)) {
                                Text(r.title, style = sansStyle(14, V.cream, 600), maxLines = 1, overflow = TextOverflow.Ellipsis)
                                Text("${r.recipient} · ${pr.name} · ${fmt(r.duration)}", style = sansStyle(12, V.muted), maxLines = 1, overflow = TextOverflow.Ellipsis)
                            }
                            Text("♥", Modifier.clickable { toggleFav(r) }, style = sansStyle(14, if (r.favorite) V.amberBright else V.muted.copy(.5f)))
                            Text("Delete", Modifier.clickable { confirm = r }, style = sansStyle(12, V.muted))
                        }
                    }
                }
            }
        }

        confirm?.let { c ->
            Box(Modifier.fillMaxSize().background(V.obsidian.copy(.7f)).clickable(remember { MutableInteractionSource() }, null) { confirm = null }, contentAlignment = Alignment.BottomCenter) {
                val sh = RoundedCornerShape(topStart = 24.dp, topEnd = 24.dp)
                Column(Modifier.fillMaxWidth().clip(sh).background(V.stone).drawBehind { drawRect(V.brass.copy(.3f), size = androidx.compose.ui.geometry.Size(size.width, 1f)) }
                    .clickable(remember { MutableInteractionSource() }, null) {}.padding(24.dp)) {
                    Text("Delete “${c.title}”?", style = displayStyle(24))
                    Text("The master and its artwork will be removed from this device. This can’t be undone without a backup.", Modifier.padding(top = 8.dp), style = sansStyle(14, V.muted))
                    Row(Modifier.padding(top = 24.dp), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        Btn("Keep it", { confirm = null }, Modifier.weight(1f), BtnVariant.Ghost)
                        Box(Modifier.weight(1f).heightIn(min = 44.dp).clip(CircleShape).background(V.err).clickable { scope.launch { RecordStore.delete(c.id); confirm = null } }, contentAlignment = Alignment.Center) {
                            Text("Delete", style = sansStyle(14, V.obsidian, 600))
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun Chip(text: String, on: Boolean, onClick: () -> Unit) {
    Text(text, Modifier.clip(CircleShape).background(V.panel).border(1.dp, if (on) V.amber else V.brass.copy(.25f), CircleShape).clickable(onClick = onClick).padding(horizontal = 12.dp, vertical = 6.dp),
        style = sansStyle(12, if (on) V.cream else V.muted))
}

/** Square sleeve with a disc peeking out, same as the web Vault. */
@Composable
private fun Sleeve(r: RecordMeta, modifier: Modifier, small: Boolean = false) {
    val st = STYLES.firstOrNull { it.id == r.styleId } ?: STYLES[0]
    val label = Color(st.label); val disc = Color(st.disc); val ink = Color(st.ink)
    val sh = RoundedCornerShape(6.dp)
    Box(modifier.aspectRatio(1f).shadow(10.dp, sh).clip(sh).background(Brush.linearGradient(listOf(label, V.obsidian), Offset.Zero, Offset.Infinite))) {
        Canvas(Modifier.fillMaxSize()) {
            val d = size.height * .84f; val r0 = d / 2
            val c = Offset(size.width * 1.25f - r0, size.height * .08f + r0)
            drawCircle(disc, r0, c)
            var rr = r0
            while (rr > 0) { drawCircle(Color(0x55000000), rr - 3.dp.toPx(), c, style = Stroke(1.dp.toPx())); rr -= 4.dp.toPx() }
            drawCircle(label, r0 * .32f, c)
        }
        if (!small) Text(r.title, Modifier.align(Alignment.BottomStart).padding(8.dp).fillMaxWidth(.62f), style = displayStyle(14).copy(lineHeight = androidx.compose.ui.unit.TextUnit(17f, androidx.compose.ui.unit.TextUnitType.Sp)),
            color = if (st.ink == 0xFF0C0A09L) V.cream else ink)
    }
}

/** Every take you've recorded or imported, kept so it can be pressed again with a new sound. */
@Composable
private fun VoiceShelf(voices: List<SavedVoice>, modifier: Modifier, onUse: (SavedVoice) -> Unit, onNew: () -> Unit) {
    val ctx = androidx.compose.ui.platform.LocalContext.current
    val scope = rememberCoroutineScope()
    var playingId by remember { mutableStateOf<String?>(null) }
    var player by remember { mutableStateOf<com.vynyl.record.audio.WavPlayer?>(null) }
    var confirm by remember { mutableStateOf<SavedVoice?>(null) }
    val isPlaying by (player?.isPlaying ?: kotlinx.coroutines.flow.MutableStateFlow(false)).collectAsState()
    LaunchedEffect(isPlaying) { if (!isPlaying && player != null) { player?.release(); player = null; playingId = null } }
    DisposableEffect(Unit) { onDispose { player?.release() } }
    fun stop() { player?.release(); player = null; playingId = null }
    fun toggle(v: SavedVoice) {
        val was = playingId; stop(); if (was == v.id) return
        scope.launch {
            val pcm = VoiceStore.load(v.id) ?: return@launch
            val f = java.io.File(ctx.cacheDir, "voice-preview.wav")
            kotlinx.coroutines.withContext(kotlinx.coroutines.Dispatchers.IO) { f.writeBytes(com.vynyl.record.audio.encodeWav(com.vynyl.record.audio.Stereo(pcm, pcm))) }
            player = com.vynyl.record.audio.WavPlayer(f).also { it.play() }; playingId = v.id
        }
    }
    val list = remember(voices) { voices.sortedByDescending { it.createdAt } }
    val date = remember { java.text.SimpleDateFormat("d MMM yyyy", java.util.Locale.getDefault()) }
    Box(modifier.fillMaxWidth()) {
        LazyColumn(Modifier.fillMaxSize(), contentPadding = PaddingValues(24.dp, 20.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
            item {
                Text("Every voice you record or import is kept here. Tap Use in Studio to press it again with a different sound or wax.", style = sansStyle(13, V.muted), modifier = Modifier.padding(bottom = 6.dp))
            }
            if (list.isEmpty()) item {
                Column(Modifier.fillMaxWidth().padding(top = 32.dp), horizontalAlignment = Alignment.CenterHorizontally) {
                    Canvas(Modifier.size(96.dp)) { drawCircle(V.brass.copy(.4f), size.minDimension / 2, style = Stroke(1.dp.toPx(), pathEffect = PathEffect.dashPathEffect(floatArrayOf(6f, 6f)))) }
                    Text("No voices yet. Your first recording will appear here.", Modifier.widthIn(max = 240.dp).padding(top = 20.dp), style = displayStyle(20), textAlign = TextAlign.Center)
                    Btn("Record a voice", onNew, Modifier.padding(top = 20.dp))
                }
            }
            items(list, key = { it.id }) { v ->
                val on = playingId == v.id
                val sh = RoundedCornerShape(16.dp)
                Column(Modifier.fillMaxWidth().clip(sh).background(if (on) V.amber.copy(.1f) else V.panel).border(1.dp, if (on) V.amber else V.brass.copy(.2f), sh).padding(12.dp)) {
                    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                        Box(Modifier.size(44.dp).clip(CircleShape).background(Brush.verticalGradient(listOf(Color(0xFFE0B85A), Color(0xFF8A5A1A)))).clickable { toggle(v) }, contentAlignment = Alignment.Center) {
                            Text(if (on) "■" else "▶", style = sansStyle(16, V.obsidian, 700))
                        }
                        Column(Modifier.weight(1f)) {
                            Text(v.name, style = displayStyle(17), maxLines = 1, overflow = TextOverflow.Ellipsis)
                            Text("${fmt(v.duration)} · ${date.format(java.util.Date(v.createdAt))}", Modifier.padding(top = 2.dp), style = monoStyle(11))
                        }
                    }
                    Wave(v.wave, modifier = Modifier.padding(top = 8.dp).fillMaxWidth().height(32.dp))
                    Row(Modifier.padding(top = 8.dp), horizontalArrangement = Arrangement.spacedBy(8.dp), verticalAlignment = Alignment.CenterVertically) {
                        Box(Modifier.weight(1f).heightIn(min = 44.dp).clip(CircleShape).background(V.amber.copy(.15f)).border(1.dp, V.amber.copy(.6f), CircleShape).clickable { stop(); onUse(v) }, contentAlignment = Alignment.Center) {
                            Text("Use in Studio", style = sansStyle(14, V.cream, 600))
                        }
                        Text("Delete", Modifier.clip(CircleShape).clickable { confirm = v }.padding(horizontal = 16.dp, vertical = 12.dp), style = sansStyle(14, V.muted))
                    }
                }
            }
        }
        confirm?.let { c ->
            Box(Modifier.fillMaxSize().background(V.obsidian.copy(.7f)).clickable(remember { MutableInteractionSource() }, null) { confirm = null }, contentAlignment = Alignment.BottomCenter) {
                val sh = RoundedCornerShape(topStart = 24.dp, topEnd = 24.dp)
                Column(Modifier.fillMaxWidth().clip(sh).background(V.stone).clickable(remember { MutableInteractionSource() }, null) {}.padding(24.dp)) {
                    Text("Delete this voice?", style = displayStyle(24))
                    Text("“${c.name}” will be removed from your voice library. Records already pressed with it stay on your shelf.", Modifier.padding(top = 8.dp), style = sansStyle(14, V.muted))
                    Row(Modifier.padding(top = 24.dp), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        Btn("Keep it", { confirm = null }, Modifier.weight(1f), BtnVariant.Ghost)
                        Box(Modifier.weight(1f).heightIn(min = 44.dp).clip(CircleShape).background(V.err).clickable { if (playingId == c.id) stop(); scope.launch { VoiceStore.delete(c.id); confirm = null } }, contentAlignment = Alignment.Center) {
                            Text("Delete", style = sansStyle(14, V.obsidian, 600))
                        }
                    }
                }
            }
        }
    }
}
