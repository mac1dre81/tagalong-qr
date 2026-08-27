// android-app/app/src/main/java/com/tagalong/app/ui/LoginScreen.kt
package com.tagalong.app.ui

import android.Manifest
import android.content.pm.PackageManager
import android.util.Size
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.camera.core.*
import androidx.camera.lifecycle.ProcessCameraProvider
import androidx.camera.view.PreviewView
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalLifecycleOwner
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
import androidx.core.content.ContextCompat
import androidx.compose.ui.viewinterop.AndroidView
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Visibility
import androidx.compose.material.icons.filled.VisibilityOff
import com.google.mlkit.vision.barcode.BarcodeScanning
import kotlinx.coroutines.launch

data class LoginUiState(
    val email: String = "",
    val password: String = "",
    val isLoading: Boolean = false,
    val errorMessage: String? = null,
    val showPassword: Boolean = false
)

@Composable
fun LoginScreen(
    onLoginSuccess: () -> Unit,
    onRegisterClick: () -> Unit,
    viewModel: AppViewModel
) {
    val coroutineScope = rememberCoroutineScope()

    // local form state (inputs + show password)
    var formState by remember { mutableStateOf(LoginUiState()) }

    // observe ViewModel UI state
    val appState by viewModel.uiState.collectAsState()

    // derive loading from ViewModel so UI reflects real status
    val isLoading = appState.loading

    // track previous loading to detect transition from loading -> not loading
    var prevLoading by remember { mutableStateOf(false) }

    // When authenticatedEmail becomes non-empty, navigate
    LaunchedEffect(appState.authenticatedEmail) {
        if (appState.authenticatedEmail.isNotBlank()) {
            onLoginSuccess()
        }
    }

    // Detect failed login: when loading transitioned false and no authenticatedEmail set
    LaunchedEffect(isLoading) {
        if (prevLoading && !isLoading) {
            if (appState.authenticatedEmail.isBlank()) {
                // surface error from ViewModel statusMessage (or fallback)
                val message = when {
                    appState.statusMessage.isNotBlank() -> appState.statusMessage
                    else -> "Sign-in failed"
                }
                formState = formState.copy(isLoading = false, errorMessage = message)
            }
        }
        prevLoading = isLoading
    }

    Box(
        modifier = Modifier.fillMaxSize()
    ) {
        AnimatedParticleBackground(modifier = Modifier.matchParentSize())

        Column(
            modifier = Modifier
                .fillMaxWidth()
                .align(Alignment.Center)
                .padding(32.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text(
                text = "TagAlong",
                style = MaterialTheme.typography.headlineLarge,
                color = MaterialTheme.colorScheme.primary
            )
            Text(
                text = "QR Code Business Cards",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                modifier = Modifier.padding(bottom = 32.dp)
            )

            OutlinedTextField(
                value = formState.email,
                onValueChange = { formState = formState.copy(email = it, errorMessage = null) },
                label = { Text("Email") },
                singleLine = true,
                enabled = !isLoading,
                modifier = Modifier.fillMaxWidth()
            )

            Spacer(modifier = Modifier.height(12.dp))

            OutlinedTextField(
                value = formState.password,
                onValueChange = { formState = formState.copy(password = it, errorMessage = null) },
                label = { Text("Password") },
                singleLine = true,
                enabled = !isLoading,
                visualTransformation = if (formState.showPassword) {
                    VisualTransformation.None
                } else {
                    PasswordVisualTransformation()
                },
                modifier = Modifier.fillMaxWidth(),
                trailingIcon = {
                    val image = if (formState.showPassword) Icons.Filled.Visibility else Icons.Filled.VisibilityOff
                    IconButton(onClick = { formState = formState.copy(showPassword = !formState.showPassword) }) {
                        Icon(image, contentDescription = null)
                    }
                }
            )

            // show error from local formState (which we set when VM reports failure)
            formState.errorMessage?.let {
                Text(
                    text = it,
                    color = MaterialTheme.colorScheme.error,
                    style = MaterialTheme.typography.bodySmall,
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(top = 8.dp)
                )
            }

            Spacer(modifier = Modifier.height(24.dp))

            Button(
                onClick = {
                    // clear any previous error, call ViewModel login and wait for VM to update loading/auth state
                    formState = formState.copy(isLoading = true, errorMessage = null)
                    coroutineScope.launch {
                        viewModel.login(formState.email, formState.password)
                        // do NOT call onLoginSuccess here — navigation happens via observing appState.authenticatedEmail
                    }
                },
                enabled = !isLoading && formState.email.isNotBlank() && formState.password.isNotBlank(),
                modifier = Modifier.fillMaxWidth()
            ) {
                if (isLoading) {
                    CircularProgressIndicator(
                        modifier = Modifier.size(16.dp),
                        strokeWidth = 2.dp,
                        color = MaterialTheme.colorScheme.onPrimary
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                }
                Text("Sign In")
            }

            TextButton(
                onClick = onRegisterClick,
                enabled = !isLoading,
                modifier = Modifier.fillMaxWidth()
            ) {
                Text("Create Account")
            }

            Spacer(modifier = Modifier.height(8.dp))

            // Removed misleading "Already have an account? Sign in" that navigated without auth.
            // If you want a guest or alternate flow, implement an explicit guest login action here instead.
        }
    }
}

@Composable
fun RegisterScreen(
    onRegisterSuccess: () -> Unit,
    onBackToLogin: () -> Unit,
    viewModel: AppViewModel
) {
    val coroutineScope = rememberCoroutineScope()
    var formState by remember { mutableStateOf(LoginUiState()) }

    val appState by viewModel.uiState.collectAsState()
    val isLoading = appState.loading

    // navigate when register causes authenticatedEmail to be set
    LaunchedEffect(appState.authenticatedEmail) {
        if (appState.authenticatedEmail.isNotBlank()) {
            onRegisterSuccess()
        }
    }

    // detect failed register and surface message
    var prevLoading by remember { mutableStateOf(false) }
    LaunchedEffect(isLoading) {
        if (prevLoading && !isLoading) {
            if (appState.authenticatedEmail.isBlank()) {
                val message = when {
                    appState.statusMessage.isNotBlank() -> appState.statusMessage
                    else -> "Registration failed"
                }
                formState = formState.copy(isLoading = false, errorMessage = message)
            }
        }
        prevLoading = isLoading
    }

    Box(
        modifier = Modifier.fillMaxSize()
    ) {
        AnimatedParticleBackground(modifier = Modifier.matchParentSize())

        Column(
            modifier = Modifier
                .fillMaxWidth()
                .align(Alignment.Center)
                .padding(32.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text(
                text = "Create Account",
                style = MaterialTheme.typography.headlineLarge,
                color = MaterialTheme.colorScheme.primary
            )

            Spacer(modifier = Modifier.height(24.dp))

            OutlinedTextField(
                value = formState.email,
                onValueChange = { formState = formState.copy(email = it, errorMessage = null) },
                label = { Text("Email") },
                singleLine = true,
                enabled = !isLoading,
                modifier = Modifier.fillMaxWidth()
            )

            Spacer(modifier = Modifier.height(12.dp))

            OutlinedTextField(
                value = formState.password,
                onValueChange = { formState = formState.copy(password = it, errorMessage = null) },
                label = { Text("Password") },
                singleLine = true,
                enabled = !isLoading,
                visualTransformation = if (formState.showPassword) {
                    VisualTransformation.None
                } else {
                    PasswordVisualTransformation()
                },
                modifier = Modifier.fillMaxWidth(),
                trailingIcon = {
                    val image = if (formState.showPassword) Icons.Filled.Visibility else Icons.Filled.VisibilityOff
                    IconButton(onClick = { formState = formState.copy(showPassword = !formState.showPassword) }) {
                        Icon(image, contentDescription = null)
                    }
                }
            )

            formState.errorMessage?.let {
                Text(
                    text = it,
                    color = MaterialTheme.colorScheme.error,
                    style = MaterialTheme.typography.bodySmall,
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(top = 8.dp)
                )
            }

            Spacer(modifier = Modifier.height(24.dp))

            Button(
                onClick = {
                    formState = formState.copy(isLoading = true, errorMessage = null)
                    coroutineScope.launch {
                        viewModel.register(formState.email, formState.password)
                        // navigation handled by observing viewModel state
                    }
                },
                enabled = !isLoading && formState.email.isNotBlank() && formState.password.length >= 8,
                modifier = Modifier.fillMaxWidth()
            ) {
                if (isLoading) {
                    CircularProgressIndicator(
                        modifier = Modifier.size(16.dp),
                        strokeWidth = 2.dp,
                        color = MaterialTheme.colorScheme.onPrimary
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                }
                Text("Sign Up")
            }

            TextButton(
                onClick = onBackToLogin,
                enabled = !isLoading
            ) {
                Text("Back to Sign In")
            }
        }
    }
}

@Composable
fun QrScannerScreen(
    onQrDetected: (String) -> Unit,
    onCancel: () -> Unit,
    onSaveScan: (String, String) -> Unit
) {
    val context = LocalContext.current
    val lifecycleOwner = LocalLifecycleOwner.current
    val coroutineScope = rememberCoroutineScope()

    var hasPermission by remember { mutableStateOf(false) }
    var permissionRequested by remember { mutableStateOf(false) }

    val permissionLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.RequestPermission()
    ) { granted ->
        hasPermission = granted
    }

    LaunchedEffect(Unit) {
        if (ContextCompat.checkSelfPermission(
                context,
                Manifest.permission.CAMERA
            ) == PackageManager.PERMISSION_GRANTED
        ) {
            hasPermission = true
        } else if (!permissionRequested) {
            permissionRequested = true
            permissionLauncher.launch(Manifest.permission.CAMERA)
        }
    }

    if (!hasPermission) {
        Box(
            modifier = Modifier.fillMaxSize(),
            contentAlignment = Alignment.Center
        ) {
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                Text("Camera permission required")
                Spacer(modifier = Modifier.height(16.dp))
                Button(onClick = {
                    if (permissionRequested) {
                        permissionLauncher.launch(Manifest.permission.CAMERA)
                    }
                }) {
                    Text("Grant Permission")
                }
            }
        }
        return
    }

    var previewView by remember { mutableStateOf<PreviewView?>(null) }
    var processing by remember { mutableStateOf(false) }

    DisposableEffect(lifecycleOwner) {
        val cameraProviderFuture = ProcessCameraProvider.getInstance(context)
        var cameraProvider: ProcessCameraProvider? = null

        cameraProviderFuture.addListener({
            cameraProvider = cameraProviderFuture.get()
            previewView?.let { pv ->
                val preview = Preview.Builder().build().also {
                    it.setSurfaceProvider(pv.surfaceProvider)
                }

                val imageAnalysis = ImageAnalysis.Builder()
                    .setTargetResolution(Size(1280, 720))
                    .setBackpressureStrategy(ImageAnalysis.STRATEGY_KEEP_ONLY_LATEST)
                    .build()

                val barcodeScanner = BarcodeScanning.getClient()

                imageAnalysis.setAnalyzer(ContextCompat.getMainExecutor(context)) { imageProxy ->
                    if (processing) {
                        imageProxy.close()
                        return@setAnalyzer
                    }

                    val mediaImage = imageProxy.image
                    if (mediaImage != null) {
                        processing = true
                        val inputImage = com.google.mlkit.vision.common.InputImage.fromMediaImage(
                            mediaImage,
                            imageProxy.imageInfo.rotationDegrees
                        )

                        barcodeScanner.process(inputImage)
                            .addOnSuccessListener { barcodes ->
                                barcodes.firstOrNull()?.rawValue?.let { value ->
                                    // Determine QR type
                                    val qrType = when {
                                        value.startsWith("http") -> "url"
                                        value.startsWith("BEGIN:VCARD") -> "vcard"
                                        value.startsWith("WIFI:") -> "wifi"
                                        value.startsWith("BEGIN:VEVENT") -> "event"
                                        else -> "text"
                                    }
                                    onSaveScan(value, qrType)
                                    onQrDetected(value)
                                }
                            }
                            .addOnCompleteListener {
                                processing = false
                                imageProxy.close()
                            }
                    } else {
                        imageProxy.close()
                    }
                }

                try {
                    cameraProvider?.unbindAll()
                    cameraProvider?.bindToLifecycle(
                        lifecycleOwner,
                        CameraSelector.DEFAULT_BACK_CAMERA,
                        preview,
                        imageAnalysis
                    )
                } catch (e: Exception) {
                    e.printStackTrace()
                }
            }
        }, ContextCompat.getMainExecutor(context))

        onDispose {
            cameraProvider?.unbindAll()
        }
    }

    Box(modifier = Modifier.fillMaxSize()) {
        AndroidView(
            factory = { ctx ->
                PreviewView(ctx).also { previewView = it }
            },
            modifier = Modifier.matchParentSize()
        )

        // Scanner overlay
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(48.dp),
            contentAlignment = Alignment.Center
        ) {
            val frameColor = MaterialTheme.colorScheme.primary
            Canvas(modifier = Modifier.size(200.dp).padding(16.dp)) {
                drawRect(
                    color = frameColor,
                    style = Stroke(width = 4.dp.toPx())
                )
            }
        }

        // Cancel button
        IconButton(
            onClick = onCancel,
            modifier = Modifier.align(Alignment.TopEnd).padding(16.dp)
        ) {
            Icon(
                imageVector = Icons.Filled.Close,
                contentDescription = "Cancel",
                tint = Color.White
            )
        }
    }
}
