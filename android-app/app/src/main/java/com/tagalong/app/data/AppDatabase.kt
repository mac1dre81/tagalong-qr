package com.tagalong.app.data

import androidx.room.Database
import androidx.room.RoomDatabase

@Database(entities = [OfflineQrScan::class], version = 1)
abstract class AppDatabase : RoomDatabase() {
    abstract fun offlineQrScanDao(): OfflineQrScanDao
}