package com.vynyl.record.data

import android.content.Context
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.withContext
import kotlinx.serialization.Serializable
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import java.io.File
import java.nio.ByteBuffer
import java.nio.ByteOrder
import java.util.UUID

/** A raw take kept in the voice library so it can be pressed again later. Mirrors SavedVoice in src/lib/db.ts. */
@Serializable
data class SavedVoice(val id: String, val name: String, val createdAt: Long, val duration: Float, val wave: List<Float>)

/** Every mic take or import, stored as mono 44.1k float PCM beside voices.json. */
object VoiceStore {
    private val json = Json { ignoreUnknownKeys = true; encodeDefaults = true }
    private lateinit var dir: File
    private val _voices = MutableStateFlow<List<SavedVoice>>(emptyList())
    val voices: StateFlow<List<SavedVoice>> = _voices

    fun init(ctx: Context) {
        dir = File(ctx.filesDir, "voices").apply { mkdirs() }
        _voices.value = runCatching { json.decodeFromString<List<SavedVoice>>(index.readText()) }.getOrDefault(emptyList())
    }

    private val index get() = File(dir, "voices.json")
    private fun pcmFile(id: String) = File(dir, "$id.f32")

    private fun persist(list: List<SavedVoice>) {
        _voices.value = list
        val tmp = File(dir, "voices.json.tmp")
        tmp.writeText(json.encodeToString(list)); tmp.renameTo(index)
    }

    suspend fun add(pcm: FloatArray, name: String, wave: List<Float>, sr: Int) = withContext(Dispatchers.IO) {
        val v = SavedVoice(UUID.randomUUID().toString(), name, System.currentTimeMillis(), pcm.size / sr.toFloat(), wave)
        val b = ByteBuffer.allocate(pcm.size * 4).order(ByteOrder.LITTLE_ENDIAN); b.asFloatBuffer().put(pcm)
        pcmFile(v.id).writeBytes(b.array())
        persist(_voices.value + v)
    }

    suspend fun load(id: String): FloatArray? = withContext(Dispatchers.IO) {
        val f = pcmFile(id); if (!f.exists()) return@withContext null
        val fb = ByteBuffer.wrap(f.readBytes()).order(ByteOrder.LITTLE_ENDIAN).asFloatBuffer()
        FloatArray(fb.remaining()).also { fb.get(it) }
    }

    suspend fun delete(id: String) = withContext(Dispatchers.IO) {
        pcmFile(id).delete(); persist(_voices.value.filterNot { it.id == id })
    }
}
