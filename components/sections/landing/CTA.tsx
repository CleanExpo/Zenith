'use client';

export function CTA() {
  return (
    <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Transform Your Research?</h2>
        <p className="text-xl max-w-2xl mx-auto mb-8">
          Join thousands of researchers who have accelerated their discoveries with our platform.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a href="/auth/signup" className="bg-white text-blue-600 px-6 py-3 rounded-md font-medium hover:bg-gray-100">
            Get Started for Free
          </a>
          <a href="/auth/login" className="bg-transparent border border-white text-white px-6 py-3 rounded-md font-medium hover:bg-blue-700">
            Sign In
          </a>
        </div>
      </div>
    </section>
  );
}
