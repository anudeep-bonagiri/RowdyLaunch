// Single source of truth for event facts. Everything here comes from the MLH
// event page unless marked DRAFT or TODO. Edit this file, not the components.

export const event = {
  name: "Hacktoberfest Hack Day San Antonio",
  host: "RowdyLaunch",
  siteUrl: "https://rowdylaunch.vercel.app/",
  // 10:00 AM CDT on Oct 31 2026. Used for the T-minus clock.
  startISO: "2026-10-31T10:00:00-05:00",
  endISO: "2026-10-31T17:00:00-05:00",
  dateLabel: "Sat, Oct 31, 2026",
  timeLabel: "10:00 AM to 5:00 PM CDT",
  venue: "UTSA Business Building",
  address: "5 Paseo Del Norte, San Antonio, TX 78249",
  mapsUrl:
    "https://www.google.com/maps/search/?api=1&query=UTSA+Business+Building+5+Paseo+Del+Norte+San+Antonio+TX+78249",
  registerUrl: "/register",
  mlhEventUrl:
    "https://events.mlh.com/events/15160-hacktoberfest-hack-day-san-antonio-x-rowdylaunch",
  codeOfConductUrl: "https://github.com/MLH/mlh-policies/blob/main/code-of-conduct.md",
  incidentsEmail: "incidents@mlh.io",
  incidentsPhone: "+1 409 202 6060",
  hacktoberfestUrl: "https://hacktoberfest.com/",
  repoUrl: "https://github.com/anudeep-bonagiri/RowdyLaunch",
  // Where the main button points once the event is over.
  postEventUrl: "https://github.com/anudeep-bonagiri/RowdyLaunch",
  // TODO: leave empty to hide the sponsor contact button until the crew picks an inbox.
  contactEmail: "",
  hostBlurb: "RowdyLaunch is UTSA's student-run startup organization. We help students find cofounders and get their first projects in front of investors.",
};

// TODO: add a `line` per person (year and major, or a GitHub handle) when ready.
export const crew: { name: string; role: string; line?: string; url?: string }[] = [
  { name: "Anudeep Bonagiri", role: "Organizer" },
  { name: "Sudeep Thatiparthi", role: "Organizer" },
  { name: "Sujeeth Reddy Thatiparthi", role: "Organizer" },
  { name: "Shrithik Senthilkumar", role: "Organizer" },
  { name: "Takshi Savaliya", role: "Organizer" },
];

// Sponsors appear in the Supplies section once this list has an entry.
// logo: path under public/, e.g. "/sponsors/acme.svg"
export const sponsors: { name: string; logo: string; tier: "Title" | "Gold" | "Silver" | "Partner"; url?: string }[] = [];

// DRAFT. The MLH page only lists the 10 to 5 window. Flip `draft` to false
// once the crew confirms the agenda.
export const flightPlan = {
  draft: true,
  stops: [
    { t: "10:00", label: "Doors open and check-in", detail: "Find a seat, get on the Wi-Fi and sign in to GitHub." },
    { t: "10:30", label: "Briefing", detail: "How Hacktoberfest counts a contribution, how to find an issue you can finish today, and what maintainers look for in a pull request." },
    { t: "11:00", label: "Hacking starts", detail: "Work alone or with a partner. Organizers walk the tables all day." },
    { t: "13:00", label: "Break", detail: "Take an hour away from the screen." },
    { t: "16:00", label: "Review and demos", detail: "Show what you shipped and get a review before you open the pull request." },
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
      {
        q: "How many pull requests count for Hacktoberfest?",
        a: `Hacktoberfest sets the count and the registration window each year, and maintainers accept pull requests on their own schedule, often days after you open them. Check this year's rules at ${event.hacktoberfestUrl}. The day is built to get your first one or two opened.`,
      },
    ],
  },
  {
    tab: "Registration",
    items: [
      {
        q: "Who can attend?",
        a: "University students and working professionals. Register on this site with an email and password. It takes about a minute.",
      },
      {
        q: "Can I register on the day?",
        a: "Register ahead so we know how many seats and lunches to set up. If you turn up unregistered, find an organizer at the door and we will sort it out.",
      },
      {
        q: "Is there a liability release?",
        a: "Yes. By registering you release the organizers, the venue (UTSA) and event sponsors from liability for personal injury or property damage during the event. The full terms and conditions are listed on the registration form on this site, and you accept them there.",
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
        q: "Will there be photos?",
        a: "Yes. We take photos during the day and share them with MLH and Hacktoberfest. Tell an organizer at check-in if you would rather not be in them.",
      },
      {
        q: "What is the code of conduct?",
        a: `The MLH Code of Conduct applies to everyone at the event. To report an incident, find any organizer, or contact MLH directly at ${event.incidentsEmail} or ${event.incidentsPhone}.`,
      },
    ],
  },
];

// Shown as a chart on the registration form. Each row is a commitment the
// crew has actually made (professor emails, RowdyLink submission, FAQ), in
// plain words. Add a row when a new promise is made; do not pad it.
export const terms = [
  { t: "Liability release", d: "You release RowdyLaunch, the organizers, UTSA as the venue and the event sponsors from liability for personal injury or property damage during the event." },
  { t: "Code of conduct", d: "The MLH Code of Conduct applies to everyone at the event. Organizers can ask anyone who breaks it to leave." },
  { t: "Campus rules", d: "This is a registered student-organization event on the UTSA Main Campus. UTSA student conduct and Business Building rules apply. UTSA is the venue, not a sponsor." },
  { t: "Check-in", d: "Attendance counts only with an in-person check-in at the door. Pull requests are verified by GitHub handle." },
  { t: "Extra credit", d: "If you list a class, we send your name, check-in and pull request status to that professor after the event. Whether credit is given is up to the professor." },
  { t: "Photos and video", d: "We take photos and video during the day and share them with MLH, Hacktoberfest and RowdyLaunch channels. Tell an organizer at check-in if you would rather not appear." },
  { t: "Food", d: "Lunch and snacks are free. Dietary restrictions you list are used for the food order only and are not a guarantee of a specific meal." },
  { t: "Prizes and swag", d: "Hacktoberfest prizes and swag are limited and go while supplies last. Hacktoberfest's digital rewards follow Hacktoberfest's own rules." },
  { t: "Your belongings", d: "Bring your own laptop and charger. You are responsible for your things. Outlets are shared." },
  { t: "Your data", d: "Only the organizers see your registration. Your phone number is for day-of contact. Registrations are deleted after the event." },
];
