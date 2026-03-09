import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Mail, Send, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

const SUBJECTS = ["General", "Bug Report", "Partnership", "Advertising", "Other"];

export default function ContactPage() {
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate() {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = "Name is required";
    if (!form.email.trim()) errs.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = "Invalid email address";
    if (!form.subject) errs.subject = "Please select a subject";
    if (!form.message.trim()) errs.message = "Message is required";
    else if (form.message.trim().length < 10) errs.message = "Message must be at least 10 characters";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Failed to send message");
      }

      setSubmitted(true);
      toast({
        title: "Message sent!",
        description: "We'll get back to you as soon as possible.",
      });
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 md:px-6 py-10">
        <div className="flex items-center gap-3 mb-8">
          <Mail className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-display font-bold tracking-wider" data-testid="text-contact-title">Contact Us</h1>
        </div>

        <div className="grid md:grid-cols-5 gap-8">
          <div className="md:col-span-3">
            {submitted ? (
              <div className="glass-panel p-8 md:p-12 text-center space-y-4" data-testid="contact-success">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
                <h2 className="text-2xl font-display font-bold text-foreground">Thank You!</h2>
                <p className="text-muted-foreground">Your message has been sent successfully. We'll get back to you as soon as possible.</p>
                <Button
                  onClick={() => {
                    setSubmitted(false);
                    setForm({ name: "", email: "", subject: "", message: "" });
                  }}
                  variant="outline"
                  data-testid="button-send-another"
                >
                  Send Another Message
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="glass-panel p-6 md:p-8 space-y-5" data-testid="contact-form">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    placeholder="Your name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className={errors.name ? "border-red-500" : ""}
                    data-testid="input-name"
                  />
                  {errors.name && <p className="text-xs text-red-500" data-testid="error-name">{errors.name}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className={errors.email ? "border-red-500" : ""}
                    data-testid="input-email"
                  />
                  {errors.email && <p className="text-xs text-red-500" data-testid="error-email">{errors.email}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subject">Subject</Label>
                  <Select value={form.subject} onValueChange={(val) => setForm({ ...form, subject: val })}>
                    <SelectTrigger className={errors.subject ? "border-red-500" : ""} data-testid="select-subject">
                      <SelectValue placeholder="Select a subject" />
                    </SelectTrigger>
                    <SelectContent>
                      {SUBJECTS.map((s) => (
                        <SelectItem key={s} value={s} data-testid={`select-subject-${s.toLowerCase().replace(" ", "-")}`}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.subject && <p className="text-xs text-red-500" data-testid="error-subject">{errors.subject}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">Message</Label>
                  <Textarea
                    id="message"
                    placeholder="How can we help you?"
                    rows={6}
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    className={errors.message ? "border-red-500" : ""}
                    data-testid="input-message"
                  />
                  {errors.message && <p className="text-xs text-red-500" data-testid="error-message">{errors.message}</p>}
                </div>

                <Button type="submit" disabled={submitting} className="w-full" data-testid="button-submit-contact">
                  {submitting ? (
                    <span className="flex items-center gap-2">Sending...</span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Send className="w-4 h-4" />
                      Send Message
                    </span>
                  )}
                </Button>
              </form>
            )}
          </div>

          <div className="md:col-span-2 space-y-6">
            <div className="glass-panel p-6 space-y-4">
              <h3 className="text-lg font-display font-semibold text-foreground" data-testid="text-get-in-touch">Get in Touch</h3>
              <p className="text-sm text-muted-foreground">
                Have a question, feedback, or partnership inquiry? We'd love to hear from you. Fill out the form and we'll respond within 24-48 hours.
              </p>
            </div>

            <div className="glass-panel p-6 space-y-3">
              <h3 className="text-lg font-display font-semibold text-foreground">Topics We Can Help With</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>General questions about TokenAltcoin</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>Bug reports and technical issues</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>Partnership and collaboration opportunities</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>Advertising and sponsorship inquiries</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>Feature requests and suggestions</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
