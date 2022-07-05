const canvas = document.querySelector('canvas');
const c = canvas.getContext('2d')
const scoreEl = document.querySelector('#scoreEl')
const startGameBtn = document.querySelector('#startGameBtn')
const modalContainer = document.querySelector('#modalContainer')
const finalScore = document.querySelector('#finalScore')

canvas.width = innerWidth
canvas.height = innerHeight


class Player {
  constructor({
    position,
    radius,
    color
  }) {
    this.position = {
      x: position.x,
      y: position.y
    }
    this.color = color
    this.radius = radius
  }

  draw() {
    c.beginPath()
    c.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2, false)
    c.fillStyle = this.color
    c.fill()
  }
}
class Projectile {
  constructor({
    position,
    radius,
    color,
    velocity,
    speedFactor
  }) {
    this.position = {
      x: position.x,
      y: position.y
    }
    this.color = color
    this.radius = radius
    this.velocity = {
      x: velocity.x * speedFactor,
      y: velocity.y * speedFactor
    }
  }

  draw() {
    c.beginPath()
    c.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2, false)
    c.fillStyle = this.color
    c.fill()
  }

  update() {
    this.draw()
    this.position.x = this.position.x + this.velocity.x
    this.position.y = this.position.y + this.velocity.y
  }
}
class Enemy {
  constructor({
    position,
    radius,
    color,
    velocity
  }) {
    this.position = {
      x: position.x,
      y: position.y
    }
    this.color = color
    this.radius = radius
    this.velocity = {
      x: velocity.x,
      y: velocity.y
    }
  }

  draw() {
    c.beginPath()
    c.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2, false)
    c.fillStyle = this.color
    c.fill()
  }

  update() {
    this.draw()
    this.position.x = this.position.x + this.velocity.x
    this.position.y = this.position.y + this.velocity.y
  }
}

const friction = 0.99

class Particle {
  constructor({
    position,
    radius,
    color,
    velocity
  }) {
    this.position = {
      x: position.x,
      y: position.y
    }
    this.color = color
    this.radius = radius
    this.velocity = {
        x: velocity.x,
        y: velocity.y
      },
      this.alpha = 1
  }

  draw() {
    c.save()
    c.globalAlpha = this.alpha
    c.beginPath()
    c.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2, false)
    c.fillStyle = this.color
    c.fill()
    c.restore()
  }

  update() {
    this.draw()
    this.velocity.x *= friction
    this.velocity.y *= friction
    this.position.x = this.position.x + this.velocity.x
    this.position.y = this.position.y + this.velocity.y
    this.alpha -= 0.01
  }
}

const playerX = canvas.width / 2
const playerY = canvas.height / 2

let player = new Player({
  position: {
    x: playerX,
    y: playerY
  },
  color: 'white',
  radius: 10
})

let projectiles = []
let particles = []
let enemies = []

function init() {
  player = new Player({
    position: {
      x: playerX,
      y: playerY
    },
    color: 'white',
    radius: 10
  })
  
  projectiles = []
  particles = []
  enemies = []
  score = 0
  finalScore.innerHTML = score
  scoreEl.innerHTML = score
}

function spawnEnemies() {
  setInterval(() => {
    const radius = Math.random() * (40 - 10) + 10
    let x
    let y

    if (Math.random() < 0.5) {
      x = Math.random() < 0.5 ? 0 - radius : canvas.width + radius
      y = Math.random() * canvas.height
    } else {
      x = Math.random() * canvas.width
      y = Math.random() < 0.5 ? 0 - radius : canvas.height + radius

    }
    // enemy color
    const color = `hsl(${Math.random() * 360}, 50%, 50%)`

    const angle = Math.atan2(canvas.height / 2 - y, canvas.width / 2 - x)
    const velocity = {
      x: Math.cos(angle),
      y: Math.sin(angle)
    }

    enemies.push(new Enemy({
      position: {
        x: x,
        y: y
      },
      radius: radius,
      color: color,
      velocity: velocity
    }))
  }, 1000)
}

let animationId
let score = 0

function animate() {
  animationId = requestAnimationFrame(animate)
  c.fillStyle = 'rgba(0,0,0,0.2)'
  c.fillRect(0, 0, canvas.width, canvas.height)
  player.draw()

  particles.forEach((particle, particleIndex) => {
    if (particle.alpha <= 0)
      particles.splice(particleIndex, 1)
    else
      particle.update()
  })

  projectiles.forEach((projectile, projectileIndex) => {
    projectile.update()

    // removing projectiles after reach screen limit
    if (projectile.position.x - projectile.radius < 0 ||
      projectile.position.x + projectile.radius > canvas.width ||
      projectile.position.y - projectile.radius < 0 ||
      projectile.position.y + projectile.radius > canvas.height
    ) {
      setTimeout(() => {
        projectiles.splice(projectileIndex, 1)
      })
    }
  })

  enemies.forEach((enemy, enemyIndex) => {
    enemy.update()

    const dist = Math.hypot(player.position.x - enemy.position.x, player.position.y - enemy.position.y)

    // player and enemy collision
    // end game
    if (dist - enemy.radius - player.radius < 1) {
      cancelAnimationFrame(animationId)
      modalContainer.classList.remove('hidden')
      finalScore.innerHTML = score
    }

    projectiles.forEach((projectile, projectileIndex) => {
      const dist = Math.hypot(projectile.position.x - enemy.position.x, projectile.position.y - enemy.position.y)

      // projectile and enemy collision
      if (dist - enemy.radius - projectile.radius < 0) {
        // create particles on projectile collision whit enemy
        for (let i = 0; i < enemy.radius * 2; i++) {
          particles.push(new Particle({
            position: {
              x: projectile.position.x,
              y: projectile.position.y
            },
            radius: Math.random() * 2,
            color: enemy.color,
            velocity: {
              x: (Math.random() - 0.5) * (Math.random() * 3),
              y: (Math.random() - 0.5) * (Math.random() * 3)
            }
          }))

        }

        // shrinking enemy until remove from screen
        if (enemy.radius - 10 > 10) {
          // increase score
          score += 10
          scoreEl.innerHTML = score

          gsap.to(enemy, {
            radius: enemy.radius - 10
          })
          setTimeout(() => {
            projectiles.splice(projectileIndex, 1)
          }, 0)
        } else {
          // removing enemy from screen
          score += 25
          scoreEl.innerHTML = score

          setTimeout(() => {
            enemies.splice(enemyIndex, 1)
            projectiles.splice(projectileIndex, 1)
          }, 0)
        }
      }

    })
  })
}

addEventListener('click', (e) => {
  const angle = Math.atan2(e.clientY - canvas.height / 2, e.clientX - canvas.width / 2)
  const velocity = {
    x: Math.cos(angle),
    y: Math.sin(angle)
  }

  projectiles.push(new Projectile({
    position: {
      x: canvas.width / 2,
      y: canvas.height / 2
    },
    radius: 5,
    color: 'white',
    velocity: {
      x: velocity.x,
      y: velocity.y
    },
    speedFactor: 6
  }))
})

startGameBtn.addEventListener('click', () => {
  init()
  animate()
  spawnEnemies()
  modalContainer.classList.add('hidden')
})