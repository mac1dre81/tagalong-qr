package com.tagalong.app.ui

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.tagalong.app.data.TagAlongRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class AppUiState(
  val authenticatedEmail: String = "",
  val plan: String = "",
  val profileCount: Int = 0,
  val historyCount: Int = 0,
  val statusMessage: String = "Sign in to continue",
  val loading: Boolean = false,
)

class AppViewModel(private val repository: TagAlongRepository) : ViewModel() {
  private val _uiState = MutableStateFlow(AppUiState())
  val uiState: StateFlow<AppUiState> = _uiState.asStateFlow()

  fun restoreSession() {
    viewModelScope.launch {
      _uiState.value = _uiState.value.copy(loading = true)
      repository.session()
        .onSuccess { user ->
          _uiState.value = _uiState.value.copy(authenticatedEmail = user.email, statusMessage = "Session restored", loading = false)
          loadData()
        }
        .onFailure {
          _uiState.value = _uiState.value.copy(statusMessage = "Please sign in", loading = false)
        }
    }
  }

  fun login(email: String, password: String) {
    viewModelScope.launch {
      _uiState.value = _uiState.value.copy(loading = true)
      repository.login(email, password)
        .onSuccess {
          _uiState.value = _uiState.value.copy(authenticatedEmail = it.email, statusMessage = "Signed in", loading = false)
          loadData()
        }
        .onFailure {
          _uiState.value = _uiState.value.copy(statusMessage = "Sign-in failed", loading = false)
        }
    }
  }

  fun register(email: String, password: String) {
    viewModelScope.launch {
      _uiState.value = _uiState.value.copy(loading = true)
      repository.register(email, password)
        .onSuccess {
          _uiState.value = _uiState.value.copy(authenticatedEmail = it.email, statusMessage = "Account created", loading = false)
          loadData()
        }
        .onFailure {
          _uiState.value = _uiState.value.copy(statusMessage = "Registration failed", loading = false)
        }
    }
  }

  fun logout() {
    viewModelScope.launch {
      repository.logout()
      _uiState.value = AppUiState(statusMessage = "Signed out")
    }
  }

  fun loadData() {
    viewModelScope.launch {
      val plan = repository.subscription().getOrDefault("free")
      val profiles = repository.profiles().getOrDefault(emptyList())
      val history = repository.history().getOrDefault(emptyList())
      _uiState.value = _uiState.value.copy(plan = plan, profileCount = profiles.size, historyCount = history.size)
    }
  }

  suspend fun checkoutUrl(): String? = repository.checkout().getOrNull()?.checkoutUrl
}
