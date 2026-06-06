package com.tagalong.app.data

import android.content.Context
import android.util.Log
import com.squareup.moshi.Moshi
import com.tagalong.app.config.RuntimeConfig
import okhttp3.Interceptor
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.moshi.MoshiConverterFactory

class TagAlongRepository private constructor(
  private val api: ApiService,
  private val authStore: AuthStore,
) {
  companion object {
    private const val TAG = "TagAlongRepository"
  }

  private inline fun <T> safeApiCall(block: () -> retrofit2.Response<T>): Result<T> {
    return try {
      val response = block()
      if (response.isSuccessful) {
        Result.success(requireNotNull(response.body()))
      } else {
        val errorBody = response.errorBody()?.string()
        val message = when (response.code()) {
          401 -> "Authentication required"
          403 -> "Access denied"
          404 -> "Resource not found"
          429 -> "Rate limited - please try again"
          in 500..599 -> "Server error - please try again"
          else -> errorBody?.takeIf { it.isNotBlank() } ?: "Request failed (${response.code()})"
        }
        Log.w(TAG, "API error ${response.code()}: $message")
        Result.failure(Exception(message))
      }
    } catch (e: Exception) {
      Log.e(TAG, "Network error", e)
      Result.failure(Exception("Network error: ${e.message ?: "Unknown error"}"))
    }
  }

  suspend fun register(email: String, password: String): Result<UserDto> = safeApiCall {
    api.register(RegisterRequest(email = email, password = password))
  }.also {
    it.onSuccess { body -> authStore.token = body.token }
  }.map { it.user }

  suspend fun login(email: String, password: String): Result<UserDto> = safeApiCall {
    api.login(LoginRequest(email = email, password = password))
  }.also {
    it.onSuccess { body -> authStore.token = body.token }
  }.map { it.user }

  suspend fun logout(): Result<Unit> = runCatching {
    safeApiCall { api.logout() }.getOrElse { throw it }
    authStore.clear()
  }

  suspend fun session(): Result<UserDto> = safeApiCall {
    api.session()
  }.map { it.user }

  suspend fun subscription(): Result<String> = safeApiCall {
    api.subscription()
  }.map { it.plan }

  suspend fun checkout(): Result<CheckoutResponseDto> = safeApiCall {
    api.checkout(CheckoutRequest())
  }

  suspend fun profiles(): Result<List<ProfileDto>> = safeApiCall {
    api.profiles()
  }.map { it.profiles }

  suspend fun history(): Result<List<HistoryItemDto>> = safeApiCall {
    api.history()
  }.map { it.history }

  // QR Scan functions
  suspend fun saveQrScan(content: String, type: String = "text", name: String? = null): Result<QrScanDto> = safeApiCall {
    api.saveQrScan(QrScanRequest(content = content, type = type, name = name))
  }

  suspend fun qrHistory(): Result<List<QrScanDto>> = safeApiCall {
    api.qrHistory()
  }.map { it.scans }

  suspend fun deleteQrScan(id: String): Result<Unit> = safeApiCall {
    api.deleteQrScan(id)
  }

  companion object {
    fun create(context: Context): TagAlongRepository {
      val authStore = AuthStore(context.applicationContext)
      val authInterceptor = Interceptor { chain ->
        val requestBuilder = chain.request().newBuilder()
        authStore.token?.takeIf { it.isNotBlank() }?.let { token ->
          requestBuilder.header("Authorization", "Bearer ".plus(token))
        }
        chain.proceed(requestBuilder.build())
      }

      val logging = HttpLoggingInterceptor().apply { level = HttpLoggingInterceptor.Level.BASIC }

      val client = OkHttpClient.Builder()
        .addInterceptor(authInterceptor)
        .addInterceptor(logging)
        .build()

      val moshi = Moshi.Builder().build()

      val retrofit = Retrofit.Builder()
        .baseUrl(RuntimeConfig.apiBaseUrl)
        .addConverterFactory(MoshiConverterFactory.create(moshi))
        .client(client)
        .build()

      return TagAlongRepository(retrofit.create(ApiService::class.java), authStore)
    }
  }
}
