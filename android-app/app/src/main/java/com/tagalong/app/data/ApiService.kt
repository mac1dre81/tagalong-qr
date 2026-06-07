package com.tagalong.app.data

import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.DELETE
import retrofit2.http.GET
import retrofit2.http.POST
import retrofit2.http.Path

interface ApiService {
   @POST("api/auth/register")
   suspend fun register(@Body request: RegisterRequest): Response<AuthResponseDto>

   @POST("api/auth/login")
   suspend fun login(@Body request: LoginRequest): Response<AuthResponseDto>

   @POST("api/auth/logout")
   suspend fun logout(): Response<Unit>

   @GET("api/auth/session")
   suspend fun session(): Response<SessionResponseDto>

   @GET("api/subscription")
   suspend fun subscription(): Response<SubscriptionResponseDto>

   @POST("api/subscription/checkout")
   suspend fun checkout(@Body request: CheckoutRequest): Response<CheckoutResponseDto>

   @GET("api/profiles")
   suspend fun profiles(): Response<ProfilesResponseDto>

   @GET("api/history")
   suspend fun history(): Response<HistoryResponseDto>

   // QR Scan endpoints
   @POST("api/qr/save")
   suspend fun saveQrScan(@Body request: QrScanRequest): Response<QrScanDto>

   @GET("api/qr/history")
   suspend fun qrHistory(): Response<QrScansResponse>

   @DELETE("api/qr/{id}")
   suspend fun deleteQrScan(@Path("id") id: String): Response<Unit>
}