import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, HelpCircle } from 'lucide-react';
import { PageContainer } from '@/components/global/PageContainer';
import { BackButton } from '@/components/global/BackButton';
import { Breadcrumb } from '@/components/global/Breadcrumb';
import { cn } from '@/lib/utils';

// Generic e-commerce content grounded in what this storefront actually
// does today (real payment methods, real free-shipping behavior, the real
// return-request flow just built) - no specific day-count return window is
// claimed here since none is actually enforced in the backend
// (orderReturn.service.js has no return-window guard), and no per-product
// certification claim beyond what the storefront already states elsewhere.
const FAQS = [
  {
    question: 'What payment methods do you accept?',
    answer: 'You can pay via Cash on Delivery (COD), or online through UPI, credit/debit cards, and net banking (powered by Razorpay).',
  },
  {
    question: 'Is shipping free?',
    answer: 'Yes, shipping is free on every order across India, with no minimum order value required.',
  },
  {
    question: 'How can I track my order?',
    answer: (
      <>
        If you're signed in, open <Link to="/orders" className="text-primary hover:underline">My Orders</Link> to see live status and
        tracking for every order. You can also track any order without signing in using our{' '}
        <Link to="/track-order" className="text-primary hover:underline">Track Order</Link> page - just enter your order number and
        the mobile number used at checkout.
      </>
    ),
  },
  {
    question: 'Can I return or exchange an item?',
    answer:
      'Yes. Once your order is marked Delivered, you can request a return directly from the order\'s detail page under My Orders. Our team will review your request and get in touch with the next steps.',
  },
  {
    question: 'How do I get a GST invoice for my order?',
    answer: 'A tax invoice is generated automatically for every order. Open the order under My Orders and use the "Download Invoice" button to get a PDF copy.',
  },
  {
    question: 'What is Amardeep Wallet and Loyalty Points?',
    answer:
      "Every account gets a real wallet and loyalty points balance, visible under My Rewards. You also get your own referral code to share with friends and family.",
  },
  {
    question: 'How do I create an account or reset my password?',
    answer: 'Tap the account icon in the header to sign in or create an account with your mobile number or email.',
  },
];

function FaqItem({ faq, isOpen, onToggle }) {
  return (
    <div className="overflow-hidden rounded-xl ring-1 ring-border">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-3 bg-card p-4 text-left text-sm font-medium text-heading hover:bg-muted/50"
      >
        {faq.question}
        <ChevronDown className={cn('size-4 shrink-0 text-muted-foreground transition-transform', isOpen && 'rotate-180')} />
      </button>
      {isOpen && <div className="bg-card px-4 pb-4 text-sm text-muted-foreground">{faq.answer}</div>}
    </div>
  );
}

export default function FaqsPage() {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <PageContainer top="md" bottom="md">
      <div className="sticky top-[60px] lg:top-[113px] z-40 -mx-4 mb-4 flex flex-wrap items-center gap-4 bg-background/95 px-4 py-2.5 backdrop-blur-md sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
          <BackButton />
        <Breadcrumb items={[{ label: 'Home', to: '/' }, { label: 'FAQs' }]} />
      </div>

      <div className="mx-auto max-w-2xl">
        <h1 className="mb-1 flex items-center gap-2.5 text-h3 font-display font-bold text-heading sm:text-h2">
          <HelpCircle className="size-6 text-primary" /> Frequently Asked Questions
        </h1>
        <p className="mb-6 text-sm text-muted-foreground">
          Can't find what you're looking for?{' '}
          <Link to="/contact" className="text-primary hover:underline">
            Contact us
          </Link>
          .
        </p>

        <div className="flex flex-col gap-2">
          {FAQS.map((faq, index) => (
            <FaqItem key={faq.question} faq={faq} isOpen={openIndex === index} onToggle={() => setOpenIndex(openIndex === index ? -1 : index)} />
          ))}
        </div>
      </div>
    </PageContainer>
  );
}
