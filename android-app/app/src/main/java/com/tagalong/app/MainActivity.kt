package com.tagalong.app

import android.content.Intent
import android.net.Uri
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.material3.MaterialTheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.snapshots.SnapshotStateList
import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import com.tagalong.app.data.TagAlongRepository
import com.tagalong.app.data.QrScanDto
import com.tagalong.app.ui.*
import kotlinx.coroutines.launch

class MainActivity : ComponentActivity() {
  private val viewModel: AppViewModel by lazy {
    ViewModelProvider(this, object : ViewModelProvider.Factory {
      override fun <T : ViewModel> create(modelClass: Class<T>): T {
        @Suppress("UNCHECKED_CAST")
        return AppViewModel(TagAlongRepository.create(this@MainActivity)) as T
      }
    })[AppViewModel::class.java]
  }

  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    enableEdgeToEdge()
    viewModel.restoreSession()

    setContent {
      MaterialTheme {
        val state by viewModel.uiState.collectAsState()
        AppNavigator(
          state = state,
          viewModel = viewModel
        )
      }
    }
  }

  private fun openCheckout(url: String) {
    startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(url)))
  }
}

@Composable
fun AppNavigator(
  state: AppUiState,
  viewModel: AppViewModel,
) {
  val (screen, setScreen) = remember { mutableStateOf(Screen.Main) }
  val qrHistory = remember { mutableStateListOf<QrScanDto>() }

  // Load QR history when needed
  val coroutineScope = rememberCoroutineScope()
  LaunchedEffect(screen) {
    if (screen == Screen.QrHistory) {
      viewModel.loadQrHistory()
        .onSuccess { qrHistory.clear(); qrHistory.addAll(it) }
    }
  }

  when (screen) {
    is Screen.Login -> {
      LoginScreen(
        viewModel = viewModel,
        onLoginSuccess = { setScreen(Screen.Main) },
        onRegisterClick = { setScreen(Screen.Register) }
      )
    }
    is Screen.Register -> {
      RegisterScreen(
        viewModel = viewModel,
        onRegisterSuccess = { setScreen(Screen.Main) },
        onBackToLogin = { setScreen(Screen.Login) }
      )
    }
    is Screen.Main -> {
      MainScreen(
        state = state,
        onLogin = viewModel::login,
        onRegister = viewModel::register,
        onLogout = viewModel::logout,
        onStartCheckout = {
          coroutineScope.launch {
            viewModel.checkoutUrl()?.let { /* open checkout */ }
          }
        },
        onScanQr = { setScreen(Screen.QrScanner) },
        onShowQrHistory = { setScreen(Screen.QrHistory) },
        qrHistory = qrHistory
      )
    }
    is Screen.QrScanner -> {
      QrScannerScreen(
        onQrDetected = { content ->
          setScreen(Screen.Main)
        },
        onCancel = { setScreen(Screen.Main) },
        onSaveScan = { content, type ->
          coroutineScope.launch {
            viewModel.saveQrScan(content, type)
              .onSuccess { qrHistory.add(0, it) }
          }
        }
      )
    }
    is Screen.QrHistory -> {
      QrHistoryScreen(
        scans = qrHistory,
        onBack = { setScreen(Screen.Main) },
        onDelete = { id ->
          coroutineScope.launch {
            viewModel.deleteQrScan(id)
              .onSuccess { qrHistory.removeAll { it.id == id } }
          }
        }
      )
    }
  }
}

sealed class Screen {
  object Login : Screen()
  object Register : Screen()
  object Main : Screen()
  object QrScanner : Screen()
  object QrHistory : Screen()
}