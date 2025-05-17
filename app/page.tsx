import { HowItWorks, Testimonials, FAQ, CTA } from "@/components/sections/landing";

export default function HomePage() {
  return (
    <main className="flex flex-col items-center justify-center">
      <div className="w-full py-20 bg-blue-600 text-white text-center">
        <h1 className="text-4xl font-bold mb-4">Zenith Research Platform</h1>
        <p className="text-xl max-w-2xl mx-auto">Accelerate your research with our powerful tools and collaboration features</p>
        <div className="mt-8">
          <a href="/auth/login" className="bg-white text-blue-600 px-6 py-3 rounded-md font-medium mr-4 hover:bg-gray-100">Sign In</a>
          <a href="/auth/signup" className="bg-transparent border border-white text-white px-6 py-3 rounded-md font-medium hover:bg-blue-700">Get Started</a>
        </div>
      </div>
      
      <div className="w-full py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Key Features</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-6 border rounded-lg shadow-sm">
              <h3 className="text-xl font-semibold mb-3">Collaborative Research</h3>
              <p className="text-gray-600">Work together with your team in real-time with powerful collaboration tools.</p>
            </div>
            <div className="p-6 border rounded-lg shadow-sm">
              <h3 className="text-xl font-semibold mb-3">Data Analysis</h3>
              <p className="text-gray-600">Analyze complex datasets with our intuitive visualization tools.</p>
            </div>
            <div className="p-6 border rounded-lg shadow-sm">
              <h3 className="text-xl font-semibold mb-3">Secure Storage</h3>
              <p className="text-gray-600">Keep your research data safe with enterprise-grade security.</p>
            </div>
          </div>
        </div>
      </div>
      
      <HowItWorks />
      <Testimonials />
      <FAQ />
      <CTA />
    </main>
  );
}
