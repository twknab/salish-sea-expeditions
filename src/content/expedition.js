// The first leg of the expedition and the stations around it: the float plan before launch, and
// camp on Jones Island at the end of the day. Every sourceIds entry resolves in credits.js.

export const FLOAT_PLAN = {
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
};

export const CAMP = {
  place: 'jones',
  steps: [
    { id: 'land', title: 'Land above the tide', text: 'Carry the boat up past the wrack line of drift logs and seaweed, and tie it off. Tonight’s high water is higher than this afternoon’s.', sourceIds: ['noaa-tides', 'lnt'] },
    { id: 'pitch', title: 'Pitch on the pad', text: 'Jones is a marine state park with paddle-in sites on the Cascadia Marine Trail. Use the tent pads and the trail, not the meadow, and leave the firewood on the beach.', sourceIds: ['wa-parks-jones', 'wwta', 'lnt'] },
    { id: 'food', title: 'The raccoons', text: 'Island raccoons open zips and untie knots. Everything that smells goes in the hard box or a hung bag, never in the tent and never in the boat.', sourceIds: ['wa-parks-jones'] },
    { id: 'dry', title: 'Dry out, warm up', text: 'Out of the drysuit, into dry layers, hot drink before the sun goes. The water is nine degrees and the evening air not much more; the cold catches up with you sitting still.', sourceIds: ['coldwater'] },
    { id: 'night', title: 'Night in the cove', text: 'The harbour seals haul out on the point; the Milky Way comes up over Spieden. Tomorrow’s float plan is written tonight, while the tide table is in your head.', sourceIds: ['lnt'] },
  ],
};
