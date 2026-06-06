package com.yourapp.tagalong.api

import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory

class RetrofitInstance {
    // THIS IS WHERE YOU PUT THE BASE URL
    val BASE_URL = "http://10.200.200.131:4000/api"  // For emulator
    
    private val retrofit by lazy {
        Retrofit.Builder()
            .baseUrl(BASE_URL)
            .addConverterFactory(GsonConverterFactory.create())
            .build()
    }
    
    val api: ApiService by lazy {
        retrofit.create(ApiService::class.java)
    }
}