package com.tagalong.app.data

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "offline_qr_scans")
data class OfflineQrScan(
    @PrimaryKey val id: String,
    val content: String,
    val type: String = "text",
    val scannedAt: Long,
    val name: String? = null,
    val synced: Boolean = false
)