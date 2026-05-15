import { z } from "zod";
import { Control } from "react-hook-form";
import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Receipt } from "lucide-react";

export const billingSchema = {
  billing_name: z.string().trim().min(2, "Required").max(200),
  billing_business_id: z.string().trim().max(50).optional().or(z.literal("")),
  billing_vat_id: z.string().trim().max(50).optional().or(z.literal("")),
  billing_email: z.string().trim().email("Valid email required").max(255),
  billing_address: z.string().trim().min(2, "Required").max(200),
  billing_postal_code: z.string().trim().min(2, "Required").max(20),
  billing_city: z.string().trim().min(2, "Required").max(100),
  billing_country: z.string().trim().min(2, "Required").max(100),
  billing_reference: z.string().trim().max(100).optional().or(z.literal("")),
  einvoice_address: z.string().trim().max(100).optional().or(z.literal("")),
  einvoice_operator: z.string().trim().max(100).optional().or(z.literal("")),
};

interface BillingFieldsProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  control: Control<any>;
  isCompany?: boolean;
  title?: string;
  description?: string;
}

const BillingFields = ({ control, isCompany = false, title = "Invoicing details", description }: BillingFieldsProps) => {
  return (
    <div className="space-y-5 rounded-xl border border-border bg-muted/30 p-5">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <Receipt className="h-4 w-4 text-primary" />
        </div>
        <div>
          <h3 className="font-display font-semibold">{title}</h3>
          {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
        </div>
      </div>

      <FormField control={control} name="billing_name" render={({ field }) => (
        <FormItem>
          <FormLabel>{isCompany ? "Company name (for invoice)" : "Billing name"}</FormLabel>
          <FormControl><Input placeholder={isCompany ? "Company Oy" : "Full name"} {...field} /></FormControl>
          <FormMessage />
        </FormItem>
      )} />

      {isCompany && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField control={control} name="billing_business_id" render={({ field }) => (
            <FormItem>
              <FormLabel>Business ID (Y-tunnus)</FormLabel>
              <FormControl><Input placeholder="1234567-8" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={control} name="billing_vat_id" render={({ field }) => (
            <FormItem>
              <FormLabel>VAT ID (optional)</FormLabel>
              <FormControl><Input placeholder="FI12345678" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
        </div>
      )}

      <FormField control={control} name="billing_email" render={({ field }) => (
        <FormItem>
          <FormLabel>Invoice email</FormLabel>
          <FormControl><Input type="email" placeholder="invoices@example.com" {...field} /></FormControl>
          <FormDescription>We'll send the invoice to this address.</FormDescription>
          <FormMessage />
        </FormItem>
      )} />

      <FormField control={control} name="billing_address" render={({ field }) => (
        <FormItem>
          <FormLabel>Street address</FormLabel>
          <FormControl><Input placeholder="Esimerkkikatu 1" {...field} /></FormControl>
          <FormMessage />
        </FormItem>
      )} />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <FormField control={control} name="billing_postal_code" render={({ field }) => (
          <FormItem>
            <FormLabel>Postal code</FormLabel>
            <FormControl><Input placeholder="00100" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={control} name="billing_city" render={({ field }) => (
          <FormItem>
            <FormLabel>City</FormLabel>
            <FormControl><Input placeholder="Helsinki" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={control} name="billing_country" render={({ field }) => (
          <FormItem>
            <FormLabel>Country</FormLabel>
            <FormControl><Input placeholder="Finland" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
      </div>

      <FormField control={control} name="billing_reference" render={({ field }) => (
        <FormItem>
          <FormLabel>Your reference (optional)</FormLabel>
          <FormControl><Input placeholder="PO number, cost center, etc." {...field} /></FormControl>
          <FormMessage />
        </FormItem>
      )} />

      {isCompany && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField control={control} name="einvoice_address" render={({ field }) => (
            <FormItem>
              <FormLabel>E-invoice address (optional)</FormLabel>
              <FormControl><Input placeholder="003712345678" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={control} name="einvoice_operator" render={({ field }) => (
            <FormItem>
              <FormLabel>E-invoice operator (optional)</FormLabel>
              <FormControl><Input placeholder="e.g. Maventa" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
        </div>
      )}
    </div>
  );
};

export default BillingFields;
