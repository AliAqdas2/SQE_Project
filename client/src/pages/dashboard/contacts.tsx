import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Plus, Search, Filter, Mail, Phone, Building2, Tag, User, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useOrganizationLocale } from "@/hooks/use-organization-locale";
import type { Contact } from "@shared/schema";

const CONTACT_TYPES = [
  { value: "all", label: "All Types" },
  { value: "donor", label: "Donors" },
  { value: "volunteer", label: "Volunteers" },
  { value: "lead", label: "Leads" },
  { value: "sponsor", label: "Sponsors" },
  { value: "speaker", label: "Speakers" },
  { value: "partner", label: "Partners" },
  { value: "board_member", label: "Board Members" },
  { value: "staff", label: "Staff" },
  { value: "vendor", label: "Vendors" },
  { value: "beneficiary", label: "Beneficiaries" },
];

export default function ContactsPage() {
  const { formatCurrency } = useOrganizationLocale();
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [tagFilter, setTagFilter] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState("name");

  const { data: allTags } = useQuery<ContactTag[]>({
    queryKey: ["/api/contact-tags"],
  });

  const { data: contacts, isLoading } = useQuery<Contact[]>({
    queryKey: searchQuery ? [`/api/contacts?q=${searchQuery}`] : ["/api/contacts"],
    enabled: true,
  });

  const filteredContacts = contacts
    ?.filter((contact) => {
      if (typeFilter !== "all" && !contact.types.includes(typeFilter)) {
        return false;
      }
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "name":
          return `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`);
        case "recent":
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case "donations":
          return (b.donationCount || 0) - (a.donationCount || 0);
        default:
          return 0;
      }
    });

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Contacts</h1>
            <p className="text-sm md:text-base text-muted-foreground mt-1">
              Manage your donors, volunteers, partners, and other contacts
            </p>
          </div>
          <Link href="/dashboard/contacts/create">
            <Button data-testid="button-create-contact" className="w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              Add Contact
            </Button>
          </Link>
        </div>

        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search contacts by name, email, or company..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                  data-testid="input-search-contacts"
                />
                {searchQuery && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                    onClick={() => setSearchQuery("")}
                    data-testid="button-clear-search"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-full md:w-48" data-testid="select-filter-type">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CONTACT_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full md:w-48" data-testid="select-sort-by">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Sort by Name</SelectItem>
                  <SelectItem value="recent">Recently Added</SelectItem>
                  <SelectItem value="donations">Top Donors</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <Skeleton className="h-24 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredContacts && filteredContacts.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredContacts.map((contact) => (
              <Link key={contact.id} href={`/dashboard/contacts/${contact.id}`}>
                <Card className="hover-elevate active-elevate-2 cursor-pointer h-full" data-testid={`card-contact-${contact.id}`}>
                  <CardContent className="p-6 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-lg truncate" data-testid={`text-contact-name-${contact.id}`}>
                          {contact.firstName} {contact.lastName}
                        </h3>
                        {contact.company && (
                          <p className="text-sm text-muted-foreground truncate flex items-center gap-1 mt-1">
                            <Building2 className="h-3 w-3" />
                            {contact.company}
                          </p>
                        )}
                      </div>
                      {contact.donationCount && contact.donationCount > 0 && (
                        <Badge variant="secondary" className="shrink-0">
                          {contact.donationCount} {contact.donationCount === 1 ? "gift" : "gifts"}
                        </Badge>
                      )}
                    </div>

                    {contact.email && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground truncate">
                        <Mail className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">{contact.email}</span>
                      </div>
                    )}

                    {contact.phone && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Phone className="h-3.5 w-3.5 shrink-0" />
                        <span>{contact.phone}</span>
                      </div>
                    )}

                    {contact.types.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {contact.types.slice(0, 3).map((type) => (
                          <Badge key={type} variant="outline" className="text-xs">
                            {CONTACT_TYPES.find(t => t.value === type)?.label || type}
                          </Badge>
                        ))}
                        {contact.types.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{contact.types.length - 3}
                          </Badge>
                        )}
                      </div>
                    )}

                    {contact.totalDonated && parseFloat(contact.totalDonated.toString()) > 0 && (
                      <div className="pt-3 border-t">
                        <p className="text-sm text-muted-foreground">Total Donated</p>
                        <p className="text-lg font-semibold">{formatCurrency(parseFloat(contact.totalDonated.toString()))}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <User className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-semibold text-lg mb-2">No contacts found</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery || typeFilter !== "all"
                  ? "Try adjusting your filters"
                  : "Get started by adding your first contact"}
              </p>
              <Link href="/dashboard/contacts/create">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Contact
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
