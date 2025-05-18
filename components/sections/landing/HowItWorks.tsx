'use client';

export function HowItWorks() {
  return (
    <section className="py-20 bg-slate-50 dark:bg-slate-900">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-teal-500">
              How It Works
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Our platform streamlines your research workflow in three simple steps.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-6 border rounded-lg shadow-sm bg-background text-center">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-300 mx-auto mb-4">1</div>
            <h3 className="text-xl font-semibold mb-3">Connect Your Data</h3>
            <p className="text-muted-foreground">Import your research data from various sources or create new projects from scratch.</p>
          </div>
          
          <div className="p-6 border rounded-lg shadow-sm bg-background text-center">
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center text-purple-600 dark:text-purple-300 mx-auto mb-4">2</div>
            <h3 className="text-xl font-semibold mb-3">Analyze & Collaborate</h3>
            <p className="text-muted-foreground">Use our AI-powered tools to analyze data and collaborate with your team in real-time.</p>
          </div>
          
          <div className="p-6 border rounded-lg shadow-sm bg-background text-center">
            <div className="w-12 h-12 bg-teal-100 dark:bg-teal-900 rounded-full flex items-center justify-center text-teal-600 dark:text-teal-300 mx-auto mb-4">3</div>
            <h3 className="text-xl font-semibold mb-3">Generate Insights</h3>
            <p className="text-muted-foreground">Transform your research into actionable insights and comprehensive reports.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
