package com.tagalong.app.data

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.Query
import androidx.room.Delete

@Dao
interface OfflineQrScanDao {
    @Query("SELECT * FROM offline_qr_scans WHERE synced = 0 ORDER BY scannedAt DESC")
    suspend fun getUnsyncedScans(): List<OfflineQrScan>

    @Query("SELECT * FROM offline_qr_scans ORDER BY scannedAt DESC LIMIT 100")
    suspend fun getAllScans(): List<OfflineQrScan>

    @Insert
    suspend fun insert(scan: OfflineQrScan)

    @Insert
    suspend fun insertAll(scans: List<OfflineQrScan>)

    @Query("UPDATE offline_qr_scans SET synced = 1 WHERE id = :id")
    suspend fun markSynced(id: String)

    @Delete
    suspend fun delete(scan: OfflineQrScan)

    @Query("DELETE FROM offline_qr_scans WHERE synced = 1")
    suspend fun clearSynced()
}