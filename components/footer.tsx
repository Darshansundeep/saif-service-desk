import { CompanyLogo } from "./company-logo"

export function Footer() {
  return (
    <footer className="border-t bg-background">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-col md:flex-row items-center gap-4">
            <CompanyLogo size="sm" showText={false} />
            <div className="text-sm text-muted-foreground text-center md:text-left">
              © {new Date().getFullYear()} Service Ticket System. All rights reserved.
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Powered by</span>
            <span className="font-semibold text-foreground">Infinia Technologies</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
