package com.tagalong.app.ui

import androidx.compose.animation.core.*
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
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
                    hue = random.nextFloat() * 60f + 200f
                )
            )
        }
    }

    fun update() {
        particles.forEachIndexed { index, particle ->
            var newVx = particle.vx
            var newVy = particle.vy

            var newX = particle.x + newVx
            var newY = particle.y + newVy

            if (newX < 0 || newX > width) newVx = -newVx * 0.8f
            if (newY < 0 || newY > height) newVy = -newVy * 0.8f

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
    val particleSystem = remember { mutableStateOf<ParticleSystem?>(null) }
    
    LaunchedEffect(Unit) {
        while (true) {
            particleSystem.value?.update()
            kotlinx.coroutines.delay(50)
        }
    }

    Canvas(modifier = Modifier.fillMaxSize()) {
        val w = size.width
        val h = size.height

        if (particleSystem.value == null) {
            particleSystem.value = ParticleSystem(w, h, particleCount)
        }

        val particles = particleSystem.value?.getParticles() ?: return@Canvas

        for (i in particles.indices) {
            for (j in (i + 1)..particles.lastIndex) {
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

        particles.forEach { particle ->
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
            
            drawCircle(
                color = Color.hsl(particle.hue, 0.8f, 0.9f),
                center = Offset(particle.x, particle.y),
                radius = particle.radius
            )
        }
    }
}