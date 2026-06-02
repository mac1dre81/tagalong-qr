package com.tagalong.app

import android.content.Intent
import android.net.Uri
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Button
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.lifecycleScope
import com.tagalong.app.data.TagAlongRepository
import com.tagalong.app.ui.AppUiState
import com.tagalong.app.ui.AppViewModel
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
        AppScreen(
          state = state,
          onLogin = viewModel::login,
          onRegister = viewModel::register,
          onLogout = viewModel::logout,
          onStartCheckout = {
            lifecycleScope.launch {
              viewModel.checkoutUrl()?.let { openCheckout(it) }
            }
          }
        )
      }
    }
  }

  private fun openCheckout(url: String) {
    startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(url)))
  }
}

@Composable
private fun AppScreen(
  state: AppUiState,
  onLogin: (String, String) -> Unit,
  onRegister: (String, String) -> Unit,
  onLogout: () -> Unit,
  onStartCheckout: () -> Unit,
) {
  val (email, setEmail) = remember { mutableStateOf("") }
  val (password, setPassword) = remember { mutableStateOf("") }

  Column(
    modifier = Modifier
      .fillMaxSize()
      .padding(20.dp),
    verticalArrangement = Arrangement.spacedBy(12.dp),
  ) {
    Text(text = "TagAlong", style = MaterialTheme.typography.headlineMedium)
    Text(text = state.statusMessage)

    if (state.authenticatedEmail.isBlank()) {
      OutlinedTextField(
        modifier = Modifier.fillMaxWidth(),
        value = email,
        onValueChange = setEmail,
        label = { Text("Email") },
        singleLine = true,
      )
      OutlinedTextField(
        modifier = Modifier.fillMaxWidth(),
        value = password,
        onValueChange = setPassword,
        label = { Text("Password") },
        singleLine = true,
      )
      Button(onClick = { onLogin(email.trim(), password) }, modifier = Modifier.fillMaxWidth()) { Text("Sign in") }
      Button(onClick = { onRegister(email.trim(), password) }, modifier = Modifier.fillMaxWidth()) { Text("Create account") }
    } else {
      Text("Signed in as: ${state.authenticatedEmail}")
      Text("Plan: ${state.plan.ifBlank { "free" }}")
      Text("Dynamic profiles: ${state.profileCount}")
      Text("History items: ${state.historyCount}")
      Button(onClick = onStartCheckout, modifier = Modifier.fillMaxWidth()) { Text("Upgrade via checkout") }
      Button(onClick = onLogout, modifier = Modifier.fillMaxWidth()) { Text("Sign out") }
    }
  }
}
