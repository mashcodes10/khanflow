export default function PricingSection() {
  return (
    <section id="pricing" className="py-24 bg-primary/5">
      <div className="max-w-[90rem] mx-auto px-6 md:px-12 lg:px-20 text-center">
        <div className="max-w-3xl mx-auto space-y-6">
          <h2 className="text-4xl md:text-5xl font-serif font-semibold">
            The &ldquo;Chief of Staff&rdquo; you didn&apos;t think you could
            afford.
          </h2>
          <p className="text-lg text-muted">
            We sync your entire workspace—GitHub, Outlook, Notion, Slack—so that
            you never have to manually check five different apps to know what
            you&apos;re doing at 2:00 PM.
          </p>
          <div className="flex flex-wrap justify-center gap-12 mt-12">
            <div className="text-center">
              <p className="text-4xl font-serif font-bold text-primary mb-1">
                $0
              </p>
              <p className="text-xs font-mono uppercase tracking-widest">
                For Individuals
              </p>
            </div>
            <div className="text-center h-full w-[1px] bg-border hidden md:block" />
            <div className="text-center">
              <p className="text-4xl font-serif font-bold opacity-30 mb-1 line-through">
                $30
              </p>
              <p className="text-xs font-mono uppercase tracking-widest">
                Others Charge
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
