package com.tagalong.app.data

data class UserDto(val id: String, val email: String, val plan: String)
data class AuthResponseDto(val token: String, val user: UserDto)
data class SessionResponseDto(val user: UserDto)
data class SubscriptionResponseDto(val plan: String)
data class CheckoutResponseDto(val checkoutUrl: String, val sessionId: String)
data class ProfileDto(val id: String, val name: String, val company: String, val title: String, val vCard: String, val updatedAt: String)
data class HistoryItemDto(val id: String, val name: String, val subtitle: String, val website: String, val vCard: String, val dataUrl: String, val dynamicId: String, val createdAt: String)

data class RegisterRequest(val email: String, val password: String)
data class LoginRequest(val email: String, val password: String)
data class CheckoutRequest(val plan: String = "premium")

// QR Scan models
data class QrScanDto(val id: String, val content: String, val type: String, val name: String?, val scannedAt: String)
data class QrScanRequest(val content: String, val type: String = "text", val name: String? = null)
data class QrScansResponse(val scans: List<QrScanDto>)

data class ProfilesResponseDto(val profiles: List<ProfileDto>)
data class HistoryResponseDto(val history: List<HistoryItemDto>)