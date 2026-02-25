// PR Celebration System with Confetti Animation

class PRCelebration {
    constructor() {
        this.confettiCanvas = null;
        this.ctx = null;
        this.particles = [];
        this.animationId = null;
        this.init();
    }

    init() {
        // Create celebration modal HTML
        const modalHTML = `
            <div id="pr-celebration-modal" class="pr-modal">
                <canvas id="confetti-canvas" class="confetti-canvas"></canvas>
                <div class="pr-modal-content">
                    <div class="pr-trophy">🏆</div>
                    <h2 class="pr-title">NEW PERSONAL RECORD!</h2>
                    <div class="pr-details">
                        <h3 id="pr-exercise-name"></h3>
                        <div class="pr-weight-change">
                            <span id="pr-old-weight"></span>
                            <span class="pr-arrow">→</span>
                            <span id="pr-new-weight"></span>
                        </div>
                        <div class="pr-increase" id="pr-increase"></div>
                    </div>
                    <button class="pr-continue-btn" onclick="prCelebration.close()">
                        Awesome! Continue
                    </button>
                </div>
            </div>
        `;
        
        // Append to body
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // Setup canvas
        this.confettiCanvas = document.getElementById('confetti-canvas');
        this.ctx = this.confettiCanvas.getContext('2d');
        this.resizeCanvas();
        
        // Handle window resize
        window.addEventListener('resize', () => this.resizeCanvas());
    }

    resizeCanvas() {
        if (!this.confettiCanvas) return;
        const dpr = window.devicePixelRatio || 1;
        const width = window.innerWidth;
        const height = window.innerHeight;
        
        // Set actual size in memory (scaled for retina displays)
        this.confettiCanvas.width = width * dpr;
        this.confettiCanvas.height = height * dpr;
        
        // Scale back down with CSS
        this.confettiCanvas.style.width = width + 'px';
        this.confettiCanvas.style.height = height + 'px';
        
        // Scale the context to counter the dpr scaling
        this.ctx.scale(dpr, dpr);
    }

    show(exerciseName, oldWeight, newWeight) {
        const modal = document.getElementById('pr-celebration-modal');
        const increase = newWeight - oldWeight;
        
        // Update modal content
        document.getElementById('pr-exercise-name').textContent = exerciseName;
        document.getElementById('pr-old-weight').textContent = `${oldWeight}kg`;
        document.getElementById('pr-new-weight').textContent = `${newWeight}kg`;
        document.getElementById('pr-increase').textContent = `+${increase}kg increase!`;
        
        // Show modal
        modal.style.display = 'flex';
        
        // Start confetti
        this.createConfetti();
        this.animate();
        
        // Auto-close after 5 seconds
        setTimeout(() => this.close(), 5000);
    }

    close() {
        const modal = document.getElementById('pr-celebration-modal');
        modal.style.display = 'none';
        
        // Stop animation
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        
        // Clear particles
        this.particles = [];
        this.ctx.clearRect(0, 0, this.confettiCanvas.width, this.confettiCanvas.height);
    }

    createConfetti() {
        const colors = ['#667eea', '#764ba2', '#f093fb', '#4facfe', '#43e97b', '#fa709a', '#feca57', '#ff6b6b'];
        const particleCount = 200;
        const width = window.innerWidth;
        const height = window.innerHeight;
        
        for (let i = 0; i < particleCount; i++) {
            this.particles.push({
                x: Math.random() * width,
                y: -10 - Math.random() * height,
                width: Math.random() * 10 + 5,
                height: Math.random() * 10 + 5,
                color: colors[Math.floor(Math.random() * colors.length)],
                speedY: Math.random() * 3 + 2,
                speedX: Math.random() * 2 - 1,
                rotation: Math.random() * 360,
                rotationSpeed: Math.random() * 10 - 5,
                opacity: 1
            });
        }
    }

    animate() {
        const width = window.innerWidth;
        const height = window.innerHeight;
        this.ctx.clearRect(0, 0, width, height);
        
        // Update and draw particles
        this.particles.forEach((particle, index) => {
            particle.y += particle.speedY;
            particle.x += particle.speedX;
            particle.rotation += particle.rotationSpeed;
            
            // Fade out near bottom
            if (particle.y > height - 100) {
                particle.opacity -= 0.02;
            }
            
            // Remove if off screen
            if (particle.y > height + 10 || particle.opacity <= 0) {
                this.particles.splice(index, 1);
                return;
            }
            
            // Draw particle
            this.ctx.save();
            this.ctx.translate(particle.x, particle.y);
            this.ctx.rotate((particle.rotation * Math.PI) / 180);
            this.ctx.globalAlpha = particle.opacity;
            this.ctx.fillStyle = particle.color;
            this.ctx.fillRect(-particle.width / 2, -particle.height / 2, particle.width, particle.height);
            this.ctx.restore();
        });
        
        // Continue animation if particles exist
        if (this.particles.length > 0) {
            this.animationId = requestAnimationFrame(() => this.animate());
        }
    }
}

// Initialize globally
let prCelebration;
if (typeof window !== 'undefined') {
    window.addEventListener('DOMContentLoaded', () => {
        prCelebration = new PRCelebration();
        window.prCelebration = prCelebration;
    });
}

export { PRCelebration };
