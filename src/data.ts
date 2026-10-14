// Single source of truth for event facts. Everything here comes from the MLH
// event page unless marked DRAFT. Edit this file, not the components.

export const event = {
  name: "Hacktoberfest Hack Day San Antonio",
  host: "RowdyLaunch",
  // 10:00 AM CDT on Oct 31 2026. Used for the T-minus clock.
  startISO: "2026-10-31T10:00:00-05:00",
  endISO: "2026-10-31T17:00:00-05:00",
  dateLabel: "Sat, Oct 31, 2026",
  timeLabel: "10:00 AM to 5:00 PM CDT",
  venue: "UTSA Business Building",
  address: "5 Paseo Del Norte, San Antonio, TX 78249",
  mapsUrl:
    "https://www.google.com/maps/search/?api=1&query=UTSA+Business+Building+5+Paseo+Del+Norte+San+Antonio+TX+78249",
  registerUrl:
    "https://events.mlh.com/events/15160-hacktoberfest-hack-day-san-antonio-x-rowdylaunch",
  mlhEventUrl:
    "https://events.mlh.com/events/15160-hacktoberfest-hack-day-san-antonio-x-rowdylaunch",
  codeOfConductUrl: "https://static.mlh.io/docs/mlh-code-of-conduct.pdf",
  repoUrl: "https://github.com/Rebootroma/RowdyLaunch",
  // Leave empty to hide the sponsor contact button until the crew picks an inbox.
  contactEmail: "",
  hostBlurb:
    "First startup organization in San Antonio. We help students find their cofounder and eventually pitch to VCs with projects that stand out.",
};

export const crew = [
  { name: "Anudeep Bonagiri", role: "Organizer" },
  { name: "Sudeep Thatiparthi", role: "Organizer" },
  { name: "Sujeeth Reddy Thatiparthi", role: "Organizer" },
  { name: "Shrithik Senthilkumar", role: "Organizer" },
  { name: "Takshi Savaliya", role: "Organizer" },
];

// DRAFT. The MLH page only lists the 10 to 5 window. Flip `draft` to false
// once the crew confirms the agenda.
export const flightPlan = {
  draft: true,
  stops: [
    { t: "10:00", label: "Doors open, check in", detail: "Grab a seat, connect to Wi-Fi, sign in to GitHub." },
    { t: "10:30", label: "Mission briefing", detail: "How Hacktoberfest works, how to pick an issue, how a pull request gets accepted." },
    { t: "11:00", label: "Hacking begins", detail: "Pair up or fly solo. Organizers float between tables for help." },
    { t: "13:00", label: "Midday break", detail: "Step away from the screen. Come back with a second issue in mind." },
    { t: "16:00", label: "PR review and demos", detail: "Show what you shipped. Get a second pair of eyes before you submit." },
    { t: "16:45", label: "Wrap-up and photos", detail: "Group photo, tag #Hacktoberfest, trade GitHub handles." },
    { t: "17:00", label: "Doors close", detail: "" },
  ],
};

export const faq: { tab: string; items: { q: string; a: string }[] }[] = [
  {
    tab: "General",
    items: [
      {
        q: "What is a Hacktoberfest hack day?",
        a: "A one-day meetup where you work on open-source pull requests alongside other people doing the same. Hacktoberfest runs all of October; this is the San Antonio in-person day for it.",
      },
      {
        q: "Who is RowdyLaunch?",
        a: event.hostBlurb,
      },
      {
        q: "Do I need to be an experienced developer?",
        a: "No. The morning briefing walks through finding a beginner-friendly issue and opening your first pull request. If you have never used Git, come anyway and say so at check-in.",
      },
    ],
  },
  {
    tab: "Registration",
    items: [
      {
        q: "Who can attend?",
        a: "University students and working professionals. Registration is on the MLH event page and asks for your name and email.",
      },
      {
        q: "Is there a liability release?",
        a: "Yes. By registering you release the organizers, the venue (UTSA) and event sponsors from liability for personal injury or property damage during the event. The full text is on the MLH registration form.",
      },
      {
        q: "Can I register on the day?",
        a: "Register ahead on MLH so we can plan seating. If you show up without registering, check in with an organizer at the door.",
      },
    ],
  },
  {
    tab: "Logistics",
    items: [
      {
        q: "What should I bring?",
        a: "A laptop, a charger and a GitHub account. Having Git installed before you arrive saves you twenty minutes.",
      },
      {
        q: "Where exactly is it?",
        a: `${event.venue}, ${event.address}. Look for the RowdyLaunch signs once you are in the building.`,
      },
      {
        q: "What is the code of conduct?",
        a: "The MLH Code of Conduct applies to everyone at the event. Linked in the footer.",
      },
    ],
  },
];
