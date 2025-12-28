import { ArrowRight, Gamepad2, Music, PartyPopper, Sparkles, Users } from 'lucide-react';

type CategoryKey = 'sports' | 'events' | 'parties' | 'gaming';

interface CategorySelectorProps {
  onNavigate?: (page: string) => void;
  onCategorySelect: (category: CategoryKey) => void;
  userName?: string;
}

const categories: Array<{
  key: CategoryKey;
  title: string;
  blurb: string;
  icon: typeof Users;
  image: string;
  bullets: string[];
}> = [
  {
    key: 'sports',
    title: 'Sports & Turf',
    blurb: 'Book reliable turfs, lock teams quickly, and play with people you trust.',
    icon: Users,
    image: 'https://picsum.photos/seed/avento-sports/1200/675',
    bullets: ['Instant turf slots', 'Trust and streak scores', 'Nearby matches'],
  },
  {
    key: 'events',
    title: 'Cultural Events',
    blurb: 'Concerts, festivals, and art nights curated for safe, welcoming meetups.',
    icon: Music,
    image: 'https://picsum.photos/seed/avento-events/1200/675',
    bullets: ['Group RSVPs', 'Verified hosts', 'Plan with friends'],
  },
  {
    key: 'parties',
    title: 'Parties & Celebrations',
    blurb: 'Plan nights out, invite friends, and discover hosted experiences.',
    icon: PartyPopper,
    image: 'https://picsum.photos/seed/avento-parties/1200/675',
    bullets: ['Host or join', 'Flexible payments', 'Invite-only or open'],
  },
  {
    key: 'gaming',
    title: 'Gaming Hub',
    blurb: 'LAN, console, and PC sessions with brackets, squads, and social play.',
    icon: Gamepad2,
    image: 'https://picsum.photos/seed/avento-gaming/1200/675',
    bullets: ['Team matchmaking', 'Bracket support', 'Clubs and lounges'],
  },
];

export function CategorySelector({ onNavigate, onCategorySelect, userName = 'Friend' }: CategorySelectorProps) {
  const handleSelect = (category: CategoryKey) => {
    onCategorySelect(category);
    if (onNavigate) onNavigate(category);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <header className="flex flex-col items-center gap-3 text-center mb-10">
          <div className="flex items-center gap-3 px-4 py-2 rounded-full bg-white/5 border border-white/10">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-cyan-500 via-amber-400 to-pink-500 flex items-center justify-center shadow-lg shadow-cyan-500/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="text-sm text-white/80">Avento · Pick a lane, we kept it even.</div>
          </div>
          <div className="text-3xl md:text-4xl font-bold tracking-tight">Hey {userName}, choose how you want to vibe</div>
          <p className="text-white/70 max-w-2xl">Four tiles. Same size. Same layout. No surprises.</p>
        </header>

        <div className="grid md:grid-cols-2 gap-6 items-stretch">
          {categories.map(({ key, title, blurb, icon: Icon, image, bullets }) => (
            <button
              key={key}
              onClick={() => handleSelect(key)}
              className="group flex h-full w-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/5 text-left transition-transform duration-200 hover:-translate-y-1 hover:border-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
            >
              <div className="relative h-52 w-full bg-slate-800">
                <div
                  className="absolute inset-0 bg-cover bg-center transition-transform duration-300 group-hover:scale-105"
                  style={{ backgroundImage: `linear-gradient(0deg, rgba(0,0,0,0.35), rgba(0,0,0,0.35)), url(${image})` }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/20 to-transparent" />
                <div className="absolute bottom-4 left-4 flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center backdrop-blur-sm">
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="text-lg font-semibold drop-shadow">{title}</div>
                </div>
              </div>

              <div className="flex flex-1 flex-col gap-4 p-6">
                <p className="text-white/75 leading-relaxed">{blurb}</p>
                <div className="grid grid-cols-2 gap-2 text-sm text-white/85">
                  {bullets.map((item, idx) => (
                    <div key={idx} className="rounded-lg border border-white/10 bg-white/5 px-3 py-2">
                      {item}
                    </div>
                  ))}
                </div>
                <div className="mt-auto flex items-center justify-between pt-1 text-sm text-white/85">
                  <span>Open</span>
                  <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}