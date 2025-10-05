const canvas = document.getElementById("starfield");
const ctx = canvas.getContext("2d");

let stars = [];
const numStars = 400;

// Resize canvas full screen
function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener("resize", resizeCanvas);
resizeCanvas();

// Star constructor
class Star {
  constructor() {
    this.reset();
  }

  reset() {
    this.x = (Math.random() - 0.5) * canvas.width;
    this.y = (Math.random() - 0.5) * canvas.height;
    this.z = Math.random() * canvas.width;
  }

  update() {
    this.z -= 1;  // controls speed
    if (this.z <= 0) this.reset();
  }

  draw() {
    const sx = (this.x / this.z) * canvas.width + canvas.width / 2;
    const sy = (this.y / this.z) * canvas.height + canvas.height / 2;
    const r = (1 - this.z / canvas.width) * 2;

    ctx.beginPath();
    ctx.arc(sx, sy, r, 0, Math.PI * 2);
    ctx.fillStyle = "white";
    ctx.fill();
  }
}

// Initialize stars
for (let i = 0; i < numStars; i++) {
  stars.push(new Star());
}

// Animation loop
function animate() {
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (let star of stars) {
    star.update();
    star.draw();
  }

  requestAnimationFrame(animate);
}

animate();