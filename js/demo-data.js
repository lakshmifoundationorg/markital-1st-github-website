/*
  demo-data.js - example tasks shown the first time the app opens
  (and when you press "Reset demo data").

  ALL NAMES HERE ARE FICTIONAL. They are not real clients.

  Due dates are calculated from TODAY (e.g. "3 days from now") so the demo
  always shows a realistic mix of upcoming and overdue tasks.
*/

function createDemoTasks() {
  const d = Utils.daysFromToday;

  // Each line: [client, project, title, description, priority, due date, status]
  const rows = [
    ['Sunrise Bakery Co.', 'Website Redesign', 'Finalise homepage wireframe',
      'Agree layout for hero banner, menu highlights and order button.', 'High', d(2), 'In Progress'],
    ['Sunrise Bakery Co.', 'Website Redesign', 'Collect product photos',
      'Get 20 high-quality photos of breads and cakes from the client.', 'Medium', d(-2), 'To Do'],
    ['Sunrise Bakery Co.', 'Website Redesign', 'Set up domain and hosting',
      'Point the domain to hosting and install SSL certificate.', 'Low', d(-6), 'Done'],

    ['GreenLeaf Organics', 'Instagram Growth Campaign', 'Plan 30-day content calendar',
      'Mix of reels, carousels and stories around organic recipes.', 'High', d(1), 'In Progress'],
    ['GreenLeaf Organics', 'Instagram Growth Campaign', 'Design 6 carousel posts',
      'Use brand colours; focus on "farm to table" story.', 'Medium', d(5), 'To Do'],
    ['GreenLeaf Organics', 'Influencer Outreach', 'Shortlist 15 micro-influencers',
      'Food and wellness creators with 10k–50k followers.', 'Medium', d(9), 'To Do'],

    ['UrbanFit Studio', 'Google Ads Launch', 'Keyword research',
      'Find local keywords for gym membership and personal training.', 'High', d(-1), 'In Progress'],
    ['UrbanFit Studio', 'Google Ads Launch', 'Write ad copy (3 variations)',
      'Highlight the free first-week trial offer.', 'Medium', d(4), 'To Do'],
    ['UrbanFit Studio', 'Brand Identity Refresh', 'Present logo concepts',
      'Three logo directions with colour palette options.', 'High', d(-10), 'Done'],

    ['BlueWave Travels', 'SEO Audit', 'Run technical SEO audit',
      'Check page speed, broken links and mobile issues.', 'High', d(3), 'To Do'],
    ['BlueWave Travels', 'SEO Audit', 'Competitor backlink review',
      'Compare backlinks with top 3 competitors.', 'Low', d(12), 'To Do'],
    ['BlueWave Travels', 'Email Newsletter', 'Send monthly newsletter',
      'Feature winter holiday packages.', 'Medium', d(-4), 'Done'],

    ['Nova Dental Care', 'Local SEO Setup', 'Optimise Google Business Profile',
      'Add services, opening hours, photos and ask for reviews.', 'Medium', d(6), 'In Progress'],
    ['Nova Dental Care', 'Local SEO Setup', 'Create location landing page',
      'One page per clinic location with map and contact form.', 'Low', d(15), 'To Do']
  ];

  const now = new Date().toISOString();

  // Turn each row into a task "object" with named fields.
  return rows.map(([clientName, projectName, title, description, priority, dueDate, status]) => ({
    id: Utils.createId(),
    clientName,
    projectName,
    title,
    description,
    priority,
    dueDate,
    status,
    createdAt: now,
    updatedAt: now
  }));
}
