import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { HelpCircle } from "lucide-react";

const faqs = [
  {
    question: "Is Plegit really free to start?",
    answer: "Yes! You can sign up and start using Plegit completely free. Our free tier includes essential features like campaign management, donor tracking, and QR code donations. As your organisation grows, you can add premium modules from our marketplace.",
  },
  {
    question: "What types of organisations can use Plegit?",
    answer: "Plegit is designed for faith-based organisations, charities, non-profits, mosques, churches, temples, and any community-focused group. Whether you're a small local charity or a large religious organisation, Plegit scales with your needs.",
  },
  {
    question: "How does the modular marketplace work?",
    answer: "Think of it like apps on your phone. You start with core features, then browse our marketplace to add modules like Event Ticketing, Livestream Giving, or Email Campaigns. Turn them on when you need them, turn them off when you don't. You only pay for what you use.",
  },
  {
    question: "Do I need technical knowledge to set up Plegit?",
    answer: "Not at all! Our AI assistant guides you through every step. Just describe what you want to do, and it helps you set up campaigns, create content, and configure your account. No coding or technical skills required.",
  },
  {
    question: "Can donors give via mobile?",
    answer: "Absolutely. Plegit is mobile-first. Donors can scan QR codes, tap donation links, or visit your page on any device. The giving process is optimised for phones and takes just seconds.",
  },
  {
    question: "How do payments work?",
    answer: "We use Stripe Connect, a secure payment processor trusted by millions of businesses. Donations go directly to your connected bank account. You can accept credit cards, debit cards, and digital wallets. Multi-currency support is included.",
  },
  {
    question: "Can I customise my organisation's page?",
    answer: "Yes! Upload your logo, choose your colours, and customise your public landing page. Your branding appears across donation pages, emails, and volunteer portals. White-labelling is available on higher tiers.",
  },
  {
    question: "What support is available?",
    answer: "Every user gets access to our AI assistant for instant help. Premium plans include email support and priority response times. We also offer comprehensive documentation and video tutorials.",
  },
  {
    question: "Is my data secure?",
    answer: "Security is our top priority. We use bank-level encryption, are PCI DSS compliant for payment processing, and follow GDPR guidelines for data protection. Your donor information is always safe.",
  },
  {
    question: "Can I migrate from another platform?",
    answer: "Yes! We offer data import tools and migration assistance. Our team can help you move your donor records, campaign history, and other data from your previous platform.",
  },
];

export function FAQSection() {
  return (
    <section id="faq" className="py-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-16 space-y-4">
          <Badge variant="outline" className="px-4 py-1.5">
            <HelpCircle className="w-3.5 h-3.5 mr-1.5" />
            Frequently Asked Questions
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-bold">
            Got Questions? We've Got Answers
          </h2>
          <p className="text-lg text-muted-foreground">
            Everything you need to know about getting started with Plegit
          </p>
        </div>

        <Accordion type="single" collapsible className="space-y-4">
          {faqs.map((faq, index) => (
            <AccordionItem 
              key={index} 
              value={`item-${index}`}
              className="border border-border/50 rounded-lg px-6 bg-card/50 data-[state=open]:bg-card"
              data-testid={`faq-item-${index}`}
            >
              <AccordionTrigger className="text-left hover:no-underline py-4">
                <span className="font-medium">{faq.question}</span>
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground pb-4">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
