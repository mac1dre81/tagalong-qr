package com.yourapp.tagalong.api

import retrofit2.Call
import retrofit2.http.*

interface ApiService {
    
    @POST("auth/login")
    @Headers("Content-Type: application/json")
    fun login(@Body request: LoginRequest): Call<LoginResponse>
    
    @POST("auth/register")
    @Headers("Content-Type: application/json")
    fun register(@Body request: RegisterRequest): Call<RegisterResponse>
    
    @GET("auth/session")
    fun getSession(@Header("Authorization") token: String): Call<SessionResponse>
}