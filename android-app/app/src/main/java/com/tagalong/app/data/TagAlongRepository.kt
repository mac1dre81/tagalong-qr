package com.tagalong.app.data

import android.content.Context
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
  suspend fun register(email: String, password: String): Result<UserDto> = runCatching {
    val response = api.register(RegisterRequest(email = email, password = password))
    if (!response.isSuccessful) error("Registration failed")
    val body = requireNotNull(response.body())
    authStore.token = body.token
    body.user
  }

  suspend fun login(email: String, password: String): Result<UserDto> = runCatching {
    val response = api.login(LoginRequest(email = email, password = password))
    if (!response.isSuccessful) error("Login failed")
    val body = requireNotNull(response.body())
    authStore.token = body.token
    body.user
  }

  suspend fun logout(): Result<Unit> = runCatching {
    api.logout()
    authStore.clear()
  }

  suspend fun session(): Result<UserDto> = runCatching {
    val response = api.session()
    if (!response.isSuccessful) error("Session unavailable")
    requireNotNull(response.body()).user
  }

  suspend fun subscription(): Result<String> = runCatching {
    val response = api.subscription()
    if (!response.isSuccessful) error("Subscription request failed")
    requireNotNull(response.body()).plan
  }

  suspend fun checkout(): Result<CheckoutResponseDto> = runCatching {
    val response = api.checkout(CheckoutRequest())
    if (!response.isSuccessful) error("Checkout request failed")
    requireNotNull(response.body())
  }

  suspend fun profiles(): Result<List<ProfileDto>> = runCatching {
    val response = api.profiles()
    if (!response.isSuccessful) error("Profile request failed")
    requireNotNull(response.body()).profiles
  }

  suspend fun history(): Result<List<HistoryItemDto>> = runCatching {
    val response = api.history()
    if (!response.isSuccessful) error("History request failed")
    requireNotNull(response.body()).history
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
