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
    { t: "10:00", label: "Doors open and check-in", detail: "Find a seat, get on the Wi-Fi and sign in to GitHub." },
    { t: "10:30", label: "Briefing", detail: "How Hacktoberfest counts a contribution, how to find an issue you can finish today, and what maintainers look for in a pull request." },
    { t: "11:00", label: "Hacking starts", detail: "Work alone or with a partner. Organizers walk the tables all day." },
    { t: "13:00", label: "Break", detail: "Take an hour away from the screen." },
    { t: "16:00", label: "Review and demos", detail: "Show what you shipped and get a review before you submit." },
    { t: "16:45", label: "Wrap-up", detail: "Group photo and GitHub handles. Tag #Hacktoberfest if you post." },
    { t: "17:00", label: "Doors close", detail: "" },
  ],
};

export const faq: { tab: string; items: { q: string; a: string }[] }[] = [
  {
    tab: "General",
    items: [
      {
        q: "What is a Hacktoberfest hack day?",
        a: "A one-day meetup where you work on open-source pull requests in a room with other people doing the same. Hacktoberfest runs all of October. This is the in-person day for it in San Antonio.",
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
        a: "Register ahead on MLH so we know how many seats to set up. If you turn up unregistered, find an organizer at the door and we will sort it out.",
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
        a: `${event.venue}, ${event.address}. There will be RowdyLaunch signs from the entrance to the room.`,
      },
      {
        q: "What is the code of conduct?",
        a: "The MLH Code of Conduct applies to everyone at the event. Linked in the footer.",
      },
    ],
  },
];
