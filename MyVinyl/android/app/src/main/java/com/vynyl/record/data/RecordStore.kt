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

/** Mirrors src/lib/db.ts. Metadata lives in records.json; audio and photos are files beside it. */
@Serializable
data class PhotoAdjust(val mode: String = "fill", val zoom: Float = 1f, val x: Float = 0f, val y: Float = 0f, val rot: Float = 0f, val bg: String = "blur")

@Serializable
data class RecordMeta(
    val id: String, val title: String, val recipient: String, val sender: String, val dedication: String,
    val occasion: String, val date: String, val sideA: String, val sideB: String,
    val presetId: String, val styleId: String, val duration: Float, val wave: List<Float>,
    val createdAt: Long, val lastPlayedAt: Long? = null, val favorite: Boolean = false,
    val labelPhotoAdjust: PhotoAdjust? = null, val crackleId: String? = null, val musicId: String? = null,
    val hasPhoto: Boolean = false,
)

object RecordStore {
    private val json = Json { ignoreUnknownKeys = true; encodeDefaults = true }
    private lateinit var dir: File
    private val _records = MutableStateFlow<List<RecordMeta>>(emptyList())
    val records: StateFlow<List<RecordMeta>> = _records

    fun init(ctx: Context) {
        dir = File(ctx.filesDir, "records").apply { mkdirs() }
        _records.value = runCatching { json.decodeFromString<List<RecordMeta>>(index.readText()) }.getOrDefault(emptyList())
    }

    private val index get() = File(dir, "records.json")
    fun masterFile(id: String) = File(dir, "$id.wav")
    fun photoFile(id: String) = File(dir, "$id.label.jpg")
    fun photoOriginalFile(id: String) = File(dir, "$id.orig.jpg")

    private fun persist(list: List<RecordMeta>) {
        _records.value = list
        val tmp = File(dir, "records.json.tmp")
        tmp.writeText(json.encodeToString(list)); tmp.renameTo(index)
    }

    fun get(id: String) = _records.value.firstOrNull { it.id == id }

    suspend fun put(meta: RecordMeta, master: ByteArray? = null) = withContext(Dispatchers.IO) {
        master?.let { masterFile(meta.id).writeBytes(it) }
        persist(_records.value.filterNot { it.id == meta.id } + meta)
    }

    suspend fun update(id: String, fn: (RecordMeta) -> RecordMeta) = withContext(Dispatchers.IO) {
        persist(_records.value.map { if (it.id == id) fn(it) else it })
    }

    suspend fun delete(id: String) = withContext(Dispatchers.IO) {
        listOf(masterFile(id), photoFile(id), photoOriginalFile(id)).forEach { it.delete() }
        persist(_records.value.filterNot { it.id == id })
    }
}
