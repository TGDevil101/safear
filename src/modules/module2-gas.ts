import type { ModuleConfig } from './types'

/**
 * Module 2 — Gas Leak & Confined Space Protocol (PRD 5.1).
 *
 * Proof that Decision 3 (see README) works: this file is pure content. No engine code was
 * written to add it. Modules 3-5 for the SIH finals build follow the same shape.
 */
export const moduleGas: ModuleConfig = {
  id: 'gas',
  nameKey: 'modules.gas.name',
  descKey: 'modules.gas.desc',
  briefKey: 'modules.gas.brief',
  debriefKey: 'modules.gas.debrief',
  accent: '#22d3ee',
  steps: [
    // Step 1 - Leak Identification
    {
      id: 'gas-1',
      titleKey: 'modules.gas.s1.title',
      promptKey: 'modules.gas.s1.prompt',
      audio: 'gas-1.mp3',
      correctIds: ['leak-valve'],
      wrongFeedbackKey: 'modules.gas.s1.wrong',
      successKey: 'modules.gas.s1.ok',
      entities: [
        // Pipe run along the marker.
        {
          id: 'pipe',
          kind: 'cylinder',
          position: [0, 0.3, -0.35],
          rotation: [0, 0, 90],
          radius: 0.08,
          height: 1.6,
          color: '#64748b',
        },
        // The leaking joint - correct target.
        {
          id: 'leak-valve',
          kind: 'sphere',
          position: [-0.4, 0.3, -0.35],
          radius: 0.14,
          color: '#ef4444',
          tappable: true,
          animation:
            'property: scale; from: 1 1 1; to: 1.25 1.25 1.25; dir: alternate; loop: true; dur: 500; easing: easeInOutSine',
        },
        // The escaping gas cloud, drifting upward.
        {
          id: 'cloud',
          kind: 'sphere',
          position: [-0.4, 0.62, -0.35],
          radius: 0.3,
          color: '#a3e635',
          opacity: 0.35,
          animation:
            'property: scale; from: 0.7 0.7 0.7; to: 1.3 1.3 1.3; dir: alternate; loop: true; dur: 1600; easing: easeInOutSine',
        },
        // Decoys.
        {
          id: 'gauge',
          kind: 'cylinder',
          position: [0.45, 0.45, -0.35],
          rotation: [90, 0, 0],
          radius: 0.12,
          height: 0.06,
          color: '#e2e8f0',
          label: 'GAUGE',
          labelColor: '#0f172a',
          tappable: true,
        },
        {
          id: 'pump',
          kind: 'box',
          position: [0.75, 0.2, 0.25],
          width: 0.34,
          height: 0.4,
          depth: 0.34,
          color: '#334155',
          label: 'PUMP',
          labelColor: '#e2e8f0',
          tappable: true,
        },
      ],
    },

    // Step 2 - PPE Selection (correct set = SCBA mask + gas-rated gloves)
    {
      id: 'gas-2',
      titleKey: 'modules.gas.s2.title',
      promptKey: 'modules.gas.s2.prompt',
      audio: 'gas-2.mp3',
      correctIds: ['ppe-scba', 'ppe-gloves'],
      requireAll: true,
      wrongFeedbackKey: 'modules.gas.s2.wrong',
      successKey: 'modules.gas.s2.ok',
      entities: [
        {
          id: 'ppe-scba',
          kind: 'box',
          position: [-0.75, 0.35, 0],
          width: 0.4,
          height: 0.4,
          depth: 0.2,
          color: '#0ea5e9',
          label: 'SCBA MASK',
          labelColor: '#ffffff',
          tappable: true,
        },
        {
          id: 'ppe-gloves',
          kind: 'box',
          position: [-0.25, 0.35, 0],
          width: 0.4,
          height: 0.4,
          depth: 0.2,
          color: '#0ea5e9',
          label: 'GAS GLOVES',
          labelColor: '#ffffff',
          tappable: true,
        },
        // Wrong PPE - a dust mask is useless against toxic gas.
        {
          id: 'ppe-dust',
          kind: 'box',
          position: [0.25, 0.35, 0],
          width: 0.4,
          height: 0.4,
          depth: 0.2,
          color: '#94a3b8',
          label: 'DUST MASK',
          labelColor: '#0f172a',
          tappable: true,
        },
        {
          id: 'ppe-earmuff',
          kind: 'box',
          position: [0.75, 0.35, 0],
          width: 0.4,
          height: 0.4,
          depth: 0.2,
          color: '#94a3b8',
          label: 'EAR MUFFS',
          labelColor: '#0f172a',
          tappable: true,
        },
      ],
    },

    // Step 3 - Buddy System (assign entrant, then standby - order matters)
    {
      id: 'gas-3',
      titleKey: 'modules.gas.s3.title',
      promptKey: 'modules.gas.s3.prompt',
      audio: 'gas-3.mp3',
      correctIds: ['worker-a', 'worker-b'],
      requireAll: true,
      ordered: true,
      wrongFeedbackKey: 'modules.gas.s3.wrong',
      successKey: 'modules.gas.s3.ok',
      entities: [
        // Worker A stands at the vessel opening -> the entrant.
        {
          id: 'worker-a',
          kind: 'cylinder',
          position: [-0.4, 0.3, -0.2],
          radius: 0.12,
          height: 0.6,
          color: '#f59e0b',
          label: 'ENTRANT',
          labelColor: '#fffbeb',
          tappable: true,
        },
        {
          id: 'worker-a-head',
          kind: 'sphere',
          position: [-0.4, 0.68, -0.2],
          radius: 0.1,
          color: '#fbbf24',
        },
        // Worker B stays outside -> the standby / attendant.
        {
          id: 'worker-b',
          kind: 'cylinder',
          position: [0.4, 0.3, 0.3],
          radius: 0.12,
          height: 0.6,
          color: '#22c55e',
          label: 'STANDBY',
          labelColor: '#f0fdf4',
          tappable: true,
        },
        {
          id: 'worker-b-head',
          kind: 'sphere',
          position: [0.4, 0.68, 0.3],
          radius: 0.1,
          color: '#4ade80',
        },
        // The confined space itself.
        {
          id: 'vessel',
          kind: 'torus',
          position: [-0.4, 0.02, -0.2],
          rotation: [90, 0, 0],
          radius: 0.3,
          color: '#475569',
        },
      ],
    },

    // Step 4 - Evacuation
    {
      id: 'gas-4',
      titleKey: 'modules.gas.s4.title',
      promptKey: 'modules.gas.s4.prompt',
      audio: 'gas-4.mp3',
      correctIds: ['gas-exit'],
      wrongFeedbackKey: 'modules.gas.s4.wrong',
      successKey: 'modules.gas.s4.ok',
      entities: [
        {
          id: 'cloud-b',
          kind: 'sphere',
          position: [0.5, 0.5, -0.3],
          radius: 0.4,
          color: '#a3e635',
          opacity: 0.3,
          animation:
            'property: scale; from: 0.9 0.9 0.9; to: 1.2 1.2 1.2; dir: alternate; loop: true; dur: 1500',
        },
        // Upwind exit - away from the drifting cloud.
        {
          id: 'g-arrow-1',
          kind: 'cone',
          position: [-0.3, 0.08, 0.4],
          rotation: [0, 0, 90],
          radius: 0.09,
          height: 0.22,
          color: '#22c55e',
        },
        {
          id: 'g-arrow-2',
          kind: 'cone',
          position: [-0.65, 0.08, 0.4],
          rotation: [0, 0, 90],
          radius: 0.09,
          height: 0.22,
          color: '#22c55e',
        },
        {
          id: 'gas-exit',
          kind: 'plane',
          position: [-1.0, 0.4, 0.4],
          rotation: [0, 90, 0],
          width: 0.55,
          height: 0.3,
          color: '#16a34a',
          label: 'UPWIND EXIT',
          labelColor: '#ffffff',
          tappable: true,
        },
        // Downwind exit - walking into the gas.
        {
          id: 'gas-exit-bad',
          kind: 'plane',
          position: [1.0, 0.4, -0.3],
          rotation: [0, -90, 0],
          width: 0.55,
          height: 0.3,
          color: '#16a34a',
          label: 'EXIT',
          labelColor: '#ffffff',
          tappable: true,
        },
      ],
    },

    // Step 5 - Rescue Trigger (never enter to rescue - raise the alarm)
    {
      id: 'gas-5',
      titleKey: 'modules.gas.s5.title',
      promptKey: 'modules.gas.s5.prompt',
      audio: 'gas-5.mp3',
      correctIds: ['alarm'],
      wrongFeedbackKey: 'modules.gas.s5.wrong',
      successKey: 'modules.gas.s5.ok',
      entities: [
        // The collapsed buddy, lying inside the vessel.
        {
          id: 'down-buddy',
          kind: 'cylinder',
          position: [-0.4, 0.12, -0.2],
          rotation: [90, 0, 0],
          radius: 0.12,
          height: 0.6,
          color: '#f59e0b',
          label: 'BUDDY DOWN',
          labelColor: '#fef3c7',
        },
        // Correct action: hit the emergency alarm.
        {
          id: 'alarm',
          kind: 'cylinder',
          position: [0.5, 0.45, 0.2],
          rotation: [90, 0, 0],
          radius: 0.18,
          height: 0.1,
          color: '#dc2626',
          label: 'EMERGENCY CALL',
          labelColor: '#ffffff',
          tappable: true,
          animation:
            'property: scale; from: 1 1 1; to: 1.15 1.15 1.15; dir: alternate; loop: true; dur: 600',
        },
        // The fatal wrong answer: entering unprotected to pull the buddy out.
        {
          id: 'enter-now',
          kind: 'plane',
          position: [-0.4, 0.6, -0.2],
          width: 0.7,
          height: 0.26,
          color: '#334155',
          label: 'ENTER AND PULL',
          labelColor: '#e2e8f0',
          tappable: true,
        },
      ],
    },
  ],
}
