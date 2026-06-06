import * as THREE from 'three'

/**
 * Creates and animates a realistic 3D cat using Three.js.
 * Returns a cleanup function to stop the animation and dispose resources.
 */
export function createCat3D(container: HTMLElement): () => void {
  // ── Scene setup ──────────────────────────────────────────────────────────
  const W = 300
  const H = 300

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
  renderer.setSize(W, H)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap
  renderer.setClearColor(0x000000, 0)
  container.appendChild(renderer.domElement)

  const scene = new THREE.Scene()

  const camera = new THREE.PerspectiveCamera(45, W / H, 0.1, 100)
  camera.position.set(0, 1.2, 4.5)
  camera.lookAt(0, 0.8, 0)

  // ── Lighting ─────────────────────────────────────────────────────────────
  const ambient = new THREE.AmbientLight(0xffeedd, 0.6)
  scene.add(ambient)

  const keyLight = new THREE.DirectionalLight(0xfff5e0, 1.8)
  keyLight.position.set(3, 5, 3)
  keyLight.castShadow = true
  keyLight.shadow.mapSize.set(1024, 1024)
  scene.add(keyLight)

  const fillLight = new THREE.DirectionalLight(0xaaccff, 0.6)
  fillLight.position.set(-3, 2, 1)
  scene.add(fillLight)

  const rimLight = new THREE.DirectionalLight(0xffffff, 0.4)
  rimLight.position.set(0, 3, -4)
  scene.add(rimLight)

  // ── Materials ─────────────────────────────────────────────────────────────
  // Fur-like material using MeshStandardMaterial with roughness/metalness
  const furMat = new THREE.MeshStandardMaterial({
    color: 0x8899aa,       // blue-grey cat
    roughness: 0.95,
    metalness: 0.0,
    envMapIntensity: 0.3,
  })

  const darkFurMat = new THREE.MeshStandardMaterial({
    color: 0x556677,
    roughness: 0.95,
    metalness: 0.0,
  })

  const bellyMat = new THREE.MeshStandardMaterial({
    color: 0xdde8f0,
    roughness: 0.9,
    metalness: 0.0,
  })

  const noseMat = new THREE.MeshStandardMaterial({
    color: 0xffaacc,
    roughness: 0.5,
    metalness: 0.1,
  })

  const eyeWhiteMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.3,
  })

  const irisMat = new THREE.MeshStandardMaterial({
    color: 0xddcc44,       // amber/yellow eyes
    roughness: 0.1,
    metalness: 0.2,
    emissive: 0x443300,
    emissiveIntensity: 0.3,
  })

  const pupilMat = new THREE.MeshStandardMaterial({
    color: 0x050505,
    roughness: 0.1,
    metalness: 0.3,
  })

  const innerEarMat = new THREE.MeshStandardMaterial({
    color: 0xffbbcc,
    roughness: 0.8,
    side: THREE.DoubleSide,
  })

  // ── Cat group ─────────────────────────────────────────────────────────────
  const cat = new THREE.Group()
  scene.add(cat)

  // Helper: add mesh to group
  function mesh(geo: THREE.BufferGeometry, mat: THREE.Material, parent: THREE.Object3D = cat): THREE.Mesh {
    const m = new THREE.Mesh(geo, mat)
    m.castShadow = true
    m.receiveShadow = true
    parent.add(m)
    return m
  }

  // ── Body ──────────────────────────────────────────────────────────────────
  const bodyGeo = new THREE.SphereGeometry(0.55, 32, 24)
  bodyGeo.scale(1, 0.85, 0.9)
  const body = mesh(bodyGeo, furMat)
  body.position.set(0, 0.55, 0)

  // Belly patch
  const bellyGeo = new THREE.SphereGeometry(0.32, 24, 16)
  bellyGeo.scale(1, 0.7, 0.5)
  const belly = mesh(bellyGeo, bellyMat)
  belly.position.set(0, 0.48, 0.38)

  // ── Head ──────────────────────────────────────────────────────────────────
  const headGroup = new THREE.Group()
  cat.add(headGroup)
  headGroup.position.set(0, 1.22, 0.1)

  const headGeo = new THREE.SphereGeometry(0.42, 32, 24)
  headGeo.scale(1, 0.92, 0.95)
  mesh(headGeo, furMat, headGroup)

  // Cheek puffs
  for (const side of [-1, 1]) {
    const cheekGeo = new THREE.SphereGeometry(0.18, 16, 12)
    cheekGeo.scale(1, 0.8, 0.7)
    const cheek = mesh(cheekGeo, furMat, headGroup)
    cheek.position.set(side * 0.28, -0.06, 0.28)
  }

  // ── Ears ──────────────────────────────────────────────────────────────────
  for (const side of [-1, 1]) {
    const earGroup = new THREE.Group()
    headGroup.add(earGroup)
    earGroup.position.set(side * 0.28, 0.32, -0.05)
    earGroup.rotation.z = side * 0.2

    // Outer ear
    const earGeo = new THREE.ConeGeometry(0.16, 0.28, 4)
    const earMesh = new THREE.Mesh(earGeo, furMat)
    earMesh.castShadow = true
    earGroup.add(earMesh)

    // Inner ear
    const innerGeo = new THREE.ConeGeometry(0.09, 0.18, 4)
    const innerEar = new THREE.Mesh(innerGeo, innerEarMat)
    innerEar.position.set(0, 0.02, 0.02)
    earGroup.add(innerEar)
  }

  // ── Eyes ──────────────────────────────────────────────────────────────────
  const eyeGroups: THREE.Group[] = []
  for (const side of [-1, 1]) {
    const eyeGroup = new THREE.Group()
    headGroup.add(eyeGroup)
    eyeGroup.position.set(side * 0.16, 0.06, 0.35)
    eyeGroups.push(eyeGroup)

    // Eye white / sclera
    const scleraGeo = new THREE.SphereGeometry(0.1, 20, 16)
    scleraGeo.scale(1, 1.1, 0.7)
    mesh(scleraGeo, eyeWhiteMat, eyeGroup)

    // Iris
    const irisGeo = new THREE.SphereGeometry(0.075, 20, 16)
    irisGeo.scale(1, 1.1, 0.5)
    const irisMesh = mesh(irisGeo, irisMat, eyeGroup)
    irisMesh.position.z = 0.04

    // Pupil (vertical slit)
    const pupilGeo = new THREE.SphereGeometry(0.04, 12, 12)
    pupilGeo.scale(0.4, 1, 0.3)
    const pupilMesh = mesh(pupilGeo, pupilMat, eyeGroup)
    pupilMesh.position.z = 0.07

    // Eye shine
    const shineGeo = new THREE.SphereGeometry(0.018, 8, 8)
    const shineMat = new THREE.MeshBasicMaterial({ color: 0xffffff })
    const shine = new THREE.Mesh(shineGeo, shineMat)
    shine.position.set(0.025, 0.03, 0.09)
    eyeGroup.add(shine)
  }

  // ── Nose ──────────────────────────────────────────────────────────────────
  const noseGeo = new THREE.SphereGeometry(0.055, 12, 8)
  noseGeo.scale(1.2, 0.7, 0.6)
  const noseMesh = mesh(noseGeo, noseMat, headGroup)
  noseMesh.position.set(0, -0.06, 0.4)

  // ── Mouth lines (thin cylinders) ──────────────────────────────────────────
  const mouthMat = new THREE.MeshBasicMaterial({ color: 0x886677 })
  for (const side of [-1, 1]) {
    const mGeo = new THREE.CylinderGeometry(0.008, 0.008, 0.1, 6)
    const mMesh = new THREE.Mesh(mGeo, mouthMat)
    mMesh.position.set(side * 0.055, -0.13, 0.4)
    mMesh.rotation.z = side * 0.5
    headGroup.add(mMesh)
  }

  // ── Whiskers ──────────────────────────────────────────────────────────────
  const whiskerMat = new THREE.LineBasicMaterial({ color: 0xddddee, linewidth: 1 })
  for (const side of [-1, 1]) {
    for (let i = 0; i < 3; i++) {
      const points = [
        new THREE.Vector3(side * 0.12, -0.06 + i * 0.05, 0.38),
        new THREE.Vector3(side * 0.55, -0.04 + i * 0.04, 0.3),
      ]
      const wGeo = new THREE.BufferGeometry().setFromPoints(points)
      const whisker = new THREE.Line(wGeo, whiskerMat)
      headGroup.add(whisker)
    }
  }

  // ── Neck ──────────────────────────────────────────────────────────────────
  const neckGeo = new THREE.CylinderGeometry(0.22, 0.28, 0.22, 16)
  const neck = mesh(neckGeo, furMat)
  neck.position.set(0, 0.98, 0.05)

  // ── Legs ──────────────────────────────────────────────────────────────────
  const legPositions = [
    [-0.28, 0.18, 0.22],
    [0.28, 0.18, 0.22],
    [-0.22, 0.18, -0.2],
    [0.22, 0.18, -0.2],
  ]
  const legMeshes: THREE.Mesh[] = []
  for (const [x, y, z] of legPositions) {
    const legGeo = new THREE.CylinderGeometry(0.1, 0.09, 0.38, 12)
    const leg = mesh(legGeo, furMat)
    leg.position.set(x, y, z)
    legMeshes.push(leg)

    // Paw
    const pawGeo = new THREE.SphereGeometry(0.11, 12, 8)
    pawGeo.scale(1.1, 0.6, 1.2)
    const paw = mesh(pawGeo, darkFurMat)
    paw.position.set(x, y - 0.22, z + 0.04)
  }

  // ── Tail ──────────────────────────────────────────────────────────────────
  const tailGroup = new THREE.Group()
  cat.add(tailGroup)
  tailGroup.position.set(-0.3, 0.6, -0.45)

  const tailSegments = 6
  let prevGroup = tailGroup
  const tailParts: THREE.Group[] = []
  for (let i = 0; i < tailSegments; i++) {
    const tg = new THREE.Group()
    prevGroup.add(tg)
    tg.position.set(0, 0.18, 0)
    tailParts.push(tg)

    const r = 0.07 - i * 0.007
    const tailSegGeo = new THREE.CylinderGeometry(r, r + 0.01, 0.2, 10)
    const tailSeg = new THREE.Mesh(tailSegGeo, i < 3 ? furMat : darkFurMat)
    tailSeg.castShadow = true
    tg.add(tailSeg)

    prevGroup = tg
  }

  // Tail tip
  const tipGeo = new THREE.SphereGeometry(0.09, 10, 8)
  const tip = new THREE.Mesh(tipGeo, darkFurMat)
  tip.castShadow = true
  prevGroup.add(tip)
  tip.position.y = 0.1

  // ── Ground shadow ─────────────────────────────────────────────────────────
  const shadowGeo = new THREE.CircleGeometry(0.6, 32)
  const shadowMat = new THREE.MeshBasicMaterial({
    color: 0x000000,
    transparent: true,
    opacity: 0.18,
  })
  const groundShadow = new THREE.Mesh(shadowGeo, shadowMat)
  groundShadow.rotation.x = -Math.PI / 2
  groundShadow.position.y = 0.01
  scene.add(groundShadow)

  // ── Animation ─────────────────────────────────────────────────────────────
  let rafId = 0
  let blinkTimer = 0
  let blinkState = 0 // 0=open, 1=closing, 2=opening
  let blinkProgress = 0

  function animate(time: number): void {
    rafId = requestAnimationFrame(animate)
    const t = time * 0.001

    // Float body up/down
    cat.position.y = Math.sin(t * 1.1) * 0.08
    cat.rotation.y = Math.sin(t * 0.4) * 0.15

    // Head subtle look-around
    headGroup.rotation.y = Math.sin(t * 0.7) * 0.12
    headGroup.rotation.x = Math.sin(t * 0.5) * 0.06 - 0.05

    // Tail swing
    let tailAngle = Math.sin(t * 2.2) * 0.5
    tailGroup.rotation.z = tailAngle
    tailParts.forEach((tp, i) => {
      tp.rotation.z = Math.sin(t * 2.2 + i * 0.3) * 0.15
    })

    // Leg subtle movement
    legMeshes.forEach((leg, i) => {
      leg.rotation.x = Math.sin(t * 1.5 + i * Math.PI * 0.5) * 0.06
    })

    // Breathing
    const breathe = 1 + Math.sin(t * 1.8) * 0.025
    body.scale.set(breathe, 1 / breathe * 0.98 + 0.02, breathe * 0.99)

    // Blink
    blinkTimer += 0.016
    if (blinkState === 0 && blinkTimer > 3 + Math.random() * 2) {
      blinkState = 1
      blinkTimer = 0
    }
    if (blinkState === 1) {
      blinkProgress += 0.15
      if (blinkProgress >= 1) { blinkState = 2 }
    } else if (blinkState === 2) {
      blinkProgress -= 0.12
      if (blinkProgress <= 0) { blinkProgress = 0; blinkState = 0; blinkTimer = 0 }
    }
    const blinkScale = blinkState === 0 ? 1 : 1 - Math.sin(blinkProgress * Math.PI) * 0.9
    eyeGroups.forEach(eg => { eg.scale.y = blinkScale })

    // Ground shadow scales with float
    const shadowScale = 1 - cat.position.y * 0.3
    groundShadow.scale.set(shadowScale, shadowScale, 1)

    renderer.render(scene, camera)
  }

  rafId = requestAnimationFrame(animate)

  // ── Cleanup ───────────────────────────────────────────────────────────────
  return () => {
    cancelAnimationFrame(rafId)
    renderer.dispose()
    if (renderer.domElement.parentNode) {
      renderer.domElement.parentNode.removeChild(renderer.domElement)
    }
  }
}
