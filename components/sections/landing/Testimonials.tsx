'use client';

export function Testimonials() {
  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-500">
              What Researchers Say
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Hear from researchers who have transformed their workflow with our platform.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div className="p-6 border rounded-lg shadow-sm bg-background">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full mr-4"></div>
              <div>
                <h4 className="font-semibold">Dr. Sarah Johnson</h4>
                <p className="text-sm text-muted-foreground">Neuroscience Researcher</p>
              </div>
            </div>
            <p className="text-muted-foreground">"This platform has revolutionized how we collaborate on complex research projects. The AI-powered analysis tools have saved us countless hours."</p>
          </div>
          
          <div className="p-6 border rounded-lg shadow-sm bg-background">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-full mr-4"></div>
              <div>
                <h4 className="font-semibold">Prof. Michael Chen</h4>
                <p className="text-sm text-muted-foreground">Quantum Physics Department</p>
              </div>
            </div>
            <p className="text-muted-foreground">"The visualization tools have transformed how we present complex quantum phenomena. Our papers are now much more accessible to the broader scientific community."</p>
          </div>
          
          <div className="p-6 border rounded-lg shadow-sm bg-background">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-teal-100 dark:bg-teal-900 rounded-full mr-4"></div>
              <div>
                <h4 className="font-semibold">Dr. Emily Rodriguez</h4>
                <p className="text-sm text-muted-foreground">Climate Research Institute</p>
              </div>
            </div>
            <p className="text-muted-foreground">"The data security features give us peace of mind when working with sensitive climate models. The collaboration tools have connected our global team seamlessly."</p>
          </div>
        </div>
      </div>
    </section>
  );
}
