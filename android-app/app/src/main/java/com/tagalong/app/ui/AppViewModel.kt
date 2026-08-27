// android-app/app/src/main/java/com/tagalong/app/ui/AppViewModel.kt
package com.tagalong.app.ui

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.tagalong.app.data.TagAlongRepository
import com.tagalong.app.data.QrScanDto
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

  /**
   * Suspended login function that returns true on success.
   * Call from a coroutine (e.g., coroutineScope.launch { viewModel.login(...) }).
   * Updates uiState.loading, uiState.statusMessage, and uiState.authenticatedEmail.
   */
  suspend fun login(email: String, password: String): Boolean {
    _uiState.value = _uiState.value.copy(loading = true, statusMessage = "")
    return try {
      val result = repository.login(email, password)
      result.onSuccess { user ->
        _uiState.value = _uiState.value.copy(
          authenticatedEmail = user.email,
          statusMessage = "Signed in",
          loading = false
        )
        // load additional data asynchronously
        loadData()
      }.onFailure { throwable ->
        _uiState.value = _uiState.value.copy(
          statusMessage = throwable?.message ?: "Sign-in failed",
          loading = false
        )
      }
      result.isSuccess
    } catch (e: Exception) {
      _uiState.value = _uiState.value.copy(statusMessage = e.message ?: "Sign-in failed", loading = false)
      false
    }
  }

  /**
   * Suspended register function that returns true on success.
   * Call from a coroutine (e.g., coroutineScope.launch { viewModel.register(...) }).
   * Updates uiState similarly to login.
   */
  suspend fun register(email: String, password: String): Boolean {
    _uiState.value = _uiState.value.copy(loading = true, statusMessage = "")
    return try {
      val result = repository.register(email, password)
      result.onSuccess { user ->
        _uiState.value = _uiState.value.copy(
          authenticatedEmail = user.email,
          statusMessage = "Account created",
          loading = false
        )
        loadData()
      }.onFailure { throwable ->
        _uiState.value = _uiState.value.copy(
          statusMessage = throwable?.message ?: "Registration failed",
          loading = false
        )
      }
      result.isSuccess
    } catch (e: Exception) {
      _uiState.value = _uiState.value.copy(statusMessage = e.message ?: "Registration failed", loading = false)
      false
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

  // QR Scan functions
  suspend fun saveQrScan(content: String, type: String) = repository.saveQrScan(content, type)

  suspend fun loadQrHistory(): Result<List<QrScanDto>> = repository.qrHistory()

  suspend fun deleteQrScan(id: String) = repository.deleteQrScan(id)
}
