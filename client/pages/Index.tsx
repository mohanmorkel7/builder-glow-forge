import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles,
  Leaf,
  Heart,
  Brain,
  Zap,
  ArrowRight,
  Star,
  Clock,
  Users,
  Award,
  CheckCircle,
  Calendar,
  Phone
} from "lucide-react";

const features = [
  {
    name: "Holistic Wellness",
    description: "Complete mind, body, and spirit healing through integrated wellness practices.",
    icon: Heart,
    color: "text-wellness-600",
  },
  {
    name: "Mindful Meditation",
    description: "Guided meditation sessions to center your thoughts and find inner peace.",
    icon: Brain,
    color: "text-ocean-600",
  },
  {
    name: "Natural Healing",
    description: "Harness the power of nature with organic treatments and therapies.",
    icon: Leaf,
    color: "text-sage-600",
  },
  {
    name: "Energy Restoration",
    description: "Revitalize your energy through specialized healing techniques and practices.",
    icon: Zap,
    color: "text-sand-600",
  },
];

const testimonials = [
  {
    name: "Sarah Chen",
    role: "Wellness Enthusiast",
    content: "Aura Oasis transformed my approach to self-care. The meditation sessions are life-changing.",
    rating: 5,
  },
  {
    name: "Michael Rodriguez",
    role: "Busy Professional",
    content: "Finally found a place where I can truly disconnect and recharge. Highly recommend!",
    rating: 5,
  },
  {
    name: "Emma Thompson",
    role: "Yoga Instructor",
    content: "The holistic approach here is incredible. Every session leaves me feeling renewed.",
    rating: 5,
  },
];

const stats = [
  { label: "Happy Clients", value: "2,500+" },
  { label: "Sessions Completed", value: "10,000+" },
  { label: "Years of Experience", value: "15+" },
  { label: "Wellness Programs", value: "50+" },
];

export default function Index() {
  const [hoveredFeature, setHoveredFeature] = useState<number | null>(null);

  return (
    <div className="relative">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-wellness-50 via-background to-ocean-50 pt-14 pb-20 sm:pb-24 lg:pb-32">
        <div className={"absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=\"60\" height=\"60\" viewBox=\"0 0 60 60\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Cg fill=\"none\" fill-rule=\"evenodd\"%3E%3Cg fill=\"%23a7f3d0\" fill-opacity=\"0.1\"%3E%3Ccircle cx=\"30\" cy=\"30\" r=\"4\"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-20"} />
        
        <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-4xl text-center">
            <div className="mb-8 flex justify-center">
              <Badge variant="secondary" className="px-4 py-2 text-sm bg-wellness-100 text-wellness-800 border-wellness-200">
                <Sparkles className="w-4 h-4 mr-2" />
                Transform Your Wellness Journey
              </Badge>
            </div>
            
            <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-6xl lg:text-7xl">
              Welcome to Your
              <span className="block bg-gradient-to-r from-primary via-wellness-600 to-ocean-600 bg-clip-text text-transparent">
                Wellness Sanctuary
              </span>
            </h1>
            
            <p className="mt-6 text-lg leading-8 text-muted-foreground sm:text-xl lg:text-2xl max-w-3xl mx-auto">
              Discover a harmonious blend of ancient wisdom and modern wellness practices. 
              Transform your mind, body, and spirit in our serene oasis of healing and renewal.
            </p>
            
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Button size="lg" className="bg-gradient-to-r from-primary to-wellness-600 hover:from-primary/90 hover:to-wellness-600/90 text-lg px-8 py-4">
                Book Your Session
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button variant="outline" size="lg" className="text-lg px-8 py-4">
                Explore Services
              </Button>
            </div>
          </div>
        </div>
        
        {/* Floating Elements */}
        <div className="absolute top-20 left-10 w-20 h-20 bg-wellness-200 rounded-full opacity-60 animate-pulse" />
        <div className="absolute top-40 right-20 w-16 h-16 bg-ocean-200 rounded-full opacity-40 animate-pulse delay-1000" />
        <div className="absolute bottom-20 left-1/4 w-12 h-12 bg-sage-200 rounded-full opacity-50 animate-pulse delay-500" />
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-muted/30">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {stats.map((stat, index) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl font-bold text-primary lg:text-4xl">
                  {stat.value}
                </div>
                <div className="mt-2 text-sm text-muted-foreground lg:text-base">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Your Journey to Wellness
            </h2>
            <p className="mt-6 text-lg leading-8 text-muted-foreground">
              Experience transformative wellness through our carefully curated programs designed to nurture every aspect of your being.
            </p>
          </div>
          
          <div className="mx-auto mt-16 max-w-5xl">
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
              {features.map((feature, index) => (
                <Card 
                  key={feature.name}
                  className="group relative overflow-hidden border-0 bg-gradient-to-br from-background to-muted/30 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                  onMouseEnter={() => setHoveredFeature(index)}
                  onMouseLeave={() => setHoveredFeature(null)}
                >
                  <CardHeader className="text-center pb-4">
                    <div className={`mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                      <feature.icon className={`h-8 w-8 ${feature.color}`} />
                    </div>
                    <CardTitle className="text-xl font-semibold mt-4">
                      {feature.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-center text-muted-foreground">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                  
                  {hoveredFeature === index && (
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-wellness-600/10 rounded-lg transition-opacity duration-300" />
                  )}
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-24 bg-gradient-to-br from-muted/30 to-background">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              What Our Community Says
            </h2>
            <p className="mt-6 text-lg leading-8 text-muted-foreground">
              Join thousands of people who have transformed their lives through our wellness programs.
            </p>
          </div>
          
          <div className="mx-auto mt-16 grid max-w-6xl grid-cols-1 gap-8 lg:grid-cols-3">
            {testimonials.map((testimonial, index) => (
              <Card key={testimonial.name} className="bg-background/50 backdrop-blur-sm border-muted">
                <CardHeader>
                  <div className="flex items-center space-x-1">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-sand-400 text-sand-400" />
                    ))}
                  </div>
                </CardHeader>
                <CardContent>
                  <blockquote className="text-muted-foreground mb-4">
                    "{testimonial.content}"
                  </blockquote>
                  <div>
                    <div className="font-semibold text-foreground">{testimonial.name}</div>
                    <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-24 sm:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary via-wellness-600 to-ocean-600" />
        <div className="absolute inset-0 bg-black/20" />
        
        <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Ready to Begin Your Wellness Journey?
            </h2>
            <p className="mt-6 text-lg leading-8 text-white/90">
              Take the first step towards a healthier, more balanced you. Book your personalized wellness consultation today.
            </p>
            
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button size="lg" variant="secondary" className="text-lg px-8 py-4 bg-white text-primary hover:bg-white/90">
                <Calendar className="mr-2 h-5 w-5" />
                Book Consultation
              </Button>
              <Button size="lg" variant="outline" className="text-lg px-8 py-4 border-white text-white hover:bg-white hover:text-primary">
                <Phone className="mr-2 h-5 w-5" />
                Call Us Now
              </Button>
            </div>
            
            <div className="mt-8 flex items-center justify-center space-x-8 text-white/80">
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 mr-2" />
                <span className="text-sm">Free Consultation</span>
              </div>
              <div className="flex items-center">
                <Clock className="h-5 w-5 mr-2" />
                <span className="text-sm">Flexible Scheduling</span>
              </div>
              <div className="flex items-center">
                <Award className="h-5 w-5 mr-2" />
                <span className="text-sm">Certified Practitioners</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
