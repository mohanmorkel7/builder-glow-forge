import { Link } from "react-router-dom";
import { Sparkles, Instagram, Twitter, Facebook, Youtube } from "lucide-react";

const navigation = {
  main: [
    { name: "Services", href: "/services" },
    { name: "About", href: "/about" },
    { name: "Meditation", href: "/meditation" },
    { name: "Contact", href: "/contact" },
  ],
  services: [
    { name: "Spa Treatments", href: "/services#spa" },
    { name: "Massage Therapy", href: "/services#massage" },
    { name: "Meditation Classes", href: "/meditation" },
    { name: "Wellness Coaching", href: "/services#coaching" },
  ],
  support: [
    { name: "FAQ", href: "/faq" },
    { name: "Support", href: "/support" },
    { name: "Privacy Policy", href: "/privacy" },
    { name: "Terms of Service", href: "/terms" },
  ],
  social: [
    {
      name: "Instagram",
      href: "#",
      icon: Instagram,
    },
    {
      name: "Twitter",
      href: "#",
      icon: Twitter,
    },
    {
      name: "Facebook",
      href: "#",
      icon: Facebook,
    },
    {
      name: "YouTube",
      href: "#",
      icon: Youtube,
    },
  ],
};

export function Footer() {
  return (
    <footer className="bg-muted/30" aria-labelledby="footer-heading">
      <h2 id="footer-heading" className="sr-only">
        Footer
      </h2>
      <div className="mx-auto max-w-7xl px-6 pb-8 pt-16 sm:pt-24 lg:px-8 lg:pt-32">
        <div className="xl:grid xl:grid-cols-3 xl:gap-8">
          <div className="space-y-8">
            <Link to="/" className="flex items-center space-x-2">
              <div className="relative">
                <Sparkles className="h-8 w-8 text-primary" />
                <div className="absolute -top-1 -right-1 h-3 w-3 bg-wellness-400 rounded-full opacity-75 animate-pulse" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-primary to-wellness-600 bg-clip-text text-transparent">
                Aura Oasis
              </span>
            </Link>
            <p className="text-sm leading-6 text-muted-foreground max-w-md">
              Transform your well-being with our holistic wellness sanctuary. Experience the perfect blend of 
              relaxation, rejuvenation, and mindful healing in our serene oasis.
            </p>
            <div className="flex space-x-6">
              {navigation.social.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  <span className="sr-only">{item.name}</span>
                  <item.icon className="h-6 w-6" aria-hidden="true" />
                </a>
              ))}
            </div>
          </div>
          <div className="mt-16 grid grid-cols-2 gap-8 xl:col-span-2 xl:mt-0">
            <div className="md:grid md:grid-cols-2 md:gap-8">
              <div>
                <h3 className="text-sm font-semibold leading-6 text-foreground">Navigate</h3>
                <ul role="list" className="mt-6 space-y-4">
                  {navigation.main.map((item) => (
                    <li key={item.name}>
                      <Link
                        to={item.href}
                        className="text-sm leading-6 text-muted-foreground hover:text-primary transition-colors"
                      >
                        {item.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="mt-10 md:mt-0">
                <h3 className="text-sm font-semibold leading-6 text-foreground">Services</h3>
                <ul role="list" className="mt-6 space-y-4">
                  {navigation.services.map((item) => (
                    <li key={item.name}>
                      <Link
                        to={item.href}
                        className="text-sm leading-6 text-muted-foreground hover:text-primary transition-colors"
                      >
                        {item.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="md:grid md:grid-cols-2 md:gap-8">
              <div>
                <h3 className="text-sm font-semibold leading-6 text-foreground">Support</h3>
                <ul role="list" className="mt-6 space-y-4">
                  {navigation.support.map((item) => (
                    <li key={item.name}>
                      <Link
                        to={item.href}
                        className="text-sm leading-6 text-muted-foreground hover:text-primary transition-colors"
                      >
                        {item.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="mt-10 md:mt-0">
                <h3 className="text-sm font-semibold leading-6 text-foreground">Newsletter</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Subscribe to our newsletter for wellness tips and exclusive offers.
                </p>
                <form className="mt-4 flex max-w-md gap-x-4">
                  <label htmlFor="email-address" className="sr-only">
                    Email address
                  </label>
                  <input
                    id="email-address"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    className="min-w-0 flex-auto rounded-md border border-input bg-background px-3.5 py-2 text-sm shadow-sm ring-1 ring-inset ring-border placeholder:text-muted-foreground focus:ring-2 focus:ring-inset focus:ring-primary"
                    placeholder="Enter your email"
                  />
                  <button
                    type="submit"
                    className="flex-none rounded-md bg-gradient-to-r from-primary to-wellness-600 px-3.5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm hover:from-primary/90 hover:to-wellness-600/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary transition-colors"
                  >
                    Subscribe
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-16 border-t border-border pt-8 sm:mt-20 lg:mt-24">
          <p className="text-xs leading-5 text-muted-foreground text-center">
            &copy; 2024 Aura Oasis. All rights reserved. | Designed for your wellness journey.
          </p>
        </div>
      </div>
    </footer>
  );
}
