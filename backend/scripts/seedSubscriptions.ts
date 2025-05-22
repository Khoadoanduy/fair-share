import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// Replace with your Logo.dev publishable key
const LOGO_API_TOKEN = 'pk_AuJ6Y_W1RVWxy1m-lzX_nA';

// List of popular subscription services
// Format: [name, domain, category]
const subscriptionsList: [string, string, string][] = [
  // Streaming Services
  ["Netflix", "netflix.com", "Streaming"],
  ["Disney+", "disneyplus.com", "Streaming"],
  ["Hulu", "hulu.com", "Streaming"],
  ["HBO Max", "hbomax.com", "Streaming"],
  ["Amazon Prime Video", "primevideo.com", "Streaming"],
  ["Apple TV+", "tv.apple.com", "Streaming"],
  ["Paramount+", "paramountplus.com", "Streaming"],
  ["Peacock", "peacocktv.com", "Streaming"],
  ["Discovery+", "discoveryplus.com", "Streaming"],
  ["Crunchyroll", "crunchyroll.com", "Streaming"],
  ["Funimation", "funimation.com", "Streaming"],
  ["Shudder", "shudder.com", "Streaming"],
  ["BritBox", "britbox.com", "Streaming"],
  ["AMC+", "amcplus.com", "Streaming"],
  
  // Music Services
  ["Spotify", "spotify.com", "Music"],
  ["Apple Music", "music.apple.com", "Music"],
  ["Amazon Music", "music.amazon.com", "Music"],
  ["YouTube Music", "music.youtube.com", "Music"],
  ["Tidal", "tidal.com", "Music"],
  ["Deezer", "deezer.com", "Music"],
  ["Pandora", "pandora.com", "Music"],
  ["SoundCloud", "soundcloud.com", "Music"],
  ["iHeartRadio", "iheart.com", "Music"],
  ["Idagio", "idagio.com", "Music"],
  ["Boomplay", "boomplay.com", "Music"],
  ["Audiomack", "audiomack.com", "Music"],
  
  // Gaming Services
  ["Xbox Game Pass", "xbox.com", "Gaming"],
  ["PlayStation Plus", "playstation.com", "Gaming"],
  ["Nintendo Switch Online", "nintendo.com", "Gaming"],
  ["EA Play", "ea.com", "Gaming"],
  ["Ubisoft+", "ubisoft.com", "Gaming"],
  ["Epic Games Store", "epicgames.com", "Gaming"],
  ["Steam", "steampowered.com", "Gaming"],
  ["GeForce Now", "nvidia.com/geforce-now", "Gaming"],
  ["Apple Arcade", "apple.com/apple-arcade", "Gaming"],
  ["Google Play Pass", "play.google.com/pass", "Gaming"],
  ["Amazon Luna", "amazon.com/luna", "Gaming"],
  ["Humble Bundle", "humblebundle.com", "Gaming"],
  
  // Productivity & Cloud Services
  ["Microsoft 365", "microsoft365.com", "Productivity"],
  ["Google Workspace", "workspace.google.com", "Productivity"],
  ["Adobe Creative Cloud", "adobe.com", "Productivity"],
  ["Dropbox", "dropbox.com", "Cloud Storage"],
  ["Google Drive", "drive.google.com", "Cloud Storage"],
  ["iCloud", "icloud.com", "Cloud Storage"],
  ["OneDrive", "onedrive.live.com", "Cloud Storage"],
  ["Box", "box.com", "Cloud Storage"],
  ["pCloud", "pcloud.com", "Cloud Storage"],
  ["Sync.com", "sync.com", "Cloud Storage"],
  ["Notion", "notion.so", "Productivity"],
  ["Evernote", "evernote.com", "Productivity"],
  ["Trello", "trello.com", "Productivity"],
  ["Slack", "slack.com", "Productivity"],
  
  // News & Media
  ["The New York Times", "nytimes.com", "News"],
  ["The Wall Street Journal", "wsj.com", "News"],
  ["The Washington Post", "washingtonpost.com", "News"],
  ["The Athletic", "theathletic.com", "Sports News"],
  ["Medium", "medium.com", "Content"],
  ["Substack", "substack.com", "Newsletters"],
  ["Bloomberg", "bloomberg.com", "News"],
  ["The Economist", "economist.com", "News"],
  ["Financial Times", "ft.com", "News"],
  ["The New Yorker", "newyorker.com", "News"],
  
  // Fitness & Wellness
  ["Peloton", "onepeloton.com", "Fitness"],
  ["Fitbit Premium", "fitbit.com", "Fitness"],
  ["Headspace", "headspace.com", "Wellness"],
  ["Calm", "calm.com", "Wellness"],
  ["MyFitnessPal", "myfitnesspal.com", "Fitness"],
  ["Noom", "noom.com", "Wellness"],
  ["Strava", "strava.com", "Fitness"],
  ["Flo", "flo.health", "Wellness"],
  ["Centr", "centr.com", "Fitness"],
  ["Aaptiv", "aaptiv.com", "Fitness"],
  ["Glo", "glo.com", "Wellness"],
  
  // Food & Meal Delivery
  ["HelloFresh", "hellofresh.com", "Meal Kit"],
  ["Blue Apron", "blueapron.com", "Meal Kit"],
  ["Home Chef", "homechef.com", "Meal Kit"],
  ["Instacart", "instacart.com", "Grocery Delivery"],
  ["DoorDash", "doordash.com", "Food Delivery"],
  ["Uber Eats", "ubereats.com", "Food Delivery"],
  ["GrubHub", "grubhub.com", "Food Delivery"],
  ["Postmates", "postmates.com", "Food Delivery"],
  ["Freshly", "freshly.com", "Meal Kit"],
  ["EveryPlate", "everyplate.com", "Meal Kit"],
  ["Dinnerly", "dinnerly.com", "Meal Kit"],
  
  // E-Commerce
  ["Amazon Prime", "amazon.com", "Shopping"],
  ["Walmart+", "walmart.com", "Shopping"],
  ["Costco Membership", "costco.com", "Shopping"],
  ["Shipt", "shipt.com", "Grocery"],
  ["Chewy", "chewy.com", "Pet Supplies"],
  ["FabFitFun", "fabfitfun.com", "Lifestyle"],
  ["StitchFix", "stitchfix.com", "Fashion"],
  ["Ipsy", "ipsy.com", "Beauty"],
  ["Birchbox", "birchbox.com", "Beauty"],
  ["BoxyCharm", "boxycharm.com", "Beauty"],
  
  // VPN Services
  ["NordVPN", "nordvpn.com", "VPN"],
  ["ExpressVPN", "expressvpn.com", "VPN"],
  ["Surfshark", "surfshark.com", "VPN"],
  ["CyberGhost", "cyberghost.com", "VPN"],
  ["ProtonVPN", "protonvpn.com", "VPN"],
  ["Private Internet Access", "privateinternetaccess.com", "VPN"],
  
  // Dating Services
  ["Tinder Gold", "tinder.com", "Dating"],
  ["Bumble Premium", "bumble.com", "Dating"],
  ["Hinge Premium", "hinge.co", "Dating"],
  ["Match", "match.com", "Dating"],
  ["eHarmony", "eharmony.com", "Dating"],
  ["OkCupid", "okcupid.com", "Dating"]
];

interface SubscriptionData {
  name: string;
  logo: string;
  category: string;
  domain: string;
}

async function seedSubscriptions() {
  try {
    console.log("Starting to seed subscriptions...");
    
    // Clear existing subscription data
    await prisma.subscription.deleteMany();
    console.log("Cleared existing subscription data");
    
    // Process each subscription
    const subscriptionsToCreate: SubscriptionData[] = subscriptionsList.map(([name, domain, category]) => {
      return {
        name,
        logo: `https://img.logo.dev/${domain}?token=${LOGO_API_TOKEN}`,
        category,
        domain
      };
    });

    // Insert all subscriptions at once
    const result = await prisma.subscription.createMany({
      data: subscriptionsToCreate
    });
    
    console.log(`Successfully seeded ${result.count} subscriptions!`);
  } catch (error) {
    console.error("Error seeding subscriptions:", error);
  } finally {
    await prisma.$disconnect();
  }
}

seedSubscriptions();