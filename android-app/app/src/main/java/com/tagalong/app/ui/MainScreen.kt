package com.tagalong.app.ui

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.tagalong.app.data.QrScanDto

@Composable
fun MainScreen(
    state: AppUiState,
    onLogin: (String, String) -> Unit,
    onRegister: (String, String) -> Unit,
    onLogout: () -> Unit,
    onStartCheckout: () -> Unit,
    onScanQr: () -> Unit,
    onShowQrHistory: () -> Unit,
    qrHistory: List<QrScanDto> = emptyList()
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(20.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        Text(text = "TagAlong", style = MaterialTheme.typography.headlineMedium)
        Text(text = state.statusMessage)

        if (state.authenticatedEmail.isBlank()) {
            var email by remember { mutableStateOf("") }
            var password by remember { mutableStateOf("") }

            OutlinedTextField(
                modifier = Modifier.fillMaxWidth(),
                value = email,
                onValueChange = { email = it },
                label = { Text("Email") },
                singleLine = true,
            )
            OutlinedTextField(
                modifier = Modifier.fillMaxWidth(),
                value = password,
                onValueChange = { password = it },
                label = { Text("Password") },
                singleLine = true,
            )
            Button(onClick = { onLogin(email.trim(), password) }, modifier = Modifier.fillMaxWidth()) { 
                Text("Sign in") 
            }
            Button(onClick = { onRegister(email.trim(), password) }, modifier = Modifier.fillMaxWidth()) { 
                Text("Create account") 
            }
        } else {
            Text("Signed in as: ${state.authenticatedEmail}")
            Text("Plan: ${state.plan.ifBlank { "free" }}")
            Text("Dynamic profiles: ${state.profileCount}")
            Text("History items: ${state.historyCount}")
            
            Button(onClick = onScanQr, modifier = Modifier.fillMaxWidth()) { 
                Text("Scan QR Code") 
            }
            Button(onClick = onShowQrHistory, modifier = Modifier.fillMaxWidth()) { 
                Text("QR Scan History (${qrHistory.size})") 
            }
            Button(onClick = onStartCheckout, modifier = Modifier.fillMaxWidth()) { 
                Text("Upgrade to Premium") 
            }
            Button(onClick = onLogout, modifier = Modifier.fillMaxWidth()) { 
                Text("Sign out") 
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun QrHistoryScreen(
    scans: List<QrScanDto>,
    onBack: () -> Unit,
    onDelete: (String) -> Unit
) {
    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("QR Scan History") },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.Filled.ArrowBack, contentDescription = "Back")
                    }
                }
            )
        }
    ) { padding ->
        LazyColumn(
            modifier = Modifier.padding(padding),
            contentPadding = PaddingValues(16.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            items(scans) { scan ->
                QrScanItem(scan = scan, onDelete = { onDelete(scan.id) })
            }
        }
    }
}

@Composable
fun QrScanItem(scan: QrScanDto, onDelete: () -> Unit) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        elevation = CardDefaults.cardElevation(defaultElevation = 4.dp)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Text(
                text = scan.name ?: scan.content.take(50) + if (scan.content.length > 50) "…" else "",
                style = MaterialTheme.typography.titleMedium
            )
            Text(
                text = scan.type,
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.primary
            )
            Text(
                text = scan.scannedAt.take(10),
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
            IconButton(
                onClick = onDelete,
                modifier = Modifier.align(Alignment.End)
            ) {
                Icon(Icons.Filled.Delete, contentDescription = "Delete")
            }
        }
    }
}