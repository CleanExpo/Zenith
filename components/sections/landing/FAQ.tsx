'use client';

export function FAQ() {
  return (
    <section className="py-20 bg-slate-50 dark:bg-slate-900">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-pink-500 to-orange-500">
              Frequently Asked Questions
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Find answers to common questions about our research platform.
          </p>
        </div>

        <div className="max-w-3xl mx-auto space-y-6">
          <div className="p-6 border rounded-lg shadow-sm bg-background">
            <h3 className="text-xl font-semibold mb-2">How secure is my research data?</h3>
            <p className="text-muted-foreground">Your data is protected with enterprise-grade encryption both in transit and at rest. We implement strict access controls and regular security audits to ensure your research remains private and secure.</p>
          </div>
          
          <div className="p-6 border rounded-lg shadow-sm bg-background">
            <h3 className="text-xl font-semibold mb-2">Can I collaborate with researchers from other institutions?</h3>
            <p className="text-muted-foreground">Yes! Our platform is designed for cross-institutional collaboration. You can invite external collaborators with customizable permission levels to ensure appropriate access to your research projects.</p>
          </div>
          
          <div className="p-6 border rounded-lg shadow-sm bg-background">
            <h3 className="text-xl font-semibold mb-2">What file formats are supported for data import?</h3>
            <p className="text-muted-foreground">We support a wide range of scientific and research file formats, including CSV, JSON, Excel, SPSS, MATLAB, R data files, and many domain-specific formats. Our AI can also extract data from PDFs and other document types.</p>
          </div>
          
          <div className="p-6 border rounded-lg shadow-sm bg-background">
            <h3 className="text-xl font-semibold mb-2">Is there a free tier available?</h3>
            <p className="text-muted-foreground">Yes, we offer a free tier for individual researchers and small projects. For larger teams and advanced features, we provide flexible subscription plans that scale with your needs.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
