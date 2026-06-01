/**
 * useNPCs — NPC management composable
 * Handles spawning, wandering AI, and collision detection for chickens and pedestrians
 */

import * as THREE from 'three'
import { CHICKEN_CONFIG, PEDESTRIAN_CONFIG } from '../data/npcs.js'

export function useNPCs({ scene, getSurfaceY, gameSpeed }) {
  const npcs = []
  const NPC_CONFIGS = {
    chicken: CHICKEN_CONFIG,
    pedestrian: PEDESTRIAN_CONFIG
  }

  function spawnNPC(type, laneX) {
    const config = NPC_CONFIGS[type]
    if (!config) return null

    const group = new THREE.Group()
    const color = config.colors[Math.floor(Math.random() * config.colors.length)]

    if (type === 'chicken') {
      const body = new THREE.Mesh(
        new THREE.SphereGeometry(0.3, 8, 8),
        new THREE.MeshToonMaterial({ color })
      )
      body.position.y = 0.3
      group.add(body)
    } else {
      const body = new THREE.Mesh(
        new THREE.CapsuleGeometry(0.25, 0.6, 4, 8),
        new THREE.MeshToonMaterial({ color })
      )
      body.position.y = 0.55
      group.add(body)
    }

    group.position.set(laneX, getSurfaceY(laneX), -50)
    group.userData = {
      npcType: type,
      wanderAngle: Math.random() * Math.PI * 2,
      wanderSpeed: config.speed * (0.8 + Math.random() * 0.4),
      wanderRadius: config.wanderRadius,
      baseX: laneX,
      hitRadius: config.hitRadius,
      scoreBonus: config.scoreBonus
    }

    scene.add(group)
    npcs.push(group)
    return group
  }

  function updateNPCs(delta) {
    for (let i = npcs.length - 1; i >= 0; i--) {
      const npc = npcs[i]
      npc.userData.wanderAngle += npc.userData.wanderSpeed * delta
      npc.position.x = npc.userData.baseX + Math.sin(npc.userData.wanderAngle) * npc.userData.wanderRadius
      npc.position.z += gameSpeed.value * 0.6

      if (npc.position.z > 5) {
        scene.remove(npc)
        npcs.splice(i, 1)
      }
    }
  }

  function checkNPCCollision(playerPos) {
    for (let i = npcs.length - 1; i >= 0; i--) {
      const npc = npcs[i]
      const dx = playerPos.x - npc.position.x
      const dz = playerPos.z - npc.position.z
      const distance = Math.sqrt(dx * dx + dz * dz)

      if (distance < npc.userData.hitRadius + 0.5) {
        const bonus = npc.userData.scoreBonus
        scene.remove(npc)
        npcs.splice(i, 1)
        return { hit: true, bonus }
      }
    }
    return { hit: false, bonus: 0 }
  }

  function clearNPCs() {
    npcs.forEach(n => scene.remove(n))
    npcs.length = 0
  }

  return {
    npcs,
    spawnNPC,
    updateNPCs,
    checkNPCCollision,
    clearNPCs
  }
}
