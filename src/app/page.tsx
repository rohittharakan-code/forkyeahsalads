import Link from "next/link";

const categories = [
  { label: "Classic", emoji: "🥬", from: "from-emerald-400", to: "to-green-600" },
  { label: "Grain", emoji: "🌾", from: "from-orange-300", to: "to-amber-500" },
  { label: "Protein", emoji: "🍗", from: "from-pink-300", to: "to-rose-500" },
  { label: "Vegan", emoji: "🥑", from: "from-teal-300", to: "to-emerald-500" },
];

const favorites = [
  {
    title: "The OG Caesar",
    description: "Romaine, parm, croutons, classic dressing",
    price: "₹12.50",
  },
  {
    title: "Mediterranean Bowl",
    description: "Falafel, hummus, pickled onion, tahini",
    price: "₹14.00",
  },
  {
    title: "Thai Crunch",
    description: "Cabbage, peanut, mango, chili-lime drizzle",
    price: "₹13.50",
  },
];

export default function Home() {
  return (
    <div className="flex flex-col bg-cream min-h-screen">
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-primary to-forest overflow-hidden px-6 py-16 sm:py-24">
        {/* Decorative circles */}
        <div className="absolute top-[-40px] right-[-40px] w-[200px] h-[200px] rounded-full bg-sage/12" />
        <div className="absolute bottom-[-60px] left-[-30px] w-[160px] h-[160px] rounded-full bg-sage/8" />

        <div className="relative mx-auto max-w-lg text-center space-y-5">
          <p className="text-sage uppercase tracking-[2px] text-[11px] font-medium">
            Good stuff, no drama
          </p>
          <h1 className="font-display text-3xl font-bold text-cream leading-tight">
            Fresh salads,
            <br />
            delivered fast.
          </h1>
          <div className="flex items-center justify-center gap-3 pt-2">
            <Link
              href="/menu"
              className="bg-terracotta text-white font-semibold px-6 py-2.5 rounded-full text-sm hover:opacity-90 transition-opacity"
            >
              Order Now
            </Link>
            <Link
              href="/menu"
              className="bg-white/12 border border-white/15 text-cream font-medium px-6 py-2.5 rounded-full text-sm hover:bg-white/20 transition-colors"
            >
              See Menu
            </Link>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="px-5 pt-8 pb-4">
        <h2 className="font-display text-lg font-bold text-forest mb-4">Browse by mood</h2>
        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
          {categories.map((cat) => (
            <div key={cat.label} className="flex flex-col items-center gap-1.5 flex-shrink-0">
              <div
                className={`w-16 h-16 rounded-[20px] bg-gradient-to-br ${cat.from} ${cat.to} flex items-center justify-center text-2xl`}
              >
                {cat.emoji}
              </div>
              <span className="text-[11px] font-medium text-muted">{cat.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Fan Favorites */}
      <section className="px-5 pt-4 pb-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-lg font-bold text-forest">Fan favorites</h2>
          <Link href="/menu" className="text-primary text-sm font-medium hover:underline">
            See all &rarr;
          </Link>
        </div>

        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
          {favorites.map((item) => (
            <div
              key={item.title}
              className="flex-shrink-0 w-[220px] border border-black/6 rounded-[14px] bg-white p-3"
            >
              {/* Placeholder image */}
              <div className="w-[72px] h-[72px] rounded-xl bg-sage/20 mb-3 overflow-hidden">
                <svg width="72" height="72" viewBox="0 0 72 72" className="text-sage/30">
                  <defs>
                    <pattern id={`stripes-${item.title.replace(/\s+/g, "")}`} width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                      <line x1="0" y1="0" x2="0" y2="6" stroke="currentColor" strokeWidth="2" />
                    </pattern>
                  </defs>
                  <rect width="72" height="72" fill={`url(#stripes-${item.title.replace(/\s+/g, "")})`} />
                </svg>
              </div>

              <h3 className="font-display font-semibold text-forest text-sm leading-tight">
                {item.title}
              </h3>
              <p className="text-muted text-[11px] mt-0.5 leading-snug line-clamp-2">
                {item.description}
              </p>

              <div className="flex items-center justify-between mt-3">
                <span className="text-primary font-display font-bold text-sm">
                  {item.price}
                </span>
                <button className="w-7 h-7 rounded-full bg-primary flex items-center justify-center hover:opacity-90 transition-opacity">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
