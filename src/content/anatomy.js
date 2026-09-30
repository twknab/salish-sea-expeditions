// Boat School: the boat, the body, the paddle (FR-000a). Positions (x, y) are fractions of the
// side-view illustration (src/art/kayak-side.svg), used to place tap targets.

export const KAYAK_PARTS = [
  { id: 'bow', name: 'Bow', x: 0.04, y: 0.527, text: 'The front of the kayak. It rises to meet waves and carries the front flotation bag.', sourceIds: ['aca'] },
  { id: 'stern', name: 'Stern', x: 0.965, y: 0.533, text: 'The back of the kayak. The stern flotation bag and heavier dry bags ride here.', sourceIds: ['aca'] },
  { id: 'deck', name: 'Deck', x: 0.25, y: 0.5, text: 'The top of the boat. Deck lines give you and your partner something to grab in a rescue.', sourceIds: ['aca'] },
  { id: 'hull', name: 'Hull', x: 0.3, y: 0.673, text: 'The underside, in the water. Its shape decides how the boat tracks, turns and feels on edge. This skin is white below the waterline, so an upturned boat is easy to spot.', sourceIds: ['aca', 'trak'] },
  { id: 'keel', name: 'Keel', x: 0.48, y: 0.713, text: 'The spine along the bottom. It helps the boat run straight.', sourceIds: ['aca'] },
  { id: 'chine', name: 'Chine', x: 0.76, y: 0.633, text: 'Where the side of the hull turns under. Tilting onto the chine — edging — is how you carve a turn.', sourceIds: ['aca'] },
  { id: 'cockpit', name: 'Cockpit & coaming', x: 0.46, y: 0.507, text: 'Where you sit. The raised rim, the coaming, is what the spray skirt seals around. On this folding kayak, gear also loads through the cockpit — there are no hatches.', sourceIds: ['trak', 'aca'] },
  { id: 'skirt', name: 'Spray skirt', x: 0.53, y: 0.463, text: 'A neoprene or nylon deck you wear. It seals you in so waves stay out. Always leave the grab loop outside — it is how you release it in a wet exit.', sourceIds: ['aca'] },
  { id: 'frame', name: 'Frame & skin', x: 0.152, y: 0.613, text: 'An aluminium frame inside a tough waterproof skin — a modern descendant of the skin-on-frame kayaks of Arctic peoples.', sourceIds: ['trak', 'arctic'] },
  { id: 'jacks', name: 'Hull jacks', x: 0.546, y: 0.603, text: 'Three jacks — one along each side, one on the keel — tension the skin and set the rocker. Less rocker tracks straight on a crossing; more rocker turns quickly among rocks. You can adjust them while paddling.', sourceIds: ['trak', 'paddlingmag'] },
  { id: 'float', name: 'Flotation bags', x: 0.79, y: 0.62, text: 'Dry bags fore and aft that hold your gear and keep the kayak afloat if you capsize. A half-empty boat without them would fill with water.', sourceIds: ['trak'] },
];

export const BODY_POINTS = [
  { id: 'feet', name: 'Feet on the pegs', text: 'Balls of the feet on the foot pegs, toes relaxed. Each stroke pushes through the foot on the stroke side.', sourceIds: ['aca'] },
  { id: 'knees', name: 'Knees in the thigh braces', text: 'Knees up and out, pressing lightly into the thigh braces. This is your steering wheel — lift a knee and the boat tilts.', sourceIds: ['aca'] },
  { id: 'hips', name: 'Hips connect you', text: 'You wear a kayak, you do not sit in it. The hips carry the connection from the body to the boat: lower body steers and tilts, upper body drives.', sourceIds: ['aca'] },
  { id: 'back', name: 'Backband at the pelvis', text: 'The backband supports the pelvis, not the shoulders. Sit tall, slightly forward — never slumped against it.', sourceIds: ['aca'] },
  { id: 'head', name: 'Head over the boat', text: 'Keep your head over the kayak. The body follows the head: lift it too early in a brace or roll and you go over.', sourceIds: ['aca'] },
];

export const PADDLE_PARTS = [
  { id: 'blade', name: 'Blade & power face', text: 'The power face is the side that pulls against the water — it faces you on a forward stroke.', sourceIds: ['aca'] },
  { id: 'shaft', name: 'Shaft & grip', text: 'Hands a little wider than your shoulders, knuckles in line with the top edge of the blade. Grip lightly.', sourceIds: ['aca'] },
  { id: 'feather', name: 'Feather', text: 'The two blades are often set at an angle to each other so the blade in the air slices through the wind.', sourceIds: ['aca'] },
  { id: 'box', name: 'The paddler’s box', text: 'Keep your hands in front of your chest, in the box formed by your arms and shoulders. It protects your shoulders and keeps the power in your torso.', sourceIds: ['aca'] },
];

export const DRILLS = [
  { id: 'forward', title: 'Forward stroke: rotate, don’t pull', skill: 'forward', text: 'Wind up your torso, plant the blade by your feet and unwind. Your arms stay nearly straight; the stroke ends at your hip. Swipe long and smooth from the top of a thumb zone to the bottom.', goal: 'Six rotation strokes in a row' },
  { id: 'edge', title: 'Edging: lift a knee', skill: 'edging', text: 'Lift one knee to tilt the kayak onto its chine, keeping your head and body over the boat. Drag the hips strip toward the side you want to go down.', goal: 'Hold an edge for three seconds' },
  { id: 'sweep', title: 'Sweep on edge', skill: 'sweep', text: 'A wide arc from bow to stern turns the boat away from the blade. Edge toward the sweep side and it turns far more.', goal: 'Turn half a circle with edged sweeps' },
  { id: 'brace', title: 'Low brace and hip snap', skill: 'brace', text: 'When you tip, slap the back of the blade flat on the water on the low side, then snap your hips to bring the boat back under you. Head stays down — it comes up last.', goal: 'Recover from three wobbles' },
];
