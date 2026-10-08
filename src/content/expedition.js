// The expedition, leg by leg: the float plan before each launch, the landing, and camp at the end
// of the day. The geometry of each leg (its waypoints over the real water, its cove) is generated
// by tools/geo/leg_routes.py into godot/content/legs.json under the same ids; this file is the
// teaching. Every sourceIds entry resolves in credits.js.

export const LEGS = [
  {
    id: 'leg1',
    from: 'fridayHarbor', to: 'jones',
    title: 'Friday Harbor to Jones Island',
    steps: [
      { id: 'route', title: 'The route', text: 'Out of the harbour, north up San Juan Channel past Friday Harbor Laboratories and Yellow Island, then across to the north cove on Jones Island. About ten kilometres: two hours at a touring pace, three with a stop on Yellow Island’s lee.', sourceIds: ['noaa-chart', 'wwta'] },
      { id: 'tide', title: 'Tide and current', text: 'San Juan Channel floods north-northwest and ebbs south-southeast at up to two knots. Leave on the morning flood and the channel carries you; leave late and you fight the ebb with the afternoon southerly behind it.', sourceIds: ['noaa-tides'] },
      { id: 'traffic', title: 'Traffic', text: 'The ferries use the harbour entrance and the channel. Cross their lane at right angles, together, and never in front of one: a ferry cannot stop for you.', sourceIds: ['colregs', 'wsf'] },
      { id: 'bailout', title: 'Bail-outs', text: 'If the wind comes up early: the Friday Harbor Labs shore, then the lee of Yellow Island. Both are landings you can make in a hurry.', sourceIds: ['uscg'] },
      { id: 'file', title: 'File it', text: 'A float plan is only a plan if someone ashore has it: where you are going, when you expect to land, what the boat looks like, and when to call for help if they have not heard from you.', sourceIds: ['uscg', 'cgaux-paddlers'] },
    ],
    landing: { title: 'The north cove', text: 'Jones Island. Nose the boat onto the gravel, step out into the shallows and carry it up above the wrack line.', sourceIds: ['wa-parks-jones', 'wwta'] },
    camp: {
      place: 'jones', name: 'Jones Island',
      steps: [
        { id: 'land', title: 'Land above the tide', text: 'Carry the boat up past the wrack line of drift logs and seaweed, and tie it off. Tonight’s high water is higher than this afternoon’s.', sourceIds: ['noaa-tides', 'lnt'] },
        { id: 'pitch', title: 'Pitch on the pad', text: 'Jones is a marine state park with paddle-in sites on the Cascadia Marine Trail. Use the tent pads and the trail, not the meadow, and leave the firewood on the beach.', sourceIds: ['wa-parks-jones', 'wwta', 'lnt'] },
        { id: 'food', title: 'The raccoons', text: 'Island raccoons open zips and untie knots. Everything that smells goes in the hard box or a hung bag, never in the tent and never in the boat.', sourceIds: ['wa-parks-jones'] },
        { id: 'dry', title: 'Dry out, warm up', text: 'Out of the drysuit, into dry layers, hot drink before the sun goes. The water is nine degrees and the evening air not much more; the cold catches up with you sitting still.', sourceIds: ['coldwater'] },
        { id: 'night', title: 'Night in the cove', text: 'The harbour seals haul out on the point; the Milky Way comes up over Spieden. Tomorrow’s float plan is written tonight, while the tide table is in your head.', sourceIds: ['lnt'] },
      ],
    },
  },
  {
    id: 'leg2',
    from: 'jones', to: 'posey',
    title: 'Jones Island to Posey Island',
    steps: [
      { id: 'route', title: 'The route', text: 'Out of the north cove and west across the top of San Juan Channel, then through Spieden Channel with Spieden Island’s long grass face to starboard and San Juan Island to port. Round Davison Head into the lee of Posey Island, a one-acre park at the mouth of Roche Harbor. About ten kilometres.', sourceIds: ['noaa-chart', 'wa-parks-posey', 'worldcover'] },
      { id: 'tide', title: 'Tide and current', text: 'Spieden Channel runs harder than San Juan Channel: the flood sets west through it toward Haro Strait and the ebb east, and off the points it boils. Time the channel for the last of the flood, or for slack, and paddle it in one push — there is nowhere to stop along Spieden.', sourceIds: ['noaa-tides', 'noaa-chart'] },
      { id: 'traffic', title: 'Traffic', text: 'Roche Harbor is a port of entry with seaplanes and yachts coming and going, and whale-watching boats run Spieden Channel to Haro Strait. Hold your line, stay together, and let the big boats see a group, not a scatter.', sourceIds: ['colregs', 'bewhalewise'] },
      { id: 'bailout', title: 'Bail-outs', text: 'Spieden Island is private and has no landing. If the channel is more than you want: turn back east for Jones before you are in it, or carry on to the lee of Davison Head and the shore of San Juan Island.', sourceIds: ['uscg', 'noaa-chart'] },
      { id: 'file', title: 'File it', text: 'Update the plan ashore: a new destination, a new landing time. Posey has no water, so the plan says how much you carry and where you will fill up — Roche Harbor, across the channel.', sourceIds: ['uscg', 'wa-parks-posey'] },
    ],
    landing: { title: 'Posey Island', text: 'An acre of rock and madrone with a gravel beach on its sheltered side. Nose in, step out, and lift the boat clear of the tide; there is no room here to leave it on the water line.', sourceIds: ['wa-parks-posey', 'wwta'] },
    camp: {
      place: 'posey', name: 'Posey Island',
      steps: [
        { id: 'land', title: 'An island to yourselves', text: 'Posey is a one-acre marine state park reached only by small boat, with a pair of primitive campsites on the Cascadia Marine Trail. Share it: the next boat in has nowhere else to go.', sourceIds: ['wa-parks-posey', 'wwta'] },
        { id: 'water', title: 'Water you carried', text: 'There is no drinking water on Posey. What you drink tonight and paddle on tomorrow came in the boat; Roche Harbor, across the channel, is where you fill up.', sourceIds: ['wa-parks-posey'] },
        { id: 'toilet', title: 'Leave it as found', text: 'A composting toilet, a fire ring, and nothing else. Pack out everything, keep off the madrones, and let the island’s one acre take the next party as it took you.', sourceIds: ['wa-parks-posey', 'lnt'] },
        { id: 'dry', title: 'Dry out, warm up', text: 'Dry layers before the wind finds you: Posey is open to the west, and the evening breeze comes down Haro Strait off the cold water. Hot drink, then the sun.', sourceIds: ['coldwater'] },
        { id: 'night', title: 'Night at the mouth of the harbour', text: 'The sun goes down over Vancouver Island across Haro Strait; the lights of Roche Harbor come on behind you. Listen for the blow of a porpoise, or something larger, in the channel.', sourceIds: ['lnt', 'bewhalewise'] },
      ],
    },
  },
];

// The first leg, as the Phaser scenes and tests knew it.
export const FLOAT_PLAN = LEGS[0];
export const CAMP = LEGS[0].camp;
