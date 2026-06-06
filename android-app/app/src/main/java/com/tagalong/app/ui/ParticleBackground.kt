package com.tagalong.app.ui

import androidx.compose.animation.core.*
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.Box
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.input.pointer.pointerInteropFilter
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.unit.dp
import kotlinx.coroutines.delay
import kotlin.math.*
import kotlin.random.Random

data class Particle(
    val x: Float,
    val y: Float,
    val vx: Float,
    val vy: Float,
    val radius: Float,
    val hue: Float
)

class ParticleSystem(
    private val width: Float,
    private val height: Float,
    private val particleCount: Int = 80
) {
    private val particles = mutableListOf<Particle>()
    private val random = Random.Default

    init {
        regenerateParticles()
    }

    private fun regenerateParticles() {
        particles.clear()
        repeat(particleCount) {
            particles.add(
                Particle(
                    x = random.nextFloat() * width,
                    y = random.nextFloat() * height,
                    vx = (random.nextFloat() - 0.5f) * 0.5f,
                    vy = (random.nextFloat() - 0.5f) * 0.5f,
                    radius = random.nextFloat() * 2f + 1f,
                    hue = random.nextFloat() * 60f + 200f // Blue/cyan range
                )
            )
        }
    }

    fun update(touchX: Float = -1f, touchY: Float = -1f, distortion: Float = 0f) {
        particles.forEachIndexed { index, particle ->
            var newVx = particle.vx
            var newVy = particle.vy

            // Touch distortion effect - particles are pushed away from touch
            if (touchX >= 0 && touchY >= 0 && distortion > 0) {
                val dx = particle.x - touchX
                val dy = particle.y - touchY
                val distanceSq = dx * dx + dy * dy
                val distance = sqrt(distanceSq)
                
                if (distance < 150f) {
                    // Push particles away from touch point
                    val force = (150f - distance) / 150f * distortion * 0.2f
                    val angle = atan2(dy, dx)
                    newVx += cos(angle) * force
                    newVy += sin(angle) * force
                    
                    // Add some randomness for organic feel
                    newVx += (random.nextFloat() - 0.5f) * 0.1f * distortion
                    newVy += (random.nextFloat() - 0.5f) * 0.1f * distortion
                }
            }

            var newX = particle.x + newVx
            var newY = particle.y + newVy

            // Boundary collision with bounce
            if (newX < 0 || newX > width) newVx = -newVx * 0.8f
            if (newY < 0 || newY > height) newVy = -newVy * 0.8f

            // Keep in bounds
            newX = newX.coerceIn(0f, width)
            newY = newY.coerceIn(0f, height)

            particles[index] = particle.copy(
                x = newX,
                y = newY,
                vx = newVx,
                vy = newVy
            )
        }
    }

    fun getParticles(): List<Particle> = particles.toList()
}

@Composable
fun AnimatedParticleBackground(
    modifier: Modifier = Modifier,
    particleCount: Int = 80
) {
    var touchX by remember { mutableStateOf(-1f) }
    var touchY by remember { mutableStateOf(-1f) }
    var distortion by remember { mutableStateOf(0f) }

    val particleSystem = remember { mutableStateOf<ParticleSystem?>(null) }

    // Animation for continuous particle movement
    val animationProgress by animateFloatAsState(
        animationSpec = infiniteRepeatable(
            animation = tween(durationMillis = 50),
            repeatMode = RepeatMode.Restart
        ),
        initialValue = 0f,
        targetValue = 1f
    )

    DisposableEffect(animationProgress) {
        particleSystem.value?.update(touchX, touchY, distortion)
        onDispose { }
    }

    Box(modifier = modifier.pointerInteropFilter {
        when (it.action and 0x7fffffff) {
            android.view.MotionEvent.ACTION_DOWN,
            android.view.MotionEvent.ACTION_MOVE -> {
                touchX = it.x
                touchY = it.y
                distortion = 1f
            }
            android.view.MotionEvent.ACTION_UP,
            android.view.MotionEvent.ACTION_CANCEL -> {
                distortion = 0f
            }
        }
        true
    }) {
        Canvas(modifier = Modifier.matchParentSize()) {
            val w = size.width
            val h = size.height

            if (particleSystem.value == null) {
                particleSystem.value = ParticleSystem(w, h, particleCount)
            }

            val particles = particleSystem.value?.getParticles() ?: return@Canvas

            // Draw connecting lines (constellation effect)
            for (i in particles.indices) {
                for (j in i + 1 until particles.indices) {
                    val p1 = particles[i]
                    val p2 = particles[j]
                    val dx = p1.x - p2.x
                    val dy = p1.y - p2.y
                    val distance = sqrt(dx * dx + dy * dy)

                    if (distance < 120f) {
                        val alpha = ((120f - distance) / 120f * 0.3f)
                        drawLine(
                            color = Color.hsl(210f, 0.7f, 0.6f, alpha),
                            start = Offset(p1.x, p1.y),
                            end = Offset(p2.x, p2.y),
                            strokeWidth = 1f
                        )
                    }
                }
            }

            // Draw particles (stars)
            particles.forEach { particle ->
                // Glow effect using radial gradient
                drawCircle(
                    brush = Brush.radialGradient(
                        colors = listOf(
                            Color.hsl(particle.hue, 0.8f, 0.9f, 0.8f),
                            Color.hsl(particle.hue, 0.8f, 0.6f, 0f)
                        ),
                        center = Offset(particle.x, particle.y),
                        radius = particle.radius * 3f
                    ),
                    center = Offset(particle.x, particle.y),
                    radius = particle.radius * 3f
                )
                
                // Core particle
                drawCircle(
                    color = Color.hsl(particle.hue, 0.8f, 0.9f),
                    center = Offset(particle.x, particle.y),
                    radius = particle.radius
                )
            }
        }
    }
}